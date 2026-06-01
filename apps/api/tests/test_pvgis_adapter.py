"""PVGIS adapter unit tests (HTTP mocked, no network)."""

from __future__ import annotations

from pathlib import Path

import respx
from httpx import Response
from solar_api.adapters.pvgis import PvgisAdapter, azimuth_to_aspect

_BASE = "https://pvgis.example/api"

_SAMPLE = {
    "outputs": {
        "totals": {"fixed": {"E_y": 1050.0}},
        "monthly": {"fixed": [{"month": m, "E_m": 80.0 + m} for m in range(1, 13)]},
    }
}


def test_azimuth_to_aspect_converts_pvlib_to_pvgis_frame() -> None:
    assert azimuth_to_aspect(180) == 0  # south
    assert azimuth_to_aspect(90) == -90  # east
    assert azimuth_to_aspect(270) == 90  # west


@respx.mock
async def test_pvgis_adapter_returns_annual_and_twelve_months(tmp_path: Path) -> None:
    """P1: realistic yield estimates from PVGIS, per surface."""
    respx.get(f"{_BASE}/PVcalc").mock(return_value=Response(200, json=_SAMPLE))

    adapter = PvgisAdapter(_BASE, str(tmp_path))
    annual, monthly = await adapter.specific_yield(52.52, 13.405, 35, 180)

    assert annual == 1050.0
    assert len(monthly) == 12
    assert monthly[0] == 81.0
