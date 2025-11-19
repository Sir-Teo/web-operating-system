import { WebDAVProvider, MockCloudProvider } from './CloudProvider.js';
import { GoogleDriveProvider } from './GoogleDriveProvider.js';
import { DropboxProvider } from './DropboxProvider.js';
import { OneDriveProvider } from './OneDriveProvider.js';
import { SyncEngine } from './SyncEngine.js';

/**
 * CloudStorageManager - Main orchestrator for cloud storage operations
 * Manages cloud providers, mounting, and synchronization
 */
export class CloudStorageManager {
  constructor(vfs) {
    this.vfs = vfs;
    this.providers = new Map();
    this.mounts = new Map(); // Map of mount points to providers
    this.syncEngines = new Map();
  }

  /**
   * Register a cloud provider
   * @param {string} name - Provider name
   * @param {CloudProvider} provider - Provider instance
   */
  registerProvider(name, provider) {
    this.providers.set(name, provider);
  }

  /**
   * Get a registered provider
   * @param {string} name - Provider name
   * @returns {CloudProvider}
   */
  getProvider(name) {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider not found: ${name}`);
    }
    return provider;
  }

  /**
   * Connect to a cloud provider
   * @param {string} providerType - Type of provider (webdav, google-drive, dropbox, onedrive, mock)
   * @param {Object} config - Provider configuration
   * @returns {Promise<string>} Provider ID
   */
  async connect(providerType, config) {
    let provider;

    switch (providerType.toLowerCase()) {
      case 'webdav':
        provider = new WebDAVProvider(config);
        break;

      case 'google-drive':
      case 'googledrive':
        provider = new GoogleDriveProvider(config);
        break;

      case 'dropbox':
        provider = new DropboxProvider(config);
        break;

      case 'onedrive':
        provider = new OneDriveProvider(config);
        break;

      case 'mock':
        provider = new MockCloudProvider(config);
        break;

      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }

    // Initialize and authenticate
    await provider.init();
    await provider.authenticate();

    // Register provider
    const providerId = `${providerType}-${Date.now()}`;
    this.registerProvider(providerId, provider);

    return providerId;
  }

  /**
   * Disconnect from a provider
   * @param {string} providerId - Provider ID
   */
  async disconnect(providerId) {
    const provider = this.getProvider(providerId);

    // Stop all syncs for this provider
    for (const [mountPoint, mountProvider] of this.mounts) {
      if (mountProvider === providerId) {
        await this.unmount(mountPoint);
      }
    }

    // Disconnect provider
    await provider.disconnect();

    // Remove provider
    this.providers.delete(providerId);
  }

  /**
   * Mount a cloud path to a local path
   * @param {string} providerId - Provider ID
   * @param {string} cloudPath - Cloud path
   * @param {string} localPath - Local mount point
   * @param {Object} options - Mount options
   */
  async mount(providerId, cloudPath, localPath, options = {}) {
    const provider = this.getProvider(providerId);

    if (!provider.isAuthenticated()) {
      throw new Error('Provider not authenticated');
    }

    // Check if mount point already exists
    if (this.mounts.has(localPath)) {
      throw new Error(`Mount point already in use: ${localPath}`);
    }

    // Ensure local mount point exists
    try {
      await this.vfs.mkdir(localPath, { recursive: true });
    } catch (error) {
      // Directory might exist
    }

    // Register mount
    this.mounts.set(localPath, {
      providerId,
      cloudPath,
      localPath,
      options,
      mounted: Date.now()
    });

    // Start sync if enabled
    if (options.sync !== false) {
      const syncEngine = new SyncEngine(this.vfs, provider);
      if (options.conflictStrategy) {
        syncEngine.setConflictStrategy(options.conflictStrategy);
      }

      const syncId = await syncEngine.startSync(localPath, cloudPath, {
        watch: options.watch,
        interval: options.syncInterval
      });

      this.syncEngines.set(localPath, { syncEngine, syncId });
    }

    return {
      mountPoint: localPath,
      provider: providerId,
      cloudPath,
      syncing: options.sync !== false
    };
  }

  /**
   * Unmount a cloud path
   * @param {string} localPath - Local mount point
   */
  async unmount(localPath) {
    const mount = this.mounts.get(localPath);
    if (!mount) {
      throw new Error(`No mount at: ${localPath}`);
    }

    // Stop sync if active
    const syncInfo = this.syncEngines.get(localPath);
    if (syncInfo) {
      await syncInfo.syncEngine.stopSync(syncInfo.syncId);
      this.syncEngines.delete(localPath);
    }

    // Remove mount
    this.mounts.delete(localPath);

    return true;
  }

  /**
   * Sync a local path with cloud
   * @param {string} localPath - Local path
   * @param {string} providerId - Provider ID
   * @param {string} cloudPath - Cloud path
   * @param {Object} options - Sync options
   */
  async sync(localPath, providerId, cloudPath, options = {}) {
    const provider = this.getProvider(providerId);

    if (!provider.isAuthenticated()) {
      throw new Error('Provider not authenticated');
    }

    const syncEngine = new SyncEngine(this.vfs, provider);
    if (options.conflictStrategy) {
      syncEngine.setConflictStrategy(options.conflictStrategy);
    }

    const result = await syncEngine.fullSync(localPath, cloudPath, options);

    return result;
  }

  /**
   * Upload a file to cloud
   * @param {string} localPath - Local file path
   * @param {string} providerId - Provider ID
   * @param {string} cloudPath - Cloud destination path
   */
  async upload(localPath, providerId, cloudPath) {
    const provider = this.getProvider(providerId);

    if (!provider.isAuthenticated()) {
      throw new Error('Provider not authenticated');
    }

    // Read local file
    const data = await this.vfs.readFile(localPath);

    // Get file name if cloudPath is a directory
    let destPath = cloudPath;
    if (cloudPath.endsWith('/')) {
      const fileName = localPath.split('/').pop();
      destPath = cloudPath + fileName;
    }

    // Upload to cloud
    await provider.writeFile(destPath, data);

    return {
      localPath,
      cloudPath: destPath,
      size: data.length
    };
  }

  /**
   * Download a file from cloud
   * @param {string} providerId - Provider ID
   * @param {string} cloudPath - Cloud file path
   * @param {string} localPath - Local destination path
   */
  async download(providerId, cloudPath, localPath) {
    const provider = this.getProvider(providerId);

    if (!provider.isAuthenticated()) {
      throw new Error('Provider not authenticated');
    }

    // Download from cloud
    const data = await provider.readFile(cloudPath);

    // Ensure local directory exists
    const parentDir = localPath.substring(0, localPath.lastIndexOf('/'));
    if (parentDir) {
      await this.vfs.mkdir(parentDir, { recursive: true });
    }

    // Write to local
    await this.vfs.writeFile(localPath, data);

    return {
      cloudPath,
      localPath,
      size: data.length
    };
  }

  /**
   * List cloud files
   * @param {string} providerId - Provider ID
   * @param {string} cloudPath - Cloud path
   */
  async list(providerId, cloudPath) {
    const provider = this.getProvider(providerId);

    if (!provider.isAuthenticated()) {
      throw new Error('Provider not authenticated');
    }

    return await provider.listFiles(cloudPath);
  }

  /**
   * Get cloud storage quota
   * @param {string} providerId - Provider ID
   */
  async getQuota(providerId) {
    const provider = this.getProvider(providerId);

    if (!provider.isAuthenticated()) {
      throw new Error('Provider not authenticated');
    }

    return await provider.getQuota();
  }

  /**
   * Get provider information
   * @param {string} providerId - Provider ID
   */
  getProviderInfo(providerId) {
    const provider = this.getProvider(providerId);
    return provider.getInfo();
  }

  /**
   * Get all mounts
   * @returns {Array}
   */
  getMounts() {
    return Array.from(this.mounts.entries()).map(([mountPoint, mount]) => ({
      mountPoint,
      ...mount
    }));
  }

  /**
   * Get sync status for a mount
   * @param {string} localPath - Local mount point
   */
  getSyncStatus(localPath) {
    const syncInfo = this.syncEngines.get(localPath);
    if (!syncInfo) {
      return null;
    }

    return syncInfo.syncEngine.getStatus();
  }

  /**
   * Get all providers
   * @returns {Array}
   */
  getProviders() {
    return Array.from(this.providers.entries()).map(([id, provider]) => ({
      id,
      ...provider.getInfo()
    }));
  }

  /**
   * Check if a path is mounted
   * @param {string} localPath - Local path
   * @returns {boolean}
   */
  isMounted(localPath) {
    return this.mounts.has(localPath);
  }

  /**
   * Get mount info for a path
   * @param {string} localPath - Local path
   * @returns {Object|null}
   */
  getMountInfo(localPath) {
    return this.mounts.get(localPath) || null;
  }

  /**
   * Create a cloud directory
   * @param {string} providerId - Provider ID
   * @param {string} cloudPath - Cloud directory path
   */
  async createDirectory(providerId, cloudPath) {
    const provider = this.getProvider(providerId);

    if (!provider.isAuthenticated()) {
      throw new Error('Provider not authenticated');
    }

    await provider.createDirectory(cloudPath);
  }

  /**
   * Delete a cloud file
   * @param {string} providerId - Provider ID
   * @param {string} cloudPath - Cloud file path
   */
  async deleteFile(providerId, cloudPath) {
    const provider = this.getProvider(providerId);

    if (!provider.isAuthenticated()) {
      throw new Error('Provider not authenticated');
    }

    await provider.deleteFile(cloudPath);
  }

  /**
   * Get overall status
   * @returns {Object}
   */
  getStatus() {
    return {
      providers: this.providers.size,
      mounts: this.mounts.size,
      activeSyncs: this.syncEngines.size,
      providerList: this.getProviders(),
      mountList: this.getMounts()
    };
  }

  /**
   * Disconnect all providers and stop all syncs
   */
  async disconnectAll() {
    // Stop all syncs
    for (const [mountPoint] of this.mounts) {
      await this.unmount(mountPoint);
    }

    // Disconnect all providers
    for (const [providerId, provider] of this.providers) {
      await provider.disconnect();
    }

    this.providers.clear();
    this.mounts.clear();
    this.syncEngines.clear();
  }
}
