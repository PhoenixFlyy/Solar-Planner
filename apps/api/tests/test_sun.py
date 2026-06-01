"""pvlib sun-position service tests (authoritative reference)."""

from __future__ import annotations

from solar_api.services.solar.sun import sun_position


def test_sun_position_berlin_summer_noon_is_high_and_south() -> None:
    """P1: realistic sun arc for the 3D editor."""
    sp = sun_position(52.52, 13.405, "2025-06-21T11:00:00Z")
    assert sp.elevation > 55  # near max (~61°) at summer solstice noon
    assert 150 < sp.azimuth < 210  # roughly south


def test_sun_position_midnight_is_below_horizon() -> None:
    sp = sun_position(52.52, 13.405, "2025-06-21T00:00:00Z")
    assert sp.elevation < 0


def test_sun_position_naive_timestamp_treated_as_utc() -> None:
    a = sun_position(52.52, 13.405, "2025-06-21T11:00:00")
    b = sun_position(52.52, 13.405, "2025-06-21T11:00:00Z")
    assert abs(a.azimuth - b.azimuth) < 1e-6
    assert abs(a.elevation - b.elevation) < 1e-6
