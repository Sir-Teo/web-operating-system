# Application Development Guide for WebOS

A comprehensive guide for building applications for the WebOS platform.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Application Types](#application-types)
3. [Application Structure](#application-structure)
4. [Best Practices](#best-practices)
5. [Advanced Topics](#advanced-topics)
6. [Example Applications](#example-applications)
7. [Debugging & Testing](#debugging--testing)
8. [Publishing](#publishing)

---

## Getting Started

### Prerequisites

- Basic knowledge of JavaScript/TypeScript
- Understanding of HTML/CSS
- Familiarity with async/await and Promises
- Understanding of browser APIs

### Your First Application

Let's create a simple "Hello World" application:

```javascript
// apps/hello-world/index.js

export default class HelloWorldApp {
  constructor(context) {
    this.context = context;
    this.window = context.window;
  }

  async init() {
    console.log('Hello World app initializing...');
  }

  render() {
    const container = document.createElement('div');
    container.style.padding = '20px';
    container.innerHTML = `
      <h1>Hello, WebOS!</h1>
      <p>This is my first application.</p>
      <button id="greet-btn">Click Me</button>
    `;

    container.querySelector('#greet-btn').onclick = () => {
      alert('Hello from WebOS!');
    };

    return container;
  }
}
```

**Register the application**:

```javascript
// In your app initialization code
AppRegistry.register({
  id: 'hello-world',
  name: 'Hello World',
  version: '1.0.0',
  icon: '👋',
  type: 'web',
  entry: '/apps/hello-world/index.js',
  permissions: []
});
```

**Launch the application**:

```javascript
await AppRegistry.launchApp('hello-world');
```

---

## Application Types

### 1. Web Applications (Recommended)

Native JavaScript/HTML/CSS applications with full access to WebOS APIs.

**Pros**:
- Full API access
- Best performance
- Easy debugging
- Direct DOM manipulation

**Cons**:
- Requires JavaScript knowledge
- No sandboxing by default

**Example**:
```javascript
export default class WebApp {
  constructor(context) {
    this.context = context;
  }

  async init() {
    // Initialize app
  }

  render() {
    return document.createElement('div');
  }
}
```

### 2. WebAssembly Applications

High-performance applications compiled to WebAssembly.

**Pros**:
- Near-native performance
- Can use languages like Rust, C++, Go
- CPU-intensive tasks

**Cons**:
- More complex setup
- Limited DOM access
- Larger file sizes

**Example**:
```javascript
// Rust code
#[no_mangle]
pub extern "C" fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

**Manifest**:
```javascript
AppRegistry.register({
  id: 'wasm-app',
  name: 'WASM Calculator',
  version: '1.0.0',
  icon: '🔢',
  type: 'wasm',
  entry: '/apps/wasm-app/main.wasm',
  permissions: []
});
```

### 3. IFrame Applications

Sandboxed applications running in iframes.

**Pros**:
- Complete isolation
- Can embed existing web apps
- Security sandbox

**Cons**:
- Limited API access
- Performance overhead
- Communication complexity

**Example**:
```javascript
AppRegistry.register({
  id: 'iframe-app',
  name: 'External App',
  version: '1.0.0',
  icon: '🌐',
  type: 'iframe',
  entry: '/apps/iframe-app/index.html',
  permissions: []
});
```

---

## Application Structure

### Recommended Directory Structure

```
apps/
└── my-app/
    ├── index.js           # Main entry point
    ├── styles.css         # Application styles
    ├── components/        # UI components
    │   ├── Header.js
    │   ├── Sidebar.js
    │   └── Content.js
    ├── utils/            # Utility functions
    │   └── helpers.js
    ├── workers/          # Web Workers
    │   └── processor.js
    ├── assets/           # Static assets
    │   ├── icons/
    │   └── images/
    ├── manifest.json     # App manifest
    └── README.md
```

### Application Manifest

```json
{
  "id": "my-app",
  "name": "My Application",
  "version": "1.0.0",
  "description": "A sample application for WebOS",
  "author": "Your Name",
  "icon": "🚀",
  "type": "web",
  "entry": "/apps/my-app/index.js",
  "permissions": [
    "filesystem.read",
    "filesystem.write",
    "network.fetch"
  ],
  "minOSVersion": "1.0.0",
  "defaultWindow": {
    "width": 800,
    "height": 600,
    "minWidth": 400,
    "minHeight": 300
  }
}
```

### Main Application Class

```javascript
export default class MyApp {
  // Required: Constructor receives context
  constructor(context) {
    this.context = context;
    this.process = context.process;
    this.window = context.window;
    this.fs = context.fs;
    this.ipc = context.ipc;
    this.args = context.args;

    // App state
    this.state = {
      data: null,
      loading: false
    };

    // DOM elements
    this.container = null;
  }

  // Required: Initialize application
  async init() {
    // Request permissions
    await this.requestPermissions();

    // Load configuration
    await this.loadConfig();

    // Setup event listeners
    this.setupEventListeners();

    // Load initial data
    await this.loadData();
  }

  // Required: Render application UI
  render() {
    this.container = document.createElement('div');
    this.container.className = 'my-app';

    // Build UI
    this.buildUI();

    return this.container;
  }

  // Optional: Clean up resources
  async cleanup() {
    // Remove event listeners
    // Close connections
    // Save state
  }

  // Helper methods
  async requestPermissions() {
    // Request necessary permissions
  }

  async loadConfig() {
    // Load app configuration
  }

  setupEventListeners() {
    // Setup event listeners
  }

  async loadData() {
    // Load initial data
  }

  buildUI() {
    // Build user interface
  }
}
```

---

## Best Practices

### 1. State Management

Use a simple state management pattern:

```javascript
class AppState {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = new Set();
  }

  getState() {
    return { ...this.state };
  }

  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }
}

// Usage in app
class MyApp {
  constructor(context) {
    this.context = context;
    this.state = new AppState({
      count: 0,
      items: []
    });

    this.state.subscribe((newState) => {
      this.render(newState);
    });
  }

  increment() {
    const { count } = this.state.getState();
    this.state.setState({ count: count + 1 });
  }
}
```

### 2. Component-Based Architecture

Break down UI into reusable components:

```javascript
// components/Button.js
export class Button {
  constructor({ label, onClick, variant = 'primary' }) {
    this.label = label;
    this.onClick = onClick;
    this.variant = variant;
  }

  render() {
    const button = document.createElement('button');
    button.className = `btn btn-${this.variant}`;
    button.textContent = this.label;
    button.onclick = this.onClick;
    return button;
  }
}

// Usage
import { Button } from './components/Button.js';

const saveButton = new Button({
  label: 'Save',
  variant: 'primary',
  onClick: () => this.save()
});

container.appendChild(saveButton.render());
```

### 3. Error Handling

Always handle errors gracefully:

```javascript
async loadData() {
  this.setState({ loading: true, error: null });

  try {
    const data = await this.fs.readFile('/data.json', {
      encoding: 'utf8'
    });

    this.setState({
      data: JSON.parse(data),
      loading: false
    });
  } catch (error) {
    console.error('Failed to load data:', error);

    this.setState({
      error: 'Failed to load data. Please try again.',
      loading: false
    });

    this.showErrorNotification(error.message);
  }
}

showErrorNotification(message) {
  // Show user-friendly error message
  const notification = document.createElement('div');
  notification.className = 'error-notification';
  notification.textContent = message;
  this.container.appendChild(notification);

  setTimeout(() => notification.remove(), 5000);
}
```

### 4. Performance Optimization

#### Lazy Loading

```javascript
async loadModule(moduleName) {
  if (!this.modules.has(moduleName)) {
    const module = await import(`./modules/${moduleName}.js`);
    this.modules.set(moduleName, module.default);
  }
  return this.modules.get(moduleName);
}
```

#### Virtual Scrolling for Large Lists

```javascript
class VirtualList {
  constructor(items, itemHeight, renderItem) {
    this.items = items;
    this.itemHeight = itemHeight;
    this.renderItem = renderItem;
    this.scrollTop = 0;
  }

  render(containerHeight) {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const endIndex = Math.ceil(
      (this.scrollTop + containerHeight) / this.itemHeight
    );

    const visibleItems = this.items.slice(startIndex, endIndex);

    return visibleItems.map((item, index) =>
      this.renderItem(item, startIndex + index)
    );
  }

  onScroll(scrollTop) {
    this.scrollTop = scrollTop;
    this.update();
  }
}
```

#### Debouncing and Throttling

```javascript
// Debounce: Wait until user stops typing
function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

// Throttle: Limit execution rate
function throttle(func, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Usage
searchInput.oninput = debounce((e) => {
  this.search(e.target.value);
}, 300);

window.onscroll = throttle(() => {
  this.handleScroll();
}, 100);
```

### 5. Memory Management

```javascript
class MyApp {
  constructor(context) {
    this.context = context;
    this.eventHandlers = [];
    this.intervals = [];
    this.watchers = [];
  }

  addEventListener(element, event, handler) {
    element.addEventListener(event, handler);
    this.eventHandlers.push({ element, event, handler });
  }

  setInterval(callback, delay) {
    const id = setInterval(callback, delay);
    this.intervals.push(id);
    return id;
  }

  watchFile(path, callback) {
    const unwatch = this.fs.watch(path, callback);
    this.watchers.push(unwatch);
    return unwatch;
  }

  async cleanup() {
    // Remove event listeners
    this.eventHandlers.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });

    // Clear intervals
    this.intervals.forEach(id => clearInterval(id));

    // Remove file watchers
    this.watchers.forEach(unwatch => unwatch());

    // Clear references
    this.eventHandlers = [];
    this.intervals = [];
    this.watchers = [];
  }
}
```

---

## Advanced Topics

### 1. Inter-Process Communication (IPC)

**Broadcasting messages**:

```javascript
class ChatApp {
  constructor(context) {
    this.context = context;
    this.setupIPC();
  }

  setupIPC() {
    this.context.ipc.subscribe('chat-message', (event) => {
      this.onMessageReceived(event.detail);
    });
  }

  sendMessage(message) {
    this.context.ipc.broadcast({
      type: 'chat-message',
      sender: this.process.pid,
      text: message,
      timestamp: Date.now()
    });
  }

  onMessageReceived(message) {
    // Don't display our own messages
    if (message.sender === this.process.pid) return;

    this.displayMessage(message);
  }
}
```

**Direct communication**:

```javascript
// Create dedicated channel
const channel = this.context.ipc.createChannel(targetProcessId);

channel.onmessage = (event) => {
  console.log('Received:', event.data);
};

channel.postMessage({ type: 'hello', data: 'world' });
```

### 2. File System Operations

**Reading and writing files**:

```javascript
class DocumentEditor {
  async loadDocument(path) {
    try {
      const content = await this.fs.readFile(path, { encoding: 'utf8' });
      return content;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create it
        await this.fs.writeFile(path, '', { encoding: 'utf8' });
        return '';
      }
      throw error;
    }
  }

  async saveDocument(path, content) {
    // Create directory if needed
    const dir = path.substring(0, path.lastIndexOf('/'));
    await this.fs.mkdir(dir, { recursive: true });

    // Save file
    await this.fs.writeFile(path, content, { encoding: 'utf8' });

    // Create backup
    const backupPath = `${path}.backup`;
    await this.fs.copy(path, backupPath);
  }

  async autoSave() {
    this.autoSaveTimer = setInterval(async () => {
      if (this.isDirty) {
        await this.saveDocument(this.currentPath, this.getContent());
        this.isDirty = false;
      }
    }, 30000); // Auto-save every 30 seconds
  }
}
```

**Watching for file changes**:

```javascript
class FileWatcher {
  constructor(fs) {
    this.fs = fs;
    this.watchers = new Map();
  }

  watch(path, callback) {
    const unwatch = this.fs.watch(path, (event) => {
      callback({
        path: event.path,
        operation: event.operation,
        timestamp: Date.now()
      });
    });

    this.watchers.set(path, unwatch);
  }

  unwatch(path) {
    const unwatch = this.watchers.get(path);
    if (unwatch) {
      unwatch();
      this.watchers.delete(path);
    }
  }

  unwatchAll() {
    this.watchers.forEach(unwatch => unwatch());
    this.watchers.clear();
  }
}
```

### 3. Working with Web Workers

**Creating a worker**:

```javascript
// workers/processor.js
self.addEventListener('message', async (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'process':
      const result = processLargeData(data);
      self.postMessage({ type: 'result', result });
      break;

    case 'cancel':
      self.close();
      break;
  }
});

function processLargeData(data) {
  // Heavy computation
  return data.map(item => {
    // Process each item
    return transformItem(item);
  });
}
```

**Using the worker**:

```javascript
class DataProcessor {
  constructor() {
    this.worker = new Worker('/workers/processor.js');
    this.setupWorker();
  }

  setupWorker() {
    this.worker.onmessage = (event) => {
      const { type, result } = event.data;

      if (type === 'result') {
        this.onProcessingComplete(result);
      }
    };

    this.worker.onerror = (error) => {
      console.error('Worker error:', error);
      this.onProcessingError(error);
    };
  }

  async processData(data) {
    return new Promise((resolve, reject) => {
      this.onProcessingComplete = resolve;
      this.onProcessingError = reject;

      this.worker.postMessage({
        type: 'process',
        data
      });
    });
  }

  cancel() {
    this.worker.postMessage({ type: 'cancel' });
  }

  cleanup() {
    this.worker.terminate();
  }
}
```

### 4. Network Operations

**Making HTTP requests**:

```javascript
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Usage
const api = new APIClient('https://api.example.com');
const data = await api.get('/users');
```

### 5. Custom Events

```javascript
class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.events.has(event)) return;

    const callbacks = this.events.get(event);
    const index = callbacks.indexOf(callback);

    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.events.has(event)) return;

    this.events.get(event).forEach(callback => {
      callback(data);
    });
  }
}

// Usage in app
class MyApp extends EventEmitter {
  constructor(context) {
    super();
    this.context = context;

    this.on('data-loaded', (data) => {
      console.log('Data loaded:', data);
    });
  }

  async loadData() {
    const data = await this.fetchData();
    this.emit('data-loaded', data);
  }
}
```

---

## Example Applications

### Example 1: To-Do List Application

```javascript
export default class TodoApp {
  constructor(context) {
    this.context = context;
    this.todos = [];
    this.container = null;
    this.storageKey = '/home/user/todos.json';
  }

  async init() {
    await this.loadTodos();
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'todo-app';
    this.container.innerHTML = `
      <div class="todo-header">
        <h2>My Tasks</h2>
        <div class="todo-input-group">
          <input type="text" id="todo-input" placeholder="Add a new task...">
          <button id="add-btn">Add</button>
        </div>
      </div>
      <ul id="todo-list"></ul>
    `;

    this.container.querySelector('#add-btn').onclick = () => this.addTodo();
    this.container.querySelector('#todo-input').onkeypress = (e) => {
      if (e.key === 'Enter') this.addTodo();
    };

    this.renderTodos();
    return this.container;
  }

  async loadTodos() {
    try {
      const data = await this.context.fs.readFile(this.storageKey, {
        encoding: 'utf8'
      });
      this.todos = JSON.parse(data);
    } catch (error) {
      this.todos = [];
    }
  }

  async saveTodos() {
    await this.context.fs.writeFile(
      this.storageKey,
      JSON.stringify(this.todos, null, 2),
      { encoding: 'utf8' }
    );
  }

  async addTodo() {
    const input = this.container.querySelector('#todo-input');
    const text = input.value.trim();

    if (!text) return;

    this.todos.push({
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date().toISOString()
    });

    input.value = '';
    await this.saveTodos();
    this.renderTodos();
  }

  async toggleTodo(id) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      await this.saveTodos();
      this.renderTodos();
    }
  }

  async deleteTodo(id) {
    this.todos = this.todos.filter(t => t.id !== id);
    await this.saveTodos();
    this.renderTodos();
  }

  renderTodos() {
    const list = this.container.querySelector('#todo-list');
    list.innerHTML = '';

    this.todos.forEach(todo => {
      const li = document.createElement('li');
      li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
      li.innerHTML = `
        <input type="checkbox" ${todo.completed ? 'checked' : ''}>
        <span class="todo-text">${todo.text}</span>
        <button class="delete-btn">Delete</button>
      `;

      li.querySelector('input').onchange = () => this.toggleTodo(todo.id);
      li.querySelector('.delete-btn').onclick = () => this.deleteTodo(todo.id);

      list.appendChild(li);
    });
  }
}
```

### Example 2: Image Viewer

```javascript
export default class ImageViewer {
  constructor(context) {
    this.context = context;
    this.currentImage = null;
    this.images = [];
    this.currentIndex = 0;
  }

  async init() {
    if (this.context.args.file) {
      await this.loadImage(this.context.args.file);
    }
  }

  render() {
    const container = document.createElement('div');
    container.className = 'image-viewer';
    container.innerHTML = `
      <div class="toolbar">
        <button id="open-btn">Open</button>
        <button id="prev-btn">Previous</button>
        <button id="next-btn">Next</button>
        <button id="zoom-in">Zoom In</button>
        <button id="zoom-out">Zoom Out</button>
      </div>
      <div class="image-container">
        <img id="image-display" src="" alt="No image loaded">
      </div>
    `;

    container.querySelector('#open-btn').onclick = () => this.openFile();
    container.querySelector('#prev-btn').onclick = () => this.previousImage();
    container.querySelector('#next-btn').onclick = () => this.nextImage();
    container.querySelector('#zoom-in').onclick = () => this.zoom(1.2);
    container.querySelector('#zoom-out').onclick = () => this.zoom(0.8);

    this.container = container;
    return container;
  }

  async loadImage(path) {
    try {
      const buffer = await this.context.fs.readFile(path);
      const blob = new Blob([buffer]);
      const url = URL.createObjectURL(blob);

      const img = this.container.querySelector('#image-display');
      img.src = url;

      this.currentImage = { path, url };
    } catch (error) {
      console.error('Failed to load image:', error);
      alert('Failed to load image');
    }
  }

  async openFile() {
    // Show file picker dialog
    // This would integrate with a file manager
    const path = prompt('Enter image path:');
    if (path) {
      await this.loadImage(path);
    }
  }

  previousImage() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.loadImage(this.images[this.currentIndex]);
    }
  }

  nextImage() {
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex++;
      this.loadImage(this.images[this.currentIndex]);
    }
  }

  zoom(factor) {
    const img = this.container.querySelector('#image-display');
    const currentWidth = img.width || img.naturalWidth;
    img.style.width = `${currentWidth * factor}px`;
  }

  async cleanup() {
    if (this.currentImage && this.currentImage.url) {
      URL.revokeObjectURL(this.currentImage.url);
    }
  }
}
```

---

## Debugging & Testing

### Console Logging

```javascript
class Logger {
  constructor(namespace) {
    this.namespace = namespace;
    this.enabled = true;
  }

  log(...args) {
    if (this.enabled) {
      console.log(`[${this.namespace}]`, ...args);
    }
  }

  error(...args) {
    console.error(`[${this.namespace}]`, ...args);
  }

  warn(...args) {
    console.warn(`[${this.namespace}]`, ...args);
  }
}

// Usage
const logger = new Logger('MyApp');
logger.log('Application started');
```

### Performance Monitoring

```javascript
class PerformanceMonitor {
  static measure(name, fn) {
    const start = performance.now();
    const result = fn();

    if (result instanceof Promise) {
      return result.then(value => {
        const duration = performance.now() - start;
        console.log(`${name} took ${duration.toFixed(2)}ms`);
        return value;
      });
    }

    const duration = performance.now() - start;
    console.log(`${name} took ${duration.toFixed(2)}ms`);
    return result;
  }
}

// Usage
await PerformanceMonitor.measure('Load data', async () => {
  return await this.loadData();
});
```

### Unit Testing

```javascript
// tests/my-app.test.js
import { describe, it, expect } from 'vitest';
import MyApp from '../apps/my-app/index.js';

describe('MyApp', () => {
  it('should initialize correctly', async () => {
    const mockContext = {
      process: { pid: 1 },
      window: {},
      fs: {},
      ipc: {}
    };

    const app = new MyApp(mockContext);
    await app.init();

    expect(app.container).toBeTruthy();
  });

  it('should handle data loading', async () => {
    // Test data loading
  });
});
```

---

## Publishing

### 1. Prepare Your Application

- Clean up code
- Remove console.logs
- Optimize assets
- Write documentation

### 2. Create Manifest

```json
{
  "id": "my-app",
  "name": "My Application",
  "version": "1.0.0",
  "description": "A comprehensive application for WebOS",
  "author": "Your Name",
  "license": "MIT",
  "icon": "🚀",
  "screenshots": [
    "/apps/my-app/screenshots/main.png",
    "/apps/my-app/screenshots/settings.png"
  ],
  "type": "web",
  "entry": "/apps/my-app/index.js",
  "permissions": [
    "filesystem.read",
    "filesystem.write"
  ],
  "minOSVersion": "1.0.0"
}
```

### 3. Package Your App

Bundle all files and dependencies.

### 4. Test Thoroughly

- Test on different browsers
- Test offline functionality
- Test with different permissions
- Test error scenarios

---

## Resources

- [WebOS Architecture](./WEB_OS_ARCHITECTURE.md)
- [API Reference](./API_REFERENCE.md)
- [Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md)

---

Happy coding! 🚀
