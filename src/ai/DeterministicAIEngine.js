/**
 * DeterministicAIEngine - A sophisticated rule-based AI system for WebOS
 * Handles all OS operations through intent recognition and context awareness
 */

export default class DeterministicAIEngine {
  constructor(osContext = {}) {
    this.osContext = osContext; // Reference to OS state (filesystem, processes, etc.)
    this.conversationHistory = [];
    this.userPreferences = {};

    // Intent patterns with priority scoring
    this.intentPatterns = this._buildIntentPatterns();

    // OS knowledge base
    this.knowledgeBase = this._buildKnowledgeBase();

    // Command templates
    this.commandTemplates = this._buildCommandTemplates();

    // Context extractors
    this.contextExtractors = this._buildContextExtractors();
  }

  /**
   * Main entry point - process a user query and generate response
   */
  async process(query, options = {}) {
    const startTime = Date.now();

    // Normalize query
    const normalizedQuery = this._normalizeQuery(query);

    // Detect intent
    const intent = this._detectIntent(normalizedQuery);

    // Extract entities from query
    const entities = this._extractEntities(normalizedQuery, intent);

    // Gather OS context
    const context = await this._gatherContext(intent, entities);

    // Generate response based on intent
    const response = await this._generateResponse(intent, entities, context, normalizedQuery);

    // Update conversation history
    this._updateHistory(query, response);

    const processingTime = Date.now() - startTime;

    return {
      response: response.text,
      intent: intent.type,
      confidence: intent.confidence,
      metadata: {
        processingTime,
        entities,
        context: response.contextUsed || []
      }
    };
  }

  /**
   * Build intent recognition patterns
   */
  _buildIntentPatterns() {
    return [
      // File system operations
      {
        type: 'file.search',
        patterns: [
          /find (all |any )?(.+?) files?/i,
          /search for (.+?) files?/i,
          /locate (.+?) files?/i,
          /where (?:are|is) (.+?) files?/i,
          /show me (.+?) files?/i,
          /list (.+?) files?/i
        ],
        priority: 90
      },
      {
        type: 'file.create',
        patterns: [
          /create (a |an )?(.+?) (file|folder|directory)/i,
          /make (a |an )?(.+?) (file|folder|directory)/i,
          /new (.+?) (file|folder)/i,
          /touch (.+)/i
        ],
        priority: 95
      },
      {
        type: 'file.read',
        patterns: [
          /read (.+)/i,
          /show (?:me )?(?:the )?(?:contents? of )?(.+)/i,
          /cat (.+)/i,
          /view (.+)/i,
          /open (.+)/i,
          /display (.+)/i
        ],
        priority: 85
      },
      {
        type: 'file.write',
        patterns: [
          /write (.+?) to (.+)/i,
          /save (.+?) (?:to|in) (.+)/i,
          /edit (.+)/i,
          /modify (.+)/i,
          /update (.+)/i
        ],
        priority: 90
      },
      {
        type: 'file.delete',
        patterns: [
          /delete (.+)/i,
          /remove (.+)/i,
          /rm (.+)/i,
          /trash (.+)/i
        ],
        priority: 95
      },
      {
        type: 'file.organize',
        patterns: [
          /organize (.+)/i,
          /sort (.+)/i,
          /clean up (.+)/i,
          /arrange (.+)/i
        ],
        priority: 85
      },

      // Process management
      {
        type: 'process.list',
        patterns: [
          /(?:list|show) (?:all )?(?:running )?processes/i,
          /what'?s running/i,
          /active (?:programs|applications|processes)/i,
          /ps/i,
          /top/i
        ],
        priority: 90
      },
      {
        type: 'process.kill',
        patterns: [
          /kill (?:process )?(.+)/i,
          /stop (?:process )?(.+)/i,
          /terminate (.+)/i,
          /close (.+)/i
        ],
        priority: 95
      },
      {
        type: 'process.start',
        patterns: [
          /start (.+)/i,
          /launch (.+)/i,
          /run (.+)/i,
          /open (.+?) (?:app|application|program)/i,
          /execute (.+)/i
        ],
        priority: 90
      },

      // Application management
      {
        type: 'app.list',
        patterns: [
          /(?:list|show) (?:all )?(?:available )?(?:apps|applications)/i,
          /what apps (?:do I have|are available)/i,
          /available programs/i
        ],
        priority: 85
      },
      {
        type: 'app.info',
        patterns: [
          /what (?:is|does) (.+?) do/i,
          /tell me about (.+)/i,
          /info (?:about |on )?(.+)/i,
          /explain (.+)/i,
          /help with (.+)/i
        ],
        priority: 80
      },

      // Code operations
      {
        type: 'code.analyze',
        patterns: [
          /analyze (?:this |the )?code/i,
          /check (?:this |the )?code/i,
          /review (?:this |the )?code/i,
          /find bugs in (.+)/i,
          /code quality/i
        ],
        priority: 85
      },
      {
        type: 'code.generate',
        patterns: [
          /(?:write|generate|create) (?:a |an |some )?(.+?) (?:function|class|code|script)/i,
          /code (?:to|for) (.+)/i,
          /implement (.+)/i,
          /make (?:a |an )?(.+?) function/i
        ],
        priority: 90
      },
      {
        type: 'code.explain',
        patterns: [
          /explain (?:this |the )?code/i,
          /what does (?:this |the )?code do/i,
          /how does (.+?) work/i,
          /walk me through (.+)/i
        ],
        priority: 85
      },
      {
        type: 'code.fix',
        patterns: [
          /fix (?:this |the )?(?:bug|error|issue)/i,
          /debug (.+)/i,
          /(?:why is|what'?s wrong with) (.+)/i,
          /repair (.+)/i
        ],
        priority: 95
      },

      // Terminal/Command operations
      {
        type: 'command.suggest',
        patterns: [
          /how (?:do I|to|can I) (.+)/i,
          /command (?:for|to) (.+)/i,
          /help me (.+)/i,
          /I (?:want to|need to) (.+)/i
        ],
        priority: 80
      },
      {
        type: 'command.explain',
        patterns: [
          /what does (.+?) (?:command )?do/i,
          /explain (?:the )?command (.+)/i,
          /meaning of (.+)/i
        ],
        priority: 85
      },

      // System information
      {
        type: 'system.status',
        patterns: [
          /system (?:status|info|information)/i,
          /how'?s the system/i,
          /system health/i,
          /performance/i,
          /resource usage/i
        ],
        priority: 85
      },
      {
        type: 'system.disk',
        patterns: [
          /disk (?:space|usage)/i,
          /storage/i,
          /how much space/i,
          /df/i
        ],
        priority: 90
      },

      // General help
      {
        type: 'help.general',
        patterns: [
          /^help$/i,
          /what can you do/i,
          /capabilities/i,
          /features/i,
          /how to use/i
        ],
        priority: 70
      },
      {
        type: 'help.specific',
        patterns: [
          /help with (.+)/i,
          /how do I use (.+)/i,
          /guide for (.+)/i,
          /tutorial (?:for|on) (.+)/i
        ],
        priority: 75
      },

      // Conversational
      {
        type: 'conversation.greeting',
        patterns: [
          /^(hi|hello|hey|greetings)/i,
          /good (morning|afternoon|evening)/i
        ],
        priority: 60
      },
      {
        type: 'conversation.thanks',
        patterns: [
          /^(thanks|thank you|thx)/i,
          /appreciate it/i
        ],
        priority: 60
      },

      // Default fallback
      {
        type: 'unknown',
        patterns: [/.*/],
        priority: 0
      }
    ];
  }

  /**
   * Build OS knowledge base
   */
  _buildKnowledgeBase() {
    return {
      applications: {
        terminal: {
          name: 'Terminal',
          description: 'Command-line interface for executing shell commands',
          capabilities: ['command execution', 'file operations', 'process management'],
          usage: 'Type commands directly to interact with the system'
        },
        fileexplorer: {
          name: 'File Explorer',
          description: 'Visual file system browser',
          capabilities: ['file browsing', 'file operations', 'drag and drop'],
          usage: 'Navigate directories and manage files visually'
        },
        texteditor: {
          name: 'Text Editor',
          description: 'Advanced code and text editor',
          capabilities: ['code editing', 'syntax highlighting', 'multi-file editing'],
          usage: 'Edit code and text files with advanced features'
        },
        taskmanager: {
          name: 'Task Manager',
          description: 'Process and system monitor',
          capabilities: ['process monitoring', 'resource usage', 'process control'],
          usage: 'Monitor and manage running processes'
        },
        settings: {
          name: 'Settings',
          description: 'System configuration',
          capabilities: ['theme customization', 'system preferences', 'user settings'],
          usage: 'Configure system appearance and behavior'
        },
        browser: {
          name: 'Browser',
          description: 'Web browser',
          capabilities: ['web browsing', 'internet access', 'web apps'],
          usage: 'Access websites and web applications'
        },
        email: {
          name: 'Email Client',
          description: 'Email management application',
          capabilities: ['email reading', 'composing', 'organization'],
          usage: 'Manage your email communications'
        },
        calendar: {
          name: 'Calendar',
          description: 'Schedule and event management',
          capabilities: ['event scheduling', 'reminders', 'calendar views'],
          usage: 'Track appointments and manage your schedule'
        },
        notes: {
          name: 'Notes',
          description: 'Note-taking application',
          capabilities: ['note creation', 'organization', 'search'],
          usage: 'Create and organize notes'
        },
        calculator: {
          name: 'Calculator',
          description: 'Mathematical calculator',
          capabilities: ['basic math', 'scientific functions', 'history'],
          usage: 'Perform calculations'
        },
        mediaplayer: {
          name: 'Media Player',
          description: 'Audio and video player',
          capabilities: ['media playback', 'playlists', 'format support'],
          usage: 'Play audio and video files'
        },
        imageviewer: {
          name: 'Image Viewer',
          description: 'Image viewing and basic editing',
          capabilities: ['image viewing', 'zoom', 'basic edits'],
          usage: 'View and edit images'
        },
        chat: {
          name: 'Chat',
          description: 'Messaging application',
          capabilities: ['instant messaging', 'group chats', 'file sharing'],
          usage: 'Communicate with others'
        }
      },

      fileTypes: {
        js: { language: 'JavaScript', icon: '📜', category: 'code' },
        py: { language: 'Python', icon: '🐍', category: 'code' },
        java: { language: 'Java', icon: '☕', category: 'code' },
        cpp: { language: 'C++', icon: '⚙️', category: 'code' },
        c: { language: 'C', icon: '⚙️', category: 'code' },
        html: { language: 'HTML', icon: '🌐', category: 'code' },
        css: { language: 'CSS', icon: '🎨', category: 'code' },
        json: { language: 'JSON', icon: '📋', category: 'data' },
        xml: { language: 'XML', icon: '📋', category: 'data' },
        md: { language: 'Markdown', icon: '📝', category: 'document' },
        txt: { language: 'Text', icon: '📄', category: 'document' },
        pdf: { language: 'PDF', icon: '📕', category: 'document' },
        jpg: { language: 'Image', icon: '🖼️', category: 'media' },
        png: { language: 'Image', icon: '🖼️', category: 'media' },
        gif: { language: 'Image', icon: '🖼️', category: 'media' },
        mp3: { language: 'Audio', icon: '🎵', category: 'media' },
        mp4: { language: 'Video', icon: '🎬', category: 'media' },
        zip: { language: 'Archive', icon: '📦', category: 'archive' }
      },

      commands: {
        ls: {
          description: 'List directory contents',
          usage: 'ls [options] [path]',
          examples: ['ls', 'ls -la', 'ls /home/user'],
          options: { '-l': 'long format', '-a': 'show hidden', '-h': 'human readable' }
        },
        cd: {
          description: 'Change directory',
          usage: 'cd [path]',
          examples: ['cd /home', 'cd ..', 'cd ~'],
          tips: 'Use .. for parent directory, ~ for home'
        },
        mkdir: {
          description: 'Create directory',
          usage: 'mkdir [options] directory',
          examples: ['mkdir newfolder', 'mkdir -p path/to/folder'],
          options: { '-p': 'create parent directories' }
        },
        rm: {
          description: 'Remove files or directories',
          usage: 'rm [options] path',
          examples: ['rm file.txt', 'rm -r folder'],
          options: { '-r': 'recursive', '-f': 'force' },
          warning: 'Be careful! This permanently deletes files.'
        },
        cp: {
          description: 'Copy files or directories',
          usage: 'cp [options] source dest',
          examples: ['cp file.txt copy.txt', 'cp -r folder newfolder'],
          options: { '-r': 'recursive' }
        },
        mv: {
          description: 'Move or rename files',
          usage: 'mv source dest',
          examples: ['mv old.txt new.txt', 'mv file.txt /home/user/']
        },
        cat: {
          description: 'Display file contents',
          usage: 'cat file',
          examples: ['cat file.txt', 'cat *.log']
        },
        grep: {
          description: 'Search text patterns',
          usage: 'grep [options] pattern [file]',
          examples: ['grep "error" log.txt', 'grep -r "TODO" .'],
          options: { '-i': 'case insensitive', '-r': 'recursive', '-n': 'line numbers' }
        },
        find: {
          description: 'Find files and directories',
          usage: 'find [path] [options]',
          examples: ['find . -name "*.js"', 'find /home -type f'],
          options: { '-name': 'name pattern', '-type': 'file type' }
        },
        ps: {
          description: 'List running processes',
          usage: 'ps [options]',
          examples: ['ps', 'ps aux'],
          options: { 'aux': 'all users, detailed' }
        },
        kill: {
          description: 'Terminate process',
          usage: 'kill [signal] pid',
          examples: ['kill 1234', 'kill -9 1234'],
          warning: 'This will stop the process immediately'
        },
        echo: {
          description: 'Display text',
          usage: 'echo text',
          examples: ['echo "Hello"', 'echo $PATH']
        },
        pwd: {
          description: 'Print working directory',
          usage: 'pwd',
          examples: ['pwd']
        },
        touch: {
          description: 'Create empty file or update timestamp',
          usage: 'touch file',
          examples: ['touch newfile.txt']
        },
        chmod: {
          description: 'Change file permissions',
          usage: 'chmod mode file',
          examples: ['chmod 755 script.sh', 'chmod +x file']
        },
        df: {
          description: 'Show disk space usage',
          usage: 'df [options]',
          examples: ['df', 'df -h'],
          options: { '-h': 'human readable' }
        },
        history: {
          description: 'Show command history',
          usage: 'history',
          examples: ['history', 'history 10']
        }
      }
    };
  }

  /**
   * Build command templates for common tasks
   */
  _buildCommandTemplates() {
    return {
      'file.search': {
        byName: (name) => `find . -name "*${name}*"`,
        byType: (ext) => `find . -name "*.${ext}"`,
        byContent: (text) => `grep -r "${text}" .`,
        recent: (days) => `find . -type f -mtime -${days}`
      },
      'file.create': {
        file: (name) => `touch "${name}"`,
        directory: (name) => `mkdir -p "${name}"`
      },
      'file.read': {
        full: (path) => `cat "${path}"`,
        head: (path, lines) => `head -n ${lines} "${path}"`,
        tail: (path, lines) => `tail -n ${lines} "${path}"`
      },
      'file.write': {
        overwrite: (path, content) => `echo "${content}" > "${path}"`,
        append: (path, content) => `echo "${content}" >> "${path}"`
      },
      'file.delete': {
        file: (path) => `rm "${path}"`,
        directory: (path) => `rm -r "${path}"`
      },
      'process.list': {
        all: () => 'ps aux',
        byName: (name) => `ps aux | grep "${name}"`
      },
      'process.kill': {
        byPid: (pid) => `kill ${pid}`,
        byName: (name) => `pkill "${name}"`
      },
      'system.disk': {
        usage: () => 'df -h',
        specific: (path) => `df -h "${path}"`
      }
    };
  }

  /**
   * Build context extractors
   */
  _buildContextExtractors() {
    return {
      fileExtension: (query) => {
        const extMatch = query.match(/\.([a-z0-9]+)\b/i);
        return extMatch ? extMatch[1] : null;
      },

      filePath: (query) => {
        const pathMatch = query.match(/(?:\/[\w-]+)+(?:\.[\w]+)?/);
        return pathMatch ? pathMatch[0] : null;
      },

      fileName: (query) => {
        const nameMatch = query.match(/["']([^"']+)["']|(\w+\.\w+)/);
        return nameMatch ? (nameMatch[1] || nameMatch[2]) : null;
      },

      processName: (query) => {
        const procMatch = query.match(/(?:process|app|application)\s+(?:named\s+)?["']?(\w+)["']?/i);
        return procMatch ? procMatch[1] : null;
      },

      number: (query) => {
        const numMatch = query.match(/\b(\d+)\b/);
        return numMatch ? parseInt(numMatch[1]) : null;
      },

      language: (query) => {
        const languages = ['javascript', 'python', 'java', 'cpp', 'c', 'html', 'css', 'rust', 'go'];
        for (const lang of languages) {
          if (query.toLowerCase().includes(lang)) {
            return lang;
          }
        }
        return null;
      }
    };
  }

  /**
   * Normalize query for processing
   */
  _normalizeQuery(query) {
    return query.trim().toLowerCase();
  }

  /**
   * Detect intent from query
   */
  _detectIntent(query) {
    let bestMatch = null;
    let highestScore = 0;

    for (const intent of this.intentPatterns) {
      for (const pattern of intent.patterns) {
        if (pattern.test(query)) {
          const score = intent.priority;
          if (score > highestScore) {
            highestScore = score;
            bestMatch = intent;
          }
        }
      }
    }

    return {
      type: bestMatch ? bestMatch.type : 'unknown',
      confidence: highestScore / 100,
      pattern: bestMatch
    };
  }

  /**
   * Extract entities from query
   */
  _extractEntities(query, intent) {
    const entities = {};

    // Extract based on intent type
    const intentType = intent.type.split('.')[0];

    switch (intentType) {
      case 'file':
        entities.extension = this.contextExtractors.fileExtension(query);
        entities.path = this.contextExtractors.filePath(query);
        entities.name = this.contextExtractors.fileName(query);
        break;

      case 'process':
        entities.processName = this.contextExtractors.processName(query);
        entities.pid = this.contextExtractors.number(query);
        break;

      case 'code':
        entities.language = this.contextExtractors.language(query);
        break;
    }

    // Extract general patterns
    const patterns = intent.pattern?.patterns || [];
    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        entities.matches = match.slice(1).filter(m => m);
        break;
      }
    }

    return entities;
  }

  /**
   * Gather OS context based on intent
   */
  async _gatherContext(intent, entities) {
    const context = {
      timestamp: new Date().toISOString(),
      intentType: intent.type
    };

    // Add OS-specific context
    if (this.osContext) {
      if (intent.type.startsWith('file.')) {
        context.currentDirectory = this.osContext.currentDirectory || '/home/user';
        context.fileSystem = this.osContext.fileSystem;
      }

      if (intent.type.startsWith('process.')) {
        context.processes = this.osContext.processes;
      }

      if (intent.type.startsWith('app.')) {
        context.applications = this.osContext.applications;
      }

      if (intent.type.startsWith('system.')) {
        context.systemInfo = this.osContext.systemInfo;
      }
    }

    return context;
  }

  /**
   * Generate response based on intent, entities, and context
   */
  async _generateResponse(intent, entities, context, originalQuery) {
    const intentHandlers = {
      // File operations
      'file.search': () => this._handleFileSearch(entities, context),
      'file.create': () => this._handleFileCreate(entities, context),
      'file.read': () => this._handleFileRead(entities, context),
      'file.write': () => this._handleFileWrite(entities, context),
      'file.delete': () => this._handleFileDelete(entities, context),
      'file.organize': () => this._handleFileOrganize(entities, context),

      // Process operations
      'process.list': () => this._handleProcessList(entities, context),
      'process.kill': () => this._handleProcessKill(entities, context),
      'process.start': () => this._handleProcessStart(entities, context),

      // Application operations
      'app.list': () => this._handleAppList(context),
      'app.info': () => this._handleAppInfo(entities, context),

      // Code operations
      'code.analyze': () => this._handleCodeAnalyze(entities, context),
      'code.generate': () => this._handleCodeGenerate(entities, context, originalQuery),
      'code.explain': () => this._handleCodeExplain(entities, context),
      'code.fix': () => this._handleCodeFix(entities, context),

      // Command operations
      'command.suggest': () => this._handleCommandSuggest(entities, context, originalQuery),
      'command.explain': () => this._handleCommandExplain(entities, context),

      // System operations
      'system.status': () => this._handleSystemStatus(context),
      'system.disk': () => this._handleSystemDisk(context),

      // Help operations
      'help.general': () => this._handleHelpGeneral(),
      'help.specific': () => this._handleHelpSpecific(entities, context),

      // Conversational
      'conversation.greeting': () => this._handleGreeting(),
      'conversation.thanks': () => this._handleThanks(),

      // Unknown
      'unknown': () => this._handleUnknown(originalQuery)
    };

    const handler = intentHandlers[intent.type] || intentHandlers['unknown'];
    return await handler();
  }

  // ========== Intent Handlers ==========

  _handleFileSearch(entities, context) {
    let command = '';
    let explanation = '';

    if (entities.extension) {
      command = this.commandTemplates['file.search'].byType(entities.extension);
      explanation = `This will search for all .${entities.extension} files in the current directory and subdirectories.`;
    } else if (entities.name) {
      command = this.commandTemplates['file.search'].byName(entities.name);
      explanation = `This will search for files matching "*${entities.name}*" in the current directory and subdirectories.`;
    } else if (entities.matches && entities.matches[0]) {
      const searchTerm = entities.matches[0];
      command = this.commandTemplates['file.search'].byName(searchTerm);
      explanation = `This will search for files matching "*${searchTerm}*" in the current directory and subdirectories.`;
    } else {
      command = 'ls -la';
      explanation = 'This will list all files in the current directory.';
    }

    return {
      text: `To search for files, use:\n\`${command}\`\n\n${explanation}`,
      contextUsed: ['fileSystem']
    };
  }

  _handleFileCreate(entities, context) {
    const target = entities.name || entities.matches?.[0] || 'newfile';
    const type = entities.matches?.[1] || 'file';

    let command;
    let explanation;

    if (type.includes('dir') || type.includes('folder')) {
      command = this.commandTemplates['file.create'].directory(target);
      explanation = `This will create a new directory named "${target}" (including parent directories if needed).`;
    } else {
      command = this.commandTemplates['file.create'].file(target);
      explanation = `This will create a new empty file named "${target}".`;
    }

    return {
      text: `To create a ${type}, use:\n\`${command}\`\n\n${explanation}`,
      contextUsed: ['currentDirectory']
    };
  }

  _handleFileRead(entities, context) {
    const target = entities.path || entities.name || entities.matches?.[0] || 'file.txt';
    const command = this.commandTemplates['file.read'].full(target);

    return {
      text: `To read the file, use:\n\`${command}\`\n\nThis will display the entire contents of "${target}".`,
      contextUsed: ['fileSystem']
    };
  }

  _handleFileWrite(entities, context) {
    const target = entities.matches?.[1] || entities.path || 'file.txt';
    const content = entities.matches?.[0] || 'content';

    const command = this.commandTemplates['file.write'].overwrite(target, content);

    return {
      text: `To write to the file, use:\n\`${command}\`\n\nThis will overwrite "${target}" with the specified content. Use >> instead of > to append.`,
      contextUsed: ['fileSystem']
    };
  }

  _handleFileDelete(entities, context) {
    const target = entities.path || entities.name || entities.matches?.[0] || 'file';

    let command = this.commandTemplates['file.delete'].file(target);

    return {
      text: `⚠️  To delete the file, use:\n\`${command}\`\n\n**Warning:** This will permanently delete "${target}". Add -r flag for directories.`,
      contextUsed: ['fileSystem']
    };
  }

  _handleFileOrganize(entities, context) {
    const target = entities.path || entities.matches?.[0] || '.';

    const suggestions = [
      `# Organize files by type:`,
      `mkdir -p images docs code`,
      `mv *.{jpg,png,gif} images/`,
      `mv *.{pdf,txt,md} docs/`,
      `mv *.{js,py,java} code/`,
      ``,
      `# Or organize by date:`,
      `find ${target} -type f -printf '%TY-%Tm\\t%p\\n' | sort -r`
    ];

    return {
      text: suggestions.join('\n'),
      contextUsed: ['fileSystem']
    };
  }

  _handleProcessList(entities, context) {
    const command = this.commandTemplates['process.list'].all();

    let text = `To list all running processes, use:\n\`${command}\`\n\nThis shows all processes with detailed information.`;

    if (context.processes && context.processes.length > 0) {
      text += `\n\nCurrently running processes (${context.processes.length}):\n`;
      context.processes.slice(0, 10).forEach(proc => {
        text += `\n• ${proc.name} (PID: ${proc.pid})`;
      });
      if (context.processes.length > 10) {
        text += `\n• ... and ${context.processes.length - 10} more`;
      }
    }

    return {
      text,
      contextUsed: ['processes']
    };
  }

  _handleProcessKill(entities, context) {
    let command;
    let target;

    if (entities.pid) {
      command = this.commandTemplates['process.kill'].byPid(entities.pid);
      target = `process ${entities.pid}`;
    } else if (entities.processName) {
      command = this.commandTemplates['process.kill'].byName(entities.processName);
      target = entities.processName;
    } else if (entities.matches?.[0]) {
      command = this.commandTemplates['process.kill'].byName(entities.matches[0]);
      target = entities.matches[0];
    } else {
      return {
        text: 'Please specify which process to kill (by name or PID).\n\nExample: `kill 1234` or `pkill firefox`',
        contextUsed: []
      };
    }

    return {
      text: `⚠️  To kill ${target}, use:\n\`${command}\`\n\n**Warning:** This will terminate the process immediately. Use -9 for force kill.`,
      contextUsed: ['processes']
    };
  }

  _handleProcessStart(entities, context) {
    const appName = entities.matches?.[0] || 'application';

    return {
      text: `To launch ${appName}, you can:\n\n1. Click on it in the application menu\n2. Use the command: \`${appName}\`\n3. Open it through the file explorer\n\nAvailable applications can be found in the app menu.`,
      contextUsed: ['applications']
    };
  }

  _handleAppList(context) {
    const apps = Object.entries(this.knowledgeBase.applications)
      .map(([id, app]) => `• **${app.name}** - ${app.description}`);

    return {
      text: `**Available Applications:**\n\n${apps.join('\n')}\n\nYou can launch any of these from the application menu or by using their command.`,
      contextUsed: ['applications']
    };
  }

  _handleAppInfo(entities, context) {
    const appQuery = entities.matches?.[0]?.toLowerCase() || '';

    // Find matching app
    let app = null;
    let appId = null;

    for (const [id, appData] of Object.entries(this.knowledgeBase.applications)) {
      if (id.includes(appQuery) || appData.name.toLowerCase().includes(appQuery)) {
        app = appData;
        appId = id;
        break;
      }
    }

    if (!app) {
      return {
        text: `I don't have information about "${appQuery}". Try asking about: Terminal, File Explorer, Text Editor, Task Manager, Settings, or Browser.`,
        contextUsed: []
      };
    }

    return {
      text: `**${app.name}**\n\n${app.description}\n\n**Capabilities:**\n${app.capabilities.map(c => `• ${c}`).join('\n')}\n\n**Usage:**\n${app.usage}`,
      contextUsed: ['applications']
    };
  }

  _handleCodeAnalyze(entities, context) {
    return {
      text: `To analyze code, I can help you:\n\n` +
        `1. **Find bugs** - I'll scan for common issues and anti-patterns\n` +
        `2. **Check quality** - Measure complexity, maintainability, and style\n` +
        `3. **Security scan** - Identify potential vulnerabilities\n` +
        `4. **Performance** - Suggest optimizations\n\n` +
        `Please provide the code you'd like me to analyze, or specify a file path.`,
      contextUsed: []
    };
  }

  _handleCodeGenerate(entities, context, originalQuery) {
    const description = entities.matches?.[0] || 'function';
    const language = entities.language || 'javascript';

    // Generate simple code templates based on common patterns
    const templates = {
      sort: {
        javascript: `function sortArray(arr) {\n  return arr.sort((a, b) => a - b);\n}`,
        python: `def sort_array(arr):\n    return sorted(arr)`
      },
      filter: {
        javascript: `function filterArray(arr, condition) {\n  return arr.filter(condition);\n}`,
        python: `def filter_array(arr, condition):\n    return [x for x in arr if condition(x)]`
      },
      map: {
        javascript: `function mapArray(arr, transform) {\n  return arr.map(transform);\n}`,
        python: `def map_array(arr, transform):\n    return [transform(x) for x in arr]`
      },
      http: {
        javascript: `async function fetchData(url) {\n  const response = await fetch(url);\n  return response.json();\n}`,
        python: `import requests\n\ndef fetch_data(url):\n    response = requests.get(url)\n    return response.json()`
      },
      default: {
        javascript: `// ${description}\nfunction ${description.replace(/\s+/g, '_')}() {\n  // TODO: Implement ${description}\n}`,
        python: `# ${description}\ndef ${description.replace(/\s+/g, '_')}():\n    # TODO: Implement ${description}\n    pass`
      }
    };

    // Match template
    let template = templates.default;
    for (const [key, value] of Object.entries(templates)) {
      if (originalQuery.includes(key)) {
        template = value;
        break;
      }
    }

    const code = template[language] || template.javascript;

    return {
      text: `Here's a ${language} ${description}:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nYou can customize this template to fit your specific needs.`,
      contextUsed: []
    };
  }

  _handleCodeExplain(entities, context) {
    return {
      text: `To explain code, please provide:\n\n` +
        `1. The code snippet you want explained\n` +
        `2. Or a file path to analyze\n\n` +
        `I'll break down:\n` +
        `• What the code does\n` +
        `• How it works\n` +
        `• Key concepts used\n` +
        `• Potential improvements`,
      contextUsed: []
    };
  }

  _handleCodeFix(entities, context) {
    return {
      text: `To fix bugs, I can help with:\n\n` +
        `1. **Syntax errors** - Missing semicolons, brackets, etc.\n` +
        `2. **Logic errors** - Incorrect conditions, infinite loops\n` +
        `3. **Runtime errors** - Null references, type mismatches\n` +
        `4. **Performance issues** - Inefficient algorithms\n\n` +
        `Please provide:\n` +
        `• The error message or description\n` +
        `• The problematic code\n` +
        `• What you expected to happen`,
      contextUsed: []
    };
  }

  _handleCommandSuggest(entities, context, originalQuery) {
    const task = entities.matches?.[0] || originalQuery;

    // Common task patterns
    const taskMap = {
      'find files': 'find . -name "pattern"',
      'search': 'grep -r "text" .',
      'copy': 'cp source dest',
      'move': 'mv source dest',
      'delete': 'rm file',
      'create directory': 'mkdir dirname',
      'change directory': 'cd path',
      'list files': 'ls -la',
      'read file': 'cat file',
      'edit file': 'nano file',
      'check disk': 'df -h',
      'show processes': 'ps aux',
      'kill process': 'kill pid',
      'download': 'wget url',
      'compress': 'tar -czf archive.tar.gz files',
      'extract': 'tar -xzf archive.tar.gz',
      'permissions': 'chmod 755 file',
      'owner': 'chown user:group file'
    };

    // Find best match
    let bestCommand = null;
    for (const [key, cmd] of Object.entries(taskMap)) {
      if (task.includes(key)) {
        bestCommand = cmd;
        break;
      }
    }

    if (bestCommand) {
      const cmdInfo = this.knowledgeBase.commands[bestCommand.split(' ')[0]];
      let response = `To ${task}, use:\n\`${bestCommand}\``;

      if (cmdInfo) {
        response += `\n\n**${cmdInfo.description}**\n\nUsage: \`${cmdInfo.usage}\``;
        if (cmdInfo.examples) {
          response += `\n\nExamples:\n${cmdInfo.examples.map(ex => `• \`${ex}\``).join('\n')}`;
        }
      }

      return { text: response, contextUsed: ['commands'] };
    }

    return {
      text: `For "${task}", here are some common approaches:\n\n` +
        `• Use \`ls\` to list files\n` +
        `• Use \`find\` to search for files\n` +
        `• Use \`grep\` to search within files\n` +
        `• Use \`cd\` to navigate directories\n\n` +
        `Can you be more specific about what you want to do?`,
      contextUsed: ['commands']
    };
  }

  _handleCommandExplain(entities, context) {
    const cmdName = entities.matches?.[0]?.split(' ')[0] || '';
    const cmdInfo = this.knowledgeBase.commands[cmdName];

    if (cmdInfo) {
      let text = `**${cmdName}** - ${cmdInfo.description}\n\n` +
        `**Usage:** \`${cmdInfo.usage}\``;

      if (cmdInfo.examples) {
        text += `\n\n**Examples:**\n${cmdInfo.examples.map(ex => `• \`${ex}\``).join('\n')}`;
      }

      if (cmdInfo.options) {
        text += `\n\n**Common Options:**\n${Object.entries(cmdInfo.options).map(([opt, desc]) => `• \`${opt}\` - ${desc}`).join('\n')}`;
      }

      if (cmdInfo.warning) {
        text += `\n\n⚠️  **Warning:** ${cmdInfo.warning}`;
      }

      if (cmdInfo.tips) {
        text += `\n\n💡 **Tip:** ${cmdInfo.tips}`;
      }

      return { text, contextUsed: ['commands'] };
    }

    return {
      text: `I don't have detailed information about "${cmdName}". Try using \`man ${cmdName}\` or \`${cmdName} --help\` for more information.`,
      contextUsed: []
    };
  }

  _handleSystemStatus(context) {
    let status = `**System Status**\n\n`;

    if (context.systemInfo) {
      status += `• **Platform:** ${context.systemInfo.platform || 'Linux'}\n`;
      status += `• **Uptime:** ${context.systemInfo.uptime || 'Unknown'}\n`;
      status += `• **Memory:** ${context.systemInfo.memory || 'Unknown'}\n`;
    }

    if (context.processes) {
      status += `• **Running Processes:** ${context.processes.length}\n`;
    }

    status += `\nSystem is running normally. Use \`top\` or Task Manager for detailed monitoring.`;

    return {
      text: status,
      contextUsed: ['systemInfo', 'processes']
    };
  }

  _handleSystemDisk(context) {
    const command = this.commandTemplates['system.disk'].usage();

    return {
      text: `To check disk space, use:\n\`${command}\`\n\nThis shows disk usage in human-readable format (GB, MB, etc.).\n\n` +
        `• **Used** - Space currently used\n` +
        `• **Available** - Free space remaining\n` +
        `• **Capacity** - Percentage used`,
      contextUsed: ['systemInfo']
    };
  }

  _handleHelpGeneral() {
    return {
      text: `**WebOS AI Assistant** 🤖\n\n` +
        `I can help you with:\n\n` +
        `**📁 File Operations**\n` +
        `• Search, create, read, write, delete files\n` +
        `• Organize and manage directories\n\n` +
        `**⚙️ Process Management**\n` +
        `• List and monitor processes\n` +
        `• Start and stop applications\n\n` +
        `**💻 Code Assistance**\n` +
        `• Generate code snippets\n` +
        `• Analyze and debug code\n` +
        `• Explain code functionality\n\n` +
        `**🔧 System Commands**\n` +
        `• Suggest commands for tasks\n` +
        `• Explain command usage\n` +
        `• System monitoring\n\n` +
        `**📱 Applications**\n` +
        `• Information about available apps\n` +
        `• Launch and manage applications\n\n` +
        `Just ask me what you need help with!`,
      contextUsed: []
    };
  }

  _handleHelpSpecific(entities, context) {
    const topic = entities.matches?.[0] || '';

    // Redirect to appropriate handler
    if (topic.includes('file') || topic.includes('folder')) {
      return this._handleAppInfo({ matches: ['fileexplorer'] }, context);
    } else if (topic.includes('terminal') || topic.includes('command')) {
      return this._handleAppInfo({ matches: ['terminal'] }, context);
    } else if (topic.includes('code') || topic.includes('edit')) {
      return this._handleAppInfo({ matches: ['texteditor'] }, context);
    } else if (topic.includes('process') || topic.includes('task')) {
      return this._handleAppInfo({ matches: ['taskmanager'] }, context);
    }

    return {
      text: `What would you like help with regarding "${topic}"?\n\n` +
        `I can provide information about:\n` +
        `• Applications and their features\n` +
        `• File and directory operations\n` +
        `• Terminal commands\n` +
        `• Code development\n` +
        `• System management`,
      contextUsed: []
    };
  }

  _handleGreeting() {
    const greetings = [
      "Hello! I'm your WebOS AI Assistant. How can I help you today?",
      "Hi there! Ready to assist with your OS tasks. What do you need?",
      "Greetings! I'm here to help with files, code, commands, and more. What can I do for you?",
      "Hey! Your AI assistant is ready. What would you like to accomplish?"
    ];

    return {
      text: greetings[Math.floor(Math.random() * greetings.length)],
      contextUsed: []
    };
  }

  _handleThanks() {
    const responses = [
      "You're welcome! Let me know if you need anything else.",
      "Happy to help! Feel free to ask if you have more questions.",
      "Anytime! I'm here whenever you need assistance.",
      "Glad I could help! Don't hesitate to reach out again."
    ];

    return {
      text: responses[Math.floor(Math.random() * responses.length)],
      contextUsed: []
    };
  }

  _handleUnknown(query) {
    return {
      text: `I'm not sure how to help with that. I can assist with:\n\n` +
        `• **File operations** - search, create, read, write, delete\n` +
        `• **Process management** - list, start, stop processes\n` +
        `• **Code assistance** - generate, analyze, debug code\n` +
        `• **Commands** - suggest and explain terminal commands\n` +
        `• **System info** - status, disk usage, performance\n\n` +
        `Try asking "help" for more information, or rephrase your question.`,
      contextUsed: []
    };
  }

  /**
   * Update conversation history
   */
  _updateHistory(query, response) {
    this.conversationHistory.push({
      timestamp: new Date().toISOString(),
      query,
      response: response.text,
      intent: response.intent
    });

    // Keep last 50 exchanges
    if (this.conversationHistory.length > 50) {
      this.conversationHistory = this.conversationHistory.slice(-50);
    }
  }

  /**
   * Get conversation history
   */
  getHistory() {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Update OS context (called from OS when state changes)
   */
  updateOSContext(newContext) {
    this.osContext = { ...this.osContext, ...newContext };
  }

  /**
   * Set user preferences
   */
  setPreferences(preferences) {
    this.userPreferences = { ...this.userPreferences, ...preferences };
  }
}
