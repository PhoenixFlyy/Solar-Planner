"""Solar domain models (Pydantic v2)."""

from __future__ import annotations

from pydantic import BaseModel, Field


class SunPosition(BaseModel):
    """Solar position in the pvlib frame: azimuth 0=N, 90=E, 180=S, 270=W."""

    azimuth: float = Field(description="Compass azimuth, degrees (0=N, 90=E, 180=S, 270=W).")
    elevation: float = Field(description="Apparent elevation above the horizon, degrees.")


class YieldSurfaceInput(BaseModel):
    """One roof surface to evaluate: orientation + installed capacity."""

    id: str
    tilt: float = Field(ge=0, le=90)
    azimuth: float = Field(ge=0, lt=360, description="pvlib frame: 0=N, 90=E, 180=S, 270=W.")
    kwp: float = Field(ge=0)


class YieldRequest(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    surfaces: list[YieldSurfaceInput]


class SurfaceYield(BaseModel):
    surface_id: str
    tilt: float
    azimuth: float
    kwp: float
    specific_kwh_per_kwp: float = Field(
        description="PVGIS annual yield per kWp at this orientation."
    )
    annual_kwh: float


class SystemYield(BaseModel):
    annual_kwh: float
    per_surface: list[SurfaceYield]
    monthly_kwh: list[float] = Field(description="12 values, Jan..Dec, aggregated over surfaces.")
