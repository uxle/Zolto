/**
 * Zolto Plugin Sandbox & Error Boundary — Phase 12
 *
 * Wraps plugin executions (hooks, parsers, renderers) in safe try-catch
 * error boundaries so plugin errors never crash the host Zolto compiler.
 */

import { createPluginError } from './ast.js';

export class PluginSandbox {
  constructor(pluginName, permissionManager = null) {
    this.pluginName = String(pluginName || 'unknown');
    this.permissionManager = permissionManager;
    this.errors = [];
  }

  /**
   * Execute a synchronous plugin function within an error boundary.
   *
   * @template T
   * @param {string} actionName Name of the hook/function being called
   * @param {() => T} fn Function to execute
   * @param {T} fallback Fallback value if execution throws
   * @returns {T}
   */
  execute(actionName, fn, fallback = null) {
    try {
      const result = fn();
      if (result && typeof result.then === 'function' && typeof result.catch === 'function') {
        return result.catch(err => {
          const errorNode = createPluginError(
            this.pluginName,
            'E1201',
            `Plugin "${this.pluginName}" error during ${actionName}: ${err?.message || err}`,
            { stack: err?.stack, fatal: false }
          );
          this.errors.push(errorNode);
          return fallback;
        });
      }
      return result;
    } catch (err) {
      const errorNode = createPluginError(
        this.pluginName,
        'E1201',
        `Plugin "${this.pluginName}" error during ${actionName}: ${err.message}`,
        { stack: err.stack, fatal: false }
      );
      this.errors.push(errorNode);
      return fallback;
    }
  }

  /**
   * Check if action requires a permission and execute it safely.
   * @param {string} permission
   * @param {string} actionName
   * @param {Function} fn
   * @param {any} fallback
   * @returns {any}
   */
  executeWithPermission(permission, actionName, fn, fallback = null) {
    if (this.permissionManager && !this.permissionManager.hasPermission(this.pluginName, permission)) {
      const err = createPluginError(
        this.pluginName,
        'E1202',
        `Permission denied: Plugin "${this.pluginName}" requested "${actionName}" requiring permission "${permission}"`,
        { fatal: false }
      );
      this.errors.push(err);
      return fallback;
    }
    return this.execute(actionName, fn, fallback);
  }
}
