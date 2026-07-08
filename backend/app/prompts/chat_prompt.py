"""Prompt template for the /api/chat follow-up feature."""

from __future__ import annotations

from ..models.explanation import ExplanationResponse
from ..models.requests import ChatMessage

SYSTEM_PROMPT = """You are CodeExplain's follow-up chat assistant. The user \
has just received a full explanation of a specific code snippet and now \
wants to ask a follow-up question about THAT code.

RULES:
1. Answer using the specific code provided as context. Reference variable \
names, function names, and line numbers when relevant.
2. Keep answers concise (usually 2-6 short sentences).
3. If the user asks something completely unrelated to the code, gently \
redirect them back to the code they submitted.
4. Do NOT respond in JSON. Respond in natural English (Markdown allowed for \
short code snippets (wrap them in triple backticks)).
5. Never claim you cannot see the code: it is included below.
"""


def build_user_prompt(
    *,
    code: str,
    language: str,
    explanation: ExplanationResponse,
    history: list[ChatMessage],
    question: str,
) -> str:
    """Build the follow-up chat user prompt, including prior turns."""

    history_block = ""
    if history:
        lines: list[str] = []
        for msg in history[-6:]:  # cap context to last 6 turns to bound tokens
            role_label = "User" if msg.role == "user" else "Assistant"
            lines.append(f"{role_label}: {msg.content}")
        history_block = "\n\nPrior conversation:\n" + "\n".join(lines)

    return (
        f"Language: {language}\n\n"
        f"Code the user is asking about:\n```\n{code}\n```\n\n"
        f"Original explanation overview: {explanation.overview}\n"
        f"Time complexity: {explanation.time_complexity.big_o}: {explanation.time_complexity.reasoning}\n"
        f"Space complexity: {explanation.space_complexity.big_o}: {explanation.space_complexity.reasoning}"
        f"{history_block}\n\n"
        f"New user question: {question}\n\n"
        "Answer the user's question now."
    )
