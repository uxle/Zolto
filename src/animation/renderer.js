/**
 * Zolto Animation HTML Renderer — Phase 11
 *
 * Converts animation AST nodes into semantic HTML with CSS hooks.
 * - @animate    → <style> block + CSS class definitions
 * - @keyframes  → <style> @keyframes block
 * - @timeline   → <div class="zl-timeline">…</div>
 * - @presentation → <div class="zl-presentation">…</div> with slide deck
 * - @reveal     → data-zl-reveal attribute wrapper
 *
 * No arbitrary JS injection. Progressive enhancement via data-zl-* attributes.
 */

import { ANIMATION_NODE_TYPES } from './ast.js';
import { keyframesToCSS, builtinKeyframesCSS } from './keyframes.js';
import { resolveEasing } from './easing.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function attr(name, val) {
  if (val === null || val === undefined || val === false) return '';
  if (val === true) return ` ${name}`;
  return ` ${name}="${esc(val)}"`;
}

function uid(prefix, seed) {
  return `zl-${prefix}-${String(seed || '').replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'el'}`;
}

// ─── Main dispatch ────────────────────────────────────────────────────────────

/**
 * Render any animation AST node to an HTML/CSS string.
 * @param {object} node
 * @param {object} [opts]
 * @returns {string}
 */
export function renderAnimationNode(node, opts = {}) {
  if (!node || typeof node !== 'object') return '';
  switch (node.type) {
    case ANIMATION_NODE_TYPES.ANIMATION_DEF:      return renderAnimationDef(node, opts);
    case ANIMATION_NODE_TYPES.KEYFRAMES_DEF:      return renderKeyframesDef(node, opts);
    case ANIMATION_NODE_TYPES.ANIM_TIMELINE:      return renderTimeline(node, opts);
    case ANIMATION_NODE_TYPES.PRESENTATION:       return renderPresentation(node, opts);
    case ANIMATION_NODE_TYPES.REVEAL_TRIGGER:     return renderRevealTrigger(node, opts);
    case ANIMATION_NODE_TYPES.ANIMATION_TARGET:   return renderAnimationTarget(node, opts);
    default: return '';
  }
}

// ─── @animate renderer ────────────────────────────────────────────────────────

function renderAnimationDef(node, opts) {
  const safeName = String(node.name || 'anim').replace(/[^a-zA-Z0-9_-]/g, '');
  const dur      = `${node.duration}ms`;
  const delay    = node.delay ? `${node.delay}ms` : '0ms';
  const easing   = resolveEasing(node.easing);
  const iter     = node.iteration == null ? 1 : node.iteration;
  const dir      = esc(node.direction || 'normal');
  const fill     = esc(node.fillMode  || 'both');

  // Generate keyframes name from animation type or use built-in
  const kfName   = `zl-${safeName}`;

  // CSS for this animation definition
  const kfCSS    = builtinKeyframesCSS(node.animType || 'fade', kfName);
  const classDef =
`.zl-anim-${safeName} {
  animation: ${kfName} ${dur} ${easing} ${delay} ${iter} ${dir} ${fill};
}`;

  const staggerDef = node.stagger != null
    ? `[data-zl-anim-group="${safeName}"] { --zl-stagger-delay: ${node.stagger}ms; }\n`
    : '';

  return `<style data-zl-animate="${esc(safeName)}">\n@media (prefers-reduced-motion: no-preference) {\n${kfCSS}\n${classDef}\n${staggerDef}}\n</style>`;
}

// ─── @keyframes renderer ──────────────────────────────────────────────────────

function renderKeyframesDef(node, opts) {
  const css = keyframesToCSS(node);
  if (!css) return '';
  return `<style data-zl-keyframes="${esc(node.name)}">\n@media (prefers-reduced-motion: no-preference) {\n${css}\n}\n</style>`;
}

// ─── @timeline renderer ───────────────────────────────────────────────────────

function renderTimeline(node, opts) {
  const steps = (node.steps || []).map((step, i) => {
    const delayStyle = step.delay > 0 ? ` style="animation-delay:${step.delay}ms"` : '';
    const highlight  = step.highlight ? ' zl-timeline-step--highlight' : '';
    const stepId     = step.id ? ` id="${esc(step.id)}"` : '';
    const content    = esc(step.content);
    return `<div${stepId} class="zl-timeline-step${highlight}" data-zl-step="${i}"${delayStyle}>\n${content}\n</div>`;
  }).join('\n');

  const id   = node.id ? ` id="${esc(node.id)}"` : '';
  const auto = node.auto !== false ? ' data-zl-auto' : '';
  const loop = node.loop ? ' data-zl-loop' : '';

  return `<div${id} class="zl-timeline" role="list"${auto}${loop} data-zl-timeline>\n${steps}\n</div>`;
}

// ─── @presentation renderer ───────────────────────────────────────────────────

function renderPresentation(node, opts) {
  const slides     = node.slides || [];
  const total      = slides.length;
  const ratio      = esc(node.ratio || '16:9');
  const theme      = esc(node.theme || 'dark');
  const presId     = node.id ? esc(node.id) : uid('pres', node.title);
  const hasControls = node.controls !== false;
  const hasProgress = node.progress !== false;
  const hasNumbers  = node.slideNumber !== false;
  const transition  = esc(node.transition || 'fade');

  // Render slides
  const slidesHTML = slides.map((slide, idx) => renderSlide(slide, idx, total)).join('\n');

  // Outline navigation
  const outlineItems = slides.map((slide, idx) => {
    const anchor = slide.id ? esc(slide.id) : `${presId}-slide-${idx}`;
    const title  = esc(slide.title || `Slide ${idx + 1}`);
    return `<li><a href="#${anchor}" data-zl-goto="${idx}">${idx + 1}. ${title}</a></li>`;
  }).join('\n');
  const outlineHTML = `<nav class="zl-slide-outline" aria-label="Slide outline">\n<ol>${outlineItems}\n</ol>\n</nav>`;

  // Controls bar
  const controlsHTML = hasControls ? `
<div class="zl-presentation-controls" role="toolbar" aria-label="Presentation controls">
  <button class="zl-slide-btn" data-zl-prev aria-label="Previous slide">&#8592;</button>
  ${hasProgress ? `<div class="zl-slide-progress" role="progressbar" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="1"><div class="zl-slide-progress-bar" style="width:${total > 1 ? Math.round(100/total) : 100}%"></div></div>` : ''}
  <button class="zl-slide-btn" data-zl-next aria-label="Next slide">&#8594;</button>
  ${hasNumbers ? `<span class="zl-slide-counter" aria-live="polite">1 / ${total}</span>` : ''}
</div>` : '';

  return `<div class="zl-presentation" data-zl-presentation id="${presId}" data-theme="${theme}" data-ratio="${ratio}" data-transition="${transition}" aria-label="${esc(node.title || 'Presentation')}">
<div class="zl-presentation-deck" data-ratio="${ratio}">
${slidesHTML}
</div>
${controlsHTML}
${outlineHTML}
</div>`;
}

function renderSlide(slide, idx, total) {
  const isFirst   = idx === 0;
  const active    = isFirst ? ' zl-slide--active' : '';
  const typeClass = ` zl-slide--${esc(slide.slideType || 'content')}`;
  const slideId   = slide.id ? esc(slide.id) : '';
  const idAttr    = slideId ? ` id="${slideId}"` : ` id="zl-slide-${idx}"`;
  const bgStyle   = slide.background ? ` style="background:${esc(slide.background)}"` : '';
  const title     = esc(slide.title || '');

  // Speaker notes (hidden from public)
  const notesHTML = (slide.notes || []).map(n =>
    `<aside class="zl-speaker-note" hidden aria-hidden="true"><p>${esc(n.content)}</p>${n.cue ? `<p class="zl-note-cue">Cue: ${esc(n.cue)}</p>` : ''}</aside>`
  ).join('\n');

  // Render content (simple markdown-like output)
  const contentHTML = renderSlideContent(slide.content);

  return `<div${idAttr} class="zl-slide${typeClass}${active}" role="region" aria-label="${title || `Slide ${idx + 1}`}" data-zl-slide="${idx}" data-slide-type="${esc(slide.slideType)}"${bgStyle}>
${contentHTML}
${notesHTML}
</div>`;
}

function renderSlideContent(content) {
  if (!content) return '';
  // Convert headings and basic content (the full renderer will handle this,
  // but for standalone use we do minimal processing)
  return content
    .split('\n')
    .map(line => {
      const h1 = /^# (.+)$/.exec(line);      if (h1) return `<h1>${esc(h1[1])}</h1>`;
      const h2 = /^## (.+)$/.exec(line);     if (h2) return `<h2>${esc(h2[1])}</h2>`;
      const h3 = /^### (.+)$/.exec(line);    if (h3) return `<h3>${esc(h3[1])}</h3>`;
      const ul = /^[-*+] (.+)$/.exec(line);  if (ul) return `<li>${esc(ul[1])}</li>`;
      const ol = /^\d+\. (.+)$/.exec(line);  if (ol) return `<li>${esc(ol[1])}</li>`;
      if (!line.trim()) return '';
      return `<p>${esc(line)}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

// ─── @reveal renderer ────────────────────────────────────────────────────────

function renderRevealTrigger(node, opts) {
  const tid   = esc(node.targetId);
  const anim  = node.animation ? ` data-zl-reveal-anim="${esc(node.animation)}"` : '';
  const once  = node.once !== false ? ' data-zl-once' : '';
  const thr   = ` data-zl-threshold="${node.threshold}"`;
  return `<script type="application/json" data-zl-reveal-config for="${tid}"${anim}${thr}${once}></script>`;
}

// ─── @target renderer ────────────────────────────────────────────────────────

function renderAnimationTarget(node, opts) {
  const tid  = esc(node.targetId);
  const anim = esc(node.animationName);
  const del  = node.delay ? ` data-zl-delay="${node.delay}"` : '';
  const trg  = ` data-zl-trigger="${esc(node.trigger)}"`;
  return `<script type="application/json" data-zl-target="${tid}" data-zl-animation="${anim}"${del}${trg}></script>`;
}

// ─── Slide outline helper (public utility) ────────────────────────────────────

/**
 * Generate a slide outline array from a presentation node.
 * @param {object} node  Presentation AST node
 * @returns {{ index: number, title: string, type: string }[]}
 */
export function generateSlideOutline(node) {
  if (!node || node.type !== ANIMATION_NODE_TYPES.PRESENTATION) return [];
  return (node.slides || []).map((s, i) => ({
    index: i,
    title: s.title || `Slide ${i + 1}`,
    type:  s.slideType || 'content',
    id:    s.id || null,
  }));
}

/**
 * Check if an array of nodes contains any animation nodes.
 * @param {object[]} nodes
 * @returns {boolean}
 */
export function hasAnimationNodes(nodes) {
  return Array.isArray(nodes) && nodes.some(n => n && Object.values(ANIMATION_NODE_TYPES).includes(n.type));
}
