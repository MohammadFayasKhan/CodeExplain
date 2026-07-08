"""POST /api/explain — turn a code snippet into a structured explanation."""

from __future__ import annotations

import logging

from fastapi import APIRouter

from ...core.exceptions import InvalidInputError
from ...models.explanation import ExplanationResponse
from ...models.requests import ExplainRequest
from ...services.explanation_service import generate_explanation

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/explain", response_model=ExplanationResponse)
async def explain_code(payload: ExplainRequest) -> ExplanationResponse:
    """Generate a schema-valid explanation for the submitted code."""

    # Trim then guard against blank/whitespace-only input — Pydantic min_length
    # only catches truly empty strings.
    if not payload.code.strip():
        raise InvalidInputError("Please paste some code to explain.")

    return await generate_explanation(
        code=payload.code,
        language=payload.language,
        provider=payload.provider,
        model=payload.model,
    )
