"""Orchestrates the full generate → parse → validate → repair-retry pipeline
for /api/explain.

This is the single place responsible for taking a code snippet and turning
it into a schema-valid ``ExplanationResponse``. Provider fallback lives here
too — if the primary model fails after retries, we transparently walk the
rest of ``fallback_chain`` before giving up.
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

logger = logging.getLogger(__name__)

# Some models still wrap JSON in ```json ... ``` fences despite instructions.
# We strip them defensively before json.loads.
_FENCE_RE = re.compile(r"^\s*```(?:json)?\s*|\s*```\s*$", re.IGNORECASE | re.MULTILINE)


def _strip_markdown_fences(text: str) -> str:
    """Remove ```json / ``` markers that occasionally sneak into responses."""

    return _FENCE_RE.sub("", text).strip()


def _extract_first_json_object(text: str) -> str:
    """Fallback extractor: return the substring from the first '{' to the last '}'.

    Some models append a short note after the JSON despite instructions. This
    is a last-ditch attempt before we raise a validation error.
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
    """Single provider call plus one repair attempt on validation failure.

    Returns the validated response and the raw text (kept for debugging /
    logging). Raises ``StructuredOutputError`` if the model can't be coaxed
    into producing valid JSON even after the repair attempt.
    """

    provider = get_provider(model_cfg.provider)
    raw = await provider.complete(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        model_id=model_cfg.model_id,
        temperature=model_cfg.temperature_explanation,
        max_tokens=model_cfg.max_tokens,
        expect_json=True,
    )

    cleaned = _strip_markdown_fences(raw)
    try:
        data = json.loads(cleaned)
        return ExplanationResponse.model_validate(data), raw
    except (json.JSONDecodeError, ValidationError) as first_error:
        # Try one heuristic: pull out just the outermost {...} region.
        try:
            data = json.loads(_extract_first_json_object(cleaned))
            return ExplanationResponse.model_validate(data), raw
        except (json.JSONDecodeError, ValidationError):
            pass

        # ONE repair attempt with the same provider, showing it the error.
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
        repaired = _strip_markdown_fences(repair_raw)
        try:
            data = json.loads(repaired)
            return ExplanationResponse.model_validate(data), repair_raw
        except (json.JSONDecodeError, ValidationError):
            data = json.loads(_extract_first_json_object(repaired))
            return ExplanationResponse.model_validate(data), repair_raw


async def generate_explanation(
    *,
    code: str,
    language: str,
    provider: str | None,
    model: str | None,
) -> ExplanationResponse:
    """Top-level entrypoint invoked by the /api/explain route."""

    preferred = resolve_model(provider, model)
    chain = fallback_chain(f"{preferred.provider}:{preferred.model_id}")

    user_prompt = build_user_prompt(code=code, language=language)

    last_error: Exception | None = None
    for candidate in chain:
        try:
            result, _raw = await _call_and_validate(
                model_cfg=candidate,
                system_prompt=SYSTEM_PROMPT,
                user_prompt=user_prompt,
            )
            # Stamp actual provider/model so the frontend can show what ran.
            result.provider_used = candidate.provider
            result.model_used = candidate.model_id
            return result
        except (json.JSONDecodeError, ValidationError) as exc:
            last_error = exc
            logger.warning(
                "Model %s produced malformed output after repair; falling back",
                candidate.model_id,
            )
            continue
        except CodeExplainError as exc:
            last_error = exc
            logger.warning(
                "Model %s errored (%s); falling back to next in chain",
                candidate.model_id,
                exc,
            )
            continue
        except Exception as exc:  # pragma: no cover - defensive
            last_error = exc
            logger.exception("Unexpected error from %s", candidate.model_id)
            continue

    # Every model in the chain failed — surface the most-informative error.
    if isinstance(last_error, (json.JSONDecodeError, ValidationError)):
        raise StructuredOutputError(
            "We couldn't generate a structured explanation for this snippet."
        )
    raise ProviderUnavailableError(
        "AI service is temporarily unavailable. Please try again in a moment."
    )
