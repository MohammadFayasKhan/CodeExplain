# ==============================================================================
# CodeLearn - Summer Training Internship Project (LPU submission candidate)
# Developed by: Mohammad Fayas Khan (BTech CSE 3rd Year student)
# File: backend/app/api/routes/models.py
# Purpose: API route serving available LLM models for frontend selector menus.
# ==============================================================================

"""
FastAPI Models Registry Router.

This route handles `GET /api/models`:
1. The frontend editor UI features a dropdown select menu showing available AI models
   (e.g., Llama 3 70B, Gemini 1.5 Flash).
2. Instead of hardcoding this list on the frontend, the frontend calls this endpoint.
3. If we update our supported models in the backend `models_registry.py` file,
   the frontend UI updates automatically, ensuring consistency.
"""

from __future__ import annotations

from fastapi import APIRouter

from ...config.models_registry import (
    DEFAULT_MODEL_KEY,
    MODEL_REGISTRY,
    PUBLIC_MODEL_ORDER,
)

# Initialize the router instance
router = APIRouter()


@router.get("/models")
async def list_models() -> dict:
    """
    Return the list of user-selectable AI model configuration pairs.
    """

    # We map keys in our ordered public list to the detailed models list.
    # We use a Python list comprehension to iterate through public keys, filter out
    # any unregistered keys, and extract the display name and model identifiers.
    return {
        "default": DEFAULT_MODEL_KEY,
        "models": [
            {
                "key": key,
                "provider": MODEL_REGISTRY[key].provider,
                "model_id": MODEL_REGISTRY[key].model_id,
                "display_name": MODEL_REGISTRY[key].display_name,
            }
            for key in PUBLIC_MODEL_ORDER
            if key in MODEL_REGISTRY
        ],
    }
