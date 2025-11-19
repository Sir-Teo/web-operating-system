import WinBox from 'winbox/src/js/winbox.js';

class WindowManager extends EventTarget {
  constructor() {
    super();
    this.windows = new Map();
    this.zIndexCounter = 1000;
    this.activeWindow = null;
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
      // Explicitly enable window control buttons
      close: true,
      minimize: true,
      maximize: true,
      onclose: (force) => {
        if (!force && config.onBeforeClose) {
          return config.onBeforeClose();
        }
        this.closeWindow(windowId);
        return true;
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

  closeWindow(windowId) {
    const window = this.windows.get(windowId);
    if (window) {
      window.winbox.close(true);
      this.windows.delete(windowId);

      this.dispatchEvent(new CustomEvent('window-closed', {
        detail: { windowId }
      }));
    }
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
