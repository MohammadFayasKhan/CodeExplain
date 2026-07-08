"""Quiz generation orchestration for /api/quiz."""

from __future__ import annotations

import json
import logging
import re
import uuid

from pydantic import ValidationError

from ..config.models_registry import fallback_chain, resolve_model
from ..core.exceptions import (
    CodeExplainError,
    ProviderUnavailableError,
    StructuredOutputError,
)
from ..models.explanation import ExplanationResponse
from ..models.quiz import QuizQuestion, QuizResponse
from ..prompts.quiz_prompt import SYSTEM_PROMPT, build_user_prompt
from ..services.llm import get_provider

logger = logging.getLogger(__name__)

_FENCE_RE = re.compile(r"^\s*```(?:json)?\s*|\s*```\s*$", re.IGNORECASE | re.MULTILINE)


def _strip(text: str) -> str:
    return _FENCE_RE.sub("", text).strip()


def _extract_first_json_object(text: str) -> str:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return text
    return text[start : end + 1]


def _ensure_ids(questions: list[QuizQuestion]) -> list[QuizQuestion]:
    """Guarantee every question has a unique, stable-looking id."""

    seen: set[str] = set()
    result: list[QuizQuestion] = []
    for i, q in enumerate(questions, start=1):
        qid = q.id or f"q{i}"
        while qid in seen:
            qid = f"q{i}-{uuid.uuid4().hex[:4]}"
        seen.add(qid)
        result.append(q.model_copy(update={"id": qid}))
    return result


async def generate_quiz(
    *,
    code: str,
    language: str,
    explanation: ExplanationResponse,
    provider: str | None,
    model: str | None,
    previous_questions: list[str] | None = None,
) -> QuizResponse:
    """Generate 3-5 quiz questions grounded in the submitted code."""

    preferred = resolve_model(provider, model)
    chain = fallback_chain(f"{preferred.provider}:{preferred.model_id}")

    user_prompt = build_user_prompt(
        code=code,
        language=language,
        explanation=explanation,
        previous_questions=previous_questions or [],
    )

    last_error: Exception | None = None
    for candidate in chain:
        try:
            llm = get_provider(candidate.provider)
            raw = await llm.complete(
                system_prompt=SYSTEM_PROMPT,
                user_prompt=user_prompt,
                model_id=candidate.model_id,
                temperature=candidate.temperature_explanation,
                max_tokens=candidate.max_tokens,
                expect_json=True,
            )
            cleaned = _strip(raw)
            try:
                data = json.loads(cleaned)
            except json.JSONDecodeError:
                data = json.loads(_extract_first_json_object(cleaned))

            parsed = QuizResponse.model_validate(data)
            parsed.questions = _ensure_ids(parsed.questions)

            # Empty list is a legitimate "no unique questions remain" signal
            # when the caller passed previous_questions. Return it as-is; the
            # frontend surfaces a friendly "all unique questions exhausted"
            # message rather than treating it as an error.
            if len(parsed.questions) == 0:
                return parsed

            # Enforce the 3-5 bound the spec requires. Trim or reject softly.
            if len(parsed.questions) < 3:
                raise ValidationError.from_exception_data(
                    "QuizResponse", [{"type": "value_error", "loc": ("questions",), "msg": "need >=3", "input": parsed.questions}]  # type: ignore[arg-type]
                )
            if len(parsed.questions) > 5:
                parsed.questions = parsed.questions[:5]

            return parsed
        except (json.JSONDecodeError, ValidationError) as exc:
            last_error = exc
            logger.warning("Quiz from %s malformed; falling back", candidate.model_id)
            continue
        except CodeExplainError as exc:
            last_error = exc
            logger.warning("Quiz provider %s errored (%s); falling back", candidate.model_id, exc)
            continue

    if isinstance(last_error, (json.JSONDecodeError, ValidationError)):
        raise StructuredOutputError("We couldn't generate a quiz for this snippet.")
    raise ProviderUnavailableError("AI service is temporarily unavailable.")
