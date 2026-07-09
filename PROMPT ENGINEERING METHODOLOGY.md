# Prompt Engineering — Methodology & Technique Mapping

**Companion document to `PROMPT.md`.** Where `PROMPT.md` is the build specification itself, this document explains the specification *as a prompt* — what kind of prompt it is, why it was written this way, and how the choices in it map onto the prompt-engineering techniques taught in the *AI Engineer Launchpad* course (Unit 2 — Prompt Engineering and Reasoning, CO2: *"Apply advanced prompt engineering and reasoning strategies, including zero-shot, few-shot, chain-of-thought, and function calling, to build effective LLM-driven applications."*).

This project uses prompt engineering at two distinct layers, and it's worth separating them before mapping techniques:

- **Layer 1 — the build prompt.** `PROMPT.md` itself, given to a coding agent to generate the application. This is a *human-to-agent* prompt.
- **Layer 2 — the runtime prompts.** The system/user prompts the deployed backend sends to Groq and Gemini for every `/api/explain`, `/api/quiz`, and follow-up chat call. This is a *product-to-model* prompt, and it's the layer CO2's techniques apply to most directly.

Both layers are covered below.

---

## 1. What kind of prompt is `PROMPT.md`?

`PROMPT.md` is a **specification prompt** (sometimes called a meta-prompt or a system-level build brief) rather than a conversational one. The distinction matters: a conversational prompt gets refined turn by turn as the model asks questions or produces something slightly off; a specification prompt tries to eliminate that back-and-forth entirely by resolving every ambiguity *before* generation starts — tech stack, feature scope, data schemas, visual design tokens, deployment target, and acceptance criteria are all pinned down in the document itself.

This was a deliberate choice, not a default. A code-generation task like this one has a large surface area (frontend, backend, LLM integration, design system, deployment) where an agent left to improvise would produce something *plausible* but inconsistent — a different response shape for Python than for JavaScript, a UI that drifts from the intended design system, a Docker setup that works in preview but not on Hugging Face. Front-loading every constraint turns each of those risks into an explicit, checkable requirement instead of something hoped for.

---

## 2. Why this approach, specifically for this project

The assignment brief for CodeExplain has three success criteria, and each one is exactly the kind of thing that degrades quietly under ordinary prompting if it isn't pinned down explicitly:

| Assignment requirement | Why it needs a specification prompt, not a loose one |
|---|---|
| Explain snippets in at least two languages with **correct** complexity analysis | A loosely prompted agent (or a loosely prompted runtime LLM call) tends to produce *plausible-sounding* Big-O answers by pattern-matching to familiar algorithms, rather than actually reasoning about the submitted code's real loops/recursion. The build prompt forces this by requiring the reasoning to be tied to the code's actual structure, and by requiring test coverage across both languages before the feature is considered done. |
| Structured sections that **stay consistent** across many inputs | Consistency across dozens of different inputs, languages, and providers is not something you get by asking nicely once — it's a property you have to encode as a schema and validate mechanically. This is why the build prompt defines an exact Pydantic response contract and a validate → repair-retry → typed-error pipeline, rather than just saying "return organized sections." |
| Quiz Mode generates questions **from the actual code** | A model given a vague "make a quiz" instruction will often default to a generic, code-agnostic question bank. The build prompt explicitly requires questions to reference the submitted code's real variable and function names, which is a testable, falsifiable constraint rather than a hope. |

---

## 3. Technique Mapping — Layer 1 (the build prompt, `PROMPT.md`)

| Technique | Used? | Where in `PROMPT.md` | Why |
|---|---|---|---|
| **Specification-driven / meta-prompting** | ✅ Primary technique | The entire document | Encodes every constraint (schema, scope, design tokens, deployment target) up front so the agent has no ambiguity left to resolve mid-build. |
| **Role prompting** | ✅ | Opening line ("You are a senior full-stack engineer…") | Anchors the agent's defaults toward production-grade engineering judgment rather than demo-quality shortcuts, without needing to spell out every micro-decision. |
| **System-level constraint framing** | ✅ | "Non-Negotiable Operating Principles" section | Functions like a system prompt for the build: rules that apply across every phase of generation, not just the next instruction. |
| **Structured / schema-constrained output** | ✅ | "Structured Output Contract" section | Turns "consistent sections" from a vague aspiration into a Pydantic schema the backend can mechanically validate — this is the single most direct application of CO2's structured-output theme. |
| **Constraint gating (explicit scope lock)** | ✅ | Tier 1 / Tier 2 feature lists + "nothing beyond these items" language | Prevents feature creep, which is a common failure mode when an agent is given an open-ended brief instead of a bounded one. |
| **Zero-shot prompting** | ✅ | The whole document | No worked examples or sample outputs are given — the spec is precise enough that the agent doesn't need a demonstration to know what "done" looks like. Appropriate here because the task is well-defined, not because zero-shot is always superior to few-shot. |
| **Few-shot prompting** | ❌ Not used at this layer | — | Deliberately omitted. The build task is broad (an entire application) rather than a narrow, pattern-matchable output, so worked examples would either be too long to be practical or would bias the agent toward copying surface details instead of following the underlying rules. |
| **Chain-of-thought (explicit, in the prompt text)** | ❌ Deliberately excluded | — | The prompt does not narrate step-by-step reasoning for the agent to imitate. Reasoning is expected to happen in the agent's own planning during the build (see the "think before you build" instruction), not padded into the instructions themselves — this keeps the specification dense and avoids the token bloat that comes from restating obvious intermediate steps. |
| **Task decomposition (phased planning)** | ✅ | "Phased Implementation Plan," with a Definition-of-Done gate per phase | Functions as an externally imposed analogue to chain-of-thought: instead of asking the model to *reason* its way through the build in one pass, the prompt itself decomposes the work into sequential, independently verifiable phases. |
| **Self-verification / checklist prompting** | ✅ | "Final Acceptance Checklist" | Asks the agent to check its own output against explicit criteria before declaring the build finished, rather than trusting a single pass to be correct. |

---

## 4. Technique Mapping — Layer 2 (runtime prompts sent to Groq/Gemini)

These are the techniques the *application itself* uses at runtime, every time a user submits code — this is the layer most directly graded against CO2, since it's the model-facing prompting the deployed product performs.

| Technique | Used? | Where | Why |
|---|---|---|---|
| **System prompting** | ✅ | Every `/api/explain`, `/api/quiz`, and chat call sends a dedicated system prompt separate from the user's code | Keeps behavior (schema compliance, tone, reasoning discipline) consistent regardless of what code the user pastes. |
| **Role prompting** | ✅ | System prompt frames the model as a patient teaching assistant explaining to a first-year student | Shapes register and jargon level independent of the specific snippet. |
| **Structured output / schema-constrained generation** | ✅ Primary technique | Explanation and quiz prompts require valid JSON matching an explicit, field-by-field schema; validated with Pydantic; one bounded repair re-prompt on failure | Directly satisfies the assignment's "structured sections that stay consistent" requirement — this is the runtime enforcement mechanism for that guarantee, not just a formatting preference. |
| **Zero-shot prompting** | ✅ | The explanation/quiz system prompts describe the task and schema without example input/output pairs | Each submitted snippet is unique; a fixed few-shot example would risk anchoring the model's reasoning to the example's specific algorithm rather than the user's actual code. |
| **Few-shot prompting** | ❌ Not used at runtime | — | Considered and rejected for the same anchoring risk noted above — with arbitrary user-submitted code as input, a fixed set of worked examples is more likely to bias output toward the examples than to generalize correctly. |
| **Chain-of-thought prompting** | ❌ Not exposed in output, ✅ implicitly required in instruction | System prompt instructs the model to reason about the code's *actual* loops/recursion/data structures rather than pattern-matching to a familiar algorithm | The prompt asks for the *outcome* of careful reasoning (correct, code-specific complexity analysis) without asking the model to expose a visible reasoning trace in the response, since the response must stay within the fixed JSON schema. This is a deliberate trade-off: correctness is enforced through the requirement itself and through test coverage (Part 15's Phase 2 gate in `PROMPT.md`), not through visible step-by-step output. |
| **Function calling / tool use** | ❌ Not used | — | Out of scope for this project. CodeExplain's model calls are single-turn generation tasks (produce a structured explanation, produce a structured quiz) with no need for the model to invoke external tools or APIs mid-response — function calling would add complexity without solving a problem this product actually has. |
| **Context isolation** | ✅ | Each call receives only the current code + its own explanation as context; the follow-up chat is scoped to a single analysis and never mixes context across unrelated snippets | Prevents cross-contamination between an explanation of one snippet and questions about a different one, which matters once a user has multiple entries in their local history. |

---

## 5. Honest limitations

- **Chain-of-thought is intentionally not surfaced.** The system prompts ask for correct reasoning as an instruction, but because the response must conform to a fixed JSON schema, there is no visible scratchpad the model uses to "show its work." This is a known trade-off between structured-output discipline and reasoning transparency, resolved here in favor of structure, since the assignment's second requirement (consistent structured sections) is graded on the response shape, not on visible reasoning.
- **Few-shot examples were considered and deliberately rejected**, both in the build prompt and in the runtime prompts, for the anchoring risk described above — this was a considered choice, not an oversight, and is worth stating explicitly rather than leaving implicit.
- **Function calling is unused by design**, not because it wasn't understood — the product's task shape (single-turn structured generation) doesn't call for it. Including it would have been technique-for-technique's-sake rather than technique-for-the-problem.
