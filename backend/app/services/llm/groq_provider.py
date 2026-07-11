"""
CodeExplain ➜ Plain-English Code Tutor
Author ➜ Mohammad Fayas Khan
Purpose ➜ Concrete provider implementing the Groq Cloud REST API.

Groq LLM REST API Provider.

This class inherits from `BaseLLMProvider`. It implements the concrete completion logic
needed to communicate with Groq Cloud's super-fast inference API.

Key design points for Groq's API:
1. Groq implements an OpenAI-compatible API interface. This means the URL endpoint
   (`/chat/completions`) and the payload format mirror OpenAI's official specifications.
2. We authenticate requests using standard HTTP Bearer token headers:
   `Authorization: Bearer <API_KEY>`
3. We utilize OpenAI's standard `response_format={"type": "json_object"}` JSON mode
   whenever we request structural outputs, which enforces strict JSON replies and reduces
   model formatting errors.
"""

from __future__ import annotations

import logging

from ...config.settings import get_settings
from ...core.exceptions import ProviderUnavailableError
from .base import BaseLLMProvider
from .http_retry import post_with_retry

# Setup logging
logger = logging.getLogger("codeexplain.llm.groq")

# The endpoint URL for Groq's chat completions service
GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"


class GroqProvider(BaseLLMProvider):
    """
    Talks to Groq's OpenAI-compatible completions endpoint.
    """

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
        """
        Concrete implementation to call the Groq completions API.
        """
        # Load API keys and timeouts from our configuration settings
        settings = get_settings()

        # Build the payload object required by the OpenAI-compatible standard:
        # - model: specifies the target model (e.g. llama-3.3-70b-versatile).
        # - messages: standard system instructions followed by user queries.
        # - temperature: creativity control.
        # - max_tokens: maximum response token limit.
        payload: dict = {
            "model": model_id,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        # If expect_json is true, tell Groq to enable its native JSON output mode.
        # This instructs the model to only output text that is valid JSON syntax.
        if expect_json:
            payload["response_format"] = {"type": "json_object"}

        # Construct authentication headers: Bearer token is a standard HTTP scheme
        headers = {
            "Authorization": f"Bearer {settings.groq_api_key}",
            "Content-Type": "application/json",
        }

        # Perform the async network request with our backoff retry client helper
        response = await post_with_retry(
            url=GROQ_CHAT_URL,
            headers=headers,
            json_body=payload,
            timeout_seconds=float(settings.request_timeout_seconds),
            provider_name="groq",
        )

        # If Groq returns a bad request (e.g., 400 Bad Request if model_id is invalid)
        if response.status_code >= 400:
            raise ProviderUnavailableError(
                f"Groq returned {response.status_code}: {response.text[:300]}"
            )

        # Parse the JSON response
        data = response.json()
        try:
            # Extract completions from the standard OpenAI response hierarchy:
            # data -> choices list -> first choice -> message dictionary -> content text.
            choice = data["choices"][0]
            content = choice["message"].get("content") or ""
            return content
        except (KeyError, IndexError, TypeError) as exc:
            # If the response schema did not match expectations, raise an error
            raise ProviderUnavailableError(
                f"Groq response missing expected fields: {data}"
            ) from exc
