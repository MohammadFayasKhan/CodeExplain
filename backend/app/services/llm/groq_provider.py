"""Groq provider (OpenAI-compatible chat completions endpoint)."""

from __future__ import annotations

import logging

from ...config.settings import get_settings
from ...core.exceptions import ProviderUnavailableError
from .base import BaseLLMProvider
from .http_retry import post_with_retry

logger = logging.getLogger(__name__)

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"


class GroqProvider(BaseLLMProvider):
    """Talks to Groq's OpenAI-compatible ``/chat/completions`` endpoint."""

    name = "groq"

    async def complete(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        model_id: str,
        temperature: float,
        max_tokens: int,
        expect_json: bool,
    ) -> str:
        settings = get_settings()

        payload: dict = {
            "model": model_id,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        # Groq honours OpenAI's ``response_format`` JSON mode. Enabling it
        # dramatically reduces the "wrapped in ```json fences" failure mode
        # we handle downstream, though we still defensively strip fences.
        if expect_json:
            payload["response_format"] = {"type": "json_object"}

        headers = {
            "Authorization": f"Bearer {settings.groq_api_key}",
            "Content-Type": "application/json",
        }

        response = await post_with_retry(
            url=GROQ_CHAT_URL,
            headers=headers,
            json_body=payload,
            timeout_seconds=float(settings.request_timeout_seconds),
            provider_name="groq",
        )

        # We *only* reach here on a 2xx response. Any non-retryable 4xx would
        # have raised inside post_with_retry via ``raise_for_status``-free
        # logic — but Groq occasionally returns 400 on bad model IDs, so
        # gate on status_code before parsing.
        if response.status_code >= 400:
            raise ProviderUnavailableError(
                f"Groq returned {response.status_code}: {response.text[:300]}"
            )

        data = response.json()
        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise ProviderUnavailableError(
                f"Groq response missing expected fields: {data}"
            ) from exc

        return content or ""
