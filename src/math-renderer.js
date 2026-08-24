/**
 * Zolto Math HTML Renderer — Phase 4
 *
 * Walks a math AST (math-ast.js shapes) and produces nested HTML/CSS
 * `<span>` elements — a native, dependency-free approximation of TeX
 * layout rules (stacked fractions, radical overlines, super/subscript
 * nesting, matrix grids, auto-scaling delimiters via Unicode brackets).
 *
 * Independent from math-parser.js — only consumes the AST shape contract.
 * Independent from the main document renderer.js — receives an escapeHtml
 * function via the ctx parameter so it never needs to import tokenizer.js
 * directly (kept decoupled per the Phase 4 "renderer independent from
 * parser" requirement, and to avoid coupling math rendering to Markdown
 * rendering internals).
 */

import { MATRIX_DELIMS } from './math-symbols.js';

// ─── CSS ──────────────────────────────────────────────────────────────────────
// Injected once via <style id="zl-math-styles"> only when math nodes exist
// in the document — mirrors the Phase 3 PHASE3_CSS conditional-injection
// pattern so no existing CSS files need to be touched.

export const MATH_CSS = `
.zl-math{display:inline-block;font-family:'Cambria Math','STIX Two Math','Latin Modern Math',serif;font-style:normal;line-height:1;vertical-align:middle}
.zl-math-display{display:block;text-align:center;margin:1.2em 0;overflow-x:auto;overflow-y:hidden;padding:.2em 0}
.zl-math-inline{display:inline-block}
.zl-mrow{display:inline-flex;align-items:center;white-space:nowrap}
.zl-mi{font-style:italic;padding:0 .02em}
.zl-mi-upright{font-style:normal}
.zl-mn{font-style:normal}
.zl-mo{padding:0 .22em;font-style:normal}
.zl-mo-tight{padding:0 .05em}
.zl-msymbol{font-style:normal;padding:0 .08em}
.zl-mtext{font-family:var(--font-sans, system-ui, sans-serif);font-style:normal;padding:0 .15em}
.zl-mspace{display:inline-block}
.zl-merror{color:#ef4444;border-bottom:1px dashed #ef4444;font-family:var(--font-mono, monospace);font-size:.85em;cursor:help}

.zl-frac{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;margin:0 .15em;position:relative;top:.08em}
.zl-frac-num,.zl-frac-den{display:flex;justify-content:center;padding:0 .15em;font-size:.92em}
.zl-frac-num{border-bottom:.065em solid currentColor;padding-bottom:.15em}
.zl-frac-den{padding-top:.15em}

.zl-sqrt{display:inline-flex;align-items:flex-start;margin:0 .1em}
.zl-sqrt-idx{font-size:.6em;position:relative;top:.3em;margin-right:-.4em;left:.2em}
.zl-sqrt-sign{font-size:1.15em;padding-right:.05em;position:relative;top:-.02em}
.zl-sqrt-body{border-top:.07em solid currentColor;padding:.08em .12em 0 .05em}

.zl-pow-wrap,.zl-sub-wrap,.zl-subsup-wrap{display:inline-flex;align-items:center;position:relative}
.zl-sup{font-size:.68em;vertical-align:super;position:relative;top:-.42em;margin-left:.03em}
.zl-sub{font-size:.68em;vertical-align:sub;position:relative;bottom:-.28em;margin-left:.03em}
.zl-subsup-stack{display:inline-flex;flex-direction:column;font-size:.68em;margin-left:.03em;line-height:1.15}
.zl-subsup-stack .zl-subsup-sup{position:relative;left:0}
.zl-subsup-stack .zl-subsup-sub{position:relative;left:0}

.zl-delim{display:inline-flex;align-items:center}
.zl-delim-open,.zl-delim-close{display:inline-block;padding:0 .04em;font-weight:400}
.zl-delim-stretchy .zl-delim-open,.zl-delim-stretchy .zl-delim-close{transform:scaleY(1.15);display:inline-block}

.zl-over,.zl-under{display:inline-flex;flex-direction:column;align-items:center;margin:0 .05em}
.zl-over-mark{font-size:.85em;line-height:1}
.zl-over-body{border-top:.06em solid currentColor;padding-top:.05em}
.zl-under-body{border-bottom:.06em solid currentColor;padding-bottom:.05em}
.zl-under-mark{font-size:.85em;line-height:1}
.zl-overline-body{border-top:.055em solid currentColor;padding-top:.06em}
.zl-underline-body{border-bottom:.055em solid currentColor;padding-bottom:.06em}

.zl-bigop{display:inline-flex;flex-direction:column;align-items:center;margin:0 .12em;vertical-align:middle}
.zl-bigop-sup,.zl-bigop-sub{font-size:.62em;line-height:1.1}
.zl-bigop-glyph{font-size:1.5em;line-height:.9;padding:.03em 0}

.zl-limit{display:inline-flex;flex-direction:column;align-items:center;margin:0 .12em;vertical-align:middle}
.zl-limit-name{font-style:normal}
.zl-limit-under{font-size:.62em;line-height:1.1}

.zl-fn{font-style:normal;padding:0 .05em .0 0}

.zl-matrix{display:inline-grid;gap:.25em .7em;vertical-align:middle;margin:0 .12em;padding:.15em 0}
.zl-matrix-cell{display:flex;align-items:center;justify-content:center}
.zl-matrix-cases .zl-matrix-cell{justify-content:flex-start}
.zl-matrix-delim-open,.zl-matrix-delim-close{font-size:1.6em;display:inline-flex;align-items:center;vertical-align:middle;transform:scaleY(1.35)}

.zl-vec{position:relative;display:inline-block;padding-top:.35em}
.zl-vec::before{content:'\\2192';position:absolute;top:-.05em;left:50%;transform:translateX(-50%) scaleX(1.3);font-size:.7em}
.zl-accent{position:relative;display:inline-block}
.zl-accent-mark{position:absolute;left:50%;transform:translateX(-50%);top:-.75em;font-size:.75em;line-height:1}

.zl-bold{font-weight:700}
.zl-blackboard{font-family:'STIX Two Math','Cambria Math',serif}
.zl-script{font-family:'STIX Two Math','Cambria Math',serif;font-style:italic}

.zl-eqgroup{display:inline-grid;gap:.4em 0;vertical-align:middle}
.zl-eqgroup-row{display:flex;align-items:center;gap:.3em}

.zl-math-number{color:var(--text-secondary,#9ca3af);font-family:var(--font-sans,system-ui,sans-serif);font-size:.85em;margin-left:.6em}
.zl-math-label-anchor{position:relative}
.zl-math-block-wrap{position:relative}
.zl-math-title{font-size:.82em;color:var(--text-secondary,#9ca3af);text-align:center;margin-bottom:.3em;font-family:var(--font-sans,system-ui,sans-serif)}
.zl-math-ref{color:var(--primary,#5b9dfa);text-decoration:none;font-variant-numeric:tabular-nums}
.zl-math-ref:hover{text-decoration:underline}
.zl-math-ref-broken{color:#ef4444;border-bottom:1px dashed #ef4444;cursor:help}

@media (max-width: 640px){
  .zl-math-display{font-size:.9em}
}
`.trim();

// ─── Escaping ─────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Public entry point ───────────────────────────────────────────────────────

/**
 * Render a math AST node tree to an HTML string.
 * @param {object} node   Any math-ast.js node (or the Equation/EquationGroup root)
 * @returns {string}
 */
export function renderMathHTML(node) {
  return render(node);
}

/**
 * Render the visible label for accessibility (aria-label) — a rough plain
 * text approximation of the expression, e.g. "F equals m a".
 * @param {object} node
 * @returns {string}
 */
export function mathToPlainText(node) {
  return toText(node).trim().replace(/\s+/g, ' ');
}

/** Check whether any math_block / math_inline nodes exist in the document tree. */
export function hasMathNodes(nodes) {
  if (!nodes?.length) return false;
  for (const n of nodes) {
    if (!n) continue;
    if (n.type === 'math_block' || n.type === 'math_inline') return true;
    if (hasMathNodes(n.children)) return true;
    if (hasMathNodes(n.items))    return true;
    if (hasMathNodes(n.tabs))     return true;
    if (Array.isArray(n.head)) for (const row of n.head) if (hasMathNodes(row.cells)) return true;
    if (Array.isArray(n.rows) && n.rows[0]?.cells) for (const row of n.rows) if (hasMathNodes(row.cells)) return true;
  }
  return false;
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────

function render(n) {
  if (!n) return '';
  switch (n.type) {
    case 'Equation':        return n.children.map(render).join('');
    case 'EquationGroup':    return renderEquationGroup(n);
    case 'Number':          return `<span class="zl-mn">${esc(n.value)}</span>`;
    case 'Identifier':      return `<span class="zl-mi">${esc(n.name)}</span>`;
    case 'Symbol':           return renderSymbol(n);
    case 'Operator':        return renderOperator(n);
    case 'Text':             return `<span class="zl-mtext">${esc(n.text)}</span>`;
    case 'Space':            return `<span class="zl-mspace" style="width:${esc(n.width)}">&nbsp;</span>`;
    case 'MathError':       return `<span class="zl-merror" title="${esc(n.message)}">${esc(n.raw || '?')}</span>`;
    case 'Sequence':        return n.children.map(render).join('');
    case 'UnaryExpression': return renderUnary(n);
    case 'BinaryExpression': return renderBinary(n);
    case 'Fraction':        return renderFraction(n);
    case 'Root':             return renderRoot(n);
    case 'Power':            return renderPow(n);
    case 'Subscript':       return renderSub(n);
    case 'SubSup':           return renderSubSup(n);
    case 'Delim':             return renderDelim(n);
    case 'Over':              return renderOver(n);
    case 'Under':             return renderUnder(n);
    case 'Summation':       return renderBigOp(n, 'Summation');
    case 'Product':          return renderBigOp(n, 'Product');
    case 'Integral':         return renderBigOp(n, 'Integral');
    case 'Limit':             return renderLimit(n);
    case 'FunctionCall':    return renderFunctionCall(n);
    case 'Matrix':            return renderMatrix(n);
    case 'Vector':            return `<span class="zl-vec">${render(n.children[0])}</span>`;
    case 'Accent':            return renderAccent(n);
    case 'Bold':              return `<span class="zl-bold">${render(n.children[0])}</span>`;
    case 'Blackboard':      return `<span class="zl-blackboard">${esc(n.char)}</span>`;
    case 'Script':          return `<span class="zl-script">${esc(n.char)}</span>`;
    default:                  return '';
  }
}

function renderSymbol(n) {
  const cls = n.category === 'greek' ? 'zl-mi' : 'zl-msymbol';
  return `<span class="${cls}" data-cmd="${esc(n.command)}">${esc(n.unicode)}</span>`;
}

function renderOperator(n) {
  const tight = ['(', ')', '[', ']', '{', '}', ',', '|'].includes(n.op);
  return `<span class="zl-mo${tight ? ' zl-mo-tight' : ''}">${esc(n.op)}</span>`;
}

function renderUnary(n) {
  return `<span class="zl-mrow"><span class="zl-mo zl-mo-tight">${esc(n.op)}</span>${render(n.children[0])}</span>`;
}

function renderBinary(n) {
  const [l, r] = n.children;
  const opHtml = n.op == null ? '' : `<span class="zl-mo">${esc(n.op)}</span>`;
  return `<span class="zl-mrow">${render(l)}${opHtml}${render(r)}</span>`;
}

function renderFraction(n) {
  const [num, den] = n.children;
  return `<span class="zl-frac"><span class="zl-frac-num">${render(num)}</span><span class="zl-frac-den">${render(den)}</span></span>`;
}

function renderRoot(n) {
  const idx = n.index ? `<sup class="zl-sqrt-idx">${render(n.index)}</sup>` : '';
  return `<span class="zl-sqrt">${idx}<span class="zl-sqrt-sign">\u221A</span><span class="zl-sqrt-body">${render(n.children[0])}</span></span>`;
}

function renderPow(n) {
  const [base, exp] = n.children;
  return `<span class="zl-pow-wrap">${render(base)}<sup class="zl-sup">${render(exp)}</sup></span>`;
}

function renderSub(n) {
  const [base, sub] = n.children;
  return `<span class="zl-sub-wrap">${render(base)}<sub class="zl-sub">${render(sub)}</sub></span>`;
}

function renderSubSup(n) {
  const [base, sub, sup] = n.children;
  return `<span class="zl-subsup-wrap">${render(base)}<span class="zl-subsup-stack"><span class="zl-subsup-sup">${render(sup)}</span><span class="zl-subsup-sub">${render(sub)}</span></span></span>`;
}

function renderDelim(n) {
  const cls = n.stretchy === false ? 'zl-delim' : 'zl-delim zl-delim-stretchy';
  const open  = n.open  != null ? `<span class="zl-delim-open">${esc(n.open)}</span>`  : '';
  const close = n.close != null ? `<span class="zl-delim-close">${esc(n.close)}</span>` : '';
  return `<span class="${cls}">${open}${render(n.children[0])}${close}</span>`;
}

function renderOver(n) {
  if (n.kind === 'overline') return `<span class="zl-over"><span class="zl-overline-body">${render(n.children[0])}</span></span>`;
  return `<span class="zl-over"><span class="zl-over-mark">\u23DE</span><span class="zl-over-body">${render(n.children[0])}</span></span>`;
}

function renderUnder(n) {
  if (n.kind === 'underline') return `<span class="zl-under"><span class="zl-underline-body">${render(n.children[0])}</span></span>`;
  return `<span class="zl-under"><span class="zl-under-body">${render(n.children[0])}</span><span class="zl-under-mark">\u23DF</span></span>`;
}

function renderBigOp(n, label) {
  const [lo, hi] = n.children;
  const sup = hi ? `<span class="zl-bigop-sup">${render(hi)}</span>` : '';
  const sub = lo ? `<span class="zl-bigop-sub">${render(lo)}</span>` : '';
  return `<span class="zl-bigop" aria-label="${label}">${sup}<span class="zl-bigop-glyph">${esc(n.symbol)}</span>${sub}</span>`;
}

function renderLimit(n) {
  const under = n.children[0] ? `<span class="zl-limit-under">${render(n.children[0])}</span>` : '';
  return `<span class="zl-limit"><span class="zl-limit-name">${esc(n.fnName)}</span>${under}</span>`;
}

function renderFunctionCall(n) {
  const arg = n.children[0] ? render(n.children[0]) : '';
  return `<span class="zl-mrow"><span class="zl-fn">${esc(n.name)}</span>${arg}</span>`;
}

function renderAccent(n) {
  const marks = { hat:'\u02C6', dot:'\u02D9', ddot:'\u00A8', tilde:'\u02DC', bar:'\u00AF' };
  const mark = marks[n.kind] ?? '\u02C6';
  return `<span class="zl-accent"><span class="zl-accent-mark">${mark}</span>${render(n.children[0])}</span>`;
}

function renderMatrix(n) {
  const cols = Math.max(1, ...n.children.map(r => r.children.length));
  const [openD, closeD] = MATRIX_DELIMS[n.env] ?? [null, null];
  const open  = openD  ? `<span class="zl-matrix-delim-open">${esc(openD)}</span>`  : '';
  const close = closeD ? `<span class="zl-matrix-delim-close">${esc(closeD)}</span>` : '';
  const cellsHtml = n.children.map(row =>
    row.children.map(cell => `<span class="zl-matrix-cell">${render(cell.children[0])}</span>`).join('')
  ).join('');
  const casesCls = n.env === 'cases' ? ' zl-matrix-cases' : '';
  return `${open}<span class="zl-matrix${casesCls}" style="grid-template-columns:repeat(${cols},auto)">${cellsHtml}</span>${close}`;
}

function renderEquationGroup(n) {
  const rows = n.children.map(eq => `<div class="zl-eqgroup-row">${render(eq)}</div>`).join('');
  return `<div class="zl-eqgroup">${rows}</div>`;
}

// ─── Plain-text extraction (for aria-label) ────────────────────────────────────

function toText(n) {
  if (!n) return '';
  switch (n.type) {
    case 'Equation': case 'EquationGroup': case 'Sequence':
      return n.children.map(toText).join(' ');
    case 'Number': return n.value;
    case 'Identifier': return n.name;
    case 'Symbol': return n.command;
    case 'Operator': return n.op;
    case 'Text': return n.text;
    case 'UnaryExpression': return `${n.op}${toText(n.children[0])}`;
    case 'BinaryExpression': return `${toText(n.children[0])} ${n.op ?? ''} ${toText(n.children[1])}`;
    case 'Fraction': return `${toText(n.children[0])} over ${toText(n.children[1])}`;
    case 'Root': return n.index ? `${toText(n.index)}th root of ${toText(n.children[0])}` : `square root of ${toText(n.children[0])}`;
    case 'Power': return `${toText(n.children[0])} to the power ${toText(n.children[1])}`;
    case 'Subscript': return `${toText(n.children[0])} sub ${toText(n.children[1])}`;
    case 'SubSup': return `${toText(n.children[0])} sub ${toText(n.children[1])} to the power ${toText(n.children[2])}`;
    case 'Delim': return `${n.open ?? ''} ${toText(n.children[0])} ${n.close ?? ''}`;
    case 'Summation': return `sum ${n.children[0] ? 'from ' + toText(n.children[0]) : ''} ${n.children[1] ? 'to ' + toText(n.children[1]) : ''}`;
    case 'Product': return `product ${n.children[0] ? 'from ' + toText(n.children[0]) : ''} ${n.children[1] ? 'to ' + toText(n.children[1]) : ''}`;
    case 'Integral': return `integral ${n.children[0] ? 'from ' + toText(n.children[0]) : ''} ${n.children[1] ? 'to ' + toText(n.children[1]) : ''}`;
    case 'Limit': return `${n.fnName} ${n.children[0] ? 'as ' + toText(n.children[0]) : ''}`;
    case 'FunctionCall': return `${n.name} of ${n.children[0] ? toText(n.children[0]) : ''}`;
    case 'Matrix': return `matrix`;
    case 'Vector': return `vector ${toText(n.children[0])}`;
    case 'Accent': return toText(n.children[0]);
    case 'Bold': return toText(n.children[0]);
    case 'Blackboard': return n.char;
    case 'Script': return n.char;
    case 'MathError': return '';
    default: return '';
  }
}
