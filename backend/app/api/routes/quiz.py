"""POST /api/quiz — generate comprehension questions from an explanation."""

from __future__ import annotations

from fastapi import APIRouter

from ...core.exceptions import InvalidInputError
from ...models.quiz import QuizResponse
from ...models.requests import QuizRequest
from ...services.quiz_service import generate_quiz

router = APIRouter()


@router.post("/quiz", response_model=QuizResponse)
async def quiz_from_code(payload: QuizRequest) -> QuizResponse:
    if not payload.code.strip():
        raise InvalidInputError("Please provide code before generating a quiz.")

    return await generate_quiz(
        code=payload.code,
        language=payload.language,
        explanation=payload.explanation,
        provider=payload.provider,
        model=payload.model,
        previous_questions=payload.previous_questions,
    )
