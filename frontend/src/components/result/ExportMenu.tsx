/**
 * Export dropdown offering Markdown copy, Markdown download, and PDF download.
 */

import React, { useState } from 'react';
import { Download, FileText, Clipboard, FileType2 } from 'lucide-react';
import { Button } from '../shared/ui';
import { downloadText, explanationToMarkdown, explanationToPdf } from '../../lib/export';
import type { ExplanationResponse } from '../../lib/types';

interface Props {
  code: string;
  language: string;
  explanation: ExplanationResponse;
  onCopied: () => void;
}

export const ExportMenu: React.FC<Props> = ({ code, language, explanation, onCopied }) => {
  const [open, setOpen] = useState(false);

  const md = () => explanationToMarkdown(code, language, explanation);

  const copyMd = async () => {
    await navigator.clipboard.writeText(md());
    setOpen(false);
    onCopied();
  };
  const dlMd = () => {
    downloadText('codeexplain.md', md(), 'text/markdown');
    setOpen(false);
  };
  const dlPdf = () => {
    explanationToPdf(code, language, explanation);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button variant="secondary" onClick={() => setOpen((v) => !v)} data-testid="export-menu-btn">
        <Download size={14} />
        Export
      </Button>
      {open && (
        <div
          className="absolute right-0 z-30 mt-2 min-w-[220px] rounded-2xl glass p-1 shadow-2xl"
          role="menu"
        >
          <button
            onClick={copyMd}
            className="w-full flex items-center gap-sm rounded-xl px-3 py-2 text-sm text-ink-secondary hover:text-ink-primary hover:bg-white/[0.05] transition"
            data-testid="export-copy-md"
          >
            <Clipboard size={14} /> Copy as Markdown
          </button>
          <button
            onClick={dlMd}
            className="w-full flex items-center gap-sm rounded-xl px-3 py-2 text-sm text-ink-secondary hover:text-ink-primary hover:bg-white/[0.05] transition"
            data-testid="export-download-md"
          >
            <FileText size={14} /> Download .md
          </button>
          <button
            onClick={dlPdf}
            className="w-full flex items-center gap-sm rounded-xl px-3 py-2 text-sm text-ink-secondary hover:text-ink-primary hover:bg-white/[0.05] transition"
            data-testid="export-download-pdf"
          >
            <FileType2 size={14} /> Download .pdf
          </button>
        </div>
      )}
    </div>
  );
};
