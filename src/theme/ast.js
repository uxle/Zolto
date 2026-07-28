/**
 * Zolto Universal Theme AST Node Factories — Phase 15
 *
 * Monomorphic AST node factories for theme definitions, tokens, palettes,
 * variants, overrides, theme packages, theme state, and accessibility presets.
 *
 * Contract:
 *   - All fields are present on every node (no missing keys)
 *   - Missing optional values use null, not undefined
 *   - Collections use arrays, never null
 */

export const THEME_NODE_TYPES = Object.freeze({
  THEME:                       'theme',
  THEME_TOKEN:                 'theme_token',
  THEME_PALETTE:               'theme_palette',
  THEME_VARIANT:               'theme_variant',
  THEME_OVERRIDE:              'theme_override',
  THEME_PACKAGE:               'theme_package',
  THEME_STATE:                 'theme_state',
  ACCESSIBILITY_THEME_PRESET:  'accessibility_theme_preset',
});

// ─── Node Factories ───────────────────────────────────────────────────────────

export function createTheme(name, mode = 'light', tokens = {}, meta = {}) {
  return {
    type:        THEME_NODE_TYPES.THEME,
    name:        String(name || 'light'),
    mode:        String(mode || 'light'), // 'light', 'dark', 'eyeprotection', 'custom'
    tokens:      tokens && typeof tokens === 'object' ? tokens : {},
    inheritedFrom: meta.inheritedFrom ? String(meta.inheritedFrom) : null,
    author:      meta.author ? String(meta.author) : null,
    version:     meta.version ? String(meta.version) : '1.0.0',
  };
}

export function createThemeToken(key, value, category = 'color') {
  return {
    type:     THEME_NODE_TYPES.THEME_TOKEN,
    key:      String(key || ''),
    value:    String(value || ''),
    category: String(category || 'color'), // 'color', 'surface', 'typography', 'spacing', 'radius', 'shadow', 'motion'
  };
}

export function createThemePalette(name, colors = {}) {
  return {
    type:   THEME_NODE_TYPES.THEME_PALETTE,
    name:   String(name || ''),
    colors: colors && typeof colors === 'object' ? colors : {},
  };
}

export function createThemeVariant(name, baseTheme, overrides = {}) {
  return {
    type:      THEME_NODE_TYPES.THEME_VARIANT,
    name:      String(name || ''),
    baseTheme: String(baseTheme || 'light'),
    overrides: overrides && typeof overrides === 'object' ? overrides : {},
  };
}

export function createThemeOverride(targetSelector, tokens = {}) {
  return {
    type:           THEME_NODE_TYPES.THEME_OVERRIDE,
    targetSelector: String(targetSelector || 'root'),
    tokens:         tokens && typeof tokens === 'object' ? tokens : {},
  };
}

export function createThemePackage(name, version = '1.0.0', themes = [], metadata = {}) {
  return {
    type:      THEME_NODE_TYPES.THEME_PACKAGE,
    name:      String(name || ''),
    version:   String(version || '1.0.0'),
    themes:    Array.isArray(themes) ? themes : [],
    metadata:  metadata && typeof metadata === 'object' ? metadata : {},
    createdAt: Date.now(),
  };
}

export function createThemeState(activeThemeName = 'light', mode = 'light') {
  return {
    type:            THEME_NODE_TYPES.THEME_STATE,
    activeThemeName: String(activeThemeName || 'light'),
    mode:            String(mode || 'light'),
    lastUpdated:     Date.now(),
  };
}

export function createAccessibilityThemePreset(name, options = {}) {
  return {
    type:               THEME_NODE_TYPES.ACCESSIBILITY_THEME_PRESET,
    name:               String(name || 'default'),
    wcagContrastTarget: options.wcagContrastTarget ? String(options.wcagContrastTarget) : 'AAA',
    reducedMotion:      options.reducedMotion === true,
    largeText:          options.largeText === true,
    dyslexicFont:       options.dyslexicFont === true,
  };
}

// ─── Type Guard ───────────────────────────────────────────────────────────────

const _ALL_THEME_TYPES = new Set(Object.values(THEME_NODE_TYPES));

export function isThemeNode(node) {
  return node != null && typeof node === 'object' && _ALL_THEME_TYPES.has(node.type);
}
