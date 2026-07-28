/**
 * Zolto Plugin API & Extension Subsystem Entry Point — Phase 12
 *
 * Public API façade for the plugin and extension engine.
 */

import { parsePluginManifestBlock, parsePluginManifestObject } from './manifest.js';
import { validatePluginManifest, checkVersionCompatibility } from './validator.js';
import { PluginRegistry, defaultRegistry } from './registry.js';
import { PluginSandbox } from './sandbox.js';
import { createPluginApi } from './api.js';
import { PLUGIN_NODE_TYPES, isPluginNode } from './ast.js';

export {
  PLUGIN_NODE_TYPES,
  isPluginNode,
  PluginRegistry,
  defaultRegistry,
  PluginSandbox,
  createPluginApi,
  validatePluginManifest,
  checkVersionCompatibility,
  parsePluginManifestBlock,
  parsePluginManifestObject,
};

/**
 * Parse raw plugin manifest block text into a PluginManifest AST node.
 * @param {string} src
 * @returns {{ manifest: object, diagnostics: import('./diagnostics.js').PluginDiagnostics }}
 */
export function parsePlugin(src) {
  const manifest = parsePluginManifestBlock(src);
  const diagnostics = validatePluginManifest(manifest);
  return { manifest, diagnostics };
}

/**
 * Render a plugin AST node to HTML string.
 * @param {object} node
 * @returns {string}
 */
export function renderPluginNode(node) {
  if (!node || typeof node !== 'object') return '';
  if (node.type === PLUGIN_NODE_TYPES.PLUGIN_MANIFEST) {
    return `<div class="zl-plugin-manifest" data-plugin-name="${node.name}" data-plugin-version="${node.version}">\n<h3>${node.name} v${node.version}</h3>\n${node.description ? `<p>${node.description}</p>` : ''}\n</div>`;
  }
  return '';
}

/**
 * Validate a plugin manifest node.
 * @param {object} manifest
 * @returns {import('./diagnostics.js').PluginDiagnostics}
 */
export function validatePlugin(manifest) {
  return validatePluginManifest(manifest);
}

/**
 * Helper to check if an array of nodes contains plugin nodes.
 * @param {object[]} nodes
 * @returns {boolean}
 */
export function hasPluginNodes(nodes) {
  return Array.isArray(nodes) && nodes.some(n => isPluginNode(n));
}
