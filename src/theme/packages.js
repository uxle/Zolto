/**
 * Zolto Theme Package Builder — Phase 15
 *
 * Bundles themes, palettes, and typography presets into portable `.zltheme` package AST nodes.
 */

import { createThemePackage } from './ast.js';

export class ThemePackageBuilder {
  /**
   * Build a theme package archive AST node.
   * @param {string} name Package name
   * @param {string} version Version string
   * @param {Array<object>} themes List of Theme AST nodes
   * @param {object} [metadata]
   * @returns {object} ThemePackage AST node
   */
  buildPackage(name, version = '1.0.0', themes = [], metadata = {}) {
    return createThemePackage(name, version, themes, metadata);
  }
}
