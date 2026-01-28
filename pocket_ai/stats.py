from typing import Dict, List


def winrate(results: List[Dict[str, int]]) -> float:
    if not results:
        return 0.0
    wins = sum(1 for r in results if r["win"] == 1)
    return wins / len(results)


def consecutive_losses(results: List[Dict[str, int]]) -> int:
    count = 0
    for result in reversed(results):
        if result["win"] == 0:
            count += 1
        else:
            break
    return count


def daily_pnl(results: List[Dict[str, int]], payout: float) -> float:
    pnl = 0.0
    for result in results:
        pnl += payout if result["win"] == 1 else -1.0
    return pnl


def streaks(results: List[Dict[str, int]]) -> Dict[str, int]:
    max_win = 0
    max_loss = 0
    current_win = 0
    current_loss = 0
    for result in results:
        if result["win"] == 1:
            current_win += 1
            current_loss = 0
        else:
            current_loss += 1
            current_win = 0
        max_win = max(max_win, current_win)
        max_loss = max(max_loss, current_loss)
    return {"max_win_streak": max_win, "max_loss_streak": max_loss}


def expectancy(results: List[Dict[str, int]], payout: float) -> float:
    if not results:
        return 0.0
    wins = sum(1 for r in results if r["win"] == 1)
    losses = len(results) - wins
    return (wins * payout - losses * 1.0) / len(results)


def bucketed_winrates(signals: List[Dict[str, float]]) -> Dict[str, float]:
    buckets = {
        ">=0.70": [],
        "0.65-0.70": [],
    }
    for signal in signals:
        p_up = signal["p_up"]
        win = signal.get("win")
        if win is None:
            continue
        if p_up >= 0.70:
            buckets[">=0.70"].append(win)
        elif 0.65 <= p_up < 0.70:
            buckets["0.65-0.70"].append(win)
    return {
        name: (sum(values) / len(values) if values else 0.0)
        for name, values in buckets.items()
    }
