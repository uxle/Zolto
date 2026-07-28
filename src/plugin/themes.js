/**
 * Zolto Theme Extension Engine — Phase 12
 *
 * Theme registration system supporting design tokens, typography, component styles,
 * and CSS custom property (`--zl-custom-*`) generation.
 */

import { createRegisteredTheme } from './ast.js';

export class ThemeRegistry {
  constructor() {
    // Map of themeName -> RegisteredTheme AST node
    this._themes = new Map();
  }

  /**
   * Register a custom theme.
   * @param {string} name
   * @param {Record<string, string>} tokens Token key-value pairs e.g. { '--zl-theme-primary': '#6366f1' }
   * @param {object} [opts]
   */
  registerTheme(name, tokens = {}, opts = {}) {
    if (!name) return;
    const cleanName = String(name).toLowerCase();
    const entry = createRegisteredTheme(cleanName, tokens, opts);
    this._themes.set(cleanName, entry);
  }

  /**
   * Check if a theme is registered.
   * @param {string} name
   * @returns {boolean}
   */
  hasTheme(name) {
    if (!name) return false;
    return this._themes.has(String(name).toLowerCase());
  }

  /**
   * Get theme node.
   * @param {string} name
   * @returns {object|null}
   */
  getTheme(name) {
    if (!name) return null;
    return this._themes.get(String(name).toLowerCase()) || null;
  }

  /**
   * Generate CSS custom properties string for a theme.
   * @param {string} name
   * @returns {string}
   */
  generateThemeCSS(name) {
    const theme = this.getTheme(name);
    if (!theme) return '';

    const props = [];
    if (theme.tokens && typeof theme.tokens === 'object') {
      for (const [key, val] of Object.entries(theme.tokens)) {
        const cssVar = key.startsWith('--') ? key : `--zl-theme-${key}`;
        props.push(`  ${cssVar}: ${val};`);
      }
    }

    const body = props.join('\n');
    const extraStyles = theme.styles ? `\n${theme.styles}` : '';
    return `:root[data-zl-theme="${theme.name}"] {\n${body}\n}${extraStyles}`;
  }

  /**
   * Unregister themes registered by a specific plugin.
   * @param {string} pluginName
   */
  unregisterPluginThemes(pluginName) {
    if (!pluginName) return;
    const target = String(pluginName);
    for (const [name, entry] of this._themes.entries()) {
      if (entry.pluginName === target) {
        this._themes.delete(name);
      }
    }
  }

  /**
   * Clear all registered themes.
   */
  clear() {
    this._themes.clear();
  }
}
