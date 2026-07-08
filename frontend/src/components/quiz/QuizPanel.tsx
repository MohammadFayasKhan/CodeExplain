/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Active quiz layout managing multiple-choice questions and scores.
 *
 * QuizPanel — generates 3-5 questions from the current explanation and lets
 * the user answer them offline, revealing the score only after full submit.
 * Regenerate button sends the list of previously-generated question prompts
 * back to the server so the model can produce entirely different questions,
 * covering different concepts. If the model returns an empty questions array
 * we surface an "all unique questions exhausted" state instead of repeating.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { CircleCheck, CircleX, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button, Card, SectionHeader, Badge } from '../shared/ui';
import { api } from '../../lib/api';
import type { ExplanationResponse, QuizQuestion, QuizResponse } from '../../lib/types';

interface Props {
  code: string;
  language: string;
  explanation: ExplanationResponse;
  onError: (msg: string) => void;
}

/** Shuffle a list, returning a new array. Uses Fisher-Yates. */
function shuffle<T>(list: T[]): T[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Randomise the option order for a multiple-choice question while keeping
 * the `correct_answer` string in sync. `predict_output` questions with no
 * options are returned as-is.
 */
function shuffleOptions(q: QuizQuestion): QuizQuestion {
  if (!q.options || q.options.length < 2) return q;
  const shuffled = shuffle(q.options);
  // Options in our prompt are prefixed 'A) ', 'B) ', ...; strip and re-letter
  // so answers still correspond visually.
  const stripped = shuffled.map((o) => o.replace(/^[A-Z]\)\s*/, ''));
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const relabelled = stripped.map((s, i) => `${letters[i]}) ${s}`);

  // Find the correct answer's new position by matching stripped bodies.
  const correctBody = q.correct_answer.replace(/^[A-Z]\)\s*/, '').trim();
  const newIdx = stripped.findIndex((s) => s.trim() === correctBody);
  const newCorrect = newIdx >= 0 ? relabelled[newIdx] : q.correct_answer;

  return { ...q, options: relabelled, correct_answer: newCorrect };
}

export const QuizPanel: React.FC<Props> = ({ code, language, explanation, onError }) => {
  const [data, setData] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([]);

  // Reset all quiz state when the current explanation changes (new snippet).
  useEffect(() => {
    setData(null);
    setLoading(false);
    setAnswers({});
    setSubmitted(false);
    setExhausted(false);
    setPreviousQuestions([]);
  }, [explanation]);

  const score = useMemo(() => {
    if (!data) return 0;
    return data.questions.reduce(
      (n, q) => (answers[q.id]?.trim() === q.correct_answer.trim() ? n + 1 : n),
      0,
    );
  }, [data, answers]);

  const generate = async (opts: { regenerate: boolean }) => {
    setSubmitted(false);
    setAnswers({});
    setExhausted(false);
    setLoading(true);
    try {
      const res = await api.quiz({
        code,
        language,
        explanation,
        provider: explanation.provider_used,
        model: explanation.model_used,
        previous_questions: opts.regenerate ? previousQuestions : [],
      });

      if (!res.questions || res.questions.length === 0) {
        setExhausted(true);
        setData(null);
      } else {
        // Shuffle question order + option order for every regeneration so
        // even similar questions feel different in the UI.
        const shuffledQs = shuffle(res.questions).map(shuffleOptions);
        setData({ questions: shuffledQs });
        setPreviousQuestions((prev) => [
          ...prev,
          ...res.questions.map((q) => q.prompt),
        ]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not generate a quiz.';
      onError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Empty state (before first generation) ----------
  if (!data && !loading && !exhausted) {
    return (
      <Card className="p-lg" data-testid="quiz-panel">
        <SectionHeader
          eyebrow="Quiz mode"
          title="Test your understanding"
          icon={<Sparkles size={18} />}
        />
        <p className="mt-sm text-ink-secondary text-[14.5px]">
          Generate 3 to 5 questions built from <em>your</em> specific code, variable names
          included. Answer them all, then submit to see how you did.
        </p>
        <div className="mt-md">
          <Button
            variant="primary"
            onClick={() => generate({ regenerate: false })}
            data-testid="generate-quiz-btn"
          >
            <Sparkles size={16} />
            Generate Quiz
          </Button>
        </div>
      </Card>
    );
  }

  // ---------- Loading state ----------
  if (loading) {
    return (
      <Card className="p-lg" data-testid="quiz-panel">
        <SectionHeader
          eyebrow="Quiz mode"
          title="Building your quiz…"
          icon={<Sparkles size={18} />}
        />
        <div className="mt-md space-y-md">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-border-subtle bg-white/[0.02] p-md space-y-2"
            >
              <div className="h-3 w-24 rounded bg-white/10" />
              <div className="h-4 w-3/4 rounded bg-white/10" />
              <div className="h-8 w-full rounded bg-white/5" />
              <div className="h-8 w-full rounded bg-white/5" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // ---------- Exhausted state ----------
  if (exhausted) {
    return (
      <Card className="p-lg" data-testid="quiz-panel">
        <SectionHeader
          eyebrow="Quiz mode"
          title="No more unique questions"
          icon={<CheckCircle2 size={18} />}
        />
        <p className="mt-sm text-ink-secondary text-[14.5px]">
          All unique questions for this code have been generated. Try a different snippet, or
          reset and start over.
        </p>
        <div className="mt-md flex gap-sm">
          <Button
            variant="secondary"
            onClick={() => {
              setPreviousQuestions([]);
              generate({ regenerate: false });
            }}
            data-testid="quiz-reset-btn"
          >
            <RefreshCw size={14} /> Start over
          </Button>
        </div>
      </Card>
    );
  }

  const total = data!.questions.length;

  return (
    <Card className="p-lg space-y-md" data-testid="quiz-panel">
      <SectionHeader
        eyebrow="Quiz mode"
        title={submitted ? `You scored ${score} / ${total}` : `Answer all ${total} questions`}
        icon={<Sparkles size={18} />}
        right={
          <button
            onClick={() => generate({ regenerate: true })}
            className="inline-flex items-center gap-sm rounded-pill px-3 py-1.5 text-sm text-ink-secondary hover:text-ink-primary hover:bg-white/[0.05] transition"
            data-testid="quiz-regenerate-btn"
          >
            <RefreshCw size={14} /> Regenerate
          </button>
        }
      />

      <div className="space-y-md">
        {data!.questions.map((q, idx) => {
          const chosen = answers[q.id];
          const correct = q.correct_answer;
          const isCorrect = submitted && chosen?.trim() === correct.trim();
          const isWrong = submitted && chosen !== undefined && !isCorrect;

          return (
            <div
              key={q.id}
              className="rounded-2xl border border-border-subtle bg-white/[0.02] p-md animate-fade-in-up"
              data-testid={`quiz-question-${idx}`}
            >
              <div className="flex items-start justify-between gap-sm">
                <div className="flex items-center gap-sm">
                  <Badge tone="category">Q{idx + 1}</Badge>
                  <Badge tone="category">
                    {q.type === 'multiple_choice' ? 'Multiple choice' : 'Predict the output'}
                  </Badge>
                </div>
                {submitted && (
                  <span className={isCorrect ? 'text-emerald-300' : 'text-red-300'}>
                    {isCorrect ? <CircleCheck size={18} /> : <CircleX size={18} />}
                  </span>
                )}
              </div>

              <p className="mt-md text-ink-primary text-[15px] leading-relaxed">{q.prompt}</p>

              {q.options && q.options.length > 0 ? (
                <div className="mt-md grid gap-2">
                  {q.options.map((opt) => {
                    const isChosen = chosen === opt;
                    const rowState = submitted
                      ? opt === correct
                        ? 'border-emerald-400/50 bg-emerald-500/10'
                        : isChosen
                          ? 'border-red-400/50 bg-red-500/10'
                          : 'border-border-subtle'
                      : isChosen
                        ? 'border-accent bg-accent/10'
                        : 'border-border-subtle hover:border-accent/50';
                    return (
                      <button
                        key={opt}
                        onClick={() => !submitted && setAnswers({ ...answers, [q.id]: opt })}
                        disabled={submitted}
                        className={`text-left rounded-2xl border px-md py-2.5 text-sm text-ink-secondary transition ${rowState}`}
                        data-testid={`quiz-option-${idx}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <input
                  type="text"
                  value={chosen || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  disabled={submitted}
                  placeholder="Type the exact output…"
                  className="mt-md w-full rounded-2xl border border-border-subtle bg-white/[0.03] px-md py-2 text-sm text-ink-primary placeholder:text-ink-muted outline-none focus:border-accent"
                  data-testid={`quiz-input-${idx}`}
                />
              )}

              {submitted && (
                <div
                  className={`mt-md rounded-xl p-3 text-[13.5px] ${
                    isCorrect ? 'bg-emerald-500/10 text-emerald-200' : 'bg-red-500/10 text-red-200'
                  }`}
                >
                  {isWrong && (
                    <div className="mb-1">
                      <span className="opacity-75">Correct answer:</span>{' '}
                      <strong>{correct}</strong>
                    </div>
                  )}
                  <div className="opacity-90">{q.explanation}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <Button
          variant="primary"
          onClick={() => setSubmitted(true)}
          disabled={Object.keys(answers).length !== total}
          data-testid="quiz-submit-btn"
        >
          Submit answers
        </Button>
      ) : (
        <Button
          variant="secondary"
          onClick={() => generate({ regenerate: true })}
          data-testid="quiz-try-another-btn"
        >
          <RefreshCw size={14} /> Try another set
        </Button>
      )}
    </Card>
  );
};
