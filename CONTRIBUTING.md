# Contributing to WebOS

Thank you for your interest in contributing to WebOS! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Architecture Guidelines](#architecture-guidelines)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Modern browser with ES2022+ support
- Git for version control
- Code editor (VS Code recommended)

### First Contribution

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/web-operating-system.git
   cd web-operating-system
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start development server**:
   ```bash
   npm run dev
   ```
5. **Make your changes** and test thoroughly
6. **Submit a pull request**

## Development Setup

### Installation

```bash
# Clone the repository
git clone https://github.com/Sir-Teo/web-operating-system.git
cd web-operating-system

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev      # Start development server on port 3000
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Lint code with ESLint
npm run format   # Format code with Prettier
npm test         # Run test suite (when implemented)
```

### Browser DevTools

- Open DevTools (F12) to see console logs
- Check Application tab for Service Worker status
- Use Storage tab to inspect OPFS and IndexedDB

## Project Structure

```
web-operating-system/
├── src/
│   ├── kernel/          # OS kernel and core services
│   ├── filesystem/      # Virtual file system and drivers
│   ├── ui/              # Desktop, taskbar, windows
│   ├── apps/            # System applications
│   ├── security/        # Permission management
│   └── utils/           # EventBus, Logger, utilities
├── public/              # Static assets
├── styles/              # CSS files
└── docs/                # Documentation
```

### Key Components

- **Kernel**: Boot process, system initialization
- **ProcessManager**: Process lifecycle management
- **VFS**: Virtual file system abstraction
- **WindowManager**: Window management with WinBox.js
- **AppRegistry**: Application registration and launching

## Coding Standards

### JavaScript Style Guide

We follow modern JavaScript best practices:

#### ES Modules

```javascript
// ✅ Good - Use ES modules
import { eventBus } from '../utils/EventBus.js';
export class MyClass { }

// ❌ Bad - Don't use CommonJS
const eventBus = require('../utils/EventBus');
module.exports = MyClass;
```

#### Async/Await

```javascript
// ✅ Good - Use async/await
async function loadData() {
  try {
    const data = await fetchData();
    return processData(data);
  } catch (error) {
    logger.error('Failed to load data:', error);
    throw error;
  }
}

// ❌ Bad - Don't use promise chains unless necessary
function loadData() {
  return fetchData()
    .then(data => processData(data))
    .catch(error => console.error(error));
}
```

#### Error Handling

```javascript
// ✅ Good - Proper error handling with context
async function readFile(path) {
  try {
    return await vfs.readFile(path);
  } catch (error) {
    logger.error(`Failed to read file ${path}:`, error);
    throw new Error(`File read failed: ${error.message}`);
  }
}

// ❌ Bad - Silent failures
async function readFile(path) {
  try {
    return await vfs.readFile(path);
  } catch (error) {
    return null;
  }
}
```

#### Classes and Singletons

```javascript
// ✅ Good - Singleton pattern for core services
class FileSystem {
  constructor() {
    if (FileSystem.instance) {
      return FileSystem.instance;
    }
    this.drivers = new Map();
    FileSystem.instance = this;
  }
}

// ✅ Good - Regular classes for instances
class Process {
  constructor(config) {
    this.pid = crypto.randomUUID();
    this.name = config.name;
  }
}
```

#### Modern APIs

```javascript
// ✅ Good - Use modern browser APIs
const id = crypto.randomUUID();
const timestamp = Date.now();
const map = new Map();
const set = new Set();

// ❌ Bad - Avoid outdated patterns
const id = Math.random().toString(36);
const obj = Object.create(null);
```

### CSS Style Guide

#### Use Modern CSS Features

```css
/* ✅ Good - Modern CSS with variables */
:root {
  --primary-color: #667eea;
  --backdrop-blur: blur(20px);
}

.element {
  background: var(--primary-color);
  backdrop-filter: var(--backdrop-blur);
}

/* ✅ Good - Use logical properties */
.element {
  margin-block: 1rem;
  padding-inline: 2rem;
}
```

#### Animations

```css
/* ✅ Good - Smooth animations with ease */
.button {
  transition: all 0.3s ease;
  transform: translateY(0);
}

.button:hover {
  transform: translateY(-2px);
}

/* ✅ Good - Use keyframe animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### Naming Conventions

#### Files

```
// ✅ Good - PascalCase for classes
src/kernel/ProcessManager.js
src/apps/terminal/Terminal.js

// ✅ Good - camelCase for utilities
src/utils/eventBus.js
src/utils/logger.js

// ✅ Good - kebab-case for CSS
styles/desktop.css
styles/window.css
```

#### Variables and Functions

```javascript
// ✅ Good - Descriptive names
const activeProcesses = new Map();
const MAX_PROCESSES = 100;

async function createProcess(config) { }
function _privateMethod() { }  // Prefix private with _

// ❌ Bad - Unclear names
const procs = new Map();
const MAX = 100;
function create(c) { }
```

## Commit Guidelines

### Commit Message Format

We follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

#### Examples

```bash
# Feature addition
feat(terminal): Add tab autocomplete support

Implement tab completion for terminal commands. When users press Tab,
the input autocompletes to matching command names.

- Add command matching logic
- Support partial command completion
- Handle multiple matches gracefully

Closes #123

# Bug fix
fix(vfs): Resolve path normalization issue

Fix incorrect path handling when dealing with relative paths containing
'..'. Now properly normalizes paths before file operations.

Fixes #456

# Documentation
docs(readme): Update installation instructions

Add troubleshooting section for common setup issues.

# Refactoring
refactor(kernel): Simplify boot sequence

Extract initialization steps into separate methods for better readability
and maintainability.
```

### Commit Best Practices

1. **Make atomic commits** - Each commit should represent one logical change
2. **Write clear messages** - Explain what and why, not how
3. **Reference issues** - Use "Fixes #123" or "Closes #456"
4. **Keep commits focused** - Don't mix unrelated changes
5. **Test before committing** - Ensure code works

## Pull Request Process

### Before Submitting

1. **Update your fork** with the latest changes:
   ```bash
   git fetch upstream
   git merge upstream/main
   ```

2. **Run linting and tests**:
   ```bash
   npm run lint
   npm run format
   npm test
   ```

3. **Test your changes** thoroughly in the browser

4. **Update documentation** if you changed APIs or added features

### PR Title and Description

**Title Format**: `[Type] Brief description`

Examples:
- `[Feature] Add file compression support`
- `[Fix] Resolve memory leak in ProcessManager`
- `[Docs] Update API documentation`

**Description Template**:

```markdown
## Description
Brief description of what this PR does.

## Changes
- List of specific changes made
- Each change on its own line
- Use bullet points

## Testing
How to test these changes:
1. Step-by-step testing instructions
2. Expected behavior
3. Edge cases covered

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-reviewed the code
- [ ] Commented complex logic
- [ ] Updated documentation
- [ ] No console errors or warnings
- [ ] Tested in Chrome, Firefox, and Safari
- [ ] No breaking changes (or documented if necessary)

## Related Issues
Fixes #123
Related to #456
```

### PR Review Process

1. **Automated checks** must pass (linting, build)
2. **At least one approval** from maintainers required
3. **Address review comments** promptly
4. **Squash commits** if requested
5. **Maintainer will merge** when ready

### PR Best Practices

- Keep PRs **focused and small** (< 500 lines preferred)
- **One feature or fix per PR**
- Respond to review comments within 48 hours
- Be open to feedback and suggestions
- Update your PR based on review feedback

## Testing

### Manual Testing

Currently, we rely on manual testing. When testing your changes:

1. **Functional Testing**
   - Test the feature works as expected
   - Test error cases and edge conditions
   - Test with different inputs

2. **Integration Testing**
   - Ensure your changes work with existing features
   - Test interactions between components
   - Check for regressions

3. **Browser Testing**
   - Test in Chrome (latest)
   - Test in Firefox (latest)
   - Test in Safari (latest)
   - Test in Edge (latest)

4. **Performance Testing**
   - Check for memory leaks (DevTools Memory tab)
   - Verify no performance degradation
   - Test with large datasets if applicable

### Testing Checklist

- [ ] Feature works in all supported browsers
- [ ] No console errors or warnings
- [ ] No memory leaks detected
- [ ] Handles edge cases properly
- [ ] Error messages are clear and helpful
- [ ] UI is responsive and smooth
- [ ] Service Worker still functions correctly
- [ ] OPFS and IndexedDB operations work

### Future: Automated Testing

We plan to add automated testing in the future:

```javascript
// Example unit test (future)
describe('VFS', () => {
  it('should create a file', async () => {
    const vfs = new VFS();
    await vfs.writeFile('/test.txt', 'Hello');
    const content = await vfs.readFile('/test.txt');
    expect(content).toBe('Hello');
  });
});
```

## Documentation

### Code Comments

```javascript
/**
 * Creates a new process with the given configuration.
 *
 * @param {Object} config - Process configuration
 * @param {string} config.name - Process name
 * @param {string[]} config.permissions - Required permissions
 * @returns {Promise<Process>} The created process instance
 * @throws {Error} If process creation fails
 *
 * @example
 * const process = await createProcess({
 *   name: 'my-app',
 *   permissions: ['filesystem.read']
 * });
 */
async function createProcess(config) {
  // Validate configuration
  if (!config.name) {
    throw new Error('Process name is required');
  }

  // Create process with unique ID
  const process = new Process({
    pid: crypto.randomUUID(),
    ...config
  });

  return process;
}
```

### Documentation Files

When adding features, update relevant documentation:

- **README.md**: Update features list, usage examples
- **ROADMAP.md**: Remove implemented features
- **ARCHITECTURE.md**: Document architectural changes
- **API docs**: Add JSDoc comments for public APIs

### Documentation Style

- Use clear, concise language
- Include code examples
- Explain the "why" not just the "what"
- Keep documentation up-to-date with code changes

## Architecture Guidelines

### Component Design

#### Single Responsibility

Each component should have one clear purpose:

```javascript
// ✅ Good - FileSystem only handles file operations
class FileSystem {
  async readFile(path) { }
  async writeFile(path, data) { }
}

// ❌ Bad - FileSystem doing too much
class FileSystem {
  async readFile(path) { }
  async sendEmail(to, subject) { }  // Wrong responsibility
}
```

#### Dependency Injection

```javascript
// ✅ Good - Dependencies injected
class Application {
  constructor(fileSystem, processManager) {
    this.fs = fileSystem;
    this.pm = processManager;
  }
}

// ❌ Bad - Hard-coded dependencies
class Application {
  constructor() {
    this.fs = new FileSystem();  // Hard to test
  }
}
```

#### Event-Driven Communication

```javascript
// ✅ Good - Use EventBus for loose coupling
class ProcessManager {
  terminateProcess(pid) {
    // ... termination logic
    eventBus.emit('process-terminated', { pid });
  }
}

class WindowManager {
  constructor() {
    eventBus.on('process-terminated', this._handleProcessTerminated.bind(this));
  }
}
```

### File System Drivers

When adding new drivers:

```javascript
class CustomDriver {
  constructor(config) {
    this.config = config;
  }

  async init() {
    // Initialize driver
  }

  // Implement required interface
  async readFile(path, options) { }
  async writeFile(path, data, options) { }
  async mkdir(path) { }
  async readdir(path) { }
  async rm(path, options) { }
  async rename(oldPath, newPath) { }
  async stat(path) { }
}
```

### Adding Applications

```javascript
// 1. Create app directory
src/apps/my-app/
  ├── MyApp.js
  ├── MyApp.css
  └── README.md

// 2. Implement app class
export class MyApp {
  constructor(context) {
    this.context = context;
    this.process = context.process;
    this.vfs = context.vfs;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'my-app';
    // ... build UI
    return container;
  }

  destroy() {
    // Cleanup
  }
}

// 3. Register in AppRegistry
appRegistry.register({
  id: 'my-app',
  name: 'My App',
  icon: '🎨',
  permissions: ['filesystem.read'],
  main: () => import('./apps/my-app/MyApp.js')
});
```

### Performance Considerations

1. **Use async/await for I/O operations**
2. **Implement lazy loading for large components**
3. **Use Web Workers for CPU-intensive tasks**
4. **Cache frequently accessed data**
5. **Minimize DOM manipulations**
6. **Use event delegation when possible**

```javascript
// ✅ Good - Lazy loading
async launchApp(appId) {
  const app = await import(`./apps/${appId}/${appId}.js`);
  return new app.default();
}

// ✅ Good - Event delegation
container.addEventListener('click', (e) => {
  if (e.target.matches('.button')) {
    handleButtonClick(e.target);
  }
});
```

## Getting Help

### Resources

- **Documentation**: Check the [README.md](README.md) and [ROADMAP.md](ROADMAP.md)
- **Code Examples**: Review existing components in `src/`
- **Architecture**: See architectural decisions in code comments

### Asking Questions

When asking for help:

1. **Check existing documentation first**
2. **Search closed issues** for similar problems
3. **Provide context** - what you're trying to achieve
4. **Include code snippets** - show what you've tried
5. **Describe expected vs actual behavior**
6. **List steps to reproduce** the issue

### Issue Template

```markdown
**Description**
Clear description of the issue or question

**Steps to Reproduce** (for bugs)
1. Go to...
2. Click on...
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- Browser: Chrome 120
- OS: macOS 14
- Node: v18.17.0

**Screenshots**
If applicable

**Additional Context**
Any other relevant information
```

## License

By contributing to WebOS, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to WebOS! 🚀
