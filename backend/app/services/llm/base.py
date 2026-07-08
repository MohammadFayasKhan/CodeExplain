"""
CodeExplain ➜ Plain-English Code Tutor
Author ➜ Mohammad Fayas Khan
Purpose ➜ Abstract base class outlining the LLM provider contract.

Abstract Base Provider Contract for Large Language Models (LLMs).

In Object-Oriented Software Engineering, the Dependency Inversion Principle states
that high-level modules (like our explanation service) should not depend directly on
low-level modules (like the concrete Groq or Gemini SDKs). Instead, both should
depend on abstraction interfaces.

This Python module:
1. Imports the standard 'abc' (Abstract Base Classes) library.
2. Defines `BaseLLMProvider` as a formal abstract blueprint class.
3. Uses the `@abstractmethod` decorator to state that any subclass MUST implement
   the `complete(...)` method, or Python will raise an instantiation error.
4. By using this interface contract, the rest of our application can interact with
   any LLM (Groq, Gemini, OpenAI, etc.) in a unified way without knowing which one is active under the hood.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


# By inheriting from 'ABC' (Abstract Base Class), we mark this class as a blueprint.
# You cannot write 'provider = BaseLLMProvider()' directly; Python will block it.
# You must instantiate a concrete subclass that implements all abstract methods.
class BaseLLMProvider(ABC):
    """
    Abstract base class every LLM provider must implement.
    """

    # Every provider must declare its identification name string (e.g., "groq" or "gemini")
    name: str

    # The '@abstractmethod' decorator forces concrete subclasses to implement this method
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
        """
        Send a system+user prompt pair to the provider and return raw text.

        Parameters:
          - system_prompt (str): Directive setting the persona and formatting of the LLM.
          - user_prompt (str): The specific user input or query (e.g. source code to explain).
          - model_id (str): The specific model version to execute (e.g. 'llama-3.3-70b-versatile').
          - temperature (float): Creativity/randomness control (usually between 0.0 and 1.0).
          - max_tokens (int): Max token count limit of the response.
          - expect_json (bool): If True, forces model to format output as a structured JSON object.

        Returns:
          - str: Raw text response from the model (which we parse into JSON afterwards).

        Concrete implementations must catch network or provider-specific errors
        and wrap/translate them into standard CodeExplain exceptions.
        """

        raise NotImplementedError
