# AI-Assisted Development Workflow

This document logs the workflow utilized to develop CodeLearn on the **Emergent.sh** AI-assisted development platform. It distinguishes between generative AI assistance and the final manual software engineering adjustments.

---

## 1. Development Platform Overview
CodeLearn was designed and built on the **Emergent.sh** platform, which orchestrates autonomous coding agents capable of analyzing requirements, writing code, debugging, and running local verification commands.

The division of labor was structured as:
* **AI Assistance**: Generating initial boilerplate routes, draft React components, regex utilities, and creating Pydantic schemas.
* **Manual Engineering Review**: Refining UI/UX layouts, correcting SVG coordinate margins, fixing language comment parsing rules, and optimizing static asset distribution.

---

## 2. Prompts Used & Prompt Engineering

### Prompt 1: Initial Backend Setup & Pydantic Boundaries
* **Objective**: Create the FastAPI backend layout and validation schemas.
* **System Prompt Strategy**:
  ```text
  You are a Staff Python Engineer. Build an ASGI FastAPI app structure inside /backend/app.
  Define strict Pydantic v2 schemas for code explanations:
  - ExplanationResponse containing overview (str), plain_english_explanation (str), time_complexity (dict), space_complexity (dict), line_by_line (list of line walkthroughs), and improvements (list of category/detail maps).
  Ensure all routes are under /api.
  ```

### Prompt 2: Self-Healing Exception Handler
* **Objective**: Build a retry loop that handles malformed JSON outputs from the LLM.
* **System Prompt Strategy**:
  ```text
  Design a validation repair pattern. If json.loads fails or Pydantic validation throws a ValidationError on the LLM string, trigger a second completion request.
  Pass the previous response and the error details, setting temperature to 0.0, and instructing the model to return valid JSON. If it fails again, fallback to the next model in the registry list.
  ```

### Prompt 3: Interactive SVG Curves Chart
* **Objective**: Build the Big-O curves graph.
* **System Prompt Strategy**:
  ```text
  Build an SVG Complexity Graph component in React. Draw standard Big-O curves (O(1), O(log n), O(n), O(n log n), O(n^2), O(2^n)) on a 400x200 grid.
  Animate endpoints and add hovers. Highlight the time complexity in purple (#7c6af7) and space complexity in emerald (#10b981).
  Ensure O(1) runs exactly along the bottom x-axis line at y=170.
  ```

---

## 3. Human Review & Engineering Refinements
While the AI successfully generated core frameworks, several visual and syntax bugs required manual engineering intervention during review phases:

1. **Comment Parsing bug**: The AI originally parsed preprocessor `#include` and `#define` directives in C/C++ as comments due to python comment style rules. I corrected this in `highlight.ts` to make prefix parsing language-aware.
2. **Axis Overlaps**: The Y-axis title originally overlapped the coordinate arrow. I rotated the text counter-clockwise and moved it closer to the line (`x=28`).
3. **SVG Filters Collapse**: Horizontal lines originally vanished under Safari because filter heights computed to 0. I configured `filterUnits="userSpaceOnUse"` to resolve this rendering bug.
4. **Dropdown Clipping**: The editor's dropdown menus were clipped inside the card boundaries. I wrapped the home views in an unconstrained container and removed the card's `overflow-hidden` rule.

---

## 4. Testing & Verification Loop
The verification process followed a continuous feedback loop:
1. AI proposed code changes.
2. The agent initiated local build commands:
   * Frontend: `npm start` (webpack compiler)
   * Backend: `uvicorn server:app`
3. If compiler errors or warnings were logged in standard error, the agent parsed the log traces and modified files until compilation succeeded with zero warnings.
