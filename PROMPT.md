# CodeExplain — Plain-English Code Tutor
## Master Build Prompt for an AI Coding Agent

**Read this entire document before writing a single line of code, running a single command, or creating a single file.** This document is the complete specification for building CodeExplain, a production-quality, AI-powered code explanation and learning tool. It is meant to be pasted as the opening message of a fresh coding session. Nothing outside this document should be required to finish the build.

Throughout this document, "you" refers to you, the coding agent carrying out this build. "The end user" or "the user" refers to the person who will eventually open the finished application and paste a code snippet — not the person who gave you this prompt.

If you hit a genuine ambiguity this document does not resolve, make the most sensible, well-justified engineering decision, write it down under a "Design Decisions" heading in `docs/ARCHITECTURE.md`, and keep moving. Do not stop the build to ask clarifying questions except in extreme, project-blocking circumstances. Everything else is your call to make and document.

> This project was built for the *AI Engineer Launchpad* capstone. This document is the build specification; a companion document, `PROMPT_ENGINEERING_METHODOLOGY.md`, separately explains what kind of prompt this is, why it was written this way, and how it maps to the course's own prompt-engineering vocabulary (zero-shot, structured prompting, structured output, role/system prompting) from Unit 2 (CO2).

### Table of Contents

- Part 0 — Mission Briefing
- Part 1 — Non-Negotiable Operating Principles
- Part 2 — Product Specification
- Part 3 — Feature Scope (Tier 1: Required, Tier 2: High-Priority Additions)
- Part 4 — Technology Stack & Dependency Policy
- Part 5 — Design System (Stitch-Derived Visual Language)
- Part 6 — System Architecture & Project Structure
- Part 7 — LLM Provider Abstraction Layer
- Part 8 — Prompt Engineering & Structured Output Contract
- Part 9 — Backend API Contract
- Part 10 — Quiz Engine Specification
- Part 11 — Frontend Application Specification
- Part 12 — Configuration & Secrets Management
- Part 13 — Error Handling Strategy
- Part 14 — Code Quality & Documentation Standards
- Part 15 — Deployment Architecture (Render)
- Part 16 — Phased Implementation Plan
- Part 17 — Final Acceptance Checklist & Closing Directive

---

## Part 0 — Mission Briefing

CodeExplain is a web application that takes a pasted code snippet and returns a structured, layman-friendly breakdown of it: a plain-English explanation, correct time and space complexity analysis, line-by-line commentary, and suggested improvements — each rendered in its own clearly separated section of the UI. A student pastes code they don't understand, picks the language, and gets back a consistent, well-organized teaching artifact rather than a wall of unstructured AI text.

This project is being built as a real, working, portfolio-quality product — not a demo that only survives a happy-path walkthrough. It must handle at least two languages correctly (with genuinely correct complexity analysis, not a plausible-sounding guess), it must return the same structural shape on every single request regardless of language or input, and it must include a working quiz mode that generates real comprehension questions from the actual code that was explained — not generic, code-agnostic questions.

The guiding philosophy for this build is: **structure is the product.** Any LLM can produce an explanation of a code snippet if you ask it to. What makes this application valuable is that every response — across every supported language, every provider, every model — comes back in an identical, predictable shape that the frontend can render reliably, section by section, every time. Treat the structured-output contract in Part 8 as the single most important piece of engineering in this project.

---

## Part 1 — Non-Negotiable Operating Principles

1. **Think before you build.** For each phase in Part 15, before writing implementation code, plan the module boundaries and the data contracts (Pydantic models on the backend, TypeScript types on the frontend) crossing those boundaries.

2. **Respect the phase gates.** Part 15 breaks the build into sequential phases, each with a Definition of Done. Do not begin a phase until the previous one genuinely satisfies its gate condition.

3. **No placeholders, ever.** No `pass` standing in for a function body, no `// TODO: implement later`, no hardcoded fake responses pretending to be real LLM output. If a function exists, it is fully implemented.

4. **No unfinished features exposed in the UI.** If something can't be completed within its assigned phase, it must not have a button, tab, or visible affordance yet.

5. **Build for production, not just for a demo.** Input validation, error handling, and loading states are core deliverables, not polish added at the end.

6. **Consistency across the codebase.** One naming convention, one error-handling pattern, one API response shape, one way of constructing Pydantic models and TypeScript interfaces. A choice made in Phase 1 is honored through the final phase.

7. **Every LLM response is untrusted, malformed-until-proven-otherwise output.** The model may occasionally return invalid JSON, omit a required field, or wrap output in markdown fences. The backend must validate, repair-or-reject, and never let a malformed response reach the frontend as a raw string dumped into the UI.

8. **The structural contract is sacred.** Every one of the four required output sections (plain-English explanation, complexity analysis, line-by-line commentary, improvement suggestions) must be present, correctly typed, and separated in every successful response, regardless of language, provider, or model.

9. **Self-verify before moving on.** At the end of each phase, walk through that phase's Definition of Done and confirm every line honestly before proceeding.

10. **Do not exceed the scope defined in Part 3.** This project intentionally does not implement the large feature catalogue sometimes associated with tools like this. Building extra, unscoped features is a violation of this specification just as much as leaving required ones unfinished — it dilutes the quality of the required features and the design system.

---

## Part 2 — Product Specification

### What the application does

A user opens the app and is greeted by a dark, AI-forward landing experience (see Part 5) built around a large rounded code-input card, similar in spirit to a chat composer. The user pastes or types a code snippet into that card, selects the source language from a pill selector (auto-detection attempted, always overridable), selects an AI model from a second pill selector, and submits.

The backend builds a single structured prompt from the code and language, sends it to the active LLM provider, receives and validates a structured JSON response, and returns it to the frontend. The frontend renders the response as a sequence of clearly separated, independently collapsible sections: Overview, Plain-English Explanation, Line-by-Line Commentary, Time Complexity, Space Complexity, Suggested Improvements. Below the main explanation, the user can generate a quiz derived from the same code and explanation, answer it, and see a score.

### Assignment-mandated outcomes (must be demonstrably true)

1. The application correctly explains snippets in **at least two languages** (this build must support Python and JavaScript at minimum, with correct, language-appropriate complexity analysis for both — not a template answer reused across languages).
2. Every response is returned as **structured sections that stay consistent** across many different inputs, languages, and code shapes — verified against the JSON schema in Part 8, not just "usually looks right."
3. **Quiz Mode** generates comprehension questions from the actual explained code — not a static, generic question bank — and lets the user answer and see a score.

### Reference interaction walkthrough

A user pastes a small Python function that computes a running total with a nested loop over two lists. They select "Python," leave the model on its default, and submit. Within a few seconds they see: an Overview stating what the function does in one sentence; a Plain-English Explanation describing the nested iteration in beginner terms; a Line-by-Line Commentary card for each meaningful statement; a Time Complexity section stating O(n·m) with a stated reason tied to the nested loop; a Space Complexity section noting the auxiliary list used to store results; and a Suggested Improvements section noting the nested loop could be replaced with a single pass using a dictionary, with a short rationale.

The user then clicks "Generate Quiz." Three to five questions appear, generated from that specific function — for example, a predict-the-output question using the exact variable names from their code, not a generic "what is a loop" question. They answer, submit, and see a score with per-question correctness shown.

They then paste a JavaScript snippet doing an array `reduce`, select "JavaScript," and submit. The response comes back in the exact same six-section shape, with complexity analysis correctly reasoned for the JS-specific construct — proving the structural contract holds across languages, not just within one.

### Explicit scope boundary

In scope: everything in Part 3, Tier 1 and Tier 2. Not in scope for this build, and not to be represented by dead UI elements: interview-question generation, flashcards, code comparison mode, daily challenges, glossary panels, or any other feature not explicitly listed in Part 3. Do not build a menu item, tab, or button for anything outside Part 3's scope.

---

## Part 3 — Feature Scope

### Tier 1 — Required (directly maps to the assignment brief; non-negotiable)

1. **Code input** — paste or type a snippet, with a language selector supporting at minimum Python and JavaScript (additional languages from Part 4's list may be added if trivial, but Python and JS must be fully correct).
2. **Plain-English Explanation** — beginner-oriented, jargon-light explanation of what the code does.
3. **Time & Space Complexity Analysis** — correct Big-O for both, each with a one-to-two-sentence justification tied to the actual code structure (loops, recursion, data structures used), not a generic statement.
4. **Line-by-Line Commentary** — every meaningful statement gets its own explanation, rendered as separated, expandable items in the UI.
5. **Suggested Improvements** — concrete, specific suggestions (naming, structure, performance, readability) grounded in the actual submitted code.
6. **Structural Consistency** — all of the above always rendered as separated sections following one fixed schema (Part 8), on every request, regardless of language or input shape.
7. **Quiz Mode** — after an explanation is generated, the user can generate 3–5 comprehension questions derived from that specific code and explanation (a mix of multiple-choice and predict-the-output is sufficient), submit answers, and see a score with per-question feedback.

### Tier 2 — High-Priority Additions (small, deliberate set; do not expand beyond this list)

8. **Overview summary** — a single-sentence purpose statement shown at the top of every result, before the detailed sections (cheap to generate as part of the same structured response, and makes the UI immediately legible).
9. **AI Follow-Up Chat** — a lightweight, scoped chat beneath the result where the user can ask one or more follow-up questions about the specific code just explained. Context is limited to the current code + explanation + chat history for that browser tab; the live conversation itself does not need to survive a page reload, but once a chat session ends its parent analysis (code, result, and any notable Q&A) is still captured by the Local Storage history described in item 12 — the two features share the same underlying analysis record, they just differ in how long the live back-and-forth stays visible.
10. **Export** — export the current explanation as **both Markdown and PDF**. Both formats are required, not optional; PDF export must not be skipped or treated as a stretch goal.
11. **Example snippets** — two or three built-in example snippets per supported language, selectable to pre-fill the input card, purely to make the empty-state landing experience demonstrable without the user needing their own code ready.

12. **Persistent Local Session (required)** — see the full specification in Part 11a. The application persists analysis history and user preferences entirely in the browser's Local Storage, with no server-side database or storage of any kind for this feature.

13. **About / Creator Page (required)** — see the full specification in Part 11b. A dedicated, polished page reachable from the nav bar or footer, presenting the project and its creator in the style of a modern SaaS product's About page.

Nothing beyond items 1–13 is in scope. If you find yourself building a feature not on this list, stop and re-read Part 2's scope boundary.

---

## Part 4 — Technology Stack & Dependency Policy

- **Frontend**: React (with TypeScript), built with Vite. Tailwind CSS for styling, driven by the design tokens in Part 5 (do not hand-roll a separate ad hoc style system — Tailwind's theme configuration should be extended with the exact token values from Part 5).
- **Backend**: Python, FastAPI. Pydantic v2 for all request/response models and for validating structured LLM output.
- **LLM Providers**: Groq API and Google Gemini API, behind a single provider abstraction (Part 7). Support the following models, selectable from the frontend:
  - Groq: `llama-3.3-70b-versatile`
  - Groq: `openai/gpt-oss-120b` (default)
  - Gemini: `gemini-2.5-flash`
- **Supported languages** (Python and JavaScript required; extend to the following only if it does not compromise correctness for the required two): TypeScript, Java, C, C++, Go.
- **Syntax highlighting**: a client-side highlighter (e.g., Shiki or Prism) rendering the pasted code and any code shown inside line-by-line commentary cards.
- **HTTP client**: native `fetch` on the frontend; no additional HTTP client library needed unless a genuine need arises.
- **State management**: React's built-in state/context is sufficient; do not introduce Redux or another state library for an application this size.
- **Deployment target**: a single Docker container deployed to Render as a Docker-based Web Service, serving both the built frontend and the FastAPI backend from one process on one port. See Part 15 for the full deployment architecture — this is not an optional afterthought, it is a build requirement that shapes how the frontend is built and how FastAPI is configured from the start.
- Avoid any dependency — frontend or backend — that does not serve a requirement explicitly stated in this document.

---

## Part 5 — Design System (Stitch-Derived Visual Language)

This project ships with an extracted design system (`stitch-design.css`, `stitch-design.json`, `stitch-DESIGN.md`) captured from Google's Stitch product. Treat these three files as the visual source of truth. Do not invent colors, spacing, or radii outside these tokens. Map the Stitch landing-page/chat-composer aesthetic onto CodeExplain's own layout as follows.

### Design tokens (import verbatim)

```css
--color-background-base: #191a1f;
--color-text-primary: #ffffff;
--color-surface-card: #2a2b35;
--color-pill-button-surface: #3a3b47;
--color-cta-button: #ffffff;
--color-iridescent-accent: #7c6af7;

--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 48px;
--spacing-2xl: 64px;
--spacing-3xl: 96px;

--radius-pill: 9999px;
--radius-card: 24px;
--radius-button: 20px;
--radius-badge: 4px;

--font-google-sans: "Manrope", sans-serif;   /* headings/display — licensed substitute, see Typography section below */
--font-google-sans-text: "Inter", sans-serif; /* body/UI text — licensed substitute, see Typography section below */
```

Load these into `tailwind.config` as theme extensions (custom colors, spacing, borderRadius, fontFamily) so every component uses the design system through Tailwind utility classes, not one-off inline styles. The font substitution referenced by `--font-google-sans` / `--font-google-sans-text` is specified immediately below — read that subsection before wiring up `fontFamily` in Tailwind's theme.

### Typography — licensed font substitution (required)

"Google Sans" and "Google Sans Text" are not freely licensed and must not be used. Substitute a freely licensed pairing that preserves the source design's dual-typeface structure and large, confident display scale:

- **Headings / display type** (maps to the "Google Sans" role): **Manrope** — a geometric, rounded sans that reads as premium and modern at large display sizes, closest in spirit to Google Sans's display character. Sora is an acceptable alternative if Manrope's weight range doesn't suit a given heading; do not mix the two within the same view.
- **Body / UI text** (maps to the "Google Sans Text" role): **Inter** — chosen specifically for its body-text legibility, extensive weight range, and accessibility track record at small sizes (labels, placeholders, badges).

Load both from Google Fonts (or self-hosted, if preferred, for performance) and wire them into the same `--font-google-sans` / `--font-google-sans-text` CSS variable names used elsewhere in this document, so every other section's token references remain valid without renaming — only the font-family value inside those variables changes. Keep every numeric value from the extracted type scale below (size, weight, line-height) exactly as specified; only the typeface itself is substituted. Document this substitution explicitly in `README.md` (a short "Design Notes" section is sufficient) so it's clear this was a deliberate licensing decision, not an oversight — and hold the line on WCAG AA contrast and consistent hierarchy exactly as the original guardrails require.

### Typography scale

| Role | Font | Size | Weight | Line Height |
|---|---|---|---|---|
| Display Headline (hero) | Manrope | 80px | 400 | 1.1 |
| Body Subtitle | Inter | 18px | 400 | 1.5 |
| UI Label (nav, toolbar, badges) | Inter | 13px | 400 | 17.55px |
| Input Placeholder | Inter | 16px | 400 | 1.5 |
| CTA / Pill Label | Inter | 14px | 500 | 1.4 |

Scale the 80px display headline down responsively on narrower viewports (see Part 11's breakpoints) rather than letting it overflow.

### Component mapping (Stitch pattern → CodeExplain component)

- **Hero Section** → CodeExplain's landing view: full-viewport `--color-background-base` background with a subtle dot-grid texture overlay and 2–3 soft `--color-iridescent-accent` gradient blobs positioned behind the headline. Headline: "Understand Code Like Never Before." Subtitle: one sentence describing the product. Centered below it, the code-input card.
- **Prompt Input Card** → **the Code Input Card**: large rounded card (`--radius-card`, `rgba(42,43,53,0.9)` background, `--spacing-lg` padding, max width ~840px) containing a multi-line code textarea (placeholder: "Paste the code you want explained…") with a bottom toolbar row.
- **Toolbar Selector pill** → **Language Selector pill** and **Model Selector pill**: `--color-pill-button-surface` background, `--radius-pill`, leading icon, trailing chevron, exactly per the `toolbar-selector` component spec in `stitch-DESIGN.md`.
- **Toolbar Toggle (active/inactive)** → repurpose the same active/inactive pill pattern for a "Reading view" vs "Compact view" result toggle if implemented, otherwise omit entirely — do not force an unused toggle into the UI just because the source pattern includes one.
- **Primary CTA Button** → the **"Explain Code"** submit button: white fill (`--color-cta-button`), dark text, `--radius-pill`, per the `navigation-cta` spec.
- **Status Badge** → used for the small "Provider: Groq" / "Model: llama-3.3-70b" indicator shown once a result is returned, and for language/concept tags.
- **Navigation Bar** → minimal top nav: wordmark ("CodeExplain") on the left, a single "About" text link on the right alongside (or in place of) any other nav content, leading to the About/Creator page (Part 11b).
- **Surface Card** → the result section containers (Overview, Explanation, Complexity, Line-by-Line, Improvements, Quiz) each render as a `--color-surface-card` rounded card (`--radius-card`) stacked with `--spacing-lg` gaps between them.

### Guardrails (from `stitch-DESIGN.md`, carried forward as hard rules)

- Maintain consistent spacing using the defined spacing scale only — no arbitrary pixel values.
- Maintain WCAG AA contrast (4.5:1 minimum for body text) on the dark background.
- Use the iridescent accent color only for atmospheric background elements and small accents (badges, focus rings) — never as a large fill competing with the white CTA.
- Do not mix rounded and sharp corners within the same view; every card, button, and pill uses one of the four defined radii.
- Do not invent shadows or elevation not present in the token set — keep the interface flat, exactly as the source design does.

### Dark mode is the only mode

The Stitch design system as extracted is dark-only. Ship CodeExplain dark-only for this build; do not build a light theme toggle, since no light-mode tokens were extracted and inventing one would violate the "don't add unsupported visual claims" guardrail above.

---

## Part 6 — System Architecture & Project Structure

```
codeexplain/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app entrypoint, CORS, router registration
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── explain.py       # POST /api/explain
│   │   │       ├── quiz.py          # POST /api/quiz
│   │   │       └── chat.py          # POST /api/chat (follow-up questions)
│   │   ├── services/
│   │   │   ├── llm/
│   │   │   │   ├── base.py          # Provider interface (Part 7)
│   │   │   │   ├── groq_provider.py
│   │   │   │   └── gemini_provider.py
│   │   │   ├── explanation_service.py   # Orchestrates prompt build -> LLM call -> validation
│   │   │   ├── quiz_service.py
│   │   │   └── chat_service.py
│   │   ├── prompts/
│   │   │   ├── explanation_prompt.py    # Part 8 template
│   │   │   ├── quiz_prompt.py            # Part 10 template
│   │   │   └── chat_prompt.py
│   │   ├── models/
│   │   │   ├── explanation.py       # Pydantic schema for the structured contract
│   │   │   ├── quiz.py
│   │   │   └── requests.py
│   │   ├── config/
│   │   │   ├── settings.py          # env-driven settings, validated at startup
│   │   │   └── models_registry.py   # provider/model registry + generation defaults
│   │   ├── core/
│   │   │   └── exceptions.py        # shared exception hierarchy
│   │   └── static.py                # mounts the built frontend + SPA fallback (Part 15)
│   ├── tests/
│   │   ├── unit/
│   │   └── fixtures/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/               # NavBar, PageShell
│   │   │   ├── landing/              # Hero, GradientBlobs, DotGridBackground
│   │   │   ├── input/                # CodeInputCard, LanguagePill, ModelPill, ExamplePicker
│   │   │   ├── result/               # ResultCard, OverviewSection, ExplanationSection,
│   │   │   │                         # ComplexitySection, LineByLineSection, ImprovementsSection
│   │   │   ├── quiz/                 # QuizPanel, QuizQuestion, QuizScore
│   │   │   ├── chat/                 # FollowUpChat
│   │   │   ├── about/                # AboutPage, CreatorProfile, SocialLinks, FeatureCardGrid
│   │   │   └── shared/               # Badge, Button, Card primitives styled from tokens
│   │   ├── hooks/                    # useExplain, useQuiz, useChat, useHistory
│   │   ├── lib/
│   │   │   ├── api.ts                # typed fetch wrappers to the backend
│   │   │   ├── types.ts              # TypeScript mirrors of backend Pydantic models
│   │   │   └── storage.ts            # typed Local Storage wrapper (Part 11a)
│   │   ├── styles/
│   │   │   └── tokens.css            # the Stitch tokens from Part 5
│   │   ├── examples/                 # built-in example snippets per language
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tailwind.config.ts            # extended with Part 5 tokens
│   ├── package.json
│   └── .env.example
├── docs/
│   ├── ARCHITECTURE.md
│   ├── SETUP.md
│   ├── DEPLOYMENT.md                 # Render deployment guide (Part 15)
│   └── DESIGN_SOURCE/                # copy of the original stitch-* files, preserved as reference
├── Dockerfile                         # multi-stage build: frontend build -> backend runtime (Part 15)
├── .dockerignore
├── start.sh                            # optional single-command startup script (Part 15)
├── README.md
└── .gitignore
```

Every file above must carry a module-level docstring (Python) or top-of-file comment block (TypeScript) explaining its responsibility, and every non-trivial function must be commented inline explaining *why*, not just restating *what* the code does — see Part 14.

---

## Part 7 — LLM Provider Abstraction Layer

Groq and Gemini must be interchangeable purely through configuration, with zero code changes required to switch the active provider or model. Define one interface in `services/llm/base.py` that both `groq_provider.py` and `gemini_provider.py` implement, exposing a single capability: accept a fully rendered system+user prompt pair plus generation parameters (temperature, max tokens, and a flag indicating whether the caller expects strict JSON output), and return the raw text response.

Each provider implementation is responsible for: reading its own credentials from `config/settings.py` (never reading environment variables directly outside that one module); applying a request timeout; applying retry-with-backoff on transient failures (network errors, 429/5xx) up to a small bounded number of attempts; and translating provider-specific errors into the shared exception hierarchy in `core/exceptions.py`, so the orchestration layer never needs to know which provider is active to handle a failure.

`config/models_registry.py` declares the available (provider, model) pairs and their generation defaults in one place. Use a low temperature (close to 0) for the explanation and complexity-analysis calls, since correctness matters far more than creative variation; a slightly higher temperature is acceptable for the follow-up chat feature (Tier 2, item 9), where more natural phrasing has real value.

If the selected provider/model call fails after retries, automatically fall back to the next configured (provider, model) pair before surfacing an error to the user, and surface which provider actually produced the result via the Status Badge described in Part 5.

---

## Part 8 — Prompt Engineering & Structured Output Contract

This is the most important part of this specification. Every `/api/explain` call must produce a response that validates against a single, fixed Pydantic schema, regardless of language or input.

### Response schema (`models/explanation.py`)

```python
class ComplexityAnalysis(BaseModel):
    big_o: str                 # e.g. "O(n log n)"
    reasoning: str              # why, tied to the actual code structure

class LineCommentary(BaseModel):
    line_range: str              # e.g. "3-4" or "7"
    code_snippet: str
    explanation: str

class Improvement(BaseModel):
    title: str
    detail: str
    category: Literal["naming", "performance", "readability", "structure", "bug_risk"]

class ExplanationResponse(BaseModel):
    overview: str                       # one-sentence purpose statement
    plain_english_explanation: str
    time_complexity: ComplexityAnalysis
    space_complexity: ComplexityAnalysis
    line_by_line: list[LineCommentary]
    improvements: list[Improvement]
    detected_language: str
    provider_used: str
    model_used: str
```

### Prompt construction rules

The system prompt sent to the LLM must: state explicitly that the response must be **valid JSON matching this exact schema and nothing else** (no markdown fences, no prose before or after); provide the schema field-by-field in the prompt itself so the model does not have to infer it; instruct the model to reason specifically about the *submitted code's* actual loops, recursion, and data structures when producing complexity analysis, rather than pattern-matching to a superficially similar well-known algorithm; and instruct the model to keep the plain-English explanation free of jargon, suitable for a first-year student.

### Parsing & validation pipeline

1. Strip any markdown code fences the model may have added despite instructions.
2. Attempt `json.loads`, then validate against `ExplanationResponse` via Pydantic.
3. If validation fails, make **one** repair attempt: re-prompt the same provider with the invalid output and the specific validation error, asking it to correct only the malformed field(s).
4. If the repair attempt also fails, raise a typed `StructuredOutputError` and let the error-handling layer (Part 13) surface a clear, specific message — never let a malformed or partial object reach the frontend.

Every successful response, across every language and every provider/model combination, must satisfy this schema. This is the property that must hold to satisfy the assignment's "structured sections that stay consistent across many inputs" requirement — treat it as testable, and test it (Part 15, Phase 2) against real snippets in both Python and JavaScript before considering the feature done.

---

## Part 9 — Backend API Contract

**`POST /api/explain`**
Request: `{ code: string, language: string, provider?: string, model?: string }`
Response: `ExplanationResponse` (Part 8), or a structured error object `{ error: { type: string, message: string } }` with an appropriate HTTP status code.

**`POST /api/quiz`**
Request: `{ code: string, language: string, explanation: ExplanationResponse }`
Response: `{ questions: QuizQuestion[] }` (schema in Part 10).

**`POST /api/chat`**
Request: `{ code: string, language: string, explanation: ExplanationResponse, history: ChatMessage[], question: string }`
Response: `{ answer: string }`

All three endpoints share one error envelope shape so the frontend can handle failures generically (Part 13). All endpoints validate request bodies with Pydantic and reject malformed requests with a 422 before ever constructing an LLM prompt.

**`GET /api/health`**
Response: `{ status: "ok", provider_reachable: { groq: boolean, gemini: boolean } }`. Used as Render's configured Health Check Path and by anyone verifying the deployed container is alive (Part 15). This route must never call an LLM with a real generation request — it only confirms configuration is loaded and, at most, performs a lightweight connectivity check.

---

## Part 10 — Quiz Engine Specification

### Response schema

```python
class QuizQuestion(BaseModel):
    id: str
    type: Literal["multiple_choice", "predict_output"]
    prompt: str
    options: list[str] | None       # populated for multiple_choice, null for predict_output
    correct_answer: str
    explanation: str                 # shown after the user answers
```

### Generation rules

Generate 3–5 questions per request, derived directly from the specific submitted code and its explanation — variable names, function names, and actual control flow from the snippet must appear in at least two of the generated questions, so a generic, code-agnostic question bank would fail this requirement on inspection. Include at least one `predict_output` question when the code is deterministic and has no external I/O; fall back to `multiple_choice` only for that question if the code's output cannot be meaningfully predicted (e.g., it reads from stdin or uses randomness) — in that case, ask about behavior or complexity instead of literal output.

### Frontend behavior

Answers are hidden until the user submits the full quiz (not revealed question-by-question). After submission, show a score (`n / total`) and, per question, the user's answer, the correct answer, and the stored explanation string.

---

## Part 11 — Frontend Application Specification

### Views

1. **Landing / Input View** — the Hero + Code Input Card described in Part 5. This is the only view when no result exists yet.
2. **Result View** — appears below the input card once `/api/explain` succeeds, without navigating away from the input (the user should be able to scroll up and re-submit different code without losing context awkwardly). Renders, in order: Status Badge (provider/model used) → Overview → Plain-English Explanation → Time Complexity → Space Complexity → Line-by-Line Commentary (list of expandable cards) → Suggested Improvements (list, grouped/labelled by category) → Quiz panel (collapsed until "Generate Quiz" is clicked) → Follow-Up Chat panel.

### Interaction requirements

- Submitting shows a loading state on the CTA button (per the `navigation-cta` spec — do not redesign the button for its loading state, just disable it and show a small inline spinner within the same pill shape).
- Example snippets (Tier 2 item 11) are selectable from a small row of chips above the input card; selecting one populates the textarea and language pill together.
- The Language Selector and Model Selector pills follow the exact `toolbar-selector` visual spec from Part 5 (pill surface, leading icon, trailing chevron, dropdown on click).
- Export (Tier 2 item 10) is a small action available once a result exists, offering at minimum "Copy as Markdown" and, if implemented, "Download PDF."
- Responsive behavior: at ≤768px, stack the hero text and input card vertically, reduce the 80px display headline to a smaller responsive size (e.g. clamp between 36–48px), and ensure the code input card and all result cards go full-width with the same `--spacing-md` side padding.

### Frontend responsibility boundary

The frontend never constructs prompts, never talks to Groq or Gemini directly, and never guesses at a response shape the backend didn't send — it renders exactly what `ExplanationResponse` and `QuizQuestion` describe, using the shared TypeScript types in `lib/types.ts` that mirror the backend Pydantic models field-for-field.

---

## Part 11a — Persistent Local Session (Required)

This feature is mandatory, not a nice-to-have. The application persists user data across page reloads and full browser restarts using the browser's **Local Storage only** — no database, no server-side session store, and no analysis content is ever sent to or stored on the backend beyond the lifetime of a single request/response cycle.

### What must persist

- The complete analysis history: every code snippet submitted, its full `ExplanationResponse`, and the timestamp of the analysis.
- Metadata about the submission (detected/selected language, provider/model used) alongside each history entry.
- User preferences: currently only the design system is dark-mode-only (Part 5), so "theme" persistence is not applicable in this build, but the storage layer must still be structured generically enough (language default, last-used model, any future setting) that adding a real preference later is a one-line addition, not a refactor.
- On reopening the app (new tab, browser restart, page refresh), the previous session is restored automatically: the history panel repopulates from Local Storage without any user action required.

### What must never persist server-side

No analysis, history entry, or preference is ever written to a database or sent to any backend endpoint for storage purposes. The backend remains fully stateless with respect to user history — `/api/explain`, `/api/quiz`, and `/api/chat` receive what they need to answer a single request and retain nothing about the caller afterward. This is a hard boundary, not a default that can quietly grow a database later.

### Implementation

Implement a small, dedicated `frontend/src/lib/storage.ts` module wrapping `window.localStorage` behind a typed interface (`getHistory()`, `addHistoryEntry()`, `clearHistory()`, `getPreferences()`, `setPreference()`), so no component calls `localStorage` directly. Guard every read with try/catch (Local Storage can throw in private-browsing modes or when full) and fail gracefully to an empty-history state rather than crashing the app. Cap total stored history (e.g. a reasonable maximum entry count, oldest evicted first) so Local Storage's size limits are never silently exceeded.

### Clear History control

Provide a dedicated, clearly labeled **"Clear History"** action (reachable from the history panel and, if there is one, a settings area) that:

- Shows a confirmation dialog before deleting anything — this action must never fire from a single accidental click.
- Deletes all locally stored analysis history when confirmed.
- Optionally clears cached preferences too, presented as a distinct, separately-confirmed choice from clearing history, so a user clearing their history doesn't accidentally reset settings they wanted to keep.
- Returns the application to its true initial (first-visit) state once confirmed.

---

## Part 11b — About / Creator Page (Required)

A dedicated page, reachable from the nav bar (Part 5) and from the footer, built to the same design-system standard as the rest of the application (Part 5's tokens, cards, and typography) — not a bare, unstyled credits list. It should read like a genuine SaaS product's About page.

Render the following content, adapted into the appropriate cards/sections rather than as a single wall of text — feature highlights as a card grid, the creator section as a distinct profile block, and social links as icon buttons:

**About CodeExplain** — CodeExplain was built to bridge the gap between reading code and truly understanding it. Many beginners struggle to understand existing source code because most AI tools simply explain what the code does without teaching why it works. CodeExplain focuses on making complex code accessible through plain-English explanations, line-by-line walkthroughs, complexity analysis, improvement suggestions, and interactive follow-up questions. Whether the reader is a student preparing for interviews, a developer exploring an unfamiliar codebase, or someone learning a new programming language, CodeExplain helps them understand code instead of merely reading it.

**Why I Built This** — As a computer science student, understanding existing code was often harder than writing new code — documentation is frequently incomplete, tutorials rarely explain every line, and large codebases are intimidating for beginners. CodeExplain exists to make code comprehension faster, more intuitive, and more educational by pairing AI-powered explanations with a clean, modern user experience, with the goal of building genuine programming intuition rather than encouraging copy-paste habits.

**Key Benefits** (render as feature cards): Plain-English explanations; Line-by-line code walkthroughs; Time & Space Complexity analysis; Improvement and readability suggestions; AI-powered follow-up Q&A; Markdown & PDF export; Multi-language support; Modern responsive interface; Persistent local history; Privacy-first design (all history stored locally).

**Privacy Note** (render as a subtle, distinct callout, not a full section): "Your analysis history is stored locally in your browser. Nothing is uploaded or saved permanently unless required for AI processing. You remain in control of your data and can clear everything at any time."

**Creator** — Designed & Developed by **Mohammad Fayas Khan**, Computer Science Engineering Student, AI & Full-Stack Developer.

**Connect** (render as icon-labeled social buttons): GitHub — `https://github.com/MohammadFayasKhan`; LinkedIn — `https://www.linkedin.com/in/mohammadfayaskhan`; Instagram — `https://www.instagram.com/fayaskhanx`.

**Footer** (site-wide, not just on the About page) — include: "© 2026 CodeExplain • Crafted with ❤️ by Mohammad Fayas Khan"; the line "This project was created to make programming concepts easier to understand through AI-powered explanations and an exceptional user experience."; GitHub/LinkedIn/Instagram links; a version number; and placeholder License / Privacy / Terms links (these can point to simple static routes or anchors — they do not need real legal content for this build, but they must exist as functioning links rather than dead text).

Give the About page tasteful entrance animations and card treatments consistent with the rest of the app's motion language (Part 5) — this page is a portfolio artifact in its own right and should hold up to close inspection.

---

## Part 12 — Configuration & Secrets Management

- Backend: `.env` (git-ignored) holds `GROQ_API_KEY`, `GEMINI_API_KEY`, `ACTIVE_PROVIDER`, `ACTIVE_MODEL`, `PORT`, `ALLOWED_ORIGIN`, `LOG_LEVEL`, `REQUEST_TIMEOUT_SECONDS`. `backend/.env.example` documents every variable with a comment, containing no real values — only placeholder text (e.g. `GROQ_API_KEY=your_groq_api_key_here`).
- Frontend: `.env` holds only the backend API base URL (e.g. `VITE_API_BASE_URL`) — never an LLM API key. `frontend/.env.example` mirrors this.
- `config/settings.py` loads and validates all backend environment variables once at startup using `python-dotenv` + Pydantic settings, failing fast with a clear message if a required key is missing, rather than failing later inside a request handler.
- No secret of any kind is ever hardcoded, logged, or sent to the frontend.
- **No real API key, token, or credential value is ever written into any file that ends up in version control** — not in `README.md`, not in `docs/`, not in `PROMPT.md`, not in a commit message, not in a code comment. `.env` is git-ignored; `.env.example` contains structure and placeholders only. If a real key is ever accidentally pasted into a chat, commit, or document during development, treat it as compromised and rotate it at the provider — do not simply delete the text and reuse the same key.

---

## Part 13 — Error Handling Strategy

Every failure category below must produce a specific, calm, user-facing message on the frontend and a fully detailed log entry on the backend — never a raw stack trace or an unhandled promise rejection reaching the UI.

| Category | Example | User-facing behavior |
|---|---|---|
| Empty/invalid input | No code pasted, or input exceeds a sane length cap | Inline validation message beneath the input card; request never sent |
| Provider timeout/failure | Groq request times out | Automatic fallback to next configured provider (Part 7); if all fail, a specific "AI service is temporarily unavailable" message |
| Malformed LLM output | Model returns invalid JSON, repair attempt also fails | "We couldn't generate a structured explanation for this snippet — please try again" with an internal log capturing the raw output |
| Unsupported language selected | Language not in the supported list | Disabled option in the pill selector; not reachable as a runtime error |
| Network failure (frontend to backend) | Backend unreachable | Toast-style error with a retry action |

Wrap the FastAPI app with a global exception handler that catches anything not already handled by a specific `except` block, logs it with full context, and returns the shared error envelope (Part 9) rather than a default framework error page.

---

## Part 14 — Code Quality & Documentation Standards

- **Comments requirement (explicit, non-negotiable):** every backend module opens with a docstring describing its responsibility; every function/method has a docstring describing parameters, return value, and any non-obvious behavior; every non-trivial block of logic (prompt construction, validation/repair flow, provider fallback logic) has inline comments explaining the reasoning, not just a restatement of the code. Every frontend file opens with a short comment block describing its role in the component tree; every non-trivial hook or utility function is documented with a comment explaining its contract.
- Backend: PEP 8 compliant, fully type-hinted, Pydantic models for every request/response boundary.
- Frontend: strict TypeScript (no implicit `any`), typed props on every component, no unused exports.
- One consistent error-handling pattern across all backend routes (raise typed exceptions, handled centrally — see Part 13) and one consistent pattern for handling async request state on the frontend (loading/error/success) reused across `useExplain`, `useQuiz`, and `useChat`.
- `docs/ARCHITECTURE.md` documents the module boundaries, the structured-output contract, the provider fallback flow, and every non-obvious design decision made during the build.
- `docs/SETUP.md` is a literal, step-by-step guide (install dependencies, set environment variables, run backend, run frontend) that someone who has never seen the project could follow to get it running locally.
- `README.md` gives a short project overview, feature list (matching Part 3 exactly — no more, no less), tech stack, and a link to `docs/SETUP.md`.

---

## Part 15 — Deployment Architecture (Render)

This is a mandatory build requirement, not an optional deployment note. The finished repository must be directly deployable to Render as a single Docker-based Web Service with no structural changes — no splitting into two services, no separate frontend host, no manual post-clone rewiring. Design the application from Phase 1 onward with this single-container shape in mind; do not build it as two independently-deployed services and try to bolt them together at the end.

### Two environments, one codebase, zero structural forking

This build must satisfy **both** of the following simultaneously, without maintaining two separate versions of the app to do it:

- **Local/preview development (e.g. the Emergent preview environment):** the frontend and backend run as two separate processes under a standard supervisor setup — frontend on port 3000, backend on port 8001 — exactly as today. Nothing about this workflow changes.
- **Production (Render):** the exact same repository, built via the Dockerfile described below, runs as a single container serving both the compiled frontend and the API from one process on one port, deployed as a Render Web Service with a Docker runtime environment.

The way this stays a single codebase rather than two forks is that the backend's port-binding, CORS origin, and static-serving logic are all environment-variable-driven (Part 12) rather than hardcoded — in preview, the backend simply doesn't mount the static frontend build (it isn't built/present) and CORS allows the dev frontend's origin; in the Docker image, the frontend is built as part of the image and the backend mounts and serves it, with CORS locked to the deployed Render URL. No `if environment == "preview"` branching logic should be needed beyond reading these environment variables — the same `static.py` mount-and-fallback code path runs in both cases, it simply has nothing to mount when no built frontend is present locally.

### Single-container model (production)

The application ships as **one** Docker image containing both the compiled frontend and the FastAPI backend. There is no separate frontend deployment and no separate backend deployment — one container, one process, one port, listening for both the API and the static site. On Render this is configured as a single Web Service with "Docker" selected as the runtime/environment, pointed at the repository's root `Dockerfile`.

### Build-time flow (inside the Dockerfile)

Use a multi-stage Dockerfile:

1. **Stage 1 — frontend build.** A Node base image installs `frontend/package.json` dependencies (with dependency layers cached separately from source copy layers, so an unchanged `package.json` doesn't force a full reinstall on every code change) and runs the Vite production build, producing static assets (`frontend/dist/`).
2. **Stage 2 — backend runtime.** A slim Python base image installs `backend/requirements.txt` (again with the dependency-install layer cached ahead of the source-copy layer), copies the backend application code, and copies **only the built static assets** from Stage 1 into a location the backend serves from (e.g. `backend/app/static/`). The final image must not contain Node, npm, or any frontend source/toolchain — only the compiled output and the Python runtime needed to serve it.

Keep both stages as lean as possible: use slim/alpine-class base images where compatible, avoid installing build tools that aren't needed at runtime, and ensure `.dockerignore` (root-level, see below) excludes `node_modules`, `__pycache__`, `.git`, local `.env` files, test fixtures, and any other content not needed inside the image. Render's build process pulls directly from the connected GitHub repository and builds the Dockerfile itself — no pre-built image needs to be pushed anywhere manually.

### Serving the frontend from FastAPI

`backend/app/core/static.py` is responsible for: mounting the built static assets directory so JS/CSS/image assets are served correctly; and implementing an SPA fallback so that any request path not matching `/api/*` and not matching a real static file returns `index.html`, allowing React Router (if client-side routing is used) to handle the route on the client rather than FastAPI returning a 404 for deep links. Register this static mount and fallback **after** all `/api/*` routers in `main.py`, so API routes are always matched first and the SPA fallback never shadows a real API endpoint.

### Port configuration

The application must read the listening port from the `PORT` environment variable at container start, since Render dynamically injects this variable and expects the service to bind to it — never to a fixed, hardcoded port. Use a sensible local-development fallback (e.g. `8000`) for when `PORT` is unset, purely so `docker run` still works on a developer's machine without Render's environment present. The Dockerfile's `CMD` (or `start.sh`, if used) must read this variable at container start, never at build time.

### `.dockerignore` (root-level, required contents at minimum)

```
node_modules
frontend/node_modules
frontend/dist
**/__pycache__
*.pyc
.git
.gitignore
.env
**/.env
backend/.env
frontend/.env
tests/
docs/DESIGN_SOURCE/
```

(`frontend/dist` is excluded from the build context sent to Stage 2's `COPY` source in favor of being generated fresh inside Stage 1 — do not rely on a pre-built `dist/` folder committed to the repo.)

### CORS

In the deployed single-container shape, the frontend and backend share an origin (the browser talks to the same host and port for both the static site and `/api/*`), so CORS restrictions can be strict: allow only the deployed Render service's own URL (configurable via an environment variable, e.g. `ALLOWED_ORIGIN`, defaulting sensibly for local development to `http://localhost:5173` so the Vite dev server continues to work during development against a locally running backend on a different port).

### Startup, logging, and health checks

- Provide a single, deterministic startup command (either directly in the Dockerfile's `CMD`, e.g. `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`, or via a thin `start.sh` if any pre-flight step is genuinely needed — do not add a startup script that does nothing beyond what `CMD` could do directly).
- Configure structured logging (level configurable via an environment variable, defaulting to `INFO`) that writes to stdout, since Render captures container stdout/stderr as the service's log stream — do not log only to a file inside the container.
- Implement `/api/health` (Part 9) and configure it as the Health Check Path in the Render service's settings, so Render's own monitoring can detect a healthy deploy and restart the service automatically if it stops responding.
- The global exception handler from Part 13 applies identically in production; no debug/traceback details are ever exposed in a response body outside local development.

### Local development vs. production

Local development still runs the Vite dev server (`frontend`) and the FastAPI server (`backend`) as two separate processes on two different ports, proxying `/api` calls from Vite to the backend during development, exactly as today — this deployment architecture does not change the local dev workflow described in Part 16's phases. It only governs how the final, built artifact is packaged and served. Document both workflows clearly and separately in `docs/SETUP.md` (local development) and `docs/DEPLOYMENT.md` (Render).

### `docs/DEPLOYMENT.md` must contain

- The exact list of required environment variables (`GROQ_API_KEY`, `GEMINI_API_KEY`, `ACTIVE_PROVIDER`, `ACTIVE_MODEL`, `ALLOWED_ORIGIN`, `LOG_LEVEL`, and any others introduced during the build) and where to set them in Render's dashboard (Environment tab, added as secret environment variables — never committed to the repo).
- Step-by-step instructions for creating a new Render Web Service from this GitHub repository (select "Docker" as the environment, leave the build/start commands to the Dockerfile, set the Health Check Path to `/api/health`, add the environment variables, and deploy) — written for someone who has never created a Render service before.
- Confirmation that no code change is required after cloning; only environment variable configuration.
- A short note on how to verify the deployment succeeded (hitting `/api/health` on the live Render URL, loading the root URL and confirming the landing page renders, and confirming auto-deploy triggers correctly on a push to the connected branch, if enabled).

---

## Part 16 — Phased Implementation Plan

#### Phase 1 — Backend Foundations
Set up the FastAPI project structure, `config/settings.py`, `models_registry.py`, the exception hierarchy, and the provider abstraction (`base.py`, `groq_provider.py`, `gemini_provider.py`) with a trivial hardcoded prompt just to prove connectivity to both providers. **Gate:** you can call both providers successfully from a script and get raw text back.

#### Phase 2 — Structured Explanation Pipeline
Implement `models/explanation.py`, the explanation prompt template (Part 8), `explanation_service.py`'s full generate → parse → validate → repair-retry flow, and the `/api/explain` route. Test against at least five distinct Python snippets and five distinct JavaScript snippets, covering at least one loop-based, one recursive, and one data-structure-heavy example per language. **Gate:** every one of those ten test snippets returns a schema-valid `ExplanationResponse` with genuinely correct, language-appropriate complexity reasoning — not just valid JSON shape.

#### Phase 3 — Quiz & Chat
Implement `models/quiz.py`, the quiz prompt template (Part 10), `quiz_service.py`, and `/api/quiz`. Implement `chat_service.py` and `/api/chat` for the scoped follow-up feature. **Gate:** for at least three of the Phase 2 test snippets, the generated quiz contains questions referencing that snippet's actual variable/function names, and a follow-up chat question about that snippet gets a relevant, context-aware answer.

#### Phase 4 — Frontend Foundations & Design System
Set up the Vite + React + TypeScript project, Tailwind configured with the exact Part 5 tokens, `lib/types.ts` mirroring the backend schemas, and the Landing/Hero + Code Input Card exactly per Part 5's component mapping (dot-grid background, gradient blobs, pill selectors, CTA button). **Gate:** the landing view visually matches the Stitch design language (colors, radii, spacing, typography) with no arbitrary values outside the token set.

#### Phase 5 — Result Rendering
Build every Result View section component (Part 11) wired to real `/api/explain` responses from the running backend. Implement loading and error states per Part 13. **Gate:** submitting each of the ten Phase 2 test snippets renders all six required sections correctly and consistently in the UI.

#### Phase 6 — Quiz UI, Chat UI, Export, Examples
Build `QuizPanel`, `FollowUpChat`, the Markdown/PDF export action, and the example-snippet chips. **Gate:** a full user journey — pick an example, get an explanation, generate and complete a quiz, ask one follow-up question, export the result as Markdown — works end to end with no console errors.

#### Phase 7 — Containerization & Deployment
Write the multi-stage `Dockerfile`, root `.dockerignore`, `backend/app/core/static.py`'s mount-and-fallback logic, and `PORT`-aware startup exactly per Part 15. Build the image locally, run the container with only environment variables set (no bind-mounted source), and confirm the full application — landing page, explanation, quiz, chat, export — works end to end through the single exposed port with no separate frontend process running. **Gate:** `docker build` succeeds, `docker run` with only `GROQ_API_KEY`/`GEMINI_API_KEY` set and an explicit `PORT` passed in (mirroring how Render injects it) serves a fully working application on that port, the same image also runs correctly if `PORT` is left unset locally (falling back to the documented local default), and a request to a deep-linked frontend route (not just `/`) still returns the app rather than a 404.

#### Phase 8 — Hardening & Documentation
Work through every row of Part 13's error table and confirm each is handled gracefully. Write `README.md`, `docs/ARCHITECTURE.md`, `docs/SETUP.md`, and `docs/DEPLOYMENT.md` per Parts 14 and 15. Do a final pass confirming every file meets the commenting standard in Part 14. **Gate:** Part 17's checklist passes in full.

---

## Part 17 — Final Acceptance Checklist & Closing Directive

Before considering this project finished, confirm every item below:

- [ ] Explanations are correct and appropriately detailed for at least Python and JavaScript, with genuinely correct, code-specific complexity analysis for both.
- [ ] Every successful `/api/explain` response validates against the exact schema in Part 8, verified across a range of different snippets, not just one happy-path example.
- [ ] Quiz Mode generates questions derived from the actual submitted code, not a generic bank, and scoring works correctly.
- [ ] The UI visually matches the Stitch-derived design system: exact colors, radii, spacing, and typography tokens from Part 5, with no invented visual elements outside that system.
- [ ] Every feature present in the UI is listed in Part 3; nothing out-of-scope has been built.
- [ ] Provider fallback works: a simulated failure of the primary provider results in a successful fallback response, not a user-facing error.
- [ ] No secret exists anywhere in the codebase; both `.env.example` files are accurate and complete.
- [ ] Every error category in Part 13 produces a calm, specific user-facing message and a detailed backend log entry — no raw stack trace ever reaches the browser.
- [ ] Every backend module and frontend component file meets the commenting/documentation standard in Part 14.
- [ ] `README.md`, `docs/ARCHITECTURE.md`, and `docs/SETUP.md` are complete and someone unfamiliar with the project could get it running from `SETUP.md` alone.
- [ ] No TODO, FIXME, or placeholder implementation remains anywhere in the codebase.
- [ ] A single `docker build` + `docker run` (env vars only, no source bind-mounts) serves the complete application — landing page, explanation, quiz, chat, export — from one container on one port.
- [ ] The server reads `PORT` from the environment correctly and falls back to a sensible local default only when running outside Render (Render always injects its own value).
- [ ] Deep-linked frontend routes (not just `/`) are served correctly by the FastAPI SPA fallback rather than 404ing.
- [ ] `/api/health` responds correctly without triggering a real LLM generation call.
- [ ] The root `Dockerfile` is multi-stage, produces no leftover Node/npm toolchain in the final image, and the root `.dockerignore` excludes `node_modules`, caches, `.env` files, and test/dev-only content.
- [ ] `docs/DEPLOYMENT.md` gives complete, accurate, step-by-step Render Web Service (Docker) setup instructions, including every required environment variable/secret and the Health Check Path configuration.
- [ ] The repository as committed (no manual post-clone edits) is directly deployable to a Render Web Service.
- [ ] The exact same repository also runs correctly under the standard supervisor preview setup (frontend on 3000, backend on 8001) with no code branching between the two environments beyond environment-variable-driven configuration.
- [ ] Export produces both a working Markdown file and a working PDF file — neither format is a stub.
- [ ] Analysis history and preferences survive a full page reload and a full browser restart via Local Storage, with nothing equivalent stored server-side.
- [ ] "Clear History" requires explicit confirmation and correctly returns the app to its true first-visit state.
- [ ] The About/Creator page is reachable from both the nav bar and the footer, matches the design system, and contains every section specified in Part 11b.
- [ ] No real API key or credential value appears anywhere in the committed repository, including in `README.md`, `docs/`, or `PROMPT.md`.

**Closing directive.** Build this autonomously, phase by phase, in the order given. Do not add features beyond Part 3's scope, no matter how easy they seem to bolt on — the value of this project is a small set of features executed correctly, consistently, and inside a genuinely polished, design-system-accurate interface, not a large feature surface executed shallowly. When you finish, you should have a working application where every response is structurally trustworthy, every screen matches the supplied design language, and every file in the repository is legible to someone reading it for the first time.