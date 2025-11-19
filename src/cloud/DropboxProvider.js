import { CloudProvider } from './CloudProvider.js';
import { getOAuthManager } from './OAuthManager.js';

/**
 * DropboxProvider - Dropbox cloud storage provider with OAuth 2.0
 * Uses Dropbox API v2
 */
export class DropboxProvider extends CloudProvider {
  constructor(config) {
    super({ ...config, name: 'Dropbox' });
    this.baseUrl = 'https://api.dropboxapi.com/2';
    this.contentUrl = 'https://content.dropboxapi.com/2';
    this.oauthManager = getOAuthManager();
    this.providerId = 'dropbox';

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
    // Dropbox doesn't require special initialization
    return true;
  }

  async authenticate() {
    try {
      const token = await this.oauthManager.authenticate(this.providerId);
      this.authenticated = !!token;

      if (this.authenticated) {
        await this.updateQuota();
      }

      return this.authenticated;
    } catch (error) {
      this.authenticated = false;
      throw new Error(`Dropbox authentication failed: ${error.message}`);
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
   * Normalize path for Dropbox API
   * @param {string} path - Path to normalize
   * @returns {string} Normalized path
   */
  normalizePath(path) {
    if (!path || path === '/') {
      return '';
    }
    return path.startsWith('/') ? path : `/${path}`;
  }

  async listFiles(path) {
    this.ensureAuthenticated();

    try {
      const headers = await this.getHeaders();
      const normalizedPath = this.normalizePath(path);

      const response = await fetch(
        `${this.baseUrl}/files/list_folder`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            path: normalizedPath,
            include_deleted: false,
            include_mounted_folders: true
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to list files: ${response.statusText}`);
      }

      const data = await response.json();

      return data.entries.map(entry => ({
        name: entry.name,
        path: entry.path_display,
        size: entry.size || 0,
        modified: entry.client_modified ? new Date(entry.client_modified) : new Date(),
        type: entry['.tag'] === 'folder' ? 'directory' : 'file',
        id: entry.id
      }));
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  async readFile(path) {
    this.ensureAuthenticated();

    try {
      const authHeader = await this.oauthManager.getAuthHeader(this.providerId);
      const normalizedPath = this.normalizePath(path);

      const response = await fetch(
        `${this.contentUrl}/files/download`,
        {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Dropbox-API-Arg': JSON.stringify({ path: normalizedPath })
          }
        }
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
      const authHeader = await this.oauthManager.getAuthHeader(this.providerId);
      const normalizedPath = this.normalizePath(path);

      const response = await fetch(
        `${this.contentUrl}/files/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/octet-stream',
            'Dropbox-API-Arg': JSON.stringify({
              path: normalizedPath,
              mode: 'overwrite',
              autorename: false
            })
          },
          body: data
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to write file: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Failed to write file: ${error.message}`);
    }
  }

  async deleteFile(path) {
    this.ensureAuthenticated();

    try {
      const headers = await this.getHeaders();
      const normalizedPath = this.normalizePath(path);

      const response = await fetch(
        `${this.baseUrl}/files/delete_v2`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ path: normalizedPath })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async createDirectory(path) {
    this.ensureAuthenticated();

    try {
      const headers = await this.getHeaders();
      const normalizedPath = this.normalizePath(path);

      const response = await fetch(
        `${this.baseUrl}/files/create_folder_v2`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ path: normalizedPath })
        }
      );

      if (!response.ok && response.status !== 409) { // 409 = already exists
        throw new Error(`Failed to create directory: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Failed to create directory: ${error.message}`);
    }
  }

  async getMetadata(path) {
    this.ensureAuthenticated();

    try {
      const headers = await this.getHeaders();
      const normalizedPath = this.normalizePath(path);

      const response = await fetch(
        `${this.baseUrl}/files/get_metadata`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ path: normalizedPath })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get metadata: ${response.statusText}`);
      }

      const entry = await response.json();

      return {
        name: entry.name,
        path: entry.path_display,
        size: entry.size || 0,
        modified: entry.client_modified ? new Date(entry.client_modified) : new Date(),
        type: entry['.tag'] === 'folder' ? 'directory' : 'file',
        id: entry.id
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
        `${this.baseUrl}/users/get_space_usage`,
        {
          method: 'POST',
          headers
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get quota: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        used: data.used,
        total: data.allocation?.allocated || 0,
        available: (data.allocation?.allocated || 0) - data.used
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
      const headers = await this.getHeaders();
      const normalizedOldPath = this.normalizePath(oldPath);
      const normalizedNewPath = this.normalizePath(newPath);

      const response = await fetch(
        `${this.baseUrl}/files/move_v2`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            from_path: normalizedOldPath,
            to_path: normalizedNewPath,
            autorename: false
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to rename: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Failed to rename: ${error.message}`);
    }
  }

  async copy(sourcePath, destPath) {
    this.ensureAuthenticated();

    try {
      const headers = await this.getHeaders();
      const normalizedSourcePath = this.normalizePath(sourcePath);
      const normalizedDestPath = this.normalizePath(destPath);

      const response = await fetch(
        `${this.baseUrl}/files/copy_v2`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            from_path: normalizedSourcePath,
            to_path: normalizedDestPath,
            autorename: false
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to copy: ${response.statusText}`);
      }
    } catch (error) {
      throw new Error(`Failed to copy: ${error.message}`);
    }
  }

  async disconnect() {
    await this.oauthManager.revokeToken(this.providerId);
    this.authenticated = false;
  }

  ensureAuthenticated() {
    if (!this.authenticated) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }
  }
}
