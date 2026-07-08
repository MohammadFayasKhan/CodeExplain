/**
 * CodeExplain ➜ Plain-English Code Tutor
 * Author ➜ Mohammad Fayas Khan
 * Purpose ➜ Language registers defining supported extensions and Monaco highlights.
 *
 * heuristic language detector used by the input card.
 */

export interface LanguageOption {
  key: string; // canonical identifier the backend receives
  label: string;
}

export const LANGUAGES: LanguageOption[] = [
  { key: 'python', label: 'Python' },
  { key: 'javascript', label: 'JavaScript' },
  { key: 'typescript', label: 'TypeScript' },
  { key: 'java', label: 'Java' },
  { key: 'c', label: 'C' },
  { key: 'cpp', label: 'C++' },
  { key: 'csharp', label: 'C#' },
  { key: 'go', label: 'Go' },
  { key: 'rust', label: 'Rust' },
  { key: 'php', label: 'PHP' },
  { key: 'ruby', label: 'Ruby' },
  { key: 'swift', label: 'Swift' },
  { key: 'kotlin', label: 'Kotlin' },
  { key: 'sql', label: 'SQL' },
  { key: 'html', label: 'HTML' },
  { key: 'css', label: 'CSS' },
  { key: 'shell', label: 'Shell' },
];

export interface DetectionResult {
  language: string;
  confidence: number; // 0-1, higher = more confident
}

/**
 * Rule-based detector. Each language accumulates a score from characteristic
 * tokens. We normalise the top score by the second-best to give a "confidence"
 * number — this lets the UI show a "Detected X, switch?" prompt only when we
 * are reasonably sure.
 */
export function detectLanguageWithConfidence(code: string): DetectionResult | null {
  const c = code.trim();
  if (c.length < 8) return null;

  const scores: Record<string, number> = {};
  const add = (lang: string, n: number) => {
    scores[lang] = (scores[lang] || 0) + n;
  };

  // -------- Python --------
  if (/^\s*def\s+\w+\s*\(/m.test(c)) add('python', 3);
  if (/^\s*from\s+\S+\s+import\s+/m.test(c)) add('python', 3);
  if (/^\s*import\s+\w+/m.test(c)) add('python', 1);
  if (/print\s*\(/.test(c)) add('python', 1);
  if (/^\s*(if|elif|for|while|class|with|try|except)\b.+:\s*$/m.test(c)) add('python', 2);
  if (/\bself\b/.test(c)) add('python', 2);
  if (/\bNone\b|\bTrue\b|\bFalse\b/.test(c)) add('python', 1);
  if (/#[^\n]*$/m.test(c) && !/\/\//.test(c)) add('python', 1);

  // -------- JavaScript --------
  if (/\b(?:const|let|var)\s+\w+/.test(c)) add('javascript', 2);
  if (/=>/.test(c)) add('javascript', 2);
  if (/\bconsole\.log\b/.test(c)) add('javascript', 3);
  if (/\brequire\(['"]/.test(c)) add('javascript', 2);
  if (/\bmodule\.exports\b/.test(c)) add('javascript', 2);
  if (/\bfunction\s+\w+\s*\(/.test(c)) add('javascript', 1);

  // -------- TypeScript (JS + type annotations) --------
  if (/\binterface\s+\w+\s*\{/.test(c)) add('typescript', 4);
  if (/\btype\s+\w+\s*=/.test(c)) add('typescript', 3);
  if (/:\s*(string|number|boolean|any|unknown|void|never)\b/.test(c)) add('typescript', 3);
  if (/\benum\s+\w+/.test(c)) add('typescript', 2);
  if (scores['typescript']) add('javascript', -2); // TS beats JS when signals overlap

  // -------- Java --------
  if (/\bpublic\s+(?:static\s+)?(?:void|class|final)\b/.test(c)) add('java', 3);
  if (/\bSystem\.out\.println\b/.test(c)) add('java', 4);
  if (/\bpackage\s+[\w.]+\s*;/.test(c)) add('java', 3);
  if (/\bimport\s+java\./.test(c)) add('java', 3);

  // -------- C / C++ --------
  const includes = c.match(/#include\s*<[\w./]+>/g);
  if (includes && includes.length) add('c', 2 + includes.length);
  if (/\bstd::/.test(c)) {
    add('cpp', 5);
    add('c', -2);
  }
  if (/\bcout\s*<<|\bcin\s*>>/.test(c)) add('cpp', 4);
  if (/\btemplate\s*<\s*(?:typename|class)/.test(c)) add('cpp', 4);
  if (/\bnullptr\b|\busing\s+namespace\b/.test(c)) add('cpp', 3);
  if (/\bprintf\s*\(|\bscanf\s*\(/.test(c)) add('c', 3);
  if (/\bmalloc\s*\(|\bfree\s*\(/.test(c)) add('c', 2);

  // -------- C# --------
  if (/\busing\s+System\b/.test(c)) add('csharp', 4);
  if (/\bnamespace\s+\w+/.test(c) && /\bpublic\s+class\b/.test(c)) add('csharp', 3);
  if (/\bConsole\.WriteLine\b/.test(c)) add('csharp', 4);

  // -------- Go --------
  if (/^\s*package\s+\w+/m.test(c)) add('go', 4);
  if (/\bfunc\s+\w+\s*\(/.test(c)) add('go', 3);
  if (/\bfmt\.Print/.test(c)) add('go', 3);
  if (/:=\s*[^=]/.test(c)) add('go', 2);

  // -------- Rust --------
  if (/\bfn\s+\w+\s*\(/.test(c)) add('rust', 3);
  if (/\blet\s+mut\b/.test(c)) add('rust', 4);
  if (/\bprintln!\(|\bprint!\(/.test(c)) add('rust', 4);
  if (/->\s*\w+\s*\{/.test(c)) add('rust', 2);
  if (/\buse\s+std::/.test(c)) add('rust', 3);

  // -------- PHP --------
  if (/<\?php/.test(c)) add('php', 6);
  if (/\$\w+\s*=/.test(c) && !/\bconst\b/.test(c)) add('php', 2);
  if (/\becho\s+["'$]/.test(c)) add('php', 2);

  // -------- Ruby --------
  if (/\bdef\s+\w+\s*(?:\(.*\))?\s*$/m.test(c) && /\bend\b/.test(c)) add('ruby', 3);
  if (/\bputs\s+/.test(c)) add('ruby', 3);
  if (/\brequire\s+['"][\w/]+['"]/.test(c)) add('ruby', 2);

  // -------- Swift --------
  if (/\bfunc\s+\w+\s*\(.*\)\s*->/.test(c)) add('swift', 3);
  if (/\bvar\s+\w+\s*:\s*\w+/.test(c)) add('swift', 1);
  if (/\bprint\(/.test(c) && /\blet\s+\w+\s*=/.test(c)) add('swift', 2);
  if (/@objc|@IBAction|@main/.test(c)) add('swift', 4);

  // -------- Kotlin --------
  if (/\bfun\s+\w+\s*\(/.test(c) && /\bval\b|\bvar\b/.test(c)) add('kotlin', 3);
  if (/\bpackage\s+[\w.]+$/m.test(c) && /\bfun\s+/.test(c)) add('kotlin', 2);

  // -------- SQL --------
  if (/\b(?:SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE|JOIN)\b/i.test(c)) {
    add('sql', 4);
  }

  // -------- HTML / CSS --------
  if (/<!DOCTYPE\s+html>/i.test(c)) add('html', 6);
  if (/<html\b|<\/html>|<body\b|<div\b/i.test(c)) add('html', 3);
  if (/\{\s*[\w-]+\s*:\s*[^;]+;/.test(c) && !/=>/.test(c) && !/\bfunction\b/.test(c)) {
    add('css', 2);
  }
  if (/@media\s+/.test(c) || /:hover\s*\{/.test(c)) add('css', 3);

  // -------- Shell --------
  if (/^#!\s*\/bin\/(?:bash|sh|zsh)/.test(c)) add('shell', 6);
  if (/\becho\s+["'$]/.test(c) && /\$\w+/.test(c) && !/\bfunction\b/.test(c)) add('shell', 1);

  // Determine winner + confidence relative to runner-up.
  const ranked = Object.entries(scores).sort(([, a], [, b]) => b - a);
  if (ranked.length === 0) return null;
  const [topLang, topScore] = ranked[0];
  if (topScore < 2) return null;
  const secondScore = ranked[1]?.[1] ?? 0;
  const margin = topScore - secondScore;
  // Confidence heuristic: strong margin OR very high absolute score.
  const confidence = Math.max(0, Math.min(1, margin / 4 + Math.min(topScore, 8) / 16));
  return { language: topLang, confidence };
}

/** Backwards-compatible convenience wrapper used by the older paste-detection. */
export function detectLanguage(code: string): string | null {
  return detectLanguageWithConfidence(code)?.language ?? null;
}
