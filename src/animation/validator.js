/**
 * Zolto Animation Validator — Phase 11
 *
 * Static analysis of animation AST nodes. Returns an AnimationDiagnostics
 * instance. Never throws.
 */

import { ANIMATION_NODE_TYPES, ANIMATION_TYPES, SLIDE_TYPES } from './ast.js';
import { isValidEasing, isValidDuration } from './easing.js';
import { AnimationDiagnostics } from './diagnostics.js';
import { BUILTIN_KEYFRAMES } from './keyframes.js';

// ─── Main validator ───────────────────────────────────────────────────────────

/**
 * @param {object[]} nodes
 * @returns {AnimationDiagnostics}
 */
export function validateAnimationNodes(nodes) {
  const diag = new AnimationDiagnostics();
  if (!Array.isArray(nodes)) return diag;

  const seenNames = new Set();

  for (const node of nodes) {
    if (!node || !node.type) continue;
    switch (node.type) {
      case ANIMATION_NODE_TYPES.ANIMATION_DEF:
        validateAnimationDef(node, diag, seenNames);
        break;
      case ANIMATION_NODE_TYPES.KEYFRAMES_DEF:
        validateKeyframesDef(node, diag, seenNames);
        break;
      case ANIMATION_NODE_TYPES.ANIM_TIMELINE:
        validateTimeline(node, diag);
        break;
      case ANIMATION_NODE_TYPES.PRESENTATION:
        validatePresentation(node, diag);
        break;
      case ANIMATION_NODE_TYPES.REVEAL_TRIGGER:
        validateReveal(node, diag);
        break;
    }
  }

  return diag;
}

// ─── Validators ───────────────────────────────────────────────────────────────

function validateAnimationDef(node, diag, seenNames) {
  if (!node.name) {
    diag.warn('E1101', 'Animation definition is missing a name');
  } else if (seenNames.has(node.name)) {
    diag.warn('E1102', `Duplicate animation name: "${node.name}"`, { name: node.name });
  } else {
    seenNames.add(node.name);
  }

  if (!isValidDuration(node.duration)) {
    diag.error('E1103', `Invalid duration "${node.duration}" in animation "${node.name}"`, { name: node.name });
  }
  if (node.delay != null && !isValidDuration(node.delay)) {
    diag.warn('E1104', `Invalid delay "${node.delay}" in animation "${node.name}"`, { name: node.name });
  }
  if (!isValidEasing(node.easing)) {
    diag.warn('E1105', `Unknown easing "${node.easing}" in animation "${node.name}"`, { name: node.name });
  }
  if (node.animType && !ANIMATION_TYPES.includes(node.animType)) {
    diag.warn('E1106', `Unknown animation type "${node.animType}"`, { name: node.name });
  }
}

function validateKeyframesDef(node, diag, seenNames) {
  if (!node.name) {
    diag.warn('E1110', 'Keyframes definition is missing a name');
  } else if (seenNames.has(node.name)) {
    diag.warn('E1111', `Duplicate keyframes name: "${node.name}"`, { name: node.name });
  } else {
    seenNames.add(node.name);
  }

  if (!node.steps || node.steps.length === 0) {
    // Only treat as informational if it matches a known built-in; otherwise
    // this is a real authoring mistake (an empty, unrecognized keyframes def).
    if (node.name && BUILTIN_KEYFRAMES[node.name]) {
      diag.info('E1112', `Keyframes "${node.name}" has no steps — will use built-in`, { name: node.name });
    } else {
      diag.warn('E1112', `Keyframes "${node.name}" has no steps and does not match a built-in`, { name: node.name });
    }
  } else {
    const percents = node.steps.map(s => s.percent);
    const hasZero  = percents.some(p => p === 0);
    const has100   = percents.some(p => p === 100);
    if (!hasZero)  diag.warn('E1113', `Keyframes "${node.name}" missing 0% step`, { name: node.name });
    if (!has100)   diag.warn('E1114', `Keyframes "${node.name}" missing 100% step`, { name: node.name });
    for (const step of node.steps) {
      if (step.percent < 0 || step.percent > 100) {
        diag.error('E1115', `Invalid keyframe percent ${step.percent}% in "${node.name}"`, { name: node.name });
      }
    }
  }
}

function validateTimeline(node, diag) {
  if (!node.steps || node.steps.length === 0) {
    diag.warn('E1120', 'Timeline has no steps');
    return;
  }
  for (const step of node.steps) {
    if (step.delay < 0) {
      diag.warn('E1121', `Timeline step has negative delay: ${step.delay}ms`);
    }
  }
}

function validatePresentation(node, diag) {
  if (!node.slides || node.slides.length === 0) {
    diag.warn('E1130', 'Presentation has no slides');
    return;
  }

  const slideIds = new Set();
  for (const slide of node.slides) {
    if (slide.id) {
      if (slideIds.has(slide.id)) {
        diag.warn('E1131', `Duplicate slide id: "${slide.id}"`, { id: slide.id });
      }
      slideIds.add(slide.id);
    }
    if (slide.slideType && !SLIDE_TYPES.includes(slide.slideType)) {
      diag.warn('E1132', `Unknown slide type "${slide.slideType}"`, { type: slide.slideType });
    }
  }

  const validRatios = ['16:9', '4:3', '1:1', '9:16'];
  if (!validRatios.includes(node.ratio)) {
    diag.warn('E1133', `Unusual aspect ratio "${node.ratio}" — standard values: 16:9, 4:3`);
  }
}

function validateReveal(node, diag) {
  if (!node.targetId) {
    diag.warn('E1140', 'Reveal trigger is missing a target ID');
  }
  if (node.threshold < 0 || node.threshold > 1) {
    diag.warn('E1141', `Reveal threshold ${node.threshold} should be between 0 and 1`);
  }
}
