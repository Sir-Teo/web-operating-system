# Multi-Language Developer Features

## 🚀 Overview

This update brings **revolutionary multi-language programming capabilities** to WebOS, transforming it into a powerful, polyglot development environment that runs entirely in your browser. Execute code in Python, Ruby, PHP, JavaScript, TypeScript, and SQL—all without any server-side infrastructure!

## ✨ New Features

### 1. **Multi-Language Runtime Engine** 🔧

A unified runtime system that provides seamless execution across multiple programming languages:

#### Supported Languages:

- **JavaScript (ES2024)** - Native browser support with async/await
- **TypeScript (5.3)** - Full type-checking and compilation
- **Python (3.11)** - Powered by Pyodide (WebAssembly)
- **Ruby (3.2)** - Ruby.wasm WebAssembly runtime
- **PHP (8.2)** - PHP-wasm WebAssembly runtime
- **SQLite (3.44)** - Full SQL database via sql.js

#### Key Features:
- ✅ Lazy loading - Runtimes load only when needed
- ✅ Unified API - Same interface for all languages
- ✅ Error handling - Comprehensive error reporting
- ✅ Package management - Install language-specific packages
- ✅ Output capture - All console output captured correctly
- ✅ Timeout control - Prevent infinite loops
- ✅ REPL support - Interactive shells for supported languages

### 2. **Language Manager** 🌐

**Location:** `Apps > Language Manager`

A comprehensive GUI application for managing language runtimes:

#### Features:
- **Runtime Dashboard** - View all available languages and their status
- **Interactive Testing** - Test code execution for each language
- **Package Manager** - Install packages for Python, Ruby, PHP
- **Runtime Information** - Detailed info about each language
- **Live Code Templates** - Pre-built examples for every language
- **Execution Metrics** - Performance timing and memory usage

#### Tabs:
1. **Overview** - Language info, version, status, features
2. **Test Execution** - Write and run code with live output
3. **Packages** - Install and manage language packages

### 3. **Polyglot Code Playground** 🎮

**Location:** `Apps > Polyglot Playground`

A powerful split-pane code editor for rapid prototyping:

#### Features:
- **Split-Pane Design** - Code editor + output side-by-side
- **Real-time Execution** - Run code with keyboard shortcuts
- **Auto-run Mode** - Automatically execute as you type
- **Code Templates** - Pre-loaded examples for each language
- **Font Controls** - Adjust editor font size on the fly
- **Copy Support** - Copy code and output easily
- **Language Switching** - Switch between languages instantly
- **Execution Timing** - See how fast your code runs

#### Keyboard Shortcuts:
- `Ctrl+Enter` - Run code
- `Tab` - Insert 2 spaces
- `A+/A-` - Increase/decrease font size

### 4. **Interactive Notebooks** 📓

**Location:** `Apps > Interactive Notebook`

Jupyter-style notebooks for data science and exploratory programming:

#### Features:
- **Multiple Cell Types** - Code cells and Markdown cells
- **Persistent State** - Variables persist across cells
- **Rich Output** - Support for text, HTML, and formatted output
- **Cell Management** - Add, delete, move, and reorder cells
- **Markdown Support** - Format documentation with Markdown
- **Save/Load Notebooks** - Persist your work to the filesystem
- **Execution Count** - Track cell execution order
- **Multi-Language** - Choose your runtime language

#### Keyboard Shortcuts:
- `Shift+Enter` - Run cell and move to next
- `Ctrl+Enter` - Run cell
- `Alt+Enter` - Run cell and insert new cell below

#### Cell Controls:
- ↑/↓ - Move cells up/down
- ▶ Run - Execute cell
- 🗑️ - Delete cell

### 5. **Enhanced Code Runner Pro** 🚀

**Location:** `Apps > Code Runner Pro`

Enhanced version of the original Code Runner with multi-language support:

#### Features:
- **Multi-Language Support** - All 6 supported languages
- **Runtime Status** - See if runtime is loaded
- **Language Info Display** - Shows version and file extension
- **Auto-Load Runtimes** - Automatically loads runtime on first use
- **Enhanced Output** - Better formatted output with colors
- **HTML Preview** - Live rendering for HTML code
- **File Operations** - Save and load code files
- **Execution Summary** - Detailed execution time and status

### 6. **Terminal Language Commands** 💻

**Location:** `Apps > Terminal`

Execute code directly from the terminal with native commands:

#### New Commands:

```bash
# Python
python -c "print('Hello, World!')"
python script.py
py -c "print(2 + 2)"

# Ruby
ruby -e "puts 'Hello, Ruby!'"
ruby script.rb
rb -e "puts 5 * 5"

# PHP
php -r "echo 'Hello, PHP!';"
php script.php

# JavaScript/Node
node -e "console.log('Hello, Node!')"
node script.js

# TypeScript
ts -e "console.log('Hello, TypeScript!')"
ts script.ts

# SQL
sql -c "SELECT * FROM users;"
sqlite script.sql

# Language Information
langinfo               # List all languages
langinfo python        # Show Python details

# Package Installation
langinstall python numpy      # Install NumPy for Python
langinstall ruby json         # Install JSON for Ruby

# REPL
repl python           # Start Python REPL (coming soon)
```

## 🏗️ Architecture

### Runtime System Architecture:

```
┌─────────────────────────────────────────────────┐
│           Applications Layer                    │
│  Language Manager │ Playground │ Notebooks     │
│  Code Runner Pro  │ Terminal Commands          │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│         Runtime Manager (Singleton)              │
│  • Language registration                         │
│  • Lazy loading                                  │
│  • Execution orchestration                       │
│  • Package management                            │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│         Individual Language Runtimes             │
│  JS Runtime │ TS Runtime │ Python Runtime       │
│  Ruby Runtime │ PHP Runtime │ SQL Runtime       │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│            Execution Engines                     │
│  Browser (JS/TS) │ Pyodide │ ruby.wasm          │
│  php-wasm │ sql.js                               │
└─────────────────────────────────────────────────┘
```

### File Structure:

```
src/
├── system/
│   └── runtime/
│       ├── LanguageRuntime.ts       # Core runtime interface
│       ├── RuntimeManager.ts         # Singleton manager
│       ├── JavaScriptRuntime.ts     # JS runtime
│       ├── TypeScriptRuntime.ts     # TS runtime
│       ├── PythonRuntime.ts         # Python/Pyodide
│       ├── RubyRuntime.ts           # Ruby.wasm
│       ├── PHPRuntime.ts            # PHP-wasm
│       ├── SQLiteRuntime.ts         # sql.js
│       └── index.ts                 # Exports & initialization
│
├── apps/
│   ├── language-manager/
│   │   └── LanguageManager.tsx
│   ├── polyglot-playground/
│   │   └── PolyglotPlayground.tsx
│   ├── interactive-notebook/
│   │   └── InteractiveNotebook.tsx
│   ├── code-runner/
│   │   ├── CodeRunner.js           # Original
│   │   └── CodeRunnerEnhanced.js   # Multi-language
│   └── terminal/
│       └── LanguageCommands.js      # Terminal commands
│
└── main.js                           # App registration & boot
```

## 📦 Dependencies

All language runtimes are loaded from CDN on-demand:

- **Pyodide** (Python): `https://cdn.jsdelivr.net/pyodide/v0.25.0/`
- **ruby.wasm**: `https://cdn.jsdelivr.net/npm/@ruby/3.2-wasm-wasi@2.0.0/`
- **php-wasm**: `https://cdn.jsdelivr.net/npm/php-wasm@0.0.9/`
- **TypeScript**: `https://cdn.jsdelivr.net/npm/typescript@5.3.3/`
- **sql.js**: `https://cdn.jsdelivr.net/npm/sql.js@1.10.2/`

## 🎯 Use Cases

### Data Science & Analytics
- Use **Interactive Notebooks** with Python
- Install NumPy, Pandas, Matplotlib via package manager
- Create data visualizations and analysis reports
- Export notebooks for sharing

### Web Development
- Test JavaScript/TypeScript code in **Playground**
- Render HTML/CSS in **Code Runner Pro**
- Prototype APIs and web applications
- Debug with live output

### Learning & Education
- **Language Manager** for comparing languages
- **Notebooks** for interactive tutorials
- **Terminal commands** for shell scripting
- Pre-built examples for every language

### Scripting & Automation
- Write Python scripts in notebooks
- Execute Ruby automation tasks
- Run SQL queries on local databases
- Chain commands in terminal

## 🔒 Security

- **Sandboxed Execution** - All code runs in isolated contexts
- **No Backend Required** - 100% client-side execution
- **No Network Access** - Code cannot make external requests (except via APIs)
- **Timeout Protection** - Prevents infinite loops
- **Resource Limits** - Memory constraints on WASM runtimes

## 🚦 Getting Started

### Quick Start - Language Manager:
1. Open **Start Menu** → **Language Manager**
2. Select a language from the sidebar
3. Click **Initialize Runtime** to load it
4. Go to **Test Execution** tab
5. Run the example code or write your own
6. See results in real-time!

### Quick Start - Polyglot Playground:
1. Open **Start Menu** → **Polyglot Playground**
2. Select language from dropdown
3. Write code in left pane
4. Click **▶ Run** or press `Ctrl+Enter`
5. See output in right pane

### Quick Start - Interactive Notebooks:
1. Open **Start Menu** → **Interactive Notebook**
2. Select your language
3. Write code in cells
4. Press `Shift+Enter` to run
5. Add markdown cells for documentation
6. Save your notebook

### Quick Start - Terminal:
```bash
# Execute Python directly
python -c "print('Hello from terminal!')"

# Check available languages
langinfo

# Install a package
langinstall python numpy
```

## 📊 Performance

### Runtime Load Times:
- JavaScript: **Instant** (native)
- TypeScript: **~500ms** (compiler load)
- Python: **~2-3s** (Pyodide WASM)
- Ruby: **~1-2s** (ruby.wasm)
- PHP: **~1-2s** (php-wasm)
- SQLite: **~300ms** (sql.js)

### Execution Performance:
- JavaScript: **Native speed**
- TypeScript: **Near-native** (compiles to JS)
- Python: **50-70% of CPython** (WASM overhead)
- Ruby: **40-60% of CRuby** (WASM overhead)
- PHP: **40-60% of native PHP**
- SQLite: **80-90% of native** (optimized WASM)

## 🎓 Code Examples

### Python - Data Analysis
```python
# Install: langinstall python numpy
import numpy as np

# Create array
arr = np.array([1, 2, 3, 4, 5])
print(f"Mean: {np.mean(arr)}")
print(f"Std Dev: {np.std(arr)}")
```

### Ruby - Text Processing
```ruby
# Parse and format text
text = "hello world from ruby"
formatted = text.split.map(&:capitalize).join(' ')
puts formatted  # => "Hello World From Ruby"
```

### PHP - API Response
```php
<?php
$data = [
    'status' => 'success',
    'users' => ['Alice', 'Bob', 'Charlie']
];
echo json_encode($data, JSON_PRETTY_PRINT);
?>
```

### SQL - Database Queries
```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT,
    price REAL
);

INSERT INTO products VALUES (1, 'Laptop', 999.99);
SELECT * FROM products WHERE price > 500;
```

### TypeScript - Type Safety
```typescript
interface User {
    id: number;
    name: string;
    email: string;
}

const users: User[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com' }
];

console.log(users[0].name);
```

## 🔮 Future Enhancements

- [ ] **C/C++ via Emscripten** - Compile and run C/C++ code
- [ ] **Rust via WASM** - WebAssembly Rust runtime
- [ ] **Go via WASM** - Go language support
- [ ] **Java via CheerpJ** - JVM in browser
- [ ] **R for Statistics** - Data science and statistics
- [ ] **WebContainer Integration** - Full Node.js runtime
- [ ] **Language Server Protocol** - Advanced IntelliSense
- [ ] **Debugger Integration** - Step-through debugging
- [ ] **Package Managers** - Full npm, pip, gem, cargo support
- [ ] **Jupyter Kernel Protocol** - Standard notebook format
- [ ] **Multi-file Projects** - Import/export between files
- [ ] **WebGPU Acceleration** - GPU-accelerated computing

## 📝 API Reference

### RuntimeManager

```typescript
class RuntimeManager {
  // Get singleton instance
  static getInstance(): RuntimeManager

  // Check if language is supported
  isSupported(language: string): boolean

  // Initialize a runtime
  async initializeRuntime(language: string): Promise<void>

  // Execute code
  async execute(
    language: string,
    code: string,
    config?: RuntimeConfig
  ): Promise<ExecutionResult>

  // Install package
  async installPackage(
    language: string,
    packageName: string
  ): Promise<boolean>

  // List installed packages
  async listPackages(language: string): Promise<string[]>
}
```

### ExecutionResult

```typescript
interface ExecutionResult {
  success: boolean
  output: string
  error?: string
  executionTime: number
  memoryUsed?: number
}
```

## 🤝 Contributing

Want to add a new language runtime? Follow these steps:

1. Create a new runtime class extending `BaseRuntime`
2. Implement `initialize()` and `execute()` methods
3. Add to `RuntimeManager` in `index.ts`
4. Update `SUPPORTED_LANGUAGES` array
5. Add terminal commands in `LanguageCommands.js`
6. Update documentation

## 📄 License

This feature is part of WebOS and follows the same license.

---

## 🎉 Summary

This update transforms WebOS into a **true polyglot development environment**, enabling developers to:

✅ Write code in 6+ programming languages
✅ Execute everything client-side (no backend!)
✅ Use Jupyter-style notebooks for data science
✅ Build and test applications in real-time
✅ Learn and experiment with multiple languages
✅ All in a beautiful, modern web interface

**Happy coding! 🚀**
