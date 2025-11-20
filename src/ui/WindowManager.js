import WinBox from 'winbox/src/js/winbox.js';

class WindowManager extends EventTarget {
  constructor() {
    super();
    this.windows = new Map();
    this.zIndexCounter = 1000;
    this.activeWindow = null;
    this.closingWindows = new Set();
  }

  createWindow(config) {
    const windowId = crypto.randomUUID();

    const defaultConfig = {
      title: 'Untitled',
      width: 600,
      height: 400,
      x: 'center',
      y: 'center',
      minwidth: 200,
      minheight: 150,
      background: '#ffffff',
      border: 4,
      // Don't pass any "no-" classes to ensure control buttons are visible
      class: config.class || [],
      onclose: (force) => {
        if (!force && typeof config.onBeforeClose === 'function') {
          const shouldClose = config.onBeforeClose();
          if (shouldClose === false) {
            // Returning true tells WinBox to cancel the close action
            return true;
          }
        }
        this._finalizeWindowClose(windowId);
        // Returning false lets WinBox continue its default close behavior
        return false;
      },
      onfocus: () => {
        this.activeWindow = windowId;
        this.dispatchEvent(new CustomEvent('window-focused', {
          detail: { windowId }
        }));
      }
    };

    const winbox = new WinBox({
      ...defaultConfig,
      ...config,
      index: this.zIndexCounter++
    });

    this.windows.set(windowId, {
      winbox,
      process: config.process,
      config
    });

    this.dispatchEvent(new CustomEvent('window-created', {
      detail: { windowId, title: config.title || 'Untitled' }
    }));

    return { windowId, winbox };
  }

  getWindow(windowId) {
    return this.windows.get(windowId);
  }

  getAllWindows() {
    return Array.from(this.windows.entries()).map(([id, data]) => ({
      id,
      element: data.winbox?.dom,
      winbox: data.winbox,
      process: data.process,
      config: data.config
    }));
  }

  closeWindow(windowId) {
    const window = this.windows.get(windowId);
    if (window) {
      if (this.closingWindows.has(windowId)) {
        return;
      }

      this.closingWindows.add(windowId);
      try {
        window.winbox.close(true);
        // In case the WinBox instance doesn't trigger onclose, ensure cleanup
        if (this.windows.has(windowId)) {
          this._finalizeWindowClose(windowId);
        }
      } finally {
        this.closingWindows.delete(windowId);
      }
    }
  }

  _finalizeWindowClose(windowId) {
    if (!this.windows.has(windowId)) {
      return;
    }

    this.windows.delete(windowId);
    if (this.activeWindow === windowId) {
      this.activeWindow = null;
    }

    this.dispatchEvent(new CustomEvent('window-closed', {
      detail: { windowId }
    }));
  }

  minimizeWindow(windowId) {
    const window = this.windows.get(windowId);
    if (window) {
      window.winbox.minimize();
    }
  }

  maximizeWindow(windowId) {
    const window = this.windows.get(windowId);
    if (window) {
      window.winbox.maximize();
    }
  }

  focusWindow(windowId) {
    const window = this.windows.get(windowId);
    if (window) {
      window.winbox.focus();
      this.activeWindow = windowId;
    }
  }

  listWindows() {
    return Array.from(this.windows.values());
  }

  cascadeWindows() {
    let offset = 0;
    this.windows.forEach(({ winbox }) => {
      winbox.move(100 + offset, 100 + offset);
      offset += 30;
    });
  }

  tileWindows() {
    const windows = Array.from(this.windows.values());
    const count = windows.length;

    if (count === 0) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - 50; // Account for taskbar

    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const windowWidth = screenWidth / cols;
    const windowHeight = screenHeight / rows;

    windows.forEach(({ winbox }, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      winbox.resize(windowWidth - 10, windowHeight - 10);
      winbox.move(col * windowWidth + 5, row * windowHeight + 5);
    });
  }
}

export default new WindowManager();
