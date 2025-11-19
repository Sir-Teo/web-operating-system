/**
 * User Manager Application
 * Manage user accounts and profiles
 */
export default class UserManagerApp {
  constructor(context) {
    this.context = context;
    this.kernel = context.kernel;
    this.userManager = context.kernel.userManager;
    this.container = null;
    this.selectedUser = null;
  }

  async init() {
    // Nothing to initialize
  }

  async render() {
    this.container = document.createElement('div');
    this.container.className = 'user-manager-app';
    this.container.innerHTML = this.getHTML();

    this.applyStyles();
    this.setupEventListeners();
    await this.loadUsers();

    return this.container;
  }

  getHTML() {
    const currentUser = this.userManager.getCurrentUser();
    const stats = this.userManager.getStatistics();

    return `
      <div class="user-manager-layout">
        <!-- Header -->
        <div class="user-manager-header">
          <div>
            <h2>User Accounts</h2>
            <p class="header-subtitle">Manage user accounts and profiles</p>
          </div>
          <div class="header-stats">
            <div class="stat-card">
              <div class="stat-value">${stats.totalUsers}</div>
              <div class="stat-label">Total Users</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.activeUsers}</div>
              <div class="stat-label">Active Sessions</div>
            </div>
          </div>
        </div>

        <!-- Toolbar -->
        <div class="user-manager-toolbar">
          <button class="btn btn-primary" id="add-user-btn">
            ➕ Add User
          </button>
          <button class="btn btn-secondary" id="refresh-btn">
            🔄 Refresh
          </button>
          <div class="search-box">
            <input type="text" id="search-input" placeholder="Search users..." />
          </div>
        </div>

        <!-- User List -->
        <div class="user-list-container">
          <table class="user-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Username</th>
                <th>Role</th>
                <th>Created</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="user-list-body">
              <tr>
                <td colspan="6" class="loading-cell">Loading users...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit User Modal -->
      <div class="modal" id="user-modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="modal-title">Add User</h3>
            <button class="close-btn" id="close-modal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="edit-username">Username</label>
              <input type="text" id="edit-username" class="form-control" placeholder="Enter username" />
            </div>
            <div class="form-group">
              <label for="edit-displayname">Display Name</label>
              <input type="text" id="edit-displayname" class="form-control" placeholder="Enter display name" />
            </div>
            <div class="form-group">
              <label for="edit-role">Role</label>
              <select id="edit-role" class="form-control">
                <option value="user">User</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div class="form-group" id="password-group">
              <label for="edit-password">Password</label>
              <input type="password" id="edit-password" class="form-control" placeholder="Enter password" />
            </div>
            <div class="form-group" id="confirm-password-group">
              <label for="edit-confirm-password">Confirm Password</label>
              <input type="password" id="edit-confirm-password" class="form-control" placeholder="Confirm password" />
            </div>
            <div class="error-message" id="modal-error" style="display: none;"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancel-modal-btn">Cancel</button>
            <button class="btn btn-primary" id="save-user-btn">Save</button>
          </div>
        </div>
      </div>

      <!-- Change Password Modal -->
      <div class="modal" id="password-modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Change Password</h3>
            <button class="close-btn" id="close-password-modal">&times;</button>
          </div>
          <div class="modal-body">
            <p id="password-modal-user"></p>
            <div class="form-group">
              <label for="old-password">Current Password</label>
              <input type="password" id="old-password" class="form-control" placeholder="Enter current password" />
            </div>
            <div class="form-group">
              <label for="new-password">New Password</label>
              <input type="password" id="new-password" class="form-control" placeholder="Enter new password" />
            </div>
            <div class="form-group">
              <label for="confirm-new-password">Confirm New Password</label>
              <input type="password" id="confirm-new-password" class="form-control" placeholder="Confirm new password" />
            </div>
            <div class="error-message" id="password-error" style="display: none;"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancel-password-btn">Cancel</button>
            <button class="btn btn-primary" id="save-password-btn">Change Password</button>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Add user button
    this.container.querySelector('#add-user-btn')?.addEventListener('click', () => {
      this.showAddUserModal();
    });

    // Refresh button
    this.container.querySelector('#refresh-btn')?.addEventListener('click', async () => {
      await this.loadUsers();
    });

    // Search input
    this.container.querySelector('#search-input')?.addEventListener('input', (e) => {
      this.filterUsers(e.target.value);
    });

    // User modal handlers
    this.setupUserModalHandlers();
    this.setupPasswordModalHandlers();
  }

  setupUserModalHandlers() {
    const modal = this.container.querySelector('#user-modal');
    const closeBtn = this.container.querySelector('#close-modal');
    const cancelBtn = this.container.querySelector('#cancel-modal-btn');
    const saveBtn = this.container.querySelector('#save-user-btn');

    const closeModal = () => {
      modal.style.display = 'none';
      this.clearUserForm();
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    saveBtn?.addEventListener('click', () => this.saveUser());
  }

  setupPasswordModalHandlers() {
    const modal = this.container.querySelector('#password-modal');
    const closeBtn = this.container.querySelector('#close-password-modal');
    const cancelBtn = this.container.querySelector('#cancel-password-btn');
    const saveBtn = this.container.querySelector('#save-password-btn');

    const closeModal = () => {
      modal.style.display = 'none';
      this.clearPasswordForm();
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    saveBtn?.addEventListener('click', () => this.changePassword());
  }

  async loadUsers() {
    const tbody = this.container.querySelector('#user-list-body');
    const users = this.userManager.getAllUsers();
    const currentUser = this.userManager.getCurrentUser();

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">No users found</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(user => this.renderUserRow(user, currentUser)).join('');

    // Add event listeners to action buttons
    this.setupUserActions();
  }

  renderUserRow(user, currentUser) {
    const isCurrentUser = currentUser && user.username === currentUser.username;
    const canDelete = !user.isGuest && !isCurrentUser;

    return `
      <tr class="user-row ${isCurrentUser ? 'current-user' : ''}" data-username="${user.username}">
        <td>
          <div class="user-cell">
            <span class="user-avatar-small">${user.avatar}</span>
            <span class="user-display-name">${user.displayName}</span>
            ${isCurrentUser ? '<span class="badge badge-current">Current</span>' : ''}
          </div>
        </td>
        <td>@${user.username}</td>
        <td>
          <span class="badge badge-${user.role}">
            ${user.role === 'admin' ? '👑' : '👤'} ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>
        </td>
        <td>${this.formatDate(user.createdAt)}</td>
        <td>${user.lastLogin ? this.formatDate(user.lastLogin) : 'Never'}</td>
        <td>
          <div class="action-buttons">
            ${!user.isGuest ? `
              <button class="btn-icon" data-action="edit" data-username="${user.username}" title="Edit">
                ✏️
              </button>
              <button class="btn-icon" data-action="password" data-username="${user.username}" title="Change Password">
                🔑
              </button>
            ` : ''}
            ${canDelete ? `
              <button class="btn-icon btn-danger" data-action="delete" data-username="${user.username}" title="Delete">
                🗑️
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }

  setupUserActions() {
    // Edit buttons
    this.container.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const username = btn.dataset.username;
        this.showEditUserModal(username);
      });
    });

    // Password buttons
    this.container.querySelectorAll('[data-action="password"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const username = btn.dataset.username;
        this.showChangePasswordModal(username);
      });
    });

    // Delete buttons
    this.container.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const username = btn.dataset.username;
        this.deleteUser(username);
      });
    });
  }

  showAddUserModal() {
    this.selectedUser = null;
    const modal = this.container.querySelector('#user-modal');
    this.container.querySelector('#modal-title').textContent = 'Add User';
    this.container.querySelector('#edit-username').disabled = false;
    this.container.querySelector('#password-group').style.display = 'block';
    this.container.querySelector('#confirm-password-group').style.display = 'block';
    this.clearUserForm();
    modal.style.display = 'flex';
  }

  showEditUserModal(username) {
    const user = this.userManager.getUserByUsername(username);
    if (!user) return;

    this.selectedUser = user;
    const modal = this.container.querySelector('#user-modal');
    this.container.querySelector('#modal-title').textContent = 'Edit User';
    this.container.querySelector('#edit-username').value = user.username;
    this.container.querySelector('#edit-username').disabled = true;
    this.container.querySelector('#edit-displayname').value = user.displayName;
    this.container.querySelector('#edit-role').value = user.role;
    this.container.querySelector('#password-group').style.display = 'none';
    this.container.querySelector('#confirm-password-group').style.display = 'none';
    modal.style.display = 'flex';
  }

  showChangePasswordModal(username) {
    const user = this.userManager.getUserByUsername(username);
    if (!user) return;

    this.selectedUser = user;
    const modal = this.container.querySelector('#password-modal');
    this.container.querySelector('#password-modal-user').textContent =
      `Change password for ${user.displayName} (@${user.username})`;
    this.clearPasswordForm();
    modal.style.display = 'flex';
  }

  async saveUser() {
    const username = this.container.querySelector('#edit-username').value.trim();
    const displayName = this.container.querySelector('#edit-displayname').value.trim();
    const role = this.container.querySelector('#edit-role').value;
    const password = this.container.querySelector('#edit-password').value;
    const confirmPassword = this.container.querySelector('#edit-confirm-password').value;

    try {
      if (this.selectedUser) {
        // Edit existing user
        await this.userManager.updateUser(username, {
          displayName,
          role
        });
        this.showSuccess('User updated successfully');
      } else {
        // Create new user
        if (!username) throw new Error('Username is required');
        if (!password) throw new Error('Password is required');
        if (password !== confirmPassword) throw new Error('Passwords do not match');
        if (password.length < 6) throw new Error('Password must be at least 6 characters');

        await this.userManager.createUser({
          username,
          displayName: displayName || username,
          password,
          role
        });
        this.showSuccess('User created successfully');
      }

      this.container.querySelector('#user-modal').style.display = 'none';
      this.clearUserForm();
      await this.loadUsers();
    } catch (error) {
      this.showError('modal-error', error.message);
    }
  }

  async changePassword() {
    const oldPassword = this.container.querySelector('#old-password').value;
    const newPassword = this.container.querySelector('#new-password').value;
    const confirmPassword = this.container.querySelector('#confirm-new-password').value;

    try {
      if (!oldPassword) throw new Error('Current password is required');
      if (!newPassword) throw new Error('New password is required');
      if (newPassword !== confirmPassword) throw new Error('Passwords do not match');
      if (newPassword.length < 6) throw new Error('Password must be at least 6 characters');

      await this.userManager.changePassword(
        this.selectedUser.username,
        oldPassword,
        newPassword
      );

      this.showSuccess('Password changed successfully');
      this.container.querySelector('#password-modal').style.display = 'none';
      this.clearPasswordForm();
    } catch (error) {
      this.showError('password-error', error.message);
    }
  }

  async deleteUser(username) {
    const user = this.userManager.getUserByUsername(username);
    if (!user) return;

    if (!confirm(`Are you sure you want to delete user "${user.displayName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await this.userManager.deleteUser(username);
      this.showSuccess('User deleted successfully');
      await this.loadUsers();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }

  filterUsers(query) {
    const rows = this.container.querySelectorAll('.user-row');
    const lowerQuery = query.toLowerCase();

    rows.forEach(row => {
      const username = row.dataset.username.toLowerCase();
      const displayName = row.querySelector('.user-display-name').textContent.toLowerCase();
      const matches = username.includes(lowerQuery) || displayName.includes(lowerQuery);
      row.style.display = matches ? '' : 'none';
    });
  }

  clearUserForm() {
    this.container.querySelector('#edit-username').value = '';
    this.container.querySelector('#edit-displayname').value = '';
    this.container.querySelector('#edit-role').value = 'user';
    this.container.querySelector('#edit-password').value = '';
    this.container.querySelector('#edit-confirm-password').value = '';
    this.hideError('modal-error');
  }

  clearPasswordForm() {
    this.container.querySelector('#old-password').value = '';
    this.container.querySelector('#new-password').value = '';
    this.container.querySelector('#confirm-new-password').value = '';
    this.hideError('password-error');
  }

  showError(elementId, message) {
    const el = this.container.querySelector(`#${elementId}`);
    if (el) {
      el.textContent = message;
      el.style.display = 'block';
    }
  }

  hideError(elementId) {
    const el = this.container.querySelector(`#${elementId}`);
    if (el) {
      el.style.display = 'none';
    }
  }

  showSuccess(message) {
    // Simple alert for now - could be improved with a toast notification
    alert(message);
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  applyStyles() {
    const styleId = 'user-manager-app-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .user-manager-app {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #f5f5f5;
        font-family: system-ui, -apple-system, sans-serif;
      }

      .user-manager-layout {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .user-manager-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .user-manager-header h2 {
        margin: 0 0 5px 0;
        font-size: 2rem;
      }

      .header-subtitle {
        margin: 0;
        opacity: 0.9;
      }

      .header-stats {
        display: flex;
        gap: 20px;
      }

      .stat-card {
        background: rgba(255,255,255,0.2);
        padding: 15px 25px;
        border-radius: 10px;
        text-align: center;
      }

      .stat-value {
        font-size: 2rem;
        font-weight: bold;
      }

      .stat-label {
        font-size: 0.9rem;
        opacity: 0.9;
        margin-top: 5px;
      }

      .user-manager-toolbar {
        background: white;
        padding: 20px;
        display: flex;
        gap: 10px;
        align-items: center;
        border-bottom: 1px solid #e0e0e0;
      }

      .search-box {
        margin-left: auto;
      }

      .search-box input {
        padding: 8px 15px;
        border: 2px solid #e0e0e0;
        border-radius: 20px;
        width: 250px;
        font-size: 0.9rem;
      }

      .search-box input:focus {
        outline: none;
        border-color: #667eea;
      }

      .user-list-container {
        flex: 1;
        overflow: auto;
        background: white;
        margin: 20px;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }

      .user-table {
        width: 100%;
        border-collapse: collapse;
      }

      .user-table th {
        background: #f8f9fa;
        padding: 15px;
        text-align: left;
        font-weight: 600;
        border-bottom: 2px solid #e0e0e0;
        position: sticky;
        top: 0;
      }

      .user-table td {
        padding: 15px;
        border-bottom: 1px solid #f0f0f0;
      }

      .user-row:hover {
        background: #f8f9fa;
      }

      .user-row.current-user {
        background: #e8f5e9;
      }

      .user-cell {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .user-avatar-small {
        font-size: 2rem;
      }

      .user-display-name {
        font-weight: 600;
      }

      .badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.85rem;
        font-weight: 600;
      }

      .badge-current {
        background: #4caf50;
        color: white;
        margin-left: 10px;
      }

      .badge-admin {
        background: #ff9800;
        color: white;
      }

      .badge-user {
        background: #2196f3;
        color: white;
      }

      .action-buttons {
        display: flex;
        gap: 5px;
      }

      .btn-icon {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 5px;
        border-radius: 5px;
        transition: background 0.2s;
      }

      .btn-icon:hover {
        background: #f0f0f0;
      }

      .btn-icon.btn-danger:hover {
        background: #ffebee;
      }

      .loading-cell, .empty-cell {
        text-align: center;
        padding: 40px;
        color: #999;
      }

      .btn {
        padding: 8px 20px;
        border: none;
        border-radius: 6px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
      }

      .btn-secondary {
        background: white;
        color: #666;
        border: 2px solid #e0e0e0;
      }

      .btn-secondary:hover {
        background: #f5f5f5;
        border-color: #ccc;
      }

      .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .modal-content {
        background: white;
        border-radius: 10px;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 25px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 10px 10px 0 0;
      }

      .modal-header h3 {
        margin: 0;
      }

      .close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 2rem;
        cursor: pointer;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }

      .close-btn:hover {
        background: rgba(255,255,255,0.2);
      }

      .modal-body {
        padding: 25px;
      }

      .modal-footer {
        padding: 20px 25px;
        background: #f5f5f5;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        border-radius: 0 0 10px 10px;
      }

      .form-group {
        margin-bottom: 20px;
      }

      .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #333;
      }

      .form-control {
        width: 100%;
        padding: 10px;
        border: 2px solid #e0e0e0;
        border-radius: 6px;
        font-size: 1rem;
        box-sizing: border-box;
      }

      .form-control:focus {
        outline: none;
        border-color: #667eea;
      }

      .form-control:disabled {
        background: #f5f5f5;
        cursor: not-allowed;
      }

      .error-message {
        background: #ffebee;
        color: #c62828;
        padding: 12px;
        border-radius: 6px;
        margin-top: 15px;
        font-size: 0.9rem;
      }
    `;
    document.head.appendChild(style);
  }
}
