/**
 * SharedWorkspace - Collaborative workspace management
 *
 * Features:
 * - Share entire workspaces with team members
 * - Synchronize window states and positions
 * - Share application states
 * - Collaborative desktop environment
 */

import EventEmitter from '../utils/EventEmitter.js';

class SharedWorkspace extends EventEmitter {
  constructor(sessionId, ydoc) {
    super();

    this.sessionId = sessionId;
    this.ydoc = ydoc;

    // Get shared workspace map
    this.workspaceMap = ydoc.getMap('workspace');

    // Local workspace state
    this.localState = {
      windows: new Map(),
      apps: new Map(),
      desktop: {}
    };

    // Setup observers
    this.setupObservers();

    console.log('[SharedWorkspace] Initialized for session:', sessionId);
  }

  /**
   * Setup observers
   */
  setupObservers() {
    // Observe workspace changes
    this.workspaceMap.observe((event) => {
      this.handleWorkspaceChange(event);
    });
  }

  /**
   * Handle workspace changes
   */
  handleWorkspaceChange(event) {
    event.changes.keys.forEach((change, key) => {
      if (change.action === 'add' || change.action === 'update') {
        const value = this.workspaceMap.get(key);
        this.emit('workspace-updated', { key, value });
      } else if (change.action === 'delete') {
        this.emit('workspace-deleted', { key });
      }
    });
  }

  /**
   * Share window state
   */
  shareWindow(windowId, windowState) {
    const windows = this.workspaceMap.get('windows') || {};

    windows[windowId] = {
      ...windowState,
      timestamp: Date.now()
    };

    this.workspaceMap.set('windows', windows);
  }

  /**
   * Remove shared window
   */
  removeWindow(windowId) {
    const windows = this.workspaceMap.get('windows') || {};
    delete windows[windowId];
    this.workspaceMap.set('windows', windows);
  }

  /**
   * Get all shared windows
   */
  getWindows() {
    return this.workspaceMap.get('windows') || {};
  }

  /**
   * Share application state
   */
  shareAppState(appId, appState) {
    const apps = this.workspaceMap.get('apps') || {};

    apps[appId] = {
      ...appState,
      timestamp: Date.now()
    };

    this.workspaceMap.set('apps', apps);
  }

  /**
   * Get shared application state
   */
  getAppState(appId) {
    const apps = this.workspaceMap.get('apps') || {};
    return apps[appId];
  }

  /**
   * Share desktop state
   */
  shareDesktopState(desktopState) {
    this.workspaceMap.set('desktop', {
      ...desktopState,
      timestamp: Date.now()
    });
  }

  /**
   * Get desktop state
   */
  getDesktopState() {
    return this.workspaceMap.get('desktop') || {};
  }

  /**
   * Set workspace metadata
   */
  setMetadata(metadata) {
    this.workspaceMap.set('metadata', {
      ...metadata,
      updatedAt: Date.now()
    });
  }

  /**
   * Get workspace metadata
   */
  getMetadata() {
    return this.workspaceMap.get('metadata') || {};
  }

  /**
   * Clear workspace
   */
  clear() {
    this.workspaceMap.clear();
  }

  /**
   * Destroy the shared workspace
   */
  destroy() {
    this.removeAllListeners();
    console.log('[SharedWorkspace] Destroyed for session:', this.sessionId);
  }
}

export default SharedWorkspace;
