/**
 * Zolto Ecosystem Diagnostics — Phase 14
 *
 * Diagnostic accumulator for collaboration, workspace, versioning, publishing,
 * export, access control, and audit trail operations.
 */

export class EcosystemDiagnostics {
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
