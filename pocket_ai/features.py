from typing import Dict, List


def _mean(values: List[float]) -> float:
    if not values:
        return 0.0
    return sum(values) / len(values)


def _std(values: List[float]) -> float:
    if not values:
        return 0.0
    avg = _mean(values)
    variance = sum((v - avg) ** 2 for v in values) / len(values)
    return variance ** 0.5


def _rsi(values: List[float], period: int) -> float:
    if len(values) <= period:
        return 0.0
    gains = []
    losses = []
    for i in range(-period, 0):
        change = values[i] - values[i - 1]
        if change >= 0:
            gains.append(change)
            losses.append(0.0)
        else:
            gains.append(0.0)
            losses.append(abs(change))
    avg_gain = _mean(gains)
    avg_loss = _mean(losses)
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def _atr(highs: List[float], lows: List[float], closes: List[float], period: int) -> float:
    if len(highs) <= period:
        return 0.0
    trs = []
    for i in range(-period, 0):
        high = highs[i]
        low = lows[i]
        prev_close = closes[i - 1]
        tr = max(high - low, abs(high - prev_close), abs(low - prev_close))
        trs.append(tr)
    return _mean(trs)


def _engulfing(open_prev: float, close_prev: float, open_curr: float, close_curr: float) -> int:
    prev_low = min(open_prev, close_prev)
    prev_high = max(open_prev, close_prev)
    curr_low = min(open_curr, close_curr)
    curr_high = max(open_curr, close_curr)
    return int(curr_low <= prev_low and curr_high >= prev_high)


def _pinbar(body: float, upper_wick: float, lower_wick: float) -> int:
    wick_threshold = body * 2.0
    return int(upper_wick >= wick_threshold or lower_wick >= wick_threshold)


def compute_features(candles: List[Dict[str, float]]) -> Dict[str, float]:
    if len(candles) < 3:
        return {}

    opens = [c["open"] for c in candles]
    highs = [c["high"] for c in candles]
    lows = [c["low"] for c in candles]
    closes = [c["close"] for c in candles]

    prev_close = closes[-2]
    last_close = closes[-1]
    last_open = opens[-1]
    last_high = highs[-1]
    last_low = lows[-1]

    return_1 = (last_close / prev_close) - 1 if prev_close else 0.0
    body = abs(last_close - last_open)
    candle_range = last_high - last_low
    body_ratio = body / candle_range if candle_range else 0.0
    upper_wick = last_high - max(last_close, last_open)
    lower_wick = min(last_close, last_open) - last_low

    engulfing = _engulfing(opens[-2], closes[-2], last_open, last_close)
    pinbar = _pinbar(body, upper_wick, lower_wick)

    returns = [
        (closes[i] / closes[i - 1]) - 1 if closes[i - 1] else 0.0
        for i in range(1, len(closes))
    ]
    std_20 = _std(returns[-20:])
    atr_14 = _atr(highs, lows, closes, 14)

    momentum_3 = last_close - closes[-4] if len(closes) >= 4 else 0.0
    momentum_5 = last_close - closes[-6] if len(closes) >= 6 else 0.0

    rsi_5 = _rsi(closes, 5)
    rsi_7 = _rsi(closes, 7)

    return {
        "return_1": return_1,
        "body": body,
        "range": candle_range,
        "body_ratio": body_ratio,
        "upper_wick": upper_wick,
        "lower_wick": lower_wick,
        "engulfing": engulfing,
        "pinbar": pinbar,
        "atr_14": atr_14,
        "std_20": std_20,
        "momentum_3": momentum_3,
        "momentum_5": momentum_5,
        "rsi_5": rsi_5,
        "rsi_7": rsi_7,
    }
