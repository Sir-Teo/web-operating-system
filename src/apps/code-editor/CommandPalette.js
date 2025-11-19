/**
 * Command Palette
 * VS Code-style command palette for quick access to all editor features
 */
export class CommandPalette {
  constructor(editor, codeEditorApp) {
    this.editor = editor;
    this.app = codeEditorApp;
    this.container = null;
    this.input = null;
    this.commandList = null;
    this.visible = false;
    this.commands = this.buildCommands();
    this.filteredCommands = [];
    this.selectedIndex = 0;
  }

  /**
   * Build list of all available commands
   */
  buildCommands() {
    return [
      // File operations
      {
        id: 'file.new',
        label: 'File: New File',
        description: 'Create a new file',
        icon: '📄',
        keybinding: 'Ctrl+N',
        action: () => this.app.createNewFile()
      },
      {
        id: 'file.save',
        label: 'File: Save',
        description: 'Save the current file',
        icon: '💾',
        keybinding: 'Ctrl+S',
        action: () => this.app.saveCurrentFile()
      },
      {
        id: 'file.saveAll',
        label: 'File: Save All',
        description: 'Save all open files',
        icon: '💾',
        keybinding: 'Ctrl+Shift+S',
        action: () => this.app.saveAllFiles()
      },
      {
        id: 'file.closeTab',
        label: 'File: Close Tab',
        description: 'Close the active tab',
        icon: '✕',
        keybinding: 'Ctrl+W',
        action: () => {
          const activeTab = this.app.tabManager.getActiveTab();
          if (activeTab) this.app.tabManager.closeTab(activeTab.id);
        }
      },
      {
        id: 'file.closeAllTabs',
        label: 'File: Close All Tabs',
        description: 'Close all open tabs',
        icon: '✕',
        action: () => this.app.tabManager.closeAllTabs()
      },

      // View operations
      {
        id: 'view.toggleTerminal',
        label: 'View: Toggle Terminal',
        description: 'Show/hide integrated terminal',
        icon: '💻',
        keybinding: 'Ctrl+`',
        action: () => this.app.toggleTerminal()
      },
      {
        id: 'view.toggleMinimap',
        label: 'View: Toggle Minimap',
        description: 'Show/hide code minimap',
        icon: '🗺️',
        action: () => this.app.toggleMinimap()
      },
      {
        id: 'view.toggleBreadcrumbs',
        label: 'View: Toggle Breadcrumbs',
        description: 'Show/hide breadcrumbs',
        icon: '📍',
        action: () => this.app.toggleBreadcrumbs()
      },
      {
        id: 'view.zenMode',
        label: 'View: Toggle Zen Mode',
        description: 'Enter/exit distraction-free mode',
        icon: '🧘',
        keybinding: 'Ctrl+K Z',
        action: () => this.app.toggleZenMode()
      },

      // Editor operations
      {
        id: 'editor.find',
        label: 'Edit: Find',
        description: 'Find in current file',
        icon: '🔍',
        keybinding: 'Ctrl+F',
        action: () => this.app.searchPanel.show()
      },
      {
        id: 'editor.replace',
        label: 'Edit: Replace',
        description: 'Find and replace',
        icon: '🔄',
        keybinding: 'Ctrl+H',
        action: () => this.app.searchPanel.show()
      },
      {
        id: 'editor.formatDocument',
        label: 'Format: Format Document',
        description: 'Format the entire document',
        icon: '✨',
        keybinding: 'Shift+Alt+F',
        action: () => this.formatDocument()
      },
      {
        id: 'editor.formatSelection',
        label: 'Format: Format Selection',
        description: 'Format the selected text',
        icon: '✨',
        action: () => this.formatSelection()
      },
      {
        id: 'editor.foldAll',
        label: 'Editor: Fold All',
        description: 'Fold all code regions',
        icon: '📁',
        keybinding: 'Ctrl+K Ctrl+0',
        action: () => this.editor.trigger('fold', 'editor.foldAll')
      },
      {
        id: 'editor.unfoldAll',
        label: 'Editor: Unfold All',
        description: 'Unfold all code regions',
        icon: '📂',
        keybinding: 'Ctrl+K Ctrl+J',
        action: () => this.editor.trigger('unfold', 'editor.unfoldAll')
      },
      {
        id: 'editor.toggleWordWrap',
        label: 'Editor: Toggle Word Wrap',
        description: 'Enable/disable word wrap',
        icon: '↔️',
        keybinding: 'Alt+Z',
        action: () => this.app.toggleWordWrap()
      },
      {
        id: 'editor.increaseFontSize',
        label: 'Editor: Increase Font Size',
        description: 'Make editor text larger',
        icon: '🔍',
        keybinding: 'Ctrl+=',
        action: () => this.app.changeFontSize(1)
      },
      {
        id: 'editor.decreaseFontSize',
        label: 'Editor: Decrease Font Size',
        description: 'Make editor text smaller',
        icon: '🔍',
        keybinding: 'Ctrl+-',
        action: () => this.app.changeFontSize(-1)
      },

      // Navigation
      {
        id: 'nav.goToLine',
        label: 'Go to Line',
        description: 'Jump to a specific line number',
        icon: '🎯',
        keybinding: 'Ctrl+G',
        action: () => this.editor.trigger('', 'editor.action.gotoLine')
      },
      {
        id: 'nav.goToSymbol',
        label: 'Go to Symbol',
        description: 'Jump to a symbol in the current file',
        icon: '@',
        keybinding: 'Ctrl+Shift+O',
        action: () => this.editor.trigger('', 'editor.action.quickOutline')
      },

      // Code actions
      {
        id: 'code.commentLine',
        label: 'Code: Toggle Line Comment',
        description: 'Comment/uncomment line',
        icon: '💬',
        keybinding: 'Ctrl+/',
        action: () => this.editor.trigger('', 'editor.action.commentLine')
      },
      {
        id: 'code.blockComment',
        label: 'Code: Toggle Block Comment',
        description: 'Comment/uncomment block',
        icon: '💬',
        keybinding: 'Shift+Alt+A',
        action: () => this.editor.trigger('', 'editor.action.blockComment')
      },

      // Settings
      {
        id: 'settings.open',
        label: 'Preferences: Open Settings',
        description: 'Open editor settings',
        icon: '⚙️',
        keybinding: 'Ctrl+,',
        action: () => this.app.settingsPanel.toggle()
      },

      // Git operations
      {
        id: 'git.status',
        label: 'Git: Show Status',
        description: 'Show git status',
        icon: '📊',
        action: () => this.app.showGitPanel()
      },
      {
        id: 'git.commit',
        label: 'Git: Commit',
        description: 'Commit changes',
        icon: '✓',
        action: () => this.app.gitCommit()
      },

      // Terminal
      {
        id: 'terminal.run',
        label: 'Terminal: Run Current File',
        description: 'Execute the current file in terminal',
        icon: '▶️',
        keybinding: 'Ctrl+Shift+R',
        action: () => this.app.runCurrentFile()
      },
      {
        id: 'terminal.clear',
        label: 'Terminal: Clear',
        description: 'Clear terminal output',
        icon: '🗑️',
        action: () => this.app.integratedTerminal?.clear()
      }
    ];
  }

  /**
   * Initialize the command palette
   */
  initialize(parent) {
    this.container = document.createElement('div');
    this.container.className = 'command-palette';
    this.container.style.display = 'none';

    this.container.innerHTML = `
      <div class="command-palette-overlay"></div>
      <div class="command-palette-content">
        <div class="command-palette-input-container">
          <span class="command-palette-icon">⚡</span>
          <input
            type="text"
            class="command-palette-input"
            placeholder="Type a command or search..."
            autocomplete="off"
            spellcheck="false"
          />
        </div>
        <div class="command-palette-results"></div>
      </div>
    `;

    parent.appendChild(this.container);

    this.input = this.container.querySelector('.command-palette-input');
    this.commandList = this.container.querySelector('.command-palette-results');

    this.setupEventListeners();
    this.applyStyles();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Input events
    this.input.addEventListener('input', () => {
      this.filterCommands();
    });

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectPrevious();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.executeSelected();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.hide();
      }
    });

    // Overlay click to close
    this.container.querySelector('.command-palette-overlay')?.addEventListener('click', () => {
      this.hide();
    });
  }

  /**
   * Filter commands based on search query
   */
  filterCommands() {
    const query = this.input.value.toLowerCase().trim();

    if (!query) {
      this.filteredCommands = this.commands;
    } else {
      // Fuzzy search: matches if all query characters appear in order
      this.filteredCommands = this.commands.filter(cmd => {
        const label = cmd.label.toLowerCase();
        const desc = (cmd.description || '').toLowerCase();
        const combined = label + ' ' + desc;

        let queryIndex = 0;
        for (let i = 0; i < combined.length && queryIndex < query.length; i++) {
          if (combined[i] === query[queryIndex]) {
            queryIndex++;
          }
        }
        return queryIndex === query.length;
      });
    }

    this.selectedIndex = 0;
    this.renderCommands();
  }

  /**
   * Render filtered commands
   */
  renderCommands() {
    const maxResults = 10;
    const commands = this.filteredCommands.slice(0, maxResults);

    if (commands.length === 0) {
      this.commandList.innerHTML = `
        <div class="command-palette-empty">
          No commands found
        </div>
      `;
      return;
    }

    this.commandList.innerHTML = commands.map((cmd, index) => `
      <div class="command-palette-item ${index === this.selectedIndex ? 'selected' : ''}"
           data-index="${index}">
        <div class="command-palette-item-icon">${cmd.icon}</div>
        <div class="command-palette-item-info">
          <div class="command-palette-item-label">${this.highlightMatch(cmd.label)}</div>
          ${cmd.description ? `<div class="command-palette-item-desc">${cmd.description}</div>` : ''}
        </div>
        ${cmd.keybinding ? `<div class="command-palette-item-keybinding">${cmd.keybinding}</div>` : ''}
      </div>
    `).join('');

    // Add click handlers
    this.commandList.querySelectorAll('.command-palette-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        this.selectedIndex = index;
        this.executeSelected();
      });
    });
  }

  /**
   * Highlight matching characters
   */
  highlightMatch(text) {
    const query = this.input.value.toLowerCase();
    if (!query) return text;

    let result = '';
    let queryIndex = 0;

    for (let i = 0; i < text.length; i++) {
      if (queryIndex < query.length && text[i].toLowerCase() === query[queryIndex]) {
        result += `<mark>${text[i]}</mark>`;
        queryIndex++;
      } else {
        result += text[i];
      }
    }

    return result;
  }

  /**
   * Select next command
   */
  selectNext() {
    if (this.selectedIndex < this.filteredCommands.length - 1) {
      this.selectedIndex++;
      this.renderCommands();
    }
  }

  /**
   * Select previous command
   */
  selectPrevious() {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this.renderCommands();
    }
  }

  /**
   * Execute selected command
   */
  executeSelected() {
    const command = this.filteredCommands[this.selectedIndex];
    if (command && command.action) {
      this.hide();
      setTimeout(() => command.action(), 100);
    }
  }

  /**
   * Format document
   */
  formatDocument() {
    this.editor.trigger('', 'editor.action.formatDocument');
  }

  /**
   * Format selection
   */
  formatSelection() {
    this.editor.trigger('', 'editor.action.formatSelection');
  }

  /**
   * Show command palette
   */
  show() {
    this.visible = true;
    this.container.style.display = 'flex';
    this.input.value = '';
    this.filterCommands();
    setTimeout(() => this.input.focus(), 50);
  }

  /**
   * Hide command palette
   */
  hide() {
    this.visible = false;
    this.container.style.display = 'none';
  }

  /**
   * Toggle command palette
   */
  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Apply styles
   */
  applyStyles() {
    const styleId = 'command-palette-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .command-palette {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 100px;
      }

      .command-palette-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
      }

      .command-palette-content {
        position: relative;
        width: 600px;
        max-width: 90%;
        background: #2d2d30;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        overflow: hidden;
      }

      .command-palette-input-container {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #3e3e42;
        background: #2d2d30;
      }

      .command-palette-icon {
        font-size: 1.2rem;
        margin-right: 10px;
      }

      .command-palette-input {
        flex: 1;
        background: none;
        border: none;
        outline: none;
        color: #cccccc;
        font-size: 1rem;
        font-family: system-ui, -apple-system, sans-serif;
      }

      .command-palette-input::placeholder {
        color: #858585;
      }

      .command-palette-results {
        max-height: 400px;
        overflow-y: auto;
        background: #252526;
      }

      .command-palette-item {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        cursor: pointer;
        transition: background 0.1s;
        border-bottom: 1px solid #1e1e1e;
      }

      .command-palette-item:hover,
      .command-palette-item.selected {
        background: #094771;
      }

      .command-palette-item-icon {
        font-size: 1.2rem;
        margin-right: 12px;
        opacity: 0.9;
      }

      .command-palette-item-info {
        flex: 1;
        min-width: 0;
      }

      .command-palette-item-label {
        color: #cccccc;
        font-size: 0.95rem;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .command-palette-item-label mark {
        background: #ffd700;
        color: #000;
        padding: 0 2px;
        border-radius: 2px;
      }

      .command-palette-item-desc {
        color: #858585;
        font-size: 0.85rem;
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .command-palette-item-keybinding {
        color: #858585;
        font-size: 0.8rem;
        font-family: monospace;
        background: #3c3c3c;
        padding: 2px 8px;
        border-radius: 4px;
        margin-left: 12px;
        white-space: nowrap;
      }

      .command-palette-empty {
        padding: 40px 20px;
        text-align: center;
        color: #858585;
        font-size: 0.95rem;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Destroy the command palette
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
