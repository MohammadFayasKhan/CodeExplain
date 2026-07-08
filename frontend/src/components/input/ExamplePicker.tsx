/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Selectable chips to pre-fill the input editor with example code snippets.
 *
 * Row of clickable example snippets shown above the code input card.
 * Clicking a chip pre-fills both the textarea and the language pill.
 * Chips share equal padding, height, and radius, wrap responsively, and
 * animate on hover for a polished SaaS feel.
 */

import React from 'react';
import { Wand2 } from 'lucide-react';
import { EXAMPLES } from '../../examples';

interface Props {
  onPick: (code: string, language: string) => void;
  disabled?: boolean;
}

export const ExamplePicker: React.FC<Props> = ({ onPick, disabled }) => {
  return (
    <div
      className="mx-auto w-full max-w-4xl px-md md:px-lg pb-md"
      data-testid="example-picker"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center justify-center gap-1.5 text-label uppercase tracking-[0.12em] text-ink-muted">
          <Wand2 size={12} className="text-accent-soft" />
          Try one of these
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onPick(ex.code, ex.language)}
              disabled={disabled}
              className="inline-flex h-9 items-center rounded-pill border border-border-subtle bg-white/[0.03] px-4 text-[12.5px] font-medium text-ink-secondary transition-all duration-200 hover:border-accent/50 hover:bg-white/[0.06] hover:text-ink-primary hover:-translate-y-0.5 hover:shadow-md hover:shadow-accent/10 active:translate-y-0 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              data-testid={`example-chip-${ex.id}`}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
