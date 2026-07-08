/**
 * MonacoCodeEditor — VS Code-like editor built on @monaco-editor/react.
 *
 * Wraps Monaco with our dark theme, sane defaults (line numbers, bracket
 * pair colorisation, auto-close, minimap off by default, word wrap toggle),
 * and a small toolbar. Lazy-loaded from App to keep the initial bundle small.
 *
 * Key UX behaviours:
 * - Placeholder is shown ONLY when the doc is empty AND the editor is
 *   unfocused. Focus hides it immediately so the caret is never rendered
 *   on top of placeholder glyphs.
 * - `alwaysConsumeMouseWheel: false` on the scrollbar so scrolling the page
 *   while the cursor is inside the editor still scrolls the whole page
 *   (once the editor itself has no more room to scroll).
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { WrapText, ClipboardPaste, Trash2, Search } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  language: string;
  placeholder?: string;
  minHeight?: number;
}

// Map our language keys to Monaco language IDs where they differ.
const MONACO_LANG: Record<string, string> = {
  python: 'python',
  javascript: 'javascript',
  typescript: 'typescript',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  csharp: 'csharp',
  go: 'go',
  rust: 'rust',
  php: 'php',
  ruby: 'ruby',
  swift: 'swift',
  kotlin: 'kotlin',
  sql: 'sql',
  html: 'html',
  css: 'css',
  json: 'json',
  markdown: 'markdown',
  shell: 'shell',
  yaml: 'yaml',
};

export const MonacoCodeEditor: React.FC<Props> = ({
  value,
  onChange,
  language,
  placeholder = 'Paste the code you want explained…',
  minHeight = 280,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const [wordWrap, setWordWrap] = useState<'off' | 'on'>('off');
  const [isFocused, setIsFocused] = useState(false);

  // Placeholder is only visible when the doc is genuinely empty AND the user
  // isn't currently editing. This is the fix for the "caret overlaps
  // placeholder glyphs" bug — Monaco has no built-in placeholder API, so we
  // render our own overlay and gate it on focus.
  const showPlaceholder = !value && !isFocused;

  // Define our custom "CodeExplain" dark theme once Monaco is mounted.
  const handleBeforeMount = useCallback((monaco: any) => {
    monaco.editor.defineTheme('codeexplain-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6b6c78', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c084fc' },
        { token: 'string', foreground: 'a5f3b6' },
        { token: 'number', foreground: 'ffd580' },
        { token: 'function', foreground: '7dd3fc' },
        { token: 'type', foreground: 'f0abfc' },
      ],
      colors: {
        'editor.background': '#111218',
        'editor.foreground': '#ffffff',
        'editorLineNumber.foreground': '#4a4b5a',
        'editorLineNumber.activeForeground': '#a89cff',
        'editor.selectionBackground': '#7c6af74d',
        'editor.lineHighlightBackground': '#ffffff08',
        'editorCursor.foreground': '#a89cff',
        'editorBracketMatch.background': '#7c6af740',
        'editorBracketMatch.border': '#7c6af7',
      },
    });
  }, []);

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.updateOptions({
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontLigatures: true,
    });
    // Track focus state so the placeholder overlay knows when to hide.
    editor.onDidFocusEditorText(() => setIsFocused(true));
    editor.onDidBlurEditorText(() => setIsFocused(false));
  }, []);

  const monacoLanguage = useMemo(
    () => MONACO_LANG[language] || 'plaintext',
    [language],
  );

  const toggleWrap = () =>
    setWordWrap((w) => {
      const next = w === 'off' ? 'on' : 'off';
      editorRef.current?.updateOptions({ wordWrap: next });
      return next;
    });

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onChange(text);
    } catch {
      /* clipboard blocked, silently ignore */
    }
  };

  const clearAll = () => {
    onChange('');
    editorRef.current?.setValue('');
    editorRef.current?.focus();
  };

  const openFind = () => {
    editorRef.current?.getAction('actions.find')?.run();
  };

  return (
    <div className="relative rounded-2xl border border-border-subtle bg-[#111218] overflow-hidden">
      {/* Editor toolbar */}
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-1.5">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          <span className="inline-block h-2 w-2 rounded-full bg-red-400/70" />
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400/70" />
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400/70" />
          <span className="ml-2">Editor · {language}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={openFind}
            title="Find (Ctrl+F)"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-ink-muted hover:text-ink-primary hover:bg-white/[0.06] transition"
            data-testid="editor-find-btn"
          >
            <Search size={12} /> Find
          </button>
          <button
            onClick={toggleWrap}
            title="Toggle word wrap"
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition ${
              wordWrap === 'on'
                ? 'text-accent-soft bg-accent/10'
                : 'text-ink-muted hover:text-ink-primary hover:bg-white/[0.06]'
            }`}
            data-testid="editor-wrap-btn"
          >
            <WrapText size={12} /> Wrap
          </button>
          <button
            onClick={pasteFromClipboard}
            title="Paste from clipboard"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-ink-muted hover:text-ink-primary hover:bg-white/[0.06] transition"
            data-testid="editor-paste-btn"
          >
            <ClipboardPaste size={12} /> Paste
          </button>
          <button
            onClick={clearAll}
            title="Clear"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-ink-muted hover:text-red-300 hover:bg-white/[0.06] transition"
            data-testid="editor-clear-btn"
          >
            <Trash2 size={12} /> Clear
          </button>
        </div>
      </div>

      <div className="relative" style={{ height: `${minHeight}px` }} data-testid="monaco-editor">
        <Editor
          height="100%"
          language={monacoLanguage}
          theme="codeexplain-dark"
          value={value}
          onChange={(v) => onChange(v ?? '')}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          loading={<div className="p-4 text-sm text-ink-muted">Loading editor…</div>}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 12, bottom: 12 },
            bracketPairColorization: { enabled: true },
            guides: { indentation: true, bracketPairs: true },
            wordWrap: wordWrap,
            fixedOverflowWidgets: true,
            // Suggest/quick-info tuned for a code-analysis app.
            quickSuggestions: { other: true, comments: false, strings: false },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            wordBasedSuggestions: 'currentDocument',
            // CRITICAL: allow the OUTER page to scroll once the editor's own
            // scroll has bottomed out. Without this, mouse wheel events over
            // the editor get swallowed and the page appears "stuck".
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
              alwaysConsumeMouseWheel: false,
            },
            mouseWheelScrollSensitivity: 1,
          }}
        />

        {/* Placeholder overlay. Fades out on focus (opacity + transition)
            rather than snapping so the transition feels intentional. */}
        <div
          className={`pointer-events-none absolute inset-0 flex items-start px-[62px] pt-[14px] text-[14px] text-ink-muted font-mono select-none transition-opacity duration-150 ${
            showPlaceholder ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden
        >
          {placeholder}
        </div>
      </div>
    </div>
  );
};

export default MonacoCodeEditor;
