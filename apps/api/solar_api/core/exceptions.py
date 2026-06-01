"""Domain exceptions and their HTTP translation.

Adapters translate transport errors (``httpx.HTTPStatusError``) into these
domain exceptions; routers stay thin and let the registered handlers map them
to responses. See CLAUDE.md (Python / FastAPI conventions).
"""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class DomainError(Exception):
    """Base class for expected, user-meaningful domain errors."""

    status_code: int = 500
    code: str = "domain_error"

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class UpstreamError(DomainError):
    """An external data source failed or returned an unusable response."""

    status_code = 502
    code = "upstream_error"


class NotFoundError(DomainError):
    """A requested resource (e.g. a building footprint) was not found."""

    status_code = 404
    code = "not_found"


class ValidationDomainError(DomainError):
    """Input was syntactically valid but semantically rejected."""

    status_code = 422
    code = "validation_error"


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def _handle_domain_error(_: Request, exc: DomainError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": exc.code, "message": exc.message}},
        )
