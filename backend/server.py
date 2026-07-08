"""Supervisor / uvicorn entrypoint.

The Emergent supervisor runs ``uvicorn server:app``. This file exists solely
to expose the FastAPI ``app`` object defined in ``app.main`` under the module
name ``server`` — keeping the real application code in a package.
"""

from app.main import app  # noqa: F401  (re-exported)

__all__ = ["app"]
