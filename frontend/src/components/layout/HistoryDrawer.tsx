/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Sidebar panel containing persistent local session analysis history.
 *
 * Slide-in history drawer showing locally persisted explanations.
 * Includes a "Clear history" flow with an inline confirmation so the button
 * cannot be triggered accidentally.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, History as HistoryIcon, ShieldCheck } from 'lucide-react';
import type { HistoryEntry } from '../../lib/types';

// Framer-motion 11 typings pair badly with TS 4.9 — cast to any component
// so we can still use AnimatePresence's exit animations without noise.
const AnimatePresenceAny = AnimatePresence as unknown as React.FC<
  React.PropsWithChildren<Record<string, unknown>>
>;

interface Props {
  open: boolean;
  entries: HistoryEntry[];
  onClose: () => void;
  onSelect: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<Props> = ({
  open,
  entries,
  onClose,
  onSelect,
  onRemove,
  onClearAll,
}) => {
  const [confirming, setConfirming] = useState(false);

  return (
    <AnimatePresenceAny>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            data-testid="history-backdrop"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-bg-elevated border-l border-border-subtle shadow-2xl flex flex-col"
            data-testid="history-drawer"
          >
            <header className="flex items-center justify-between px-lg py-md border-b border-border-subtle">
              <div className="flex items-center gap-sm">
                <HistoryIcon size={18} className="text-accent-soft" />
                <div>
                  <div className="text-label uppercase tracking-[0.12em] text-ink-muted">
                    Local history
                  </div>
                  <div className="font-display font-semibold text-ink-primary">
                    {entries.length} saved analysis{entries.length === 1 ? '' : 'es'}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-ink-muted hover:text-ink-primary hover:bg-white/[0.05]"
                aria-label="Close history"
                data-testid="history-close-btn"
              >
                <X size={18} />
              </button>
            </header>

            <div className="flex items-center gap-sm px-lg py-sm text-[12px] text-ink-muted border-b border-border-subtle">
              <ShieldCheck size={14} className="text-emerald-400/80" />
              Everything is stored locally in your browser. Nothing is uploaded.
            </div>

            <div className="flex-1 overflow-y-auto px-lg py-md space-y-md">
              {entries.length === 0 ? (
                <p className="text-ink-muted text-sm mt-lg">
                  Your explanations will appear here once you generate them.
                </p>
              ) : (
                entries.map((e) => (
                  <div
                    key={e.id}
                    className="rounded-2xl border border-border-subtle bg-white/[0.03] p-md hover:border-accent/40 transition"
                    data-testid={`history-item-${e.id}`}
                  >
                    <div className="flex items-center justify-between gap-sm">
                      <div className="text-[11px] uppercase tracking-[0.1em] text-ink-muted">
                        {new Date(e.created_at).toLocaleString()} · {e.language}
                      </div>
                      <button
                        onClick={() => onRemove(e.id)}
                        className="text-ink-muted hover:text-red-300 transition"
                        aria-label="Delete this entry"
                        data-testid={`history-remove-${e.id}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => onSelect(e)}
                      className="mt-sm block w-full text-left"
                      data-testid={`history-open-${e.id}`}
                    >
                      <div className="font-medium text-ink-primary text-[14.5px] line-clamp-2">
                        {e.explanation.overview}
                      </div>
                      <div className="mt-1 font-mono text-[12px] text-ink-muted line-clamp-2">
                        {e.code_preview}
                      </div>
                    </button>
                  </div>
                ))
              )}
            </div>

            {entries.length > 0 && (
              <footer className="border-t border-border-subtle p-lg">
                {!confirming ? (
                  <button
                    onClick={() => setConfirming(true)}
                    className="w-full inline-flex items-center justify-center gap-sm rounded-pill border border-red-400/30 bg-red-500/10 text-red-200 px-md py-2.5 hover:bg-red-500/20 transition"
                    data-testid="history-clear-btn"
                  >
                    <Trash2 size={14} />
                    Clear all history
                  </button>
                ) : (
                  <div className="space-y-sm">
                    <p className="text-sm text-ink-secondary">
                      Delete <strong>all {entries.length}</strong> saved analyses? This can't be undone.
                    </p>
                    <div className="flex gap-sm">
                      <button
                        onClick={() => setConfirming(false)}
                        className="flex-1 rounded-pill border border-border-subtle bg-transparent text-ink-secondary px-md py-2.5 hover:bg-white/[0.05] transition"
                        data-testid="history-clear-cancel"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          onClearAll();
                          setConfirming(false);
                        }}
                        className="flex-1 rounded-pill bg-red-500 text-white px-md py-2.5 hover:bg-red-400 transition"
                        data-testid="history-clear-confirm"
                      >
                        Delete everything
                      </button>
                    </div>
                  </div>
                )}
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresenceAny>
  );
};
