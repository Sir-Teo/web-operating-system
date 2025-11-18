import { openDB } from 'idb';

export class IndexedDBDriver {
  constructor() {
    this.db = null;
    this.dbName = 'webos-metadata';
    this.storeName = 'files';
  }

  async init() {
    this.db = await openDB(this.dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('files')) {
          const store = db.createObjectStore('files', { keyPath: 'path' });
          store.createIndex('parentPath', 'parentPath');
          store.createIndex('mtime', 'mtime');
        }
      }
    });
  }

  async readFile(path, options = {}) {
    const entry = await this.db.get(this.storeName, path);
    if (!entry) throw new Error(`File not found: ${path}`);

    if (options.encoding === 'utf8') {
      return new TextDecoder().decode(entry.data);
    }
    return entry.data;
  }

  async writeFile(path, data, options = {}) {
    const parentPath = this._getParentPath(path);
    const name = this._getName(path);

    const entry = {
      path,
      parentPath,
      name,
      type: 'file',
      data: typeof data === 'string' ? new TextEncoder().encode(data) : data,
      size: data.length || data.byteLength,
      mtime: Date.now(),
      ctime: Date.now()
    };

    await this.db.put(this.storeName, entry);
  }

  async mkdir(path, options = {}) {
    const parentPath = this._getParentPath(path);
    const name = this._getName(path);

    const entry = {
      path,
      parentPath,
      name,
      type: 'directory',
      mtime: Date.now(),
      ctime: Date.now()
    };

    await this.db.put(this.storeName, entry);
  }

  async readdir(path) {
    const tx = this.db.transaction(this.storeName, 'readonly');
    const index = tx.store.index('parentPath');
    const entries = await index.getAll(path);

    return entries.map(entry => ({
      name: entry.name,
      type: entry.type,
      size: entry.size || 0,
      mtime: entry.mtime
    }));
  }

  async rm(path, options = {}) {
    if (options.recursive) {
      await this._rmRecursive(path);
    } else {
      await this.db.delete(this.storeName, path);
    }
  }

  async _rmRecursive(path) {
    const children = await this.readdir(path);

    for (const child of children) {
      const childPath = `${path}/${child.name}`;
      if (child.type === 'directory') {
        await this._rmRecursive(childPath);
      }
      await this.db.delete(this.storeName, childPath);
    }

    await this.db.delete(this.storeName, path);
  }

  async stat(path) {
    const entry = await this.db.get(this.storeName, path);
    if (!entry) throw new Error(`Path not found: ${path}`);

    return {
      type: entry.type,
      size: entry.size || 0,
      mtime: entry.mtime,
      ctime: entry.ctime,
      name: entry.name
    };
  }

  async rename(oldPath, newPath) {
    const entry = await this.db.get(this.storeName, oldPath);
    if (!entry) throw new Error(`Path not found: ${oldPath}`);

    entry.path = newPath;
    entry.parentPath = this._getParentPath(newPath);
    entry.name = this._getName(newPath);
    entry.mtime = Date.now();

    await this.db.delete(this.storeName, oldPath);
    await this.db.put(this.storeName, entry);
  }

  _getParentPath(path) {
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    return '/' + parts.join('/');
  }

  _getName(path) {
    const parts = path.split('/').filter(Boolean);
    return parts[parts.length - 1];
  }
}
