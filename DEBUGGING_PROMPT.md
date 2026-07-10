# DEBUGGING METHODOLOGY

Debugging on CodeExplain was treated as an iterative engineering process rather than a series of isolated patches. Each defect was traced to a root cause in the rendering pipeline, the CSS cascade, the LLM response contract, or the runtime environment before a fix was written. Symptoms (a clipped element, a corrupted character, an unresponsive dropdown) were rarely the actual problem — they were surface signals of a deeper architectural interaction, most often involving the CSS stacking context model, React's reconciliation and portal system, third-party library breaking changes, or browser-specific rendering quirks. This document captures the debugging sessions that required genuine root-cause analysis and produced a durable architectural fix, rather than a cosmetic adjustment.

---

# 1. Frontend Architecture Debugging

## Issue: Dropdown menus rendering behind the footer

Model and language selector dropdowns were visually trapped underneath the site footer, making the lowest options unreachable.

## Root Cause

The footer used a `backdrop-filter` for its glassmorphism effect. In the CSS rendering model, any element with `backdrop-filter`, `filter`, `transform`, or `opacity` other than the default automatically establishes a new stacking context. Because the footer was rendered after the `<main>` content in DOM order, and `<main>` had no stacking context of its own, the browser's paint order placed the footer's layer above the dropdown menus even though the dropdowns declared a higher `z-index`. Z-index values only compete within the same stacking context — comparing a dropdown's `z-30` against the footer's implicit layer was not a valid comparison once the footer created its own context.

## Investigation

The rendering tree was inspected layer by layer to confirm that `z-index` alone could not explain the clipping, since the dropdown's declared index was numerically higher than anything in the footer. This pointed to a stacking-context boundary rather than a z-index ordering problem.

## Solution

An explicit stacking context was created for the main content region by adding `relative z-10` (later refined to `z-20`) to the `<main>` container, and the footer was pinned to a lower explicit layer (`z-10`). This guaranteed that all interactive overlay elements inside `<main>` — including nested dropdowns — participated in a stacking context that painted above the footer, regardless of DOM order.

## Result

All dropdown menus, including options previously hidden behind the footer, became fully visible and clickable across every viewport.

---

## Issue: History drawer and toast notifications clipped by the navigation bar

The slide-out history panel and toast notifications were rendering underneath the fixed navigation bar despite having a higher declared `z-index`.

## Root Cause

The `<main>` container had been given its own stacking context (`z-10`/`z-20`) to solve the dropdown-clipping issue above. That fix had a side effect: any component mounted as a descendant of `<main>` — including the history drawer — was now confined to compete for stacking order only within that local context. The drawer's `z-50` was meaningless outside of `<main>`'s context, so the fixed navbar (`z-40`, in the document's root stacking context) painted above it.

## Investigation

Because this was a structural DOM-nesting limitation rather than a z-index miscalculation, increasing the drawer's z-index further would not help — it needed to exit the constrained stacking context entirely.

## Solution

The `HistoryDrawer` and `Toast` components were re-mounted using `ReactDOM.createPortal(..., document.body)`. This moved their rendered DOM nodes to the document root while preserving their React state and event bindings inside the original component tree, placing them in the same top-level stacking context as the navigation bar.

## Result

The drawer and toast overlays now render above every other page element, including the fixed navbar and footer blur, without needing to fight stacking-context boundaries.

---

## Issue: Fixed navigation bar losing `position: sticky` behavior

An earlier iteration of the navbar used `position: sticky`, but it would not stick to the viewport top while scrolling.

## Root Cause

`position: sticky` is disabled by the browser if any ancestor element in the DOM tree declares `overflow: hidden` (or `auto`/`scroll`) on an axis, because the sticky element's containing block becomes bounded by that ancestor's scroll box rather than the viewport. `overflow-x: hidden` had been applied to `html`, `#root`, and the app's top-level wrapper `div` to suppress an unrelated horizontal-scroll bug, which silently broke sticky positioning everywhere beneath those ancestors.

## Investigation

The CSS specification's containing-block rules for sticky positioning were checked against the ancestor chain, confirming that overflow clipping anywhere above the navbar — not just on `body` — was sufficient to invalidate the sticky behavior.

## Solution

The horizontal-overflow suppression was consolidated onto a single ancestor: `body`, which is the browser's native top-level scroll container and does not interfere with sticky positioning of its descendants. `overflow-x: hidden` was removed from `html`, `#root`, and the app wrapper.

## Result

The navbar's sticky/fixed positioning behaves correctly across all breakpoints while horizontal scroll suppression remains fully intact.

---

# 2. Rendering & Performance Debugging

## Issue: The O(1) constant-complexity curve was invisible in the Big-O graph

A perfectly horizontal SVG line representing constant time complexity failed to render its glow filter, making the O(1) curve disappear entirely whenever it was the active selection.

## Root Cause

SVG filter regions are computed relative to an element's geometric bounding box by default (`filterUnits="objectBoundingBox"`). A perfectly horizontal line has `y1 === y2`, which collapses its bounding-box height to exactly zero. Any filter (in this case a Gaussian-blur-based glow) applied within a zero-height coordinate space has no area to render into, so the browser silently drops the filtered output.

## Investigation

Every other complexity curve (which had non-zero vertical extent) rendered its glow correctly, isolating the defect specifically to the one curve whose start and end points shared a y-coordinate — confirming a bounding-box degeneracy rather than a general filter or color bug.

## Solution

The SVG `<filter>` definitions were changed to `filterUnits="userSpaceOnUse"`, which anchors the filter region to the SVG's own coordinate system instead of the target element's bounding box, eliminating the dependency on the line having non-zero height.

## Result

The constant-complexity curve renders its glow and tracer dot identically to every other complexity tier, regardless of its flat geometry.

---

## Issue: Home ↔ About page transitions felt stuck and laggy

Switching routes caused a visible stutter and dropped frames instead of a smooth transition.

## Root Cause

Large background gradient blobs (380–500px, with a 120px CSS blur radius and continuous floating animation) had no explicit compositing hints. Without `will-change` or a 3D transform, the browser rasterized and repainted these blurred layers on the main thread on every animation frame. During a route change, this CPU-bound repaint work competed directly with React's mount/unmount work on the same thread, producing visible jank. A secondary contributor was that the browser preserved the previous page's scroll offset across route changes, forcing an extra layout reflow on mount.

## Investigation

Frame drops were isolated to the moment of route transition rather than steady-state scrolling, which pointed at mount-time contention rather than a persistent rendering cost — specifically, work competing with React's commit phase.

## Solution

The `.blob` elements were promoted to their own GPU compositing layer using `will-change: transform`, `transform: translate3d(0,0,0)`, and `backface-visibility: hidden`, offloading their animation from the CPU raster path to the GPU compositor. The blur radius was also reduced from 120px to 80px to shrink the compositing cost. A `<ScrollToTop />` component was added to reset scroll position synchronously on every route change, removing the extra reflow.

## Result

Page transitions run at a consistent frame rate with no visible stutter, and route changes no longer inherit the previous page's scroll offset.

---

## Issue: Loading skeleton and results panel rendering at roughly half their intended width

The "Thinking…" skeleton and the results panel visually collapsed to around 400px on desktop instead of matching the 896px width of the code editor above them.

## Root Cause

The parent `<main>` element was a flex container (`flex flex-col`). Under flexbox layout rules, a flex item without an explicit width shrinks to fit its content by default rather than expanding to fill the cross-axis — this overrides `max-width` constraints that would normally apply in block layout. Because the skeleton's inner elements used relative widths (`w-[92%]`, `w-[85%]`) rather than fixed pixel values, the flex item's content-based sizing collapsed to the width of the shortest line of skeleton text, and every percentage-based child shrank proportionally with it.

## Investigation

The discrepancy only appeared inside the flex-managed `<main>` region and not in sibling elements using standard block layout, which narrowed the cause to flex-item sizing behavior rather than a Tailwind class conflict.

## Solution

`w-full` was added explicitly to the wrapping containers for both the loading skeleton and the results panel, forcing them to fill the flex container's cross-axis instead of shrink-wrapping their content.

## Result

The loading and results panels now consistently match the 896px width of the code editor across all screen sizes.

---

# 3. Browser Compatibility

## Issue: A solid dark gap appeared above the navbar during iOS/macOS Safari pull-to-refresh bounce

Pulling down past the top of the page on Safari and mobile Chrome briefly exposed raw background color above the navigation bar.

## Root Cause

macOS and iOS browsers implement elastic "rubber-band" overscroll: pulling past the top of the document translates the entire viewport downward temporarily. The navbar's blurred background layer was anchored at `top: 0`, so during the bounce the translated navbar exposed the unstyled region above it that the blur layer had never been sized to cover.

## Investigation

The gap only reproduced on touch/trackpad platforms that implement rubber-band scrolling and was absent on browsers without elastic overscroll, confirming a platform-specific viewport-translation behavior rather than a layout bug.

## Solution

Two complementary fixes were applied. First, the navbar's blur background was extended well beyond its visible bounds (`top: -200px`) with an adjusted gradient mask so the pre-rendered blur already covers the elastic overscroll region. Second, `overscroll-behavior-y: none` was applied to `html`, `body`, and `#root` to disable the rubber-band translation at the browser level entirely.

## Result

The navbar remains visually anchored to the viewport with no exposed gap under pull-to-refresh gestures on any tested platform.

---

## Issue: Twenty distinct mobile responsiveness and horizontal-overflow defects across the interface

Multiple independent reports of horizontal scrollbars, clipped backgrounds, overflowing toolbars, and misaligned headers on small viewports.

## Root Cause

The defects traced back to three architecturally distinct causes rather than one bug: (1) absolutely-positioned decorative background elements without their own `overflow-hidden` boundary were extending past the viewport edge on narrow screens; (2) fixed-width toolbar elements (e.g. the Monaco editor's labeled control buttons) did not have a narrow-viewport fallback; (3) flex-row layouts on card headers had no responsive breakpoint to collapse into a stacked layout, causing internal content to force the container wider than the viewport.

## Investigation

Each of the twenty reports was triaged individually and grouped by root mechanism rather than fixed as one-off patches, since several visually different symptoms (a stray scrollbar, a clipped blob, an overflowing button row) shared the same underlying cause.

## Solution

A global `overflow-x-hidden` boundary was applied at the page-wrapper level in `App.tsx`; decorative background blobs were individually wrapped in their own clipping containers; the Monaco toolbar was converted to icon-only controls below a defined breakpoint; and card headers were switched from a fixed `flex-row` to a responsive `flex-col items-start` stack on small viewports.

## Result

All twenty reported overflow and layout defects were resolved from three root fixes, verified with a clean production build across iOS Safari and Android Chrome.

---

# 4. React State & UI Debugging

## Issue: Numeric placeholder tokens inside the syntax highlighter were being corrupted

Highlighted code blocks intermittently displayed raw Unicode replacement boxes in place of previously-highlighted strings and comments.

## Root Cause

The custom highlighter (`highlight.ts`) used Unicode Private Use Area characters (`\uE000`…`\uE001`) as delimiters to temporarily stash already-processed spans (strings, comments) during a multi-pass tokenization pipeline. The subsequent number-highlighting pass used a naive word-boundary regex, `\b(\d+)\b`, to find numeric literals. Because `\uE000` and `\uE001` are non-word characters, they created valid `\b` word boundaries around the numeric index embedded inside the placeholder token itself, causing the pass to match and re-wrap the placeholder's internal index as if it were a number in the source code — corrupting the token before it could be restored.

## Investigation

The corruption only appeared on code samples containing both numeric literals and stashed string/comment spans, and the corrupted character sequence matched the placeholder's own internal index format, which pointed directly at a regex collision between two highlighting passes rather than a rendering or encoding bug.

## Solution

The number-highlighting regex was changed to a union pattern that explicitly recognizes and skips intact placeholder tokens before attempting to match bare numbers: `/\uE000\d+\uE001|\b(\d+(?:\.\d+)?)\b/g`, returning the placeholder unchanged when the numeric capture group is `undefined`.

## Result

Stashed strings and comments are restored intact in every case, eliminating the replacement-character corruption in highlighted output.

---

## Issue: C/C++ preprocessor directives were rendered as comments

Lines such as `#include <stdio.h>` and `#define MAX 100` were greyed out and italicized as if they were comments.

## Root Cause

The highlighter's line-comment detection rule assumed any line beginning with `#` was a comment — true for Python, Ruby, and Bash, but not for C-family languages, where `#` prefixes preprocessor directives rather than comments. The rule was applied globally rather than being scoped per active language.

## Investigation

The mis-highlighting was reproducible only for C/C++ snippets and correlated exactly with lines starting in `#`, isolating the cause to an overly broad, language-agnostic comment rule rather than a tokenizer defect.

## Solution

The comment-prefix parser was made language-aware, branching on the snippet's active language: `#` for Python/Ruby/Shell, `--` for SQL, `//` or `#` for PHP, and `//` only for C, C++, Java, JS, TS, Go, Rust, Swift, and Kotlin.

## Result

Preprocessor directives in C/C++ render as standard code with proper keyword highlighting instead of being misclassified as comments.

---

## Issue: Inline code spans rendered as full block-level code boxes after a dependency upgrade

Short inline code references (e.g. a function name in a sentence) began rendering as large standalone code blocks with a "Copy" button, breaking paragraph flow.

## Root Cause

The custom markdown renderer relied on an `inline` boolean prop passed to its `code` component by `react-markdown`. Upgrading `react-markdown` from v9 to v10 removed this deprecated prop from the renderer's API entirely. Since `inline` was now always `undefined`, the renderer's conditional fell through to its block-level branch for every code span, regardless of whether it was meant to be inline.

## Investigation

The regression appeared immediately after a routine dependency bump with no application code changes, which pointed at a breaking change in the third-party renderer's contract rather than a logic error in the application.

## Solution

The code-parsing logic was rewritten to follow react-markdown's current recommended pattern: inline vs. block is now inferred from whether the node's `className` carries a `language-(\w+)` prefix (present only on fenced code blocks) rather than from the removed `inline` prop.

## Result

Inline code renders as a compact badge within surrounding text, while fenced code blocks retain their full block treatment — both correctly restored after the dependency upgrade.

---

# 5. Deployment & Environment Debugging

## Issue: Backend returning "AI service is temporarily unavailable" after updating API keys

Explanation requests continued to fail with a 503 even after valid Groq and Gemini API keys were written to the backend's `.env` file.

## Root Cause

The backend process had loaded its environment configuration once at process start and cached the (placeholder) key values in memory. Editing the `.env` file on disk does not propagate to an already-running process, since environment variables are read at process initialization, not polled continuously.

## Investigation

The health endpoint reported the server as reachable, ruling out a networking or deployment failure, while the 503 response specifically indicated provider authentication failure — narrowing the cause to stale in-memory configuration rather than a code or connectivity defect.

## Solution

The running backend process was terminated and relaunched (`uvicorn server --host 127.0.0.1 --port 8001`) so that process initialization re-read the updated `.env` file and loaded the corrected `GROQ_API_KEY` and `GEMINI_API_KEY` values into memory.

## Result

Explanation requests succeeded immediately after restart, confirming the fix and establishing a standard "restart after environment change" step for local debugging.

---

## Issue: Build verification required before every structural CSS or layout change

Several layout and stacking-context fixes carried risk of silent compile-time regressions (unused imports, invalid TypeScript types on newly introduced animation libraries).

## Root Cause

Structural changes to shared layout primitives (`App.tsx`, `index.css`) have wide blast radius across the component tree, and TypeScript's static checks are the fastest signal for catching a broken prop contract or unused import before it reaches the browser.

## Investigation / Solution

A production build (`npm run build`) was run as a verification gate after every structural fix — including the AnimatePresence page-transition integration, which required explicitly typing `AnimatePresenceAny` to satisfy React 18's JSX typing rules under TypeScript 4.9.

## Result

Every structural fix in this document was confirmed to compile cleanly with zero warnings before being considered complete, catching type-level regressions before they reached runtime.

---

# 6. LLM Pipeline & API Validation Debugging

## Issue: Dynamic Model Selection Dropdown Out of Sync with Backend Fallbacks and Loaded History

The model selection dropdown in the input card did not update when a fallback occurred on the backend (e.g. silently falling back to Llama 3.3 because the selected model failed due to credentials or rate limits) or when a past result was opened from the history drawer. This created a visual mismatch where the UI dropdown showed one model, but the generation status badge showed another.

## Root Cause

The frontend dropdown selection state (`modelKey`) was decoupled from the actual `model_used` and `provider_used` fields returned in the explanation response payload, and was not updated when loading history items.

## Investigation / Solution

Modified `HomePage.tsx` to automatically synchronize the dropdown state to match `res.model_used` and `res.provider_used` both when generating a new response (syncing on fallback) and when loading a history entry. Additionally, added a user-facing toast alert when fallback occurs to explain why the dropdown changed.

## Result

Dropdown state remains 100% synchronized with the actual model displayed in the results, eliminating visual confusion and providing clear fallback status notifications.

---

## Issue: Groq JSON Validation Failure (json_validate_failed) with Qwen Reasoning Models

Explaining code using `qwen/qwen3.6-27b` on Groq repeatedly returned a `400 Bad Request` validation error, silently triggering fallbacks.

## Root Cause

Qwen is a reasoning model that outputs internal chain-of-thought tokens. When native JSON mode (`response_format={"type": "json_object"}`) was requested on Groq, the model's raw reasoning steps conflicted with Groq's strict server-side JSON format validation, causing Groq to reject the entire generation.

## Investigation / Solution

Discovered that enabling `"reasoning_format": "parsed"` outputs Qwen's reasoning into a separate API block while outputting only the clean JSON block in `content`. By bypassing Groq's native JSON mode for Qwen and configuring `"reasoning_format": "parsed"`, the validation conflict was resolved.

## Result

Qwen generations succeed directly with 200 OK without triggering 400 errors or fallbacks.

---

## Issue: Server-Side Pydantic Validation Failures on Omitted Metadata Fields

Qwen and other models sometimes omitted the server-managed metadata fields (`provider_used` and `model_used`), causing the backend schema parser to fail and trigger repair loops or rate limits.

## Root Cause

The backend's Pydantic model (`ExplanationResponse`) marked `provider_used` and `model_used` as required fields without defaults, forcing validation errors even though these fields are purely metadata filled in by the backend orchestrator *after* generation.

## Investigation / Solution

Provided default values (`provider_used: str = ""` and `model_used: str = ""`) in the Pydantic schema so that validation passes if the LLM omits them, preventing redundant self-healing loops and API rate limit calls.

## Result

Drastically improved backend parsing stability and reduced API call overhead.

---

# 7. Reliability Improvements

- Consolidated three independent root causes (unbounded background decoration, fixed-width toolbars, non-responsive flex headers) to resolve twenty separate mobile layout reports in a single coordinated pass rather than patching symptoms individually.
- Replaced ad hoc z-index increases with a deliberate, documented stacking-context hierarchy (Drawer/Toast `z-50` → Navbar `z-40` → Main `z-20` → Footer `z-10`) to prevent recurring overlay-visibility regressions as new UI elements are added.
- Standardized on GPU-composited transforms (`translate3d`, `will-change`) for any animated background element, preventing future performance regressions from CPU-bound repaints.

---

# 8. Lessons Learned

**CSS stacking contexts are invisible until they aren't.** Multiple unrelated-looking bugs (dropdown clipping, drawer clipping, footer click interception) traced back to the same root mechanism: an element property (`backdrop-filter`, `z-index` with `position`) silently creating a new stacking context. Diagnosing z-index issues requires reasoning about the ancestor chain, not just the numeric value in question.

**Third-party library upgrades are breaking-change surface area.** The `react-markdown` v9→v10 regression demonstrated that a routine dependency bump can silently change a component's runtime contract (the removal of the `inline` prop) without any change to application code. Verifying rendering output after dependency upgrades, not just successful compilation, is necessary.

**Degenerate geometry breaks assumptions in rendering pipelines.** The invisible O(1) SVG curve is a reminder that code paths which are correct for the general case (`objectBoundingBox` filters) can silently fail for edge-case geometry (a zero-height bounding box), and that these failures often produce no error — only missing output.

**Environment and process state are decoupled by design.** The stale-API-key incident reinforced that configuration files and running process memory are not the same thing, and that "the file is correct" does not imply "the running service reflects the file."

---

# Key Engineering Challenges Solved

1. Resolved a multi-layer CSS stacking-context conflict causing dropdown menus to render beneath a `backdrop-filter` footer.
2. Diagnosed and fixed a downstream stacking-context regression that trapped the history drawer and toast notifications beneath the navbar, resolved via React Portals mounted to `document.body`.
3. Root-caused a `position: sticky` failure to an ancestor `overflow: hidden` rule and consolidated overflow handling onto the correct containing element.
4. Identified an SVG filter bounding-box degeneracy causing a zero-height line to lose its rendered glow, fixed via `filterUnits="userSpaceOnUse"`.
5. Diagnosed a main-thread rendering bottleneck causing page-transition jank and resolved it with GPU-layer promotion and scroll-state reset.
6. Traced a flexbox shrink-wrap sizing defect that silently collapsed a results panel to less than half its intended width.
7. Resolved a Safari/iOS elastic overscroll rendering artifact through both visual over-extension and behavioral suppression (`overscroll-behavior-y`).
8. Triaged twenty independent mobile responsiveness defects down to three shared architectural root causes.
9. Found and fixed a Unicode placeholder-token collision in a custom multi-pass syntax highlighter that was corrupting previously-processed code spans.
10. Made the syntax highlighter's comment-detection logic language-aware to stop C/C++ preprocessor directives from being misclassified as comments.
11. Diagnosed and adapted to a breaking API change in `react-markdown` v10 that silently broke inline code rendering across the application.
12. Root-caused a "service unavailable" production error to stale in-memory environment configuration rather than a code defect, establishing a restart-on-config-change procedure.
13. Established a systematic build-verification gate (`npm run build`) as a mandatory checkpoint after every structural layout or stacking-context change.
14. Designed and documented an explicit z-index/stacking-context hierarchy across the application to prevent recurring overlay-visibility regressions.
15. Synchronized the frontend model selection dropdown state dynamically with backend fallbacks and loaded history entries to resolve user-confusing state mismatches.
16. Resolved Groq API `json_validate_failed` 400 errors on reasoning models by bypassing native JSON mode and routing reasoning output via `reasoning_format="parsed"`.
17. Hardened the backend explanation schema by assigning default empty values to server-managed metadata fields, preventing unnecessary Pydantic validation failures.
