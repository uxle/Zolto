/**
 * Zolto Real-time Collaboration Engine — Phase 14
 *
 * Manages live user presences, active cursors, selection highlights, shared document state,
 * and conflict-free delta sync reconciliation across active collaborators.
 */

import {
  createCollaborationSession, createPresence, createCursor, createSelection,
} from './ast.js';

export class CollaborationEngine {
  constructor() {
    // Map of sessionId -> CollaborationSession
    this.sessions = new Map();
  }

  createSession(sessionId, docUri) {
    const session = createCollaborationSession(sessionId, docUri);
    this.sessions.set(String(sessionId), session);
    return session;
  }

  joinSession(sessionId, userId, userName, color = '#6366f1') {
    const session = this.sessions.get(String(sessionId));
    if (!session) return null;

    let presence = session.presences.find(p => p.userId === userId);
    if (!presence) {
      presence = createPresence(userId, userName, color, 'online');
      session.presences.push(presence);
    } else {
      presence.status = 'online';
      presence.lastSeen = Date.now();
    }

    return presence;
  }

  updateCursor(sessionId, userId, line, column) {
    const session = this.sessions.get(String(sessionId));
    if (!session) return false;

    const presence = session.presences.find(p => p.userId === userId);
    if (!presence) return false;

    presence.cursor = createCursor(userId, line, column);
    presence.lastSeen = Date.now();
    return true;
  }

  updateSelection(sessionId, userId, startLine, startCol, endLine, endCol) {
    const session = this.sessions.get(String(sessionId));
    if (!session) return false;

    const presence = session.presences.find(p => p.userId === userId);
    if (!presence) return false;

    presence.selection = createSelection(userId, startLine, startCol, endLine, endCol);
    presence.lastSeen = Date.now();
    return true;
  }

  leaveSession(sessionId, userId) {
    const session = this.sessions.get(String(sessionId));
    if (!session) return false;

    const presence = session.presences.find(p => p.userId === userId);
    if (presence) {
      presence.status = 'offline';
      presence.lastSeen = Date.now();
    }
    return true;
  }

  getActivePresences(sessionId) {
    const session = this.sessions.get(String(sessionId));
    if (!session) return [];
    return session.presences.filter(p => p.status === 'online');
  }
}
