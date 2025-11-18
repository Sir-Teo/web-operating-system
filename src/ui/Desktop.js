export class Desktop {
  constructor(kernel) {
    this.kernel = kernel;
    this.element = document.getElementById('desktop');
    this.iconsContainer = document.getElementById('desktop-icons');
    this.icons = [];
    this.wallpaper = null;

    this._setupEventListeners();
  }

  async init() {
    await this._loadWallpaper();
    await this._loadIcons();
    this.show();
  }

  async _loadWallpaper() {
    // Load wallpaper from config
    const wallpaper = this.kernel.config.wallpaper || '#2c3e50';
    if (wallpaper.startsWith('#')) {
      this.element.style.background = wallpaper;
    } else {
      this.element.style.backgroundImage = `url(${wallpaper})`;
      this.element.style.backgroundSize = 'cover';
      this.element.style.backgroundPosition = 'center';
    }
  }

  async _loadIcons() {
    const defaultIcons = [
      { name: 'Terminal', icon: '💻', appId: 'terminal' },
      { name: 'File Manager', icon: '📁', appId: 'file-manager' },
      { name: 'Text Editor', icon: '📝', appId: 'text-editor' },
      { name: 'Settings', icon: '⚙️', appId: 'settings' }
    ];

    defaultIcons.forEach((iconData, index) => {
      this._createIcon(iconData, index);
    });
  }

  _createIcon(data, index) {
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.innerHTML = `
      <div class="icon-image">${data.icon}</div>
      <div class="icon-label">${data.name}</div>
    `;

    icon.addEventListener('dblclick', async () => {
      await this._launchApp(data.appId);
    });

    this.iconsContainer.appendChild(icon);
    this.icons.push({ element: icon, data });
  }

  async _launchApp(appId) {
    try {
      const { default: AppRegistry } = await import('../apps/AppRegistry.js');
      await AppRegistry.launchApp(appId);
    } catch (error) {
      console.error('Failed to launch app:', error);
    }
  }

  _setupEventListeners() {
    // Right-click context menu
    this.element.addEventListener('contextmenu', (e) => {
      if (e.target === this.element || e.target === this.iconsContainer) {
        e.preventDefault();
        this._showContextMenu(e.clientX, e.clientY);
      }
    });

    // Click to hide context menu
    document.addEventListener('click', () => {
      const contextMenu = document.getElementById('context-menu');
      contextMenu.style.display = 'none';
    });
  }

  _showContextMenu(x, y) {
    const contextMenu = document.getElementById('context-menu');
    contextMenu.innerHTML = `
      <div class="context-menu-item" data-action="refresh">🔄 Refresh</div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" data-action="personalize">🎨 Personalize</div>
      <div class="context-menu-item" data-action="cascade">⊞ Cascade Windows</div>
      <div class="context-menu-item" data-action="tile">⊞ Tile Windows</div>
    `;

    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.style.display = 'block';

    // Add click handlers
    contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = item.dataset.action;

        const { default: WindowManager } = await import('./WindowManager.js');

        switch (action) {
          case 'refresh':
            window.location.reload();
            break;
          case 'cascade':
            WindowManager.cascadeWindows();
            break;
          case 'tile':
            WindowManager.tileWindows();
            break;
          case 'personalize':
            console.log('Personalize - not implemented yet');
            break;
        }

        contextMenu.style.display = 'none';
      });
    });
  }

  show() {
    this.element.style.display = 'block';
  }

  hide() {
    this.element.style.display = 'none';
  }
}
