/**
 * Zolto Comments & Review Tools — Phase 14
 *
 * Threaded review comments, inline/block suggestions, mentions, and resolution states.
 */

import { createCommentThread, createCommentReply } from './ast.js';

export class CommentEngine {
  constructor() {
    // Map of docUri -> Map of threadId -> CommentThread
    this._threads = new Map();
  }

  addThread(docUri, targetLine, author, content) {
    const uri = String(docUri || 'untitled.zl');
    if (!this._threads.has(uri)) {
      this._threads.set(uri, new Map());
    }

    const docMap = this._threads.get(uri);
    const id = `comment-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const thread = createCommentThread(id, targetLine, author, content);
    docMap.set(id, thread);
    return thread;
  }

  addReply(docUri, threadId, author, content) {
    const thread = this.getThread(docUri, threadId);
    if (!thread) return null;

    const id = `reply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const reply = createCommentReply(id, author, content);
    thread.replies.push(reply);
    return reply;
  }

  resolveThread(docUri, threadId) {
    const thread = this.getThread(docUri, threadId);
    if (!thread) return false;
    thread.resolved = true;
    return true;
  }

  getThread(docUri, threadId) {
    const docMap = this._threads.get(String(docUri || ''));
    if (!docMap) return null;
    return docMap.get(String(threadId || '')) || null;
  }

  getThreadsForDocument(docUri) {
    const docMap = this._threads.get(String(docUri || ''));
    if (!docMap) return [];
    return Array.from(docMap.values());
  }

  getUnresolvedThreads(docUri) {
    return this.getThreadsForDocument(docUri).filter(t => !t.resolved);
  }
}
