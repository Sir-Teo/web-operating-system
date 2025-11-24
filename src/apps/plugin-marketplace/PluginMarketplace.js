/**
 * PluginMarketplace - Browse and Install Plugins
 *
 * Features:
 * - Browse available plugins
 * - Install/uninstall plugins
 * - Enable/disable plugins
 * - Check for updates
 * - Plugin details and ratings
 */

import PluginManager from '../../plugins/PluginManager.js';

class PluginMarketplace {
  constructor(context) {
    this.context = context;
    this.pluginManager = PluginManager;
    this.currentView = 'available';

    // Mock plugin marketplace (in production, would fetch from server)
    this.marketplacePlugins = [
      {
        id: 'example-plugin',
        name: 'Example Plugin',
        version: '1.0.0',
        description: 'An example plugin to demonstrate the plugin system',
        author: 'WebOS Team',
        category: 'Utility',
        rating: 4.5,
        downloads: 1234,
        source: '/plugins/example-plugin',
        icon: '🔌'
      },
      {
        id: 'theme-manager',
        name: 'Theme Manager',
        version: '1.2.0',
        description: 'Customize WebOS themes and appearance',
        author: 'Community',
        category: 'Customization',
        rating: 4.8,
        downloads: 5678,
        source: '/plugins/theme-manager',
        icon: '🎨'
      }
    ];

    console.log('[PluginMarketplace] Initialized');
  }

  async init() {
    // Ready
  }

  render() {
    const container = document.createElement('div');
    container.className = 'plugin-marketplace';

    container.innerHTML = `
      <div class="marketplace-header">
        <h2>🔌 Plugin Marketplace</h2>
        <div class="header-actions">
          <input type="text" id="search-input" placeholder="Search plugins..." />
          <button class="btn-secondary" id="refresh-btn">🔄 Refresh</button>
        </div>
      </div>

      <div class="marketplace-nav">
        <button class="nav-btn active" data-view="available">Available</button>
        <button class="nav-btn" data-view="installed">Installed</button>
        <button class="nav-btn" data-view="updates">Updates</button>
      </div>

      <div class="marketplace-body">
        <div id="plugins-grid" class="plugins-grid"></div>
      </div>
    `;

    this.container = container;
    this._setupEventListeners();
    this._renderPlugins();

    return container;
  }

  _setupEventListeners() {
    this.container.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.target.dataset.view;
        this._switchView(view);
      });
    });

    this.container.querySelector('#search-input').addEventListener('input', (e) => {
      this._search(e.target.value);
    });

    this.container.querySelector('#refresh-btn').addEventListener('click', () => {
      this._renderPlugins();
    });
  }

  _switchView(view) {
    this.currentView = view;

    this.container.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    this.container.querySelector(`[data-view="${view}"]`).classList.add('active');

    this._renderPlugins();
  }

  _renderPlugins() {
    const grid = this.container.querySelector('#plugins-grid');

    let plugins = [];

    if (this.currentView === 'available') {
      plugins = this.marketplacePlugins;
    } else if (this.currentView === 'installed') {
      plugins = this.pluginManager.listPlugins();
    } else if (this.currentView === 'updates') {
      // Would check for updates
      plugins = [];
    }

    if (plugins.length === 0) {
      grid.innerHTML = '<div class="empty-state">No plugins found</div>';
      return;
    }

    grid.innerHTML = plugins.map(plugin => this._renderPluginCard(plugin)).join('');

    // Add event listeners
    grid.querySelectorAll('.install-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const source = e.target.dataset.source;
        this._installPlugin(source);
      });
    });

    grid.querySelectorAll('.uninstall-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this._uninstallPlugin(id);
      });
    });
  }

  _renderPluginCard(plugin) {
    const isInstalled = this.pluginManager.getPlugin(plugin.id);

    return `
      <div class="plugin-card">
        <div class="plugin-icon">${plugin.icon || '🔌'}</div>
        <div class="plugin-info">
          <h3>${plugin.name}</h3>
          <div class="plugin-meta">
            <span class="version">v${plugin.version}</span>
            ${plugin.rating ? `<span class="rating">⭐ ${plugin.rating}</span>` : ''}
            ${plugin.downloads ? `<span class="downloads">📥 ${plugin.downloads}</span>` : ''}
          </div>
          <p class="plugin-description">${plugin.description}</p>
          <div class="plugin-author">By ${plugin.author || 'Unknown'}</div>
        </div>
        <div class="plugin-actions">
          ${isInstalled
            ? `<button class="btn-danger uninstall-btn" data-id="${plugin.id}">Uninstall</button>`
            : `<button class="btn-primary install-btn" data-source="${plugin.source}">Install</button>`
          }
        </div>
      </div>
    `;
  }

  async _installPlugin(source) {
    try {
      await this.pluginManager.install(source);
      alert('Plugin installed successfully!');
      this._renderPlugins();
    } catch (error) {
      alert(`Installation failed: ${error.message}`);
    }
  }

  async _uninstallPlugin(id) {
    try {
      await this.pluginManager.uninstall(id);
      alert('Plugin uninstalled successfully!');
      this._renderPlugins();
    } catch (error) {
      alert(`Uninstall failed: ${error.message}`);
    }
  }

  _search(query) {
    // Simple search implementation
    const cards = this.container.querySelectorAll('.plugin-card');

    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      const match = text.includes(query.toLowerCase());
      card.style.display = match ? '' : 'none';
    });
  }

  destroy() {
    // Cleanup
  }
}

export default PluginMarketplace;
