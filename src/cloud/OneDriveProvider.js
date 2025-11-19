import { CloudProvider } from './CloudProvider.js';
import { getOAuthManager } from './OAuthManager.js';

/**
 * OneDriveProvider - Microsoft OneDrive cloud storage provider with OAuth 2.0
 * Uses Microsoft Graph API
 */
export class OneDriveProvider extends CloudProvider {
  constructor(config) {
    super({ ...config, name: 'OneDrive' });
    this.baseUrl = 'https://graph.microsoft.com/v1.0';
    this.oauthManager = getOAuthManager();
    this.providerId = 'onedrive';

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
    // OneDrive doesn't require special initialization
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
      throw new Error(`OneDrive authentication failed: ${error.message}`);
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
   * Convert path to OneDrive API path
   * @param {string} path - Path to convert
   * @returns {string} API path
   */
  getApiPath(path) {
    if (!path || path === '/') {
      return '/me/drive/root/children';
    }
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `/me/drive/root:/${cleanPath}`;
  }

  async listFiles(path) {
    this.ensureAuthenticated();

    try {
      const headers = await this.getHeaders();
      let apiPath;

      if (!path || path === '/') {
        apiPath = `${this.baseUrl}/me/drive/root/children`;
      } else {
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        apiPath = `${this.baseUrl}/me/drive/root:/${cleanPath}:/children`;
      }

      const response = await fetch(apiPath, { headers });

      if (!response.ok) {
        throw new Error(`Failed to list files: ${response.statusText}`);
      }

      const data = await response.json();

      return data.value.map(item => ({
        name: item.name,
        path: `${path}/${item.name}`.replace('//', '/'),
        size: item.size || 0,
        modified: new Date(item.lastModifiedDateTime),
        created: new Date(item.createdDateTime),
        type: item.folder ? 'directory' : 'file',
        mimeType: item.file?.mimeType || '',
        id: item.id
      }));
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  async readFile(path) {
    this.ensureAuthenticated();

    try {
      const headers = await this.getHeaders();
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      const apiPath = `${this.baseUrl}/me/drive/root:/${cleanPath}:/content`;

      const response = await fetch(apiPath, { headers });

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
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      const apiPath = `${this.baseUrl}/me/drive/root:/${cleanPath}:/content`;

      const response = await fetch(apiPath, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/octet-stream'
        },
        body: data
      });

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
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      const apiPath = `${this.baseUrl}/me/drive/root:/${cleanPath}`;

      const response = await fetch(apiPath, {
        method: 'DELETE',
        headers
      });

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
      const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
      const folderName = path.split('/').pop();

      let apiPath;
      if (parentPath === '/') {
        apiPath = `${this.baseUrl}/me/drive/root/children`;
      } else {
        const cleanParentPath = parentPath.startsWith('/') ? parentPath.substring(1) : parentPath;
        apiPath = `${this.baseUrl}/me/drive/root:/${cleanParentPath}:/children`;
      }

      const response = await fetch(apiPath, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: folderName,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'fail'
        })
      });

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
      let apiPath;

      if (!path || path === '/') {
        apiPath = `${this.baseUrl}/me/drive/root`;
      } else {
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        apiPath = `${this.baseUrl}/me/drive/root:/${cleanPath}`;
      }

      const response = await fetch(apiPath, { headers });

      if (!response.ok) {
        throw new Error(`Failed to get metadata: ${response.statusText}`);
      }

      const item = await response.json();

      return {
        name: item.name,
        path,
        size: item.size || 0,
        modified: new Date(item.lastModifiedDateTime),
        created: new Date(item.createdDateTime),
        type: item.folder ? 'directory' : 'file',
        mimeType: item.file?.mimeType || '',
        id: item.id
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
        `${this.baseUrl}/me/drive`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to get quota: ${response.statusText}`);
      }

      const data = await response.json();
      const quota = data.quota || {};

      return {
        used: quota.used || 0,
        total: quota.total || 0,
        available: quota.remaining || 0
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
      const newName = newPath.split('/').pop();
      const cleanOldPath = oldPath.startsWith('/') ? oldPath.substring(1) : oldPath;
      const apiPath = `${this.baseUrl}/me/drive/root:/${cleanOldPath}`;

      const response = await fetch(apiPath, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ name: newName })
      });

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
      const cleanSourcePath = sourcePath.startsWith('/') ? sourcePath.substring(1) : sourcePath;
      const destParentPath = destPath.substring(0, destPath.lastIndexOf('/')) || '/';
      const destName = destPath.split('/').pop();

      // Get destination parent ID
      let parentId;
      if (destParentPath === '/') {
        const rootResponse = await fetch(`${this.baseUrl}/me/drive/root`, { headers });
        const rootData = await rootResponse.json();
        parentId = rootData.id;
      } else {
        const cleanParentPath = destParentPath.startsWith('/') ? destParentPath.substring(1) : destParentPath;
        const parentResponse = await fetch(
          `${this.baseUrl}/me/drive/root:/${cleanParentPath}`,
          { headers }
        );
        const parentData = await parentResponse.json();
        parentId = parentData.id;
      }

      const apiPath = `${this.baseUrl}/me/drive/root:/${cleanSourcePath}:/copy`;

      const response = await fetch(apiPath, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: destName,
          parentReference: {
            id: parentId
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to copy: ${response.statusText}`);
      }

      // Copy is async in OneDrive, returns 202 Accepted
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
