/**
 * Enhanced Code Runner with Multi-Language Runtime Support
 * Now supports JavaScript, TypeScript, Python, Ruby, PHP, SQL, and more!
 */

import { RuntimeManager, SUPPORTED_LANGUAGES, getLanguageInfo } from '../../system/runtime/index.ts';

export default class CodeRunnerEnhanced {
  constructor(context) {
    this.context = context;
    this.editor = null;
    this.outputDiv = null;
    this.language = 'javascript';
    this.runtimeManager = RuntimeManager.getInstance();
    this.isRunning = false;

    // Initialize default code templates
    this.savedCode = {};
    SUPPORTED_LANGUAGES.forEach(lang => {
      this.savedCode[lang.id] = this.getDefaultCode(lang.id);
    });
  }

  async init() {
    // Initialize runtime manager
    // Runtimes will be loaded lazily on first use
  }

  render() {
    const container = document.createElement('div');
    container.className = 'code-runner-container';
    container.style.cssText = 'display:flex;flex-direction:column;height:100%;background:#1e1e1e;';

    // Enhanced Toolbar
    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'padding:10px;background:#2d2d2d;border-bottom:1px solid #444;display:flex;gap:10px;align-items:center;flex-wrap:wrap;';

    // Language selector with all supported languages
    const langSelect = document.createElement('select');
    langSelect.style.cssText = 'padding:8px 12px;background:#3a3a3a;color:#fff;border:1px solid #555;border-radius:4px;cursor:pointer;font-size:13px;min-width:180px;';

    SUPPORTED_LANGUAGES.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.id;
      option.textContent = `${lang.icon} ${lang.name} (${lang.version})`;
      langSelect.appendChild(option);
    });

    langSelect.addEventListener('change', () => {
      this.switchLanguage(langSelect.value);
    });

    const runBtn = this._createButton('▶️ Run Code', () => this.runCode(), '#4CAF50', '#45a049');
    const clearBtn = this._createButton('🗑️ Clear', () => this.clearOutput(), '#f44336', '#da190b');
    const resetBtn = this._createButton('↺ Reset', () => this.resetCode(), '#FF9800', '#e68900');

    const saveBtn = this._createButton('💾 Save', async () => {
      const filename = prompt('Save as:', `code.${this.getFileExtension()}`);
      if (filename) {
        try {
          await this.context.fs.writeFile(`/home/user/${filename}`, this.editor.value, { encoding: 'utf8' });
          this.log('✓ Code saved successfully!', 'success');
        } catch (error) {
          this.log(`✗ Error saving: ${error.message}`, 'error');
        }
      }
    }, '#2196F3', '#0b7dda');

    const loadBtn = this._createButton('📁 Load', async () => {
      const filename = prompt('Enter file path:', '/home/user/');
      if (filename) {
        try {
          const content = await this.context.fs.readFile(filename, { encoding: 'utf8' });
          this.editor.value = content;
          this.log('✓ File loaded successfully!', 'success');
        } catch (error) {
          this.log(`✗ Error loading: ${error.message}`, 'error');
        }
      }
    }, '#9C27B0', '#7b1fa2');

    // Runtime status indicator
    this.statusIndicator = document.createElement('div');
    this.statusIndicator.style.cssText = 'padding:6px 12px;background:#3a3a3a;border-radius:4px;font-size:12px;color:#aaa;display:flex;align-items:center;gap:6px;margin-left:auto;';
    this.updateStatusIndicator();

    toolbar.appendChild(langSelect);
    toolbar.appendChild(runBtn);
    toolbar.appendChild(clearBtn);
    toolbar.appendChild(resetBtn);
    toolbar.appendChild(saveBtn);
    toolbar.appendChild(loadBtn);
    toolbar.appendChild(this.statusIndicator);

    // Main content area - split view
    const content = document.createElement('div');
    content.style.cssText = 'flex:1;display:flex;overflow:hidden;';

    // Editor pane
    const editorPane = document.createElement('div');
    editorPane.style.cssText = 'flex:1;display:flex;flex-direction:column;border-right:1px solid #444;';

    const editorHeader = document.createElement('div');
    editorHeader.style.cssText = 'padding:8px 12px;background:#2d2d2d;color:#aaa;font-size:12px;border-bottom:1px solid #444;display:flex;justify-content:space-between;align-items:center;';

    const editorTitle = document.createElement('span');
    editorTitle.textContent = '📝 Code Editor';

    this.languageInfo = document.createElement('span');
    this.languageInfo.style.cssText = 'font-size:11px;color:#888;';
    this.updateLanguageInfo();

    editorHeader.appendChild(editorTitle);
    editorHeader.appendChild(this.languageInfo);

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
      // Ctrl+Enter to run
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        this.runCode();
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

  updateStatusIndicator() {
    if (!this.statusIndicator) return;

    const runtime = this.runtimeManager.getRuntime(this.language);
    const isLoaded = runtime?.loaded || false;

    const statusDot = isLoaded ? '🟢' : '🔴';
    const statusText = isLoaded ? 'Runtime Loaded' : 'Runtime Not Loaded';

    this.statusIndicator.innerHTML = `${statusDot} ${statusText}`;
  }

  updateLanguageInfo() {
    if (!this.languageInfo) return;

    const info = getLanguageInfo(this.language);
    if (info) {
      this.languageInfo.textContent = `${info.name} ${info.version} • ${info.extension}`;
    }
  }

  switchLanguage(lang) {
    // Save current code
    this.savedCode[this.language] = this.editor.value;

    // Switch language
    this.language = lang;
    this.editor.value = this.savedCode[lang];

    this.clearOutput();
    this.updateStatusIndicator();
    this.updateLanguageInfo();

    const info = getLanguageInfo(lang);
    this.log(`Switched to ${info?.icon} ${info?.name} ${info?.version}`, 'info');
  }

  async runCode() {
    if (this.isRunning) {
      this.log('⚠️ Code is already running...', 'warning');
      return;
    }

    const code = this.editor.value.trim();
    if (!code) {
      this.log('⚠️ No code to execute', 'warning');
      return;
    }

    this.clearOutput();
    this.isRunning = true;
    this.log(`Running ${getLanguageInfo(this.language)?.name} code...`, 'info');

    try {
      // Check if runtime is loaded
      const runtime = this.runtimeManager.getRuntime(this.language);
      if (!runtime?.loaded) {
        this.log(`🔄 Loading ${getLanguageInfo(this.language)?.name} runtime...`, 'info');
        await this.runtimeManager.initializeRuntime(this.language);
        this.updateStatusIndicator();
        this.log(`✓ Runtime loaded successfully!`, 'success');
      }

      // Execute code
      const startTime = performance.now();
      const result = await this.runtimeManager.execute(this.language, code);
      const endTime = performance.now();

      // Display output
      if (result.output) {
        this.log(result.output, result.success ? 'log' : 'error');
      }

      // Display error if any
      if (result.error) {
        this.log(`\n❌ Error:\n${result.error}`, 'error');
      }

      // Display execution summary
      const executionTime = result.executionTime || (endTime - startTime);
      const statusIcon = result.success ? '✓' : '✗';
      const statusText = result.success ? 'Success' : 'Failed';
      const statusColor = result.success ? 'success' : 'error';

      this.log(`\n${statusIcon} ${statusText} • Execution time: ${executionTime.toFixed(2)}ms`, statusColor);

      // Special handling for HTML (render in iframe)
      if (this.language === 'html' && result.success && result.output) {
        this.renderHTML(code);
      }

    } catch (error) {
      this.log(`\n❌ Execution Error:\n${error.message}`, 'error');
      if (error.stack) {
        this.log(`\nStack trace:\n${error.stack}`, 'error');
      }
    } finally {
      this.isRunning = false;
    }
  }

  renderHTML(htmlCode) {
    // Add a separator
    const separator = document.createElement('div');
    separator.style.cssText = 'margin:15px 0;padding:8px;background:#2d2d2d;color:#aaa;font-size:12px;';
    separator.textContent = '🌐 HTML Preview:';
    this.outputDiv.appendChild(separator);

    // Create iframe for HTML preview
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:100%;min-height:300px;border:1px solid #444;border-radius:4px;background:#fff;';
    this.outputDiv.appendChild(iframe);

    // Write HTML to iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(htmlCode);
    iframeDoc.close();
  }

  clearOutput() {
    this.outputDiv.innerHTML = '';
  }

  resetCode() {
    if (confirm('Reset code to default template?')) {
      this.editor.value = this.getDefaultCode(this.language);
      this.clearOutput();
      this.log('Code reset to default template', 'info');
    }
  }

  getDefaultCode(lang) {
    const templates = {
      javascript: `// JavaScript Example
console.log('Hello from JavaScript!');

// Functions
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('Fibonacci(10):', fibonacci(10));

// Array methods
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log('Doubled:', doubled);

// Async/await
async function fetchData() {
  return 'Data loaded!';
}

fetchData().then(console.log);`,

      typescript: `// TypeScript Example
interface Person {
  name: string;
  age: number;
}

const greet = (person: Person): string => {
  return \`Hello, \${person.name}! You are \${person.age} years old.\`;
};

const user: Person = { name: 'Alice', age: 30 };
console.log(greet(user));

// Generics
function identity<T>(arg: T): T {
  return arg;
}

console.log('Identity:', identity<number>(42));`,

      python: `# Python Example
print('Hello from Python!')

# List comprehension
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
print('Doubled:', doubled)

# Function
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print('Fibonacci(10):', fibonacci(10))

# Dictionary
person = {'name': 'Alice', 'age': 30}
print(f"Hello, {person['name']}!")`,

      ruby: `# Ruby Example
puts 'Hello from Ruby!'

# Array operations
numbers = [1, 2, 3, 4, 5]
doubled = numbers.map { |n| n * 2 }
puts "Doubled: #{doubled.inspect}"

# Method
def fibonacci(n)
  return n if n <= 1
  fibonacci(n - 1) + fibonacci(n - 2)
end

puts "Fibonacci(10): #{fibonacci(10)}"

# Hash
person = { name: 'Alice', age: 30 }
puts "Hello, #{person[:name]}!"`,

      php: `<?php
// PHP Example
echo "Hello from PHP!\\n";

// Function
function fibonacci($n) {
    if ($n <= 1) return $n;
    return fibonacci($n - 1) + fibonacci($n - 2);
}

echo "Fibonacci(10): " . fibonacci(10) . "\\n";

// Array
$numbers = [1, 2, 3, 4, 5];
$doubled = array_map(fn($n) => $n * 2, $numbers);
echo "Doubled: " . json_encode($doubled) . "\\n";

// Associative array
$person = ['name' => 'Alice', 'age' => 30];
echo "Hello, {$person['name']}!\\n";
?>`,

      sql: `-- SQLite Example
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    age INTEGER
);

INSERT INTO users (name, email, age) VALUES
    ('Alice', 'alice@example.com', 30),
    ('Bob', 'bob@example.com', 25),
    ('Charlie', 'charlie@example.com', 35);

SELECT * FROM users WHERE age >= 30 ORDER BY age DESC;`,

      html: `<!DOCTYPE html>
<html>
<head>
    <title>Code Runner</title>
    <style>
        body {
            font-family: 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            margin: 0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        button {
            padding: 10px 20px;
            background: rgba(255,255,255,0.2);
            border: 2px solid white;
            color: white;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background: rgba(255,255,255,0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Enhanced Code Runner</h1>
        <p>Now with multi-language support!</p>
        <button onclick="alert('Hello from JavaScript!')">Click Me</button>
    </div>
</body>
</html>`,
    };

    return templates[lang] || `// ${lang} example\nconsole.log('Hello from ${lang}!');`;
  }

  getFileExtension() {
    const info = getLanguageInfo(this.language);
    return info?.extension.replace('.', '') || 'txt';
  }

  log(message, type = 'log') {
    const line = document.createElement('div');
    line.style.cssText = 'margin-bottom:5px;padding:5px 8px;border-left:3px solid #555;padding-left:10px;border-radius:2px;';

    const colors = {
      log: '#d4d4d4',
      error: '#f44336',
      warning: '#ff9800',
      success: '#4CAF50',
      info: '#2196F3'
    };

    const bgColors = {
      log: 'transparent',
      error: 'rgba(244, 67, 54, 0.1)',
      warning: 'rgba(255, 152, 0, 0.1)',
      success: 'rgba(76, 175, 80, 0.1)',
      info: 'rgba(33, 150, 243, 0.1)'
    };

    line.style.borderLeftColor = colors[type] || colors.log;
    line.style.color = colors[type] || colors.log;
    line.style.background = bgColors[type] || bgColors.log;

    line.textContent = message;

    this.outputDiv.appendChild(line);
    this.outputDiv.scrollTop = this.outputDiv.scrollHeight;
  }

  _createButton(text, onClick, bgColor = '#3a3a3a', hoverColor = '#4a4a4a') {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `padding:8px 14px;cursor:pointer;background:${bgColor};color:#fff;border:none;border-radius:4px;transition:all 0.2s;font-size:13px;font-weight:500;`;
    button.addEventListener('mouseenter', () => {
      button.style.background = hoverColor;
      button.style.transform = 'translateY(-1px)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = bgColor;
      button.style.transform = 'translateY(0)';
    });
    button.addEventListener('click', onClick);
    return button;
  }
}
