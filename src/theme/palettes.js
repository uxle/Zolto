/**
 * Zolto Built-in Theme Palettes — Phase 15
 *
 * Implements 3 core built-in theme palettes:
 *   1. Light Theme — Crisp, daytime document theme
 *   2. Dark Theme — Glare-reduced dark environment theme
 *   3. Eye Protection Mode — Warm amber tones, soft contrast, reduced blue light feel for long reading sessions
 */

import { TOKEN_KEYS } from './tokens.js';

export const LIGHT_PALETTE = Object.freeze({
  [TOKEN_KEYS.BG_CANVAS]:        '#ffffff',
  [TOKEN_KEYS.BG_SURFACE]:       '#f8fafc',
  [TOKEN_KEYS.BG_SURFACE_HOVER]: '#f1f5f9',
  [TOKEN_KEYS.BG_MUTED]:         '#e2e8f0',
  [TOKEN_KEYS.TEXT_PRIMARY]:     '#0f172a',
  [TOKEN_KEYS.TEXT_SECONDARY]:   '#475569',
  [TOKEN_KEYS.TEXT_MUTED]:       '#64748b',
  [TOKEN_KEYS.TEXT_INVERSE]:     '#ffffff',
  [TOKEN_KEYS.BORDER_COLOR]:     '#cbd5e1',
  [TOKEN_KEYS.BORDER_FOCUS]:     '#6366f1',
  [TOKEN_KEYS.ACCENT_PRIMARY]:   '#4f46e5',
  [TOKEN_KEYS.ACCENT_SECONDARY]: '#06b6d4',
  [TOKEN_KEYS.SUCCESS]:          '#16a34a',
  [TOKEN_KEYS.WARNING]:          '#d97706',
  [TOKEN_KEYS.DANGER]:           '#dc2626',
  [TOKEN_KEYS.INFO]:              '#2563eb',
  [TOKEN_KEYS.FONT_SANS]:        'system-ui, -apple-system, sans-serif',
  [TOKEN_KEYS.FONT_MONO]:        'ui-monospace, SFMono-Regular, monospace',
  [TOKEN_KEYS.FONT_SERIF]:       'Georgia, Cambria, serif',
  [TOKEN_KEYS.FONT_MATH]:        'KaTeX_Main, Times New Roman, serif',
  [TOKEN_KEYS.SPACE_XS]:         '0.25rem',
  [TOKEN_KEYS.SPACE_SM]:         '0.5rem',
  [TOKEN_KEYS.SPACE_MD]:         '1rem',
  [TOKEN_KEYS.SPACE_LG]:         '1.5rem',
  [TOKEN_KEYS.SPACE_XL]:         '2rem',
  [TOKEN_KEYS.RADIUS_SM]:        '0.25rem',
  [TOKEN_KEYS.RADIUS_MD]:        '0.5rem',
  [TOKEN_KEYS.RADIUS_LG]:        '0.75rem',
  [TOKEN_KEYS.RADIUS_FULL]:      '9999px',
  [TOKEN_KEYS.SHADOW_SM]:        '0 1px 2px 0 rgba(0,0,0,0.05)',
  [TOKEN_KEYS.SHADOW_MD]:        '0 4px 6px -1px rgba(0,0,0,0.1)',
  [TOKEN_KEYS.SHADOW_LG]:        '0 10px 15px -3px rgba(0,0,0,0.1)',
  [TOKEN_KEYS.MOTION_DURATION]:  '200ms',
  [TOKEN_KEYS.MOTION_EASING]:    'ease-out',
});

export const DARK_PALETTE = Object.freeze({
  ...LIGHT_PALETTE,
  [TOKEN_KEYS.BG_CANVAS]:        '#0f172a',
  [TOKEN_KEYS.BG_SURFACE]:       '#1e293b',
  [TOKEN_KEYS.BG_SURFACE_HOVER]: '#334155',
  [TOKEN_KEYS.BG_MUTED]:         '#475569',
  [TOKEN_KEYS.TEXT_PRIMARY]:     '#f8fafc',
  [TOKEN_KEYS.TEXT_SECONDARY]:   '#cbd5e1',
  [TOKEN_KEYS.TEXT_MUTED]:       '#94a3b8',
  [TOKEN_KEYS.TEXT_INVERSE]:     '#0f172a',
  [TOKEN_KEYS.BORDER_COLOR]:     '#334155',
  [TOKEN_KEYS.BORDER_FOCUS]:     '#818cf8',
  [TOKEN_KEYS.ACCENT_PRIMARY]:   '#6366f1',
  [TOKEN_KEYS.ACCENT_SECONDARY]: '#22d3ee',
  [TOKEN_KEYS.SUCCESS]:          '#22c55e',
  [TOKEN_KEYS.WARNING]:          '#f59e0b',
  [TOKEN_KEYS.DANGER]:           '#ef4444',
  [TOKEN_KEYS.INFO]:              '#3b82f6',
  [TOKEN_KEYS.SHADOW_SM]:        '0 1px 2px 0 rgba(0,0,0,0.5)',
  [TOKEN_KEYS.SHADOW_MD]:        '0 4px 6px -1px rgba(0,0,0,0.6)',
  [TOKEN_KEYS.SHADOW_LG]:        '0 10px 15px -3px rgba(0,0,0,0.7)',
});

export const EYE_PROTECTION_PALETTE = Object.freeze({
  ...LIGHT_PALETTE,
  [TOKEN_KEYS.BG_CANVAS]:        '#fbf7ee',
  [TOKEN_KEYS.BG_SURFACE]:       '#f3ebd8',
  [TOKEN_KEYS.BG_SURFACE_HOVER]: '#e8ddc4',
  [TOKEN_KEYS.BG_MUTED]:         '#dcd0b2',
  [TOKEN_KEYS.TEXT_PRIMARY]:     '#2d271e',
  [TOKEN_KEYS.TEXT_SECONDARY]:   '#5c4f3d',
  [TOKEN_KEYS.TEXT_MUTED]:       '#7a6a54',
  [TOKEN_KEYS.TEXT_INVERSE]:     '#fbf7ee',
  [TOKEN_KEYS.BORDER_COLOR]:     '#dcd0b2',
  [TOKEN_KEYS.BORDER_FOCUS]:     '#d97706',
  [TOKEN_KEYS.ACCENT_PRIMARY]:   '#b45309',
  [TOKEN_KEYS.ACCENT_SECONDARY]: '#0d9488',
  [TOKEN_KEYS.SUCCESS]:          '#15803d',
  [TOKEN_KEYS.WARNING]:          '#b45309',
  [TOKEN_KEYS.DANGER]:           '#b91c1c',
  [TOKEN_KEYS.INFO]:              '#1d4ed8',
  [TOKEN_KEYS.SHADOW_SM]:        '0 1px 2px 0 rgba(45,39,30,0.08)',
  [TOKEN_KEYS.SHADOW_MD]:        '0 4px 6px -1px rgba(45,39,30,0.12)',
  [TOKEN_KEYS.SHADOW_LG]:        '0 10px 15px -3px rgba(45,39,30,0.15)',
});
