"""GET /api/models — public list of selectable models for the frontend."""

from __future__ import annotations

from fastapi import APIRouter

from ...config.models_registry import (
    DEFAULT_MODEL_KEY,
    MODEL_REGISTRY,
    PUBLIC_MODEL_ORDER,
)

router = APIRouter()


@router.get("/models")
async def list_models() -> dict:
    """Return the ordered list of user-selectable (provider, model) pairs."""

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
