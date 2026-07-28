/**
 * Zolto Custom Directive Registry — Phase 12
 *
 * Allows plugins to register custom block or inline directives (e.g. `@todo`).
 */

import { createRegisteredDirective } from './ast.js';

export class DirectiveRegistry {
  constructor() {
    // Map of directiveName -> RegisteredDirective AST node
    this._directives = new Map();
  }

  /**
   * Register a custom directive.
   * @param {string} name
   * @param {Function} handler  (tok, attrs, ctx) => ASTNode
   * @param {object} [opts]
   */
  registerDirective(name, handler, opts = {}) {
    if (!name || typeof handler !== 'function') return;
    const cleanName = String(name).toLowerCase().replace(/^@/, '');
    const entry = createRegisteredDirective(cleanName, handler, opts);
    this._directives.set(cleanName, entry);
  }

  /**
   * Check if a directive is registered.
   * @param {string} name
   * @returns {boolean}
   */
  hasDirective(name) {
    if (!name) return false;
    return this._directives.has(String(name).toLowerCase().replace(/^@/, ''));
  }

  /**
   * Get custom directive entry.
   * @param {string} name
   * @returns {object|null}
   */
  getDirective(name) {
    if (!name) return null;
    return this._directives.get(String(name).toLowerCase().replace(/^@/, '')) || null;
  }

  /**
   * Parse a custom directive token using its registered handler.
   * @param {{ name: string, attrStr: string, body: string }} tok
   * @param {object} attrs Parsed attribute object
   * @param {object} ctx Reparse context
   * @returns {object|null} AST Node
   */
  parseCustomDirective(tok, attrs, ctx) {
    const entry = this.getDirective(tok.name);
    if (!entry || typeof entry.handler !== 'function') return null;
    try {
      return entry.handler(tok, attrs, ctx);
    } catch (err) {
      return null;
    }
  }

  /**
   * Unregister all directives registered by a specific plugin.
   * @param {string} pluginName
   */
  unregisterPluginDirectives(pluginName) {
    if (!pluginName) return;
    const target = String(pluginName);
    for (const [name, entry] of this._directives.entries()) {
      if (entry.pluginName === target) {
        this._directives.delete(name);
      }
    }
  }

  /**
   * List all registered directive names.
   * @returns {string[]}
   */
  getRegisteredNames() {
    return Array.from(this._directives.keys());
  }

  /**
   * Clear all custom directives.
   */
  clear() {
    this._directives.clear();
  }
}
