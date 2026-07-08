"""
CodeExplain ➜ Plain-English Code Tutor
Author ➜ Mohammad Fayas Khan
Purpose ➜ Pydantic schemas representing quiz structures and results.

Pydantic models for the /api/quiz endpoint.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class QuizQuestion(BaseModel):
    id: str
    type: Literal["multiple_choice", "predict_output"]
    prompt: str
    options: list[str] | None = None  # populated for multiple_choice, None otherwise
    correct_answer: str
    explanation: str


class QuizResponse(BaseModel):
    questions: list[QuizQuestion]
