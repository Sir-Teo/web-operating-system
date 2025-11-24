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
    if (!this.iconsContainer) {
      return;
    }

    this.iconsContainer.innerHTML = '';
    this.icons = [];

    try {
      const { default: AppRegistry } = await import('../apps/AppRegistry.js');
      const apps = AppRegistry.listApps();

      // Create folders for organizing apps
      this._createFolder('System', ['⚙️', '🖥️', '👤', '📦', '🔧', '🔒'], [
        'settings', 'system-monitor', 'user-manager', 'package-manager',
        'plugin-manager', 'security-center', 'devtools'
      ]);

      this._createFolder('Productivity', ['📝', '📊', '📈', '📅'], [
        'word-processor', 'spreadsheet', 'presentation', 'notes',
        'calendar', 'task-manager', 'contacts'
      ]);

      this._createFolder('Development', ['💻', '📝', '🐛', '🔧'], [
        'code-editor', 'terminal', 'git-client', 'code-runner',
        'code-runner-enhanced', 'database-manager', 'api-tester',
        'markdown-editor', 'language-manager', 'polyglot-playground',
        'interactive-notebook', 'runtime-diagnostics'
      ]);

      this._createFolder('Media', ['🎨', '🖼️', '🎵', '📹'], [
        'image-editor', 'advanced-image-editor', 'image-viewer', 'paint',
        'music-player', 'video-player', 'camera', 'voice-recorder',
        'screen-recorder', 'screenshot'
      ]);

      this._createFolder('Files & Data', ['📁', '📊', '🗄️', '📄'], [
        'file-manager', 'file-manager-v2', 'text-editor', 'csv-editor',
        'archive-manager', 'pdf-viewer', 'data-visualization', 'cloud-storage'
      ]);

      this._createFolder('Communication', ['📧', '💬', '🎥', '🤝'], [
        'email', 'chat', 'video-conferencing', 'collaboration-hub'
      ]);

      this._createFolder('Utilities', ['🧮', '🎨', '🌤️', '🗺️'], [
        'calculator', 'clock', 'weather', 'maps', 'color-picker',
        'character-map', 'browser'
      ]);

      this._createFolder('AI & Plugins', ['🤖', '🧩'], [
        'ai-assistant', 'plugin-marketplace'
      ]);

      this._createFolder('Games', ['🎮', '🕹️'], [
        'tic-tac-toe', 'snake', 'tetris', 'minesweeper',
        'airplane-shooter', 'racing'
      ]);

      // Add any apps not in folders as individual icons
      const folderedAppIds = new Set();
      this.icons.forEach(icon => {
        if (icon.data.type === 'folder') {
          icon.data.apps.forEach(appId => folderedAppIds.add(appId));
        }
      });

      apps.forEach((app, index) => {
        if (!folderedAppIds.has(app.id)) {
          this._createIcon({
            name: app.name,
            icon: app.icon || '🧩',
            appId: app.id
          }, index);
        }
      });
    } catch (error) {
      console.error('Failed to load desktop icons:', error);
    }
  }

  _createFolder(name, icons, appIds) {
    const folderIcon = icons[0];
    const icon = document.createElement('div');
    icon.className = 'desktop-icon desktop-folder';
    icon.innerHTML = `
      <div class="icon-image">📁</div>
      <div class="icon-label">${name}</div>
    `;

    icon.addEventListener('dblclick', () => {
      this._openFolder(name, appIds);
    });

    this.iconsContainer.appendChild(icon);
    this.icons.push({
      element: icon,
      data: {
        name,
        icon: '📁',
        type: 'folder',
        apps: appIds
      }
    });
  }

  async _openFolder(folderName, appIds) {
    try {
      const { default: AppRegistry } = await import('../apps/AppRegistry.js');
      const { default: WindowManager } = await import('./WindowManager.js');

      // Create a folder window with app grid
      const apps = appIds.map(id => AppRegistry.getApp(id)).filter(app => app);

      const content = document.createElement('div');
      content.className = 'folder-content';
      content.innerHTML = `
        <div class="folder-grid">
          ${apps.map(app => `
            <div class="folder-app-item" data-app-id="${app.id}">
              <div class="folder-app-icon">${app.icon || '🧩'}</div>
              <div class="folder-app-name">${app.name}</div>
            </div>
          `).join('')}
        </div>
      `;

      const winbox = WindowManager.createWindow({
        title: `📁 ${folderName}`,
        icon: '📁',
        width: '600px',
        height: '400px',
        x: 'center',
        y: 'center'
      });

      winbox.body.appendChild(content);

      // Add click handlers for apps in folder
      content.querySelectorAll('.folder-app-item').forEach(item => {
        item.addEventListener('dblclick', async () => {
          const appId = item.dataset.appId;
          await AppRegistry.launchApp(appId);
        });
      });
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
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
