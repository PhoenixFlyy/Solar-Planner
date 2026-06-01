"""Health check router. The frontend /api-health page pings this."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from solar_api import __version__

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Liveness probe. No external dependencies are checked here."""
    return HealthResponse(status="ok", service="solar-api", version=__version__)
