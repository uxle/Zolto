/**
 * Zolto Plugin Permissions & Security — Phase 12
 *
 * Permission enforcement system. Plugins must explicitly declare required
 * permissions in their manifest. Privileged APIs check permissions before execution.
 */

import { VALID_PERMISSIONS } from './ast.js';

export class PermissionManager {
  constructor() {
    // Map of pluginName -> Set of granted permissions
    this._grants = new Map();
  }

  /**
   * Grant explicit permissions to a plugin.
   * @param {string} pluginName
   * @param {string[]} permissions
   */
  grantPermissions(pluginName, permissions = []) {
    if (!pluginName) return;
    const name = String(pluginName);
    if (!this._grants.has(name)) {
      this._grants.set(name, new Set());
    }
    const grantedSet = this._grants.get(name);
    for (const perm of permissions) {
      if (VALID_PERMISSIONS.includes(perm)) {
        grantedSet.add(perm);
      }
    }
  }

  /**
   * Check if a plugin has a specific permission granted.
   * @param {string} pluginName
   * @param {string} permission
   * @returns {boolean}
   */
  hasPermission(pluginName, permission) {
    if (!pluginName) return false;
    const grantedSet = this._grants.get(String(pluginName));
    if (!grantedSet) return false;
    return grantedSet.has(String(permission));
  }

  /**
   * Revoke all granted permissions for a plugin.
   * @param {string} pluginName
   */
  revokePermissions(pluginName) {
    if (pluginName) this._grants.delete(String(pluginName));
  }

  /**
   * Get all granted permissions for a plugin.
   * @param {string} pluginName
   * @returns {string[]}
   */
  getGrantedPermissions(pluginName) {
    const grantedSet = this._grants.get(String(pluginName));
    return grantedSet ? Array.from(grantedSet) : [];
  }

  /**
   * Clear all permission grants.
   */
  clear() {
    this._grants.clear();
  }
}
