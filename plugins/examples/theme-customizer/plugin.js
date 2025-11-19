/**
 * Theme Customizer Plugin
 * Allows users to customize the desktop theme
 */
class ThemeCustomizer {
  constructor(api) {
    this.api = api;
    this.themes = {
      'default': {
        name: 'Default',
        desktop: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        taskbar: '#2c3e50',
        window: '#ffffff'
      },
      'ocean': {
        name: 'Ocean',
        desktop: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7e22ce 100%)',
        taskbar: '#1a2332',
        window: '#f0f9ff'
      },
      'sunset': {
        name: 'Sunset',
        desktop: 'linear-gradient(135deg, #ff6b6b 0%, #ffd93d 50%, #6bcfff 100%)',
        taskbar: '#d14545',
        window: '#fffef7'
      },
      'forest': {
        name: 'Forest',
        desktop: 'linear-gradient(135deg, #134e4a 0%, #14532d 50%, #365314 100%)',
        taskbar: '#0f3730',
        window: '#f0fdf4'
      },
      'midnight': {
        name: 'Midnight',
        desktop: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 100%)',
        taskbar: '#0a0a14',
        window: '#f8fafc'
      }
    };
    this.currentTheme = 'default';
  }

  async activate() {
    // Load saved theme
    const savedTheme = await this.api.storage.get('currentTheme');
    if (savedTheme && this.themes[savedTheme]) {
      this.currentTheme = savedTheme;
      this.applyTheme(this.currentTheme);
    }

    // Add theme selector to desktop
    this.createThemeSelector();

    this.api.ui.notify('Theme Customizer activated! Right-click desktop to change theme.', {
      title: 'Theme Customizer',
      duration: 3000
    });
  }

  createThemeSelector() {
    // Add right-click context menu for theme selection
    const desktop = document.getElementById('desktop') || document.body;

    desktop.addEventListener('contextmenu', (e) => {
      e.preventDefault();

      // Remove existing menu
      const existingMenu = document.getElementById('theme-context-menu');
      if (existingMenu) existingMenu.remove();

      // Create menu
      const menu = document.createElement('div');
      menu.id = 'theme-context-menu';
      menu.style.cssText = `
        position: fixed;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        padding: 8px;
        z-index: 10000;
        min-width: 200px;
      `;

      // Add header
      const header = document.createElement('div');
      header.textContent = 'Choose Theme';
      header.style.cssText = `
        padding: 8px 12px;
        font-weight: 600;
        font-size: 14px;
        color: #333;
        border-bottom: 1px solid #e0e0e0;
        margin-bottom: 4px;
      `;
      menu.appendChild(header);

      // Add theme options
      Object.keys(this.themes).forEach(themeId => {
        const theme = this.themes[themeId];
        const item = document.createElement('div');
        item.textContent = theme.name;
        item.style.cssText = `
          padding: 10px 12px;
          cursor: pointer;
          border-radius: 4px;
          font-size: 14px;
          color: #333;
          transition: background 0.2s;
          ${this.currentTheme === themeId ? 'background: #e3f2fd; font-weight: 600;' : ''}
        `;

        item.addEventListener('mouseenter', () => {
          item.style.background = '#f5f5f5';
        });

        item.addEventListener('mouseleave', () => {
          item.style.background = this.currentTheme === themeId ? '#e3f2fd' : '';
        });

        item.addEventListener('click', () => {
          this.applyTheme(themeId);
          menu.remove();
        });

        menu.appendChild(item);
      });

      document.body.appendChild(menu);

      // Remove menu on click outside
      setTimeout(() => {
        document.addEventListener('click', function removeMenu() {
          menu.remove();
          document.removeEventListener('click', removeMenu);
        });
      }, 100);
    });
  }

  async applyTheme(themeId) {
    if (!this.themes[themeId]) return;

    const theme = this.themes[themeId];
    this.currentTheme = themeId;

    // Apply desktop background
    const desktop = document.getElementById('desktop') || document.body;
    desktop.style.background = theme.desktop;

    // Apply taskbar theme
    const taskbar = document.querySelector('.taskbar');
    if (taskbar) {
      taskbar.style.background = theme.taskbar;
    }

    // Save preference
    await this.api.storage.set('currentTheme', themeId);

    this.api.ui.notify(`Theme changed to ${theme.name}`, {
      title: 'Theme Customizer',
      duration: 2000
    });
  }

  async deactivate() {
    // Remove context menu listener
    const existingMenu = document.getElementById('theme-context-menu');
    if (existingMenu) existingMenu.remove();

    this.api.ui.notify('Theme Customizer deactivated', {
      title: 'Theme Customizer',
      duration: 2000
    });
  }
}

module.exports = ThemeCustomizer;
