/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Safe markdown renderer compiling LLM explanations to HTML tags.
 *
 * MarkdownRenderer — renders assistant chat responses with full markdown
 * support: fenced code blocks (syntax-highlighted, dark, copy button),
 * inline code, headings, bold, italic, tables, blockquotes, lists, links.
 * We use react-markdown + remark-gfm for GitHub-flavoured markdown, and
 * highlight.js via our own code-block wrapper for syntax highlighting (this
 * keeps bundle size predictable versus pulling every Prism language).
 */

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';
import { highlight } from '../../lib/highlight';

interface Props {
  content: string;
  className?: string;
}

const CodeFence: React.FC<{ code: string; lang: string }> = ({ code, lang }) => {
  const [copied, setCopied] = useState(false);
  const language = (lang || 'plaintext').toLowerCase();
  const html = highlight(code, language);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore clipboard errors */
    }
  };

  return (
    <div className="relative group my-3 rounded-2xl border border-border-subtle bg-[#0f1015] overflow-hidden">
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-ink-muted">
        <span>{language || 'code'}</span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-ink-muted hover:text-ink-primary hover:bg-white/[0.06] transition"
          aria-label="Copy code"
          data-testid="md-code-copy-btn"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-[13px] leading-relaxed font-mono whitespace-pre">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
};

export const MarkdownRenderer: React.FC<Props> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-body text-[14.5px] leading-relaxed text-ink-secondary ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mt-3 mb-2 font-display text-xl font-semibold text-ink-primary">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-3 mb-2 font-display text-lg font-semibold text-ink-primary">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-2 mb-1.5 font-display text-base font-semibold text-ink-primary">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="my-2 leading-relaxed whitespace-pre-wrap">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="text-ink-primary font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="my-2 ml-5 list-disc space-y-1 marker:text-ink-muted">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 ml-5 list-decimal space-y-1 marker:text-ink-muted">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-accent/60 bg-white/[0.03] pl-3 py-1 text-ink-secondary italic">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-accent-soft underline decoration-accent/40 hover:decoration-accent"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-4 border-border-subtle" />,
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-2xl border border-border-subtle">
              <table className="w-full border-collapse text-[13.5px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-white/[0.04] text-ink-primary">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-border-subtle px-3 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-t border-border-subtle px-3 py-2 align-top">{children}</td>
          ),
          code({ className: cls, children, ...rest }: any) {
            const raw = String(children ?? '').replace(/\n$/, '');
            const match = /language-(\w+)/.exec(cls || '');
            if (!match) {
              return (
                <code
                  className="rounded-md bg-white/[0.08] px-1.5 py-0.5 text-[0.9em] font-mono text-accent-soft"
                  {...rest}
                >
                  {raw}
                </code>
              );
            }
            return <CodeFence code={raw} lang={match[1]} />;
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
