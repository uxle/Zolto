/**
 * Zolto Custom Renderer Registry — Phase 12
 *
 * Allows plugins to register target-specific renderers for custom AST node types
 * (targets: HTML, SVG, PDF, JSON, Plain Text).
 */

import { createRegisteredRenderer } from './ast.js';

export class RendererRegistry {
  constructor() {
    // Map of "target:nodeType" -> RegisteredRenderer AST node
    this._renderers = new Map();
  }

  /**
   * Register a custom renderer for an AST node type and target output format.
   * @param {string} target Output format ('html', 'svg', 'json', 'text', 'pdf')
   * @param {string} nodeType AST node type name
   * @param {Function} renderFn (node, options) => string|object
   * @param {object} [opts]
   */
  registerRenderer(target, nodeType, renderFn, opts = {}) {
    if (!target || !nodeType || typeof renderFn !== 'function') return;
    const key = `${String(target).toLowerCase()}:${String(nodeType)}`;
    const entry = createRegisteredRenderer(target, nodeType, renderFn, opts);
    this._renderers.set(key, entry);
  }

  /**
   * Check if a renderer is registered.
   * @param {string} target
   * @param {string} nodeType
   * @returns {boolean}
   */
  hasRenderer(target, nodeType) {
    const key = `${String(target || 'html').toLowerCase()}:${String(nodeType)}`;
    return this._renderers.has(key);
  }

  /**
   * Render an AST node using a registered custom renderer.
   * @param {string} target
   * @param {object} node AST node
   * @param {object} [options]
   * @returns {any}
   */
  renderNode(target, node, options = {}) {
    if (!node || !node.type) return null;
    const key = `${String(target || 'html').toLowerCase()}:${String(node.type)}`;
    const entry = this._renderers.get(key);
    if (!entry || typeof entry.renderFn !== 'function') return null;

    try {
      return entry.renderFn(node, options);
    } catch (err) {
      return null;
    }
  }

  /**
   * Unregister all renderers registered by a specific plugin.
   * @param {string} pluginName
   */
  unregisterPluginRenderers(pluginName) {
    if (!pluginName) return;
    const target = String(pluginName);
    for (const [key, entry] of this._renderers.entries()) {
      if (entry.pluginName === target) {
        this._renderers.delete(key);
      }
    }
  }

  /**
   * Clear all registered renderers.
   */
  clear() {
    this._renderers.clear();
  }
}
