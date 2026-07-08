# ==============================================================================
# CodeLearn - Summer Training Internship Project (LPU submission candidate)
# Developed by: Mohammad Fayas Khan (BTech CSE 3rd Year student)
# File: backend/app/services/explanation_service.py
# Purpose: Core service orchestrating code explanation generation and self-healing.
# ==============================================================================

"""
Code Explanation Generation and AI Self-Healing Orchestration.

This module acts as the core controller for our explanation pipeline.
It handles the full:
  Generate -> Clean -> Parse -> Validate -> Repair (Self-Heal) -> Fallback flow.

Key details:
1. Double-Tiered Parsing: We clean Markdown fences and extract outer braces as a baseline.
2. Self-Healing (Repair) Pattern: If the LLM generates a JSON string that violates our
   Pydantic schema (e.g. missing fields, wrong types), we send a fast "repair request"
   to the provider. We feed it the invalid output and the exact validation error message,
   asking it to repair the structure (at temperature = 0.0 for maximum accuracy).
3. Fallback Walk: If a provider continues to output malformed content or times out,
   we loop through alternative models in the fallback chain.
"""

from __future__ import annotations

import json
import logging
import re

from pydantic import ValidationError

from ..config.models_registry import ModelConfig, fallback_chain, resolve_model
from ..core.exceptions import (
    CodeExplainError,
    ProviderUnavailableError,
    StructuredOutputError,
)
from ..models.explanation import ExplanationResponse
from ..prompts.explanation_prompt import (
    SYSTEM_PROMPT,
    REPAIR_SYSTEM_PROMPT,
    build_repair_user_prompt,
    build_user_prompt,
)
from ..services.llm import get_provider

# Setup logger to trace explanation pipelines
logger = logging.getLogger("codeexplain.services.explanation")

# Regex to find and remove markdown json code block fences (e.g. ```json ... ```)
_FENCE_RE = re.compile(r"^\s*```(?:json)?\s*|\s*```\s*$", re.IGNORECASE | re.MULTILINE)


def _strip_markdown_fences(text: str) -> str:
    """
    Remove Markdown code block fences (```json or ```) that might wrap the JSON response.
    """
    return _FENCE_RE.sub("", text).strip()


def _extract_first_json_object(text: str) -> str:
    """
    Isolate the JSON object block by finding the first '{' and the last '}' characters.
    Helps salvage responses that contain extra greeting/trailing conversational notes.
    """
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return text
    return text[start : end + 1]


async def _call_and_validate(
    *,
    model_cfg: ModelConfig,
    system_prompt: str,
    user_prompt: str,
) -> tuple[ExplanationResponse, str]:
    """
    Execute a single provider API call, complete with a self-healing repair attempt.

    Parameters:
      - model_cfg (ModelConfig): Registry configuration record of the active model.
      - system_prompt (str): Directive setting the AI behavior/persona.
      - user_prompt (str): User code input and format guidelines.

    Returns:
      - tuple[ExplanationResponse, str]: The validated response object and the raw text output.
    """

    # Fetch provider from factory
    provider = get_provider(model_cfg.provider)

    # Perform the asynchronous LLM generation call
    raw = await provider.complete(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        model_id=model_cfg.model_id,
        temperature=model_cfg.temperature_explanation,
        max_tokens=model_cfg.max_tokens,
        expect_json=True,  # Request structured JSON format
    )

    # Clean code blocks
    cleaned = _strip_markdown_fences(raw)
    try:
        # Step 1: Attempt standard JSON parse
        data = json.loads(cleaned)
        # Validate data against Pydantic schema
        return ExplanationResponse.model_validate(data), raw
    except (json.JSONDecodeError, ValidationError) as first_error:
        # Step 2: Fallback attempt. Extract only the outer brace content and try parsing again.
        try:
            data = json.loads(_extract_first_json_object(cleaned))
            return ExplanationResponse.model_validate(data), raw
        except (json.JSONDecodeError, ValidationError):
            # If both parser attempts fail, we proceed to self-healing repair logic.
            pass

        # -----------------------------------------------------------------------
        # Self-Healing Repair Attempt (Retry loop phase):
        # We send a request to the SAME model containing the invalid text output
        # along with the exact Pydantic/JSON error message.
        # We set temperature to 0.0 to make it strictly adhere to rules.
        # -----------------------------------------------------------------------
        logger.warning(
            "Explanation from %s failed validation, attempting repair: %s",
            model_cfg.model_id,
            first_error,
        )
        repair_raw = await provider.complete(
            system_prompt=REPAIR_SYSTEM_PROMPT,
            user_prompt=build_repair_user_prompt(
                raw_output=raw,
                error_message=str(first_error),
            ),
            model_id=model_cfg.model_id,
            temperature=0.0,
            max_tokens=model_cfg.max_tokens,
            expect_json=True,
        )

        # Clean the repair response
        repaired = _strip_markdown_fences(repair_raw)
        try:
            # Parse repaired JSON
            data = json.loads(repaired)
            return ExplanationResponse.model_validate(data), repair_raw
        except (json.JSONDecodeError, ValidationError):
            # Final fallback: extract braces on repaired content
            data = json.loads(_extract_first_json_object(repaired))
            return ExplanationResponse.model_validate(data), repair_raw


async def generate_explanation(
    *,
    code: str,
    language: str,
    provider: str | None,
    model: str | None,
) -> ExplanationResponse:
    """
    Top-level API entrypoint called by the explanation routes to explain code snippets.
    """

    # Resolve active model config and look up the fallback list chain
    preferred = resolve_model(provider, model)
    chain = fallback_chain(f"{preferred.provider}:{preferred.model_id}")

    # Build the initial prompt context
    user_prompt = build_user_prompt(code=code, language=language)

    last_error: Exception | None = None

    # Loop through the fallback list of model configurations
    for candidate in chain:
        try:
            # Attempt to execute generation and validation (includes repair loop)
            result, _raw = await _call_and_validate(
                model_cfg=candidate,
                system_prompt=SYSTEM_PROMPT,
                user_prompt=user_prompt,
            )

            # Record metrics detailing which provider and model resolved the explanation.
            # This is displayed on the frontend badges.
            result.provider_used = candidate.provider
            result.model_used = candidate.model_id
            return result

        except (json.JSONDecodeError, ValidationError) as exc:
            # Catch parsing errors, log a warning, and try next fallback candidate
            last_error = exc
            logger.warning(
                "Model %s produced malformed output after repair; falling back",
                candidate.model_id,
            )
            continue
        except CodeExplainError as exc:
            # Catch connection/rate-limit errors and advance fallback
            last_error = exc
            logger.warning(
                "Model %s errored (%s); falling back to next in chain",
                candidate.model_id,
                exc,
            )
            continue
        except Exception as exc:
            # Catch general unanticipated errors
            last_error = exc
            logger.exception("Unexpected error from %s", candidate.model_id)
            continue

    # If all models in the fallback chain failed, raise appropriate custom exception
    if isinstance(last_error, (json.JSONDecodeError, ValidationError)):
        raise StructuredOutputError(
            "We couldn't generate a structured explanation for this snippet."
        )
    raise ProviderUnavailableError(
        "AI service is temporarily unavailable. Please try again in a moment."
    )
