"""Gemini provider (Google Generative Language REST API)."""

from __future__ import annotations

import logging

from ...config.settings import get_settings
from ...core.exceptions import ProviderUnavailableError
from .base import BaseLLMProvider
from .http_retry import post_with_retry

logger = logging.getLogger(__name__)

# Uses the v1beta endpoint because ``systemInstruction`` and
# ``responseMimeType: application/json`` are both stable there.
GEMINI_URL_TEMPLATE = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
)


class GeminiProvider(BaseLLMProvider):
    """Talks to Gemini via the ``generateContent`` REST endpoint."""

    name = "gemini"

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

        # Gemini takes the system prompt as a dedicated ``systemInstruction``
        # field rather than a role in the message list. This produces stronger
        # instruction adherence than jamming it into a "user" turn.
        payload: dict = {
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "contents": [
                {"role": "user", "parts": [{"text": user_prompt}]},
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }
        if expect_json:
            payload["generationConfig"]["responseMimeType"] = "application/json"

        headers = {"Content-Type": "application/json"}
        url = GEMINI_URL_TEMPLATE.format(model=model_id) + f"?key={settings.gemini_api_key}"

        response = await post_with_retry(
            url=url,
            headers=headers,
            json_body=payload,
            timeout_seconds=float(settings.request_timeout_seconds),
            provider_name="gemini",
        )

        if response.status_code >= 400:
            raise ProviderUnavailableError(
                f"Gemini returned {response.status_code}: {response.text[:300]}"
            )

        data = response.json()
        try:
            parts = data["candidates"][0]["content"]["parts"]
            text = "".join(p.get("text", "") for p in parts)
        except (KeyError, IndexError, TypeError) as exc:
            raise ProviderUnavailableError(
                f"Gemini response missing expected fields: {data}"
            ) from exc

        return text or ""
