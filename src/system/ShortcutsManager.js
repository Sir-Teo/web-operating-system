/**
 * ShortcutsManager - System-wide keyboard shortcuts manager
 * Allows users to customize and manage keyboard shortcuts
 */
export class ShortcutsManager {
  constructor(kernel) {
    this.kernel = kernel;
    this.shortcuts = new Map();
    this.isEnabled = true;

    this._init();
  }

  async _init() {
    await this._loadShortcuts();
    this._registerDefaultShortcuts();
    this._setupEventListener();
  }

  /**
   * Register default system shortcuts
   */
  _registerDefaultShortcuts() {
    const defaults = [
      // Window management
      {
        id: 'snap-left',
        name: 'Snap Window Left',
        keys: 'Ctrl+Alt+ArrowLeft',
        action: async () => {
          const { default: WindowManager } = await import('../ui/WindowManager.js');
          const activeWindow = WindowManager.getActiveWindow();
          if (activeWindow) {
            WindowManager.snapWindow(activeWindow.id, 'left');
          }
        }
      },
      {
        id: 'snap-right',
        name: 'Snap Window Right',
        keys: 'Ctrl+Alt+ArrowRight',
        action: async () => {
          const { default: WindowManager } = await import('../ui/WindowManager.js');
          const activeWindow = WindowManager.getActiveWindow();
          if (activeWindow) {
            WindowManager.snapWindow(activeWindow.id, 'right');
          }
        }
      },
      {
        id: 'maximize',
        name: 'Maximize Window',
        keys: 'Ctrl+Alt+ArrowUp',
        action: async () => {
          const { default: WindowManager } = await import('../ui/WindowManager.js');
          const activeWindow = WindowManager.getActiveWindow();
          if (activeWindow) {
            WindowManager.maximizeWindow(activeWindow.id);
          }
        }
      },
      {
        id: 'minimize',
        name: 'Minimize Window',
        keys: 'Ctrl+Alt+ArrowDown',
        action: async () => {
          const { default: WindowManager } = await import('../ui/WindowManager.js');
          const activeWindow = WindowManager.getActiveWindow();
          if (activeWindow) {
            WindowManager.minimizeWindow(activeWindow.id);
          }
        }
      },
      {
        id: 'close-window',
        name: 'Close Window',
        keys: 'Alt+F4',
        action: async () => {
          const { default: WindowManager } = await import('../ui/WindowManager.js');
          const activeWindow = WindowManager.getActiveWindow();
          if (activeWindow) {
            WindowManager.closeWindow(activeWindow.id);
          }
        }
      },

      // Global search
      {
        id: 'global-search',
        name: 'Global Search',
        keys: 'Ctrl+Space',
        action: async () => {
          const { getGlobalSearch } = await import('./GlobalSearch.js');
          const search = getGlobalSearch();
          if (search) {
            search.toggle();
          }
        }
      },

      // Quick actions
      {
        id: 'quick-actions',
        name: 'Quick Actions',
        keys: 'Ctrl+Shift+A',
        action: async () => {
          const { getQuickActionsPanel } = await import('./QuickActionsPanel.js');
          const panel = getQuickActionsPanel();
          if (panel) {
            panel.toggle();
          }
        }
      },

      // Notification center
      {
        id: 'notifications',
        name: 'Notification Center',
        keys: 'Ctrl+Shift+N',
        action: async () => {
          const { getNotificationCenter } = await import('./NotificationCenter.js');
          const center = getNotificationCenter();
          if (center) {
            center.toggleCenter();
          }
        }
      },

      // Screenshots
      {
        id: 'screenshot-full',
        name: 'Screenshot Full Screen',
        keys: 'Ctrl+Shift+PrintScreen',
        action: async () => {
          const { getScreenCapture } = await import('./ScreenCapture.js');
          const capture = getScreenCapture();
          if (capture) {
            await capture.captureFullScreen();
          }
        }
      },
      {
        id: 'screenshot-selection',
        name: 'Screenshot Selection',
        keys: 'Ctrl+Shift+S',
        action: async () => {
          const { getScreenCapture } = await import('./ScreenCapture.js');
          const capture = getScreenCapture();
          if (capture) {
            await capture.captureSelection();
          }
        }
      },

      // Applications
      {
        id: 'open-terminal',
        name: 'Open Terminal',
        keys: 'Ctrl+Alt+T',
        action: async () => {
          const { default: AppRegistry } = await import('../apps/AppRegistry.js');
          await AppRegistry.launchApp('terminal');
        }
      },
      {
        id: 'open-file-manager',
        name: 'Open File Manager',
        keys: 'Ctrl+Alt+F',
        action: async () => {
          const { default: AppRegistry } = await import('../apps/AppRegistry.js');
          await AppRegistry.launchApp('file-manager');
        }
      },

      // System
      {
        id: 'lock-screen',
        name: 'Lock Screen',
        keys: 'Ctrl+Alt+L',
        action: () => {
          if (this.kernel.userManager) {
            this.kernel.userManager.lockScreen();
          }
        }
      },
      {
        id: 'show-desktop',
        name: 'Show Desktop',
        keys: 'Ctrl+Alt+D',
        action: async () => {
          const { default: WindowManager } = await import('../ui/WindowManager.js');
          WindowManager.minimizeAll();
        }
      }
    ];

    defaults.forEach(shortcut => {
      if (!this.shortcuts.has(shortcut.id)) {
        this.shortcuts.set(shortcut.id, shortcut);
      }
    });
  }

  /**
   * Setup keyboard event listener
   */
  _setupEventListener() {
    document.addEventListener('keydown', (e) => {
      if (!this.isEnabled) return;

      const pressedKeys = this._getKeyCombo(e);

      // Find matching shortcut
      for (const [id, shortcut] of this.shortcuts) {
        if (shortcut.keys === pressedKeys && shortcut.enabled !== false) {
          e.preventDefault();
          e.stopPropagation();

          if (shortcut.action) {
            shortcut.action();
          }

          break;
        }
      }
    });
  }

  /**
   * Get key combination string from event
   */
  _getKeyCombo(event) {
    const keys = [];

    if (event.ctrlKey) keys.push('Ctrl');
    if (event.altKey) keys.push('Alt');
    if (event.shiftKey) keys.push('Shift');
    if (event.metaKey) keys.push('Meta');

    // Add the actual key
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
      keys.push(event.key);
    }

    return keys.join('+');
  }

  /**
   * Register a custom shortcut
   * @param {Object} shortcut - Shortcut configuration
   */
  registerShortcut(shortcut) {
    if (!shortcut.id || !shortcut.keys || !shortcut.action) {
      throw new Error('Invalid shortcut configuration');
    }

    this.shortcuts.set(shortcut.id, {
      ...shortcut,
      enabled: shortcut.enabled !== false
    });

    this._saveShortcuts();
  }

  /**
   * Unregister a shortcut
   * @param {string} shortcutId
   */
  unregisterShortcut(shortcutId) {
    this.shortcuts.delete(shortcutId);
    this._saveShortcuts();
  }

  /**
   * Update a shortcut
   * @param {string} shortcutId
   * @param {Object} updates
   */
  updateShortcut(shortcutId, updates) {
    const shortcut = this.shortcuts.get(shortcutId);
    if (!shortcut) {
      throw new Error('Shortcut not found');
    }

    this.shortcuts.set(shortcutId, {
      ...shortcut,
      ...updates
    });

    this._saveShortcuts();
  }

  /**
   * Enable a shortcut
   * @param {string} shortcutId
   */
  enableShortcut(shortcutId) {
    this.updateShortcut(shortcutId, { enabled: true });
  }

  /**
   * Disable a shortcut
   * @param {string} shortcutId
   */
  disableShortcut(shortcutId) {
    this.updateShortcut(shortcutId, { enabled: false });
  }

  /**
   * Get all shortcuts
   * @returns {Array} List of shortcuts
   */
  getAllShortcuts() {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get shortcut by ID
   * @param {string} shortcutId
   * @returns {Object} Shortcut configuration
   */
  getShortcut(shortcutId) {
    return this.shortcuts.get(shortcutId);
  }

  /**
   * Enable shortcuts manager
   */
  enable() {
    this.isEnabled = true;
  }

  /**
   * Disable shortcuts manager
   */
  disable() {
    this.isEnabled = false;
  }

  /**
   * Reset to default shortcuts
   */
  resetToDefaults() {
    this.shortcuts.clear();
    this._registerDefaultShortcuts();
    this._saveShortcuts();
  }

  /**
   * Save shortcuts to storage
   */
  async _saveShortcuts() {
    try {
      const shortcutsArray = Array.from(this.shortcuts.entries()).map(([id, shortcut]) => ({
        id,
        name: shortcut.name,
        keys: shortcut.keys,
        enabled: shortcut.enabled,
        category: shortcut.category
      }));

      await this.kernel.fs.writeFile(
        '/home/.config/shortcuts.json',
        JSON.stringify(shortcutsArray, null, 2)
      );
    } catch (error) {
      console.warn('Failed to save shortcuts:', error);
    }
  }

  /**
   * Load shortcuts from storage
   */
  async _loadShortcuts() {
    try {
      const data = await this.kernel.fs.readFile('/home/.config/shortcuts.json');
      const shortcutsArray = JSON.parse(data);

      shortcutsArray.forEach(shortcut => {
        if (shortcut.id && shortcut.keys) {
          // Only load configuration, actions will be set by _registerDefaultShortcuts
          this.shortcuts.set(shortcut.id, shortcut);
        }
      });
    } catch (error) {
      // No saved shortcuts - use defaults
    }
  }
}

// Export singleton
let shortcutsManagerInstance = null;

export function initShortcutsManager(kernel) {
  if (!shortcutsManagerInstance) {
    shortcutsManagerInstance = new ShortcutsManager(kernel);
  }
  return shortcutsManagerInstance;
}

export function getShortcutsManager() {
  return shortcutsManagerInstance;
}
