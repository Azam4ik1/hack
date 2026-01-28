import json
from datetime import datetime, timezone
from typing import Dict, List, Tuple

import yaml

from pocket_ai import db, decision, features, model, stats, ui_cli


def load_config(path: str) -> Dict:
    with open(path, "r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def build_dataset(candles: List[Dict[str, float]]) -> Tuple[List[Dict[str, float]], List[int]]:
    feature_rows = []
    labels = []
    for idx in range(2, len(candles) - 1):
        window = candles[: idx + 1]
        feats = features.compute_features(window)
        if not feats:
            continue
        label = int(candles[idx + 1]["close"] > candles[idx]["close"])
        feature_rows.append(feats)
        labels.append(label)
    return feature_rows, labels


def run_cycle(config: Dict, conn) -> None:
    symbol = config["symbol"]
    lookback = config["features"]["lookback"]
    thresholds = config["thresholds"]
    risk = config["risk"]
    payout = config["payout"]

    candle = ui_cli.prompt_candle(symbol)
    db.insert_candle(conn, candle)

    candles = db.fetch_recent_candles(conn, symbol, lookback)
    feats = features.compute_features(candles)

    p_up = 0.5
    bundle = None
    if len(candles) >= 20:
        feature_rows, labels = build_dataset(candles)
        if feature_rows and labels:
            bundle = model.train_logistic(
                feature_rows,
                labels,
                steps=config["model"]["lr_steps"],
                lr=config["model"]["lr_rate"],
            )
            p_up = model.predict_with_calibration(bundle, feats)

    now = datetime.now(tz=timezone.utc)
    within_window = decision.within_entry_window(now, config["entry_window_seconds"])
    trade_decision = decision.decide(p_up, thresholds["up"], thresholds["down"])
    if not within_window:
        trade_decision = decision.Decision(action="NO_TRADE", reason="late_entry")

    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc).timestamp()
    results_today = [
        result for result in db.fetch_results(conn, symbol) if result["ts_signal"] >= today_start
    ]
    signals_today = [
        signal for signal in db.fetch_signals(conn, symbol) if signal["ts"] >= today_start
    ]

    loss_limit_units = risk["max_daily_loss_pct"] / risk["stake_pct"]
    daily_pnl = stats.daily_pnl(results_today, payout)
    if daily_pnl <= -loss_limit_units:
        trade_decision = decision.Decision(action="NO_TRADE", reason="daily_loss_limit")

    recent_losses = stats.consecutive_losses(results_today)
    if recent_losses >= risk["pause_after_losses"] and results_today:
        last_ts = results_today[-1]["ts_expiry"]
        cooldown = risk["pause_minutes"] * 60
        if candle["ts"] - last_ts < cooldown:
            trade_decision = decision.Decision(action="NO_TRADE", reason="cooldown_after_losses")

    trades_today = sum(1 for signal in signals_today if signal["decision"] != "NO_TRADE")
    if trades_today >= risk["max_trades_per_day"]:
        trade_decision = decision.Decision(action="NO_TRADE", reason="max_trades_reached")

    db.insert_signal(
        conn,
        ts=candle["ts"],
        symbol=symbol,
        p_up=float(p_up),
        decision=trade_decision.action,
        features_json=json.dumps(feats),
    )

    print(f"p_up={p_up:.3f} decision={trade_decision.action} reason={trade_decision.reason}")

    if trade_decision.action != "NO_TRADE":
        record_now = input("Record result now? (y/n): ").strip().lower() == "y"
        if record_now:
            result_data = ui_cli.prompt_result(candle["close"])
            result = {
                "ts_signal": candle["ts"],
                "ts_expiry": result_data["ts_expiry"],
                "symbol": symbol,
                "direction": trade_decision.action,
                "entry_price": candle["close"],
                "exit_price": result_data["exit_price"],
                "win": result_data["win"],
            }
            db.insert_result(conn, result)

            results = db.fetch_results(conn, symbol)
            overall_winrate = stats.winrate(results)
            streak_info = stats.streaks(results)
            expectancy_val = stats.expectancy(results, payout)
            print(
                "Winrate={:.2%} Max win streak={} Max loss streak={} Expectancy={:.3f}".format(
                    overall_winrate,
                    streak_info["max_win_streak"],
                    streak_info["max_loss_streak"],
                    expectancy_val,
                )
            )
            signal_rows = db.fetch_signals(conn, symbol)
            signal_by_ts = {row["ts"]: row for row in signal_rows}
            scored = []
            for row in results:
                signal = signal_by_ts.get(row["ts_signal"])
                if signal:
                    scored.append({"p_up": signal["p_up"], "win": row["win"]})
            bucketed = stats.bucketed_winrates(scored)
            if bucketed:
                print("Winrate buckets:", bucketed)


def main() -> None:
    config = load_config("pocket_ai/config.yaml")
    conn = db.connect("pocket_ai/trading.db")
    db.init_db(conn)

    print("Pocket AI assistant started. Press Ctrl+C to exit.")
    while True:
        try:
            run_cycle(config, conn)
        except KeyboardInterrupt:
            print("Exiting.")
            break


if __name__ == "__main__":
    main()
