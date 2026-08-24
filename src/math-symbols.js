/**
 * Zolto Math Symbols — Phase 4
 *
 * Central lookup tables mapping LaTeX-style command names to Unicode
 * characters and semantic categories. Used by both the math tokenizer
 * (to recognise `\command` names) and the renderers (to emit the right
 * glyph / MathML element).
 *
 * Categories affect rendering:
 *   'greek'     → italic in HTML, <mi> in MathML
 *   'op'        → binary operator spacing, <mo> in MathML
 *   'rel'       → relation spacing (wider), <mo> in MathML
 *   'arrow'     → <mo stretchy="false"> in MathML
 *   'logic'     → <mo> in MathML
 *   'set'       → <mi mathvariant="double-struck"> for blackboard bold
 *   'misc'      → <mi> or <mo> depending on glyph
 *   'delim'     → stretchy delimiter, <mo stretchy="true">
 */

// ─── Greek alphabet ───────────────────────────────────────────────────────────

export const GREEK = Object.freeze({
  alpha:'\u03B1', beta:'\u03B2', gamma:'\u03B3', delta:'\u03B4',
  epsilon:'\u03B5', varepsilon:'\u03B5', zeta:'\u03B6', eta:'\u03B7',
  theta:'\u03B8', vartheta:'\u03D1', iota:'\u03B9', kappa:'\u03BA',
  lambda:'\u03BB', mu:'\u03BC', nu:'\u03BD', xi:'\u03BE', pi:'\u03C0',
  varpi:'\u03D6', rho:'\u03C1', varrho:'\u03F1', sigma:'\u03C3',
  varsigma:'\u03C2', tau:'\u03C4', upsilon:'\u03C5', phi:'\u03C6',
  varphi:'\u03D5', chi:'\u03C7', psi:'\u03C8', omega:'\u03C9',
  Gamma:'\u0393', Delta:'\u0394', Theta:'\u0398', Lambda:'\u039B',
  Xi:'\u039E', Pi:'\u03A0', Sigma:'\u03A3', Upsilon:'\u03A5',
  Phi:'\u03A6', Psi:'\u03A8', Omega:'\u03A9',
  digamma:'\u03DD',
});

// ─── Binary / unary operators ─────────────────────────────────────────────────

export const OPERATORS = Object.freeze({
  pm:'\u00B1', mp:'\u2213', times:'\u00D7', div:'\u00F7', cdot:'\u22C5',
  ast:'\u2217', star:'\u22C6', circ:'\u2218', bullet:'\u2022',
  oplus:'\u2295', ominus:'\u2296', otimes:'\u2297', oslash:'\u2298',
  odot:'\u2299', cap:'\u2229', cup:'\u222A', uplus:'\u228E', sqcap:'\u2293',
  sqcup:'\u2294', vee:'\u2228', wedge:'\u2227', setminus:'\u2216',
  wr:'\u2240', diamond:'\u22C4', triangleleft:'\u25C1', triangleright:'\u25B7',
  amalg:'\u2A3F', dagger:'\u2020', ddagger:'\u2021', lhd:'\u22B2', rhd:'\u22B3',
  unlhd:'\u22B4', unrhd:'\u22B5',
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const RELATIONS = Object.freeze({
  leq:'\u2264', le:'\u2264', geq:'\u2265', ge:'\u2265', neq:'\u2260', ne:'\u2260',
  equiv:'\u2261', approx:'\u2248', cong:'\u2245', simeq:'\u2243', sim:'\u223C',
  propto:'\u221D', parallel:'\u2225', nparallel:'\u2226', perp:'\u22A5',
  asymp:'\u224D', doteq:'\u2250', prec:'\u227A', succ:'\u227B',
  preceq:'\u2AAF', succeq:'\u2AB0', subset:'\u2282', supset:'\u2283',
  subseteq:'\u2286', supseteq:'\u2287', subsetneq:'\u228A', supsetneq:'\u228B',
  in:'\u2208', notin:'\u2209', ni:'\u220B', bowtie:'\u22C8', models:'\u22A8',
  vdash:'\u22A2', dashv:'\u22A3', smile:'\u2323', frown:'\u2322',
  ll:'\u226A', gg:'\u226B', lesssim:'\u2272', gtrsim:'\u2273',
});

// ─── Arrows ───────────────────────────────────────────────────────────────────

export const ARROWS = Object.freeze({
  to:'\u2192', rightarrow:'\u2192', gets:'\u2190', leftarrow:'\u2190',
  leftrightarrow:'\u2194', Rightarrow:'\u21D2', Leftarrow:'\u21D0',
  Leftrightarrow:'\u21D4', mapsto:'\u21A6', longmapsto:'\u27FC',
  longrightarrow:'\u27F6', longleftarrow:'\u27F5',
  longleftrightarrow:'\u27F7', Longrightarrow:'\u27F9',
  Longleftarrow:'\u27F8', Longleftrightarrow:'\u27FA',
  uparrow:'\u2191', downarrow:'\u2193', updownarrow:'\u2195',
  Uparrow:'\u21D1', Downarrow:'\u21D3', Updownarrow:'\u21D5',
  nearrow:'\u2197', searrow:'\u2198', swarrow:'\u2199', nwarrow:'\u2196',
  hookrightarrow:'\u21AA', hookleftarrow:'\u21A9',
  rightharpoonup:'\u21C0', leftharpoonup:'\u21BC',
  rightleftharpoons:'\u21CC', leadsto:'\u21DD',
  twoheadrightarrow:'\u21A0', twoheadleftarrow:'\u219E',
});

// ─── Logic & set theory ────────────────────────────────────────────────────────

export const LOGIC = Object.freeze({
  land:'\u2227', lor:'\u2228', lnot:'\u00AC', neg:'\u00AC',
  forall:'\u2200', exists:'\u2203', nexists:'\u2204',
  therefore:'\u2234', because:'\u2235', top:'\u22A4', bot:'\u22A5',
  emptyset:'\u2205', varnothing:'\u2205', implies:'\u21D2', iff:'\u21D4',
});

export const SET_SYMBOLS = Object.freeze({
  mathbb: {
    R:'\u211D', N:'\u2115', Z:'\u2124', Q:'\u211A', C:'\u2102',
    P:'\u2119', H:'\u210D', F:'\u1D53D',
  },
});

// Calligraphic / script capitals (\mathcal{...}). Uses the dedicated
// Letterlike Symbols codepoints where Unicode defines one (B, E, F, H, I,
// L, M, R), and the Mathematical Script block otherwise.
export const MATHCAL = Object.freeze({
  A:'\u{1D49C}', B:'\u212C',    C:'\u{1D49E}', D:'\u{1D49F}',
  E:'\u2130',    F:'\u2131',    G:'\u{1D4A2}', H:'\u210B',
  I:'\u2110',    J:'\u{1D4A5}', K:'\u{1D4A6}', L:'\u2112',
  M:'\u2133',    N:'\u{1D4A9}', O:'\u{1D4AA}', P:'\u{1D4AB}',
  Q:'\u{1D4AC}', R:'\u211B',    S:'\u{1D4AE}', T:'\u{1D4AF}',
  U:'\u{1D4B0}', V:'\u{1D4B1}', W:'\u{1D4B2}', X:'\u{1D4B3}',
  Y:'\u{1D4B4}', Z:'\u{1D4B5}',
});

// ─── Geometry & misc ───────────────────────────────────────────────────────────

export const MISC = Object.freeze({
  infty:'\u221E', partial:'\u2202', nabla:'\u2207', hbar:'\u210F',
  ell:'\u2113', wp:'\u2118', Re:'\u211C', Im:'\u2111', aleph:'\u2135',
  prime:'\u2032', angle:'\u2220', triangle:'\u25B3', square:'\u25A1',
  degree:'\u00B0', imath:'\u0131', jmath:'\u0237', eth:'\u00F0',
  Bbbk:'\u1D55C', complement:'\u2201', surd:'\u221A', flat:'\u266D',
  natural:'\u266E', sharp:'\u266F', clubsuit:'\u2663', diamondsuit:'\u2666',
  heartsuit:'\u2665', spadesuit:'\u2660', cdots:'\u22EF', ldots:'\u2026',
  vdots:'\u22EE', ddots:'\u22F1', dots:'\u2026',
  cdotp:'\u00B7', colon:':', ',':'\u2009', ';':'\u2002', '!':'\u2009',
  quad:'\u2003', qquad:'\u2003\u2003',
});

// ─── Combined lookup: any symbol command → { char, category } ────────────────

const CATEGORY_MAPS = [
  [GREEK, 'greek'], [OPERATORS, 'op'], [RELATIONS, 'rel'],
  [ARROWS, 'arrow'], [LOGIC, 'logic'], [MISC, 'misc'],
];

const SYMBOL_LOOKUP = new Map();
for (const [table, cat] of CATEGORY_MAPS) {
  for (const [name, char] of Object.entries(table)) {
    SYMBOL_LOOKUP.set(name, { char, category: cat });
  }
}

/**
 * Look up a symbol command name (without the leading backslash).
 * @param {string} name
 * @returns {{ char: string, category: string } | null}
 */
export function lookupSymbol(name) {
  return SYMBOL_LOOKUP.get(name) ?? null;
}

// ─── Function names (rendered upright, not italic) ────────────────────────────

export const FUNCTION_NAMES = new Set([
  'sin','cos','tan','csc','sec','cot',
  'arcsin','arccos','arctan',
  'asin','acos','atan','atan2',
  'sinh','cosh','tanh','coth',
  'log','ln','lg','exp',
  'max','min','sup','inf','lim','limsup','liminf',
  'sqrt','max','min','floor','ceil','round','abs',
  'mod','gcd','lcm','det','dim','deg','arg','ker','hom',
  'Pr', 'sec', 'csc',
]);

/** Functions that take a `_{...}` subscript directly (lim, max, min, sup, inf). */
export const LIMIT_FUNCTIONS = new Set(['lim','limsup','liminf','max','min','sup','inf','Pr','gcd']);

// ─── Matrix / environment names ────────────────────────────────────────────────

export const MATRIX_ENVIRONMENTS = new Set([
  'matrix','pmatrix','bmatrix','vmatrix','Vmatrix','Bmatrix',
  'smallmatrix','cases','aligned','align','gather','array','split',
]);

/** Delimiter pairs for each matrix environment (null = no visible delimiter). */
export const MATRIX_DELIMS = Object.freeze({
  matrix:      [null, null],
  pmatrix:     ['(', ')'],
  bmatrix:     ['[', ']'],
  vmatrix:     ['|', '|'],
  Vmatrix:     ['\u2016', '\u2016'],
  Bmatrix:     ['{', '}'],
  smallmatrix: [null, null],
  cases:       ['{', null],
  aligned:     [null, null],
  align:       [null, null],
  gather:      [null, null],
  array:       [null, null],
  split:       [null, null],
});

// ─── Auto-sizing delimiter characters (\left \right) ──────────────────────────

export const DELIM_CHARS = Object.freeze({
  '(':'(', ')':')', '[':'[', ']':']', '\\{':'{', '\\}':'}',
  '|':'|', '\\|':'\u2016', '.':'', '/':'/', '\\backslash':'\\',
  '\\langle':'\u27E8', '\\rangle':'\u27E9',
  '\\lceil':'\u2308', '\\rceil':'\u2309',
  '\\lfloor':'\u230A', '\\rfloor':'\u230B',
  '\\uparrow':'\u2191', '\\downarrow':'\u2193', '\\updownarrow':'\u2195',
});
