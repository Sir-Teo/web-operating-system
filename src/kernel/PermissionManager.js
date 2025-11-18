/**
 * Permission Manager
 * Manages permissions and access control
 */
export class PermissionManager {
  constructor() {
    this.permissions = new Map();
    this.roles = new Map();
    this.userPermissions = new Map();
    this.initializeDefaultPermissions();
    this.initializeDefaultRoles();
  }

  /**
   * Initialize default permissions
   */
  initializeDefaultPermissions() {
    const permissions = [
      // File system permissions
      { id: 'filesystem.read', name: 'Read Files', category: 'filesystem' },
      { id: 'filesystem.write', name: 'Write Files', category: 'filesystem' },
      { id: 'filesystem.delete', name: 'Delete Files', category: 'filesystem' },
      { id: 'filesystem.execute', name: 'Execute Files', category: 'filesystem' },

      // Network permissions
      { id: 'network.http', name: 'HTTP Requests', category: 'network' },
      { id: 'network.websocket', name: 'WebSocket', category: 'network' },
      { id: 'network.fetch', name: 'Fetch API', category: 'network' },

      // System permissions
      { id: 'system.process', name: 'Process Management', category: 'system' },
      { id: 'system.kernel', name: 'Kernel Access', category: 'system' },
      { id: 'system.plugin', name: 'Plugin Management', category: 'system' },
      { id: 'system.user', name: 'User Management', category: 'system' },
      { id: 'system.theme', name: 'Theme Management', category: 'system' },

      // Application permissions
      { id: 'app.install', name: 'Install Apps', category: 'application' },
      { id: 'app.uninstall', name: 'Uninstall Apps', category: 'application' },
      { id: 'app.launch', name: 'Launch Apps', category: 'application' },

      // Storage permissions
      { id: 'storage.read', name: 'Read Storage', category: 'storage' },
      { id: 'storage.write', name: 'Write Storage', category: 'storage' },
      { id: 'storage.clear', name: 'Clear Storage', category: 'storage' },

      // Device permissions
      { id: 'device.camera', name: 'Camera Access', category: 'device' },
      { id: 'device.microphone', name: 'Microphone Access', category: 'device' },
      { id: 'device.location', name: 'Location Access', category: 'device' },
      { id: 'device.clipboard', name: 'Clipboard Access', category: 'device' }
    ];

    permissions.forEach(permission => {
      this.permissions.set(permission.id, permission);
    });
  }

  /**
   * Initialize default roles
   */
  initializeDefaultRoles() {
    // Guest role - minimal permissions
    this.roles.set('guest', {
      id: 'guest',
      name: 'Guest',
      description: 'Minimal permissions for guest users',
      permissions: [
        'filesystem.read',
        'app.launch',
        'storage.read'
      ]
    });

    // User role - standard permissions
    this.roles.set('user', {
      id: 'user',
      name: 'User',
      description: 'Standard user permissions',
      permissions: [
        'filesystem.read',
        'filesystem.write',
        'filesystem.delete',
        'network.http',
        'network.fetch',
        'app.launch',
        'storage.read',
        'storage.write'
      ]
    });

    // Power User role - extended permissions
    this.roles.set('power-user', {
      id: 'power-user',
      name: 'Power User',
      description: 'Extended permissions for power users',
      permissions: [
        'filesystem.read',
        'filesystem.write',
        'filesystem.delete',
        'filesystem.execute',
        'network.http',
        'network.websocket',
        'network.fetch',
        'system.process',
        'system.plugin',
        'system.theme',
        'app.install',
        'app.uninstall',
        'app.launch',
        'storage.read',
        'storage.write',
        'storage.clear',
        'device.clipboard'
      ]
    });

    // Admin role - all permissions
    this.roles.set('admin', {
      id: 'admin',
      name: 'Administrator',
      description: 'Full system access',
      permissions: Array.from(this.permissions.keys())
    });
  }

  /**
   * Check if user has permission
   * @param {string} userId - User ID
   * @param {string} permission - Permission ID
   * @returns {boolean} True if has permission
   */
  hasPermission(userId, permission) {
    // Check user-specific permissions first
    const userPerms = this.userPermissions.get(userId);
    if (userPerms) {
      if (userPerms.denied.includes(permission)) {
        return false;
      }
      if (userPerms.granted.includes(permission)) {
        return true;
      }
    }

    // Check role permissions
    const role = this.getUserRole(userId);
    if (role) {
      return role.permissions.includes(permission);
    }

    return false;
  }

  /**
   * Grant permission to user
   * @param {string} userId - User ID
   * @param {string} permission - Permission ID
   */
  grantPermission(userId, permission) {
    if (!this.permissions.has(permission)) {
      throw new Error(`Unknown permission: ${permission}`);
    }

    if (!this.userPermissions.has(userId)) {
      this.userPermissions.set(userId, {
        granted: [],
        denied: []
      });
    }

    const userPerms = this.userPermissions.get(userId);
    if (!userPerms.granted.includes(permission)) {
      userPerms.granted.push(permission);
    }

    // Remove from denied if present
    userPerms.denied = userPerms.denied.filter(p => p !== permission);

    this.savePermissions();
  }

  /**
   * Revoke permission from user
   * @param {string} userId - User ID
   * @param {string} permission - Permission ID
   */
  revokePermission(userId, permission) {
    if (!this.userPermissions.has(userId)) {
      return;
    }

    const userPerms = this.userPermissions.get(userId);
    userPerms.granted = userPerms.granted.filter(p => p !== permission);

    this.savePermissions();
  }

  /**
   * Deny permission for user
   * @param {string} userId - User ID
   * @param {string} permission - Permission ID
   */
  denyPermission(userId, permission) {
    if (!this.permissions.has(permission)) {
      throw new Error(`Unknown permission: ${permission}`);
    }

    if (!this.userPermissions.has(userId)) {
      this.userPermissions.set(userId, {
        granted: [],
        denied: []
      });
    }

    const userPerms = this.userPermissions.get(userId);
    if (!userPerms.denied.includes(permission)) {
      userPerms.denied.push(permission);
    }

    // Remove from granted if present
    userPerms.granted = userPerms.granted.filter(p => p !== permission);

    this.savePermissions();
  }

  /**
   * Get user role
   * @param {string} userId - User ID
   * @returns {Object} Role object
   */
  getUserRole(userId) {
    // This should integrate with UserManager
    // For now, return default user role
    return this.roles.get('user');
  }

  /**
   * Set user role
   * @param {string} userId - User ID
   * @param {string} roleId - Role ID
   */
  setUserRole(userId, roleId) {
    if (!this.roles.has(roleId)) {
      throw new Error(`Unknown role: ${roleId}`);
    }

    // This would integrate with UserManager
    // For now, just save to local storage
    try {
      const userRoles = JSON.parse(localStorage.getItem('webos-user-roles') || '{}');
      userRoles[userId] = roleId;
      localStorage.setItem('webos-user-roles', JSON.stringify(userRoles));
    } catch (error) {
      console.error('Error setting user role:', error);
    }
  }

  /**
   * Create custom role
   * @param {Object} roleData - Role data
   * @returns {string} Role ID
   */
  createRole(roleData) {
    const { name, description, permissions } = roleData;

    if (!name) {
      throw new Error('Role name is required');
    }

    // Validate permissions
    permissions.forEach(perm => {
      if (!this.permissions.has(perm)) {
        throw new Error(`Unknown permission: ${perm}`);
      }
    });

    const roleId = `role-${Date.now()}`;
    const role = {
      id: roleId,
      name,
      description: description || '',
      permissions: permissions || [],
      custom: true
    };

    this.roles.set(roleId, role);
    this.saveRoles();

    return roleId;
  }

  /**
   * Update role
   * @param {string} roleId - Role ID
   * @param {Object} updates - Updates
   */
  updateRole(roleId, updates) {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role not found: ${roleId}`);
    }

    if (!role.custom) {
      throw new Error('Cannot modify built-in role');
    }

    if (updates.permissions) {
      updates.permissions.forEach(perm => {
        if (!this.permissions.has(perm)) {
          throw new Error(`Unknown permission: ${perm}`);
        }
      });
    }

    Object.assign(role, updates);
    this.saveRoles();
  }

  /**
   * Delete role
   * @param {string} roleId - Role ID
   */
  deleteRole(roleId) {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role not found: ${roleId}`);
    }

    if (!role.custom) {
      throw new Error('Cannot delete built-in role');
    }

    this.roles.delete(roleId);
    this.saveRoles();
  }

  /**
   * Get all permissions
   * @returns {Array} All permissions
   */
  getAllPermissions() {
    return Array.from(this.permissions.values());
  }

  /**
   * Get permissions by category
   * @param {string} category - Category name
   * @returns {Array} Permissions in category
   */
  getPermissionsByCategory(category) {
    return this.getAllPermissions().filter(p => p.category === category);
  }

  /**
   * Get all categories
   * @returns {Array} All categories
   */
  getCategories() {
    const categories = new Set();
    this.permissions.forEach(perm => {
      categories.add(perm.category);
    });
    return Array.from(categories);
  }

  /**
   * Get all roles
   * @returns {Array} All roles
   */
  getAllRoles() {
    return Array.from(this.roles.values());
  }

  /**
   * Get user permissions
   * @param {string} userId - User ID
   * @returns {Object} User permissions
   */
  getUserPermissions(userId) {
    const role = this.getUserRole(userId);
    const userPerms = this.userPermissions.get(userId) || { granted: [], denied: [] };

    return {
      role: role.id,
      rolePermissions: role.permissions,
      granted: userPerms.granted,
      denied: userPerms.denied,
      effective: this.getEffectivePermissions(userId)
    };
  }

  /**
   * Get effective permissions for user
   * @param {string} userId - User ID
   * @returns {Array} Effective permissions
   */
  getEffectivePermissions(userId) {
    const role = this.getUserRole(userId);
    const userPerms = this.userPermissions.get(userId) || { granted: [], denied: [] };

    // Start with role permissions
    const effective = new Set(role.permissions);

    // Add granted permissions
    userPerms.granted.forEach(perm => effective.add(perm));

    // Remove denied permissions
    userPerms.denied.forEach(perm => effective.delete(perm));

    return Array.from(effective);
  }

  /**
   * Request permission
   * @param {string} userId - User ID
   * @param {string} permission - Permission ID
   * @param {string} reason - Reason for request
   * @returns {Promise<boolean>} True if granted
   */
  async requestPermission(userId, permission, reason) {
    // For now, auto-grant for demo
    // In production, this would show a prompt or queue for admin approval
    this.grantPermission(userId, permission);
    return true;
  }

  /**
   * Save permissions to localStorage
   */
  savePermissions() {
    try {
      const data = {};
      this.userPermissions.forEach((perms, userId) => {
        data[userId] = perms;
      });
      localStorage.setItem('webos-user-permissions', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving permissions:', error);
    }
  }

  /**
   * Load permissions from localStorage
   */
  loadPermissions() {
    try {
      const stored = localStorage.getItem('webos-user-permissions');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([userId, perms]) => {
          this.userPermissions.set(userId, perms);
        });
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
    }
  }

  /**
   * Save roles to localStorage
   */
  saveRoles() {
    try {
      const customRoles = Array.from(this.roles.values())
        .filter(r => r.custom)
        .map(r => ({ ...r }));

      localStorage.setItem('webos-custom-roles', JSON.stringify(customRoles));
    } catch (error) {
      console.error('Error saving roles:', error);
    }
  }

  /**
   * Load roles from localStorage
   */
  loadRoles() {
    try {
      const stored = localStorage.getItem('webos-custom-roles');
      if (stored) {
        const customRoles = JSON.parse(stored);
        customRoles.forEach(role => {
          this.roles.set(role.id, role);
        });
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  }
}

export default new PermissionManager();
