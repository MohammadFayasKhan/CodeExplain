# ==============================================================================
# CodeLearn - Summer Training Internship Project (LPU submission candidate)
# Developed by: Mohammad Fayas Khan (BTech CSE 3rd Year student)
# File: backend/app/services/llm/__init__.py
# Purpose: Package initializer exposing LLM providers and the provider Factory.
# ==============================================================================

"""
LLM Provider Package Initializer.

In Python, folders containing an `__init__.py` file are treated as modules/packages.
This allows us to control what internal classes are exposed when other parts of the application
write `import app.services.llm`.

This file:
1. Imports the abstract base contract and concrete provider implementations.
2. Implements a "Factory Method" design pattern called `get_provider(name)`.
   - The Factory Pattern is a creational pattern that abstracts the instantiation process.
   - High-level orchestrators simply call `get_provider("groq")` to get a ready-to-use provider,
     saving them from needing to import each provider subclass directly.
"""

from .base import BaseLLMProvider
from .gemini_provider import GeminiProvider
from .groq_provider import GroqProvider


def get_provider(name: str) -> BaseLLMProvider:
    """
    Factory: returns a concrete LLM provider instance matching the given short name.

    Parameters:
      - name (str): The provider name identifier ("groq" or "gemini").

    Returns:
      - BaseLLMProvider: An instantiated concrete provider ready to make requests.
    """

    # Check the name parameter and instantiate the matching subclass.
    # We create a fresh instance per call. Because these provider classes don't store
    # state data (they are stateless), creating fresh instances is fast and keeps execution safe.
    if name == "groq":
        return GroqProvider()
    if name == "gemini":
        return GeminiProvider()

    # If the user asks for a provider we haven't implemented yet, raise a ValueError
    raise ValueError(f"Unknown provider: {name}")


# Export clean interfaces. When someone imports this package, they only see these names.
__all__ = ["BaseLLMProvider", "get_provider"]
