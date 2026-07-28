/**
 * Zolto Theme Validator — Phase 15
 *
 * Validates theme token completeness, missing keys, and WCAG contrast levels.
 */

import { ThemeDiagnostics } from './diagnostics.js';
import { ThemeAccessibility } from './accessibility.js';
import { TOKEN_KEYS } from './tokens.js';

export class ThemeValidator {
  constructor() {
    this.a11y = new ThemeAccessibility();
  }

  validateTheme(themeNode) {
    const diag = new ThemeDiagnostics();
    if (!themeNode || !themeNode.tokens) {
      diag.error('E1501', 'Theme AST node or tokens object is null');
      return diag;
    }

    const tokens = themeNode.tokens;

    // 1. Token completeness check
    for (const key of Object.values(TOKEN_KEYS)) {
      if (!tokens[key]) {
        diag.warn('W1501', `Missing design token "${key}" in theme "${themeNode.name}"`);
      }
    }

    // 2. WCAG Contrast check (textPrimary vs bgCanvas)
    const fg = tokens[TOKEN_KEYS.TEXT_PRIMARY];
    const bg = tokens[TOKEN_KEYS.BG_CANVAS];

    if (fg && bg && fg.startsWith('#') && bg.startsWith('#')) {
      const ratio = this.a11y.getContrastRatio(fg, bg);
      if (ratio < 4.5) {
        diag.warn('W1502', `Low text contrast ratio (${ratio}:1) between ${fg} and ${bg}`);
      }
    }

    return diag;
  }
}
