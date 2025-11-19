/**
 * Login Screen
 * Handles user authentication and login
 */
export class LoginScreen {
  constructor(kernel) {
    this.kernel = kernel;
    this.userManager = kernel.userManager;
    this.container = null;
    this.selectedUser = null;
  }

  /**
   * Show the login screen
   */
  async show() {
    this.container = document.getElementById('login-screen');
    if (!this.container) {
      this.container = this.createContainer();
      document.body.appendChild(this.container);
    }

    await this.render();
    this.container.style.display = 'flex';
  }

  /**
   * Hide the login screen
   */
  hide() {
    if (this.container) {
      this.container.style.opacity = '0';
      setTimeout(() => {
        this.container.style.display = 'none';
      }, 500);
    }
  }

  /**
   * Create the container element
   */
  createContainer() {
    const container = document.createElement('div');
    container.id = 'login-screen';
    container.className = 'login-screen';
    return container;
  }

  /**
   * Render the login screen
   */
  async render() {
    const users = this.userManager.getAllUsers();
    const guestUser = users.find(u => u.isGuest);

    this.container.innerHTML = `
      <div class="login-background"></div>
      <div class="login-container">
        <div class="login-header">
          <h1 class="login-logo">WebOS</h1>
          <p class="login-subtitle">Select a user to continue</p>
        </div>

        <div class="login-users">
          ${users.map(user => this.renderUserCard(user)).join('')}
          <div class="user-card user-card-add" data-action="add-user">
            <div class="user-avatar">➕</div>
            <div class="user-name">Add User</div>
          </div>
        </div>

        <div class="login-actions">
          <button class="btn btn-secondary" id="guest-login-btn">
            Continue as Guest
          </button>
        </div>
      </div>

      <div class="login-form-overlay" id="login-form-overlay" style="display: none;">
        <div class="login-form-container">
          <div class="login-form-header">
            <h2 id="login-form-title">Login</h2>
            <button class="close-btn" id="close-login-form">&times;</button>
          </div>
          <div class="login-form-body">
            <div class="user-info" id="selected-user-info"></div>
            <div class="form-group">
              <label for="password-input">Password</label>
              <input
                type="password"
                id="password-input"
                class="form-control"
                placeholder="Enter password"
                autocomplete="current-password"
              />
            </div>
            <div class="error-message" id="login-error" style="display: none;"></div>
          </div>
          <div class="login-form-footer">
            <button class="btn btn-secondary" id="cancel-login-btn">Cancel</button>
            <button class="btn btn-primary" id="submit-login-btn">Login</button>
          </div>
        </div>
      </div>

      <div class="login-form-overlay" id="create-user-overlay" style="display: none;">
        <div class="login-form-container">
          <div class="login-form-header">
            <h2>Create New User</h2>
            <button class="close-btn" id="close-create-form">&times;</button>
          </div>
          <div class="login-form-body">
            <div class="form-group">
              <label for="new-username">Username</label>
              <input
                type="text"
                id="new-username"
                class="form-control"
                placeholder="Enter username"
                autocomplete="username"
              />
            </div>
            <div class="form-group">
              <label for="new-display-name">Display Name</label>
              <input
                type="text"
                id="new-display-name"
                class="form-control"
                placeholder="Enter display name"
              />
            </div>
            <div class="form-group">
              <label for="new-password">Password</label>
              <input
                type="password"
                id="new-password"
                class="form-control"
                placeholder="Enter password"
                autocomplete="new-password"
              />
            </div>
            <div class="form-group">
              <label for="confirm-password">Confirm Password</label>
              <input
                type="password"
                id="confirm-password"
                class="form-control"
                placeholder="Confirm password"
                autocomplete="new-password"
              />
            </div>
            <div class="error-message" id="create-error" style="display: none;"></div>
          </div>
          <div class="login-form-footer">
            <button class="btn btn-secondary" id="cancel-create-btn">Cancel</button>
            <button class="btn btn-primary" id="submit-create-btn">Create</button>
          </div>
        </div>
      </div>
    `;

    this.applyStyles();
    this.setupEventListeners();
  }

  /**
   * Render a single user card
   */
  renderUserCard(user) {
    return `
      <div class="user-card" data-username="${user.username}">
        <div class="user-avatar">${user.avatar}</div>
        <div class="user-name">${user.displayName}</div>
        ${user.lastLogin ? `<div class="user-last-login">Last login: ${this.formatDate(user.lastLogin)}</div>` : ''}
      </div>
    `;
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // User card clicks
    this.container.querySelectorAll('.user-card:not(.user-card-add)').forEach(card => {
      card.addEventListener('click', () => {
        const username = card.dataset.username;
        this.showLoginForm(username);
      });
    });

    // Add user button
    const addUserCard = this.container.querySelector('.user-card-add');
    if (addUserCard) {
      addUserCard.addEventListener('click', () => {
        this.showCreateUserForm();
      });
    }

    // Guest login
    const guestBtn = this.container.querySelector('#guest-login-btn');
    if (guestBtn) {
      guestBtn.addEventListener('click', async () => {
        await this.loginAsGuest();
      });
    }

    // Login form handlers
    this.setupLoginFormHandlers();
    this.setupCreateUserFormHandlers();
  }

  /**
   * Setup login form handlers
   */
  setupLoginFormHandlers() {
    const overlay = this.container.querySelector('#login-form-overlay');
    const closeBtn = this.container.querySelector('#close-login-form');
    const cancelBtn = this.container.querySelector('#cancel-login-btn');
    const submitBtn = this.container.querySelector('#submit-login-btn');
    const passwordInput = this.container.querySelector('#password-input');

    const closeForm = () => {
      overlay.style.display = 'none';
      passwordInput.value = '';
      this.hideError('login-error');
    };

    closeBtn?.addEventListener('click', closeForm);
    cancelBtn?.addEventListener('click', closeForm);

    submitBtn?.addEventListener('click', async () => {
      await this.handleLogin();
    });

    passwordInput?.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        await this.handleLogin();
      }
    });
  }

  /**
   * Setup create user form handlers
   */
  setupCreateUserFormHandlers() {
    const overlay = this.container.querySelector('#create-user-overlay');
    const closeBtn = this.container.querySelector('#close-create-form');
    const cancelBtn = this.container.querySelector('#cancel-create-btn');
    const submitBtn = this.container.querySelector('#submit-create-btn');

    const closeForm = () => {
      overlay.style.display = 'none';
      this.container.querySelector('#new-username').value = '';
      this.container.querySelector('#new-display-name').value = '';
      this.container.querySelector('#new-password').value = '';
      this.container.querySelector('#confirm-password').value = '';
      this.hideError('create-error');
    };

    closeBtn?.addEventListener('click', closeForm);
    cancelBtn?.addEventListener('click', closeForm);

    submitBtn?.addEventListener('click', async () => {
      await this.handleCreateUser();
    });
  }

  /**
   * Show login form for a specific user
   */
  showLoginForm(username) {
    const user = this.userManager.getUserByUsername(username);
    if (!user) return;

    this.selectedUser = user;

    const overlay = this.container.querySelector('#login-form-overlay');
    const userInfo = this.container.querySelector('#selected-user-info');
    const passwordInput = this.container.querySelector('#password-input');

    userInfo.innerHTML = `
      <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
        <div style="font-size: 3rem;">${user.avatar}</div>
        <div>
          <div style="font-size: 1.2rem; font-weight: 600;">${user.displayName}</div>
          <div style="font-size: 0.9rem; opacity: 0.7;">@${user.username}</div>
        </div>
      </div>
    `;

    overlay.style.display = 'flex';
    setTimeout(() => passwordInput?.focus(), 100);
  }

  /**
   * Show create user form
   */
  showCreateUserForm() {
    const overlay = this.container.querySelector('#create-user-overlay');
    overlay.style.display = 'flex';
    setTimeout(() => {
      this.container.querySelector('#new-username')?.focus();
    }, 100);
  }

  /**
   * Handle login submission
   */
  async handleLogin() {
    const passwordInput = this.container.querySelector('#password-input');
    const password = passwordInput.value;

    try {
      await this.userManager.login(this.selectedUser.username, password);
      this.hide();
      this.dispatchLoginSuccess();
    } catch (error) {
      this.showError('login-error', error.message);
      passwordInput.value = '';
      passwordInput.focus();
    }
  }

  /**
   * Handle create user submission
   */
  async handleCreateUser() {
    const username = this.container.querySelector('#new-username').value.trim();
    const displayName = this.container.querySelector('#new-display-name').value.trim();
    const password = this.container.querySelector('#new-password').value;
    const confirmPassword = this.container.querySelector('#confirm-password').value;

    // Validation
    if (!username) {
      this.showError('create-error', 'Username is required');
      return;
    }

    if (username.length < 3) {
      this.showError('create-error', 'Username must be at least 3 characters');
      return;
    }

    if (!/^[a-z0-9_-]+$/i.test(username)) {
      this.showError('create-error', 'Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }

    if (!password) {
      this.showError('create-error', 'Password is required');
      return;
    }

    if (password.length < 6) {
      this.showError('create-error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      this.showError('create-error', 'Passwords do not match');
      return;
    }

    try {
      await this.userManager.createUser({
        username,
        displayName: displayName || username,
        password,
        role: 'user'
      });

      // Close create form and refresh user list
      this.container.querySelector('#create-user-overlay').style.display = 'none';
      await this.render();

      // Show success message
      alert(`User "${displayName || username}" created successfully!`);
    } catch (error) {
      this.showError('create-error', error.message);
    }
  }

  /**
   * Login as guest
   */
  async loginAsGuest() {
    try {
      await this.userManager.login('guest', '');
      this.hide();
      this.dispatchLoginSuccess();
    } catch (error) {
      console.error('Guest login failed:', error);
      alert('Failed to login as guest: ' + error.message);
    }
  }

  /**
   * Show error message
   */
  showError(elementId, message) {
    const errorElement = this.container.querySelector(`#${elementId}`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  /**
   * Hide error message
   */
  hideError(elementId) {
    const errorElement = this.container.querySelector(`#${elementId}`);
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }

  /**
   * Dispatch login success event
   */
  dispatchLoginSuccess() {
    window.dispatchEvent(new CustomEvent('login-success', {
      detail: { user: this.userManager.getCurrentUser() }
    }));
  }

  /**
   * Apply styles
   */
  applyStyles() {
    const styleId = 'login-screen-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .login-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 1;
        transition: opacity 0.5s ease;
      }

      .login-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        opacity: 0.95;
      }

      .login-container {
        position: relative;
        z-index: 1;
        text-align: center;
        max-width: 800px;
        width: 90%;
      }

      .login-header {
        margin-bottom: 40px;
      }

      .login-logo {
        font-size: 3.5rem;
        font-weight: 700;
        color: white;
        margin: 0 0 10px 0;
        text-shadow: 0 2px 10px rgba(0,0,0,0.2);
      }

      .login-subtitle {
        font-size: 1.2rem;
        color: rgba(255,255,255,0.9);
        margin: 0;
      }

      .login-users {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }

      .user-card {
        background: rgba(255,255,255,0.15);
        backdrop-filter: blur(10px);
        border: 2px solid rgba(255,255,255,0.2);
        border-radius: 15px;
        padding: 25px 15px;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: center;
      }

      .user-card:hover {
        background: rgba(255,255,255,0.25);
        border-color: rgba(255,255,255,0.4);
        transform: translateY(-5px);
      }

      .user-card-add {
        border-style: dashed;
        opacity: 0.8;
      }

      .user-card-add:hover {
        opacity: 1;
      }

      .user-avatar {
        font-size: 3.5rem;
        margin-bottom: 10px;
      }

      .user-name {
        color: white;
        font-weight: 600;
        font-size: 1rem;
        margin-bottom: 5px;
      }

      .user-last-login {
        color: rgba(255,255,255,0.7);
        font-size: 0.75rem;
      }

      .login-actions {
        display: flex;
        justify-content: center;
        gap: 15px;
      }

      .login-form-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(5px);
      }

      .login-form-container {
        background: rgba(255,255,255,0.95);
        border-radius: 15px;
        padding: 0;
        max-width: 450px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        overflow: hidden;
      }

      .login-form-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 25px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .login-form-header h2 {
        margin: 0;
        font-size: 1.5rem;
      }

      .close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 2rem;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
      }

      .close-btn:hover {
        background: rgba(255,255,255,0.2);
      }

      .login-form-body {
        padding: 25px;
        color: #333;
      }

      .login-form-footer {
        padding: 20px 25px;
        background: #f5f5f5;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      .form-group {
        margin-bottom: 20px;
        text-align: left;
      }

      .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #333;
      }

      .form-control {
        width: 100%;
        padding: 12px;
        border: 2px solid #ddd;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.3s;
        box-sizing: border-box;
      }

      .form-control:focus {
        outline: none;
        border-color: #667eea;
      }

      .error-message {
        background: #ffe6e6;
        color: #d32f2f;
        padding: 12px;
        border-radius: 8px;
        margin-top: 15px;
        font-size: 0.9rem;
      }

      .btn {
        padding: 10px 24px;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
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
        background: rgba(255,255,255,0.2);
        color: white;
        border: 2px solid rgba(255,255,255,0.3);
      }

      .btn-secondary:hover {
        background: rgba(255,255,255,0.3);
        border-color: rgba(255,255,255,0.5);
      }

      .login-form-footer .btn-secondary {
        background: white;
        color: #666;
        border: 2px solid #ddd;
      }

      .login-form-footer .btn-secondary:hover {
        background: #f5f5f5;
        border-color: #ccc;
      }
    `;
    document.head.appendChild(style);
  }
}
