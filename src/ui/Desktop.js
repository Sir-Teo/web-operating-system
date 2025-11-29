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

      const { winbox } = WindowManager.createWindow({
        title: `📁 ${folderName}`,
        icon: '📁',
        width: '600px',
        height: '400px',
        x: 'center',
        y: 'center'
      });

      const target = winbox.body || winbox.dom?.querySelector('.wb-body');
      if (target) {
        target.appendChild(content);
      } else {
        console.warn('Folder window missing body element');
      }

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

    icon.addEventListener('click', async () => {
      // Simple click effect or selection logic could go here
    });

    icon.addEventListener('dblclick', async () => {
      await this._launchApp(data.appId);
    });

    this.iconsContainer.appendChild(icon);
    this.icons.push({ element: icon, data });
  }

  async _launchApp(appId) {
    try {
      const { default: AppRegistry } = await import('../apps/AppRegistry.js');
      
      // Add visual feedback
      document.body.style.cursor = 'wait';
      
      await AppRegistry.launchApp(appId);
      
      document.body.style.cursor = 'default';
    } catch (error) {
      console.error('Failed to launch app:', error);
      document.body.style.cursor = 'default';
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
      if (contextMenu) contextMenu.style.display = 'none';
    });
  }

  _showContextMenu(x, y) {
    const contextMenu = document.getElementById('context-menu');
    if (!contextMenu) return;

    contextMenu.innerHTML = `
      <div class="context-menu-item" data-action="refresh">🔄 Refresh</div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" data-action="wallpaper">🖼️ Change Wallpaper</div>
      <div class="context-menu-item" data-action="personalize">🎨 Personalize</div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" data-action="cascade">⊞ Cascade Windows</div>
      <div class="context-menu-item" data-action="tile">⊞ Tile Windows</div>
    `;

    // Adjust position to keep within viewport
    const menuWidth = 200;
    const menuHeight = 200;
    
    let posX = x;
    let posY = y;

    if (x + menuWidth > window.innerWidth) posX = window.innerWidth - menuWidth - 10;
    if (y + menuHeight > window.innerHeight) posY = window.innerHeight - menuHeight - 10;

    contextMenu.style.left = `${posX}px`;
    contextMenu.style.top = `${posY}px`;
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
          case 'wallpaper':
            this._cycleWallpaper();
            break;
          case 'personalize':
            const { default: AppRegistry } = await import('../apps/AppRegistry.js');
            AppRegistry.launchApp('settings');
            break;
        }

        contextMenu.style.display = 'none';
      });
    });
  }

  _cycleWallpaper() {
    const wallpapers = [
      'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=2070&auto=format&fit=crop', // Mountains
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop', // Space
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop', // Landscape
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop', // Abstract
      '#2c3e50' // Solid color fallback
    ];
    
    // Get current wallpaper index or default to 0
    let currentIndex = parseInt(localStorage.getItem('wallpaperIndex') || '0');
    currentIndex = (currentIndex + 1) % wallpapers.length;
    
    const newWallpaper = wallpapers[currentIndex];
    localStorage.setItem('wallpaperIndex', currentIndex.toString());
    
    if (newWallpaper.startsWith('#')) {
      this.element.style.backgroundImage = 'none';
      this.element.style.backgroundColor = newWallpaper;
    } else {
      this.element.style.backgroundImage = `url(${newWallpaper})`;
    }
  }

  show() {
    this.element.style.display = 'block';
  }

  hide() {
    this.element.style.display = 'none';
  }
}
