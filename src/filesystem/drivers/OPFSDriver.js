export class OPFSDriver {
  constructor() {
    this.root = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      this.root = await navigator.storage.getDirectory();
      this.initialized = true;
      console.log('OPFS initialized');
    } catch (error) {
      console.error('Failed to initialize OPFS:', error);
      throw error;
    }
  }

  async readFile(path, options = {}) {
    const handle = await this._getFileHandle(path);
    const file = await handle.getFile();

    if (options.encoding === 'utf8') {
      return await file.text();
    } else if (options.encoding === 'base64') {
      const buffer = await file.arrayBuffer();
      return this._arrayBufferToBase64(buffer);
    } else {
      return await file.arrayBuffer();
    }
  }

  async writeFile(path, data, options = {}) {
    const handle = await this._getFileHandle(path, { create: true });
    const writable = await handle.createWritable();

    try {
      if (typeof data === 'string') {
        await writable.write(data);
      } else if (data instanceof ArrayBuffer) {
        await writable.write(data);
      } else {
        await writable.write(new Blob([data]));
      }
    } finally {
      await writable.close();
    }
  }

  async appendFile(path, data) {
    const handle = await this._getFileHandle(path, { create: true });
    const file = await handle.getFile();
    const existing = await file.arrayBuffer();

    const writable = await handle.createWritable();

    try {
      await writable.write(existing);
      await writable.write(data);
    } finally {
      await writable.close();
    }
  }

  async mkdir(path, options = {}) {
    await this._getDirectoryHandle(path, { create: true });
  }

  async readdir(path) {
    const handle = await this._getDirectoryHandle(path);
    const entries = [];

    for await (const entry of handle.values()) {
      const stat = await this._getEntryStat(entry);
      entries.push({
        name: entry.name,
        kind: entry.kind,
        type: entry.kind === 'file' ? 'file' : 'directory',
        ...stat
      });
    }

    return entries;
  }

  async rm(path, options = {}) {
    const parts = this._parsePath(path);
    const name = parts.pop();

    if (parts.length === 0) {
      throw new Error('Cannot remove root directory');
    }

    const parentPath = '/' + parts.join('/');
    const parent = await this._getDirectoryHandle(parentPath);

    await parent.removeEntry(name, { recursive: options.recursive });
  }

  async rename(oldPath, newPath) {
    // OPFS doesn't support native rename, so we copy and delete
    const isDirectory = await this._isDirectory(oldPath);

    if (isDirectory) {
      await this._copyDirectory(oldPath, newPath);
      await this.rm(oldPath, { recursive: true });
    } else {
      const data = await this.readFile(oldPath);
      await this.writeFile(newPath, data);
      await this.rm(oldPath);
    }
  }

  async stat(path) {
    try {
      const handle = await this._getFileHandle(path);
      const file = await handle.getFile();

      return {
        type: 'file',
        size: file.size,
        mtime: file.lastModified,
        atime: file.lastModified,
        ctime: file.lastModified,
        name: file.name
      };
    } catch (e) {
      const handle = await this._getDirectoryHandle(path);

      return {
        type: 'directory',
        size: 0,
        name: handle.name
      };
    }
  }

  async exists(path) {
    try {
      await this.stat(path);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Helper methods

  async _getDirectoryHandle(path, options = {}) {
    const parts = this._parsePath(path);
    let current = this.root;

    for (const part of parts) {
      current = await current.getDirectoryHandle(part, options);
    }

    return current;
  }

  async _getFileHandle(path, options = {}) {
    const parts = this._parsePath(path);
    const fileName = parts.pop();

    let dir = this.root;
    if (parts.length > 0) {
      dir = await this._getDirectoryHandle('/' + parts.join('/'), options);
    }

    return await dir.getFileHandle(fileName, options);
  }

  async _isDirectory(path) {
    try {
      await this._getDirectoryHandle(path);
      return true;
    } catch (e) {
      return false;
    }
  }

  async _copyDirectory(srcPath, destPath) {
    await this.mkdir(destPath);
    const entries = await this.readdir(srcPath);

    for (const entry of entries) {
      const src = `${srcPath}/${entry.name}`;
      const dest = `${destPath}/${entry.name}`;

      if (entry.type === 'directory') {
        await this._copyDirectory(src, dest);
      } else {
        const data = await this.readFile(src);
        await this.writeFile(dest, data);
      }
    }
  }

  async _getEntryStat(entry) {
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      return {
        size: file.size,
        mtime: file.lastModified
      };
    }
    return { size: 0 };
  }

  _parsePath(path) {
    return path.split('/').filter(Boolean);
  }

  _arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
