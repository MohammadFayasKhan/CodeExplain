# ==============================================================================
# CodeExplain - Summer Training Internship Project (LPU submission candidate)
# Developed by: Mohammad Fayas Khan (BTech CSE 3rd Year student)
# File: backend/app/api/routes/explain.py
# Purpose: POST API router handling code explanation generations.
# ==============================================================================

"""
FastAPI Explanation Router.

This route handles `POST /api/explain`:
1. It receives a JSON payload `ExplainRequest` containing the user's code snippet
   and language identifier.
2. It validates the code payload inputs (throwing `InvalidInputError` if empty).
3. It passes details to `generate_explanation(...)` inside our service layer.
4. The service prompts the LLM to analyze the code, outputting a structured format
   (overview, plain-english breakdown, complexity stats, line-by-line walk).
5. It serializes and returns the final payload matching `ExplanationResponse`.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter

from ...core.exceptions import InvalidInputError
from ...models.explanation import ExplanationResponse
from ...models.requests import ExplainRequest
from ...services.explanation_service import generate_explanation

# Setup logger
logger = logging.getLogger("codeexplain.api.explain")

# Initialize APIRouter
router = APIRouter()


@router.post("/explain", response_model=ExplanationResponse)
async def explain_code(payload: ExplainRequest) -> ExplanationResponse:
    """
    Generate a validated structural code explanation for the submitted snippet.
    """
    # Validation: Pydantic's min_length checks if a string is empty, but we want
    # to catch strings that only contain whitespaces or tabs. We use .strip() to trim
    # the code and verify it is not empty.
    if not payload.code.strip():
        # Raise error, generating 422 HTTP response
        raise InvalidInputError("Please paste some code to explain.")

    # Call the async service module. 'await' suspends execution while waiting for the LLM
    # call to complete, allowing FastAPI to handle other incoming requests in the meantime.
    return await generate_explanation(
        code=payload.code,
        language=payload.language,
        provider=payload.provider,
        model=payload.model,
    )
