/**
 * Zolto HTML Renderer — Phase 4
 *
 * Pure function: render(ast, opts) → HTML string
 * No DOM access. No mutable module-level state.
 *
 * Phase 2 block additions:
 *   callout · admonition · figure · definition_list · reference_def (skip)
 *   Updated: code_block (title / line-numbers / highlights / diff / copy)
 *            table (caption / responsive wrapper)
 *
 * Phase 2 inline additions:
 *   superscript · subscript · highlight · kbd · html_entity · ref_link
 *
 * Phase 3 additions:
 *   Directive dispatch — see directive-renderer.js
 *
 * Phase 4 additions:
 *   math_block  → visual HTML (math-renderer.js) + hidden semantic MathML
 *                 (math-mathml.js) for screen readers, equation numbering,
 *                 label anchors
 *   math_inline → same combined HTML+MathML output, inline
 *   math_ref    → @ref(label) cross-reference link
 */

import { escapeHtml, escapeAttr, slugify, uniqueSlug } from './tokenizer.js';
import { renderDirective, PHASE3_CSS, hasP3Directives } from './directive-renderer.js';
import { PHASE3_NODE_TYPES, PHASE8_NODE_TYPES, PHASE9_NODE_TYPES } from './ast.js';
import { parseInline } from './inline-parser.js';
import { renderMathHTML, mathToPlainText, hasMathNodes, MATH_CSS } from './math-renderer.js';
import { renderMathML } from './math-mathml.js';
import { renderDiagram } from './diagram/renderer.js';
import { renderChart }   from './chart/renderer.js';
import { renderVector }  from './vector/renderer.js';
import { renderLayout, isLayoutNode, LAYOUT_BASE_CSS } from './layout/index.js';
import { renderComponent, isComponentNode } from './component/index.js';
import { renderInteractiveNode, hasInteractiveNodes } from './interactive/index.js';
import { INTERACTIVE_CSS } from './interactive/styles.js';
import { PHASE10_NODE_TYPES, PHASE11_NODE_TYPES, PHASE12_NODE_TYPES } from './ast.js';
import { renderAnimationNode, hasAnimationNodes } from './animation/index.js';
import { ANIMATION_CSS } from './animation/styles.js';
import { renderPluginNode } from './plugin/index.js';

// ─── Icon / title maps ────────────────────────────────────────────────────────

const ICON = {
  note:'📝',tip:'💡',warning:'⚠️',important:'❗',caution:'🔶',danger:'🚫',
  info:'ℹ️', success:'✅',check:'✔️',bug:'🐛',example:'📋',question:'❓',
  abstract:'📄',todo:'☑️',failure:'✖️',seealso:'👁️',summary:'📑',hint:'🔍',
  definition:'📖',theorem:'📐',proof:'✏️',quote:'💬',attention:'⚡',
};

const LABEL = {
  note:'Note',tip:'Tip',warning:'Warning',important:'Important',caution:'Caution',
  danger:'Danger',info:'Info',success:'Success',check:'Check',bug:'Bug',
  example:'Example',question:'Question',abstract:'Abstract',todo:'To Do',
  failure:'Failure',seealso:'See Also',summary:'Summary',hint:'Hint',
  definition:'Definition',theorem:'Theorem',proof:'Proof',quote:'Quote',attention:'Attention',
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Render a Document AST to an HTML string.
 * @param {DocumentNode} doc
 * @param {object}  [opts]
 * @param {boolean} [opts.xhtml=false]            Self-close void elements
 * @param {boolean} [opts.footnoteSection=true]   Append footnotes section
 * @returns {string}
 */
export function render(doc, opts = {}) {
  const ctx = buildContext(doc, opts);
  const parts = [];
  if (hasP3Directives(doc.children)) parts.push('<style id="zl-p3-styles">' + PHASE3_CSS + '</style>');
  if (hasMathNodes(doc.children))    parts.push('<style id="zl-math-styles">' + MATH_CSS + '</style>');
  if (hasLayoutNodes(doc.children))  parts.push('<style id="zl-layout-styles">' + LAYOUT_BASE_CSS + '</style>');
  if (hasInteractiveNodes(doc.children)) parts.push('<style id="zl-interactive-styles">' + INTERACTIVE_CSS + '</style>');
  if (hasAnimationNodes(doc.children))   parts.push('<style id="zl-animation-styles">' + ANIMATION_CSS + '</style>');
  parts.push(...doc.children.map(n => renderBlock(n, ctx)).filter(Boolean));
  if (opts.footnoteSection !== false) {
    const fn = renderFootnotes(ctx);
    if (fn) parts.push(fn);
  }
  return parts.join('\n');
}

function hasLayoutNodes(nodes) {
  if (!Array.isArray(nodes)) return false;
  return nodes.some(n => n && (PHASE8_NODE_TYPES.has(n.type) || isLayoutNode(n) || hasLayoutNodes(n.children)));
}


// ─── Render context ───────────────────────────────────────────────────────────

function buildContext(doc, opts) {
  const meta      = doc.metadata ?? {};
  const variables = new Map(Object.entries(meta.variables ?? {}));
  const fnDefs    = new Map();
  let   fnCounter = 0;

  // Collect footnote definitions and auto-number them
  for (const node of doc.children ?? []) {
    if (node.type === 'footnote_def') {
      fnDefs.set(node.id, { ...node, index: ++fnCounter });
    }
  }

  // Phase 2: collect reference link map
  const references = new Map();
  if (meta.references instanceof Map) {
    for (const [k, v] of meta.references) references.set(k, v);
  }
  for (const node of doc.children ?? []) {
    if (node.type === 'reference_def' && !references.has(node.id)) {
      references.set(node.id, { href: node.href, title: node.title });
    }
  }

  const usedIds    = new Set();
  const fnRefNums  = new Map();   // id → display number (assigned on first ref)
  let   fnRefCount = 0;

  // Phase 4: label -> equation number, for @ref() resolution
  const mathLabels = meta.mathLabels instanceof Map ? meta.mathLabels : new Map();

  return {
    opts,
    variables,
    fnDefs,
    fnRefNums,
    getFnNum(id) {
      if (!fnRefNums.has(id)) fnRefNums.set(id, ++fnRefCount);
      return fnRefNums.get(id);
    },
    references,  // Phase 2
    mathLabels,  // Phase 4
    usedIds,
    xhtml:        !!opts.xhtml,
    voidClose() { return this.xhtml ? ' /' : ''; },
  };
}

// ─── Block dispatch ───────────────────────────────────────────────────────────

const SKIP = new Set(['frontmatter','comment','import','variable_def','footnote_def','blank','reference_def']);

function renderBlock(node, ctx) {
  if (!node || SKIP.has(node.type)) return '';
  // Phase 3 directive dispatch
  if (PHASE3_NODE_TYPES.has(node.type)) return renderDirective(node, ctx, { renderBlock, renderInline });
  switch (node.type) {
    case 'heading':         return renderHeading(node, ctx);
    case 'paragraph':       return renderParagraph(node, ctx);
    case 'horizontal_rule': return `<hr${ctx.voidClose()}>`;
    case 'blockquote':      return renderBlockquote(node, ctx);
    case 'callout':         return renderCallout(node, ctx);     // Phase 2
    case 'admonition':      return renderAdmonition(node, ctx);  // Phase 2
    case 'list':            return renderList(node, ctx);
    case 'code_block':      return renderCodeBlock(node, ctx);
    case 'table':           return renderTable(node, ctx);
    case 'html_block':      return node.value;
    case 'figure':          return renderFigure(node, ctx);      // Phase 2
    case 'definition_list': return renderDefinitionList(node, ctx); // Phase 2
    case 'math_block':      return renderMathBlock(node, ctx);   // Phase 4
    case 'diagram':         return renderDiagram(node, ctx.opts); // Phase 5
    case 'chart':           return renderChart(node, ctx.opts);   // Phase 6
    case 'vector':          return renderVector(node, ctx.opts);  // Phase 7
    default:
      if (ctx.opts && ctx.opts.registry && ctx.opts.registry.renderers && ctx.opts.registry.renderers.hasRenderer('html', node.type)) {
        const customHtml = ctx.opts.registry.renderers.renderNode('html', node, ctx.opts);
        if (customHtml !== null) return customHtml;
      }
      if (PHASE12_NODE_TYPES.has(node.type)) {                             // Phase 12
        return renderPluginNode(node);
      }
      if (PHASE11_NODE_TYPES.has(node.type)) {                             // Phase 11
        return renderAnimationNode(node, ctx.opts);
      }
      if (PHASE10_NODE_TYPES.has(node.type)) {                             // Phase 10
        return renderInteractiveNode(node, ctx.opts);
      }
      if (PHASE9_NODE_TYPES.has(node.type) || isComponentNode(node)) {
        return renderComponent(node, ctx.variables || {}, ctx.registry, n => renderBlock(n, ctx));
      }
      if (PHASE8_NODE_TYPES.has(node.type) || isLayoutNode(node)) {
        const isDark = ctx.inDarkTheme || node.theme === 'dark' || node.theme === 'pitch-dark' || node.type === 'presentation' || node.type === 'slide';
        const layoutCtx = isDark ? { ...ctx, inDarkTheme: true } : ctx;
        return renderLayout(node, n => renderBlock(n, layoutCtx));
      }
      return '';
  }
}

// ─── Headings ─────────────────────────────────────────────────────────────────

function renderHeading(node, ctx) {
  const tag   = `h${node.level}`;
  const rawId = node.id ?? slugify(inlineToText(node.children));
  const id    = uniqueSlug(rawId, ctx.usedIds);
  const cls   = node.classes?.length ? ` class="${node.classes.map(escapeAttr).join(' ')}"` : '';
  const style = ctx?.inDarkTheme ? ' style="color: #ffffff !important;"' : '';
  return `<${tag} id="${escapeAttr(id)}"${cls}${style}>${renderInline(node.children, ctx)}</${tag}>`;
}

// ─── Paragraph ────────────────────────────────────────────────────────────────

function renderParagraph(node, ctx) {
  const style = ctx?.inDarkTheme ? ' style="color: #e2e8f0 !important;"' : '';
  return `<p${style}>${renderInline(node.children, ctx)}</p>`;
}

// ─── Blockquote ───────────────────────────────────────────────────────────────

function renderBlockquote(node, ctx) {
  const inner = node.children.map(c => renderBlock(c, ctx)).filter(Boolean).join('\n');
  return `<blockquote>\n${inner}\n</blockquote>`;
}

// ─── Callout  > [!NOTE]  (Phase 2) ────────────────────────────────────────────

function renderCallout(node, ctx) {
  const t     = node.calloutType;
  const icon  = ICON[t]  ?? '📌';
  const title = node.title ?? (LABEL[t] ?? t.charAt(0).toUpperCase() + t.slice(1));
  const inner = node.children.map(c => renderBlock(c, ctx)).filter(Boolean).join('\n');
  return [
    `<div class="zl-callout zl-callout-${escapeAttr(t)}" role="note">`,
    `<p class="zl-callout-title"><span aria-hidden="true">${icon}</span> ${escapeHtml(title)}</p>`,
    `<div class="zl-callout-body">${inner}</div>`,
    `</div>`,
  ].join('\n');
}

// ─── Admonition  [info]…[/info]  (Phase 2) ────────────────────────────────────

function renderAdmonition(node, ctx) {
  const t     = node.admonType;
  const icon  = ICON[t]  ?? '📌';
  const title = node.title ?? (LABEL[t] ?? t.charAt(0).toUpperCase() + t.slice(1));
  const inner = node.children.map(c => renderBlock(c, ctx)).filter(Boolean).join('\n');
  return [
    `<div class="zl-admonition zl-admonition-${escapeAttr(t)}" role="note" aria-label="${escapeAttr(title)}">`,
    `  <div class="zl-admonition-header">`,
    `    <span class="zl-admonition-icon" aria-hidden="true">${icon}</span>`,
    `    <span class="zl-admonition-title">${escapeHtml(title)}</span>`,
    `  </div>`,
    `  <div class="zl-admonition-body">${inner}</div>`,
    `</div>`,
  ].join('\n');
}

// ─── Figure  (Phase 2) ────────────────────────────────────────────────────────

function renderFigure(node, ctx) {
  const src     = escapeAttr(node.src);
  const alt     = escapeAttr(node.alt ?? '');
  const title   = node.title  ? ` title="${escapeAttr(node.title)}"` : '';
  const loading = node.lazy   ? ` loading="lazy"` : '';
  const width   = node.width  ? ` width="${escapeAttr(node.width)}"` : '';
  const height  = node.height ? ` height="${escapeAttr(node.height)}"` : '';
  const img     = `<img src="${src}" alt="${alt}"${title}${loading}${width}${height}${ctx.voidClose()}>`;
  const cap     = node.caption ? `\n<figcaption class="zl-caption">${escapeHtml(node.caption)}</figcaption>` : '';
  return `<figure class="zl-figure">\n${img}${cap}\n</figure>`;
}

// ─── Definition list  (Phase 2) ───────────────────────────────────────────────

function renderDefinitionList(node, ctx) {
  const rows = node.items.map(item => {
    const termInline = parseInline(item.term, { refs: ctx.references });
    const dt = `<dt class="zl-dt">${renderInline(termInline, ctx)}</dt>`;
    const dds = (item.defs ?? []).map(def => {
      const defInline = parseInline(def, { refs: ctx.references });
      return `<dd class="zl-dd">${renderInline(defInline, ctx)}</dd>`;
    }).join('\n');
    return `${dt}\n${dds}`;
  });
  return `<dl class="zl-dl">\n${rows.join('\n')}\n</dl>`;
}

// ─── List ─────────────────────────────────────────────────────────────────────

function renderList(node, ctx) {
  const tag   = node.ordered ? 'ol' : 'ul';
  const start = node.ordered && node.start && node.start !== 1 ? ` start="${node.start}"` : '';
  const items = node.children.map(i => renderListItem(i, node.tight, ctx)).join('\n');
  return `<${tag}${start}>\n${items}\n</${tag}>`;
}

function renderListItem(node, tight, ctx) {
  const cls = node.checked !== null ? ' class="zl-task' + (node.checked ? ' zl-done' : '') + '"' : '';
  const checkbox = node.checked !== null
    ? `<input type="checkbox"${node.checked ? ' checked' : ''} disabled${ctx.voidClose()}> `
    : '';

  let inner;
  if (tight) {
    // Tight list: unwrap a leading paragraph so it renders inline (no <p>),
    // but keep any subsequent block children (nested lists, code, etc.) intact.
    if (node.children.length === 1 && node.children[0].type === 'paragraph') {
      inner = checkbox + renderInline(node.children[0].children, ctx);
    } else {
      inner = node.children.map((c, i) => {
        if (i === 0 && c.type === 'paragraph') return checkbox + renderInline(c.children, ctx);
        return renderBlock(c, ctx);
      }).filter(Boolean).join('\n');
    }
  } else {
    // Loose list: every child renders as a full block, checkbox injected into first <p>.
    inner = node.children.map((c, i) => {
      if (i === 0 && c.type === 'paragraph' && checkbox) {
        return `<p>${checkbox}${renderInline(c.children, ctx)}</p>`;
      }
      return renderBlock(c, ctx);
    }).filter(Boolean).join('\n');
  }

  return `<li${cls}>${inner}</li>`;
}

// ─── Code block  (Phase 2: title / line-numbers / highlights / diff / copy) ───

const COPY_JS = `(t=>{var l=[...t.closest('.zl-cb').querySelectorAll('.zl-ln')].map(n=>n.textContent).join('\\n');navigator.clipboard.writeText(l);t.textContent='✓';setTimeout(()=>t.textContent='Copy',1500)})(this)`;

function renderCodeBlock(node, ctx) {
  const lang    = node.lang;
  const title   = node.title;
  const hlSet   = new Set(node.highlightLines ?? []);
  const hasNums = node.lineNumbers;
  const isDiff  = node.diff;
  const showHdr = !!(title || lang);

  // Header bar
  let hdr = '';
  if (showHdr) {
    const ls = lang  ? `<span class="zl-code-lang">${escapeHtml(lang)}</span>` : '';
    const ts = title ? `<span class="zl-code-title">${escapeHtml(title)}</span>` : '';
    const cp = `<button class="zl-copy" onclick="${escapeAttr(COPY_JS)}" aria-label="Copy code">Copy</button>`;
    hdr = `<div class="zl-code-header">${ls}${ts}${cp}</div>`;
  }

  // Code lines
  const rawLines = node.value.split('\n');
  if (rawLines[rawLines.length - 1] === '') rawLines.pop();

  const rendered = rawLines.map((line, i) => {
    const n    = i + 1;
    const cls  = ['zl-ln'];
    if (hlSet.has(n))                        cls.push('zl-hl');
    if (isDiff && line.startsWith('+'))      cls.push('zl-diff-add');
    else if (isDiff && line.startsWith('-')) cls.push('zl-diff-rem');
    const dataN = hasNums ? ` data-n="${n}"` : '';
    return `<span class="${cls.join(' ')}"${dataN}>${escapeHtml(line)}</span>`;
  }).join('\n');

  const preCls = ['zl-pre', ...(hasNums ? ['zl-has-nums'] : []), ...(isDiff ? ['zl-diff'] : [])];
  const codeCls = lang ? ` class="language-${escapeAttr(lang)}"` : '';
  const blk     = lang ? ` data-lang="${escapeAttr(lang)}"` : '';

  return `<div class="zl-cb"${blk}>${hdr}<pre class="${preCls.join(' ')}"><code${codeCls}>${rendered}\n</code></pre></div>`;
}

// ─── Table  (Phase 2: caption + responsive wrapper) ───────────────────────────

function renderTable(node, ctx) {
  const cap   = node.caption ? `<caption class="zl-caption">${escapeHtml(node.caption)}</caption>` : '';
  const thead = node.head.length  ? `<thead>\n${node.head.map(r => renderTableRow(r, ctx, true)).join('\n')}\n</thead>` : '';
  const tbody = node.rows.length  ? `<tbody>\n${node.rows.map(r => renderTableRow(r, ctx, false)).join('\n')}\n</tbody>` : '';
  const tbl   = `<table class="zl-table">${cap}${thead}${tbody}</table>`;
  return `<div class="zl-table-wrap" role="region" aria-label="Data table" tabindex="0">${tbl}</div>`;
}

function renderTableRow(row, ctx, isHead) {
  const tag = isHead ? 'th' : 'td';
  const cells = (row.cells ?? []).map(cell => {
    const align = cell.align ? ` style="text-align:${cell.align}"` : '';
    return `<${tag}${align}>${renderInline(cell.children, ctx)}</${tag}>`;
  }).join('');
  return `<tr>${cells}</tr>`;
}

// ─── Footnotes section ────────────────────────────────────────────────────────

function renderFootnotes(ctx) {
  if (!ctx.fnRefNums.size) return '';
  const items = [...ctx.fnRefNums.entries()].map(([id, num]) => {
    const def  = ctx.fnDefs.get(id);
    const body = def ? renderInline(def.children, ctx) : `[^${escapeHtml(id)}]`;
    return `<li id="fn-${escapeAttr(id)}" value="${num}">${body} <a href="#fnref-${escapeAttr(id)}" class="zl-fn-back" aria-label="Back to reference">↩</a></li>`;
  });
  return `<section class="zl-footnotes" aria-label="Footnotes"><hr>\n<ol>\n${items.join('\n')}\n</ol></section>`;
}

// ─── Inline rendering ─────────────────────────────────────────────────────────

export function renderInline(nodes, ctx) {
  if (!nodes?.length) return '';
  return nodes.map(n => renderInlineNode(n, ctx)).join('');
}

function renderInlineNode(node, ctx) {
  if (!node) return '';
  switch (node.type) {
    case 'text':         return escapeHtml(node.value);
    case 'softbreak':    return ' ';
    case 'linebreak':    return `<br${ctx.voidClose()}>\n`;
    case 'bold':         return `<strong>${renderInline(node.children, ctx)}</strong>`;
    case 'italic':       return `<em>${renderInline(node.children, ctx)}</em>`;
    case 'strikethrough':return `<del>${renderInline(node.children, ctx)}</del>`;
    case 'inline_code':  return `<code>${escapeHtml(node.value)}</code>`;
    case 'image':        return renderInlineImage(node, ctx);
    case 'link':         return renderLink(node, ctx);
    case 'footnote_ref': return renderFootnoteRef(node, ctx);
    case 'variable_ref': {
      const v = ctx.variables.get(node.name);
      return v != null ? escapeHtml(String(v)) : escapeHtml(`{{${node.name}}}`);
    }
    // Phase 2 inline nodes
    case 'superscript':  return `<sup>${renderInline(node.children, ctx)}</sup>`;
    case 'subscript':    return `<sub>${renderInline(node.children, ctx)}</sub>`;
    case 'highlight':    return `<mark>${renderInline(node.children, ctx)}</mark>`;
    case 'kbd':          return `<kbd>${escapeHtml(node.value)}</kbd>`;
    case 'html_entity':  return renderEntity(node);
    case 'ref_link':     return renderRefLink(node, ctx);
    // Phase 4 inline nodes
    case 'math_inline':  return renderMathInlineNode(node, ctx);
    case 'math_ref':     return renderMathRef(node, ctx);
    default:             return '';
  }
}

function renderInlineImage(node, ctx) {
  const src  = escapeAttr(node.src);
  const alt  = escapeAttr(node.alt ?? '');
  const title = node.title ? ` title="${escapeAttr(node.title)}"` : '';
  const lazy  = node.lazy  ? ` loading="lazy"` : '';
  return `<img src="${src}" alt="${alt}"${title}${lazy}${ctx.voidClose()}>`;
}

function renderLink(node, ctx) {
  const href  = escapeAttr(node.href);
  const title = node.title ? ` title="${escapeAttr(node.title)}"` : '';
  return `<a href="${href}"${title}>${renderInline(node.children, ctx)}</a>`;
}

function renderFootnoteRef(node, ctx) {
  const n    = ctx.getFnNum(node.id);
  const href = `#fn-${escapeAttr(node.id)}`;
  return `<sup class="zl-fn-ref"><a href="${href}" id="fnref-${escapeAttr(node.id)}" aria-describedby="footnote-label">[${n}]</a></sup>`;
}

function renderEntity(node) {           // Phase 2
  const r = node.raw;
  if (r.startsWith('#x') || r.startsWith('#X')) {
    const cp = parseInt(r.slice(2), 16);
    if (cp > 0 && cp <= 0x10FFFF) return escapeHtml(String.fromCodePoint(cp));
  }
  if (r.startsWith('#')) {
    const cp = parseInt(r.slice(1), 10);
    if (cp > 0 && cp <= 0x10FFFF) return escapeHtml(String.fromCodePoint(cp));
  }
  return `&${r};`; // Named entity — pass through verbatim
}

function renderRefLink(node, ctx) {     // Phase 2
  const ref = ctx.references?.get(node.id);
  const inner = renderInline(node.children, ctx);
  if (!ref) return `<span class="zl-broken-ref" title="Undefined reference: ${escapeAttr(node.id)}">${inner}</span>`;
  const href  = escapeAttr(ref.href);
  const title = ref.title ? ` title="${escapeAttr(ref.title)}"` : '';
  return `<a href="${href}"${title}>${inner}</a>`;
}

// ─── Math  (Phase 4) ──────────────────────────────────────────────────────────
//
// Every equation renders BOTH a visual HTML/CSS representation (via
// math-renderer.js) AND a visually-hidden semantic MathML annotation (via
// math-mathml.js) — the same hybrid strategy KaTeX itself uses so screen
// readers get correct native MathML accessibility without sacrificing the
// hand-tuned visual layout. An aria-label plain-text fallback covers
// browsers/assistive tech with neither MathML nor good ARIA support.

function anchorIdFor(label, fallbackPrefix, ctx) {
  const seed = label ? `eq-${label}` : `${fallbackPrefix}-equation`;
  return uniqueSlug(seed, ctx.usedIds);
}

function renderMathBlock(node, ctx) {
  if (!node.ast) {
    return `<div class="zl-merror">Math parse error${node.parseErrors?.[0] ? ': ' + escapeHtml(node.parseErrors[0].message) : ''}</div>`;
  }

  const id       = anchorIdFor(node.label, 'mb', ctx);
  const visual   = node.ast.type === 'EquationGroup'
    ? node.ast.children.map(eq => renderMathHTML(eq)).join('<br>')
    : renderMathHTML(node.ast);
  const mathml   = renderMathML(node.ast, 'block');
  const ariaText = mathToPlainText(node.ast);

  const title  = node.title ? `<div class="zl-math-title">${escapeHtml(node.title)}</div>` : '';
  const number = node.numbered
    ? `<span class="zl-math-number">(${node.number})</span>`
    : '';

  return [
    `<div class="zl-math-block-wrap" id="${escapeAttr(id)}"${node.label ? ` data-label="${escapeAttr(node.label)}"` : ''}>`,
    title,
    `<div class="zl-math zl-math-display" role="img" aria-label="${escapeAttr(ariaText)}">${visual}</div>`,
    `<span class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap">${mathml}</span>`,
    number,
    `</div>`,
  ].filter(Boolean).join('\n');
}

function renderMathInlineNode(node, ctx) {
  if (!node.ast) {
    return `<span class="zl-merror" title="Math parse error">${escapeHtml(node.content)}</span>`;
  }
  const visual   = renderMathHTML(node.ast);
  const mathml   = renderMathML(node.ast, 'inline');
  const ariaText = mathToPlainText(node.ast);
  return `<span class="zl-math zl-math-inline" role="img" aria-label="${escapeAttr(ariaText)}">${visual}<span class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap">${mathml}</span></span>`;
}

function renderMathRef(node, ctx) {
  const num = ctx.mathLabels?.get(node.refId);
  if (num == null) {
    return `<span class="zl-math-ref-broken" title="Undefined equation reference: ${escapeAttr(node.refId)}">(?)</span>`;
  }
  return `<a class="zl-math-ref" href="#${escapeAttr('eq-' + slugify(node.refId))}">(${num})</a>`;
}

// ─── Plain text extraction ────────────────────────────────────────────────────

export function inlineToText(nodes) {
  if (!nodes?.length) return '';
  return nodes.map(n => {
    if (n.type === 'text')       return n.value;
    if (n.type === 'inline_code') return n.value;
    if (n.type === 'variable_ref') return `{{${n.name}}}`;
    if (n.children?.length)       return inlineToText(n.children);
    return '';
  }).join('');
}
