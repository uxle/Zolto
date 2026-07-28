/**
 * Zolto Theme Diagnostics — Phase 15
 *
 * Diagnostic accumulator for theme validation, low contrast warnings,
 * missing token errors, and broken inheritance rules.
 */

export class ThemeDiagnostics {
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

  toArray() {
    return [
      ...this.errors.map(e   => ({ severity: 'error',   ...e })),
      ...this.warnings.map(w => ({ severity: 'warning', ...w })),
      ...this.infos.map(i    => ({ severity: 'info',    ...i })),
    ];
  }
}
