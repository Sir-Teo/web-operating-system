/**
 * Dependency Resolver
 * Resolves package dependencies and creates install tree
 */
export class DependencyResolver {
  constructor(registry) {
    this.registry = registry;
  }

  /**
   * Resolve dependencies
   * @param {string} packageName - Package name
   * @param {string} version - Package version
   * @param {Set} resolved - Set of resolved packages
   * @param {Map} resolving - Map of packages being resolved
   * @returns {Promise<Map>} Dependency tree
   */
  async resolve(packageName, version, resolved = new Set(), resolving = new Map()) {
    const key = `${packageName}@${version}`;

    // Check if already resolved
    if (resolved.has(key)) {
      return resolving;
    }

    // Check for circular dependencies
    if (resolving.has(packageName)) {
      console.warn(`Circular dependency detected: ${packageName}`);
      return resolving;
    }

    // Mark as being resolved
    resolving.set(packageName, version);

    try {
      // Get dependencies for this package
      const deps = await this.registry.getDependencies(packageName, version);

      // Resolve each dependency
      for (const [depName, depVersion] of Object.entries(deps.dependencies)) {
        await this.resolve(depName, depVersion, resolved, resolving);
      }

      // Mark as resolved
      resolved.add(key);
    } catch (error) {
      console.error(`Error resolving ${packageName}@${version}:`, error);
      throw error;
    }

    return resolving;
  }

  /**
   * Get flat dependency list
   * @param {string} packageName - Package name
   * @param {string} version - Package version
   * @returns {Promise<Array>} Flat list of dependencies
   */
  async getFlatDependencies(packageName, version) {
    const tree = await this.resolve(packageName, version);
    return Array.from(tree.entries()).map(([name, ver]) => ({
      name,
      version: ver
    }));
  }

  /**
   * Check for conflicts
   * @param {Map} dependencies - Dependency map
   * @returns {Array} Conflicts
   */
  checkConflicts(dependencies) {
    const conflicts = [];
    const versions = new Map();

    for (const [name, version] of dependencies.entries()) {
      if (versions.has(name)) {
        const existing = versions.get(name);
        if (existing !== version) {
          conflicts.push({
            package: name,
            versions: [existing, version]
          });
        }
      } else {
        versions.set(name, version);
      }
    }

    return conflicts;
  }

  /**
   * Get install order
   * @param {Map} dependencies - Dependency map
   * @returns {Array} Install order
   */
  getInstallOrder(dependencies) {
    // Simple topological sort - install in reverse order of resolution
    const packages = Array.from(dependencies.entries());
    return packages.map(([name, version]) => ({ name, version })).reverse();
  }

  /**
   * Estimate install size
   * @param {Map} dependencies - Dependency map
   * @returns {Promise<number>} Estimated size in bytes
   */
  async estimateSize(dependencies) {
    let totalSize = 0;

    for (const [name, version] of dependencies.entries()) {
      try {
        const versionInfo = await this.registry.getVersionInfo(name, version);
        if (versionInfo.dist && versionInfo.dist.unpackedSize) {
          totalSize += versionInfo.dist.unpackedSize;
        }
      } catch (error) {
        console.warn(`Could not get size for ${name}@${version}`);
      }
    }

    return totalSize;
  }

  /**
   * Format size
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size
   */
  formatSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}
