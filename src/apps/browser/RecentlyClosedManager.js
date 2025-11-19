/**
 * Recently Closed Tabs Manager
 * Tracks recently closed tabs for restoration
 */
export class RecentlyClosedManager {
  constructor() {
    this.closedTabs = [];
    this.maxHistory = 10;
  }

  /**
   * Add closed tab
   * @param {Object} tab - Tab object
   */
  addClosedTab(tab) {
    const closedTab = {
      ...tab,
      closedAt: Date.now()
    };

    this.closedTabs.unshift(closedTab);

    // Keep only last N tabs
    if (this.closedTabs.length > this.maxHistory) {
      this.closedTabs = this.closedTabs.slice(0, this.maxHistory);
    }
  }

  /**
   * Get recently closed tabs
   * @param {number} limit - Max number to return
   * @returns {Array} Recently closed tabs
   */
  getRecentlyClosed(limit = 10) {
    return this.closedTabs.slice(0, limit);
  }

  /**
   * Clear history
   */
  clearAll() {
    this.closedTabs = [];
  }

  /**
   * Remove specific entry
   * @param {number} index - Index to remove
   */
  removeEntry(index) {
    if (index >= 0 && index < this.closedTabs.length) {
      this.closedTabs.splice(index, 1);
    }
  }
}
