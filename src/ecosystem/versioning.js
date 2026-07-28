/**
 * Zolto Version History & Diffs — Phase 14
 *
 * Tracks document checkpoints (`DocumentVersion`), timeline history navigation,
 * line-by-line diff calculation (`VersionDiff`), and version rollback.
 */

import { createDocumentVersion, createVersionDiff } from './ast.js';

export class VersionHistory {
  constructor() {
    // Map of docUri -> DocumentVersion[]
    this._history = new Map();
  }

  saveCheckpoint(docUri, author, label = null, content = '') {
    const uri = String(docUri || 'untitled.zl');
    if (!this._history.has(uri)) {
      this._history.set(uri, []);
    }

    const versions = this._history.get(uri);
    const versionNum = versions.length + 1;
    const versionId = `v${versionNum}-${Date.now()}`;

    const versionNode = createDocumentVersion(versionId, versionNum, author, label, content);
    versions.push(versionNode);
    return versionNode;
  }

  getVersions(docUri) {
    return this._history.get(String(docUri || '')) || [];
  }

  getVersion(docUri, versionId) {
    const versions = this.getVersions(docUri);
    return versions.find(v => v.versionId === versionId || String(v.versionNumber) === String(versionId)) || null;
  }

  computeDiff(docUri, fromVersionId, toVersionId) {
    const v1 = this.getVersion(docUri, fromVersionId);
    const v2 = this.getVersion(docUri, toVersionId);
    if (!v1 || !v2) return createVersionDiff(fromVersionId, toVersionId, []);

    const lines1 = v1.snapshot.split('\n');
    const lines2 = v2.snapshot.split('\n');
    const changes = [];

    // Pre-build line index map for fast O(1) lookup
    const lines2Set = new Set(lines2);

    let i = 0, j = 0;
    while (i < lines1.length || j < lines2.length) {
      const l1 = lines1[i];
      const l2 = lines2[j];

      if (l1 === l2) {
        changes.push({ type: 'same', line: l1 });
        i++; j++;
      } else if (l2 !== undefined && (l1 === undefined || !lines2Set.has(l1))) {
        changes.push({ type: 'added', line: l2 });
        j++;
      } else if (l1 !== undefined) {
        changes.push({ type: 'removed', line: l1 });
        i++;
      } else {
        j++;
      }
    }

    return createVersionDiff(fromVersionId, toVersionId, changes);
  }

  rollback(docUri, versionId) {
    const version = this.getVersion(docUri, versionId);
    if (!version) return null;
    return version.snapshot;
  }
}
