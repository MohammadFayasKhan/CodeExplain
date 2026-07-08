# CodeExplain ➜ Plain-English Code Tutor
# Author ➜ Mohammad Fayas Khan
# Purpose ➜ Multi-stage production Docker container configuration.

# ---- Stage 1: build the frontend ---------------------------------------------
FROM node:20-alpine AS frontend-build
WORKDIR /frontend

# Copy only the package manifests first so npm install caches on unchanged deps.
COPY frontend/package.json frontend/yarn.lock* ./
RUN yarn install --frozen-lockfile || yarn install

# Copy the rest of the frontend source and build.
COPY frontend/ ./
# Ensure REACT_APP_BACKEND_URL is empty at build time so the shipped bundle
# calls the same origin (single container). Anyone deploying to a different
# host can override at build time with --build-arg REACT_APP_BACKEND_URL=...
ARG REACT_APP_BACKEND_URL=
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
RUN yarn build

# ---- Stage 2: python runtime -------------------------------------------------
FROM python:3.11-slim AS runtime
WORKDIR /app

# Runtime hygiene — no .pyc noise, unbuffered logging so stdout streams cleanly
# to the Hugging Face Spaces log viewer.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install backend dependencies first, in their own layer.
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install -r /app/backend/requirements.txt

# Copy backend source.
COPY backend/ /app/backend/

# Copy built frontend into the location the static mount reads from.
COPY --from=frontend-build /frontend/build /app/backend/app/static

WORKDIR /app/backend

# Hugging Face Spaces passes the port via $PORT. Default to 7860 (the HF
# convention) when it's unset, e.g. `docker run` locally without any env.
ENV PORT=7860
EXPOSE 7860

CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-7860}"]
