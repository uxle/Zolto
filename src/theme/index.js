/**
 * Zolto Universal Theme & Design System Subsystem Entry Point — Phase 15
 *
 * Public API façade for design tokens, built-in palettes (Light, Dark, Eye Protection),
 * theme engine, runtime theme switching, package builder, and WCAG accessibility validator.
 */

import { ThemeEngine } from './engine.js';
import { ThemeSwitcher } from './switching.js';
import { ThemePackageBuilder } from './packages.js';
import { ThemeAccessibility } from './accessibility.js';
import { ThemeValidator } from './validator.js';
import { TOKEN_KEYS } from './tokens.js';
import { LIGHT_PALETTE, DARK_PALETTE, EYE_PROTECTION_PALETTE } from './palettes.js';
import { THEME_NODE_TYPES, isThemeNode } from './ast.js';

export {
  THEME_NODE_TYPES,
  isThemeNode,
  TOKEN_KEYS,
  LIGHT_PALETTE,
  DARK_PALETTE,
  EYE_PROTECTION_PALETTE,
  ThemeEngine,
  ThemeSwitcher,
  ThemePackageBuilder,
  ThemeAccessibility,
  ThemeValidator,
};

export function createThemeEngine() {
  return new ThemeEngine();
}

export function getThemeTokens(themeName = 'light') {
  const engine = new ThemeEngine();
  return engine.getTheme(themeName).tokens;
}

export function applyTheme(themeName = 'light') {
  const engine = new ThemeEngine();
  const switcher = new ThemeSwitcher(engine);
  return switcher.switchTheme(themeName);
}

export function buildThemePackage(name, version = '1.0.0', themes = []) {
  const builder = new ThemePackageBuilder();
  return builder.buildPackage(name, version, themes);
}

export function validateThemeContrast(fgHex, bgHex) {
  const a11y = new ThemeAccessibility();
  return a11y.getContrastRatio(fgHex, bgHex);
}
