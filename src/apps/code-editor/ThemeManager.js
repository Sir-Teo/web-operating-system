/**
 * Theme Manager for Monaco Editor
 * Manages editor themes and custom color schemes
 */
export class ThemeManager {
  constructor(monaco) {
    this.monaco = monaco;
    this.currentTheme = 'webos-dark';
    this.initializeThemes();
  }

  /**
   * Initialize custom themes
   */
  initializeThemes() {
    // WebOS Dark Theme
    this.monaco.editor.defineTheme('webos-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'regexp', foreground: 'D16969' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'class', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'constant', foreground: '4FC1FF' },
        { token: 'delimiter', foreground: 'D4D4D4' }
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2a2a2a',
        'editorCursor.foreground': '#ffffff',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41'
      }
    });

    // WebOS Light Theme
    this.monaco.editor.defineTheme('webos-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '008000', fontStyle: 'italic' },
        { token: 'keyword', foreground: '0000FF' },
        { token: 'string', foreground: 'A31515' },
        { token: 'number', foreground: '098658' },
        { token: 'regexp', foreground: '811F3F' },
        { token: 'type', foreground: '267F99' },
        { token: 'class', foreground: '267F99' },
        { token: 'function', foreground: '795E26' },
        { token: 'variable', foreground: '001080' },
        { token: 'constant', foreground: '0070C1' }
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#000000',
        'editor.lineHighlightBackground': '#f0f0f0',
        'editorCursor.foreground': '#000000',
        'editor.selectionBackground': '#add6ff',
        'editor.inactiveSelectionBackground': '#e5ebf1'
      }
    });

    // Dracula Theme
    this.monaco.editor.defineTheme('dracula', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6272A4', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'FF79C6' },
        { token: 'string', foreground: 'F1FA8C' },
        { token: 'number', foreground: 'BD93F9' },
        { token: 'function', foreground: '50FA7B' },
        { token: 'type', foreground: '8BE9FD' },
        { token: 'variable', foreground: 'F8F8F2' }
      ],
      colors: {
        'editor.background': '#282A36',
        'editor.foreground': '#F8F8F2',
        'editor.lineHighlightBackground': '#44475A',
        'editorCursor.foreground': '#F8F8F0',
        'editor.selectionBackground': '#44475A'
      }
    });

    // Nord Theme
    this.monaco.editor.defineTheme('nord', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '616E88', fontStyle: 'italic' },
        { token: 'keyword', foreground: '81A1C1' },
        { token: 'string', foreground: 'A3BE8C' },
        { token: 'number', foreground: 'B48EAD' },
        { token: 'function', foreground: '88C0D0' },
        { token: 'type', foreground: '8FBCBB' },
        { token: 'variable', foreground: 'D8DEE9' }
      ],
      colors: {
        'editor.background': '#2E3440',
        'editor.foreground': '#D8DEE9',
        'editor.lineHighlightBackground': '#3B4252',
        'editorCursor.foreground': '#D8DEE9',
        'editor.selectionBackground': '#434C5E'
      }
    });
  }

  /**
   * Set editor theme
   * @param {string} themeName - Theme name
   */
  setTheme(themeName) {
    this.currentTheme = themeName;
    this.monaco.editor.setTheme(themeName);
  }

  /**
   * Get current theme
   * @returns {string} Current theme name
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Get available themes
   * @returns {Array<Object>} Array of theme objects
   */
  getAvailableThemes() {
    return [
      { id: 'webos-dark', name: 'WebOS Dark', type: 'dark' },
      { id: 'webos-light', name: 'WebOS Light', type: 'light' },
      { id: 'vs-dark', name: 'Visual Studio Dark', type: 'dark' },
      { id: 'vs', name: 'Visual Studio Light', type: 'light' },
      { id: 'dracula', name: 'Dracula', type: 'dark' },
      { id: 'nord', name: 'Nord', type: 'dark' }
    ];
  }
}
