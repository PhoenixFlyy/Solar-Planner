"""Authoritative sun-position via pvlib (ADR-0004, CLAUDE.md: pvlib is
authoritative). The frontend computes sun position client-side for the live
time-slider; this endpoint is the reference the client is validated against.

pvlib/pandas are imported lazily so the API process stays lean until called
(Fly.io 256 MB — ADR-0006).
"""

from __future__ import annotations

from datetime import UTC, datetime

from solar_api.core.exceptions import ValidationDomainError
from solar_api.domain.solar import SunPosition


def _parse_utc(timestamp: str) -> datetime:
    try:
        dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValidationDomainError(f"Invalid timestamp: {timestamp!r}") from exc
    return dt.replace(tzinfo=UTC) if dt.tzinfo is None else dt.astimezone(UTC)


def sun_position(lat: float, lng: float, timestamp: str) -> SunPosition:
    """Solar azimuth/elevation at a location and instant (UTC)."""
    import pandas as pd
    import pvlib

    when = _parse_utc(timestamp)
    times = pd.DatetimeIndex([pd.Timestamp(when)])
    sp = pvlib.solarposition.get_solarposition(times, lat, lng)
    return SunPosition(
        azimuth=float(sp["azimuth"].iloc[0]),
        elevation=float(sp["apparent_elevation"].iloc[0]),
    )
