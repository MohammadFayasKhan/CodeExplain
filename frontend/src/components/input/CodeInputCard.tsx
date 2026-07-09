/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Code input panel with language dropdowns, model pills, and submit action.
 *
 * The main Code Input Card — headline component of the landing view.
 * Uses Monaco (lazy-loaded) for a VS Code-like editing experience.
 * Runs a lightweight rule-based language detector on every change and,
 * when it's confident the user's declared language is wrong, surfaces a
 * gentle "Detected X, switch?" prompt above the editor.
 */

import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Sparkles, Code2, Cpu, X, ArrowRightLeft } from 'lucide-react';
import { Button } from '../shared/ui';
import { PillDropdown } from '../shared/PillDropdown';
import { LANGUAGES, detectLanguageWithConfidence } from '../../lib/languages';
import type { ModelOption } from '../../lib/types';

// Lazy-load Monaco so it doesn't block the first paint. The suspense
// fallback matches the editor's outer chrome so there's no layout jump.
const MonacoCodeEditor = lazy(() => import('./MonacoCodeEditor'));

interface Props {
  code: string;
  onCodeChange: (v: string) => void;
  language: string;
  onLanguageChange: (v: string) => void;
  modelKey: string;
  onModelChange: (v: string) => void;
  models: ModelOption[];
  onSubmit: () => void;
  loading: boolean;
  inlineError: string | null;
}

const LANG_LABEL: Record<string, string> = LANGUAGES.reduce(
  (acc, l) => ({ ...acc, [l.key]: l.label }),
  {},
);

export const CodeInputCard: React.FC<Props> = ({
  code,
  onCodeChange,
  language,
  onLanguageChange,
  modelKey,
  onModelChange,
  models,
  onSubmit,
  loading,
  inlineError,
}) => {
  const langOptions = useMemo(
    () => LANGUAGES.map((l) => ({ key: l.key, label: l.label })),
    [],
  );

  const modelOptions = useMemo(
    () =>
      models.map((m) => ({
        key: m.key,
        label: m.display_name,
        sublabel: m.model_id,
      })),
    [models],
  );

  // ------ Live language detection ---------------------------------------
  // We track a "dismissed" set so a user who explicitly rejects a switch
  // isn't nagged about it again with the same code.
  const [suggested, setSuggested] = useState<string | null>(null);
  const [suggestedConfidence, setSuggestedConfidence] = useState<number>(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showTooltip, setShowTooltip] = useState(false);
  const showDisabledTooltip = code.trim().length === 0 && !loading;

  useEffect(() => {
    if (!code.trim()) {
      setSuggested(null);
      return;
    }
    const det = detectLanguageWithConfidence(code);
    if (!det) {
      setSuggested(null);
      return;
    }
    // Auto-switch on very high confidence (>= 0.75) since the user almost
    // certainly picked the wrong language pill. Otherwise, offer a prompt
    // only when confidence is meaningful (>= 0.35) and different from
    // current selection and not previously dismissed.
    if (det.language === language) {
      setSuggested(null);
      return;
    }
    if (det.confidence >= 0.75) {
      onLanguageChange(det.language);
      setSuggested(null);
      return;
    }
    if (det.confidence >= 0.35 && !dismissed.has(det.language)) {
      setSuggested(det.language);
      setSuggestedConfidence(det.confidence);
    } else {
      setSuggested(null);
    }
    // We intentionally do NOT depend on `dismissed` here because we already
    // read the latest value inside the effect and re-including it would
    // cause the banner to reappear immediately after being closed for
    // still-typing users.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, language]);

  const acceptSuggestion = () => {
    if (suggested) onLanguageChange(suggested);
    setSuggested(null);
  };
  const rejectSuggestion = () => {
    if (suggested) {
      setDismissed((prev) => new Set(prev).add(suggested));
    }
    setSuggested(null);
  };

  const canSubmit = code.trim().length > 0 && !loading;

  return (
    <div
      className="relative mx-auto w-full max-w-4xl px-md md:px-lg pb-xl"
      data-testid="code-input-card"
    >
      <div className="glass rounded-card p-md md:p-lg shadow-2xl shadow-black/40">
        {/* Language detection banner */}
        {suggested && (
          <div
            className="mb-md flex flex-wrap items-center justify-between gap-sm rounded-2xl border border-accent/30 bg-accent/10 px-md py-2.5 text-sm text-ink-primary"
            data-testid="lang-detect-banner"
          >
            <div className="flex items-center gap-sm">
              <ArrowRightLeft size={14} className="text-accent-soft" />
              <span>
                Detected <strong>{LANG_LABEL[suggested] ?? suggested}</strong>. Switch language?
                <span className="ml-2 text-xs text-ink-muted">
                  ({Math.round(suggestedConfidence * 100)}% confidence)
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={acceptSuggestion}
                className="rounded-pill bg-white text-bg-base px-3 py-1 text-xs font-medium hover:bg-white/90 transition"
                data-testid="lang-detect-accept"
              >
                Switch
              </button>
              <button
                onClick={rejectSuggestion}
                className="rounded-pill px-2 py-1 text-ink-muted hover:text-ink-primary hover:bg-white/[0.06] transition"
                aria-label="Dismiss"
                data-testid="lang-detect-dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <label htmlFor="code-input" className="sr-only">
          Paste code to explain
        </label>

        <Suspense
          fallback={
            <div className="h-[260px] rounded-2xl border border-border-subtle bg-[#111218] animate-pulse" />
          }
        >
          <MonacoCodeEditor
            value={code}
            onChange={onCodeChange}
            language={language}
            placeholder="Paste the code you want explained…"
            minHeight={280}
          />
        </Suspense>

        {inlineError && (
          <div
            className="mt-sm text-sm text-red-300"
            role="alert"
            data-testid="code-input-error"
          >
            {inlineError}
          </div>
        )}

        <div className="mt-lg flex flex-wrap items-center justify-between gap-sm border-t border-border-subtle pt-md">
          <div className="flex flex-wrap items-center gap-sm">
            <PillDropdown
              icon={<Code2 size={14} />}
              ariaLabel="Language"
              value={language}
              options={langOptions}
              onChange={(v) => {
                onLanguageChange(v);
                // A manual pick trumps auto-detect; also reset dismissals so
                // future strong signals can prompt again.
                setSuggested(null);
                setDismissed(new Set());
              }}
              testId="language-pill"
            />
            <PillDropdown
              icon={<Cpu size={14} />}
              ariaLabel="Model"
              value={modelKey}
              options={modelOptions}
              onChange={onModelChange}
              testId="model-pill"
            />
          </div>

          <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Button
              onClick={onSubmit}
              loading={loading}
              disabled={!canSubmit}
              data-testid="explain-submit-btn"
            >
              {!loading && <Sparkles size={16} />}
              {loading ? 'Explaining…' : 'Explain Code'}
            </Button>

            {showDisabledTooltip && (
              <div
                className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3.5 z-30 pointer-events-none transition-all duration-300 ${
                  showTooltip
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-1.5 scale-95'
                }`}
              >
                <div className="relative bg-[#1e1418] border border-red-500/35 text-red-200 text-xs px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2 whitespace-nowrap">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  <span className="font-medium tracking-tight">Enter your code to get started</span>
                  {/* Triangle Arrow */}
                  <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-red-500/35" />
                  <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-[#1e1418]" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
