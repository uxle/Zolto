/**
 * Zolto Theme Accessibility & Contrast Engine — Phase 15
 *
 * Computes WCAG 2.1 relative luminance and contrast ratios between text and background colors,
 * ensuring AAA compliance (7:1 for normal text, 4.5:1 for large text).
 */

import { createAccessibilityThemePreset } from './ast.js';

export class ThemeAccessibility {
  /**
   * Parse hex color to [r, g, b] (0..255).
   * @param {string} hex
   * @returns {[number, number, number]}
   */
  parseHex(hex = '#000000') {
    const s = String(hex || '').trim();
    const rgbMatch = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(s);
    if (rgbMatch) {
      return [
        Math.min(255, Math.max(0, parseInt(rgbMatch[1], 10))),
        Math.min(255, Math.max(0, parseInt(rgbMatch[2], 10))),
        Math.min(255, Math.max(0, parseInt(rgbMatch[3], 10))),
      ];
    }

    const clean = s.replace('#', '').trim();
    if (clean.length === 3) {
      return [
        parseInt(clean[0] + clean[0], 16) || 0,
        parseInt(clean[1] + clean[1], 16) || 0,
        parseInt(clean[2] + clean[2], 16) || 0,
      ];
    }
    if (clean.length === 6) {
      return [
        parseInt(clean.slice(0, 2), 16) || 0,
        parseInt(clean.slice(2, 4), 16) || 0,
        parseInt(clean.slice(4, 6), 16) || 0,
      ];
    }
    return [0, 0, 0];
  }

  /**
   * Compute relative luminance (WCAG 2.1 definition).
   */
  getLuminance(hex) {
    const [r, g, b] = this.parseHex(hex).map(v => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Compute contrast ratio between two hex colors.
   * @returns {number} Contrast ratio (1..21)
   */
  getContrastRatio(fgHex, bgHex) {
    const l1 = this.getLuminance(fgHex);
    const l2 = this.getLuminance(bgHex);
    const max = Math.max(l1, l2);
    const min = Math.min(l1, l2);
    return Number(((max + 0.05) / (min + 0.05)).toFixed(2));
  }

  /**
   * Check if contrast ratio meets WCAG AAA standards.
   */
  isWcagAaa(fgHex, bgHex, isLargeText = false) {
    const ratio = this.getContrastRatio(fgHex, bgHex);
    return isLargeText ? ratio >= 4.5 : ratio >= 7.0;
  }

  createPreset(name = 'default', options = {}) {
    return createAccessibilityThemePreset(name, options);
  }
}
