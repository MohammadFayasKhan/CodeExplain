# Local Development Setup

## Prerequisites

- Python 3.11+
- Node.js 18+ and Yarn 1.x
- (Optional) MongoDB if you plan to extend the app with persistence — the
  base application uses Local Storage only, so MongoDB is not strictly
  required.

## 1. Clone & install

```bash
git clone https://github.com/<your-fork>/codeexplain.git
cd codeexplain
```

## 2. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate    # optional
pip install -r requirements.txt
cp .env.example .env
```

Fill in `.env` with your API keys:

```env
GROQ_API_KEY=gsk_your_groq_key
GEMINI_API_KEY=your_gemini_key
ACTIVE_PROVIDER=groq
ACTIVE_MODEL=llama-3.3-70b-versatile
REQUEST_TIMEOUT_SECONDS=45
ALLOWED_ORIGIN=*
LOG_LEVEL=INFO
```

- **Groq API key** — https://console.groq.com/keys (free tier available)
- **Gemini API key** — https://aistudio.google.com/apikey

Run the backend:

```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Verify it responds:

```bash
curl http://localhost:8001/api/health
```

You should see `{"status":"ok","provider_reachable":{"groq":true,"gemini":true}, ...}`.

## 3. Frontend

```bash
cd frontend
yarn install
cp .env.example .env
```

Set the backend URL for the dev server (default is the local backend):

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

Start it:

```bash
yarn start
```

The app opens at http://localhost:3000. Paste a snippet, pick a language,
click **Explain Code**.

## 4. Running both together (Emergent preview / local supervisor)

If you use the supervisor-based preview environment, both services start
automatically on:

- Backend: `http://localhost:8001` (uvicorn, from `/app/backend`)
- Frontend: `http://localhost:3000` (CRA dev server, from `/app/frontend`)

Restart either after `.env` changes:

```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

## 5. Common gotchas

- **`Missing required environment variable(s): GROQ_API_KEY`** — set the key
  in `backend/.env` and restart the backend. The app fails fast on missing
  configuration on purpose.
- **CORS error in browser console** — set `ALLOWED_ORIGIN=*` in
  `backend/.env` for local development, or list your dev origin explicitly.
- **Groq model not found (404)** — model IDs change occasionally. See the
  current list at https://console.groq.com/docs/models; update
  `backend/app/config/models_registry.py` if a model is deprecated.
