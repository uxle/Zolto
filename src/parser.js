/**
 * Zolto Block Parser — Phase 4
 *
 * Converts block tokens from the lexer into a Document AST.
 *
 * Phase 2 additions:
 *   • callout detection   — inside blockquote content  > [!NOTE]
 *   • admonition parsing  — [info]…[/info] tokens
 *   • reference defs      — collected into doc.metadata.references
 *   • definition lists    — term\n: definition tokens
 *   • figure creation     — standalone image paragraphs
 *   • code block metadata — title, highlightLines, lineNumbers, diff
 *   • table captions      — from lexer caption field
 *
 * Phase 3 additions:
 *   • directive parsing    — @block … @/block → typed AST nodes
 *
 * Phase 4 additions:
 *   • @math block parsing  — label/title/env/numbered config, equation
 *     numbering (shared counter via ctx.eqCounter), label registry
 *     (ctx.labels) for @ref() cross-reference resolution at render time
 */

import { parseDirective } from './directives.js';
import * as AST            from './ast.js';
import { CALLOUT_TYPES }   from './ast.js';
import { tokenize, T }     from './lexer.js';
import { parseInline }     from './inline-parser.js';
import { parseSimpleYaml, parseCodeMeta } from './tokenizer.js';
import { parseAttrStr }    from './directive-lexer.js';
import { parseMath, parseMathRows } from './math-parser.js';
import { parseDiagram }      from './diagram/parser.js';
import { parseChart }        from './chart/parser.js';
import { parseVector }       from './vector/parser.js';
import { parseLayout }       from './layout/parser.js';
import { parseInteractiveSource } from './interactive/parser.js';
import { parseAnimationSource }   from './animation/parser.js';
import { parsePluginManifestBlock } from './plugin/manifest.js';

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * @param {BlockToken[]} tokens
 * @returns {DocumentNode}
 */
export function parseTokens(tokens, opts = {}) {
  const blocks     = [];
  const metadata   = {};
  const vars       = {};
  const references = new Map();  // Phase 2: reference link map
  const eqCounter  = { value: 0 }; // Phase 4: shared, mutated across all @math blocks
  const labels     = new Map();    // Phase 4: label -> equation number, for @ref()
  const registry   = opts?.registry ?? null;

  for (const tok of tokens) {
    if (tok.type === T.BLANK) continue;

    // Collect reference defs before building AST
    if (tok.type === T.REFERENCE_DEF) {
      references.set(tok.id, { href: tok.href, title: tok.title });
      blocks.push(AST.referenceDef(tok.id, tok.href, tok.title));
      continue;
    }

    const node = parseBlockToken(tok, { vars, refs: references, eqCounter, labels, registry });
    if (!node) continue;

    if (node.type === 'frontmatter') Object.assign(metadata, node.data);
    if (node.type === 'variable_def') vars[node.name] = node.value;

    blocks.push(node);
  }

  if (Object.keys(vars).length) metadata.variables = vars;
  if (references.size)          metadata.references = references;
  if (labels.size)               metadata.mathLabels = labels;

  return AST.document(blocks, metadata);
}

// ─── Block token → AST node ───────────────────────────────────────────────────

function parseBlockToken(tok, ctx = {}) {
  switch (tok.type) {
    case T.FRONTMATTER:     return parseFrontmatter(tok);
    case T.HEADING:         return parseHeading(tok, ctx);
    case T.HR:              return AST.horizontalRule();
    case T.BLOCKQUOTE:      return parseBlockquote(tok, ctx);
    case T.LIST:            return parseList(tok, ctx);
    case T.FENCED_CODE:     return parseFencedCode(tok);
    case T.TABLE:           return parseTable(tok, ctx);
    case T.COMMENT:         return AST.comment(tok.value);
    case T.HTML_BLOCK:      return AST.htmlBlock(tok.value);
    case T.IMPORT:          return AST.importNode(tok.path);
    case T.VARIABLE_DEF:    return AST.variableDef(tok.name, tok.value);
    case T.FOOTNOTE_DEF:    return parseFootnoteDef(tok, ctx);
    case T.ADMONITION:      return parseAdmonition(tok, ctx);    // Phase 2
    case T.DEFINITION_LIST: return parseDefinitionList(tok);     // Phase 2
    case T.MATH_BLOCK:      return parseMathBlock(tok, ctx);     // Phase 4
    case T.DIAGRAM_BLOCK:   return parseDiagram(tok.content, tok.header).ast; // Phase 5
    case T.CHART_BLOCK:     return parseChart(tok.content, tok.header).ast;   // Phase 6
    case T.VECTOR_BLOCK:    return parseVector(tok.content, tok.header).ast;  // Phase 7
    case T.LAYOUT_BLOCK:    return parseLayout(tok.content, tok.header).ast;  // Phase 8
    case T.INTERACTIVE_BLOCK: {                                                  // Phase 10
      const nodes = parseInteractiveSource(tok.content);
      return nodes.length === 1 ? nodes[0] : { type: 'interactive', id: null, classes: [], children: nodes };
    }
    case T.ANIMATION_BLOCK: {                                                    // Phase 11
      const animNodes = parseAnimationSource(tok.content, tok.tag, tok.header);
      if (!animNodes || animNodes.length === 0) return null;
      return animNodes.length === 1 ? animNodes[0] : { type: 'animation_group', children: animNodes };
    }
    case T.PLUGIN_BLOCK: {                                                       // Phase 12
      return parsePluginManifestBlock(tok.content);
    }
    case T.PARAGRAPH:       return parseParagraph(tok, ctx);
    case 'directive': {
      const repCtx = {
        ...ctx,
        reparse(src) {
          if (!src || !src.trim()) return [];
          const { tokens: inner } = tokenize(src);
          return inner.filter(t => t.type !== T.BLANK)
                      .map(t => parseBlockToken(t, repCtx))
                      .filter(Boolean);
        },
      };
      return parseDirective(tok, repCtx);
    }
    default:                return null;
  }
}

// ─── Frontmatter ─────────────────────────────────────────────────────────────

function parseFrontmatter(tok) {
  return AST.frontmatter(tok.value, parseSimpleYaml(tok.value));
}

// ─── Headings ─────────────────────────────────────────────────────────────────

function parseHeading(tok, ctx) {
  const { text, id, classes } = extractHeadingAttrs(tok.text);
  return AST.heading(tok.level, parseInline(text, ctx), { id, classes });
}

function extractHeadingAttrs(rawText) {
  const m = rawText.match(/^(.*?)\s*\{([^}]+)\}\s*$/);
  if (!m) return { text: rawText.trim(), id: null, classes: [] };
  const attrStr = m[2];
  const id      = (attrStr.match(/#([\w-]+)/) ?? [])[1] ?? null;
  const classes = Array.from(attrStr.matchAll(/\.([\w-]+)/g), x => x[1]);
  return { text: m[1].trim(), id, classes };
}

// ─── Paragraph (Phase 2: figure detection) ────────────────────────────────────

const STANDALONE_IMG = /^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]+)")?\)\s*$/;

function parseParagraph(tok, ctx) {
  const raw = tok.raw.trim();
  // Standalone image → <figure>
  const img = STANDALONE_IMG.exec(raw);
  if (img) {
    return AST.figure(img[2], img[1] ?? '', {
      title:   img[3] ?? null,
      caption: img[3] ?? null,
    });
  }
  return AST.paragraph(parseInline(raw, ctx));
}

// ─── Fenced code block (Phase 2: metadata) ────────────────────────────────────

function parseFencedCode(tok) {
  const meta = parseCodeMeta(tok.meta);
  const isDiffLang = (tok.lang ?? '').toLowerCase() === 'diff';
  return AST.codeBlock(tok.value, {
    lang:           tok.lang,
    meta:           tok.meta,
    title:          meta.title,
    highlightLines: meta.highlightLines,
    lineNumbers:    meta.lineNumbers,
    diff:           meta.diff || isDiffLang,
  });
}

// ─── Footnote def ─────────────────────────────────────────────────────────────

function parseFootnoteDef(tok, ctx) {
  return AST.footnoteDef(tok.id, parseInline(tok.content, ctx));
}

// ─── Blockquote (Phase 2: callout detection) ──────────────────────────────────

function parseBlockquote(tok, ctx) {
  const contentLines = tok.content.split('\n');
  const firstLine    = contentLines[0].trim();

  // GitHub-style callout  > [!NOTE]  > [!TIP]  etc.
  const calloutM = /^\[!([\w]+)\](?:[ \t]+(.+))?$/.exec(firstLine);
  if (calloutM) {
    const cType = calloutM[1].toLowerCase();
    if (CALLOUT_TYPES.has(cType)) {
      const innerSrc  = contentLines.slice(1).join('\n').trim();
      const { tokens: inner } = tokenize(innerSrc);
      const children = inner
        .filter(t => t.type !== T.BLANK)
        .map(t => parseBlockToken(t, ctx))
        .filter(Boolean);
      return AST.callout(cType, children, { title: calloutM[2] ?? null });
    }
  }

  // Regular blockquote
  const { tokens: inner } = tokenize(tok.content);
  const children = inner
    .filter(t => t.type !== T.BLANK)
    .map(t => parseBlockToken(t, ctx))
    .filter(Boolean);
  return AST.blockquote(children);
}

// ─── Admonition  [info]…[/info]  (Phase 2) ───────────────────────────────────

function parseAdmonition(tok, ctx) {
  const { tokens: inner } = tokenize(tok.content);
  const children = inner
    .filter(t => t.type !== T.BLANK)
    .map(t => parseBlockToken(t, ctx))
    .filter(Boolean);
  return AST.admonition(tok.admonType, children, { title: tok.title });
}

// ─── @math block  (Phase 4) ───────────────────────────────────────────────────

const MULTI_LINE_ENVS = new Set(['align', 'gather']);

function parseMathBlock(tok, ctx) {
  const config    = parseAttrStr(tok.config);
  const label     = config.label ? String(config.label) : null;
  const title     = config.name ? String(config.name) : (config.title ? String(config.title) : null);
  const env       = String(config.env || 'equation');
  const numbered  = config.numbered !== false; // default true unless explicitly numbered=false

  let mathAst, parseErrors;
  if (MULTI_LINE_ENVS.has(env)) {
    const { equations, errors } = parseMathRows(tok.content);
    mathAst     = { type: 'EquationGroup', env, children: equations };
    parseErrors = errors;
  } else {
    const { ast, errors } = parseMath(tok.content);
    mathAst     = ast;
    parseErrors = errors;
  }

  let number = 0;
  if (numbered) { ctx.eqCounter.value++; number = ctx.eqCounter.value; }
  if (label && ctx.labels) ctx.labels.set(label, number);

  return AST.mathBlock(tok.content, mathAst, { env, numbered, label, number, title, parseErrors });
}

// ─── Definition list  (Phase 2) ───────────────────────────────────────────────

function parseDefinitionList(tok) {
  // Build items: each term can have multiple definitions
  const items = tok.terms.map(term =>
    AST.definitionItem(term, tok.defs)
  );
  // Simplified: all defs apply to all terms (could be refined)
  return AST.definitionList(items);
}

// ─── List ─────────────────────────────────────────────────────────────────────

const RE_UL = /^([ \t]*)[*+-][ \t]+(.*)/;
const RE_OL = /^([ \t]*)(\d{1,9})([.)])[ \t]+(.*)/;

function parseList(tok, ctx) {
  const lines      = tok.raw.split('\n');
  const ordered    = tok.ordered;
  const RE         = ordered ? RE_OL : RE_UL;
  const firstM     = RE.exec(lines[0]);
  const baseIndent = firstM ? firstM[1].length : 0;

  const groups = [];
  let cur = null; let hasBlank = false;

  for (const line of lines) {
    const m         = RE.exec(line);
    const isTopItem = m && m[1].length === baseIndent;
    if (isTopItem) {
      if (cur) groups.push(cur);
      cur = { text: ordered ? m[4] : m[2], startNum: ordered ? parseInt(m[2], 10) : null, cont: [], hasBlank: false };
    } else if (cur) {
      if (!line.trim()) { hasBlank = true; cur.hasBlank = true; cur.cont.push(''); }
      else cur.cont.push(line);
    }
  }
  if (cur) groups.push(cur);

  const loose = hasBlank;
  const start = ordered && groups.length ? groups[0].startNum : null;
  return AST.list(ordered, groups.map(g => buildListItem(g, loose, ctx)), { start, tight: !loose });
}

function buildListItem(group, loose, ctx) {
  let text = group.text; let checked = null;
  const tm = text.match(/^\[([xX ])\][ \t]+(.*)/);
  if (tm) { checked = tm[1].toLowerCase() === 'x'; text = tm[2]; }

  const nonBlank = group.cont.filter(l => l.trim());
  const minI = nonBlank.length
    ? Math.min(...nonBlank.map(l => (l.match(/^([ \t]*)/)?.[1] ?? '').length))
    : 0;
  const stripped = group.cont.map(l => l.trim() === '' ? '' : l.slice(Math.min(minI, l.length)));
  const subSrc   = stripped.join('\n').trim();

  let children;
  if (!subSrc) {
    children = [AST.paragraph(parseInline(text, ctx))];
  } else {
    const { tokens: inner } = tokenize(text + '\n' + stripped.join('\n'));
    children = inner.filter(t => t.type !== T.BLANK).map(t => parseBlockToken(t, ctx)).filter(Boolean);
  }

  return AST.listItem(children, { checked });
}

// ─── Table (Phase 2: caption) ─────────────────────────────────────────────────

const RE_SEP = /^\|?[ \t]*:?-{1,}:?[ \t]*(?:\|[ \t]*:?-{1,}:?[ \t]*)*\|?[ \t]*$/;

function parseTable(tok, ctx) {
  const rows   = tok.rows;
  const sepIdx = rows.findIndex(r => RE_SEP.test(r));
  if (sepIdx < 1) return AST.paragraph(parseInline(rows.join(' '), ctx));

  const align = parseSepRow(rows[sepIdx]);
  const head  = rows.slice(0, sepIdx).map(r => parseTableRow(r, align, ctx));
  const body  = rows.slice(sepIdx + 1).map(r => parseTableRow(r, align, ctx));

  return AST.table(head, body, align, { caption: tok.caption ?? null });
}

function parseSepRow(row) {
  return splitCells(row).map(cell => {
    const t = cell.trim();
    if (t.startsWith(':') && t.endsWith(':')) return 'center';
    if (t.endsWith(':'))   return 'right';
    if (t.startsWith(':')) return 'left';
    return null;
  });
}

function parseTableRow(raw, align, ctx) {
  const cells = splitCells(raw);
  return AST.tableRow(cells.map((cell, i) =>
    AST.tableCell(parseInline(cell.trim(), ctx), align[i] ?? null)
  ));
}

function splitCells(row) {
  let s = row.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|'))   s = s.slice(0, -1);
  const cells = []; let cur = '';
  for (let j = 0; j < s.length; j++) {
    if (s[j] === '\\' && s[j+1] === '|') { cur += '|'; j++; }
    else if (s[j] === '|') { cells.push(cur); cur = ''; }
    else cur += s[j];
  }
  cells.push(cur); return cells;
}
