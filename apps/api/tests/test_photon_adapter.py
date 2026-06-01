"""Photon adapter unit tests (HTTP mocked, no network)."""

from __future__ import annotations

from pathlib import Path

import respx
from httpx import Response
from solar_api.adapters.photon import PhotonAdapter

_BASE = "https://photon.example"

_SAMPLE = {
    "features": [
        {
            "geometry": {"coordinates": [13.405, 52.52]},  # [lon, lat]
            "properties": {
                "name": "Berlin",
                "street": "Unter den Linden",
                "housenumber": "1",
                "postcode": "10117",
                "city": "Berlin",
                "country": "Deutschland",
            },
        }
    ]
}


@respx.mock
async def test_photon_adapter_with_valid_query_returns_results(tmp_path: Path) -> None:
    """P-walking-skeleton: address -> coordinates via Photon."""
    respx.get(f"{_BASE}/api/").mock(return_value=Response(200, json=_SAMPLE))

    adapter = PhotonAdapter(_BASE, str(tmp_path))
    results = await adapter.geocode("Unter den Linden 1, Berlin")

    assert len(results) == 1
    r = results[0]
    assert r.lat == 52.52
    assert r.lng == 13.405  # GeoJSON [lon, lat] correctly unpacked
    assert r.city == "Berlin"
    assert r.postcode == "10117"
    assert "Unter den Linden" in r.label


@respx.mock
async def test_photon_adapter_with_empty_features_returns_empty_list(tmp_path: Path) -> None:
    respx.get(f"{_BASE}/api/").mock(return_value=Response(200, json={"features": []}))

    adapter = PhotonAdapter(_BASE, str(tmp_path))
    assert await adapter.geocode("Nirgendwo") == []
