/**
 * ExampleFileGenerator - Creates sample files for WebOS demonstration
 *
 * Generates diverse file types to showcase OS capabilities:
 * - Code files (JavaScript, Python, HTML, CSS)
 * - Documents (Markdown, Text, JSON, XML)
 * - Configuration files
 * - Sample data files
 */

export class ExampleFileGenerator {
  constructor(vfs) {
    this.vfs = vfs;
    this.exampleFiles = this._buildExampleFiles();
  }

  /**
   * Generate all example files in the file system
   */
  async generateAll(options = {}) {
    const baseDir = options.baseDir || '/home/user';
    const results = {
      created: [],
      errors: [],
      total: 0
    };

    console.log('[ExampleFileGenerator] Generating example files...');

    for (const [path, content] of Object.entries(this.exampleFiles)) {
      try {
        const fullPath = `${baseDir}${path}`;

        // Create directory if needed
        const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
        await this._ensureDirectory(dirPath);

        // Create file
        await this.vfs.writeFile(fullPath, content);
        results.created.push(fullPath);
        results.total++;

        console.log(`[ExampleFileGenerator] Created: ${fullPath}`);
      } catch (error) {
        console.error(`[ExampleFileGenerator] Failed to create ${path}:`, error);
        results.errors.push({ path, error: error.message });
      }
    }

    console.log(`[ExampleFileGenerator] Complete: ${results.created.length} files created`);
    return results;
  }

  /**
   * Generate specific category of files
   */
  async generateCategory(category, options = {}) {
    const baseDir = options.baseDir || '/home/user';
    const categoryFiles = Object.entries(this.exampleFiles)
      .filter(([path]) => path.includes(`/${category}/`));

    const results = { created: [], errors: [] };

    for (const [path, content] of categoryFiles) {
      try {
        const fullPath = `${baseDir}${path}`;
        const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
        await this._ensureDirectory(dirPath);
        await this.vfs.writeFile(fullPath, content);
        results.created.push(fullPath);
      } catch (error) {
        results.errors.push({ path, error: error.message });
      }
    }

    return results;
  }

  /**
   * Build all example files
   */
  _buildExampleFiles() {
    return {
      // Code Examples
      '/examples/code/hello-world.js': this._getJavaScriptExample(),
      '/examples/code/calculator.py': this._getPythonExample(),
      '/examples/code/todo-app.html': this._getHTMLExample(),
      '/examples/code/styles.css': this._getCSSExample(),
      '/examples/code/server.js': this._getNodeServerExample(),
      '/examples/code/data-processor.js': this._getAdvancedJSExample(),

      // Documents
      '/examples/documents/README.md': this._getReadmeExample(),
      '/examples/documents/tutorial.md': this._getTutorialExample(),
      '/examples/documents/notes.txt': this._getTextNotesExample(),
      '/examples/documents/project-plan.md': this._getProjectPlanExample(),

      // Configuration files
      '/examples/config/package.json': this._getPackageJsonExample(),
      '/examples/config/.gitignore': this._getGitignoreExample(),
      '/examples/config/tsconfig.json': this._getTsConfigExample(),
      '/examples/config/.env.example': this._getEnvExample(),
      '/examples/config/webpack.config.js': this._getWebpackConfigExample(),

      // Data files
      '/examples/data/users.json': this._getUsersDataExample(),
      '/examples/data/products.json': this._getProductsDataExample(),
      '/examples/data/sample.xml': this._getXMLExample(),
      '/examples/data/data.csv': this._getCSVExample(),

      // Scripts
      '/examples/scripts/backup.sh': this._getBackupScriptExample(),
      '/examples/scripts/deploy.sh': this._getDeployScriptExample(),
      '/examples/scripts/setup.sh': this._getSetupScriptExample(),

      // Starter templates
      '/templates/react-component.jsx': this._getReactComponentExample(),
      '/templates/express-api.js': this._getExpressAPIExample(),
      '/templates/python-class.py': this._getPythonClassExample(),

      // Sample projects
      '/projects/todo-list/index.html': this._getTodoAppHTML(),
      '/projects/todo-list/app.js': this._getTodoAppJS(),
      '/projects/todo-list/style.css': this._getTodoAppCSS(),

      // Documentation
      '/docs/api-reference.md': this._getAPIDocsExample(),
      '/docs/contributing.md': this._getContributingExample(),
      '/docs/changelog.md': this._getChangelogExample(),
    };
  }

  // ========== Code Examples ==========

  _getJavaScriptExample() {
    return `// Hello World in JavaScript
console.log("Hello, World!");

// Function example
function greet(name) {
  return \`Hello, \${name}!\`;
}

// Arrow function
const add = (a, b) => a + b;

// Class example
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  introduce() {
    console.log(\`Hi, I'm \${this.name} and I'm \${this.age} years old.\`);
  }
}

// Usage
const person = new Person("Alice", 30);
person.introduce();
console.log(add(5, 3));
`;
  }

  _getPythonExample() {
    return `# Simple Calculator in Python

def add(a, b):
    """Add two numbers"""
    return a + b

def subtract(a, b):
    """Subtract b from a"""
    return a - b

def multiply(a, b):
    """Multiply two numbers"""
    return a * b

def divide(a, b):
    """Divide a by b"""
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b

# Class example
class Calculator:
    def __init__(self):
        self.history = []

    def calculate(self, a, b, operation):
        """Perform calculation and store in history"""
        result = None

        if operation == '+':
            result = add(a, b)
        elif operation == '-':
            result = subtract(a, b)
        elif operation == '*':
            result = multiply(a, b)
        elif operation == '/':
            result = divide(a, b)

        self.history.append(f"{a} {operation} {b} = {result}")
        return result

# Usage
if __name__ == "__main__":
    calc = Calculator()
    print(calc.calculate(10, 5, '+'))  # 15
    print(calc.calculate(10, 5, '-'))  # 5
    print(calc.calculate(10, 5, '*'))  # 50
    print(calc.calculate(10, 5, '/'))  # 2.0
`;
  }

  _getHTMLExample() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simple Todo App</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>📝 Todo List</h1>

        <div class="input-section">
            <input type="text" id="todoInput" placeholder="Add a new task...">
            <button onclick="addTodo()">Add</button>
        </div>

        <ul id="todoList"></ul>
    </div>

    <script>
        function addTodo() {
            const input = document.getElementById('todoInput');
            const text = input.value.trim();

            if (text) {
                const li = document.createElement('li');
                li.textContent = text;
                li.onclick = function() {
                    this.classList.toggle('completed');
                };

                document.getElementById('todoList').appendChild(li);
                input.value = '';
            }
        }

        // Add on Enter key
        document.getElementById('todoInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addTodo();
            }
        });
    </script>
</body>
</html>
`;
  }

  _getCSSExample() {
    return `/* Modern CSS Styles */

:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --background: #f7fafc;
    --text-color: #2d3748;
    --border-radius: 8px;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.container {
    background: white;
    border-radius: var(--border-radius);
    padding: 2rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 100%;
}

h1 {
    color: var(--text-color);
    margin-bottom: 1.5rem;
    text-align: center;
}

.input-section {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
}

input[type="text"] {
    flex: 1;
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: var(--border-radius);
    font-size: 1rem;
    transition: border-color 0.3s;
}

input[type="text"]:focus {
    outline: none;
    border-color: var(--primary-color);
}

button {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: white;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: 1rem;
    transition: transform 0.2s;
}

button:hover {
    transform: translateY(-2px);
}

ul {
    list-style: none;
}

li {
    padding: 1rem;
    background: #f7fafc;
    margin-bottom: 0.5rem;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all 0.3s;
}

li:hover {
    background: #edf2f7;
    transform: translateX(5px);
}

li.completed {
    text-decoration: line-through;
    opacity: 0.6;
}
`;
  }

  _getNodeServerExample() {
    return `// Express.js Server Example
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// In-memory data store
let todos = [
  { id: 1, text: 'Learn Node.js', completed: false },
  { id: 2, text: 'Build an API', completed: false }
];

// Routes
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

app.post('/api/todos', (req, res) => {
  const todo = {
    id: todos.length + 1,
    text: req.body.text,
    completed: false
  };
  todos.push(todo);
  res.status(201).json(todo);
});

app.put('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const todo = todos.find(t => t.id === id);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  todo.text = req.body.text || todo.text;
  todo.completed = req.body.completed !== undefined ? req.body.completed : todo.completed;

  res.json(todo);
});

app.delete('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  todos = todos.filter(t => t.id !== id);
  res.status(204).send();
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;
  }

  _getAdvancedJSExample() {
    return `// Advanced JavaScript: Data Processor
class DataProcessor {
  constructor(data) {
    this.data = data;
    this.cache = new Map();
  }

  // Filter data with memoization
  filter(predicate) {
    const key = predicate.toString();

    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const result = this.data.filter(predicate);
    this.cache.set(key, result);
    return result;
  }

  // Map with async operations
  async mapAsync(mapper) {
    const promises = this.data.map(mapper);
    return await Promise.all(promises);
  }

  // Reduce with error handling
  reduce(reducer, initialValue) {
    try {
      return this.data.reduce(reducer, initialValue);
    } catch (error) {
      console.error('Reduce operation failed:', error);
      return initialValue;
    }
  }

  // Group by property
  groupBy(key) {
    return this.data.reduce((groups, item) => {
      const groupKey = item[key];
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {});
  }

  // Statistical operations
  stats(key) {
    const values = this.data.map(item => item[key]).filter(v => typeof v === 'number');

    return {
      count: values.length,
      sum: values.reduce((a, b) => a + b, 0),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }

  // Chain operations
  pipe(...operations) {
    return operations.reduce((result, operation) => {
      return operation(result);
    }, this.data);
  }
}

// Usage example
const data = [
  { name: 'Alice', age: 30, department: 'Engineering' },
  { name: 'Bob', age: 25, department: 'Sales' },
  { name: 'Charlie', age: 35, department: 'Engineering' },
  { name: 'Diana', age: 28, department: 'Sales' }
];

const processor = new DataProcessor(data);

console.log('Age statistics:', processor.stats('age'));
console.log('By department:', processor.groupBy('department'));
console.log('Engineers:', processor.filter(p => p.department === 'Engineering'));

export default DataProcessor;
`;
  }

  // ========== Document Examples ==========

  _getReadmeExample() {
    return `# WebOS - Browser-Based Operating System

A fully-functional operating system running entirely in your web browser.

## 🚀 Features

- **Virtual File System** - Persistent storage using OPFS and IndexedDB
- **Process Management** - Run multiple applications simultaneously
- **Window Manager** - Draggable, resizable windows with minimize/maximize
- **Terminal** - Full-featured command-line interface with 40+ commands
- **AI Assistant** - State-of-the-art AI with conversational memory
- **Built-in Apps** - File Explorer, Text Editor, Calculator, and more

## 📁 Project Structure

\`\`\`
webos/
├── src/
│   ├── core/          # Core OS components
│   ├── apps/          # Built-in applications
│   ├── ai/            # AI assistant system
│   └── utils/         # Utility functions
├── public/            # Static assets
└── docs/              # Documentation
\`\`\`

## 🛠️ Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/yourusername/webos.git

# Install dependencies
cd webos
npm install

# Start development server
npm start
\`\`\`

## 📖 Usage

Open your browser and navigate to \`http://localhost:3000\`

Try these commands in the terminal:
- \`ls\` - List files
- \`help\` - Show all available commands
- \`ai "how do I..."\` - Ask the AI assistant

## 🤝 Contributing

Contributions are welcome! Please read CONTRIBUTING.md for details.

## 📄 License

MIT License - see LICENSE file for details
`;
  }

  _getTutorialExample() {
    return `# WebOS Tutorial: Getting Started

## Introduction

Welcome to WebOS! This tutorial will guide you through the basics of using the operating system.

## Lesson 1: Using the Terminal

The terminal is a powerful way to interact with WebOS.

### Basic Commands

1. **List files**: \`ls\`
2. **Change directory**: \`cd directory_name\`
3. **Create file**: \`touch filename.txt\`
4. **Read file**: \`cat filename.txt\`
5. **Delete file**: \`rm filename.txt\`

### Example Session

\`\`\`bash
$ ls
Documents  Downloads  Pictures

$ cd Documents
$ touch notes.txt
$ echo "Hello WebOS" > notes.txt
$ cat notes.txt
Hello WebOS
\`\`\`

## Lesson 2: File Management

Learn to organize your files effectively.

### Creating Folders

\`\`\`bash
mkdir my-project
cd my-project
mkdir src docs tests
\`\`\`

### Moving Files

\`\`\`bash
mv file.txt Documents/
cp file.txt backup.txt
\`\`\`

## Lesson 3: Using the AI Assistant

The AI assistant can help with tasks.

\`\`\`bash
$ ai "how do I find all JavaScript files?"
To search for JavaScript files, use:
  find . -name "*.js"
\`\`\`

## Next Steps

- Explore the File Explorer app
- Try the Text Editor for coding
- Check out the example files in /examples

Happy exploring! 🚀
`;
  }

  _getTextNotesExample() {
    return `WebOS Development Notes
======================

Project Ideas:
- Add syntax highlighting to text editor
- Implement collaborative editing
- Create a package manager
- Add theme customization

Bug Fixes Needed:
- Window dragging sometimes glitches
- Terminal history not persisting
- File permissions not fully implemented

Features to Add:
- Multi-tab terminal
- Split-screen windows
- Keyboard shortcuts
- Cloud sync

Research Topics:
- WebAssembly for performance
- Web Workers for background tasks
- IndexedDB optimization
- Progressive Web App capabilities

Meeting Notes (2024-01-15):
- Discussed AI assistant improvements
- Planned file upload feature
- Reviewed performance metrics
- Set sprint goals

Useful Commands:
- find . -name "*.js" -type f
- grep -r "TODO" .
- ps aux | grep node
- df -h

Remember:
- Always test in multiple browsers
- Write unit tests for new features
- Update documentation
- Code review before merging
`;
  }

  _getProjectPlanExample() {
    return `# WebOS Development Roadmap

## Q1 2024

### January
- [x] Implement virtual file system
- [x] Add basic process management
- [x] Create window manager
- [ ] Add multi-user support

### February
- [ ] Implement permissions system
- [ ] Add encryption for sensitive files
- [ ] Create backup/restore functionality
- [ ] Optimize performance

### March
- [ ] Launch beta version
- [ ] Gather user feedback
- [ ] Fix critical bugs
- [ ] Write comprehensive docs

## Q2 2024

### Features
1. **Networking**
   - WebSocket support
   - Fetch API integration
   - REST client

2. **Applications**
   - Code editor with LSP
   - Git client
   - Database viewer
   - Media player

3. **Developer Tools**
   - Built-in debugger
   - Performance profiler
   - Log viewer
   - Testing framework

## Success Metrics

- Performance: Page load < 2s
- Uptime: 99.9%
- User satisfaction: 4.5+ stars
- Active users: 10,000+

## Resources Needed

- 2 Frontend developers
- 1 Backend developer
- 1 UX designer
- Cloud hosting budget: $500/month
`;
  }

  // ========== Configuration Examples ==========

  _getPackageJsonExample() {
    return JSON.stringify({
      "name": "webos-project",
      "version": "1.0.0",
      "description": "A browser-based operating system",
      "main": "index.js",
      "scripts": {
        "start": "webpack serve --mode development",
        "build": "webpack --mode production",
        "test": "jest",
        "lint": "eslint src/**/*.js"
      },
      "keywords": ["os", "web", "browser", "javascript"],
      "author": "WebOS Team",
      "license": "MIT",
      "dependencies": {
        "express": "^4.18.0",
        "react": "^18.2.0",
        "react-dom": "^18.2.0"
      },
      "devDependencies": {
        "webpack": "^5.75.0",
        "webpack-cli": "^5.0.0",
        "webpack-dev-server": "^4.11.0",
        "babel-loader": "^9.1.0",
        "@babel/core": "^7.20.0",
        "@babel/preset-react": "^7.18.0",
        "eslint": "^8.30.0",
        "jest": "^29.3.0"
      }
    }, null, 2);
  }

  _getGitignoreExample() {
    return `# Dependencies
node_modules/
package-lock.json
yarn.lock

# Build outputs
dist/
build/
*.min.js
*.min.css

# Environment variables
.env
.env.local
.env.production

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*

# Testing
coverage/
.nyc_output/

# Temporary files
tmp/
temp/
*.tmp
`;
  }

  _getTsConfigExample() {
    return JSON.stringify({
      "compilerOptions": {
        "target": "ES2020",
        "module": "ESNext",
        "lib": ["ES2020", "DOM"],
        "jsx": "react",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "moduleResolution": "node",
        "resolveJsonModule": true,
        "isolatedModules": true,
        "noEmit": true,
        "sourceMap": true,
        "baseUrl": ".",
        "paths": {
          "@/*": ["src/*"]
        }
      },
      "include": ["src"],
      "exclude": ["node_modules", "build", "dist"]
    }, null, 2);
  }

  _getEnvExample() {
    return `# Application Configuration
APP_NAME=WebOS
APP_ENV=development
APP_PORT=3000

# Database (if using)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=webos_db
DB_USER=webos_user
DB_PASSWORD=change_me

# API Keys (never commit real keys!)
API_KEY=your_api_key_here
SECRET_KEY=your_secret_key_here

# Features
ENABLE_AI_ASSISTANT=true
ENABLE_CLOUD_SYNC=false
MAX_FILE_SIZE=10485760

# Logging
LOG_LEVEL=debug
LOG_FILE=./logs/app.log
`;
  }

  _getWebpackConfigExample() {
    return `const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react']
          }
        }
      },
      {
        test: /\\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html'
    })
  ],
  devServer: {
    static: './dist',
    hot: true,
    port: 3000
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
};
`;
  }

  // ========== Data Examples ==========

  _getUsersDataExample() {
    return JSON.stringify({
      "users": [
        {
          "id": 1,
          "name": "Alice Johnson",
          "email": "alice@example.com",
          "role": "admin",
          "active": true,
          "created": "2024-01-15T10:30:00Z"
        },
        {
          "id": 2,
          "name": "Bob Smith",
          "email": "bob@example.com",
          "role": "user",
          "active": true,
          "created": "2024-01-16T14:20:00Z"
        },
        {
          "id": 3,
          "name": "Charlie Brown",
          "email": "charlie@example.com",
          "role": "user",
          "active": false,
          "created": "2024-01-17T09:15:00Z"
        }
      ]
    }, null, 2);
  }

  _getProductsDataExample() {
    return JSON.stringify({
      "products": [
        {
          "id": "P001",
          "name": "Laptop",
          "category": "Electronics",
          "price": 999.99,
          "stock": 50,
          "specs": {
            "brand": "TechCorp",
            "cpu": "Intel i7",
            "ram": "16GB",
            "storage": "512GB SSD"
          }
        },
        {
          "id": "P002",
          "name": "Wireless Mouse",
          "category": "Accessories",
          "price": 29.99,
          "stock": 200,
          "specs": {
            "brand": "MouseCo",
            "wireless": true,
            "dpi": 1600
          }
        },
        {
          "id": "P003",
          "name": "Mechanical Keyboard",
          "category": "Accessories",
          "price": 149.99,
          "stock": 75,
          "specs": {
            "brand": "KeyMaster",
            "switches": "Cherry MX Blue",
            "backlight": "RGB"
          }
        }
      ]
    }, null, 2);
  }

  _getXMLExample() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <book id="1">
    <title>Learning JavaScript</title>
    <author>John Doe</author>
    <year>2023</year>
    <price>29.99</price>
    <category>Programming</category>
  </book>
  <book id="2">
    <title>Web Development Guide</title>
    <author>Jane Smith</author>
    <year>2024</year>
    <price>39.99</price>
    <category>Web</category>
  </book>
  <book id="3">
    <title>Python Masterclass</title>
    <author>Bob Johnson</author>
    <year>2023</year>
    <price>34.99</price>
    <category>Programming</category>
  </book>
</catalog>
`;
  }

  _getCSVExample() {
    return `id,name,department,salary,start_date
1,Alice Johnson,Engineering,95000,2022-01-15
2,Bob Smith,Sales,75000,2021-06-20
3,Charlie Brown,Engineering,88000,2023-03-10
4,Diana Prince,Marketing,82000,2022-09-01
5,Eve Davis,Engineering,92000,2020-11-15
6,Frank Miller,Sales,70000,2023-01-05
7,Grace Lee,Marketing,79000,2021-08-12
8,Henry Wilson,Engineering,97000,2019-04-22
`;
  }

  // ========== Scripts ==========

  _getBackupScriptExample() {
    return `#!/bin/bash
# Backup Script for WebOS

DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="./backups"
SOURCE_DIR="./src"
BACKUP_FILE="backup_$DATE.tar.gz"

echo "Creating backup..."
mkdir -p $BACKUP_DIR

tar -czf "$BACKUP_DIR/$BACKUP_FILE" $SOURCE_DIR

echo "Backup created: $BACKUP_FILE"
echo "Size: $(du -h $BACKUP_DIR/$BACKUP_FILE | cut -f1)"

# Keep only last 7 backups
cd $BACKUP_DIR
ls -t | tail -n +8 | xargs -r rm

echo "Cleanup complete. Keeping last 7 backups."
`;
  }

  _getDeployScriptExample() {
    return `#!/bin/bash
# Deployment Script

echo "🚀 Starting deployment..."

# Run tests
echo "Running tests..."
npm test
if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Aborting deployment."
    exit 1
fi

# Build production
echo "Building for production..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Aborting deployment."
    exit 1
fi

# Deploy
echo "Deploying to server..."
rsync -avz --delete dist/ user@server:/var/www/webos/

echo "✅ Deployment complete!"
`;
  }

  _getSetupScriptExample() {
    return `#!/bin/bash
# Setup Script for WebOS Development

echo "Setting up WebOS development environment..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js $(node --version) found"

# Install dependencies
echo "Installing dependencies..."
npm install

# Create necessary directories
echo "Creating directories..."
mkdir -p logs
mkdir -p backups
mkdir -p temp

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file. Please update with your configuration."
fi

echo "✅ Setup complete! Run 'npm start' to begin."
`;
  }

  // ========== Templates ==========

  _getReactComponentExample() {
    return `import React, { useState, useEffect } from 'react';
import './ComponentName.css';

/**
 * ComponentName - Description
 * @param {Object} props - Component props
 */
function ComponentName({ prop1, prop2 }) {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Side effects here
    return () => {
      // Cleanup
    };
  }, [dependencies]);

  const handleAction = () => {
    // Event handler
  };

  return (
    <div className="component-name">
      <h2>{prop1}</h2>
      <button onClick={handleAction}>
        Action
      </button>
    </div>
  );
}

export default ComponentName;
`;
  }

  _getExpressAPIExample() {
    return `const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/resource
 * @desc    Get all resources
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/resource/:id
 * @desc    Get resource by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json(resource);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/resource
 * @desc    Create new resource
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const resource = new Resource(req.body);
    await resource.save();
    res.status(201).json(resource);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/resource/:id
 * @desc    Update resource
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json(resource);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/resource/:id
 * @desc    Delete resource
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json({ message: 'Resource deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
`;
  }

  _getPythonClassExample() {
    return `class ClassName:
    """
    Class description here.

    Attributes:
        attribute1: Description of attribute1
        attribute2: Description of attribute2
    """

    def __init__(self, param1, param2):
        """Initialize the class with parameters."""
        self.attribute1 = param1
        self.attribute2 = param2
        self._private_attribute = None

    def public_method(self, arg):
        """
        Public method description.

        Args:
            arg: Argument description

        Returns:
            Return value description
        """
        result = self._private_method(arg)
        return result

    def _private_method(self, arg):
        """Private method - internal use only."""
        # Implementation
        return arg * 2

    @property
    def read_only_property(self):
        """Read-only property."""
        return self.attribute1

    @staticmethod
    def static_method(arg):
        """Static method that doesn't need instance."""
        return arg.upper()

    @classmethod
    def from_dict(cls, data):
        """Alternative constructor from dictionary."""
        return cls(data['param1'], data['param2'])

    def __str__(self):
        """String representation."""
        return f"ClassName({self.attribute1}, {self.attribute2})"

    def __repr__(self):
        """Official string representation."""
        return f"ClassName(attribute1={self.attribute1}, attribute2={self.attribute2})"
`;
  }

  // ========== Sample Project Files ==========

  _getTodoAppHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo List App</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="app">
        <header>
            <h1>✓ My Todo List</h1>
            <p class="subtitle">Organize your tasks</p>
        </header>

        <div class="input-container">
            <input
                type="text"
                id="taskInput"
                placeholder="What needs to be done?"
                autocomplete="off"
            >
            <button id="addBtn" class="btn-add">Add Task</button>
        </div>

        <div class="filters">
            <button class="filter-btn active" data-filter="all">All</button>
            <button class="filter-btn" data-filter="active">Active</button>
            <button class="filter-btn" data-filter="completed">Completed</button>
        </div>

        <ul id="taskList" class="task-list"></ul>

        <div class="stats">
            <span id="taskCount">0 tasks</span>
            <button id="clearCompleted" class="btn-clear">Clear Completed</button>
        </div>
    </div>

    <script src="app.js"></script>
</body>
</html>
`;
  }

  _getTodoAppJS() {
    return `// Todo List Application
class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        // DOM elements
        this.taskInput = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.taskList = document.getElementById('taskList');
        this.taskCount = document.getElementById('taskCount');
        this.clearCompleted = document.getElementById('clearCompleted');
        this.filterBtns = document.querySelectorAll('.filter-btn');

        // Event listeners
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        this.clearCompleted.addEventListener('click', () => this.clearCompletedTasks());

        this.render();
    }

    addTask() {
        const text = this.taskInput.value.trim();

        if (text) {
            const task = {
                id: Date.now(),
                text,
                completed: false,
                createdAt: new Date().toISOString()
            };

            this.tasks.push(task);
            this.save();
            this.render();
            this.taskInput.value = '';
        }
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.save();
            this.render();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.save();
        this.render();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    }

    clearCompletedTasks() {
        this.tasks = this.tasks.filter(t => !t.completed);
        this.save();
        this.render();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }

    render() {
        const filteredTasks = this.getFilteredTasks();

        this.taskList.innerHTML = filteredTasks.map(task => \`
            <li class="task-item \${task.completed ? 'completed' : ''}">
                <input
                    type="checkbox"
                    \${task.completed ? 'checked' : ''}
                    onchange="app.toggleTask(\${task.id})"
                >
                <span class="task-text">\${task.text}</span>
                <button
                    class="btn-delete"
                    onclick="app.deleteTask(\${task.id})"
                >×</button>
            </li>
        \`).join('');

        // Update count
        const activeCount = this.tasks.filter(t => !t.completed).length;
        this.taskCount.textContent = \`\${activeCount} \${activeCount === 1 ? 'task' : 'tasks'}\`;
    }

    save() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
}

// Initialize app
const app = new TodoApp();
`;
  }

  _getTodoAppCSS() {
    return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.app {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 600px;
    width: 100%;
    overflow: hidden;
}

header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem;
    text-align: center;
}

h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
}

.subtitle {
    opacity: 0.9;
    font-size: 0.9rem;
}

.input-container {
    padding: 1.5rem;
    display: flex;
    gap: 0.5rem;
    border-bottom: 1px solid #e2e8f0;
}

#taskInput {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s;
}

#taskInput:focus {
    outline: none;
    border-color: #667eea;
}

.btn-add {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: transform 0.2s;
}

.btn-add:hover {
    transform: translateY(-2px);
}

.filters {
    display: flex;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;
}

.filter-btn {
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;
}

.filter-btn.active {
    background: #667eea;
    color: white;
    border-color: #667eea;
}

.task-list {
    list-style: none;
    max-height: 400px;
    overflow-y: auto;
}

.task-item {
    display: flex;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #f7fafc;
    transition: background 0.2s;
}

.task-item:hover {
    background: #f7fafc;
}

.task-item.completed .task-text {
    text-decoration: line-through;
    opacity: 0.5;
}

.task-item input[type="checkbox"] {
    width: 20px;
    height: 20px;
    margin-right: 1rem;
    cursor: pointer;
}

.task-text {
    flex: 1;
    font-size: 1rem;
}

.btn-delete {
    width: 30px;
    height: 30px;
    border: none;
    background: #fed7d7;
    color: #c53030;
    border-radius: 6px;
    font-size: 1.5rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.btn-delete:hover {
    background: #fc8181;
    color: white;
}

.stats {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background: #f7fafc;
    font-size: 0.9rem;
    color: #4a5568;
}

.btn-clear {
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-clear:hover {
    background: #fed7d7;
    border-color: #fc8181;
    color: #c53030;
}
`;
  }

  // ========== Documentation ==========

  _getAPIDocsExample() {
    return `# API Reference

## Overview

This document describes the WebOS API endpoints and their usage.

## Base URL

\`\`\`
http://localhost:3000/api
\`\`\`

## Authentication

All API requests require authentication using Bearer tokens:

\`\`\`http
Authorization: Bearer YOUR_TOKEN_HERE
\`\`\`

## Endpoints

### Files

#### List Files

\`\`\`http
GET /api/files
\`\`\`

**Parameters:**
- \`path\` (optional): Directory path
- \`limit\` (optional): Max results (default: 100)

**Response:**
\`\`\`json
{
  "files": [
    {
      "name": "example.txt",
      "size": 1024,
      "type": "file",
      "modified": "2024-01-15T10:30:00Z"
    }
  ]
}
\`\`\`

#### Create File

\`\`\`http
POST /api/files
\`\`\`

**Body:**
\`\`\`json
{
  "path": "/home/user/file.txt",
  "content": "File contents here"
}
\`\`\`

### Processes

#### List Processes

\`\`\`http
GET /api/processes
\`\`\`

**Response:**
\`\`\`json
{
  "processes": [
    {
      "pid": 1234,
      "name": "terminal",
      "status": "running",
      "startTime": "2024-01-15T10:00:00Z"
    }
  ]
}
\`\`\`

## Error Handling

All errors follow this format:

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
\`\`\`

## Rate Limiting

API is limited to 100 requests per minute per IP.
`;
  }

  _getContributingExample() {
    return `# Contributing to WebOS

Thank you for your interest in contributing to WebOS!

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Submit a pull request

## Development Setup

\`\`\`bash
git clone https://github.com/yourusername/webos.git
cd webos
npm install
npm start
\`\`\`

## Code Style

- Use 2 spaces for indentation
- Follow ESLint configuration
- Add comments for complex logic
- Write meaningful commit messages

## Commit Messages

Follow conventional commits:

\`\`\`
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
\`\`\`

## Pull Request Process

1. Update documentation
2. Add tests for new features
3. Ensure all tests pass
4. Request review from maintainers

## Code Review

All submissions require review. We use GitHub pull requests for this purpose.

## Community

- Be respectful and inclusive
- Help others learn
- Give constructive feedback
- Follow our Code of Conduct

Thank you for contributing! 🎉
`;
  }

  _getChangelogExample() {
    return `# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- File upload functionality
- Example file generator
- Advanced AI features

## [1.0.0] - 2024-01-15

### Added
- Initial release
- Virtual file system
- Process management
- Window manager
- Terminal with 40+ commands
- Basic AI assistant

### Changed
- Improved performance
- Updated UI design

### Fixed
- Window dragging issues
- File permission bugs

## [0.9.0] - 2023-12-01

### Added
- Beta release
- Core OS functionality
- Basic applications

### Known Issues
- Terminal history not persisting
- Some commands incomplete

## [0.5.0] - 2023-11-01

### Added
- Alpha release
- Proof of concept
- Basic file system

---

[Unreleased]: https://github.com/user/webos/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/user/webos/compare/v0.9.0...v1.0.0
[0.9.0]: https://github.com/user/webos/compare/v0.5.0...v0.9.0
[0.5.0]: https://github.com/user/webos/releases/tag/v0.5.0
`;
  }

  // ========== Helper Methods ==========

  async _ensureDirectory(path) {
    const parts = path.split('/').filter(p => p);
    let currentPath = '';

    for (const part of parts) {
      currentPath += '/' + part;

      try {
        await this.vfs.stat(currentPath);
      } catch (error) {
        // Directory doesn't exist, create it
        try {
          await this.vfs.mkdir(currentPath);
        } catch (mkdirError) {
          // Ignore if already exists
          if (!mkdirError.message.includes('exists')) {
            throw mkdirError;
          }
        }
      }
    }
  }

  /**
   * List all available examples
   */
  listExamples() {
    return Object.keys(this.exampleFiles).map(path => ({
      path,
      category: path.split('/')[2], // examples/category/file
      name: path.split('/').pop()
    }));
  }

  /**
   * Get categories of examples
   */
  getCategories() {
    const categories = new Set();
    Object.keys(this.exampleFiles).forEach(path => {
      const parts = path.split('/');
      if (parts.length >= 3) {
        categories.add(parts[2]);
      }
    });
    return Array.from(categories);
  }
}

export default ExampleFileGenerator;
