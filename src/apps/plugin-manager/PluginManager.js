/**
 * Plugin Manager Application
 * UI for managing WebOS plugins
 */

export default class PluginManager {
  constructor(context) {
    this.context = context;
    this.vfs = context.fs;
    this.kernel = context.kernel;
    this.pluginLoader = null;
    this.container = null;
    this.plugins = [];
    this.selectedPlugin = null;
  }

  /**
   * Initialize the application
   */
  async init() {
    // Get plugin manager from kernel (which contains the loader)
    this.pluginManager = this.kernel.pluginManager;
    if (this.pluginManager) {
      this.pluginLoader = this.pluginManager.loader;
    }
    if (!this.pluginLoader) {
      console.error('[PluginManager UI] Plugin system not available');
    }
  }

  /**
   * Render the application UI
   * @returns {HTMLElement} The application container
   */
  async render() {
    this.container = document.createElement('div');
    this.container.className = 'plugin-manager-app';
    this.container.innerHTML = this.getHTML();

    // Apply styles
    this.applyStyles();

    // Setup event handlers
    this.setupEventHandlers();

    // Load plugins
    await this.loadPlugins();

    return this.container;
  }

  /**
   * Get HTML template
   * @returns {string} HTML string
   */
  getHTML() {
    return `
      <div class="plugin-manager-layout">
        <!-- Header -->
        <div class="plugin-manager-header">
          <h2>Plugin Manager</h2>
          <div class="header-actions">
            <button class="btn btn-primary" id="marketplace-btn">
              🏪 Marketplace
            </button>
            <button class="btn btn-primary" id="install-plugin-btn">
              📦 Install Plugin
            </button>
            <button class="btn btn-secondary" id="refresh-btn">
              🔄 Refresh
            </button>
          </div>
        </div>

        <!-- Main content -->
        <div class="plugin-manager-content">
          <!-- Plugin list -->
          <div class="plugin-list-panel">
            <div class="panel-header">
              <h3>Installed Plugins</h3>
              <span class="plugin-count" id="plugin-count">0 plugins</span>
            </div>
            <div class="plugin-list" id="plugin-list">
              <div class="loading-message">Loading plugins...</div>
            </div>
          </div>

          <!-- Plugin details -->
          <div class="plugin-details-panel">
            <div class="panel-header">
              <h3>Plugin Details</h3>
            </div>
            <div class="plugin-details" id="plugin-details">
              <div class="empty-state">
                <p>Select a plugin to view details</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Apply styles
   */
  applyStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .plugin-manager-app {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #1e1e1e;
        color: #d4d4d4;
        font-family: system-ui, -apple-system, sans-serif;
      }

      .plugin-manager-layout {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .plugin-manager-header {
        padding: 16px 20px;
        background: #252526;
        border-bottom: 1px solid #3e3e42;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .plugin-manager-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .header-actions {
        display: flex;
        gap: 10px;
      }

      .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: background 0.2s;
      }

      .btn-primary {
        background: #007acc;
        color: white;
      }

      .btn-primary:hover {
        background: #005a9e;
      }

      .btn-secondary {
        background: #3e3e42;
        color: #d4d4d4;
      }

      .btn-secondary:hover {
        background: #4e4e52;
      }

      .btn-danger {
        background: #d73a49;
        color: white;
      }

      .btn-danger:hover {
        background: #cb2431;
      }

      .btn-success {
        background: #28a745;
        color: white;
      }

      .btn-success:hover {
        background: #218838;
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .plugin-manager-content {
        flex: 1;
        display: flex;
        overflow: hidden;
      }

      .plugin-list-panel {
        width: 350px;
        border-right: 1px solid #3e3e42;
        display: flex;
        flex-direction: column;
      }

      .plugin-details-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .panel-header {
        padding: 12px 16px;
        background: #252526;
        border-bottom: 1px solid #3e3e42;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .panel-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #888;
      }

      .plugin-count {
        font-size: 12px;
        color: #888;
      }

      .plugin-list {
        flex: 1;
        overflow-y: auto;
      }

      .plugin-item {
        padding: 12px 16px;
        border-bottom: 1px solid #3e3e42;
        cursor: pointer;
        transition: background 0.2s;
      }

      .plugin-item:hover {
        background: #2a2d2e;
      }

      .plugin-item.selected {
        background: #094771;
      }

      .plugin-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }

      .plugin-name {
        font-weight: 600;
        font-size: 14px;
      }

      .plugin-version {
        font-size: 12px;
        color: #888;
      }

      .plugin-description {
        font-size: 12px;
        color: #888;
        margin: 4px 0;
      }

      .plugin-status {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 11px;
        font-weight: 600;
        margin-top: 4px;
      }

      .plugin-status.enabled {
        background: #28a74533;
        color: #4ec97b;
      }

      .plugin-status.disabled {
        background: #d73a4933;
        color: #f48771;
      }

      .plugin-details {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
      }

      .empty-state {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        color: #888;
      }

      .details-section {
        margin-bottom: 24px;
      }

      .details-section h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: #888;
        text-transform: uppercase;
      }

      .details-section p {
        margin: 8px 0;
        font-size: 14px;
        line-height: 1.6;
      }

      .details-field {
        display: flex;
        margin-bottom: 8px;
      }

      .field-label {
        width: 120px;
        font-weight: 600;
        color: #888;
      }

      .field-value {
        flex: 1;
      }

      .permission-list {
        list-style: none;
        padding: 0;
        margin: 8px 0;
      }

      .permission-item {
        padding: 6px 12px;
        background: #2a2d2e;
        border-radius: 4px;
        margin-bottom: 4px;
        font-size: 13px;
        font-family: 'Courier New', monospace;
      }

      .plugin-actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #3e3e42;
      }

      .loading-message {
        padding: 20px;
        text-align: center;
        color: #888;
      }

      .error-message {
        padding: 20px;
        text-align: center;
        color: #f48771;
      }

      .install-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      }

      .modal-content {
        background: #252526;
        padding: 24px;
        border-radius: 8px;
        width: 500px;
        max-width: 90%;
      }

      .modal-content h3 {
        margin-top: 0;
      }

      .form-group {
        margin-bottom: 16px;
      }

      .form-group label {
        display: block;
        margin-bottom: 6px;
        font-weight: 600;
        font-size: 14px;
      }

      .form-group input,
      .form-group textarea {
        width: 100%;
        padding: 8px;
        background: #1e1e1e;
        border: 1px solid #3e3e42;
        border-radius: 4px;
        color: #d4d4d4;
        font-size: 14px;
        font-family: inherit;
      }

      .form-group textarea {
        resize: vertical;
        min-height: 100px;
        font-family: 'Courier New', monospace;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
      }
    `;

    this.container.appendChild(style);
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Marketplace button
    this.container.querySelector('#marketplace-btn')?.addEventListener('click', () => {
      this.showMarketplace();
    });

    // Install plugin button
    this.container.querySelector('#install-plugin-btn')?.addEventListener('click', () => {
      this.showInstallDialog();
    });

    // Refresh button
    this.container.querySelector('#refresh-btn')?.addEventListener('click', () => {
      this.loadPlugins();
    });
  }

  /**
   * Load plugins
   */
  async loadPlugins() {
    const pluginList = this.container.querySelector('#plugin-list');
    const pluginCount = this.container.querySelector('#plugin-count');

    if (!this.pluginLoader) {
      pluginList.innerHTML = '<div class="error-message">Plugin loader not available</div>';
      return;
    }

    try {
      // Get all installed plugins
      const installedPlugins = await this.pluginLoader.listInstalledPlugins();

      // Get loaded plugins
      const loadedPlugins = this.pluginLoader.getAllPlugins();

      // Combine data
      this.plugins = installedPlugins.map(id => {
        const loaded = loadedPlugins.find(p => p.id === id);
        return {
          id,
          loaded: !!loaded,
          enabled: loaded?.enabled || false,
          manifest: loaded?.manifest || null,
          loadedAt: loaded?.loadedAt || null,
          activatedAt: loaded?.activatedAt || null
        };
      });

      // Update count
      pluginCount.textContent = `${this.plugins.length} plugin${this.plugins.length !== 1 ? 's' : ''}`;

      // Render plugin list
      if (this.plugins.length === 0) {
        pluginList.innerHTML = '<div class="empty-state"><p>No plugins installed</p></div>';
        return;
      }

      pluginList.innerHTML = this.plugins.map(plugin => `
        <div class="plugin-item" data-plugin-id="${plugin.id}">
          <div class="plugin-item-header">
            <div class="plugin-name">${plugin.manifest?.name || plugin.id}</div>
            <div class="plugin-version">${plugin.manifest?.version || '?'}</div>
          </div>
          <div class="plugin-description">
            ${plugin.manifest?.description || 'No description'}
          </div>
          <div>
            <span class="plugin-status ${plugin.enabled ? 'enabled' : 'disabled'}">
              ${plugin.enabled ? '● Enabled' : '○ Disabled'}
            </span>
          </div>
        </div>
      `).join('');

      // Add click handlers
      pluginList.querySelectorAll('.plugin-item').forEach(item => {
        item.addEventListener('click', () => {
          const pluginId = item.dataset.pluginId;
          this.selectPlugin(pluginId);
        });
      });

    } catch (error) {
      console.error('Error loading plugins:', error);
      pluginList.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    }
  }

  /**
   * Select a plugin
   * @param {string} pluginId - Plugin ID
   */
  selectPlugin(pluginId) {
    const plugin = this.plugins.find(p => p.id === pluginId);
    if (!plugin) return;

    this.selectedPlugin = plugin;

    // Update selection
    this.container.querySelectorAll('.plugin-item').forEach(item => {
      item.classList.toggle('selected', item.dataset.pluginId === pluginId);
    });

    // Show details
    this.showPluginDetails(plugin);
  }

  /**
   * Show plugin details
   * @param {Object} plugin - Plugin data
   */
  showPluginDetails(plugin) {
    const detailsPanel = this.container.querySelector('#plugin-details');
    const manifest = plugin.manifest || {};

    detailsPanel.innerHTML = `
      <div class="details-section">
        <h4>Information</h4>
        <div class="details-field">
          <div class="field-label">ID:</div>
          <div class="field-value">${plugin.id}</div>
        </div>
        <div class="details-field">
          <div class="field-label">Name:</div>
          <div class="field-value">${manifest.name || 'Unknown'}</div>
        </div>
        <div class="details-field">
          <div class="field-label">Version:</div>
          <div class="field-value">${manifest.version || 'Unknown'}</div>
        </div>
        <div class="details-field">
          <div class="field-label">Author:</div>
          <div class="field-value">${manifest.author || 'Unknown'}</div>
        </div>
        <div class="details-field">
          <div class="field-label">Status:</div>
          <div class="field-value">
            <span class="plugin-status ${plugin.enabled ? 'enabled' : 'disabled'}">
              ${plugin.enabled ? '● Enabled' : '○ Disabled'}
            </span>
          </div>
        </div>
      </div>

      ${manifest.description ? `
        <div class="details-section">
          <h4>Description</h4>
          <p>${manifest.description}</p>
        </div>
      ` : ''}

      ${manifest.permissions && manifest.permissions.length > 0 ? `
        <div class="details-section">
          <h4>Permissions</h4>
          <ul class="permission-list">
            ${manifest.permissions.map(p => `<li class="permission-item">${p}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${manifest.engines ? `
        <div class="details-section">
          <h4>Requirements</h4>
          <div class="details-field">
            <div class="field-label">WebOS:</div>
            <div class="field-value">${manifest.engines.webos || 'Any'}</div>
          </div>
        </div>
      ` : ''}

      <div class="plugin-actions">
        ${!plugin.loaded ? `
          <button class="btn btn-primary" onclick="window.pluginManagerInstance.loadPlugin('${plugin.id}')">
            Load Plugin
          </button>
        ` : !plugin.enabled ? `
          <button class="btn btn-success" onclick="window.pluginManagerInstance.enablePlugin('${plugin.id}')">
            Enable Plugin
          </button>
          <button class="btn btn-secondary" onclick="window.pluginManagerInstance.reloadPlugin('${plugin.id}')">
            🔄 Reload
          </button>
          <button class="btn btn-secondary" onclick="window.pluginManagerInstance.unloadPlugin('${plugin.id}')">
            Unload
          </button>
        ` : `
          <button class="btn btn-danger" onclick="window.pluginManagerInstance.disablePlugin('${plugin.id}')">
            Disable Plugin
          </button>
          <button class="btn btn-secondary" onclick="window.pluginManagerInstance.reloadPlugin('${plugin.id}')">
            🔄 Reload
          </button>
        `}
        <button class="btn btn-danger" onclick="window.pluginManagerInstance.uninstallPlugin('${plugin.id}')">
          Uninstall
        </button>
      </div>
    `;

    // Store instance for onclick handlers
    window.pluginManagerInstance = this;
  }

  /**
   * Load a plugin
   * @param {string} pluginId - Plugin ID
   */
  async loadPlugin(pluginId) {
    try {
      await this.pluginLoader.loadPlugin(pluginId);
      await this.loadPlugins();
      this.selectPlugin(pluginId);
      this.showNotification('Plugin loaded successfully', 'success');
    } catch (error) {
      console.error('Error loading plugin:', error);
      this.showNotification(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Enable a plugin
   * @param {string} pluginId - Plugin ID
   */
  async enablePlugin(pluginId) {
    try {
      await this.pluginLoader.activatePlugin(pluginId);
      await this.loadPlugins();
      this.selectPlugin(pluginId);
      this.showNotification('Plugin enabled successfully', 'success');
    } catch (error) {
      console.error('Error enabling plugin:', error);
      this.showNotification(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Disable a plugin
   * @param {string} pluginId - Plugin ID
   */
  async disablePlugin(pluginId) {
    try {
      await this.pluginLoader.deactivatePlugin(pluginId);
      await this.loadPlugins();
      this.selectPlugin(pluginId);
      this.showNotification('Plugin disabled successfully', 'success');
    } catch (error) {
      console.error('Error disabling plugin:', error);
      this.showNotification(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Unload a plugin
   * @param {string} pluginId - Plugin ID
   */
  async unloadPlugin(pluginId) {
    try {
      await this.pluginLoader.unloadPlugin(pluginId);
      await this.loadPlugins();
      this.selectPlugin(pluginId);
      this.showNotification('Plugin unloaded successfully', 'success');
    } catch (error) {
      console.error('Error unloading plugin:', error);
      this.showNotification(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Uninstall a plugin
   * @param {string} pluginId - Plugin ID
   */
  async uninstallPlugin(pluginId) {
    if (!confirm(`Are you sure you want to uninstall ${pluginId}?`)) {
      return;
    }

    try {
      await this.pluginLoader.uninstallPlugin(pluginId);
      await this.loadPlugins();
      this.container.querySelector('#plugin-details').innerHTML = `
        <div class="empty-state">
          <p>Select a plugin to view details</p>
        </div>
      `;
      this.showNotification('Plugin uninstalled successfully', 'success');
    } catch (error) {
      console.error('Error uninstalling plugin:', error);
      this.showNotification(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Show install dialog
   */
  showInstallDialog() {
    const modal = document.createElement('div');
    modal.className = 'install-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Install Plugin</h3>
        <div class="form-group">
          <label>Plugin ID:</label>
          <input type="text" id="plugin-id-input" placeholder="e.g., my-plugin">
        </div>
        <div class="form-group">
          <label>Plugin Manifest (JSON):</label>
          <textarea id="plugin-manifest-input" placeholder='{
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "A cool plugin",
  "main": "plugin.js",
  "author": "Your Name",
  "permissions": []
}'></textarea>
        </div>
        <div class="form-group">
          <label>Plugin Code (JavaScript):</label>
          <textarea id="plugin-code-input" placeholder='class MyPlugin {
  constructor(api) {
    this.api = api;
  }

  async activate() {
    this.api.ui.notify("Plugin activated!");
  }

  async deactivate() {
    // Cleanup
  }
}

module.exports = MyPlugin;'></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="cancel-install-btn">Cancel</button>
          <button class="btn btn-primary" id="confirm-install-btn">Install</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#cancel-install-btn').addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('#confirm-install-btn').addEventListener('click', async () => {
      const pluginId = modal.querySelector('#plugin-id-input').value.trim();
      const manifestText = modal.querySelector('#plugin-manifest-input').value.trim();
      const codeText = modal.querySelector('#plugin-code-input').value.trim();

      if (!pluginId || !manifestText || !codeText) {
        alert('Please fill in all fields');
        return;
      }

      try {
        // Parse manifest
        const manifest = JSON.parse(manifestText);

        // Create plugin directory
        const pluginDir = `/home/user/.webos/plugins/${pluginId}`;
        await this.vfs.mkdir(pluginDir, { recursive: true });

        // Write manifest
        await this.vfs.writeFile(`${pluginDir}/plugin.json`, JSON.stringify(manifest, null, 2));

        // Write code
        await this.vfs.writeFile(`${pluginDir}/${manifest.main || 'plugin.js'}`, codeText);

        modal.remove();
        await this.loadPlugins();
        this.showNotification('Plugin installed successfully', 'success');
      } catch (error) {
        console.error('Error installing plugin:', error);
        alert(`Error: ${error.message}`);
      }
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#d73a49' : '#007acc'};
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10001;
      font-size: 14px;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Reload a plugin (hot reload)
   * @param {string} pluginId - Plugin ID
   */
  async reloadPlugin(pluginId) {
    try {
      await this.pluginLoader.reloadPlugin(pluginId);
      await this.loadPlugins();
      this.selectPlugin(pluginId);
      this.showNotification('Plugin reloaded successfully', 'success');
    } catch (error) {
      console.error('Error reloading plugin:', error);
      this.showNotification(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Show marketplace browser
   */
  async showMarketplace() {
    // Check if marketplace exists
    if (!this.pluginManager || !this.pluginManager.marketplace) {
      this.showNotification('Marketplace not available', 'error');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'install-modal';
    modal.innerHTML = `
      <div class="modal-content" style="width: 700px; max-width: 95%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0;">Plugin Marketplace</h3>
          <button class="close-modal-btn" style="background: none; border: none; color: #888; cursor: pointer; font-size: 20px;">×</button>
        </div>

        <div style="margin-bottom: 16px;">
          <input type="text" id="marketplace-search" placeholder="Search plugins..." style="
            width: 100%;
            padding: 8px;
            background: #1e1e1e;
            border: 1px solid #3e3e42;
            border-radius: 4px;
            color: #d4d4d4;
            font-size: 14px;
          ">
        </div>

        <div class="marketplace-content" style="max-height: 400px; overflow-y: auto;">
          <div style="text-align: center; padding: 20px; color: #888;">Loading...</div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close button
    modal.querySelector('.close-modal-btn').addEventListener('click', () => {
      modal.remove();
    });

    // Load featured plugins
    await this.loadMarketplacePlugins(modal);

    // Search functionality
    let searchTimeout;
    modal.querySelector('#marketplace-search').addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(async () => {
        await this.loadMarketplacePlugins(modal, e.target.value);
      }, 300);
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Load marketplace plugins
   */
  async loadMarketplacePlugins(modal, searchQuery = '') {
    const marketplace = this.pluginManager.marketplace;
    const content = modal.querySelector('.marketplace-content');

    try {
      const plugins = searchQuery
        ? await marketplace.searchPlugins(searchQuery)
        : await marketplace.getFeaturedPlugins();

      if (plugins.length === 0) {
        content.innerHTML = '<div style="text-align: center; padding: 40px; color: #888;">No plugins found</div>';
        return;
      }

      content.innerHTML = plugins.map(plugin => `
        <div style="
          padding: 16px;
          background: #1e1e1e;
          border: 1px solid #3e3e42;
          border-radius: 4px;
          margin-bottom: 12px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 24px;">${plugin.icon || '📦'}</span>
                <div>
                  <div style="font-weight: 600; font-size: 16px;">${plugin.name}</div>
                  <div style="font-size: 12px; color: #888;">${plugin.author} • v${plugin.version}</div>
                </div>
              </div>
              <div style="font-size: 14px; color: #d4d4d4; margin-bottom: 8px;">
                ${plugin.description}
              </div>
              <div style="font-size: 12px; color: #666;">
                ⬇ ${plugin.stats?.downloads || 0} downloads • ⭐ ${plugin.stats?.rating || 0}/5
              </div>
            </div>
            <button class="install-from-marketplace" data-plugin-id="${plugin.id}" style="
              padding: 8px 16px;
              background: #28a745;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              white-space: nowrap;
            ">
              Install
            </button>
          </div>
        </div>
      `).join('');

      // Add event listeners
      content.querySelectorAll('.install-from-marketplace').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const pluginId = e.target.dataset.pluginId;
          await this.installFromMarketplace(pluginId, modal);
        });
      });
    } catch (error) {
      console.error('Error loading marketplace plugins:', error);
      content.innerHTML = '<div style="text-align: center; padding: 20px; color: #f48771;">Error loading plugins</div>';
    }
  }

  /**
   * Install plugin from marketplace
   */
  async installFromMarketplace(pluginId, modal) {
    const marketplace = this.pluginManager.marketplace;

    // Show progress
    const progressModal = document.createElement('div');
    progressModal.className = 'install-modal';
    progressModal.innerHTML = `
      <div class="modal-content" style="width: 400px;">
        <h3>Installing Plugin</h3>
        <div style="margin: 20px 0;">
          <div style="color: #888; margin-bottom: 8px;">Installing ${pluginId}...</div>
          <div style="background: #1e1e1e; border-radius: 4px; height: 6px; overflow: hidden;">
            <div class="progress-bar" style="
              background: #28a745;
              height: 100%;
              width: 0%;
              transition: width 0.3s;
            "></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(progressModal);

    const progressBar = progressModal.querySelector('.progress-bar');

    try {
      // Simulate progress
      progressBar.style.width = '30%';

      await marketplace.installPluginFromMarketplace(pluginId);

      progressBar.style.width = '100%';

      setTimeout(async () => {
        progressModal.remove();
        modal.remove();
        await this.loadPlugins();
        this.showNotification(`${pluginId} installed successfully!`, 'success');
      }, 500);
    } catch (error) {
      progressModal.remove();
      this.showNotification(`Installation failed: ${error.message}`, 'error');
    }
  }

  /**
   * Destroy the application
   */
  destroy() {
    // Cleanup
    if (window.pluginManagerInstance === this) {
      delete window.pluginManagerInstance;
    }
  }
}
