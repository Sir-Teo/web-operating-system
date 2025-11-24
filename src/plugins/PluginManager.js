/**
 * PluginManager - Plugin Lifecycle Management
 *
 * Features:
 * - Plugin installation and removal
 * - Enable/disable plugins
 * - Plugin lifecycle (load, activate, deactivate, unload)
 * - Dependency management
 * - Auto-update support
 * - Plugin sandboxing
 */

import EventEmitter from '../utils/EventEmitter.js';
import PluginAPI from './PluginAPI.js';
import PluginLoader from './PluginLoader.js';

class PluginManager extends EventEmitter {
  constructor() {
    super();

    this.plugins = new Map();
    this.activePlugins = new Set();
    this.pluginAPI = new PluginAPI();
    this.pluginLoader = new PluginLoader();

    // Plugin registry
    this.registry = {
      installed: new Map(),
      available: new Map()
    };

    console.log('[PluginManager] Initialized');
  }

  /**
   * Install a plugin from URL or package
   */
  async install(source, options = {}) {
    try {
      console.log('[PluginManager] Installing plugin from:', source);

      // Load plugin manifest
      const manifest = await this.pluginLoader.loadManifest(source);

      // Validate manifest
      this._validateManifest(manifest);

      // Check dependencies
      await this._checkDependencies(manifest);

      // Download and load plugin code
      const pluginCode = await this.pluginLoader.loadPlugin(source);

      // Create plugin instance
      const plugin = await this._createPluginInstance(manifest, pluginCode);

      // Register plugin
      this.plugins.set(manifest.id, plugin);
      this.registry.installed.set(manifest.id, {
        manifest,
        source,
        installedAt: Date.now(),
        enabled: false
      });

      this.emit('plugin-installed', { id: manifest.id, manifest });

      console.log('[PluginManager] Plugin installed:', manifest.id);

      return {
        success: true,
        id: manifest.id,
        manifest
      };

    } catch (error) {
      console.error('[PluginManager] Installation failed:', error);

      this.emit('plugin-install-failed', { source, error: error.message });

      throw new Error(`Failed to install plugin: ${error.message}`);
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstall(pluginId) {
    try {
      console.log('[PluginManager] Uninstalling plugin:', pluginId);

      // Check if plugin exists
      if (!this.plugins.has(pluginId)) {
        throw new Error('Plugin not found');
      }

      // Deactivate if active
      if (this.activePlugins.has(pluginId)) {
        await this.deactivate(pluginId);
      }

      // Remove plugin
      const plugin = this.plugins.get(pluginId);

      if (plugin.instance && typeof plugin.instance.uninstall === 'function') {
        await plugin.instance.uninstall();
      }

      this.plugins.delete(pluginId);
      this.registry.installed.delete(pluginId);

      this.emit('plugin-uninstalled', { id: pluginId });

      console.log('[PluginManager] Plugin uninstalled:', pluginId);

      return { success: true };

    } catch (error) {
      console.error('[PluginManager] Uninstall failed:', error);
      throw new Error(`Failed to uninstall plugin: ${error.message}`);
    }
  }

  /**
   * Enable a plugin
   */
  async enable(pluginId) {
    try {
      console.log('[PluginManager] Enabling plugin:', pluginId);

      const info = this.registry.installed.get(pluginId);

      if (!info) {
        throw new Error('Plugin not found');
      }

      info.enabled = true;

      // Auto-activate if configured
      if (info.manifest.autoActivate !== false) {
        await this.activate(pluginId);
      }

      this.emit('plugin-enabled', { id: pluginId });

      console.log('[PluginManager] Plugin enabled:', pluginId);

      return { success: true };

    } catch (error) {
      console.error('[PluginManager] Enable failed:', error);
      throw new Error(`Failed to enable plugin: ${error.message}`);
    }
  }

  /**
   * Disable a plugin
   */
  async disable(pluginId) {
    try {
      console.log('[PluginManager] Disabling plugin:', pluginId);

      const info = this.registry.installed.get(pluginId);

      if (!info) {
        throw new Error('Plugin not found');
      }

      // Deactivate if active
      if (this.activePlugins.has(pluginId)) {
        await this.deactivate(pluginId);
      }

      info.enabled = false;

      this.emit('plugin-disabled', { id: pluginId });

      console.log('[PluginManager] Plugin disabled:', pluginId);

      return { success: true };

    } catch (error) {
      console.error('[PluginManager] Disable failed:', error);
      throw new Error(`Failed to disable plugin: ${error.message}`);
    }
  }

  /**
   * Activate a plugin
   */
  async activate(pluginId) {
    try {
      console.log('[PluginManager] Activating plugin:', pluginId);

      const plugin = this.plugins.get(pluginId);
      const info = this.registry.installed.get(pluginId);

      if (!plugin || !info) {
        throw new Error('Plugin not found');
      }

      if (!info.enabled) {
        throw new Error('Plugin not enabled');
      }

      if (this.activePlugins.has(pluginId)) {
        console.warn('[PluginManager] Plugin already active:', pluginId);
        return { success: true };
      }

      // Call plugin activate method
      if (plugin.instance && typeof plugin.instance.activate === 'function') {
        await plugin.instance.activate();
      }

      this.activePlugins.add(pluginId);

      this.emit('plugin-activated', { id: pluginId });

      console.log('[PluginManager] Plugin activated:', pluginId);

      return { success: true };

    } catch (error) {
      console.error('[PluginManager] Activation failed:', error);
      throw new Error(`Failed to activate plugin: ${error.message}`);
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivate(pluginId) {
    try {
      console.log('[PluginManager] Deactivating plugin:', pluginId);

      const plugin = this.plugins.get(pluginId);

      if (!plugin) {
        throw new Error('Plugin not found');
      }

      if (!this.activePlugins.has(pluginId)) {
        console.warn('[PluginManager] Plugin not active:', pluginId);
        return { success: true };
      }

      // Call plugin deactivate method
      if (plugin.instance && typeof plugin.instance.deactivate === 'function') {
        await plugin.instance.deactivate();
      }

      this.activePlugins.delete(pluginId);

      this.emit('plugin-deactivated', { id: pluginId });

      console.log('[PluginManager] Plugin deactivated:', pluginId);

      return { success: true };

    } catch (error) {
      console.error('[PluginManager] Deactivation failed:', error);
      throw new Error(`Failed to deactivate plugin: ${error.message}`);
    }
  }

  /**
   * Get plugin info
   */
  getPlugin(pluginId) {
    return this.registry.installed.get(pluginId);
  }

  /**
   * List all plugins
   */
  listPlugins(filter = 'all') {
    const plugins = Array.from(this.registry.installed.entries()).map(([id, info]) => ({
      id,
      ...info,
      active: this.activePlugins.has(id)
    }));

    switch (filter) {
      case 'enabled':
        return plugins.filter(p => p.enabled);
      case 'active':
        return plugins.filter(p => p.active);
      case 'inactive':
        return plugins.filter(p => !p.active);
      default:
        return plugins;
    }
  }

  /**
   * Check if plugin is active
   */
  isActive(pluginId) {
    return this.activePlugins.has(pluginId);
  }

  /**
   * Update plugin
   */
  async update(pluginId, source = null) {
    try {
      console.log('[PluginManager] Updating plugin:', pluginId);

      const info = this.registry.installed.get(pluginId);

      if (!info) {
        throw new Error('Plugin not found');
      }

      const updateSource = source || info.source;

      // Load new manifest
      const newManifest = await this.pluginLoader.loadManifest(updateSource);

      // Check version
      if (newManifest.version <= info.manifest.version) {
        throw new Error('No update available');
      }

      // Deactivate current version
      if (this.activePlugins.has(pluginId)) {
        await this.deactivate(pluginId);
      }

      // Uninstall current version
      await this.uninstall(pluginId);

      // Install new version
      await this.install(updateSource);

      this.emit('plugin-updated', { id: pluginId, version: newManifest.version });

      console.log('[PluginManager] Plugin updated:', pluginId);

      return {
        success: true,
        version: newManifest.version
      };

    } catch (error) {
      console.error('[PluginManager] Update failed:', error);
      throw new Error(`Failed to update plugin: ${error.message}`);
    }
  }

  /**
   * Check for plugin updates
   */
  async checkUpdates(pluginId = null) {
    const pluginsToCheck = pluginId
      ? [this.registry.installed.get(pluginId)]
      : Array.from(this.registry.installed.values());

    const updates = [];

    for (const info of pluginsToCheck) {
      if (!info) continue;

      try {
        const newManifest = await this.pluginLoader.loadManifest(info.source);

        if (newManifest.version > info.manifest.version) {
          updates.push({
            id: info.manifest.id,
            currentVersion: info.manifest.version,
            newVersion: newManifest.version
          });
        }
      } catch (error) {
        console.warn('[PluginManager] Failed to check update for:', info.manifest.id);
      }
    }

    return updates;
  }

  /**
   * Validate plugin manifest
   */
  _validateManifest(manifest) {
    const required = ['id', 'name', 'version', 'entry'];

    for (const field of required) {
      if (!manifest[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate version format
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      throw new Error('Invalid version format');
    }

    // Check if already installed
    if (this.registry.installed.has(manifest.id)) {
      throw new Error('Plugin already installed');
    }

    return true;
  }

  /**
   * Check plugin dependencies
   */
  async _checkDependencies(manifest) {
    if (!manifest.dependencies) return true;

    for (const [depId, depVersion] of Object.entries(manifest.dependencies)) {
      const dep = this.registry.installed.get(depId);

      if (!dep) {
        throw new Error(`Missing dependency: ${depId}`);
      }

      if (dep.manifest.version < depVersion) {
        throw new Error(`Dependency version mismatch: ${depId}`);
      }
    }

    return true;
  }

  /**
   * Create plugin instance
   */
  async _createPluginInstance(manifest, code) {
    // Create sandboxed API for plugin
    const api = this.pluginAPI.createSandbox(manifest);

    // Execute plugin code in sandbox
    const PluginClass = await this.pluginLoader.executePlugin(code, api);

    // Create instance
    const instance = new PluginClass(api);

    return {
      manifest,
      instance,
      api
    };
  }

  /**
   * Export plugin data
   */
  export() {
    return {
      installed: Array.from(this.registry.installed.entries()),
      active: Array.from(this.activePlugins)
    };
  }

  /**
   * Import plugin data
   */
  import(data) {
    if (data.installed) {
      this.registry.installed = new Map(data.installed);
    }

    if (data.active) {
      this.activePlugins = new Set(data.active);
    }

    console.log('[PluginManager] Data imported');
  }
}

// Singleton instance
const pluginManager = new PluginManager();

export default pluginManager;
export { PluginManager };
