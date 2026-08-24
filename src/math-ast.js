/**
 * Zolto Math AST Node Factory — Phase 4
 *
 * Every math node follows the same shape rules as the main Zolto AST
 * (src/ast.js): identical key order per type, `null` for absent optional
 * fields, `[]` for absent arrays — never omitted keys.
 *
 * Math nodes are distinct from — and never mixed into — the main document
 * AST's block/inline node set. They live only inside `MathInline.ast` /
 * `MathBlock.ast` (see src/ast.js mathInline / mathBlock factories).
 *
 * Node names follow the Phase 4 specification's required type list
 * (Number, Identifier, Operator, UnaryExpression, BinaryExpression,
 * Fraction, Root, Power, Subscript, Integral, Summation, Product, Limit,
 * Matrix, FunctionCall, Vector, Set, Piecewise, Equation, EquationGroup).
 *
 * Two concepts from that list are intentionally NOT separate node types:
 *   Set        — sets are compositional (Delim + relation/logic symbols
 *                 already in math-symbols.js), not a distinct structural shape.
 *   Piecewise  — implemented as Matrix{env:'cases'} since it IS the cases
 *                 environment structurally; renderers key off `env`.
 */

// ─── Leaves ───────────────────────────────────────────────────────────────────

/** Numeric literal, e.g. `3`, `3.14`. */
export function mNumber(value = '') { return { type: 'Number', value }; }

/** Single-letter variable, e.g. `x`, `y`. Rendered italic. */
export function mIdentifier(name = '') { return { type: 'Identifier', name }; }

/** Named symbol resolved from math-symbols.js, e.g. `\alpha` → α. */
export function mSymbol(command = '', unicode = '', category = 'misc') {
  return { type: 'Symbol', command, unicode, category };
}

/** Operator/relation/punctuation character used as a plain atom, e.g. `(`, `!`. */
export function mOperator(op = '') { return { type: 'Operator', op }; }

/** Roman/upright text from `\text{...}` / `\mathrm{...}` / `\operatorname{...}`. */
export function mText(text = '') { return { type: 'Text', text }; }

/** Explicit spacing command, e.g. `\quad`, `\,`. */
export function mSpace(width = '1em') { return { type: 'Space', width }; }

/** Parse error recovered inline — renders as a visible marker, never throws. */
export function mError(message = '', raw = '') { return { type: 'MathError', message, raw }; }

// ─── Expressions (Pratt-parser output) ────────────────────────────────────────

/** Prefix unary operator, e.g. `-x`, `+y`. */
export function mUnary(op = '-', operand) { return { type: 'UnaryExpression', op, children: [operand] }; }

/**
 * Binary operator or implicit multiplication.
 * `op = null` signals juxtaposition (e.g. `2x`, `xy`) — rendered with no
 * operator glyph and tight spacing.
 */
export function mBinary(op, left, right) { return { type: 'BinaryExpression', op, children: [left, right] }; }

// ─── Structural wrappers ──────────────────────────────────────────────────────

/** Flat sequence of sibling nodes produced when a `{…}` group holds more than one top-level item. */
export function mSequence(children = []) { return { type: 'Sequence', children }; }

// ─── Core constructs ──────────────────────────────────────────────────────────

/** `\frac{num}{den}`. */
export function mFraction(num, den) { return { type: 'Fraction', children: [num, den] }; }

/** `\sqrt{x}` (index=null) or `\sqrt[n]{x}` (index=node). */
export function mRoot(radicand, index = null) {
  return { type: 'Root', children: [radicand], index };
}

/** `x^{n}` — base and exponent. */
export function mPower(base, exp) { return { type: 'Power', children: [base, exp] }; }

/** `x_{i}` — base and subscript. */
export function mSubscript(base, sub) { return { type: 'Subscript', children: [base, sub] }; }

/** `x_{i}^{n}` — base, subscript, superscript combined for correct side-by-side layout. */
export function mSubSup(base, sub, sup) { return { type: 'SubSup', children: [base, sub, sup] }; }

/** `\left( … \right)` (open/close hold the resolved delimiter glyphs, may be null for `\left.`).
 *  `stretchy: false` marks bare `(x)` / `[a,b]` / `|x|` typed without \left\right —
 *  same shape, renderer just skips the auto-sizing CSS/MathML attribute. */
export function mDelim(inner, open = null, close = null, stretchy = true) {
  return { type: 'Delim', children: [inner], open, close, stretchy };
}

/** `\overline{x}` / `\overbrace{x}` — annotation drawn above content. */
export function mOver(inner, kind = 'overline') { return { type: 'Over', children: [inner], kind }; }

/** `\underline{x}` / `\underbrace{x}` — annotation drawn below content. */
export function mUnder(inner, kind = 'underline') { return { type: 'Under', children: [inner], kind }; }

// ─── Big operators — standalone atoms per real LaTeX semantics; whatever    ───
// ─── follows is a separate sibling in the enclosing Sequence/BinaryExpression ─

/** `\sum_{lo}^{hi}` — lo/hi may be null. Symbol defaults to ∑ but covers `\coprod` too. */
export function mSummation(lo = null, hi = null, symbol = '\u2211') {
  return { type: 'Summation', children: [lo, hi], symbol };
}

/** `\prod_{lo}^{hi}`. */
export function mProduct(lo = null, hi = null, symbol = '\u220F') {
  return { type: 'Product', children: [lo, hi], symbol };
}

/** `\int_{lo}^{hi}` (also covers `\iint` ∬, `\iiint` ∭, `\oint` ∮ via `symbol`). */
export function mIntegral(lo = null, hi = null, symbol = '\u222B') {
  return { type: 'Integral', children: [lo, hi], symbol };
}

/** `\lim_{x \to a}`, also used for `\max`/`\min`/`\sup`/`\inf` with a subscript condition. */
export function mLimit(under = null, fnName = 'lim') {
  return { type: 'Limit', children: [under], fnName };
}

// ─── Functions ────────────────────────────────────────────────────────────────

/** Named function application, e.g. `\sin x`, `\log_2 x`. */
export function mFunctionCall(name = '', arg = null, opts = {}) {
  return { type: 'FunctionCall', name, children: arg ? [arg] : [], sub: opts.sub ?? null };
}

// ─── Matrices & piecewise ───────────────────────────────────────────────────────

/** A single matrix/align row. */
export function mRow(cells = []) { return { type: 'Row', children: cells }; }

/** A single matrix/align cell (content between `&` separators). */
export function mCell(content) { return { type: 'Cell', children: [content] }; }

/**
 * Matrix / aligned block. `env: 'cases'` is the Piecewise-function form —
 * kept under the same node type since it shares the identical Row/Cell shape;
 * renderers dispatch on `env` to add the single brace and align columns.
 * @param {string} env    One of MATRIX_ENVIRONMENTS from math-symbols.js
 * @param {Node[]} rows   Array of Row nodes
 */
export function mMatrix(env = 'matrix', rows = []) {
  return { type: 'Matrix', env, children: rows };
}

// ─── Decorated variables ──────────────────────────────────────────────────────

/** `\vec{v}` — arrow-over vector notation. */
export function mVector(inner) { return { type: 'Vector', children: [inner] }; }

/** `\hat{x}` `\dot{x}` `\ddot{x}` `\tilde{x}` `\bar{x}` — accent diacritics. */
export function mAccent(inner, kind = 'hat') { return { type: 'Accent', children: [inner], kind }; }

/** `\mathbf{v}` / `\boldsymbol{v}` — bold variable/vector. */
export function mBold(inner) { return { type: 'Bold', children: [inner] }; }

/** `\mathbb{R}` — blackboard-bold set symbol (ℝ, ℕ, ℤ, ℚ, ℂ, …). */
export function mBlackboard(char = '') { return { type: 'Blackboard', char }; }

/** `\mathcal{L}` — calligraphic/script capital letter (𝓛, ℒ, …). */
export function mScript(char = '') { return { type: 'Script', char }; }

// ─── Top-level equation wrappers ───────────────────────────────────────────────
// Attached to the main document's MathBlock/MathInline nodes by parser.js.

/** A single parsed equation — the root of one `@math … @/math` block or `$…$` span. */
export function mEquation(children = []) { return { type: 'Equation', children }; }

/**
 * Multiple aligned/numbered equation lines, e.g. `env=align` or `env=gather`
 * with `\\`-separated lines. Each child is itself an Equation.
 */
export function mEquationGroup(env = 'align', children = []) {
  return { type: 'EquationGroup', env, children };
}

// ─── Type registry (renderer dispatch / validation) ────────────────────────────

export const MATH_NODE_TYPES = new Set([
  'Number','Identifier','Symbol','Operator','Text','Space','MathError',
  'UnaryExpression','BinaryExpression','Sequence',
  'Fraction','Root','Power','Subscript','SubSup','Delim','Over','Under',
  'Summation','Product','Integral','Limit','FunctionCall',
  'Row','Cell','Matrix','Vector','Accent','Bold','Blackboard','Script',
  'Equation','EquationGroup',
]);
