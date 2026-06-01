"""Overpass (OpenStreetMap) building-footprint adapter (free, no key).

See wiki/data-sources/overpass-osm.md. German OSM height/roof data is patchy,
which is why we are template-first (ADR-0007); the footprint only refines.
"""

from __future__ import annotations

from typing import Any

import httpx

from solar_api.adapters.base import (
    RateLimiter,
    make_cached_client,
    raise_if_retryable,
    upstream_retry,
)
from solar_api.core.exceptions import UpstreamError
from solar_api.domain.geo import Footprint, LatLng


class OverpassAdapter:
    cache_ttl_seconds = 86_400
    rate_limit_per_minute = 30

    def __init__(self, base_url: str, cache_dir: str) -> None:
        self._base_url = base_url
        self._client = make_cached_client(base_url, f"{cache_dir}/overpass", self.cache_ttl_seconds)
        self._limiter = RateLimiter(self.rate_limit_per_minute)

    async def footprint(self, lat: float, lng: float, radius_m: int = 30) -> Footprint | None:
        await self._limiter.acquire()
        try:
            data = await self._fetch(self._build_query(lat, lng, radius_m))
        except httpx.HTTPStatusError as exc:
            raise UpstreamError("Footprint service failed") from exc
        return self._parse(data, lat, lng)

    @staticmethod
    def _build_query(lat: float, lng: float, radius_m: int) -> str:
        return (
            f"[out:json][timeout:25];"
            f'(way["building"](around:{radius_m},{lat},{lng});'
            f'relation["building"](around:{radius_m},{lat},{lng}););'
            f"out body geom;"
        )

    @upstream_retry
    async def _fetch(self, query: str) -> dict[str, Any]:
        # Overpass interpreter endpoint is the configured base_url itself.
        resp = await self._client.post(
            self._base_url,
            data={"data": query},
            extensions={"force_cache": True},
        )
        raise_if_retryable(resp)
        resp.raise_for_status()
        payload: dict[str, Any] = resp.json()
        return payload

    @staticmethod
    def _parse(data: dict[str, Any], lat: float, lng: float) -> Footprint | None:
        # Pick the building whose centroid is nearest the query point.
        best: list[dict[str, float]] | None = None
        best_dist = float("inf")
        for element in data.get("elements", []):
            geometry = element.get("geometry")
            if not geometry or len(geometry) < 3:
                continue
            clat = sum(p["lat"] for p in geometry) / len(geometry)
            clon = sum(p["lon"] for p in geometry) / len(geometry)
            dist = (clat - lat) ** 2 + (clon - lng) ** 2
            if dist < best_dist:
                best_dist = dist
                best = geometry
        if best is None:
            return None
        return Footprint(points=[LatLng(lat=p["lat"], lng=p["lon"]) for p in best])

    async def aclose(self) -> None:
        await self._client.aclose()
