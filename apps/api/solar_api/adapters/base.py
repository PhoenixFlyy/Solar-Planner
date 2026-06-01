"""Shared building blocks for external-API adapters.

Per CLAUDE.md, every adapter: uses httpx.AsyncClient with a hishel cache,
exposes per-instance ``cache_ttl_seconds`` and ``rate_limit_per_minute``,
retries with Tenacity, and translates transport errors into domain
exceptions. This module provides the cached client, a simple async rate
limiter, and the retry policy so each adapter stays small.
"""

from __future__ import annotations

import asyncio
import time
from pathlib import Path

import hishel
import httpx
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

# Upstream statuses worth retrying (transient).
_RETRYABLE_STATUS = {429, 502, 503, 504}


class RetryableUpstream(Exception):
    """Internal marker so Tenacity retries transient upstream failures."""


def make_cached_client(base_url: str, cache_dir: str, ttl_seconds: int) -> httpx.AsyncClient:
    """An httpx async client with an on-disk hishel cache (force-cached, since
    Photon/Overpass don't send cache headers)."""
    Path(cache_dir).mkdir(parents=True, exist_ok=True)
    storage = hishel.AsyncFileStorage(base_path=Path(cache_dir), ttl=ttl_seconds)
    controller = hishel.Controller(
        cacheable_methods=["GET", "POST"],
        cacheable_status_codes=[200],
        allow_stale=True,
    )
    return hishel.AsyncCacheClient(
        base_url=base_url,
        storage=storage,
        controller=controller,
        timeout=httpx.Timeout(25.0),
        headers={"User-Agent": "solar-planner/0.0 (dev)"},
    )


class RateLimiter:
    """Minimal async rate limiter enforcing a minimum spacing between calls."""

    def __init__(self, per_minute: int) -> None:
        self._min_interval = 60.0 / per_minute if per_minute > 0 else 0.0
        self._lock = asyncio.Lock()
        self._last = 0.0

    async def acquire(self) -> None:
        if self._min_interval <= 0:
            return
        async with self._lock:
            now = time.monotonic()
            wait = self._min_interval - (now - self._last)
            if wait > 0:
                await asyncio.sleep(wait)
            self._last = time.monotonic()


# Shared retry decorator: 3 attempts, exponential backoff, transient errors only.
upstream_retry = retry(
    reraise=True,
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=0.5, max=4),
    retry=retry_if_exception_type((httpx.TransportError, RetryableUpstream)),
)


def raise_if_retryable(response: httpx.Response) -> None:
    """Turn a transient upstream status into a retryable exception."""
    if response.status_code in _RETRYABLE_STATUS:
        raise RetryableUpstream(f"upstream returned {response.status_code}")
