export class Taskbar {
  constructor(kernel) {
    this.kernel = kernel;
    this.element = document.getElementById('taskbar');
    this.startButton = document.getElementById('start-button');
    this.windowsContainer = document.getElementById('taskbar-windows');
    this.clock = document.getElementById('clock');
    this.windows = new Map();
    this.userMenuVisible = false;

    this._setupEventListeners();
    this._startClock();
    this._addUserMenu();
  }

  init() {
    this.show();
    this._updateUserDisplay();
  }

  _setupEventListeners() {
    this.startButton.addEventListener('click', () => {
      this._toggleStartMenu();
    });

    // Listen for window events
    window.addEventListener('window-created', (e) => {
      this.addWindow(e.detail.windowId, e.detail.title);
    });

    window.addEventListener('window-closed', (e) => {
      this.removeWindow(e.detail.windowId);
    });

    // Listen for user login/logout events
    window.addEventListener('user-login', () => {
      this._updateUserDisplay();
    });

    window.addEventListener('user-logout', () => {
      this._updateUserDisplay();
    });

    // Close user menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#user-menu-container') && this.userMenuVisible) {
        this._hideUserMenu();
      }
    });
  }

  addWindow(windowId, title) {
    const button = document.createElement('button');
    button.className = 'taskbar-window-button';
    button.dataset.windowId = windowId;
    button.title = title || 'Window'; // Tooltip for title since text is hidden

    // Try to find an icon based on title or default
    // In a real app, we'd pass the icon path/char from the window creation event
    const iconChar = this._getIconForTitle(title);
    button.innerHTML = `<span style="font-size: 20px;">${iconChar}</span>`;

    button.addEventListener('click', async () => {
      // Focus or minimize window
      const { default: WindowManager } = await import('./WindowManager.js');
      const window = WindowManager.getWindow(windowId);
      if (window) {
        if (window.winbox.min) {
          window.winbox.restore();
          button.classList.add('active');
        } else if (document.activeElement === window.winbox.body || window.winbox.focused) {
          window.winbox.minimize();
          button.classList.remove('active');
        } else {
          window.winbox.focus();
          button.classList.add('active');
        }
      }
    });

    this.windowsContainer.appendChild(button);
    this.windows.set(windowId, button);

    // Animate in
    button.style.opacity = '0';
    button.style.transform = 'scale(0.5)';
    requestAnimationFrame(() => {
      button.style.opacity = '1';
      button.style.transform = 'scale(1)';
    });
  }

  _getIconForTitle(title) {
    if (!title) return '📄';
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('terminal')) return '💻';
    if (lowerTitle.includes('file')) return '📁';
    if (lowerTitle.includes('editor')) return '📝';
    if (lowerTitle.includes('browser')) return '🌐';
    if (lowerTitle.includes('settings')) return '⚙️';
    if (lowerTitle.includes('calculator')) return '🧮';
    if (lowerTitle.includes('music')) return '🎵';
    if (lowerTitle.includes('video')) return '🎬';
    if (lowerTitle.includes('image')) return '🖼️';
    if (lowerTitle.includes('chat')) return '💬';
    return '📄';
  }

  removeWindow(windowId) {
    const button = this.windows.get(windowId);
    if (button) {
      button.style.opacity = '0';
      button.style.transform = 'scale(0.5)';
      setTimeout(() => {
        button.remove();
        this.windows.delete(windowId);
      }, 200);
    }
  }

  _toggleStartMenu() {
    const startMenu = document.getElementById('start-menu');
    const isVisible = startMenu.classList.contains('visible');

    if (isVisible) {
      startMenu.classList.remove('visible');
      setTimeout(() => {
        if (!startMenu.classList.contains('visible')) {
          startMenu.style.display = 'none';
        }
      }, 300); // Wait for transition
    } else {
      startMenu.style.display = 'flex';
      // Force reflow
      startMenu.offsetHeight;
      startMenu.classList.add('visible');
    }
  }

  _startClock() {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      // Optional: Add seconds or date
      // const seconds = String(now.getSeconds()).padStart(2, '0');
      this.clock.textContent = `${hours}:${minutes}`;
      this.clock.title = now.toLocaleDateString();
    };

    updateClock();
    setInterval(updateClock, 1000);
  }

  show() {
    this.element.style.display = 'flex';
  }

  hide() {
    this.element.style.display = 'none';
  }

  _addUserMenu() {
    const systemTray = document.getElementById('system-tray');
    if (!systemTray) return;

    // Create user menu container
    const userMenuContainer = document.createElement('div');
    userMenuContainer.id = 'user-menu-container';
    userMenuContainer.className = 'user-menu-container';
    userMenuContainer.innerHTML = `
      <button class="tray-icon user-icon" id="user-menu-button" title="User Account">
        <span id="user-avatar">👤</span>
      </button>
      <div class="user-menu" id="user-menu" style="display: none;">
        <div class="user-menu-header">
          <div id="user-menu-avatar" class="user-menu-avatar">👤</div>
          <div class="user-menu-info">
            <div id="user-menu-name" class="user-menu-name">Guest</div>
            <div id="user-menu-username" class="user-menu-username">@guest</div>
          </div>
        </div>
        <div class="user-menu-divider"></div>
        <div class="user-menu-items">
          <button class="user-menu-item" id="manage-account-btn">
            <span>👥</span> Manage Accounts
          </button>
          <button class="user-menu-item" id="switch-user-btn">
            <span>🔄</span> Switch User
          </button>
          <button class="user-menu-item" id="lock-screen-btn">
            <span>🔒</span> Lock Screen
          </button>
        </div>
        <div class="user-menu-divider"></div>
        <button class="user-menu-item user-menu-logout" id="logout-btn">
          <span>🚪</span> Log Out
        </button>
      </div>
    `;

    // Insert before clock
    systemTray.insertBefore(userMenuContainer, this.clock);

    this._setupUserMenuListeners();
    this._applyUserMenuStyles();
  }

  _setupUserMenuListeners() {
    const button = document.getElementById('user-menu-button');
    const menu = document.getElementById('user-menu');

    button?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleUserMenu();
    });

    document.getElementById('manage-account-btn')?.addEventListener('click', async () => {
      this._hideUserMenu();
      const { default: AppRegistry } = await import('../apps/AppRegistry.js');
      await AppRegistry.launchApp('user-manager');
    });

    document.getElementById('switch-user-btn')?.addEventListener('click', () => {
      this._hideUserMenu();
      this._switchUser();
    });

    document.getElementById('lock-screen-btn')?.addEventListener('click', () => {
      this._hideUserMenu();
      this._lockScreen();
    });

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      this._hideUserMenu();
      this._logout();
    });
  }

  _toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    if (this.userMenuVisible) {
      this._hideUserMenu();
    } else {
      menu.style.display = 'block';
      this.userMenuVisible = true;
    }
  }

  _hideUserMenu() {
    const menu = document.getElementById('user-menu');
    menu.style.display = 'none';
    this.userMenuVisible = false;
  }

  _updateUserDisplay() {
    if (!this.kernel?.userManager) return;

    const user = this.kernel.userManager.getCurrentUser();
    if (!user) return;

    // Update taskbar icon
    const avatarIcon = document.getElementById('user-avatar');
    if (avatarIcon) {
      avatarIcon.textContent = user.avatar;
    }

    // Update menu header
    const menuAvatar = document.getElementById('user-menu-avatar');
    const menuName = document.getElementById('user-menu-name');
    const menuUsername = document.getElementById('user-menu-username');

    if (menuAvatar) menuAvatar.textContent = user.avatar;
    if (menuName) menuName.textContent = user.displayName;
    if (menuUsername) menuUsername.textContent = `@${user.username}`;
  }

  async _switchUser() {
    if (confirm('Switch user? Any unsaved work may be lost.')) {
      // Reload the page to show login screen
      window.location.reload();
    }
  }

  async _lockScreen() {
    alert('Lock screen feature coming soon!');
  }

  async _logout() {
    if (confirm('Log out? Any unsaved work may be lost.')) {
      try {
        await this.kernel.userManager.logout();
        // Reload to show login screen
        window.location.reload();
      } catch (error) {
        console.error('Logout failed:', error);
        alert('Failed to log out: ' + error.message);
      }
    }
  }

  _applyUserMenuStyles() {
    const styleId = 'taskbar-user-menu-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .user-menu-container {
        position: relative;
      }

      .user-icon {
        font-size: 1.2rem;
      }

      .user-menu {
        position: absolute;
        bottom: 50px;
        right: 0;
        background: white;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        min-width: 280px;
        overflow: hidden;
        z-index: 1000;
      }

      .user-menu-header {
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .user-menu-avatar {
        font-size: 3rem;
      }

      .user-menu-info {
        flex: 1;
      }

      .user-menu-name {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .user-menu-username {
        font-size: 0.9rem;
        opacity: 0.9;
      }

      .user-menu-divider {
        height: 1px;
        background: #e0e0e0;
      }

      .user-menu-items {
        padding: 8px 0;
      }

      .user-menu-item {
        width: 100%;
        padding: 12px 20px;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: background 0.2s;
        color: #333;
      }

      .user-menu-item:hover {
        background: #f5f5f5;
      }

      .user-menu-item span:first-child {
        font-size: 1.2rem;
        width: 24px;
        text-align: center;
      }

      .user-menu-logout {
        color: #d32f2f;
      }

      .user-menu-logout:hover {
        background: #ffebee;
      }
    `;
    document.head.appendChild(style);
  }
}
