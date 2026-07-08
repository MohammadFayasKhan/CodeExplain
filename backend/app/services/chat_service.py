"""Chat service for /api/chat follow-up questions."""

from __future__ import annotations

import logging

from ..config.models_registry import fallback_chain, resolve_model
from ..core.exceptions import CodeExplainError, ProviderUnavailableError
from ..models.explanation import ExplanationResponse
from ..models.requests import ChatMessage, ChatResponse
from ..prompts.chat_prompt import SYSTEM_PROMPT, build_user_prompt
from ..services.llm import get_provider

logger = logging.getLogger(__name__)


async def answer_followup(
    *,
    code: str,
    language: str,
    explanation: ExplanationResponse,
    history: list[ChatMessage],
    question: str,
    provider: str | None,
    model: str | None,
) -> ChatResponse:
    """Answer one follow-up question about the just-explained code."""

    preferred = resolve_model(provider, model)
    chain = fallback_chain(f"{preferred.provider}:{preferred.model_id}")

    user_prompt = build_user_prompt(
        code=code,
        language=language,
        explanation=explanation,
        history=history,
        question=question,
    )

    last_error: Exception | None = None
    for candidate in chain:
        try:
            llm = get_provider(candidate.provider)
            answer = await llm.complete(
                system_prompt=SYSTEM_PROMPT,
                user_prompt=user_prompt,
                model_id=candidate.model_id,
                temperature=candidate.temperature_chat,
                max_tokens=candidate.max_tokens,
                expect_json=False,
            )
            answer_text = (answer or "").strip()
            if not answer_text:
                # Empty response is functionally a failure — try the next model.
                raise ProviderUnavailableError("Empty response")

            return ChatResponse(
                answer=answer_text,
                provider_used=candidate.provider,
                model_used=candidate.model_id,
            )
        except CodeExplainError as exc:
            last_error = exc
            logger.warning("Chat provider %s errored (%s)", candidate.model_id, exc)
            continue

    raise ProviderUnavailableError(
        str(last_error) if last_error else "AI service unavailable"
    )
