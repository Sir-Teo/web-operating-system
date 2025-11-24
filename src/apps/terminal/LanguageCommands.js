/**
 * Language Runtime Commands for Terminal
 * Adds commands to execute code in multiple programming languages
 */

import { RuntimeManager } from '../../system/runtime/index.ts';

export class LanguageCommands {
  constructor(terminal) {
    this.terminal = terminal;
    this.runtimeManager = RuntimeManager.getInstance();
  }

  /**
   * Register all language commands
   */
  registerCommands(commands) {
    const self = this;

    // Python command
    commands.python = {
      description: 'Execute Python code',
      usage: 'python [options] [file or -c "code"]',
      async execute(args) {
        return self.executeLanguage('python', args);
      },
    };

    // Python alias
    commands.py = {
      description: 'Execute Python code (alias for python)',
      usage: 'py [options] [file or -c "code"]',
      async execute(args) {
        return self.executeLanguage('python', args);
      },
    };

    // JavaScript/Node command
    commands.node = {
      description: 'Execute JavaScript code',
      usage: 'node [options] [file or -e "code"]',
      async execute(args) {
        return self.executeLanguage('javascript', args, '-e');
      },
    };

    // Ruby command
    commands.ruby = {
      description: 'Execute Ruby code',
      usage: 'ruby [options] [file or -e "code"]',
      async execute(args) {
        return self.executeLanguage('ruby', args, '-e');
      },
    };

    // Ruby alias
    commands.rb = {
      description: 'Execute Ruby code (alias for ruby)',
      usage: 'rb [options] [file or -e "code"]',
      async execute(args) {
        return self.executeLanguage('ruby', args, '-e');
      },
    };

    // PHP command
    commands.php = {
      description: 'Execute PHP code',
      usage: 'php [options] [file or -r "code"]',
      async execute(args) {
        return self.executeLanguage('php', args, '-r');
      },
    };

    // TypeScript command
    commands.ts = {
      description: 'Execute TypeScript code',
      usage: 'ts [options] [file or -e "code"]',
      async execute(args) {
        return self.executeLanguage('typescript', args, '-e');
      },
    };

    // SQLite command
    commands.sqlite = {
      description: 'Execute SQL queries',
      usage: 'sqlite [file or -c "query"]',
      async execute(args) {
        return self.executeLanguage('sql', args);
      },
    };

    // SQL alias
    commands.sql = {
      description: 'Execute SQL queries (alias for sqlite)',
      usage: 'sql [file or -c "query"]',
      async execute(args) {
        return self.executeLanguage('sql', args);
      },
    };

    // Language info command
    commands.langinfo = {
      description: 'Show information about available language runtimes',
      usage: 'langinfo [language]',
      async execute(args) {
        return self.showLanguageInfo(args);
      },
    };

    // Install package command
    commands.langinstall = {
      description: 'Install a package for a language runtime',
      usage: 'langinstall <language> <package>',
      async execute(args) {
        return self.installPackage(args);
      },
    };

    // REPL command
    commands.repl = {
      description: 'Start an interactive REPL for a language',
      usage: 'repl <language>',
      async execute(args) {
        return self.startREPL(args);
      },
    };
  }

  /**
   * Execute code in a specific language
   */
  async executeLanguage(language, args, codeFlag = '-c') {
    try {
      // Parse arguments
      let code = '';
      let file = '';
      let useCode = false;

      for (let i = 0; i < args.length; i++) {
        if (args[i] === codeFlag) {
          useCode = true;
          code = args[i + 1] || '';
          i++; // Skip next argument
        } else if (!useCode && !args[i].startsWith('-')) {
          file = args[i];
        }
      }

      // If no code or file specified, show usage
      if (!code && !file) {
        return `Usage: ${language} ${codeFlag} "code" or ${language} <file>`;
      }

      // Read code from file if specified
      if (file) {
        try {
          code = await this.terminal.context.fs.readFile(file, { encoding: 'utf8' });
        } catch (error) {
          return `Error reading file: ${error.message}`;
        }
      }

      // Initialize runtime if needed
      const runtime = this.runtimeManager.getRuntime(language);
      if (!runtime) {
        return `Error: Language '${language}' is not supported`;
      }

      if (!runtime.loaded) {
        this.terminal.write(`Loading ${language} runtime...\n`);
        await this.runtimeManager.initializeRuntime(language);
      }

      // Execute code
      const result = await this.runtimeManager.execute(language, code);

      let output = '';
      if (result.output) {
        output += result.output + '\n';
      }
      if (!result.success && result.error) {
        output += `Error: ${result.error}\n`;
      }

      return output || '(No output)';
    } catch (error) {
      return `Execution error: ${error.message}`;
    }
  }

  /**
   * Show language information
   */
  async showLanguageInfo(args) {
    const { SUPPORTED_LANGUAGES, getLanguageInfo } = await import('../../system/runtime/index.ts');

    if (args.length === 0) {
      // List all languages
      let output = 'Available Language Runtimes:\n\n';
      for (const lang of SUPPORTED_LANGUAGES) {
        const runtime = this.runtimeManager.getRuntime(lang.id);
        const status = runtime?.loaded ? '✓' : '○';
        output += `${status} ${lang.icon} ${lang.name} ${lang.version}\n`;
        output += `   ${lang.description}\n`;
        if (lang.packageManager) {
          output += `   Package Manager: ${lang.packageManager}\n`;
        }
        output += '\n';
      }
      output += 'Commands: python, ruby, php, node, ts, sql\n';
      output += 'Use "langinfo <language>" for more details\n';
      return output;
    } else {
      // Show specific language info
      const language = args[0].toLowerCase();
      const info = getLanguageInfo(language);

      if (!info) {
        return `Language '${language}' not found`;
      }

      const runtime = this.runtimeManager.getRuntime(language);
      const status = runtime?.loaded ? 'Loaded' : 'Not loaded';

      let output = `${info.icon} ${info.name} ${info.version}\n\n`;
      output += `Description: ${info.description}\n`;
      output += `Status: ${status}\n`;
      output += `Extension: ${info.extension}\n`;
      if (info.packageManager) {
        output += `Package Manager: ${info.packageManager}\n`;
      }
      output += `\nFeatures:\n`;
      for (const feature of info.features) {
        output += `  • ${feature}\n`;
      }

      return output;
    }
  }

  /**
   * Install a package for a language
   */
  async installPackage(args) {
    if (args.length < 2) {
      return 'Usage: langinstall <language> <package>';
    }

    const language = args[0].toLowerCase();
    const packageName = args[1];

    try {
      this.terminal.write(`Installing ${packageName} for ${language}...\n`);

      const runtime = this.runtimeManager.getRuntime(language);
      if (!runtime) {
        return `Error: Language '${language}' is not supported`;
      }

      if (!runtime.loaded) {
        this.terminal.write(`Loading ${language} runtime...\n`);
        await this.runtimeManager.initializeRuntime(language);
      }

      const success = await this.runtimeManager.installPackage(language, packageName);

      if (success) {
        return `✓ Successfully installed ${packageName}`;
      } else {
        return `✗ Failed to install ${packageName}`;
      }
    } catch (error) {
      return `Installation error: ${error.message}`;
    }
  }

  /**
   * Start an interactive REPL
   */
  async startREPL(args) {
    if (args.length === 0) {
      return 'Usage: repl <language>\nAvailable: javascript, python, ruby, php, sql';
    }

    const language = args[0].toLowerCase();
    const runtime = this.runtimeManager.getRuntime(language);

    if (!runtime) {
      return `Error: Language '${language}' is not supported`;
    }

    if (!runtime.hasREPL()) {
      return `Error: ${language} does not support REPL mode`;
    }

    return `Starting ${language} REPL... (Note: Full REPL mode coming soon!)
For now, use: ${language} -c "your code here"`;
  }
}

export default LanguageCommands;
