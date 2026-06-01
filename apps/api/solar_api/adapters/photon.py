"""Photon geocoding adapter (OSM-backed, free, no key).

See wiki/data-sources/photon.md. NEVER log the query — it is an address (PII).
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
from solar_api.domain.geo import GeocodeResult


class PhotonAdapter:
    cache_ttl_seconds = 86_400
    rate_limit_per_minute = 60

    def __init__(self, base_url: str, cache_dir: str) -> None:
        self._client = make_cached_client(base_url, f"{cache_dir}/photon", self.cache_ttl_seconds)
        self._limiter = RateLimiter(self.rate_limit_per_minute)

    async def geocode(self, query: str, limit: int = 5) -> list[GeocodeResult]:
        await self._limiter.acquire()
        try:
            data = await self._fetch(query, limit)
        except httpx.HTTPStatusError as exc:
            raise UpstreamError("Geocoding service failed") from exc
        return self._parse(data)

    @upstream_retry
    async def _fetch(self, query: str, limit: int) -> dict[str, Any]:
        resp = await self._client.get(
            "/api/",
            params={"q": query, "lang": "de", "limit": limit},
            extensions={"force_cache": True},
        )
        raise_if_retryable(resp)
        resp.raise_for_status()
        payload: dict[str, Any] = resp.json()
        return payload

    @staticmethod
    def _parse(data: dict[str, Any]) -> list[GeocodeResult]:
        results: list[GeocodeResult] = []
        for feature in data.get("features", []):
            coords = feature.get("geometry", {}).get("coordinates")
            if not coords or len(coords) < 2:
                continue
            lon, lat = float(coords[0]), float(coords[1])  # GeoJSON order is [lon, lat]
            props = feature.get("properties", {})
            results.append(
                GeocodeResult(
                    label=_label(props),
                    lat=lat,
                    lng=lon,
                    city=props.get("city"),
                    postcode=props.get("postcode"),
                    country=props.get("country"),
                )
            )
        return results

    async def aclose(self) -> None:
        await self._client.aclose()


def _label(props: dict[str, Any]) -> str:
    street = props.get("street")
    housenumber = props.get("housenumber")
    line1 = " ".join(p for p in (street, housenumber) if p) or props.get("name")
    line2 = " ".join(p for p in (props.get("postcode"), props.get("city")) if p)
    parts = [p for p in (line1, line2) if p]
    return ", ".join(parts) if parts else (props.get("name") or "Unbekannter Ort")
