/**
 * CloudProvider - Base class for cloud storage providers
 * Provides interface for cloud storage operations
 */
export class CloudProvider {
  constructor(config = {}) {
    this.name = config.name || 'Unknown';
    this.authenticated = false;
    this.credentials = config.credentials || null;
    this.quota = { used: 0, total: 0 };
  }

  /**
   * Initialize the provider
   * @returns {Promise<void>}
   */
  async init() {
    throw new Error('init() must be implemented by subclass');
  }

  /**
   * Authenticate with the cloud provider
   * @returns {Promise<boolean>}
   */
  async authenticate() {
    throw new Error('authenticate() must be implemented by subclass');
  }

  /**
   * Check if authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return this.authenticated;
  }

  /**
   * List files in a directory
   * @param {string} path - Directory path
   * @returns {Promise<Array>}
   */
  async listFiles(path) {
    throw new Error('listFiles() must be implemented by subclass');
  }

  /**
   * Read file contents
   * @param {string} path - File path
   * @returns {Promise<Uint8Array>}
   */
  async readFile(path) {
    throw new Error('readFile() must be implemented by subclass');
  }

  /**
   * Write file contents
   * @param {string} path - File path
   * @param {Uint8Array} data - File data
   * @returns {Promise<void>}
   */
  async writeFile(path, data) {
    throw new Error('writeFile() must be implemented by subclass');
  }

  /**
   * Delete a file
   * @param {string} path - File path
   * @returns {Promise<void>}
   */
  async deleteFile(path) {
    throw new Error('deleteFile() must be implemented by subclass');
  }

  /**
   * Create a directory
   * @param {string} path - Directory path
   * @returns {Promise<void>}
   */
  async createDirectory(path) {
    throw new Error('createDirectory() must be implemented by subclass');
  }

  /**
   * Get file metadata
   * @param {string} path - File path
   * @returns {Promise<Object>}
   */
  async getMetadata(path) {
    throw new Error('getMetadata() must be implemented by subclass');
  }

  /**
   * Get storage quota information
   * @returns {Promise<Object>}
   */
  async getQuota() {
    throw new Error('getQuota() must be implemented by subclass');
  }

  /**
   * Rename/move a file
   * @param {string} oldPath - Current path
   * @param {string} newPath - New path
   * @returns {Promise<void>}
   */
  async rename(oldPath, newPath) {
    throw new Error('rename() must be implemented by subclass');
  }

  /**
   * Copy a file
   * @param {string} sourcePath - Source path
   * @param {string} destPath - Destination path
   * @returns {Promise<void>}
   */
  async copy(sourcePath, destPath) {
    throw new Error('copy() must be implemented by subclass');
  }

  /**
   * Disconnect from provider
   * @returns {Promise<void>}
   */
  async disconnect() {
    this.authenticated = false;
  }

  /**
   * Get provider information
   * @returns {Object}
   */
  getInfo() {
    return {
      name: this.name,
      authenticated: this.authenticated,
      quota: this.quota
    };
  }
}

/**
 * WebDAVProvider - WebDAV cloud storage provider
 */
export class WebDAVProvider extends CloudProvider {
  constructor(config) {
    super({ ...config, name: 'WebDAV' });
    this.baseUrl = config.baseUrl;
    this.username = config.username;
    this.password = config.password;
  }

  async init() {
    // WebDAV doesn't require special initialization
    return true;
  }

  async authenticate() {
    try {
      // Test connection with a PROPFIND request
      const response = await fetch(this.baseUrl, {
        method: 'PROPFIND',
        headers: {
          'Authorization': 'Basic ' + btoa(`${this.username}:${this.password}`),
          'Depth': '0'
        }
      });

      this.authenticated = response.ok;
      return this.authenticated;
    } catch (error) {
      this.authenticated = false;
      throw new Error(`WebDAV authentication failed: ${error.message}`);
    }
  }

  async listFiles(path) {
    this.ensureAuthenticated();

    const url = this.buildUrl(path);
    const response = await fetch(url, {
      method: 'PROPFIND',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Depth': '1'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`);
    }

    const xml = await response.text();
    return this.parseWebDAVResponse(xml);
  }

  async readFile(path) {
    this.ensureAuthenticated();

    const url = this.buildUrl(path);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': this.getAuthHeader()
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to read file: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

  async writeFile(path, data) {
    this.ensureAuthenticated();

    const url = this.buildUrl(path);
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/octet-stream'
      },
      body: data
    });

    if (!response.ok) {
      throw new Error(`Failed to write file: ${response.statusText}`);
    }
  }

  async deleteFile(path) {
    this.ensureAuthenticated();

    const url = this.buildUrl(path);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': this.getAuthHeader()
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }
  }

  async createDirectory(path) {
    this.ensureAuthenticated();

    const url = this.buildUrl(path);
    const response = await fetch(url, {
      method: 'MKCOL',
      headers: {
        'Authorization': this.getAuthHeader()
      }
    });

    if (!response.ok && response.status !== 405) {
      // 405 = directory already exists
      throw new Error(`Failed to create directory: ${response.statusText}`);
    }
  }

  async getMetadata(path) {
    this.ensureAuthenticated();

    const url = this.buildUrl(path);
    const response = await fetch(url, {
      method: 'PROPFIND',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Depth': '0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get metadata: ${response.statusText}`);
    }

    const xml = await response.text();
    const files = this.parseWebDAVResponse(xml);
    return files[0] || null;
  }

  async getQuota() {
    // WebDAV quota support varies by server
    return { used: 0, total: 0, available: 0 };
  }

  async rename(oldPath, newPath) {
    this.ensureAuthenticated();

    const oldUrl = this.buildUrl(oldPath);
    const newUrl = this.buildUrl(newPath);

    const response = await fetch(oldUrl, {
      method: 'MOVE',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Destination': newUrl
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to rename file: ${response.statusText}`);
    }
  }

  async copy(sourcePath, destPath) {
    this.ensureAuthenticated();

    const sourceUrl = this.buildUrl(sourcePath);
    const destUrl = this.buildUrl(destPath);

    const response = await fetch(sourceUrl, {
      method: 'COPY',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Destination': destUrl
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to copy file: ${response.statusText}`);
    }
  }

  buildUrl(path) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${cleanPath}`;
  }

  getAuthHeader() {
    return 'Basic ' + btoa(`${this.username}:${this.password}`);
  }

  ensureAuthenticated() {
    if (!this.authenticated) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }
  }

  parseWebDAVResponse(xml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const responses = Array.from(doc.getElementsByTagName('*'))
      .filter(node => node.localName === 'response');

    const files = [];
    responses.forEach((response) => {
      const hrefNode = Array.from(response.getElementsByTagName('*'))
        .find(n => n.localName === 'href');
      const propNode = Array.from(response.getElementsByTagName('*'))
        .find(n => n.localName === 'prop');

      if (!hrefNode || !propNode) return;

      const href = hrefNode.textContent || '';
      const contentLength = Array.from(propNode.getElementsByTagName('*'))
        .find(n => n.localName === 'getcontentlength')?.textContent || '0';
      const lastModified = Array.from(propNode.getElementsByTagName('*'))
        .find(n => n.localName === 'getlastmodified')?.textContent || '';
      const contentType = Array.from(propNode.getElementsByTagName('*'))
        .find(n => n.localName === 'getcontenttype')?.textContent || '';
      const resourceType = Array.from(propNode.getElementsByTagName('*'))
        .find(n => n.localName === 'resourcetype');
      const isDirectory = !!Array.from(resourceType?.getElementsByTagName('*') || [])
        .find(n => n.localName === 'collection');

      const name = href.split('/').filter(Boolean).pop() || '';

      files.push({
        name,
        path: href,
        size: parseInt(contentLength, 10),
        modified: lastModified ? new Date(lastModified) : new Date(),
        type: isDirectory ? 'directory' : 'file',
        mimeType: contentType
      });
    });

    if (files.length === 0) {
      // Fallback simple parser for basic PROPFIND responses
      const hrefMatch = xml.match(/<[^>]*href[^>]*>([^<]+)<\/[^>]*href>/i);
      if (hrefMatch) {
        const href = hrefMatch[1];
        const isDir = /<[^>]*collection\s*\/?>/i.test(xml);
        const lengthMatch = xml.match(/<[^>]*getcontentlength[^>]*>(\d+)<\/[^>]*getcontentlength>/i);
        const lastModMatch = xml.match(/<[^>]*getlastmodified[^>]*>([^<]+)<\/[^>]*getlastmodified>/i);

        files.push({
          name: href.split('/').filter(Boolean).pop() || '',
          path: href,
          size: lengthMatch ? parseInt(lengthMatch[1], 10) : 0,
          modified: lastModMatch ? new Date(lastModMatch[1]) : new Date(),
          type: isDir ? 'directory' : 'file',
          mimeType: ''
        });
      }
    }

    return files;
  }
}

/**
 * MockCloudProvider - Mock provider for testing
 */
export class MockCloudProvider extends CloudProvider {
  constructor(config = {}) {
    super({ ...config, name: 'Mock' });
    this.files = new Map();
    this.directories = new Set(['/']);
  }

  async init() {
    return true;
  }

  async authenticate() {
    this.authenticated = true;
    return true;
  }

  async listFiles(path) {
    this.ensureAuthenticated();

    const cleanPath = path.endsWith('/') ? path : path + '/';
    const files = [];

    // Add directories
    for (const dir of this.directories) {
      if (dir.startsWith(cleanPath) && dir !== cleanPath) {
        const relativePath = dir.slice(cleanPath.length);
        if (!relativePath.includes('/') || relativePath.indexOf('/') === relativePath.length - 1) {
          const name = relativePath.replace(/\/$/, '');
          if (name) {
            files.push({
              name,
              path: dir,
              type: 'directory',
              size: 0,
              modified: new Date()
            });
          }
        }
      }
    }

    // Add files
    for (const [filePath, data] of this.files) {
      if (filePath.startsWith(cleanPath)) {
        const relativePath = filePath.slice(cleanPath.length);
        if (!relativePath.includes('/')) {
          files.push({
            name: relativePath,
            path: filePath,
            type: 'file',
            size: data.length,
            modified: new Date()
          });
        }
      }
    }

    return files;
  }

  async readFile(path) {
    this.ensureAuthenticated();

    if (!this.files.has(path)) {
      throw new Error(`File not found: ${path}`);
    }

    return this.files.get(path);
  }

  async writeFile(path, data) {
    this.ensureAuthenticated();

    // Ensure parent directory exists
    const parentDir = path.substring(0, path.lastIndexOf('/') + 1);
    if (parentDir && !this.directories.has(parentDir)) {
      throw new Error(`Parent directory does not exist: ${parentDir}`);
    }

    this.files.set(path, new Uint8Array(data));
  }

  async deleteFile(path) {
    this.ensureAuthenticated();

    if (!this.files.has(path)) {
      throw new Error(`File not found: ${path}`);
    }

    this.files.delete(path);
  }

  async createDirectory(path) {
    this.ensureAuthenticated();

    const cleanPath = path.endsWith('/') ? path : path + '/';
    this.directories.add(cleanPath);
  }

  async getMetadata(path) {
    this.ensureAuthenticated();

    if (this.files.has(path)) {
      const data = this.files.get(path);
      return {
        name: path.split('/').pop(),
        path,
        type: 'file',
        size: data.length,
        modified: new Date()
      };
    }

    const cleanPath = path.endsWith('/') ? path : path + '/';
    if (this.directories.has(cleanPath)) {
      return {
        name: path.split('/').filter(Boolean).pop() || '',
        path: cleanPath,
        type: 'directory',
        size: 0,
        modified: new Date()
      };
    }

    throw new Error(`File not found: ${path}`);
  }

  async getQuota() {
    let used = 0;
    for (const data of this.files.values()) {
      used += data.length;
    }

    return {
      used,
      total: 1024 * 1024 * 1024, // 1GB
      available: 1024 * 1024 * 1024 - used
    };
  }

  async rename(oldPath, newPath) {
    this.ensureAuthenticated();

    if (!this.files.has(oldPath)) {
      throw new Error(`File not found: ${oldPath}`);
    }

    const data = this.files.get(oldPath);
    this.files.delete(oldPath);
    this.files.set(newPath, data);
  }

  async copy(sourcePath, destPath) {
    this.ensureAuthenticated();

    if (!this.files.has(sourcePath)) {
      throw new Error(`File not found: ${sourcePath}`);
    }

    const data = this.files.get(sourcePath);
    this.files.set(destPath, new Uint8Array(data));
  }

  ensureAuthenticated() {
    if (!this.authenticated) {
      throw new Error('Not authenticated');
    }
  }
}
