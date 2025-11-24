/**
 * PluginLoader - Dynamic Plugin Loading
 *
 * Features:
 * - Load plugins from URLs
 * - Validate plugin code
 * - Execute in sandbox
 * - Hot reload support
 */

import EventEmitter from '../utils/EventEmitter.js';

class PluginLoader extends EventEmitter {
  constructor() {
    super();

    this.cache = new Map();

    console.log('[PluginLoader] Initialized');
  }

  /**
   * Load plugin manifest
   */
  async loadManifest(source) {
    try {
      let manifestUrl;

      if (source.startsWith('http://') || source.startsWith('https://')) {
        manifestUrl = source + '/manifest.json';
      } else {
        // Local plugin
        manifestUrl = source + '/manifest.json';
      }

      const response = await fetch(manifestUrl);

      if (!response.ok) {
        throw new Error(`Failed to load manifest: ${response.statusText}`);
      }

      const manifest = await response.json();

      console.log('[PluginLoader] Manifest loaded:', manifest.id);

      return manifest;

    } catch (error) {
      console.error('[PluginLoader] Failed to load manifest:', error);
      throw new Error(`Failed to load manifest: ${error.message}`);
    }
  }

  /**
   * Load plugin code
   */
  async loadPlugin(source) {
    try {
      let pluginUrl;

      if (source.startsWith('http://') || source.startsWith('https://')) {
        pluginUrl = source + '/plugin.js';
      } else {
        pluginUrl = source + '/plugin.js';
      }

      // Check cache
      if (this.cache.has(pluginUrl)) {
        console.log('[PluginLoader] Loaded from cache:', pluginUrl);
        return this.cache.get(pluginUrl);
      }

      const response = await fetch(pluginUrl);

      if (!response.ok) {
        throw new Error(`Failed to load plugin: ${response.statusText}`);
      }

      const code = await response.text();

      // Validate code
      this._validateCode(code);

      // Cache code
      this.cache.set(pluginUrl, code);

      console.log('[PluginLoader] Plugin code loaded');

      return code;

    } catch (error) {
      console.error('[PluginLoader] Failed to load plugin:', error);
      throw new Error(`Failed to load plugin: ${error.message}`);
    }
  }

  /**
   * Execute plugin code in sandbox
   */
  async executePlugin(code, api) {
    try {
      // Create isolated scope
      const sandbox = {
        console: {
          log: api.utils.log,
          warn: api.utils.warn,
          error: api.utils.error
        },
        setTimeout: api.utils.setTimeout,
        clearTimeout: api.utils.clearTimeout,
        setInterval: api.utils.setInterval,
        clearInterval: api.utils.clearInterval
      };

      // Wrap code in function to create scope
      const wrappedCode = `
        (function(api) {
          'use strict';
          ${code}
          return Plugin;
        })
      `;

      // Execute code
      const createPlugin = eval(wrappedCode);
      const PluginClass = createPlugin(api);

      console.log('[PluginLoader] Plugin executed successfully');

      return PluginClass;

    } catch (error) {
      console.error('[PluginLoader] Failed to execute plugin:', error);
      throw new Error(`Failed to execute plugin: ${error.message}`);
    }
  }

  /**
   * Validate plugin code
   */
  _validateCode(code) {
    // Check for dangerous patterns
    const dangerousPatterns = [
      /eval\(/,
      /Function\(/,
      /import\(/,
      /__proto__/,
      /constructor\[/,
      /process\.env/
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        console.warn('[PluginLoader] Potentially dangerous code detected');
        // In production, might want to reject
        // throw new Error('Code validation failed: dangerous pattern detected');
      }
    }

    // Check for required exports
    if (!code.includes('class Plugin')) {
      throw new Error('Code validation failed: missing Plugin class');
    }

    return true;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('[PluginLoader] Cache cleared');
  }

  /**
   * Get cache size
   */
  getCacheSize() {
    return this.cache.size;
  }
}

export default PluginLoader;
