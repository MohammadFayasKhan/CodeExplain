/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Syntax-highlighted read-only code display container.
 *
 * Small code-block presenter that applies our lightweight highlighter.
 * Used both inside line-by-line commentary and the chat's inline code.
 */

import React from 'react';
import { highlight } from '../../lib/highlight';

interface Props {
  code: string;
  language: string;
  className?: string;
}

export const CodeBlock: React.FC<Props> = ({ code, language, className = '' }) => {
  const html = highlight(code, language);
  return (
    <pre
      className={`overflow-x-auto rounded-2xl bg-[#111218] border border-border-subtle px-4 py-3 text-[13px] leading-relaxed font-mono ${className}`}
    >
      <code dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  );
};
