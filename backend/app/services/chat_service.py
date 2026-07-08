# ==============================================================================
# CodeExplain - Summer Training Internship Project (LPU submission candidate)
# Developed by: Mohammad Fayas Khan (BTech CSE 3rd Year student)
# File: backend/app/services/chat_service.py
# Purpose: Orchestrates follow-up chat completions with model fallback routing.
# ==============================================================================

"""
Follow-Up Chat completions Orchestration Service.

When users interact with the chat panel to ask questions about their code snippet,
the backend must provide highly accurate, contextual answers.

Key features of this service:
1. Context Packaging: LLMs are stateless by design. They don't remember previous queries.
   To make conversational follow-ups work, we must package the user's code, the original explanation,
   and the entire message history into the user prompt.
2. Robust Fallback Chains: If the primary selected model is rate-limited or offline,
   this service automatically iterates through fallback models in the registry (e.g., trying Groq Llama,
   then falling back to Google Gemini) before raising a user-facing error.
"""

from __future__ import annotations

import logging

from ..config.models_registry import fallback_chain, resolve_model
from ..core.exceptions import CodeExplainError, ProviderUnavailableError
from ..models.explanation import ExplanationResponse
from ..models.requests import ChatMessage, ChatResponse
from ..prompts.chat_prompt import SYSTEM_PROMPT, build_user_prompt
from ..services.llm import get_provider

# Setup logger to trace service transitions
logger = logging.getLogger("codeexplain.services.chat")


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
    """
    Generate an answer for a follow-up user question about the code snippet.

    Parameters:
      - code (str): The original source code snippet in the editor.
      - language (str): Programming language.
      - explanation (ExplanationResponse): Original structural code explanation.
      - history (list[ChatMessage]): Message history list tracking previous user/assistant messages.
      - question (str): The new question typed by the user.
      - provider (str | None): Preferred provider identifier (optional).
      - model (str | None): Preferred model identifier (optional).

    Returns:
      - ChatResponse: Pydantic model response wrapper.
    """

    # Resolve which model configuration is selected. If none is specified,
    # we default to our primary fallback models.
    preferred = resolve_model(provider, model)

    # Fetch the fallback chain list of candidate model records.
    # E.g., if Llama is preferred, the list might be: [Llama, Gemini].
    chain = fallback_chain(f"{preferred.provider}:{preferred.model_id}")

    # Build a combined user prompt context containing the code, original walkthrough,
    # chat history logs, and the current question.
    user_prompt = build_user_prompt(
        code=code,
        language=language,
        explanation=explanation,
        history=history,
        question=question,
    )

    # Keep track of the last error encountered during our loop attempts
    last_error: Exception | None = None

    # Iterate through candidates in the fallback chain to resolve the completion request.
    for candidate in chain:
        try:
            # Load the concrete LLM provider instance from our factory
            llm = get_provider(candidate.provider)

            # Call the LLM provider's complete method asynchronously
            answer = await llm.complete(
                system_prompt=SYSTEM_PROMPT,
                user_prompt=user_prompt,
                model_id=candidate.model_id,
                temperature=candidate.temperature_chat,
                max_tokens=candidate.max_tokens,
                expect_json=False,  # Conversational chat outputs don't need JSON structures
            )

            # Clean and trim the text response
            answer_text = (answer or "").strip()

            # If the response is blank, consider this attempt a failure and try the next candidate
            if not answer_text:
                raise ProviderUnavailableError("Empty response")

            # Successfully completed! Return the answer along with metadata about
            # which model and provider ended up resolving the query.
            return ChatResponse(
                answer=answer_text,
                provider_used=candidate.provider,
                model_used=candidate.model_id,
            )
        except CodeExplainError as exc:
            # Capture the error and log it. We continue the loop to try the next model.
            last_error = exc
            logger.warning("Chat provider %s errored (%s)", candidate.model_id, exc)
            continue

    # If the loop exhausts the entire fallback chain without returning a valid answer,
    # raise a ProviderUnavailableError detailing the failure.
    raise ProviderUnavailableError(
        str(last_error) if last_error else "AI service unavailable"
    )
