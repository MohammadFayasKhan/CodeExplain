# ==============================================================================
# CodeExplain - Summer Training Internship Project (LPU submission candidate)
# Developed by: Mohammad Fayas Khan (BTech CSE 3rd Year student)
# File: backend/app/services/llm/http_retry.py
# Purpose: Reusable async HTTP request poster implementing exponential backoff.
# ==============================================================================

"""
Asynchronous HTTP request poster with Exponential Backoff retry logic.

When writing high-availability cloud applications that communicate with third-party
APIs (like Groq or Gemini), network hiccups, server overloads, or API rate limits
(HTTP 429) are expected.

Instead of crashing or failing immediately, we use a robust retry policy called
"Exponential Backoff":
1. If a request fails, we wait 1 second, then try again.
2. If it fails again, we double the wait time (2 seconds, then 4 seconds, etc.).
3. We check for specific "retryable" HTTP codes (like 429 rate limit, 500 server error,
   502 bad gateway). We never retry 400 (bad request) or 401 (unauthorized) because
   those mean our inputs or credentials are wrong, which retrying won't fix.
4. We read and respect the server's "Retry-After" header if present, but cap it so the
   user isn't left waiting forever.
"""

from __future__ import annotations

import asyncio
import logging

import httpx

from ...core.exceptions import ProviderTimeoutError, ProviderUnavailableError

# Setup logging to trace request retry cycles in standard output
logger = logging.getLogger("codeexplain.llm.retry")

# Define HTTP Status Codes that are worth retrying.
# 429: Too Many Requests (Rate limit exceeded). We wait and retry.
# 500: Internal Server Error (Upstream crash).
# 502: Bad Gateway.
# 503: Service Unavailable.
# 504: Gateway Timeout.
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
    """
    POST a JSON body payload to a URL asynchronously, implementing retries with exponential backoff.

    Parameters:
      - url (str): Target REST API endpoint.
      - headers (dict): HTTP headers (containing authentication tokens, content types, etc.).
      - json_body (dict): Python dictionary converted into JSON request body.
      - timeout_seconds (float): Timeout limit in seconds before aborting the request.
      - max_retries (int): Maximum number of retry attempts before giving up.
      - provider_name (str): Label identifying the provider (e.g. "groq" or "gemini") for logs.

    Returns:
      - httpx.Response: The successful response object.
    """

    # Start with 1.0 second base wait delay
    backoff_seconds = 1.0

    # 'async with httpx.AsyncClient()' initializes an asynchronous HTTP client session.
    # The client acts as a context manager and is automatically closed when the 'async with' block ends.
    # This prevents memory leaks and ensures TCP sockets are closed properly.
    async with httpx.AsyncClient() as client:
        # Loop through our attempts (1-indexed for logging clarity)
        for attempt in range(1, max_retries + 1):
            try:
                # Send the POST request asynchronously using 'await'.
                # This suspends our current execution thread and returns control to the event loop,
                # letting the server process other users' requests while we wait for the network I/O.
                response = await client.post(
                    url,
                    headers=headers,
                    json=json_body,
                    timeout=timeout_seconds,
                )
            except httpx.TimeoutException as exc:
                # Catch network timeout exceptions. We warn in the logs and schedule a retry.
                logger.warning(
                    "Timeout calling %s (attempt %d/%d): %s",
                    provider_name,
                    attempt,
                    max_retries,
                    exc,
                )
                # If we've reached our maximum retry budget, raise our custom ProviderTimeoutError
                if attempt == max_retries:
                    raise ProviderTimeoutError(
                        f"{provider_name} timed out after {max_retries} attempts"
                    ) from exc
                # Sleep asynchronously without blocking the overall Python server thread.
                # Then double the wait time for the next attempt.
                await asyncio.sleep(backoff_seconds)
                backoff_seconds *= 2
                continue
            except httpx.HTTPError as exc:
                # Catch physical network connection failures (DNS issues, sockets dropping, etc.)
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

            # If the network call succeeded but the server returned a retryable error code:
            if response.status_code in RETRYABLE_STATUS_CODES:
                # The upstream API might tell us exactly how long to wait via the 'Retry-After' header.
                # However, some providers return hours-long retry times on free tiers.
                # We limit our wait time to a maximum of 5 seconds to keep our UI responsive.
                MAX_HONOURED_RETRY_AFTER = 5.0  # seconds
                retry_after_raw = response.headers.get("Retry-After")
                try:
                    # Attempt to parse the header. If it's not a valid number, fallback to exponential backoff.
                    hinted = float(retry_after_raw) if retry_after_raw else backoff_seconds
                except ValueError:
                    hinted = backoff_seconds
                # Select the minimum of either the server's hint or our safety cap
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

            # If the request succeeded with a non-retryable response (e.g. 200 OK or 400 Bad Request),
            # return it to the caller. The caller service will handle success or authenticate errors.
            return response

    # Fallback to satisfy Python typing checkers
    raise ProviderUnavailableError(f"{provider_name}: retry loop exited unexpectedly")
