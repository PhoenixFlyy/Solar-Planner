"""Solar router: authoritative sun position (pvlib). Thin — delegates to the
solar service."""

from __future__ import annotations

from fastapi import APIRouter, Query

from solar_api.domain.solar import SunPosition, SystemYield, YieldRequest
from solar_api.services.solar import pv_yield as yield_service
from solar_api.services.solar import sun as sun_service

router = APIRouter(prefix="/solar", tags=["solar"])


@router.get("/sun-position", response_model=SunPosition)
async def sun_position(
    lat: float = Query(ge=-90, le=90),
    lng: float = Query(ge=-180, le=180),
    timestamp: str = Query(description="ISO 8601 instant; naive is treated as UTC."),
) -> SunPosition:
    return sun_service.sun_position(lat, lng, timestamp)


@router.post("/yield", response_model=SystemYield)
async def system_yield(request: YieldRequest) -> SystemYield:
    return await yield_service.system_yield(request)
