/**
 * Settings Panel for Code Editor
 * Manages editor settings and preferences
 */
export class SettingsPanel {
  constructor(editor, themeManager) {
    this.editor = editor;
    this.themeManager = themeManager;
    this.isVisible = false;
    this.settings = this.loadSettings();
  }

  /**
   * Load settings from localStorage
   * @returns {Object} Settings object
   */
  loadSettings() {
    const defaultSettings = {
      fontSize: 14,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on',
      minimap: true,
      lineNumbers: 'on',
      renderWhitespace: 'selection',
      autoSave: false,
      autoSaveDelay: 1000,
      theme: 'webos-dark'
    };

    try {
      const saved = localStorage.getItem('code-editor-settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('code-editor-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  /**
   * Create settings panel HTML
   * @returns {string} HTML string
   */
  createPanel() {
    const themes = this.themeManager.getAvailableThemes();

    return `
      <div class="settings-panel" id="settings-panel" style="display: none;">
        <div class="settings-header">
          <h3>Editor Settings</h3>
          <button id="settings-close" class="settings-close-btn">✕</button>
        </div>
        <div class="settings-content">
          <div class="settings-section">
            <h4>Appearance</h4>
            <div class="setting-item">
              <label for="setting-theme">Theme</label>
              <select id="setting-theme" class="setting-select">
                ${themes.map(t => `
                  <option value="${t.id}" ${this.settings.theme === t.id ? 'selected' : ''}>
                    ${t.name}
                  </option>
                `).join('')}
              </select>
            </div>
            <div class="setting-item">
              <label for="setting-font-size">Font Size</label>
              <input type="number" id="setting-font-size" class="setting-input"
                     value="${this.settings.fontSize}" min="8" max="32" />
            </div>
            <div class="setting-item">
              <label for="setting-minimap">Minimap</label>
              <input type="checkbox" id="setting-minimap"
                     ${this.settings.minimap ? 'checked' : ''} />
            </div>
            <div class="setting-item">
              <label for="setting-line-numbers">Line Numbers</label>
              <select id="setting-line-numbers" class="setting-select">
                <option value="on" ${this.settings.lineNumbers === 'on' ? 'selected' : ''}>On</option>
                <option value="off" ${this.settings.lineNumbers === 'off' ? 'selected' : ''}>Off</option>
                <option value="relative" ${this.settings.lineNumbers === 'relative' ? 'selected' : ''}>Relative</option>
              </select>
            </div>
          </div>

          <div class="settings-section">
            <h4>Editing</h4>
            <div class="setting-item">
              <label for="setting-tab-size">Tab Size</label>
              <input type="number" id="setting-tab-size" class="setting-input"
                     value="${this.settings.tabSize}" min="2" max="8" />
            </div>
            <div class="setting-item">
              <label for="setting-insert-spaces">Insert Spaces</label>
              <input type="checkbox" id="setting-insert-spaces"
                     ${this.settings.insertSpaces ? 'checked' : ''} />
            </div>
            <div class="setting-item">
              <label for="setting-word-wrap">Word Wrap</label>
              <select id="setting-word-wrap" class="setting-select">
                <option value="off" ${this.settings.wordWrap === 'off' ? 'selected' : ''}>Off</option>
                <option value="on" ${this.settings.wordWrap === 'on' ? 'selected' : ''}>On</option>
                <option value="wordWrapColumn" ${this.settings.wordWrap === 'wordWrapColumn' ? 'selected' : ''}>Column</option>
                <option value="bounded" ${this.settings.wordWrap === 'bounded' ? 'selected' : ''}>Bounded</option>
              </select>
            </div>
            <div class="setting-item">
              <label for="setting-whitespace">Render Whitespace</label>
              <select id="setting-whitespace" class="setting-select">
                <option value="none" ${this.settings.renderWhitespace === 'none' ? 'selected' : ''}>None</option>
                <option value="selection" ${this.settings.renderWhitespace === 'selection' ? 'selected' : ''}>Selection</option>
                <option value="all" ${this.settings.renderWhitespace === 'all' ? 'selected' : ''}>All</option>
              </select>
            </div>
          </div>

          <div class="settings-section">
            <h4>File Management</h4>
            <div class="setting-item">
              <label for="setting-auto-save">Auto Save</label>
              <input type="checkbox" id="setting-auto-save"
                     ${this.settings.autoSave ? 'checked' : ''} />
            </div>
            <div class="setting-item">
              <label for="setting-auto-save-delay">Auto Save Delay (ms)</label>
              <input type="number" id="setting-auto-save-delay" class="setting-input"
                     value="${this.settings.autoSaveDelay}" min="100" max="5000" step="100" />
            </div>
          </div>

          <div class="settings-actions">
            <button id="settings-apply" class="settings-btn settings-btn-primary">Apply</button>
            <button id="settings-reset" class="settings-btn">Reset to Defaults</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Initialize settings panel
   * @param {HTMLElement} container - Container element
   */
  initialize(container) {
    container.insertAdjacentHTML('beforeend', this.createPanel());
    this.attachEventListeners();
    this.applySettings();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const closeBtn = document.getElementById('settings-close');
    const applyBtn = document.getElementById('settings-apply');
    const resetBtn = document.getElementById('settings-reset');

    closeBtn?.addEventListener('click', () => this.hide());
    applyBtn?.addEventListener('click', () => this.apply());
    resetBtn?.addEventListener('click', () => this.reset());

    // Real-time preview for some settings
    const themeSelect = document.getElementById('setting-theme');
    themeSelect?.addEventListener('change', (e) => {
      this.themeManager.setTheme(e.target.value);
    });
  }

  /**
   * Show settings panel
   */
  show() {
    const panel = document.getElementById('settings-panel');
    if (panel) {
      panel.style.display = 'block';
      this.isVisible = true;
    }
  }

  /**
   * Hide settings panel
   */
  hide() {
    const panel = document.getElementById('settings-panel');
    if (panel) {
      panel.style.display = 'none';
      this.isVisible = false;
    }
  }

  /**
   * Toggle settings panel
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Apply settings
   */
  apply() {
    // Collect settings from form
    this.settings = {
      fontSize: parseInt(document.getElementById('setting-font-size')?.value || '14'),
      tabSize: parseInt(document.getElementById('setting-tab-size')?.value || '2'),
      insertSpaces: document.getElementById('setting-insert-spaces')?.checked || false,
      wordWrap: document.getElementById('setting-word-wrap')?.value || 'on',
      minimap: document.getElementById('setting-minimap')?.checked || false,
      lineNumbers: document.getElementById('setting-line-numbers')?.value || 'on',
      renderWhitespace: document.getElementById('setting-whitespace')?.value || 'selection',
      autoSave: document.getElementById('setting-auto-save')?.checked || false,
      autoSaveDelay: parseInt(document.getElementById('setting-auto-save-delay')?.value || '1000'),
      theme: document.getElementById('setting-theme')?.value || 'webos-dark'
    };

    this.applySettings();
    this.saveSettings();
    this.hide();
  }

  /**
   * Apply settings to editor
   */
  applySettings() {
    if (!this.editor) return;

    this.editor.updateOptions({
      fontSize: this.settings.fontSize,
      tabSize: this.settings.tabSize,
      insertSpaces: this.settings.insertSpaces,
      wordWrap: this.settings.wordWrap,
      minimap: { enabled: this.settings.minimap },
      lineNumbers: this.settings.lineNumbers,
      renderWhitespace: this.settings.renderWhitespace
    });

    this.themeManager.setTheme(this.settings.theme);
  }

  /**
   * Reset to default settings
   */
  reset() {
    if (confirm('Reset all settings to defaults?')) {
      localStorage.removeItem('code-editor-settings');
      this.settings = this.loadSettings();
      this.applySettings();
      this.hide();
      location.reload(); // Reload to refresh the form
    }
  }

  /**
   * Get current settings
   * @returns {Object} Current settings
   */
  getSettings() {
    return this.settings;
  }
}
