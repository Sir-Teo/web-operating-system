/**
 * History Manager for Browser
 * Manages browsing history
 */
export class HistoryManager {
  constructor() {
    this.history = this.loadHistory();
    this.maxEntries = 1000;
  }

  /**
   * Load history from localStorage
   * @returns {Array} History entries
   */
  loadHistory() {
    try {
      const saved = localStorage.getItem('browser-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save history to localStorage
   */
  saveHistory() {
    try {
      // Keep only recent entries
      const recentHistory = this.history.slice(-this.maxEntries);
      localStorage.setItem('browser-history', JSON.stringify(recentHistory));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  }

  /**
   * Add entry to history
   * @param {Object} entry - {url, title, icon}
   */
  addEntry(entry) {
    // Don't add about: pages
    if (entry.url.startsWith('about:')) {
      return;
    }

    // Check if last entry is the same
    const lastEntry = this.history[this.history.length - 1];
    if (lastEntry && lastEntry.url === entry.url) {
      // Update visit time
      lastEntry.visitedAt = new Date().toISOString();
      lastEntry.visitCount++;
      this.saveHistory();
      return;
    }

    // Add new entry
    const historyEntry = {
      id: Date.now(),
      url: entry.url,
      title: entry.title || entry.url,
      icon: entry.icon || '🌐',
      visitedAt: new Date().toISOString(),
      visitCount: 1
    };

    this.history.push(historyEntry);

    // Trim history if too large
    if (this.history.length > this.maxEntries) {
      this.history = this.history.slice(-this.maxEntries);
    }

    this.saveHistory();
  }

  /**
   * Get all history
   * @param {number} limit - Max entries to return
   * @returns {Array} History entries (newest first)
   */
  getHistory(limit = 100) {
    return this.history.slice(-limit).reverse();
  }

  /**
   * Get history for today
   * @returns {Array} Today's history
   */
  getTodayHistory() {
    const today = new Date().toDateString();
    return this.history
      .filter(entry => new Date(entry.visitedAt).toDateString() === today)
      .reverse();
  }

  /**
   * Search history
   * @param {string} query - Search query
   * @param {number} limit - Max results to return
   * @returns {Array} Matching entries
   */
  search(query, limit = 100) {
    const lowerQuery = query.toLowerCase();
    return this.history
      .filter(entry =>
        entry.title.toLowerCase().includes(lowerQuery) ||
        entry.url.toLowerCase().includes(lowerQuery)
      )
      .reverse()
      .slice(0, limit);
  }

  /**
   * Get most visited sites
   * @param {number} limit - Number of sites to return
   * @returns {Array} Most visited sites
   */
  getMostVisited(limit = 10) {
    // Count visits per URL
    const urlCounts = {};
    this.history.forEach(entry => {
      if (!urlCounts[entry.url]) {
        urlCounts[entry.url] = {
          ...entry,
          totalVisits: 0
        };
      }
      urlCounts[entry.url].totalVisits += entry.visitCount;
    });

    // Sort by visit count
    return Object.values(urlCounts)
      .sort((a, b) => b.totalVisits - a.totalVisits)
      .slice(0, limit);
  }

  /**
   * Delete entry
   * @param {number} id - Entry ID
   */
  deleteEntry(id) {
    this.history = this.history.filter(entry => entry.id !== id);
    this.saveHistory();
  }

  /**
   * Delete entries by URL
   * @param {string} url - URL to delete
   */
  deleteByUrl(url) {
    this.history = this.history.filter(entry => entry.url !== url);
    this.saveHistory();
  }

  /**
   * Clear all history
   */
  clearAll() {
    if (confirm('Clear all browsing history?')) {
      this.history = [];
      this.saveHistory();
    }
  }

  /**
   * Clear history for time range
   * @param {string} range - Range: 'hour', 'day', 'week', 'month'
   */
  clearRange(range) {
    const now = new Date();
    let cutoff;

    switch (range) {
      case 'hour':
        cutoff = new Date(now - 60 * 60 * 1000);
        break;
      case 'day':
        cutoff = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoff = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return;
    }

    this.history = this.history.filter(entry =>
      new Date(entry.visitedAt) < cutoff
    );

    this.saveHistory();
  }
}
