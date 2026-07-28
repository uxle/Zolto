/**
 * Zolto Plugin Static Validator — Phase 12
 *
 * Validates plugin manifests, permissions, dependencies, and SemVer compatibility
 * returning a `PluginDiagnostics` instance. Never throws.
 */

import { PluginDiagnostics } from './diagnostics.js';
import { VALID_PERMISSIONS } from './ast.js';

/**
 * Validate a plugin manifest node.
 * @param {object} manifest
 * @returns {PluginDiagnostics}
 */
export function validatePluginManifest(manifest) {
  const diag = new PluginDiagnostics();
  if (!manifest || typeof manifest !== 'object') {
    diag.error('E1210', 'Manifest is null or invalid object');
    return diag;
  }

  if (!manifest.name || manifest.name === 'unnamed-plugin') {
    diag.warn('E1211', 'Plugin manifest is missing a valid "name" field');
  }

  if (!manifest.version) {
    diag.warn('E1212', `Plugin "${manifest.name}" is missing a "version" field`);
  } else if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
    diag.warn('E1213', `Plugin "${manifest.name}" version "${manifest.version}" is not valid SemVer`);
  }

  // Validate permissions
  if (Array.isArray(manifest.permissions)) {
    for (const perm of manifest.permissions) {
      if (!VALID_PERMISSIONS.includes(perm)) {
        diag.warn('E1214', `Plugin "${manifest.name}" requested unknown permission "${perm}"`);
      }
    }
  }

  return diag;
}

/**
 * Check SemVer range compatibility against Zolto core VERSION.
 * @param {string} range  e.g. "^12.0.0", ">=12.0.0", "*"
 * @param {string} coreVersion e.g. "12.0.0"
 * @returns {boolean}
 */
export function checkVersionCompatibility(range, coreVersion = '12.0.0') {
  if (!range || range === '*') return true;
  const cleanRange = range.trim();
  const majorCore = parseInt(coreVersion.split('.')[0], 10);

  if (cleanRange.startsWith('^') || cleanRange.startsWith('~')) {
    const rangeMajor = parseInt(cleanRange.slice(1).split('.')[0], 10);
    return rangeMajor === majorCore;
  }
  if (cleanRange.startsWith('>=')) {
    const rangeMajor = parseInt(cleanRange.slice(2).split('.')[0], 10);
    return majorCore >= rangeMajor;
  }
  return true;
}
