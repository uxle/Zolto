/**
 * Zolto Validator — Phase 2
 *
 * Walks the Document AST and collects diagnostics using the Diagnostics class.
 *
 * Phase 1 checks preserved:
 *   • Undefined variable references
 *   • Undefined / duplicate footnote references
 *
 * Phase 2 additions:
 *   • Undefined reference links  (ref_link → no matching reference_def)
 *   • Duplicate reference def IDs
 *   • Duplicate heading IDs (explicit {#id} only)
 *   • Unknown admonition types
 *   • Missing image alt text (info)
 */

import { Diagnostics, Code } from './diagnostics.js';
import { ADMONITION_TYPES }  from './ast.js';
import { validateMath }      from './math-validator.js';
import { validateDiagram }   from './diagram/validator.js';
import { validateChart }     from './chart/validator.js';
import { validateVector }    from './vector/validator.js';
import { validateLayout }    from './layout/validator.js';

/**
 * @param {DocumentNode} doc
 * @returns {{ errors: string[], warnings: string[], diagnostics: Diagnostics }}
 */
export function validate(doc, options = {}) {
  const d = new Diagnostics();

  // ── Collect defined elements ─────────────────────────────────────────────
  const definedVars  = new Map(Object.entries(doc.metadata?.variables  ?? {}));
  const definedFns   = new Map();   // footnote id → definition node
  const definedRefs  = new Map();   // reference id → definition (Phase 2)
  const headingIds   = new Map();   // explicit id → first-seen

  // Walk top-level first to collect definitions (two-pass over block list)
  for (const node of doc.children ?? []) {
    collectDefs(node, definedFns, definedRefs, headingIds, d);
  }

  // Also pick up refs from metadata (parser puts them there too)
  if (doc.metadata?.references instanceof Map) {
    for (const [id, val] of doc.metadata.references) {
      if (!definedRefs.has(id)) definedRefs.set(id, val);
    }
  }

  // ── Phase 4: equation labels / @ref() / parser diagnostics ───────────────
  validateMath(doc, d);

  // ── Phase 5: diagram semantic validation ────────────────────────────────
  for (const node of doc.children ?? []) {
    if (node?.type === 'diagram') {
      const diagDiag = validateDiagram(node);
      for (const err of diagDiag.formatErrors()) d.error('E500', err);
      for (const warn of diagDiag.formatWarnings()) d.warn('W500', warn);
    }
    if (node?.type === 'chart') {
      const chartDiag = validateChart(node);
      for (const err of chartDiag.formatErrors()) d.error('E600', err);
      for (const warn of chartDiag.formatWarnings()) d.warn('W600', warn);
    }
    if (node?.type === 'vector') {
      const vecDiag = validateVector(node);
      for (const err of vecDiag.getErrors()) d.error('E700', err.message);
      for (const warn of vecDiag.getWarnings()) d.warn('W700', warn.message);
    }
  }

  // ── Phase 8: layout validation ──────────────────────────────────────────
  const layoutDiag = validateLayout(doc);
  for (const err of layoutDiag.errors) d.error(err.code, err.message);
  for (const warn of layoutDiag.warnings) d.warn(warn.code, warn.message);


  // ── Validate inline + block usage ────────────────────────────────────────
  for (const node of doc.children ?? []) {
    validateNode(node, { definedVars, definedFns, definedRefs }, d);
  }

  return {
    errors:      d.toErrorStrings(),
    warnings:    d.toWarningStrings(),
    diagnostics: d,
  };
}

// ─── Definition collectors ─────────────────────────────────────────────────────

function collectDefs(node, fns, refs, hIds, d) {
  if (!node) return;

  if (node.type === 'footnote_def') {
    if (fns.has(node.id)) {
      d.warn(Code.DUPLICATE_FOOTNOTE, `Duplicate footnote definition: [^${node.id}]`);
    } else {
      fns.set(node.id, node);
    }
  }

  if (node.type === 'reference_def') {               // Phase 2
    if (refs.has(node.id)) {
      d.warn(Code.DUPLICATE_REF_ID, `Duplicate reference definition: [${node.id}]`);
    } else {
      refs.set(node.id, { href: node.href, title: node.title });
    }
  }

  if (node.type === 'heading' && node.id) {          // Phase 2 explicit ID
    if (hIds.has(node.id)) {
      d.warn(Code.DUPLICATE_HEADING_ID, `Duplicate heading id: #${node.id}`);
    } else {
      hIds.set(node.id, node);
    }
  }

  // Recurse into block children
  for (const child of node.children ?? []) collectDefs(child, fns, refs, hIds, d);
  for (const child of node.items    ?? []) collectDefs(child, fns, refs, hIds, d);
  // Table rows
  if (node.type === 'table') {
    for (const row of [...(node.head ?? []), ...(node.rows ?? [])]) {
      if (row?.cells) for (const c of row.cells) collectDefs(c, fns, refs, hIds, d);
    }
  }
}

// ─── Validation walker ─────────────────────────────────────────────────────────

function validateNode(node, ctx, d) {
  if (!node) return;

  switch (node.type) {
    case 'admonition':      validateAdmonition(node, d);                   break; // Phase 2
    case 'image':
    case 'figure':          validateImage(node, d);                        break; // Phase 2 info
    case 'heading':         validateHeading(node, ctx, d);                 break;
    case 'table':           validateTable(node, ctx, d);                   break;

    case 'embed':
      if (!node.src) d.warn('W011', 'embed: missing src attribute');
      break;
    case 'progress': {
      const v = node.value ?? 0;
      if (v < 0 || v > (node.max ?? 100))
        d.warn('W012', `progress: value ${v} out of range [0, ${node.max ?? 100}]`);
      break;
    }
    case 'tabs':
      if (!node.tabs?.length) d.warn('W013', 'tabs: no tab children found');
      for (const t of node.tabs ?? []) validateNode(t, ctx, d);
      break;
    case 'steps':
      if (!node.children?.length) d.warn('W013', 'steps: no step children found');
      break;
    case 'timeline':
      if (!node.children?.length) d.warn('W013', 'timeline: no event children found');
      break;
    default: break;
  }

  // Recurse blocks
  for (const child of node.children ?? []) validateNode(child, ctx, d);
  for (const item  of node.items    ?? []) validateNode(item,  ctx, d);
  if (node.type === 'table') {
    for (const row of [...(node.head ?? []), ...(node.rows ?? [])]) {
      if (row?.cells) for (const c of row.cells) validateNode(c, ctx, d);
    }
  }

  // Validate inline content
  const inlineSource = node.children ?? node.cells ?? [];
  for (const il of inlineSource) {
    if (il?.type && isInline(il.type)) validateInlineNode(il, ctx, d);
  }
  // Direct inline arrays
  if (Array.isArray(node.children) && node.children.every(c => isInline(c?.type))) {
    for (const il of node.children) validateInlineNode(il, ctx, d);
  }
}

function isInline(type) {
  return [
    'text','bold','italic','inline_code','strikethrough',
    'link','image','linebreak','softbreak','variable_ref','footnote_ref',
    'superscript','subscript','highlight','kbd','html_entity','ref_link',
  ].includes(type);
}

function validateInlineNode(node, ctx, d) {
  if (!node) return;
  switch (node.type) {
    case 'variable_ref':
      if (!ctx.definedVars.has(node.name)) {
        d.warn(Code.UNDEFINED_VAR, `Undefined variable: {{${node.name}}}`);
      }
      break;

    case 'footnote_ref':
      if (!ctx.definedFns.has(node.id)) {
        d.warn(Code.UNDEFINED_FOOTNOTE, `Undefined footnote: [^${node.id}]`);
      }
      break;

    case 'ref_link':                                // Phase 2
      if (!ctx.definedRefs.has(node.id)) {
        d.warn(Code.BROKEN_REF_LINK, `Unresolved reference link: [${node.id}]`);
      }
      break;

    case 'image':
      if (!node.alt) d.info(Code.EMPTY_ALT, `Image missing alt text: ${node.src}`);
      break;

    default: break;
  }

  // Recurse inline children
  for (const child of node.children ?? []) validateInlineNode(child, ctx, d);
}

function validateAdmonition(node, d) {            // Phase 2
  if (!ADMONITION_TYPES.has(node.admonType)) {
    d.warn(Code.UNKNOWN_ADMON_TYPE,
      `Unknown admonition type: [${node.admonType}]. ` +
      `Valid types: ${[...ADMONITION_TYPES].join(', ')}.`
    );
  }
}

function validateImage(node, d) {                 // Phase 2
  const alt = node.alt ?? node.alt;
  if (!alt) d.info(Code.EMPTY_ALT, `Image missing alt text: ${node.src}`);
}

function validateHeading(node, ctx, d) {
  if (Array.isArray(node.children)) {
    for (const child of node.children) validateInlineNode(child, ctx, d);
  }
}

function validateTable(node, ctx, d) {
  if (!node.head?.length && !node.rows?.length) {
    d.warn(Code.MALFORMED_TABLE, 'Empty table');
  }
}
