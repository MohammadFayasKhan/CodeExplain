# CodeExplain — Plain-English Code Tutor

A production-quality, AI-powered code explanation and learning tool. Paste any
code snippet, pick the language, and get a structured breakdown:

- One-sentence overview
- Beginner-friendly plain-English explanation
- Correct, code-specific time & space complexity analysis
- Line-by-line commentary
- Concrete, actionable improvement suggestions
- A 3–5 question comprehension quiz generated from _your_ snippet
- Scoped follow-up chat about the just-explained code
- Markdown & PDF export
- Fully local, persistent history — nothing is ever uploaded

## Feature scope

| # | Feature |
|--:|---|
| 1 | Code input with language selector (Python + JavaScript required; TS/Java/C/C++/Go supported) |
| 2 | Plain-English explanation |
| 3 | Time & space complexity analysis |
| 4 | Line-by-line commentary |
| 5 | Suggested improvements |
| 6 | Structural consistency (single JSON schema across all languages/models) |
| 7 | Quiz Mode |
| 8 | One-sentence overview summary |
| 9 | AI follow-up chat scoped to the current code |
| 10 | Export as Markdown _and_ PDF |
| 11 | Built-in example snippets per language |
| ★ | Persistent local history + Clear-History flow |
| ★ | About page with creator info |

Nothing outside this list is built. See `docs/ARCHITECTURE.md` for the full
scope boundary rationale.

## Tech stack

- **Frontend**: React 18 + TypeScript (Create React App), Tailwind CSS driven
  by the Stitch-derived design tokens (see `docs/ARCHITECTURE.md` for the
  Vite → CRA substitution rationale), Framer Motion, lucide-react, jsPDF.
- **Backend**: Python 3.11 + FastAPI + Pydantic v2, httpx for LLM HTTP calls,
  a common `BaseLLMProvider` interface with Groq and Google Gemini
  implementations behind it.
- **LLM providers**: Groq (`llama-3.3-70b-versatile`, `meta-llama/llama-4-scout-17b-16e-instruct`,
  `qwen/qwen3.6-27b`) and Gemini 2.5 Flash, interchangeable through
  configuration.
- **Deployment**: single Docker image built from a multi-stage `Dockerfile`;
  FastAPI serves both `/api/*` and the built React SPA. Reads `PORT` from the
  environment (default `7860`) so it slots straight into a Hugging Face
  Docker Space with zero code changes.

## Fonts

Google Sans / Google Sans Text are not freely licensed for redistribution, so
CodeExplain uses **Manrope** (display / headlines) and **Inter** (body / UI)
as the closest free geometric-sans pairing. See `docs/ARCHITECTURE.md`.

## Getting started

- **Local development**: see [`docs/SETUP.md`](docs/SETUP.md)
- **Hugging Face Docker Space deployment**: see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- **Architecture & design decisions**: see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Created by

Mohammad Fayas Khan — Computer Science Engineering student · AI & Full-Stack Developer

- [GitHub](https://github.com/MohammadFayasKhan)
- [LinkedIn](https://www.linkedin.com/in/mohammadfayaskhan)
- [Instagram](https://www.instagram.com/fayaskhanx)

© 2026 CodeExplain • MIT License
