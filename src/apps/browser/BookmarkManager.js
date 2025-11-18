/**
 * Bookmark Manager for Browser
 * Manages browser bookmarks with folders
 */
export class BookmarkManager {
  constructor() {
    this.bookmarks = this.loadBookmarks();
  }

  /**
   * Load bookmarks from localStorage
   * @returns {Array} Bookmarks
   */
  loadBookmarks() {
    try {
      const saved = localStorage.getItem('browser-bookmarks');
      return saved ? JSON.parse(saved) : this.getDefaultBookmarks();
    } catch {
      return this.getDefaultBookmarks();
    }
  }

  /**
   * Get default bookmarks
   * @returns {Array} Default bookmarks
   */
  getDefaultBookmarks() {
    return [
      {
        id: 1,
        title: 'GitHub',
        url: 'https://github.com',
        icon: '🐙',
        folder: 'Quick Links'
      },
      {
        id: 2,
        title: 'MDN Web Docs',
        url: 'https://developer.mozilla.org',
        icon: '📘',
        folder: 'Development'
      },
      {
        id: 3,
        title: 'Stack Overflow',
        url: 'https://stackoverflow.com',
        icon: '💬',
        folder: 'Development'
      },
      {
        id: 4,
        title: 'npm',
        url: 'https://www.npmjs.com',
        icon: '📦',
        folder: 'Development'
      }
    ];
  }

  /**
   * Save bookmarks to localStorage
   */
  saveBookmarks() {
    try {
      localStorage.setItem('browser-bookmarks', JSON.stringify(this.bookmarks));
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  }

  /**
   * Add bookmark
   * @param {Object} bookmark - Bookmark {title, url, icon, folder}
   */
  addBookmark(bookmark) {
    const newBookmark = {
      id: Date.now(),
      title: bookmark.title || 'Untitled',
      url: bookmark.url,
      icon: bookmark.icon || '🔖',
      folder: bookmark.folder || 'Unsorted',
      created: new Date().toISOString()
    };

    this.bookmarks.push(newBookmark);
    this.saveBookmarks();

    return newBookmark;
  }

  /**
   * Remove bookmark
   * @param {number} id - Bookmark ID
   */
  removeBookmark(id) {
    this.bookmarks = this.bookmarks.filter(b => b.id !== id);
    this.saveBookmarks();
  }

  /**
   * Update bookmark
   * @param {number} id - Bookmark ID
   * @param {Object} updates - Updates {title, url, icon, folder}
   */
  updateBookmark(id, updates) {
    const bookmark = this.bookmarks.find(b => b.id === id);
    if (bookmark) {
      Object.assign(bookmark, updates);
      this.saveBookmarks();
    }
  }

  /**
   * Get all bookmarks
   * @returns {Array} All bookmarks
   */
  getAllBookmarks() {
    return this.bookmarks;
  }

  /**
   * Get bookmarks by folder
   * @param {string} folder - Folder name
   * @returns {Array} Bookmarks in folder
   */
  getBookmarksByFolder(folder) {
    return this.bookmarks.filter(b => b.folder === folder);
  }

  /**
   * Get all folders
   * @returns {Array} Unique folder names
   */
  getAllFolders() {
    const folders = [...new Set(this.bookmarks.map(b => b.folder))];
    return folders.sort();
  }

  /**
   * Check if URL is bookmarked
   * @param {string} url - URL to check
   * @returns {boolean} True if bookmarked
   */
  isBookmarked(url) {
    return this.bookmarks.some(b => b.url === url);
  }

  /**
   * Find bookmark by URL
   * @param {string} url - URL
   * @returns {Object|null} Bookmark or null
   */
  findByUrl(url) {
    return this.bookmarks.find(b => b.url === url) || null;
  }

  /**
   * Search bookmarks
   * @param {string} query - Search query
   * @returns {Array} Matching bookmarks
   */
  search(query) {
    const lowerQuery = query.toLowerCase();
    return this.bookmarks.filter(b =>
      b.title.toLowerCase().includes(lowerQuery) ||
      b.url.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Import bookmarks
   * @param {Array} bookmarks - Bookmarks to import
   */
  importBookmarks(bookmarks) {
    bookmarks.forEach(bookmark => {
      this.addBookmark(bookmark);
    });
  }

  /**
   * Export bookmarks
   * @returns {string} JSON string of bookmarks
   */
  exportBookmarks() {
    return JSON.stringify(this.bookmarks, null, 2);
  }
}
