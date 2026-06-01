"""Yield router + aggregation tests. PVGIS adapter is stubbed (no network)."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from solar_api.adapters import pvgis as pvgis_module
from solar_api.services.solar import pv_yield


@pytest.fixture
def stub_pvgis(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _fake(
        self: object, lat: float, lng: float, tilt: float, azimuth: float
    ) -> tuple[float, list[float]]:
        # South (180) is the best; halve it elsewhere so surfaces differ.
        specific = 1000.0 if azimuth == 180 else 500.0
        return specific, [specific / 12] * 12

    monkeypatch.setattr(pvgis_module.PvgisAdapter, "specific_yield", _fake)
    pv_yield._pvgis.cache_clear()


def test_yield_router_aggregates_surfaces(client: TestClient, stub_pvgis: None) -> None:
    res = client.post(
        "/api/v1/solar/yield",
        json={
            "lat": 52.52,
            "lng": 13.405,
            "surfaces": [
                {"id": "front", "tilt": 35, "azimuth": 180, "kwp": 5},
                {"id": "back", "tilt": 35, "azimuth": 0, "kwp": 5},
            ],
        },
    )
    assert res.status_code == 200
    body = res.json()
    # 1000*5 (south) + 500*5 (north) = 7500
    assert body["annual_kwh"] == 7500.0
    assert len(body["per_surface"]) == 2
    assert len(body["monthly_kwh"]) == 12
    south = next(s for s in body["per_surface"] if s["surface_id"] == "front")
    assert south["specific_kwh_per_kwp"] == 1000.0
