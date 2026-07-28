/**
 * Zolto Cache Manager — Phase 13
 *
 * Layered in-memory and fragment caching system supporting:
 *   - Token cache
 *   - Parse/AST cache
 *   - Render fragment cache
 *   - Symbol index cache
 *   - Theme CSS cache
 */

import { createCacheEntry } from './ast.js';

export class CacheManager {
  constructor(defaultTtlMs = 300000) {
    this.defaultTtlMs = defaultTtlMs;
    // Map of key -> CacheEntry AST node
    this._store = new Map();
  }

  set(key, value, ttlMs = null) {
    if (!key) return;
    const ttl = ttlMs != null ? Number(ttlMs) : this.defaultTtlMs;
    const entry = createCacheEntry(String(key), value, ttl);
    this._store.set(String(key), entry);
  }

  get(key) {
    if (!key) return null;
    const entry = this._store.get(String(key));
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this._store.delete(String(key));
      return null;
    }
    return entry.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    if (key) this._store.delete(String(key));
  }

  invalidatePrefix(prefix) {
    if (!prefix) return;
    const target = String(prefix);
    for (const k of this._store.keys()) {
      if (k.startsWith(target)) {
        this._store.delete(k);
      }
    }
  }

  clear() {
    this._store.clear();
  }

  get size() {
    return this._store.size;
  }
}
