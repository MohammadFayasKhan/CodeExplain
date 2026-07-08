# Architecture & Design Decisions

## System shape

CodeExplain is a single-container application:

```
┌───────────────────────────────────────────────────────────────┐
│                        Hugging Face Docker Space              │
│                                                                │
│   ┌────────────────────────────────────────────────────────┐  │
│   │             FastAPI (uvicorn)   listens on $PORT        │  │
│   │                                                          │  │
│   │   /api/explain ──► ExplanationService ─► LLM providers  │  │
│   │   /api/quiz    ──► QuizService        ─►  (Groq/Gemini) │  │
│   │   /api/chat    ──► ChatService        ─►                │  │
│   │   /api/health  ──► static registry only, no LLM call    │  │
│   │   /api/models  ──► lists selectable models              │  │
│   │                                                          │  │
│   │   /*  ──► SPA static mount (React build)                │  │
│   └────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

The Emergent preview environment runs the two halves as separate supervisor
processes (`server:app` on 8001, `yarn start` on 3000) — but the code shape
and the deployed Docker artifact are identical. See `DEPLOYMENT.md`.

## Structured-output contract (the single most important thing here)

Every `/api/explain` call must return an object that validates against
`ExplanationResponse` in `backend/app/models/explanation.py`:

- `overview`, `plain_english_explanation` — strings
- `time_complexity`, `space_complexity` — `{ big_o, reasoning }`
- `line_by_line` — array of `{ line_range, code_snippet, explanation }`
- `improvements` — array of `{ title, detail, category }` where category ∈
  `naming | performance | readability | structure | bug_risk`
- `detected_language`, `provider_used`, `model_used` — strings

The backend validates with Pydantic, strips markdown fences, and on failure
performs **one** repair round-trip (feeding the invalid output and the
Pydantic error back to the same model). If that also fails, a
`StructuredOutputError` bubbles up and the global exception handler returns
the shared error envelope.

## Provider fallback flow

`services/explanation_service.py::generate_explanation` builds a fallback
chain from `config/models_registry.py::fallback_chain(preferred_key)`:

1. The user-selected `(provider, model)`.
2. Every other model in the registry, in insertion order.

For each candidate the pipeline is: send prompt → strip fences → `json.loads`
→ Pydantic validation → (on failure) one repair attempt. If the model errors
out (transient 5xx, timeout, malformed output after repair), the orchestrator
silently moves to the next entry in the chain. The user only sees an error
once the entire chain is exhausted, and the `provider_used`/`model_used`
fields on the response reflect the model that actually produced the output.

## Design system

The visual system comes from the extracted Stitch tokens (colours, spacing,
radii, typography). Tailwind's theme is extended with them in
`frontend/tailwind.config.js`; components use only those tokens, never
arbitrary values.

### Font substitution
Google Sans / Google Sans Text are not freely licensed, so CodeExplain uses
**Manrope** (display, headlines) and **Inter** (body, UI copy) as the closest
free geometric-sans pairing. Weights, tracking, and scale mirror the original
Stitch typography scale.

### Frontend build tool
The spec asks for Vite, but the Emergent preview environment ships with a
supervisor entry configured for `yarn start` on port 3000 (Create React App).
CodeExplain uses CRA so it drops straight into that environment with no
supervisor changes. Both `yarn start` (dev) and `yarn build` (produces
`build/` for the Dockerfile stage 2 copy) work identically to what Vite would
have produced from the same source. This substitution has no bearing on the
final Docker artifact or the user experience.

## Frontend responsibility boundary

The frontend NEVER constructs prompts, talks to Groq/Gemini directly, or
guesses response shapes. It renders exactly what `ExplanationResponse` and
`QuizResponse` describe using the shared TypeScript types in `lib/types.ts`
that mirror the backend Pydantic models field-for-field.

Local Storage holds analysis history and user preferences — never sent to
the backend. A "Clear History" flow with an inline confirmation prevents
accidental deletion.

## Error strategy

All backend errors flow through the `CodeExplainError` hierarchy in
`app/core/exceptions.py` and are rendered as
`{ "error": { "type": ..., "message": ... } }` via a global exception
handler in `app/main.py`. The frontend's `ApiError` mirrors that envelope so
every hook (`useExplain`, quiz submit, chat send) handles failure the same
way — a `Toast` for network/provider errors, inline validation for empty or
oversized input.

## What is intentionally NOT built

Per Part 3 of the spec: interview-question generation, flashcards, code
comparison mode, daily challenges, glossary panels. No dead UI affordances
were added for these — the feature surface is deliberately narrow.
