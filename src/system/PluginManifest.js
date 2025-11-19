/**
 * Plugin Manifest Schema and Validation
 * Defines the structure and validates plugin manifests
 */

export class PluginManifest {
  /**
   * Validate plugin manifest
   * @param {Object} manifest - Plugin manifest object
   * @returns {Object} Validation result { valid, errors }
   */
  static validate(manifest) {
    const errors = [];

    // Required fields
    if (!manifest.id) {
      errors.push('Missing required field: id');
    } else if (!this.isValidId(manifest.id)) {
      errors.push('Invalid id format. Must be reverse domain notation (e.g., com.example.plugin)');
    }

    if (!manifest.name) {
      errors.push('Missing required field: name');
    }

    if (!manifest.version) {
      errors.push('Missing required field: version');
    } else if (!this.isValidVersion(manifest.version)) {
      errors.push('Invalid version format. Must be semver (e.g., 1.0.0)');
    }

    if (!manifest.main) {
      errors.push('Missing required field: main');
    }

    // Optional but recommended fields
    if (!manifest.description) {
      errors.push('Warning: Missing description field');
    }

    if (!manifest.author) {
      errors.push('Warning: Missing author field');
    }

    // Validate permissions array
    if (manifest.permissions) {
      if (!Array.isArray(manifest.permissions)) {
        errors.push('permissions must be an array');
      } else {
        manifest.permissions.forEach(perm => {
          if (!this.isValidPermission(perm)) {
            errors.push(`Invalid permission: ${perm}`);
          }
        });
      }
    }

    // Validate engines
    if (manifest.engines) {
      if (!manifest.engines.webos) {
        errors.push('Missing engines.webos field');
      }
    }

    return {
      valid: errors.filter(e => !e.startsWith('Warning')).length === 0,
      errors
    };
  }

  /**
   * Check if plugin ID is valid (reverse domain notation)
   * @param {string} id - Plugin ID
   * @returns {boolean}
   */
  static isValidId(id) {
    return /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/.test(id);
  }

  /**
   * Check if version is valid semver
   * @param {string} version - Version string
   * @returns {boolean}
   */
  static isValidVersion(version) {
    return /^\d+\.\d+\.\d+(-[a-z0-9.-]+)?(\+[a-z0-9.-]+)?$/i.test(version);
  }

  /**
   * Check if permission is valid
   * @param {string} permission - Permission string
   * @returns {boolean}
   */
  static isValidPermission(permission) {
    const validPermissions = [
      'filesystem.read',
      'filesystem.write',
      'network.fetch',
      'network.websocket',
      'ui.menu',
      'ui.widget',
      'ui.panel',
      'ui.dialog',
      'ui.notifications',
      'hooks.app',
      'hooks.file',
      'system.process',
      'system.theme'
    ];

    return validPermissions.includes(permission);
  }

  /**
   * Get list of all valid permissions
   * @returns {Array<Object>} Array of permission objects
   */
  static getValidPermissions() {
    return [
      { id: 'filesystem.read', description: 'Read files and directories' },
      { id: 'filesystem.write', description: 'Write and delete files' },
      { id: 'network.fetch', description: 'Make HTTP/HTTPS requests' },
      { id: 'network.websocket', description: 'Create WebSocket connections' },
      { id: 'ui.menu', description: 'Add menu items' },
      { id: 'ui.widget', description: 'Create desktop widgets' },
      { id: 'ui.panel', description: 'Create sidebar panels' },
      { id: 'ui.dialog', description: 'Show dialogs' },
      { id: 'ui.notifications', description: 'Show notifications' },
      { id: 'hooks.app', description: 'Hook into app lifecycle' },
      { id: 'hooks.file', description: 'Hook into file operations' },
      { id: 'system.process', description: 'Access process information' },
      { id: 'system.theme', description: 'Modify system theme' }
    ];
  }

  /**
   * Create default manifest template
   * @param {string} id - Plugin ID
   * @param {string} name - Plugin name
   * @returns {Object} Default manifest
   */
  static createTemplate(id, name) {
    return {
      id: id || 'com.example.myplugin',
      name: name || 'My Plugin',
      version: '1.0.0',
      description: 'A WebOS plugin',
      author: {
        name: 'Your Name',
        email: 'your.email@example.com',
        url: 'https://example.com'
      },
      main: 'index.js',
      icon: 'icon.png',
      permissions: [],
      dependencies: {},
      engines: {
        webos: '>=2.6.0'
      },
      categories: ['other'],
      keywords: [],
      license: 'MIT',
      repository: {
        type: 'git',
        url: ''
      }
    };
  }

  /**
   * Check version compatibility
   * @param {string} required - Required version (e.g., ">=2.6.0")
   * @param {string} current - Current version (e.g., "2.6.0")
   * @returns {boolean}
   */
  static isVersionCompatible(required, current) {
    // Simple version compatibility check
    // Supports: >=, >, <=, <, =, ^, ~

    const parseVersion = (ver) => {
      const parts = ver.replace(/[^0-9.]/g, '').split('.');
      return {
        major: parseInt(parts[0]) || 0,
        minor: parseInt(parts[1]) || 0,
        patch: parseInt(parts[2]) || 0
      };
    };

    const req = parseVersion(required);
    const cur = parseVersion(current);

    if (required.startsWith('>=')) {
      return (cur.major > req.major) ||
             (cur.major === req.major && cur.minor > req.minor) ||
             (cur.major === req.major && cur.minor === req.minor && cur.patch >= req.patch);
    } else if (required.startsWith('>')) {
      return (cur.major > req.major) ||
             (cur.major === req.major && cur.minor > req.minor) ||
             (cur.major === req.major && cur.minor === req.minor && cur.patch > req.patch);
    } else if (required.startsWith('<=')) {
      return (cur.major < req.major) ||
             (cur.major === req.major && cur.minor < req.minor) ||
             (cur.major === req.major && cur.minor === req.minor && cur.patch <= req.patch);
    } else if (required.startsWith('<')) {
      return (cur.major < req.major) ||
             (cur.major === req.major && cur.minor < req.minor) ||
             (cur.major === req.major && cur.minor === req.minor && cur.patch < req.patch);
    } else if (required.startsWith('^')) {
      // Same major version
      return cur.major === req.major &&
             (cur.minor > req.minor ||
              (cur.minor === req.minor && cur.patch >= req.patch));
    } else if (required.startsWith('~')) {
      // Same major and minor version
      return cur.major === req.major &&
             cur.minor === req.minor &&
             cur.patch >= req.patch;
    } else {
      // Exact match
      return cur.major === req.major &&
             cur.minor === req.minor &&
             cur.patch === req.patch;
    }
  }
}

export default PluginManifest;
