# ==============================================================================
# CodeExplain - Summer Training Internship Project (LPU submission candidate)
# Developed by: Mohammad Fayas Khan (BTech CSE 3rd Year student)
# File: backend/app/services/llm/gemini_provider.py
# Purpose: Concrete provider implementing the Google Generative Language REST API.
# ==============================================================================

"""
Google Gemini LLM REST API Provider.

This class inherits from `BaseLLMProvider`. It implements the concrete details
needed to make HTTP calls to Google's Generative Language REST API.

Key design points for Google's API:
1. We use the 'v1beta' endpoint because it has stable, native support for
   'systemInstruction' fields and 'responseMimeType: application/json'.
2. Unlike chat interfaces that mix system prompts as regular user messages, Gemini accepts
   a top-level 'systemInstruction' node, which results in much stricter constraint adherence.
3. The API key is appended securely to the URL string as a query parameter (?key=API_KEY)
   rather than standard HTTP headers.
"""

from __future__ import annotations

import logging

from ...config.settings import get_settings
from ...core.exceptions import ProviderUnavailableError
from .base import BaseLLMProvider
from .http_retry import post_with_retry

# Setup logging
logger = logging.getLogger("codeexplain.llm.gemini")

# URL template pattern for calling the Google Generative Language content API
GEMINI_URL_TEMPLATE = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
)


class GeminiProvider(BaseLLMProvider):
    """
    Talks to Gemini via the Google generateContent REST endpoint.
    """

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
        """
        Concrete implementation to call the Google Gemini API.
        """
        # Load active configuration credentials from the singleton settings manager
        settings = get_settings()

        # Build the payload object required by the Google Gemini API:
        # - systemInstruction: Sets the AI behavior/persona guidelines.
        # - contents: A list of messages (roles and text parts). In our case, a single user message.
        # - generationConfig: Controls generation parameters.
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

        # If expect_json is true, tell Gemini to enforce strict JSON structure formatting.
        # This guarantees that the LLM responds in JSON syntax.
        if expect_json:
            payload["generationConfig"]["responseMimeType"] = "application/json"

        # Build the HTTP POST target details
        headers = {"Content-Type": "application/json"}
        url = GEMINI_URL_TEMPLATE.format(model=model_id) + f"?key={settings.gemini_api_key}"

        # Delegate the actual async POST request execution to our shared retry helper.
        # This will automatically retry with exponential backoff if the network drops or rates exceed.
        response = await post_with_retry(
            url=url,
            headers=headers,
            json_body=payload,
            timeout_seconds=float(settings.request_timeout_seconds),
            provider_name="gemini",
        )

        # If the API returned a bad request or unauthorized status:
        if response.status_code >= 400:
            raise ProviderUnavailableError(
                f"Gemini returned {response.status_code}: {response.text[:300]}"
            )

        # Parse the JSON response returned from Google
        data = response.json()
        try:
            # Gemini nests responses inside candidates -> content -> parts -> text lists.
            # We safely extract the text elements and join them.
            parts = data["candidates"][0]["content"]["parts"]
            text = "".join(p.get("text", "") for p in parts)
        except (KeyError, IndexError, TypeError) as exc:
            # If the response shape is missing keys, raise a ProviderUnavailableError
            raise ProviderUnavailableError(
                f"Gemini response missing expected fields: {data}"
            ) from exc

        return text or ""
