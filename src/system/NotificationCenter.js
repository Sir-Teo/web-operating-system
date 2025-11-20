/**
 * NotificationCenter - Manages desktop notifications and notification history
 */
export class NotificationCenter {
  constructor(kernel) {
    this.kernel = kernel;
    this.notifications = [];
    this.nextNotificationId = 1;
    this.maxNotifications = 100;
    this.isVisible = false;
    this.container = null;
    this.centerPanel = null;

    this._init();
  }

  _init() {
    this._createNotificationContainer();
    this._createNotificationCenter();
    this._setupKeyboardShortcut();
  }

  /**
   * Create notification container for toast notifications
   */
  _createNotificationContainer() {
    this.container = document.createElement('div');
    this.container.id = 'notifications-container';
    this.container.className = 'notifications-container';
    document.body.appendChild(this.container);
  }

  /**
   * Create notification center panel
   */
  _createNotificationCenter() {
    this.centerPanel = document.createElement('div');
    this.centerPanel.id = 'notification-center';
    this.centerPanel.className = 'notification-center';
    this.centerPanel.style.display = 'none';

    this.centerPanel.innerHTML = `
      <div class="notification-center-header">
        <h3>Notification Center</h3>
        <div class="header-actions">
          <button class="action-btn" id="clear-all-notifications" title="Clear All">🗑️</button>
          <button class="action-btn" id="close-notification-center" title="Close">✕</button>
        </div>
      </div>
      <div class="notification-center-content">
        <div class="notification-history"></div>
      </div>
    `;

    document.body.appendChild(this.centerPanel);

    // Setup event handlers
    this.centerPanel.querySelector('#clear-all-notifications').addEventListener('click', () => {
      this.clearAll();
    });

    this.centerPanel.querySelector('#close-notification-center').addEventListener('click', () => {
      this.hideCenter();
    });
  }

  /**
   * Setup keyboard shortcut
   */
  _setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+N to toggle notification center
      if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        this.toggleCenter();
      }
    });
  }

  /**
   * Show a notification
   * @param {string} title - Notification title
   * @param {Object} options - Notification options
   */
  show(title, options = {}) {
    const notification = {
      id: this.nextNotificationId++,
      title,
      message: options.message || '',
      type: options.type || 'info', // info, success, warning, error
      icon: options.icon || this._getDefaultIcon(options.type),
      timestamp: Date.now(),
      duration: options.duration || 5000,
      actions: options.actions || []
    };

    this.notifications.unshift(notification);

    // Limit notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    // Show toast notification
    this._showToast(notification);

    // Update notification center if visible
    if (this.isVisible) {
      this._renderNotificationHistory();
    }

    // Save to storage
    this._saveNotifications();

    return notification.id;
  }

  /**
   * Show toast notification
   */
  _showToast(notification) {
    const toast = document.createElement('div');
    toast.className = `notification-toast notification-${notification.type}`;
    toast.dataset.notificationId = notification.id;

    toast.innerHTML = `
      <div class="toast-icon">${notification.icon}</div>
      <div class="toast-content">
        <div class="toast-title">${notification.title}</div>
        ${notification.message ? `<div class="toast-message">${notification.message}</div>` : ''}
      </div>
      <button class="toast-close">✕</button>
    `;

    this.container.appendChild(toast);

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
      this._removeToast(toast);
    });

    // Click to open notification center
    toast.addEventListener('click', (e) => {
      if (!e.target.classList.contains('toast-close')) {
        this.showCenter();
        this._removeToast(toast);
      }
    });

    // Auto-remove after duration
    if (notification.duration > 0) {
      setTimeout(() => {
        this._removeToast(toast);
      }, notification.duration);
    }

    // Animate in
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
  }

  /**
   * Remove toast notification
   */
  _removeToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }

  /**
   * Show notification center
   */
  showCenter() {
    this.isVisible = true;
    this.centerPanel.style.display = 'block';
    this._renderNotificationHistory();
  }

  /**
   * Hide notification center
   */
  hideCenter() {
    this.isVisible = false;
    this.centerPanel.style.display = 'none';
  }

  /**
   * Toggle notification center
   */
  toggleCenter() {
    if (this.isVisible) {
      this.hideCenter();
    } else {
      this.showCenter();
    }
  }

  /**
   * Render notification history
   */
  _renderNotificationHistory() {
    const historyContainer = this.centerPanel.querySelector('.notification-history');

    if (this.notifications.length === 0) {
      historyContainer.innerHTML = '<div class="no-notifications">No notifications</div>';
      return;
    }

    const html = this.notifications.map(notification => {
      const timeAgo = this._getTimeAgo(notification.timestamp);
      return `
        <div class="notification-item notification-${notification.type}" data-id="${notification.id}">
          <div class="notification-icon">${notification.icon}</div>
          <div class="notification-content">
            <div class="notification-title">${notification.title}</div>
            ${notification.message ? `<div class="notification-message">${notification.message}</div>` : ''}
            <div class="notification-time">${timeAgo}</div>
          </div>
          <button class="notification-remove" data-id="${notification.id}">✕</button>
        </div>
      `;
    }).join('');

    historyContainer.innerHTML = html;

    // Setup remove buttons
    historyContainer.querySelectorAll('.notification-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        this.remove(id);
      });
    });
  }

  /**
   * Remove a specific notification
   */
  remove(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this._saveNotifications();
      this._renderNotificationHistory();
    }
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    this.notifications = [];
    this._saveNotifications();
    this._renderNotificationHistory();
  }

  /**
   * Get default icon for notification type
   */
  _getDefaultIcon(type) {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    return icons[type] || icons.info;
  }

  /**
   * Get time ago string
   */
  _getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  /**
   * Save notifications to storage
   */
  async _saveNotifications() {
    try {
      await this.kernel.fs.writeFile(
        '/home/.config/notifications.json',
        JSON.stringify(this.notifications, null, 2)
      );
    } catch (error) {
      console.warn('Failed to save notifications:', error);
    }
  }

  /**
   * Load notifications from storage
   */
  async _loadNotifications() {
    try {
      const data = await this.kernel.fs.readFile('/home/.config/notifications.json');
      this.notifications = JSON.parse(data);
    } catch (error) {
      // No saved notifications
      this.notifications = [];
    }
  }
}

// Export singleton
let notificationCenterInstance = null;

export function initNotificationCenter(kernel) {
  if (!notificationCenterInstance) {
    notificationCenterInstance = new NotificationCenter(kernel);
  }
  return notificationCenterInstance;
}

export function getNotificationCenter() {
  return notificationCenterInstance;
}
