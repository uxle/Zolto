/**
 * Zolto Universal Theme Engine — Phase 15
 *
 * Manages theme registry, token resolution, theme inheritance,
 * component-level overrides, and CSS custom property string generation.
 */

import { createTheme } from './ast.js';
import { LIGHT_PALETTE, DARK_PALETTE, EYE_PROTECTION_PALETTE } from './palettes.js';

export class ThemeEngine {
  constructor() {
    // Map of themeName -> Theme AST node
    this.themes = new Map();
    this.activeThemeName = 'light';

    // Register 3 default built-in themes
    this.registerTheme(createTheme('light', 'light', LIGHT_PALETTE));
    this.registerTheme(createTheme('dark', 'dark', DARK_PALETTE));
    this.registerTheme(createTheme('eyeprotection', 'eyeprotection', EYE_PROTECTION_PALETTE));
  }

  registerTheme(themeNode) {
    if (!themeNode || !themeNode.name) return;
    this.themes.set(String(themeNode.name).toLowerCase(), themeNode);
  }

  getTheme(name) {
    const cleanName = String(name || 'light').toLowerCase();
    return this.themes.get(cleanName) || this.themes.get('light');
  }

  setActiveTheme(name) {
    const theme = this.getTheme(name);
    if (theme) {
      this.activeThemeName = theme.name;
    }
    return this.activeThemeName;
  }

  getActiveTheme() {
    return this.getTheme(this.activeThemeName);
  }

  getToken(key, themeName = null) {
    const theme = themeName ? this.getTheme(themeName) : this.getActiveTheme();
    return theme.tokens[key] || LIGHT_PALETTE[key] || null;
  }

  generateCssCustomProperties(themeName = null) {
    const theme = themeName ? this.getTheme(themeName) : this.getActiveTheme();
    const props = [];
    for (const [k, v] of Object.entries(theme.tokens)) {
      props.push(`  ${k}: ${v};`);
    }
    return `:root {\n${props.join('\n')}\n}`;
  }
}
