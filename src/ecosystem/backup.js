/**
 * Zolto Disaster Recovery & Backup Manager — Phase 14
 *
 * Manages automated & manual snapshot archives (`BackupSnapshot`) and document recovery.
 */

import { createBackupSnapshot } from './ast.js';

export class BackupManager {
  constructor() {
    // Map of docUri -> BackupSnapshot[]
    this._backups = new Map();
  }

  createBackup(docUri, content) {
    const uri = String(docUri || 'untitled.zl');
    if (!this._backups.has(uri)) {
      this._backups.set(uri, []);
    }

    const list = this._backups.get(uri);
    const id = `backup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const snapshot = createBackupSnapshot(id, uri, content);
    list.push(snapshot);
    return snapshot;
  }

  getBackups(docUri) {
    return this._backups.get(String(docUri || '')) || [];
  }

  restoreBackup(docUri, snapshotId) {
    const list = this.getBackups(docUri);
    const snapshot = list.find(s => s.id === snapshotId);
    return snapshot ? snapshot.content : null;
  }

  clear() {
    this._backups.clear();
  }
}
