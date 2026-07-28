/**
 * Zolto Plugin Diagnostics — Phase 12
 *
 * No-throw diagnostic accumulator for plugin manifest, lifecycle,
 * registry, and execution validation.
 */

export class PluginDiagnostics {
  constructor() {
    this.errors   = [];
    this.warnings = [];
    this.infos    = [];
  }

  error(code, message, context = {}) {
    this.errors.push({ code, message, ...context });
    return this;
  }

  warn(code, message, context = {}) {
    this.warnings.push({ code, message, ...context });
    return this;
  }

  info(code, message, context = {}) {
    this.infos.push({ code, message, ...context });
    return this;
  }

  get hasErrors()   { return this.errors.length   > 0; }
  get hasWarnings() { return this.warnings.length > 0; }
  get isEmpty()     { return !this.hasErrors && !this.hasWarnings; }

  merge(other) {
    if (!other) return this;
    if (other.errors)   this.errors.push(...other.errors);
    if (other.warnings) this.warnings.push(...other.warnings);
    if (other.infos)    this.infos.push(...other.infos);
    return this;
  }

  toArray() {
    return [
      ...this.errors.map(e   => ({ severity: 'error',   ...e })),
      ...this.warnings.map(w => ({ severity: 'warning', ...w })),
      ...this.infos.map(i    => ({ severity: 'info',    ...i })),
    ];
  }
}
