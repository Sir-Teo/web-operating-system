/**
 * Browser Tab Manager
 * Manages browser tabs with history, pinning, and grouping
 */
export class BrowserTabManager {
  constructor() {
    this.tabs = [];
    this.activeTab = null;
    this.nextId = 1;
    this.changeListeners = [];
    this.tabGroups = new Map(); // groupId -> {name, color}
    this.nextGroupId = 1;
  }

  /**
   * Create a new tab
   * @param {string} url - Initial URL
   * @param {Object} options - Tab options {pinned, groupId, incognito}
   * @returns {Object} Created tab
   */
  createTab(url = 'about:blank', options = {}) {
    const tab = {
      id: this.nextId++,
      url,
      title: 'New Tab',
      icon: '🌐',
      loading: false,
      canGoBack: false,
      canGoForward: false,
      history: [url],
      historyIndex: 0,
      pinned: options.pinned || false,
      groupId: options.groupId || null,
      incognito: options.incognito || false,
      createdAt: Date.now()
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

  /**
   * Pin/unpin tab
   * @param {number} tabId - Tab ID
   */
  togglePin(tabId) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab) return;

    tab.pinned = !tab.pinned;

    // Move pinned tabs to the front
    if (tab.pinned) {
      const index = this.tabs.findIndex(t => t.id === tabId);
      this.tabs.splice(index, 1);
      const lastPinnedIndex = this.tabs.findIndex(t => !t.pinned);
      this.tabs.splice(lastPinnedIndex === -1 ? this.tabs.length : lastPinnedIndex, 0, tab);
    }

    this.notifyChange();
  }

  /**
   * Duplicate tab
   * @param {number} tabId - Tab ID
   * @returns {Object} Duplicated tab
   */
  duplicateTab(tabId) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab) return null;

    return this.createTab(tab.url, {
      pinned: false,
      groupId: tab.groupId,
      incognito: tab.incognito
    });
  }

  /**
   * Create tab group
   * @param {string} name - Group name
   * @param {string} color - Group color
   * @returns {number} Group ID
   */
  createGroup(name, color) {
    const groupId = this.nextGroupId++;
    this.tabGroups.set(groupId, { name, color });
    this.notifyChange();
    return groupId;
  }

  /**
   * Add tab to group
   * @param {number} tabId - Tab ID
   * @param {number} groupId - Group ID
   */
  addToGroup(tabId, groupId) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab) {
      tab.groupId = groupId;
      this.notifyChange();
    }
  }

  /**
   * Remove tab from group
   * @param {number} tabId - Tab ID
   */
  removeFromGroup(tabId) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab) {
      tab.groupId = null;
      this.notifyChange();
    }
  }

  /**
   * Get group info
   * @param {number} groupId - Group ID
   * @returns {Object} Group info
   */
  getGroup(groupId) {
    return this.tabGroups.get(groupId);
  }

  /**
   * Get tabs by group
   * @param {number} groupId - Group ID
   * @returns {Array} Tabs in group
   */
  getTabsByGroup(groupId) {
    return this.tabs.filter(t => t.groupId === groupId);
  }

  /**
   * Mute/unmute tab
   * @param {number} tabId - Tab ID
   */
  toggleMute(tabId) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab) {
      tab.muted = !tab.muted;
      this.notifyChange();
    }
  }
}
