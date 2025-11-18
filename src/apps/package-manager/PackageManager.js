/**
 * Package Manager Application
 * Manages npm packages and dependencies
 */
import { Registry } from './Registry.js';
import { DependencyResolver } from './DependencyResolver.js';
import { Installer } from './Installer.js';

export default class PackageManager {
  constructor(context) {
    this.context = context;
    this.vfs = context.fs;
    this.registry = new Registry();
    this.resolver = new DependencyResolver(this.registry);
    this.installer = new Installer(this.vfs, this.registry);
    this.container = null;
  }

  /**
   * Initialize the application
   */
  async init() {}

  /**
   * Render the application
   * @returns {HTMLElement} Application container
   */
  async render() {
    this.container = document.createElement('div');
    this.container.className = 'package-manager-app';
    this.container.innerHTML = this.getHTML();

    this.attachEventListeners();
    this.renderInstalledPackages();

    return this.container;
  }

  /**
   * Get HTML template
   * @returns {string} HTML string
   */
  getHTML() {
    return `
      <div class="pm-layout">
        <!-- Header -->
        <div class="pm-header">
          <h2>📦 Package Manager</h2>
          <div class="pm-search">
            <input type="text" id="pm-search-input" placeholder="Search packages..." />
            <button id="pm-search-btn">Search</button>
          </div>
        </div>

        <!-- Main content -->
        <div class="pm-content">
          <!-- Sidebar -->
          <div class="pm-sidebar">
            <button class="pm-nav-btn active" data-view="installed">Installed</button>
            <button class="pm-nav-btn" data-view="search">Search</button>
            <button class="pm-nav-btn" data-view="updates">Updates</button>
          </div>

          <!-- View area -->
          <div class="pm-view">
            <!-- Installed packages view -->
            <div class="pm-view-panel" id="view-installed">
              <h3>Installed Packages</h3>
              <div id="installed-packages-list"></div>
            </div>

            <!-- Search results view -->
            <div class="pm-view-panel" id="view-search" style="display: none;">
              <h3>Search Results</h3>
              <div id="search-results-list"></div>
            </div>

            <!-- Updates view -->
            <div class="pm-view-panel" id="view-updates" style="display: none;">
              <h3>Available Updates</h3>
              <div id="updates-list">
                <p>Check for updates to see available package updates.</p>
                <button id="check-updates-btn">Check for Updates</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Install modal -->
        <div class="pm-modal" id="install-modal" style="display: none;">
          <div class="pm-modal-content">
            <div class="pm-modal-header">
              <h3 id="modal-title">Install Package</h3>
              <button class="pm-modal-close">✕</button>
            </div>
            <div class="pm-modal-body" id="modal-body">
              <!-- Content filled dynamically -->
            </div>
            <div class="pm-modal-footer" id="modal-footer">
              <button class="pm-btn pm-btn-secondary" id="modal-cancel">Cancel</button>
              <button class="pm-btn pm-btn-primary" id="modal-confirm">Install</button>
            </div>
          </div>
        </div>

        <!-- Status bar -->
        <div class="pm-status-bar">
          <span id="pm-status">Ready</span>
          <span id="pm-cache-info">Cache: 0 packages</span>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Search
    const searchInput = this.container.querySelector('#pm-search-input');
    const searchBtn = this.container.querySelector('#pm-search-btn');

    searchBtn?.addEventListener('click', () => {
      this.searchPackages(searchInput.value);
    });

    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.searchPackages(searchInput.value);
      }
    });

    // Navigation
    this.container.querySelectorAll('.pm-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchView(btn.dataset.view);
      });
    });

    // Check updates
    this.container.querySelector('#check-updates-btn')?.addEventListener('click', () => {
      this.checkUpdates();
    });

    // Modal
    this.container.querySelector('.pm-modal-close')?.addEventListener('click', () => {
      this.hideModal();
    });

    this.container.querySelector('#modal-cancel')?.addEventListener('click', () => {
      this.hideModal();
    });
  }

  /**
   * Switch view
   * @param {string} view - View name
   */
  switchView(view) {
    // Update navigation
    this.container.querySelectorAll('.pm-nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Update panels
    this.container.querySelectorAll('.pm-view-panel').forEach(panel => {
      panel.style.display = panel.id === `view-${view}` ? 'block' : 'none';
    });

    // Refresh content if needed
    if (view === 'installed') {
      this.renderInstalledPackages();
    }
  }

  /**
   * Search packages
   * @param {string} query - Search query
   */
  async searchPackages(query) {
    if (!query || query.trim() === '') {
      return;
    }

    this.switchView('search');
    this.updateStatus('Searching...');

    const resultsContainer = this.container.querySelector('#search-results-list');
    resultsContainer.innerHTML = '<div class="pm-loading">Searching packages...</div>';

    try {
      const results = await this.registry.search(query, 20);

      if (results.length === 0) {
        resultsContainer.innerHTML = '<p>No packages found.</p>';
        return;
      }

      resultsContainer.innerHTML = results.map(pkg => `
        <div class="pm-package-card">
          <div class="pm-package-header">
            <h4>${pkg.name}</h4>
            <span class="pm-package-version">v${pkg.version}</span>
          </div>
          <p class="pm-package-description">${pkg.description || 'No description'}</p>
          <div class="pm-package-meta">
            ${pkg.author ? `<span>👤 ${pkg.author}</span>` : ''}
            ${pkg.keywords ? `<span>🏷️ ${pkg.keywords.slice(0, 3).join(', ')}</span>` : ''}
          </div>
          <div class="pm-package-actions">
            <button class="pm-btn pm-btn-primary pm-install-btn" data-package="${pkg.name}" data-version="${pkg.version}">
              ${this.installer.isInstalled(pkg.name) ? 'Reinstall' : 'Install'}
            </button>
            ${pkg.links?.npm ? `<a href="${pkg.links.npm}" target="_blank" class="pm-btn pm-btn-secondary">npm</a>` : ''}
          </div>
        </div>
      `).join('');

      // Attach install buttons
      resultsContainer.querySelectorAll('.pm-install-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.showInstallModal(btn.dataset.package, btn.dataset.version);
        });
      });

      this.updateStatus(`Found ${results.length} packages`);
      this.updateCacheInfo();
    } catch (error) {
      console.error('Search error:', error);
      resultsContainer.innerHTML = `<p class="pm-error">Error searching packages: ${error.message}</p>`;
      this.updateStatus('Search failed');
    }
  }

  /**
   * Render installed packages
   */
  renderInstalledPackages() {
    const container = this.container.querySelector('#installed-packages-list');
    const installed = this.installer.getInstalled();

    if (installed.length === 0) {
      container.innerHTML = '<p>No packages installed yet.</p>';
      return;
    }

    container.innerHTML = installed.map(pkg => `
      <div class="pm-package-card">
        <div class="pm-package-header">
          <h4>${pkg.name}</h4>
          <span class="pm-package-version">v${pkg.version}</span>
        </div>
        <div class="pm-package-meta">
          <span>📅 Installed: ${new Date(pkg.installedAt).toLocaleDateString()}</span>
          ${Object.keys(pkg.dependencies || {}).length > 0 ?
            `<span>📦 ${Object.keys(pkg.dependencies).length} dependencies</span>` : ''}
        </div>
        <div class="pm-package-actions">
          <button class="pm-btn pm-btn-secondary pm-update-btn" data-package="${pkg.name}">Update</button>
          <button class="pm-btn pm-btn-danger pm-uninstall-btn" data-package="${pkg.name}">Uninstall</button>
        </div>
      </div>
    `).join('');

    // Attach action buttons
    container.querySelectorAll('.pm-update-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.updatePackage(btn.dataset.package);
      });
    });

    container.querySelectorAll('.pm-uninstall-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.uninstallPackage(btn.dataset.package);
      });
    });
  }

  /**
   * Show install modal
   * @param {string} packageName - Package name
   * @param {string} version - Package version
   */
  async showInstallModal(packageName, version) {
    const modal = this.container.querySelector('#install-modal');
    const modalTitle = this.container.querySelector('#modal-title');
    const modalBody = this.container.querySelector('#modal-body');
    const confirmBtn = this.container.querySelector('#modal-confirm');

    modalTitle.textContent = `Install ${packageName}@${version}`;
    modalBody.innerHTML = '<div class="pm-loading">Resolving dependencies...</div>';
    modal.style.display = 'flex';

    try {
      // Resolve dependencies
      const dependencies = await this.resolver.getFlatDependencies(packageName, version);
      const size = await this.resolver.estimateSize(new Map(dependencies.map(d => [d.name, d.version])));

      modalBody.innerHTML = `
        <div class="pm-install-info">
          <p><strong>Package:</strong> ${packageName}@${version}</p>
          <p><strong>Dependencies:</strong> ${dependencies.length}</p>
          <p><strong>Estimated size:</strong> ${this.resolver.formatSize(size)}</p>
          <div class="pm-dependency-list">
            <h4>Will install:</h4>
            <ul>
              ${dependencies.slice(0, 10).map(d => `<li>${d.name}@${d.version}</li>`).join('')}
              ${dependencies.length > 10 ? `<li>... and ${dependencies.length - 10} more</li>` : ''}
            </ul>
          </div>
        </div>
      `;

      // Setup confirm button
      confirmBtn.onclick = async () => {
        await this.installPackage(packageName, version);
        this.hideModal();
      };
    } catch (error) {
      modalBody.innerHTML = `<p class="pm-error">Error resolving dependencies: ${error.message}</p>`;
    }
  }

  /**
   * Hide modal
   */
  hideModal() {
    const modal = this.container.querySelector('#install-modal');
    modal.style.display = 'none';
  }

  /**
   * Install package
   * @param {string} packageName - Package name
   * @param {string} version - Package version
   */
  async installPackage(packageName, version) {
    this.updateStatus(`Installing ${packageName}@${version}...`);

    const result = await this.installer.install(packageName, version, (status) => {
      this.updateStatus(`${status.stage} (${status.progress}%)`);
    });

    if (result.success) {
      this.updateStatus(result.message);
      this.renderInstalledPackages();
    } else {
      this.updateStatus(`Error: ${result.message}`);
    }
  }

  /**
   * Uninstall package
   * @param {string} packageName - Package name
   */
  async uninstallPackage(packageName) {
    if (!confirm(`Uninstall ${packageName}?`)) {
      return;
    }

    this.updateStatus(`Uninstalling ${packageName}...`);

    const result = await this.installer.uninstall(packageName);

    if (result.success) {
      this.updateStatus(result.message);
      this.renderInstalledPackages();
    } else {
      this.updateStatus(`Error: ${result.message}`);
    }
  }

  /**
   * Update package
   * @param {string} packageName - Package name
   */
  async updatePackage(packageName) {
    this.updateStatus(`Updating ${packageName}...`);

    const result = await this.installer.update(packageName);

    if (result.success) {
      this.updateStatus(result.message);
      this.renderInstalledPackages();
    } else {
      this.updateStatus(`Error: ${result.message}`);
    }
  }

  /**
   * Check for updates
   */
  async checkUpdates() {
    this.updateStatus('Checking for updates...');
    const installed = this.installer.getInstalled();
    const updatesContainer = this.container.querySelector('#updates-list');

    updatesContainer.innerHTML = '<div class="pm-loading">Checking for updates...</div>';

    const updates = [];

    for (const pkg of installed) {
      try {
        const latestVersion = await this.registry.getVersionInfo(pkg.name, 'latest');
        if (latestVersion.version !== pkg.version) {
          updates.push({
            name: pkg.name,
            current: pkg.version,
            latest: latestVersion.version
          });
        }
      } catch (error) {
        console.error(`Error checking ${pkg.name}:`, error);
      }
    }

    if (updates.length === 0) {
      updatesContainer.innerHTML = '<p>All packages are up to date!</p>';
      this.updateStatus('All packages up to date');
      return;
    }

    updatesContainer.innerHTML = `
      <p>Found ${updates.length} package(s) with updates available:</p>
      ${updates.map(u => `
        <div class="pm-package-card">
          <div class="pm-package-header">
            <h4>${u.name}</h4>
            <span class="pm-package-version">${u.current} → ${u.latest}</span>
          </div>
          <div class="pm-package-actions">
            <button class="pm-btn pm-btn-primary pm-update-btn" data-package="${u.name}">Update</button>
          </div>
        </div>
      `).join('')}
    `;

    // Attach update buttons
    updatesContainer.querySelectorAll('.pm-update-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await this.updatePackage(btn.dataset.package);
        this.checkUpdates(); // Refresh list
      });
    });

    this.updateStatus(`Found ${updates.length} update(s)`);
  }

  /**
   * Update status bar
   * @param {string} message - Status message
   */
  updateStatus(message) {
    const statusEl = this.container.querySelector('#pm-status');
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  /**
   * Update cache info
   */
  updateCacheInfo() {
    const cacheInfo = this.container.querySelector('#pm-cache-info');
    if (cacheInfo) {
      cacheInfo.textContent = `Cache: ${this.registry.getCacheSize()} packages`;
    }
  }
}
