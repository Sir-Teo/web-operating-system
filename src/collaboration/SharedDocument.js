/**
 * SharedDocument - CRDT-based collaborative document editing
 *
 * Features:
 * - Real-time collaborative text editing
 * - Cursor tracking and synchronization
 * - Undo/redo support
 * - Conflict-free merging
 */

import * as Y from 'yjs';
import EventEmitter from '../utils/EventEmitter.js';

class SharedDocument extends EventEmitter {
  constructor(sessionId, ydoc) {
    super();

    this.sessionId = sessionId;
    this.ydoc = ydoc;

    // Get the shared text type
    this.ytext = ydoc.getText('content');

    // Awareness for cursors and selections
    this.awareness = null;

    // Local cursor position
    this.cursorPosition = { line: 0, column: 0 };

    // Remote cursors
    this.remoteCursors = new Map();

    // Setup observers
    this.setupObservers();

    console.log('[SharedDocument] Initialized for session:', sessionId);
  }

  /**
   * Set awareness instance (from provider)
   */
  setAwareness(awareness) {
    this.awareness = awareness;

    // Listen to awareness changes for cursor updates
    this.awareness.on('change', ({ added, updated, removed }) => {
      this.handleCursorChange({ added, updated, removed });
    });
  }

  /**
   * Setup observers for document changes
   */
  setupObservers() {
    // Observe text changes
    this.ytext.observe((event) => {
      this.handleTextChange(event);
    });
  }

  /**
   * Handle text changes
   */
  handleTextChange(event) {
    const delta = event.delta;

    this.emit('text-changed', {
      delta,
      content: this.getContent(),
      changes: event.changes
    });
  }

  /**
   * Get document content
   */
  getContent() {
    return this.ytext.toString();
  }

  /**
   * Set document content (replaces all)
   */
  setContent(content) {
    this.ydoc.transact(() => {
      this.ytext.delete(0, this.ytext.length);
      this.ytext.insert(0, content);
    });
  }

  /**
   * Insert text at position
   */
  insert(index, text) {
    this.ytext.insert(index, text);
  }

  /**
   * Delete text from position
   */
  delete(index, length) {
    this.ytext.delete(index, length);
  }

  /**
   * Replace text range
   */
  replace(index, length, text) {
    this.ydoc.transact(() => {
      this.ytext.delete(index, length);
      this.ytext.insert(index, text);
    });
  }

  /**
   * Update local cursor position
   */
  updateCursor(position) {
    this.cursorPosition = position;

    if (this.awareness) {
      this.awareness.setLocalStateField('cursor', {
        position,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Update local selection
   */
  updateSelection(selection) {
    if (this.awareness) {
      this.awareness.setLocalStateField('selection', {
        start: selection.start,
        end: selection.end,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle cursor changes from remote users
   */
  handleCursorChange({ added, updated, removed }) {
    if (!this.awareness) return;

    const states = this.awareness.getStates();

    // Update remote cursors
    added.forEach(clientId => {
      const state = states.get(clientId);
      if (state && state.cursor) {
        this.remoteCursors.set(clientId, {
          user: state.user,
          cursor: state.cursor,
          selection: state.selection
        });
      }
    });

    updated.forEach(clientId => {
      const state = states.get(clientId);
      if (state && state.cursor) {
        this.remoteCursors.set(clientId, {
          user: state.user,
          cursor: state.cursor,
          selection: state.selection
        });
      }
    });

    removed.forEach(clientId => {
      this.remoteCursors.delete(clientId);
    });

    this.emit('cursors-changed', {
      cursors: Array.from(this.remoteCursors.values())
    });
  }

  /**
   * Get all remote cursors
   */
  getRemoteCursors() {
    return Array.from(this.remoteCursors.values());
  }

  /**
   * Get document length
   */
  getLength() {
    return this.ytext.length;
  }

  /**
   * Apply a delta (for compatibility with editors like Quill, Monaco)
   */
  applyDelta(delta) {
    this.ydoc.transact(() => {
      let index = 0;

      delta.forEach(op => {
        if (op.retain) {
          index += op.retain;
        } else if (op.insert) {
          this.ytext.insert(index, op.insert);
          index += op.insert.length;
        } else if (op.delete) {
          this.ytext.delete(index, op.delete);
        }
      });
    });
  }

  /**
   * Convert Yjs delta to standard delta format
   */
  convertDelta(yjsDelta) {
    const delta = [];

    yjsDelta.forEach(change => {
      if (change.retain) {
        delta.push({ retain: change.retain });
      } else if (change.insert) {
        delta.push({ insert: change.insert });
      } else if (change.delete) {
        delta.push({ delete: change.delete });
      }
    });

    return delta;
  }

  /**
   * Create a snapshot of the document
   */
  createSnapshot() {
    return Y.snapshot(this.ydoc);
  }

  /**
   * Restore from a snapshot
   */
  restoreSnapshot(snapshot) {
    const restoredDoc = Y.createDocFromSnapshot(this.ydoc, snapshot);
    const restoredText = restoredDoc.getText('content').toString();
    this.setContent(restoredText);
  }

  /**
   * Get undo manager for this document
   */
  createUndoManager(options = {}) {
    return new Y.UndoManager(this.ytext, {
      captureTimeout: options.captureTimeout || 500,
      trackedOrigins: options.trackedOrigins || new Set([null])
    });
  }

  /**
   * Destroy the document
   */
  destroy() {
    // Remove all listeners
    this.removeAllListeners();

    console.log('[SharedDocument] Destroyed for session:', this.sessionId);
  }
}

export default SharedDocument;
