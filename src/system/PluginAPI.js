/**
 * Plugin API
 * Provides a sandboxed API for plugins to interact with the system
 */

export class PluginAPI {
  constructor(pluginId, permissions = [], vfs = null) {
    this.pluginId = pluginId;
    this.permissions = new Set(permissions);
    this.vfs = vfs;
    this.eventListeners = new Map();
    this.intervals = [];
    this.timeouts = [];
  }

  /**
   * File System API
   */
  get fs() {
    const self = this;

    return {
      /**
       * Read file contents
       * @param {string} path - File path
       * @param {string} encoding - File encoding (default: 'utf8')
       * @returns {Promise<string|ArrayBuffer>}
       */
      async readFile(path, encoding = 'utf8') {
        self.requirePermission('filesystem.read');

        if (!self.vfs) {
          throw new Error('File system not available');
        }

        return await self.vfs.readFile(path, encoding);
      },

      /**
       * Write file contents
       * @param {string} path - File path
       * @param {string|ArrayBuffer} data - File data
       * @returns {Promise<void>}
       */
      async writeFile(path, data) {
        self.requirePermission('filesystem.write');

        if (!self.vfs) {
          throw new Error('File system not available');
        }

        return await self.vfs.writeFile(path, data);
      },

      /**
       * Read directory contents
       * @param {string} path - Directory path
       * @returns {Promise<Array>}
       */
      async readdir(path) {
        self.requirePermission('filesystem.read');

        if (!self.vfs) {
          throw new Error('File system not available');
        }

        return await self.vfs.readdir(path);
      },

      /**
       * Create directory
       * @param {string} path - Directory path
       * @param {Object} options - Options
       * @returns {Promise<void>}
       */
      async mkdir(path, options = {}) {
        self.requirePermission('filesystem.write');

        if (!self.vfs) {
          throw new Error('File system not available');
        }

        return await self.vfs.mkdir(path, options);
      },

      /**
       * Delete file
       * @param {string} path - File path
       * @returns {Promise<void>}
       */
      async unlink(path) {
        self.requirePermission('filesystem.write');

        if (!self.vfs) {
          throw new Error('File system not available');
        }

        return await self.vfs.unlink(path);
      },

      /**
       * Check if file/directory exists
       * @param {string} path - File/directory path
       * @returns {Promise<boolean>}
       */
      async exists(path) {
        self.requirePermission('filesystem.read');

        if (!self.vfs) {
          throw new Error('File system not available');
        }

        try {
          await self.vfs.stat(path);
          return true;
        } catch (error) {
          return false;
        }
      },

      /**
       * Get file stats
       * @param {string} path - File path
       * @returns {Promise<Object>}
       */
      async stat(path) {
        self.requirePermission('filesystem.read');

        if (!self.vfs) {
          throw new Error('File system not available');
        }

        return await self.vfs.stat(path);
      }
    };
  }

  /**
   * UI API
   */
  get ui() {
    const self = this;

    return {
      /**
       * Show notification
       * @param {string} message - Notification message
       * @param {Object} options - Notification options
       */
      notify(message, options = {}) {
        self.requirePermission('ui.notifications');

        // Create simple notification
        const notification = document.createElement('div');
        notification.className = 'plugin-notification';
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 10000;
          max-width: 300px;
          font-family: system-ui;
          font-size: 14px;
        `;

        notification.innerHTML = `
          <div style="font-weight: 600; margin-bottom: 5px;">
            ${options.title || 'Plugin Notification'}
          </div>
          <div>${message}</div>
          <div style="margin-top: 8px; font-size: 12px; opacity: 0.7;">
            from ${self.pluginId}
          </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
          notification.style.opacity = '0';
          notification.style.transition = 'opacity 0.3s';
          setTimeout(() => notification.remove(), 300);
        }, options.duration || 3000);

        return notification;
      },

      /**
       * Create widget (placeholder)
       * @param {Object} config - Widget configuration
       */
      createWidget(config) {
        self.requirePermission('ui.widget');

        console.log(`[PluginAPI] createWidget not yet implemented for ${self.pluginId}`);
        return {
          setContent: (html) => console.log('Widget content:', html),
          remove: () => console.log('Widget removed')
        };
      },

      /**
       * Add menu item (placeholder)
       * @param {Object} config - Menu item configuration
       */
      addMenuItem(config) {
        self.requirePermission('ui.menu');

        console.log(`[PluginAPI] addMenuItem not yet implemented for ${self.pluginId}`, config);
        return {
          id: Math.random().toString(36).substr(2, 9),
          remove: () => console.log('Menu item removed')
        };
      },

      /**
       * Show dialog (placeholder)
       * @param {Object} config - Dialog configuration
       */
      showDialog(config) {
        self.requirePermission('ui.dialog');

        return new Promise((resolve) => {
          const result = window.confirm(config.message || 'Plugin dialog');
          resolve(result);
        });
      }
    };
  }

  /**
   * Network API
   */
  get network() {
    const self = this;

    return {
      /**
       * Fetch URL
       * @param {string} url - URL to fetch
       * @param {Object} options - Fetch options
       * @returns {Promise<Response>}
       */
      async fetch(url, options = {}) {
        self.requirePermission('network.fetch');

        // Add plugin identifier to headers
        options.headers = {
          ...options.headers,
          'X-WebOS-Plugin': self.pluginId
        };

        return await fetch(url, options);
      },

      /**
       * Create WebSocket connection
       * @param {string} url - WebSocket URL
       * @returns {WebSocket}
       */
      ws(url) {
        self.requirePermission('network.websocket');

        return new WebSocket(url);
      }
    };
  }

  /**
   * Storage API (plugin-specific)
   */
  get storage() {
    const self = this;
    const storageKey = `plugin.${self.pluginId}`;

    return {
      /**
       * Get value from storage
       * @param {string} key - Storage key
       * @returns {Promise<any>}
       */
      async get(key) {
        const data = localStorage.getItem(storageKey);
        const storage = data ? JSON.parse(data) : {};
        return storage[key];
      },

      /**
       * Set value in storage
       * @param {string} key - Storage key
       * @param {any} value - Value to store
       * @returns {Promise<void>}
       */
      async set(key, value) {
        const data = localStorage.getItem(storageKey);
        const storage = data ? JSON.parse(data) : {};
        storage[key] = value;
        localStorage.setItem(storageKey, JSON.stringify(storage));
      },

      /**
       * Delete value from storage
       * @param {string} key - Storage key
       * @returns {Promise<void>}
       */
      async delete(key) {
        const data = localStorage.getItem(storageKey);
        const storage = data ? JSON.parse(data) : {};
        delete storage[key];
        localStorage.setItem(storageKey, JSON.stringify(storage));
      },

      /**
       * Clear all storage
       * @returns {Promise<void>}
       */
      async clear() {
        localStorage.removeItem(storageKey);
      },

      /**
       * Get all keys
       * @returns {Promise<Array<string>>}
       */
      async keys() {
        const data = localStorage.getItem(storageKey);
        const storage = data ? JSON.parse(data) : {};
        return Object.keys(storage);
      },

      /**
       * Get all storage data
       * @returns {Promise<Object>}
       */
      async getAll() {
        const data = localStorage.getItem(storageKey);
        return data ? JSON.parse(data) : {};
      }
    };
  }

  /**
   * Lifecycle hooks
   */
  get hooks() {
    const self = this;

    return {
      /**
       * Hook into app launch
       * @param {Function} callback - Callback function
       */
      onAppLaunch(callback) {
        self.requirePermission('hooks.app');
        self.addEventListener('app-launch', callback);
      },

      /**
       * Hook into app close
       * @param {Function} callback - Callback function
       */
      onAppClose(callback) {
        self.requirePermission('hooks.app');
        self.addEventListener('app-close', callback);
      },

      /**
       * Hook into file open
       * @param {Function} callback - Callback function
       */
      onFileOpen(callback) {
        self.requirePermission('hooks.file');
        self.addEventListener('file-open', callback);
      },

      /**
       * Hook into file save
       * @param {Function} callback - Callback function
       */
      onFileSave(callback) {
        self.requirePermission('hooks.file');
        self.addEventListener('file-save', callback);
      }
    };
  }

  /**
   * Timers
   */
  get timers() {
    const self = this;

    return {
      /**
       * Set timeout
       * @param {Function} callback - Callback function
       * @param {number} delay - Delay in ms
       * @returns {number} Timer ID
       */
      setTimeout(callback, delay) {
        const id = setTimeout(callback, delay);
        self.timeouts.push(id);
        return id;
      },

      /**
       * Set interval
       * @param {Function} callback - Callback function
       * @param {number} delay - Delay in ms
       * @returns {number} Timer ID
       */
      setInterval(callback, delay) {
        const id = setInterval(callback, delay);
        self.intervals.push(id);
        return id;
      },

      /**
       * Clear timeout
       * @param {number} id - Timer ID
       */
      clearTimeout(id) {
        clearTimeout(id);
        const index = self.timeouts.indexOf(id);
        if (index > -1) {
          self.timeouts.splice(index, 1);
        }
      },

      /**
       * Clear interval
       * @param {number} id - Timer ID
       */
      clearInterval(id) {
        clearInterval(id);
        const index = self.intervals.indexOf(id);
        if (index > -1) {
          self.intervals.splice(index, 1);
        }
      }
    };
  }

  /**
   * Check if plugin has permission
   * @param {string} permission - Permission to check
   * @throws {Error} If permission not granted
   */
  requirePermission(permission) {
    if (!this.permissions.has(permission)) {
      throw new Error(
        `Plugin ${this.pluginId} does not have permission: ${permission}`
      );
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event (internal use)
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[PluginAPI] Event callback error:`, error);
        }
      });
    }
  }

  /**
   * Clean up plugin resources
   */
  cleanup() {
    // Clear all timers
    this.timeouts.forEach(id => clearTimeout(id));
    this.intervals.forEach(id => clearInterval(id));
    this.timeouts = [];
    this.intervals = [];

    // Clear event listeners
    this.eventListeners.clear();

    console.log(`[PluginAPI] Cleaned up resources for ${this.pluginId}`);
  }
}

export default PluginAPI;
