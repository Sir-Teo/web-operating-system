/**
 * Next-Generation Web Browser Application
 * Advanced browser with tabs, groups, downloads, dev tools, and more
 */
import { BrowserTabManager } from './BrowserTabManager.js';
import { BookmarkManager } from './BookmarkManager.js';
import { HistoryManager } from './HistoryManager.js';
import { DownloadManager } from './DownloadManager.js';
import { RecentlyClosedManager } from './RecentlyClosedManager.js';

export default class Browser {
  constructor(context) {
    this.context = context;
    this.tabManager = new BrowserTabManager();
    this.bookmarkManager = new BookmarkManager();
    this.historyManager = new HistoryManager();
    this.downloadManager = new DownloadManager();
    this.recentlyClosedManager = new RecentlyClosedManager();
    this.container = null;
    this.currentIframe = null;
    this._isUpdatingUI = false;
    this._currentLoadedUrl = null;
    this._currentLoadedTabId = null;
    this.searchSuggestions = [];
    this.searchEngines = {
      google: 'https://www.google.com/search?igu=1&q=',
      duckduckgo: 'https://duckduckgo.com/?q=',
      bing: 'https://www.bing.com/search?q='
    };
    this.currentSearchEngine = 'duckduckgo';
    this.devToolsOpen = false;
    this.readingMode = false;
    this.iframeCompatibilityRules = [
      {
        id: 'google',
        title: 'Google can\'t run inside WebOS Browser',
        message: 'Google Search and account pages block embedded browsers.',
        explanation: 'Google sets strict Content Security Policy frame-ancestors rules and attempts to autofocus inputs, which Chromium disallows for sandboxed iframes. Loading it anyway fills the console with CSP/autofocus errors and leaves the page unusable.',
        details: 'Chromium surfaces these violations as "Blocked autofocusing ..." and "Framing https://ogs.google.com ..." errors.',
        suggestions: [
          'Use Tools -> Search Engine to pick DuckDuckGo or Bing for in-app searching.',
          'Use "Open in New Browser Tab" whenever you need to continue in Google.'
        ],
        pattern: /(^|\.)google\.[a-z.]+$/i
      },
      {
        id: 'bilibili',
        title: 'Bilibili requires a trusted browser context',
        message: 'Bilibili\'s fingerprint scripts fail inside the sandboxed browser.',
        explanation: 'risk-captcha and bili-user-fingerprint expect privileged APIs and their own reporting endpoints. Inside WebOS they constantly throw "report is not found", so we stop them before they crash the tab.',
        details: 'Letting it run also logs the giant ASCII art banner that keeps asking to "understand this error" and the captcha never finishes.',
        suggestions: [
          'Open Bilibili in a standalone browser tab so its anti-abuse stack can run.',
          'Keep the built-in browser for sites that support being embedded.'
        ],
        pattern: /(^|\.)bilibili\.com$/i
      }
    ];
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
          <button class="nav-btn" id="back-btn" title="Back (Alt+←)">←</button>
          <button class="nav-btn" id="forward-btn" title="Forward (Alt+→)">→</button>
          <button class="nav-btn" id="reload-btn" title="Reload (Ctrl+R)">⟳</button>
          <button class="nav-btn" id="home-btn" title="Home">🏠</button>

          <div class="url-bar-container">
            <div class="url-security-indicator" id="security-indicator">🔒</div>
            <input type="text" id="url-input" class="url-input" placeholder="Search or enter address" autocomplete="off" />
            <div class="url-suggestions" id="url-suggestions" style="display: none;"></div>
          </div>

          <button class="nav-btn" id="bookmark-btn" title="Bookmark this page">☆</button>
          <button class="nav-btn" id="download-btn" title="Downloads">⬇</button>
          <button class="nav-btn" id="tools-btn" title="Tools & More">⋮</button>
        </div>

        <!-- Toolbar with additional features -->
        <div class="browser-toolbar" id="browser-toolbar" style="display: none;">
          <button class="tool-btn" id="reading-mode-btn" title="Reading Mode">📖</button>
          <button class="tool-btn" id="screenshot-btn" title="Take Screenshot">📷</button>
          <button class="tool-btn" id="dev-tools-btn" title="Developer Tools">🔧</button>
          <button class="tool-btn" id="find-btn" title="Find in Page">🔍</button>
          <button class="tool-btn" id="print-btn" title="Print">🖨️</button>
        </div>

        <!-- Browser view -->
        <div class="browser-view-container">
          <div class="browser-view" id="browser-view"></div>

          <!-- Developer Tools -->
          <div class="dev-tools-panel" id="dev-tools-panel" style="display: none;">
            <div class="dev-tools-header">
              <div class="dev-tools-tabs">
                <button class="dev-tab active" data-tab="console">Console</button>
                <button class="dev-tab" data-tab="elements">Elements</button>
                <button class="dev-tab" data-tab="network">Network</button>
                <button class="dev-tab" data-tab="storage">Storage</button>
              </div>
              <button class="dev-tools-close" id="dev-tools-close">✕</button>
            </div>
            <div class="dev-tools-content" id="dev-tools-content">
              <div class="dev-tools-output" id="dev-tools-output"></div>
            </div>
          </div>
        </div>

        <!-- Tools Menu -->
        <div class="browser-menu" id="tools-menu" style="display: none;">
          <div class="menu-section">
            <button class="menu-item" id="new-tab-menu">
              <span class="menu-icon">➕</span>
              <span>New Tab</span>
              <span class="menu-shortcut">Ctrl+T</span>
            </button>
            <button class="menu-item" id="new-incognito-menu">
              <span class="menu-icon">🕶️</span>
              <span>New Incognito Tab</span>
              <span class="menu-shortcut">Ctrl+Shift+N</span>
            </button>
            <button class="menu-item" id="reopen-closed-menu">
              <span class="menu-icon">↩️</span>
              <span>Reopen Closed Tab</span>
              <span class="menu-shortcut">Ctrl+Shift+T</span>
            </button>
          </div>
          <div class="menu-divider"></div>
          <div class="menu-section">
            <button class="menu-item" id="bookmarks-menu">
              <span class="menu-icon">📚</span>
              <span>Bookmarks</span>
            </button>
            <button class="menu-item" id="history-menu">
              <span class="menu-icon">🕒</span>
              <span>History</span>
            </button>
            <button class="menu-item" id="downloads-menu">
              <span class="menu-icon">⬇️</span>
              <span>Downloads</span>
            </button>
          </div>
          <div class="menu-divider"></div>
          <div class="menu-section">
            <button class="menu-item" id="search-engine-menu">
              <span class="menu-icon">🔍</span>
              <span>Search Engine: <span id="current-engine">${this.currentSearchEngine}</span></span>
            </button>
          </div>
        </div>

        <!-- Bookmarks panel -->
        <div class="browser-panel" id="bookmarks-panel" style="display: none;">
          <div class="panel-header">
            <h3>📚 Bookmarks</h3>
            <button class="panel-close" data-panel="bookmarks">✕</button>
          </div>
          <div class="panel-content" id="bookmarks-content"></div>
        </div>

        <!-- History panel -->
        <div class="browser-panel" id="history-panel" style="display: none;">
          <div class="panel-header">
            <h3>🕒 History</h3>
            <button class="panel-close" data-panel="history">✕</button>
          </div>
          <div class="panel-content" id="history-content"></div>
        </div>

        <!-- Downloads panel -->
        <div class="browser-panel" id="downloads-panel" style="display: none;">
          <div class="panel-header">
            <h3>⬇️ Downloads</h3>
            <button class="panel-close" data-panel="downloads">✕</button>
          </div>
          <div class="panel-content" id="downloads-content"></div>
        </div>

        <!-- Tab context menu -->
        <div class="context-menu" id="tab-context-menu" style="display: none;">
          <button class="context-menu-item" data-action="reload">Reload</button>
          <button class="context-menu-item" data-action="pin">Pin Tab</button>
          <button class="context-menu-item" data-action="duplicate">Duplicate</button>
          <button class="context-menu-item" data-action="mute">Mute Tab</button>
          <div class="menu-divider"></div>
          <button class="context-menu-item" data-action="close">Close Tab</button>
          <button class="context-menu-item" data-action="close-others">Close Other Tabs</button>
          <button class="context-menu-item" data-action="close-right">Close Tabs to the Right</button>
        </div>

        <!-- Status bar -->
        <div class="browser-status-bar" id="browser-status">
          <span id="status-text">Ready</span>
          <span id="status-info"></span>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Navigation buttons
    this.container.querySelector('#back-btn')?.addEventListener('click', () => {
      const tab = this.tabManager.getActiveTab();
      if (tab) this.tabManager.goBack(tab.id);
    });

    this.container.querySelector('#forward-btn')?.addEventListener('click', () => {
      const tab = this.tabManager.getActiveTab();
      if (tab) this.tabManager.goForward(tab.id);
    });

    this.container.querySelector('#reload-btn')?.addEventListener('click', () => {
      const tab = this.tabManager.getActiveTab();
      if (tab) this.tabManager.reload(tab.id);
    });

    this.container.querySelector('#home-btn')?.addEventListener('click', () => {
      this.navigateTo('about:home');
    });

    // URL input with autocomplete
    const urlInput = this.container.querySelector('#url-input');
    urlInput?.addEventListener('input', (e) => {
      this.showUrlSuggestions(e.target.value);
    });

    urlInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.navigateTo(urlInput.value);
        this.hideUrlSuggestions();
      } else if (e.key === 'Escape') {
        this.hideUrlSuggestions();
      }
    });

    urlInput?.addEventListener('focus', () => {
      if (urlInput.value) {
        this.showUrlSuggestions(urlInput.value);
      }
    });

    // Bookmark button
    this.container.querySelector('#bookmark-btn')?.addEventListener('click', () => {
      this.toggleBookmark();
    });

    // Download button
    this.container.querySelector('#download-btn')?.addEventListener('click', () => {
      this.togglePanel('downloads');
    });

    // Tools button
    this.container.querySelector('#tools-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleToolsMenu();
    });

    // Toolbar buttons
    this.container.querySelector('#reading-mode-btn')?.addEventListener('click', () => {
      this.toggleReadingMode();
    });

    this.container.querySelector('#screenshot-btn')?.addEventListener('click', () => {
      this.takeScreenshot();
    });

    this.container.querySelector('#dev-tools-btn')?.addEventListener('click', () => {
      this.toggleDevTools();
    });

    this.container.querySelector('#dev-tools-close')?.addEventListener('click', () => {
      this.toggleDevTools();
    });

    // Tools menu items
    this.container.querySelector('#new-tab-menu')?.addEventListener('click', () => {
      this.tabManager.createTab('about:home');
    });

    this.container.querySelector('#new-incognito-menu')?.addEventListener('click', () => {
      this.createIncognitoTab();
    });

    this.container.querySelector('#reopen-closed-menu')?.addEventListener('click', () => {
      this.reopenClosedTab();
    });

    this.container.querySelector('#bookmarks-menu')?.addEventListener('click', () => {
      this.togglePanel('bookmarks');
    });

    this.container.querySelector('#history-menu')?.addEventListener('click', () => {
      this.togglePanel('history');
    });

    this.container.querySelector('#downloads-menu')?.addEventListener('click', () => {
      this.togglePanel('downloads');
    });

    this.container.querySelector('#search-engine-menu')?.addEventListener('click', () => {
      this.cycleSearchEngine();
    });

    // Tab context menu
    this.container.querySelectorAll('.context-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        if (action) {
          this.handleTabContextAction(action);
        }
      });
    });

    // Panel close buttons
    this.container.querySelectorAll('.panel-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.togglePanel(e.target.dataset.panel);
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+T: New tab
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        this.tabManager.createTab('about:home');
      }
      // Ctrl+W: Close tab
      else if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        const tab = this.tabManager.getActiveTab();
        if (tab) {
          this.recentlyClosedManager.addClosedTab(tab);
          this.tabManager.closeTab(tab.id);
        }
      }
      // Ctrl+Shift+T: Reopen closed tab
      else if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.reopenClosedTab();
      }
      // Ctrl+Shift+N: New incognito tab
      else if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        this.createIncognitoTab();
      }
      // Ctrl+R or F5: Reload
      else if ((e.ctrlKey && e.key === 'r') || e.key === 'F5') {
        e.preventDefault();
        const tab = this.tabManager.getActiveTab();
        if (tab) this.tabManager.reload(tab.id);
      }
      // Alt+Left: Back
      else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        const tab = this.tabManager.getActiveTab();
        if (tab) this.tabManager.goBack(tab.id);
      }
      // Alt+Right: Forward
      else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        const tab = this.tabManager.getActiveTab();
        if (tab) this.tabManager.goForward(tab.id);
      }
      // F12: Toggle dev tools
      else if (e.key === 'F12') {
        e.preventDefault();
        this.toggleDevTools();
      }
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
      // Treat as search query using current search engine
      url = this.searchEngines[this.currentSearchEngine] + encodeURIComponent(url);
    } else {
      // Add https if no protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
    }

    url = this.applyIframeCompatibility(url);

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
   * Apply domain-specific compatibility tweaks for iframe-restricted sites
   * @param {string} url - Original URL
   * @returns {string} Safe-to-embed URL
   */
  applyIframeCompatibility(url) {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();
      const isGoogleHost =
        hostname === 'google.com' ||
        hostname === 'www.google.com';

      if (isGoogleHost) {
        // Google exposes a special flag that skips X-Frame-Options enforcement
        if (!parsedUrl.pathname || parsedUrl.pathname === '/') {
          parsedUrl.pathname = '/webhp';
        }
        parsedUrl.searchParams.set('igu', '1');
        return parsedUrl.toString();
      }
    } catch (e) {
      // Ignore malformed URLs and fall back to the original value
    }

    return url;
  }

  /**
   * Determine if URL is known to fail inside an iframe
   * @param {string} url - URL to test
   * @returns {object|null} Matching compatibility rule
   */
  getIframeCompatibilityRule(url) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return this.iframeCompatibilityRules.find(rule => rule.pattern.test(hostname)) || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Load URL in iframe
   * @param {string} url - URL to load
   */
  loadURL(url) {
    const viewContainer = this.container.querySelector('#browser-view');
    if (!viewContainer) return;

    // Remove existing iframe and error overlay
    viewContainer.innerHTML = '';

    const compatibilityRule = this.getIframeCompatibilityRule(url);
    if (compatibilityRule) {
      this.showIframeError(url, compatibilityRule.message, {
        title: compatibilityRule.title,
        explanation: compatibilityRule.explanation,
        details: compatibilityRule.details,
        suggestions: compatibilityRule.suggestions,
        statusMessage: 'Blocked by site restrictions'
      });
      this.currentIframe = null;
      return;
    }

    url = this.applyIframeCompatibility(url);

    // Create new iframe
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.className = 'browser-iframe';
    iframe.sandbox = 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox';

    let loadSuccessful = false;
    let loadTimeout = null;

    // Loading handlers
    iframe.addEventListener('load', () => {
      loadSuccessful = true;
      clearTimeout(loadTimeout);

      const tab = this.tabManager.getActiveTab();
      if (tab) {
        // Try to access iframe content to verify it loaded successfully
        let title = url;
        try {
          title = iframe.contentDocument?.title || url;
        } catch (e) {
          // Cross-origin - can't access title, but iframe loaded
        }

        this.tabManager.updateTabInfo(tab.id, {
          loading: false,
          title: title
        });

        // Add to history
        this.historyManager.addEntry({
          url,
          title: title
        });

        this.updateStatus('Loaded');
      }
    });

    iframe.addEventListener('error', () => {
      loadSuccessful = true; // Prevent timeout from also showing error
      clearTimeout(loadTimeout);
      this.showIframeError(url, 'Failed to load the page');
    });

    // Set a timeout to detect if iframe fails to load
    // This catches X-Frame-Options and CSP violations which don't trigger error events
    loadTimeout = setTimeout(() => {
      if (!loadSuccessful) {
        // Check if iframe is still blank/unloaded
        try {
          // Try to access iframe location
          const iframeLocation = iframe.contentWindow?.location?.href;
          if (!iframeLocation || iframeLocation === 'about:blank') {
            this.showIframeError(url, 'Unable to display this page in a frame');
          }
        } catch (e) {
          // Cross-origin error - might indicate the page is trying to load but blocked
          this.showIframeError(url, 'This website cannot be displayed in a frame');
        }
      }
    }, 5000); // 5 second timeout

    viewContainer.appendChild(iframe);
    this.currentIframe = iframe;
    this.updateStatus('Loading...');
  }

  /**
   * Show iframe error overlay
   * @param {string} url - URL that failed to load
   * @param {string} message - Error message
   */
  showIframeError(url, message, options = {}) {
    const viewContainer = this.container.querySelector('#browser-view');
    if (!viewContainer) return;

    const tab = this.tabManager.getActiveTab();
    if (tab) {
      this.tabManager.updateTabInfo(tab.id, { loading: false });
    }

    const {
      title = 'Cannot Display Page',
      explanationTitle = 'Why is this happening?',
      explanation = 'This website has security settings (X-Frame-Options or Content Security Policy) that prevent it from being displayed in an iframe.',
      details = '',
      suggestions = [],
      statusMessage = 'Failed to load page'
    } = options || {};

    const detailHtml = details ? `<p>${this.escapeHtml(details)}</p>` : '';
    const suggestionHtml = Array.isArray(suggestions) && suggestions.length
      ? `<ul class="iframe-error-suggestions">
          ${suggestions.map(item => `<li>${this.escapeHtml(item)}</li>`).join('')}
        </ul>`
      : '';

    // Create error overlay
    const errorOverlay = document.createElement('div');
    errorOverlay.className = 'iframe-error-overlay';
    errorOverlay.innerHTML = `
      <div class="iframe-error-content">
        <div class="iframe-error-icon">🚫</div>
        <h2 class="iframe-error-title">${this.escapeHtml(title)}</h2>
        <p class="iframe-error-message">${this.escapeHtml(message || 'Unable to load the page')}</p>
        <p class="iframe-error-url">${this.escapeHtml(url)}</p>
        <div class="iframe-error-explanation">
          <p><strong>${this.escapeHtml(explanationTitle)}</strong></p>
          <p>${this.escapeHtml(explanation)}</p>
          ${detailHtml}
          ${suggestionHtml}
        </div>
        <div class="iframe-error-actions">
          <button class="iframe-error-btn primary" id="open-new-tab-btn">
            Open in New Browser Tab
          </button>
          <button class="iframe-error-btn secondary" id="copy-url-btn">
            Copy URL
          </button>
          <button class="iframe-error-btn secondary" id="go-back-btn">
            Go Back
          </button>
        </div>
      </div>
    `;

    // Add to view container
    viewContainer.appendChild(errorOverlay);

    // Attach event listeners
    errorOverlay.querySelector('#open-new-tab-btn')?.addEventListener('click', () => {
      window.open(url, '_blank', 'noopener,noreferrer');
    });

    errorOverlay.querySelector('#copy-url-btn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(url).then(() => {
        this.updateStatus('URL copied to clipboard');
        const btn = errorOverlay.querySelector('#copy-url-btn');
        if (btn) {
          const originalText = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => {
            btn.textContent = originalText;
          }, 2000);
        }
      });
    });

    errorOverlay.querySelector('#go-back-btn')?.addEventListener('click', () => {
      const tab = this.tabManager.getActiveTab();
      if (tab && tab.canGoBack) {
        this.tabManager.goBack(tab.id);
      } else {
        this.navigateTo('about:home');
      }
    });

    this.updateStatus(statusMessage);
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
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
      <div class="browser-tab ${tab.id === activeTab?.id ? 'active' : ''} ${tab.pinned ? 'pinned' : ''} ${tab.incognito ? 'incognito' : ''}"
           data-tab-id="${tab.id}"
           title="${tab.url}">
        ${tab.pinned ? '<span class="tab-pin-indicator">📌</span>' : ''}
        ${tab.incognito ? '<span class="tab-incognito-indicator">🕶️</span>' : ''}
        <span class="tab-icon">${tab.loading ? '⟳' : tab.icon}</span>
        <span class="tab-title">${tab.title}</span>
        ${!tab.pinned ? `<button class="tab-close" data-tab-id="${tab.id}">✕</button>` : ''}
      </div>
    `).join('') + '<button class="new-tab-btn" id="new-tab-btn" title="New Tab (Ctrl+T)">+</button>';

    // Attach tab event listeners
    tabBar.querySelectorAll('.browser-tab').forEach(tabEl => {
      const tabId = parseInt(tabEl.dataset.tabId);

      // Left click to switch tab
      tabEl.addEventListener('click', (e) => {
        if (!e.target.classList.contains('tab-close')) {
          this.tabManager.setActiveTab(tabId);
        }
      });

      // Right click for context menu
      tabEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showTabContextMenu(tabId, e.clientX, e.clientY);
      });

      // Middle click to close tab
      tabEl.addEventListener('mousedown', (e) => {
        if (e.button === 1) { // Middle mouse button
          e.preventDefault();
          const tab = tabs.find(t => t.id === tabId);
          if (tab) {
            this.recentlyClosedManager.addClosedTab(tab);
            this.tabManager.closeTab(tabId);
          }
        }
      });
    });

    tabBar.querySelectorAll('.tab-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tabId = parseInt(btn.dataset.tabId);
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
          this.recentlyClosedManager.addClosedTab(tab);
          this.tabManager.closeTab(tabId);
        }
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

    // Close all other panels
    this.container.querySelectorAll('.browser-panel').forEach(p => {
      if (p.id !== `${panelName}-panel`) {
        p.style.display = 'none';
      }
    });

    panel.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
      if (panelName === 'bookmarks') {
        this.renderBookmarks();
      } else if (panelName === 'history') {
        this.renderHistory();
      } else if (panelName === 'downloads') {
        this.renderDownloads();
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
   * Render downloads panel
   */
  renderDownloads() {
    const content = this.container.querySelector('#downloads-content');
    if (!content) return;

    const downloads = this.downloadManager.getAllDownloads();

    if (downloads.length === 0) {
      content.innerHTML = '<div class="empty-state">No downloads yet</div>';
      return;
    }

    content.innerHTML = `
      <div class="downloads-actions">
        <button id="clear-downloads">Clear All</button>
      </div>
      <div class="downloads-list">
        ${downloads.map(dl => `
          <div class="download-item ${dl.status}">
            <div class="download-icon">${this.getDownloadIcon(dl.status)}</div>
            <div class="download-info">
              <div class="download-filename">${dl.filename}</div>
              <div class="download-details">
                ${dl.size > 0 ? this.downloadManager.formatSize(dl.size) : 'Unknown size'} •
                ${dl.status === 'completed' ? 'Completed' : dl.status}
                ${dl.error ? ` • ${dl.error}` : ''}
              </div>
              ${dl.status === 'downloading' ? `
                <div class="download-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${dl.progress}%"></div>
                  </div>
                  <span>${dl.progress}%</span>
                </div>
              ` : ''}
            </div>
            <button class="download-remove" data-id="${dl.id}">✕</button>
          </div>
        `).join('')}
      </div>
    `;

    content.querySelector('#clear-downloads')?.addEventListener('click', () => {
      this.downloadManager.clearAll();
      this.renderDownloads();
    });

    content.querySelectorAll('.download-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        this.downloadManager.removeDownload(id);
        this.renderDownloads();
      });
    });
  }

  /**
   * Get download icon based on status
   */
  getDownloadIcon(status) {
    const icons = {
      downloading: '⬇️',
      completed: '✅',
      failed: '❌',
      paused: '⏸️'
    };
    return icons[status] || '📄';
  }

  /**
   * Toggle developer tools
   */
  toggleDevTools() {
    this.devToolsOpen = !this.devToolsOpen;
    const panel = this.container.querySelector('#dev-tools-panel');
    if (panel) {
      panel.style.display = this.devToolsOpen ? 'flex' : 'none';
      if (this.devToolsOpen) {
        this.initDevTools();
      }
    }
  }

  /**
   * Initialize developer tools
   */
  initDevTools() {
    const output = this.container.querySelector('#dev-tools-output');
    if (!output) return;

    const tab = this.tabManager.getActiveTab();
    if (!tab) return;

    output.innerHTML = `
      <div class="dev-console">
        <div class="console-header">Console</div>
        <div class="console-messages">
          <div class="console-message info">
            <span class="console-icon">ℹ️</span>
            <span>Developer Console - Tab: ${tab.title}</span>
          </div>
          <div class="console-message">
            <span class="console-icon">▶️</span>
            <span>URL: ${tab.url}</span>
          </div>
          <div class="console-message">
            <span class="console-icon">⏱️</span>
            <span>Created: ${new Date(tab.createdAt).toLocaleString()}</span>
          </div>
          ${tab.incognito ? '<div class="console-message warn"><span class="console-icon">🕶️</span><span>Incognito Mode Active</span></div>' : ''}
        </div>
        <div class="console-input">
          <input type="text" placeholder="Enter JavaScript..." id="console-input" />
        </div>
      </div>
    `;
  }

  /**
   * Toggle reading mode
   */
  toggleReadingMode() {
    this.readingMode = !this.readingMode;
    const viewContainer = this.container.querySelector('#browser-view');
    if (viewContainer) {
      viewContainer.classList.toggle('reading-mode', this.readingMode);
    }
    this.updateStatus(this.readingMode ? 'Reading mode enabled' : 'Reading mode disabled');
  }

  /**
   * Take screenshot
   */
  async takeScreenshot() {
    try {
      const viewContainer = this.container.querySelector('#browser-view');
      if (!viewContainer) return;

      // For iframe content, we can't directly capture due to CORS
      // Instead, we'll notify the user
      this.updateStatus('Screenshot feature - Content capture limited by browser security');

      // In a real implementation, you'd use APIs like html2canvas or similar
      alert('Screenshot functionality would require additional libraries like html2canvas');
    } catch (error) {
      this.updateStatus('Screenshot failed: ' + error.message);
    }
  }

  /**
   * Show tab context menu
   */
  showTabContextMenu(tabId, x, y) {
    const menu = this.container.querySelector('#tab-context-menu');
    if (!menu) return;

    this.contextMenuTabId = tabId;
    menu.style.display = 'block';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';

    // Update menu items based on tab state
    const tab = this.tabManager.getAllTabs().find(t => t.id === tabId);
    if (tab) {
      const pinItem = menu.querySelector('[data-action="pin"]');
      if (pinItem) pinItem.textContent = tab.pinned ? 'Unpin Tab' : 'Pin Tab';

      const muteItem = menu.querySelector('[data-action="mute"]');
      if (muteItem) muteItem.textContent = tab.muted ? 'Unmute Tab' : 'Mute Tab';
    }

    // Close menu on click outside
    setTimeout(() => {
      document.addEventListener('click', () => {
        menu.style.display = 'none';
      }, { once: true });
    }, 0);
  }

  /**
   * Handle tab context menu action
   */
  handleTabContextAction(action) {
    const tabId = this.contextMenuTabId;
    if (!tabId) return;

    switch (action) {
      case 'reload':
        this.tabManager.reload(tabId);
        break;
      case 'pin':
        this.tabManager.togglePin(tabId);
        break;
      case 'duplicate':
        this.tabManager.duplicateTab(tabId);
        break;
      case 'mute':
        this.tabManager.toggleMute(tabId);
        break;
      case 'close':
        const tab = this.tabManager.getAllTabs().find(t => t.id === tabId);
        if (tab) {
          this.recentlyClosedManager.addClosedTab(tab);
          this.tabManager.closeTab(tabId);
        }
        break;
      case 'close-others':
        this.tabManager.getAllTabs().forEach(t => {
          if (t.id !== tabId) {
            this.recentlyClosedManager.addClosedTab(t);
            this.tabManager.closeTab(t.id);
          }
        });
        break;
      case 'close-right':
        const tabs = this.tabManager.getAllTabs();
        const index = tabs.findIndex(t => t.id === tabId);
        tabs.slice(index + 1).forEach(t => {
          this.recentlyClosedManager.addClosedTab(t);
          this.tabManager.closeTab(t.id);
        });
        break;
    }
  }

  /**
   * Reopen last closed tab
   */
  reopenClosedTab() {
    const recentlyClosed = this.recentlyClosedManager.getRecentlyClosed(1);
    if (recentlyClosed.length > 0) {
      const tab = recentlyClosed[0];
      this.tabManager.createTab(tab.url, {
        pinned: tab.pinned,
        groupId: tab.groupId,
        incognito: tab.incognito
      });
      this.recentlyClosedManager.removeEntry(0);
      this.updateStatus('Reopened tab');
    }
  }

  /**
   * Create incognito tab
   */
  createIncognitoTab() {
    this.tabManager.createTab('about:blank', { incognito: true });
    this.updateStatus('Incognito tab created');
  }

  /**
   * Toggle tools menu
   */
  toggleToolsMenu() {
    const menu = this.container.querySelector('#tools-menu');
    if (!menu) return;

    const isVisible = menu.style.display !== 'none';
    menu.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
      // Close on click outside
      setTimeout(() => {
        document.addEventListener('click', (e) => {
          if (!menu.contains(e.target)) {
            menu.style.display = 'none';
          }
        }, { once: true });
      }, 0);
    }
  }

  /**
   * Cycle search engine
   */
  cycleSearchEngine() {
    const engines = Object.keys(this.searchEngines);
    const currentIndex = engines.indexOf(this.currentSearchEngine);
    const nextIndex = (currentIndex + 1) % engines.length;
    this.currentSearchEngine = engines[nextIndex];

    const engineSpan = this.container.querySelector('#current-engine');
    if (engineSpan) {
      engineSpan.textContent = this.currentSearchEngine;
    }

    this.updateStatus(`Search engine: ${this.currentSearchEngine}`);
  }

  /**
   * Show URL suggestions
   */
  showUrlSuggestions(query) {
    if (!query || query.length < 2) {
      this.hideUrlSuggestions();
      return;
    }

    const suggestionsDiv = this.container.querySelector('#url-suggestions');
    if (!suggestionsDiv) return;

    // Get suggestions from bookmarks and history
    const bookmarks = this.bookmarkManager.search(query);
    const history = this.historyManager.search(query, 5);

    const suggestions = [
      ...bookmarks.slice(0, 3).map(b => ({ type: 'bookmark', ...b })),
      ...history.slice(0, 3).map(h => ({ type: 'history', ...h }))
    ];

    if (suggestions.length === 0) {
      this.hideUrlSuggestions();
      return;
    }

    suggestionsDiv.innerHTML = suggestions.map(s => `
      <div class="suggestion-item" data-url="${s.url}">
        <span class="suggestion-icon">${s.type === 'bookmark' ? '⭐' : '🕒'}</span>
        <div class="suggestion-info">
          <div class="suggestion-title">${s.title}</div>
          <div class="suggestion-url">${s.url}</div>
        </div>
      </div>
    `).join('');

    suggestionsDiv.style.display = 'block';

    // Add click handlers
    suggestionsDiv.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        this.navigateTo(item.dataset.url);
        this.hideUrlSuggestions();
      });
    });
  }

  /**
   * Hide URL suggestions
   */
  hideUrlSuggestions() {
    const suggestionsDiv = this.container.querySelector('#url-suggestions');
    if (suggestionsDiv) {
      suggestionsDiv.style.display = 'none';
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
