/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Popover selection dropdowns styled directly from Stitch tokens.
 *
 * Reusable dropdown menu attached to a Pill trigger, used by both the
 * language selector and model selector. Handles outside-click and Escape.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Pill } from './ui';

export interface DropdownOption {
  key: string;
  label: string;
  sublabel?: string;
}

interface Props {
  icon: React.ReactNode;
  value: string;                    // key of the selected option
  options: DropdownOption[];
  onChange: (key: string) => void;
  ariaLabel: string;
  testId?: string;
}

export const PillDropdown: React.FC<Props> = ({
  icon,
  value,
  options,
  onChange,
  ariaLabel,
  testId,
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = options.find((o) => o.key === value) || options[0];

  return (
    <div className="relative" ref={wrapRef}>
      <Pill
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        data-testid={testId}
      >
        <span className="text-accent-soft">{icon}</span>
        <span className="truncate max-w-[220px]">{current?.label ?? '—'}</span>
        <ChevronDown
          size={14}
          className={`opacity-70 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </Pill>
      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-2 min-w-[260px] max-h-[320px] overflow-auto rounded-2xl glass p-1 shadow-2xl"
        >
          {options.map((opt) => (
            <button
              key={opt.key}
              role="option"
              aria-selected={opt.key === value}
              onClick={() => {
                onChange(opt.key);
                setOpen(false);
              }}
              className={`w-full text-left rounded-xl px-3 py-2 text-sm hover:bg-white/[0.05] transition-colors ${
                opt.key === value ? 'text-ink-primary bg-white/[0.04]' : 'text-ink-secondary'
              }`}
              data-testid={testId ? `${testId}-option-${opt.key}` : undefined}
            >
              <div className="font-medium">{opt.label}</div>
              {opt.sublabel && (
                <div className="text-[11px] text-ink-muted mt-0.5">{opt.sublabel}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
