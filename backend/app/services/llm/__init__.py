"""LLM provider package."""

from .base import BaseLLMProvider
from .gemini_provider import GeminiProvider
from .groq_provider import GroqProvider


def get_provider(name: str) -> BaseLLMProvider:
    """Factory: return a provider instance by short name.

    We deliberately create a fresh instance per call because the providers
    hold no per-request state — this keeps things easy to reason about.
    """

    if name == "groq":
        return GroqProvider()
    if name == "gemini":
        return GeminiProvider()
    raise ValueError(f"Unknown provider: {name}")


__all__ = ["BaseLLMProvider", "get_provider"]
