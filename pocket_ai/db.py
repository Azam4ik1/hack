import sqlite3
from typing import Any, Dict, Iterable, List, Optional


def connect(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS candles (
            ts INTEGER NOT NULL,
            open REAL NOT NULL,
            high REAL NOT NULL,
            low REAL NOT NULL,
            close REAL NOT NULL,
            symbol TEXT NOT NULL,
            tf TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS signals (
            ts INTEGER NOT NULL,
            symbol TEXT NOT NULL,
            p_up REAL NOT NULL,
            decision TEXT NOT NULL,
            features_json TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS results (
            ts_signal INTEGER NOT NULL,
            ts_expiry INTEGER NOT NULL,
            symbol TEXT NOT NULL,
            direction TEXT NOT NULL,
            entry_price REAL NOT NULL,
            exit_price REAL NOT NULL,
            win INTEGER NOT NULL
        )
        """
    )
    conn.commit()


def insert_candle(conn: sqlite3.Connection, candle: Dict[str, Any]) -> None:
    conn.execute(
        """
        INSERT INTO candles (ts, open, high, low, close, symbol, tf)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            candle["ts"],
            candle["open"],
            candle["high"],
            candle["low"],
            candle["close"],
            candle["symbol"],
            candle["tf"],
        ),
    )
    conn.commit()


def fetch_recent_candles(
    conn: sqlite3.Connection, symbol: str, limit: int
) -> List[Dict[str, Any]]:
    cursor = conn.execute(
        """
        SELECT ts, open, high, low, close, symbol, tf
        FROM candles
        WHERE symbol = ? AND tf = '1m'
        ORDER BY ts DESC
        LIMIT ?
        """,
        (symbol, limit),
    )
    rows = cursor.fetchall()
    return [dict(row) for row in reversed(rows)]


def insert_signal(
    conn: sqlite3.Connection, ts: int, symbol: str, p_up: float, decision: str, features_json: str
) -> None:
    conn.execute(
        """
        INSERT INTO signals (ts, symbol, p_up, decision, features_json)
        VALUES (?, ?, ?, ?, ?)
        """,
        (ts, symbol, p_up, decision, features_json),
    )
    conn.commit()


def insert_result(conn: sqlite3.Connection, result: Dict[str, Any]) -> None:
    conn.execute(
        """
        INSERT INTO results (
            ts_signal, ts_expiry, symbol, direction, entry_price, exit_price, win
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            result["ts_signal"],
            result["ts_expiry"],
            result["symbol"],
            result["direction"],
            result["entry_price"],
            result["exit_price"],
            result["win"],
        ),
    )
    conn.commit()


def fetch_results(conn: sqlite3.Connection, symbol: Optional[str] = None) -> List[Dict[str, Any]]:
    if symbol:
        cursor = conn.execute(
            """
            SELECT ts_signal, ts_expiry, symbol, direction, entry_price, exit_price, win
            FROM results
            WHERE symbol = ?
            ORDER BY ts_signal ASC
            """,
            (symbol,),
        )
    else:
        cursor = conn.execute(
            """
            SELECT ts_signal, ts_expiry, symbol, direction, entry_price, exit_price, win
            FROM results
            ORDER BY ts_signal ASC
            """
        )
    return [dict(row) for row in cursor.fetchall()]


def fetch_signals(conn: sqlite3.Connection, symbol: Optional[str] = None) -> List[Dict[str, Any]]:
    if symbol:
        cursor = conn.execute(
            """
            SELECT ts, symbol, p_up, decision, features_json
            FROM signals
            WHERE symbol = ?
            ORDER BY ts ASC
            """,
            (symbol,),
        )
    else:
        cursor = conn.execute(
            """
            SELECT ts, symbol, p_up, decision, features_json
            FROM signals
            ORDER BY ts ASC
            """
        )
    return [dict(row) for row in cursor.fetchall()]
