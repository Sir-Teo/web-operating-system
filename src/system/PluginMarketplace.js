/**
 * Plugin Marketplace API Client
 * Handles plugin discovery, search, and installation from marketplace
 */

export class PluginMarketplace {
  constructor(pluginLoader) {
    this.pluginLoader = pluginLoader;
    this.marketplaceUrl = 'https://webos-plugins.example.com/api'; // Placeholder URL
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.useLocalRegistry = true; // For demo purposes, use local registry
  }

  /**
   * Get featured plugins from marketplace
   * @returns {Promise<Array>} Featured plugins
   */
  async getFeaturedPlugins() {
    try {
      const cacheKey = 'featured';
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;

      // For demo, return local featured plugins
      const featured = this._getLocalFeaturedPlugins();

      this._setCache(cacheKey, featured);
      return featured;
    } catch (error) {
      console.error('[PluginMarketplace] Failed to get featured plugins:', error);
      return [];
    }
  }

  /**
   * Search plugins in marketplace
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async searchPlugins(query, options = {}) {
    try {
      const { category, sortBy = 'relevance', limit = 20 } = options;

      // For demo, search local registry
      const allPlugins = this._getLocalPluginRegistry();
      let results = allPlugins;

      // Filter by query
      if (query) {
        const lowerQuery = query.toLowerCase();
        results = results.filter(plugin =>
          plugin.name.toLowerCase().includes(lowerQuery) ||
          plugin.description.toLowerCase().includes(lowerQuery) ||
          plugin.keywords?.some(k => k.toLowerCase().includes(lowerQuery))
        );
      }

      // Filter by category
      if (category) {
        results = results.filter(plugin => plugin.category === category);
      }

      // Sort results
      switch (sortBy) {
        case 'downloads':
          results.sort((a, b) => (b.stats?.downloads || 0) - (a.stats?.downloads || 0));
          break;
        case 'rating':
          results.sort((a, b) => (b.stats?.rating || 0) - (a.stats?.rating || 0));
          break;
        case 'updated':
          results.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          break;
        default: // relevance
          // Already filtered by relevance
          break;
      }

      return results.slice(0, limit);
    } catch (error) {
      console.error('[PluginMarketplace] Search failed:', error);
      return [];
    }
  }

  /**
   * Get plugin details from marketplace
   * @param {string} pluginId - Plugin ID
   * @returns {Promise<Object>} Plugin details
   */
  async getPluginDetails(pluginId) {
    try {
      const cacheKey = `plugin:${pluginId}`;
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;

      // For demo, get from local registry
      const plugin = this._getLocalPluginRegistry().find(p => p.id === pluginId);
      if (!plugin) {
        throw new Error(`Plugin ${pluginId} not found in marketplace`);
      }

      this._setCache(cacheKey, plugin);
      return plugin;
    } catch (error) {
      console.error(`[PluginMarketplace] Failed to get plugin details for ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Get available categories
   * @returns {Promise<Array>} Categories
   */
  async getCategories() {
    return [
      { id: 'productivity', name: 'Productivity', icon: '📊' },
      { id: 'development', name: 'Development', icon: '💻' },
      { id: 'themes', name: 'Themes', icon: '🎨' },
      { id: 'utilities', name: 'Utilities', icon: '🔧' },
      { id: 'entertainment', name: 'Entertainment', icon: '🎮' },
      { id: 'communication', name: 'Communication', icon: '💬' },
      { id: 'security', name: 'Security', icon: '🔒' }
    ];
  }

  /**
   * Download plugin from marketplace
   * @param {string} pluginId - Plugin ID
   * @param {string} version - Plugin version (optional, defaults to latest)
   * @returns {Promise<ArrayBuffer>} Plugin archive data
   */
  async downloadPlugin(pluginId, version = 'latest') {
    try {
      console.log(`[PluginMarketplace] Downloading plugin ${pluginId}@${version}`);

      if (this.useLocalRegistry) {
        // For demo, generate a mock archive
        return this._generateMockPluginArchive(pluginId);
      }

      // In production, download from actual marketplace
      const response = await fetch(
        `${this.marketplaceUrl}/plugins/${pluginId}/download?version=${version}`
      );

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error(`[PluginMarketplace] Failed to download plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Install plugin from marketplace
   * @param {string} pluginId - Plugin ID
   * @param {string} version - Plugin version (optional)
   * @returns {Promise<Object>} Installation result
   */
  async installPluginFromMarketplace(pluginId, version = 'latest') {
    try {
      console.log(`[PluginMarketplace] Installing ${pluginId}@${version} from marketplace`);

      // Download plugin archive
      const archiveData = await this.downloadPlugin(pluginId, version);

      // Install using plugin loader
      const result = await this.pluginLoader.installPlugin(pluginId, archiveData, 'tar.gz');

      console.log(`[PluginMarketplace] Successfully installed ${pluginId}`);
      return result;
    } catch (error) {
      console.error(`[PluginMarketplace] Failed to install ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Check for plugin updates
   * @returns {Promise<Array>} Available updates
   */
  async checkForUpdates() {
    try {
      const installedPlugins = await this.pluginLoader.listInstalledPlugins();
      const updates = [];

      for (const pluginId of installedPlugins) {
        try {
          // Get installed version
          const manifestPath = `${this.pluginLoader.pluginDir}/${pluginId}/plugin.json`;
          const manifestData = await this.pluginLoader.vfs.readFile(manifestPath, 'utf8');
          const manifest = JSON.parse(manifestData);
          const installedVersion = manifest.version;

          // Get marketplace version
          const marketplacePlugin = await this.getPluginDetails(pluginId);
          const latestVersion = marketplacePlugin.version;

          // Compare versions (simple string comparison, could use semver)
          if (latestVersion !== installedVersion) {
            updates.push({
              pluginId,
              installedVersion,
              latestVersion,
              plugin: marketplacePlugin
            });
          }
        } catch (error) {
          console.warn(`[PluginMarketplace] Failed to check updates for ${pluginId}:`, error);
        }
      }

      return updates;
    } catch (error) {
      console.error('[PluginMarketplace] Failed to check for updates:', error);
      return [];
    }
  }

  /**
   * Get plugin reviews/ratings
   * @param {string} pluginId - Plugin ID
   * @returns {Promise<Object>} Reviews and ratings
   */
  async getPluginReviews(pluginId) {
    // Mock implementation
    return {
      averageRating: 4.5,
      totalReviews: 127,
      reviews: [
        {
          author: 'User123',
          rating: 5,
          comment: 'Excellent plugin! Works perfectly.',
          date: '2025-11-15'
        },
        {
          author: 'DevUser',
          rating: 4,
          comment: 'Great functionality, minor bugs.',
          date: '2025-11-10'
        }
      ]
    };
  }

  /**
   * Cache management
   * @private
   */
  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  _setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Local plugin registry for demo purposes
   * @private
   */
  _getLocalPluginRegistry() {
    return [
      {
        id: 'weather-widget',
        name: 'Weather Widget',
        version: '1.2.0',
        description: 'Display current weather and forecasts on your desktop',
        author: 'WeatherTeam',
        category: 'utilities',
        keywords: ['weather', 'widget', 'forecast'],
        icon: '🌤️',
        screenshots: [],
        permissions: ['network.http'],
        stats: {
          downloads: 5420,
          rating: 4.7
        },
        updatedAt: '2025-11-15',
        readme: '# Weather Widget\n\nDisplays weather information...'
      },
      {
        id: 'code-snippets',
        name: 'Code Snippets Manager',
        version: '2.0.1',
        description: 'Manage and quickly insert code snippets',
        author: 'DevTools Inc',
        category: 'development',
        keywords: ['code', 'snippets', 'productivity'],
        icon: '📝',
        screenshots: [],
        permissions: ['storage.read', 'storage.write'],
        stats: {
          downloads: 8930,
          rating: 4.9
        },
        updatedAt: '2025-11-18',
        readme: '# Code Snippets Manager\n\nManage your code snippets...'
      },
      {
        id: 'dark-theme-pack',
        name: 'Dark Theme Collection',
        version: '1.0.0',
        description: 'Collection of 10 beautiful dark themes',
        author: 'ThemeDesigners',
        category: 'themes',
        keywords: ['theme', 'dark', 'ui'],
        icon: '🌙',
        screenshots: [],
        permissions: ['ui.theme'],
        stats: {
          downloads: 12500,
          rating: 4.8
        },
        updatedAt: '2025-11-10',
        readme: '# Dark Theme Collection\n\n10 beautiful dark themes...'
      },
      {
        id: 'markdown-previewer',
        name: 'Markdown Live Preview',
        version: '1.5.0',
        description: 'Real-time markdown preview with syntax highlighting',
        author: 'MarkdownTeam',
        category: 'productivity',
        keywords: ['markdown', 'preview', 'editor'],
        icon: '📄',
        screenshots: [],
        permissions: ['storage.read'],
        stats: {
          downloads: 6700,
          rating: 4.6
        },
        updatedAt: '2025-11-12',
        readme: '# Markdown Live Preview\n\nPreview markdown files...'
      },
      {
        id: 'task-tracker',
        name: 'Task & Project Tracker',
        version: '2.1.0',
        description: 'Track tasks, projects, and deadlines efficiently',
        author: 'ProductivityPro',
        category: 'productivity',
        keywords: ['tasks', 'todo', 'project', 'management'],
        icon: '✅',
        screenshots: [],
        permissions: ['storage.read', 'storage.write', 'notifications'],
        stats: {
          downloads: 9200,
          rating: 4.5
        },
        updatedAt: '2025-11-16',
        readme: '# Task & Project Tracker\n\nManage your tasks...'
      },
      {
        id: 'git-integrator',
        name: 'Git Integration Plus',
        version: '3.0.0',
        description: 'Advanced Git integration with visual diff and merge tools',
        author: 'GitTools',
        category: 'development',
        keywords: ['git', 'version-control', 'development'],
        icon: '🔀',
        screenshots: [],
        permissions: ['storage.read', 'storage.write', 'network.http'],
        stats: {
          downloads: 15400,
          rating: 4.9
        },
        updatedAt: '2025-11-17',
        readme: '# Git Integration Plus\n\nAdvanced Git features...'
      },
      {
        id: 'pomodoro-timer',
        name: 'Pomodoro Focus Timer',
        version: '1.3.0',
        description: 'Boost productivity with the Pomodoro technique',
        author: 'FocusApps',
        category: 'productivity',
        keywords: ['pomodoro', 'timer', 'focus', 'productivity'],
        icon: '🍅',
        screenshots: [],
        permissions: ['notifications'],
        stats: {
          downloads: 7800,
          rating: 4.7
        },
        updatedAt: '2025-11-14',
        readme: '# Pomodoro Focus Timer\n\nWork in focused intervals...'
      },
      {
        id: 'password-manager',
        name: 'Secure Password Vault',
        version: '2.0.0',
        description: 'Encrypted password manager with auto-fill',
        author: 'SecurityFirst',
        category: 'security',
        keywords: ['password', 'security', 'encryption'],
        icon: '🔐',
        screenshots: [],
        permissions: ['storage.read', 'storage.write', 'crypto'],
        stats: {
          downloads: 11200,
          rating: 4.8
        },
        updatedAt: '2025-11-13',
        readme: '# Secure Password Vault\n\nManage passwords securely...'
      }
    ];
  }

  /**
   * Get featured plugins from local registry
   * @private
   */
  _getLocalFeaturedPlugins() {
    const registry = this._getLocalPluginRegistry();
    // Return top 4 by downloads
    return registry
      .sort((a, b) => (b.stats?.downloads || 0) - (a.stats?.downloads || 0))
      .slice(0, 4);
  }

  /**
   * Generate mock plugin archive for demo
   * @private
   */
  async _generateMockPluginArchive(pluginId) {
    const plugin = this._getLocalPluginRegistry().find(p => p.id === pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // Create a simple mock archive (in production, this would be real data)
    // For now, return empty buffer - actual implementation would need real plugin files
    throw new Error('Mock plugin download not fully implemented. Use manual installation.');
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export default PluginMarketplace;
