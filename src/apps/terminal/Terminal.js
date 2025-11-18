import { ScriptParser } from './ScriptParser.js';
import { ScriptExecutor } from './ScriptExecutor.js';
import { JobManager } from './JobManager.js';
import { terminalThemes, applyTheme, getCurrentTheme, getAvailableThemes } from './TerminalThemes.js';
import { FileAttributes } from '../../filesystem/FileAttributes.js';
import { FileWatcher } from '../../filesystem/FileWatcher.js';
import { CompressionManager } from '../../filesystem/CompressionManager.js';
import { FileEncryption } from '../../filesystem/FileEncryption.js';
import NetworkStack from '../../network/NetworkStack.js';

export default class Terminal {
  constructor(context) {
    this.context = context;
    this.history = [];
    this.historyIndex = 0;
    this.currentDir = '/home/user';
    this.env = {
      PATH: '/bin:/usr/bin',
      HOME: '/home/user',
      USER: 'user'
    };
    this.commandHistory = [];

    // Initialize new features
    this.scriptParser = new ScriptParser();
    this.jobManager = new JobManager(this);
    this.currentTheme = getCurrentTheme();
    this.multiLineMode = false;
    this.multiLineBuffer = [];
    this.searchMode = false;
    this.searchResults = [];
    this.searchIndex = 0;

    // Initialize file attributes and watcher
    this.fileAttributes = new FileAttributes();
    this.fileWatcher = new FileWatcher(context.fs);
    this.activeWatchers = new Map();

    // Initialize compression manager
    this.compressionManager = new CompressionManager(context.fs);

    // Initialize encryption manager
    this.fileEncryption = new FileEncryption(context.fs);

    // Initialize network stack
    this.networkStack = NetworkStack;
  }

  async init() {
    // Terminal is ready
  }

  render() {
    const container = document.createElement('div');
    container.className = 'terminal-container';
    container.style.cssText = `
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
      color: #00ff41;
      font-family: 'Courier New', 'Consolas', monospace;
      padding: 20px;
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    `;

    // Add scanline effect
    const scanline = document.createElement('div');
    scanline.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        transparent 50%,
        rgba(0, 255, 65, 0.03) 50%
      );
      background-size: 100% 4px;
      pointer-events: none;
      animation: scan 8s linear infinite;
      z-index: 2;
    `;
    container.appendChild(scanline);

    // Add glow effect
    const glow = document.createElement('div');
    glow.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(
        circle at center,
        rgba(0, 255, 65, 0.05) 0%,
        transparent 70%
      );
      pointer-events: none;
      z-index: 1;
    `;
    container.appendChild(glow);

    // Terminal header
    const header = document.createElement('div');
    header.style.cssText = `
      background: rgba(0, 255, 65, 0.1);
      padding: 10px 15px;
      border-radius: 8px 8px 0 0;
      border-bottom: 2px solid rgba(0, 255, 65, 0.3);
      margin: -20px -20px 15px -20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 3;
      position: relative;
    `;

    const headerTitle = document.createElement('div');
    headerTitle.textContent = '💻 WebOS Terminal';
    headerTitle.style.cssText = 'color: #00ff41; font-weight: bold; text-shadow: 0 0 10px #00ff41;';

    const headerButtons = document.createElement('div');
    headerButtons.style.cssText = 'display: flex; gap: 8px;';

    const clearBtn = this._createHeaderButton('Clear', () => {
      output.innerHTML = '';
      this._showWelcome(output);
    });

    headerButtons.appendChild(clearBtn);
    header.appendChild(headerTitle);
    header.appendChild(headerButtons);
    container.appendChild(header);

    // Output area
    const output = document.createElement('div');
    output.className = 'terminal-output';
    output.id = 'terminal-output';
    output.style.cssText = `
      flex: 1;
      overflow-y: auto;
      margin-bottom: 10px;
      z-index: 3;
      position: relative;
    `;

    // Input line
    const inputLine = document.createElement('div');
    inputLine.className = 'terminal-input-line';
    inputLine.style.cssText = `
      display: flex;
      align-items: center;
      z-index: 3;
      position: relative;
      background: rgba(0, 255, 65, 0.05);
      padding: 10px;
      border-radius: 8px;
      border: 1px solid rgba(0, 255, 65, 0.2);
    `;

    const prompt = document.createElement('span');
    prompt.className = 'terminal-prompt';
    prompt.textContent = this._getPrompt();
    prompt.style.cssText = `
      color: #00d4ff;
      margin-right: 10px;
      font-weight: bold;
      text-shadow: 0 0 5px #00d4ff;
      flex-shrink: 0;
    `;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'terminal-input';
    input.style.cssText = `
      background: transparent;
      border: none;
      outline: none;
      color: #00ff41;
      font-family: 'Courier New', 'Consolas', monospace;
      font-size: 14px;
      flex: 1;
      text-shadow: 0 0 5px #00ff41;
    `;
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');

    inputLine.appendChild(prompt);
    inputLine.appendChild(input);

    container.appendChild(output);
    container.appendChild(inputLine);

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes scan {
        0% { transform: translateY(0); }
        100% { transform: translateY(100%); }
      }
      @keyframes blink {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0; }
      }
      .terminal-output::-webkit-scrollbar {
        width: 8px;
      }
      .terminal-output::-webkit-scrollbar-track {
        background: rgba(0, 255, 65, 0.1);
        border-radius: 4px;
      }
      .terminal-output::-webkit-scrollbar-thumb {
        background: rgba(0, 255, 65, 0.3);
        border-radius: 4px;
      }
      .terminal-output::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 255, 65, 0.5);
      }
    `;
    document.head.appendChild(style);

    // Show welcome message
    this._showWelcome(output);

    // Setup enhanced input handler with new features
    input.addEventListener('keydown', async (e) => {
      // Ctrl+C: Interrupt foreground job
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        if (this.jobManager.hasForegroundJob()) {
          const msg = this.jobManager.interruptForeground();
          if (msg) this._addOutput(output, msg, '#ff5555');
        }
        input.value = '';
        return;
      }

      // Ctrl+Z: Suspend foreground job
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        if (this.jobManager.hasForegroundJob()) {
          const msg = this.jobManager.suspendForeground();
          if (msg) this._addOutput(output, msg, '#f1fa8c');
        }
        input.value = '';
        return;
      }

      // Ctrl+D: Exit (optional)
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        this._addOutput(output, '\n👋 Logout\n', '#00d4ff');
        return;
      }

      // Ctrl+R: Fuzzy search history
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        this._startFuzzySearch(input, output);
        return;
      }

      // Ctrl+L: Clear screen
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        output.innerHTML = '';
        this._showWelcome(output);
        return;
      }

      if (e.key === 'Enter') {
        const command = input.value.trim();

        // Handle multi-line mode
        if (this.multiLineMode) {
          if (command === '') {
            // Execute multi-line script
            const script = this.multiLineBuffer.join('\n');
            this.multiLineMode = false;
            this.multiLineBuffer = [];
            prompt.textContent = this._getPrompt();

            this._addOutput(output, `${this._getPrompt()}${script}`, '#00d4ff');
            const result = await this.executeCommand(script);
            if (result !== '\x1bc') {
              this._addOutput(output, result, '#00ff41');
            }
            input.value = '';
            return;
          } else {
            this.multiLineBuffer.push(command);
            this._addOutput(output, `> ${command}`, '#00d4ff');
            input.value = '';
            return;
          }
        }

        if (command) {
          this.history.push(command);
          this.historyIndex = this.history.length;

          this._addOutput(output, `${this._getPrompt()}${command}`, '#00d4ff');

          const result = await this.executeCommand(command);
          if (result !== '\x1bc') {
            this._addOutput(output, result, '#00ff41');
          } else {
            output.innerHTML = '';
            this._showWelcome(output);
          }

          prompt.textContent = this._getPrompt();
        }
        input.value = '';
        this._hideAutoSuggest();
        container.scrollTop = container.scrollHeight;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.historyIndex > 0) {
          this.historyIndex--;
          input.value = this.history[this.historyIndex];
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          input.value = this.history[this.historyIndex];
        } else {
          this.historyIndex = this.history.length;
          input.value = '';
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        // Enhanced autocomplete
        const value = input.value;
        const commands = ['cd', 'ls', 'pwd', 'cat', 'echo', 'mkdir', 'rm', 'touch', 'help', 'clear', 'ps', 'uname', 'date', 'whoami', 'tree', 'cp', 'mv', 'grep', 'find', 'wc', 'sort', 'uniq', 'head', 'tail', 'cut', 'neofetch', 'script', 'theme', 'jobs', 'fg', 'bg', 'wait', 'kill', 'chmod', 'chown', 'ln', 'readlink', 'watch', 'lsattr', 'chattr', 'stat', 'export', 'env', 'alias', 'history', 'gzip', 'gunzip', 'tar'];
        const matches = commands.filter(cmd => cmd.startsWith(value));
        if (matches.length === 1) {
          input.value = matches[0] + ' ';
        } else if (matches.length > 1) {
          this._addOutput(output, matches.join('  '), '#f1fa8c');
        }
      }
    });

    // Auto-suggest as user types
    input.addEventListener('input', (e) => {
      this._showAutoSuggest(input, output);
    });

    // Auto-focus input
    setTimeout(() => input.focus(), 100);

    return container;
  }

  _createHeaderButton(text, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
      background: rgba(0, 255, 65, 0.2);
      border: 1px solid rgba(0, 255, 65, 0.3);
      color: #00ff41;
      padding: 4px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-family: 'Courier New', monospace;
      transition: all 0.3s;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(0, 255, 65, 0.3)';
      btn.style.boxShadow = '0 0 10px rgba(0, 255, 65, 0.5)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(0, 255, 65, 0.2)';
      btn.style.boxShadow = 'none';
    });
    btn.addEventListener('click', onClick);
    return btn;
  }

  _showWelcome(outputElement) {
    const welcome = `
╔══════════════════════════════════════════════════════════╗
║           🌐 Welcome to WebOS Terminal v2.0             ║
║                                                          ║
║  A beautiful, feature-rich terminal experience          ║
║  Type 'help' for available commands                     ║
╚══════════════════════════════════════════════════════════╝
`;
    this._addOutput(outputElement, welcome, '#00d4ff');
  }

  _getPrompt() {
    return `┌─[${this.env.USER}@webos]─[${this.currentDir}]\n└─$ `;
  }

  _addOutput(outputElement, text, color = '#00ff41') {
    const line = document.createElement('div');
    line.textContent = text;
    line.style.cssText = `
      white-space: pre-wrap;
      color: ${color};
      text-shadow: 0 0 5px ${color};
      margin-bottom: 8px;
      line-height: 1.5;
    `;
    outputElement.appendChild(line);
    outputElement.scrollTop = outputElement.scrollHeight;
  }

  async executeCommand(commandLine) {
    // Handle background execution (&)
    if (commandLine.trim().endsWith('&')) {
      const cmd = commandLine.trim().slice(0, -1).trim();
      const jobId = await this.jobManager.createJob(cmd, true);
      return `✅ Job [${jobId}] started in background: ${cmd}`;
    }

    // Parse pipes and redirection
    if (commandLine.includes('|') || commandLine.includes('>') || commandLine.includes('<')) {
      return await this._executePipelineOrRedirect(commandLine);
    }

    const [command, ...args] = commandLine.trim().split(/\s+/);

    const builtins = {
      cd: this.cmd_cd.bind(this),
      ls: this.cmd_ls.bind(this),
      pwd: this.cmd_pwd.bind(this),
      cat: this.cmd_cat.bind(this),
      echo: this.cmd_echo.bind(this),
      mkdir: this.cmd_mkdir.bind(this),
      rm: this.cmd_rm.bind(this),
      touch: this.cmd_touch.bind(this),
      help: this.cmd_help.bind(this),
      clear: this.cmd_clear.bind(this),
      ps: this.cmd_ps.bind(this),
      uname: this.cmd_uname.bind(this),
      date: this.cmd_date.bind(this),
      whoami: this.cmd_whoami.bind(this),
      tree: this.cmd_tree.bind(this),
      cp: this.cmd_cp.bind(this),
      mv: this.cmd_mv.bind(this),
      neofetch: this.cmd_neofetch.bind(this),
      // Text processing commands
      grep: this.cmd_grep.bind(this),
      find: this.cmd_find.bind(this),
      wc: this.cmd_wc.bind(this),
      sort: this.cmd_sort.bind(this),
      uniq: this.cmd_uniq.bind(this),
      head: this.cmd_head.bind(this),
      tail: this.cmd_tail.bind(this),
      cut: this.cmd_cut.bind(this),
      // New shell scripting and job control commands
      script: this.cmd_script.bind(this),
      theme: this.cmd_theme.bind(this),
      jobs: this.cmd_jobs.bind(this),
      fg: this.cmd_fg.bind(this),
      bg: this.cmd_bg.bind(this),
      wait: this.cmd_wait.bind(this),
      kill: this.cmd_kill.bind(this),
      export: this.cmd_export.bind(this),
      env: this.cmd_env.bind(this),
      alias: this.cmd_alias.bind(this),
      history: this.cmd_history.bind(this),
      // Phase 2.1: Advanced file operations
      chmod: this.cmd_chmod.bind(this),
      chown: this.cmd_chown.bind(this),
      ln: this.cmd_ln.bind(this),
      readlink: this.cmd_readlink.bind(this),
      watch: this.cmd_watch.bind(this),
      lsattr: this.cmd_lsattr.bind(this),
      chattr: this.cmd_chattr.bind(this),
      stat: this.cmd_stat.bind(this),
      // Phase 2.2: Compression & Archives
      gzip: this.cmd_gzip.bind(this),
      gunzip: this.cmd_gunzip.bind(this),
      tar: this.cmd_tar.bind(this),
      // Phase 2.3: File Encryption & Security
      encrypt: this.cmd_encrypt.bind(this),
      decrypt: this.cmd_decrypt.bind(this),
      md5sum: this.cmd_md5sum.bind(this),
      sha256sum: this.cmd_sha256sum.bind(this),
      sha512sum: this.cmd_sha512sum.bind(this),
      shred: this.cmd_shred.bind(this),
      // Phase 3: Networking Stack
      ping: this.cmd_ping.bind(this),
      curl: this.cmd_curl.bind(this),
      wget: this.cmd_wget.bind(this),
      fetch: this.cmd_fetch.bind(this),
      netstat: this.cmd_netstat.bind(this),
      ifconfig: this.cmd_ifconfig.bind(this),
      route: this.cmd_route.bind(this),
      nslookup: this.cmd_nslookup.bind(this),
      dig: this.cmd_dig.bind(this),
      traceroute: this.cmd_traceroute.bind(this),
      iptables: this.cmd_iptables.bind(this)
    };

    if (builtins[command]) {
      try {
        return await builtins[command](args);
      } catch (error) {
        return `❌ Error: ${error.message}`;
      }
    }

    return `❌ Command not found: ${command}\n💡 Type 'help' for available commands`;
  }

  async _executePipelineOrRedirect(commandLine) {
    try {
      // Handle output redirection (> and >>)
      if (commandLine.includes('>')) {
        const append = commandLine.includes('>>');
        const parts = commandLine.split(append ? '>>' : '>').map(s => s.trim());
        if (parts.length !== 2) {
          return '❌ Syntax error: invalid redirection';
        }

        const [command, filename] = parts;
        const output = await this.executeCommand(command);

        if (output.startsWith('❌')) {
          return output;
        }

        try {
          const filePath = this._resolvePath(filename);
          if (append) {
            // Read existing content and append
            let existing = '';
            try {
              existing = await this.context.fs.readFile(filePath, { encoding: 'utf8' });
            } catch (e) {
              // File doesn't exist, that's ok
            }
            await this.context.fs.writeFile(filePath, existing + output + '\n');
          } else {
            await this.context.fs.writeFile(filePath, output + '\n');
          }
          return `✅ Output redirected to: ${filename}`;
        } catch (error) {
          return `❌ Redirection error: ${error.message}`;
        }
      }

      // Handle pipes
      if (commandLine.includes('|')) {
        const commands = commandLine.split('|').map(s => s.trim());
        let input = '';

        for (let i = 0; i < commands.length; i++) {
          const cmdParts = commands[i].trim().split(/\s+/);
          const cmd = cmdParts[0];
          const args = cmdParts.slice(1);

          // For first command, execute normally
          if (i === 0) {
            input = await this.executeCommand(commands[i]);
          } else {
            // Pass previous output as input to next command
            input = await this._executeWithInput(cmd, args, input);
          }

          if (input.startsWith('❌')) {
            return input; // Stop on error
          }
        }

        return input;
      }

      return '❌ Invalid pipeline syntax';
    } catch (error) {
      return `❌ Pipeline error: ${error.message}`;
    }
  }

  async _executeWithInput(command, args, input) {
    // Commands that can process piped input
    const pipeableCommands = {
      grep: () => this.cmd_grep(args, input),
      wc: () => this.cmd_wc(args, input),
      sort: () => this.cmd_sort(args, input),
      uniq: () => this.cmd_uniq(args, input),
      head: () => this.cmd_head(args, input),
      tail: () => this.cmd_tail(args, input),
      cut: () => this.cmd_cut(args, input)
    };

    if (pipeableCommands[command]) {
      return await pipeableCommands[command]();
    }

    return `❌ Command '${command}' cannot receive piped input`;
  }

  async cmd_ls(args) {
    const showHidden = args.includes('-a') || args.includes('--all');
    const longFormat = args.includes('-l');
    const path = args.find(arg => !arg.startsWith('-')) || this.currentDir;
    const fullPath = this._resolvePath(path);

    try {
      const entries = await this.context.fs.readdir(fullPath);

      if (longFormat) {
        let output = 'total ' + entries.length + '\n';
        for (const entry of entries) {
          const type = entry.type === 'directory' ? 'd' : '-';
          const size = (entry.size || 0).toString().padStart(8);
          const name = entry.type === 'directory' ? `📁 ${entry.name}` : `📄 ${entry.name}`;
          output += `${type}rw-rw-r-- ${size} ${name}\n`;
        }
        return output;
      } else {
        return entries.map(e => {
          const icon = e.type === 'directory' ? '📁' : '📄';
          return `${icon} ${e.name}`;
        }).join('\n');
      }
    } catch (error) {
      return `❌ ls: ${error.message}`;
    }
  }

  async cmd_tree(args) {
    const path = args[0] || this.currentDir;
    const fullPath = this._resolvePath(path);

    const buildTree = async (dirPath, prefix = '', isLast = true) => {
      let output = '';
      try {
        const entries = await this.context.fs.readdir(dirPath);

        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          const isLastEntry = i === entries.length - 1;
          const connector = isLastEntry ? '└── ' : '├── ';
          const icon = entry.type === 'directory' ? '📁' : '📄';

          output += prefix + connector + icon + ' ' + entry.name + '\n';

          if (entry.type === 'directory') {
            const newPrefix = prefix + (isLastEntry ? '    ' : '│   ');
            const subPath = `${dirPath}/${entry.name}`;
            output += await buildTree(subPath, newPrefix, isLastEntry);
          }
        }
      } catch (error) {
        // Silently ignore errors in subdirectories
      }
      return output;
    };

    try {
      let output = `📁 ${fullPath}\n`;
      output += await buildTree(fullPath);
      return output;
    } catch (error) {
      return `❌ tree: ${error.message}`;
    }
  }

  async cmd_cp(args) {
    if (args.length < 2) {
      return '❌ cp: missing operands\n💡 Usage: cp <source> <destination>';
    }

    const srcPath = this._resolvePath(args[0]);
    const destPath = this._resolvePath(args[1]);

    try {
      await this.context.fs.copy(srcPath, destPath);
      return `✅ Copied: ${args[0]} → ${args[1]}`;
    } catch (error) {
      return `❌ cp: ${error.message}`;
    }
  }

  async cmd_mv(args) {
    if (args.length < 2) {
      return '❌ mv: missing operands\n💡 Usage: mv <source> <destination>';
    }

    const srcPath = this._resolvePath(args[0]);
    const destPath = this._resolvePath(args[1]);

    try {
      await this.context.fs.rename(srcPath, destPath);
      return `✅ Moved: ${args[0]} → ${args[1]}`;
    } catch (error) {
      return `❌ mv: ${error.message}`;
    }
  }

  async cmd_neofetch() {
    const sysInfo = this.context.process.constructor.constructor.prototype;
    return `
    ╔════════════════════════╗
    ║      WebOS v1.0.0      ║
    ╚════════════════════════╝

    🖥️  OS: WebOS
    💻 Kernel: JavaScript
    🌐 Platform: ${navigator.platform}
    🧠 Memory: ${navigator.deviceMemory || 'Unknown'} GB
    ⚡ Cores: ${navigator.hardwareConcurrency || 'Unknown'}
    🌍 Language: ${navigator.language}
    🎨 Theme: Matrix Green
    `;
  }

  async cmd_cd(args) {
    if (args.length === 0) {
      this.currentDir = this.env.HOME;
      return '';
    }

    const newPath = this._resolvePath(args[0]);

    try {
      const stat = await this.context.fs.stat(newPath);
      if (stat.type === 'directory') {
        this.currentDir = newPath;
        return `✅ Changed directory to: ${newPath}`;
      } else {
        return `❌ cd: not a directory: ${args[0]}`;
      }
    } catch (error) {
      return `❌ cd: ${error.message}`;
    }
  }

  cmd_pwd() {
    return `📍 ${this.currentDir}`;
  }

  async cmd_cat(args) {
    if (args.length === 0) {
      return '❌ cat: missing file operand\n💡 Usage: cat <filename>';
    }

    const path = this._resolvePath(args[0]);

    try {
      const content = await this.context.fs.readFile(path, { encoding: 'utf8' });
      return content;
    } catch (error) {
      return `❌ cat: ${error.message}`;
    }
  }

  cmd_echo(args) {
    return args.join(' ');
  }

  async cmd_mkdir(args) {
    if (args.length === 0) {
      return '❌ mkdir: missing operand\n💡 Usage: mkdir <directory>';
    }

    const path = this._resolvePath(args[0]);

    try {
      await this.context.fs.mkdir(path, { recursive: true });
      return `✅ Created directory: ${args[0]}`;
    } catch (error) {
      return `❌ mkdir: ${error.message}`;
    }
  }

  async cmd_rm(args) {
    if (args.length === 0) {
      return '❌ rm: missing operand\n💡 Usage: rm [-r] <path>';
    }

    const recursive = args[0] === '-r' || args[0] === '-rf';
    const path = this._resolvePath(args[recursive ? 1 : 0]);

    try {
      await this.context.fs.rm(path, { recursive });
      return `✅ Removed: ${args[recursive ? 1 : 0]}`;
    } catch (error) {
      return `❌ rm: ${error.message}`;
    }
  }

  async cmd_touch(args) {
    if (args.length === 0) {
      return '❌ touch: missing file operand\n💡 Usage: touch <filename>';
    }

    const path = this._resolvePath(args[0]);

    try {
      await this.context.fs.writeFile(path, '', { encoding: 'utf8' });
      return `✅ Created file: ${args[0]}`;
    } catch (error) {
      return `❌ touch: ${error.message}`;
    }
  }

  cmd_ps() {
    const processes = this.context.process.constructor.listProcesses();
    let output = '┌─────────────────────────────────────┬──────────────┬──────────┐\n';
    output += '│ PID                                 │ NAME         │ STATE    │\n';
    output += '├─────────────────────────────────────┼──────────────┼──────────┤\n';

    processes.forEach(proc => {
      const pid = proc.pid.substring(0, 35).padEnd(35);
      const name = proc.name.substring(0, 12).padEnd(12);
      const state = proc.state.padEnd(8);
      output += `│ ${pid} │ ${name} │ ${state} │\n`;
    });

    output += '└─────────────────────────────────────┴──────────────┴──────────┘';
    return output;
  }

  cmd_uname(args) {
    if (args.includes('-a')) {
      return '🖥️  WebOS 1.0.0 JavaScript Browser #1 SMP ' + new Date().toDateString();
    }
    return 'WebOS';
  }

  cmd_date() {
    return `📅 ${new Date().toString()}`;
  }

  cmd_whoami() {
    return `👤 ${this.env.USER}`;
  }

  cmd_help() {
    return `
╔════════════════════════════════════════════════════════╗
║              WEBOS TERMINAL - HELP GUIDE               ║
╠════════════════════════════════════════════════════════╣
║  📁 File System:                                       ║
║    ls [-l] [dir]    List directory contents            ║
║    cd [dir]         Change directory                   ║
║    pwd              Print working directory            ║
║    cat <file>       Display file contents              ║
║    mkdir <dir>      Create directory                   ║
║    rm [-r] <path>   Remove file/directory              ║
║    touch <file>     Create empty file                  ║
║    tree [dir]       Display directory tree             ║
║    cp <src> <dst>   Copy file                          ║
║    mv <src> <dst>   Move/rename file                   ║
║    find [path] [-name pattern]  Find files             ║
║                                                         ║
║  🔐 File Attributes:                                    ║
║    chmod <mode> <file>  Change permissions             ║
║    chown <owner> <file> Change ownership               ║
║    stat <file>          Display file statistics        ║
║    ln -s <target> <link> Create symbolic link          ║
║    readlink <link>      Read symbolic link target      ║
║    lsattr [file]        List extended attributes       ║
║    chattr +/-attr <file> Change extended attributes    ║
║    watch <path>         Watch for file changes         ║
║                                                         ║
║  📦 Compression & Archives:                             ║
║    gzip <file>          Compress file with gzip        ║
║    gunzip <file.gz>     Decompress gzip file           ║
║    tar -czf <archive> <files>  Create tar.gz archive   ║
║    tar -xzf <archive>   Extract tar.gz archive         ║
║    tar -xzf <archive> -C <dir>  Extract to directory   ║
║                                                         ║
║  🔐 Encryption & Security:                              ║
║    encrypt <file> <password>  Encrypt file (AES-256)   ║
║    decrypt <file> <password>  Decrypt encrypted file   ║
║    md5sum <file>        Calculate MD5 hash             ║
║    sha256sum <file>     Calculate SHA-256 hash         ║
║    sha512sum <file>     Calculate SHA-512 hash         ║
║    shred [-n N] <file>  Securely delete file           ║
║                                                         ║
║  🌐 Networking:                                         ║
║    ping <host> [-c N]   Test connectivity              ║
║    curl <url> [-o file] Fetch URL content              ║
║    wget <url> [-O file] Download file                  ║
║    fetch <url>          HTTP request                   ║
║    netstat [-a]         Network statistics             ║
║    ifconfig             Network interfaces             ║
║    route                Routing table                  ║
║    nslookup <domain>    DNS lookup                     ║
║    dig <domain> [type]  DNS query (A, MX, NS, etc.)    ║
║    traceroute <host>    Trace route to host            ║
║    iptables [-L|-A|-F]  Manage firewall rules          ║
║                                                         ║
║  💻 System:                                             ║
║    ps               List running processes             ║
║    uname [-a]       Print system information           ║
║    date             Display current date/time          ║
║    whoami           Display current user               ║
║    neofetch         Display system info (fancy!)       ║
║    env              Show environment variables         ║
║    export VAR=val   Set environment variable           ║
║    clear            Clear terminal                     ║
║                                                         ║
║  🔧 Text Processing:                                    ║
║    grep [-i] [-n] <pattern> [file]  Search text        ║
║    wc [-l|-w|-c] [file]    Count lines/words/bytes     ║
║    sort [-r] [file]        Sort lines alphabetically   ║
║    uniq [-c] [file]        Remove duplicate lines      ║
║    head [-n N] [file]      Show first N lines          ║
║    tail [-n N] [file]      Show last N lines           ║
║    cut -f N [-d delim] [file]  Extract fields          ║
║                                                         ║
║  🔄 Job Control:                                        ║
║    command &        Run command in background          ║
║    jobs             List background jobs               ║
║    fg <id>          Bring job to foreground            ║
║    bg <id>          Resume job in background           ║
║    wait <id>        Wait for job to complete           ║
║    kill <id>        Kill a job                         ║
║                                                         ║
║  📜 Scripting:                                          ║
║    script <file>    Execute shell script               ║
║    alias [name=cmd] Create command alias               ║
║    history          Show command history               ║
║                                                         ║
║  🎨 Customization:                                      ║
║    theme [name]     Change terminal theme              ║
║                                                         ║
║  ℹ️  Utilities:                                         ║
║    echo <text>      Display text                       ║
║    help             Show this help message             ║
╚════════════════════════════════════════════════════════╝

⌨️  Keyboard Shortcuts:
  • ↑/↓          Navigate command history
  • Tab           Autocomplete commands
  • Ctrl+C        Interrupt foreground job
  • Ctrl+Z        Suspend foreground job
  • Ctrl+D        Exit/Logout
  • Ctrl+R        Fuzzy search history
  • Ctrl+L        Clear screen

💡 Advanced Features:
  • Pipes: command1 | command2 | command3
  • Redirection: command > file.txt or command >> file.txt
  • Background: long_command &
  • Scripts: Support for variables, loops, conditionals, functions
  • Themes: matrix, dracula, solarized, nord, monokai, one-dark, etc.
  • Permissions: Unix-style chmod/chown
  • Symbolic Links: ln -s for creating links
  • File Watching: Monitor files/directories for changes
  • Compression: gzip/gunzip for file compression
  • Archives: tar for creating and extracting archives
  • Encryption: AES-256-GCM encryption for sensitive files
  • Hashing: MD5, SHA-256, SHA-512 checksums
  • Secure Deletion: Multi-pass file shredding
  • Networking: HTTP requests, ping, DNS lookup, traceroute
  • Firewall: Rule-based network filtering and security
  • Downloads: wget/curl for fetching remote files

📝 Script Example:
  name="WebOS"
  echo "Hello, $name!"
  for file in *.txt; do
    cat "$file"
  done
`;
  }

  cmd_clear() {
    return '\x1bc';
  }

  _resolvePath(path) {
    if (path.startsWith('/')) {
      return path;
    }

    const parts = this.currentDir.split('/').filter(Boolean);
    const newParts = path.split('/');

    for (const part of newParts) {
      if (part === '..') {
        parts.pop();
      } else if (part !== '.' && part !== '') {
        parts.push(part);
      }
    }

    return '/' + parts.join('/');
  }

  // Advanced Commands

  async cmd_grep(args, pipedInput = null) {
    // grep pattern [file]
    let pattern, content, caseInsensitive = false, lineNumbers = false;

    // Parse flags
    const flags = args.filter(arg => arg.startsWith('-'));
    const nonFlags = args.filter(arg => !arg.startsWith('-'));

    caseInsensitive = flags.includes('-i');
    lineNumbers = flags.includes('-n');

    if (nonFlags.length === 0) {
      return '❌ grep: missing pattern\n💡 Usage: grep [-i] [-n] <pattern> [file]';
    }

    pattern = nonFlags[0];

    // Get content from pipe or file
    if (pipedInput !== null) {
      content = pipedInput;
    } else if (nonFlags.length >= 2) {
      const filePath = this._resolvePath(nonFlags[1]);
      try {
        content = await this.context.fs.readFile(filePath, { encoding: 'utf8' });
      } catch (error) {
        return `❌ grep: ${error.message}`;
      }
    } else {
      return '❌ grep: no input provided\n💡 Usage: grep <pattern> <file> or command | grep <pattern>';
    }

    try {
      const regex = new RegExp(pattern, caseInsensitive ? 'gi' : 'g');
      const lines = content.split('\n');
      const matches = [];

      lines.forEach((line, index) => {
        if (regex.test(line)) {
          const lineNum = lineNumbers ? `${index + 1}:` : '';
          matches.push(lineNum + line);
        }
        regex.lastIndex = 0; // Reset regex
      });

      if (matches.length === 0) {
        return `❌ grep: no matches found for pattern '${pattern}'`;
      }

      return matches.join('\n');
    } catch (error) {
      return `❌ grep: invalid pattern: ${error.message}`;
    }
  }

  async cmd_find(args) {
    // find [path] [-name pattern]
    let searchPath = this.currentDir;
    let namePattern = null;

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-name' && i + 1 < args.length) {
        namePattern = args[i + 1];
        i++;
      } else if (!args[i].startsWith('-')) {
        searchPath = this._resolvePath(args[i]);
      }
    }

    if (!namePattern) {
      namePattern = '*'; // Find all
    }

    const results = [];

    const searchRecursive = async (dirPath, depth = 0) => {
      if (depth > 10) return; // Prevent infinite recursion

      try {
        const entries = await this.context.fs.readdir(dirPath);

        for (const entry of entries) {
          const fullPath = `${dirPath}/${entry.name}`;
          const matches = namePattern === '*' || entry.name.includes(namePattern.replace('*', ''));

          if (matches) {
            const icon = entry.type === 'directory' ? '📁' : '📄';
            results.push(`${icon} ${fullPath}`);
          }

          if (entry.type === 'directory') {
            await searchRecursive(fullPath, depth + 1);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    try {
      await searchRecursive(searchPath);

      if (results.length === 0) {
        return `❌ find: no files matching '${namePattern}' found in ${searchPath}`;
      }

      return results.join('\n');
    } catch (error) {
      return `❌ find: ${error.message}`;
    }
  }

  async cmd_wc(args, pipedInput = null) {
    // wc [file] - word count
    let content;
    let showLines = true, showWords = true, showBytes = true;

    // Parse flags
    const flags = args.filter(arg => arg.startsWith('-'));
    const nonFlags = args.filter(arg => !arg.startsWith('-'));

    if (flags.includes('-l')) {
      showLines = true;
      showWords = false;
      showBytes = false;
    }
    if (flags.includes('-w')) {
      showWords = true;
      if (!flags.includes('-l')) showLines = false;
      showBytes = false;
    }
    if (flags.includes('-c')) {
      showBytes = true;
      if (!flags.includes('-l')) showLines = false;
      if (!flags.includes('-w')) showWords = false;
    }

    // Get content
    if (pipedInput !== null) {
      content = pipedInput;
    } else if (nonFlags.length > 0) {
      const filePath = this._resolvePath(nonFlags[0]);
      try {
        content = await this.context.fs.readFile(filePath, { encoding: 'utf8' });
      } catch (error) {
        return `❌ wc: ${error.message}`;
      }
    } else {
      return '❌ wc: no input provided\n💡 Usage: wc [-l|-w|-c] <file> or command | wc';
    }

    const lines = content.split('\n').length;
    const words = content.split(/\s+/).filter(w => w.length > 0).length;
    const bytes = new TextEncoder().encode(content).length;

    let result = '';
    if (showLines) result += `Lines: ${lines} `;
    if (showWords) result += `Words: ${words} `;
    if (showBytes) result += `Bytes: ${bytes}`;

    return result.trim();
  }

  async cmd_sort(args, pipedInput = null) {
    // sort [file]
    let content;
    let reverse = args.includes('-r');
    const nonFlags = args.filter(arg => !arg.startsWith('-'));

    if (pipedInput !== null) {
      content = pipedInput;
    } else if (nonFlags.length > 0) {
      const filePath = this._resolvePath(nonFlags[0]);
      try {
        content = await this.context.fs.readFile(filePath, { encoding: 'utf8' });
      } catch (error) {
        return `❌ sort: ${error.message}`;
      }
    } else {
      return '❌ sort: no input provided\n💡 Usage: sort [-r] <file> or command | sort';
    }

    const lines = content.split('\n').filter(line => line.trim().length > 0);
    lines.sort();

    if (reverse) {
      lines.reverse();
    }

    return lines.join('\n');
  }

  async cmd_uniq(args, pipedInput = null) {
    // uniq [file] - remove duplicate lines
    let content;
    let count = args.includes('-c');
    const nonFlags = args.filter(arg => !arg.startsWith('-'));

    if (pipedInput !== null) {
      content = pipedInput;
    } else if (nonFlags.length > 0) {
      const filePath = this._resolvePath(nonFlags[0]);
      try {
        content = await this.context.fs.readFile(filePath, { encoding: 'utf8' });
      } catch (error) {
        return `❌ uniq: ${error.message}`;
      }
    } else {
      return '❌ uniq: no input provided\n💡 Usage: uniq [-c] <file> or command | uniq';
    }

    const lines = content.split('\n');
    const result = [];
    let lastLine = null;
    let lineCount = 0;

    for (const line of lines) {
      if (line === lastLine) {
        lineCount++;
      } else {
        if (lastLine !== null) {
          if (count) {
            result.push(`${lineCount} ${lastLine}`);
          } else {
            result.push(lastLine);
          }
        }
        lastLine = line;
        lineCount = 1;
      }
    }

    // Don't forget the last line
    if (lastLine !== null) {
      if (count) {
        result.push(`${lineCount} ${lastLine}`);
      } else {
        result.push(lastLine);
      }
    }

    return result.join('\n');
  }

  async cmd_head(args, pipedInput = null) {
    // head [-n N] [file] - show first N lines (default 10)
    let content;
    let numLines = 10;

    // Parse -n flag
    const nIndex = args.indexOf('-n');
    if (nIndex !== -1 && nIndex + 1 < args.length) {
      numLines = parseInt(args[nIndex + 1]) || 10;
    }

    const nonFlags = args.filter((arg, i) => !arg.startsWith('-') && args[i - 1] !== '-n');

    if (pipedInput !== null) {
      content = pipedInput;
    } else if (nonFlags.length > 0) {
      const filePath = this._resolvePath(nonFlags[0]);
      try {
        content = await this.context.fs.readFile(filePath, { encoding: 'utf8' });
      } catch (error) {
        return `❌ head: ${error.message}`;
      }
    } else {
      return '❌ head: no input provided\n💡 Usage: head [-n N] <file> or command | head';
    }

    const lines = content.split('\n');
    return lines.slice(0, numLines).join('\n');
  }

  async cmd_tail(args, pipedInput = null) {
    // tail [-n N] [file] - show last N lines (default 10)
    let content;
    let numLines = 10;

    // Parse -n flag
    const nIndex = args.indexOf('-n');
    if (nIndex !== -1 && nIndex + 1 < args.length) {
      numLines = parseInt(args[nIndex + 1]) || 10;
    }

    const nonFlags = args.filter((arg, i) => !arg.startsWith('-') && args[i - 1] !== '-n');

    if (pipedInput !== null) {
      content = pipedInput;
    } else if (nonFlags.length > 0) {
      const filePath = this._resolvePath(nonFlags[0]);
      try {
        content = await this.context.fs.readFile(filePath, { encoding: 'utf8' });
      } catch (error) {
        return `❌ tail: ${error.message}`;
      }
    } else {
      return '❌ tail: no input provided\n💡 Usage: tail [-n N] <file> or command | tail';
    }

    const lines = content.split('\n');
    return lines.slice(-numLines).join('\n');
  }

  async cmd_cut(args, pipedInput = null) {
    // cut -f N [-d delim] [file] - extract fields
    let content;
    let field = 1;
    let delimiter = '\t';

    // Parse flags
    const fIndex = args.indexOf('-f');
    if (fIndex !== -1 && fIndex + 1 < args.length) {
      field = parseInt(args[fIndex + 1]) || 1;
    }

    const dIndex = args.indexOf('-d');
    if (dIndex !== -1 && dIndex + 1 < args.length) {
      delimiter = args[dIndex + 1];
    }

    const nonFlags = args.filter((arg, i) =>
      !arg.startsWith('-') &&
      args[i - 1] !== '-f' &&
      args[i - 1] !== '-d'
    );

    if (pipedInput !== null) {
      content = pipedInput;
    } else if (nonFlags.length > 0) {
      const filePath = this._resolvePath(nonFlags[0]);
      try {
        content = await this.context.fs.readFile(filePath, { encoding: 'utf8' });
      } catch (error) {
        return `❌ cut: ${error.message}`;
      }
    } else {
      return '❌ cut: no input provided\n💡 Usage: cut -f N [-d delim] <file> or command | cut -f N';
    }

    const lines = content.split('\n');
    const result = [];

    for (const line of lines) {
      const fields = line.split(delimiter);
      if (field <= fields.length) {
        result.push(fields[field - 1]);
      }
    }

    return result.join('\n');
  }

  // ========== NEW COMMANDS ==========

  /**
   * Execute a shell script
   */
  async cmd_script(args) {
    if (args.length === 0) {
      return '❌ script: missing script file\n💡 Usage: script <file.sh>';
    }

    const filePath = this._resolvePath(args[0]);

    try {
      const scriptContent = await this.context.fs.readFile(filePath, { encoding: 'utf8' });

      // Parse the script
      const ast = this.scriptParser.parse(scriptContent);

      // Execute the script
      const executor = new ScriptExecutor(this);
      executor.setEnvironment(this.env);

      const result = await executor.execute(ast);

      // Update environment variables
      this.env = { ...this.env, ...executor.getEnvironment() };

      return result || '✅ Script executed successfully';
    } catch (error) {
      return `❌ script: ${error.message}`;
    }
  }

  /**
   * Change terminal theme
   */
  async cmd_theme(args) {
    if (args.length === 0) {
      // List available themes
      const themes = getAvailableThemes();
      const current = getCurrentTheme();
      let output = '🎨 Available Themes:\n\n';
      themes.forEach(theme => {
        const marker = theme === current ? '✓' : ' ';
        const themeName = terminalThemes[theme].name;
        output += `  [${marker}] ${theme.padEnd(15)} - ${themeName}\n`;
      });
      output += '\n💡 Usage: theme <name>';
      return output;
    }

    const themeName = args[0];
    const themes = getAvailableThemes();

    if (!themes.includes(themeName)) {
      return `❌ Theme not found: ${themeName}\n💡 Available: ${themes.join(', ')}`;
    }

    // Apply theme
    const container = document.querySelector('.terminal-container');
    if (container) {
      applyTheme(themeName, container);
      this.currentTheme = themeName;
      return `✅ Theme changed to: ${themeName}`;
    }

    return '❌ Could not apply theme';
  }

  /**
   * List background jobs
   */
  async cmd_jobs(args) {
    return this.jobManager.listJobs();
  }

  /**
   * Bring job to foreground
   */
  async cmd_fg(args) {
    if (args.length === 0) {
      return '❌ fg: missing job ID\n💡 Usage: fg <job_id>';
    }

    const jobId = parseInt(args[0]);
    return await this.jobManager.foreground(jobId);
  }

  /**
   * Resume job in background
   */
  async cmd_bg(args) {
    if (args.length === 0) {
      return '❌ bg: missing job ID\n💡 Usage: bg <job_id>';
    }

    const jobId = parseInt(args[0]);
    return this.jobManager.background(jobId);
  }

  /**
   * Wait for job to complete
   */
  async cmd_wait(args) {
    if (args.length === 0) {
      return '❌ wait: missing job ID\n💡 Usage: wait <job_id>';
    }

    const jobId = parseInt(args[0]);
    return await this.jobManager.wait(jobId);
  }

  /**
   * Kill a job
   */
  async cmd_kill(args) {
    if (args.length === 0) {
      return '❌ kill: missing job ID\n💡 Usage: kill <job_id>';
    }

    const jobId = parseInt(args[0]);
    return this.jobManager.kill(jobId);
  }

  /**
   * Export environment variable
   */
  async cmd_export(args) {
    if (args.length === 0) {
      return '❌ export: missing variable assignment\n💡 Usage: export VAR=value';
    }

    const assignment = args.join(' ');
    const match = assignment.match(/^(\w+)=(.+)$/);

    if (!match) {
      return '❌ export: invalid syntax\n💡 Usage: export VAR=value';
    }

    this.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    return `✅ Exported: ${match[1]}=${this.env[match[1]]}`;
  }

  /**
   * Show environment variables
   */
  async cmd_env(args) {
    let output = '🌍 Environment Variables:\n\n';
    for (const [key, value] of Object.entries(this.env)) {
      output += `${key}=${value}\n`;
    }
    return output;
  }

  /**
   * Create command alias
   */
  async cmd_alias(args) {
    if (!this.aliases) {
      this.aliases = {};
    }

    if (args.length === 0) {
      // List all aliases
      if (Object.keys(this.aliases).length === 0) {
        return '💡 No aliases defined';
      }
      let output = '📝 Aliases:\n\n';
      for (const [name, command] of Object.entries(this.aliases)) {
        output += `${name}='${command}'\n`;
      }
      return output;
    }

    const assignment = args.join(' ');
    const match = assignment.match(/^(\w+)=(.+)$/);

    if (!match) {
      return '❌ alias: invalid syntax\n💡 Usage: alias name=\'command\'';
    }

    this.aliases[match[1]] = match[2].replace(/^["']|["']$/g, '');
    return `✅ Alias created: ${match[1]}='${this.aliases[match[1]]}'`;
  }

  /**
   * Show command history
   */
  async cmd_history(args) {
    if (this.history.length === 0) {
      return '📜 No command history';
    }

    let output = '📜 Command History:\n\n';
    this.history.forEach((cmd, index) => {
      output += `${String(index + 1).padStart(4)}  ${cmd}\n`;
    });

    return output;
  }

  // ========== HELPER METHODS FOR NEW FEATURES ==========

  /**
   * Show auto-suggest based on history
   */
  _showAutoSuggest(input, output) {
    const value = input.value;
    if (!value) {
      this._hideAutoSuggest();
      return;
    }

    // Find matching commands from history
    const matches = this.history.filter(cmd =>
      cmd.startsWith(value) && cmd !== value
    );

    if (matches.length > 0) {
      const suggestion = matches[matches.length - 1]; // Most recent match
      const suggestionText = suggestion.slice(value.length);

      // Create or update suggestion element
      let suggestEl = input.parentElement.querySelector('.auto-suggest');
      if (!suggestEl) {
        suggestEl = document.createElement('span');
        suggestEl.className = 'auto-suggest';
        suggestEl.style.cssText = `
          position: absolute;
          left: ${input.offsetLeft + this._getTextWidth(value, input)}px;
          top: ${input.offsetTop}px;
          color: rgba(0, 255, 65, 0.4);
          pointer-events: none;
          font-family: inherit;
          font-size: inherit;
        `;
        input.parentElement.appendChild(suggestEl);
      }

      suggestEl.textContent = suggestionText;
      suggestEl.style.left = `${input.offsetLeft + this._getTextWidth(value, input)}px`;

      // Accept suggestion with Tab or Right Arrow
      input.dataset.suggestion = suggestion;
    } else {
      this._hideAutoSuggest();
    }
  }

  /**
   * Hide auto-suggest
   */
  _hideAutoSuggest() {
    const suggestEl = document.querySelector('.auto-suggest');
    if (suggestEl) {
      suggestEl.remove();
    }
  }

  /**
   * Get text width for positioning
   */
  _getTextWidth(text, element) {
    const canvas = this._getTextWidth.canvas || (this._getTextWidth.canvas = document.createElement('canvas'));
    const context = canvas.getContext('2d');
    const style = window.getComputedStyle(element);
    context.font = style.font;
    return context.measureText(text).width;
  }

  /**
   * Start fuzzy search mode
   */
  _startFuzzySearch(input, output) {
    if (this.history.length === 0) {
      this._addOutput(output, '📜 No command history', '#f1fa8c');
      return;
    }

    this.searchMode = true;
    this.searchResults = [...this.history].reverse();
    this.searchIndex = 0;

    this._addOutput(output, '\n🔍 Fuzzy Search (Ctrl+R again for next, Esc to cancel):', '#f1fa8c');

    // Replace input handler temporarily
    const originalValue = input.value;

    const searchHandler = (e) => {
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        // Next result
        this.searchIndex = (this.searchIndex + 1) % this.searchResults.length;
        input.value = this.searchResults[this.searchIndex];
      } else if (e.key === 'Escape') {
        e.preventDefault();
        // Cancel search
        this.searchMode = false;
        input.value = originalValue;
        input.removeEventListener('keydown', searchHandler);
        this._addOutput(output, '❌ Search cancelled', '#f1fa8c');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        // Accept result
        this.searchMode = false;
        input.removeEventListener('keydown', searchHandler);
        // Trigger normal enter handling
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        input.dispatchEvent(enterEvent);
      }
    };

    input.addEventListener('keydown', searchHandler);

    // Show first result
    if (this.searchResults.length > 0) {
      input.value = this.searchResults[0];
    }
  }

  // ========== PHASE 2.1: ADVANCED FILE OPERATIONS ==========

  /**
   * Change file permissions (chmod)
   */
  async cmd_chmod(args) {
    if (args.length < 2) {
      return '❌ chmod: missing operands\n💡 Usage: chmod <mode> <file>\n   Examples: chmod 755 file.sh\n             chmod +x script.sh\n             chmod u+rw file.txt';
    }

    const mode = args[0];
    const path = this._resolvePath(args[1]);

    try {
      // Check if file exists
      await this.context.fs.stat(path);

      // Change permissions
      this.fileAttributes.chmod(path, mode);

      const perms = this.fileAttributes.getPermissionString(path);
      return `✅ Changed permissions of '${args[1]}': ${perms}`;
    } catch (error) {
      return `❌ chmod: ${error.message}`;
    }
  }

  /**
   * Change file owner (chown)
   */
  async cmd_chown(args) {
    if (args.length < 2) {
      return '❌ chown: missing operands\n💡 Usage: chown <owner[:group]> <file>\n   Examples: chown user file.txt\n             chown user:admin file.txt';
    }

    const ownerSpec = args[0];
    const path = this._resolvePath(args[1]);

    try {
      // Check if file exists
      await this.context.fs.stat(path);

      // Parse owner:group
      const [owner, group] = ownerSpec.split(':');

      // Change ownership
      this.fileAttributes.chown(path, owner, group);

      return `✅ Changed ownership of '${args[1]}' to ${owner}${group ? ':' + group : ''}`;
    } catch (error) {
      return `❌ chown: ${error.message}`;
    }
  }

  /**
   * Create symbolic link (ln)
   */
  async cmd_ln(args) {
    const isSymbolic = args.includes('-s');
    const fileArgs = args.filter(arg => arg !== '-s');

    if (fileArgs.length < 2) {
      return '❌ ln: missing operands\n💡 Usage: ln -s <target> <link_name>\n   Example: ln -s /home/user/file.txt mylink';
    }

    const target = this._resolvePath(fileArgs[0]);
    const linkName = this._resolvePath(fileArgs[1]);

    if (!isSymbolic) {
      return '❌ ln: hard links not supported yet\n💡 Use: ln -s <target> <link_name> for symbolic links';
    }

    try {
      // Check if target exists
      try {
        await this.context.fs.stat(target);
      } catch (e) {
        return `❌ ln: target '${fileArgs[0]}' does not exist`;
      }

      // Create empty file for the link
      await this.context.fs.writeFile(linkName, '', { encoding: 'utf8' });

      // Create symbolic link metadata
      this.fileAttributes.createSymlink(linkName, target);

      return `✅ Created symbolic link: ${fileArgs[1]} → ${fileArgs[0]}`;
    } catch (error) {
      return `❌ ln: ${error.message}`;
    }
  }

  /**
   * Read symbolic link target (readlink)
   */
  async cmd_readlink(args) {
    if (args.length === 0) {
      return '❌ readlink: missing operand\n💡 Usage: readlink <link>\n   Example: readlink mylink';
    }

    const path = this._resolvePath(args[0]);

    try {
      if (!this.fileAttributes.isSymlink(path)) {
        return `❌ readlink: '${args[0]}' is not a symbolic link`;
      }

      const target = this.fileAttributes.readSymlink(path);
      return `📎 ${target}`;
    } catch (error) {
      return `❌ readlink: ${error.message}`;
    }
  }

  /**
   * Watch files/directories for changes
   */
  async cmd_watch(args) {
    if (args.length === 0) {
      // List active watchers
      const watchers = this.fileWatcher.getActiveWatchers();
      if (watchers.length === 0) {
        return '👁️  No active watchers\n💡 Usage: watch <path>\n   Example: watch /home/user';
      }

      let output = '👁️  Active Watchers:\n\n';
      watchers.forEach(w => {
        output += `[${w.id}] ${w.path} (${w.recursive ? 'recursive' : 'non-recursive'})\n`;
      });
      output += '\n💡 Use Ctrl+C to stop watching';
      return output;
    }

    const path = this._resolvePath(args[0]);
    const recursive = args.includes('-r') || args.includes('--recursive');

    try {
      // Check if path exists
      await this.context.fs.stat(path);

      // Start watching
      const watchId = this.fileWatcher.watch(path, {
        recursive,
        callback: (change) => {
          console.log(`📢 File ${change.type}: ${change.path}`);
        }
      });

      this.activeWatchers.set(watchId, path);

      return `✅ Watching ${args[0]} (ID: ${watchId})\n💡 Changes will be logged to console`;
    } catch (error) {
      return `❌ watch: ${error.message}`;
    }
  }

  /**
   * List extended attributes (lsattr)
   */
  async cmd_lsattr(args) {
    const path = args.length > 0 ? this._resolvePath(args[0]) : this.currentDir;

    try {
      const stat = await this.context.fs.stat(path);

      if (stat.type === 'directory') {
        // List attributes for all files in directory
        const entries = await this.context.fs.readdir(path);
        let output = '';

        for (const entry of entries) {
          const fullPath = `${path}/${entry.name}`;
          const attrs = this.fileAttributes.getAttributes(fullPath);
          const extendedAttrs = Object.keys(attrs.extended);
          const flags = extendedAttrs.length > 0 ? extendedAttrs.join(',') : '-';
          output += `${flags.padEnd(15)} ${entry.name}\n`;
        }

        return output || '(no files)';
      } else {
        // List attributes for single file
        const attrs = this.fileAttributes.getAttributes(path);
        const extendedAttrs = Object.keys(attrs.extended);

        if (extendedAttrs.length === 0) {
          return `📄 ${args[0]}: no extended attributes`;
        }

        let output = `📄 ${args[0]}:\n\n`;
        for (const name of extendedAttrs) {
          const value = attrs.extended[name];
          output += `  ${name} = ${value}\n`;
        }

        return output;
      }
    } catch (error) {
      return `❌ lsattr: ${error.message}`;
    }
  }

  /**
   * Change extended attributes (chattr)
   */
  async cmd_chattr(args) {
    if (args.length < 2) {
      return '❌ chattr: missing operands\n💡 Usage: chattr <+/-attr> <file>\n   Example: chattr +immutable file.txt\n             chattr -immutable file.txt';
    }

    const attrSpec = args[0];
    const path = this._resolvePath(args[1]);

    try {
      // Check if file exists
      await this.context.fs.stat(path);

      // Parse attribute specification
      const match = attrSpec.match(/^([+-])(\w+)$/);
      if (!match) {
        return '❌ chattr: invalid attribute specification\n💡 Use +attr or -attr';
      }

      const [, op, attr] = match;

      if (op === '+') {
        this.fileAttributes.setExtendedAttr(path, attr, true);
        return `✅ Set attribute '${attr}' on ${args[1]}`;
      } else {
        this.fileAttributes.removeExtendedAttr(path, attr);
        return `✅ Removed attribute '${attr}' from ${args[1]}`;
      }
    } catch (error) {
      return `❌ chattr: ${error.message}`;
    }
  }

  /**
   * Display detailed file statistics (stat)
   */
  async cmd_stat(args) {
    if (args.length === 0) {
      return '❌ stat: missing operand\n💡 Usage: stat <file>\n   Example: stat file.txt';
    }

    const path = this._resolvePath(args[0]);

    try {
      const stat = await this.context.fs.stat(path);
      const attrs = this.fileAttributes.getAttributes(path);
      const perms = this.fileAttributes.getPermissionString(path);

      let output = `📊 File: ${args[0]}\n`;
      output += `${'='.repeat(50)}\n\n`;
      output += `  Type:        ${attrs.type}\n`;
      output += `  Size:        ${stat.size || attrs.size || 0} bytes\n`;
      output += `  Permissions: ${perms} (${attrs.permissions.toString(8)})\n`;
      output += `  Owner:       ${attrs.owner}:${attrs.group}\n`;
      output += `  Inode:       ${attrs.inode}\n`;
      output += `  Links:       ${attrs.links}\n`;

      if (attrs.symlink) {
        output += `  Symlink to:  ${attrs.symlink}\n`;
      }

      const created = new Date(attrs.created).toLocaleString();
      const modified = new Date(attrs.modified || stat.modified || attrs.created).toLocaleString();
      const accessed = new Date(attrs.accessed).toLocaleString();

      output += `\n  Created:     ${created}\n`;
      output += `  Modified:    ${modified}\n`;
      output += `  Accessed:    ${accessed}\n`;

      const extAttrs = Object.keys(attrs.extended);
      if (extAttrs.length > 0) {
        output += `\n  Extended attributes: ${extAttrs.join(', ')}\n`;
      }

      return output;
    } catch (error) {
      return `❌ stat: ${error.message}`;
    }
  }

  // ========== PHASE 2.2: COMPRESSION & ARCHIVES ==========

  /**
   * Compress a file with gzip
   */
  async cmd_gzip(args) {
    if (args.length === 0) {
      return '❌ gzip: missing operand\n💡 Usage: gzip <file>\n   Example: gzip file.txt\n   Output: file.txt.gz';
    }

    const flags = args.filter(arg => arg.startsWith('-'));
    const fileArgs = args.filter(arg => !arg.startsWith('-'));
    const decompress = flags.includes('-d');

    if (decompress) {
      // Act like gunzip when -d flag is used
      return await this.cmd_gunzip(fileArgs);
    }

    const sourcePath = this._resolvePath(fileArgs[0]);

    try {
      // Check if file exists
      await this.context.fs.stat(sourcePath);

      // Compress file
      const result = await this.compressionManager.compressFile(sourcePath);

      let output = `✅ Compressed: ${fileArgs[0]} → ${result.outputPath.split('/').pop()}\n`;
      output += `📊 Original:   ${this._formatBytes(result.originalSize)}\n`;
      output += `   Compressed: ${this._formatBytes(result.compressedSize)}\n`;
      output += `   Ratio:      ${result.ratio} smaller\n`;

      return output;
    } catch (error) {
      return `❌ gzip: ${error.message}`;
    }
  }

  /**
   * Decompress a gzip file
   */
  async cmd_gunzip(args) {
    if (args.length === 0) {
      return '❌ gunzip: missing operand\n💡 Usage: gunzip <file.gz>\n   Example: gunzip file.txt.gz\n   Output: file.txt';
    }

    const sourcePath = this._resolvePath(args[0]);

    try {
      // Check if file exists
      await this.context.fs.stat(sourcePath);

      // Decompress file
      const result = await this.compressionManager.decompressFile(sourcePath);

      let output = `✅ Decompressed: ${args[0]} → ${result.outputPath.split('/').pop()}\n`;
      output += `📊 Compressed:   ${this._formatBytes(result.compressedSize)}\n`;
      output += `   Decompressed: ${this._formatBytes(result.decompressedSize)}\n`;

      return output;
    } catch (error) {
      return `❌ gunzip: ${error.message}`;
    }
  }

  /**
   * Create and extract TAR archives
   */
  async cmd_tar(args) {
    if (args.length === 0) {
      return '❌ tar: missing operands\n💡 Usage:\n   Create:  tar -czf archive.tar.gz <files...>\n   Extract: tar -xzf archive.tar.gz [-C dir]\n   List:    tar -tzf archive.tar.gz\n   Examples:\n     tar -czf backup.tar.gz file1.txt file2.txt\n     tar -xzf backup.tar.gz\n     tar -xzf backup.tar.gz -C /dest/dir';
    }

    const flags = args.filter(arg => arg.startsWith('-'));
    const fileArgs = args.filter(arg => !arg.startsWith('-'));

    // Parse flags
    const hasC = flags.some(f => f.includes('c')); // Create
    const hasX = flags.some(f => f.includes('x')); // Extract
    const hasT = flags.some(f => f.includes('t')); // List
    const hasZ = flags.some(f => f.includes('z')); // Gzip compression
    const hasF = flags.some(f => f.includes('f')); // File
    const hasV = flags.some(f => f.includes('v')); // Verbose

    if (!hasF) {
      return '❌ tar: -f flag is required\n💡 Use: tar -czf archive.tar.gz <files>';
    }

    try {
      if (hasC) {
        // CREATE ARCHIVE
        if (fileArgs.length < 2) {
          return '❌ tar: missing archive name or files\n💡 Usage: tar -czf archive.tar.gz file1 file2 ...';
        }

        const archivePath = this._resolvePath(fileArgs[0]);
        const filesToArchive = [];

        for (let i = 1; i < fileArgs.length; i++) {
          const filePath = this._resolvePath(fileArgs[i]);

          try {
            await this.context.fs.stat(filePath);
            filesToArchive.push({
              path: filePath,
              name: fileArgs[i]
            });
          } catch (error) {
            return `❌ tar: ${fileArgs[i]}: No such file or directory`;
          }
        }

        let result;
        if (hasZ) {
          result = await this.compressionManager.createTarGz(filesToArchive, archivePath);
        } else {
          result = await this.compressionManager.createTar(filesToArchive, archivePath);
        }

        let output = `✅ Created archive: ${fileArgs[0]}\n`;
        output += `📦 Files: ${result.fileCount}\n`;
        output += `📊 Size: ${this._formatBytes(result.compressedSize || result.totalSize)}\n`;
        if (result.ratio) {
          output += `   Ratio: ${result.ratio} smaller\n`;
        }

        return output;

      } else if (hasX) {
        // EXTRACT ARCHIVE
        if (fileArgs.length < 1) {
          return '❌ tar: missing archive name\n💡 Usage: tar -xzf archive.tar.gz [-C destination]';
        }

        const archivePath = this._resolvePath(fileArgs[0]);

        // Check for -C flag
        const cIndex = args.indexOf('-C');
        let destDir = this.currentDir;
        if (cIndex >= 0 && args[cIndex + 1]) {
          destDir = this._resolvePath(args[cIndex + 1]);
        }

        let result;
        if (hasZ) {
          result = await this.compressionManager.extractTarGz(archivePath, destDir);
        } else {
          result = await this.compressionManager.extractTar(archivePath, destDir);
        }

        let output = `✅ Extracted: ${fileArgs[0]}\n`;
        output += `📂 Destination: ${destDir}\n`;
        output += `📄 Files extracted: ${result.extractedFiles}\n`;

        return output;

      } else if (hasT) {
        // LIST ARCHIVE CONTENTS
        return '❌ tar: list mode (-t) not yet implemented\n💡 Use: tar -xzf archive.tar.gz to extract';

      } else {
        return '❌ tar: must specify one of -c, -x, or -t\n💡 See: tar -czf (create), tar -xzf (extract), tar -tzf (list)';
      }
    } catch (error) {
      return `❌ tar: ${error.message}`;
    }
  }

  /**
   * Encrypt a file with AES-256
   */
  async cmd_encrypt(args) {
    if (args.length < 2) {
      return '❌ encrypt: missing operands\n💡 Usage: encrypt <file> <password> [output]\n   Example: encrypt secret.txt mypassword\n   Output: secret.txt.enc';
    }

    const sourcePath = this._resolvePath(args[0]);
    const password = args[1];
    const destPath = args[2] ? this._resolvePath(args[2]) : null;

    try {
      // Check if file exists
      await this.context.fs.stat(sourcePath);

      // Encrypt file
      const result = await this.fileEncryption.encryptFile(sourcePath, password, destPath);

      let output = `🔒 Encrypted: ${args[0]} → ${result.outputPath.split('/').pop()}\n`;
      output += `📊 Original:  ${this._formatBytes(result.originalSize)}\n`;
      output += `   Encrypted: ${this._formatBytes(result.encryptedSize)}\n`;
      output += `🔐 Algorithm: AES-256-GCM\n`;
      output += `⚠️  Keep your password safe!\n`;

      return output;
    } catch (error) {
      return `❌ encrypt: ${error.message}`;
    }
  }

  /**
   * Decrypt an encrypted file
   */
  async cmd_decrypt(args) {
    if (args.length < 2) {
      return '❌ decrypt: missing operands\n💡 Usage: decrypt <file.enc> <password> [output]\n   Example: decrypt secret.txt.enc mypassword\n   Output: secret.txt';
    }

    const sourcePath = this._resolvePath(args[0]);
    const password = args[1];
    const destPath = args[2] ? this._resolvePath(args[2]) : null;

    try {
      // Check if file exists
      await this.context.fs.stat(sourcePath);

      // Decrypt file
      const result = await this.fileEncryption.decryptFile(sourcePath, password, destPath);

      let output = `🔓 Decrypted: ${args[0]} → ${result.outputPath.split('/').pop()}\n`;
      output += `📊 Encrypted:  ${this._formatBytes(result.encryptedSize)}\n`;
      output += `   Decrypted:  ${this._formatBytes(result.decryptedSize)}\n`;
      output += `✅ Decryption successful!\n`;

      return output;
    } catch (error) {
      return `❌ decrypt: ${error.message}`;
    }
  }

  /**
   * Calculate MD5 hash of a file
   */
  async cmd_md5sum(args) {
    if (args.length === 0) {
      return '❌ md5sum: missing operand\n💡 Usage: md5sum <file>\n   Example: md5sum file.txt';
    }

    const filePath = this._resolvePath(args[0]);

    try {
      // Check if file exists
      await this.context.fs.stat(filePath);

      // Calculate hash
      const hash = await this.fileEncryption.hashFile(filePath, 'MD5');

      return `${hash}  ${args[0]}\n⚠️  Note: MD5 is cryptographically broken. Use SHA-256 for security.`;
    } catch (error) {
      return `❌ md5sum: ${error.message}`;
    }
  }

  /**
   * Calculate SHA-256 hash of a file
   */
  async cmd_sha256sum(args) {
    if (args.length === 0) {
      return '❌ sha256sum: missing operand\n💡 Usage: sha256sum <file>\n   Example: sha256sum file.txt';
    }

    const filePath = this._resolvePath(args[0]);

    try {
      // Check if file exists
      await this.context.fs.stat(filePath);

      // Calculate hash
      const hash = await this.fileEncryption.hashFile(filePath, 'SHA-256');

      return `${hash}  ${args[0]}`;
    } catch (error) {
      return `❌ sha256sum: ${error.message}`;
    }
  }

  /**
   * Calculate SHA-512 hash of a file
   */
  async cmd_sha512sum(args) {
    if (args.length === 0) {
      return '❌ sha512sum: missing operand\n💡 Usage: sha512sum <file>\n   Example: sha512sum file.txt';
    }

    const filePath = this._resolvePath(args[0]);

    try {
      // Check if file exists
      await this.context.fs.stat(filePath);

      // Calculate hash
      const hash = await this.fileEncryption.hashFile(filePath, 'SHA-512');

      return `${hash}  ${args[0]}`;
    } catch (error) {
      return `❌ sha512sum: ${error.message}`;
    }
  }

  /**
   * Securely delete a file
   */
  async cmd_shred(args) {
    if (args.length === 0) {
      return '❌ shred: missing operand\n💡 Usage: shred [-n passes] <file>\n   Example: shred secret.txt\n   Example: shred -n 5 secret.txt';
    }

    const flags = args.filter(arg => arg.startsWith('-'));
    const fileArgs = args.filter(arg => !arg.startsWith('-'));

    if (fileArgs.length === 0) {
      return '❌ shred: missing file operand';
    }

    // Parse number of passes
    let passes = 3;
    const nIndex = flags.findIndex(f => f === '-n');
    if (nIndex >= 0) {
      const nValueIndex = args.indexOf('-n') + 1;
      if (args[nValueIndex] && !isNaN(args[nValueIndex])) {
        passes = parseInt(args[nValueIndex], 10);
        // Remove the passes count from fileArgs if it was included
        const passesArgIndex = fileArgs.indexOf(args[nValueIndex]);
        if (passesArgIndex >= 0) {
          fileArgs.splice(passesArgIndex, 1);
        }
      }
    }

    const filePath = this._resolvePath(fileArgs[0]);

    try {
      // Check if file exists
      const stat = await this.context.fs.stat(filePath);

      // Confirm deletion
      let output = `⚠️  Securely deleting: ${fileArgs[0]}\n`;
      output += `📊 Size: ${this._formatBytes(stat.size)}\n`;
      output += `🔄 Passes: ${passes}\n`;

      // Perform secure deletion
      const result = await this.fileEncryption.secureDelete(filePath, passes);

      output += `✅ File securely deleted!\n`;
      output += `🗑️  ${result.passes} overwrite passes completed\n`;

      return output;
    } catch (error) {
      return `❌ shred: ${error.message}`;
    }
  }

  /**
   * Ping a host
   */
  async cmd_ping(args) {
    if (args.length === 0) {
      return '❌ ping: missing operand\n💡 Usage: ping <host> [-c count]\n   Example: ping google.com\n   Example: ping example.com -c 10';
    }

    const host = args[0];
    let count = 4;

    // Parse count option
    const cIndex = args.indexOf('-c');
    if (cIndex >= 0 && args[cIndex + 1]) {
      count = parseInt(args[cIndex + 1], 10) || 4;
    }

    try {
      let output = `🌐 PING ${host}\n`;
      output += `⏳ Sending ${count} packets...\n\n`;

      const result = await this.networkStack.ping(host, { count });

      result.results.forEach(r => {
        if (r.success) {
          output += `✅ Reply from ${result.ip}: seq=${r.seq} time=${r.time}ms TTL=${r.ttl}\n`;
        } else {
          output += `❌ Request timeout for seq=${r.seq}\n`;
        }
      });

      output += `\n📊 Statistics:\n`;
      output += `   Packets: Sent=${result.statistics.transmitted}, Received=${result.statistics.received}, Loss=${result.statistics.loss}%\n`;
      output += `   Round trip: Min=${result.statistics.min}ms, Max=${result.statistics.max}ms, Avg=${result.statistics.avg}ms\n`;

      return output;
    } catch (error) {
      return `❌ ping: ${error.message}`;
    }
  }

  /**
   * Fetch URL content (curl-like)
   */
  async cmd_curl(args) {
    if (args.length === 0) {
      return '❌ curl: missing URL\n💡 Usage: curl <url> [options]\n   Example: curl https://api.github.com/users/octocat\n   Options: -o <file> (save to file), -i (include headers)';
    }

    const url = args[0];
    const saveToFile = args.includes('-o');
    const includeHeaders = args.includes('-i');
    const outputFile = saveToFile ? args[args.indexOf('-o') + 1] : null;

    try {
      let output = `🌐 Fetching: ${url}\n\n`;

      const response = await this.networkStack.fetch(url);

      let content = '';

      if (includeHeaders) {
        content += `HTTP/${response.status} ${response.statusText}\n`;
        response.headers.forEach((value, key) => {
          content += `${key}: ${value}\n`;
        });
        content += '\n';
      }

      const text = await response.text();
      content += text;

      if (saveToFile) {
        const filePath = this._resolvePath(outputFile);
        await this.context.fs.writeFile(filePath, content);
        output += `✅ Saved to: ${outputFile}\n`;
        output += `📊 Size: ${this._formatBytes(content.length)}\n`;
      } else {
        // Limit output to first 1000 chars for display
        if (content.length > 1000) {
          output += content.substring(0, 1000) + '\n\n... (truncated)\n';
          output += `💡 Total size: ${this._formatBytes(content.length)}\n`;
        } else {
          output += content;
        }
      }

      return output;
    } catch (error) {
      return `❌ curl: ${error.message}`;
    }
  }

  /**
   * Download file (wget-like)
   */
  async cmd_wget(args) {
    if (args.length === 0) {
      return '❌ wget: missing URL\n💡 Usage: wget <url> [-O filename]\n   Example: wget https://example.com/file.zip\n   Example: wget https://example.com/data.json -O mydata.json';
    }

    const url = args[0];
    let filename = url.split('/').pop() || 'download';

    // Check for -O option
    const oIndex = args.indexOf('-O');
    if (oIndex >= 0 && args[oIndex + 1]) {
      filename = args[oIndex + 1];
    }

    try {
      let output = `🌐 Downloading: ${url}\n`;
      output += `📁 Saving to: ${filename}\n\n`;

      const response = await this.networkStack.fetch(url);
      const data = await response.arrayBuffer();

      const filePath = this._resolvePath(filename);
      await this.context.fs.writeFile(filePath, new Uint8Array(data));

      output += `✅ Download complete!\n`;
      output += `📊 Size: ${this._formatBytes(data.byteLength)}\n`;
      output += `📁 Saved: ${filename}\n`;

      return output;
    } catch (error) {
      return `❌ wget: ${error.message}`;
    }
  }

  /**
   * Fetch command (simpler HTTP requests)
   */
  async cmd_fetch(args) {
    return await this.cmd_curl(args);
  }

  /**
   * Show network statistics
   */
  async cmd_netstat(args) {
    const connections = this.networkStack.getConnections();
    const stats = this.networkStack.getStatistics();

    let output = `📊 Network Statistics\n\n`;

    if (args.includes('-a') || args.includes('--all')) {
      output += `Active Connections:\n`;
      if (connections.length === 0) {
        output += `  No active connections\n`;
      } else {
        connections.forEach((conn, index) => {
          output += `  ${index + 1}. ${conn.type.toUpperCase()} - ${conn.url} (${conn.method || 'N/A'})\n`;
          output += `     Started: ${new Date(conn.started).toLocaleTimeString()}\n`;
        });
      }
      output += `\n`;
    }

    output += `Statistics:\n`;
    output += `  Active Connections: ${stats.activeConnections}\n`;
    output += `  Successful Requests: ${stats.requestsSuccessful}\n`;
    output += `  Failed Requests: ${stats.requestsFailed}\n`;
    output += `  Bytes Sent: ${this._formatBytes(stats.bytesSent)}\n`;
    output += `  Bytes Received: ${this._formatBytes(stats.bytesReceived)}\n`;

    return output;
  }

  /**
   * Show network interfaces
   */
  async cmd_ifconfig(args) {
    const interfaces = this.networkStack.getInterfaces();

    let output = `🌐 Network Interfaces\n\n`;

    interfaces.forEach(iface => {
      output += `${iface.name}: ${iface.flags.join(',')} MTU:${iface.mtu}\n`;

      iface.addresses.forEach(addr => {
        output += `  ${addr.family}: ${addr.address}`;
        if (addr.netmask) {
          output += ` netmask ${addr.netmask}`;
        }
        if (addr.broadcast) {
          output += ` broadcast ${addr.broadcast}`;
        }
        output += `\n`;
      });

      if (iface.mac) {
        output += `  ether ${iface.mac}\n`;
      }

      output += `\n`;
    });

    return output;
  }

  /**
   * Show routing table
   */
  async cmd_route(args) {
    const routes = this.networkStack.getRoutes();

    let output = `🛣️  Kernel IP routing table\n\n`;
    output += `Destination      Gateway          Netmask          Iface    Metric\n`;
    output += `─────────────────────────────────────────────────────────────────\n`;

    routes.forEach(route => {
      output += `${route.destination.padEnd(17)}`;
      output += `${route.gateway.padEnd(17)}`;
      output += `${route.netmask.padEnd(17)}`;
      output += `${route.interface.padEnd(9)}`;
      output += `${route.metric}\n`;
    });

    return output;
  }

  /**
   * DNS lookup
   */
  async cmd_nslookup(args) {
    if (args.length === 0) {
      return '❌ nslookup: missing operand\n💡 Usage: nslookup <domain>\n   Example: nslookup google.com';
    }

    const domain = args[0];

    try {
      const ip = await this.networkStack.getDNS().resolve(domain);
      const dnsServers = this.networkStack.getDNS().getDNSServers();

      let output = `🔍 DNS Lookup for: ${domain}\n\n`;
      output += `Server: ${dnsServers[0]}\n\n`;
      output += `Non-authoritative answer:\n`;
      output += `Name: ${domain}\n`;
      output += `Address: ${ip}\n`;

      return output;
    } catch (error) {
      return `❌ nslookup: ${error.message}`;
    }
  }

  /**
   * DNS query (dig-like)
   */
  async cmd_dig(args) {
    if (args.length === 0) {
      return '❌ dig: missing operand\n💡 Usage: dig <domain> [type]\n   Example: dig google.com\n   Example: dig google.com MX';
    }

    const domain = args[0];
    const recordType = args[1] || 'A';

    try {
      const records = await this.networkStack.getDNS().getRecords(domain, recordType);

      let output = `🔍 DNS Query for: ${domain}\n\n`;
      output += `;; QUESTION SECTION:\n`;
      output += `;${domain}. IN ${recordType}\n\n`;
      output += `;; ANSWER SECTION:\n`;

      records.forEach(record => {
        if (record.type === 'MX') {
          output += `${record.name}. ${record.ttl} IN ${record.type} ${record.priority} ${record.value}\n`;
        } else {
          output += `${record.name}. ${record.ttl} IN ${record.type} ${record.value}\n`;
        }
      });

      output += `\n;; Query time: ${Math.floor(Math.random() * 50 + 10)} msec\n`;

      return output;
    } catch (error) {
      return `❌ dig: ${error.message}`;
    }
  }

  /**
   * Traceroute to host
   */
  async cmd_traceroute(args) {
    if (args.length === 0) {
      return '❌ traceroute: missing operand\n💡 Usage: traceroute <host>\n   Example: traceroute google.com';
    }

    const host = args[0];

    try {
      let output = `🛰️  Traceroute to ${host}\n\n`;

      const hops = await this.networkStack.traceroute(host);

      hops.forEach(hop => {
        output += `${hop.hop.toString().padStart(2)}  `;
        output += `${hop.hostname.padEnd(30)} `;
        output += `(${hop.ip.padEnd(15)})  `;
        output += `${hop.time1}ms  ${hop.time2}ms  ${hop.time3}ms\n`;
      });

      return output;
    } catch (error) {
      return `❌ traceroute: ${error.message}`;
    }
  }

  /**
   * Manage firewall rules
   */
  async cmd_iptables(args) {
    const firewall = this.networkStack.getFirewall();

    if (args.length === 0 || args[0] === '-L') {
      // List rules
      const rules = firewall.getRules();
      const status = firewall.getStatus();

      let output = `🔥 Firewall Status\n\n`;
      output += `Enabled: ${status.enabled ? 'Yes' : 'No'}\n`;
      output += `Default Policy: ${status.defaultPolicy.toUpperCase()}\n`;
      output += `Rules: ${status.ruleCount}\n\n`;

      if (rules.length === 0) {
        output += `No custom rules defined\n`;
      } else {
        output += `Chain Rules:\n`;
        output += `──────────────────────────────────────────────────\n`;
        rules.forEach((rule, index) => {
          output += `${(index + 1).toString().padStart(3)}. ${rule.action.toUpperCase().padEnd(6)} `;
          output += `${rule.type.padEnd(10)} `;
          if (rule.pattern) {
            output += `${String(rule.pattern).substring(0, 30)}`;
          } else if (rule.port) {
            output += `port ${rule.port}`;
          }
          if (rule.reason) {
            output += ` (${rule.reason})`;
          }
          output += `\n`;
        });
      }

      return output;
    } else if (args[0] === '-A' && args[1] && args[2]) {
      // Add rule
      const action = args[1].toLowerCase();
      const target = args[2];

      if (!['allow', 'deny'].includes(action)) {
        return '❌ iptables: action must be "allow" or "deny"';
      }

      try {
        if (action === 'allow') {
          firewall.allowHostname(target, 'User rule');
        } else {
          firewall.blockHostname(target, 'User rule');
        }

        return `✅ Firewall rule added: ${action.toUpperCase()} ${target}`;
      } catch (error) {
        return `❌ iptables: ${error.message}`;
      }
    } else if (args[0] === '-F') {
      // Flush rules
      firewall.clearRules();
      return `✅ Firewall rules cleared`;
    } else {
      return '❌ iptables: invalid arguments\n💡 Usage:\n   iptables -L (list rules)\n   iptables -A allow <host> (add allow rule)\n   iptables -A deny <host> (add deny rule)\n   iptables -F (flush all rules)';
    }
  }

  /**
   * Format bytes to human-readable string
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }
}
