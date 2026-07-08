# ==============================================================================
# CodeLearn - Summer Training Internship Project (LPU submission candidate)
# Developed by: Mohammad Fayas Khan (BTech CSE 3rd Year student)
# File: backend/app/services/quiz_service.py
# Purpose: Orchestrates quiz question generation, validation, and JSON cleaning.
# ==============================================================================

"""
Quiz Generation Orchestrator Service.

This service is responsible for generating multiple-choice comprehension questions
grounded in the user's submitted code snippet and original explanation.

Key engineering features in this module:
1. Regex-Based Code Fence Stripping: Even when LLMs are set to JSON output mode, they
   occasionally wrap their response inside Markdown fences (e.g. ```json ... ```).
   We use regular expressions to clean these fences before feeding them to JSON parsers.
2. Robust Outer Brace Extraction: If the LLM wraps the JSON in extra greeting text,
   we locate the first '{' and last '}' characters to isolate and parse the raw JSON string.
3. ID Stabilization: We iterate over generated questions and guarantee each has a unique,
   stable-looking identifier (using UUID strings to prevent collisions), which helps
   React render list elements correctly.
4. Validation Boundaries: We validate that the returned list of questions contains
   between 3 and 5 items, raising validation errors to trigger fallbacks if bounds are violated.
"""

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

# Setup logger to trace execution flows
logger = logging.getLogger("codeexplain.services.quiz")

# Regex compiler to locate and strip markdown code fences (```json or ```)
# - ^\s*```(?:json)?\s*: Matches standard opening code fence blocks.
# - \s*```\s*$: Matches closing code fence blocks.
# - re.IGNORECASE | re.MULTILINE: Ignores text case and parses multi-line response blocks.
_FENCE_RE = re.compile(r"^\s*```(?:json)?\s*|\s*```\s*$", re.IGNORECASE | re.MULTILINE)


def _strip(text: str) -> str:
    """
    Remove standard Markdown code block wrap syntax fences from the output string.
    """
    return _FENCE_RE.sub("", text).strip()


def _extract_first_json_object(text: str) -> str:
    """
    Locates the outermost '{' and '}' characters to isolate the primary JSON object.
    Used as a fallback if the LLM includes introductory conversational text.
    """
    start = text.find("{")
    end = text.rfind("}")
    # If opening/closing braces are missing or misaligned, return the original text
    if start == -1 or end == -1 or end <= start:
        return text
    # Slice the string to return only the content between the braces
    return text[start : end + 1]


def _ensure_ids(questions: list[QuizQuestion]) -> list[QuizQuestion]:
    """
    Guarantee that every question object has a unique, stable-looking identifier.
    Helps the frontend React key reconciliation engine map lists without re-rendering logs.
    """
    seen: set[str] = set()
    result: list[QuizQuestion] = []

    # Loop through the list of questions, keeping track of the index (1-indexed)
    for i, q in enumerate(questions, start=1):
        # Default to the existing ID, or assign a default index-based string 'q1', 'q2'
        qid = q.id or f"q{i}"
        # If the ID is already taken by another question, generate a unique random suffix
        while qid in seen:
            qid = f"q{i}-{uuid.uuid4().hex[:4]}"
        seen.add(qid)
        # Duplicate the question record and update its ID field using Pydantic's model_copy
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
    """
    Generate 3-5 quiz questions grounded in the submitted code snippet.

    Parameters:
      - code (str): User's source code.
      - language (str): Language identifier.
      - explanation (ExplanationResponse): Original code explanation context.
      - provider (str | None): Preferred LLM provider name.
      - model (str | None): Preferred LLM model name.
      - previous_questions (list[str] | None): History tracking already generated questions to avoid repeats.

    Returns:
      - QuizResponse: A list of unique MCQs.
    """

    # Resolve the active model and lookup the candidate provider fallback chain
    preferred = resolve_model(provider, model)
    chain = fallback_chain(f"{preferred.provider}:{preferred.model_id}")

    # Build the user prompt context containing the code, walkthrough, and previous questions
    user_prompt = build_user_prompt(
        code=code,
        language=language,
        explanation=explanation,
        previous_questions=previous_questions or [],
    )

    last_error: Exception | None = None

    # Loop through candidates in the fallback chain to process the request
    for candidate in chain:
        try:
            # Instantiate the matching provider from our factory
            llm = get_provider(candidate.provider)

            # Send the prompts and request a structured JSON string response
            raw = await llm.complete(
                system_prompt=SYSTEM_PROMPT,
                user_prompt=user_prompt,
                model_id=candidate.model_id,
                temperature=candidate.temperature_explanation,
                max_tokens=candidate.max_tokens,
                expect_json=True,  # Request structured JSON format
            )

            # Strip markdown code blocks
            cleaned = _strip(raw)
            try:
                # Attempt to parse the raw text as JSON
                data = json.loads(cleaned)
            except json.JSONDecodeError:
                # Fallback: Isolate the JSON block using brace coordinates and try parsing again
                data = json.loads(_extract_first_json_object(cleaned))

            # Validate the parsed dictionary structure against our QuizResponse Pydantic model
            parsed = QuizResponse.model_validate(data)

            # Populate stability IDs on each generated question
            parsed.questions = _ensure_ids(parsed.questions)

            # If the list is empty, it means no unique questions are left.
            # We return this directly and let the frontend show a completion message.
            if len(parsed.questions) == 0:
                return parsed

            # Enforce project bounds: minimum 3 questions
            if len(parsed.questions) < 3:
                # Trigger a validation error manually to force fallback retry routing
                raise ValidationError.from_exception_data(
                    "QuizResponse",
                    [{"type": "value_error", "loc": ("questions",), "msg": "need >=3", "input": parsed.questions}]  # type: ignore[arg-type]
                )

            # Enforce project bounds: maximum 5 questions (slice any extra)
            if len(parsed.questions) > 5:
                parsed.questions = parsed.questions[:5]

            # Success! Return the validated QuizResponse
            return parsed

        except (json.JSONDecodeError, ValidationError) as exc:
            # Catch formatting or schema errors, record them, and advance to next candidate model
            last_error = exc
            logger.warning("Quiz from %s malformed; falling back", candidate.model_id)
            continue
        except CodeExplainError as exc:
            # Catch connection/rate-limit exceptions, record them, and try backup candidates
            last_error = exc
            logger.warning("Quiz provider %s errored (%s); falling back", candidate.model_id, exc)
            continue

    # If the chain is completely exhausted without success, raise appropriate custom exception
    if isinstance(last_error, (json.JSONDecodeError, ValidationError)):
        raise StructuredOutputError("We couldn't generate a quiz for this snippet.")
    raise ProviderUnavailableError("AI service is temporarily unavailable.")
