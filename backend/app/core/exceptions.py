"""Typed exception hierarchy shared across the backend.

Any provider-, prompt-, or validation-level failure is normalised into one of
these classes before the request layer sees it. The global exception handler
in ``main.py`` then converts each type into the shared error envelope defined
in Part 9 of the spec.
"""

from __future__ import annotations


class CodeExplainError(Exception):
    """Base class for every application-level failure."""

    http_status: int = 500
    error_type: str = "internal_error"

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class InvalidInputError(CodeExplainError):
    """User submitted empty, oversized, or otherwise unusable input."""

    http_status = 422
    error_type = "invalid_input"


class ProviderUnavailableError(CodeExplainError):
    """Every configured LLM provider failed after retries + fallback."""

    http_status = 503
    error_type = "provider_unavailable"


class ProviderTimeoutError(CodeExplainError):
    """A single provider timed out; the orchestrator may still fall back."""

    http_status = 504
    error_type = "provider_timeout"


class StructuredOutputError(CodeExplainError):
    """LLM returned output that could not be validated even after one repair."""

    http_status = 502
    error_type = "structured_output_error"
