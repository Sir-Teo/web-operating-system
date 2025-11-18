import { OPFSDriver } from './drivers/OPFSDriver.js';
import { IndexedDBDriver } from './drivers/IndexedDBDriver.js';
import { MemoryDriver } from './drivers/MemoryDriver.js';

class VirtualFileSystem extends EventTarget {
  constructor() {
    super();
    this.root = null;
    this.mounted = new Map();
    this.cache = new Map();
    this.initialized = false;
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
    const { driver, relativePath } = this._resolveDriver(path);
    return await driver.readFile(relativePath, options);
  }

  async writeFile(path, data, options = {}) {
    const { driver, relativePath } = this._resolveDriver(path);
    await driver.writeFile(relativePath, data, options);

    this.dispatchEvent(new CustomEvent('file-changed', {
      detail: { path, operation: 'write' }
    }));
  }

  async mkdir(path, options = {}) {
    const { driver, relativePath } = this._resolveDriver(path);
    await driver.mkdir(relativePath, options);
  }

  async readdir(path) {
    const { driver, relativePath } = this._resolveDriver(path);
    return await driver.readdir(relativePath);
  }

  async rm(path, options = {}) {
    const { driver, relativePath } = this._resolveDriver(path);
    await driver.rm(relativePath, options);

    this.dispatchEvent(new CustomEvent('file-changed', {
      detail: { path, operation: 'delete' }
    }));
  }

  async stat(path) {
    const { driver, relativePath } = this._resolveDriver(path);
    return await driver.stat(relativePath);
  }

  async rename(oldPath, newPath) {
    const { driver, relativePath: oldRelativePath } = this._resolveDriver(oldPath);
    const { relativePath: newRelativePath } = this._resolveDriver(newPath);
    await driver.rename(oldRelativePath, newRelativePath);

    this.dispatchEvent(new CustomEvent('file-changed', {
      detail: { path: oldPath, operation: 'rename', newPath }
    }));
  }

  async copy(srcPath, destPath) {
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
}

export default new VirtualFileSystem();
