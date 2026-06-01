"""Yield service: per-surface PVGIS specific yield scaled by installed kWp,
aggregated to the system level (ADR-0004)."""

from __future__ import annotations

from functools import lru_cache

from solar_api.adapters.pvgis import PvgisAdapter
from solar_api.core.config import get_settings
from solar_api.domain.solar import (
    SurfaceYield,
    SystemYield,
    YieldRequest,
)


@lru_cache
def _pvgis() -> PvgisAdapter:
    settings = get_settings()
    return PvgisAdapter(settings.pvgis_base_url, settings.http_cache_dir)


async def system_yield(request: YieldRequest) -> SystemYield:
    per_surface: list[SurfaceYield] = []
    monthly_total = [0.0] * 12

    for surface in request.surfaces:
        specific_annual, specific_monthly = await _pvgis().specific_yield(
            request.lat, request.lng, surface.tilt, surface.azimuth
        )
        annual = specific_annual * surface.kwp
        per_surface.append(
            SurfaceYield(
                surface_id=surface.id,
                tilt=surface.tilt,
                azimuth=surface.azimuth,
                kwp=surface.kwp,
                specific_kwh_per_kwp=specific_annual,
                annual_kwh=annual,
            )
        )
        for i in range(12):
            monthly_total[i] += specific_monthly[i] * surface.kwp

    return SystemYield(
        annual_kwh=sum(s.annual_kwh for s in per_surface),
        per_surface=per_surface,
        monthly_kwh=monthly_total,
    )
