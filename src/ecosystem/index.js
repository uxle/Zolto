/**
 * Zolto Collaboration & Production Ecosystem Subsystem Entry Point — Phase 14
 *
 * Public API façade for real-time collaboration, review comments, versioning,
 * branching, workspace packaging, publishing pipeline, access control, audit trail.
 */

import { CollaborationEngine } from './collaboration.js';
import { CommentEngine } from './comments.js';
import { VersionHistory } from './versioning.js';
import { BranchEngine } from './branching.js';
import { WorkspaceManager } from './workspace.js';
import { PackageBuilder } from './packaging.js';
import { PublishingPipeline } from './publishing.js';
import { ExportPipeline } from './export.js';
import { AccessControl } from './access-control.js';
import { SyncEngine } from './sync.js';
import { BackupManager } from './backup.js';
import { AuditTrail } from './audit.js';
import { EcosystemValidator } from './validator.js';
import { ECOSYSTEM_NODE_TYPES, isEcosystemNode } from './ast.js';

export {
  ECOSYSTEM_NODE_TYPES,
  isEcosystemNode,
  CollaborationEngine,
  CommentEngine,
  VersionHistory,
  BranchEngine,
  WorkspaceManager,
  PackageBuilder,
  PublishingPipeline,
  ExportPipeline,
  AccessControl,
  SyncEngine,
  BackupManager,
  AuditTrail,
  EcosystemValidator,
};

export function createCollaborationSession(sessionId, docUri) {
  const engine = new CollaborationEngine();
  return engine.createSession(sessionId, docUri);
}

export function createVersionHistory() {
  return new VersionHistory();
}

export function createBranchManager() {
  return new BranchEngine();
}

export function createWorkspace(name, rootUri, options = {}) {
  const manager = new WorkspaceManager();
  return manager.createWorkspace(name, rootUri, options);
}

export function publishProject(src, targetFormat = 'html', options = {}) {
  const pipeline = new PublishingPipeline();
  return pipeline.publishDocument(src, targetFormat, options);
}

export function exportDocument(input, format = 'html', options = {}) {
  const pipeline = new ExportPipeline();
  return pipeline.export(input, format, options);
}

export function createAccessControl() {
  return new AccessControl();
}

export function createBackupManager() {
  return new BackupManager();
}

export function createAuditTrail() {
  return new AuditTrail();
}
