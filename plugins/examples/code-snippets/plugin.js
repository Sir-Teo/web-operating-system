/**
 * Code Snippets Manager Plugin
 * Manage and quickly access code snippets
 */

class CodeSnippetsManager {
  constructor(api) {
    this.api = api;
    this.widget = null;
    this.snippets = [];
    this.storageKey = 'code-snippets-data';
  }

  async activate() {
    console.log('[CodeSnippetsManager] Activating...');

    // Load snippets from storage
    await this.loadSnippets();

    // Create widget UI
    this.createWidget();

    this.api.ui.notify('Code Snippets Manager activated');
  }

  async deactivate() {
    console.log('[CodeSnippetsManager] Deactivating...');

    // Save snippets before deactivating
    await this.saveSnippets();

    if (this.widget) {
      this.widget.remove();
      this.widget = null;
    }
  }

  async loadSnippets() {
    try {
      const data = await this.api.storage.get(this.storageKey);
      this.snippets = data ? JSON.parse(data) : this.getDefaultSnippets();
    } catch (error) {
      console.error('[CodeSnippetsManager] Failed to load snippets:', error);
      this.snippets = this.getDefaultSnippets();
    }
  }

  async saveSnippets() {
    try {
      await this.api.storage.set(this.storageKey, JSON.stringify(this.snippets));
    } catch (error) {
      console.error('[CodeSnippetsManager] Failed to save snippets:', error);
    }
  }

  createWidget() {
    this.widget = document.createElement('div');
    this.widget.className = 'snippets-widget';
    this.widget.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      max-height: 500px;
      background: rgba(30, 30, 30, 0.98);
      border: 1px solid #3e3e42;
      border-radius: 8px;
      color: #d4d4d4;
      font-family: system-ui, sans-serif;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: none;
    `;

    this.renderWidget();
    document.body.appendChild(this.widget);

    // Keyboard shortcut to toggle (Ctrl+Shift+S)
    document.addEventListener('keydown', this.handleKeyboard.bind(this));
  }

  renderWidget() {
    this.widget.innerHTML = `
      <div style="padding: 16px; border-bottom: 1px solid #3e3e42; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; font-size: 16px;">📝 Code Snippets</h3>
        <div style="display: flex; gap: 8px;">
          <button class="add-btn" style="padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
            + Add
          </button>
          <button class="close-btn" style="background: none; border: none; color: #888; cursor: pointer; font-size: 20px;">×</button>
        </div>
      </div>
      <div class="snippets-list" style="padding: 12px; max-height: 400px; overflow-y: auto;">
        ${this.renderSnippetsList()}
      </div>
    `;

    // Event listeners
    this.widget.querySelector('.close-btn').addEventListener('click', () => this.hideWidget());
    this.widget.querySelector('.add-btn').addEventListener('click', () => this.addSnippet());

    // Snippet actions
    this.widget.querySelectorAll('.snippet-copy').forEach((btn, idx) => {
      btn.addEventListener('click', () => this.copySnippet(idx));
    });

    this.widget.querySelectorAll('.snippet-delete').forEach((btn, idx) => {
      btn.addEventListener('click', () => this.deleteSnippet(idx));
    });
  }

  renderSnippetsList() {
    if (this.snippets.length === 0) {
      return '<div style="text-align: center; color: #666; padding: 40px;">No snippets yet. Click "Add" to create one.</div>';
    }

    return this.snippets.map((snippet, idx) => `
      <div style="margin-bottom: 12px; background: #1e1e1e; border: 1px solid #3e3e42; border-radius: 4px; padding: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="font-weight: 600; font-size: 14px;">${this.escapeHtml(snippet.name)}</div>
          <div style="display: flex; gap: 4px;">
            <button class="snippet-copy" style="padding: 4px 8px; background: #007acc; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">
              📋 Copy
            </button>
            <button class="snippet-delete" style="padding: 4px 8px; background: #d73a49; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">
              🗑️
            </button>
          </div>
        </div>
        <div style="font-size: 11px; color: #888; margin-bottom: 6px;">${snippet.language}</div>
        <pre style="margin: 0; padding: 8px; background: #0d1117; border-radius: 3px; font-size: 12px; overflow-x: auto;"><code>${this.escapeHtml(snippet.code)}</code></pre>
      </div>
    `).join('');
  }

  handleKeyboard(e) {
    // Ctrl+Shift+S to toggle
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      this.toggleWidget();
    }
  }

  toggleWidget() {
    if (this.widget.style.display === 'none') {
      this.showWidget();
    } else {
      this.hideWidget();
    }
  }

  showWidget() {
    this.widget.style.display = 'block';
  }

  hideWidget() {
    this.widget.style.display = 'none';
  }

  async addSnippet() {
    const name = prompt('Snippet name:');
    if (!name) return;

    const language = prompt('Language (e.g., javascript, python, html):') || 'text';
    const code = prompt('Code:');
    if (!code) return;

    this.snippets.push({ name, language, code });
    await this.saveSnippets();
    this.renderWidget();
  }

  async copySnippet(index) {
    const snippet = this.snippets[index];
    try {
      await navigator.clipboard.writeText(snippet.code);
      this.api.ui.notify(`Copied "${snippet.name}" to clipboard`);
    } catch (error) {
      console.error('[CodeSnippetsManager] Failed to copy:', error);
      this.api.ui.notify('Failed to copy to clipboard');
    }
  }

  async deleteSnippet(index) {
    if (confirm(`Delete snippet "${this.snippets[index].name}"?`)) {
      this.snippets.splice(index, 1);
      await this.saveSnippets();
      this.renderWidget();
    }
  }

  getDefaultSnippets() {
    return [
      {
        name: 'Console Log',
        language: 'javascript',
        code: 'console.log();'
      },
      {
        name: 'Arrow Function',
        language: 'javascript',
        code: 'const myFunc = (param) => {\n  // code here\n};'
      },
      {
        name: 'Async Function',
        language: 'javascript',
        code: 'async function fetchData() {\n  try {\n    const response = await fetch(url);\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error(error);\n  }\n}'
      }
    ];
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // State management
  async saveState() {
    return {
      snippets: this.snippets,
      isVisible: this.widget?.style.display !== 'none'
    };
  }

  async restoreState(state) {
    this.snippets = state.snippets;
    if (state.isVisible) {
      this.showWidget();
    }
  }
}

module.exports = CodeSnippetsManager;
