/**
 * Zolto Data Provider Registry — Phase 12
 *
 * Allows plugins to register external or computed data providers (JSON feeds, CSV feeds,
 * dataset query handlers) with optional caching.
 */

import { createRegisteredDataProvider } from './ast.js';

export class DataProviderRegistry {
  constructor() {
    // Map of providerName -> RegisteredDataProvider AST node
    this._providers = new Map();
    // Cache for data responses
    this._cache = new Map();
  }

  /**
   * Register a data provider.
   * @param {string} name
   * @param {Function} providerFn (params) => any
   * @param {object} [opts]
   */
  registerDataProvider(name, providerFn, opts = {}) {
    if (!name || typeof providerFn !== 'function') return;
    const cleanName = String(name).toLowerCase();
    const entry = createRegisteredDataProvider(cleanName, providerFn, opts);
    this._providers.set(cleanName, entry);
  }

  /**
   * Fetch data from a provider by name.
   * @param {string} name
   * @param {object} [params]
   * @returns {any}
   */
  fetchData(name, params = {}) {
    if (!name) return null;
    const cleanName = String(name).toLowerCase();
    const entry = this._providers.get(cleanName);
    if (!entry || typeof entry.providerFn !== 'function') return null;

    const cacheKey = `${cleanName}:${JSON.stringify(params)}`;
    if (entry.cacheable && this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey);
    }

    try {
      const data = entry.providerFn(params);
      if (entry.cacheable) {
        this._cache.set(cacheKey, data);
      }
      return data;
    } catch (err) {
      return null;
    }
  }

  /**
   * Clear cache for a provider or all providers.
   * @param {string} [name]
   */
  clearCache(name) {
    if (name) {
      const cleanName = String(name).toLowerCase();
      for (const k of this._cache.keys()) {
        if (k.startsWith(`${cleanName}:`)) this._cache.delete(k);
      }
    } else {
      this._cache.clear();
    }
  }

  /**
   * Unregister data providers registered by a specific plugin.
   * @param {string} pluginName
   */
  unregisterPluginDataProviders(pluginName) {
    if (!pluginName) return;
    const target = String(pluginName);
    for (const [name, entry] of this._providers.entries()) {
      if (entry.pluginName === target) {
        this._providers.delete(name);
      }
    }
  }

  /**
   * Clear all registered data providers.
   */
  clear() {
    this._providers.clear();
    this._cache.clear();
  }
}
