/**
 * Zolto Compliance Audit Trail — Phase 14
 *
 * Implements an immutable compliance log (`AuditEntry`) tracking who changed what,
 * when it changed, approvals, reverts, and publishing releases.
 */

import { createAuditEntry } from './ast.js';

export class AuditTrail {
  constructor() {
    this._entries = [];
  }

  record(action, userId = 'system', details = {}) {
    const entry = createAuditEntry(action, userId, details);
    this._entries.push(entry);
    return entry;
  }

  getEntries(filter = {}) {
    return this._entries.filter(e => {
      if (filter.userId && e.userId !== filter.userId) return false;
      if (filter.action && !e.action.includes(filter.action)) return false;
      return true;
    });
  }

  exportLogs() {
    return [...this._entries];
  }

  clear() {
    this._entries = [];
  }
}
