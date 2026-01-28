from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class Decision:
    action: str
    reason: str


def decide(p_up: float, up_threshold: float, down_threshold: float) -> Decision:
    if p_up >= up_threshold:
        return Decision(action="TRADE_UP", reason="probability_above_threshold")
    if p_up <= down_threshold:
        return Decision(action="TRADE_DOWN", reason="probability_below_threshold")
    return Decision(action="NO_TRADE", reason="no_edge")


def within_entry_window(now: datetime, max_seconds: int) -> bool:
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    return now.second <= max_seconds
