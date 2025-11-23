/**
 * Project Templates - Quick-start templates for various project types
 * Scaffolds complete project structures
 */

export class ProjectTemplates {
  constructor(fs) {
    this.fs = fs;
    this.templates = this.getTemplates();
    this.panel = null;
    this.isVisible = false;
  }

  /**
   * Get available templates
   */
  getTemplates() {
    return {
      'vanilla-js': {
        name: 'Vanilla JavaScript',
        description: 'Simple HTML + CSS + JavaScript project',
        icon: '📦',
        files: {
          'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Welcome to Your Project!</h1>
    <p>Start building amazing things.</p>
    <button id="btn">Click Me</button>
  </div>
  <script src="app.js"></script>
</body>
</html>`,
          'styles.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background: #f4f4f4;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  text-align: center;
}

h1 {
  color: #007acc;
  margin-bottom: 20px;
}

button {
  background: #007acc;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
  transition: background 0.3s;
}

button:hover {
  background: #005a9e;
}`,
          'app.js': `// Main application logic
console.log('Application started');

const btn = document.getElementById('btn');

btn.addEventListener('click', () => {
  alert('Hello from your new project!');
});

// Your code here...
`,
          'README.md': `# My Project

A simple web project built with HTML, CSS, and JavaScript.

## Getting Started

Open \`index.html\` in your browser to view the project.

## Structure

- \`index.html\` - Main HTML file
- \`styles.css\` - Styles
- \`app.js\` - JavaScript logic
`
        }
      },

      'react-app': {
        name: 'React Application',
        description: 'React app with components',
        icon: '⚛️',
        files: {
          'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="index.jsx"></script>
</body>
</html>`,
          'index.jsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
          'App.jsx': `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>React App</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`,
          'styles.css': `:root {
  --primary-color: #007acc;
  --bg-color: #f4f4f4;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  background: var(--bg-color);
}

.app {
  max-width: 800px;
  margin: 50px auto;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  text-align: center;
}

h1 {
  color: var(--primary-color);
  margin-bottom: 20px;
}

button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
}

button:hover {
  opacity: 0.9;
}`,
          'package.json': `{
  "name": "react-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}`
        }
      },

      'node-api': {
        name: 'Node.js API',
        description: 'Express.js REST API',
        icon: '🟢',
        files: {
          'server.js': `const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

app.get('/api/items', (req, res) => {
  res.json({
    items: [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' }
    ]
  });
});

app.post('/api/items', (req, res) => {
  const { name } = req.body;
  res.status(201).json({
    id: Date.now(),
    name
  });
});

// Start server
app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});`,
          'package.json': `{
  "name": "node-api",
  "version": "1.0.0",
  "description": "Express.js REST API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.0"
  }
}`,
          'README.md': `# Node.js API

Express.js REST API

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## Endpoints

- GET / - Welcome message
- GET /api/items - Get all items
- POST /api/items - Create item
`
        }
      },

      'typescript-app': {
        name: 'TypeScript Application',
        description: 'TypeScript project with types',
        icon: '🔷',
        files: {
          'index.ts': `interface User {
  id: number;
  name: string;
  email: string;
}

class UserManager {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
    console.log(\`Added user: \${user.name}\`);
  }

  getUser(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getAllUsers(): User[] {
    return this.users;
  }
}

// Usage
const manager = new UserManager();

manager.addUser({
  id: 1,
  name: 'John Doe',
  email: 'john@example.com'
});

console.log('All users:', manager.getAllUsers());`,
          'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["*.ts"],
  "exclude": ["node_modules"]
}`,
          'package.json': `{
  "name": "typescript-app",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node index.ts"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "@types/node": "^18.0.0"
  }
}`
        }
      },

      'python-app': {
        name: 'Python Application',
        description: 'Python project structure',
        icon: '🐍',
        files: {
          'main.py': `"""
Main application entry point
"""

def greet(name: str) -> str:
    """Greet a person by name"""
    return f"Hello, {name}!"

def main():
    """Main function"""
    print("Python Application")
    print(greet("World"))

    # Your code here...

if __name__ == "__main__":
    main()`,
          'utils.py': `"""
Utility functions
"""

def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b

def multiply(a: int, b: int) -> int:
    """Multiply two numbers"""
    return a * b`,
          'requirements.txt': `# Add your dependencies here
# Example:
# requests==2.28.0
# numpy==1.24.0
`,
          'README.md': `# Python Application

## Setup

\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Run

\`\`\`bash
python main.py
\`\`\`
`
        }
      },

      'html-portfolio': {
        name: 'Portfolio Website',
        description: 'Personal portfolio template',
        icon: '💼',
        files: {
          'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Portfolio</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <nav>
      <h1>Your Name</h1>
      <ul>
        <li><a href="#about">About</a></li>
        <li><a href="#projects">Projects</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <section id="hero">
    <div class="container">
      <h2>Full Stack Developer</h2>
      <p>Building amazing web experiences</p>
    </div>
  </section>

  <section id="about">
    <div class="container">
      <h2>About Me</h2>
      <p>I'm a passionate developer who loves creating elegant solutions.</p>
    </div>
  </section>

  <section id="projects">
    <div class="container">
      <h2>My Projects</h2>
      <div class="projects-grid">
        <div class="project-card">
          <h3>Project 1</h3>
          <p>Description of your project</p>
        </div>
        <div class="project-card">
          <h3>Project 2</h3>
          <p>Description of your project</p>
        </div>
      </div>
    </div>
  </section>

  <footer id="contact">
    <div class="container">
      <p>Get in touch: your@email.com</p>
    </div>
  </footer>
</body>
</html>`,
          'style.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

header {
  background: #007acc;
  color: white;
  padding: 20px 0;
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

nav ul {
  display: flex;
  list-style: none;
  gap: 30px;
}

nav a {
  color: white;
  text-decoration: none;
  transition: opacity 0.3s;
}

nav a:hover {
  opacity: 0.8;
}

#hero {
  background: linear-gradient(135deg, #007acc, #00bcf2);
  color: white;
  padding: 100px 0;
  text-align: center;
}

#hero h2 {
  font-size: 3em;
  margin-bottom: 20px;
}

section {
  padding: 80px 0;
}

section h2 {
  font-size: 2.5em;
  margin-bottom: 30px;
  text-align: center;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 40px;
}

.project-card {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  transition: transform 0.3s;
}

.project-card:hover {
  transform: translateY(-5px);
}

footer {
  background: #333;
  color: white;
  text-align: center;
  padding: 40px 0;
}`,
          'README.md': `# Portfolio Website

Personal portfolio template

## Customize

1. Update your name and information in index.html
2. Add your projects
3. Update the color scheme in style.css
4. Add your contact information
`
        }
      }
    };
  }

  /**
   * Initialize panel
   */
  initialize(container) {
    this.container = container;
    this.createPanel();
  }

  /**
   * Create panel
   */
  createPanel() {
    this.panel = document.createElement('div');
    this.panel.className = 'templates-panel';
    this.panel.style.display = 'none';
    this.panel.innerHTML = this.getPanelHTML();

    this.container.appendChild(this.panel);
    this.attachEventListeners();
  }

  /**
   * Get panel HTML
   */
  getPanelHTML() {
    return `
      <div class="templates-header">
        <h3>📦 Project Templates</h3>
        <button class="close-btn" id="close-templates">×</button>
      </div>

      <div class="templates-grid">
        ${Object.entries(this.templates).map(([key, template]) => `
          <div class="template-card" data-template="${key}">
            <div class="template-icon">${template.icon}</div>
            <h4>${template.name}</h4>
            <p>${template.description}</p>
            <button class="use-template-btn" data-template="${key}">
              Use Template
            </button>
          </div>
        `).join('')}
      </div>

      <style>
        .templates-panel {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 800px;
          max-height: 600px;
          background: #1e1e1e;
          border: 1px solid #3e3e3e;
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          z-index: 10000;
          display: flex;
          flex-direction: column;
        }

        .templates-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 25px;
          border-bottom: 1px solid #3e3e3e;
          background: #252526;
        }

        .templates-header h3 {
          margin: 0;
          color: #d4d4d4;
          font-size: 18px;
        }

        .templates-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          padding: 25px;
          overflow-y: auto;
        }

        .template-card {
          background: #2d2d2d;
          border: 1px solid #3e3e3e;
          border-radius: 8px;
          padding: 25px;
          text-align: center;
          transition: all 0.3s;
          cursor: pointer;
        }

        .template-card:hover {
          border-color: #007acc;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 122, 204, 0.2);
        }

        .template-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }

        .template-card h4 {
          color: #d4d4d4;
          margin-bottom: 10px;
          font-size: 16px;
        }

        .template-card p {
          color: #969696;
          font-size: 13px;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .use-template-btn {
          background: #007acc;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
          width: 100%;
        }

        .use-template-btn:hover {
          background: #005a9e;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: #d4d4d4;
          font-size: 28px;
          cursor: pointer;
          padding: 0;
          width: 35px;
          height: 35px;
        }

        .close-btn:hover {
          color: #fff;
        }
      </style>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    this.panel.querySelector('#close-templates')?.addEventListener('click', () => {
      this.hide();
    });

    // Template buttons
    this.panel.querySelectorAll('.use-template-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const templateKey = btn.dataset.template;
        await this.createProject(templateKey);
      });
    });

    // Card click
    this.panel.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', async () => {
        const templateKey = card.dataset.template;
        await this.createProject(templateKey);
      });
    });
  }

  /**
   * Create project from template
   */
  async createProject(templateKey) {
    const template = this.templates[templateKey];
    if (!template) return;

    // Ask for project name
    const projectName = prompt('Enter project name:', 'my-project');
    if (!projectName) return;

    const projectPath = `/home/user/projects/${projectName}`;

    try {
      // Create project directory
      await this.fs.mkdir(projectPath, { recursive: true });

      // Create all files
      for (const [fileName, content] of Object.entries(template.files)) {
        const filePath = `${projectPath}/${fileName}`;
        await this.fs.writeFile(filePath, content);
      }

      alert(`Project "${projectName}" created successfully!\n\nLocation: ${projectPath}`);
      this.hide();

      // Refresh file tree if available
      if (window.currentCodeEditorInstance?.fileTree) {
        await window.currentCodeEditorInstance.fileTree.refresh();
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert(`Error creating project: ${error.message}`);
    }
  }

  /**
   * Show panel
   */
  show() {
    if (!this.panel) return;

    this.panel.style.display = 'flex';
    this.isVisible = true;
  }

  /**
   * Hide panel
   */
  hide() {
    if (!this.panel) return;

    this.panel.style.display = 'none';
    this.isVisible = false;
  }

  /**
   * Toggle panel
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
  }
}
