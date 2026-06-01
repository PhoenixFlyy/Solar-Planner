"""Shared pytest fixtures."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from solar_api.main import app


@pytest.fixture
def client() -> TestClient:
    """A TestClient bound to the FastAPI app (no DB or network needed)."""
    return TestClient(app)
