/**
 * QuickActionsPanel - System-wide quick actions menu
 * Provides quick access to common actions and settings
 */
export class QuickActionsPanel {
  constructor(kernel) {
    this.kernel = kernel;
    this.isVisible = false;
    this.panel = null;

    this._init();
  }

  _init() {
    this._createPanel();
    this._setupKeyboardShortcut();
  }

  /**
   * Create quick actions panel UI
   */
  _createPanel() {
    this.panel = document.createElement('div');
    this.panel.id = 'quick-actions-panel';
    this.panel.className = 'quick-actions-panel';
    this.panel.style.display = 'none';

    this.panel.innerHTML = `
      <div class="quick-actions-header">
        <h3>Quick Actions</h3>
        <button class="close-btn">✕</button>
      </div>
      <div class="quick-actions-grid">
        <div class="quick-action" data-action="screenshot">
          <div class="action-icon">📸</div>
          <div class="action-label">Screenshot</div>
        </div>
        <div class="quick-action" data-action="screen-record">
          <div class="action-icon">🎥</div>
          <div class="action-label">Record Screen</div>
        </div>
        <div class="quick-action" data-action="new-note">
          <div class="action-icon">📝</div>
          <div class="action-label">New Note</div>
        </div>
        <div class="quick-action" data-action="calculator">
          <div class="action-icon">🧮</div>
          <div class="action-label">Calculator</div>
        </div>
        <div class="quick-action" data-action="terminal">
          <div class="action-icon">💻</div>
          <div class="action-label">Terminal</div>
        </div>
        <div class="quick-action" data-action="file-manager">
          <div class="action-icon">📁</div>
          <div class="action-label">Files</div>
        </div>
        <div class="quick-action" data-action="system-monitor">
          <div class="action-icon">📊</div>
          <div class="action-label">Monitor</div>
        </div>
        <div class="quick-action" data-action="settings">
          <div class="action-icon">⚙️</div>
          <div class="action-label">Settings</div>
        </div>
        <div class="quick-action" data-action="lock-screen">
          <div class="action-icon">🔒</div>
          <div class="action-label">Lock</div>
        </div>
        <div class="quick-action" data-action="logout">
          <div class="action-icon">🚪</div>
          <div class="action-label">Logout</div>
        </div>
      </div>
      <div class="quick-actions-footer">
        <span class="shortcut-hint">Ctrl+Shift+A to toggle</span>
      </div>
    `;

    document.body.appendChild(this.panel);

    // Setup action handlers
    this.panel.querySelectorAll('.quick-action').forEach(action => {
      action.addEventListener('click', () => {
        const actionType = action.dataset.action;
        this._handleAction(actionType);
      });
    });

    // Close button
    this.panel.querySelector('.close-btn').addEventListener('click', () => {
      this.hide();
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (this.isVisible && !this.panel.contains(e.target) && !e.target.closest('.quick-actions-trigger')) {
        this.hide();
      }
    });
  }

  /**
   * Setup keyboard shortcut
   */
  _setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+A to toggle
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  /**
   * Handle action execution
   */
  async _handleAction(actionType) {
    const { default: AppRegistry } = await import('../apps/AppRegistry.js');

    switch (actionType) {
      case 'screenshot':
        // Trigger screenshot
        const { getScreenCapture } = await import('./ScreenCapture.js');
        const screenCapture = getScreenCapture();
        if (screenCapture) {
          await screenCapture.captureFullScreen();
        }
        break;

      case 'screen-record':
        alert('Screen recording will be implemented soon!');
        break;

      case 'new-note':
        // Create a new notes widget
        const { getWidgetManager } = await import('./WidgetManager.js');
        const widgetManager = getWidgetManager();
        if (widgetManager) {
          await widgetManager.createWidget('notes', {
            title: 'Quick Note',
            position: { x: 100, y: 100 },
            size: { width: 300, height: 300 }
          });
        }
        break;

      case 'calculator':
        await AppRegistry.launchApp('calculator');
        break;

      case 'terminal':
        await AppRegistry.launchApp('terminal');
        break;

      case 'file-manager':
        await AppRegistry.launchApp('file-manager');
        break;

      case 'system-monitor':
        await AppRegistry.launchApp('system-monitor');
        break;

      case 'settings':
        alert('System Settings app coming soon!');
        break;

      case 'lock-screen':
        // Lock screen
        if (this.kernel.userManager) {
          this.kernel.userManager.lockScreen();
        }
        break;

      case 'logout':
        // Logout
        if (this.kernel.userManager) {
          await this.kernel.userManager.logout();
        }
        break;
    }

    this.hide();
  }

  /**
   * Show panel
   */
  show() {
    this.isVisible = true;
    this.panel.style.display = 'block';

    // Center the panel
    const rect = this.panel.getBoundingClientRect();
    this.panel.style.left = `${(window.innerWidth - rect.width) / 2}px`;
    this.panel.style.top = `${(window.innerHeight - rect.height) / 2}px`;
  }

  /**
   * Hide panel
   */
  hide() {
    this.isVisible = false;
    this.panel.style.display = 'none';
  }

  /**
   * Toggle panel
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
}

// Export singleton
let quickActionsPanelInstance = null;

export function initQuickActionsPanel(kernel) {
  if (!quickActionsPanelInstance) {
    quickActionsPanelInstance = new QuickActionsPanel(kernel);
  }
  return quickActionsPanelInstance;
}

export function getQuickActionsPanel() {
  return quickActionsPanelInstance;
}
