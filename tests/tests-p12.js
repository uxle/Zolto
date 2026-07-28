/**
 * Zolto Phase 12 Test Suite — Plugin API & Extension System
 *
 * Tests: manifest parsing, lifecycle state machine, registry dependency graph,
 *        priority hook engine, custom directives, custom renderers, themes,
 *        data providers, permissions, sandboxing error boundaries, SemVer checks,
 *        compile integration, and performance.
 */

import {
  parsePlugin, renderPluginNode, validatePlugin,
  PluginRegistry, PluginSandbox, createPluginApi,
  checkVersionCompatibility, parsePluginManifestBlock, parsePluginManifestObject,
  compile,
} from '../src/zolto.js';
import {
  createPluginManifest, createPluginDependency, createPluginPermission,
  createExtensionPoint, createRegisteredDirective, createRegisteredRenderer,
  createRegisteredTheme, createRegisteredDataProvider, PLUGIN_NODE_TYPES, isPluginNode,
} from '../src/plugin/ast.js';
import { PluginDiagnostics } from '../src/plugin/diagnostics.js';

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

test('createPluginManifest produces standard AST node', () => {
  const m = createPluginManifest('my-plugin', '1.2.0', {
    author: 'Dev Team',
    description: 'A test plugin',
    permissions: ['file:read'],
  });
  eq(m.type, PLUGIN_NODE_TYPES.PLUGIN_MANIFEST, 'type');
  eq(m.name, 'my-plugin', 'name');
  eq(m.version, '1.2.0', 'version');
  eq(m.author, 'Dev Team', 'author');
  eq(m.permissions[0], 'file:read', 'permission');
  assert(isPluginNode(m), 'isPluginNode');
});

test('createRegisteredDirective produces standard AST node', () => {
  const d = createRegisteredDirective('todo', () => ({ type: 'todo' }), { directiveType: 'block' });
  eq(d.type, PLUGIN_NODE_TYPES.REGISTERED_DIRECTIVE, 'type');
  eq(d.name, 'todo', 'name');
  eq(d.directiveType, 'block', 'directiveType');
});

test('createRegisteredTheme produces standard AST node', () => {
  const t = createRegisteredTheme('ocean', { '--zl-theme-primary': '#0077cc' });
  eq(t.type, PLUGIN_NODE_TYPES.REGISTERED_THEME, 'type');
  eq(t.name, 'ocean', 'name');
  eq(t.tokens['--zl-theme-primary'], '#0077cc', 'token');
});

// ─── 2. Manifest Parsing ──────────────────────────────────────────────────────

test('parsePluginManifestBlock parses @plugin block format', () => {
  const src = `name: "Zolto Todo Plugin"
version: "1.0.0"
author: "Zolto Team"
description: "Adds todo blocks"
permissions: ["renderer:access", "theme:access"]`;
  const m = parsePluginManifestBlock(src);
  eq(m.name, 'Zolto Todo Plugin', 'name');
  eq(m.version, '1.0.0', 'version');
  eq(m.author, 'Zolto Team', 'author');
  eq(m.permissions.length, 2, 'two permissions');
  eq(m.permissions[0], 'renderer:access', 'first permission');
});

test('parsePluginManifestObject converts JS object', () => {
  const m = parsePluginManifestObject({
    name: 'analytics-plugin',
    version: '2.0.0',
    permissions: ['network:access'],
  });
  eq(m.name, 'analytics-plugin', 'name');
  eq(m.version, '2.0.0', 'version');
  eq(m.permissions[0], 'network:access', 'permission');
});

test('parsePlugin returns manifest and diagnostics', () => {
  const { manifest, diagnostics } = parsePlugin('name: "my-plugin"\nversion: "1.0.0"');
  eq(manifest.name, 'my-plugin', 'name');
  assert(!diagnostics.hasErrors, 'no errors');
});

// ─── 3. Plugin Registry & Lifecycle ──────────────────────────────────────────

test('PluginRegistry registers and activates a plugin', () => {
  const registry = new PluginRegistry();
  let initialized = false, activated = false;

  const pluginModule = {
    initialize() { initialized = true; },
    activate() { activated = true; },
  };

  const instance = registry.registerPlugin({ name: 'test-plugin', version: '1.0.0' }, pluginModule);
  eq(instance.state, 'active', 'state active');
  assert(initialized, 'initialized called');
  assert(activated, 'activated called');
  eq(registry.getActivePluginNames().length, 1, 'one active plugin');
});

test('PluginRegistry unregisters a plugin cleanly', () => {
  const registry = new PluginRegistry();
  let suspended = false, unloaded = false;

  const pluginModule = {
    suspend() { suspended = true; },
    unload() { unloaded = true; },
  };

  registry.registerPlugin({ name: 'temp-plugin' }, pluginModule);
  registry.unregisterPlugin('temp-plugin');

  assert(suspended, 'suspended called');
  assert(unloaded, 'unloaded called');
  eq(registry.getActivePluginNames().length, 0, 'zero active plugins');
});

// ─── 4. Extension Hooks ───────────────────────────────────────────────────────

test('HookEngine executes hooks in priority order', () => {
  const registry = new PluginRegistry();
  const order = [];

  registry.registerHook('beforeParse', (data) => { order.push('low'); return data; }, { priority: 10 });
  registry.registerHook('beforeParse', (data) => { order.push('high'); return data; }, { priority: 100 });
  registry.registerHook('beforeParse', (data) => { order.push('med'); return data; }, { priority: 50 });

  registry.hooks.runHook('beforeParse', {});
  eq(order.join(','), 'high,med,low', 'priority ordering');
});

test('HookEngine passes data through transformation chain', () => {
  const registry = new PluginRegistry();
  registry.registerHook('beforeTokenize', (src) => src + '\n# Appended', { priority: 50 });

  const result = registry.hooks.runHook('beforeTokenize', 'Original');
  eq(result, 'Original\n# Appended', 'data transformed');
});

// ─── 5. Custom Directives ─────────────────────────────────────────────────────

test('PluginRegistry registers custom directive', () => {
  const registry = new PluginRegistry();
  registry.registerDirective('todo', (tok, attrs) => ({
    type: 'todo_node',
    status: attrs.status || 'open',
    content: tok.body,
  }));

  assert(registry.directives.hasDirective('todo'), 'has todo directive');
  const parsed = registry.directives.parseCustomDirective(
    { name: 'todo', attrStr: 'status="done"', body: 'Task description' },
    { status: 'done' },
    {}
  );
  eq(parsed.type, 'todo_node', 'parsed type');
  eq(parsed.status, 'done', 'parsed status');
});

// ─── 6. Custom Renderers ──────────────────────────────────────────────────────

test('RendererRegistry registers and calls target renderer', () => {
  const registry = new PluginRegistry();
  registry.registerRenderer('html', 'todo_node', (node) => {
    return `<div class="zl-todo zl-todo--${node.status}">${node.content}</div>`;
  });

  assert(registry.renderers.hasRenderer('html', 'todo_node'), 'has renderer');
  const rendered = registry.renderers.renderNode('html', { type: 'todo_node', status: 'open', content: 'Do laundry' });
  eq(rendered, '<div class="zl-todo zl-todo--open">Do laundry</div>', 'custom HTML output');
});

// ─── 7. Themes ────────────────────────────────────────────────────────────────

test('ThemeRegistry generates CSS custom properties', () => {
  const registry = new PluginRegistry();
  registry.registerTheme('neon', {
    '--zl-theme-bg': '#000000',
    '--zl-theme-accent': '#00ffcc',
  });

  const css = registry.themes.generateThemeCSS('neon');
  includes(css, ':root[data-zl-theme="neon"]', 'selector');
  includes(css, '--zl-theme-bg: #000000', 'bg token');
  includes(css, '--zl-theme-accent: #00ffcc', 'accent token');
});

// ─── 8. Data Providers ────────────────────────────────────────────────────────

test('DataProviderRegistry supplies data and caches results', () => {
  const registry = new PluginRegistry();
  let calls = 0;

  registry.registerDataProvider('user-feed', (params) => {
    calls++;
    return { user: params.id || 1, name: 'Alice' };
  });

  const d1 = registry.dataProviders.fetchData('user-feed', { id: 42 });
  eq(d1.name, 'Alice', 'data fetched');
  eq(calls, 1, 'first call');

  const d2 = registry.dataProviders.fetchData('user-feed', { id: 42 });
  eq(d2.name, 'Alice', 'cached data fetched');
  eq(calls, 1, 'second call used cache');
});

// ─── 9. Permissions ───────────────────────────────────────────────────────────

test('PermissionManager enforces permissions', () => {
  const registry = new PluginRegistry();
  registry.registerPlugin({
    name: 'secure-plugin',
    permissions: ['file:read', 'theme:access'],
  });

  assert(registry.hasPermission('secure-plugin', 'file:read'), 'has file:read');
  assert(registry.hasPermission('secure-plugin', 'theme:access'), 'has theme:access');
  assert(!registry.hasPermission('secure-plugin', 'file:write'), 'denied file:write');
});

// ─── 10. Sandboxing ───────────────────────────────────────────────────────────

test('PluginSandbox catches plugin exceptions without throwing', () => {
  const sandbox = new PluginSandbox('faulty-plugin');
  const result = sandbox.execute('customHook', () => {
    throw new Error('Boom in plugin');
  }, 'fallback-value');

  eq(result, 'fallback-value', 'returns fallback');
  eq(sandbox.errors.length, 1, 'error recorded');
  includes(sandbox.errors[0].message, 'Boom in plugin', 'error message');
});

// ─── 11. SemVer Version Compatibility ─────────────────────────────────────────

test('checkVersionCompatibility validates version ranges', () => {
  assert(checkVersionCompatibility('^12.0.0', '12.0.0'), '^12 matching 12.0.0');
  assert(checkVersionCompatibility('>=11.0.0', '12.0.0'), '>=11 matching 12.0.0');
  assert(checkVersionCompatibility('*', '12.0.0'), '* matching');
  assert(!checkVersionCompatibility('^11.0.0', '12.0.0'), '^11 rejecting 12.0.0');
});

// ─── 12. Static Validation & Diagnostics ──────────────────────────────────────

test('validatePlugin checks manifest health', () => {
  const diag = validatePlugin({ name: 'unnamed-plugin', version: 'invalid-ver' });
  assert(diag.hasWarnings, 'has warnings for unnamed and invalid ver');
});

// ─── 13. Compile Integration ──────────────────────────────────────────────────

test('compile() with active plugin and custom directive', () => {
  const registry = new PluginRegistry();
  registry.registerDirective('todo', (tok, attrs) => ({
    type: 'todo_node',
    status: attrs.status || 'open',
    content: tok.body,
  }));
  registry.registerRenderer('html', 'todo_node', (node) => {
    return `<div class="zl-todo zl-todo--${node.status}">${node.content}</div>`;
  });

  const src = `# Task List

@todo status="done"
Finish Phase 12 implementation
@/todo`;

  const html = compile(src, { registry });
  includes(html, '<h1', 'heading rendered');
  includes(html, 'zl-todo--done', 'custom todo rendered');
  includes(html, 'Finish Phase 12 implementation', 'todo content');
});

// ─── 14. Performance Stress ───────────────────────────────────────────────────

test('Register 50 plugins in <50ms', () => {
  const registry = new PluginRegistry();
  const t0 = Date.now();

  for (let i = 0; i < 50; i++) {
    registry.registerPlugin({
      name: `plugin-${i}`,
      version: '1.0.0',
      permissions: ['renderer:access'],
    });
  }

  const ms = Date.now() - t0;
  assert(ms < 100, `50 plugins registered in ${ms}ms (must be <100ms)`);
  eq(registry.getActivePluginNames().length, 50, '50 active plugins');
});

// ─── Export ───────────────────────────────────────────────────────────────────

export function runPhase12Tests() {
  return { results, passed: _pass, failed: _fail, total: _pass + _fail };
}
