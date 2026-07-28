/**
 * Zolto Directive Parser — Phase 3
 *
 * Converts DIRECTIVE tokens from the lexer into typed AST nodes.
 * Requires a `ctx.reparse(src)` function (injected by parser.js) to
 * recursively parse body content without creating circular imports.
 */

import * as AST from './ast.js';
import { parseAttrStr, extractChildren } from './directive-lexer.js';

// ─── Public entry point ───────────────────────────────────────────────────────

/**
 * @param {{ name:string, attrStr:string, body:string }} tok
 * @param {{ reparse(src:string): Node[], refs: Map, variables: Map }} ctx
 * @returns {ASTNode|null}
 */
export function parseDirective(tok, ctx) {
  const attrs = parseAttrStr(tok.attrStr);
  switch (tok.name) {
    case 'embed':      return _embed(tok, attrs, ctx);
    case 'collapse':   return _collapse(tok, attrs, ctx);
    case 'tabs':       return _tabs(tok, attrs, ctx);
    case 'tab':        return _tab(tok, attrs, ctx);
    case 'card':       return _card(tok, attrs, ctx);
    case 'card-group': return _cardGroup(tok, attrs, ctx);
    case 'steps':      return _steps(tok, attrs, ctx);
    case 'step':       return _step(tok, attrs, ctx);
    case 'columns':    return _columns(tok, attrs, ctx);
    case 'column':     return _column(tok, attrs, ctx);
    case 'badge':      return _badge(tok, attrs, ctx);
    case 'tag':        return _tag(tok, attrs, ctx);
    case 'alert':      return _alert(tok, attrs, ctx);
    case 'timeline':   return _timeline(tok, attrs, ctx);
    case 'event':      return _event(tok, attrs, ctx);
    case 'progress':   return _progress(tok, attrs, ctx);
    case 'avatar':     return _avatar(tok, attrs, ctx);
    case 'icon':       return _icon(tok, attrs, ctx);
    default:
      if (ctx && ctx.registry && ctx.registry.directives) {
        const customNode = ctx.registry.directives.parseCustomDirective(tok, attrs, ctx);
        if (customNode) return customNode;
      }
      return null;
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function reparse(body, ctx) {
  if (!body || !body.trim()) return [];
  return ctx.reparse(body);
}

// ─── Individual directive parsers ─────────────────────────────────────────────

function _embed(tok, a, ctx) {
  const embedType = a._first || String(a.type || 'image');
  const caption   = a.caption ? String(a.caption) : (tok.body.trim() || null);
  return AST.embed(embedType, {
    src:     a.src ? String(a.src) : null,
    title:   a.title ? String(a.title) : null,
    alt:     a.alt   ? String(a.alt) : null,
    caption,
    width:   a.width  ? String(a.width) : null,
    height:  a.height ? String(a.height) : null,
    lazy:    a.lazy !== false,
  });
}

function _collapse(tok, a, ctx) {
  const title = a.title ? String(a.title) : (a._first || 'Details');
  return AST.collapse(title, reparse(tok.body, ctx), { open: !!a.open });
}

function _tabs(tok, a, ctx) {
  const rawTabs = extractChildren(tok.body, 'tab');
  const items = rawTabs.map(({ attrStr, body }) => {
    const ta = parseAttrStr(attrStr);
    const label = ta.label ? String(ta.label) : (ta._first || 'Tab');
    return AST.tab(label, reparse(body, ctx), { icon: ta.icon ? String(ta.icon) : null });
  });
  return AST.tabs(items, { active: Number(a.active ?? 0) });
}

function _tab(tok, a, ctx) {
  const label = a.label ? String(a.label) : (a._first || 'Tab');
  return AST.tab(label, reparse(tok.body, ctx), { icon: a.icon ? String(a.icon) : null });
}

function _card(tok, a, ctx) {
  return AST.card({
    variant:     String(a._first || a.variant || 'default'),
    title:       a.title       ? String(a.title)       : null,
    icon:        a.icon        ? String(a.icon)        : null,
    description: (a.description || a.desc) ? String(a.description || a.desc) : null,
    href:        a.href        ? String(a.href)        : null,
    img:         (a.img || a.image) ? String(a.img || a.image) : null,
    children:    reparse(tok.body, ctx),
  });
}

function _cardGroup(tok, a, ctx) {
  const rawCards = extractChildren(tok.body, 'card');
  const children = rawCards.map(({ attrStr, body }) => {
    const ca = parseAttrStr(attrStr);
    return AST.card({
      variant:     String(ca._first || ca.variant || 'default'),
      title:       ca.title ? String(ca.title) : null,
      icon:        ca.icon  ? String(ca.icon)  : null,
      description: (ca.description || ca.desc) ? String(ca.description || ca.desc) : null,
      href:        ca.href  ? String(ca.href)  : null,
      img:         (ca.img || ca.image) ? String(ca.img || ca.image) : null,
      children:    reparse(body, ctx),
    });
  });
  return AST.cardGroup(children, { cols: Number(a.cols ?? 3) });
}

function _steps(tok, a, ctx) {
  const rawSteps = extractChildren(tok.body, 'step');
  const children = rawSteps.map(({ attrStr, body }) => {
    const sa = parseAttrStr(attrStr);
    const title = sa.title ? String(sa.title) : (sa._first || 'Step');
    return AST.step(title, reparse(body, ctx), { icon: sa.icon ? String(sa.icon) : null });
  });
  return AST.steps(children);
}

function _step(tok, a, ctx) {
  const title = a.title ? String(a.title) : (a._first || 'Step');
  return AST.step(title, reparse(tok.body, ctx), { icon: a.icon ? String(a.icon) : null });
}

function _columns(tok, a, ctx) {
  const rawCols = extractChildren(tok.body, 'column');
  const children = rawCols.map(({ attrStr, body }) => {
    const ca = parseAttrStr(attrStr);
    return AST.column(reparse(body, ctx), { width: ca.width ? String(ca.width) : null });
  });
  return AST.columns(children, { gap: a.gap ? String(a.gap) : null });
}

function _column(tok, a, ctx) {
  return AST.column(reparse(tok.body, ctx), { width: a.width ? String(a.width) : null });
}

function _badge(tok, a, ctx) {
  return AST.badge(tok.body.trim(), {
    variant: String(a._first || a.variant || 'neutral'),
    icon:    a.icon ? String(a.icon) : null,
    outline: !!a.outline,
    pill:    !!a.pill,
  });
}

function _tag(tok, a, ctx) {
  return AST.tag(tok.body.trim(), {
    color: a.color ? String(a.color) : (a._first || null),
    icon:  a.icon  ? String(a.icon)  : null,
    href:  a.href  ? String(a.href)  : null,
  });
}

function _alert(tok, a, ctx) {
  const alertType = String(a._first || a.type || 'info');
  return AST.alert(alertType, reparse(tok.body, ctx), {
    title:       a.title ? String(a.title) : null,
    icon:        a.icon  ? String(a.icon)  : null,
    dismissible: !!a.dismissible,
  });
}

function _timeline(tok, a, ctx) {
  const rawEvents = extractChildren(tok.body, 'event');
  const children  = rawEvents.map(({ attrStr, body }) => {
    const ea = parseAttrStr(attrStr);
    const title = ea.title ? String(ea.title) : (ea._first || '');
    return AST.timelineEvent(title, reparse(body, ctx), {
      date: ea.date ? String(ea.date) : null,
      icon: ea.icon ? String(ea.icon) : null,
    });
  });
  return AST.timeline(children);
}

function _event(tok, a, ctx) {
  const title = a.title ? String(a.title) : (a._first || '');
  return AST.timelineEvent(title, reparse(tok.body, ctx), {
    date: a.date ? String(a.date) : null,
    icon: a.icon ? String(a.icon) : null,
  });
}

function _progress(tok, a, ctx) {
  return AST.progress(Number(a.value ?? 0), {
    max:         Number(a.max ?? 100),
    label:       a.label ? String(a.label) : null,
    color:       String(a.color || 'primary'),
    showPercent: !!a.showPercent,
  });
}

function _avatar(tok, a, ctx) {
  return AST.avatar({
    src:      a.src      ? String(a.src)      : null,
    initials: a.initials ? String(a.initials) : null,
    icon:     a.icon     ? String(a.icon)     : null,
    status:   a.status   ? String(a.status)   : null,
    size:     String(a.size || 'md'),
    alt:      a.alt      ? String(a.alt)      : null,
  });
}

function _icon(tok, a, ctx) {
  const name = String(a._first || a.name || tok.body.trim().split('\n')[0] || '');
  return AST.icon(name, {
    size:  a.size  ? Number(a.size)   : null,
    color: a.color ? String(a.color)  : null,
    label: a.label ? String(a.label)  : null,
  });
}
