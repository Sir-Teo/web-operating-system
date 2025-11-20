export default class CodeRunner {
  constructor(context) {
    this.context = context;
    this.editor = null;
    this.outputDiv = null;
    this.language = 'javascript';
    this.savedCode = {
      javascript: '// Write your JavaScript code here\nconsole.log("Hello, World!");',
      html: '<!-- Write your HTML here -->\n<h1>Hello, World!</h1>\n<p>This is a paragraph.</p>',
      python: '# Python syntax highlighting (execution not supported)\nprint("Hello, World!")',
      css: '/* Write your CSS here */\nbody {\n  background: #f0f0f0;\n  font-family: Arial;\n}'
    };
  }

  async init() {
    // Initialize code runner
  }

  render() {
    const container = document.createElement('div');
    container.className = 'code-runner-container';
    container.style.cssText = 'display:flex;flex-direction:column;height:100%;background:#1e1e1e;';

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'padding:10px;background:#2d2d2d;border-bottom:1px solid #444;display:flex;gap:10px;align-items:center;';

    // Language selector
    const langSelect = document.createElement('select');
    langSelect.style.cssText = 'padding:8px 12px;background:#3a3a3a;color:#fff;border:1px solid #555;border-radius:4px;cursor:pointer;font-size:13px;';

    const languages = [
      { value: 'javascript', label: 'JavaScript', icon: '🟨' },
      { value: 'html', label: 'HTML', icon: '🌐' },
      { value: 'css', label: 'CSS', icon: '🎨' },
      { value: 'python', label: 'Python (view only)', icon: '🐍' }
    ];

    languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.value;
      option.textContent = `${lang.icon} ${lang.label}`;
      langSelect.appendChild(option);
    });

    langSelect.addEventListener('change', () => {
      this.switchLanguage(langSelect.value);
    });

    const runBtn = this._createButton('▶️ Run', () => this.runCode(), '#4CAF50', '#45a049');
    const clearBtn = this._createButton('🗑️ Clear Output', () => this.clearOutput(), '#f44336', '#da190b');
    const resetBtn = this._createButton('↺ Reset Code', () => this.resetCode(), '#FF9800', '#e68900');

    const saveBtn = this._createButton('💾 Save', async () => {
      const filename = prompt('Save as:', `code.${this.getFileExtension()}`);
      if (filename) {
        try {
          await this.context.fs.writeFile(`/home/user/${filename}`, this.editor.value, { encoding: 'utf8' });
          alert('Code saved successfully!');
        } catch (error) {
          alert(`Error saving: ${error.message}`);
        }
      }
    }, '#2196F3', '#0b7dda');

    const loadBtn = this._createButton('📁 Load', async () => {
      const filename = prompt('Enter file path:', '/home/user/');
      if (filename) {
        try {
          const content = await this.context.fs.readFile(filename, { encoding: 'utf8' });
          this.editor.value = content;
        } catch (error) {
          alert(`Error loading: ${error.message}`);
        }
      }
    }, '#9C27B0', '#7b1fa2');

    toolbar.appendChild(langSelect);
    toolbar.appendChild(runBtn);
    toolbar.appendChild(clearBtn);
    toolbar.appendChild(resetBtn);
    toolbar.appendChild(saveBtn);
    toolbar.appendChild(loadBtn);

    // Main content area - split view
    const content = document.createElement('div');
    content.style.cssText = 'flex:1;display:flex;overflow:hidden;';

    // Editor pane
    const editorPane = document.createElement('div');
    editorPane.style.cssText = 'flex:1;display:flex;flex-direction:column;border-right:1px solid #444;';

    const editorHeader = document.createElement('div');
    editorHeader.style.cssText = 'padding:8px 12px;background:#2d2d2d;color:#aaa;font-size:12px;border-bottom:1px solid #444;';
    editorHeader.textContent = '📝 Code Editor';

    this.editor = document.createElement('textarea');
    this.editor.className = 'code-editor';
    this.editor.style.cssText = 'flex:1;padding:15px;background:#1e1e1e;color:#d4d4d4;border:none;outline:none;font-family:"Consolas","Monaco","Courier New",monospace;font-size:14px;resize:none;line-height:1.6;tab-size:2;';
    this.editor.spellcheck = false;
    this.editor.value = this.savedCode[this.language];

    // Tab key handling
    this.editor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        this.editor.value = this.editor.value.substring(0, start) + '  ' + this.editor.value.substring(end);
        this.editor.selectionStart = this.editor.selectionEnd = start + 2;
      }
    });

    editorPane.appendChild(editorHeader);
    editorPane.appendChild(this.editor);

    // Output pane
    const outputPane = document.createElement('div');
    outputPane.style.cssText = 'flex:1;display:flex;flex-direction:column;';

    const outputHeader = document.createElement('div');
    outputHeader.style.cssText = 'padding:8px 12px;background:#2d2d2d;color:#aaa;font-size:12px;border-bottom:1px solid #444;';
    outputHeader.textContent = '📊 Output';

    this.outputDiv = document.createElement('div');
    this.outputDiv.className = 'code-output';
    this.outputDiv.style.cssText = 'flex:1;padding:15px;background:#1e1e1e;color:#d4d4d4;font-family:"Consolas","Monaco","Courier New",monospace;font-size:13px;overflow-y:auto;white-space:pre-wrap;word-wrap:break-word;';

    outputPane.appendChild(outputHeader);
    outputPane.appendChild(this.outputDiv);

    content.appendChild(editorPane);
    content.appendChild(outputPane);

    container.appendChild(toolbar);
    container.appendChild(content);

    return container;
  }

  switchLanguage(lang) {
    // Save current code
    this.savedCode[this.language] = this.editor.value;

    // Switch language
    this.language = lang;
    this.editor.value = this.savedCode[lang];

    this.clearOutput();
    this.log(`Switched to ${lang.toUpperCase()}`, 'info');
  }

  runCode() {
    this.clearOutput();

    if (this.language === 'javascript') {
      this.runJavaScript();
    } else if (this.language === 'html') {
      this.runHTML();
    } else if (this.language === 'css') {
      this.log('CSS cannot be executed standalone. Use HTML mode to include CSS.', 'warning');
    } else if (this.language === 'python') {
      this.log('Python execution is not supported in the browser. This is for syntax reference only.', 'warning');
    }
  }

  runJavaScript() {
    const code = this.editor.value;

    // Capture console output
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    try {
      console.log = (...args) => {
        this.log(args.map(arg => this.formatValue(arg)).join(' '), 'log');
        originalLog.apply(console, args);
      };

      console.error = (...args) => {
        this.log(args.map(arg => this.formatValue(arg)).join(' '), 'error');
        originalError.apply(console, args);
      };

      console.warn = (...args) => {
        this.log(args.map(arg => this.formatValue(arg)).join(' '), 'warning');
        originalWarn.apply(console, args);
      };

      // Execute code
      const result = eval(code);

      // Show return value if not undefined
      if (result !== undefined) {
        this.log(`Return value: ${this.formatValue(result)}`, 'success');
      }

      if (this.outputDiv.textContent.trim() === '') {
        this.log('Code executed successfully (no output)', 'success');
      }
    } catch (error) {
      this.log(`Error: ${error.message}`, 'error');
      if (error.stack) {
        this.log(error.stack, 'error');
      }
    } finally {
      // Restore console
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    }
  }

  runHTML() {
    const code = this.editor.value;

    // Clear output and create iframe
    this.outputDiv.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:100%;height:100%;border:none;background:#fff;';

    this.outputDiv.appendChild(iframe);

    // Write HTML to iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(code);
    iframeDoc.close();
  }

  clearOutput() {
    this.outputDiv.innerHTML = '';
  }

  resetCode() {
    if (confirm('Reset code to default template?')) {
      this.editor.value = this.getDefaultCode(this.language);
      this.clearOutput();
    }
  }

  getDefaultCode(lang) {
    const defaults = {
      javascript: '// Write your JavaScript code here\nconsole.log("Hello, World!");\n\n// Try some examples:\nconst sum = (a, b) => a + b;\nconsole.log("2 + 3 =", sum(2, 3));\n\nconst numbers = [1, 2, 3, 4, 5];\nconsole.log("Sum of array:", numbers.reduce((a, b) => a + b, 0));',
      html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Code Runner</title>\n  <style>\n    body {\n      font-family: Arial, sans-serif;\n      padding: 20px;\n      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n      color: white;\n    }\n    .container {\n      background: rgba(255,255,255,0.1);\n      padding: 30px;\n      border-radius: 10px;\n    }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <h1>Hello, World!</h1>\n    <p>This is a code runner example.</p>\n    <button onclick="alert(\'Button clicked!\')">Click Me</button>\n  </div>\n</body>\n</html>',
      python: '# Python syntax highlighting (execution not supported)\n\ndef greet(name):\n    print(f"Hello, {name}!")\n\ngreet("World")\n\n# List comprehension\nnumbers = [x**2 for x in range(10)]\nprint(numbers)',
      css: '/* Write your CSS here */\n\nbody {\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  font-family: Arial, sans-serif;\n  color: white;\n}\n\n.container {\n  max-width: 800px;\n  margin: 50px auto;\n  padding: 30px;\n  background: rgba(255,255,255,0.1);\n  border-radius: 10px;\n}'
    };
    return defaults[lang] || '';
  }

  getFileExtension() {
    const extensions = {
      javascript: 'js',
      html: 'html',
      python: 'py',
      css: 'css'
    };
    return extensions[this.language] || 'txt';
  }

  formatValue(value) {
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  log(message, type = 'log') {
    const line = document.createElement('div');
    line.style.cssText = 'margin-bottom:5px;padding:5px;border-left:3px solid #555;padding-left:10px;';

    const colors = {
      log: '#d4d4d4',
      error: '#f44336',
      warning: '#ff9800',
      success: '#4CAF50',
      info: '#2196F3'
    };

    line.style.borderLeftColor = colors[type] || colors.log;
    line.style.color = colors[type] || colors.log;

    const timestamp = new Date().toLocaleTimeString();
    const prefix = document.createElement('span');
    prefix.textContent = `[${timestamp}] `;
    prefix.style.cssText = 'color:#888;font-size:11px;';

    line.appendChild(prefix);
    line.appendChild(document.createTextNode(message));

    this.outputDiv.appendChild(line);
    this.outputDiv.scrollTop = this.outputDiv.scrollHeight;
  }

  _createButton(text, onClick, bgColor = '#3a3a3a', hoverColor = '#4a4a4a') {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `padding:8px 14px;cursor:pointer;background:${bgColor};color:#fff;border:none;border-radius:4px;transition:background 0.2s;font-size:13px;font-weight:500;`;
    button.addEventListener('mouseenter', () => {
      button.style.background = hoverColor;
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = bgColor;
    });
    button.addEventListener('click', onClick);
    return button;
  }
}
