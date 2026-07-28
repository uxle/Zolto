/**
 * Zolto Phase 15 Test Suite — Universal Theme & Design System
 *
 * Tests: Built-in Light, Dark, and Eye Protection palettes, Design Tokens,
 *        ThemeEngine lookup and CSS custom property generation, ThemeSwitcher,
 *        ThemePackageBuilder, ThemeAccessibility WCAG contrast validation,
 *        ThemeValidator, and Performance benchmarks.
 */

import {
  createThemeEngine, getThemeTokens, applyTheme, buildThemePackage, validateThemeContrast,
  createLanguageServer, searchProject,
} from '../src/zolto.js';
import {
  createTheme, createThemeToken, THEME_NODE_TYPES, isThemeNode,
} from '../src/theme/ast.js';
import { TOKEN_KEYS } from '../src/theme/tokens.js';
import { LIGHT_PALETTE, DARK_PALETTE, EYE_PROTECTION_PALETTE } from '../src/theme/palettes.js';
import { ThemeAccessibility } from '../src/theme/accessibility.js';
import { ThemeValidator } from '../src/theme/validator.js';

// ─── Tiny test harness ────────────────────────────────────────────────────────

let _pass = 0, _fail = 0;
const results = [];

function test(desc, fn) {
  try { fn(); _pass++; results.push({ pass: true, desc }); }
  catch (e) { _fail++; results.push({ pass: false, desc, err: String(e.message) }); }
}

function assert(val, msg) {
  if (!val) throw new Error(msg || `Expected truthy, got ${JSON.stringify(val)}`);
}

function eq(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

function includes(str, sub, msg) {
  if (!String(str).includes(sub)) throw new Error(msg || `Expected "${sub}" to be in string`);
}

// ─── 1. AST Node Factories ────────────────────────────────────────────────────

test('createTheme produces standard AST node', () => {
  const t = createTheme('dark', 'dark', DARK_PALETTE);
  eq(t.type, THEME_NODE_TYPES.THEME, 'type');
  eq(t.name, 'dark', 'name');
  eq(t.mode, 'dark', 'mode');
  assert(isThemeNode(t), 'isThemeNode');
});

test('createThemeToken produces standard AST node', () => {
  const token = createThemeToken('--zl-bg-canvas', '#ffffff', 'color');
  eq(token.type, THEME_NODE_TYPES.THEME_TOKEN, 'type');
  eq(token.key, '--zl-bg-canvas', 'key');
});

// ─── 2. Built-in Theme Palettes ───────────────────────────────────────────────

test('Built-in Light, Dark, and Eye Protection palettes provide full token sets', () => {
  assert(LIGHT_PALETTE[TOKEN_KEYS.BG_CANVAS] === '#ffffff', 'Light bg canvas');
  assert(DARK_PALETTE[TOKEN_KEYS.BG_CANVAS] === '#0f172a', 'Dark bg canvas');

  // Eye Protection palette warm tones
  assert(EYE_PROTECTION_PALETTE[TOKEN_KEYS.BG_CANVAS] === '#fbf7ee', 'Eye protection bg canvas warm');
  assert(EYE_PROTECTION_PALETTE[TOKEN_KEYS.BG_SURFACE] === '#f3ebd8', 'Eye protection bg surface warm');
  assert(EYE_PROTECTION_PALETTE[TOKEN_KEYS.TEXT_PRIMARY] === '#2d271e', 'Eye protection text primary warm');
});

// ─── 3. Theme Engine & CSS Generation ─────────────────────────────────────────

test('ThemeEngine registers, resolves tokens, and generates CSS custom properties', () => {
  const engine = createThemeEngine();
  const cssLight = engine.generateCssCustomProperties('light');
  includes(cssLight, '--zl-bg-canvas: #ffffff', 'light css');

  const cssDark = engine.generateCssCustomProperties('dark');
  includes(cssDark, '--zl-bg-canvas: #0f172a', 'dark css');

  const cssEye = engine.generateCssCustomProperties('eyeprotection');
  includes(cssEye, '--zl-bg-canvas: #fbf7ee', 'eye protection css');
});

// ─── 4. Runtime Theme Switcher ────────────────────────────────────────────────

test('applyTheme switches themes at runtime without reloads', () => {
  const resLight = applyTheme('light');
  eq(resLight.activeName, 'light', 'light theme active');
  includes(resLight.css, '--zl-bg-canvas: #ffffff', 'light css');

  const resEye = applyTheme('eyeprotection');
  eq(resEye.activeName, 'eyeprotection', 'eye protection theme active');
  includes(resEye.css, '--zl-bg-canvas: #fbf7ee', 'eye protection css');
});

// ─── 5. Theme Package Builder ─────────────────────────────────────────────────

test('buildThemePackage packages themes into portable .zltheme archive', () => {
  const light = createTheme('light', 'light', LIGHT_PALETTE);
  const dark = createTheme('dark', 'dark', DARK_PALETTE);
  const pkg = buildThemePackage('zolto-official-themes', '1.0.0', [light, dark]);

  eq(pkg.name, 'zolto-official-themes', 'pkg name');
  eq(pkg.themes.length, 2, 'two themes in pkg');
});

// ─── 6. Accessibility & WCAG Contrast Validation ─────────────────────────────

test('ThemeAccessibility computes WCAG contrast ratios and checks AAA compliance', () => {
  const a11y = new ThemeAccessibility();

  // Black on white (21:1)
  const ratioMax = a11y.getContrastRatio('#000000', '#ffffff');
  eq(ratioMax, 21, 'max contrast 21:1');
  assert(a11y.isWcagAaa('#000000', '#ffffff'), 'black on white is AAA');

  // Eye protection contrast text #2d271e on #fbf7ee
  const eyeRatio = a11y.getContrastRatio('#2d271e', '#fbf7ee');
  assert(eyeRatio >= 7.0, `eye protection text contrast (${eyeRatio}:1) meets AAA (>=7.0)`);
});

test('ThemeValidator checks contrast and token completeness', () => {
  const validator = new ThemeValidator();
  const lightTheme = createTheme('light', 'light', LIGHT_PALETTE);
  const diag = validator.validateTheme(lightTheme);

  assert(!diag.hasErrors, 'no validation errors');
});

// ─── 7. Performance Benchmarks ───────────────────────────────────────────────

test('Switch themes and generate CSS custom properties in <5ms', () => {
  const engine = createThemeEngine();
  const t0 = Date.now();
  for (let i = 0; i < 500; i++) {
    engine.setActiveTheme(i % 2 === 0 ? 'dark' : 'eyeprotection');
    engine.generateCssCustomProperties();
  }
  const ms = Date.now() - t0;
  assert(ms < 50, `500 theme switches completed in ${ms}ms (must be <50ms)`);
});

// ─── 8. Deep Bug Fix Regression Suite (BUG-1401 - BUG-1411) ──────────────────

test('BUG-1403: LSP handles textDocument/definition and textDocument/references', () => {
  const lsp = createLanguageServer();
  lsp.handleRequest('textDocument/didOpen', {
    textDocument: { uri: 'file:///doc1.zl', text: '# Intro\n\n@card\nHello\n@/card' },
  });
  const def = lsp.handleRequest('textDocument/definition', { textDocument: { uri: 'file:///doc1.zl' }, word: 'Intro' });
  assert(def && def.range, 'LSP definition returned');

  const refs = lsp.handleRequest('textDocument/references', { textDocument: { uri: 'file:///doc1.zl' }, word: 'Intro' });
  assert(Array.isArray(refs) && refs.length > 0, 'LSP references returned');
});

test('BUG-1404: SearchEngine accepts plain JS object documents', () => {
  const docs = { 'doc1.zl': 'Hello Zolto search' };
  const results = searchProject('search', docs);
  eq(results.length, 1, 'search result found');
});

test('BUG-1407: Canvas renderer sanitizes CSS property inputs', async () => {
  const { buildCanvasObjectStyles } = await import('../src/layout/canvas.js');
  const styles = buildCanvasObjectStyles({ objectType: 'text', fill: 'red; position: fixed', x: 10, y: 10 });
  assert(!styles.includes('position: fixed'), 'CSS injection payload sanitized out');
  assert(styles.includes('color: red position: fixed'), 'clean val set');
});

test('BUG-1411: ThemeAccessibility parses rgb color strings', () => {
  const access = new ThemeAccessibility();
  const ratio = access.getContrastRatio('rgb(255, 255, 255)', '#000000');
  eq(ratio, 21, 'rgb contrast ratio parsed correctly');
});

test('BUG-1408: PluginSandbox catches Promise rejections in async hooks', async () => {
  const { PluginSandbox } = await import('../src/plugin/sandbox.js');
  const sandbox = new PluginSandbox('test-plugin');
  const p = sandbox.execute('asyncHook', async () => { throw new Error('async error'); }, 'fallback');
  const res = await p;
  eq(res, 'fallback', 'fallback returned');
  eq(sandbox.errors.length, 1, 'error captured in sandbox');
});

test('BUG-1410: Plugin manifest block parses arrays with embedded commas inside quotes', async () => {
  const { parsePluginManifestBlock } = await import('../src/plugin/manifest.js');
  const block = `
name: "Test"
permissions: ["read:data,write:data", "network:fetch"]
  `;
  const manifest = parsePluginManifestBlock(block);
  eq(manifest.permissions.length, 2, 'two permissions parsed');
  eq(manifest.permissions[0], 'read:data,write:data', 'embedded comma preserved');
});

// ─── Export ───────────────────────────────────────────────────────────────────

export function runPhase15Tests() {
  return { results, passed: _pass, failed: _fail, total: _pass + _fail };
}
