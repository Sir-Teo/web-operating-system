/**
 * Integrated Terminal for Code Editor
 * A beautiful terminal panel that can run shell scripts and Python
 */
import { ScriptParser } from '../terminal/ScriptParser.js';
import { ScriptExecutor } from '../terminal/ScriptExecutor.js';

export class IntegratedTerminal {
  constructor(vfs, context) {
    this.vfs = vfs;
    this.context = context;
    this.container = null;
    this.output = null;
    this.input = null;
    this.history = [];
    this.historyIndex = 0;
    this.currentDir = '/home/user';
    this.env = {
      PATH: '/bin:/usr/bin',
      HOME: '/home/user',
      USER: 'user'
    };
    this.scriptParser = new ScriptParser();
    this.pythonReady = false;
    this.pyodide = null;
    this.mode = 'shell'; // 'shell' or 'python'
  }

  /**
   * Render the integrated terminal
   * @returns {HTMLElement}
   */
  render() {
    this.container = document.createElement('div');
    this.container.className = 'integrated-terminal';
    this.container.innerHTML = this.getHTML();
    this.applyStyles();
    this.setupEventHandlers();
    return this.container;
  }

  /**
   * Get HTML template
   * @returns {string}
   */
  getHTML() {
    return `
      <div class="terminal-header">
        <div class="terminal-tabs">
          <div class="terminal-tab active" data-mode="shell">
            <span class="tab-icon">$</span>
            <span class="tab-label">Shell</span>
          </div>
          <div class="terminal-tab" data-mode="python">
            <span class="tab-icon">🐍</span>
            <span class="tab-label">Python</span>
          </div>
        </div>
        <div class="terminal-actions">
          <button class="terminal-action-btn" id="clear-terminal" title="Clear Terminal">
            <span>🗑️</span>
          </button>
          <button class="terminal-action-btn" id="run-file" title="Run Current File">
            <span>▶️</span>
          </button>
        </div>
      </div>
      <div class="terminal-body">
        <div class="terminal-output" id="terminal-output"></div>
        <div class="terminal-input-line">
          <span class="terminal-prompt" id="terminal-prompt">${this.getPrompt()}</span>
          <input type="text" class="terminal-input" id="terminal-input" autocomplete="off" spellcheck="false" autofocus>
        </div>
      </div>
    `;
  }

  /**
   * Apply styles
   */
  applyStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .integrated-terminal {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #1e1e1e;
        color: #d4d4d4;
        font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
        font-size: 13px;
      }

      .terminal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #252526;
        border-bottom: 1px solid #3e3e42;
        padding: 0 8px;
        height: 35px;
      }

      .terminal-tabs {
        display: flex;
        gap: 4px;
      }

      .terminal-tab {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        cursor: pointer;
        border-radius: 4px 4px 0 0;
        transition: background 0.2s;
        font-size: 12px;
      }

      .terminal-tab:hover {
        background: #2a2d2e;
      }

      .terminal-tab.active {
        background: #1e1e1e;
        border-bottom: 2px solid #007acc;
      }

      .tab-icon {
        font-size: 14px;
      }

      .tab-label {
        font-weight: 500;
      }

      .terminal-actions {
        display: flex;
        gap: 4px;
      }

      .terminal-action-btn {
        background: transparent;
        border: none;
        color: #d4d4d4;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 14px;
        transition: background 0.2s;
      }

      .terminal-action-btn:hover {
        background: #2a2d2e;
      }

      .terminal-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 12px;
        overflow-y: auto;
        background: #1e1e1e;
      }

      .terminal-output {
        flex: 1;
        overflow-y: auto;
        margin-bottom: 8px;
        line-height: 1.5;
      }

      .terminal-line {
        margin: 2px 0;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      .terminal-line.command {
        color: #4ec9b0;
      }

      .terminal-line.output {
        color: #d4d4d4;
      }

      .terminal-line.error {
        color: #f48771;
      }

      .terminal-line.success {
        color: #4ec97b;
      }

      .terminal-line.info {
        color: #569cd6;
      }

      .terminal-input-line {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .terminal-prompt {
        color: #4ec9b0;
        font-weight: 600;
        flex-shrink: 0;
      }

      .terminal-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: #d4d4d4;
        font-family: inherit;
        font-size: inherit;
        padding: 0;
      }

      .terminal-input::selection {
        background: #264f78;
      }

      /* Scrollbar */
      .terminal-output::-webkit-scrollbar,
      .terminal-body::-webkit-scrollbar {
        width: 10px;
      }

      .terminal-output::-webkit-scrollbar-track,
      .terminal-body::-webkit-scrollbar-track {
        background: #1e1e1e;
      }

      .terminal-output::-webkit-scrollbar-thumb,
      .terminal-body::-webkit-scrollbar-thumb {
        background: #424242;
        border-radius: 5px;
      }

      .terminal-output::-webkit-scrollbar-thumb:hover,
      .terminal-body::-webkit-scrollbar-thumb:hover {
        background: #4e4e4e;
      }

      /* Python indicator */
      .python-mode .terminal-prompt {
        color: #ffd43b;
      }

      /* Loading animation */
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }

      .terminal-loading {
        display: inline-block;
        animation: blink 1s infinite;
      }
    `;

    this.container.appendChild(style);
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.output = this.container.querySelector('#terminal-output');
    this.input = this.container.querySelector('#terminal-input');
    const prompt = this.container.querySelector('#terminal-prompt');

    // Input handler
    this.input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const command = this.input.value.trim();
        if (command) {
          this.history.push(command);
          this.historyIndex = this.history.length;
          await this.executeCommand(command);
          this.input.value = '';
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.historyIndex > 0) {
          this.historyIndex--;
          this.input.value = this.history[this.historyIndex] || '';
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this.historyIndex < this.history.length) {
          this.historyIndex++;
          this.input.value = this.history[this.historyIndex] || '';
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        // TODO: Implement tab completion
      }
    });

    // Tab switching
    this.container.querySelectorAll('.terminal-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const mode = tab.dataset.mode;
        this.switchMode(mode);
      });
    });

    // Clear button
    this.container.querySelector('#clear-terminal')?.addEventListener('click', () => {
      this.clear();
    });

    // Run file button
    this.container.querySelector('#run-file')?.addEventListener('click', () => {
      this.emit('run-file');
    });

    // Focus input when clicking in terminal
    this.container.addEventListener('click', () => {
      this.input.focus();
    });
  }

  /**
   * Get prompt string
   * @returns {string}
   */
  getPrompt() {
    if (this.mode === 'python') {
      return '>>> ';
    }
    const shortDir = this.currentDir.replace('/home/user', '~');
    return `user@webos:${shortDir}$ `;
  }

  /**
   * Update prompt
   */
  updatePrompt() {
    const prompt = this.container.querySelector('#terminal-prompt');
    if (prompt) {
      prompt.textContent = this.getPrompt();
    }
  }

  /**
   * Switch mode (shell/python)
   * @param {string} mode - Mode to switch to
   */
  async switchMode(mode) {
    this.mode = mode;

    // Update tabs
    this.container.querySelectorAll('.terminal-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });

    // Update prompt
    this.updatePrompt();

    // Update body class
    if (mode === 'python') {
      this.container.querySelector('.terminal-body')?.classList.add('python-mode');

      // Initialize Python if not ready
      if (!this.pythonReady) {
        await this.initPython();
      }
    } else {
      this.container.querySelector('.terminal-body')?.classList.remove('python-mode');
    }

    this.writeLine(`Switched to ${mode.toUpperCase()} mode`, 'info');
  }

  /**
   * Initialize Python (Pyodide)
   */
  async initPython() {
    this.writeLine('Loading Python environment...', 'info');
    this.writeLine('This may take a moment on first load.', 'info');

    try {
      // Load Pyodide
      if (!window.loadPyodide) {
        // Dynamically load Pyodide script
        await this.loadPyodideScript();
      }

      this.pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
      });

      this.pythonReady = true;
      this.writeLine('Python 3.11.3 (Pyodide) ready!', 'success');
      this.writeLine('Type Python code to execute. Use "import" for packages.', 'info');
    } catch (error) {
      console.error('Error loading Python:', error);
      this.writeLine(`Error loading Python: ${error.message}`, 'error');
      this.writeLine('Falling back to Shell mode...', 'info');
      this.switchMode('shell');
    }
  }

  /**
   * Load Pyodide script dynamically
   * @returns {Promise}
   */
  loadPyodideScript() {
    return new Promise((resolve, reject) => {
      if (window.loadPyodide) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Execute command
   * @param {string} command - Command to execute
   */
  async executeCommand(command) {
    // Show command in output
    this.writeLine(`${this.getPrompt()}${command}`, 'command');

    try {
      if (this.mode === 'python') {
        await this.executePython(command);
      } else {
        await this.executeShell(command);
      }
    } catch (error) {
      this.writeLine(`Error: ${error.message}`, 'error');
    }

    // Scroll to bottom
    this.scrollToBottom();
  }

  /**
   * Execute Python code
   * @param {string} code - Python code to execute
   */
  async executePython(code) {
    if (!this.pythonReady || !this.pyodide) {
      this.writeLine('Python is not ready yet. Please wait...', 'error');
      return;
    }

    try {
      // Capture stdout
      await this.pyodide.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
      `);

      // Execute code
      const result = await this.pyodide.runPythonAsync(code);

      // Get stdout/stderr
      const stdout = await this.pyodide.runPythonAsync('sys.stdout.getvalue()');
      const stderr = await this.pyodide.runPythonAsync('sys.stderr.getvalue()');

      // Display output
      if (stdout) {
        this.writeLine(stdout, 'output');
      }
      if (stderr) {
        this.writeLine(stderr, 'error');
      }
      if (result !== undefined && result !== null && !stdout) {
        this.writeLine(String(result), 'output');
      }

    } catch (error) {
      this.writeLine(error.message, 'error');
    }
  }

  /**
   * Execute shell command
   * @param {string} command - Shell command to execute
   */
  async executeShell(command) {
    // Handle built-in commands
    if (command.startsWith('cd ')) {
      const path = command.substring(3).trim();
      await this.changeDirectory(path);
      return;
    }

    if (command === 'pwd') {
      this.writeLine(this.currentDir, 'output');
      return;
    }

    if (command === 'clear') {
      this.clear();
      return;
    }

    // Parse and execute script
    try {
      const ast = this.scriptParser.parse(command);
      const executor = new ScriptExecutor(this.createTerminalContext());
      const output = await executor.execute(ast);
      if (output) {
        this.writeLine(output, 'output');
      }
    } catch (error) {
      this.writeLine(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Create terminal context for script executor
   * @returns {Object}
   */
  createTerminalContext() {
    return {
      env: this.env,
      currentDir: this.currentDir,
      context: this.context,
      executeBareCommand: (cmd, args) => this.executeBareCommand(cmd, args)
    };
  }

  /**
   * Execute bare command (fallback)
   * @param {string} cmd - Command name
   * @param {Array} args - Command arguments
   * @returns {Promise<string>}
   */
  async executeBareCommand(cmd, args) {
    // Simple command execution
    const commands = this.context.kernel?.commandRegistry?.commands || new Map();
    const command = commands.get(cmd);

    if (command) {
      return await command.execute(args, {
        fs: this.vfs,
        cwd: this.currentDir,
        env: this.env
      });
    }

    throw new Error(`Command not found: ${cmd}`);
  }

  /**
   * Change directory
   * @param {string} path - Directory path
   */
  async changeDirectory(path) {
    try {
      // Resolve path
      let newPath = path;
      if (!path.startsWith('/')) {
        newPath = this.currentDir === '/' ? `/${path}` : `${this.currentDir}/${path}`;
      }

      // Normalize path
      newPath = newPath.replace(/\/+/g, '/');

      // Check if directory exists
      const stat = await this.vfs.stat(newPath);
      if (!stat.isDirectory) {
        throw new Error('Not a directory');
      }

      this.currentDir = newPath;
      this.updatePrompt();
    } catch (error) {
      this.writeLine(`cd: ${error.message}`, 'error');
    }
  }

  /**
   * Write line to output
   * @param {string} text - Text to write
   * @param {string} type - Line type (command/output/error/success/info)
   */
  writeLine(text, type = 'output') {
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    line.textContent = text;
    this.output.appendChild(line);
  }

  /**
   * Clear terminal
   */
  clear() {
    if (this.output) {
      this.output.innerHTML = '';
    }
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom() {
    if (this.output) {
      this.output.scrollTop = this.output.scrollHeight;
    }
  }

  /**
   * Run file content
   * @param {string} content - File content
   * @param {string} filename - File name
   */
  async runFile(content, filename) {
    const ext = filename.split('.').pop().toLowerCase();

    this.writeLine(`Running ${filename}...`, 'info');

    if (ext === 'py' || ext === 'python') {
      // Switch to Python mode if not already
      if (this.mode !== 'python') {
        await this.switchMode('python');
      }
      await this.executePython(content);
    } else if (ext === 'sh' || ext === 'bash') {
      // Shell script
      if (this.mode !== 'shell') {
        await this.switchMode('shell');
      }
      await this.executeShell(content);
    } else {
      this.writeLine(`Unsupported file type: .${ext}`, 'error');
      this.writeLine('Supported: .py, .sh, .bash', 'info');
    }
  }

  /**
   * Emit event to parent
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    this.container.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  /**
   * Focus the input
   */
  focus() {
    if (this.input) {
      this.input.focus();
    }
  }

  /**
   * Destroy the terminal
   */
  destroy() {
    // Cleanup
    if (this.pyodide) {
      // Pyodide cleanup if needed
    }
  }
}
