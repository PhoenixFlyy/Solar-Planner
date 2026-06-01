"""PVGIS adapter — primary yield source (ADR-0004, wiki/data-sources/pvgis.md).

Queries PVcalc with peakpower=1 kWp to get the *specific* yield
(kWh/kWp/yr) and the monthly breakdown at a given tilt/azimuth. The caller
scales by the installed kWp. Azimuth is converted from the pvlib frame
(0=N, 90=E, 180=S, 270=W) to PVGIS `aspect` (0=S, -90=E, +90=W).
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


def azimuth_to_aspect(azimuth_deg: float) -> float:
    """pvlib azimuth (0=N) -> PVGIS aspect (0=S), normalized to (-180, 180]."""
    aspect = azimuth_deg - 180.0
    return ((aspect + 180.0) % 360.0) - 180.0


class PvgisAdapter:
    cache_ttl_seconds = 2_592_000  # 30 days — yield climatology is stable
    rate_limit_per_minute = 20

    def __init__(self, base_url: str, cache_dir: str) -> None:
        self._client = make_cached_client(base_url, f"{cache_dir}/pvgis", self.cache_ttl_seconds)
        self._limiter = RateLimiter(self.rate_limit_per_minute)

    async def specific_yield(
        self, lat: float, lng: float, tilt_deg: float, azimuth_deg: float
    ) -> tuple[float, list[float]]:
        """Annual kWh/kWp and 12 monthly kWh/kWp for a 1 kWp system."""
        await self._limiter.acquire()
        try:
            data = await self._fetch(lat, lng, tilt_deg, azimuth_deg)
        except httpx.HTTPStatusError as exc:
            raise UpstreamError("PVGIS yield service failed") from exc
        return self._parse(data)

    @upstream_retry
    async def _fetch(
        self, lat: float, lng: float, tilt_deg: float, azimuth_deg: float
    ) -> dict[str, Any]:
        resp = await self._client.get(
            "/PVcalc",
            params={
                "lat": lat,
                "lon": lng,
                "peakpower": 1,
                "loss": 14,
                "angle": round(tilt_deg, 1),
                "aspect": round(azimuth_to_aspect(azimuth_deg), 1),
                "mountingplace": "building",
                "pvtechchoice": "crystSi",
                "outputformat": "json",
            },
            extensions={"force_cache": True},
        )
        raise_if_retryable(resp)
        resp.raise_for_status()
        payload: dict[str, Any] = resp.json()
        return payload

    @staticmethod
    def _parse(data: dict[str, Any]) -> tuple[float, list[float]]:
        outputs = data.get("outputs", {})
        annual = float(outputs.get("totals", {}).get("fixed", {}).get("E_y", 0.0))
        monthly_rows = outputs.get("monthly", {}).get("fixed", [])
        monthly = [float(row.get("E_m", 0.0)) for row in monthly_rows]
        # Pad/trim defensively to 12 months.
        monthly = (monthly + [0.0] * 12)[:12]
        return annual, monthly

    async def aclose(self) -> None:
        await self._client.aclose()
