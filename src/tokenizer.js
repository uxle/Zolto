/**
 * Zolto Tokenizer — Phase 2
 *
 * Provides:
 *   Tokenizer class        — cursor-based character scanner (used by InlineParser)
 *   escapeHtml / escapeAttr— HTML encoding helpers
 *   slugify / uniqueSlug   — URL-safe heading anchors (Unicode-aware)
 *   parseSimpleYaml        — front-matter parser
 *   parseCodeMeta          — fenced-code info-string parser  [Phase 2]
 *   HTML_ENTITIES          — named-entity → character map     [Phase 2]
 */

// ─── Tokenizer class ──────────────────────────────────────────────────────────

export class Tokenizer {
  constructor(src) {
    this.src = src;
    this.pos = 0;
    this.len = src.length;
  }

  get eof() { return this.pos >= this.len; }

  ch(offset = 0) { return this.src[this.pos + offset] ?? ''; }

  advance(n = 1) {
    const s = this.src.slice(this.pos, this.pos + n);
    this.pos += n;
    return s;
  }

  match(str) {
    if (this.src.startsWith(str, this.pos)) { this.pos += str.length; return true; }
    return false;
  }

  startsWith(str) { return this.src.startsWith(str, this.pos); }

  consumeWhile(pred) {
    const start = this.pos;
    while (!this.eof && pred(this.src[this.pos])) this.pos++;
    return this.src.slice(start, this.pos);
  }

  save()         { return this.pos; }
  restore(saved) { this.pos = saved; }
  remaining()    { return this.src.slice(this.pos); }
}

// ─── HTML utilities ───────────────────────────────────────────────────────────

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function escapeAttr(str) {
  const s = String(str).trim();
  // Browsers strip ASCII tab/newline/carriage-return from a URL before
  // parsing its scheme (WHATWG URL Standard, "remove all ASCII tab or
  // newline" preprocessing step) — so "java\tscript:" is parsed by the
  // browser as "javascript:" even though it doesn't match a naive regex
  // against the raw string. Strip the same characters before testing, or
  // this filter can be bypassed entirely.
  const schemeCheck = s.replace(/[\t\n\r]+/g, '');
  if (/^(?:javascript|vbscript|data):/i.test(schemeCheck)) return '#';
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Slug generation ─────────────────────────────────────────────────────────

/**
 * Convert heading text to a URL-safe id string (Unicode-aware).
 * Strips combining diacriticals so "Héllo" → "hello".
 */
export function slugify(text) {
  return String(text)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacriticals
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

export function uniqueSlug(text, usedSet) {
  let base = slugify(text);
  if (!usedSet.has(base)) { usedSet.add(base); return base; }
  let n = 1;
  while (usedSet.has(`${base}-${n}`)) n++;
  const id = `${base}-${n}`;
  usedSet.add(id);
  return id;
}

// ─── Simple YAML parser ───────────────────────────────────────────────────────

export function parseSimpleYaml(src) {
  const result = {};
  for (const line of src.split('\n')) {
    const m = line.match(/^([\w.-]+)\s*:\s*(.*)/);
    if (!m) continue;
    let val = m[2].trim();
    if (val === 'true')  { result[m[1]] = true;  continue; }
    if (val === 'false') { result[m[1]] = false; continue; }
    if (val === 'null' || val === '~') { result[m[1]] = null; continue; }
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    } else if (val !== '' && !Number.isNaN(Number(val))) {
      val = Number(val);
    }
    result[m[1]] = val;
  }
  return result;
}

// ─── Code block metadata parser  [Phase 2] ────────────────────────────────────

/**
 * Parse a fenced-code info string (the part after the language identifier).
 *
 * Supported tokens:
 *   title="My File"  or  title='My File'   → metadata.title
 *   {1,3-5,7}                               → metadata.highlightLines
 *   numbers  (or  nums / num)               → metadata.lineNumbers = true
 *   diff                                    → metadata.diff = true
 *
 * @param {string|null} metaStr  Raw meta string (may be null)
 * @returns {{ title:string|null, highlightLines:number[], lineNumbers:boolean, diff:boolean }}
 */
export function parseCodeMeta(metaStr) {
  if (!metaStr) return { title: null, highlightLines: [], lineNumbers: false, diff: false };

  let src   = metaStr;
  let title = null;

  // title="..." or title='...'
  const tM = src.match(/\btitle=(?:"([^"]+)"|'([^']+)')/);
  if (tM) { title = tM[1] ?? tM[2]; src = src.replace(tM[0], '').trim(); }

  // {1,3-5,7}
  const hlM = src.match(/\{([^}]+)\}/);
  const highlightLines = hlM ? parseLineRanges(hlM[1]) : [];
  if (hlM) src = src.replace(hlM[0], '').trim();

  const lineNumbers = /\bnums?(?:bers?)?\b/i.test(src);
  const diff        = /\bdiff\b/i.test(src);

  return { title, highlightLines, lineNumbers, diff };
}

/**
 * Parse a highlight-line spec such as "1,3-5,7" into a sorted array of line numbers.
 */
export function parseLineRanges(str) {
  const lines = [];
  for (const part of String(str).split(',')) {
    const trimmed = part.trim();
    const dash = trimmed.indexOf('-');
    if (dash > 0) {
      const a = parseInt(trimmed.slice(0, dash), 10);
      const b = parseInt(trimmed.slice(dash + 1), 10);
      if (!isNaN(a) && !isNaN(b)) for (let i = a; i <= b; i++) lines.push(i);
    } else {
      const n = parseInt(trimmed, 10);
      if (!isNaN(n)) lines.push(n);
    }
  }
  return [...new Set(lines)].sort((a, b) => a - b);
}

// ─── HTML entity map  [Phase 2] ───────────────────────────────────────────────

/**
 * Map of common HTML entity names to their Unicode characters.
 * Named entities found in source text (e.g. &copy;) are emitted verbatim
 * as HTML entity references in output; they do NOT go through escapeHtml.
 */
export const HTML_ENTITIES = Object.freeze({
  // Required by spec
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  // Whitespace / punctuation
  nbsp: '\u00A0', shy: '\u00AD',
  mdash: '\u2014', ndash: '\u2013', hellip: '\u2026',
  laquo: '\u00AB', raquo: '\u00BB',
  ldquo: '\u201C', rdquo: '\u201D', lsquo: '\u2018', rsquo: '\u2019',
  sbquo: '\u201A', bdquo: '\u201E',
  // Legal / commercial
  copy: '\u00A9', reg: '\u00AE', trade: '\u2122',
  // Math
  times: '\u00D7', divide: '\u00F7', plusmn: '\u00B1', minus: '\u2212',
  ne: '\u2260', le: '\u2264', ge: '\u2265', approx: '\u2248',
  infin: '\u221E', sum: '\u2211', prod: '\u220F', radic: '\u221A',
  // Fractions / super/subscript digits
  frac12: '\u00BD', frac14: '\u00BC', frac34: '\u00BE',
  sup2: '\u00B2', sup3: '\u00B3',
  // Misc typography
  deg: '\u00B0', micro: '\u00B5', para: '\u00B6', middot: '\u00B7',
  sect: '\u00A7', dagger: '\u2020', Dagger: '\u2021',
  bull: '\u2022', euro: '\u20AC', pound: '\u00A3', yen: '\u00A5', cent: '\u00A2',
  // Greek (science / math documents)
  alpha: '\u03B1', beta: '\u03B2', gamma: '\u03B3', delta: '\u03B4',
  epsilon: '\u03B5', zeta: '\u03B6', eta: '\u03B7', theta: '\u03B8',
  iota: '\u03B9', kappa: '\u03BA', lambda: '\u03BB', mu: '\u03BC',
  nu: '\u03BD', xi: '\u03BE', pi: '\u03C0', rho: '\u03C1',
  sigma: '\u03C3', tau: '\u03C4', phi: '\u03C6', chi: '\u03C7',
  psi: '\u03C8', omega: '\u03C9',
  // Uppercase Greek
  Alpha: '\u0391', Beta: '\u0392', Gamma: '\u0393', Delta: '\u0394',
  Pi: '\u03A0', Sigma: '\u03A3', Omega: '\u03A9',
  // Arrows
  larr: '\u2190', rarr: '\u2192', uarr: '\u2191', darr: '\u2193',
  harr: '\u2194', rArr: '\u21D2', lArr: '\u21D0',
  // Latin-1 accented letters (lowercase)
  agrave:'\u00E0', aacute:'\u00E1', acirc:'\u00E2', atilde:'\u00E3', auml:'\u00E4', aring:'\u00E5',
  aelig:'\u00E6',  ccedil:'\u00E7',
  egrave:'\u00E8', eacute:'\u00E9', ecirc:'\u00EA', euml:'\u00EB',
  igrave:'\u00EC', iacute:'\u00ED', icirc:'\u00EE', iuml:'\u00EF',
  ntilde:'\u00F1',
  ograve:'\u00F2', oacute:'\u00F3', ocirc:'\u00F4', otilde:'\u00F5', ouml:'\u00F6', oslash:'\u00F8',
  ugrave:'\u00F9', uacute:'\u00FA', ucirc:'\u00FB', uuml:'\u00FC',
  yacute:'\u00FD', yuml:'\u00FF', ccaron:'\u010D',
  szlig:'\u00DF', eth:'\u00F0', thorn:'\u00FE',
  // Latin-1 accented letters (uppercase)
  Agrave:'\u00C0', Aacute:'\u00C1', Acirc:'\u00C2', Atilde:'\u00C3', Auml:'\u00C4', Aring:'\u00C5',
  AElig:'\u00C6',  Ccedil:'\u00C7',
  Egrave:'\u00C8', Eacute:'\u00C9', Ecirc:'\u00CA', Euml:'\u00CB',
  Igrave:'\u00CC', Iacute:'\u00CD', Icirc:'\u00CE', Iuml:'\u00CF',
  Ntilde:'\u00D1',
  Ograve:'\u00D2', Oacute:'\u00D3', Ocirc:'\u00D4', Otilde:'\u00D5', Ouml:'\u00D6', Oslash:'\u00D8',
  Ugrave:'\u00D9', Uacute:'\u00DA', Ucirc:'\u00DB', Uuml:'\u00DC',
  Yacute:'\u00DD',
});
