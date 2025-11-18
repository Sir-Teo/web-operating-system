export class MemoryDriver {
  constructor() {
    this.storage = new Map();
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    // Create root directory
    this.storage.set('/', {
      type: 'directory',
      name: '/',
      children: new Set(),
      mtime: Date.now(),
      ctime: Date.now()
    });

    this.initialized = true;
  }

  async readFile(path, options = {}) {
    const entry = this.storage.get(path);
    if (!entry) throw new Error(`File not found: ${path}`);
    if (entry.type !== 'file') throw new Error(`Not a file: ${path}`);

    if (options.encoding === 'utf8') {
      return new TextDecoder().decode(entry.data);
    }
    return entry.data;
  }

  async writeFile(path, data, options = {}) {
    const parentPath = this._getParentPath(path);
    const name = this._getName(path);

    // Ensure parent directory exists
    const parent = this.storage.get(parentPath);
    if (!parent) throw new Error(`Parent directory not found: ${parentPath}`);
    if (parent.type !== 'directory') throw new Error(`Not a directory: ${parentPath}`);

    const entry = {
      type: 'file',
      name,
      data: typeof data === 'string' ? new TextEncoder().encode(data) : data,
      size: data.length || data.byteLength,
      mtime: Date.now(),
      ctime: Date.now()
    };

    this.storage.set(path, entry);
    parent.children.add(path);
  }

  async mkdir(path, options = {}) {
    const parentPath = this._getParentPath(path);
    const name = this._getName(path);

    if (this.storage.has(path)) {
      if (!options.recursive) throw new Error(`Path already exists: ${path}`);
      return;
    }

    // Ensure parent directory exists
    const parent = this.storage.get(parentPath);
    if (!parent && options.recursive) {
      await this.mkdir(parentPath, { recursive: true });
    } else if (!parent) {
      throw new Error(`Parent directory not found: ${parentPath}`);
    }

    const entry = {
      type: 'directory',
      name,
      children: new Set(),
      mtime: Date.now(),
      ctime: Date.now()
    };

    this.storage.set(path, entry);
    if (parent) {
      parent.children.add(path);
    }
  }

  async readdir(path) {
    const entry = this.storage.get(path);
    if (!entry) throw new Error(`Directory not found: ${path}`);
    if (entry.type !== 'directory') throw new Error(`Not a directory: ${path}`);

    const entries = [];
    for (const childPath of entry.children) {
      const child = this.storage.get(childPath);
      entries.push({
        name: child.name,
        type: child.type,
        size: child.size || 0,
        mtime: child.mtime
      });
    }

    return entries;
  }

  async rm(path, options = {}) {
    const entry = this.storage.get(path);
    if (!entry) throw new Error(`Path not found: ${path}`);

    if (entry.type === 'directory' && entry.children.size > 0 && !options.recursive) {
      throw new Error(`Directory not empty: ${path}`);
    }

    if (entry.type === 'directory' && options.recursive) {
      for (const childPath of entry.children) {
        await this.rm(childPath, { recursive: true });
      }
    }

    const parentPath = this._getParentPath(path);
    const parent = this.storage.get(parentPath);
    if (parent) {
      parent.children.delete(path);
    }

    this.storage.delete(path);
  }

  async stat(path) {
    const entry = this.storage.get(path);
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
    const entry = this.storage.get(oldPath);
    if (!entry) throw new Error(`Path not found: ${oldPath}`);

    const oldParentPath = this._getParentPath(oldPath);
    const newParentPath = this._getParentPath(newPath);
    const newName = this._getName(newPath);

    // Update entry
    entry.name = newName;
    entry.mtime = Date.now();

    // Move to new location
    this.storage.delete(oldPath);
    this.storage.set(newPath, entry);

    // Update parent references
    const oldParent = this.storage.get(oldParentPath);
    if (oldParent) {
      oldParent.children.delete(oldPath);
    }

    const newParent = this.storage.get(newParentPath);
    if (newParent) {
      newParent.children.add(newPath);
    }
  }

  _getParentPath(path) {
    if (path === '/') return null;
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    return parts.length === 0 ? '/' : '/' + parts.join('/');
  }

  _getName(path) {
    const parts = path.split('/').filter(Boolean);
    return parts[parts.length - 1] || '/';
  }
}
