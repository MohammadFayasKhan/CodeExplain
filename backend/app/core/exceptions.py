# ==============================================================================
# CodeLearn - Summer Training Internship Project (LPU submission candidate)
# Developed by: Mohammad Fayas Khan (BTech CSE 3rd Year student)
# File: backend/app/core/exceptions.py
# Purpose: Shared exception hierarchy mapping application errors to HTTP status codes.
# ==============================================================================

"""
Custom Application Exception Hierarchy.

In professional software development, we do not throw raw Python exceptions (like KeyError
or ValueError) up to the client web browser. That would leak server-side implementation
details and cause generic 500 Internal Server errors.

Instead, we define a unified exception hierarchy:
1. We create a base exception class `CodeExplainError` that inherits from Python's default `Exception`.
2. We derive specialized subclass exceptions from it (e.g. `InvalidInputError`, `ProviderTimeoutError`).
3. Each subclass declares:
   - An `http_status` code (e.g., 422 Unprocessable Entity, 503 Service Unavailable).
   - An `error_type` label string (e.g., "invalid_input").
4. When any error occurs inside our code, we throw these custom typed exceptions.
5. FastAPI's central exception handlers catch them (in main.py) and automatically envelope the payload
   into a clean, standardized JSON format that the frontend UI knows how to display.
"""

from __future__ import annotations


class CodeExplainError(Exception):
    """
    Base Exception class for all application-level errors.
    Inherits from the standard Python built-in 'Exception' class.
    """

    # Default HTTP Status Code to return (500 means Internal Server Error)
    http_status: int = 500

    # Custom machine-readable error label category
    error_type: str = "internal_error"

    def __init__(self, message: str) -> None:
        """
        Initialize the custom exception with a user-friendly message.
        """
        # Call the parent Exception constructor to initialize standard error details
        super().__init__(message)
        # Store the message locally so exception handlers can extract it
        self.message = message


class InvalidInputError(CodeExplainError):
    """
    Raised when user inputs are invalid.
    Examples: Code size exceeds limit, empty code fields, or unrecognized request configurations.
    Maps to HTTP Status 422 (Unprocessable Entity).
    """

    http_status = 422
    error_type = "invalid_input"


class ProviderUnavailableError(CodeExplainError):
    """
    Raised when all LLM providers (e.g., Groq, Gemini) are down, or fail to respond
    even after we retry network connections and execute fallback procedures.
    Maps to HTTP Status 503 (Service Unavailable).
    """

    http_status = 503
    error_type = "provider_unavailable"


class ProviderTimeoutError(CodeExplainError):
    """
    Raised when a single provider takes longer than our designated timeout limit to respond.
    This lets us track individual timeouts so our main controller service can switch
    to another backup provider.
    Maps to HTTP Status 504 (Gateway Timeout).
    """

    http_status = 504
    error_type = "provider_timeout"


class StructuredOutputError(CodeExplainError):
    """
    Raised when the AI model responds but its JSON format is invalid, corrupted, or misses required
    fields (fails Pydantic structural validation) even after we attempted to repair it.
    Maps to HTTP Status 502 (Bad Gateway).
    """

    http_status = 502
    error_type = "structured_output_error"
