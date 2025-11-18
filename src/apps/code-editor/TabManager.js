/**
 * Tab Manager for Code Editor
 * Manages multiple open file tabs
 */
export class TabManager {
  constructor(languageDetector) {
    this.languageDetector = languageDetector;
    this.tabs = [];
    this.activeTab = null;
    this.nextId = 1;
    this.changeListeners = [];
  }

  /**
   * Open a new tab
   * @param {Object} file - File object with path, name, content
   * @returns {Object} The created tab
   */
  openTab(file) {
    // Check if tab already exists
    const existing = this.tabs.find(t => t.path === file.path);
    if (existing) {
      this.setActiveTab(existing.id);
      return existing;
    }

    // Create new tab
    const tab = {
      id: this.nextId++,
      path: file.path,
      name: file.name || this.getFilenameFromPath(file.path),
      content: file.content || '',
      originalContent: file.content || '',
      modified: false,
      language: this.languageDetector.detectFromFilename(file.name || file.path),
      savedCursorPosition: null,
      savedViewState: null
    };

    // Detect language from content if not found by filename
    if (tab.language === 'plaintext' && tab.content) {
      const detectedLang = this.languageDetector.detectFromContent(tab.content);
      if (detectedLang) {
        tab.language = detectedLang;
      }
    }

    this.tabs.push(tab);
    this.setActiveTab(tab.id);
    this.notifyChange();

    return tab;
  }

  /**
   * Close a tab
   * @param {number} tabId - Tab ID
   * @returns {boolean} True if closed, false if cancelled
   */
  closeTab(tabId) {
    const tab = this.getTab(tabId);
    if (!tab) return true;

    // Check if modified
    if (tab.modified) {
      const confirmed = confirm(`${tab.name} has unsaved changes. Close anyway?`);
      if (!confirmed) return false;
    }

    // Remove tab
    const index = this.tabs.findIndex(t => t.id === tabId);
    if (index >= 0) {
      this.tabs.splice(index, 1);

      // Update active tab
      if (this.activeTab?.id === tabId) {
        if (this.tabs.length > 0) {
          const newIndex = Math.min(index, this.tabs.length - 1);
          this.activeTab = this.tabs[newIndex];
        } else {
          this.activeTab = null;
        }
      }

      this.notifyChange();
    }

    return true;
  }

  /**
   * Close all tabs
   * @returns {boolean} True if all closed, false if cancelled
   */
  closeAllTabs() {
    const modifiedTabs = this.tabs.filter(t => t.modified);
    if (modifiedTabs.length > 0) {
      const names = modifiedTabs.map(t => t.name).join(', ');
      const confirmed = confirm(`${modifiedTabs.length} file(s) have unsaved changes: ${names}. Close anyway?`);
      if (!confirmed) return false;
    }

    this.tabs = [];
    this.activeTab = null;
    this.notifyChange();
    return true;
  }

  /**
   * Close other tabs
   * @param {number} tabId - Tab ID to keep
   * @returns {boolean} True if closed, false if cancelled
   */
  closeOtherTabs(tabId) {
    const modifiedTabs = this.tabs.filter(t => t.id !== tabId && t.modified);
    if (modifiedTabs.length > 0) {
      const names = modifiedTabs.map(t => t.name).join(', ');
      const confirmed = confirm(`${modifiedTabs.length} file(s) have unsaved changes: ${names}. Close anyway?`);
      if (!confirmed) return false;
    }

    const keepTab = this.getTab(tabId);
    if (keepTab) {
      this.tabs = [keepTab];
      this.activeTab = keepTab;
      this.notifyChange();
    }

    return true;
  }

  /**
   * Set active tab
   * @param {number} tabId - Tab ID
   */
  setActiveTab(tabId) {
    const tab = this.getTab(tabId);
    if (tab) {
      this.activeTab = tab;
      this.notifyChange();
    }
  }

  /**
   * Get tab by ID
   * @param {number} tabId - Tab ID
   * @returns {Object|null} Tab object or null
   */
  getTab(tabId) {
    return this.tabs.find(t => t.id === tabId) || null;
  }

  /**
   * Update tab content
   * @param {number} tabId - Tab ID
   * @param {string} content - New content
   */
  updateTabContent(tabId, content) {
    const tab = this.getTab(tabId);
    if (tab) {
      tab.content = content;
      tab.modified = (content !== tab.originalContent);
      this.notifyChange();
    }
  }

  /**
   * Mark tab as saved
   * @param {number} tabId - Tab ID
   */
  markTabAsSaved(tabId) {
    const tab = this.getTab(tabId);
    if (tab) {
      tab.originalContent = tab.content;
      tab.modified = false;
      this.notifyChange();
    }
  }

  /**
   * Save cursor position
   * @param {number} tabId - Tab ID
   * @param {Object} position - Cursor position
   */
  saveCursorPosition(tabId, position) {
    const tab = this.getTab(tabId);
    if (tab) {
      tab.savedCursorPosition = position;
    }
  }

  /**
   * Save view state
   * @param {number} tabId - Tab ID
   * @param {Object} viewState - View state
   */
  saveViewState(tabId, viewState) {
    const tab = this.getTab(tabId);
    if (tab) {
      tab.savedViewState = viewState;
    }
  }

  /**
   * Get all tabs
   * @returns {Array<Object>} Array of tabs
   */
  getAllTabs() {
    return this.tabs;
  }

  /**
   * Get active tab
   * @returns {Object|null} Active tab or null
   */
  getActiveTab() {
    return this.activeTab;
  }

  /**
   * Get filename from path
   * @param {string} path - File path
   * @returns {string} Filename
   */
  getFilenameFromPath(path) {
    const parts = path.split('/');
    return parts[parts.length - 1];
  }

  /**
   * Add change listener
   * @param {Function} callback - Callback function
   */
  onChange(callback) {
    this.changeListeners.push(callback);
  }

  /**
   * Notify change listeners
   */
  notifyChange() {
    this.changeListeners.forEach(callback => callback());
  }

  /**
   * Get modified tabs count
   * @returns {number} Count of modified tabs
   */
  getModifiedCount() {
    return this.tabs.filter(t => t.modified).length;
  }
}
