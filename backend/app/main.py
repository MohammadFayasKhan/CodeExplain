"""
CodeExplain ➜ Plain-English Code Tutor
Author ➜ Mohammad Fayas Khan
Purpose ➜ FastAPI application factory and configuration.

FastAPI application factory and global error handling.

The Emergent supervisor imports ``server:app`` at the /app/backend root; that
file re-exports the FastAPI instance defined here.
"""

from __future__ import annotations

import logging
import sys

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api.routes import chat, explain, health, models, quiz
from .config.settings import get_settings
from .core.exceptions import CodeExplainError
from .static import mount_frontend

# ---------------------------------------------------------------------------
# Logging: write structured-ish INFO to stdout so both supervisor and HF
# Spaces capture it in their log pipelines.
# ---------------------------------------------------------------------------
_settings = get_settings()
logging.basicConfig(
    level=getattr(logging, _settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("codeexplain")

app = FastAPI(
    title="CodeExplain API",
    description="Plain-English code tutor backend.",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS. In production the frontend and backend share an origin so we can be
# strict; in dev (Emergent preview or local) they don't, so we honour the
# ALLOWED_ORIGIN env var. "*" is acceptable here because no credentials are
# ever shipped through CORS-protected endpoints.
# ---------------------------------------------------------------------------
allowed = [o.strip() for o in _settings.allowed_origin.split(",") if o.strip()] or ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# API routes. Prefix everything with /api so the ingress can route to the
# backend, and so /api/* is matched BEFORE the SPA fallback mounts.
# ---------------------------------------------------------------------------
app.include_router(explain.router, prefix="/api", tags=["explain"])
app.include_router(quiz.router, prefix="/api", tags=["quiz"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(models.router, prefix="/api", tags=["models"])


# ---------------------------------------------------------------------------
# Global error handlers. Every failure category from Part 13 of the spec ends
# up returning the same envelope shape so the frontend has one code path.
# ---------------------------------------------------------------------------
@app.exception_handler(CodeExplainError)
async def handle_app_error(_request: Request, exc: CodeExplainError) -> JSONResponse:
    logger.warning("App error: %s %s", exc.error_type, exc.message)
    return JSONResponse(
        status_code=exc.http_status,
        content={"error": {"type": exc.error_type, "message": exc.message}},
    )


@app.exception_handler(RequestValidationError)
async def handle_validation(_request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"error": {"type": "invalid_input", "message": "Request body was invalid.", "detail": exc.errors()}},
    )


@app.exception_handler(Exception)
async def handle_uncaught(_request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Uncaught error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "type": "internal_error",
                "message": "Something went wrong on our end. Please try again.",
            }
        },
    )


# ---------------------------------------------------------------------------
# Static/SPA mount goes LAST so it never shadows /api routes.
# ---------------------------------------------------------------------------
mount_frontend(app)
