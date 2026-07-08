# Deployment — Hugging Face Docker Space

CodeExplain deploys as a **single Docker container** that serves both the
FastAPI API and the built React frontend on one port. No separate frontend
host, no post-clone rewiring — the repository as committed goes straight to
Spaces with only environment variables to set.

## 1. Create a new Space

1. Go to https://huggingface.co/spaces and click **Create new Space**.
2. Give it a name (e.g. `codeexplain`).
3. Set **Space SDK** = **Docker**.
4. Pick visibility (public/private) and hardware (CPU basic is enough).
5. Point the Space at your GitHub repository fork, or push this repo to it
   directly with `git push`.

## 2. Set required Space secrets

Under **Settings → Variables and secrets**, add each of the following as a
**secret**:

| Name | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ | Get one at https://console.groq.com/keys |
| `GEMINI_API_KEY` | ✅ | Get one at https://aistudio.google.com/apikey |
| `ACTIVE_PROVIDER` | ⭕ | `groq` (default) or `gemini` |
| `ACTIVE_MODEL` | ⭕ | e.g. `llama-3.3-70b-versatile` (default) |
| `REQUEST_TIMEOUT_SECONDS` | ⭕ | `45` (default) |
| `ALLOWED_ORIGIN` | ⭕ | `*` (default). In prod set to your Space URL. |
| `LOG_LEVEL` | ⭕ | `INFO` (default) |

`PORT` is set automatically by Hugging Face — do not add it manually.

## 3. Build

Spaces will detect the root `Dockerfile` and build automatically. The build
is multi-stage:

- **Stage 1** — Node 20 alpine installs frontend dependencies and runs
  `yarn build`, producing `frontend/build/`.
- **Stage 2** — Python 3.11 slim installs backend dependencies, copies
  backend source, and copies **only** the built static assets from Stage 1
  into `backend/app/static`.

The final image contains no Node or npm toolchain — only Python + the
compiled frontend.

## 4. Verify

Once the Space builds and boots (usually 3–6 minutes on first run):

1. Load the Space URL in a browser — the landing page should render.
2. Hit `https://<your-space>.hf.space/api/health` — you should see
   `{"status":"ok", "provider_reachable": {...}}`.
3. Paste a code snippet, click **Explain Code**, confirm the six result
   sections appear and the "Provider" badge shows the model that ran.
4. Try a deep link like `https://<your-space>.hf.space/about` — it should
   render the About page rather than 404, thanks to the SPA fallback in
   `backend/app/static.py`.

## 5. Local Docker parity check

You can run the exact same container locally:

```bash
docker build -t codeexplain .
docker run --rm -p 7860:7860 \
  -e GROQ_API_KEY=gsk_... \
  -e GEMINI_API_KEY=... \
  codeexplain
```

Then open http://localhost:7860. This is the same artifact Hugging Face
builds, so if it works locally it will work on Spaces.

## 6. Troubleshooting

- **Build fails at `yarn install`** — check that `frontend/package.json` and
  the lockfile were committed; the `.dockerignore` excludes `node_modules`
  but keeps `yarn.lock`.
- **`Missing required environment variable(s): GROQ_API_KEY`** — the Space
  secret wasn't set. Add it under Space settings and rebuild.
- **`/api/health` returns 500** — the app failed to load its config. Check
  the Space's runtime log; it will list which env var is missing.
- **Deep links 404 with "Frontend not built"** — the Stage-1 build produced
  an empty `build/` directory. Re-check the frontend build logs for
  TypeScript errors.
