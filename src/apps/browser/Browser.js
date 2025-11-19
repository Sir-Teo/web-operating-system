/**
 * Web Browser Application
 * Basic browser with iframe sandbox, bookmarks, and history
 */
import { BrowserTabManager } from './BrowserTabManager.js';
import { BookmarkManager } from './BookmarkManager.js';
import { HistoryManager } from './HistoryManager.js';

export default class Browser {
  constructor(context) {
    this.context = context;
    this.tabManager = new BrowserTabManager();
    this.bookmarkManager = new BookmarkManager();
    this.historyManager = new HistoryManager();
    this.container = null;
    this.currentIframe = null;
    this._isUpdatingUI = false;
    this._currentLoadedUrl = null;
    this._currentLoadedTabId = null;
  }

  /**
   * Initialize the application
   */
  async init() {
    // Create initial tab
    this.tabManager.createTab('about:blank');

    // Setup tab change listener
    this.tabManager.onChange(() => {
      this.updateUI();
    });
  }

  /**
   * Render the application
   * @returns {HTMLElement} Application container
   */
  async render() {
    this.container = document.createElement('div');
    this.container.className = 'browser-app';
    this.container.innerHTML = this.getHTML();

    this.attachEventListeners();
    this.updateUI();

    return this.container;
  }

  /**
   * Get HTML template
   * @returns {string} HTML string
   */
  getHTML() {
    return `
      <div class="browser-layout">
        <!-- Tab bar -->
        <div class="browser-tabs" id="browser-tabs"></div>

        <!-- Navigation bar -->
        <div class="browser-navbar">
          <button class="nav-btn" id="back-btn" title="Back">←</button>
          <button class="nav-btn" id="forward-btn" title="Forward">→</button>
          <button class="nav-btn" id="reload-btn" title="Reload">⟳</button>
          <button class="nav-btn" id="home-btn" title="Home">🏠</button>
          <input type="text" id="url-input" class="url-input" placeholder="Enter URL or search..." />
          <button class="nav-btn" id="go-btn" title="Go">→</button>
          <button class="nav-btn" id="bookmark-btn" title="Bookmark">⭐</button>
          <button class="nav-btn" id="bookmarks-btn" title="Bookmarks">📚</button>
          <button class="nav-btn" id="history-btn" title="History">🕒</button>
        </div>

        <!-- Browser view -->
        <div class="browser-view-container">
          <div class="browser-view" id="browser-view"></div>
        </div>

        <!-- Bookmarks panel -->
        <div class="browser-panel" id="bookmarks-panel" style="display: none;">
          <div class="panel-header">
            <h3>Bookmarks</h3>
            <button class="panel-close" data-panel="bookmarks">✕</button>
          </div>
          <div class="panel-content" id="bookmarks-content"></div>
        </div>

        <!-- History panel -->
        <div class="browser-panel" id="history-panel" style="display: none;">
          <div class="panel-header">
            <h3>History</h3>
            <button class="panel-close" data-panel="history">✕</button>
          </div>
          <div class="panel-content" id="history-content"></div>
        </div>

        <!-- Status bar -->
        <div class="browser-status-bar" id="browser-status">
          <span id="status-text">Ready</span>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Back button
    this.container.querySelector('#back-btn')?.addEventListener('click', () => {
      const tab = this.tabManager.getActiveTab();
      if (tab) this.tabManager.goBack(tab.id);
    });

    // Forward button
    this.container.querySelector('#forward-btn')?.addEventListener('click', () => {
      const tab = this.tabManager.getActiveTab();
      if (tab) this.tabManager.goForward(tab.id);
    });

    // Reload button
    this.container.querySelector('#reload-btn')?.addEventListener('click', () => {
      const tab = this.tabManager.getActiveTab();
      if (tab) this.tabManager.reload(tab.id);
    });

    // Home button
    this.container.querySelector('#home-btn')?.addEventListener('click', () => {
      this.navigateTo('about:home');
    });

    // URL input
    const urlInput = this.container.querySelector('#url-input');
    urlInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.navigateTo(urlInput.value);
      }
    });

    // Go button
    this.container.querySelector('#go-btn')?.addEventListener('click', () => {
      this.navigateTo(urlInput.value);
    });

    // Bookmark button
    this.container.querySelector('#bookmark-btn')?.addEventListener('click', () => {
      this.toggleBookmark();
    });

    // Bookmarks button
    this.container.querySelector('#bookmarks-btn')?.addEventListener('click', () => {
      this.togglePanel('bookmarks');
    });

    // History button
    this.container.querySelector('#history-btn')?.addEventListener('click', () => {
      this.togglePanel('history');
    });

    // Panel close buttons
    this.container.querySelectorAll('.panel-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.togglePanel(e.target.dataset.panel);
      });
    });
  }

  /**
   * Navigate to URL
   * @param {string} input - URL or search query
   */
  navigateTo(input) {
    if (!input || input.trim() === '') return;

    let url = input.trim();

    // Handle special pages
    if (url.startsWith('about:')) {
      const tab = this.tabManager.getActiveTab();
      if (tab) {
        this.tabManager.navigate(tab.id, url);
        // Reset tracking to force reload
        this._currentLoadedUrl = null;
        this._currentLoadedTabId = null;
        this.loadSpecialPage(url);
      }
      return;
    }

    // Check if it's a valid URL
    if (!this.isValidURL(url)) {
      // Treat as search query
      url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
    } else {
      // Add https if no protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
    }

    const tab = this.tabManager.getActiveTab();
    if (tab) {
      this.tabManager.navigate(tab.id, url);
      // Reset tracking to force reload
      this._currentLoadedUrl = null;
      this._currentLoadedTabId = null;
      this.loadURL(url);
    }
  }

  /**
   * Check if string is a valid URL
   * @param {string} string - String to check
   * @returns {boolean} True if valid URL
   */
  isValidURL(string) {
    try {
      new URL(string.startsWith('http') ? string : 'https://' + string);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load URL in iframe
   * @param {string} url - URL to load
   */
  loadURL(url) {
    const viewContainer = this.container.querySelector('#browser-view');
    if (!viewContainer) return;

    // Remove existing iframe
    viewContainer.innerHTML = '';

    // Create new iframe
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.className = 'browser-iframe';
    iframe.sandbox = 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox';

    // Loading handlers
    iframe.addEventListener('load', () => {
      const tab = this.tabManager.getActiveTab();
      if (tab) {
        this.tabManager.updateTabInfo(tab.id, {
          loading: false,
          title: iframe.contentDocument?.title || url
        });

        // Add to history
        this.historyManager.addEntry({
          url,
          title: iframe.contentDocument?.title || url
        });

        this.updateStatus('Loaded');
      }
    });

    iframe.addEventListener('error', () => {
      const tab = this.tabManager.getActiveTab();
      if (tab) {
        this.tabManager.updateTabInfo(tab.id, { loading: false });
      }
      this.updateStatus('Error loading page');
    });

    viewContainer.appendChild(iframe);
    this.currentIframe = iframe;
    this.updateStatus('Loading...');
  }

  /**
   * Load special page (about:*)
   * @param {string} url - Special URL
   */
  loadSpecialPage(url) {
    const viewContainer = this.container.querySelector('#browser-view');
    if (!viewContainer) return;

    let content = '';

    switch (url) {
      case 'about:blank':
        content = '<div class="about-page"><h1>Blank Page</h1></div>';
        break;

      case 'about:home':
        content = this.getHomePage();
        break;

      default:
        content = '<div class="about-page"><h1>Unknown Page</h1></div>';
    }

    viewContainer.innerHTML = content;
    const tab = this.tabManager.getActiveTab();
    if (tab) {
      this.tabManager.updateTabInfo(tab.id, {
        loading: false,
        title: url
      });
    }
  }

  /**
   * Get home page HTML
   * @returns {string} HTML
   */
  getHomePage() {
    const mostVisited = this.historyManager.getMostVisited(6);

    return `
      <div class="about-page home-page">
        <h1>🌐 Web Browser</h1>
        <div class="search-box">
          <input type="text" id="home-search" placeholder="Search or enter URL..." />
        </div>
        <h2>Most Visited</h2>
        <div class="quick-links">
          ${mostVisited.map(site => `
            <div class="quick-link" onclick="window.parent.postMessage({type: 'navigate', url: '${site.url}'}, '*')">
              <span class="quick-link-icon">${site.icon}</span>
              <span class="quick-link-title">${site.title}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Update UI
   */
  updateUI() {
    // Prevent re-entrant calls
    if (this._isUpdatingUI) {
      return;
    }

    try {
      this._isUpdatingUI = true;
      this.updateTabBar();
      this.updateNavigationBar();
      this.loadActiveTab();
    } finally {
      this._isUpdatingUI = false;
    }
  }

  /**
   * Update tab bar
   */
  updateTabBar() {
    const tabBar = this.container.querySelector('#browser-tabs');
    if (!tabBar) return;

    const tabs = this.tabManager.getAllTabs();
    const activeTab = this.tabManager.getActiveTab();

    tabBar.innerHTML = tabs.map(tab => `
      <div class="browser-tab ${tab.id === activeTab?.id ? 'active' : ''}" data-tab-id="${tab.id}">
        <span class="tab-icon">${tab.loading ? '⟳' : tab.icon}</span>
        <span class="tab-title">${tab.title}</span>
        <button class="tab-close" data-tab-id="${tab.id}">✕</button>
      </div>
    `).join('') + '<button class="new-tab-btn" id="new-tab-btn">+</button>';

    // Attach tab event listeners
    tabBar.querySelectorAll('.browser-tab').forEach(tabEl => {
      const tabId = parseInt(tabEl.dataset.tabId);
      tabEl.addEventListener('click', (e) => {
        if (!e.target.classList.contains('tab-close')) {
          this.tabManager.setActiveTab(tabId);
        }
      });
    });

    tabBar.querySelectorAll('.tab-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tabId = parseInt(btn.dataset.tabId);
        this.tabManager.closeTab(tabId);
      });
    });

    tabBar.querySelector('#new-tab-btn')?.addEventListener('click', () => {
      this.tabManager.createTab('about:home');
    });
  }

  /**
   * Update navigation bar
   */
  updateNavigationBar() {
    const tab = this.tabManager.getActiveTab();
    if (!tab) return;

    const backBtn = this.container.querySelector('#back-btn');
    const forwardBtn = this.container.querySelector('#forward-btn');
    const urlInput = this.container.querySelector('#url-input');
    const bookmarkBtn = this.container.querySelector('#bookmark-btn');

    if (backBtn) backBtn.disabled = !tab.canGoBack;
    if (forwardBtn) forwardBtn.disabled = !tab.canGoForward;
    if (urlInput) urlInput.value = tab.url;
    if (bookmarkBtn) {
      bookmarkBtn.textContent = this.bookmarkManager.isBookmarked(tab.url) ? '⭐' : '☆';
    }
  }

  /**
   * Load active tab
   */
  loadActiveTab() {
    const tab = this.tabManager.getActiveTab();
    if (!tab) return;

    // Only load if the URL or tab has changed
    if (this._currentLoadedUrl === tab.url && this._currentLoadedTabId === tab.id) {
      return;
    }

    this._currentLoadedUrl = tab.url;
    this._currentLoadedTabId = tab.id;

    if (tab.url.startsWith('about:')) {
      this.loadSpecialPage(tab.url);
    } else {
      this.loadURL(tab.url);
    }
  }

  /**
   * Toggle bookmark for current page
   */
  toggleBookmark() {
    const tab = this.tabManager.getActiveTab();
    if (!tab) return;

    if (this.bookmarkManager.isBookmarked(tab.url)) {
      const bookmark = this.bookmarkManager.findByUrl(tab.url);
      if (bookmark) {
        this.bookmarkManager.removeBookmark(bookmark.id);
        this.updateStatus('Bookmark removed');
      }
    } else {
      this.bookmarkManager.addBookmark({
        title: tab.title,
        url: tab.url,
        icon: tab.icon
      });
      this.updateStatus('Bookmark added');
    }

    this.updateNavigationBar();
  }

  /**
   * Toggle panel visibility
   * @param {string} panelName - Panel name
   */
  togglePanel(panelName) {
    const panel = this.container.querySelector(`#${panelName}-panel`);
    if (!panel) return;

    const isVisible = panel.style.display !== 'none';
    panel.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
      if (panelName === 'bookmarks') {
        this.renderBookmarks();
      } else if (panelName === 'history') {
        this.renderHistory();
      }
    }
  }

  /**
   * Render bookmarks
   */
  renderBookmarks() {
    const content = this.container.querySelector('#bookmarks-content');
    if (!content) return;

    const folders = this.bookmarkManager.getAllFolders();
    let html = '';

    folders.forEach(folder => {
      const bookmarks = this.bookmarkManager.getBookmarksByFolder(folder);
      html += `
        <div class="bookmark-folder">
          <h4>📁 ${folder}</h4>
          <div class="bookmark-list">
            ${bookmarks.map(b => `
              <div class="bookmark-item">
                <span class="bookmark-icon">${b.icon}</span>
                <a href="#" class="bookmark-link" data-url="${b.url}">${b.title}</a>
                <button class="bookmark-delete" data-id="${b.id}">✕</button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    content.innerHTML = html;

    // Attach event listeners
    content.querySelectorAll('.bookmark-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo(link.dataset.url);
        this.togglePanel('bookmarks');
      });
    });

    content.querySelectorAll('.bookmark-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        this.bookmarkManager.removeBookmark(id);
        this.renderBookmarks();
      });
    });
  }

  /**
   * Render history
   */
  renderHistory() {
    const content = this.container.querySelector('#history-content');
    if (!content) return;

    const history = this.historyManager.getHistory(50);

    content.innerHTML = `
      <div class="history-actions">
        <button id="clear-history">Clear All</button>
      </div>
      <div class="history-list">
        ${history.map(entry => `
          <div class="history-item">
            <span class="history-icon">${entry.icon}</span>
            <div class="history-info">
              <a href="#" class="history-link" data-url="${entry.url}">${entry.title}</a>
              <span class="history-url">${entry.url}</span>
              <span class="history-time">${new Date(entry.visitedAt).toLocaleString()}</span>
            </div>
            <button class="history-delete" data-id="${entry.id}">✕</button>
          </div>
        `).join('')}
      </div>
    `;

    // Attach event listeners
    content.querySelector('#clear-history')?.addEventListener('click', () => {
      this.historyManager.clearAll();
      this.renderHistory();
    });

    content.querySelectorAll('.history-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo(link.dataset.url);
        this.togglePanel('history');
      });
    });

    content.querySelectorAll('.history-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        this.historyManager.deleteEntry(id);
        this.renderHistory();
      });
    });
  }

  /**
   * Update status bar
   * @param {string} message - Status message
   */
  updateStatus(message) {
    const statusText = this.container.querySelector('#status-text');
    if (statusText) {
      statusText.textContent = message;
    }
  }

  /**
   * Destroy the application
   */
  destroy() {
    if (this.currentIframe) {
      this.currentIframe.remove();
    }
  }
}
