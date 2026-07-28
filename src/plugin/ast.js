/**
 * Zolto Plugin AST Node Factories — Phase 12
 *
 * Monomorphic AST node factories for plugin manifests, dependencies,
 * permissions, extension points, registered directives, renderers,
 * themes, data providers, configs, and errors.
 *
 * Contract:
 *   - All fields are present on every node (no missing keys)
 *   - Missing optional values use null, not undefined
 *   - Collections use arrays, never null
 */

export const PLUGIN_NODE_TYPES = Object.freeze({
  PLUGIN_MANIFEST:          'plugin_manifest',
  PLUGIN_DEPENDENCY:        'plugin_dependency',
  PLUGIN_PERMISSION:        'plugin_permission',
  EXTENSION_POINT:          'extension_point',
  REGISTERED_DIRECTIVE:     'registered_directive',
  REGISTERED_RENDERER:      'registered_renderer',
  REGISTERED_THEME:         'registered_theme',
  REGISTERED_DATA_PROVIDER: 'registered_data_provider',
  PLUGIN_CONFIG:            'plugin_config',
  PLUGIN_ERROR:             'plugin_error',
});

export const VALID_PERMISSIONS = Object.freeze([
  'file:read',
  'file:write',
  'network:access',
  'theme:access',
  'renderer:access',
  'storage:access',
  'external-data:access',
  'interactive-runtime:access',
]);

export const PLUGIN_LIFECYCLE_STATES = Object.freeze([
  'unloaded',
  'loaded',
  'initialized',
  'registered',
  'active',
  'suspended',
  'destroyed',
]);

// ─── Node Factories ───────────────────────────────────────────────────────────

export function createPluginManifest(name, version, meta = {}) {
  return {
    type:           PLUGIN_NODE_TYPES.PLUGIN_MANIFEST,
    name:           String(name || ''),
    version:        String(version || '1.0.0'),
    author:         meta.author ? String(meta.author) : null,
    description:    meta.description ? String(meta.description) : null,
    compatibility:  meta.compatibility ? String(meta.compatibility) : '^12.0.0',
    dependencies:   Array.isArray(meta.dependencies) ? meta.dependencies : [],
    permissions:    Array.isArray(meta.permissions) ? meta.permissions : [],
    entryPoints:    meta.entryPoints && typeof meta.entryPoints === 'object' ? meta.entryPoints : {},
    metadata:       meta.metadata && typeof meta.metadata === 'object' ? meta.metadata : {},
  };
}

export function createPluginDependency(name, versionRange, meta = {}) {
  return {
    type:         PLUGIN_NODE_TYPES.PLUGIN_DEPENDENCY,
    name:         String(name || ''),
    versionRange: String(versionRange || '*'),
    optional:     meta.optional === true,
  };
}

export function createPluginPermission(permission, meta = {}) {
  return {
    type:       PLUGIN_NODE_TYPES.PLUGIN_PERMISSION,
    permission: String(permission || ''),
    granted:    meta.granted !== false,
    reason:     meta.reason ? String(meta.reason) : null,
  };
}

export function createExtensionPoint(name, targetSystem, meta = {}) {
  return {
    type:         PLUGIN_NODE_TYPES.EXTENSION_POINT,
    name:         String(name || ''),
    targetSystem: String(targetSystem || 'core'),
    description:  meta.description ? String(meta.description) : null,
  };
}

export function createRegisteredDirective(name, handler, meta = {}) {
  return {
    type:          PLUGIN_NODE_TYPES.REGISTERED_DIRECTIVE,
    name:          String(name || '').toLowerCase(),
    directiveType: String(meta.directiveType || 'block'),
    handler:       typeof handler === 'function' ? handler : null,
    pluginName:    meta.pluginName ? String(meta.pluginName) : null,
  };
}

export function createRegisteredRenderer(target, nodeType, renderFn, meta = {}) {
  return {
    type:       PLUGIN_NODE_TYPES.REGISTERED_RENDERER,
    target:     String(target || 'html').toLowerCase(),
    nodeType:   String(nodeType || ''),
    renderFn:   typeof renderFn === 'function' ? renderFn : null,
    pluginName: meta.pluginName ? String(meta.pluginName) : null,
  };
}

export function createRegisteredTheme(name, tokens = {}, meta = {}) {
  return {
    type:       PLUGIN_NODE_TYPES.REGISTERED_THEME,
    name:       String(name || ''),
    inherits:   meta.inherits ? String(meta.inherits) : null,
    tokens:     tokens && typeof tokens === 'object' ? tokens : {},
    styles:     meta.styles ? String(meta.styles) : null,
    pluginName: meta.pluginName ? String(meta.pluginName) : null,
  };
}

export function createRegisteredDataProvider(name, providerFn, meta = {}) {
  return {
    type:       PLUGIN_NODE_TYPES.REGISTERED_DATA_PROVIDER,
    name:       String(name || ''),
    providerFn: typeof providerFn === 'function' ? providerFn : null,
    cacheable:  meta.cacheable !== false,
    pluginName: meta.pluginName ? String(meta.pluginName) : null,
  };
}

export function createPluginConfig(pluginName, options = {}) {
  return {
    type:       PLUGIN_NODE_TYPES.PLUGIN_CONFIG,
    pluginName: String(pluginName || ''),
    enabled:    options.enabled !== false,
    options:    options.options && typeof options.options === 'object' ? options.options : {},
  };
}

export function createPluginError(pluginName, code, message, meta = {}) {
  return {
    type:       PLUGIN_NODE_TYPES.PLUGIN_ERROR,
    pluginName: String(pluginName || 'unknown'),
    code:       String(code || 'E1200'),
    message:    String(message || ''),
    stack:      meta.stack ? String(meta.stack) : null,
    fatal:      meta.fatal === true,
  };
}

// ─── Type Guard ───────────────────────────────────────────────────────────────

const _ALL_PLUGIN_TYPES = new Set(Object.values(PLUGIN_NODE_TYPES));

export function isPluginNode(node) {
  return node != null && typeof node === 'object' && _ALL_PLUGIN_TYPES.has(node.type);
}
