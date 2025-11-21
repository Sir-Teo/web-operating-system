import { OPFSDriver } from './drivers/OPFSDriver.js';
import { IndexedDBDriver } from './drivers/IndexedDBDriver.js';
import { MemoryDriver } from './drivers/MemoryDriver.js';
import { PermissionError, FileSystemError } from '../kernel/Errors.js';
import { createLogger } from '../kernel/Logger.js';

const logger = createLogger('VFS');

class VirtualFileSystem extends EventTarget {
  constructor() {
    super();
    this.root = null;
    this.mounted = new Map();
    this.cache = new Map();
    this.initialized = false;
    this.permissionManager = null;
    this.processManager = null;
    this.permissionChecksEnabled = true;
  }

  /**
   * Set permission manager for access control
   */
  setPermissionManager(permissionManager) {
    this.permissionManager = permissionManager;
    logger.info('Permission manager configured');
  }

  /**
   * Set process manager to get current process context
   */
  setProcessManager(processManager) {
    this.processManager = processManager;
    logger.info('Process manager configured');
  }

  /**
   * Get current process ID from the call stack context
   * This is a helper that should be set by the kernel when a process makes a VFS call
   */
  _getCurrentProcessId() {
    // This will be set in the context by the kernel
    return this._currentProcessId || null;
  }

  /**
   * Set current process context for subsequent operations
   */
  setProcessContext(processId) {
    this._currentProcessId = processId;
  }

  /**
   * Clear process context
   */
  clearProcessContext() {
    this._currentProcessId = null;
  }

  /**
   * Check if current process has permission
   */
  _checkPermission(permission, path = null) {
    if (!this.permissionChecksEnabled) {
      return; // Checks disabled (e.g., during initialization)
    }

    if (!this.permissionManager) {
      logger.warn('Permission manager not configured, allowing operation');
      return;
    }

    const processId = this._getCurrentProcessId();
    if (!processId) {
      logger.warn('No process context, allowing operation');
      return;
    }

    // Get process from process manager
    const process = this.processManager?.getProcess(processId);
    if (!process) {
      logger.warn('Process not found, denying operation', { processId });
      throw new PermissionError(permission, { processId, path });
    }

    // Check if process has the required permission
    if (!process.permissions.has(permission)) {
      logger.error('Permission denied', { processId, permission, path });
      throw new PermissionError(permission, {
        processId,
        path,
        processName: process.name
      });
    }

    logger.debug('Permission granted', { processId, permission, path });
  }

  async init() {
    if (this.initialized) return;

    // Initialize OPFS as primary storage
    try {
      this.root = await navigator.storage.getDirectory();
    } catch (error) {
      console.warn('OPFS not available, falling back to IndexedDB');
    }

    // Mount virtual directories
    await this.mount('/home', new OPFSDriver());
    await this.mount('/tmp', new MemoryDriver());
    await this.mount('/media', new IndexedDBDriver());

    // Create standard directories
    try {
      await this.mkdir('/home/user', { recursive: true });
      await this.mkdir('/home/user/Documents', { recursive: true });
      await this.mkdir('/home/user/Downloads', { recursive: true });
      await this.mkdir('/home/user/Pictures', { recursive: true });
      await this.mkdir('/home/user/Desktop', { recursive: true });
      await this.mkdir('/tmp', { recursive: true });
    } catch (error) {
      console.warn('Some directories already exist:', error.message);
    }

    this.initialized = true;
  }

  async mount(path, driver) {
    this.mounted.set(path, driver);
    await driver.init();
  }

  _resolveDriver(path) {
    // Find the best matching mount point
    let bestMatch = null;
    let bestMatchLength = 0;

    for (const [mountPoint, driver] of this.mounted.entries()) {
      if (path.startsWith(mountPoint) && mountPoint.length > bestMatchLength) {
        bestMatch = { mountPoint, driver };
        bestMatchLength = mountPoint.length;
      }
    }

    if (!bestMatch) {
      throw new Error(`No driver mounted for path: ${path}`);
    }

    return {
      driver: bestMatch.driver,
      relativePath: path.slice(bestMatch.mountPoint.length) || '/'
    };
  }

  async readFile(path, options = {}) {
    this._checkPermission('filesystem.read', path);
    logger.debug('Reading file', { path });

    const { driver, relativePath } = this._resolveDriver(path);
    return await driver.readFile(relativePath, options);
  }

  async writeFile(path, data, options = {}) {
    this._checkPermission('filesystem.write', path);
    logger.debug('Writing file', { path, size: data?.length || 0 });

    const { driver, relativePath } = this._resolveDriver(path);
    await driver.writeFile(relativePath, data, options);

    this.dispatchEvent(new CustomEvent('file-changed', {
      detail: { path, operation: 'write' }
    }));
  }

  async mkdir(path, options = {}) {
    this._checkPermission('filesystem.write', path);
    logger.debug('Creating directory', { path });

    const { driver, relativePath } = this._resolveDriver(path);
    await driver.mkdir(relativePath, options);
  }

  async readdir(path) {
    this._checkPermission('filesystem.read', path);
    logger.debug('Reading directory', { path });

    const { driver, relativePath } = this._resolveDriver(path);
    return await driver.readdir(relativePath);
  }

  async rm(path, options = {}) {
    this._checkPermission('filesystem.delete', path);
    logger.debug('Removing', { path, options });

    const { driver, relativePath } = this._resolveDriver(path);
    await driver.rm(relativePath, options);

    this.dispatchEvent(new CustomEvent('file-changed', {
      detail: { path, operation: 'delete' }
    }));
  }

  async stat(path) {
    this._checkPermission('filesystem.read', path);
    logger.debug('Getting stats', { path });

    const { driver, relativePath } = this._resolveDriver(path);
    return await driver.stat(relativePath);
  }

  async rename(oldPath, newPath) {
    this._checkPermission('filesystem.write', oldPath);
    this._checkPermission('filesystem.write', newPath);
    logger.debug('Renaming', { oldPath, newPath });

    const { driver, relativePath: oldRelativePath } = this._resolveDriver(oldPath);
    const { relativePath: newRelativePath } = this._resolveDriver(newPath);
    await driver.rename(oldRelativePath, newRelativePath);

    this.dispatchEvent(new CustomEvent('file-changed', {
      detail: { path: oldPath, operation: 'rename', newPath }
    }));
  }

  async copy(srcPath, destPath) {
    this._checkPermission('filesystem.read', srcPath);
    this._checkPermission('filesystem.write', destPath);
    logger.debug('Copying', { srcPath, destPath });

    const data = await this.readFile(srcPath);
    await this.writeFile(destPath, data);

    this.dispatchEvent(new CustomEvent('file-changed', {
      detail: { path: destPath, operation: 'copy', srcPath }
    }));
  }

  async exists(path) {
    try {
      await this.stat(path);
      return true;
    } catch (e) {
      return false;
    }
  }

  watch(path, callback) {
    const handler = (event) => {
      if (event.detail.path.startsWith(path)) {
        callback(event.detail);
      }
    };
    this.addEventListener('file-changed', handler);
    return () => this.removeEventListener('file-changed', handler);
  }

  async sync() {
    // Flush any pending writes
    console.log('VFS sync complete');
  }

  /**
   * Create user home directory structure
   * @param {string} username - Username
   */
  async createUserHome(username) {
    const userHome = `/home/${username}`;

    try {
      // Create user home directory
      await this.mkdir(userHome, { recursive: true });

      // Create standard user directories
      const standardDirs = [
        'Documents',
        'Downloads',
        'Pictures',
        'Desktop',
        'Music',
        'Videos',
        '.config'  // For user configuration files
      ];

      for (const dir of standardDirs) {
        await this.mkdir(`${userHome}/${dir}`, { recursive: true });
      }

      console.log(`Created home directory for user: ${username}`);
      return userHome;
    } catch (error) {
      console.error(`Error creating home directory for ${username}:`, error);
      throw error;
    }
  }

  /**
   * Get user home directory path
   * @param {string} username - Username
   * @returns {string} Home directory path
   */
  getUserHome(username) {
    return `/home/${username}`;
  }

  /**
   * Check if user home directory exists
   * @param {string} username - Username
   * @returns {boolean} True if exists
   */
  async userHomeExists(username) {
    return await this.exists(`/home/${username}`);
  }
}

export default new VirtualFileSystem();
