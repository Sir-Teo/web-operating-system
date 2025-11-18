/**
 * FileAttributes - Manages extended file attributes, permissions, and ownership
 * Supports Unix-style permissions and extended attributes
 */
export class FileAttributes {
  constructor() {
    // Store attributes in memory (in production, this would be persisted)
    this.attributes = new Map();
  }

  /**
   * Initialize default attributes for a file/directory
   */
  initializeAttributes(path, isDirectory = false) {
    const attrs = {
      permissions: isDirectory ? 0o755 : 0o644, // rwxr-xr-x or rw-r--r--
      owner: 'user',
      group: 'user',
      created: Date.now(),
      modified: Date.now(),
      accessed: Date.now(),
      size: 0,
      type: isDirectory ? 'directory' : 'file',
      links: 1,
      inode: this._generateInode(),
      extended: {}, // Extended attributes
      symlink: null // If this is a symlink, target path goes here
    };

    this.attributes.set(path, attrs);
    return attrs;
  }

  /**
   * Get attributes for a path
   */
  getAttributes(path) {
    if (!this.attributes.has(path)) {
      // Return default attributes if not found
      return this.initializeAttributes(path, false);
    }
    return { ...this.attributes.get(path) };
  }

  /**
   * Set attributes for a path
   */
  setAttributes(path, attrs) {
    const existing = this.attributes.get(path) || {};
    this.attributes.set(path, { ...existing, ...attrs });
  }

  /**
   * Update modified time
   */
  touch(path) {
    const attrs = this.getAttributes(path);
    attrs.modified = Date.now();
    attrs.accessed = Date.now();
    this.setAttributes(path, attrs);
  }

  /**
   * Change permissions (chmod)
   */
  chmod(path, mode) {
    const attrs = this.getAttributes(path);

    // Support both numeric (0o755) and symbolic (rwxr-xr-x) modes
    if (typeof mode === 'string') {
      mode = this._parseSymbolicMode(mode, attrs.permissions);
    }

    attrs.permissions = mode;
    this.setAttributes(path, attrs);
  }

  /**
   * Change ownership (chown)
   */
  chown(path, owner, group = null) {
    const attrs = this.getAttributes(path);
    attrs.owner = owner;
    if (group) {
      attrs.group = group;
    }
    this.setAttributes(path, attrs);
  }

  /**
   * Check if user has permission
   */
  hasPermission(path, user, operation) {
    const attrs = this.getAttributes(path);
    const mode = attrs.permissions;

    // For simplicity, current user always has full access
    // In production, implement proper permission checking
    if (user === attrs.owner) {
      return true;
    }

    // Check permission bits
    const ownerPerms = (mode >> 6) & 0o7;
    const groupPerms = (mode >> 3) & 0o7;
    const otherPerms = mode & 0o7;

    const requiredBit = {
      'read': 0o4,
      'write': 0o2,
      'execute': 0o1
    }[operation];

    // Check owner permissions
    if (user === attrs.owner) {
      return (ownerPerms & requiredBit) !== 0;
    }

    // Check group permissions
    // For now, assume user is in same group if not owner
    return (groupPerms & requiredBit) !== 0 || (otherPerms & requiredBit) !== 0;
  }

  /**
   * Get permission string (like ls -l)
   */
  getPermissionString(path) {
    const attrs = this.getAttributes(path);
    const mode = attrs.permissions;

    const type = attrs.type === 'directory' ? 'd' :
                 attrs.symlink ? 'l' : '-';

    const owner = this._permBitsToString((mode >> 6) & 0o7);
    const group = this._permBitsToString((mode >> 3) & 0o7);
    const other = this._permBitsToString(mode & 0o7);

    return type + owner + group + other;
  }

  /**
   * Convert permission bits to string (rwx)
   */
  _permBitsToString(bits) {
    const r = (bits & 0o4) ? 'r' : '-';
    const w = (bits & 0o2) ? 'w' : '-';
    const x = (bits & 0o1) ? 'x' : '-';
    return r + w + x;
  }

  /**
   * Parse symbolic mode (like +x, u+rw, etc.)
   */
  _parseSymbolicMode(symbolic, currentMode) {
    // Simplified symbolic mode parser
    // Supports: +x, -w, u+rw, g-x, o+r, etc.

    let mode = currentMode;

    // Extract who, op, perms
    const match = symbolic.match(/^([ugoa]*)([+-=])([rwx]+)$/);
    if (!match) {
      // Try numeric mode
      return parseInt(symbolic, 8);
    }

    const [, who, op, perms] = match;
    const whoMasks = {
      'u': 0o700,
      'g': 0o070,
      'o': 0o007,
      'a': 0o777
    };

    const permBits = {
      'r': 0o4,
      'w': 0o2,
      'x': 0o1
    };

    // Calculate permission value
    let permValue = 0;
    for (const p of perms) {
      permValue |= permBits[p];
    }

    // Apply to each specified target
    const targets = who || 'a';
    for (const target of targets) {
      const shift = target === 'u' ? 6 : target === 'g' ? 3 : 0;
      const shiftedPerm = permValue << shift;

      if (op === '+') {
        mode |= shiftedPerm;
      } else if (op === '-') {
        mode &= ~shiftedPerm;
      } else if (op === '=') {
        const mask = target === 'u' ? 0o077 : target === 'g' ? 0o707 : 0o770;
        mode = (mode & mask) | shiftedPerm;
      }
    }

    return mode;
  }

  /**
   * Set extended attribute
   */
  setExtendedAttr(path, name, value) {
    const attrs = this.getAttributes(path);
    attrs.extended[name] = value;
    this.setAttributes(path, attrs);
  }

  /**
   * Get extended attribute
   */
  getExtendedAttr(path, name) {
    const attrs = this.getAttributes(path);
    return attrs.extended[name];
  }

  /**
   * List extended attributes
   */
  listExtendedAttrs(path) {
    const attrs = this.getAttributes(path);
    return Object.keys(attrs.extended);
  }

  /**
   * Remove extended attribute
   */
  removeExtendedAttr(path, name) {
    const attrs = this.getAttributes(path);
    delete attrs.extended[name];
    this.setAttributes(path, attrs);
  }

  /**
   * Create symbolic link
   */
  createSymlink(linkPath, targetPath) {
    const attrs = this.initializeAttributes(linkPath, false);
    attrs.symlink = targetPath;
    attrs.type = 'symlink';
    attrs.permissions = 0o777; // Symlinks have full permissions
    this.setAttributes(linkPath, attrs);
  }

  /**
   * Read symbolic link target
   */
  readSymlink(linkPath) {
    const attrs = this.getAttributes(linkPath);
    return attrs.symlink;
  }

  /**
   * Check if path is a symbolic link
   */
  isSymlink(path) {
    const attrs = this.getAttributes(path);
    return attrs.symlink !== null;
  }

  /**
   * Resolve symbolic links
   */
  resolveSymlink(path, maxDepth = 10) {
    let current = path;
    let depth = 0;

    while (this.isSymlink(current) && depth < maxDepth) {
      current = this.readSymlink(current);
      depth++;
    }

    if (depth >= maxDepth) {
      throw new Error('Too many levels of symbolic links');
    }

    return current;
  }

  /**
   * Remove attributes for a path (when file is deleted)
   */
  removeAttributes(path) {
    this.attributes.delete(path);
  }

  /**
   * Rename/move attributes
   */
  renameAttributes(oldPath, newPath) {
    if (this.attributes.has(oldPath)) {
      const attrs = this.attributes.get(oldPath);
      this.attributes.set(newPath, attrs);
      this.attributes.delete(oldPath);
    }
  }

  /**
   * Generate a unique inode number
   */
  _generateInode() {
    return Math.floor(Math.random() * 1000000) + Date.now();
  }

  /**
   * Get all attributes (for debugging/export)
   */
  getAllAttributes() {
    return new Map(this.attributes);
  }

  /**
   * Import attributes (for restore/import)
   */
  importAttributes(attributesMap) {
    this.attributes = new Map(attributesMap);
  }
}
