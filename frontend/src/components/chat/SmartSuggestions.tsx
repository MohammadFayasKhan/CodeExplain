/**
 * SmartSuggestions — horizontally-scrolling row of context-aware follow-up
 * question chips shown above the chat input. Clicking a chip sends the
 * prompt immediately.
 *
 * We derive the suggestion set from the current explanation so the chips
 * change with each new snippet, and we hide chips whose prompt has already
 * been asked in this session so the user never sees pure duplicates.
 */

import React, { useMemo } from 'react';
import type { ExplanationResponse } from '../../lib/types';

interface Props {
  explanation: ExplanationResponse;
  language: string;
  asked: string[]; // prompts already used in this chat session
  onPick: (prompt: string) => void;
  disabled?: boolean;
}

// Simple pluralisation-safe conversion for the target languages we surface.
function otherLanguages(current: string): { label: string; key: string }[] {
  const all = [
    { label: 'Python', key: 'python' },
    { label: 'JavaScript', key: 'javascript' },
    { label: 'TypeScript', key: 'typescript' },
    { label: 'Java', key: 'java' },
    { label: 'C++', key: 'cpp' },
    { label: 'Go', key: 'go' },
    { label: 'Rust', key: 'rust' },
  ];
  return all.filter((l) => l.key !== current);
}

export const SmartSuggestions: React.FC<Props> = ({
  explanation,
  language,
  asked,
  onPick,
  disabled,
}) => {
  const suggestions = useMemo(() => {
    const conversions = otherLanguages(explanation.detected_language || language)
      .slice(0, 3)
      .map((l) => `Convert this to ${l.label}`);

    const list: string[] = [
      'Dry-run this code step by step',
      'Where are the potential bugs or edge cases?',
      'Suggest three optimisations',
      `Explain the time complexity ${explanation.time_complexity.big_o} in more detail`,
      'Simplify this logic',
      'Rewrite this iteratively',
      'Rewrite this using recursion',
      'What edge cases might break this code?',
      'Give me interview questions based on this snippet',
      'Explain the key variables and their roles',
      'Draw a memory diagram for one call',
      'What are the best practices missing here?',
      ...conversions,
    ];

    // Filter out anything already asked (case/whitespace-insensitive) so
    // regenerations of the chip set don't show duplicates.
    const askedNorm = new Set(asked.map((a) => a.trim().toLowerCase()));
    return list.filter((s) => !askedNorm.has(s.trim().toLowerCase())).slice(0, 12);
  }, [explanation, language, asked]);

  if (suggestions.length === 0) return null;

  return (
    <div className="mt-md" data-testid="smart-suggestions">
      <div className="mb-2 text-label uppercase tracking-[0.12em] text-ink-muted">
        Try asking
      </div>
      <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {suggestions.map((s, i) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            disabled={disabled}
            className="shrink-0 snap-start rounded-pill border border-border-subtle bg-white/[0.03] px-3 py-1.5 text-[12.5px] text-ink-secondary hover:border-accent/50 hover:bg-white/[0.06] hover:text-ink-primary transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid={`suggestion-chip-${i}`}
            title={s}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};
