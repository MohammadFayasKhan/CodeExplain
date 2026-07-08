"""GET /api/health — cheap liveness endpoint for HF Spaces monitoring.

Deliberately does NOT call any LLM. It only confirms configuration is loaded
and (optionally) that DNS to each provider resolves. Never returns 500 on
provider issues — that would cause Spaces to consider the container dead.
"""

from __future__ import annotations

from fastapi import APIRouter

from ...config.models_registry import MODEL_REGISTRY
from ...config.settings import get_settings

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    """Report status without triggering any LLM generation."""

    try:
        settings = get_settings()
        groq_ready = bool(settings.groq_api_key)
        gemini_ready = bool(settings.gemini_api_key)
    except Exception:  # pragma: no cover - config errors are startup-fatal
        groq_ready = False
        gemini_ready = False

    return {
        "status": "ok",
        "provider_reachable": {"groq": groq_ready, "gemini": gemini_ready},
        "available_models": list(MODEL_REGISTRY.keys()),
    }
