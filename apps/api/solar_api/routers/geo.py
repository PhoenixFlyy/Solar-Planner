"""Geo router: address -> coordinates -> building footprint (walking skeleton).

Thin: parse, delegate to the geo service, serialize. No business logic here.
"""

from __future__ import annotations

from fastapi import APIRouter, Query

from solar_api.domain.geo import (
    FootprintResponse,
    GeocodeRequest,
    GeocodeResponse,
)
from solar_api.services.geo import service as geo_service

router = APIRouter(prefix="/geo", tags=["geo"])


@router.post("/geocode", response_model=GeocodeResponse)
async def geocode(request: GeocodeRequest) -> GeocodeResponse:
    results = await geo_service.geocode(request.query)
    return GeocodeResponse(results=results)


@router.get("/footprint", response_model=FootprintResponse)
async def footprint(
    lat: float = Query(ge=-90, le=90),
    lng: float = Query(ge=-180, le=180),
) -> FootprintResponse:
    fp = await geo_service.footprint(lat, lng)
    return FootprintResponse(footprint=fp)
