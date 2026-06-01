"""Geo router integration test. Exercises request validation, routing, and
response serialization; the service layer is stubbed so no network is hit.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from solar_api.domain.geo import GeocodeResult
from solar_api.services.geo import service as geo_service


@pytest.fixture
def stub_geocode(monkeypatch: pytest.MonkeyPatch) -> None:
    async def _fake(query: str) -> list[GeocodeResult]:
        return [GeocodeResult(label=f"Result for {query}", lat=52.52, lng=13.405, city="Berlin")]

    monkeypatch.setattr(geo_service, "geocode", _fake)


def test_geocode_router_with_valid_query_returns_results(
    client: TestClient, stub_geocode: None
) -> None:
    res = client.post("/api/v1/geo/geocode", json={"query": "Berlin"})
    assert res.status_code == 200
    body = res.json()
    assert len(body["results"]) == 1
    assert body["results"][0]["city"] == "Berlin"
    assert body["results"][0]["lat"] == 52.52


def test_geocode_router_with_too_short_query_returns_422(client: TestClient) -> None:
    res = client.post("/api/v1/geo/geocode", json={"query": "x"})
    assert res.status_code == 422
