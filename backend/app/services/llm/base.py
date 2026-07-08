"""Provider-agnostic contract for LLM text generation.

Every concrete provider (Groq, Gemini) implements ``BaseLLMProvider.complete``.
The orchestration layer never imports Groq or Gemini directly — it only ever
sees this interface.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class BaseLLMProvider(ABC):
    """Abstract base class every LLM provider must implement."""

    name: str  # e.g. "groq", "gemini"

    @abstractmethod
    async def complete(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        model_id: str,
        temperature: float,
        max_tokens: int,
        expect_json: bool,
    ) -> str:
        """Send a system+user prompt pair to the provider and return raw text.

        The concrete implementation is responsible for retries, timeouts, and
        translating any provider-specific error into a subclass of
        ``CodeExplainError`` from ``core.exceptions``. The caller trusts that
        an exception raised from here is already well-typed.
        """

        raise NotImplementedError
