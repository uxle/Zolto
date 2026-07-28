/**
 * Zolto Animation Tokenizer — Phase 11
 *
 * Line-based scanner for @animate, @keyframes, @timeline, @presentation
 * directive content. Produces a flat token stream consumed by parser.js.
 */

export const ATK = Object.freeze({
  DIRECTIVE:  'directive',
  PERCENT:    'percent',
  PROP_LINE:  'prop_line',
  TEXT_LINE:  'text_line',
  OPEN_BRACE: 'open_brace',
  CLOSE_BRACE:'close_brace',
  NEWLINE:    'newline',
  EOF:        'eof',
});

const RE_DIRECTIVE  = /^@([\w-]+)(.*)?$/;
const RE_PERCENT    = /^(\d{1,3})%\s*\{(.*)$/;
const RE_PROP_ANIM  = /^([\w-]+)\s*:\s*(.+?)\s*->\s*(.+)$/;
const RE_ATTR       = /([\w-]+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g;

/**
 * Parse a key=value attribute string into an object.
 * @param {string} str
 * @returns {Record<string, string>}
 */
export function parseAttrs(str) {
  const result = {};
  let m;
  RE_ATTR.lastIndex = 0;
  while ((m = RE_ATTR.exec(str)) !== null) {
    result[m[1]] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return result;
}

/**
 * Tokenize animation block content into a flat token array.
 * @param {string} src
 * @returns {object[]}
 */
export function tokenizeAnimation(src) {
  const lines = String(src || '').split('\n');
  const tokens = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimStart();

    if (!line) { tokens.push({ type: ATK.NEWLINE, value: '' }); continue; }
    if (line === '{') { tokens.push({ type: ATK.OPEN_BRACE,  value: '{' }); continue; }
    if (line === '}') { tokens.push({ type: ATK.CLOSE_BRACE, value: '}' }); continue; }

    // @directive ...
    const dm = RE_DIRECTIVE.exec(line);
    if (dm) {
      const name    = dm[1].toLowerCase();
      const rest    = (dm[2] || '').trim();
      const attrs   = parseAttrs(rest);
      // Also capture plain quoted string for e.g. @slide title="..." or @slide "title"
      const quoted  = /^"([^"]*)"/.exec(rest)?.[1] ?? /^'([^']*)'/.exec(rest)?.[1] ?? null;
      tokens.push({ type: ATK.DIRECTIVE, name, rest, attrs, quoted });
      continue;
    }

    // 0%  { ... }  or  60% { ... }
    const pm = RE_PERCENT.exec(line);
    if (pm) {
      const pct  = parseInt(pm[1], 10);
      const body = pm[2].replace(/}$/, '').trim();
      // Parse declarations inside braces
      const decls = body.split(';').map(s => s.trim()).filter(Boolean)
        .map(s => {
          const ci = s.indexOf(':');
          if (ci === -1) return null;
          return [s.slice(0, ci).trim(), s.slice(ci + 1).trim()];
        }).filter(Boolean);
      tokens.push({ type: ATK.PERCENT, percent: pct, declarations: decls });
      continue;
    }

    // prop: from -> to (animation property transition)
    const am = RE_PROP_ANIM.exec(line);
    if (am) {
      tokens.push({ type: ATK.PROP_LINE, prop: am[1], from: am[2].trim(), to: am[3].trim() });
      continue;
    }

    // Fall-through: raw text
    tokens.push({ type: ATK.TEXT_LINE, value: line });
  }

  tokens.push({ type: ATK.EOF, value: null });
  return tokens;
}
