/**
 * Zolto Plugin Registry System — Phase 12
 *
 * Central registry managing plugin instances, dependencies, permission grants,
 * directive definitions, hook registrations, custom renderers, themes, and data providers.
 */

import { HookEngine } from './hooks.js';
import { DirectiveRegistry } from './directives.js';
import { RendererRegistry } from './renderers.js';
import { ThemeRegistry } from './themes.js';
import { DataProviderRegistry } from './data-providers.js';
import { PermissionManager } from './permissions.js';
import { PluginInstance } from './lifecycle.js';
import { parsePluginManifestObject } from './manifest.js';
import { createPluginApi } from './api.js';
import { validatePluginManifest } from './validator.js';

export class PluginRegistry {
  constructor() {
    // Map of pluginName -> PluginInstance
    this.plugins           = new Map();
    this.hooks             = new HookEngine();
    this.directives        = new DirectiveRegistry();
    this.renderers         = new RendererRegistry();
    this.themes            = new ThemeRegistry();
    this.dataProviders     = new DataProviderRegistry();
    this.permissionManager = new PermissionManager();
  }

  /**
   * Register and initialize a plugin in the registry.
   * @param {object} manifestInput Manifest block or object
   * @param {object} [pluginModule] Module containing initialize/register/activate functions
   * @param {object} [options]
   * @returns {PluginInstance}
   */
  registerPlugin(manifestInput, pluginModule = {}, options = {}) {
    const manifest = typeof manifestInput === 'string'
      ? parsePluginManifestObject({ name: manifestInput })
      : parsePluginManifestObject(manifestInput);

    const name = manifest.name;

    // Duplicate detection
    if (this.plugins.has(name)) {
      const existing = this.plugins.get(name);
      if (options.overwrite) {
        this.unregisterPlugin(name);
      } else {
        return existing;
      }
    }

    // Grant permissions
    this.permissionManager.grantPermissions(name, manifest.permissions);

    // Create instance
    const instance = new PluginInstance(manifest, pluginModule, this.permissionManager);
    this.plugins.set(name, instance);

    // Execute lifecycle
    instance.load();
    instance.initialize({ options });

    const api = createPluginApi(name, this);
    instance.register(api);
    instance.activate();

    return instance;
  }

  /**
   * Unregister and unload a plugin by name.
   * @param {string} pluginName
   */
  unregisterPlugin(pluginName) {
    if (!pluginName) return;
    const name = String(pluginName);
    const instance = this.plugins.get(name);
    if (instance) {
      instance.suspend();
      instance.unload();
      instance.destroy();
      this.plugins.delete(name);
    }

    this.hooks.unregisterPluginHooks(name);
    this.directives.unregisterPluginDirectives(name);
    this.renderers.unregisterPluginRenderers(name);
    this.themes.unregisterPluginThemes(name);
    this.dataProviders.unregisterPluginDataProviders(name);
    this.permissionManager.revokePermissions(name);
  }

  // ─── API Delegate Methods ────────────────────────────────────────────────

  registerDirective(name, handler, opts = {}) {
    this.directives.registerDirective(name, handler, opts);
  }

  registerRenderer(target, nodeType, renderFn, opts = {}) {
    this.renderers.registerRenderer(target, nodeType, renderFn, opts);
  }

  registerTheme(name, tokens = {}, opts = {}) {
    this.themes.registerTheme(name, tokens, opts);
  }

  registerDataProvider(name, providerFn, opts = {}) {
    this.dataProviders.registerDataProvider(name, providerFn, opts);
  }

  registerHook(hookName, fn, opts = {}) {
    this.hooks.registerHook(hookName, fn, opts);
  }

  hasPermission(pluginName, permission) {
    return this.permissionManager.hasPermission(pluginName, permission);
  }

  /**
   * Get sorted list of active plugin names in topological order.
   * @returns {string[]}
   */
  getActivePluginNames() {
    return Array.from(this.plugins.keys()).filter(n => {
      const inst = this.plugins.get(n);
      return inst && inst.state === 'active';
    });
  }

  /**
   * Clear registry.
   */
  clear() {
    for (const name of Array.from(this.plugins.keys())) {
      this.unregisterPlugin(name);
    }
    this.plugins.clear();
    this.hooks.clear();
    this.directives.clear();
    this.renderers.clear();
    this.themes.clear();
    this.dataProviders.clear();
    this.permissionManager.clear();
  }
}

// Global default singleton registry instance
export const defaultRegistry = new PluginRegistry();
