/**
 * Zolto Animation Parser — Phase 11
 *
 * Recursive descent parser for @animate, @keyframes, @timeline,
 * and @presentation block content.
 * Pure function: no mutable state, no I/O, no throws.
 */

import { tokenizeAnimation, ATK, parseAttrs } from './tokenizer.js';
import {
  createAnimationDef, createKeyframesDef, createKeyframeStep,
  createTimeline, createTimelineStep,
  createPresentation, createSlide, createSpeakerNote,
  createRevealTrigger, createAnimationTarget,
  SLIDE_TYPES,
} from './ast.js';
import { parseDuration, isValidEasing } from './easing.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseAttrInt(attrs, key, defaultVal) {
  const v = attrs[key];
  if (v === undefined || v === null) return defaultVal;
  const n = parseInt(v, 10);
  return isNaN(n) ? defaultVal : n;
}

function parseAttrFloat(attrs, key, defaultVal) {
  const v = attrs[key];
  if (v === undefined || v === null) return defaultVal;
  const n = parseFloat(v);
  return isNaN(n) ? defaultVal : n;
}

function parseAttrBool(attrs, key, defaultVal) {
  const v = attrs[key];
  if (v === undefined || v === null) return defaultVal;
  if (v === 'true'  || v === '1' || v === '') return true;
  if (v === 'false' || v === '0') return false;
  return defaultVal;
}

// ─── Source splitter ──────────────────────────────────────────────────────────
// Splits raw multi-block source (multiple @animate / @keyframes / @presentation)
// at the root level, accounting for nested @/.

function splitRootBlocks(src) {
  const lines = String(src || '').split('\n');
  const blocks = [];
  let current = null;
  let depth = 0;

  const BLOCK_OPENERS  = /^@(animate|keyframes|anim-timeline|slides|reveal|target)(?:\s|$)/;
  const BLOCK_CLOSERS  = /^@\/(animate|keyframes|anim-timeline|slides|reveal|target)\s*$/;

  for (const raw of lines) {
    const line = raw.trimStart();

    if (!current) {
      if (BLOCK_OPENERS.test(line)) {
        current = { header: raw, bodyLines: [], tag: /^@([\w-]+)/.exec(line)?.[1] };
        depth = 1;
      }
      // skip non-block lines at root
      continue;
    }

    // Inside a block
    if (BLOCK_OPENERS.test(line) && !/^@\//.test(line)) {
      depth++;
      current.bodyLines.push(raw);
    } else if (BLOCK_CLOSERS.test(line)) {
      depth--;
      if (depth === 0) {
        blocks.push({ ...current });
        current = null;
      } else {
        current.bodyLines.push(raw);
      }
    } else {
      current.bodyLines.push(raw);
    }
  }

  return blocks;
}

// ─── @animate parser ──────────────────────────────────────────────────────────

function parseAnimateDef(header, body) {
  const attrs   = parseAttrs(header.replace(/^@animate\s*/, ''));
  const name    = attrs.name || 'unnamed';
  const dur     = parseDuration(attrs.duration ?? attrs.dur ?? 300);
  const delay   = parseDuration(attrs.delay   || 0);
  const easing  = attrs.easing  || attrs.ease || 'ease';
  const animType = attrs.type   || attrs.animType || 'fade';
  const stagger  = attrs.stagger ? parseDuration(attrs.stagger) : null;
  const iteration = attrs.iteration || attrs.iterations || 1;
  const direction = attrs.direction || 'normal';
  const fillMode  = attrs.fill    || 'both';
  const reducedOk = attrs.reducedOk !== 'false';

  const props = [];
  const tks = tokenizeAnimation(body);
  for (const tk of tks) {
    if (tk.type === ATK.PROP_LINE) {
      props.push({ prop: tk.prop, from: tk.from, to: tk.to });
    }
  }

  return createAnimationDef(name, props, {
    duration: dur, delay, easing, animType, stagger,
    iteration, direction, fillMode, reducedOk,
  });
}

// ─── @keyframes parser ────────────────────────────────────────────────────────

function parseKeyframesDef(header, body) {
  const nameMatch = /^@keyframes\s+(\S+)/.exec(header.trim());
  const name = nameMatch ? nameMatch[1] : 'unnamed';

  const tks = tokenizeAnimation(body);
  const steps = [];
  for (const tk of tks) {
    if (tk.type === ATK.PERCENT) {
      steps.push(createKeyframeStep(tk.percent, tk.declarations));
    }
  }

  return createKeyframesDef(name, steps);
}

// ─── @timeline parser ─────────────────────────────────────────────────────────

function parseTimeline(header, body) {
  const attrs = parseAttrs(header.replace(/^@timeline\s*/, ''));
  const auto  = parseAttrBool(attrs, 'auto', true);
  const loop  = parseAttrBool(attrs, 'loop', false);
  const id    = attrs.id || null;

  // Collect @step blocks from body
  const stepRe   = /^[ \t]*@step(?:\s+(.*))?$/;
  const closeRe  = /^[ \t]*@\/step\s*$/;
  const lines    = body.split('\n');
  const steps    = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trimStart();
    const sm = stepRe.exec(lines[i]);
    if (sm) {
      const stepAttrsRaw = sm[1] || '';
      const stepAttrs = parseAttrs(stepAttrsRaw);
      const delay     = parseDuration(stepAttrs.delay || stepAttrs.d || 0);
      const duration  = stepAttrs.duration ? parseDuration(stepAttrs.duration) : null;
      // Support bare boolean flag: highlight (without =value)
      const highlight = parseAttrBool(stepAttrs, 'highlight', false) ||
                        /\bhighlight\b/.test(stepAttrsRaw);
      const stepId    = stepAttrs.id || null;
      const bodyLines = [];
      i++;
      while (i < lines.length && !closeRe.test(lines[i])) {
        bodyLines.push(lines[i]);
        i++;
      }
      i++; // skip @/step
      steps.push(createTimelineStep(bodyLines.join('\n').trim(), { delay, duration, highlight, id: stepId }));
    } else {
      i++;
    }
  }

  return createTimeline(steps, { auto, loop, id });
}

// ─── @presentation / @slide parser ───────────────────────────────────────────

function parseSlideContent(header, bodyLines, slideIndex) {
  const attrs     = parseAttrs(header.replace(/^@slide\s*/, ''));
  const title     = attrs.title || attrs.t || '';
  const slideType = SLIDE_TYPES.includes(attrs.type) ? attrs.type : 'content';
  const theme     = attrs.theme   || null;
  const trans     = attrs.transition || null;
  const bg        = attrs.background || attrs.bg || null;
  const slideId   = attrs.id || null;

  const notes        = [];
  const contentLines = [];
  let i = 0;
  const noteOpenRe  = /^[ \t]*@note\s*$/;
  const noteCloseRe = /^[ \t]*@\/note\s*$/;

  while (i < bodyLines.length) {
    const line = bodyLines[i];
    if (noteOpenRe.test(line)) {
      const noteBody = [];
      i++;
      while (i < bodyLines.length && !noteCloseRe.test(bodyLines[i])) {
        noteBody.push(bodyLines[i]);
        i++;
      }
      i++; // skip @/note
      const cueMatch = noteBody[0] ? /^cue:\s*(.+)/.exec(noteBody[0].trim()) : null;
      const noteContent = (cueMatch ? noteBody.slice(1) : noteBody).join('\n').trim();
      notes.push(createSpeakerNote(noteContent, { cue: cueMatch ? cueMatch[1] : null }));
    } else {
      contentLines.push(line);
      i++;
    }
  }

  return createSlide(contentLines.join('\n').trim(), {
    id: slideId, title, slideType, theme,
    transition: trans, background: bg, notes, index: slideIndex,
  });
}

function parsePresentationDef(header, body) {
  const attrs    = parseAttrs(header.replace(/^@presentation\s*/, ''));
  const title    = attrs.title || '';
  const theme    = attrs.theme || 'dark';
  const ratio    = attrs.ratio || '16:9';
  const trans    = attrs.transition || 'fade';
  const autoplay = parseAttrBool(attrs, 'autoplay', false);
  const loop     = parseAttrBool(attrs, 'loop', false);
  const controls = parseAttrBool(attrs, 'controls', true);
  const progress = parseAttrBool(attrs, 'progress', true);
  const slideNum = parseAttrBool(attrs, 'slideNumber', true);
  const presId   = attrs.id || null;

  // Extract @slide blocks
  const lines    = body.split('\n');
  const slides   = [];
  let i          = 0;
  let slideIdx   = 0;
  const slideOpenRe  = /^[ \t]*@slide(?:\s+(.*))?$/;
  const slideCloseRe = /^[ \t]*@\/slide\s*$/;

  while (i < lines.length) {
    const sm = slideOpenRe.exec(lines[i]);
    if (sm) {
      const slideHeader = `@slide ${sm[1] || ''}`;
      const slideBody = [];
      i++;
      let depth = 1;
      while (i < lines.length) {
        if (slideOpenRe.test(lines[i])) depth++;
        if (slideCloseRe.test(lines[i])) { depth--; if (depth === 0) { i++; break; } }
        slideBody.push(lines[i]);
        i++;
      }
      slides.push(parseSlideContent(slideHeader, slideBody, slideIdx++));
    } else {
      i++;
    }
  }

  return createPresentation(slides, {
    id: presId, title, theme, ratio, transition: trans,
    autoplay, loop, controls, progress, slideNumber: slideNum,
  });
}

// ─── @reveal parser ───────────────────────────────────────────────────────────

function parseReveal(header) {
  const attrs    = parseAttrs(header.replace(/^@reveal\s*/, ''));
  const targetId = attrs.target || attrs.id || '';
  const trigger  = attrs.trigger || 'enter';
  const threshold = parseAttrFloat(attrs, 'threshold', 0.2);
  const animation = attrs.animation || null;
  const once      = parseAttrBool(attrs, 'once', true);
  return createRevealTrigger(targetId, { trigger, threshold, animation, once });
}

// ─── Main parse function ──────────────────────────────────────────────────────

/**
 * Parse raw animation/presentation block content (already inside the outer
 * @animate / @keyframes / @timeline / @presentation wrapper) into typed AST nodes.
 *
 * @param {string}  src          Raw content string (the block header line is included
 *                               when `headerTag` is provided, otherwise assumed absent).
 * @param {string}  [headerTag]  'animate' | 'keyframes' | 'timeline' | 'presentation' | null
 * @param {string}  [header]     The full first-line header (e.g. "@animate name="x" duration=300")
 * @returns {object[]}  Flat array of AST nodes
 */
export function parseAnimationSource(src, headerTag, header) {
  if (!headerTag) {
    // Multi-block source: split and parse each top-level block
    const blocks = splitRootBlocks(src);
    return blocks.map(b => {
      const body = b.bodyLines.join('\n');
      return dispatchBlock(b.tag, b.header, body);
    }).filter(Boolean);
  }

  return [dispatchBlock(headerTag, header || `@${headerTag}`, src)].filter(Boolean);
}

function dispatchBlock(tag, header, body) {
  switch (tag) {
    case 'animate':          return parseAnimateDef(header, body);
    case 'keyframes':        return parseKeyframesDef(header, body);
    case 'anim-timeline':    return parseTimeline(header, body);
    case 'timeline':         return parseTimeline(header, body); // backward-compat alias
    case 'slides':            return parsePresentationDef(header, body);
    case 'deck':              return parsePresentationDef(header, body); // backward-compat alias
    case 'presentation':     return parsePresentationDef(header, body); // backward-compat alias
    case 'reveal':           return parseReveal(header);
    default:                 return null;
  }
}
