/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Typed localStorage utility storing history entries and user preferences.
 *
 * Local-only history + preferences persistence via Local Storage.
 * Per the product spec, ALL user analysis history stays in the browser.
 * We never POST it to the server. This module encapsulates the storage
 * shape so components don't sprinkle JSON.parse everywhere.
 */

import type { ExplanationResponse, HistoryEntry } from './types';

const HISTORY_KEY = 'codeexplain.history.v1';
const PREFS_KEY = 'codeexplain.prefs.v1';
const MAX_HISTORY = 50; // hard cap so LocalStorage never grows unbounded

export interface Prefs {
  language: string;
  modelKey: string;
}

const DEFAULT_PREFS: Prefs = {
  language: 'python',
  modelKey: 'groq:openai/gpt-oss-120b',
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const storage = {
  loadHistory(): HistoryEntry[] {
    return safeParse<HistoryEntry[]>(localStorage.getItem(HISTORY_KEY), []);
  },

  saveHistory(entries: HistoryEntry[]): void {
    // Trim oldest entries when we exceed the cap.
    const trimmed = entries.slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  },

  addHistory(entry: {
    code: string;
    language: string;
    explanation: ExplanationResponse;
  }): HistoryEntry {
    const existing = storage.loadHistory();
    const created: HistoryEntry = {
      id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
      language: entry.language,
      code_preview: entry.code.slice(0, 120),
      code: entry.code,
      explanation: entry.explanation,
    };
    storage.saveHistory([created, ...existing]);
    return created;
  },

  removeHistory(id: string): void {
    storage.saveHistory(storage.loadHistory().filter((e) => e.id !== id));
  },

  clearHistory(): void {
    localStorage.removeItem(HISTORY_KEY);
  },

  loadPrefs(): Prefs {
    return safeParse<Prefs>(localStorage.getItem(PREFS_KEY), DEFAULT_PREFS);
  },

  savePrefs(prefs: Prefs): void {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  },

  clearAll(): void {
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(PREFS_KEY);
  },
};

export { DEFAULT_PREFS };
