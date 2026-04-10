import os
import httpx
import time

ELFA_BASE = "https://api.elfa.ai/v2"
ELFA_API_KEY = os.getenv("ELFA_API_KEY", "")

if not ELFA_API_KEY:
    print(
        "[elfa] WARNING: ELFA_API_KEY env var not set. "
        "Sentiment endpoints will return empty results until configured."
    )


class ElfaService:
    def __init__(self):
        headers = {"x-elfa-api-key": ELFA_API_KEY} if ELFA_API_KEY else {}
        self.client = httpx.AsyncClient(
            base_url=ELFA_BASE,
            timeout=15.0,
            headers=headers,
        )
        self.enabled = bool(ELFA_API_KEY)
        self._cache: dict = {}
        self._cache_ttl: dict = {}

    def _is_cached(self, key: str, ttl: int = 300) -> bool:
        if key in self._cache and key in self._cache_ttl:
            return (time.time() - self._cache_ttl[key]) < ttl
        return False

    def _set_cache(self, key: str, data):
        self._cache[key] = data
        self._cache_ttl[key] = time.time()

    async def get_top_mentions(self, ticker: str = "BTC", time_window: str = "24h", limit: int = 10) -> list[dict]:
        if not self.enabled:
            return []
        key = f"mentions_{ticker}_{time_window}"
        if self._is_cached(key, ttl=600):
            return self._cache[key]
        try:
            resp = await self.client.get(
                "/data/top-mentions",
                params={"ticker": ticker, "timeWindow": time_window, "limit": limit},
            )
            if resp.status_code == 200:
                result = resp.json()
                data = result.get("data", [])
                self._set_cache(key, data)
                return data
        except Exception as e:
            print(f"Elfa top mentions error: {e}")
        return []

    async def get_trending_tokens(self, time_window: str = "24h") -> list[dict]:
        if not self.enabled:
            return []
        key = f"trending_{time_window}"
        if self._is_cached(key, ttl=600):
            return self._cache[key]
        try:
            resp = await self.client.get(
                "/aggregations/trending-tokens",
                params={"timeWindow": time_window},
            )
            if resp.status_code == 200:
                result = resp.json()
                data = result.get("data", {}).get("data", [])
                self._set_cache(key, data)
                return data
        except Exception as e:
            print(f"Elfa trending error: {e}")
        return []

    async def get_keyword_mentions(self, keywords: str, time_window: str = "1h", limit: int = 10) -> list[dict]:
        if not self.enabled:
            return []
        key = f"kw_{keywords}_{time_window}"
        if self._is_cached(key, ttl=600):
            return self._cache[key]
        try:
            resp = await self.client.get(
                "/data/keyword-mentions",
                params={"keywords": keywords, "timeWindow": time_window, "limit": limit},
            )
            if resp.status_code == 200:
                result = resp.json()
                data = result.get("data", [])
                self._set_cache(key, data)
                return data
        except Exception as e:
            print(f"Elfa keyword mentions error: {e}")
        return []

    async def close(self):
        await self.client.aclose()


elfa_service = ElfaService()
