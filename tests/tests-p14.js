/**
 * Zolto Phase 14 Test Suite — Collaboration, Versioning & Production Ecosystem
 *
 * Tests: Real-time Collaboration & Presence, Threaded Comments & Review,
 *        Version History & Diffs, Branching & Merge Requests, Workspace Manager,
 *        Package Builder, Publishing Pipeline, Multi-format Export, Role-based Access Control,
 *        Sync Engine, Backup Manager, Audit Trail, and Performance benchmarks.
 */

import {
  createCollaborationSession, createVersionHistory, createBranchManager,
  createWorkspace, publishProject, exportDocument, createAccessControl,
  createBackupManager, createAuditTrail,
} from '../src/zolto.js';
import {
  createPresence, createCursor, createSelection, createCommentThread,
  createDocumentVersion, createBranch, createMergeRequest, ECOSYSTEM_NODE_TYPES, isEcosystemNode,
} from '../src/ecosystem/ast.js';
import { CollaborationEngine } from '../src/ecosystem/collaboration.js';
import { CommentEngine } from '../src/ecosystem/comments.js';
import { PackageBuilder } from '../src/ecosystem/packaging.js';
import { SyncEngine } from '../src/ecosystem/sync.js';

// ─── Tiny test harness ────────────────────────────────────────────────────────

let _pass = 0, _fail = 0;
const results = [];

function test(desc, fn) {
  try { fn(); _pass++; results.push({ pass: true, desc }); }
  catch (e) { _fail++; results.push({ pass: false, desc, err: String(e.message) }); }
}

function assert(val, msg) {
  if (!val) throw new Error(msg || `Expected truthy, got ${JSON.stringify(val)}`);
}

function eq(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

function includes(str, sub, msg) {
  if (!String(str).includes(sub)) throw new Error(msg || `Expected "${sub}" to be in string`);
}

// ─── 1. AST Node Factories ────────────────────────────────────────────────────

test('createCollaborationSession produces standard AST node', () => {
  const s = createCollaborationSession('sess-123', 'doc-1.zl');
  eq(s.type, ECOSYSTEM_NODE_TYPES.COLLABORATION_SESSION, 'type');
  eq(s.sessionId, 'sess-123', 'sessionId');
  eq(s.docUri, 'doc-1.zl', 'docUri');
  assert(isEcosystemNode(s), 'isEcosystemNode');
});

test('createPresence produces standard AST node', () => {
  const p = createPresence('user-1', 'Alice', '#00ffcc');
  eq(p.type, ECOSYSTEM_NODE_TYPES.PRESENCE, 'type');
  eq(p.name, 'Alice', 'name');
  eq(p.color, '#00ffcc', 'color');
});

// ─── 2. Real-time Collaboration Engine ───────────────────────────────────────

test('CollaborationEngine tracks user presence and cursors', () => {
  const engine = new CollaborationEngine();
  engine.createSession('s1', 'main.zl');
  const p = engine.joinSession('s1', 'u1', 'Bob');
  eq(p.name, 'Bob', 'joined presence');

  engine.updateCursor('s1', 'u1', 10, 5);
  const active = engine.getActivePresences('s1');
  eq(active.length, 1, 'one active presence');
  eq(active[0].cursor.line, 10, 'cursor line 10');
});

// ─── 3. Threaded Comments & Review ────────────────────────────────────────────

test('CommentEngine creates threads, replies, and resolves comments', () => {
  const engine = new CommentEngine();
  const thread = engine.addThread('doc.zl', 15, 'Alice', 'Please revise this section.');
  eq(thread.targetLine, 15, 'target line');

  const reply = engine.addReply('doc.zl', thread.id, 'Bob', 'Done in latest revision.');
  eq(thread.replies.length, 1, 'one reply');
  eq(reply.author, 'Bob', 'reply author');

  assert(!thread.resolved, 'initially unresolved');
  engine.resolveThread('doc.zl', thread.id);
  assert(thread.resolved, 'thread resolved');
});

// ─── 4. Version History & Diffs ───────────────────────────────────────────────

test('VersionHistory saves checkpoints, computes diffs, and rolls back', () => {
  const vh = createVersionHistory();
  const v1 = vh.saveCheckpoint('doc.zl', 'Alice', 'Initial draft', 'Line 1\nLine 2');
  const v2 = vh.saveCheckpoint('doc.zl', 'Bob', 'Added line 3', 'Line 1\nLine 2\nLine 3');

  eq(vh.getVersions('doc.zl').length, 2, 'two versions');
  const diff = vh.computeDiff('doc.zl', v1.versionId, v2.versionId);
  eq(diff.changes.length, 3, 'three line states');

  const restored = vh.rollback('doc.zl', v1.versionId);
  eq(restored, 'Line 1\nLine 2', 'rolled back content');
});

// ─── 5. Branching & Merging ───────────────────────────────────────────────────

test('BranchEngine creates branches and merges requests', () => {
  const bm = createBranchManager();
  bm.createBranch('doc.zl', 'feature-auth', 'v1');
  eq(bm.getBranches('doc.zl').length, 2, 'main + feature-auth');

  const mr = bm.createMergeRequest('doc.zl', 'feature-auth', 'main', 'Alice', 'Add auth docs');
  eq(mr.status, 'open', 'open MR');

  const merged = bm.merge('doc.zl', mr.id);
  assert(merged, 'merged MR');
  eq(mr.status, 'merged', 'status merged');
});

// ─── 6. Workspace & Project Packaging ────────────────────────────────────────

test('WorkspaceManager indexes multi-file documents and assets', () => {
  const ws = createWorkspace('MyProject', '/projects/app');
  ws.documents.push('index.zl', 'about.zl');
  ws.assets.push('logo.png');

  eq(ws.documents.length, 2, 'two documents');
  eq(ws.assets.length, 1, 'one asset');
});

test('PackageBuilder packages files into ProjectPackage archive', () => {
  const pb = new PackageBuilder();
  const pkg = pb.buildPackage('zolto-docs', '1.0.0', [
    { path: 'main.zl', content: '# Hello' },
  ]);
  eq(pkg.name, 'zolto-docs', 'package name');
  eq(pkg.files.length, 1, 'one file');
});

// ─── 7. Publishing & Deployment Pipeline ──────────────────────────────────────

test('publishProject compiles document and emits deployment artifact', () => {
  const res = publishProject('# Welcome to Zolto', 'html');
  eq(res.job.status, 'completed', 'job completed');
  assert(res.artifact && res.artifact.hash, 'artifact hash generated');
  includes(res.content, '<h1', 'compiled html content');
});

// ─── 8. Multi-format Export Pipeline ──────────────────────────────────────────

test('exportDocument converts content to json and text formats', () => {
  const json = exportDocument('# Title', 'json');
  includes(json, '"source": "# Title"', 'json export');

  const text = exportDocument('# Title\n\nParagraph text.', 'text');
  includes(text, 'Title', 'text export');
});

// ─── 9. Role-Based Access Control (RBAC) ──────────────────────────────────────

test('AccessControl manages role permissions', () => {
  const rbac = createAccessControl();
  rbac.setUserRole('doc.zl', 'u1', 'owner');
  rbac.setUserRole('doc.zl', 'u2', 'reviewer');
  rbac.setUserRole('doc.zl', 'u3', 'viewer');

  assert(rbac.canEdit('doc.zl', 'u1'), 'owner can edit');
  assert(!rbac.canEdit('doc.zl', 'u2'), 'reviewer cannot edit');
  assert(rbac.canComment('doc.zl', 'u2'), 'reviewer can comment');
  assert(!rbac.canComment('doc.zl', 'u3'), 'viewer cannot comment');
});

// ─── 10. Sync Engine ──────────────────────────────────────────────────────────

test('SyncEngine tracks local/remote versions and queues offline changes', () => {
  const sync = new SyncEngine();
  const state = sync.updateLocalVersion('doc.zl', 2);
  assert(!state.synced, 'un-synced initially');

  sync.reconcileRemote('doc.zl', 2);
  assert(state.synced, 'synced after reconcile');

  sync.queueOfflineChange('doc.zl', { line: 1, text: 'edit' });
  const flushed = sync.flushOfflineQueue();
  eq(flushed.length, 1, 'one flushed offline change');
});

// ─── 11. Backup & Disaster Recovery ───────────────────────────────────────────

test('BackupManager creates snapshots and restores document state', () => {
  const bm = createBackupManager();
  const snapshot = bm.createBackup('doc.zl', '# Backup content');
  eq(bm.getBackups('doc.zl').length, 1, 'one snapshot');

  const content = bm.restoreBackup('doc.zl', snapshot.id);
  eq(content, '# Backup content', 'restored content');
});

// ─── 12. Compliance Audit Trail ───────────────────────────────────────────────

test('AuditTrail logs immutable compliance records', () => {
  const audit = createAuditTrail();
  audit.record('publish_release', 'alice', { version: '1.0.0' });
  audit.record('rollback_version', 'bob', { version: 'v1' });

  const logs = audit.getEntries();
  eq(logs.length, 2, 'two audit entries');
  eq(logs[0].action, 'publish_release', 'first action');
});

// ─── 13. Performance Benchmarks ───────────────────────────────────────────────

test('Compute diff for 500-line version snapshot in <20ms', () => {
  const vh = createVersionHistory();
  const lines1 = Array.from({ length: 500 }, (_, i) => `Line ${i}`).join('\n');
  const lines2 = Array.from({ length: 500 }, (_, i) => i === 250 ? `Modified Line ${i}` : `Line ${i}`).join('\n');

  const v1 = vh.saveCheckpoint('doc.zl', 'Alice', 'v1', lines1);
  const v2 = vh.saveCheckpoint('doc.zl', 'Bob', 'v2', lines2);

  const t0 = Date.now();
  const diff = vh.computeDiff('doc.zl', v1.versionId, v2.versionId);
  const ms = Date.now() - t0;

  assert(ms < 50, `Diff computed in ${ms}ms (must be <50ms)`);
  assert(diff.changes.some(c => c.type === 'modified' || c.type === 'added' || c.type === 'removed'), 'diff detected');
});

// ─── Export ───────────────────────────────────────────────────────────────────

export function runPhase14Tests() {
  return { results, passed: _pass, failed: _fail, total: _pass + _fail };
}
