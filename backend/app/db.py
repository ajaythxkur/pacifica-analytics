"""
SQLite-backed persistence for Telegram subscribers and bot state.

We use aiosqlite (single file, no server) because:
  • The only persistent data we need is a list of subscribers + filters.
  • Volume is small (one row per Telegram user).
  • Render/Railway/Fly all support persistent disks; SQLite Just Works.

If you need to scale beyond a few thousand subscribers, swap this module
for Postgres (asyncpg) — the rest of the code only touches the helpers
defined here.
"""

import os
import time
import aiosqlite
from typing import Optional

DB_PATH = os.getenv("SUBSCRIBERS_DB_PATH", "subscribers.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS subscribers (
    chat_id       INTEGER PRIMARY KEY,
    username      TEXT,
    min_notional  REAL    NOT NULL DEFAULT 10000,
    symbols       TEXT    NOT NULL DEFAULT 'BTC,ETH,SOL,HYPE,XRP,DOGE',
    active        INTEGER NOT NULL DEFAULT 1,
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS bot_state (
    key   TEXT PRIMARY KEY,
    value TEXT
);
"""


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(SCHEMA)
        await db.commit()


# ---------- Subscribers --------------------------------------------------

async def upsert_subscriber(chat_id: int, username: Optional[str]) -> dict:
    now = int(time.time())
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.execute(
            """
            INSERT INTO subscribers (chat_id, username, created_at, updated_at, active)
            VALUES (?, ?, ?, ?, 1)
            ON CONFLICT(chat_id) DO UPDATE SET
                username   = excluded.username,
                active     = 1,
                updated_at = excluded.updated_at
            """,
            (chat_id, username, now, now),
        )
        await db.commit()
        cur = await db.execute("SELECT * FROM subscribers WHERE chat_id = ?", (chat_id,))
        row = await cur.fetchone()
        return dict(row) if row else {}


async def deactivate_subscriber(chat_id: int) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute(
            "UPDATE subscribers SET active = 0, updated_at = ? WHERE chat_id = ?",
            (int(time.time()), chat_id),
        )
        await db.commit()
        return cur.rowcount > 0


async def update_subscriber_filter(
    chat_id: int,
    min_notional: Optional[float] = None,
    symbols: Optional[str] = None,
) -> bool:
    sets = []
    args: list = []
    if min_notional is not None:
        sets.append("min_notional = ?")
        args.append(min_notional)
    if symbols is not None:
        sets.append("symbols = ?")
        args.append(symbols)
    if not sets:
        return False
    sets.append("updated_at = ?")
    args.append(int(time.time()))
    args.append(chat_id)
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute(
            f"UPDATE subscribers SET {', '.join(sets)} WHERE chat_id = ?",
            args,
        )
        await db.commit()
        return cur.rowcount > 0


async def get_subscriber(chat_id: int) -> Optional[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute("SELECT * FROM subscribers WHERE chat_id = ?", (chat_id,))
        row = await cur.fetchone()
        return dict(row) if row else None


async def list_active_subscribers() -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute("SELECT * FROM subscribers WHERE active = 1")
        rows = await cur.fetchall()
        return [dict(r) for r in rows]


async def count_active_subscribers() -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute("SELECT COUNT(*) FROM subscribers WHERE active = 1")
        row = await cur.fetchone()
        return int(row[0]) if row else 0


# ---------- Bot state (KV store) -----------------------------------------

async def get_state(key: str) -> Optional[str]:
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute("SELECT value FROM bot_state WHERE key = ?", (key,))
        row = await cur.fetchone()
        return row[0] if row else None


async def set_state(key: str, value: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            INSERT INTO bot_state (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
            """,
            (key, value),
        )
        await db.commit()
