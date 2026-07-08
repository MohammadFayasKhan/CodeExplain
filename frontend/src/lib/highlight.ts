/**
 * Lightweight, dependency-free syntax highlighter for the token sets we
 * care about (Python, JS/TS, Java/C/C++/Go, Rust, PHP, Ruby, SQL, etc.).
 *
 * We use a placeholder-swap pattern so the keyword pass can never
 * accidentally re-highlight the `class="..."` attributes we've already
 * inserted. Every wrap step stashes its span into a placeholder table and
 * only restores the real HTML at the very end.
 */

const KEYWORDS: Record<string, string[]> = {
  python: [
    'def','return','if','elif','else','for','while','in','not','and','or','import','from','as','class','with','try','except','finally','raise','lambda','pass','yield','True','False','None','self','print','len','range','enumerate','sorted','map','filter','sum','is',
  ],
  javascript: [
    'const','let','var','function','return','if','else','for','while','of','in','do','switch','case','break','continue','class','extends','new','this','import','export','from','default','async','await','try','catch','finally','throw','typeof','instanceof','true','false','null','undefined','console',
  ],
  typescript: [
    'const','let','var','function','return','if','else','for','while','of','in','type','interface','class','extends','implements','new','this','import','export','from','default','async','await','try','catch','finally','throw','typeof','instanceof','public','private','protected','readonly','true','false','null','undefined','enum',
  ],
  java: ['public','private','protected','static','final','class','interface','extends','implements','void','int','long','float','double','boolean','char','String','if','else','for','while','do','switch','case','break','continue','return','new','this','try','catch','finally','throw','throws','true','false','null','package','import'],
  c: ['int','long','float','double','char','void','if','else','for','while','do','switch','case','break','continue','return','struct','typedef','const','static','sizeof','include','define'],
  cpp: ['int','long','float','double','char','void','bool','if','else','for','while','do','switch','case','break','continue','return','struct','class','public','private','protected','template','typename','namespace','std','const','static','sizeof','include','define','true','false','nullptr','using','auto','virtual','override','new','delete'],
  csharp: ['public','private','protected','internal','static','readonly','sealed','class','interface','struct','enum','namespace','using','if','else','for','foreach','while','do','switch','case','break','continue','return','new','this','base','try','catch','finally','throw','var','int','string','bool','void','true','false','null'],
  go: ['func','var','const','if','else','for','range','return','package','import','type','struct','interface','map','chan','go','defer','select','switch','case','break','continue','true','false','nil'],
  rust: ['fn','let','mut','const','static','if','else','for','while','loop','match','return','pub','use','mod','struct','enum','impl','trait','self','Self','crate','super','true','false','as','ref','move','async','await'],
  php: ['function','return','if','else','elseif','for','foreach','while','do','switch','case','break','continue','class','interface','trait','extends','implements','public','private','protected','static','abstract','final','const','var','new','use','namespace','echo','print','true','false','null'],
  ruby: ['def','end','return','if','elsif','else','unless','for','while','until','do','begin','rescue','ensure','case','when','class','module','require','include','extend','attr_accessor','attr_reader','attr_writer','puts','print','nil','true','false','self'],
  swift: ['func','let','var','return','if','else','for','while','repeat','switch','case','break','continue','class','struct','enum','protocol','extension','init','deinit','public','private','internal','fileprivate','open','static','override','import','true','false','nil','self','guard','defer'],
  kotlin: ['fun','val','var','return','if','else','for','while','when','class','interface','object','data','sealed','open','abstract','override','public','private','protected','internal','import','package','true','false','null','this','is','as','in','out'],
  sql: ['SELECT','FROM','WHERE','INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE','TABLE','ALTER','DROP','JOIN','LEFT','RIGHT','INNER','OUTER','ON','GROUP','BY','ORDER','HAVING','LIMIT','OFFSET','AS','AND','OR','NOT','NULL','IS','LIKE','IN','BETWEEN','DISTINCT','COUNT','SUM','AVG','MIN','MAX'],
  shell: ['if','then','else','elif','fi','for','in','do','done','while','case','esac','function','return','echo','read','export','local','source'],
  html: [],
  css: [],
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Placeholder table -> stashes already-wrapped spans so downstream regexes
 * don't reach into them. Placeholder characters use the Private Use Area so
 * they can never appear in real user code. */
class PlaceholderTable {
  private items: string[] = [];
  stash(html: string): string {
    const idx = this.items.push(html) - 1;
    return `\uE000${idx}\uE001`;
  }
  restore(text: string): string {
    return text.replace(/\uE000(\d+)\uE001/g, (_m, n) => this.items[Number(n)]);
  }
}

/** Return an HTML string with token spans applied. */
export function highlight(code: string, language: string): string {
  const lang = language?.toLowerCase() || 'plaintext';
  const words = new Set(KEYWORDS[lang] || KEYWORDS.python || []);
  // Compare a token against keywords case-sensitively unless the language is
  // SQL, which conventionally is case-insensitive.
  const wordsCaseInsensitive = lang === 'sql';

  const escaped = escapeHtml(code);
  const table = new PlaceholderTable();

  // Pass 1: block comments. We stash BEFORE the keyword pass so that anything
  // inside a comment can never be re-tokenised.
  let out = escaped.replace(/\/\*[\s\S]*?\*\//g, (m) =>
    table.stash(`<span class="hl-token-comment">${m}</span>`),
  );

  // Pass 2: line comments (depends on language).
  let commentRegex = /(^|[^:\uE000-\uE001])(#[^\n]*|\/\/[^\n]*)/g;
  if (['python', 'ruby', 'shell'].includes(lang)) {
    commentRegex = /(^|[^:\uE000-\uE001])(#[^\n]*)/g;
  } else if (lang === 'sql') {
    commentRegex = /(^|[^:\uE000-\uE001])(--[^\n]*)/g;
  } else if (['javascript', 'typescript', 'c', 'cpp', 'java', 'go', 'rust', 'swift', 'kotlin'].includes(lang)) {
    commentRegex = /(^|[^:\uE000-\uE001])(\/\/[^\n]*)/g;
  }

  out = out.replace(commentRegex, (_m, p1, p2) =>
    `${p1}${table.stash(`<span class="hl-token-comment">${p2}</span>`)}`,
  );

  // Pass 3: strings — triple quotes, single, double, backtick.
  out = out.replace(
    /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g,
    (m) => table.stash(`<span class="hl-token-string">${m}</span>`),
  );

  // Pass 4: numbers. Avoid matching digits inside placeholders.
  out = out.replace(/\uE000\d+\uE001|\b(\d+(?:\.\d+)?)\b/g, (m, num) => {
    if (num === undefined) return m;
    return table.stash(`<span class="hl-token-number">${num}</span>`);
  });

  // Pass 5: keywords + function-call detection. Because the previous passes
  // are already stashed as placeholders, this regex only sees "real" tokens,
  // never our own class="" attributes.
  out = out.replace(/([A-Za-z_][A-Za-z0-9_]*)(\s*)(\()?/g, (_m, name, ws, paren) => {
    const isKeyword = wordsCaseInsensitive
      ? words.has(name.toUpperCase())
      : words.has(name);
    if (isKeyword) {
      const stashed = table.stash(`<span class="hl-token-keyword">${name}</span>`);
      return `${stashed}${ws}${paren ?? ''}`;
    }
    if (paren) {
      // identifier immediately followed by "(" — function call.
      const stashed = table.stash(`<span class="hl-token-func">${name}</span>`);
      return `${stashed}${ws}${paren}`;
    }
    return `${name}${ws}${paren ?? ''}`;
  });

  return table.restore(out);
}
