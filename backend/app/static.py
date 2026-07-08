"""
CodeExplain ➜ Plain-English Code Tutor
Author ➜ Mohammad Fayas Khan
Purpose ➜ Serves frontend static files and handles Single Page App (SPA) routing fallbacks.

Static Asset Mount and Single Page Application (SPA) Router Fallback.

When we deploy this project to production (using Docker or Hugging Face Spaces),
both our FastAPI backend and React frontend run inside the same container.
To make this work:
1. We run the React build process which produces static files (HTML, CSS, JS) under
   the `frontend/build` folder.
2. We copy those files into `backend/app/static`.
3. This Python module instructs FastAPI to serve those static files so users can load
   the web UI directly through our backend port.
4. We set up an SPA fallback route so that if a user deep-links to '/about', FastAPI
   will send back the main 'index.html' instead of a 404, allowing React Router to
   take over navigation in the browser.

In local development, this module is skipped because we run a separate hot-reloading
Vite/React dev server on port 3000.
"""

from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

# Setup logging so we can track static mounting events in stdout
logger = logging.getLogger("codeexplain.static")

# 'Path(__file__)' returns the absolute file path of this script (static.py).
# '.resolve()' resolves any symlinks to find the true path.
# '.parent' moves up one directory to the 'app' folder.
# We join it with 'static' to locate the folder containing the compiled React assets.
STATIC_DIR = Path(__file__).resolve().parent / "static"


def mount_frontend(app: FastAPI) -> None:
    """
    Mount the compiled React frontend static files and SPA fallback to the FastAPI instance.

    CRITICAL NOTE: This function MUST be called at the very end of our FastAPI startup,
    AFTER all API routes (like /api/explain, /api/quiz, etc.) have been registered.
    If we register this fallback handler first, its catch-all route wildcard (*path)
    will capture every request, blocking all API endpoints and causing them to
    mistakenly return index.html instead of executing backend queries!
    """

    # Check if the static files folder exists. If it doesn't, it means we are running
    # in local development mode or we forgot to build the frontend. We skip mounting safely.
    if not STATIC_DIR.exists():
        logger.info("Static frontend directory %s not present: skipping mount.", STATIC_DIR)
        return

    # '/static/...' assets represent JavaScript bundles, CSS stylesheets, icons, and logo images.
    # We serve these files directly from disk using FastAPI's built-in StaticFiles middleware.
    assets_dir = STATIC_DIR / "static"
    if assets_dir.exists():
        app.mount("/static", StaticFiles(directory=str(assets_dir)), name="static-assets")

    # Path pointing to the main compiled frontend single-page file 'index.html'.
    index_file = STATIC_DIR / "index.html"

    # Catch-all route handler. This handles any GET request that did NOT match any of
    # our previously registered API routes or static asset directories.
    # 'include_in_schema=False' tells FastAPI to hide this fallback route from the Swagger API docs.
    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str, request: Request):  # noqa: ARG001
        """
        Serves the SPA React index.html for any client-side routes (e.g. /about or /dashboard).
        """

        # Safeguard: If the request is trying to call an API path (begins with /api), but got here,
        # it means the API route was misspelled or does not exist. We return a JSON 404 error
        # instead of index.html to help the frontend developer troubleshoot.
        if full_path.startswith("api/") or full_path == "api":
            return JSONResponse(
                {"error": {"type": "not_found", "message": "Unknown API route"}},
                status_code=404,
            )

        # If the user requested a specific file that actually exists in our static directory,
        # serve it directly. (For example: manifest.json, favicon.ico, etc.)
        candidate = STATIC_DIR / full_path
        if candidate.is_file():
            return FileResponse(candidate)

        # Fallback: Send the main index.html file so the user loads the app, and the
        # React router inside the user's browser takes care of displaying the correct page content.
        if index_file.exists():
            return FileResponse(index_file)

        # If all else fails and we have no index.html, return a 404 JSON response.
        return JSONResponse(
            {"error": {"type": "not_found", "message": "Frontend not built"}},
            status_code=404,
        )
