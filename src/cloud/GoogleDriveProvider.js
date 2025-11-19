import { CloudProvider } from './CloudProvider.js';
import { getOAuthManager } from './OAuthManager.js';

/**
 * GoogleDriveProvider - Google Drive cloud storage provider with OAuth 2.0
 * Uses Google Drive API v3
 */
export class GoogleDriveProvider extends CloudProvider {
  constructor(config) {
    super({ ...config, name: 'Google Drive' });
    this.baseUrl = 'https://www.googleapis.com/drive/v3';
    this.uploadUrl = 'https://www.googleapis.com/upload/drive/v3';
    this.oauthManager = getOAuthManager();
    this.providerId = 'google-drive';

    // File/folder cache for path resolution
    this.pathCache = new Map();
    this.rootFolderId = 'root';

    // Register OAuth provider
    if (config.clientId && config.clientSecret && config.redirectUri) {
      this.oauthManager.registerProvider(this.providerId, {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        redirectUri: config.redirectUri
      });
    }
  }

  async init() {
    // Google Drive doesn't require special initialization
    return true;
  }

  async authenticate() {
    try {
      const token = await this.oauthManager.authenticate(this.providerId);
      this.authenticated = !!token;

      if (this.authenticated) {
        // Get user info and quota
        await this.updateQuota();
      }

      return this.authenticated;
    } catch (error) {
      this.authenticated = false;
      throw new Error(`Google Drive authentication failed: ${error.message}`);
    }
  }

  /**
   * Get authorization headers
   * @returns {Promise<Object>} Headers object
   */
  async getHeaders() {
    const authHeader = await this.oauthManager.getAuthHeader(this.providerId);
    return {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Resolve path to file/folder ID
   * @param {string} path - Path to resolve
   * @returns {Promise<string>} File/folder ID
   */
  async resolvePath(path) {
    if (!path || path === '/') {
      return this.rootFolderId;
    }

    // Check cache
    if (this.pathCache.has(path)) {
      return this.pathCache.get(path);
    }

    // Split path into components
    const parts = path.split('/').filter(Boolean);
    let currentId = this.rootFolderId;

    // Traverse path
    for (const part of parts) {
      const query = `name='${part}' and '${currentId}' in parents and trashed=false`;
      const headers = await this.getHeaders();

      const response = await fetch(
        `${this.baseUrl}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType)`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to resolve path: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.files || data.files.length === 0) {
        throw new Error(`Path not found: ${path}`);
      }

      currentId = data.files[0].id;
    }

    // Cache result
    this.pathCache.set(path, currentId);
    return currentId;
  }

  async listFiles(path) {
    this.ensureAuthenticated();

    try {
      const folderId = await this.resolvePath(path);
      const headers = await this.getHeaders();

      const query = `'${folderId}' in parents and trashed=false`;
      const fields = 'files(id,name,mimeType,size,modifiedTime,createdTime)';

      const response = await fetch(
        `${this.baseUrl}/files?q=${encodeURIComponent(query)}&fields=${fields}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to list files: ${response.statusText}`);
      }

      const data = await response.json();

      return data.files.map(file => ({
        name: file.name,
        path: `${path}/${file.name}`.replace('//', '/'),
        size: parseInt(file.size || 0, 10),
        modified: new Date(file.modifiedTime),
        created: new Date(file.createdTime),
        type: file.mimeType === 'application/vnd.google-apps.folder' ? 'directory' : 'file',
        mimeType: file.mimeType,
        id: file.id
      }));
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  async readFile(path) {
    this.ensureAuthenticated();

    try {
      const fileId = await this.resolvePath(path);
      const headers = await this.getHeaders();

      const response = await fetch(
        `${this.baseUrl}/files/${fileId}?alt=media`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to read file: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  async writeFile(path, data) {
    this.ensureAuthenticated();

    try {
      const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
      const fileName = path.split('/').pop();
      const parentId = await this.resolvePath(parentPath);

      // Check if file exists
      let fileId = null;
      try {
        fileId = await this.resolvePath(path);
      } catch (error) {
        // File doesn't exist, will create new
      }

      const headers = await this.getHeaders();

      if (fileId) {
        // Update existing file
        const response = await fetch(
          `${this.uploadUrl}/files/${fileId}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': headers.Authorization,
              'Content-Type': 'application/octet-stream'
            },
            body: data
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to update file: ${response.statusText}`);
        }
      } else {
        // Create new file
        const metadata = {
          name: fileName,
          parents: [parentId]
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([data]));

        const response = await fetch(
          `${this.uploadUrl}/files?uploadType=multipart`,
          {
            method: 'POST',
            headers: {
              'Authorization': headers.Authorization
            },
            body: form
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to create file: ${response.statusText}`);
        }

        // Update cache
        const result = await response.json();
        this.pathCache.set(path, result.id);
      }
    } catch (error) {
      throw new Error(`Failed to write file: ${error.message}`);
    }
  }

  async deleteFile(path) {
    this.ensureAuthenticated();

    try {
      const fileId = await this.resolvePath(path);
      const headers = await this.getHeaders();

      const response = await fetch(
        `${this.baseUrl}/files/${fileId}`,
        {
          method: 'DELETE',
          headers
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }

      // Clear from cache
      this.pathCache.delete(path);
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async createDirectory(path) {
    this.ensureAuthenticated();

    try {
      const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
      const folderName = path.split('/').pop();
      const parentId = await this.resolvePath(parentPath);

      const headers = await this.getHeaders();

      const metadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
      };

      const response = await fetch(
        `${this.baseUrl}/files`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(metadata)
        }
      );

      if (!response.ok && response.status !== 409) { // 409 = already exists
        throw new Error(`Failed to create directory: ${response.statusText}`);
      }

      if (response.ok) {
        const result = await response.json();
        this.pathCache.set(path, result.id);
      }
    } catch (error) {
      throw new Error(`Failed to create directory: ${error.message}`);
    }
  }

  async getMetadata(path) {
    this.ensureAuthenticated();

    try {
      const fileId = await this.resolvePath(path);
      const headers = await this.getHeaders();

      const fields = 'id,name,mimeType,size,modifiedTime,createdTime';
      const response = await fetch(
        `${this.baseUrl}/files/${fileId}?fields=${fields}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to get metadata: ${response.statusText}`);
      }

      const file = await response.json();

      return {
        name: file.name,
        path,
        size: parseInt(file.size || 0, 10),
        modified: new Date(file.modifiedTime),
        created: new Date(file.createdTime),
        type: file.mimeType === 'application/vnd.google-apps.folder' ? 'directory' : 'file',
        mimeType: file.mimeType,
        id: file.id
      };
    } catch (error) {
      throw new Error(`Failed to get metadata: ${error.message}`);
    }
  }

  async getQuota() {
    this.ensureAuthenticated();

    try {
      const headers = await this.getHeaders();

      const response = await fetch(
        `${this.baseUrl}/about?fields=storageQuota`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to get quota: ${response.statusText}`);
      }

      const data = await response.json();
      const quota = data.storageQuota || {};

      return {
        used: parseInt(quota.usage || 0, 10),
        total: parseInt(quota.limit || 0, 10),
        available: parseInt(quota.limit || 0, 10) - parseInt(quota.usage || 0, 10)
      };
    } catch (error) {
      console.error('Failed to get quota:', error);
      return { used: 0, total: 0, available: 0 };
    }
  }

  async updateQuota() {
    try {
      this.quota = await this.getQuota();
    } catch (error) {
      console.error('Failed to update quota:', error);
    }
  }

  async rename(oldPath, newPath) {
    this.ensureAuthenticated();

    try {
      const fileId = await this.resolvePath(oldPath);
      const newName = newPath.split('/').pop();
      const headers = await this.getHeaders();

      const metadata = { name: newName };

      const response = await fetch(
        `${this.baseUrl}/files/${fileId}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify(metadata)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to rename: ${response.statusText}`);
      }

      // Update cache
      this.pathCache.delete(oldPath);
      this.pathCache.set(newPath, fileId);
    } catch (error) {
      throw new Error(`Failed to rename: ${error.message}`);
    }
  }

  async copy(sourcePath, destPath) {
    this.ensureAuthenticated();

    try {
      const sourceId = await this.resolvePath(sourcePath);
      const destParentPath = destPath.substring(0, destPath.lastIndexOf('/')) || '/';
      const destName = destPath.split('/').pop();
      const destParentId = await this.resolvePath(destParentPath);

      const headers = await this.getHeaders();

      const metadata = {
        name: destName,
        parents: [destParentId]
      };

      const response = await fetch(
        `${this.baseUrl}/files/${sourceId}/copy`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(metadata)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to copy: ${response.statusText}`);
      }

      const result = await response.json();
      this.pathCache.set(destPath, result.id);
    } catch (error) {
      throw new Error(`Failed to copy: ${error.message}`);
    }
  }

  async disconnect() {
    await this.oauthManager.revokeToken(this.providerId);
    this.authenticated = false;
    this.pathCache.clear();
  }

  ensureAuthenticated() {
    if (!this.authenticated) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }
  }
}
