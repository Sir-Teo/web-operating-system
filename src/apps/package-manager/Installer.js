/**
 * Package Installer
 * Handles package installation and management
 */
export class Installer {
  constructor(vfs, registry) {
    this.vfs = vfs;
    this.registry = registry;
    this.installedPackages = this.loadInstalled();
    this.installDir = '/home/user/node_modules';
    this.packageJsonPath = '/home/user/package.json';
  }

  /**
   * Load installed packages
   * @returns {Map} Installed packages
   */
  loadInstalled() {
    try {
      const data = localStorage.getItem('installed-packages');
      const packages = data ? JSON.parse(data) : {};
      return new Map(Object.entries(packages));
    } catch {
      return new Map();
    }
  }

  /**
   * Save installed packages
   */
  saveInstalled() {
    try {
      const packages = Object.fromEntries(this.installedPackages);
      localStorage.setItem('installed-packages', JSON.stringify(packages));
    } catch (error) {
      console.error('Error saving installed packages:', error);
    }
  }

  /**
   * Install package
   * @param {string} packageName - Package name
   * @param {string} version - Package version
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Installation result
   */
  async install(packageName, version = 'latest', onProgress = null) {
    try {
      onProgress?.({ stage: 'Fetching metadata', progress: 10 });

      // Get version info
      const versionInfo = await this.registry.getVersionInfo(packageName, version);
      const actualVersion = versionInfo.version;

      // Check if already installed
      if (this.isInstalled(packageName, actualVersion)) {
        return {
          success: true,
          message: `${packageName}@${actualVersion} is already installed`,
          packageName,
          version: actualVersion
        };
      }

      onProgress?.({ stage: 'Downloading package', progress: 30 });

      // Download tarball (simulated - we can't actually extract tarballs in browser)
      const tarballUrl = versionInfo.dist.tarball;
      console.log(`Would download: ${tarballUrl}`);

      // Create package directory
      const packageDir = `${this.installDir}/${packageName}`;
      await this.ensureDirectory(packageDir);

      onProgress?.({ stage: 'Installing files', progress: 60 });

      // Save package.json
      await this.vfs.writeFile(
        `${packageDir}/package.json`,
        JSON.stringify(versionInfo, null, 2)
      );

      // Mark as installed
      this.installedPackages.set(packageName, {
        version: actualVersion,
        installedAt: new Date().toISOString(),
        dependencies: versionInfo.dependencies || {}
      });

      this.saveInstalled();

      onProgress?.({ stage: 'Updating package.json', progress: 90 });

      // Update package.json
      await this.updatePackageJson(packageName, actualVersion);

      onProgress?.({ stage: 'Complete', progress: 100 });

      return {
        success: true,
        message: `Successfully installed ${packageName}@${actualVersion}`,
        packageName,
        version: actualVersion
      };
    } catch (error) {
      console.error(`Error installing ${packageName}:`, error);
      return {
        success: false,
        message: error.message,
        packageName,
        version
      };
    }
  }

  /**
   * Uninstall package
   * @param {string} packageName - Package name
   * @returns {Promise<Object>} Uninstallation result
   */
  async uninstall(packageName) {
    try {
      if (!this.installedPackages.has(packageName)) {
        return {
          success: false,
          message: `${packageName} is not installed`
        };
      }

      // Remove from installed packages
      const packageInfo = this.installedPackages.get(packageName);
      this.installedPackages.delete(packageName);
      this.saveInstalled();

      // Remove from package.json
      await this.removeFromPackageJson(packageName);

      // Remove package directory (if exists)
      const packageDir = `${this.installDir}/${packageName}`;
      try {
        await this.vfs.rmdir(packageDir, { recursive: true });
      } catch {
        // Directory might not exist
      }

      return {
        success: true,
        message: `Successfully uninstalled ${packageName}@${packageInfo.version}`,
        packageName
      };
    } catch (error) {
      console.error(`Error uninstalling ${packageName}:`, error);
      return {
        success: false,
        message: error.message,
        packageName
      };
    }
  }

  /**
   * Update package
   * @param {string} packageName - Package name
   * @param {string} version - New version (optional)
   * @returns {Promise<Object>} Update result
   */
  async update(packageName, version = 'latest') {
    try {
      const installed = this.installedPackages.get(packageName);
      if (!installed) {
        return {
          success: false,
          message: `${packageName} is not installed`
        };
      }

      const versionInfo = await this.registry.getVersionInfo(packageName, version);
      const newVersion = versionInfo.version;

      if (installed.version === newVersion) {
        return {
          success: true,
          message: `${packageName} is already at version ${newVersion}`,
          packageName,
          version: newVersion
        };
      }

      // Uninstall old version
      await this.uninstall(packageName);

      // Install new version
      return await this.install(packageName, newVersion);
    } catch (error) {
      return {
        success: false,
        message: error.message,
        packageName
      };
    }
  }

  /**
   * Check if package is installed
   * @param {string} packageName - Package name
   * @param {string} version - Version (optional)
   * @returns {boolean} True if installed
   */
  isInstalled(packageName, version = null) {
    if (!this.installedPackages.has(packageName)) {
      return false;
    }
    if (version) {
      return this.installedPackages.get(packageName).version === version;
    }
    return true;
  }

  /**
   * Get installed packages
   * @returns {Array} List of installed packages
   */
  getInstalled() {
    return Array.from(this.installedPackages.entries()).map(([name, info]) => ({
      name,
      ...info
    }));
  }

  /**
   * Ensure directory exists
   * @param {string} path - Directory path
   */
  async ensureDirectory(path) {
    try {
      await this.vfs.stat(path);
    } catch {
      await this.vfs.mkdir(path, { recursive: true });
    }
  }

  /**
   * Update package.json
   * @param {string} packageName - Package name
   * @param {string} version - Version
   */
  async updatePackageJson(packageName, version) {
    try {
      let packageJson;
      try {
        const content = await this.vfs.readFile(this.packageJsonPath, 'utf8');
        packageJson = JSON.parse(content);
      } catch {
        packageJson = {
          name: 'webos-project',
          version: '1.0.0',
          dependencies: {}
        };
      }

      if (!packageJson.dependencies) {
        packageJson.dependencies = {};
      }

      packageJson.dependencies[packageName] = `^${version}`;

      await this.vfs.writeFile(
        this.packageJsonPath,
        JSON.stringify(packageJson, null, 2)
      );
    } catch (error) {
      console.error('Error updating package.json:', error);
    }
  }

  /**
   * Remove from package.json
   * @param {string} packageName - Package name
   */
  async removeFromPackageJson(packageName) {
    try {
      const content = await this.vfs.readFile(this.packageJsonPath, 'utf8');
      const packageJson = JSON.parse(content);

      if (packageJson.dependencies && packageJson.dependencies[packageName]) {
        delete packageJson.dependencies[packageName];
        await this.vfs.writeFile(
          this.packageJsonPath,
          JSON.stringify(packageJson, null, 2)
        );
      }
    } catch (error) {
      console.error('Error removing from package.json:', error);
    }
  }
}
