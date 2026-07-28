/**
 * Zolto Ecosystem AST Node Factories — Phase 14
 *
 * Monomorphic AST node factories for collaboration, comments, version history,
 * branching, workspace, packaging, publishing, deployment, access control,
 * audit trail, sync state, and backup snapshots.
 *
 * Contract:
 *   - All fields are present on every node (no missing keys)
 *   - Missing optional values use null, not undefined
 *   - Collections use arrays, never null
 */

export const ECOSYSTEM_NODE_TYPES = Object.freeze({
  COLLABORATION_SESSION: 'collaboration_session',
  PRESENCE:              'presence',
  CURSOR:                'cursor',
  SELECTION:             'selection',
  COMMENT_THREAD:        'comment_thread',
  COMMENT_REPLY:         'comment_reply',
  DOCUMENT_VERSION:      'document_version',
  VERSION_DIFF:          'version_diff',
  BRANCH:                'branch',
  MERGE_REQUEST:         'merge_request',
  WORKSPACE:             'workspace',
  PROJECT_PACKAGE:       'project_package',
  PUBLISH_JOB:           'publish_job',
  DEPLOYMENT_ARTIFACT:   'deployment_artifact',
  ACCESS_CONTROL_ENTRY:  'access_control_entry',
  AUDIT_ENTRY:           'audit_entry',
  SYNC_STATE:            'sync_state',
  BACKUP_SNAPSHOT:       'backup_snapshot',
});

export const ROLES = Object.freeze([
  'owner',
  'admin',
  'editor',
  'reviewer',
  'commenter',
  'viewer',
  'guest',
]);

// ─── Node Factories ───────────────────────────────────────────────────────────

export function createCollaborationSession(sessionId, docUri, options = {}) {
  return {
    type:        ECOSYSTEM_NODE_TYPES.COLLABORATION_SESSION,
    sessionId:   String(sessionId || ''),
    docUri:      String(docUri || ''),
    presences:   Array.isArray(options.presences) ? options.presences : [],
    version:     options.version != null ? Number(options.version) : 1,
    activeSince: options.activeSince != null ? Number(options.activeSince) : Date.now(),
  };
}

export function createPresence(userId, name, color = '#6366f1', status = 'online') {
  return {
    type:     ECOSYSTEM_NODE_TYPES.PRESENCE,
    userId:   String(userId || ''),
    name:     String(name || 'Anonymous'),
    color:    String(color || '#6366f1'),
    status:   String(status || 'online'),
    cursor:   null,
    selection:null,
    lastSeen: Date.now(),
  };
}

export function createCursor(userId, line = 1, column = 1) {
  return {
    type:   ECOSYSTEM_NODE_TYPES.CURSOR,
    userId: String(userId || ''),
    line:   Number(line || 1),
    column: Number(column || 1),
  };
}

export function createSelection(userId, startLine = 1, startCol = 1, endLine = 1, endCol = 1) {
  return {
    type:      ECOSYSTEM_NODE_TYPES.SELECTION,
    userId:    String(userId || ''),
    startLine: Number(startLine || 1),
    startCol:  Number(startCol || 1),
    endLine:   Number(endLine || 1),
    endCol:    Number(endCol || 1),
  };
}

export function createCommentThread(id, targetLine, author, content, options = {}) {
  return {
    type:       ECOSYSTEM_NODE_TYPES.COMMENT_THREAD,
    id:         String(id || ''),
    targetLine: Number(targetLine || 1),
    author:     String(author || ''),
    content:    String(content || ''),
    resolved:   options.resolved === true,
    replies:    Array.isArray(options.replies) ? options.replies : [],
    createdAt:  options.createdAt != null ? Number(options.createdAt) : Date.now(),
  };
}

export function createCommentReply(id, author, content, options = {}) {
  return {
    type:      ECOSYSTEM_NODE_TYPES.COMMENT_REPLY,
    id:        String(id || ''),
    author:    String(author || ''),
    content:   String(content || ''),
    createdAt: options.createdAt != null ? Number(options.createdAt) : Date.now(),
  };
}

export function createDocumentVersion(versionId, versionNumber, author, label = null, snapshot = '') {
  return {
    type:          ECOSYSTEM_NODE_TYPES.DOCUMENT_VERSION,
    versionId:     String(versionId || ''),
    versionNumber: Number(versionNumber || 1),
    author:        String(author || ''),
    label:         label ? String(label) : null,
    snapshot:      String(snapshot || ''),
    timestamp:     Date.now(),
  };
}

export function createVersionDiff(fromVersion, toVersion, changes = []) {
  return {
    type:        ECOSYSTEM_NODE_TYPES.VERSION_DIFF,
    fromVersion: String(fromVersion || ''),
    toVersion:   String(toVersion || ''),
    changes:     Array.isArray(changes) ? changes : [],
  };
}

export function createBranch(name, baseVersion, author = 'system') {
  return {
    type:        ECOSYSTEM_NODE_TYPES.BRANCH,
    name:        String(name || 'main'),
    baseVersion: String(baseVersion || ''),
    author:      String(author || ''),
    createdAt:   Date.now(),
  };
}

export function createMergeRequest(id, sourceBranch, targetBranch, author, title) {
  return {
    type:         ECOSYSTEM_NODE_TYPES.MERGE_REQUEST,
    id:           String(id || ''),
    sourceBranch: String(sourceBranch || ''),
    targetBranch: String(targetBranch || 'main'),
    author:       String(author || ''),
    title:        String(title || ''),
    status:       'open', // 'open', 'merged', 'closed'
    conflicts:    [],
    createdAt:    Date.now(),
  };
}

export function createWorkspace(name, rootUri, options = {}) {
  return {
    type:        ECOSYSTEM_NODE_TYPES.WORKSPACE,
    name:        String(name || 'Untitled Workspace'),
    rootUri:     String(rootUri || ''),
    documents:   Array.isArray(options.documents) ? options.documents : [],
    assets:      Array.isArray(options.assets) ? options.assets : [],
    members:     Array.isArray(options.members) ? options.members : [],
  };
}

export function createProjectPackage(name, version = '1.0.0', options = {}) {
  return {
    type:        ECOSYSTEM_NODE_TYPES.PROJECT_PACKAGE,
    name:        String(name || ''),
    version:     String(version || '1.0.0'),
    files:       Array.isArray(options.files) ? options.files : [],
    metadata:    options.metadata && typeof options.metadata === 'object' ? options.metadata : {},
    createdAt:   Date.now(),
  };
}

export function createPublishJob(id, targetFormat, options = {}) {
  return {
    type:         ECOSYSTEM_NODE_TYPES.PUBLISH_JOB,
    id:           String(id || ''),
    targetFormat: String(targetFormat || 'html'),
    status:       options.status || 'pending', // 'pending', 'processing', 'completed', 'failed'
    artifactUri:  options.artifactUri ? String(options.artifactUri) : null,
    createdAt:    Date.now(),
  };
}

export function createDeploymentArtifact(id, version, hash, uri) {
  return {
    type:      ECOSYSTEM_NODE_TYPES.DEPLOYMENT_ARTIFACT,
    id:        String(id || ''),
    version:   String(version || '1.0.0'),
    hash:      String(hash || ''),
    uri:       String(uri || ''),
    createdAt: Date.now(),
  };
}

export function createAccessControlEntry(userId, role = 'viewer') {
  return {
    type:   ECOSYSTEM_NODE_TYPES.ACCESS_CONTROL_ENTRY,
    userId: String(userId || ''),
    role:   ROLES.includes(role) ? role : 'viewer',
  };
}

export function createAuditEntry(action, userId, details = {}) {
  return {
    type:      ECOSYSTEM_NODE_TYPES.AUDIT_ENTRY,
    id:        `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action:    String(action || ''),
    userId:    String(userId || 'system'),
    details:   details && typeof details === 'object' ? details : {},
    timestamp: Date.now(),
  };
}

export function createSyncState(docUri, localVersion, remoteVersion) {
  return {
    type:          ECOSYSTEM_NODE_TYPES.SYNC_STATE,
    docUri:        String(docUri || ''),
    localVersion:  Number(localVersion || 1),
    remoteVersion: Number(remoteVersion || 1),
    synced:        localVersion === remoteVersion,
    lastSync:      Date.now(),
  };
}

export function createBackupSnapshot(id, docUri, content) {
  return {
    type:      ECOSYSTEM_NODE_TYPES.BACKUP_SNAPSHOT,
    id:        String(id || ''),
    docUri:    String(docUri || ''),
    content:   String(content || ''),
    createdAt: Date.now(),
  };
}

// ─── Type Guard ───────────────────────────────────────────────────────────────

const _ALL_ECOSYSTEM_TYPES = new Set(Object.values(ECOSYSTEM_NODE_TYPES));

export function isEcosystemNode(node) {
  return node != null && typeof node === 'object' && _ALL_ECOSYSTEM_TYPES.has(node.type);
}
