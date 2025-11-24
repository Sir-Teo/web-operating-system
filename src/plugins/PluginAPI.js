/**
 * PluginAPI - Sandboxed API Surface for Plugins
 *
 * Provides controlled access to system features:
 * - File system operations
 * - UI manipulation
 * - Event system
 * - Storage
 * - Network (with restrictions)
 */

import EventEmitter from '../utils/EventEmitter.js';
import VFS from '../filesystem/VFS.js';
import WindowManager from '../ui/WindowManager.js';

class PluginAPI extends EventEmitter {
  constructor() {
    super();
    this.sandboxes = new Map();

    console.log('[PluginAPI] Initialized');
  }

  /**
   * Create a sandboxed API for a plugin
   */
  createSandbox(manifest) {
    const sandbox = {
      // Plugin metadata
      plugin: {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        permissions: manifest.permissions || []
      },

      // File System API
      fs: this._createFileSystemAPI(manifest),

      // UI API
      ui: this._createUIAPI(manifest),

      // Storage API
      storage: this._createStorageAPI(manifest),

      // Network API
      network: this._createNetworkAPI(manifest),

      // Events API
      events: this._createEventsAPI(manifest),

      // Utility API
      utils: this._createUtilsAPI(manifest)
    };

    this.sandboxes.set(manifest.id, sandbox);

    console.log('[PluginAPI] Sandbox created for:', manifest.id);

    return sandbox;
  }

  /**
   * Create File System API
   */
  _createFileSystemAPI(manifest) {
    const hasPermission = (manifest.permissions || []).includes('filesystem');

    return {
      async readFile(path) {
        if (!hasPermission) {
          throw new Error('Permission denied: filesystem');
        }
        return await VFS.readFile(path);
      },

      async writeFile(path, content) {
        if (!hasPermission) {
          throw new Error('Permission denied: filesystem');
        }
        // Restrict to plugin directory
        const pluginDir = `/plugins/${manifest.id}`;
        if (!path.startsWith(pluginDir)) {
          throw new Error('Access denied: outside plugin directory');
        }
        return await VFS.writeFile(path, content);
      },

      async listFiles(path) {
        if (!hasPermission) {
          throw new Error('Permission denied: filesystem');
        }
        return await VFS.readdir(path);
      },

      async deleteFile(path) {
        if (!hasPermission) {
          throw new Error('Permission denied: filesystem');
        }
        const pluginDir = `/plugins/${manifest.id}`;
        if (!path.startsWith(pluginDir)) {
          throw new Error('Access denied: outside plugin directory');
        }
        return await VFS.unlink(path);
      }
    };
  }

  /**
   * Create UI API
   */
  _createUIAPI(manifest) {
    const hasPermission = (manifest.permissions || []).includes('ui');

    return {
      createWindow(options) {
        if (!hasPermission) {
          throw new Error('Permission denied: ui');
        }

        const { windowId, winbox } = WindowManager.createWindow({
          title: options.title || manifest.name,
          width: options.width || 600,
          height: options.height || 400,
          ...options
        });

        return { windowId, winbox };
      },

      closeWindow(windowId) {
        if (!hasPermission) {
          throw new Error('Permission denied: ui');
        }
        WindowManager.closeWindow(windowId);
      },

      showNotification(message, options = {}) {
        if (!hasPermission) {
          throw new Error('Permission denied: ui');
        }

        // Use browser notification API
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(manifest.name, {
            body: message,
            ...options
          });
        }
      },

      addMenuItem(menu) {
        if (!hasPermission) {
          throw new Error('Permission denied: ui');
        }

        // Add menu item to start menu
        const event = new CustomEvent('plugin-menu-add', {
          detail: {
            pluginId: manifest.id,
            menu
          }
        });

        document.dispatchEvent(event);
      },

      removeMenuItem(menuId) {
        if (!hasPermission) {
          throw new Error('Permission denied: ui');
        }

        const event = new CustomEvent('plugin-menu-remove', {
          detail: {
            pluginId: manifest.id,
            menuId
          }
        });

        document.dispatchEvent(event);
      }
    };
  }

  /**
   * Create Storage API
   */
  _createStorageAPI(manifest) {
    const prefix = `plugin_${manifest.id}_`;

    return {
      async get(key) {
        const value = localStorage.getItem(prefix + key);
        return value ? JSON.parse(value) : null;
      },

      async set(key, value) {
        localStorage.setItem(prefix + key, JSON.stringify(value));
      },

      async remove(key) {
        localStorage.removeItem(prefix + key);
      },

      async clear() {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
        keys.forEach(k => localStorage.removeItem(k));
      },

      async keys() {
        return Object.keys(localStorage)
          .filter(k => k.startsWith(prefix))
          .map(k => k.substring(prefix.length));
      }
    };
  }

  /**
   * Create Network API
   */
  _createNetworkAPI(manifest) {
    const hasPermission = (manifest.permissions || []).includes('network');

    return {
      async fetch(url, options = {}) {
        if (!hasPermission) {
          throw new Error('Permission denied: network');
        }

        // Check if URL is in allowed domains
        if (manifest.allowedDomains) {
          const urlObj = new URL(url);
          const allowed = manifest.allowedDomains.some(domain => {
            return urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain);
          });

          if (!allowed) {
            throw new Error('Access denied: domain not in allowlist');
          }
        }

        return await fetch(url, options);
      },

      async request(url, options = {}) {
        if (!hasPermission) {
          throw new Error('Permission denied: network');
        }

        const response = await this.fetch(url, options);
        return await response.json();
      }
    };
  }

  /**
   * Create Events API
   */
  _createEventsAPI(manifest) {
    const eventEmitter = new EventEmitter();

    return {
      on(event, handler) {
        eventEmitter.on(event, handler);
      },

      off(event, handler) {
        eventEmitter.off(event, handler);
      },

      emit(event, data) {
        eventEmitter.emit(event, data);
      },

      once(event, handler) {
        eventEmitter.once(event, handler);
      }
    };
  }

  /**
   * Create Utils API
   */
  _createUtilsAPI(manifest) {
    return {
      log(...args) {
        console.log(`[${manifest.id}]`, ...args);
      },

      warn(...args) {
        console.warn(`[${manifest.id}]`, ...args);
      },

      error(...args) {
        console.error(`[${manifest.id}]`, ...args);
      },

      setTimeout(callback, delay) {
        return setTimeout(callback, delay);
      },

      clearTimeout(id) {
        clearTimeout(id);
      },

      setInterval(callback, delay) {
        return setInterval(callback, delay);
      },

      clearInterval(id) {
        clearInterval(id);
      },

      uuid() {
        return crypto.randomUUID();
      },

      now() {
        return Date.now();
      }
    };
  }

  /**
   * Destroy sandbox
   */
  destroySandbox(pluginId) {
    if (this.sandboxes.has(pluginId)) {
      this.sandboxes.delete(pluginId);
      console.log('[PluginAPI] Sandbox destroyed for:', pluginId);
    }
  }

  /**
   * Get sandbox
   */
  getSandbox(pluginId) {
    return this.sandboxes.get(pluginId);
  }
}

export default PluginAPI;
