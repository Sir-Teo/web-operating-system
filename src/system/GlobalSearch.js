/**
 * GlobalSearch - Spotlight-like global search system
 * Searches across files, apps, settings, and more
 */
export class GlobalSearch {
  constructor(kernel) {
    this.kernel = kernel;
    this.isVisible = false;
    this.searchOverlay = null;
    this.searchInput = null;
    this.resultsContainer = null;
    this.selectedIndex = 0;
    this.results = [];

    this._init();
  }

  _init() {
    this._createSearchUI();
    this._setupKeyboardShortcuts();
  }

  /**
   * Create search overlay UI
   */
  _createSearchUI() {
    this.searchOverlay = document.createElement('div');
    this.searchOverlay.id = 'global-search-overlay';
    this.searchOverlay.className = 'global-search-overlay';
    this.searchOverlay.style.display = 'none';

    this.searchOverlay.innerHTML = `
      <div class="global-search-container">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-input" placeholder="Search apps, files, settings..." />
        </div>
        <div class="search-results"></div>
        <div class="search-footer">
          <span>↑↓ to navigate • Enter to open • Esc to close</span>
        </div>
      </div>
    `;

    document.body.appendChild(this.searchOverlay);

    this.searchInput = this.searchOverlay.querySelector('.search-input');
    this.resultsContainer = this.searchOverlay.querySelector('.search-results');

    // Setup event listeners
    this.searchInput.addEventListener('input', (e) => {
      this._performSearch(e.target.value);
    });

    this.searchInput.addEventListener('keydown', (e) => {
      this._handleKeyDown(e);
    });

    // Click outside to close
    this.searchOverlay.addEventListener('click', (e) => {
      if (e.target === this.searchOverlay) {
        this.hide();
      }
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  _setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Space or Cmd+Space to toggle search
      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault();
        this.toggle();
      }

      // Escape to close
      if (e.key === 'Escape' && this.isVisible) {
        e.preventDefault();
        this.hide();
      }
    });
  }

  /**
   * Perform search across different categories
   */
  async _performSearch(query) {
    if (!query || query.trim() === '') {
      this.results = [];
      this._renderResults();
      return;
    }

    query = query.toLowerCase().trim();
    this.results = [];

    // Search apps
    const apps = await this._searchApps(query);
    this.results.push(...apps);

    // Search files
    const files = await this._searchFiles(query);
    this.results.push(...files);

    // Search settings
    const settings = await this._searchSettings(query);
    this.results.push(...settings);

    // Search commands
    const commands = await this._searchCommands(query);
    this.results.push(...commands);

    this.selectedIndex = 0;
    this._renderResults();
  }

  /**
   * Search applications
   */
  async _searchApps(query) {
    const results = [];
    try {
      const { default: AppRegistry } = await import('../apps/AppRegistry.js');
      const apps = AppRegistry.listApps();

      apps.forEach(app => {
        if (app.name.toLowerCase().includes(query) ||
            (app.description && app.description.toLowerCase().includes(query))) {
          results.push({
            type: 'app',
            icon: app.icon || '📱',
            title: app.name,
            subtitle: app.description || 'Application',
            action: () => AppRegistry.launchApp(app.id)
          });
        }
      });
    } catch (error) {
      console.error('Error searching apps:', error);
    }

    return results;
  }

  /**
   * Search files
   */
  async _searchFiles(query) {
    const results = [];
    const maxResults = 10;

    try {
      // Search in home directory
      const files = await this._searchDirectory('/home', query, maxResults);
      files.forEach(filePath => {
        const fileName = filePath.split('/').pop();
        results.push({
          type: 'file',
          icon: '📄',
          title: fileName,
          subtitle: filePath,
          action: async () => {
            // Open file in appropriate app
            await this._openFile(filePath);
            this.hide();
          }
        });
      });
    } catch (error) {
      console.error('Error searching files:', error);
    }

    return results;
  }

  /**
   * Search directory recursively
   */
  async _searchDirectory(path, query, maxResults) {
    const results = [];

    try {
      const entries = await this.kernel.fs.readdir(path);

      for (const entry of entries) {
        if (results.length >= maxResults) break;

        const fullPath = `${path}/${entry.name}`;

        if (entry.name.toLowerCase().includes(query)) {
          results.push(fullPath);
        }

        // Recurse into directories (limited depth)
        if (entry.type === 'directory' && !entry.name.startsWith('.')) {
          const subResults = await this._searchDirectory(fullPath, query, maxResults - results.length);
          results.push(...subResults);
        }
      }
    } catch (error) {
      // Skip errors (permissions, etc.)
    }

    return results;
  }

  /**
   * Search settings
   */
  async _searchSettings(query) {
    const settings = [
      { name: 'Display Settings', keywords: ['display', 'screen', 'resolution', 'brightness'] },
      { name: 'Network Settings', keywords: ['network', 'wifi', 'internet', 'connection'] },
      { name: 'User Accounts', keywords: ['user', 'account', 'password', 'login'] },
      { name: 'System Monitor', keywords: ['monitor', 'performance', 'cpu', 'memory', 'ram'] },
      { name: 'File Manager', keywords: ['files', 'folders', 'explorer', 'browser'] },
      { name: 'Terminal', keywords: ['terminal', 'command', 'shell', 'cli'] },
      { name: 'Cloud Storage', keywords: ['cloud', 'sync', 'drive', 'dropbox', 'onedrive'] },
    ];

    const results = [];

    settings.forEach(setting => {
      const matches = setting.keywords.some(keyword => keyword.includes(query)) ||
                     setting.name.toLowerCase().includes(query);

      if (matches) {
        results.push({
          type: 'setting',
          icon: '⚙️',
          title: setting.name,
          subtitle: 'System Setting',
          action: async () => {
            // Launch corresponding app
            const { default: AppRegistry } = await import('../apps/AppRegistry.js');
            const appId = setting.name.toLowerCase().replace(/\s+/g, '-');
            try {
              await AppRegistry.launchApp(appId);
            } catch {
              console.warn(`App ${appId} not found`);
            }
            this.hide();
          }
        });
      }
    });

    return results;
  }

  /**
   * Search terminal commands
   */
  async _searchCommands(query) {
    const commonCommands = [
      { cmd: 'ls', desc: 'List directory contents' },
      { cmd: 'cd', desc: 'Change directory' },
      { cmd: 'pwd', desc: 'Print working directory' },
      { cmd: 'cat', desc: 'Display file contents' },
      { cmd: 'mkdir', desc: 'Create directory' },
      { cmd: 'rm', desc: 'Remove files' },
      { cmd: 'cp', desc: 'Copy files' },
      { cmd: 'mv', desc: 'Move files' },
      { cmd: 'ps', desc: 'List processes' },
      { cmd: 'kill', desc: 'Kill process' },
    ];

    const results = [];

    commonCommands.forEach(({ cmd, desc }) => {
      if (cmd.includes(query) || desc.toLowerCase().includes(query)) {
        results.push({
          type: 'command',
          icon: '💻',
          title: cmd,
          subtitle: desc,
          action: async () => {
            // Open terminal with command
            const { default: AppRegistry } = await import('../apps/AppRegistry.js');
            await AppRegistry.launchApp('terminal');
            this.hide();
          }
        });
      }
    });

    return results;
  }

  /**
   * Render search results
   */
  _renderResults() {
    if (this.results.length === 0) {
      this.resultsContainer.innerHTML = '<div class="no-results">No results found</div>';
      return;
    }

    const html = this.results.map((result, index) => {
      const selected = index === this.selectedIndex ? 'selected' : '';
      return `
        <div class="search-result ${selected}" data-index="${index}">
          <span class="result-icon">${result.icon}</span>
          <div class="result-content">
            <div class="result-title">${result.title}</div>
            <div class="result-subtitle">${result.subtitle}</div>
          </div>
          <span class="result-type">${result.type}</span>
        </div>
      `;
    }).join('');

    this.resultsContainer.innerHTML = html;

    // Add click handlers
    this.resultsContainer.querySelectorAll('.search-result').forEach(el => {
      el.addEventListener('click', () => {
        const index = parseInt(el.dataset.index);
        this._selectResult(index);
      });
    });
  }

  /**
   * Handle keyboard navigation
   */
  _handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = (this.selectedIndex + 1) % this.results.length;
        this._renderResults();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = (this.selectedIndex - 1 + this.results.length) % this.results.length;
        this._renderResults();
        break;

      case 'Enter':
        e.preventDefault();
        if (this.results.length > 0) {
          this._selectResult(this.selectedIndex);
        }
        break;
    }
  }

  /**
   * Select and execute a result
   */
  _selectResult(index) {
    const result = this.results[index];
    if (result && result.action) {
      result.action();
      this.hide();
    }
  }

  /**
   * Open a file in appropriate app
   */
  async _openFile(filePath) {
    const extension = filePath.split('.').pop().toLowerCase();
    const { default: AppRegistry } = await import('../apps/AppRegistry.js');

    // Map extensions to apps
    const appMap = {
      'txt': 'text-editor',
      'js': 'code-editor',
      'json': 'code-editor',
      'html': 'code-editor',
      'css': 'code-editor',
      'md': 'text-editor',
      'png': 'image-viewer',
      'jpg': 'image-viewer',
      'jpeg': 'image-viewer',
      'gif': 'image-viewer',
    };

    const appId = appMap[extension] || 'text-editor';

    try {
      await AppRegistry.launchApp(appId, { file: filePath });
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  }

  /**
   * Show search overlay
   */
  show() {
    this.isVisible = true;
    this.searchOverlay.style.display = 'flex';
    this.searchInput.value = '';
    this.searchInput.focus();
    this.results = [];
    this._renderResults();
  }

  /**
   * Hide search overlay
   */
  hide() {
    this.isVisible = false;
    this.searchOverlay.style.display = 'none';
    this.searchInput.value = '';
    this.results = [];
  }

  /**
   * Toggle search overlay
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
}

// Export singleton
let globalSearchInstance = null;

export function initGlobalSearch(kernel) {
  if (!globalSearchInstance) {
    globalSearchInstance = new GlobalSearch(kernel);
  }
  return globalSearchInstance;
}

export function getGlobalSearch() {
  return globalSearchInstance;
}
