"""POST /api/chat — answer one follow-up question about the code."""

from __future__ import annotations

from fastapi import APIRouter

from ...core.exceptions import InvalidInputError
from ...models.requests import ChatRequest, ChatResponse
from ...services.chat_service import answer_followup

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat_followup(payload: ChatRequest) -> ChatResponse:
    if not payload.question.strip():
        raise InvalidInputError("Please type a question.")

    return await answer_followup(
        code=payload.code,
        language=payload.language,
        explanation=payload.explanation,
        history=payload.history,
        question=payload.question,
        provider=payload.provider,
        model=payload.model,
    )
