/**
 * Zolto Developer API Facade for Plugins — Phase 12
 *
 * Exposes developer registration helper methods (`registerDirective`, `registerNodeType`,
 * `registerRenderer`, `registerTheme`, `registerDataProvider`, `registerHook`, `registerCommand`).
 */

export function createPluginApi(pluginName, registry) {
  const name = String(pluginName || 'anonymous');

  return Object.freeze({
    get pluginName() { return name; },

    registerDirective(directiveName, handler, options = {}) {
      if (registry && typeof registry.registerDirective === 'function') {
        registry.registerDirective(directiveName, handler, { ...options, pluginName: name });
      }
    },

    registerRenderer(target, nodeType, renderFn, options = {}) {
      if (registry && typeof registry.registerRenderer === 'function') {
        registry.registerRenderer(target, nodeType, renderFn, { ...options, pluginName: name });
      }
    },

    registerTheme(themeName, tokens = {}, options = {}) {
      if (registry && typeof registry.registerTheme === 'function') {
        registry.registerTheme(themeName, tokens, { ...options, pluginName: name });
      }
    },

    registerDataProvider(providerName, providerFn, options = {}) {
      if (registry && typeof registry.registerDataProvider === 'function') {
        registry.registerDataProvider(providerName, providerFn, { ...options, pluginName: name });
      }
    },

    registerHook(hookName, fn, options = {}) {
      if (registry && typeof registry.registerHook === 'function') {
        registry.registerHook(hookName, fn, { ...options, pluginName: name });
      }
    },

    hasPermission(permission) {
      if (registry && typeof registry.hasPermission === 'function') {
        return registry.hasPermission(name, permission);
      }
      return false;
    },
  });
}
