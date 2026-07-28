/**
 * Zolto Synchronization Manager — Phase 14
 *
 * Handles document synchronization state (`SyncState`), local & remote delta sync,
 * offline queueing, and retry reconciliation.
 */

import { createSyncState } from './ast.js';

export class SyncEngine {
  constructor() {
    // Map of docUri -> SyncState
    this.states = new Map();
    this.offlineQueue = [];
  }

  getSyncState(docUri) {
    const uri = String(docUri || 'untitled.zl');
    if (!this.states.has(uri)) {
      this.states.set(uri, createSyncState(uri, 1, 1));
    }
    return this.states.get(uri);
  }

  updateLocalVersion(docUri, localVersion) {
    const state = this.getSyncState(docUri);
    state.localVersion = Number(localVersion);
    state.synced = state.localVersion === state.remoteVersion;
    state.lastSync = Date.now();
    return state;
  }

  reconcileRemote(docUri, remoteVersion) {
    const state = this.getSyncState(docUri);
    state.remoteVersion = Number(remoteVersion);
    state.synced = state.localVersion === state.remoteVersion;
    state.lastSync = Date.now();
    return state;
  }

  queueOfflineChange(docUri, delta) {
    this.offlineQueue.push({ docUri: String(docUri), delta, timestamp: Date.now() });
  }

  flushOfflineQueue() {
    const flushed = [...this.offlineQueue];
    this.offlineQueue = [];
    return flushed;
  }
}
