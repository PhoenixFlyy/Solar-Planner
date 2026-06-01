"""Geo service: thin orchestration over the Photon and Overpass adapters.

Adapter instances are cached per process (they hold an httpx client + cache).
"""

from __future__ import annotations

from functools import lru_cache

from solar_api.adapters.overpass import OverpassAdapter
from solar_api.adapters.photon import PhotonAdapter
from solar_api.core.config import get_settings
from solar_api.domain.geo import Footprint, GeocodeResult


@lru_cache
def _photon() -> PhotonAdapter:
    settings = get_settings()
    return PhotonAdapter(settings.photon_base_url, settings.http_cache_dir)


@lru_cache
def _overpass() -> OverpassAdapter:
    settings = get_settings()
    return OverpassAdapter(settings.overpass_base_url, settings.http_cache_dir)


async def geocode(query: str) -> list[GeocodeResult]:
    """Resolve an address string to candidate locations."""
    return await _photon().geocode(query)


async def footprint(lat: float, lng: float) -> Footprint | None:
    """Find the nearest OSM building footprint, or None if unavailable."""
    return await _overpass().footprint(lat, lng)
