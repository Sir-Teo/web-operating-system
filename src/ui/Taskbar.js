export class Taskbar {
  constructor() {
    this.element = document.getElementById('taskbar');
    this.startButton = document.getElementById('start-button');
    this.windowsContainer = document.getElementById('taskbar-windows');
    this.clock = document.getElementById('clock');
    this.windows = new Map();

    this._setupEventListeners();
    this._startClock();
  }

  init() {
    this.show();
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
  }

  addWindow(windowId, title) {
    const button = document.createElement('button');
    button.className = 'taskbar-window-button';
    button.textContent = title || 'Window';
    button.dataset.windowId = windowId;

    button.addEventListener('click', async () => {
      // Focus or minimize window
      const { default: WindowManager } = await import('./WindowManager.js');
      const window = WindowManager.getWindow(windowId);
      if (window) {
        if (window.winbox.min) {
          window.winbox.restore();
        }
        window.winbox.focus();
      }
    });

    this.windowsContainer.appendChild(button);
    this.windows.set(windowId, button);
  }

  removeWindow(windowId) {
    const button = this.windows.get(windowId);
    if (button) {
      button.remove();
      this.windows.delete(windowId);
    }
  }

  _toggleStartMenu() {
    const startMenu = document.getElementById('start-menu');
    const isVisible = startMenu.style.display === 'block';

    if (isVisible) {
      startMenu.style.display = 'none';
    } else {
      startMenu.style.display = 'block';
    }
  }

  _startClock() {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      this.clock.textContent = `${hours}:${minutes}`;
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
}
