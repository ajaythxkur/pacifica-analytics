import os
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from app.services.pacifica import pacifica_service
from app.services.elfa import elfa_service
from app.services import telegram_bot
from app.db import count_active_subscribers


def _parse_origins(raw: str) -> list[str]:
    """Comma-separated origin list. '*' means allow any."""
    items = [o.strip() for o in raw.split(",") if o.strip()]
    return items or ["*"]


ALLOWED_ORIGINS = _parse_origins(
    os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    )
)
ALLOW_CREDENTIALS = "*" not in ALLOWED_ORIGINS


def classify_tier(volume_all_time: float) -> str:
    if volume_all_time >= 100_000_000:
        return "leviathan"
    elif volume_all_time >= 50_000_000:
        return "whale"
    elif volume_all_time >= 10_000_000:
        return "shark"
    elif volume_all_time >= 1_000_000:
        return "dolphin"
    return "fish"


def format_trader(raw: dict, rank: int = 0) -> dict:
    """Transform Pacifica leaderboard entry to our frontend format."""
    vol_all = float(raw.get("volume_all_time", 0))
    pnl_all = float(raw.get("pnl_all_time", 0))
    equity = float(raw.get("equity_current", 0))

    # Estimate ROI as pnl / (equity - pnl) if possible
    initial = equity - pnl_all
    roi = (pnl_all / initial * 100) if initial > 0 else 0

    return {
        "address": raw["address"],
        "username": raw.get("username"),
        "pnl": round(pnl_all, 2),
        "pnl_1d": round(float(raw.get("pnl_1d", 0)), 2),
        "pnl_7d": round(float(raw.get("pnl_7d", 0)), 2),
        "pnl_30d": round(float(raw.get("pnl_30d", 0)), 2),
        "pnl_all_time": round(pnl_all, 2),
        "roi_percent": round(roi, 2),
        "volume": round(vol_all, 2),
        "volume_1d": round(float(raw.get("volume_1d", 0)), 2),
        "volume_7d": round(float(raw.get("volume_7d", 0)), 2),
        "volume_30d": round(float(raw.get("volume_30d", 0)), 2),
        "volume_all_time": round(vol_all, 2),
        "equity": round(equity, 2),
        "open_interest": round(float(raw.get("oi_current", 0)), 2),
        "tier": classify_tier(vol_all),
        "rank": rank,
    }


SORT_FIELD_MAP = {
    "pnl": "pnl_all_time",
    "pnl_1d": "pnl_1d",
    "pnl_7d": "pnl_7d",
    "pnl_30d": "pnl_30d",
    "volume": "volume_all_time",
    "volume_1d": "volume_1d",
    "volume_7d": "volume_7d",
    "volume_30d": "volume_30d",
    "equity": "equity_current",
    "roi_percent": "pnl_all_time",  # fallback sort
}

PERIOD_PNL_MAP = {
    "daily": "pnl_1d",
    "weekly": "pnl_7d",
    "monthly": "pnl_30d",
    "all_time": "pnl_all_time",
}

PERIOD_VOL_MAP = {
    "daily": "volume_1d",
    "weekly": "volume_7d",
    "monthly": "volume_30d",
    "all_time": "volume_all_time",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    await pacifica_service.start_background_refresh()
    await telegram_bot.start()
    yield
    await telegram_bot.stop()
    await pacifica_service.close()
    await elfa_service.close()


app = FastAPI(title="Pacifica Analytics", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=ALLOW_CREDENTIALS,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/leaderboard")
async def get_leaderboard(
    period: str = Query("all_time", regex="^(daily|weekly|monthly|all_time)$"),
    sort_by: str = Query("pnl", regex="^(pnl|volume|equity)$"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    raw_data = await pacifica_service.get_leaderboard()

    # Determine sort key based on period + sort_by
    if sort_by == "pnl":
        sort_key = PERIOD_PNL_MAP.get(period, "pnl_all_time")
    elif sort_by == "volume":
        sort_key = PERIOD_VOL_MAP.get(period, "volume_all_time")
    else:
        sort_key = "equity_current"

    # Sort descending
    sorted_data = sorted(
        raw_data,
        key=lambda x: float(x.get(sort_key, 0)),
        reverse=True,
    )

    # Format with ranks
    page = sorted_data[offset : offset + limit]
    formatted = [format_trader(t, rank=offset + i + 1) for i, t in enumerate(page)]

    return {"data": formatted, "total": len(raw_data)}


@app.get("/api/trader/{address}")
async def get_trader(address: str):
    raw = await pacifica_service.get_trader(address)
    if raw:
        # Find rank by pnl
        lb = await pacifica_service.get_leaderboard()
        sorted_lb = sorted(lb, key=lambda x: float(x.get("pnl_all_time", 0)), reverse=True)
        rank = next(
            (i + 1 for i, t in enumerate(sorted_lb) if t["address"] == address),
            0,
        )
        return {"data": format_trader(raw, rank=rank)}
    return {"data": None, "error": "Trader not found"}


@app.get("/api/trader/{address}/account")
async def get_trader_account(address: str):
    return {"data": await pacifica_service.get_account_info(address)}


@app.get("/api/trader/{address}/positions")
async def get_trader_positions(address: str):
    return {"data": await pacifica_service.get_account_positions(address)}


@app.get("/api/trader/{address}/orders")
async def get_trader_orders(address: str):
    return {"data": await pacifica_service.get_account_orders(address)}


@app.get("/api/trader/{address}/fills")
async def get_trader_fills(address: str, limit: int = Query(100, ge=1, le=500)):
    fills = await pacifica_service.get_account_fills(address)
    return {"data": fills[:limit]}


@app.get("/api/trader/{address}/funding")
async def get_trader_funding(address: str, limit: int = Query(100, ge=1, le=500)):
    funding = await pacifica_service.get_account_funding(address)
    return {"data": funding[:limit]}


@app.get("/api/trades")
async def get_trades(symbol: str = Query("BTC"), limit: int = Query(50, ge=1, le=200)):
    data = await pacifica_service.get_trades(symbol=symbol, limit=limit)
    return {"data": data}


@app.get("/api/markets")
async def get_markets():
    """List of all tradeable markets on Pacifica."""
    markets = await pacifica_service.get_markets()
    return {"data": markets}


@app.get("/api/search")
async def search_traders(q: str = Query(..., min_length=2)):
    raw_data = await pacifica_service.get_leaderboard()
    results = []
    q_lower = q.lower()
    for t in raw_data:
        addr = t["address"].lower()
        username = (t.get("username") or "").lower()
        if q_lower in addr or q_lower in username:
            results.append(format_trader(t))
            if len(results) >= 20:
                break
    return {"data": results}


# --- Whale Alerts (large trades) ---
@app.get("/api/whale-alerts")
async def get_whale_alerts(
    symbol: str = Query("BTC"),
    min_size: float = Query(0.1, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    trades = await pacifica_service.get_trades(symbol=symbol, limit=200)
    # Filter by size threshold
    alerts = []
    for t in trades:
        size = float(t.get("amount", 0))
        price = float(t.get("price", 0))
        notional = size * price
        if size >= min_size:
            alerts.append({
                "symbol": symbol,
                "side": t.get("side", ""),
                "size": size,
                "price": price,
                "notional": round(notional, 2),
                "event_type": t.get("event_type", ""),
                "cause": t.get("cause", ""),
                "timestamp": t.get("created_at", 0),
            })
    alerts.sort(key=lambda x: x["notional"], reverse=True)
    return {"data": alerts[:limit]}


# --- Trader Comparison ---
@app.get("/api/compare")
async def compare_traders(addresses: str = Query(..., description="Comma-separated addresses")):
    addr_list = [a.strip() for a in addresses.split(",") if a.strip()][:5]
    lb = await pacifica_service.get_leaderboard()
    sorted_lb = sorted(lb, key=lambda x: float(x.get("pnl_all_time", 0)), reverse=True)

    results = []
    for addr in addr_list:
        raw = next((t for t in lb if t["address"] == addr), None)
        if raw:
            rank = next(
                (i + 1 for i, t in enumerate(sorted_lb) if t["address"] == addr), 0
            )
            results.append(format_trader(raw, rank=rank))
    return {"data": results}


# --- Elfa AI Sentiment ---
@app.get("/api/sentiment/mentions")
async def get_sentiment_mentions(
    ticker: str = Query("BTC"),
    time_window: str = Query("24h"),
    limit: int = Query(10, ge=1, le=50),
):
    data = await elfa_service.get_top_mentions(ticker=ticker, time_window=time_window, limit=limit)
    return {"data": data}


@app.get("/api/sentiment/trending")
async def get_trending_tokens():
    data = await elfa_service.get_trending_tokens()
    return {"data": data}


# --- Telegram bot info (for frontend CTA) ---
@app.get("/api/telegram/info")
async def get_telegram_info():
    return {
        "data": {
            "enabled": telegram_bot.is_enabled(),
            "username": telegram_bot.TELEGRAM_BOT_USERNAME or None,
            "subscribers": await count_active_subscribers() if telegram_bot.is_enabled() else 0,
        }
    }


# WebSocket
class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)

    async def broadcast(self, message: dict):
        for ws in self.active:
            try:
                await ws.send_json(message)
            except Exception:
                pass


manager = ConnectionManager()


@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            if msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
