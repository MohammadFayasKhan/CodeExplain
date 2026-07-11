"""
CodeExplain ➜ Plain-English Code Tutor
Author ➜ Mohammad Fayas Khan
Purpose ➜ Service module for generating step-by-step custom execution traces.
"""

from __future__ import annotations

import json
import logging
import re

from pydantic import BaseModel, Field, ValidationError

from ..config.models_registry import ModelConfig, fallback_chain, resolve_model
from ..core.exceptions import (
    CodeExplainError,
    ProviderUnavailableError,
    StructuredOutputError,
)
from ..models.explanation import TraceStep
from ..prompts.explanation_prompt import (
    VISUALIZE_SYSTEM_PROMPT,
    REPAIR_SYSTEM_PROMPT,
    build_repair_user_prompt,
    build_visualize_user_prompt,
)
from ..services.llm import get_provider

logger = logging.getLogger("codeexplain.services.visualization")

_FENCE_RE = re.compile(r"^\s*```(?:json)?\s*|\s*```\s*$", re.IGNORECASE | re.MULTILINE)


class CustomInputTraceResponse(BaseModel):
    output: str = Field(..., description="The predicted output of the code")
    steps: list[TraceStep] = Field(..., description="Step-by-step execution steps")


def _strip_markdown_fences(text: str) -> str:
    return _FENCE_RE.sub("", text).strip()


def _extract_first_json_object(text: str) -> str:
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
) -> tuple[CustomInputTraceResponse, str]:
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
        return CustomInputTraceResponse.model_validate(data), raw
    except (json.JSONDecodeError, ValidationError) as first_error:
        try:
            data = json.loads(_extract_first_json_object(cleaned))
            return CustomInputTraceResponse.model_validate(data), raw
        except (json.JSONDecodeError, ValidationError):
            pass

        logger.warning(
            "Visualization trace from %s failed validation, attempting repair: %s",
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
            return CustomInputTraceResponse.model_validate(data), repair_raw
        except (json.JSONDecodeError, ValidationError):
            data = json.loads(_extract_first_json_object(repaired))
            return CustomInputTraceResponse.model_validate(data), repair_raw


async def generate_custom_trace(
    *,
    code: str,
    language: str,
    custom_input: str,
    provider: str | None,
    model: str | None,
) -> CustomInputTraceResponse:
    preferred = resolve_model(provider, model)
    chain = fallback_chain(f"{preferred.provider}:{preferred.model_id}")

    user_prompt = build_visualize_user_prompt(
        code=code,
        language=language,
        custom_input=custom_input,
    )

    last_error: Exception | None = None

    for candidate in chain:
        try:
            result, _raw = await _call_and_validate(
                model_cfg=candidate,
                system_prompt=VISUALIZE_SYSTEM_PROMPT,
                user_prompt=user_prompt,
            )
            return result

        except (json.JSONDecodeError, ValidationError) as exc:
            last_error = exc
            logger.warning(
                "Model %s produced malformed trace output after repair; falling back",
                candidate.model_id,
            )
            continue
        except CodeExplainError as exc:
            last_error = exc
            logger.warning(
                "Model %s trace call errored (%s); falling back",
                candidate.model_id,
                exc,
            )
            continue
        except Exception as exc:
            last_error = exc
            logger.exception("Unexpected trace error from %s", candidate.model_id)
            continue

    if isinstance(last_error, (json.JSONDecodeError, ValidationError)):
        raise StructuredOutputError(
            "We couldn't generate a structured execution trace for this input."
        )
    raise ProviderUnavailableError(
        "AI service is temporarily unavailable. Please try again in a moment."
    )
