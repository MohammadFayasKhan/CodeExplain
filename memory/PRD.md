# CodeExplain — PRD

## Problem statement
Build CodeExplain, a plain-English AI code tutor. Users paste any code snippet, pick the source language, and get a structured breakdown (overview, plain-English explanation, correct time/space complexity, line-by-line commentary, actionable improvements) plus an on-demand quiz derived from that specific code and a scoped follow-up chat. Ships as a single Docker container deployable to Hugging Face Spaces with no post-clone edits.

## User personas
1. **CS student** — reads unfamiliar snippets, wants line-by-line teaching, complexity reasoning, and a quiz to check understanding.
2. **Developer exploring a codebase** — pastes snippets from files they don't own, wants an overview + improvements.
3. **Interview-prep learner** — pastes classic algorithms and wants correct Big-O + scoped Q&A.

## Core requirements (spec Tier 1 + Tier 2)
1. Code input with language + model selectors (Python + JavaScript required; TS/Java/C/C++/Go supported).
2. Plain-English explanation.
3. Correct, code-specific time & space complexity analysis.
4. Line-by-line commentary.
5. Concrete, code-grounded improvement suggestions.
6. Structural consistency — every response validates against a single Pydantic schema.
7. Quiz Mode (3–5 comprehension questions built from the actual code).
8. Overview one-liner.
9. Scoped follow-up chat.
10. Markdown + PDF export.
11. Built-in example snippets per language.
★ Persistent local history + Clear-History flow (Local Storage only, never server-side).
★ About/Creator page with attribution and privacy note.

## Architecture
- **Backend**: FastAPI, Pydantic v2, httpx. Provider abstraction (`BaseLLMProvider`) with Groq (llama-3.3-70b-versatile, llama-4-scout, qwen3.6-27b) and Gemini (2.5-flash) implementations. Fallback chain kicks in silently on model failure. Global exception handler returns one error envelope for every failure category.
- **Frontend**: React 18 + TypeScript (CRA), Tailwind extended with the Stitch tokens, Framer Motion, lucide-react, jsPDF. All persistence via Local Storage.
- **Deployment**: Multi-stage Dockerfile — Node builds the SPA, Python runtime serves both `/api/*` and the built assets with an SPA fallback. Reads `PORT` (default 7860). CORS restricted via `ALLOWED_ORIGIN`.

## What's implemented (2026-01)
- Full backend: `/api/explain`, `/api/quiz`, `/api/chat`, `/api/health`, `/api/models`, with schema-validated structured output, one-shot repair on invalid JSON, and cross-model fallback.
- Full frontend: landing hero, code input card with language + model pills, example chips, six-section result view, quiz panel with score, follow-up chat, Markdown + PDF export, About page, History drawer with Clear-History confirmation, toasts.
- Design system: Stitch-derived colours/radii/spacing/typography via Tailwind theme extension. Manrope + Inter substituted for Google Sans (documented).
- Dockerfile + `.dockerignore` + docs (README, ARCHITECTURE, SETUP, DEPLOYMENT).
- Verified: Python and JavaScript snippets both return schema-valid `ExplanationResponse`; Groq and Gemini interchangeably. Manual UI walkthrough shows Two Sum → correct O(n) time & space, full walkthrough rendered.

## Backlog / future
- P1: automated backend unit tests around the repair-retry loop.
- P2: multi-file snippet support.
- P2: shareable public URL for an explanation (opt-in).

## Next tasks
- Run the testing subagent against backend endpoints and frontend flows.
- Fix any high-priority issues surfaced.
