"""
CodeExplain ➜ Plain-English Code Tutor
Author ➜ Mohammad Fayas Khan
Purpose ➜ API endpoint route for follow-up conversational questions.

FastAPI Chat Follow-Up Router.

This route handles `POST /api/chat`:
1. It handles conversational follow-up questions from the user after code has been explained.
2. It validates the user's question, raising an exception if it is empty.
3. It passes the code context, original explanation details, message history, and the new
   question to `answer_followup` inside our service layer.
4. It receives the text response from the LLM, serializes it, and sends it back to the client.
"""

from __future__ import annotations

from fastapi import APIRouter

from ...core.exceptions import InvalidInputError
from ...models.requests import ChatRequest, ChatResponse
from ...services.chat_service import answer_followup

# Initialize APIRouter
router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat_followup(payload: ChatRequest) -> ChatResponse:
    """
    Handle a follow-up conversation question in the chat panel.
    """
    # Validation: Ensure the user typed an actual question (ignoring empty whitespace/spaces)
    if not payload.question.strip():
        # Raise 422 Unprocessable Entity error
        raise InvalidInputError("Please type a question.")

    # Call the async service module to query the LLM while maintaining message history.
    # The 'await' statement yields back thread control to FastAPI event loop during network requests.
    return await answer_followup(
        code=payload.code,
        language=payload.language,
        explanation=payload.explanation,
        history=payload.history,
        question=payload.question,
        provider=payload.provider,
        model=payload.model,
    )
