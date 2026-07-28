/**
 * Zolto Keyframe CSS Generator — Phase 11
 *
 * Converts KeyframesDef AST nodes into @keyframes CSS rules,
 * handling validation and safe output.
 */

import { ANIMATION_NODE_TYPES } from './ast.js';

// ─── Safe CSS helpers ─────────────────────────────────────────────────────────

function safePropName(name) {
  return String(name || '').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
}

function safeValue(val) {
  // Strip characters that could escape a CSS value context
  return String(val || '').replace(/[{}]/g, '').trim();
}

// ─── Built-in keyframe patterns ───────────────────────────────────────────────

export const BUILTIN_KEYFRAMES = Object.freeze({
  'fadeIn':       '0% { opacity: 0; } 100% { opacity: 1; }',
  'fadeOut':      '0% { opacity: 1; } 100% { opacity: 0; }',
  'slideInUp':    '0% { opacity: 0; transform: translateY(16px); } 100% { opacity: 1; transform: translateY(0); }',
  'slideInDown':  '0% { opacity: 0; transform: translateY(-16px); } 100% { opacity: 1; transform: translateY(0); }',
  'slideInLeft':  '0% { opacity: 0; transform: translateX(-16px); } 100% { opacity: 1; transform: translateX(0); }',
  'slideInRight': '0% { opacity: 0; transform: translateX(16px); } 100% { opacity: 1; transform: translateX(0); }',
  'scaleIn':      '0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); }',
  'scaleOut':     '0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0.9); }',
  'popIn':        '0% { opacity: 0; transform: scale(0.9); } 60% { transform: scale(1.05); } 100% { opacity: 1; transform: scale(1); }',
  'bounceIn':     '0% { opacity: 0; transform: scale(0.3); } 50% { opacity: 1; transform: scale(1.1); } 70% { transform: scale(0.9); } 100% { transform: scale(1); }',
  'pulse':        '0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); }',
  'shake':        '0% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } 100% { transform: translateX(0); }',
  'wobble':       '0% { transform: rotate(0); } 25% { transform: rotate(-5deg); } 75% { transform: rotate(5deg); } 100% { transform: rotate(0); }',
  'flipInX':      '0% { opacity: 0; transform: perspective(400px) rotateX(90deg); } 100% { opacity: 1; transform: perspective(400px) rotateX(0); }',
  'glow':         '0% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); } 70% { box-shadow: 0 0 0 8px rgba(99,102,241,0); } 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }',
  'blur':         '0% { filter: blur(8px); opacity: 0; } 100% { filter: blur(0); opacity: 1; }',
  'collapse':     '0% { max-height: 1000px; opacity: 1; } 100% { max-height: 0; opacity: 0; }',
  'expand':       '0% { max-height: 0; opacity: 0; } 100% { max-height: 1000px; opacity: 1; }',
});

// ─── Keyframe step → CSS ──────────────────────────────────────────────────────

function keyframeStepToCSS(step) {
  if (!step || step.type !== ANIMATION_NODE_TYPES.KEYFRAME_STEP) return '';
  const pct = Math.min(100, Math.max(0, step.percent));
  const decls = (step.declarations || [])
    .map(([prop, val]) => `    ${safePropName(prop)}: ${safeValue(val)};`)
    .join('\n');
  return `  ${pct}% {\n${decls}\n  }`;
}

// ─── KeyframesDef → @keyframes CSS block ─────────────────────────────────────

/**
 * Convert a KeyframesDef AST node to a CSS @keyframes block string.
 * @param {object} node  KeyframesDef
 * @returns {string}
 */
export function keyframesToCSS(node) {
  if (!node || node.type !== ANIMATION_NODE_TYPES.KEYFRAMES_DEF) return '';
  const name = String(node.name || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!name) return '';

  // Use built-in if steps empty and name matches
  if ((!node.steps || node.steps.length === 0) && BUILTIN_KEYFRAMES[name]) {
    return `@keyframes ${name} {\n  ${BUILTIN_KEYFRAMES[name]}\n}`;
  }

  const steps = (node.steps || []).map(keyframeStepToCSS).filter(Boolean).join('\n');
  return `@keyframes ${name} {\n${steps}\n}`;
}

/**
 * Generate CSS @keyframes for a named built-in animation type.
 * @param {string} animType
 * @param {string} customName
 * @returns {string}
 */
export function builtinKeyframesCSS(animType, customName) {
  const mapped = {
    'fade':     'fadeIn',
    'slide':    'slideInUp',
    'scale':    'scaleIn',
    'rotate':   'wobble',
    'flip':     'flipInX',
    'blur':     'blur',
    'bounce':   'bounceIn',
    'pulse':    'pulse',
    'shake':    'shake',
    'wobble':   'wobble',
    'glow':     'glow',
    'expand':   'expand',
    'collapse': 'collapse',
    'stagger':  'fadeIn',
    'morph':    'scaleIn',
  };
  const key = mapped[animType] || 'fadeIn';
  const name = customName || key;
  const body = BUILTIN_KEYFRAMES[key] || BUILTIN_KEYFRAMES['fadeIn'];
  return `@keyframes ${name} {\n  ${body}\n}`;
}
