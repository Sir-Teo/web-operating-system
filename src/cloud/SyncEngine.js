/**
 * SyncEngine - Real-time file synchronization with conflict resolution
 * Handles bidirectional sync between local VFS and cloud storage
 */
export class SyncEngine {
  constructor(vfs, cloudProvider) {
    this.vfs = vfs;
    this.cloud = cloudProvider;
    this.syncPairs = new Map(); // Map of local -> cloud path pairs
    this.syncQueue = [];
    this.watching = new Map();
    this.syncing = false;
    this.syncInterval = null;
    this.conflictStrategy = 'keep-both'; // 'keep-both' | 'local-wins' | 'cloud-wins' | 'newest-wins'
    this.offlineQueue = [];
    this.isOnline = navigator.onLine;

    // Bandwidth throttling settings
    this.bandwidthLimit = 0; // bytes per second (0 = unlimited)
    this.transferredBytes = 0;
    this.transferStartTime = Date.now();
    this.throttleDelay = 100; // ms between throttle checks

    // Selective sync settings
    this.selectiveSyncRules = new Map(); // Map of syncId -> rules
    this.excludePatterns = []; // Global exclude patterns (e.g., ['.git', 'node_modules'])

    // Listen to online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Start syncing a local path with a cloud path
   * @param {string} localPath - Local file system path
   * @param {string} cloudPath - Cloud storage path
   * @param {Object} options - Sync options
   */
  async startSync(localPath, cloudPath, options = {}) {
    if (!this.cloud.isAuthenticated()) {
      throw new Error('Cloud provider not authenticated');
    }

    const syncId = `${localPath}->${cloudPath}`;

    // Initial full sync
    await this.fullSync(localPath, cloudPath, options);

    // Setup file watching
    if (options.watch !== false) {
      await this.setupWatching(localPath, cloudPath, syncId);
    }

    // Store sync pair
    this.syncPairs.set(syncId, {
      localPath,
      cloudPath,
      options,
      lastSync: Date.now(),
      status: 'active'
    });

    // Start periodic sync if not already running
    if (!this.syncInterval && options.interval !== false) {
      this.startPeriodicSync(options.interval || 60000); // Default: 1 minute
    }

    return syncId;
  }

  /**
   * Stop syncing a path pair
   * @param {string} syncId - Sync pair ID
   */
  async stopSync(syncId) {
    const syncPair = this.syncPairs.get(syncId);
    if (!syncPair) {
      throw new Error(`Sync pair not found: ${syncId}`);
    }

    // Stop watching
    const watcher = this.watching.get(syncId);
    if (watcher) {
      watcher();
      this.watching.delete(syncId);
    }

    // Remove from sync pairs
    this.syncPairs.delete(syncId);

    // Stop periodic sync if no more pairs
    if (this.syncPairs.size === 0 && this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Perform full synchronization
   * @param {string} localPath - Local path
   * @param {string} cloudPath - Cloud path
   * @param {Object} options - Sync options
   */
  async fullSync(localPath, cloudPath, options = {}) {
    this.syncing = true;

    try {
      // Get local files
      const localFiles = await this.getLocalFiles(localPath);

      // Get cloud files
      const cloudFiles = await this.getCloudFiles(cloudPath);

      // Create file maps for comparison
      const localMap = new Map(localFiles.map(f => [f.relativePath, f]));
      const cloudMap = new Map(cloudFiles.map(f => [f.relativePath, f]));

      // Find files to sync
      const toUpload = [];
      const toDownload = [];
      const conflicts = [];

      // Check local files
      for (const [relativePath, localFile] of localMap) {
        const cloudFile = cloudMap.get(relativePath);

        if (!cloudFile) {
          // File only exists locally
          toUpload.push({ relativePath, localFile });
        } else {
          // File exists in both places - check for conflicts
          const hasConflict = await this._hasConflict(
            localPath,
            cloudPath,
            relativePath,
            localFile,
            cloudFile
          );

          if (hasConflict) {
            conflicts.push({ relativePath, localFile, cloudFile });
          } else {
            const localModified = localFile.modified || 0;
            const cloudModified = cloudFile.modified?.getTime?.() || cloudFile.modified || 0;
            if (localModified > cloudModified) {
              toUpload.push({ relativePath, localFile });
            } else if (cloudModified > localModified) {
              toDownload.push({ relativePath, cloudFile });
            }
          }
        }
      }

      // Check cloud files
      for (const [relativePath, cloudFile] of cloudMap) {
        if (!localMap.has(relativePath)) {
          // File only exists in cloud
          toDownload.push({ relativePath, cloudFile });
        }
      }

      // Upload new local files
      for (const { relativePath, localFile } of toUpload) {
        await this.uploadFile(localPath, cloudPath, relativePath, localFile);
      }

      // Download new cloud files
      for (const { relativePath, cloudFile } of toDownload) {
        await this.downloadFile(localPath, cloudPath, relativePath, cloudFile);
      }

      // Resolve conflicts
      for (const conflict of conflicts) {
        await this.resolveConflict(localPath, cloudPath, conflict);
      }

      return {
        uploaded: toUpload.length,
        downloaded: toDownload.length,
        conflicts: conflicts.length
      };
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Get local files recursively
   * @param {string} path - Local path
   * @returns {Promise<Array>}
   */
  async getLocalFiles(path) {
    const files = [];

    const traverse = async (currentPath, basePath) => {
      try {
        const entries = await this.vfs.readdir(currentPath);

        for (const entry of entries) {
          const fullPath = `${currentPath}/${entry.name}`;
          const relativePath = fullPath.substring(basePath.length + 1);

          if (entry.type === 'directory') {
            await traverse(fullPath, basePath);
          } else {
            const stat = await this.vfs.stat(fullPath);
            files.push({
              name: entry.name,
              path: fullPath,
              relativePath,
              type: 'file',
              size: stat.size,
              modified: stat.modified
            });
          }
        }
      } catch (error) {
        // Directory might not exist yet
        console.warn(`Could not read directory ${currentPath}:`, error);
      }
    };

    await traverse(path, path);
    return files;
  }

  /**
   * Get cloud files recursively
   * @param {string} path - Cloud path
   * @returns {Promise<Array>}
   */
  async getCloudFiles(path) {
    const files = [];

    const traverse = async (currentPath, basePath) => {
      try {
        const entries = await this.cloud.listFiles(currentPath);

        for (const entry of entries) {
          const fullPath = `${currentPath}/${entry.name}`;
          const relativePath = fullPath.substring(basePath.length + 1);

          if (entry.type === 'directory') {
            await traverse(fullPath, basePath);
          } else {
            files.push({
              name: entry.name,
              path: fullPath,
              relativePath,
              type: 'file',
              size: entry.size,
              modified: entry.modified
            });
          }
        }
      } catch (error) {
        // Directory might not exist yet
        console.warn(`Could not read cloud directory ${currentPath}:`, error);
      }
    };

    await traverse(path, path);
    return files;
  }

  /**
   * Upload a file to cloud
   * @param {string} localBasePath - Local base path
   * @param {string} cloudBasePath - Cloud base path
   * @param {string} relativePath - Relative file path
   * @param {Object} localFile - Local file metadata
   */
  async uploadFile(localBasePath, cloudBasePath, relativePath, localFile) {
    if (!this.isOnline) {
      this.offlineQueue.push({
        operation: 'upload',
        localBasePath,
        cloudBasePath,
        relativePath,
        localFile
      });
      return;
    }

    try {
      const localPath = `${localBasePath}/${relativePath}`;
      const cloudPath = `${cloudBasePath}/${relativePath}`;

      // Ensure cloud parent directory exists
      const parentPath = cloudPath.substring(0, cloudPath.lastIndexOf('/'));
      await this.ensureCloudDirectory(parentPath);

      // Read local file
      const data = await this.vfs.readFile(localPath);

      // Apply bandwidth throttling
      await this.applyThrottle(data.length);

      // Upload to cloud
      await this.cloud.writeFile(cloudPath, data);

      console.log(`Uploaded: ${relativePath}`);
    } catch (error) {
      console.error(`Failed to upload ${relativePath}:`, error);
      throw error;
    }
  }

  /**
   * Download a file from cloud
   * @param {string} localBasePath - Local base path
   * @param {string} cloudBasePath - Cloud base path
   * @param {string} relativePath - Relative file path
   * @param {Object} cloudFile - Cloud file metadata
   */
  async downloadFile(localBasePath, cloudBasePath, relativePath, cloudFile) {
    try {
      const localPath = `${localBasePath}/${relativePath}`;
      const cloudPath = `${cloudBasePath}/${relativePath}`;

      // Ensure local parent directory exists
      const parentPath = localPath.substring(0, localPath.lastIndexOf('/'));
      await this.ensureLocalDirectory(parentPath);

      // Download from cloud
      const data = await this.cloud.readFile(cloudPath);

      // Apply bandwidth throttling
      await this.applyThrottle(data.length);

      // Write to local
      await this.vfs.writeFile(localPath, data);

      console.log(`Downloaded: ${relativePath}`);
    } catch (error) {
      console.error(`Failed to download ${relativePath}:`, error);
      throw error;
    }
  }

  /**
   * Resolve sync conflict
   * @param {string} localBasePath - Local base path
   * @param {string} cloudBasePath - Cloud base path
   * @param {Object} conflict - Conflict information
   */
  async resolveConflict(localBasePath, cloudBasePath, conflict) {
    const { relativePath, localFile, cloudFile } = conflict;

    console.log(`Conflict detected: ${relativePath}`);

    switch (this.conflictStrategy) {
      case 'keep-both': {
        // Keep both versions with different names
        const localPath = `${localBasePath}/${relativePath}`;
        const cloudPath = `${cloudBasePath}/${relativePath}`;

        // Download cloud version with conflict suffix
        const conflictPath = this.getConflictPath(localPath);
        const cloudData = await this.cloud.readFile(cloudPath);
        await this.vfs.writeFile(conflictPath, cloudData);

        // Upload local version
        const localData = await this.vfs.readFile(localPath);
        await this.cloud.writeFile(cloudPath, localData);

        console.log(`Kept both versions: ${relativePath} and ${conflictPath}`);
        break;
      }

      case 'local-wins': {
        // Local version wins
        await this.uploadFile(localBasePath, cloudBasePath, relativePath, localFile);
        console.log(`Local version won: ${relativePath}`);
        break;
      }

      case 'cloud-wins': {
        // Cloud version wins
        await this.downloadFile(localBasePath, cloudBasePath, relativePath, cloudFile);
        console.log(`Cloud version won: ${relativePath}`);
        break;
      }

      case 'newest-wins': {
        // Newest version wins
        const localModified = localFile.modified || 0;
        const cloudModified = cloudFile.modified?.getTime() || 0;

        if (localModified > cloudModified) {
          await this.uploadFile(localBasePath, cloudBasePath, relativePath, localFile);
          console.log(`Local (newer) version won: ${relativePath}`);
        } else {
          await this.downloadFile(localBasePath, cloudBasePath, relativePath, cloudFile);
          console.log(`Cloud (newer) version won: ${relativePath}`);
        }
        break;
      }

      default:
        throw new Error(`Unknown conflict strategy: ${this.conflictStrategy}`);
    }
  }

  /**
   * Setup file watching for a sync pair
   * @param {string} localPath - Local path
   * @param {string} cloudPath - Cloud path
   * @param {string} syncId - Sync ID
   */
  async setupWatching(localPath, cloudPath, syncId) {
    // Note: File watching would require FileWatcher integration
    // For now, we rely on periodic sync
    console.log(`Watching ${localPath} for changes`);
  }

  /**
   * Start periodic synchronization
   * @param {number} interval - Sync interval in milliseconds
   */
  startPeriodicSync(interval) {
    this.syncInterval = setInterval(async () => {
      if (this.syncing || !this.isOnline) return;

      for (const [syncId, syncPair] of this.syncPairs) {
        try {
          await this.fullSync(syncPair.localPath, syncPair.cloudPath, syncPair.options);
          syncPair.lastSync = Date.now();
        } catch (error) {
          console.error(`Periodic sync failed for ${syncId}:`, error);
        }
      }
    }, interval);
  }

  /**
   * Process offline queue when coming back online
   */
  async processOfflineQueue() {
    if (!this.isOnline || this.offlineQueue.length === 0) return;

    console.log(`Processing ${this.offlineQueue.length} offline operations`);

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const operation of queue) {
      try {
        if (operation.operation === 'upload') {
          await this.uploadFile(
            operation.localBasePath,
            operation.cloudBasePath,
            operation.relativePath,
            operation.localFile
          );
        }
      } catch (error) {
        console.error('Failed to process offline operation:', error);
        // Re-queue on failure
        this.offlineQueue.push(operation);
      }
    }
  }

  /**
   * Ensure cloud directory exists
   * @param {string} path - Directory path
   */
  async ensureCloudDirectory(path) {
    if (!path || path === '/') return;

    try {
      await this.cloud.createDirectory(path);
    } catch (error) {
      // Directory might already exist
      console.debug(`Cloud directory might exist: ${path}`);
    }
  }

  /**
   * Ensure local directory exists
   * @param {string} path - Directory path
   */
  async ensureLocalDirectory(path) {
    if (!path || path === '/') return;

    try {
      await this.vfs.mkdir(path, { recursive: true });
    } catch (error) {
      // Directory might already exist
      console.debug(`Local directory might exist: ${path}`);
    }
  }

  /**
   * Get conflict path for a file
   * @param {string} path - Original file path
   * @returns {string} Conflict path
   */
  getConflictPath(path) {
    const lastSlash = path.lastIndexOf('/');
    const lastDot = path.lastIndexOf('.');
    const hasExt = lastDot > lastSlash;
    const ext = hasExt ? path.substring(lastDot) : '';
    const base = hasExt ? path.substring(0, lastDot) : path;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${base}.conflict.${timestamp}${ext}`;
  }

  /**
   * Set conflict resolution strategy
   * @param {string} strategy - 'keep-both' | 'local-wins' | 'cloud-wins' | 'newest-wins'
   */
  setConflictStrategy(strategy) {
    const validStrategies = ['keep-both', 'local-wins', 'cloud-wins', 'newest-wins'];
    if (!validStrategies.includes(strategy)) {
      throw new Error(`Invalid strategy. Must be one of: ${validStrategies.join(', ')}`);
    }
    this.conflictStrategy = strategy;
  }

  /**
   * Set bandwidth limit for transfers
   * @param {number} bytesPerSecond - Bandwidth limit (0 = unlimited)
   */
  setBandwidthLimit(bytesPerSecond) {
    this.bandwidthLimit = Math.max(0, bytesPerSecond);
    this.transferredBytes = 0;
    this.transferStartTime = Date.now();
  }

  /**
   * Apply bandwidth throttling
   * @param {number} bytes - Number of bytes transferred
   */
  async applyThrottle(bytes) {
    if (this.bandwidthLimit === 0) {
      return; // No throttling
    }

    this.transferredBytes += bytes;
    const elapsedSeconds = (Date.now() - this.transferStartTime) / 1000;
    const currentRate = this.transferredBytes / elapsedSeconds;

    if (currentRate > this.bandwidthLimit) {
      // Calculate delay needed to stay within limit
      const targetTime = this.transferredBytes / this.bandwidthLimit;
      const delayMs = (targetTime - elapsedSeconds) * 1000;

      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    // Reset counter periodically to prevent overflow
    if (elapsedSeconds > 60) {
      this.transferredBytes = 0;
      this.transferStartTime = Date.now();
    }
  }

  /**
   * Set global exclude patterns for selective sync
   * @param {Array<string>} patterns - Patterns to exclude (e.g., ['.git', 'node_modules'])
   */
  setExcludePatterns(patterns) {
    this.excludePatterns = patterns || [];
  }

  /**
   * Set selective sync rules for a sync pair
   * @param {string} syncId - Sync pair ID
   * @param {Object} rules - Selective sync rules
   */
  setSelectiveSyncRules(syncId, rules) {
    this.selectiveSyncRules.set(syncId, {
      includeFolders: rules.includeFolders || [], // Only sync these folders
      excludeFolders: rules.excludeFolders || [], // Exclude these folders
      includeExtensions: rules.includeExtensions || [], // Only sync these file types
      excludeExtensions: rules.excludeExtensions || [], // Exclude these file types
      maxFileSize: rules.maxFileSize || 0, // Max file size (0 = unlimited)
      ...rules
    });
  }

  /**
   * Check if a file should be synced based on selective sync rules
   * @param {string} relativePath - Relative file path
   * @param {Object} fileInfo - File information
   * @param {string} syncId - Sync pair ID
   * @returns {boolean} True if file should be synced
   */
  shouldSyncFile(relativePath, fileInfo, syncId) {
    // Check global exclude patterns
    for (const pattern of this.excludePatterns) {
      if (relativePath.includes(pattern)) {
        return false;
      }
    }

    // Check sync-specific rules
    const rules = this.selectiveSyncRules.get(syncId);
    if (!rules) {
      return true; // No rules = sync everything
    }

    // Check include folders (if specified, only sync files in these folders)
    if (rules.includeFolders && rules.includeFolders.length > 0) {
      const inIncludedFolder = rules.includeFolders.some(folder =>
        relativePath.startsWith(folder)
      );
      if (!inIncludedFolder) {
        return false;
      }
    }

    // Check exclude folders
    if (rules.excludeFolders && rules.excludeFolders.length > 0) {
      const inExcludedFolder = rules.excludeFolders.some(folder =>
        relativePath.startsWith(folder)
      );
      if (inExcludedFolder) {
        return false;
      }
    }

    // Check file extensions
    const ext = relativePath.substring(relativePath.lastIndexOf('.'));

    if (rules.includeExtensions && rules.includeExtensions.length > 0) {
      if (!rules.includeExtensions.includes(ext)) {
        return false;
      }
    }

    if (rules.excludeExtensions && rules.excludeExtensions.length > 0) {
      if (rules.excludeExtensions.includes(ext)) {
        return false;
      }
    }

    // Check file size
    if (rules.maxFileSize > 0 && fileInfo.size > rules.maxFileSize) {
      return false;
    }

    return true;
  }

  /**
   * Get sync status
   * @returns {Object}
   */
  getStatus() {
    return {
      syncing: this.syncing,
      activeSyncs: this.syncPairs.size,
      offlineQueue: this.offlineQueue.length,
      isOnline: this.isOnline,
      conflictStrategy: this.conflictStrategy,
      bandwidthLimit: this.bandwidthLimit,
      transferredBytes: this.transferredBytes,
      excludePatterns: this.excludePatterns,
      syncPairs: Array.from(this.syncPairs.entries()).map(([id, pair]) => ({
        id,
        ...pair,
        selectiveRules: this.selectiveSyncRules.get(id)
      }))
    };
  }

  /**
   * Stop all syncing
   */
  async stopAll() {
    // Stop all watchers
    for (const cleanup of this.watching.values()) {
      cleanup();
    }
    this.watching.clear();

    // Clear periodic sync
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Clear sync pairs
    this.syncPairs.clear();
  }

  /**
   * Determine if local and cloud versions are in conflict
   */
  async _hasConflict(localBasePath, cloudBasePath, relativePath, localFile, cloudFile) {
    const localModified = localFile.modified || 0;
    const cloudModified = cloudFile.modified?.getTime?.() || cloudFile.modified || 0;
    const localSize = localFile.size ?? 0;
    const cloudSize = cloudFile.size ?? 0;

    if (Math.abs(localModified - cloudModified) > 1000) {
      return true;
    }

    if (localSize !== cloudSize) {
      return true;
    }

    // If metadata matches, compare contents to be sure
    try {
      const localPath = `${localBasePath}/${relativePath}`;
      const cloudPath = `${cloudBasePath}/${relativePath}`;

      const [localData, cloudData] = await Promise.all([
        this.vfs.readFile(localPath),
        this.cloud.readFile(cloudPath)
      ]);

      if (localData.length !== cloudData.length) {
        return true;
      }

      for (let i = 0; i < localData.length; i++) {
        if (localData[i] !== cloudData[i]) {
          return true;
        }
      }
    } catch (error) {
      console.warn('Conflict comparison failed, treating as conflict:', error);
      return true;
    }

    return false;
  }
}
