"""
CodeExplain ➜ Plain-English Code Tutor
Author ➜ Mohammad Fayas Khan
Purpose ➜ Environment-driven application settings and validation.

Environment-Driven Settings for CodeExplain Backend.

In modern web development, we follow the "Twelve-Factor App" methodology.
A key rule is to store config/credentials in the environment, NOT hardcoded in code.
This module:
1. Locates the `.env` file containing our secret API keys.
2. Loads those variables into Python's active environment (`os.environ`).
3. Uses a Pydantic schema model to enforce that these variables exist.
4. Fails fast during application startup (boot-time) if any required keys are missing,
   preventing runtime errors when calling LLM services.
5. Caches the loaded settings as a singleton object using `lru_cache` so we don't
   re-read environment files repeatedly.
"""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Load the configuration variables from '.env' file into python environment.
# ---------------------------------------------------------------------------
# Path(__file__) returns the absolute path of settings.py.
# .resolve() gets the absolute canonical path on disk.
# .parents[2] moves up three directory levels (from app/config/settings.py to backend/).
# We locate the '.env' file there and load it.
_ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
if _ENV_PATH.exists():
    load_dotenv(_ENV_PATH)


class Settings(BaseModel):
    """
    Settings Schema Model.

    Pydantic is a powerful library used in Python for data validation.
    By declaring variables and their type hints inside this Pydantic BaseModel class,
    FastAPI will automatically validate that the loaded environment variables match
    these exact keys and types.
    """

    # Secret API key credentials (required, cannot be empty)
    groq_api_key: str
    gemini_api_key: str

    # AI engine choice and active model naming rules
    active_provider: str
    active_model: str

    # Network settings
    request_timeout_seconds: int
    allowed_origin: str
    log_level: str

    # Database parameters
    mongo_url: str
    db_name: str


# The '@lru_cache(maxsize=1)' decorator caches the return value of this function.
# LRU stands for "Least Recently Used". By setting maxsize=1, we tell Python to cache the
# Settings object the first time we load it. Any subsequent call to get_settings() will
# instantly return the cached object instead of re-reading environment variables, which
# boosts performance and resource efficiency.
@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Load settings from environment, validate them, and return a cached singleton instance.
    Raises RuntimeError immediately on startup if required variables are missing.
    """

    # Keep track of any required environment variables that are missing
    missing: list[str] = []

    # Local helper function to look up environment keys and log failures if they are empty
    def _required(name: str) -> str:
        # Get the value from os.environ, defaulting to empty string, and strip extra spaces
        val = os.environ.get(name, "").strip()
        if not val:
            missing.append(name)
        return val

    # Instantiate the Pydantic Settings class with values fetched from the OS environment.
    # If the key is not required, we provide a safe fallback default value (using '.get()' with fallback).
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

    # If any required variables were missing, raise a clear error to block the server
    # from booting in a misconfigured state.
    if missing:
        raise RuntimeError(
            "Missing required environment variable(s): " + ", ".join(missing)
        )

    return settings
