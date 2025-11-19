/**
 * MobileUI - Mobile-Optimized User Interface Components
 *
 * Provides mobile-friendly UI components and navigation.
 * Includes app drawer, bottom navigation, and touch-optimized controls.
 */

import { mobileDetector } from '../system/MobileDetector.js';
import { createGestureManager } from '../system/GestureManager.js';

export class MobileUI {
  constructor(kernel) {
    this.kernel = kernel;
    this.appDrawer = null;
    this.bottomNav = null;
    this.isAppDrawerOpen = false;
    this.gestureManager = null;
  }

  /**
   * Initialize mobile UI
   */
  async init() {
    if (!mobileDetector.isMobile()) return;

    this.createMobileStyles();
    this.createBottomNavigation();
    this.createAppDrawer();
    this.setupGestures();
    this.applyMobileOptimizations();

    // Listen for orientation changes
    mobileDetector.addListener((viewport) => {
      this.handleOrientationChange(viewport);
    });
  }

  /**
   * Create mobile-specific styles
   */
  createMobileStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile UI Styles */
      .mobile-ui {
        --mobile-header-height: 56px;
        --mobile-bottom-nav-height: 60px;
        --mobile-safe-area-top: env(safe-area-inset-top, 0px);
        --mobile-safe-area-bottom: env(safe-area-inset-bottom, 0px);
      }

      /* Hide desktop taskbar on mobile */
      .is-mobile #taskbar {
        display: none !important;
      }

      /* Adjust desktop for mobile */
      .is-mobile #desktop {
        padding-bottom: calc(var(--mobile-bottom-nav-height) + var(--mobile-safe-area-bottom));
        padding-top: var(--mobile-safe-area-top);
      }

      /* Bottom Navigation */
      #mobile-bottom-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: var(--mobile-bottom-nav-height);
        background: rgba(15, 15, 35, 0.98);
        backdrop-filter: blur(20px);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-around;
        align-items: center;
        z-index: 9999;
        padding-bottom: var(--mobile-safe-area-bottom);
      }

      .mobile-nav-button {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 8px;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        transition: all 0.2s;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }

      .mobile-nav-button:active {
        transform: scale(0.95);
        color: #4a9eff;
      }

      .mobile-nav-button.active {
        color: #4a9eff;
      }

      .mobile-nav-icon {
        font-size: 24px;
        margin-bottom: 4px;
      }

      .mobile-nav-label {
        font-size: 11px;
        font-weight: 500;
      }

      /* App Drawer */
      #mobile-app-drawer {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        z-index: 10000;
        display: none;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      #mobile-app-drawer.open {
        display: block;
        opacity: 1;
      }

      .app-drawer-content {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        max-height: 80vh;
        background: rgba(20, 20, 40, 0.98);
        border-radius: 20px 20px 0 0;
        padding: 20px;
        padding-bottom: calc(20px + var(--mobile-safe-area-bottom));
        transform: translateY(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow-y: auto;
      }

      #mobile-app-drawer.open .app-drawer-content {
        transform: translateY(0);
      }

      .app-drawer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .app-drawer-title {
        font-size: 20px;
        font-weight: 600;
        color: #fff;
      }

      .app-drawer-close {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 20px;
      }

      .app-drawer-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: 20px;
      }

      .app-drawer-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px;
        cursor: pointer;
        border-radius: 12px;
        transition: all 0.2s;
        -webkit-tap-highlight-color: transparent;
      }

      .app-drawer-item:active {
        transform: scale(0.95);
        background: rgba(255, 255, 255, 0.1);
      }

      .app-drawer-item-icon {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        margin-bottom: 8px;
      }

      .app-drawer-item-label {
        font-size: 12px;
        color: #fff;
        text-align: center;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Touch-optimized windows */
      .is-mobile .window {
        border-radius: 0 !important;
        max-width: 100% !important;
        max-height: calc(100vh - var(--mobile-bottom-nav-height) - var(--mobile-safe-area-bottom)) !important;
      }

      .is-mobile .window.maximized,
      .is-mobile .window.fullscreen {
        top: var(--mobile-safe-area-top) !important;
        left: 0 !important;
        right: 0 !important;
        bottom: calc(var(--mobile-bottom-nav-height) + var(--mobile-safe-area-bottom)) !important;
        width: 100% !important;
        height: auto !important;
      }

      /* Touch targets - minimum 44x44px */
      .is-mobile button,
      .is-mobile .clickable {
        min-height: 44px;
        min-width: 44px;
      }

      /* Disable text selection on touch */
      .is-mobile {
        -webkit-user-select: none;
        user-select: none;
      }

      .is-mobile input,
      .is-mobile textarea,
      .is-mobile [contenteditable] {
        -webkit-user-select: text;
        user-select: text;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Create bottom navigation
   */
  createBottomNavigation() {
    this.bottomNav = document.createElement('div');
    this.bottomNav.id = 'mobile-bottom-nav';
    this.bottomNav.className = 'mobile-ui';
    this.bottomNav.innerHTML = `
      <div class="mobile-nav-button" data-action="home">
        <div class="mobile-nav-icon">🏠</div>
        <div class="mobile-nav-label">Home</div>
      </div>
      <div class="mobile-nav-button" data-action="apps">
        <div class="mobile-nav-icon">📱</div>
        <div class="mobile-nav-label">Apps</div>
      </div>
      <div class="mobile-nav-button" data-action="recent">
        <div class="mobile-nav-icon">⏱️</div>
        <div class="mobile-nav-label">Recent</div>
      </div>
      <div class="mobile-nav-button" data-action="settings">
        <div class="mobile-nav-icon">⚙️</div>
        <div class="mobile-nav-label">Settings</div>
      </div>
    `;

    // Add event listeners
    this.bottomNav.querySelectorAll('.mobile-nav-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const action = button.dataset.action;
        this.handleNavAction(action);

        // Haptic feedback
        mobileDetector.haptic(10);

        // Update active state
        this.bottomNav.querySelectorAll('.mobile-nav-button').forEach(b => {
          b.classList.remove('active');
        });
        button.classList.add('active');
      });
    });

    document.body.appendChild(this.bottomNav);
  }

  /**
   * Create app drawer
   */
  createAppDrawer() {
    this.appDrawer = document.createElement('div');
    this.appDrawer.id = 'mobile-app-drawer';
    this.appDrawer.innerHTML = `
      <div class="app-drawer-content">
        <div class="app-drawer-header">
          <div class="app-drawer-title">Apps</div>
          <div class="app-drawer-close">×</div>
        </div>
        <div class="app-drawer-grid"></div>
      </div>
    `;

    // Close on background click
    this.appDrawer.addEventListener('click', (e) => {
      if (e.target === this.appDrawer) {
        this.closeAppDrawer();
      }
    });

    // Close button
    this.appDrawer.querySelector('.app-drawer-close').addEventListener('click', () => {
      this.closeAppDrawer();
    });

    document.body.appendChild(this.appDrawer);
    this.populateAppDrawer();
  }

  /**
   * Populate app drawer with apps
   */
  populateAppDrawer() {
    const grid = this.appDrawer.querySelector('.app-drawer-grid');
    const apps = this.kernel.appRegistry?.getRegisteredApps() || [];

    grid.innerHTML = '';

    apps.forEach(app => {
      const item = document.createElement('div');
      item.className = 'app-drawer-item';
      item.innerHTML = `
        <div class="app-drawer-item-icon">${app.icon || '📱'}</div>
        <div class="app-drawer-item-label">${app.name}</div>
      `;

      item.addEventListener('click', () => {
        this.kernel.appRegistry?.launchApp(app.id);
        this.closeAppDrawer();
        mobileDetector.haptic([10, 50, 10]);
      });

      grid.appendChild(item);
    });
  }

  /**
   * Handle navigation actions
   */
  handleNavAction(action) {
    switch (action) {
      case 'home':
        // Close all windows
        const windows = document.querySelectorAll('.window');
        windows.forEach(win => win.remove());
        break;

      case 'apps':
        this.openAppDrawer();
        break;

      case 'recent':
        // TODO: Show recent apps
        console.log('Recent apps');
        break;

      case 'settings':
        this.kernel.appRegistry?.launchApp('settings');
        break;
    }
  }

  /**
   * Open app drawer
   */
  openAppDrawer() {
    this.isAppDrawerOpen = true;
    this.appDrawer.classList.add('open');
    this.populateAppDrawer(); // Refresh apps list
  }

  /**
   * Close app drawer
   */
  closeAppDrawer() {
    this.isAppDrawerOpen = false;
    this.appDrawer.classList.remove('open');
  }

  /**
   * Setup gesture recognition
   */
  setupGestures() {
    this.gestureManager = createGestureManager(document.body);

    // Swipe up from bottom to open app drawer
    this.gestureManager.on('swipeup', (e) => {
      if (e.y > window.innerHeight - 100 && !this.isAppDrawerOpen) {
        this.openAppDrawer();
      }
    });

    // Swipe down to close app drawer
    this.gestureManager.on('swipedown', (e) => {
      if (this.isAppDrawerOpen) {
        this.closeAppDrawer();
      }
    });
  }

  /**
   * Apply mobile optimizations
   */
  applyMobileOptimizations() {
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);

    // Prevent zoom on pinch (except in specific elements)
    document.addEventListener('gesturestart', (e) => {
      if (!e.target.closest('.allow-zoom')) {
        e.preventDefault();
      }
    });

    // Add viewport meta tag for mobile
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

    // Add PWA theme color
    let themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
      themeColor = document.createElement('meta');
      themeColor.name = 'theme-color';
      document.head.appendChild(themeColor);
    }
    themeColor.content = '#0f0f23';
  }

  /**
   * Handle orientation change
   */
  handleOrientationChange(viewport) {
    // Refresh app drawer layout
    if (this.isAppDrawerOpen) {
      this.populateAppDrawer();
    }

    // Emit event for apps to respond
    window.dispatchEvent(new CustomEvent('orientationchange', {
      detail: viewport
    }));
  }

  /**
   * Destroy mobile UI
   */
  destroy() {
    if (this.bottomNav) {
      this.bottomNav.remove();
    }
    if (this.appDrawer) {
      this.appDrawer.remove();
    }
    if (this.gestureManager) {
      this.gestureManager.destroy();
    }
  }
}

export default MobileUI;
