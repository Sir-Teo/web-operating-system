/**
 * Plugin Loader
 * Manages plugin lifecycle: load, activate, deactivate, unload
 */

import PluginManifest from './PluginManifest.js';
import PluginSandbox from './PluginSandbox.js';
import PluginAPI from './PluginAPI.js';

export class PluginLoader {
  constructor(vfs) {
    this.vfs = vfs;
    this.loadedPlugins = new Map();
    this.pluginDir = '/home/user/.webos/plugins';
    this.version = '2.6.0'; // Current WebOS version
  }

  /**
   * Initialize plugin system
   */
  async init() {
    try {
      // Ensure plugin directory exists
      await this.vfs.mkdir(this.pluginDir, { recursive: true }).catch(() => {});

      console.log('[PluginLoader] Initialized');
    } catch (error) {
      console.error('[PluginLoader] Initialization failed:', error);
    }
  }

  /**
   * Load a plugin from directory
   * @param {string} pluginId - Plugin ID
   * @returns {Promise<Object>} Plugin instance
   */
  async loadPlugin(pluginId) {
    try {
      console.log(`[PluginLoader] Loading plugin: ${pluginId}`);

      // Check if already loaded
      if (this.loadedPlugins.has(pluginId)) {
        console.warn(`[PluginLoader] Plugin ${pluginId} already loaded`);
        return this.loadedPlugins.get(pluginId);
      }

      // 1. Read manifest
      const manifestPath = `${this.pluginDir}/${pluginId}/plugin.json`;
      let manifestData;

      try {
        manifestData = await this.vfs.readFile(manifestPath, 'utf8');
      } catch (error) {
        throw new Error(`Failed to read manifest: ${error.message}`);
      }

      const manifest = JSON.parse(manifestData);

      // 2. Validate manifest
      const validation = PluginManifest.validate(manifest);
      if (!validation.valid) {
        throw new Error(`Invalid manifest: ${validation.errors.join(', ')}`);
      }

      // 3. Check version compatibility
      if (manifest.engines && manifest.engines.webos) {
        if (!PluginManifest.isVersionCompatible(manifest.engines.webos, this.version)) {
          throw new Error(
            `Plugin requires WebOS ${manifest.engines.webos}, but current version is ${this.version}`
          );
        }
      }

      // 4. Load dependencies
      if (manifest.dependencies) {
        await this.loadDependencies(manifest.dependencies);
      }

      // 5. Create sandbox
      const sandbox = new PluginSandbox(manifest.permissions || []);

      // 6. Load plugin code
      const pluginCodePath = `${this.pluginDir}/${pluginId}/${manifest.main}`;
      let pluginCode;

      try {
        pluginCode = await this.vfs.readFile(pluginCodePath, 'utf8');
      } catch (error) {
        throw new Error(`Failed to read plugin code: ${error.message}`);
      }

      // 7. Execute in sandbox
      const PluginClass = await this.executeInSandbox(pluginCode, sandbox);

      // 8. Create plugin API instance
      const api = new PluginAPI(pluginId, manifest.permissions || [], this.vfs);

      // 9. Instantiate plugin
      let pluginInstance;
      try {
        pluginInstance = new PluginClass(api);
      } catch (error) {
        throw new Error(`Failed to instantiate plugin: ${error.message}`);
      }

      // 10. Store reference
      const pluginData = {
        id: pluginId,
        manifest,
        instance: pluginInstance,
        sandbox,
        api,
        enabled: false,
        loadedAt: new Date()
      };

      this.loadedPlugins.set(pluginId, pluginData);

      console.log(`[PluginLoader] Plugin ${pluginId} loaded successfully`);
      return pluginData;

    } catch (error) {
      console.error(`[PluginLoader] Failed to load plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Execute plugin code in sandbox
   * @param {string} code - Plugin code
   * @param {PluginSandbox} sandbox - Sandbox instance
   * @returns {Promise<Function>} Plugin class
   */
  async executeInSandbox(code, sandbox) {
    try {
      // Create isolated scope
      const module = { exports: {} };
      const exports = module.exports;

      // Simple require function for future use
      const require = (moduleName) => {
        throw new Error(`Module '${moduleName}' not found. External dependencies not yet supported.`);
      };

      // Execute code in controlled environment
      // Note: Using Function constructor for basic isolation
      // In production, consider using Web Workers or iframes for stronger isolation
      const fn = new Function('module', 'exports', 'require', code);
      fn(module, exports, require);

      // Return the plugin class
      const PluginClass = module.exports.default || module.exports;

      if (typeof PluginClass !== 'function') {
        throw new Error('Plugin must export a class or constructor function');
      }

      return PluginClass;

    } catch (error) {
      console.error('[PluginLoader] Sandbox execution error:', error);
      throw new Error(`Plugin execution failed: ${error.message}`);
    }
  }

  /**
   * Activate a plugin
   * @param {string} pluginId - Plugin ID
   */
  async activatePlugin(pluginId) {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not loaded`);
    }

    if (plugin.enabled) {
      console.warn(`[PluginLoader] Plugin ${pluginId} already activated`);
      return;
    }

    try {
      // Call activate hook if it exists
      if (plugin.instance.activate && typeof plugin.instance.activate === 'function') {
        await plugin.instance.activate();
      }

      plugin.enabled = true;
      plugin.activatedAt = new Date();

      console.log(`[PluginLoader] Plugin ${pluginId} activated`);
    } catch (error) {
      console.error(`[PluginLoader] Failed to activate plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Deactivate a plugin
   * @param {string} pluginId - Plugin ID
   */
  async deactivatePlugin(pluginId) {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not loaded`);
    }

    if (!plugin.enabled) {
      console.warn(`[PluginLoader] Plugin ${pluginId} already deactivated`);
      return;
    }

    try {
      // Call deactivate hook if it exists
      if (plugin.instance.deactivate && typeof plugin.instance.deactivate === 'function') {
        await plugin.instance.deactivate();
      }

      plugin.enabled = false;
      plugin.deactivatedAt = new Date();

      console.log(`[PluginLoader] Plugin ${pluginId} deactivated`);
    } catch (error) {
      console.error(`[PluginLoader] Failed to deactivate plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Unload a plugin
   * @param {string} pluginId - Plugin ID
   */
  async unloadPlugin(pluginId) {
    const plugin = this.loadedPlugins.get(pluginId);
    if (!plugin) {
      console.warn(`[PluginLoader] Plugin ${pluginId} not loaded`);
      return;
    }

    try {
      // Deactivate if enabled
      if (plugin.enabled) {
        await this.deactivatePlugin(pluginId);
      }

      // Destroy sandbox
      if (plugin.sandbox) {
        plugin.sandbox.destroy();
      }

      // Clean up API
      if (plugin.api) {
        plugin.api.cleanup();
      }

      // Remove from loaded plugins
      this.loadedPlugins.delete(pluginId);

      console.log(`[PluginLoader] Plugin ${pluginId} unloaded`);
    } catch (error) {
      console.error(`[PluginLoader] Failed to unload plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Load plugin dependencies
   * @param {Object} dependencies - Dependency map
   */
  async loadDependencies(dependencies) {
    // For now, just log dependencies
    // In the future, implement dependency resolution and loading
    if (Object.keys(dependencies).length > 0) {
      console.log('[PluginLoader] Dependencies found:', dependencies);
      console.warn('[PluginLoader] Dependency loading not yet implemented');
    }
  }

  /**
   * Get loaded plugin
   * @param {string} pluginId - Plugin ID
   * @returns {Object|null} Plugin data
   */
  getPlugin(pluginId) {
    return this.loadedPlugins.get(pluginId) || null;
  }

  /**
   * Get all loaded plugins
   * @returns {Array<Object>} Array of plugin data
   */
  getAllPlugins() {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Get enabled plugins
   * @returns {Array<Object>} Array of enabled plugin data
   */
  getEnabledPlugins() {
    return this.getAllPlugins().filter(p => p.enabled);
  }

  /**
   * List installed plugins (from filesystem)
   * @returns {Promise<Array<string>>} Array of plugin IDs
   */
  async listInstalledPlugins() {
    try {
      const entries = await this.vfs.readdir(this.pluginDir);
      return entries
        .filter(entry => entry.isDirectory)
        .map(entry => entry.name);
    } catch (error) {
      console.error('[PluginLoader] Failed to list plugins:', error);
      return [];
    }
  }

  /**
   * Install plugin from archive
   * @param {string} pluginId - Plugin ID
   * @param {ArrayBuffer} archiveData - Plugin archive data
   */
  async installPlugin(pluginId, archiveData) {
    try {
      // Create plugin directory
      const pluginPath = `${this.pluginDir}/${pluginId}`;
      await this.vfs.mkdir(pluginPath, { recursive: true });

      // Extract archive (implementation depends on archive format)
      // For now, just a placeholder
      console.log(`[PluginLoader] Installing plugin ${pluginId}`);

      // TODO: Implement archive extraction
      throw new Error('Plugin installation not yet implemented');

    } catch (error) {
      console.error(`[PluginLoader] Failed to install plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Uninstall plugin
   * @param {string} pluginId - Plugin ID
   */
  async uninstallPlugin(pluginId) {
    try {
      // Unload if loaded
      if (this.loadedPlugins.has(pluginId)) {
        await this.unloadPlugin(pluginId);
      }

      // Remove plugin directory
      const pluginPath = `${this.pluginDir}/${pluginId}`;
      await this.vfs.rmdir(pluginPath, { recursive: true });

      console.log(`[PluginLoader] Plugin ${pluginId} uninstalled`);
    } catch (error) {
      console.error(`[PluginLoader] Failed to uninstall plugin ${pluginId}:`, error);
      throw error;
    }
  }
}

export default PluginLoader;
