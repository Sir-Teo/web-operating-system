/**
 * Quick Open
 * Fuzzy file search for quickly opening files
 */
export class QuickOpen {
  constructor(vfs, openFileCallback) {
    this.vfs = vfs;
    this.openFileCallback = openFileCallback;
    this.container = null;
    this.input = null;
    this.resultsList = null;
    this.visible = false;
    this.allFiles = [];
    this.filteredFiles = [];
    this.selectedIndex = 0;
    this.recentFiles = this.loadRecentFiles();
  }

  /**
   * Initialize Quick Open
   */
  async initialize(parent) {
    this.container = document.createElement('div');
    this.container.className = 'quick-open';
    this.container.style.display = 'none';

    this.container.innerHTML = `
      <div class="quick-open-overlay"></div>
      <div class="quick-open-content">
        <div class="quick-open-input-container">
          <span class="quick-open-icon">📁</span>
          <input
            type="text"
            class="quick-open-input"
            placeholder="Search files by name..."
            autocomplete="off"
            spellcheck="false"
          />
        </div>
        <div class="quick-open-results"></div>
      </div>
    `;

    parent.appendChild(this.container);

    this.input = this.container.querySelector('.quick-open-input');
    this.resultsList = this.container.querySelector('.quick-open-results');

    this.setupEventListeners();
    this.applyStyles();

    // Index files
    await this.indexFiles();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.input.addEventListener('input', () => {
      this.filterFiles();
    });

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectPrevious();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.openSelected();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.hide();
      }
    });

    this.container.querySelector('.quick-open-overlay')?.addEventListener('click', () => {
      this.hide();
    });
  }

  /**
   * Index all files in the file system
   */
  async indexFiles() {
    this.allFiles = [];
    await this.indexDirectory('/home');
  }

  /**
   * Recursively index a directory
   */
  async indexDirectory(path) {
    try {
      const entries = await this.vfs.readdir(path);

      for (const entry of entries) {
        const fullPath = `${path}/${entry.name}`;

        if (entry.isDirectory) {
          await this.indexDirectory(fullPath);
        } else {
          // Skip hidden files and certain extensions
          if (!entry.name.startsWith('.')) {
            this.allFiles.push({
              name: entry.name,
              path: fullPath,
              dir: path,
              size: entry.size || 0,
              modified: entry.mtime || Date.now()
            });
          }
        }
      }
    } catch (error) {
      // Silently handle errors (directory may not exist or be accessible)
    }
  }

  /**
   * Filter files based on fuzzy search
   */
  filterFiles() {
    const query = this.input.value.toLowerCase().trim();

    if (!query) {
      // Show recent files when no query
      this.filteredFiles = this.recentFiles
        .map(path => this.allFiles.find(f => f.path === path))
        .filter(Boolean)
        .slice(0, 10);
    } else {
      // Fuzzy search scoring
      this.filteredFiles = this.allFiles
        .map(file => ({
          file,
          score: this.fuzzyScore(file.name.toLowerCase(), query)
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 50)
        .map(item => item.file);
    }

    this.selectedIndex = 0;
    this.renderResults();
  }

  /**
   * Fuzzy matching score
   */
  fuzzyScore(text, query) {
    let score = 0;
    let queryIndex = 0;
    let consecutiveMatch = 0;

    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
      if (text[i] === query[queryIndex]) {
        score += 1 + consecutiveMatch * 5; // Bonus for consecutive matches
        consecutiveMatch++;
        queryIndex++;

        // Bonus for match at start
        if (i === 0) score += 10;

        // Bonus for match after separator
        if (i > 0 && (text[i - 1] === '/' || text[i - 1] === '.' || text[i - 1] === '-')) {
          score += 5;
        }
      } else {
        consecutiveMatch = 0;
      }
    }

    // Full match required
    if (queryIndex !== query.length) return 0;

    // Penalize longer filenames
    score -= text.length * 0.1;

    return score;
  }

  /**
   * Render filtered results
   */
  renderResults() {
    const query = this.input.value.trim();
    const isRecent = !query;

    if (this.filteredFiles.length === 0) {
      this.resultsList.innerHTML = `
        <div class="quick-open-empty">
          ${isRecent ? 'No recent files' : 'No files found'}
        </div>
      `;
      return;
    }

    const headerText = isRecent ? 'Recent Files' : `${this.filteredFiles.length} file${this.filteredFiles.length > 1 ? 's' : ''} found`;

    this.resultsList.innerHTML = `
      <div class="quick-open-header">${headerText}</div>
      ${this.filteredFiles.map((file, index) => `
        <div class="quick-open-item ${index === this.selectedIndex ? 'selected' : ''}"
             data-index="${index}">
          <div class="quick-open-item-icon">${this.getFileIcon(file.name)}</div>
          <div class="quick-open-item-info">
            <div class="quick-open-item-name">${this.highlightMatch(file.name, query)}</div>
            <div class="quick-open-item-path">${file.dir}</div>
          </div>
          <div class="quick-open-item-meta">
            ${this.formatSize(file.size)}
          </div>
        </div>
      `).join('')}
    `;

    // Add click handlers
    this.resultsList.querySelectorAll('.quick-open-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        this.selectedIndex = index;
        this.openSelected();
      });
    });
  }

  /**
   * Get file icon based on extension
   */
  getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
      js: '📜',
      ts: '📘',
      jsx: '⚛️',
      tsx: '⚛️',
      json: '📋',
      html: '🌐',
      css: '🎨',
      scss: '🎨',
      md: '📝',
      txt: '📄',
      py: '🐍',
      java: '☕',
      cpp: '⚙️',
      c: '⚙️',
      go: '🔵',
      rs: '🦀',
      php: '🐘',
      rb: '💎',
      swift: '🐦',
      kt: '🎯',
      xml: '📰',
      yaml: '📰',
      yml: '📰',
      svg: '🖼️',
      png: '🖼️',
      jpg: '🖼️',
      jpeg: '🖼️',
      gif: '🖼️',
      pdf: '📕',
      zip: '📦',
      tar: '📦',
      gz: '📦'
    };
    return iconMap[ext] || '📄';
  }

  /**
   * Highlight matching characters
   */
  highlightMatch(text, query) {
    if (!query) return text;

    let result = '';
    let queryIndex = 0;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    for (let i = 0; i < text.length; i++) {
      if (queryIndex < lowerQuery.length && lowerText[i] === lowerQuery[queryIndex]) {
        result += `<mark>${text[i]}</mark>`;
        queryIndex++;
      } else {
        result += text[i];
      }
    }

    return result;
  }

  /**
   * Format file size
   */
  formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Select next file
   */
  selectNext() {
    if (this.selectedIndex < this.filteredFiles.length - 1) {
      this.selectedIndex++;
      this.renderResults();
    }
  }

  /**
   * Select previous file
   */
  selectPrevious() {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this.renderResults();
    }
  }

  /**
   * Open selected file
   */
  openSelected() {
    const file = this.filteredFiles[this.selectedIndex];
    if (file) {
      this.addToRecentFiles(file.path);
      this.openFileCallback(file);
      this.hide();
    }
  }

  /**
   * Load recent files from localStorage
   */
  loadRecentFiles() {
    try {
      const stored = localStorage.getItem('webos-code-editor-recent-files');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Save recent files to localStorage
   */
  saveRecentFiles() {
    try {
      localStorage.setItem('webos-code-editor-recent-files', JSON.stringify(this.recentFiles));
    } catch (e) {
      // Ignore errors
    }
  }

  /**
   * Add file to recent files list
   */
  addToRecentFiles(path) {
    // Remove if already exists
    this.recentFiles = this.recentFiles.filter(p => p !== path);

    // Add to front
    this.recentFiles.unshift(path);

    // Keep only last 20
    this.recentFiles = this.recentFiles.slice(0, 20);

    this.saveRecentFiles();
  }

  /**
   * Show Quick Open
   */
  async show() {
    // Re-index files
    await this.indexFiles();

    this.visible = true;
    this.container.style.display = 'flex';
    this.input.value = '';
    this.filterFiles();
    setTimeout(() => this.input.focus(), 50);
  }

  /**
   * Hide Quick Open
   */
  hide() {
    this.visible = false;
    this.container.style.display = 'none';
  }

  /**
   * Toggle Quick Open
   */
  async toggle() {
    if (this.visible) {
      this.hide();
    } else {
      await this.show();
    }
  }

  /**
   * Apply styles
   */
  applyStyles() {
    const styleId = 'quick-open-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .quick-open {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 80px;
      }

      .quick-open-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
      }

      .quick-open-content {
        position: relative;
        width: 700px;
        max-width: 90%;
        background: #2d2d30;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        overflow: hidden;
      }

      .quick-open-input-container {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #3e3e42;
        background: #2d2d30;
      }

      .quick-open-icon {
        font-size: 1.2rem;
        margin-right: 10px;
      }

      .quick-open-input {
        flex: 1;
        background: none;
        border: none;
        outline: none;
        color: #cccccc;
        font-size: 1rem;
        font-family: system-ui, -apple-system, sans-serif;
      }

      .quick-open-input::placeholder {
        color: #858585;
      }

      .quick-open-results {
        max-height: 450px;
        overflow-y: auto;
        background: #252526;
      }

      .quick-open-header {
        padding: 8px 16px;
        font-size: 0.85rem;
        color: #858585;
        background: #1e1e1e;
        border-bottom: 1px solid #3e3e42;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .quick-open-item {
        display: flex;
        align-items: center;
        padding: 10px 16px;
        cursor: pointer;
        transition: background 0.1s;
        border-bottom: 1px solid #1e1e1e;
      }

      .quick-open-item:hover,
      .quick-open-item.selected {
        background: #094771;
      }

      .quick-open-item-icon {
        font-size: 1.3rem;
        margin-right: 12px;
        opacity: 0.9;
      }

      .quick-open-item-info {
        flex: 1;
        min-width: 0;
      }

      .quick-open-item-name {
        color: #cccccc;
        font-size: 0.95rem;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .quick-open-item-name mark {
        background: #ffd700;
        color: #000;
        padding: 0 2px;
        border-radius: 2px;
      }

      .quick-open-item-path {
        color: #858585;
        font-size: 0.8rem;
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .quick-open-item-meta {
        color: #858585;
        font-size: 0.8rem;
        font-family: monospace;
        margin-left: 12px;
        white-space: nowrap;
      }

      .quick-open-empty {
        padding: 40px 20px;
        text-align: center;
        color: #858585;
        font-size: 0.95rem;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Destroy Quick Open
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
