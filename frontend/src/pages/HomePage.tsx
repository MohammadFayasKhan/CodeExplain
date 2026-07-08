/**
 * HomePage — landing hero + code input + result view stack.
 * Owns the current-session state (code, language, model, result).
 * Local storage side-effects for history/prefs live here too.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Hero } from '../components/landing/Hero';
import { CodeInputCard } from '../components/input/CodeInputCard';
import { ExamplePicker } from '../components/input/ExamplePicker';
import { ResultView } from '../components/result/ResultView';
import { LoadingPanel } from '../components/result/LoadingPanel';
import { QuizPanel } from '../components/quiz/QuizPanel';
import { FollowUpChat } from '../components/chat/FollowUpChat';
import { HistoryDrawer } from '../components/layout/HistoryDrawer';
import { Toast } from '../components/shared/Toast';
import { api, ApiError } from '../lib/api';
import { storage } from '../lib/storage';
import type { ExplanationResponse, HistoryEntry, ModelOption } from '../lib/types';

interface Props {
  historyOpen: boolean;
  onHistoryClose: () => void;
}

export const HomePage: React.FC<Props> = ({ historyOpen, onHistoryClose }) => {
  // ---------- Preferences & models ---------------------------------
  const prefs = useMemo(() => storage.loadPrefs(), []);
  const [language, setLanguage] = useState(prefs.language);
  const [modelKey, setModelKey] = useState(prefs.modelKey);
  const [models, setModels] = useState<ModelOption[]>([]);

  useEffect(() => {
    // Fetch the model registry once so the dropdown reflects backend truth.
    api.listModels().then((res) => {
      setModels(res.models);
      if (!res.models.find((m) => m.key === modelKey)) {
        setModelKey(res.default);
      }
    }).catch(() => {
      // If model listing fails we still let the user type — the backend will
      // use its default. The toast keeps the failure visible.
      setToast({ msg: 'Could not load model list — using default model.', tone: 'error' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    storage.savePrefs({ language, modelKey });
  }, [language, modelKey]);

  // ---------- Form + request state ---------------------------------
  const [code, setCode] = useState('');
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone: 'info' | 'error' | 'success' } | null>(null);

  const [history, setHistory] = useState<HistoryEntry[]>(() => storage.loadHistory());

  const handleSubmit = async () => {
    setInlineError(null);
    if (!code.trim()) {
      setInlineError('Please paste some code first.');
      return;
    }
    if (code.length > 20000) {
      setInlineError('That snippet is too long (max ~20,000 characters).');
      return;
    }
    // Split "provider:model" key back into pieces for the API call.
    const [provider, modelId] = modelKey.split(':');
    setLoading(true);
    setExplanation(null);
    requestAnimationFrame(() => {
      document.getElementById('result-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    try {
      const res = await api.explain({
        code,
        language,
        provider,
        model: modelId,
      });
      setExplanation(res);
      const saved = storage.addHistory({ code, language, explanation: res });
      setHistory([saved, ...history]);
      // Smooth scroll to the result cards after a paint.
      requestAnimationFrame(() => {
        document.getElementById('result-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : "Something went wrong generating the explanation.";
      setToast({ msg, tone: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const pickExample = (c: string, lang: string) => {
    setCode(c);
    setLanguage(lang);
    setInlineError(null);
  };

  const openFromHistory = (entry: HistoryEntry) => {
    setCode(entry.code);
    setLanguage(entry.language);
    setExplanation(entry.explanation);
    onHistoryClose();
    requestAnimationFrame(() =>
      document.getElementById('result-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  };

  return (
    <>
      <div className="relative w-full">
        <Hero />
        <ExamplePicker onPick={pickExample} disabled={loading} />
        <CodeInputCard
          code={code}
          onCodeChange={setCode}
          language={language}
          onLanguageChange={setLanguage}
          modelKey={modelKey}
          onModelChange={setModelKey}
          models={models}
          onSubmit={handleSubmit}
          loading={loading}
          inlineError={inlineError}
        />
      </div>

      <div id="result-anchor" />

      {loading && (
        <div className="mx-auto max-w-4xl px-md md:px-lg mt-lg">
          <LoadingPanel />
        </div>
      )}

      {explanation && !loading && (
        <div className="mx-auto max-w-4xl px-md md:px-lg space-y-lg pb-2xl">
          <ResultView
            explanation={explanation}
            language={language}
            code={code}
            onCopied={() => setToast({ msg: 'Copied Markdown to clipboard.', tone: 'success' })}
          />
          <QuizPanel
            code={code}
            language={language}
            explanation={explanation}
            onError={(msg) => setToast({ msg, tone: 'error' })}
          />
          <FollowUpChat
            code={code}
            language={language}
            explanation={explanation}
            onError={(msg) => setToast({ msg, tone: 'error' })}
          />
        </div>
      )}

      <HistoryDrawer
        open={historyOpen}
        entries={history}
        onClose={onHistoryClose}
        onSelect={openFromHistory}
        onRemove={(id) => {
          storage.removeHistory(id);
          setHistory(storage.loadHistory());
        }}
        onClearAll={() => {
          storage.clearHistory();
          setHistory([]);
          setToast({ msg: 'All history cleared.', tone: 'success' });
        }}
      />

      <Toast
        message={toast?.msg ?? null}
        tone={toast?.tone}
        onClose={() => setToast(null)}
      />
    </>
  );
};
