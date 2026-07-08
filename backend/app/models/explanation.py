"""Pydantic models for the /api/explain structured contract.

The single most important schema in the entire application: every LLM
response MUST validate against ``ExplanationResponse`` before it can leave
the backend. Any drift here is user-visible, so treat this file as sacred.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ComplexityAnalysis(BaseModel):
    big_o: str = Field(..., description="e.g. 'O(n log n)'")
    reasoning: str = Field(..., description="Why, tied to the actual code structure")


class LineCommentary(BaseModel):
    line_range: str = Field(..., description="e.g. '3-4' or '7'")
    code_snippet: str
    explanation: str


class Improvement(BaseModel):
    title: str
    detail: str
    category: Literal["naming", "performance", "readability", "structure", "bug_risk"]


class ExplanationResponse(BaseModel):
    overview: str
    plain_english_explanation: str
    time_complexity: ComplexityAnalysis
    space_complexity: ComplexityAnalysis
    line_by_line: list[LineCommentary]
    improvements: list[Improvement]
    detected_language: str
    provider_used: str
    model_used: str
