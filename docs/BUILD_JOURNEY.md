# Build Journey: Developer Engineering Diary

This engineering diary documents the end-to-end development of CodeLearn, from initial ideation to architectural planning, implementation phases, debugging, and final optimization.

---

## 1. Project Selection & Ideation
During my 3rd year in Computer Science Engineering, I noticed that my peers spent significant time copy-pasting snippets from AI chats without analyzing how they work line-by-line. They also struggled to understand how time complexity equations relate to actual code structures.

I decided to build a dedicated tutoring platform that:
* Accepts code and returns structured breakdown components.
* Visualizes Big-O complexities interactively.
* Prompts the user with contextual comprehension check quizzes.
* Integrates Monaco Editor to make it feel like a real IDE workspace.

---

## 2. Planning & Architecture Design
I chose a decopled full-stack architecture to ensure scalability:
* **Frontend**: React SPA using TypeScript for strict typing and compile-time checks, TailwindCSS for custom glassmorphic styling, and Monaco Editor.
* **Backend**: FastAPI (Python) for asynchronous ASGI routing. Async networking was essential because calls to LLMs have high latency.
* **AI Orchestrator**: Developed a provider-agnostic interface model. This allows plugging in Groq Cloud (Llama) or Google Gemini via standard REST requests.

---

## 3. Development Phases

### Phase 1: Backend API Setup & Pydantic Schemas
I started by defining Pydantic response models inside `/backend/app/models/`. Enforcing a strict schema at the API boundary was necessary to guarantee that the React frontend always receives clean arrays for walkthroughs and quizzes.
Next, I set up the FastAPI router, including exception handlers to intercept Python exceptions and format them into standardized JSON error envelopes.

### Phase 2: LLM Integration & Self-Healing Repair Loop
I encountered the "JSON formatting issue": even in JSON mode, LLMs occasionally returned extra conversational wrappers.
I wrote utility functions to:
1. Strip Markdown syntax code blocks using compiled regular expressions.
2. Isolate JSON characters using outer brace coordinate indices.
3. **Self-Healing Loop**: Designed a repair middleware. If Pydantic validation fails, the backend fires a second "repair" request containing the error message to the LLM at `temperature = 0.0` to fix the layout.

### Phase 3: Frontend Monaco Editor & State Management
On the frontend, I integrated `@monaco-editor/react`. I customized the editor configuration:
* Disabled minimaps and set custom font dimensions.
* Mounted keyboard shortcuts.
* Configured local storage hooks to cache analysis history, allowing offline loads.

### Phase 4: Big-O Curves SVG Visualization
Rather than using heavy charting packages, I drew custom vector paths directly.
* Origin coordinate: `(40, 170)`.
* Horizontal axis extends to `390` with coordinate limits stopping at `340` to prevent label text overflows.
* Vertically rotated the "Operations" title by `-90` degrees around the origin `(28, 95)` to run parallel to the Y-axis.
* Shifted the constant complexity line $O(1)$ to run exactly along the baseline at `y = 170`. Added `filterUnits="userSpaceOnUse"` so the active purple glow filter renders on horizontal lines.

---

## 4. Key Debugging Challenges & Solutions

### Challenge 1: C/C++ Comment Parsing Bug
* **Symptom**: Lines like `#include <iostream>` were styled as greyed-out comments on the walkthrough lists.
* **Root Cause**: The syntax highlight tokenizer parsed the `#` character as a line comment (standard for Python/Shell) regardless of the file's language.
* **Solution**: Updated `highlight.ts` to make the prefix scanner language-aware. I restricted `#` comments to Python, Ruby, Shell, and PHP, while enforcing double-slashes `//` for C/C++/Java/Go.

### Challenge 2: SVG straight-line bounding-box collapses
* **Symptom**: Applying Gaussian blur filter shadows to the $O(1)$ line caused it to vanish in Safari/Chrome.
* **Root Cause**: Straight horizontal lines have an SVG bounding-box height of `0`. The browser collapses filter rendering area dimensions inside a 0-height container.
* **Solution**: Configured `filterUnits="userSpaceOnUse"` on the `<filter>` declaration. This forces the engine to compute filters relative to the chart's coordinate space instead of the path bounding-box.

---

## 5. Learning Outcomes & Future Scope
This project deepened my knowledge in:
* **Asynchronous Python Systems**: Writing asynchronous HTTP clients using `httpx.AsyncClient` inside `async/await` contexts.
* **Structured Generative AI**: Engineering strict output formats using Pydantic models.
* **State Synchronization**: Writing custom React hooks to manage local storage.

In the future, I plan to integrate Abstract Syntax Tree (AST) parsers to statically analyze code loops before querying the AI, further optimizing performance.
