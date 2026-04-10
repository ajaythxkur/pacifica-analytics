"""
Lightweight Telegram bot for Pacifica whale alerts.

Talks directly to Telegram's HTTP API via httpx — no python-telegram-bot
dependency. Two background tasks:

  1. update_loop(): long-polls /getUpdates and dispatches commands.
  2. broadcaster_loop(): polls the top N whale wallets' fill history,
     dedupes via SQLite bot_state, and sends *attributed* alerts (with
     trader profile + Long/Short trade buttons) to subscribers.

Both loops are kicked off from FastAPI's lifespan. If TELEGRAM_BOT_TOKEN is
unset, the bot is disabled and the lifespan skips both tasks.
"""

import os
import asyncio
import html
import time
from collections import defaultdict, deque
from typing import Optional

import httpx

from app.db import (
    init_db,
    upsert_subscriber,
    deactivate_subscriber,
    update_subscriber_filter,
    get_subscriber,
    list_active_subscribers,
    count_active_subscribers,
    get_state,
    set_state,
)
from app.services.pacifica import pacifica_service

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_BOT_USERNAME = os.getenv("TELEGRAM_BOT_USERNAME", "")
APP_PUBLIC_URL = os.getenv("APP_PUBLIC_URL", "http://localhost:3000").rstrip("/")
PACIFICA_TRADE_URL = "https://app.pacifica.fi/trade"
PACIFICA_PORTFOLIO_URL = "https://app.pacifica.fi/portfolio"

TG_API = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"
# Default symbols a new subscriber gets when they first /subscribe.
# This is just the *default*; users can change it with /symbols.
DEFAULT_SUBSCRIBER_SYMBOLS = "BTC,ETH,SOL,HYPE,XRP,DOGE"
BROADCAST_INTERVAL = 60         # seconds — broadcaster cycle interval
UPDATE_POLL_TIMEOUT = 25        # long-poll seconds
DEFAULT_MIN_NOTIONAL = 10_000.0
WHALES_TO_WATCH = 50            # how many top wallets to poll for fills

# Throttling — keep the bot out of spam territory
SYMBOL_COOLDOWN = 5 * 60       # min seconds between alerts for the SAME symbol to the SAME user
HOURLY_USER_CAP = 12           # max alerts per user per rolling hour
INTER_SEND_DELAY = 0.10        # delay between Telegram API calls (rate-limit hygiene)
ACCOUNT_FETCH_DELAY = 0.05     # delay between account fill fetches

# In-memory throttle state. Persists for the lifetime of the process; rebuilt
# on restart. We keep this in memory rather than SQLite because the values are
# ephemeral and high-churn.
_last_sent_for_symbol: dict[tuple[int, str], float] = {}
_recent_sends: dict[int, deque] = defaultdict(deque)


def is_enabled() -> bool:
    return bool(TELEGRAM_BOT_TOKEN)


# ---------- Telegram HTTP helpers ----------------------------------------

class TelegramAPI:
    def __init__(self):
        self.client = httpx.AsyncClient(base_url=TG_API, timeout=35.0)

    async def send_message(
        self,
        chat_id: int,
        text: str,
        parse_mode: str = "HTML",
        reply_markup: Optional[dict] = None,
    ) -> bool:
        try:
            payload: dict = {
                "chat_id": chat_id,
                "text": text,
                "parse_mode": parse_mode,
                "disable_web_page_preview": True,
            }
            if reply_markup is not None:
                payload["reply_markup"] = reply_markup
            resp = await self.client.post("/sendMessage", json=payload)
            if resp.status_code != 200:
                print(
                    f"[telegram] send_message HTTP {resp.status_code}: {resp.text[:300]}"
                )
                return False
            body = resp.json()
            if not body.get("ok"):
                print(f"[telegram] send_message api error: {body.get('description')}")
                return False
            return True
        except Exception as e:
            print(f"[telegram] send_message exception: {e}")
            return False

    async def get_updates(self, offset: int) -> list[dict]:
        try:
            resp = await self.client.get(
                "/getUpdates",
                params={"offset": offset, "timeout": UPDATE_POLL_TIMEOUT},
                timeout=UPDATE_POLL_TIMEOUT + 5,
            )
            if resp.status_code != 200:
                return []
            data = resp.json()
            if not data.get("ok"):
                return []
            return data.get("result", [])
        except Exception as e:
            print(f"[telegram] get_updates error: {e}")
            await asyncio.sleep(2)
            return []

    async def close(self):
        await self.client.aclose()


tg: Optional[TelegramAPI] = None


# ---------- Command handling ---------------------------------------------

WELCOME = (
    "<b>🐋 Pacifica Whale Alerts</b>\n\n"
    "I'll DM you when top wallets open large positions on Pacifica mainnet — "
    "with their profile and one-click trade buttons.\n\n"
    "<b>Commands:</b>\n"
    "/subscribe – start receiving alerts\n"
    "/unsubscribe – pause alerts\n"
    "/setmin &lt;usd&gt; – minimum notional (default: $10,000)\n"
    "/symbols &lt;list&gt; – filter by symbol (any of 60+ Pacifica markets)\n"
    "/status – show your current settings\n"
    "/help – this message"
)


def fmt_status(sub: dict) -> str:
    state = "✅ Active" if sub.get("active") else "⏸ Paused"
    return (
        f"<b>Your alert settings</b>\n\n"
        f"Status: {state}\n"
        f"Min notional: <b>${int(sub['min_notional']):,}</b>\n"
        f"Symbols: <code>{sub['symbols']}</code>"
    )


async def handle_command(message: dict):
    if tg is None:
        return
    chat = message.get("chat") or {}
    chat_id = chat.get("id")
    text = (message.get("text") or "").strip()
    user = message.get("from") or {}
    username = user.get("username") or user.get("first_name") or ""

    if not chat_id or not text:
        return

    cmd, _, args = text.partition(" ")
    cmd = cmd.lower().split("@")[0]

    if cmd in ("/start", "/help"):
        await tg.send_message(chat_id, WELCOME)

    elif cmd == "/subscribe":
        await upsert_subscriber(chat_id, username)
        sub = await get_subscriber(chat_id)
        await tg.send_message(
            chat_id,
            "✅ Subscribed! You'll get alerts as whales open large positions.\n\n"
            + fmt_status(sub or {}),
        )

    elif cmd == "/unsubscribe":
        existed = await deactivate_subscriber(chat_id)
        if existed:
            await tg.send_message(chat_id, "⏸ Paused. Use /subscribe to resume.")
        else:
            await tg.send_message(chat_id, "You weren't subscribed. Use /subscribe to start.")

    elif cmd == "/setmin":
        try:
            value = float(args.replace(",", "").replace("$", "").strip())
            if value < 100:
                raise ValueError
        except ValueError:
            await tg.send_message(
                chat_id,
                "Usage: <code>/setmin 50000</code>\nMinimum value is $100.",
            )
            return
        sub = await get_subscriber(chat_id)
        if not sub:
            await upsert_subscriber(chat_id, username)
        await update_subscriber_filter(chat_id, min_notional=value)
        await tg.send_message(
            chat_id, f"✅ Minimum notional set to <b>${int(value):,}</b>"
        )

    elif cmd == "/symbols":
        raw = args.upper().replace(" ", "")
        live_symbols = await pacifica_service.get_market_symbols()
        live_set = set(live_symbols)
        if not raw:
            preview = ", ".join(live_symbols[:20])
            await tg.send_message(
                chat_id,
                "Usage: <code>/symbols BTC,ETH,SOL</code>\n\n"
                f"<b>{len(live_symbols)} markets available</b>:\n"
                f"<code>{preview}{'…' if len(live_symbols) > 20 else ''}</code>",
            )
            return
        wanted = [s for s in raw.split(",") if s in live_set]
        if not wanted:
            await tg.send_message(
                chat_id,
                f"No valid symbols. {len(live_symbols)} markets available — try"
                f" <code>/symbols BTC,ETH,SOL,HYPE</code>",
            )
            return
        sub = await get_subscriber(chat_id)
        if not sub:
            await upsert_subscriber(chat_id, username)
        await update_subscriber_filter(chat_id, symbols=",".join(wanted))
        await tg.send_message(chat_id, f"✅ Now watching: <code>{','.join(wanted)}</code>")

    elif cmd == "/status":
        sub = await get_subscriber(chat_id)
        if not sub:
            await tg.send_message(chat_id, "You're not subscribed yet. Use /subscribe to start.")
        else:
            await tg.send_message(chat_id, fmt_status(sub))

    else:
        await tg.send_message(
            chat_id,
            "Unknown command. Try /help",
        )


# ---------- Update polling loop ------------------------------------------

async def update_loop():
    if tg is None:
        return
    last_id_str = await get_state("last_update_id")
    offset = int(last_id_str) + 1 if last_id_str else 0

    while True:
        try:
            updates = await tg.get_updates(offset)
            for upd in updates:
                upd_id = upd.get("update_id", 0)
                if upd_id >= offset:
                    offset = upd_id + 1
                msg = upd.get("message")
                if msg:
                    await handle_command(msg)
            if updates:
                await set_state("last_update_id", str(offset - 1))
        except asyncio.CancelledError:
            return
        except Exception as e:
            print(f"[telegram] update_loop error: {e}")
            await asyncio.sleep(3)


# ---------- Broadcaster loop ---------------------------------------------

def _short_addr(addr: str, chars: int = 4) -> str:
    return f"{addr[:chars]}…{addr[-chars:]}"


def _is_open_long(side: str) -> bool:
    return "open_long" in side or side == "bid" or side == "buy"


def _is_open_short(side: str) -> bool:
    return "open_short" in side or side == "ask" or side == "sell"


def _action_label(side: str) -> tuple[str, str]:
    """Return (emoji_label, plain_action_text) for an alert headline."""
    if _is_open_long(side):
        return ("🟢 OPENED LONG", "Opened long")
    if _is_open_short(side):
        return ("🔴 OPENED SHORT", "Opened short")
    if "close_long" in side:
        return ("🟠 CLOSED LONG", "Closed long")
    if "close_short" in side:
        return ("🟢 CLOSED SHORT", "Closed short")
    return ("⚪️ TRADE", side.replace("_", " ").title())


def fmt_attributed_alert(
    address: str,
    symbol: str,
    side: str,
    notional: float,
    price: float,
    size: float,
    is_liquidation: bool = False,
) -> str:
    label, _ = _action_label(side)
    head = "💀 <b>LIQUIDATION</b>" if is_liquidation else "🐋 <b>WHALE ALERT</b>"
    return (
        f"{head}\n\n"
        f"<code>{_short_addr(address, 6)}</code> just <b>{label.split(' ', 1)[1].lower() if ' ' in label else label.lower()}</b>\n"
        f"<b>{symbol}</b> · <b>${notional:,.0f}</b>\n\n"
        f"Size: <code>{size:g}</code>\n"
        f"Price: <code>${price:,.4f}</code>"
    )


def _is_https_public(url: str) -> bool:
    """Telegram inline_keyboard URLs must be https (or tg://). Localhost is rejected."""
    return url.startswith("https://") or url.startswith("tg://")


def build_alert_keyboard(address: str, symbol: str) -> dict:
    """
    Inline keyboard with profile + Pacifica trade buttons.

    Telegram refuses inline_keyboard buttons with non-https URLs (e.g. localhost),
    rejecting the entire message. So we skip the profile button when APP_PUBLIC_URL
    isn't a public https origin — Pacifica's URLs are always https so those stay.
    """
    rows: list[list[dict]] = []

    profile_url = f"{APP_PUBLIC_URL}/trader/{address}"
    if _is_https_public(profile_url):
        rows.append([
            {"text": "👤 View Trader Profile", "url": profile_url},
        ])

    rows.append([
        {"text": f"📈 Long {symbol}", "url": f"{PACIFICA_TRADE_URL}/{symbol}"},
        {"text": f"📉 Short {symbol}", "url": f"{PACIFICA_TRADE_URL}/{symbol}"},
    ])
    rows.append([
        {"text": "🔗 Open in Pacifica", "url": f"{PACIFICA_PORTFOLIO_URL}/{address}"},
    ])

    return {"inline_keyboard": rows}


def _can_send(chat_id: int, symbol: str) -> bool:
    """Apply per-symbol cooldown + hourly cap before sending."""
    now = time.time()

    # Per-symbol cooldown
    last = _last_sent_for_symbol.get((chat_id, symbol), 0)
    if now - last < SYMBOL_COOLDOWN:
        return False

    # Hourly cap (rolling 1h window)
    bucket = _recent_sends[chat_id]
    cutoff = now - 3600
    while bucket and bucket[0] < cutoff:
        bucket.popleft()
    if len(bucket) >= HOURLY_USER_CAP:
        return False

    return True


def _record_send(chat_id: int, symbol: str):
    now = time.time()
    _last_sent_for_symbol[(chat_id, symbol)] = now
    _recent_sends[chat_id].append(now)


async def broadcaster_loop():
    """
    Per-account "attributed alert" broadcaster.

    Each cycle:
      1. Get the top N whale wallets (by 7d volume) from the cached leaderboard.
      2. For each wallet, fetch their fill history. Compare against the last
         seen `history_id` for that wallet (stored in SQLite bot_state).
      3. Among NEW fills, pick the SINGLE BIGGEST per wallet per cycle.
      4. For each subscriber whose filters match AND who isn't throttled,
         send an attributed alert with profile link + Long/Short trade buttons.

    Why per-account instead of `/trades?symbol=X`?
      The market trades feed doesn't include trader addresses. Polling each
      whale's fill history is the only way to know WHO is making the trade
      so we can link to their profile.
    """
    if tg is None:
        return

    while True:
        try:
            subs = await list_active_subscribers()
            if not subs:
                await asyncio.sleep(BROADCAST_INTERVAL)
                continue

            whale_addresses = await pacifica_service.get_top_whale_addresses(
                n=WHALES_TO_WATCH, by="volume_7d"
            )
            if not whale_addresses:
                await asyncio.sleep(BROADCAST_INTERVAL)
                continue

            for address in whale_addresses:
                fills = await pacifica_service.get_account_fills(address)
                if not fills:
                    await asyncio.sleep(ACCOUNT_FETCH_DELAY)
                    continue

                state_key = f"last_fill_id_{address}"
                last_id_str = await get_state(state_key)
                last_id = int(last_id_str) if last_id_str else None

                # First-time visit for a wallet: don't replay history.
                # Just record the latest history_id and move on.
                if last_id is None:
                    newest = max(int(f.get("history_id", 0)) for f in fills)
                    await set_state(state_key, str(newest))
                    await asyncio.sleep(ACCOUNT_FETCH_DELAY)
                    continue

                new_fills = [
                    f for f in fills if int(f.get("history_id", 0)) > last_id
                ]
                if not new_fills:
                    await asyncio.sleep(ACCOUNT_FETCH_DELAY)
                    continue

                # Advance high-water mark regardless of whether anything qualifies
                newest_id = max(int(f.get("history_id", 0)) for f in new_fills)
                await set_state(state_key, str(newest_id))

                # Aggregate fills by order_id. A single whale order gets split
                # into many small partial fills (whales typically dollar-cost
                # average into positions). One logical "trade event" = one order.
                orders: dict[int, dict] = {}
                for f in new_fills:
                    symbol = f.get("symbol", "")
                    if not symbol:
                        continue
                    try:
                        size = float(f.get("amount", 0))
                        price = float(f.get("price", 0))
                    except (ValueError, TypeError):
                        continue
                    notional = size * price
                    order_id = f.get("order_id") or f.get("history_id") or id(f)
                    side = f.get("side", "")
                    is_liq = "liquid" in (f.get("cause") or "").lower()

                    agg = orders.get(order_id)
                    if agg is None:
                        orders[order_id] = {
                            "symbol": symbol,
                            "side": side,
                            "size": size,
                            "notional": notional,
                            "weighted_price_num": price * size,
                            "weighted_price_den": size,
                            "is_liquidation": is_liq,
                        }
                    else:
                        agg["size"] += size
                        agg["notional"] += notional
                        agg["weighted_price_num"] += price * size
                        agg["weighted_price_den"] += size
                        agg["is_liquidation"] = agg["is_liquidation"] or is_liq

                if not orders:
                    await asyncio.sleep(ACCOUNT_FETCH_DELAY)
                    continue

                # Single biggest aggregated order from this whale this cycle
                biggest_order = max(orders.values(), key=lambda x: x["notional"])
                biggest = {
                    "symbol": biggest_order["symbol"],
                    "side": biggest_order["side"],
                    "size": biggest_order["size"],
                    "price": biggest_order["weighted_price_num"]
                    / biggest_order["weighted_price_den"],
                    "notional": biggest_order["notional"],
                    "is_liquidation": biggest_order["is_liquidation"],
                }
                symbol = biggest["symbol"]

                for sub in subs:
                    sub_symbols = (sub.get("symbols") or "").split(",")
                    chat_id = int(sub["chat_id"])
                    if symbol not in sub_symbols:
                        continue
                    threshold = float(sub.get("min_notional") or DEFAULT_MIN_NOTIONAL)
                    if biggest["notional"] < threshold:
                        continue
                    if not _can_send(chat_id, symbol):
                        continue

                    print(
                        f"[telegram] → {chat_id}: {symbol} {biggest['side']} "
                        f"${biggest['notional']:,.0f} from {address[:6]}…"
                    )
                    text = fmt_attributed_alert(
                        address=address,
                        symbol=symbol,
                        side=biggest["side"],
                        notional=biggest["notional"],
                        price=biggest["price"],
                        size=biggest["size"],
                        is_liquidation=biggest["is_liquidation"],
                    )
                    keyboard = build_alert_keyboard(address, symbol)
                    sent = await tg.send_message(
                        chat_id, text, reply_markup=keyboard
                    )
                    if sent:
                        _record_send(chat_id, symbol)
                    await asyncio.sleep(INTER_SEND_DELAY)

                await asyncio.sleep(ACCOUNT_FETCH_DELAY)

        except asyncio.CancelledError:
            return
        except Exception as e:
            print(f"[telegram] broadcaster_loop error: {e}")

        await asyncio.sleep(BROADCAST_INTERVAL)


# ---------- Lifecycle ----------------------------------------------------

_tasks: list[asyncio.Task] = []


async def start():
    """Initialise DB + start bot tasks. Called from FastAPI lifespan."""
    global tg
    await init_db()  # always create tables — even if bot disabled,
                     # other parts of the app might use the DB later

    if not is_enabled():
        print("[telegram] WARNING: TELEGRAM_BOT_TOKEN not set — bot disabled.")
        return

    tg = TelegramAPI()
    _tasks.append(asyncio.create_task(update_loop()))
    _tasks.append(asyncio.create_task(broadcaster_loop()))
    print(f"[telegram] Bot started. Subscribers: {await count_active_subscribers()}")


async def stop():
    for t in _tasks:
        t.cancel()
    _tasks.clear()
    if tg is not None:
        await tg.close()


# Suppress unused-import warning for `html`
_ = html
