"""Geo domain models (Pydantic v2). Shared by the geo service, router, and
the generated TS types. Mirror these in the Dexie schema (ADR-0002).
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class LatLng(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class GeocodeRequest(BaseModel):
    query: str = Field(min_length=2, max_length=200)


class GeocodeResult(BaseModel):
    label: str
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    city: str | None = None
    postcode: str | None = None
    country: str | None = None


class GeocodeResponse(BaseModel):
    results: list[GeocodeResult]


class Footprint(BaseModel):
    """A building outline as a ring of lat/lng vertices (source: OSM)."""

    points: list[LatLng]
    source: str = "osm"


class FootprintResponse(BaseModel):
    footprint: Footprint | None
