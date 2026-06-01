"""Solar domain models (Pydantic v2)."""

from __future__ import annotations

from pydantic import BaseModel, Field


class SunPosition(BaseModel):
    """Solar position in the pvlib frame: azimuth 0=N, 90=E, 180=S, 270=W."""

    azimuth: float = Field(description="Compass azimuth, degrees (0=N, 90=E, 180=S, 270=W).")
    elevation: float = Field(description="Apparent elevation above the horizon, degrees.")
