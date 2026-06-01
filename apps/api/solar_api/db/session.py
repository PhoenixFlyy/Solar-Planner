"""Database engine and session dependency.

Synchronous SQLModel sessions keep the MVP simple; adapters do their own
async HTTP. Switch to async sessions only if a real need appears (ADR).
"""

from __future__ import annotations

from collections.abc import Iterator

from sqlmodel import Session, create_engine

from solar_api.core.config import get_settings

_settings = get_settings()
engine = create_engine(_settings.database_url, echo=False, pool_pre_ping=True)


def get_session() -> Iterator[Session]:
    """FastAPI dependency yielding a scoped DB session."""
    with Session(engine) as session:
        yield session
