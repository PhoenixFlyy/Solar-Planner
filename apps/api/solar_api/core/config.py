"""Application settings, loaded from .env.local via pydantic-settings.

The repo keeps a single root .env.local (seeded from .env.example by
`pnpm run setup`). The backend is run from apps/api (`uv run --directory
apps/api ...`), so the root file is two levels up.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Try the repo-root file first, then a local override beside the app.
        env_file=("../../.env.local", ".env.local"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_env: str = "local"
    log_level: str = "INFO"

    # Persistence / infra
    database_url: str = "postgresql+psycopg://solar:solar@localhost:5432/solar"
    redis_url: str = "redis://localhost:6379/0"

    # External data sources (all free, no key in MVP)
    photon_base_url: str = "https://photon.komoot.io"
    overpass_base_url: str = "https://overpass-api.de/api/interpreter"
    pvgis_base_url: str = "https://re.jrc.ec.europa.eu/api/v5_2"

    # hishel disk cache for outbound HTTP
    http_cache_dir: str = ".cache/http"

    # Frontend origin(s) allowed by CORS in dev
    cors_origins: list[str] = ["http://localhost:3000"]

    sentry_dsn: str = ""


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
