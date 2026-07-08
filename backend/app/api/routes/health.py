"""
CodeExplain ➜ Plain-English Code Tutor
Author ➜ Mohammad Fayas Khan
Purpose ➜ API endpoint route for health diagnostic checks.

FastAPI Health Check Route.

In production deployments (like Kubernetes, AWS, or Hugging Face Spaces), the hosting
platform periodically sends a ping request to the container to verify it is still
running and healthy. This is called a "Liveness Probe" or "Health Check".

This route handles `GET /api/health`:
1. It is a "cheap" endpoint, meaning it does NOT make slow, expensive API calls
   to Gemini or Groq.
2. It simply verifies that our server settings are successfully loaded and that
   API keys are present.
3. It returns a list of active models configured in our system registry.
"""

from __future__ import annotations

from fastapi import APIRouter

from ...config.models_registry import MODEL_REGISTRY
from ...config.settings import get_settings

# Create a FastAPI APIRouter instance for routing this request endpoint.
# Routers let us organize endpoints in separate files instead of cramming them in main.py.
router = APIRouter()


@router.get("/health")
async def health() -> dict:
    """
    Report backend server status without triggering any expensive LLM calls.
    Returns a JSON dict with liveness parameters.
    """

    try:
        # Load settings. If settings fail to load, we intercept the error and mark
        # ready statuses as False.
        settings = get_settings()
        groq_ready = bool(settings.groq_api_key)
        gemini_ready = bool(settings.gemini_api_key)
    except Exception:
        groq_ready = False
        gemini_ready = False

    # Return a dictionary. FastAPI automatically converts Python dictionaries into
    # valid JSON responses with an 'application/json' content type header.
    return {
        "status": "ok",
        "provider_reachable": {"groq": groq_ready, "gemini": gemini_ready},
        "available_models": list(MODEL_REGISTRY.keys()),
    }
