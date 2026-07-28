/**
 * Zolto File Watcher & Import Tracker — Phase 13
 *
 * Tracks document file changes, import dependencies, and triggers hot invalidation
 * for caches and indexers.
 */

import { createWatchEvent } from './ast.js';

export class FileWatcher {
  constructor() {
    this._listeners = new Set();
    // Map of file -> Set of dependent files
    this._importGraph = new Map();
  }

  onWatch(listener) {
    if (typeof listener === 'function') {
      this._listeners.add(listener);
    }
  }

  offWatch(listener) {
    this._listeners.delete(listener);
  }

  notifyChange(uri, eventType = 'change') {
    const event = createWatchEvent(uri, eventType);
    for (const listener of this._listeners) {
      try {
        listener(event);
      } catch (err) {
        // error containment
      }
    }
  }

  trackImport(parentUri, importedUri) {
    if (!parentUri || !importedUri) return;
    if (!this._importGraph.has(importedUri)) {
      this._importGraph.set(importedUri, new Set());
    }
    this._importGraph.get(importedUri).add(parentUri);
  }

  getDependents(uri) {
    const deps = this._importGraph.get(String(uri || ''));
    return deps ? Array.from(deps) : [];
  }
}
