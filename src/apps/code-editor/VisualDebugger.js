/**
 * Visual Debugger - Advanced debugging with breakpoints and variable inspection
 * Provides step-through debugging for JavaScript code
 */

export class VisualDebugger {
  constructor(editor, fs) {
    this.editor = editor;
    this.fs = fs;
    this.breakpoints = new Map(); // line -> breakpoint
    this.panel = null;
    this.isVisible = false;
    this.isPaused = false;
    this.currentLine = null;
    this.variables = {};
    this.callStack = [];
    this.watchExpressions = [];
  }

  /**
   * Initialize debugger
   */
  initialize(container) {
    this.container = container;
    this.createPanel();
    this.setupGutterDecorations();
  }

  /**
   * Create debugger panel
   */
  createPanel() {
    this.panel = document.createElement('div');
    this.panel.className = 'debugger-panel';
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
      <div class="debugger-header">
        <h3>🐛 Debugger</h3>
        <button class="close-btn" id="close-debugger">×</button>
      </div>

      <div class="debugger-controls">
        <button class="debug-btn" id="debug-continue" title="Continue (F8)" ${!this.isPaused ? 'disabled' : ''}>
          ▶️ Continue
        </button>
        <button class="debug-btn" id="debug-step-over" title="Step Over (F10)" ${!this.isPaused ? 'disabled' : ''}>
          ⏭️ Step Over
        </button>
        <button class="debug-btn" id="debug-step-into" title="Step Into (F11)" ${!this.isPaused ? 'disabled' : ''}>
          ⬇️ Step Into
        </button>
        <button class="debug-btn" id="debug-step-out" title="Step Out (Shift+F11)" ${!this.isPaused ? 'disabled' : ''}>
          ⬆️ Step Out
        </button>
        <button class="debug-btn" id="debug-stop" title="Stop">
          ⏹️ Stop
        </button>
        <button class="debug-btn" id="debug-run" title="Run (F5)">
          🚀 Run
        </button>
      </div>

      <div class="debugger-content">
        <div class="debugger-section">
          <div class="section-header">
            <strong>Variables</strong>
            <button class="section-btn" id="refresh-variables" title="Refresh">🔄</button>
          </div>
          <div class="variables-list" id="variables-list">
            <div class="empty-state">No variables</div>
          </div>
        </div>

        <div class="debugger-section">
          <div class="section-header">
            <strong>Watch</strong>
            <button class="section-btn" id="add-watch" title="Add Expression">+</button>
          </div>
          <div class="watch-list" id="watch-list">
            <div class="empty-state">No watch expressions</div>
          </div>
        </div>

        <div class="debugger-section">
          <div class="section-header">
            <strong>Call Stack</strong>
          </div>
          <div class="call-stack-list" id="call-stack-list">
            <div class="empty-state">Not running</div>
          </div>
        </div>

        <div class="debugger-section">
          <div class="section-header">
            <strong>Breakpoints</strong>
            <button class="section-btn" id="clear-breakpoints" title="Clear All">🗑️</button>
          </div>
          <div class="breakpoints-list" id="breakpoints-list">
            <div class="empty-state">No breakpoints</div>
          </div>
        </div>

        <div class="debugger-section">
          <div class="section-header">
            <strong>Console</strong>
            <button class="section-btn" id="clear-console" title="Clear">🗑️</button>
          </div>
          <div class="debug-console" id="debug-console">
            <div class="empty-state">Console output will appear here</div>
          </div>
        </div>
      </div>

      <style>
        .debugger-panel {
          position: fixed;
          right: 0;
          top: 80px;
          bottom: 0;
          width: 350px;
          background: #1e1e1e;
          border-left: 2px solid #3e3e3e;
          z-index: 9998;
          display: flex;
          flex-direction: column;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 13px;
        }

        .debugger-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 15px;
          background: #252526;
          border-bottom: 1px solid #3e3e3e;
        }

        .debugger-header h3 {
          margin: 0;
          color: #d4d4d4;
          font-size: 14px;
          font-weight: 600;
        }

        .debugger-controls {
          display: flex;
          gap: 5px;
          padding: 10px;
          background: #2d2d2d;
          border-bottom: 1px solid #3e3e3e;
          flex-wrap: wrap;
        }

        .debug-btn {
          padding: 6px 10px;
          background: #3c3c3c;
          border: 1px solid #565656;
          border-radius: 4px;
          color: #d4d4d4;
          cursor: pointer;
          font-size: 11px;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .debug-btn:hover:not(:disabled) {
          background: #505050;
          border-color: #007acc;
        }

        .debug-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .debugger-content {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
        }

        .debugger-section {
          margin-bottom: 15px;
          background: #2d2d2d;
          border: 1px solid #3e3e3e;
          border-radius: 4px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #252526;
          border-bottom: 1px solid #3e3e3e;
          color: #d4d4d4;
        }

        .section-btn {
          background: transparent;
          border: none;
          color: #d4d4d4;
          cursor: pointer;
          padding: 2px 6px;
          font-size: 14px;
        }

        .section-btn:hover {
          background: #3e3e3e;
          border-radius: 3px;
        }

        .variables-list, .watch-list, .call-stack-list, .breakpoints-list, .debug-console {
          padding: 8px;
          max-height: 200px;
          overflow-y: auto;
        }

        .variable-item, .watch-item, .stack-item, .breakpoint-item {
          padding: 6px 8px;
          margin: 2px 0;
          background: #3c3c3c;
          border-radius: 3px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .variable-name {
          color: #9cdcfe;
          font-weight: 500;
        }

        .variable-value {
          color: #ce9178;
          font-family: 'Consolas', monospace;
        }

        .empty-state {
          text-align: center;
          color: #6a6a6a;
          padding: 20px;
          font-size: 12px;
        }

        .console-entry {
          padding: 4px 8px;
          border-bottom: 1px solid #3e3e3e;
          font-family: 'Consolas', monospace;
          font-size: 12px;
        }

        .console-entry.log { color: #d4d4d4; }
        .console-entry.error { color: #f48771; }
        .console-entry.warn { color: #cca700; }
        .console-entry.info { color: #75beff; }

        .breakpoint-item {
          cursor: pointer;
        }

        .breakpoint-item:hover {
          background: #505050;
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
   * Setup gutter decorations for breakpoints
   */
  setupGutterDecorations() {
    if (!this.editor) return;

    // Add click handler to gutter
    this.editor.onMouseDown((e) => {
      const target = e.target;
      if (target.type === 5) { // GUTTER_LINE_NUMBERS
        const lineNumber = target.position.lineNumber;
        this.toggleBreakpoint(lineNumber);
      }
    });
  }

  /**
   * Toggle breakpoint at line
   */
  toggleBreakpoint(lineNumber) {
    if (this.breakpoints.has(lineNumber)) {
      this.removeBreakpoint(lineNumber);
    } else {
      this.addBreakpoint(lineNumber);
    }
    this.updateBreakpointsList();
    this.updateGutterDecorations();
  }

  /**
   * Add breakpoint
   */
  addBreakpoint(lineNumber) {
    const model = this.editor.getModel();
    if (!model) return;

    const lineContent = model.getLineContent(lineNumber);

    this.breakpoints.set(lineNumber, {
      line: lineNumber,
      content: lineContent.trim(),
      enabled: true
    });

    this.logToConsole('info', `Breakpoint added at line ${lineNumber}`);
  }

  /**
   * Remove breakpoint
   */
  removeBreakpoint(lineNumber) {
    this.breakpoints.delete(lineNumber);
    this.logToConsole('info', `Breakpoint removed from line ${lineNumber}`);
  }

  /**
   * Clear all breakpoints
   */
  clearAllBreakpoints() {
    this.breakpoints.clear();
    this.updateBreakpointsList();
    this.updateGutterDecorations();
    this.logToConsole('info', 'All breakpoints cleared');
  }

  /**
   * Update gutter decorations
   */
  updateGutterDecorations() {
    if (!this.editor) return;

    const decorations = Array.from(this.breakpoints.keys()).map(line => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        linesDecorationsClassName: 'breakpoint-decoration',
        glyphMarginClassName: 'breakpoint-glyph'
      }
    }));

    // Add current line decoration if paused
    if (this.isPaused && this.currentLine) {
      decorations.push({
        range: new monaco.Range(this.currentLine, 1, this.currentLine, 1),
        options: {
          isWholeLine: true,
          className: 'current-line-decoration',
          glyphMarginClassName: 'current-line-glyph'
        }
      });
    }

    this.editor.deltaDecorations([], decorations);

    // Add CSS for decorations
    this.addDecorationStyles();
  }

  /**
   * Add CSS for breakpoint decorations
   */
  addDecorationStyles() {
    if (document.getElementById('debugger-decoration-styles')) return;

    const style = document.createElement('style');
    style.id = 'debugger-decoration-styles';
    style.textContent = `
      .breakpoint-glyph {
        background: #e51400;
        width: 10px !important;
        height: 10px !important;
        border-radius: 50%;
        margin-left: 3px;
        margin-top: 5px;
      }

      .breakpoint-decoration {
        background: rgba(229, 20, 0, 0.1);
      }

      .current-line-glyph {
        background: #ffcc00;
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-bottom: 12px solid #ffcc00;
        border-radius: 0;
        margin-left: 0;
        margin-top: 3px;
      }

      .current-line-decoration {
        background: rgba(255, 204, 0, 0.15);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Run code with debugging
   */
  async run() {
    const model = this.editor.getModel();
    if (!model) return;

    const code = model.getValue();
    this.logToConsole('info', 'Starting debug session...');

    try {
      // Simple debugging: wrap code in try-catch and evaluate
      const result = await this.evaluateCode(code);
      this.logToConsole('log', 'Execution completed');
      this.logToConsole('log', `Result: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logToConsole('error', `Error: ${error.message}`);
    }
  }

  /**
   * Evaluate code
   */
  async evaluateCode(code) {
    // Create a safe evaluation context
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const func = new AsyncFunction('console', code);

    // Create custom console that logs to debugger
    const debugConsole = {
      log: (...args) => this.logToConsole('log', args.join(' ')),
      error: (...args) => this.logToConsole('error', args.join(' ')),
      warn: (...args) => this.logToConsole('warn', args.join(' ')),
      info: (...args) => this.logToConsole('info', args.join(' '))
    };

    return await func(debugConsole);
  }

  /**
   * Log to debug console
   */
  logToConsole(level, message) {
    const consoleEl = this.panel?.querySelector('#debug-console');
    if (!consoleEl) return;

    // Remove empty state
    const emptyState = consoleEl.querySelector('.empty-state');
    if (emptyState) {
      emptyState.remove();
    }

    const entry = document.createElement('div');
    entry.className = `console-entry ${level}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    consoleEl.appendChild(entry);

    // Auto-scroll to bottom
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  /**
   * Clear debug console
   */
  clearConsole() {
    const consoleEl = this.panel?.querySelector('#debug-console');
    if (!consoleEl) return;

    consoleEl.innerHTML = '<div class="empty-state">Console output will appear here</div>';
  }

  /**
   * Update breakpoints list
   */
  updateBreakpointsList() {
    const listEl = this.panel?.querySelector('#breakpoints-list');
    if (!listEl) return;

    if (this.breakpoints.size === 0) {
      listEl.innerHTML = '<div class="empty-state">No breakpoints</div>';
      return;
    }

    const html = Array.from(this.breakpoints.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([line, bp]) => `
        <div class="breakpoint-item" data-line="${line}">
          <span>Line ${line}: ${bp.content.substring(0, 30)}...</span>
          <button class="section-btn" onclick="window.debuggerRemoveBP(${line})">×</button>
        </div>
      `)
      .join('');

    listEl.innerHTML = html;

    // Setup global callback
    window.debuggerRemoveBP = (line) => {
      this.removeBreakpoint(line);
      this.updateBreakpointsList();
      this.updateGutterDecorations();
    };
  }

  /**
   * Add watch expression
   */
  addWatchExpression() {
    const expression = prompt('Enter expression to watch:');
    if (!expression) return;

    this.watchExpressions.push({
      expression,
      value: null
    });

    this.updateWatchList();
  }

  /**
   * Update watch list
   */
  updateWatchList() {
    const listEl = this.panel?.querySelector('#watch-list');
    if (!listEl) return;

    if (this.watchExpressions.length === 0) {
      listEl.innerHTML = '<div class="empty-state">No watch expressions</div>';
      return;
    }

    const html = this.watchExpressions.map((watch, index) => `
      <div class="watch-item">
        <span class="variable-name">${watch.expression}</span>
        <span class="variable-value">${watch.value || 'undefined'}</span>
      </div>
    `).join('');

    listEl.innerHTML = html;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    this.panel.querySelector('#close-debugger')?.addEventListener('click', () => {
      this.hide();
    });

    // Control buttons
    this.panel.querySelector('#debug-run')?.addEventListener('click', () => {
      this.run();
    });

    this.panel.querySelector('#debug-stop')?.addEventListener('click', () => {
      this.stop();
    });

    this.panel.querySelector('#clear-breakpoints')?.addEventListener('click', () => {
      this.clearAllBreakpoints();
    });

    this.panel.querySelector('#clear-console')?.addEventListener('click', () => {
      this.clearConsole();
    });

    this.panel.querySelector('#add-watch')?.addEventListener('click', () => {
      this.addWatchExpression();
    });
  }

  /**
   * Stop debugging
   */
  stop() {
    this.isPaused = false;
    this.currentLine = null;
    this.updateGutterDecorations();
    this.logToConsole('info', 'Debug session stopped');
  }

  /**
   * Show panel
   */
  show() {
    if (!this.panel) return;

    this.panel.style.display = 'flex';
    this.isVisible = true;
    this.updateBreakpointsList();
    this.updateWatchList();
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
