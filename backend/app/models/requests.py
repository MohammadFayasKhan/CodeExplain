"""Request and shared response envelope models."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from .explanation import ExplanationResponse


class ExplainRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=20000)
    language: str
    provider: str | None = None
    model: str | None = None


class QuizRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=20000)
    language: str
    explanation: ExplanationResponse
    provider: str | None = None
    model: str | None = None
    # Previously-generated questions (across regenerations). Sent to the model
    # so it can avoid repeating or paraphrasing them.
    previous_questions: list[str] = Field(default_factory=list)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=20000)
    language: str
    explanation: ExplanationResponse
    history: list[ChatMessage] = Field(default_factory=list)
    question: str = Field(..., min_length=1, max_length=2000)
    provider: str | None = None
    model: str | None = None


class ChatResponse(BaseModel):
    answer: str
    provider_used: str
    model_used: str


class ErrorEnvelope(BaseModel):
    """Shared error shape returned by every failing endpoint."""

    error: dict
