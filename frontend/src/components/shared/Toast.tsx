/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Action alerts and error messages rendered dynamically.
 *
 * Toast — dead-simple ephemeral notification used for chat/quiz failures
 * and the "Copied to clipboard" confirmation.
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface Props {
  message: string | null;
  tone?: 'info' | 'error' | 'success';
  onClose: () => void;
  autoDismissMs?: number;
}

export const Toast: React.FC<Props> = ({ message, tone = 'info', onClose, autoDismissMs = 3500 }) => {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, autoDismissMs);
    return () => clearTimeout(t);
  }, [message, autoDismissMs, onClose]);

  if (!message) return null;

  const tones = {
    info: 'border-white/10 bg-surface-card/95 text-ink-primary',
    error: 'border-red-400/30 bg-red-950/70 text-red-100',
    success: 'border-emerald-400/30 bg-emerald-950/70 text-emerald-100',
  } as const;

  return createPortal(
    <div
      role="status"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up"
      data-testid="toast"
    >
      <div
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl glass ${tones[tone]}`}
      >
        <span className="text-sm">{message}</span>
        <button
          onClick={onClose}
          className="text-ink-muted hover:text-ink-primary transition"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>,
    document.body
  );
};
