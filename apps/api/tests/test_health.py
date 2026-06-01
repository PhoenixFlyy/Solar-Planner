"""Health endpoint smoke test (Sprint 0 walking-skeleton wiring)."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_health_returns_ok_status(client: TestClient) -> None:
    """The frontend /api-health page depends on this contract."""
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["service"] == "solar-api"
    assert "version" in body
