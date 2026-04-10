import httpx
import asyncio
import time
from typing import Optional

BASE_URL = "https://api.pacifica.fi/api/v1"
LEADERBOARD_REFRESH_INTERVAL = 60  # seconds


class PacificaService:
    def __init__(self):
        self.client = httpx.AsyncClient(base_url=BASE_URL, timeout=30.0)
        self._cache: dict = {}
        self._cache_ttl: dict = {}
        self._refresh_task: Optional[asyncio.Task] = None
        self._initial_load: Optional[asyncio.Future] = None

    def _is_cached(self, key: str, ttl: int = 30) -> bool:
        if key in self._cache and key in self._cache_ttl:
            return (time.time() - self._cache_ttl[key]) < ttl
        return False

    def _set_cache(self, key: str, data):
        self._cache[key] = data
        self._cache_ttl[key] = time.time()

    async def _fetch_leaderboard_upstream(self) -> list[dict]:
        try:
            resp = await self.client.get("/leaderboard")
            if resp.status_code == 200:
                result = resp.json()
                if result.get("success") and result.get("data"):
                    data = result["data"]
                    self._set_cache("leaderboard", data)
                    return data
        except Exception as e:
            print(f"Error fetching leaderboard: {e}")
        return self._cache.get("leaderboard", [])

    async def _background_refresh_loop(self):
        """Refresh the leaderboard every minute so users never wait on upstream."""
        while True:
            try:
                await self._fetch_leaderboard_upstream()
            except Exception as e:
                print(f"Background refresh error: {e}")
            await asyncio.sleep(LEADERBOARD_REFRESH_INTERVAL)

    async def start_background_refresh(self):
        """Kick off the initial fetch + background refresh task. Called from app lifespan."""
        if self._refresh_task is None:
            # Initial fetch — non-blocking for the app startup
            loop = asyncio.get_running_loop()
            self._initial_load = loop.create_future()

            async def _init():
                await self._fetch_leaderboard_upstream()
                if not self._initial_load.done():
                    self._initial_load.set_result(True)

            asyncio.create_task(_init())
            self._refresh_task = asyncio.create_task(self._background_refresh_loop())

    async def get_leaderboard(self) -> list[dict]:
        """Always serve from cache. If empty (very first call before initial fetch), wait briefly."""
        if "leaderboard" in self._cache:
            return self._cache["leaderboard"]
        # Cache cold — wait for initial load (max 5s) instead of triggering another fetch
        if self._initial_load is not None and not self._initial_load.done():
            try:
                await asyncio.wait_for(asyncio.shield(self._initial_load), timeout=5.0)
            except asyncio.TimeoutError:
                pass
        return self._cache.get("leaderboard", [])

    async def get_trader(self, address: str) -> Optional[dict]:
        """Get a specific trader from the cached leaderboard data."""
        lb = await self.get_leaderboard()
        for trader in lb:
            if trader["address"] == address:
                return trader
        return None

    async def get_markets(self) -> list[dict]:
        """Fetch all tradeable markets from Pacifica. Cached for 10 min."""
        if self._is_cached("markets", ttl=600):
            return self._cache["markets"]
        try:
            resp = await self.client.get("/info")
            if resp.status_code == 200:
                result = resp.json()
                if result.get("success") and result.get("data"):
                    data = result["data"]
                    self._set_cache("markets", data)
                    return data
        except Exception as e:
            print(f"Error fetching markets: {e}")
        return self._cache.get("markets", [])

    async def get_market_symbols(self) -> list[str]:
        markets = await self.get_markets()
        return [m["symbol"] for m in markets if m.get("symbol")]

    async def get_top_whale_addresses(self, n: int = 50, by: str = "volume_7d") -> list[str]:
        """
        Return the top N most active whale wallet addresses.
        Used by the Telegram broadcaster as the watchlist for attributed alerts.

        `by` can be any leaderboard-sortable field, e.g. volume_7d / pnl_all_time.
        """
        lb = await self.get_leaderboard()
        if not lb:
            return []
        sorted_lb = sorted(
            lb,
            key=lambda x: float(x.get(by, 0)),
            reverse=True,
        )
        return [t["address"] for t in sorted_lb[:n]]

    async def _get_account_data(self, path: str, account: str, ttl: int = 15) -> dict | list:
        """Generic helper for /<path>?account=ADDR endpoints with caching."""
        key = f"{path}_{account}"
        if self._is_cached(key, ttl=ttl):
            return self._cache[key]
        try:
            resp = await self.client.get(f"/{path}", params={"account": account})
            if resp.status_code == 200:
                result = resp.json()
                if result.get("success"):
                    data = result.get("data") or []
                    self._set_cache(key, data)
                    return data
        except Exception as e:
            print(f"Error fetching /{path} for {account}: {e}")
        return self._cache.get(key, [])

    async def get_account_info(self, account: str) -> dict:
        data = await self._get_account_data("account", account, ttl=15)
        return data if isinstance(data, dict) else {}

    async def get_account_positions(self, account: str) -> list[dict]:
        data = await self._get_account_data("positions", account, ttl=15)
        return data if isinstance(data, list) else []

    async def get_account_orders(self, account: str) -> list[dict]:
        data = await self._get_account_data("orders", account, ttl=15)
        return data if isinstance(data, list) else []

    async def get_account_fills(self, account: str) -> list[dict]:
        data = await self._get_account_data("positions/history", account, ttl=20)
        return data if isinstance(data, list) else []

    async def get_account_funding(self, account: str) -> list[dict]:
        data = await self._get_account_data("funding_payments", account, ttl=30)
        return data if isinstance(data, list) else []

    async def get_trades(self, symbol: str = "BTC", limit: int = 50) -> list[dict]:
        """Fetch recent trades for a symbol."""
        key = f"trades_{symbol}"
        if self._is_cached(key, ttl=10):
            return self._cache[key]
        try:
            resp = await self.client.get("/trades", params={"symbol": symbol})
            if resp.status_code == 200:
                result = resp.json()
                if result.get("success") and result.get("data"):
                    data = result["data"][:limit]
                    self._set_cache(key, data)
                    return data
                if isinstance(result, list):
                    data = result[:limit]
                    self._set_cache(key, data)
                    return data
        except Exception as e:
            print(f"Error fetching trades: {e}")
        return self._cache.get(key, [])

    async def close(self):
        if self._refresh_task is not None:
            self._refresh_task.cancel()
        await self.client.aclose()


pacifica_service = PacificaService()
