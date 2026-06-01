"""SQLModel ORM models. Mirrors the Dexie schema (see ADR-0002) as the
backend grows; for Sprint 0 only the User table exists.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    """An optional account (anon-first; accounts are created later for sync).

    Note: ``email`` is PII — never log it (see CLAUDE.md common pitfalls).
    """

    __tablename__ = "user"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(index=True, unique=True)
    created_at: datetime = Field(default_factory=_utcnow, nullable=False)
