/**
 * Command Palette - Natural Language Command Interface
 * Similar to VS Code's command palette but with AI-powered natural language processing
 */

import { eventBus } from '../utils/EventBus.js';
import { Logger } from '../utils/Logger.js';

export class CommandPalette {
  constructor(aiAssistant) {
    this.aiAssistant = aiAssistant;
    this.logger = new Logger('CommandPalette');
    this.element = null;
    this.input = null;
    this.results = null;
    this.isVisible = false;
    this.history = [];
    this.historyIndex = -1;
    this.suggestions = [];
  }

  initialize() {
    this.logger.info('Initializing Command Palette...');
    this._createUI();
    this._attachEventListeners();
    this._registerShortcuts();
  }

  _createUI() {
    // Create overlay
    this.element = document.createElement('div');
    this.element.id = 'command-palette';
    this.element.className = 'command-palette hidden';
    this.element.innerHTML = `
      <div class="command-palette-backdrop"></div>
      <div class="command-palette-container">
        <div class="command-palette-header">
          <span class="command-icon">⌘</span>
          <input
            type="text"
            class="command-input"
            placeholder="What would you like to do? (e.g., 'open terminal', 'create new file')"
            autocomplete="off"
            spellcheck="false"
          />
          <button class="command-close">✕</button>
        </div>
        <div class="command-results">
          <div class="command-suggestions"></div>
          <div class="command-history"></div>
        </div>
        <div class="command-footer">
          <span class="command-hint">
            <kbd>↑↓</kbd> Navigate <kbd>Enter</kbd> Execute <kbd>Esc</kbd> Close
          </span>
        </div>
      </div>
    `;

    document.body.appendChild(this.element);

    this.input = this.element.querySelector('.command-input');
    this.results = this.element.querySelector('.command-results');
    this.suggestionsContainer = this.element.querySelector('.command-suggestions');
    this.historyContainer = this.element.querySelector('.command-history');
  }

  _attachEventListeners() {
    // Input handling
    this.input.addEventListener('input', (e) => {
      this._handleInput(e.target.value);
    });

    this.input.addEventListener('keydown', (e) => {
      this._handleKeydown(e);
    });

    // Close button
    const closeBtn = this.element.querySelector('.command-close');
    closeBtn.addEventListener('click', () => {
      this.hide();
    });

    // Backdrop click
    const backdrop = this.element.querySelector('.command-palette-backdrop');
    backdrop.addEventListener('click', () => {
      this.hide();
    });

    // Prevent clicks inside container from closing
    const container = this.element.querySelector('.command-palette-container');
    container.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  _registerShortcuts() {
    // Global keyboard shortcut: Cmd+K or Ctrl+K
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  async _handleInput(value) {
    if (!value.trim()) {
      this._showHistory();
      return;
    }

    // Show suggestions based on input
    await this._showSuggestions(value);
  }

  async _handleKeydown(e) {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        await this._executeCommand(this.input.value);
        break;

      case 'Escape':
        e.preventDefault();
        this.hide();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this._navigateHistory('up');
        break;

      case 'ArrowDown':
        e.preventDefault();
        this._navigateHistory('down');
        break;
    }
  }

  async _executeCommand(command) {
    if (!command.trim()) return;

    this.logger.info(`Executing command: ${command}`);

    // Show executing state
    this._showExecuting(command);

    try {
      // Process through AI assistant
      const result = await this.aiAssistant.processCommand(command);

      // Store in history
      this._addToHistory(command, result);

      // Show result
      this._showResult(result);

      // Hide palette after brief delay if successful
      if (result.success) {
        setTimeout(() => {
          this.hide();
        }, 1500);
      }
    } catch (error) {
      this.logger.error('Command execution failed:', error);
      this._showError(error.message);
    }
  }

  _showExecuting(command) {
    this.suggestionsContainer.innerHTML = `
      <div class="command-executing">
        <div class="spinner"></div>
        <span>Executing: ${this._escapeHtml(command)}</span>
      </div>
    `;
  }

  _showResult(result) {
    const icon = result.success ? '✓' : '✗';
    const className = result.success ? 'success' : 'error';

    this.suggestionsContainer.innerHTML = `
      <div class="command-result ${className}">
        <span class="result-icon">${icon}</span>
        <div class="result-content">
          <div class="result-message">${this._escapeHtml(result.message)}</div>
          ${result.intent ? `<div class="result-meta">Intent: ${result.intent.type}</div>` : ''}
        </div>
      </div>
    `;
  }

  _showError(message) {
    this.suggestionsContainer.innerHTML = `
      <div class="command-result error">
        <span class="result-icon">✗</span>
        <div class="result-content">
          <div class="result-message">${this._escapeHtml(message)}</div>
        </div>
      </div>
    `;
  }

  async _showSuggestions(input) {
    const suggestions = await this._getSuggestions(input);

    if (suggestions.length === 0) {
      this.suggestionsContainer.innerHTML = `
        <div class="no-suggestions">
          No suggestions found. Try natural language commands like:
          <ul>
            <li>"open terminal"</li>
            <li>"create new file called test.txt"</li>
            <li>"find files containing example"</li>
          </ul>
        </div>
      `;
      return;
    }

    this.suggestionsContainer.innerHTML = `
      <div class="suggestions-title">Suggestions</div>
      <ul class="suggestions-list">
        ${suggestions.map(s => `
          <li class="suggestion-item" data-command="${this._escapeHtml(s.command)}">
            <span class="suggestion-icon">${s.icon}</span>
            <div class="suggestion-content">
              <div class="suggestion-title">${this._escapeHtml(s.title)}</div>
              <div class="suggestion-subtitle">${this._escapeHtml(s.subtitle)}</div>
            </div>
            <kbd class="suggestion-shortcut">${s.shortcut || ''}</kbd>
          </li>
        `).join('')}
      </ul>
    `;

    // Add click handlers
    const items = this.suggestionsContainer.querySelectorAll('.suggestion-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const command = item.dataset.command;
        this.input.value = command;
        this._executeCommand(command);
      });
    });
  }

  async _getSuggestions(input) {
    const lower = input.toLowerCase().trim();
    const suggestions = [];

    // Quick actions
    const quickActions = [
      { match: ['open', 'launch', 'start'], icon: '🚀', title: 'Launch Application', subtitle: 'Open an app', command: 'open terminal', shortcut: '' },
      { match: ['create', 'new', 'make'], icon: '📄', title: 'Create File', subtitle: 'Create a new file or folder', command: 'create file document.txt', shortcut: '' },
      { match: ['find', 'search'], icon: '🔍', title: 'Search Files', subtitle: 'Find files by name or content', command: 'find files containing ', shortcut: '' },
      { match: ['screenshot', 'capture'], icon: '📸', title: 'Take Screenshot', subtitle: 'Capture your screen', command: 'take screenshot', shortcut: '' },
      { match: ['settings', 'config'], icon: '⚙️', title: 'Open Settings', subtitle: 'Configure system settings', command: 'open settings', shortcut: '' },
      { match: ['help'], icon: '❓', title: 'Get Help', subtitle: 'Show available commands', command: 'help', shortcut: '' },
    ];

    for (const action of quickActions) {
      if (action.match.some(m => lower.includes(m))) {
        suggestions.push(action);
      }
    }

    // App suggestions
    if (lower.includes('open') || lower.includes('launch')) {
      const apps = [
        { name: 'Terminal', icon: '💻', command: 'open terminal' },
        { name: 'File Manager', icon: '📁', command: 'open file manager' },
        { name: 'Code Editor', icon: '📝', command: 'open code editor' },
        { name: 'Browser', icon: '🌐', command: 'open browser' },
        { name: 'Calculator', icon: '🔢', command: 'open calculator' },
        { name: 'System Monitor', icon: '📊', command: 'open system monitor' },
      ];

      for (const app of apps) {
        if (app.name.toLowerCase().includes(lower.replace(/open|launch|start/g, '').trim())) {
          suggestions.push({
            icon: app.icon,
            title: `Open ${app.name}`,
            subtitle: `Launch ${app.name}`,
            command: app.command,
            shortcut: ''
          });
        }
      }
    }

    return suggestions.slice(0, 8);
  }

  _showHistory() {
    if (this.history.length === 0) {
      this.historyContainer.innerHTML = `
        <div class="no-history">No command history yet</div>
      `;
      return;
    }

    this.historyContainer.innerHTML = `
      <div class="history-title">Recent Commands</div>
      <ul class="history-list">
        ${this.history.slice(-10).reverse().map(h => `
          <li class="history-item" data-command="${this._escapeHtml(h.command)}">
            <span class="history-icon">${h.result.success ? '✓' : '✗'}</span>
            <div class="history-content">
              <div class="history-command">${this._escapeHtml(h.command)}</div>
              <div class="history-time">${this._formatTime(h.timestamp)}</div>
            </div>
          </li>
        `).join('')}
      </ul>
    `;

    // Add click handlers
    const items = this.historyContainer.querySelectorAll('.history-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        this.input.value = item.dataset.command;
        this.input.focus();
      });
    });
  }

  _addToHistory(command, result) {
    this.history.push({
      command,
      result,
      timestamp: Date.now()
    });

    // Limit history
    if (this.history.length > 100) {
      this.history.shift();
    }

    this.historyIndex = -1;
  }

  _navigateHistory(direction) {
    if (this.history.length === 0) return;

    if (direction === 'up') {
      this.historyIndex = Math.min(this.historyIndex + 1, this.history.length - 1);
    } else {
      this.historyIndex = Math.max(this.historyIndex - 1, -1);
    }

    if (this.historyIndex >= 0) {
      this.input.value = this.history[this.history.length - 1 - this.historyIndex].command;
    } else {
      this.input.value = '';
    }
  }

  show() {
    this.element.classList.remove('hidden');
    this.isVisible = true;
    this.input.focus();
    this._showHistory();
  }

  hide() {
    this.element.classList.add('hidden');
    this.isVisible = false;
    this.input.value = '';
    this.historyIndex = -1;
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  _formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export default CommandPalette;
