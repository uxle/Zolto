/**
 * Zolto Plugin Extension Hooks System — Phase 12
 *
 * Hook engine supporting priority-ordered execution (100 = high, 50 = default, 0 = low)
 * and error-contained boundaries for:
 *   - beforeTokenize, afterTokenize
 *   - beforeParse, afterParse
 *   - beforeValidate, afterValidate
 *   - beforeTransform, afterTransform
 *   - beforeRender, afterRender
 *   - beforeExport, afterExport
 *   - themeHook, interactiveHook, presentationHook
 */

export const HOOK_NAMES = Object.freeze([
  'beforeTokenize',
  'afterTokenize',
  'beforeParse',
  'afterParse',
  'beforeValidate',
  'afterValidate',
  'beforeTransform',
  'afterTransform',
  'beforeRender',
  'afterRender',
  'beforeExport',
  'afterExport',
  'themeHook',
  'interactiveHook',
  'presentationHook',
]);

export class HookEngine {
  constructor() {
    // Map of hookName -> Array<{ pluginName: string, priority: number, fn: Function }>
    this._hooks = new Map();
    for (const name of HOOK_NAMES) {
      this._hooks.set(name, []);
    }
  }

  /**
   * Register a hook listener.
   * @param {string} hookName
   * @param {Function} fn
   * @param {object} [opts]
   * @param {string} [opts.pluginName]
   * @param {number} [opts.priority=50]  Higher runs first (e.g. 100 before 50)
   */
  registerHook(hookName, fn, opts = {}) {
    if (typeof fn !== 'function') return;
    const name = String(hookName || '');
    if (!this._hooks.has(name)) {
      this._hooks.set(name, []);
    }
    const list = this._hooks.get(name);
    const priority = opts.priority != null ? Number(opts.priority) : 50;
    const pluginName = opts.pluginName ? String(opts.pluginName) : 'anonymous';

    list.push({ pluginName, priority, fn });
    // Sort descending by priority
    list.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Unregister all hooks registered by a specific plugin.
   * @param {string} pluginName
   */
  unregisterPluginHooks(pluginName) {
    if (!pluginName) return;
    const target = String(pluginName);
    for (const [name, list] of this._hooks.entries()) {
      this._hooks.set(name, list.filter(item => item.pluginName !== target));
    }
  }

  /**
   * Execute all registered listeners for a hook in priority order.
   * @param {string} hookName
   * @param {any} data Input payload passed through pipeline
   * @param {object} [context] Compiler context options
   * @returns {any} Transformed data
   */
  runHook(hookName, data, context = {}) {
    const list = this._hooks.get(String(hookName)) || [];
    let currentData = data;

    for (const item of list) {
      try {
        const result = item.fn(currentData, context);
        if (result !== undefined) {
          currentData = result;
        }
      } catch (err) {
        // Error containment: log error and continue pipeline
        if (context.diagnostics && typeof context.diagnostics.warn === 'function') {
          context.diagnostics.warn(
            'E1203',
            `Hook "${hookName}" from plugin "${item.pluginName}" threw error: ${err.message}`
          );
        }
      }
    }

    return currentData;
  }

  /**
   * Clear all registered hooks.
   */
  clear() {
    for (const name of HOOK_NAMES) {
      this._hooks.set(name, []);
    }
  }
}
