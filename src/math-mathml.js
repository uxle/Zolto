/**
 * Zolto Math MathML Renderer — Phase 4
 *
 * Produces semantic MathML from the same math AST consumed by
 * math-renderer.js. This is what makes equations natively accessible:
 * browsers with MathML support (Firefox, Safari) expose it directly to
 * their accessibility tree, and screen readers announce it correctly
 * without any extra ARIA bookkeeping.
 *
 * Rendered as a visually-hidden sibling of the HTML version — see
 * renderMathBlock()/renderMathInline() in renderer.js, which combines
 * both outputs (visual HTML + hidden semantic MathML) for every equation.
 *
 * Independent from math-parser.js and math-renderer.js — only consumes
 * the AST shape contract.
 */

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Public entry point ───────────────────────────────────────────────────────

/**
 * @param {object} node   Equation / EquationGroup root (or any sub-node)
 * @param {'inline'|'block'} display
 * @returns {string} A complete `<math>…</math>` element.
 */
export function renderMathML(node, display = 'inline') {
  const inner = mml(node);
  return `<math xmlns="http://www.w3.org/1998/Math/MathML" display="${display}">${inner}</math>`;
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────

function mml(n) {
  if (!n) return '';
  switch (n.type) {
    case 'Equation': case 'EquationGroup':
      return `<mrow>${n.children.map(mml).join('')}</mrow>`;
    case 'Number':          return `<mn>${esc(n.value)}</mn>`;
    case 'Identifier':      return `<mi>${esc(n.name)}</mi>`;
    case 'Symbol':           return mmlSymbol(n);
    case 'Operator':        return `<mo>${esc(n.op)}</mo>`;
    case 'Text':             return `<mtext>${esc(n.text)}</mtext>`;
    case 'Space':             return `<mspace width="${esc(n.width)}"/>`;
    case 'MathError':       return `<merror><mtext>${esc(n.message)}</mtext></merror>`;
    case 'Sequence':        return `<mrow>${n.children.map(mml).join('')}</mrow>`;
    case 'UnaryExpression': return `<mrow><mo>${esc(n.op)}</mo>${mml(n.children[0])}</mrow>`;
    case 'BinaryExpression': return mmlBinary(n);
    case 'Fraction':        return `<mfrac>${mml(n.children[0])}${mml(n.children[1])}</mfrac>`;
    case 'Root':              return n.index
      ? `<mroot>${mml(n.children[0])}${mml(n.index)}</mroot>`
      : `<msqrt>${mml(n.children[0])}</msqrt>`;
    case 'Power':             return `<msup>${mml(n.children[0])}${mml(n.children[1])}</msup>`;
    case 'Subscript':        return `<msub>${mml(n.children[0])}${mml(n.children[1])}</msub>`;
    case 'SubSup':            return `<msubsup>${mml(n.children[0])}${mml(n.children[1])}${mml(n.children[2])}</msubsup>`;
    case 'Delim':             return mmlDelim(n);
    case 'Over':              return `<mover>${mml(n.children[0])}<mo>${n.kind === 'overline' ? '\u2015' : '\u23DE'}</mo></mover>`;
    case 'Under':             return `<munder>${mml(n.children[0])}<mo>${n.kind === 'underline' ? '\u2015' : '\u23DF'}</mo></munder>`;
    case 'Summation':        return mmlBigOp(n, '\u2211');
    case 'Product':           return mmlBigOp(n, '\u220F');
    case 'Integral':          return mmlBigOp(n, n.symbol);
    case 'Limit':              return mmlLimit(n);
    case 'FunctionCall':     return mmlFunctionCall(n);
    case 'Matrix':             return mmlMatrix(n);
    case 'Vector':             return `<mover>${mml(n.children[0])}<mo>\u2192</mo></mover>`;
    case 'Accent':             return mmlAccent(n);
    case 'Bold':               return `<mstyle mathvariant="bold">${mml(n.children[0])}</mstyle>`;
    case 'Blackboard':       return `<mi mathvariant="double-struck">${esc(n.char)}</mi>`;
    case 'Script':           return `<mi mathvariant="script">${esc(n.char)}</mi>`;
    default:                   return '';
  }
}

function mmlSymbol(n) {
  const tag = n.category === 'greek' ? 'mi' : 'mo';
  return `<${tag}>${esc(n.unicode)}</${tag}>`;
}

function mmlBinary(n) {
  const [l, r] = n.children;
  const opMml = n.op == null ? '' : `<mo>${esc(n.op)}</mo>`;
  return `<mrow>${mml(l)}${opMml}${mml(r)}</mrow>`;
}

function mmlDelim(n) {
  const open  = n.open  != null ? esc(n.open)  : '';
  const close = n.close != null ? esc(n.close) : '';
  return `<mrow><mo>${open}</mo>${mml(n.children[0])}<mo>${close}</mo></mrow>`;
}

function mmlBigOp(n, defaultSymbol) {
  const [lo, hi] = n.children;
  const glyph = `<mo>${esc(n.symbol ?? defaultSymbol)}</mo>`;
  if (lo && hi) return `<munderover>${glyph}${mml(lo)}${mml(hi)}</munderover>`;
  if (lo)       return `<munder>${glyph}${mml(lo)}</munder>`;
  if (hi)       return `<mover>${glyph}${mml(hi)}</mover>`;
  return glyph;
}

function mmlLimit(n) {
  const name = `<mi>${esc(n.fnName)}</mi>`;
  const under = n.children[0];
  return under ? `<munder>${name}${mml(under)}</munder>` : name;
}

function mmlFunctionCall(n) {
  const arg = n.children[0] ? mml(n.children[0]) : '';
  return `<mrow><mi>${esc(n.name)}</mi><mo>\u2061</mo>${arg}</mrow>`; // U+2061 = invisible function-apply
}

function mmlAccent(n) {
  const marks = { hat:'\u005E', dot:'\u02D9', ddot:'\u00A8', tilde:'\u02DC', bar:'\u00AF' };
  const mark = marks[n.kind] ?? '\u005E';
  return `<mover>${mml(n.children[0])}<mo>${mark}</mo></mover>`;
}

function mmlMatrix(n) {
  const rows = n.children.map(row =>
    `<mtr>${row.children.map(cell => `<mtd>${mml(cell.children[0])}</mtd>`).join('')}</mtr>`
  ).join('');
  const table = `<mtable>${rows}</mtable>`;
  if (n.env === 'cases') return `<mrow><mo>{</mo>${table}</mrow>`;
  const delims = { pmatrix:['(',')'], bmatrix:['[',']'], vmatrix:['|','|'], Vmatrix:['\u2016','\u2016'], Bmatrix:['{','}'] };
  const [o, c] = delims[n.env] ?? [null, null];
  if (!o) return table;
  return `<mrow><mo>${o}</mo>${table}<mo>${c}</mo></mrow>`;
}
