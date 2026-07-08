"""Central registry of every provider/model pair CodeExplain will call.

Keeping this in a single file means adding, tweaking, or deprecating a model
never requires touching provider client code or route handlers — just this
dictionary.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ModelConfig:
    """Static configuration for one (provider, model) pair.

    ``temperature_explanation`` is tuned close to zero because correct
    complexity analysis matters far more than creative phrasing. Chat mode
    gets a slightly higher value so follow-up answers sound less robotic.
    """

    provider: str
    model_id: str
    display_name: str
    temperature_explanation: float
    temperature_chat: float
    max_tokens: int


# The order of this tuple is the fallback order used by the orchestrator
# when the caller's chosen model errors out after retries.
MODEL_REGISTRY: dict[str, ModelConfig] = {
    "groq:llama-3.3-70b-versatile": ModelConfig(
        provider="groq",
        model_id="llama-3.3-70b-versatile",
        display_name="Llama 3.3 70B (Groq)",
        temperature_explanation=0.1,
        temperature_chat=0.5,
        max_tokens=4096,
    ),
    "groq:meta-llama/llama-4-scout-17b-16e-instruct": ModelConfig(
        provider="groq",
        model_id="meta-llama/llama-4-scout-17b-16e-instruct",
        display_name="Llama 4 Scout 17B (Groq)",
        temperature_explanation=0.1,
        temperature_chat=0.5,
        max_tokens=4096,
    ),
    "groq:qwen/qwen3.6-27b": ModelConfig(
        provider="groq",
        model_id="qwen/qwen3.6-27b",
        display_name="Qwen 3.6 27B (Groq)",
        temperature_explanation=0.1,
        temperature_chat=0.5,
        max_tokens=4096,
    ),
    "gemini:gemini-2.5-flash": ModelConfig(
        provider="gemini",
        model_id="gemini-2.5-flash",
        display_name="Gemini 2.5 Flash",
        temperature_explanation=0.1,
        temperature_chat=0.5,
        max_tokens=4096,
    ),
}

# Frontend-facing enumeration of what the user can pick. Ordering here is the
# order that shows up in the model pill selector.
PUBLIC_MODEL_ORDER: list[str] = [
    "groq:llama-3.3-70b-versatile",
    "groq:meta-llama/llama-4-scout-17b-16e-instruct",
    "groq:qwen/qwen3.6-27b",
    "gemini:gemini-2.5-flash",
]

# When a request doesn't specify a model, this is what we use.
DEFAULT_MODEL_KEY = "groq:llama-3.3-70b-versatile"


def resolve_model(provider: str | None, model_id: str | None) -> ModelConfig:
    """Look up a ModelConfig by (provider, model_id), falling back to default.

    We look up by composite key so ``meta-llama/llama-4-scout-17b-16e-instruct``
    on Groq and a hypothetical same-name model elsewhere would still be
    distinguishable. Missing/None inputs resolve to the default model rather
    than raising — the caller is trusted UI, not user input.
    """

    if provider and model_id:
        key = f"{provider}:{model_id}"
        if key in MODEL_REGISTRY:
            return MODEL_REGISTRY[key]

    return MODEL_REGISTRY[DEFAULT_MODEL_KEY]


def fallback_chain(preferred_key: str) -> list[ModelConfig]:
    """Return preferred model first, then remaining models in registry order.

    Used by the orchestration layer: if the user's chosen model errors after
    its own internal retries, we quietly try the rest of the fleet before
    surfacing an error. This is why the registry insertion order matters.
    """

    keys = [preferred_key] + [k for k in MODEL_REGISTRY.keys() if k != preferred_key]
    return [MODEL_REGISTRY[k] for k in keys if k in MODEL_REGISTRY]
