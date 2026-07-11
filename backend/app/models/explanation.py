"""
CodeExplain ➜ Plain-English Code Tutor
Author ➜ Mohammad Fayas Khan
Purpose ➜ Pydantic models for the /api/explain structured contract.

Pydantic models for the /api/explain structured contract.

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


class TraceStep(BaseModel):
    line_number: int = Field(..., description="Line number of code active in this step")
    explanation: str = Field(..., description="Beginner-friendly explanation of this step")
    variables: dict[str, str] = Field(..., description="Variable values at this step (e.g. {'i': '0', 'nums[i]': '2'})")


class TestCase(BaseModel):
    id: str = Field(..., description="e.g. 'case-1'")
    input: str = Field(..., description="Description or JSON string of the input values")
    expected_output: str = Field(..., description="Expected output of this test case")
    steps: list[TraceStep] = Field(..., description="Step-by-step trace steps")


class ExplanationResponse(BaseModel):
    overview: str
    plain_english_explanation: str
    time_complexity: ComplexityAnalysis
    space_complexity: ComplexityAnalysis
    line_by_line: list[LineCommentary]
    improvements: list[Improvement]
    detected_language: str
    test_cases: list[TestCase] = Field(default_factory=list)
    provider_used: str = ""
    model_used: str = ""
