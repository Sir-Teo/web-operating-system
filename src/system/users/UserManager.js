/**
 * User Manager
 * Manages user accounts and authentication
 */
export class UserManager {
  constructor(kernel) {
    this.kernel = kernel;
    this.users = new Map();
    this.currentUser = null;
    this.sessions = new Map();
    this.loadUsers();
  }

  /**
   * Initialize user system
   */
  async init() {
    // Create default guest user if none exist
    if (this.users.size === 0) {
      await this.createUser({
        username: 'guest',
        displayName: 'Guest User',
        password: '', // No password for guest
        role: 'user',
        isGuest: true
      });
    }

    // Don't auto-login - let LoginScreen handle this
    // Login will be handled by the UI layer
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Object} Created user
   */
  async createUser(userData) {
    const { username, displayName, password, role = 'user', isGuest = false } = userData;

    // Validate
    if (!username) {
      throw new Error('Username is required');
    }

    if (this.users.has(username)) {
      throw new Error('Username already exists');
    }

    // Hash password (simple hash for demo - use proper hashing in production)
    const passwordHash = password ? await this.hashPassword(password) : '';

    const user = {
      id: `user-${Date.now()}`,
      username,
      displayName: displayName || username,
      passwordHash,
      role,
      isGuest,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      settings: {
        theme: 'default-dark',
        language: 'en',
        startupApps: []
      },
      avatar: this.getDefaultAvatar(username)
    };

    this.users.set(username, user);
    this.saveUsers();

    // Create home directory for the user
    try {
      const vfs = this.kernel.vfs;
      if (vfs && !await vfs.userHomeExists(username)) {
        await vfs.createUserHome(username);
      }
    } catch (error) {
      console.error(`Failed to create home directory for ${username}:`, error);
      // Don't fail user creation if home directory creation fails
    }

    console.log(`User created: ${username}`);
    return this.sanitizeUser(user);
  }

  /**
   * Delete a user
   * @param {string} username - Username
   */
  async deleteUser(username) {
    if (username === 'guest') {
      throw new Error('Cannot delete guest user');
    }

    const user = this.users.get(username);
    if (!user) {
      throw new Error('User not found');
    }

    // Don't allow deleting current user
    if (this.currentUser?.username === username) {
      throw new Error('Cannot delete current user');
    }

    this.users.delete(username);
    this.saveUsers();

    console.log(`User deleted: ${username}`);
  }

  /**
   * Login user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Object} Session
   */
  async login(username, password) {
    const user = this.users.get(username);
    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Verify password (skip for guest)
    if (!user.isGuest) {
      const passwordHash = await this.hashPassword(password);
      if (passwordHash !== user.passwordHash) {
        throw new Error('Invalid username or password');
      }
    }

    // Ensure user home directory exists
    try {
      const vfs = this.kernel.vfs;
      if (vfs && !await vfs.userHomeExists(username)) {
        await vfs.createUserHome(username);
      }
    } catch (error) {
      console.error(`Failed to ensure home directory for ${username}:`, error);
      // Don't fail login if home directory creation fails
    }

    // Create session
    const sessionId = `session-${Date.now()}`;
    const session = {
      id: sessionId,
      username,
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      homeDirectory: `/home/${username}`
    };

    this.sessions.set(sessionId, session);
    this.currentUser = user;
    user.lastLogin = session.loginTime;

    this.saveUsers();

    console.log(`User logged in: ${username}`);

    // Trigger login event
    window.dispatchEvent(new CustomEvent('user-login', {
      detail: { user: this.sanitizeUser(user), homeDirectory: `/home/${username}` }
    }));

    return {
      sessionId,
      user: this.sanitizeUser(user),
      homeDirectory: `/home/${username}`
    };
  }

  /**
   * Logout current user
   */
  async logout() {
    if (!this.currentUser) {
      return;
    }

    const username = this.currentUser.username;

    // Clear session
    this.sessions.clear();

    // Trigger logout event
    window.dispatchEvent(new CustomEvent('user-logout', {
      detail: { username }
    }));

    this.currentUser = null;

    console.log(`User logged out: ${username}`);

    // Auto-login as guest
    await this.login('guest', '');
  }

  /**
   * Switch user
   * @param {string} username - Username
   * @param {string} password - Password
   */
  async switchUser(username, password) {
    await this.logout();
    return await this.login(username, password);
  }

  /**
   * Get current user
   * @returns {Object} Current user
   */
  getCurrentUser() {
    return this.currentUser ? this.sanitizeUser(this.currentUser) : null;
  }

  /**
   * Update user
   * @param {string} username - Username
   * @param {Object} updates - Updates
   */
  async updateUser(username, updates) {
    const user = this.users.get(username);
    if (!user) {
      throw new Error('User not found');
    }

    // Don't allow updating certain fields
    const protectedFields = ['id', 'username', 'createdAt', 'passwordHash'];
    Object.entries(updates).forEach(([key, value]) => {
      if (!protectedFields.includes(key)) {
        if (key === 'settings') {
          user.settings = { ...user.settings, ...value };
        } else {
          user[key] = value;
        }
      }
    });

    this.saveUsers();

    console.log(`User updated: ${username}`);
  }

  /**
   * Change password
   * @param {string} username - Username
   * @param {string} oldPassword - Old password
   * @param {string} newPassword - New password
   */
  async changePassword(username, oldPassword, newPassword) {
    const user = this.users.get(username);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isGuest) {
      throw new Error('Cannot change guest password');
    }

    // Verify old password
    const oldHash = await this.hashPassword(oldPassword);
    if (oldHash !== user.passwordHash) {
      throw new Error('Invalid current password');
    }

    // Set new password
    user.passwordHash = await this.hashPassword(newPassword);
    this.saveUsers();

    console.log(`Password changed for: ${username}`);
  }

  /**
   * Get all users
   * @returns {Array} All users
   */
  getAllUsers() {
    return Array.from(this.users.values()).map(u => this.sanitizeUser(u));
  }

  /**
   * Get user by username
   * @param {string} username - Username
   * @returns {Object} User
   */
  getUserByUsername(username) {
    const user = this.users.get(username);
    return user ? this.sanitizeUser(user) : null;
  }

  /**
   * Check if username exists
   * @param {string} username - Username
   * @returns {boolean} True if exists
   */
  userExists(username) {
    return this.users.has(username);
  }

  /**
   * Sanitize user (remove sensitive data)
   * @param {Object} user - User object
   * @returns {Object} Sanitized user
   */
  sanitizeUser(user) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Hash password
   * @param {string} password - Password
   * @returns {string} Hash
   */
  async hashPassword(password) {
    // Simple hash for demo - use proper hashing (bcrypt, argon2) in production
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get default avatar
   * @param {string} username - Username
   * @returns {string} Avatar emoji
   */
  getDefaultAvatar(username) {
    const avatars = ['👤', '👨', '👩', '🧑', '👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🎨', '👩‍🎨'];
    const index = username.length % avatars.length;
    return avatars[index];
  }

  /**
   * Save users to localStorage
   */
  saveUsers() {
    try {
      const usersData = Array.from(this.users.values());
      localStorage.setItem('webos-users', JSON.stringify(usersData));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  /**
   * Load users from localStorage
   */
  loadUsers() {
    try {
      const stored = localStorage.getItem('webos-users');
      if (stored) {
        const usersData = JSON.parse(stored);
        usersData.forEach(user => {
          this.users.set(user.username, user);
        });
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  /**
   * Check if user has permission
   * @param {string} permission - Permission name
   * @returns {boolean} True if has permission
   */
  hasPermission(permission) {
    if (!this.currentUser) {
      return false;
    }

    // Admin has all permissions
    if (this.currentUser.role === 'admin') {
      return true;
    }

    // Add more permission logic as needed
    return true; // Default allow for demo
  }

  /**
   * Get user statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    return {
      totalUsers: this.users.size,
      activeUsers: this.sessions.size,
      guestUsers: Array.from(this.users.values()).filter(u => u.isGuest).length,
      adminUsers: Array.from(this.users.values()).filter(u => u.role === 'admin').length
    };
  }
}

export default UserManager;
