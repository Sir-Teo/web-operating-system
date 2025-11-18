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

    // Setup input handler
    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const command = input.value.trim();
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
        // Basic autocomplete
        const value = input.value;
        const commands = ['cd', 'ls', 'pwd', 'cat', 'echo', 'mkdir', 'rm', 'touch', 'help', 'clear', 'ps', 'uname', 'date', 'whoami', 'tree', 'cp', 'mv', 'grep', 'find', 'wc', 'sort', 'uniq', 'head', 'tail', 'cut', 'neofetch'];
        const matches = commands.filter(cmd => cmd.startsWith(value));
        if (matches.length === 1) {
          input.value = matches[0] + ' ';
        }
      }
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
      // New advanced commands
      grep: this.cmd_grep.bind(this),
      find: this.cmd_find.bind(this),
      wc: this.cmd_wc.bind(this),
      sort: this.cmd_sort.bind(this),
      uniq: this.cmd_uniq.bind(this),
      head: this.cmd_head.bind(this),
      tail: this.cmd_tail.bind(this),
      cut: this.cmd_cut.bind(this)
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
        }).join('  ');
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
║                  AVAILABLE COMMANDS                    ║
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
║  💻 System:                                             ║
║    ps               List running processes             ║
║    uname [-a]       Print system information           ║
║    date             Display current date/time          ║
║    whoami           Display current user               ║
║    neofetch         Display system info (fancy!)       ║
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
║  ℹ️  Utilities:                                         ║
║    echo <text>      Display text                       ║
║    help             Show this help message             ║
╚════════════════════════════════════════════════════════╝

💡 Tips:
  • Use ↑/↓ arrows to navigate command history
  • Use Tab for command autocomplete
  • Use pipes: command1 | command2
  • Use redirection: command > file.txt or command >> file.txt
  • Example: ls | grep .txt | wc -l
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
    if (pipedInput) {
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
    if (pipedInput) {
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

    if (pipedInput) {
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

    if (pipedInput) {
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
    const unique = [];
    const counts = {};
    let lastLine = null;

    for (const line of lines) {
      if (line !== lastLine) {
        if (count) {
          counts[line] = (counts[line] || 0) + 1;
        }
        unique.push(line);
        lastLine = line;
      }
    }

    if (count) {
      return unique.map(line => `${counts[line]} ${line}`).join('\n');
    }

    return unique.join('\n');
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

    if (pipedInput) {
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

    if (pipedInput) {
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

    if (pipedInput) {
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
}
