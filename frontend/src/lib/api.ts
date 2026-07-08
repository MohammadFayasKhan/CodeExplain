/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Native typed fetch routing endpoints to FastAPI backend APIs.
 *
 * Typed fetch wrappers around the FastAPI backend.
 * Every endpoint returns either the successful response body OR throws an
 * ``ApiError`` — the hooks use that contract to derive their loading/error
 * state. We deliberately do not use axios; native fetch is sufficient here.
 */

import type {
  ChatMessage,
  ChatResponse,
  ExplanationResponse,
  ModelsListResponse,
  QuizResponse,
} from './types';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || '';

export class ApiError extends Error {
  status: number;
  type: string;

  constructor(status: number, type: string, message: string) {
    super(message);
    this.status = status;
    this.type = type;
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let payload: any = null;
    try {
      payload = await res.json();
    } catch {
      /* body may be empty */
    }
    const err = payload?.error;
    throw new ApiError(
      res.status,
      err?.type || 'network_error',
      err?.message || `Request failed (${res.status}).`,
    );
  }
  return (await res.json()) as T;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new ApiError(res.status, 'network_error', `Request failed (${res.status}).`);
  }
  return (await res.json()) as T;
}

export const api = {
  listModels: () => get<ModelsListResponse>('/api/models'),

  explain: (payload: {
    code: string;
    language: string;
    provider?: string;
    model?: string;
  }) => post<ExplanationResponse>('/api/explain', payload),

  quiz: (payload: {
    code: string;
    language: string;
    explanation: ExplanationResponse;
    provider?: string;
    model?: string;
    previous_questions?: string[];
  }) => post<QuizResponse>('/api/quiz', payload),

  chat: (payload: {
    code: string;
    language: string;
    explanation: ExplanationResponse;
    history: ChatMessage[];
    question: string;
    provider?: string;
    model?: string;
  }) => post<ChatResponse>('/api/chat', payload),
};
