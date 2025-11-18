/**
 * FileWatcher - Monitors file system changes
 * Supports watching files and directories for changes
 */
export class FileWatcher extends EventTarget {
  constructor(vfs) {
    super();
    this.vfs = vfs;
    this.watchers = new Map();
    this.watchId = 1;
  }

  /**
   * Watch a file or directory for changes
   * @param {string} path - Path to watch
   * @param {Object} options - Watch options
   * @returns {number} - Watch ID
   */
  watch(path, options = {}) {
    const watchId = this.watchId++;

    const watcher = {
      id: watchId,
      path,
      recursive: options.recursive || false,
      events: options.events || ['create', 'modify', 'delete', 'rename'],
      callback: options.callback || null,
      interval: options.interval || 1000,
      lastCheck: Date.now(),
      snapshot: null,
      active: true
    };

    // Take initial snapshot
    this._takeSnapshot(watcher).then(snapshot => {
      watcher.snapshot = snapshot;
    });

    this.watchers.set(watchId, watcher);

    // Start polling for changes
    if (options.poll !== false) {
      this._startPolling(watcher);
    }

    return watchId;
  }

  /**
   * Stop watching
   */
  unwatch(watchId) {
    const watcher = this.watchers.get(watchId);
    if (watcher) {
      watcher.active = false;
      if (watcher.pollInterval) {
        clearInterval(watcher.pollInterval);
      }
      this.watchers.delete(watchId);
      return true;
    }
    return false;
  }

  /**
   * Start polling for changes
   */
  _startPolling(watcher) {
    watcher.pollInterval = setInterval(async () => {
      if (!watcher.active) {
        clearInterval(watcher.pollInterval);
        return;
      }

      try {
        await this._checkForChanges(watcher);
      } catch (error) {
        console.error('Error checking for changes:', error);
      }
    }, watcher.interval);
  }

  /**
   * Check for changes since last check
   */
  async _checkForChanges(watcher) {
    const currentSnapshot = await this._takeSnapshot(watcher);

    if (!watcher.snapshot) {
      watcher.snapshot = currentSnapshot;
      return;
    }

    const changes = this._compareSnapshots(watcher.snapshot, currentSnapshot, watcher.path);

    if (changes.length > 0) {
      for (const change of changes) {
        this._emitChange(watcher, change);
      }
    }

    watcher.snapshot = currentSnapshot;
    watcher.lastCheck = Date.now();
  }

  /**
   * Take a snapshot of the current state
   */
  async _takeSnapshot(watcher) {
    const snapshot = new Map();

    try {
      const stat = await this.vfs.stat(watcher.path);

      if (stat.type === 'directory') {
        // Snapshot directory contents
        await this._snapshotDirectory(watcher.path, snapshot, watcher.recursive);
      } else {
        // Snapshot single file
        snapshot.set(watcher.path, {
          type: 'file',
          size: stat.size,
          modified: stat.modified
        });
      }
    } catch (error) {
      // Path doesn't exist or error reading
      snapshot.set(watcher.path, { type: 'missing' });
    }

    return snapshot;
  }

  /**
   * Snapshot a directory recursively
   */
  async _snapshotDirectory(dirPath, snapshot, recursive, depth = 0) {
    if (depth > 10) return; // Prevent infinite recursion

    try {
      const entries = await this.vfs.readdir(dirPath);

      for (const entry of entries) {
        const fullPath = `${dirPath}/${entry.name}`;

        snapshot.set(fullPath, {
          type: entry.type,
          size: entry.size || 0,
          modified: entry.modified || Date.now()
        });

        if (recursive && entry.type === 'directory') {
          await this._snapshotDirectory(fullPath, snapshot, recursive, depth + 1);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
  }

  /**
   * Compare two snapshots to find changes
   */
  _compareSnapshots(oldSnapshot, newSnapshot, basePath) {
    const changes = [];

    // Check for new and modified files
    for (const [path, newState] of newSnapshot.entries()) {
      const oldState = oldSnapshot.get(path);

      if (!oldState) {
        // New file/directory
        changes.push({
          type: 'create',
          path: path,
          fileType: newState.type
        });
      } else if (oldState.type !== 'missing' && newState.type !== 'missing') {
        // Check for modifications
        if (oldState.modified !== newState.modified || oldState.size !== newState.size) {
          changes.push({
            type: 'modify',
            path: path,
            fileType: newState.type,
            oldSize: oldState.size,
            newSize: newState.size
          });
        }
      }
    }

    // Check for deleted files
    for (const [path, oldState] of oldSnapshot.entries()) {
      if (!newSnapshot.has(path)) {
        changes.push({
          type: 'delete',
          path: path,
          fileType: oldState.type
        });
      }
    }

    return changes;
  }

  /**
   * Emit a change event
   */
  _emitChange(watcher, change) {
    // Check if this event type is being watched
    if (!watcher.events.includes(change.type)) {
      return;
    }

    // Create event
    const event = new CustomEvent('change', {
      detail: {
        watchId: watcher.id,
        path: watcher.path,
        change: change,
        timestamp: Date.now()
      }
    });

    // Dispatch to EventTarget
    this.dispatchEvent(event);

    // Call callback if provided
    if (watcher.callback) {
      watcher.callback(change);
    }
  }

  /**
   * Get active watchers
   */
  getActiveWatchers() {
    return Array.from(this.watchers.values()).filter(w => w.active);
  }

  /**
   * Get watcher info
   */
  getWatcherInfo(watchId) {
    const watcher = this.watchers.get(watchId);
    if (!watcher) return null;

    return {
      id: watcher.id,
      path: watcher.path,
      recursive: watcher.recursive,
      events: watcher.events,
      active: watcher.active,
      lastCheck: watcher.lastCheck
    };
  }

  /**
   * Stop all watchers
   */
  stopAll() {
    for (const watcher of this.watchers.values()) {
      watcher.active = false;
      if (watcher.pollInterval) {
        clearInterval(watcher.pollInterval);
      }
    }
    this.watchers.clear();
  }

  /**
   * Manual trigger of change detection
   */
  async checkNow(watchId) {
    const watcher = this.watchers.get(watchId);
    if (watcher && watcher.active) {
      await this._checkForChanges(watcher);
    }
  }
}
