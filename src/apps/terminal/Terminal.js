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
  }

  async init() {
    // Terminal is ready
  }

  render() {
    const container = document.createElement('div');
    container.className = 'terminal-container';
    container.style.cssText = 'background:#1e1e1e;color:#00ff00;font-family:monospace;padding:10px;height:100%;overflow-y:auto;';

    const output = document.createElement('div');
    output.className = 'terminal-output';
    output.id = 'terminal-output';

    const inputLine = document.createElement('div');
    inputLine.className = 'terminal-input-line';
    inputLine.style.cssText = 'display:flex;margin-top:5px;';

    const prompt = document.createElement('span');
    prompt.className = 'terminal-prompt';
    prompt.textContent = this._getPrompt();
    prompt.style.cssText = 'color:#00aaff;margin-right:5px;';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'terminal-input';
    input.style.cssText = 'background:transparent;border:none;outline:none;color:#00ff00;font-family:monospace;flex:1;';

    inputLine.appendChild(prompt);
    inputLine.appendChild(input);

    container.appendChild(output);
    container.appendChild(inputLine);

    // Show welcome message
    this._addOutput(output, `WebOS Terminal v1.0.0
Type 'help' for available commands.
`);

    // Setup input handler
    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const command = input.value.trim();
        if (command) {
          this.history.push(command);
          this.historyIndex = this.history.length;

          this._addOutput(output, `${this._getPrompt()}${command}`);

          const result = await this.executeCommand(command);
          if (result !== '\x1bc') {
            this._addOutput(output, result);
          } else {
            output.innerHTML = '';
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
      }
    });

    // Auto-focus input
    setTimeout(() => input.focus(), 100);

    return container;
  }

  _getPrompt() {
    return `${this.env.USER}@webos:${this.currentDir}$ `;
  }

  _addOutput(outputElement, text) {
    const line = document.createElement('div');
    line.textContent = text;
    line.style.whiteSpace = 'pre-wrap';
    outputElement.appendChild(line);
  }

  async executeCommand(commandLine) {
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
      whoami: this.cmd_whoami.bind(this)
    };

    if (builtins[command]) {
      try {
        return await builtins[command](args);
      } catch (error) {
        return `Error: ${error.message}`;
      }
    }

    return `Command not found: ${command}`;
  }

  async cmd_ls(args) {
    const path = args[0] || this.currentDir;
    const fullPath = this._resolvePath(path);

    try {
      const entries = await this.context.fs.readdir(fullPath);
      return entries.map(e => {
        const indicator = e.type === 'directory' ? '/' : '';
        return `${e.name}${indicator}`;
      }).join('\n');
    } catch (error) {
      return `ls: ${error.message}`;
    }
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
        return '';
      } else {
        return `cd: not a directory: ${args[0]}`;
      }
    } catch (error) {
      return `cd: ${error.message}`;
    }
  }

  cmd_pwd() {
    return this.currentDir;
  }

  async cmd_cat(args) {
    if (args.length === 0) {
      return 'cat: missing file operand';
    }

    const path = this._resolvePath(args[0]);

    try {
      const content = await this.context.fs.readFile(path, { encoding: 'utf8' });
      return content;
    } catch (error) {
      return `cat: ${error.message}`;
    }
  }

  cmd_echo(args) {
    return args.join(' ');
  }

  async cmd_mkdir(args) {
    if (args.length === 0) {
      return 'mkdir: missing operand';
    }

    const path = this._resolvePath(args[0]);

    try {
      await this.context.fs.mkdir(path, { recursive: true });
      return '';
    } catch (error) {
      return `mkdir: ${error.message}`;
    }
  }

  async cmd_rm(args) {
    if (args.length === 0) {
      return 'rm: missing operand';
    }

    const recursive = args[0] === '-r' || args[0] === '-rf';
    const path = this._resolvePath(args[recursive ? 1 : 0]);

    try {
      await this.context.fs.rm(path, { recursive });
      return '';
    } catch (error) {
      return `rm: ${error.message}`;
    }
  }

  async cmd_touch(args) {
    if (args.length === 0) {
      return 'touch: missing file operand';
    }

    const path = this._resolvePath(args[0]);

    try {
      await this.context.fs.writeFile(path, '', { encoding: 'utf8' });
      return '';
    } catch (error) {
      return `touch: ${error.message}`;
    }
  }

  cmd_ps() {
    const processes = this.context.process.constructor.listProcesses();
    let output = 'PID                                  NAME         STATE\n';

    processes.forEach(proc => {
      const pid = proc.pid.substring(0, 36).padEnd(36);
      const name = proc.name.substring(0, 12).padEnd(12);
      output += `${pid} ${name} ${proc.state}\n`;
    });

    return output;
  }

  cmd_uname(args) {
    if (args.includes('-a')) {
      return 'WebOS 1.0.0 JavaScript Browser';
    }
    return 'WebOS';
  }

  cmd_date() {
    return new Date().toString();
  }

  cmd_whoami() {
    return this.env.USER;
  }

  cmd_help() {
    return `Available commands:
  cd [dir]          Change directory
  ls [dir]          List directory contents
  pwd               Print working directory
  cat <file>        Display file contents
  echo <text>       Display text
  mkdir <dir>       Create directory
  rm [-r] <path>    Remove file or directory
  touch <file>      Create empty file
  ps                List running processes
  uname [-a]        Print system information
  date              Display current date and time
  whoami            Display current user
  clear             Clear terminal
  help              Show this help message`;
  }

  cmd_clear() {
    return '\x1bc'; // Special clear code
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
}
