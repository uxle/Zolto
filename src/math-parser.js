/**
 * Zolto Math Parser — Phase 4
 *
 * Recursive-descent + Pratt (precedence-climbing) parser that converts a
 * math token stream (from math-tokenizer.js) into a math AST (math-ast.js).
 *
 * Precedence (loosest → tightest):
 *   1. Relational   =  <  >  \leq  \geq  \neq  \in  \subset  …
 *   2. Additive     +  -
 *   3. Multiplicative / implicit juxtaposition   \cdot  \times  \div  *  /  "2x"
 *   4. Unary prefix -x  +x
 *   5. Postfix      x^n  x_i  x_i^n
 *   6. Primary      numbers, identifiers, symbols, \frac, \sqrt, \sum, …
 *
 * This parser NEVER throws on malformed input — every failure path emits
 * an `mError` node and the parser resynchronises at the next safe token,
 * matching the recoverable-diagnostics pattern used throughout Zolto.
 *
 * Independent from the Markdown parser: no imports from lexer.js / parser.js.
 */

import { tokenizeMath, MT } from './math-tokenizer.js';
import * as A from './math-ast.js';
import {
  lookupSymbol, FUNCTION_NAMES, LIMIT_FUNCTIONS,
  DELIM_CHARS, MATRIX_ENVIRONMENTS, MATRIX_DELIMS, SET_SYMBOLS,
} from './math-symbols.js';
import { installMatrixMethods } from './math-matrix.js';

// ─── Precedence tables ────────────────────────────────────────────────────────

const RELATIONAL_OPS = new Set([
  '=','<','>', 'leq','le','geq','ge','neq','ne','equiv','approx','cong',
  'simeq','sim','propto','parallel','perp','asymp','doteq','prec','succ',
  'preceq','succeq','subset','supset','subseteq','supseteq','in','notin',
  'ni','ll','gg','to','rightarrow','leftarrow','leftrightarrow',
  'Rightarrow','Leftarrow','Leftrightarrow','mapsto','implies','iff',
]);

const ADDITIVE_OPS   = new Set(['+','-','pm','mp','cup','oplus','ominus']);
const MULT_OPS        = new Set(['*','/','cdot','times','div','circ','otimes','oslash','odot']);

// A token can START a new primary (used to detect implicit multiplication).
// Note: '|' is deliberately excluded — it's inherently ambiguous as opener
// vs. closer, so it's only treated as an opener when parsePrimary dispatches
// on it directly at the start of a fresh atom, never as a signal to keep
// an implicit-multiplication chain going (which would wrongly swallow a
// closing '|' as though it opened a new group).
function startsPrimary(tok) {
  if (!tok) return false;
  if (tok.type === MT.NUMBER || tok.type === MT.IDENT || tok.type === MT.LBRACE) return true;
  if (tok.type === MT.OP && tok.value === '(') return true;
  if (tok.type === MT.COMMAND) {
    // A command starts a primary unless it's an operator/relation-only command
    // consumed by the Pratt loop instead (e.g. \cdot, \leq).
    const n = tok.value;
    return !(RELATIONAL_OPS.has(n) || MULT_OPS.has(n) || ADDITIVE_OPS.has(n) ||
             n === 'right' || n === 'end');
  }
  return false;
}

// ─── Parser class ─────────────────────────────────────────────────────────────

export class MathParser {
  /**
   * @param {MathToken[]} tokens
   * @param {{message:string}[]} lexErrors
   */
  constructor(tokens, lexErrors = []) {
    this.tokens = tokens;
    this.pos    = 0;
    this.errors = [...lexErrors];
  }

  // ── Token stream helpers ────────────────────────────────────────────────

  peek(offset = 0) { return this.tokens[this.pos + offset] ?? { type: MT.EOF, value: null }; }
  at(type, value = undefined) {
    const t = this.peek();
    return t.type === type && (value === undefined || t.value === value);
  }
  advance() { return this.tokens[this.pos++]; }
  expect(type, value = undefined) {
    if (this.at(type, value)) return this.advance();
    this.error(`Expected ${value ?? type}, got ${this.peek().type}:${JSON.stringify(this.peek().value)}`);
    return null;
  }
  error(message) { this.errors.push({ message }); }
  isEOF() { return this.at(MT.EOF); }

  // ── Entry point ─────────────────────────────────────────────────────────

  /**
   * Parse the full token stream into a single Equation root.
   * @returns {{ ast: object, errors: {message:string}[] }}
   */
  parseDocument() {
    const children = this.parseSequenceUntil(() => this.isEOF());
    return { ast: A.mEquation(children), errors: this.errors };
  }

  /**
   * Parse a flat run of top-level items until `stop()` returns true.
   * Used for: whole document, `{…}` groups, `\left … \right` interiors,
   * and single matrix cells (stopping at `&`, `\\`, or `\end`).
   * @param {() => boolean} stop
   * @returns {object[]}
   */
  parseSequenceUntil(stop) {
    const items = [];
    let guard = 0;
    while (!stop() && !this.isEOF()) {
      const before = this.pos;
      items.push(this.parseExpression(0));
      if (this.pos === before) { this.error('Parser stalled — skipping token'); this.advance(); }
      if (++guard > 20000) { this.error('Parser aborted — exceeded safety limit'); break; }
    }
    return items;
  }

  // ── Pratt precedence climbing ───────────────────────────────────────────

  /** @param {number} minPrec */
  parseExpression(minPrec) {
    let left = this.parseUnary();

    for (;;) {
      const tok = this.peek();
      const opName = tok.type === MT.COMMAND ? tok.value
                   : (tok.type === MT.OP ? tok.value : null);
      if (opName == null) break;

      let prec;
      if (RELATIONAL_OPS.has(opName)) prec = 1;
      else if (ADDITIVE_OPS.has(opName)) prec = 2;
      else break; // multiplicative is handled inside parseUnary's callee, not here

      if (prec < minPrec) break;
      this.advance();
      const opGlyph = this.resolveOperatorGlyph(opName);
      const right = this.parseExpression(prec + 1);
      left = A.mBinary(opGlyph, left, right);
    }
    return left;
  }

  /** Resolve an operator token name to its display glyph (symbol lookup or literal char). */
  resolveOperatorGlyph(name) {
    const sym = lookupSymbol(name);
    return sym ? sym.char : name;
  }

  // ── Unary → implicit-multiplication chain → postfix → primary ──────────

  parseUnary() {
    const tok = this.peek();
    if (tok.type === MT.OP && (tok.value === '-' || tok.value === '+')) {
      this.advance();
      return A.mUnary(tok.value, this.parseUnary());
    }
    return this.parseMulChain();
  }

  /** Multiplicative operators AND implicit juxtaposition share one left-assoc chain. */
  parseMulChain() {
    let left = this.parsePostfix();
    for (;;) {
      const tok = this.peek();
      if (tok.type === MT.COMMAND && MULT_OPS.has(tok.value)) {
        this.advance();
        const glyph = this.resolveOperatorGlyph(tok.value);
        left = A.mBinary(glyph, left, this.parsePostfix());
        continue;
      }
      if (tok.type === MT.OP && (tok.value === '*' || tok.value === '/')) {
        this.advance();
        left = A.mBinary(tok.value, left, this.parsePostfix());
        continue;
      }
      // Implicit multiplication: next token can start a new primary with no
      // operator between — e.g. "2x", "xy", "2\pi".
      if (startsPrimary(tok)) {
        left = A.mBinary(null, left, this.parsePostfix());
        continue;
      }
      break;
    }
    return left;
  }

  parsePostfix() {
    let atom = this.parsePrimary();

    let sub = null, sup = null;
    for (;;) {
      if (this.at(MT.UNDERSCORE) && sub === null) {
        this.advance();
        sub = this.parseSupSubArg();
      } else if (this.at(MT.CARET) && sup === null) {
        this.advance();
        sup = this.parseSupSubArg();
      } else break;
    }

    if (sub && sup) return A.mSubSup(atom, sub, sup);
    if (sub)        return A.mSubscript(atom, sub);
    if (sup)        return A.mPower(atom, sup);
    return atom;
  }

  /** The argument of `^` / `_` — a `{…}` group, or a single primary token. */
  parseSupSubArg() {
    if (this.at(MT.LBRACE)) return this.parseGroup();
    return this.parsePrimary();
  }

  // ── Primary dispatch ─────────────────────────────────────────────────────

  parsePrimary() {
    const tok = this.peek();

    switch (tok.type) {
      case MT.NUMBER: this.advance(); return A.mNumber(tok.value);
      case MT.IDENT:  this.advance(); return A.mIdentifier(tok.value);
      case MT.LBRACE: return this.parseGroup();
      case MT.LBRACKET: return this.parseBareDelim(MT.LBRACKET, MT.RBRACKET, '[', ']');
      case MT.RBRACKET: this.advance(); return A.mOperator(']');
      case MT.OP:
        if (tok.value === '(') return this.parseBareDelim(MT.OP, MT.OP, '(', ')');
        if (tok.value === '|') return this.parseBareDelim(MT.OP, MT.OP, '|', '|');
        this.advance(); return A.mOperator(tok.value);
      case MT.TEXT:   this.advance(); return A.mText(tok.value);
      case MT.COMMAND: return this.parseCommand();
      case MT.AMP:
      case MT.NEWLINE:
      case MT.RBRACE:
        // These are terminators the caller should have stopped on; if we
        // reach here it means an unexpected/unbalanced structure. Recover
        // by consuming it as a literal rather than looping forever.
        this.advance();
        this.error(`Unexpected token '${tok.value}'`);
        return A.mError(`Unexpected '${tok.value}'`, String(tok.value));
      default:
        this.advance();
        this.error(`Unexpected end of input or unknown token`);
        return A.mError('Unexpected token', '');
    }
  }

  /** `{ … }` — parses inner content, unwraps single-item groups. */
  parseGroup() {
    this.expect(MT.LBRACE);
    const items = this.parseSequenceUntil(() => this.at(MT.RBRACE) || this.isEOF());
    this.expect(MT.RBRACE);
    if (items.length === 0) return A.mSequence([]);
    if (items.length === 1) return items[0];
    return A.mSequence(items);
  }

  /**
   * Pairs a literal `(`, `[`, or `|` (typed without `\left`/`\right`) with its
   * matching closer, so `f(x)`, `[a, b]`, and `|x|` group correctly instead
   * of parsing as three unrelated atoms. Falls back to a literal Operator
   * atom when no matching closer exists at the current nesting level (e.g.
   * a lone `|` used as set-builder "such that" notation: `\{x | x > 0\}`).
   * Produces a non-stretchy Delim (`stretchy:false`) — visually distinct
   * from auto-sized `\left…\right` groups (`stretchy:true`).
   */
  parseBareDelim(openType, closeType, openVal, closeVal) {
    if (!this.hasMatchingCloser(openType, closeType, openVal, closeVal)) {
      const tok = this.advance();
      return A.mOperator(tok.value);
    }
    this.advance(); // consume opener
    const inner = this.parseSequenceUntil(() => this.isAtCloser(closeType, closeVal) || this.isEOF());
    if (this.isAtCloser(closeType, closeVal)) this.advance();
    else this.error(`Unmatched '${openVal}' — expected '${closeVal}'`);
    const content = inner.length === 1 ? inner[0] : A.mSequence(inner);
    return A.mDelim(content, openVal, closeVal, false);
  }

  isAtCloser(closeType, closeVal) {
    const t = this.peek();
    return t.type === closeType && t.value === closeVal;
  }

  /** Flat lookahead (no nesting depth tracking) for a matching closer before a hard boundary. */
  hasMatchingCloser(openType, closeType, openVal, closeVal) {
    let depth = 0;
    for (let k = this.pos + 1; k < this.tokens.length; k++) {
      const t = this.tokens[k];
      if (t.type === MT.EOF) return false;
      if (t.type === MT.RBRACE || t.type === MT.AMP || t.type === MT.NEWLINE) return false;
      if (openVal !== closeVal && t.type === openType && t.value === openVal) depth++;
      if (t.type === closeType && t.value === closeVal) {
        if (depth === 0) return true;
        depth--;
      }
    }
    return false;
  }

  // ── Command dispatch ─────────────────────────────────────────────────────

  parseCommand() {
    const tok = this.advance();
    const name = tok.value;

    // Escaped literal characters (\{ \} \$ \% \# \& \_ \, \; \: \! space)
    if (name.length === 1 && !/[a-zA-Z]/.test(name)) {
      if (name === ',' || name === ';' || name === ':' || name === '!' || name === ' ') {
        return A.mSpace(name === ',' ? '0.16em' : name === ';' ? '0.28em' : name === ':' ? '0.22em' : name === '!' ? '-0.16em' : '0.25em');
      }
      return A.mOperator(name);
    }

    // Symbol tables (Greek, operators, relations, arrows, logic, misc)
    const sym = lookupSymbol(name);
    if (sym) return A.mSymbol(name, sym.char, sym.category);

    switch (name) {
      case 'frac': case 'dfrac': case 'tfrac': {
        const num = this.parseGroup();
        const den = this.parseGroup();
        return A.mFraction(num, den);
      }
      case 'sqrt': {
        let index = null;
        if (this.at(MT.LBRACKET)) {
          this.advance();
          const items = this.parseSequenceUntil(() => this.at(MT.RBRACKET) || this.isEOF());
          this.expect(MT.RBRACKET);
          index = items.length === 1 ? items[0] : A.mSequence(items);
        }
        const radicand = this.parseGroup();
        return A.mRoot(radicand, index);
      }

      case 'sum': return this.parseBigOperator(A.mSummation, '\u2211');
      case 'coprod': return this.parseBigOperator(A.mSummation, '\u2210');
      case 'prod': return this.parseBigOperator(A.mProduct, '\u220F');
      case 'int': return this.parseBigOperator(A.mIntegral, '\u222B');
      case 'iint': return this.parseBigOperator(A.mIntegral, '\u222C');
      case 'iiint': return this.parseBigOperator(A.mIntegral, '\u222D');
      case 'oint': return this.parseBigOperator(A.mIntegral, '\u222E');

      case 'lim': case 'limsup': case 'liminf':
      case 'max': case 'min': case 'sup': case 'inf': case 'Pr': case 'gcd': {
        let under = null;
        if (this.at(MT.UNDERSCORE)) { this.advance(); under = this.parseSupSubArg(); }
        return A.mLimit(under, name);
      }

      case 'left': return this.parseLeftRight();
      case 'begin': return this.parseEnvironment();

      case 'vec': return A.mVector(this.parseGroup());
      case 'hat': case 'widehat': return A.mAccent(this.parseGroup(), 'hat');
      case 'dot': return A.mAccent(this.parseGroup(), 'dot');
      case 'ddot': return A.mAccent(this.parseGroup(), 'ddot');
      case 'tilde': case 'widetilde': return A.mAccent(this.parseGroup(), 'tilde');
      case 'bar': return A.mAccent(this.parseGroup(), 'bar');

      case 'overline': return A.mOver(this.parseGroup(), 'overline');
      case 'overbrace': return A.mOver(this.parseGroup(), 'overbrace');
      case 'underline': return A.mUnder(this.parseGroup(), 'underline');
      case 'underbrace': return A.mUnder(this.parseGroup(), 'underbrace');

      case 'mathbf': case 'boldsymbol': case 'bf': return A.mBold(this.parseGroup());

      case 'mathbb': {
        const inner = this.parseGroup();
        const ch = inner.type === 'Identifier' ? SET_SYMBOLS.mathbb[inner.name] : null;
        return ch ? A.mBlackboard(ch) : A.mBold(inner); // fallback: bold for unmapped letters
      }

      case 'text': case 'mathrm': case 'operatorname': {
        // Tokenizer already captured LBRACE TEXT RBRACE verbatim for these.
        this.expect(MT.LBRACE);
        const t = this.at(MT.TEXT) ? this.advance().value : '';
        this.expect(MT.RBRACE);
        return A.mText(t);
      }

      case 'quad': return A.mSpace('1em');
      case 'qquad': return A.mSpace('2em');

      default:
        if (FUNCTION_NAMES.has(name)) {
          const arg = startsPrimary(this.peek()) || this.at(MT.UNDERSCORE) ? this.parsePostfix() : null;
          return A.mFunctionCall(name, arg);
        }
        this.error(`Unknown command: \\${name}`);
        return A.mError(`Unknown command: \\${name}`, `\\${name}`);
    }
  }

  /** Shared logic for \sum \prod \int variants — optional _{lo} ^{hi} in either order. */
  parseBigOperator(factory, defaultSymbol) {
    let lo = null, hi = null;
    for (let i = 0; i < 2; i++) {
      if (this.at(MT.UNDERSCORE) && lo === null) { this.advance(); lo = this.parseSupSubArg(); }
      else if (this.at(MT.CARET) && hi === null) { this.advance(); hi = this.parseSupSubArg(); }
      else break;
    }
    return factory(lo, hi, defaultSymbol);
  }

  /** `\left DELIM … \right DELIM`. */
  parseLeftRight() {
    const openTok = this.readDelimToken();
    const inner = this.parseSequenceUntil(() => this.at(MT.COMMAND, 'right') || this.isEOF());
    if (this.at(MT.COMMAND, 'right')) this.advance();
    else this.error('Unclosed \\left — missing matching \\right');
    const closeTok = this.readDelimToken();
    const content = inner.length === 1 ? inner[0] : A.mSequence(inner);
    return A.mDelim(content, openTok, closeTok);
  }

  /** Reads one delimiter after \left / \right — a single OP char or a known command name. */
  readDelimToken() {
    const tok = this.peek();
    if (tok.type === MT.OP) { this.advance(); return DELIM_CHARS[tok.value] ?? tok.value; }
    if (tok.type === MT.COMMAND) {
      this.advance();
      const key = '\\' + tok.value;
      if (tok.value === '.') return null; // \left. → invisible delimiter
      return DELIM_CHARS[key] ?? DELIM_CHARS[tok.value] ?? tok.value;
    }
    if (tok.type === MT.LBRACE) { this.advance(); return '{'; }
    if (tok.type === MT.RBRACE) { this.advance(); return '}'; }
    this.error('Expected a delimiter after \\left/\\right');
    return null;
  }
}

// Install \begin{env}…\end{env} matrix/cases parsing as prototype methods,
// defined in math-matrix.js to keep this file under the line budget and to
// avoid a circular import (math-matrix.js never imports this module).
installMatrixMethods(MathParser, { MATRIX_ENVIRONMENTS, MATRIX_DELIMS, MT, A });

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse a math source string (already extracted from `$…$` or `@math…@/math`)
 * into a math AST.
 * @param {string} src
 * @returns {{ ast: object, errors: {message:string}[] }}
 */
export function parseMath(src) {
  const { tokens, errors } = tokenizeMath(src);
  const parser = new MathParser(tokens, errors);
  return parser.parseDocument();
}

/**
 * Parse `@math env=align … @/math` / `env=gather` block content — bare
 * `&`/`\\`-separated rows with NO surrounding `\begin{}\end{}` wrapper
 * (that wrapper form is still supported too, via the normal `parseMath`
 * path, since `\begin{align}…\end{align}` is handled by math-matrix.js).
 * Reuses the same row/cell-splitting logic as `\begin{env}` environments.
 * @param {string} src
 * @returns {{ equations: object[], errors: {message:string}[] }}
 */
export function parseMathRows(src) {
  const { tokens, errors } = tokenizeMath(src);
  const parser = new MathParser(tokens, errors);
  const rows = parser.parseMatrixRows('align');
  const equations = rows.map(row => A.mEquation(row.children.map(cell => cell.children[0])));
  return { equations, errors: parser.errors };
}
