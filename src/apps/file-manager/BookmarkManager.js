/**
 * BookmarkManager.js
 *
 * Manages bookmarks for quick access to favorite directories.
 * Bookmarks are stored in localStorage.
 */

export class BookmarkManager {
  constructor() {
    this.bookmarks = this._loadBookmarks();
    this.onBookmarksChanged = null;
  }

  /**
   * Add a bookmark
   * @param {string} name - Bookmark name
   * @param {string} path - Directory path
   */
  addBookmark(name, path) {
    // Check if bookmark already exists
    const existing = this.bookmarks.find(b => b.path === path);
    if (existing) {
      throw new Error('Bookmark for this path already exists');
    }

    this.bookmarks.push({
      name,
      path,
      created: Date.now()
    });

    this._saveBookmarks();
    if (this.onBookmarksChanged) {
      this.onBookmarksChanged(this.bookmarks);
    }
  }

  /**
   * Remove a bookmark
   * @param {string} path - Directory path
   */
  removeBookmark(path) {
    const index = this.bookmarks.findIndex(b => b.path === path);
    if (index >= 0) {
      this.bookmarks.splice(index, 1);
      this._saveBookmarks();
      if (this.onBookmarksChanged) {
        this.onBookmarksChanged(this.bookmarks);
      }
    }
  }

  /**
   * Check if path is bookmarked
   * @param {string} path - Directory path
   * @returns {boolean}
   */
  isBookmarked(path) {
    return this.bookmarks.some(b => b.path === path);
  }

  /**
   * Get all bookmarks
   * @returns {Array}
   */
  getBookmarks() {
    return [...this.bookmarks];
  }

  /**
   * Get default bookmarks
   * @returns {Array}
   */
  getDefaultBookmarks() {
    return [
      { name: 'Home', path: '/home/user', icon: '🏠' },
      { name: 'Documents', path: '/home/user/Documents', icon: '📁' },
      { name: 'Downloads', path: '/home/user/Downloads', icon: '⬇️' },
      { name: 'Root', path: '/', icon: '💾' }
    ];
  }

  /**
   * Load bookmarks from localStorage
   * @private
   */
  _loadBookmarks() {
    try {
      const stored = localStorage.getItem('webos_bookmarks');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      return [];
    }
  }

  /**
   * Save bookmarks to localStorage
   * @private
   */
  _saveBookmarks() {
    try {
      localStorage.setItem('webos_bookmarks', JSON.stringify(this.bookmarks));
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
    }
  }

  /**
   * Render bookmarks sidebar
   * @param {Function} onNavigate - Callback when bookmark is clicked
   * @returns {HTMLElement}
   */
  renderSidebar(onNavigate) {
    const sidebar = document.createElement('div');
    sidebar.className = 'bookmarks-sidebar';
    sidebar.style.cssText = `
      width: 200px;
      background: #f8f8f8;
      border-right: 1px solid #ddd;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 10px;
      border-bottom: 1px solid #ddd;
      font-weight: bold;
      background: #fff;
    `;
    header.textContent = 'Bookmarks';

    // Default bookmarks
    const defaultSection = document.createElement('div');
    defaultSection.style.cssText = 'padding: 5px 0;';

    const defaultHeader = document.createElement('div');
    defaultHeader.style.cssText = 'padding: 8px 10px; font-size: 0.85em; color: #666; font-weight: bold;';
    defaultHeader.textContent = 'QUICK ACCESS';
    defaultSection.appendChild(defaultHeader);

    this.getDefaultBookmarks().forEach(bookmark => {
      const item = this._createBookmarkItem(bookmark, onNavigate, false);
      defaultSection.appendChild(item);
    });

    // Custom bookmarks
    const customSection = document.createElement('div');
    customSection.style.cssText = 'padding: 5px 0; flex: 1;';

    const customHeader = document.createElement('div');
    customHeader.style.cssText = 'padding: 8px 10px; font-size: 0.85em; color: #666; font-weight: bold;';
    customHeader.textContent = 'MY BOOKMARKS';
    customSection.appendChild(customHeader);

    if (this.bookmarks.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding: 10px; text-align: center; color: #999; font-size: 0.85em;';
      empty.textContent = 'No custom bookmarks';
      customSection.appendChild(empty);
    } else {
      this.bookmarks.forEach(bookmark => {
        const item = this._createBookmarkItem(bookmark, onNavigate, true);
        customSection.appendChild(item);
      });
    }

    sidebar.appendChild(header);
    sidebar.appendChild(defaultSection);
    sidebar.appendChild(customSection);

    return sidebar;
  }

  _createBookmarkItem(bookmark, onNavigate, canRemove) {
    const item = document.createElement('div');
    item.className = 'bookmark-item';
    item.style.cssText = `
      padding: 8px 10px;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    item.addEventListener('mouseenter', () => {
      item.style.background = '#e0e0e0';
    });

    item.addEventListener('mouseleave', () => {
      item.style.background = 'transparent';
    });

    item.addEventListener('click', () => {
      if (onNavigate) {
        onNavigate(bookmark.path);
      }
    });

    const icon = document.createElement('span');
    icon.textContent = bookmark.icon || '📌';

    const name = document.createElement('span');
    name.textContent = bookmark.name;
    name.style.cssText = 'flex: 1; font-size: 0.9em;';

    item.appendChild(icon);
    item.appendChild(name);

    if (canRemove) {
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.title = 'Remove bookmark';
      removeBtn.style.cssText = `
        background: none;
        border: none;
        color: #999;
        cursor: pointer;
        font-size: 1.2em;
        padding: 0;
        width: 20px;
        height: 20px;
        display: none;
      `;

      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Remove bookmark "${bookmark.name}"?`)) {
          this.removeBookmark(bookmark.path);
          item.remove();
        }
      });

      item.addEventListener('mouseenter', () => {
        removeBtn.style.display = 'block';
      });

      item.addEventListener('mouseleave', () => {
        removeBtn.style.display = 'none';
      });

      item.appendChild(removeBtn);
    }

    return item;
  }
}
