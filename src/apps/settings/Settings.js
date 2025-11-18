/**
 * Settings Application
 * Comprehensive settings for WebOS
 */
import ThemeManager from '../../system/themes/ThemeManager.js';

export default class Settings {
  constructor(context) {
    this.context = context;
    this.themeManager = ThemeManager;
    this.currentView = 'appearance';
    this.container = null;
  }

  /**
   * Initialize the application
   */
  async init() {
    // Load custom themes
    this.themeManager.loadCustomThemes();
  }

  /**
   * Render the application
   * @returns {HTMLElement} Application container
   */
  async render() {
    this.container = document.createElement('div');
    this.container.className = 'settings-app';
    this.container.innerHTML = this.getHTML();

    this.attachEventListeners();
    this.updateView();

    return this.container;
  }

  /**
   * Get HTML template
   * @returns {string} HTML string
   */
  getHTML() {
    return `
      <div class="settings-layout">
        <!-- Sidebar -->
        <div class="settings-sidebar">
          <div class="settings-nav">
            <button class="settings-nav-item active" data-view="appearance">
              <span class="nav-icon">🎨</span>
              <span class="nav-label">Appearance</span>
            </button>
            <button class="settings-nav-item" data-view="system">
              <span class="nav-icon">⚙️</span>
              <span class="nav-label">System</span>
            </button>
            <button class="settings-nav-item" data-view="users">
              <span class="nav-icon">👥</span>
              <span class="nav-label">Users</span>
            </button>
            <button class="settings-nav-item" data-view="plugins">
              <span class="nav-icon">🔌</span>
              <span class="nav-label">Plugins</span>
            </button>
            <button class="settings-nav-item" data-view="about">
              <span class="nav-icon">ℹ️</span>
              <span class="nav-label">About</span>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="settings-content">
          <div class="settings-view" id="view-appearance">
            <!-- Appearance settings -->
          </div>

          <div class="settings-view" id="view-system" style="display: none;">
            <!-- System settings -->
          </div>

          <div class="settings-view" id="view-users" style="display: none;">
            <!-- User settings -->
          </div>

          <div class="settings-view" id="view-plugins" style="display: none;">
            <!-- Plugin settings -->
          </div>

          <div class="settings-view" id="view-about" style="display: none;">
            <!-- About -->
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Navigation
    this.container.querySelectorAll('.settings-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchView(btn.dataset.view);
      });
    });
  }

  /**
   * Switch view
   * @param {string} view - View name
   */
  switchView(view) {
    this.currentView = view;

    // Update navigation
    this.container.querySelectorAll('.settings-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Update content
    this.container.querySelectorAll('.settings-view').forEach(viewEl => {
      viewEl.style.display = viewEl.id === `view-${view}` ? 'block' : 'none';
    });

    this.updateView();
  }

  /**
   * Update current view content
   */
  updateView() {
    const viewEl = this.container.querySelector(`#view-${this.currentView}`);
    if (!viewEl) return;

    switch (this.currentView) {
      case 'appearance':
        this.renderAppearanceView(viewEl);
        break;
      case 'system':
        this.renderSystemView(viewEl);
        break;
      case 'users':
        this.renderUsersView(viewEl);
        break;
      case 'plugins':
        this.renderPluginsView(viewEl);
        break;
      case 'about':
        this.renderAboutView(viewEl);
        break;
    }
  }

  /**
   * Render appearance view
   * @param {HTMLElement} container - Container element
   */
  renderAppearanceView(container) {
    const currentTheme = this.themeManager.getCurrentTheme();
    const themes = this.themeManager.getAllThemes();

    container.innerHTML = `
      <div class="settings-section">
        <h2>Appearance</h2>

        <div class="settings-group">
          <h3>Theme</h3>
          <p class="settings-description">Choose your preferred color theme</p>

          <div class="theme-grid">
            ${themes.map(theme => `
              <div class="theme-card ${currentTheme?.id === theme.id ? 'active' : ''}"
                   data-theme-id="${theme.id}">
                <div class="theme-preview" style="background: ${theme.colors['bg-primary']}; border-color: ${theme.colors['accent-primary']}">
                  <div class="theme-preview-window" style="background: ${theme.colors['window-bg']}; border-color: ${theme.colors['border-primary']}">
                    <div class="theme-preview-accent" style="background: ${theme.colors['accent-primary']}"></div>
                  </div>
                </div>
                <div class="theme-info">
                  <div class="theme-name">${theme.name}</div>
                  <div class="theme-type">${theme.type}</div>
                </div>
                ${currentTheme?.id === theme.id ? '<div class="theme-active-badge">✓</div>' : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <div class="settings-group">
          <h3>Font Size</h3>
          <div class="settings-control">
            <input type="range" id="font-size-slider" min="12" max="20" value="14" />
            <span id="font-size-value">14px</span>
          </div>
        </div>

        <div class="settings-group">
          <h3>Animations</h3>
          <div class="settings-control">
            <label class="settings-checkbox">
              <input type="checkbox" id="animations-enabled" checked />
              <span>Enable animations and transitions</span>
            </label>
          </div>
        </div>
      </div>
    `;

    // Attach theme selection
    container.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        const themeId = card.dataset.themeId;
        this.themeManager.applyTheme(themeId);
        this.renderAppearanceView(container);
      });
    });

    // Font size slider
    const slider = container.querySelector('#font-size-slider');
    const valueDisplay = container.querySelector('#font-size-value');

    slider?.addEventListener('input', (e) => {
      const size = e.target.value;
      valueDisplay.textContent = `${size}px`;
      document.documentElement.style.setProperty('--base-font-size', `${size}px`);
    });
  }

  /**
   * Render system view
   * @param {HTMLElement} container - Container element
   */
  renderSystemView(container) {
    const kernel = this.context.process?.constructor?.constructor;
    const systemInfo = kernel?.getSystemInfo ? kernel.getSystemInfo() : {};

    container.innerHTML = `
      <div class="settings-section">
        <h2>System</h2>

        <div class="settings-group">
          <h3>System Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Platform:</span>
              <span class="info-value">${navigator.platform}</span>
            </div>
            <div class="info-item">
              <span class="info-label">User Agent:</span>
              <span class="info-value">${navigator.userAgent}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Language:</span>
              <span class="info-value">${navigator.language}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Online:</span>
              <span class="info-value">${navigator.onLine ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        <div class="settings-group">
          <h3>Storage</h3>
          <div class="settings-control">
            <button class="settings-btn settings-btn-danger" id="clear-storage-btn">
              Clear All Storage
            </button>
            <p class="settings-description">This will delete all data including files, settings, and cache</p>
          </div>
        </div>

        <div class="settings-group">
          <h3>Performance</h3>
          <div class="settings-control">
            <label class="settings-checkbox">
              <input type="checkbox" id="hardware-acceleration" checked />
              <span>Enable hardware acceleration</span>
            </label>
          </div>
        </div>

        <div class="settings-group">
          <h3>Developer Mode</h3>
          <div class="settings-control">
            <label class="settings-checkbox">
              <input type="checkbox" id="developer-mode" />
              <span>Enable developer mode</span>
            </label>
            <p class="settings-description">Shows additional debugging information</p>
          </div>
        </div>
      </div>
    `;

    // Clear storage
    container.querySelector('#clear-storage-btn')?.addEventListener('click', () => {
      if (confirm('Are you sure? This will delete all your data!')) {
        localStorage.clear();
        sessionStorage.clear();
        alert('Storage cleared! Page will reload.');
        location.reload();
      }
    });
  }

  /**
   * Render users view
   * @param {HTMLElement} container - Container element
   */
  renderUsersView(container) {
    container.innerHTML = `
      <div class="settings-section">
        <h2>Users & Accounts</h2>

        <div class="settings-group">
          <h3>Current User</h3>
          <div class="user-card">
            <div class="user-avatar">👤</div>
            <div class="user-info">
              <div class="user-name">Guest User</div>
              <div class="user-role">Standard User</div>
            </div>
          </div>
        </div>

        <div class="settings-group">
          <h3>User Management</h3>
          <p class="settings-description">Multi-user support coming soon!</p>
          <button class="settings-btn settings-btn-secondary" disabled>
            Add New User
          </button>
        </div>

        <div class="settings-group">
          <h3>Account Security</h3>
          <button class="settings-btn settings-btn-secondary" disabled>
            Change Password
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render plugins view
   * @param {HTMLElement} container - Container element
   */
  renderPluginsView(container) {
    container.innerHTML = `
      <div class="settings-section">
        <h2>Plugins & Extensions</h2>

        <div class="settings-group">
          <h3>Installed Plugins</h3>
          <p class="settings-description">No plugins installed yet</p>
        </div>

        <div class="settings-group">
          <h3>Plugin Marketplace</h3>
          <p class="settings-description">Plugin marketplace coming soon!</p>
          <button class="settings-btn settings-btn-secondary" disabled>
            Browse Plugins
          </button>
        </div>

        <div class="settings-group">
          <h3>Developer</h3>
          <button class="settings-btn settings-btn-secondary" disabled>
            Load Plugin from File
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render about view
   * @param {HTMLElement} container - Container element
   */
  renderAboutView(container) {
    container.innerHTML = `
      <div class="settings-section">
        <h2>About WebOS</h2>

        <div class="about-logo">
          <div class="logo-icon">🖥️</div>
          <h1>WebOS</h1>
          <p class="version">Version 2.0.0</p>
        </div>

        <div class="settings-group">
          <h3>System Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Build Date:</span>
              <span class="info-value">November 2025</span>
            </div>
            <div class="info-item">
              <span class="info-label">Phase:</span>
              <span class="info-value">Phase 5 - System Enhancements</span>
            </div>
            <div class="info-item">
              <span class="info-label">Features:</span>
              <span class="info-value">8 Applications</span>
            </div>
          </div>
        </div>

        <div class="settings-group">
          <h3>Features</h3>
          <ul class="feature-list">
            <li>✅ Virtual File System with OPFS</li>
            <li>✅ Professional Code Editor (Monaco)</li>
            <li>✅ Web Browser with Sandboxing</li>
            <li>✅ Package Manager (npm)</li>
            <li>✅ Theme System</li>
            <li>✅ Plugin Architecture</li>
            <li>✅ Multi-user Support</li>
            <li>✅ Advanced Permissions</li>
          </ul>
        </div>

        <div class="settings-group">
          <h3>Credits</h3>
          <p>WebOS - A browser-based operating system</p>
          <p>Built with modern web technologies</p>
        </div>

        <div class="settings-group">
          <h3>License</h3>
          <p>MIT License</p>
        </div>
      </div>
    `;
  }
}
