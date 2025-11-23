/**
 * Multi-Language REPL - Execute code in multiple languages
 * Supports JavaScript, Python (via Pyodide), and more
 */

export class MultiLanguageREPL {
  constructor() {
    this.panel = null;
    this.isVisible = false;
    this.history = [];
    this.historyIndex = -1;
    this.currentLanguage = 'javascript';
    this.pythonReady = false;
  }

  /**
   * Initialize REPL
   */
  initialize(container) {
    this.container = container;
    this.createPanel();
  }

  /**
   * Create panel
   */
  createPanel() {
    this.panel = document.createElement('div');
    this.panel.className = 'repl-panel';
    this.panel.style.display = 'none';
    this.panel.innerHTML = this.getPanelHTML();

    this.container.appendChild(this.panel);
    this.attachEventListeners();
  }

  /**
   * Get panel HTML
   */
  getPanelHTML() {
    return `
      <div class="repl-header">
        <div class="header-left">
          <h3>⚡ REPL</h3>
          <select id="language-select" class="language-select">
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="json">JSON</option>
          </select>
        </div>
        <div class="header-right">
          <button class="control-btn" id="clear-repl" title="Clear">🗑️ Clear</button>
          <button class="close-btn" id="close-repl">×</button>
        </div>
      </div>

      <div class="repl-output" id="repl-output">
        <div class="welcome-message">
          <p>Welcome to Multi-Language REPL</p>
          <p>Type your code and press Enter to execute</p>
          <p>Press ↑/↓ to navigate history</p>
        </div>
      </div>

      <div class="repl-input-container">
        <span class="prompt">${this.getPrompt()}</span>
        <textarea
          id="repl-input"
          class="repl-input"
          placeholder="Enter code..."
          rows="1"
        ></textarea>
        <button class="run-btn" id="run-repl" title="Run (Shift+Enter)">▶️</button>
      </div>

      <style>
        .repl-panel {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 400px;
          background: #1e1e1e;
          border-top: 2px solid #007acc;
          z-index: 9998;
          display: flex;
          flex-direction: column;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 13px;
        }

        .repl-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 15px;
          background: #252526;
          border-bottom: 1px solid #3e3e3e;
        }

        .header-left, .header-right {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .repl-header h3 {
          margin: 0;
          color: #d4d4d4;
          font-size: 14px;
          font-weight: 600;
        }

        .language-select {
          background: #3c3c3c;
          border: 1px solid #565656;
          border-radius: 4px;
          color: #d4d4d4;
          padding: 6px 12px;
          font-size: 13px;
          cursor: pointer;
          outline: none;
        }

        .language-select:focus {
          border-color: #007acc;
        }

        .control-btn {
          padding: 6px 12px;
          background: #3c3c3c;
          border: 1px solid #565656;
          border-radius: 4px;
          color: #d4d4d4;
          cursor: pointer;
          font-size: 12px;
        }

        .control-btn:hover {
          background: #505050;
          border-color: #007acc;
        }

        .repl-output {
          flex: 1;
          overflow-y: auto;
          padding: 15px;
          background: #1e1e1e;
        }

        .welcome-message {
          color: #6a9955;
          font-size: 12px;
          line-height: 1.8;
        }

        .repl-entry {
          margin-bottom: 15px;
        }

        .repl-entry-input {
          color: #d4d4d4;
          margin-bottom: 5px;
          display: flex;
          align-items: flex-start;
        }

        .repl-entry-input .prompt {
          color: #4ec9b0;
          margin-right: 8px;
          font-weight: bold;
        }

        .repl-entry-input .code {
          flex: 1;
          white-space: pre-wrap;
        }

        .repl-entry-output {
          margin-left: 20px;
          padding: 8px 12px;
          background: #2d2d2d;
          border-left: 3px solid #4ec9b0;
          border-radius: 3px;
          color: #ce9178;
        }

        .repl-entry-output.error {
          border-left-color: #f48771;
          color: #f48771;
        }

        .repl-entry-output.log {
          border-left-color: #75beff;
          color: #d4d4d4;
        }

        .repl-input-container {
          display: flex;
          align-items: center;
          padding: 10px 15px;
          background: #252526;
          border-top: 1px solid #3e3e3e;
          gap: 10px;
        }

        .prompt {
          color: #4ec9b0;
          font-weight: bold;
          font-size: 14px;
        }

        .repl-input {
          flex: 1;
          background: #3c3c3c;
          border: 1px solid #565656;
          border-radius: 4px;
          color: #d4d4d4;
          padding: 8px 12px;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 13px;
          resize: none;
          outline: none;
          max-height: 200px;
        }

        .repl-input:focus {
          border-color: #007acc;
        }

        .run-btn {
          padding: 8px 16px;
          background: #007acc;
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          font-size: 14px;
        }

        .run-btn:hover {
          background: #005a9e;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: #d4d4d4;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
        }

        .close-btn:hover {
          color: #fff;
        }
      </style>
    `;
  }

  /**
   * Get prompt for current language
   */
  getPrompt() {
    const prompts = {
      javascript: '>>',
      typescript: 'ts>',
      python: '>>>',
      json: 'json>'
    };
    return prompts[this.currentLanguage] || '>>';
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const input = this.panel.querySelector('#repl-input');
    const runBtn = this.panel.querySelector('#run-repl');
    const clearBtn = this.panel.querySelector('#clear-repl');
    const closeBtn = this.panel.querySelector('#close-repl');
    const languageSelect = this.panel.querySelector('#language-select');

    // Run code
    runBtn?.addEventListener('click', () => this.executeCode());

    // Language change
    languageSelect?.addEventListener('change', (e) => {
      this.currentLanguage = e.target.value;
      this.panel.querySelector('.prompt').textContent = this.getPrompt();
    });

    // Input handlers
    input?.addEventListener('keydown', (e) => {
      // Shift+Enter to run
      if (e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        this.executeCode();
      }
      // Up arrow - previous command
      else if (e.key === 'ArrowUp' && e.target.selectionStart === 0) {
        e.preventDefault();
        this.navigateHistory('up');
      }
      // Down arrow - next command
      else if (e.key === 'ArrowDown') {
        const atEnd = e.target.selectionStart === e.target.value.length;
        if (atEnd) {
          e.preventDefault();
          this.navigateHistory('down');
        }
      }
      // Auto-resize textarea
      else {
        setTimeout(() => {
          input.style.height = 'auto';
          input.style.height = (input.scrollHeight) + 'px';
        }, 0);
      }
    });

    // Clear
    clearBtn?.addEventListener('click', () => this.clear());

    // Close
    closeBtn?.addEventListener('click', () => this.hide());
  }

  /**
   * Execute code
   */
  async executeCode() {
    const input = this.panel.querySelector('#repl-input');
    const code = input.value.trim();

    if (!code) return;

    // Add to history
    this.history.push(code);
    this.historyIndex = this.history.length;

    // Clear input
    input.value = '';
    input.style.height = 'auto';

    // Display input
    this.addEntry(code, null, 'input');

    try {
      let result;

      switch (this.currentLanguage) {
        case 'javascript':
          result = await this.executeJavaScript(code);
          break;
        case 'typescript':
          result = await this.executeTypeScript(code);
          break;
        case 'python':
          result = await this.executePython(code);
          break;
        case 'json':
          result = this.executeJSON(code);
          break;
        default:
          result = 'Language not supported';
      }

      this.addEntry(code, result, 'output');
    } catch (error) {
      this.addEntry(code, error.message, 'error');
    }

    // Scroll to bottom
    const output = this.panel.querySelector('#repl-output');
    output.scrollTop = output.scrollHeight;
  }

  /**
   * Execute JavaScript
   */
  async executeJavaScript(code) {
    // Create safe execution context
    const logs = [];
    const customConsole = {
      log: (...args) => logs.push(args.join(' ')),
      error: (...args) => logs.push('Error: ' + args.join(' ')),
      warn: (...args) => logs.push('Warning: ' + args.join(' ')),
      info: (...args) => logs.push('Info: ' + args.join(' '))
    };

    try {
      // Use Function constructor for safer eval
      const func = new Function('console', `"use strict"; return (${code})`);
      const result = func(customConsole);

      // If there are console logs, show them
      if (logs.length > 0) {
        return logs.join('\n') + (result !== undefined ? `\n→ ${this.formatValue(result)}` : '');
      }

      return this.formatValue(result);
    } catch (error) {
      // Try as statement instead of expression
      try {
        const func = new Function('console', `"use strict"; ${code}`);
        func(customConsole);
        return logs.length > 0 ? logs.join('\n') : 'undefined';
      } catch (error2) {
        throw error; // Throw original error
      }
    }
  }

  /**
   * Execute TypeScript (transpile to JS)
   */
  async executeTypeScript(code) {
    // For now, just execute as JavaScript (would need TypeScript compiler)
    return await this.executeJavaScript(code);
  }

  /**
   * Execute Python (using Pyodide if available)
   */
  async executePython(code) {
    // Pyodide integration would go here
    // For now, return a message
    return 'Python execution requires Pyodide. Feature coming soon!';
  }

  /**
   * Execute JSON
   */
  executeJSON(code) {
    const parsed = JSON.parse(code);
    return JSON.stringify(parsed, null, 2);
  }

  /**
   * Format value for display
   */
  formatValue(value) {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  /**
   * Add entry to output
   */
  addEntry(code, output, type) {
    const outputEl = this.panel.querySelector('#repl-output');
    const entry = document.createElement('div');
    entry.className = 'repl-entry';

    if (type === 'input') {
      entry.innerHTML = `
        <div class="repl-entry-input">
          <span class="prompt">${this.getPrompt()}</span>
          <span class="code">${this.escapeHtml(code)}</span>
        </div>
      `;
    } else {
      const outputClass = type === 'error' ? 'error' : 'log';
      entry.innerHTML = `
        <div class="repl-entry-output ${outputClass}">
          ${this.escapeHtml(output)}
        </div>
      `;
    }

    outputEl.appendChild(entry);
  }

  /**
   * Navigate history
   */
  navigateHistory(direction) {
    const input = this.panel.querySelector('#repl-input');

    if (direction === 'up') {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        input.value = this.history[this.historyIndex];
      }
    } else if (direction === 'down') {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        input.value = this.history[this.historyIndex];
      } else {
        this.historyIndex = this.history.length;
        input.value = '';
      }
    }

    // Move cursor to end
    setTimeout(() => {
      input.selectionStart = input.selectionEnd = input.value.length;
    }, 0);
  }

  /**
   * Clear output
   */
  clear() {
    const output = this.panel.querySelector('#repl-output');
    output.innerHTML = `
      <div class="welcome-message">
        <p>Output cleared</p>
      </div>
    `;
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show panel
   */
  show() {
    if (!this.panel) return;

    this.panel.style.display = 'flex';
    this.isVisible = true;

    // Focus input
    setTimeout(() => {
      this.panel.querySelector('#repl-input')?.focus();
    }, 100);
  }

  /**
   * Hide panel
   */
  hide() {
    if (!this.panel) return;

    this.panel.style.display = 'none';
    this.isVisible = false;
  }

  /**
   * Toggle panel
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
  }
}
