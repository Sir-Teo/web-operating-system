/**
 * Package Registry
 * Handles communication with npm registry
 */
export class Registry {
  constructor() {
    this.registryUrl = 'https://registry.npmjs.org';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Fetch package metadata
   * @param {string} packageName - Package name
   * @returns {Promise<Object>} Package metadata
   */
  async fetchMetadata(packageName) {
    // Check cache first
    const cached = this.cache.get(packageName);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.registryUrl}/${packageName}`);
      if (!response.ok) {
        throw new Error(`Package not found: ${packageName}`);
      }

      const data = await response.json();

      // Cache the result
      this.cache.set(packageName, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error(`Error fetching metadata for ${packageName}:`, error);
      throw error;
    }
  }

  /**
   * Get package version info
   * @param {string} packageName - Package name
   * @param {string} version - Version or tag (e.g., 'latest', '1.2.3')
   * @returns {Promise<Object>} Version info
   */
  async getVersionInfo(packageName, version = 'latest') {
    const metadata = await this.fetchMetadata(packageName);

    // Resolve version
    let resolvedVersion = version;
    if (version === 'latest' || version === '*') {
      resolvedVersion = metadata['dist-tags'].latest;
    } else if (metadata['dist-tags'][version]) {
      resolvedVersion = metadata['dist-tags'][version];
    }

    const versionData = metadata.versions[resolvedVersion];
    if (!versionData) {
      throw new Error(`Version ${version} not found for ${packageName}`);
    }

    return versionData;
  }

  /**
   * Search packages
   * @param {string} query - Search query
   * @param {number} size - Number of results
   * @returns {Promise<Array>} Search results
   */
  async search(query, size = 20) {
    try {
      const url = `${this.registryUrl}/-/v1/search?text=${encodeURIComponent(query)}&size=${size}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      return data.objects.map(obj => ({
        name: obj.package.name,
        version: obj.package.version,
        description: obj.package.description,
        author: obj.package.author?.name,
        keywords: obj.package.keywords,
        date: obj.package.date,
        links: obj.package.links
      }));
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Get package tarball URL
   * @param {string} packageName - Package name
   * @param {string} version - Version
   * @returns {Promise<string>} Tarball URL
   */
  async getTarballUrl(packageName, version) {
    const versionInfo = await this.getVersionInfo(packageName, version);
    return versionInfo.dist.tarball;
  }

  /**
   * Get package dependencies
   * @param {string} packageName - Package name
   * @param {string} version - Version
   * @returns {Promise<Object>} Dependencies
   */
  async getDependencies(packageName, version) {
    const versionInfo = await this.getVersionInfo(packageName, version);
    return {
      dependencies: versionInfo.dependencies || {},
      devDependencies: versionInfo.devDependencies || {},
      peerDependencies: versionInfo.peerDependencies || {}
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache size
   * @returns {number} Number of cached packages
   */
  getCacheSize() {
    return this.cache.size;
  }
}
