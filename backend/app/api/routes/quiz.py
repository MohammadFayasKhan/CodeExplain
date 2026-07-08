"""
CodeExplain ➜ Plain-English Code Tutor
Author ➜ Mohammad Fayas Khan
Purpose ➜ API endpoint route for requesting interactive quizzes.

FastAPI Quiz Router.

This route handles `POST /api/quiz`:
1. It accepts a JSON payload of type `QuizRequest` containing the user's source code,
   programming language, active explanation metadata, and list of previous questions.
2. It validates the code input (raising an exception if the editor is empty).
3. It calls the `generate_quiz` service, which triggers the AI model to generate
   a structured set of multiple-choice questions to test the user's understanding.
4. It returns the response serialized into a strict `QuizResponse` Pydantic model.
"""

from __future__ import annotations

from fastapi import APIRouter

from ...core.exceptions import InvalidInputError
from ...models.quiz import QuizResponse
from ...models.requests import QuizRequest
from ...services.quiz_service import generate_quiz

# Initialize the route handler router
router = APIRouter()


# Define a POST route at '/quiz'. We set 'response_model=QuizResponse' so FastAPI
# validates our return value and auto-generates documentation schemas for Swagger.
@router.post("/quiz", response_model=QuizResponse)
async def quiz_from_code(payload: QuizRequest) -> QuizResponse:
    """
    Generate interactive comprehension questions based on user's code and explanation.
    """
    # Validation: Check if the input code is empty (or just spaces/tabs)
    if not payload.code.strip():
        # Raise our custom InvalidInputError, mapping to a 422 HTTP response
        raise InvalidInputError("Please provide code before generating a quiz.")

    # Call the asynchronous service module. The 'await' keyword suspends execution here,
    # yielding control to the event loop while the LLM network call completes.
    return await generate_quiz(
        code=payload.code,
        language=payload.language,
        explanation=payload.explanation,
        provider=payload.provider,
        model=payload.model,
        previous_questions=payload.previous_questions,
    )
