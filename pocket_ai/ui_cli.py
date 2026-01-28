from datetime import datetime, timezone
from typing import Dict


def prompt_candle(symbol: str) -> Dict[str, float]:
    print("Enter candle data for", symbol)
    ts_input = input("Timestamp (unix, leave empty for now): ").strip()
    ts = int(ts_input) if ts_input else int(datetime.now(tz=timezone.utc).timestamp())
    open_price = float(input("Open: ").strip())
    high_price = float(input("High: ").strip())
    low_price = float(input("Low: ").strip())
    close_price = float(input("Close: ").strip())
    return {
        "ts": ts,
        "open": open_price,
        "high": high_price,
        "low": low_price,
        "close": close_price,
        "symbol": symbol,
        "tf": "1m",
    }


def prompt_result(entry_price: float) -> Dict[str, float]:
    print("Enter expiry result")
    ts_expiry_input = input("Expiry timestamp (unix, leave empty for now): ").strip()
    ts_expiry = int(ts_expiry_input) if ts_expiry_input else int(datetime.now(tz=timezone.utc).timestamp())
    exit_price = float(input("Exit price: ").strip())
    win = int(exit_price > entry_price)
    return {"ts_expiry": ts_expiry, "exit_price": exit_price, "win": win}
