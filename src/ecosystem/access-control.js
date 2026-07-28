/**
 * Zolto Role-Based Access Control (RBAC) — Phase 14
 *
 * Manages document and project workspace access permissions for roles:
 *   Owner > Admin > Editor > Reviewer > Commenter > Viewer > Guest
 */

import { createAccessControlEntry, ROLES } from './ast.js';

export class AccessControl {
  constructor() {
    // Map of scopeKey (ws or doc) -> Map of userId -> role
    this._scopes = new Map();
  }

  setUserRole(scopeKey, userId, role = 'viewer') {
    const scope = String(scopeKey || 'global');
    if (!this._scopes.has(scope)) {
      this._scopes.set(scope, new Map());
    }

    const cleanRole = ROLES.includes(role) ? role : 'viewer';
    this._scopes.get(scope).set(String(userId), cleanRole);
    return createAccessControlEntry(userId, cleanRole);
  }

  getUserRole(scopeKey, userId) {
    const scope = this._scopes.get(String(scopeKey || 'global'));
    if (!scope) return 'guest';
    return scope.get(String(userId)) || 'guest';
  }

  canEdit(scopeKey, userId) {
    const role = this.getUserRole(scopeKey, userId);
    return ['owner', 'admin', 'editor'].includes(role);
  }

  canComment(scopeKey, userId) {
    const role = this.getUserRole(scopeKey, userId);
    return ['owner', 'admin', 'editor', 'reviewer', 'commenter'].includes(role);
  }

  canView(scopeKey, userId) {
    const role = this.getUserRole(scopeKey, userId);
    return role !== 'guest';
  }

  clear() {
    this._scopes.clear();
  }
}
