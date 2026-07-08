"""Static asset mount + SPA fallback for the single-container HF deployment.

In local development this module is a no-op because the Vite/CRA dev server
handles static assets on a separate port. In production (Docker/HF Spaces),
the multi-stage Dockerfile copies the built frontend into
``backend/app/static`` and this module wires FastAPI to serve it. The SPA
fallback returns ``index.html`` for any non-/api and non-static path so deep
links to client-side routes still work.
"""

from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

logger = logging.getLogger(__name__)

STATIC_DIR = Path(__file__).resolve().parent / "static"


def mount_frontend(app: FastAPI) -> None:
    """Attach static + SPA fallback routes to ``app``.

    MUST be called AFTER every /api router is registered, otherwise the SPA
    catch-all will shadow real API endpoints and every /api call will
    mysteriously return index.html.
    """

    if not STATIC_DIR.exists():
        logger.info("Static frontend directory %s not present — skipping mount.", STATIC_DIR)
        return

    # /static/... assets (JS bundles, CSS, images) served directly.
    assets_dir = STATIC_DIR / "static"
    if assets_dir.exists():
        app.mount("/static", StaticFiles(directory=str(assets_dir)), name="static-assets")

    index_file = STATIC_DIR / "index.html"

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str, request: Request):  # noqa: ARG001
        """Serve the SPA index.html for any non-API, non-static request."""

        # API routes should NEVER hit this handler in practice because we
        # register them first, but we guard defensively — return 404 as JSON
        # instead of index.html in case someone types /api/whatever.
        if full_path.startswith("api/") or full_path == "api":
            return JSONResponse(
                {"error": {"type": "not_found", "message": "Unknown API route"}},
                status_code=404,
            )

        candidate = STATIC_DIR / full_path
        if candidate.is_file():
            return FileResponse(candidate)

        if index_file.exists():
            return FileResponse(index_file)

        return JSONResponse(
            {"error": {"type": "not_found", "message": "Frontend not built"}},
            status_code=404,
        )
