/**
 * System Theme Manager
 * Manages system-wide themes and appearance
 */
export class ThemeManager {
  constructor() {
    this.currentTheme = null;
    this.themes = new Map();
    this.listeners = [];
    this.loadThemes();
    this.applyStoredTheme();
  }

  /**
   * Load built-in themes
   */
  loadThemes() {
    // Default Dark Theme
    this.registerTheme({
      id: 'default-dark',
      name: 'Default Dark',
      type: 'dark',
      colors: {
        // Background colors
        'bg-primary': '#1e1e1e',
        'bg-secondary': '#252526',
        'bg-tertiary': '#2d2d30',
        'bg-elevated': '#3e3e42',

        // Text colors
        'text-primary': '#d4d4d4',
        'text-secondary': '#808080',
        'text-disabled': '#555555',

        // Accent colors
        'accent-primary': '#007acc',
        'accent-hover': '#005a9e',
        'accent-active': '#004578',

        // Border colors
        'border-primary': '#3e3e42',
        'border-secondary': '#555555',

        // Status colors
        'success': '#4caf50',
        'warning': '#ff9800',
        'error': '#f44336',
        'info': '#2196f3',

        // Window colors
        'window-bg': 'rgba(30, 30, 30, 0.95)',
        'window-border': 'rgba(255, 255, 255, 0.1)',
        'window-shadow': 'rgba(0, 0, 0, 0.5)',

        // Desktop
        'desktop-bg': '#0a0a0a',
        'desktop-overlay': 'rgba(0, 0, 0, 0.3)'
      }
    });

    // Default Light Theme
    this.registerTheme({
      id: 'default-light',
      name: 'Default Light',
      type: 'light',
      colors: {
        'bg-primary': '#ffffff',
        'bg-secondary': '#f5f5f5',
        'bg-tertiary': '#e0e0e0',
        'bg-elevated': '#fafafa',

        'text-primary': '#000000',
        'text-secondary': '#666666',
        'text-disabled': '#aaaaaa',

        'accent-primary': '#007acc',
        'accent-hover': '#005a9e',
        'accent-active': '#004578',

        'border-primary': '#e0e0e0',
        'border-secondary': '#cccccc',

        'success': '#4caf50',
        'warning': '#ff9800',
        'error': '#f44336',
        'info': '#2196f3',

        'window-bg': 'rgba(255, 255, 255, 0.95)',
        'window-border': 'rgba(0, 0, 0, 0.1)',
        'window-shadow': 'rgba(0, 0, 0, 0.3)',

        'desktop-bg': '#f0f0f0',
        'desktop-overlay': 'rgba(255, 255, 255, 0.3)'
      }
    });

    // Dracula Theme
    this.registerTheme({
      id: 'dracula',
      name: 'Dracula',
      type: 'dark',
      colors: {
        'bg-primary': '#282a36',
        'bg-secondary': '#21222c',
        'bg-tertiary': '#343746',
        'bg-elevated': '#44475a',

        'text-primary': '#f8f8f2',
        'text-secondary': '#6272a4',
        'text-disabled': '#44475a',

        'accent-primary': '#bd93f9',
        'accent-hover': '#9d73d9',
        'accent-active': '#7d53b9',

        'border-primary': '#44475a',
        'border-secondary': '#6272a4',

        'success': '#50fa7b',
        'warning': '#f1fa8c',
        'error': '#ff5555',
        'info': '#8be9fd',

        'window-bg': 'rgba(40, 42, 54, 0.95)',
        'window-border': 'rgba(139, 233, 253, 0.2)',
        'window-shadow': 'rgba(0, 0, 0, 0.7)',

        'desktop-bg': '#1a1b26',
        'desktop-overlay': 'rgba(40, 42, 54, 0.3)'
      }
    });

    // Nord Theme
    this.registerTheme({
      id: 'nord',
      name: 'Nord',
      type: 'dark',
      colors: {
        'bg-primary': '#2e3440',
        'bg-secondary': '#3b4252',
        'bg-tertiary': '#434c5e',
        'bg-elevated': '#4c566a',

        'text-primary': '#eceff4',
        'text-secondary': '#d8dee9',
        'text-disabled': '#4c566a',

        'accent-primary': '#88c0d0',
        'accent-hover': '#81a1c1',
        'accent-active': '#5e81ac',

        'border-primary': '#4c566a',
        'border-secondary': '#5e81ac',

        'success': '#a3be8c',
        'warning': '#ebcb8b',
        'error': '#bf616a',
        'info': '#88c0d0',

        'window-bg': 'rgba(46, 52, 64, 0.95)',
        'window-border': 'rgba(136, 192, 208, 0.2)',
        'window-shadow': 'rgba(0, 0, 0, 0.6)',

        'desktop-bg': '#1f2430',
        'desktop-overlay': 'rgba(46, 52, 64, 0.3)'
      }
    });

    // Tokyo Night Theme
    this.registerTheme({
      id: 'tokyo-night',
      name: 'Tokyo Night',
      type: 'dark',
      colors: {
        'bg-primary': '#1a1b26',
        'bg-secondary': '#16161e',
        'bg-tertiary': '#24283b',
        'bg-elevated': '#414868',

        'text-primary': '#c0caf5',
        'text-secondary': '#9aa5ce',
        'text-disabled': '#414868',

        'accent-primary': '#7aa2f7',
        'accent-hover': '#5a82d7',
        'accent-active': '#3a62b7',

        'border-primary': '#414868',
        'border-secondary': '#565f89',

        'success': '#9ece6a',
        'warning': '#e0af68',
        'error': '#f7768e',
        'info': '#7dcfff',

        'window-bg': 'rgba(26, 27, 38, 0.95)',
        'window-border': 'rgba(122, 162, 247, 0.2)',
        'window-shadow': 'rgba(0, 0, 0, 0.7)',

        'desktop-bg': '#0f0f14',
        'desktop-overlay': 'rgba(26, 27, 38, 0.3)'
      }
    });

    // Solarized Dark
    this.registerTheme({
      id: 'solarized-dark',
      name: 'Solarized Dark',
      type: 'dark',
      colors: {
        'bg-primary': '#002b36',
        'bg-secondary': '#073642',
        'bg-tertiary': '#0e4d5a',
        'bg-elevated': '#586e75',

        'text-primary': '#fdf6e3',
        'text-secondary': '#93a1a1',
        'text-disabled': '#586e75',

        'accent-primary': '#268bd2',
        'accent-hover': '#2075b2',
        'accent-active': '#1a5f92',

        'border-primary': '#586e75',
        'border-secondary': '#657b83',

        'success': '#859900',
        'warning': '#b58900',
        'error': '#dc322f',
        'info': '#268bd2',

        'window-bg': 'rgba(0, 43, 54, 0.95)',
        'window-border': 'rgba(38, 139, 210, 0.2)',
        'window-shadow': 'rgba(0, 0, 0, 0.7)',

        'desktop-bg': '#001520',
        'desktop-overlay': 'rgba(0, 43, 54, 0.3)'
      }
    });
  }

  /**
   * Register a theme
   * @param {Object} theme - Theme object
   */
  registerTheme(theme) {
    if (!theme.id || !theme.name || !theme.colors) {
      throw new Error('Invalid theme: must have id, name, and colors');
    }
    this.themes.set(theme.id, theme);
  }

  /**
   * Apply theme
   * @param {string} themeId - Theme ID
   */
  applyTheme(themeId) {
    const theme = this.themes.get(themeId);
    if (!theme) {
      console.error(`Theme not found: ${themeId}`);
      return;
    }

    this.currentTheme = theme;

    // Apply CSS variables
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    // Set data attribute for theme type
    root.setAttribute('data-theme', theme.type);

    // Save to localStorage
    this.saveTheme(themeId);

    // Notify listeners
    this.notifyListeners(theme);
  }

  /**
   * Get current theme
   * @returns {Object} Current theme
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Get all themes
   * @returns {Array} All themes
   */
  getAllThemes() {
    return Array.from(this.themes.values());
  }

  /**
   * Get themes by type
   * @param {string} type - Theme type (dark/light)
   * @returns {Array} Filtered themes
   */
  getThemesByType(type) {
    return this.getAllThemes().filter(t => t.type === type);
  }

  /**
   * Save theme preference
   * @param {string} themeId - Theme ID
   */
  saveTheme(themeId) {
    try {
      localStorage.setItem('webos-theme', themeId);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }

  /**
   * Load and apply stored theme
   */
  applyStoredTheme() {
    try {
      const stored = localStorage.getItem('webos-theme');
      const themeId = stored || 'default-dark';
      this.applyTheme(themeId);
    } catch (error) {
      console.error('Error loading theme:', error);
      this.applyTheme('default-dark');
    }
  }

  /**
   * Add theme change listener
   * @param {Function} callback - Callback function
   */
  onThemeChange(callback) {
    this.listeners.push(callback);
  }

  /**
   * Notify listeners of theme change
   * @param {Object} theme - New theme
   */
  notifyListeners(theme) {
    this.listeners.forEach(callback => {
      try {
        callback(theme);
      } catch (error) {
        console.error('Error in theme listener:', error);
      }
    });
  }

  /**
   * Create custom theme
   * @param {Object} themeData - Theme data
   * @returns {string} Theme ID
   */
  createCustomTheme(themeData) {
    const customId = `custom-${Date.now()}`;
    const theme = {
      id: customId,
      name: themeData.name || 'Custom Theme',
      type: themeData.type || 'dark',
      colors: themeData.colors,
      custom: true
    };

    this.registerTheme(theme);
    this.saveCustomThemes();

    return customId;
  }

  /**
   * Delete custom theme
   * @param {string} themeId - Theme ID
   */
  deleteCustomTheme(themeId) {
    const theme = this.themes.get(themeId);
    if (!theme || !theme.custom) {
      return false;
    }

    this.themes.delete(themeId);
    this.saveCustomThemes();

    // If current theme was deleted, apply default
    if (this.currentTheme?.id === themeId) {
      this.applyTheme('default-dark');
    }

    return true;
  }

  /**
   * Save custom themes to localStorage
   */
  saveCustomThemes() {
    try {
      const customThemes = this.getAllThemes()
        .filter(t => t.custom)
        .map(t => ({
          id: t.id,
          name: t.name,
          type: t.type,
          colors: t.colors
        }));

      localStorage.setItem('webos-custom-themes', JSON.stringify(customThemes));
    } catch (error) {
      console.error('Error saving custom themes:', error);
    }
  }

  /**
   * Load custom themes from localStorage
   */
  loadCustomThemes() {
    try {
      const stored = localStorage.getItem('webos-custom-themes');
      if (stored) {
        const customThemes = JSON.parse(stored);
        customThemes.forEach(theme => {
          theme.custom = true;
          this.registerTheme(theme);
        });
      }
    } catch (error) {
      console.error('Error loading custom themes:', error);
    }
  }
}

// Export singleton instance
export default new ThemeManager();
