/**
 * Plugin Manager
 * High-level wrapper for plugin system integration with Kernel
 */

import PluginLoader from '../PluginLoader.js';

export class PluginManager {
  constructor(kernel) {
    this.kernel = kernel;
    this.loader = new PluginLoader(kernel.vfs);
    this.autoLoadEnabled = true;

    // Legacy support - keep for backward compatibility
    this.plugins = new Map();
    this.hooks = new Map();
    this.loadedPlugins = new Set();
  }

  /**
   * Register a plugin
   * @param {Object} plugin - Plugin object
   */
  async registerPlugin(plugin) {
    if (!plugin.id || !plugin.name) {
      throw new Error('Plugin must have id and name');
    }

    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} is already registered`);
    }

    // Validate plugin
    this.validatePlugin(plugin);

    // Store plugin
    this.plugins.set(plugin.id, {
      ...plugin,
      enabled: false,
      loaded: false,
      error: null
    });

    console.log(`Plugin registered: ${plugin.name} (${plugin.id})`);
  }

  /**
   * Validate plugin structure
   * @param {Object} plugin - Plugin to validate
   */
  validatePlugin(plugin) {
    const required = ['id', 'name', 'version', 'init'];

    for (const field of required) {
      if (!plugin[field]) {
        throw new Error(`Plugin missing required field: ${field}`);
      }
    }

    if (typeof plugin.init !== 'function') {
      throw new Error('Plugin init must be a function');
    }

    // Check permissions
    if (plugin.permissions) {
      if (!Array.isArray(plugin.permissions)) {
        throw new Error('Plugin permissions must be an array');
      }
    }
  }

  /**
   * Load a plugin
   * @param {string} pluginId - Plugin ID
   */
  async loadPlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    if (plugin.loaded) {
      console.log(`Plugin already loaded: ${pluginId}`);
      return;
    }

    try {
      // Create plugin context
      const context = this.createPluginContext(plugin);

      // Initialize plugin
      await plugin.init(context);

      // Mark as loaded
      plugin.loaded = true;
      plugin.enabled = true;
      plugin.error = null;
      this.loadedPlugins.add(pluginId);

      console.log(`Plugin loaded: ${plugin.name}`);

      // Trigger hook
      await this.triggerHook('plugin:loaded', { pluginId, plugin });

    } catch (error) {
      console.error(`Error loading plugin ${pluginId}:`, error);
      plugin.error = error.message;
      throw error;
    }
  }

  /**
   * Unload a plugin
   * @param {string} pluginId - Plugin ID
   */
  async unloadPlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    if (!plugin.loaded) {
      return;
    }

    try {
      // Call cleanup if available
      if (plugin.cleanup && typeof plugin.cleanup === 'function') {
        await plugin.cleanup();
      }

      plugin.loaded = false;
      plugin.enabled = false;
      this.loadedPlugins.delete(pluginId);

      console.log(`Plugin unloaded: ${plugin.name}`);

      // Trigger hook
      await this.triggerHook('plugin:unloaded', { pluginId, plugin });

    } catch (error) {
      console.error(`Error unloading plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Enable a plugin
   * @param {string} pluginId - Plugin ID
   */
  async enablePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    if (!plugin.loaded) {
      await this.loadPlugin(pluginId);
    } else {
      plugin.enabled = true;
    }

    this.savePluginState();
  }

  /**
   * Disable a plugin
   * @param {string} pluginId - Plugin ID
   */
  async disablePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    plugin.enabled = false;
    this.savePluginState();
  }

  /**
   * Create plugin context
   * @param {Object} plugin - Plugin object
   * @returns {Object} Plugin context
   */
  createPluginContext(plugin) {
    return {
      // Plugin info
      pluginId: plugin.id,
      pluginName: plugin.name,

      // System access
      kernel: this.kernel,
      vfs: this.kernel.vfs,

      // Plugin API
      registerHook: (hookName, callback) => {
        this.registerHook(hookName, plugin.id, callback);
      },

      unregisterHook: (hookName) => {
        this.unregisterHook(hookName, plugin.id);
      },

      triggerHook: (hookName, data) => {
        return this.triggerHook(hookName, data);
      },

      // Utility functions
      log: (...args) => {
        console.log(`[${plugin.name}]`, ...args);
      },

      error: (...args) => {
        console.error(`[${plugin.name}]`, ...args);
      },

      // Storage
      getStorage: () => {
        return this.getPluginStorage(plugin.id);
      },

      setStorage: (data) => {
        return this.setPluginStorage(plugin.id, data);
      }
    };
  }

  /**
   * Register a hook
   * @param {string} hookName - Hook name
   * @param {string} pluginId - Plugin ID
   * @param {Function} callback - Callback function
   */
  registerHook(hookName, pluginId, callback) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    this.hooks.get(hookName).push({
      pluginId,
      callback
    });

    console.log(`Hook registered: ${hookName} by ${pluginId}`);
  }

  /**
   * Unregister a hook
   * @param {string} hookName - Hook name
   * @param {string} pluginId - Plugin ID
   */
  unregisterHook(hookName, pluginId) {
    if (!this.hooks.has(hookName)) {
      return;
    }

    const hooks = this.hooks.get(hookName);
    this.hooks.set(
      hookName,
      hooks.filter(h => h.pluginId !== pluginId)
    );
  }

  /**
   * Trigger a hook
   * @param {string} hookName - Hook name
   * @param {*} data - Data to pass to hooks
   */
  async triggerHook(hookName, data) {
    if (!this.hooks.has(hookName)) {
      return data;
    }

    const hooks = this.hooks.get(hookName);
    let result = data;

    for (const hook of hooks) {
      const plugin = this.plugins.get(hook.pluginId);
      if (!plugin || !plugin.enabled) {
        continue;
      }

      try {
        const hookResult = await hook.callback(result);
        if (hookResult !== undefined) {
          result = hookResult;
        }
      } catch (error) {
        console.error(`Error in hook ${hookName} from ${hook.pluginId}:`, error);
      }
    }

    return result;
  }

  /**
   * Get plugin storage
   * @param {string} pluginId - Plugin ID
   * @returns {Object} Plugin storage data
   */
  getPluginStorage(pluginId) {
    try {
      const key = `plugin-storage-${pluginId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error(`Error getting storage for ${pluginId}:`, error);
      return {};
    }
  }

  /**
   * Set plugin storage
   * @param {string} pluginId - Plugin ID
   * @param {Object} data - Data to store
   */
  setPluginStorage(pluginId, data) {
    try {
      const key = `plugin-storage-${pluginId}`;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error setting storage for ${pluginId}:`, error);
    }
  }

  /**
   * Get all plugins
   * @returns {Array} All plugins
   */
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  /**
   * Get loaded plugins
   * @returns {Array} Loaded plugins
   */
  getLoadedPlugins() {
    return this.getAllPlugins().filter(p => p.loaded);
  }

  /**
   * Get enabled plugins
   * @returns {Array} Enabled plugins
   */
  getEnabledPlugins() {
    return this.getAllPlugins().filter(p => p.enabled);
  }

  /**
   * Check if plugin is loaded
   * @param {string} pluginId - Plugin ID
   * @returns {boolean} True if loaded
   */
  isPluginLoaded(pluginId) {
    return this.loadedPlugins.has(pluginId);
  }

  /**
   * Save plugin state
   */
  savePluginState() {
    try {
      const state = {};
      this.plugins.forEach((plugin, id) => {
        state[id] = {
          enabled: plugin.enabled
        };
      });

      localStorage.setItem('webos-plugin-state', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving plugin state:', error);
    }
  }

  /**
   * Load plugin state
   */
  loadPluginState() {
    try {
      const stored = localStorage.getItem('webos-plugin-state');
      if (stored) {
        const state = JSON.parse(stored);
        Object.entries(state).forEach(([id, pluginState]) => {
          const plugin = this.plugins.get(id);
          if (plugin) {
            plugin.enabled = pluginState.enabled;
          }
        });
      }
    } catch (error) {
      console.error('Error loading plugin state:', error);
    }
  }

  /**
   * Load all enabled plugins
   */
  async loadEnabledPlugins() {
    try {
      // Initialize if not already done
      await this.loader.init();

      // Get list of enabled plugins from config
      const enabledPlugins = await this.getEnabledPluginsList();

      console.log(`[PluginManager] Loading ${enabledPlugins.length} enabled plugins...`);

      // Load and activate each enabled plugin
      for (const pluginId of enabledPlugins) {
        try {
          console.log(`[PluginManager] Loading plugin: ${pluginId}`);
          await this.loader.loadPlugin(pluginId);
          await this.loader.activatePlugin(pluginId);
        } catch (error) {
          console.error(`[PluginManager] Failed to load plugin ${pluginId}:`, error);
        }
      }

      console.log('[PluginManager] Enabled plugins loaded');

      // Also load legacy plugins
      this.loadPluginState();
      const legacyPlugins = this.getAllPlugins().filter(p => p.enabled);
      for (const plugin of legacyPlugins) {
        try {
          await this.loadPlugin(plugin.id);
        } catch (error) {
          console.error(`Failed to load legacy plugin ${plugin.id}:`, error);
        }
      }
    } catch (error) {
      console.error('[PluginManager] Error loading enabled plugins:', error);
      // Don't throw - allow system to continue even if plugins fail to load
    }
  }

  /**
   * Get list of enabled plugins from storage
   * @returns {Promise<Array<string>>} Array of plugin IDs
   */
  async getEnabledPluginsList() {
    try {
      const configPath = '/home/user/.config/plugins.json';
      const data = await this.kernel.vfs.readFile(configPath, 'utf8');
      const config = JSON.parse(data);
      return config.enabled || [];
    } catch (error) {
      // No config file or error reading it - return empty array
      return [];
    }
  }

  /**
   * Save enabled plugins list
   * @param {Array<string>} pluginIds - Array of plugin IDs
   */
  async saveEnabledPluginsList(pluginIds) {
    try {
      const configPath = '/home/user/.config/plugins.json';
      const config = { enabled: pluginIds };

      // Ensure config directory exists
      await this.kernel.vfs.mkdir('/home/user/.config', { recursive: true }).catch(() => {});

      await this.kernel.vfs.writeFile(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('[PluginManager] Failed to save plugins config:', error);
      throw error;
    }
  }

  /**
   * List installed file-system plugins
   * @returns {Promise<Array<string>>} Array of plugin IDs
   */
  async listInstalledPlugins() {
    return await this.loader.listInstalledPlugins();
  }

  /**
   * Install plugin from URL
   * @param {string} url - Plugin URL
   */
  async installPluginFromUrl(url) {
    try {
      const response = await fetch(url);
      const code = await response.text();

      // Create plugin module
      const module = new Function('exports', code);
      const exports = {};
      module(exports);

      if (!exports.default) {
        throw new Error('Plugin must export default');
      }

      const plugin = exports.default;
      await this.registerPlugin(plugin);

      return plugin.id;
    } catch (error) {
      console.error('Error installing plugin:', error);
      throw error;
    }
  }

  /**
   * Uninstall plugin
   * @param {string} pluginId - Plugin ID
   */
  async uninstallPlugin(pluginId) {
    await this.unloadPlugin(pluginId);
    this.plugins.delete(pluginId);
    this.savePluginState();
  }
}

export default PluginManager;
