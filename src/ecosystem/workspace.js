/**
 * Zolto Workspace Manager — Phase 14
 *
 * Workspace management for multi-file Zolto projects, nested folder imports,
 * shared themes, assets, and metadata.
 */

import { createWorkspace } from './ast.js';

export class WorkspaceManager {
  constructor() {
    // Map of workspaceName -> Workspace
    this._workspaces = new Map();
  }

  createWorkspace(name, rootUri, options = {}) {
    const ws = createWorkspace(name, rootUri, options);
    this._workspaces.set(ws.name, ws);
    return ws;
  }

  addDocument(workspaceName, docUri) {
    const ws = this._workspaces.get(String(workspaceName || ''));
    if (!ws) return false;
    if (!ws.documents.includes(docUri)) {
      ws.documents.push(docUri);
    }
    return true;
  }

  addAsset(workspaceName, assetUri) {
    const ws = this._workspaces.get(String(workspaceName || ''));
    if (!ws) return false;
    if (!ws.assets.includes(assetUri)) {
      ws.assets.push(assetUri);
    }
    return true;
  }

  getWorkspace(name) {
    return this._workspaces.get(String(name || '')) || null;
  }

  clear() {
    this._workspaces.clear();
  }
}
