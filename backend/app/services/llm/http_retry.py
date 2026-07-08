"""Shared retry helper for LLM HTTP calls.

Kept in its own module because both Groq and Gemini need the exact same
exponential-backoff behaviour and it would be silly to duplicate it in each
provider file.
"""

from __future__ import annotations

import asyncio
import logging

import httpx

from ...core.exceptions import ProviderTimeoutError, ProviderUnavailableError

logger = logging.getLogger(__name__)

# HTTP status codes we consider worth retrying — rate limit + transient
# upstream problems. Anything else (4xx auth errors etc) is terminal.
RETRYABLE_STATUS_CODES: set[int] = {429, 500, 502, 503, 504}


async def post_with_retry(
    *,
    url: str,
    headers: dict,
    json_body: dict,
    timeout_seconds: float,
    max_retries: int = 3,
    provider_name: str = "provider",
) -> httpx.Response:
    """POST ``json_body`` to ``url``, retrying with exponential backoff.

    Raises ``ProviderTimeoutError`` if timeouts exhaust the retry budget and
    ``ProviderUnavailableError`` for retryable HTTP errors that never recover
    or for outright network failures. All other HTTP errors (auth, 400 bad
    request) propagate as ``httpx.HTTPStatusError`` for the caller to translate.
    """

    backoff_seconds = 1.0

    # We use httpx.AsyncClient() as a context manager per-call rather than
    # keeping a long-lived client because the concurrency here is very low
    # (one HTTP call per user request) and it keeps ownership simple.
    async with httpx.AsyncClient() as client:
        for attempt in range(1, max_retries + 1):
            try:
                response = await client.post(
                    url,
                    headers=headers,
                    json=json_body,
                    timeout=timeout_seconds,
                )
            except httpx.TimeoutException as exc:
                logger.warning(
                    "Timeout calling %s (attempt %d/%d): %s",
                    provider_name,
                    attempt,
                    max_retries,
                    exc,
                )
                if attempt == max_retries:
                    raise ProviderTimeoutError(
                        f"{provider_name} timed out after {max_retries} attempts"
                    ) from exc
                await asyncio.sleep(backoff_seconds)
                backoff_seconds *= 2
                continue
            except httpx.HTTPError as exc:
                logger.warning(
                    "Network error calling %s (attempt %d/%d): %s",
                    provider_name,
                    attempt,
                    max_retries,
                    exc,
                )
                if attempt == max_retries:
                    raise ProviderUnavailableError(
                        f"{provider_name} unreachable: {exc}"
                    ) from exc
                await asyncio.sleep(backoff_seconds)
                backoff_seconds *= 2
                continue

            if response.status_code in RETRYABLE_STATUS_CODES:
                # Honour Retry-After if the provider set one (Groq does on 429),
                # but cap it. Providers occasionally return several-thousand-
                # second retry hints on their free tier, which is useless for a
                # real-time app; if the wait would be that long, we prefer to
                # exhaust retries fast so the orchestrator falls back to the
                # next provider in the chain.
                MAX_HONOURED_RETRY_AFTER = 5.0  # seconds
                retry_after_raw = response.headers.get("Retry-After")
                try:
                    hinted = float(retry_after_raw) if retry_after_raw else backoff_seconds
                except ValueError:
                    hinted = backoff_seconds
                delay = min(hinted, MAX_HONOURED_RETRY_AFTER)

                logger.warning(
                    "%s returned %d (attempt %d/%d), sleeping %.1fs",
                    provider_name,
                    response.status_code,
                    attempt,
                    max_retries,
                    delay,
                )
                if attempt == max_retries:
                    raise ProviderUnavailableError(
                        f"{provider_name} returned {response.status_code} after "
                        f"{max_retries} attempts: {response.text[:300]}"
                    )
                await asyncio.sleep(delay)
                backoff_seconds *= 2
                continue

            return response

    # Loop always returns or raises; this is unreachable but pleases type-checkers.
    raise ProviderUnavailableError(f"{provider_name}: retry loop exited unexpectedly")
