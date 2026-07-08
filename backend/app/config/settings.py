"""Environment-driven settings for CodeExplain backend.

Loaded once at import time. Fails fast with a clear message if a required
credential is missing so we surface configuration problems at startup rather
than deep inside a request handler.
"""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel

# Load /app/backend/.env into the process environment before Pydantic reads it.
# Doing this at module import time (instead of inside a lazy call) guarantees
# the app has all credentials by the time any endpoint fires.
_ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
if _ENV_PATH.exists():
    load_dotenv(_ENV_PATH)


class Settings(BaseModel):
    """Runtime configuration.

    We deliberately do not attach default fake values to the API keys — if a
    key is missing we want the application to explode at boot time, not
    silently limp along and 500 on the first LLM call.
    """

    groq_api_key: str
    gemini_api_key: str
    active_provider: str
    active_model: str
    request_timeout_seconds: int
    allowed_origin: str
    log_level: str
    mongo_url: str
    db_name: str


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the singleton Settings instance, raising early on misconfig."""

    missing: list[str] = []

    def _required(name: str) -> str:
        val = os.environ.get(name, "").strip()
        if not val:
            missing.append(name)
        return val

    settings = Settings(
        groq_api_key=_required("GROQ_API_KEY"),
        gemini_api_key=_required("GEMINI_API_KEY"),
        active_provider=os.environ.get("ACTIVE_PROVIDER", "groq").strip() or "groq",
        active_model=os.environ.get("ACTIVE_MODEL", "llama-3.3-70b-versatile").strip()
        or "llama-3.3-70b-versatile",
        request_timeout_seconds=int(os.environ.get("REQUEST_TIMEOUT_SECONDS", "45") or 45),
        allowed_origin=os.environ.get("ALLOWED_ORIGIN", "*").strip() or "*",
        log_level=os.environ.get("LOG_LEVEL", "INFO").strip() or "INFO",
        mongo_url=os.environ.get("MONGO_URL", "").strip(),
        db_name=os.environ.get("DB_NAME", "codeexplain").strip() or "codeexplain",
    )

    if missing:
        raise RuntimeError(
            "Missing required environment variable(s): " + ", ".join(missing)
        )

    return settings
