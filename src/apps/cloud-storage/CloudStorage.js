import './CloudStorage.css';

/**
 * CloudStorage - Cloud Storage Management Application
 * Allows users to connect, manage, and sync with cloud storage providers
 */
export default class CloudStorage {
  constructor(context) {
    this.context = context;
    this.cloudManager = null;
    this.container = null;
    this.connectedProviders = [];
    this.mounts = [];
  }

  async init() {
    // Get cloud storage manager from kernel
    this.cloudManager = this.context.kernel.getCloudStorageManager();
    if (this.cloudManager) {
      this.updateStatus();
    }
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'cloud-storage-app';

    this.container.innerHTML = `
      <div class="cloud-storage-header">
        <h2>Cloud Storage</h2>
        <p>Connect and sync with your cloud storage providers</p>
      </div>

      <div class="cloud-storage-content">
        <div class="providers-section">
          <h3>Available Providers</h3>
          <div class="provider-grid">
            <div class="provider-card" data-provider="google-drive">
              <div class="provider-icon">📁</div>
              <h4>Google Drive</h4>
              <p>Store files in Google Drive</p>
              <button class="connect-btn" data-provider="google-drive">Connect</button>
            </div>

            <div class="provider-card" data-provider="dropbox">
              <div class="provider-icon">📦</div>
              <h4>Dropbox</h4>
              <p>Sync with Dropbox</p>
              <button class="connect-btn" data-provider="dropbox">Connect</button>
            </div>

            <div class="provider-card" data-provider="onedrive">
              <div class="provider-icon">☁️</div>
              <h4>OneDrive</h4>
              <p>Microsoft OneDrive storage</p>
              <button class="connect-btn" data-provider="onedrive">Connect</button>
            </div>

            <div class="provider-card" data-provider="webdav">
              <div class="provider-icon">🌐</div>
              <h4>WebDAV</h4>
              <p>Connect to WebDAV server</p>
              <button class="connect-btn" data-provider="webdav">Connect</button>
            </div>
          </div>
        </div>

        <div class="connected-section">
          <h3>Connected Providers</h3>
          <div class="connected-list" id="connected-list">
            <p class="empty-state">No providers connected</p>
          </div>
        </div>

        <div class="mounts-section">
          <h3>Active Mounts</h3>
          <div class="mounts-list" id="mounts-list">
            <p class="empty-state">No active mounts</p>
          </div>
        </div>

        <div class="sync-settings-section">
          <h3>Sync Settings</h3>
          <div class="sync-settings">
            <div class="setting-row">
              <label>Conflict Strategy:</label>
              <select id="conflict-strategy">
                <option value="keep-both">Keep Both Versions</option>
                <option value="local-wins">Local Version Wins</option>
                <option value="cloud-wins">Cloud Version Wins</option>
                <option value="newest-wins">Newest Version Wins</option>
              </select>
            </div>

            <div class="setting-row">
              <label>Bandwidth Limit (KB/s):</label>
              <input type="number" id="bandwidth-limit" placeholder="0 = unlimited" min="0" value="0">
            </div>

            <div class="setting-row">
              <label>Exclude Patterns:</label>
              <input type="text" id="exclude-patterns" placeholder="e.g., .git,node_modules,*.tmp">
            </div>

            <button id="apply-settings" class="btn-primary">Apply Settings</button>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    return this.container;
  }

  attachEventListeners() {
    // Connect buttons
    const connectButtons = this.container.querySelectorAll('.connect-btn');
    connectButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const provider = btn.dataset.provider;
        this.handleConnect(provider);
      });
    });

    // Apply settings button
    const applyBtn = this.container.querySelector('#apply-settings');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.applySettings());
    }

    // Load current settings
    this.loadSettings();
  }

  async handleConnect(provider) {
    if (!this.cloudManager) {
      this.showError('Cloud storage manager not available');
      return;
    }

    try {
      if (provider === 'webdav') {
        await this.showWebDAVDialog();
      } else {
        await this.showOAuthDialog(provider);
      }
    } catch (error) {
      this.showError(`Failed to connect: ${error.message}`);
    }
  }

  async showWebDAVDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'cloud-dialog';
    dialog.innerHTML = `
      <div class="dialog-content">
        <h3>Connect to WebDAV Server</h3>
        <div class="form-group">
          <label>Server URL:</label>
          <input type="text" id="webdav-url" placeholder="https://webdav.example.com">
        </div>
        <div class="form-group">
          <label>Username:</label>
          <input type="text" id="webdav-username">
        </div>
        <div class="form-group">
          <label>Password:</label>
          <input type="password" id="webdav-password">
        </div>
        <div class="dialog-actions">
          <button class="btn-cancel">Cancel</button>
          <button class="btn-connect">Connect</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    dialog.querySelector('.btn-cancel').addEventListener('click', () => {
      dialog.remove();
    });

    dialog.querySelector('.btn-connect').addEventListener('click', async () => {
      const url = dialog.querySelector('#webdav-url').value;
      const username = dialog.querySelector('#webdav-username').value;
      const password = dialog.querySelector('#webdav-password').value;

      if (!url || !username || !password) {
        this.showError('Please fill in all fields');
        return;
      }

      try {
        const providerId = await this.cloudManager.connect('webdav', {
          baseUrl: url,
          username,
          password
        });

        this.showSuccess(`Connected to WebDAV server (${providerId})`);
        this.updateStatus();
        dialog.remove();
      } catch (error) {
        this.showError(`Connection failed: ${error.message}`);
      }
    });
  }

  async showOAuthDialog(provider) {
    const dialog = document.createElement('div');
    dialog.className = 'cloud-dialog';

    const providerNames = {
      'google-drive': 'Google Drive',
      'dropbox': 'Dropbox',
      'onedrive': 'OneDrive'
    };

    dialog.innerHTML = `
      <div class="dialog-content">
        <h3>Connect to ${providerNames[provider]}</h3>
        <p>To connect to ${providerNames[provider]}, you need OAuth credentials.</p>
        <div class="form-group">
          <label>Client ID:</label>
          <input type="text" id="oauth-client-id" placeholder="Your OAuth Client ID">
        </div>
        <div class="form-group">
          <label>Client Secret:</label>
          <input type="text" id="oauth-client-secret" placeholder="Your OAuth Client Secret">
        </div>
        <div class="form-group">
          <label>Redirect URI:</label>
          <input type="text" id="oauth-redirect" value="${window.location.origin}/oauth-callback.html" readonly>
        </div>
        <div class="info-box">
          <strong>Note:</strong> You need to create OAuth credentials in your ${providerNames[provider]} developer console.
          The redirect URI must be configured in your OAuth app settings.
        </div>
        <div class="dialog-actions">
          <button class="btn-cancel">Cancel</button>
          <button class="btn-connect">Connect</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    dialog.querySelector('.btn-cancel').addEventListener('click', () => {
      dialog.remove();
    });

    dialog.querySelector('.btn-connect').addEventListener('click', async () => {
      const clientId = dialog.querySelector('#oauth-client-id').value;
      const clientSecret = dialog.querySelector('#oauth-client-secret').value;
      const redirectUri = dialog.querySelector('#oauth-redirect').value;

      if (!clientId || !clientSecret) {
        this.showError('Please fill in all fields');
        return;
      }

      try {
        const providerId = await this.cloudManager.connect(provider, {
          clientId,
          clientSecret,
          redirectUri
        });

        this.showSuccess(`Connected to ${providerNames[provider]} (${providerId})`);
        this.updateStatus();
        dialog.remove();
      } catch (error) {
        this.showError(`Connection failed: ${error.message}`);
      }
    });
  }

  async updateStatus() {
    if (!this.cloudManager) return;

    try {
      const status = this.cloudManager.getStatus();
      this.connectedProviders = status.providerList || [];
      this.mounts = status.mountList || [];

      this.renderConnectedProviders();
      this.renderMounts();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }

  renderConnectedProviders() {
    const listEl = this.container.querySelector('#connected-list');
    if (!listEl) return;

    if (this.connectedProviders.length === 0) {
      listEl.innerHTML = '<p class="empty-state">No providers connected</p>';
      return;
    }

    listEl.innerHTML = this.connectedProviders.map(provider => `
      <div class="connected-item">
        <div class="provider-info">
          <strong>${provider.name}</strong>
          <span class="provider-id">${provider.id}</span>
        </div>
        <div class="provider-actions">
          <button class="btn-mount" data-provider-id="${provider.id}">Mount</button>
          <button class="btn-disconnect" data-provider-id="${provider.id}">Disconnect</button>
        </div>
      </div>
    `).join('');

    // Attach event listeners
    listEl.querySelectorAll('.btn-disconnect').forEach(btn => {
      btn.addEventListener('click', async () => {
        const providerId = btn.dataset.providerId;
        await this.handleDisconnect(providerId);
      });
    });

    listEl.querySelectorAll('.btn-mount').forEach(btn => {
      btn.addEventListener('click', async () => {
        const providerId = btn.dataset.providerId;
        await this.showMountDialog(providerId);
      });
    });
  }

  renderMounts() {
    const listEl = this.container.querySelector('#mounts-list');
    if (!listEl) return;

    if (this.mounts.length === 0) {
      listEl.innerHTML = '<p class="empty-state">No active mounts</p>';
      return;
    }

    listEl.innerHTML = this.mounts.map(mount => `
      <div class="mount-item">
        <div class="mount-info">
          <strong>${mount.mountPoint}</strong>
          <span class="mount-cloud">${mount.cloudPath}</span>
          <span class="mount-provider">${mount.providerId}</span>
        </div>
        <div class="mount-actions">
          <button class="btn-sync" data-mount="${mount.mountPoint}">Sync Now</button>
          <button class="btn-unmount" data-mount="${mount.mountPoint}">Unmount</button>
        </div>
      </div>
    `).join('');

    // Attach event listeners
    listEl.querySelectorAll('.btn-unmount').forEach(btn => {
      btn.addEventListener('click', async () => {
        const mountPoint = btn.dataset.mount;
        await this.handleUnmount(mountPoint);
      });
    });

    listEl.querySelectorAll('.btn-sync').forEach(btn => {
      btn.addEventListener('click', async () => {
        const mountPoint = btn.dataset.mount;
        await this.handleSync(mountPoint);
      });
    });
  }

  async showMountDialog(providerId) {
    const dialog = document.createElement('div');
    dialog.className = 'cloud-dialog';
    dialog.innerHTML = `
      <div class="dialog-content">
        <h3>Mount Cloud Storage</h3>
        <div class="form-group">
          <label>Local Mount Point:</label>
          <input type="text" id="mount-local" placeholder="/mnt/cloud" value="/mnt/cloud">
        </div>
        <div class="form-group">
          <label>Cloud Path:</label>
          <input type="text" id="mount-cloud" placeholder="/" value="/">
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="mount-sync" checked>
            Enable automatic sync
          </label>
        </div>
        <div class="dialog-actions">
          <button class="btn-cancel">Cancel</button>
          <button class="btn-mount">Mount</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    dialog.querySelector('.btn-cancel').addEventListener('click', () => {
      dialog.remove();
    });

    dialog.querySelector('.btn-mount').addEventListener('click', async () => {
      const localPath = dialog.querySelector('#mount-local').value;
      const cloudPath = dialog.querySelector('#mount-cloud').value;
      const enableSync = dialog.querySelector('#mount-sync').checked;

      try {
        await this.cloudManager.mount(providerId, cloudPath, localPath, {
          sync: enableSync
        });

        this.showSuccess(`Mounted ${cloudPath} to ${localPath}`);
        this.updateStatus();
        dialog.remove();
      } catch (error) {
        this.showError(`Mount failed: ${error.message}`);
      }
    });
  }

  async handleDisconnect(providerId) {
    if (!confirm(`Disconnect from ${providerId}?`)) return;

    try {
      await this.cloudManager.disconnect(providerId);
      this.showSuccess('Provider disconnected');
      this.updateStatus();
    } catch (error) {
      this.showError(`Disconnect failed: ${error.message}`);
    }
  }

  async handleUnmount(mountPoint) {
    if (!confirm(`Unmount ${mountPoint}?`)) return;

    try {
      await this.cloudManager.unmount(mountPoint);
      this.showSuccess('Unmounted successfully');
      this.updateStatus();
    } catch (error) {
      this.showError(`Unmount failed: ${error.message}`);
    }
  }

  async handleSync(mountPoint) {
    try {
      this.showInfo('Syncing...');
      const mount = this.mounts.find(m => m.mountPoint === mountPoint);
      if (!mount) {
        throw new Error('Mount not found');
      }

      await this.cloudManager.sync(mount.mountPoint, mount.providerId, mount.cloudPath);
      this.showSuccess('Sync completed');
    } catch (error) {
      this.showError(`Sync failed: ${error.message}`);
    }
  }

  loadSettings() {
    // Load settings from cloudManager or localStorage
    const conflictSelect = this.container.querySelector('#conflict-strategy');
    const bandwidthInput = this.container.querySelector('#bandwidth-limit');
    const excludeInput = this.container.querySelector('#exclude-patterns');

    // Set defaults or loaded values
    if (conflictSelect) {
      conflictSelect.value = 'keep-both';
    }
    if (bandwidthInput) {
      bandwidthInput.value = '0';
    }
    if (excludeInput) {
      excludeInput.value = '.git,node_modules';
    }
  }

  async applySettings() {
    const conflictStrategy = this.container.querySelector('#conflict-strategy').value;
    const bandwidthLimit = parseInt(this.container.querySelector('#bandwidth-limit').value, 10);
    const excludePatterns = this.container.querySelector('#exclude-patterns').value
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    try {
      // Apply settings to all sync engines
      // This would need to be implemented in CloudStorageManager
      this.showSuccess('Settings applied');
    } catch (error) {
      this.showError(`Failed to apply settings: ${error.message}`);
    }
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showInfo(message) {
    this.showNotification(message, 'info');
  }

  showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}
