"""
Mock data generator for development and demo purposes.
Generates realistic-looking trading data when Pacifica API endpoints
are not yet available or for offline development.
"""

import random
import time
import hashlib
import string

SYMBOLS = ["BTC", "ETH", "SOL", "ARB", "DOGE", "WIF", "JUP", "ONDO", "SUI", "PEPE"]

PRICES = {
    "BTC": 87000.0,
    "ETH": 3200.0,
    "SOL": 190.0,
    "ARB": 1.10,
    "DOGE": 0.18,
    "WIF": 1.50,
    "JUP": 0.85,
    "ONDO": 1.30,
    "SUI": 3.50,
    "PEPE": 0.000012,
}


def _random_address() -> str:
    chars = string.ascii_letters + string.digits
    return "".join(random.choices(chars, k=44))


# Generate a fixed set of 200 trader addresses for consistency
random.seed(42)
MOCK_ADDRESSES = [_random_address() for _ in range(200)]
random.seed()


def _tier_from_volume(volume: float) -> str:
    if volume >= 10_000_000:
        return "leviathan"
    elif volume >= 5_000_000:
        return "whale"
    elif volume >= 1_000_000:
        return "shark"
    elif volume >= 100_000:
        return "dolphin"
    return "fish"


def generate_trader_stats(address: str, seed: int = 0) -> dict:
    rng = random.Random(hash(address) + seed)
    volume = rng.uniform(10_000, 20_000_000)
    total_trades = rng.randint(20, 5000)
    win_rate = rng.uniform(0.30, 0.78)
    winning_trades = int(total_trades * win_rate)
    losing_trades = total_trades - winning_trades

    avg_pnl_per_trade = rng.uniform(-500, 2000)
    pnl = avg_pnl_per_trade * total_trades
    roi = (pnl / max(volume * 0.1, 1)) * 100

    best_trade = abs(rng.gauss(5000, 3000))
    worst_trade = -abs(rng.gauss(3000, 2000))

    return {
        "address": address,
        "pnl": round(pnl, 2),
        "roi_percent": round(roi, 2),
        "volume": round(volume, 2),
        "win_rate": round(win_rate * 100, 2),
        "total_trades": total_trades,
        "winning_trades": winning_trades,
        "losing_trades": losing_trades,
        "best_trade_pnl": round(best_trade, 2),
        "worst_trade_pnl": round(worst_trade, 2),
        "avg_trade_size": round(volume / max(total_trades, 1), 2),
        "current_positions": rng.randint(0, 8),
        "tier": _tier_from_volume(volume),
    }


def generate_leaderboard(
    period: str = "weekly", sort_by: str = "pnl", limit: int = 100
) -> list[dict]:
    seed_map = {"weekly": 1, "monthly": 2, "yearly": 3, "all_time": 4}
    seed = seed_map.get(period, 0)

    traders = []
    for addr in MOCK_ADDRESSES:
        stats = generate_trader_stats(addr, seed=seed)
        traders.append(stats)

    reverse = True
    if sort_by == "pnl":
        traders.sort(key=lambda x: x["pnl"], reverse=reverse)
    elif sort_by == "roi_percent":
        traders.sort(key=lambda x: x["roi_percent"], reverse=reverse)
    elif sort_by == "volume":
        traders.sort(key=lambda x: x["volume"], reverse=reverse)
    elif sort_by == "win_rate":
        traders.sort(key=lambda x: x["win_rate"], reverse=reverse)

    for i, t in enumerate(traders[:limit]):
        t["rank"] = i + 1

    return traders[:limit]


def generate_positions(address: str) -> list[dict]:
    rng = random.Random(hash(address))
    count = rng.randint(0, 6)
    positions = []
    for _ in range(count):
        symbol = rng.choice(SYMBOLS)
        side = rng.choice(["long", "short"])
        price = PRICES[symbol]
        entry = price * rng.uniform(0.9, 1.1)
        size = rng.uniform(0.01, 50) if symbol == "BTC" else rng.uniform(0.1, 5000)
        leverage = rng.choice([1, 2, 3, 5, 10, 20])
        pnl_pct = rng.uniform(-0.15, 0.25)
        unrealized = size * entry * pnl_pct

        positions.append({
            "symbol": symbol,
            "side": side,
            "size": round(size, 4),
            "entry_price": round(entry, 2),
            "mark_price": round(price, 2),
            "unrealized_pnl": round(unrealized, 2),
            "leverage": leverage,
            "timestamp": int(time.time()) - rng.randint(0, 86400 * 30),
        })
    return positions


def generate_trades(address: str, limit: int = 50) -> list[dict]:
    rng = random.Random(hash(address) + 99)
    trades = []
    now = int(time.time())
    for i in range(limit):
        symbol = rng.choice(SYMBOLS)
        side = rng.choice(["buy", "sell"])
        price = PRICES[symbol] * rng.uniform(0.85, 1.15)
        size = rng.uniform(0.01, 100) if symbol == "BTC" else rng.uniform(1, 10000)
        pnl = rng.uniform(-5000, 8000) if rng.random() > 0.3 else None
        fee = size * price * 0.0005

        trades.append({
            "symbol": symbol,
            "side": side,
            "size": round(size, 4),
            "price": round(price, 2),
            "pnl": round(pnl, 2) if pnl else None,
            "fee": round(fee, 2),
            "timestamp": now - (i * rng.randint(1800, 7200)),
        })
    return trades


def generate_pnl_history(address: str, days: int = 30) -> list[dict]:
    rng = random.Random(hash(address) + 200)
    history = []
    cumulative = 0
    now = int(time.time())
    for i in range(days):
        daily_pnl = rng.gauss(200, 1500)
        cumulative += daily_pnl
        history.append({
            "date": now - ((days - i) * 86400),
            "daily_pnl": round(daily_pnl, 2),
            "cumulative_pnl": round(cumulative, 2),
        })
    return history


def generate_markets() -> list[dict]:
    markets = []
    for symbol in SYMBOLS:
        price = PRICES[symbol]
        markets.append({
            "symbol": symbol,
            "mark_price": price,
            "index_price": round(price * random.uniform(0.999, 1.001), 2),
            "funding_rate": round(random.uniform(-0.01, 0.03), 4),
            "volume_24h": round(random.uniform(1_000_000, 500_000_000), 2),
            "open_interest": round(random.uniform(500_000, 200_000_000), 2),
        })
    return markets
