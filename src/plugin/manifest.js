/**
 * Zolto Plugin Manifest Parser & Validator — Phase 12
 *
 * Parses `@plugin` text block manifest blocks or JS manifest objects into
 * monomorphic `PluginManifest` AST nodes.
 * Static validation without throwing.
 */

import { createPluginManifest } from './ast.js';

/**
 * Parse `@plugin` manifest block source into a `PluginManifest` AST node.
 * Supports YAML-like / key-value pair lines:
 *   name: "Zolto Todo Plugin"
 *   version: "1.0.0"
 *   author: "Zolto Team"
 *   description: "Adds todo blocks and status tracking."
 *   compatibility: "^12.0.0"
 *   dependencies: ["theme-core@1.0.0"]
 *   permissions: ["renderer:access", "theme:access"]
 *
 * @param {string} src
 * @returns {object} PluginManifest node
 */
export function parsePluginManifestBlock(src) {
  const lines = String(src || '').split('\n');
  const rawData = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim().toLowerCase();
    let valStr = trimmed.slice(colonIdx + 1).trim();

    // Remove quotes
    if ((valStr.startsWith('"') && valStr.endsWith('"')) || (valStr.startsWith("'") && valStr.endsWith("'"))) {
      valStr = valStr.slice(1, -1);
    }

    // Array parsing: ["item1", "item2"]
    if (valStr.startsWith('[') && valStr.endsWith(']')) {
      const inner = valStr.slice(1, -1);
      const items = [];
      let cur = '';
      let inQ = false;
      let qChar = '';
      for (const ch of inner) {
        if (!inQ && (ch === '"' || ch === "'")) { inQ = true; qChar = ch; continue; }
        if (inQ && ch === qChar) { inQ = false; items.push(cur.trim()); cur = ''; continue; }
        if (!inQ && ch === ',') { if (cur.trim()) items.push(cur.trim()); cur = ''; continue; }
        cur += ch;
      }
      if (cur.trim()) items.push(cur.trim());
      rawData[key] = items.filter(Boolean);
    } else {
      rawData[key] = valStr;
    }
  }

  return parsePluginManifestObject(rawData);
}

/**
 * Convert a JavaScript object into a standardized `PluginManifest` AST node.
 * @param {object} obj
 * @returns {object} PluginManifest node
 */
export function parsePluginManifestObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return createPluginManifest('unnamed-plugin', '1.0.0');
  }

  const name          = String(obj.name || obj.id || 'unnamed-plugin');
  const version       = String(obj.version || '1.0.0');
  const author        = obj.author ? String(obj.author) : null;
  const description   = obj.description ? String(obj.description) : null;
  const compatibility = obj.compatibility || obj.zoltoVersion || '^12.0.0';
  const dependencies  = Array.isArray(obj.dependencies) ? obj.dependencies.map(String) : [];
  const permissions   = Array.isArray(obj.permissions) ? obj.permissions.map(String) : [];
  const entryPoints   = obj.entryPoints && typeof obj.entryPoints === 'object' ? obj.entryPoints : {};
  const metadata      = obj.metadata && typeof obj.metadata === 'object' ? obj.metadata : {};

  return createPluginManifest(name, version, {
    author,
    description,
    compatibility,
    dependencies,
    permissions,
    entryPoints,
    metadata,
  });
}
