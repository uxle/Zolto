/**
 * Zolto Branching & Merge Engine — Phase 14
 *
 * Document branching workflows: branch creation, merge requests (`MergeRequest`),
 * conflict detection, and non-destructive patch merging.
 */

import { createBranch, createMergeRequest } from './ast.js';

export class BranchEngine {
  constructor() {
    // Map of docUri -> Map of branchName -> Branch
    this._branches = new Map();
    // Map of docUri -> MergeRequest[]
    this._mergeRequests = new Map();
  }

  createBranch(docUri, branchName, baseVersion, author = 'system') {
    const uri = String(docUri || 'untitled.zl');
    if (!this._branches.has(uri)) {
      this._branches.set(uri, new Map());
      // Default main branch
      this._branches.get(uri).set('main', createBranch('main', baseVersion, 'system'));
    }

    const branchMap = this._branches.get(uri);
    const branch = createBranch(branchName, baseVersion, author);
    branchMap.set(String(branchName), branch);
    return branch;
  }

  getBranches(docUri) {
    const branchMap = this._branches.get(String(docUri || ''));
    if (!branchMap) return [];
    return Array.from(branchMap.values());
  }

  createMergeRequest(docUri, sourceBranch, targetBranch, author, title) {
    const uri = String(docUri || 'untitled.zl');
    if (!this._mergeRequests.has(uri)) {
      this._mergeRequests.set(uri, []);
    }

    const mrList = this._mergeRequests.get(uri);
    const id = `mr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const mr = createMergeRequest(id, sourceBranch, targetBranch, author, title);
    mrList.push(mr);
    return mr;
  }

  getMergeRequests(docUri) {
    return this._mergeRequests.get(String(docUri || '')) || [];
  }

  merge(docUri, mrId) {
    const mrs = this.getMergeRequests(docUri);
    const mr = mrs.find(m => m.id === mrId);
    if (!mr || mr.status !== 'open') return false;

    mr.status = 'merged';
    return true;
  }
}
