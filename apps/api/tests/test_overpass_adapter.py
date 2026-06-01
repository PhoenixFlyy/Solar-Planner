"""Overpass adapter unit tests (HTTP mocked, no network)."""

from __future__ import annotations

from pathlib import Path

import respx
from httpx import Response
from solar_api.adapters.overpass import OverpassAdapter

_BASE = "https://overpass.example/api/interpreter"

_BUILDING = {
    "elements": [
        {
            "type": "way",
            "geometry": [
                {"lat": 52.5200, "lon": 13.4000},
                {"lat": 52.5201, "lon": 13.4000},
                {"lat": 52.5201, "lon": 13.4001},
                {"lat": 52.5200, "lon": 13.4001},
            ],
        }
    ]
}


@respx.mock
async def test_overpass_adapter_with_building_returns_footprint(tmp_path: Path) -> None:
    """P-walking-skeleton: coordinates -> OSM building footprint."""
    respx.post(_BASE).mock(return_value=Response(200, json=_BUILDING))

    adapter = OverpassAdapter(_BASE, str(tmp_path))
    fp = await adapter.footprint(52.5200, 13.4000)

    assert fp is not None
    assert fp.source == "osm"
    assert len(fp.points) == 4
    assert fp.points[0].lat == 52.5200
    assert fp.points[0].lng == 13.4000


@respx.mock
async def test_overpass_adapter_with_no_buildings_returns_none(tmp_path: Path) -> None:
    respx.post(_BASE).mock(return_value=Response(200, json={"elements": []}))

    adapter = OverpassAdapter(_BASE, str(tmp_path))
    assert await adapter.footprint(0.0, 0.0) is None
