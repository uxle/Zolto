/**
 * Zolto Animation & Presentation Subsystem Entry Point — Phase 11
 *
 * Public API façade for the animation and presentation engine.
 *
 * Usage:
 *   import { parseAnimation, renderAnimation, validateAnimation } from './src/animation/index.js';
 */

import { parseAnimationSource } from './parser.js';
import { renderAnimationNode, generateSlideOutline, hasAnimationNodes } from './renderer.js';
import { validateAnimationNodes } from './validator.js';
import { ANIMATION_NODE_TYPES, isAnimationNode } from './ast.js';
import { ANIMATION_CSS } from './styles.js';
import { isValidEasing, isValidDuration, resolveEasing, parseDuration } from './easing.js';
import { keyframesToCSS, builtinKeyframesCSS, BUILTIN_KEYFRAMES } from './keyframes.js';

export {
  ANIMATION_CSS,
  ANIMATION_NODE_TYPES,
  isAnimationNode,
  hasAnimationNodes,
  generateSlideOutline,
  renderAnimationNode,
  isValidEasing,
  isValidDuration,
  resolveEasing,
  parseDuration,
  keyframesToCSS,
  builtinKeyframesCSS,
  BUILTIN_KEYFRAMES,
};


/**
 * Parse raw animation block content to an array of AST nodes.
 *
 * @param {string}  src          Raw block content (supports multiple blocks)
 * @param {object}  [options]
 * @param {string}  [options.tag]     Directive tag: 'animate'|'keyframes'|'timeline'|'presentation'
 * @param {string}  [options.header]  Full header line (e.g. "@animate name=\"x\" duration=300")
 * @returns {{ nodes: object[], diagnostics: import('./diagnostics.js').AnimationDiagnostics }}
 */
export function parseAnimation(src, options = {}) {
  const nodes = parseAnimationSource(src, options.tag, options.header);
  const diagnostics = validateAnimationNodes(nodes);
  return { nodes, diagnostics };
}

/**
 * Render an animation AST node (or array of nodes) to HTML/CSS.
 * @param {object|object[]} node
 * @param {object} [opts]
 * @returns {string}
 */
export function renderAnimation(node, opts = {}) {
  if (Array.isArray(node)) {
    return node.map(n => renderAnimationNode(n, opts)).filter(Boolean).join('\n');
  }
  return renderAnimationNode(node, opts);
}

/**
 * Validate an array of animation AST nodes.
 * @param {object[]} nodes
 * @returns {import('./diagnostics.js').AnimationDiagnostics}
 */
export function validateAnimation(nodes) {
  return validateAnimationNodes(nodes || []);
}
