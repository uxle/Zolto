/**
 * Zolto Tooling Diagnostics — Phase 13
 *
 * Diagnostic accumulator for language server operations, linting,
 * formatting, indexing, and LSP requests.
 */

import { createDiagnosticEntry } from './ast.js';

export class ToolingDiagnostics {
  constructor() {
    this.entries = [];
  }

  add(code, message, severity = 'error', location = null, meta = {}) {
    const entry = createDiagnosticEntry(code, message, severity, location, meta);
    this.entries.push(entry);
    return this;
  }

  error(code, message, location = null, meta = {}) {
    return this.add(code, message, 'error', location, meta);
  }

  warn(code, message, location = null, meta = {}) {
    return this.add(code, message, 'warning', location, meta);
  }

  info(code, message, location = null, meta = {}) {
    return this.add(code, message, 'info', location, meta);
  }

  get hasErrors()   { return this.entries.some(e => e.severity === 'error'); }
  get hasWarnings() { return this.entries.some(e => e.severity === 'warning'); }
  get isEmpty()     { return this.entries.length === 0; }

  merge(other) {
    if (other && Array.isArray(other.entries)) {
      this.entries.push(...other.entries);
    }
    return this;
  }

  toArray() {
    return [...this.entries];
  }
}
