"""FastAPI application entrypoint.

Keep imports here light: per the free-tier strategy (ADR-0006), heavy
geospatial libs (geopandas) must load only in the worker, never in the API
process. Do not import services/adapters that pull geopandas at module top.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from solar_api.core.config import get_settings
from solar_api.core.exceptions import register_exception_handlers
from solar_api.routers import health

API_V1 = "/api/v1"


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Solar Planner API",
        version="0.0.0",
        description="Geo, solar, economics and report services for Solar Planner.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    app.include_router(health.router, prefix=API_V1)

    return app


app = create_app()
