/**
 * Browser Tab Manager
 * Manages browser tabs with history
 */
export class BrowserTabManager {
  constructor() {
    this.tabs = [];
    this.activeTab = null;
    this.nextId = 1;
    this.changeListeners = [];
  }

  /**
   * Create a new tab
   * @param {string} url - Initial URL
   * @returns {Object} Created tab
   */
  createTab(url = 'about:blank') {
    const tab = {
      id: this.nextId++,
      url,
      title: 'New Tab',
      icon: '🌐',
      loading: false,
      canGoBack: false,
      canGoForward: false,
      history: [url],
      historyIndex: 0
    };

    this.tabs.push(tab);
    this.setActiveTab(tab.id);
    this.notifyChange();

    return tab;
  }

  /**
   * Close a tab
   * @param {number} tabId - Tab ID
   */
  closeTab(tabId) {
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
  }

  /**
   * Set active tab
   * @param {number} tabId - Tab ID
   */
  setActiveTab(tabId) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab) {
      this.activeTab = tab;
      this.notifyChange();
    }
  }

  /**
   * Navigate to URL in tab
   * @param {number} tabId - Tab ID
   * @param {string} url - URL to navigate to
   */
  navigate(tabId, url) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab) return;

    // Add to history
    tab.history = tab.history.slice(0, tab.historyIndex + 1);
    tab.history.push(url);
    tab.historyIndex = tab.history.length - 1;

    tab.url = url;
    tab.loading = true;
    this.updateNavigationState(tab);
    this.notifyChange();
  }

  /**
   * Go back in tab history
   * @param {number} tabId - Tab ID
   */
  goBack(tabId) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab || !tab.canGoBack) return;

    tab.historyIndex--;
    tab.url = tab.history[tab.historyIndex];
    tab.loading = true;
    this.updateNavigationState(tab);
    this.notifyChange();
  }

  /**
   * Go forward in tab history
   * @param {number} tabId - Tab ID
   */
  goForward(tabId) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab || !tab.canGoForward) return;

    tab.historyIndex++;
    tab.url = tab.history[tab.historyIndex];
    tab.loading = true;
    this.updateNavigationState(tab);
    this.notifyChange();
  }

  /**
   * Reload tab
   * @param {number} tabId - Tab ID
   */
  reload(tabId) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab) return;

    tab.loading = true;
    this.notifyChange();
  }

  /**
   * Update tab info
   * @param {number} tabId - Tab ID
   * @param {Object} info - Tab info {title, icon, loading}
   */
  updateTabInfo(tabId, info) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab) return;

    if (info.title !== undefined) tab.title = info.title;
    if (info.icon !== undefined) tab.icon = info.icon;
    if (info.loading !== undefined) tab.loading = info.loading;

    this.notifyChange();
  }

  /**
   * Update navigation state
   * @param {Object} tab - Tab object
   */
  updateNavigationState(tab) {
    tab.canGoBack = tab.historyIndex > 0;
    tab.canGoForward = tab.historyIndex < tab.history.length - 1;
  }

  /**
   * Get all tabs
   * @returns {Array} All tabs
   */
  getAllTabs() {
    return this.tabs;
  }

  /**
   * Get active tab
   * @returns {Object} Active tab
   */
  getActiveTab() {
    return this.activeTab;
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
}
