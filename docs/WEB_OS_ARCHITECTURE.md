# Web-Based Operating System - Comprehensive Architecture Guide

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Architecture](#core-architecture)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Advanced Features](#advanced-features)
6. [Performance Optimization](#performance-optimization)
7. [Security Model](#security-model)
8. [Deployment Strategy](#deployment-strategy)

---

## Executive Summary

This document outlines the architecture for building a **production-grade web-based operating system** that runs entirely in the browser and can be deployed on GitHub Pages. This system will provide a familiar desktop-like environment with modern OS features including:

- **Virtual File System** with persistent storage (OPFS + IndexedDB)
- **Process Management** with task scheduling and inter-process communication
- **Window Manager** with full drag, resize, maximize, and multi-window support
- **Application Runtime** supporting native web apps and WebAssembly applications
- **Service Workers** for offline capability and resource caching
- **Progressive Web App (PWA)** features for installation and native-like experience
- **Permission System** for security and resource access control
- **Virtual Terminal** with command-line interface
- **Network Stack** with virtual networking capabilities

---

## Core Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Desktop    │  │    Taskbar   │  │  Start Menu  │          │
│  │  Environment │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                     Window Management Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │Window Manager│  │ Compositor   │  │  Input Mgr   │          │
│  │   (WinBox)   │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                     Application Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Web Apps    │  │  WASM Apps   │  │  Terminal    │          │
│  │              │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                        System Services Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Process    │  │  Scheduler   │  │     IPC      │          │
│  │   Manager    │  │              │  │  (Message)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Permissions  │  │   Security   │  │   Network    │          │
│  │   Manager    │  │   Context    │  │    Stack     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      Storage & I/O Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     OPFS     │  │  IndexedDB   │  │  Cache API   │          │
│  │ (File System)│  │  (Metadata)  │  │  (Assets)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ LocalStorage │  │  Fetch API   │                            │
│  │  (Settings)  │  │  (Network)   │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    Browser Platform Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │Service Worker│  │  Web Workers │  │  WASM Engine │          │
│  │              │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Core Design Principles

1. **Progressive Enhancement**: Start with basic functionality, enhance with modern APIs
2. **Offline-First**: Everything should work without network connectivity
3. **Modular Architecture**: Each component is independent and replaceable
4. **Event-Driven**: Use message passing for loose coupling
5. **Security by Default**: Sandboxing, origin isolation, and permission-based access
6. **Performance-Oriented**: Lazy loading, code splitting, worker offloading

---

## Technology Stack

### Core Technologies

| Technology | Purpose | Browser Support |
|------------|---------|----------------|
| **HTML5/CSS3** | UI structure and styling | Universal |
| **JavaScript (ES2022+)** | Core logic and orchestration | All modern browsers |
| **TypeScript** | Type safety and better DX | Compile-time |
| **WebAssembly** | High-performance computing | All modern browsers |
| **Service Workers** | Offline support, caching | All modern browsers |
| **Web Workers** | Background processing | All modern browsers |

### Storage APIs

| API | Use Case | Capacity | Performance |
|-----|----------|----------|-------------|
| **OPFS** (Origin Private File System) | File storage, binary data | ~60% of disk | **Excellent** (3-4x faster than IndexedDB) |
| **IndexedDB** | Structured data, metadata | ~60% of disk | Good (async) |
| **Cache API** | Static assets, app resources | ~60% of disk | Excellent |
| **localStorage** | User preferences, settings | ~10MB | Fast (sync) |

### Modern Browser APIs

```javascript
// Key APIs we'll leverage:
- File System Access API (OPFS)
- Scheduler API (Prioritized Task Scheduling)
- Web Locks API (Synchronization)
- Broadcast Channel API (IPC)
- IndexedDB (Structured storage)
- Service Worker API (Offline, caching)
- Web Workers API (Background processing)
- WebAssembly (WASM execution)
- Canvas/WebGL (Graphics)
- Web Audio API (Sound)
- Fetch API (Networking)
- Streams API (Data streaming)
```

### UI Framework Options

**Recommended Approach**: **Vanilla JavaScript + Web Components** or **React**

| Framework | Pros | Cons | Recommendation |
|-----------|------|------|----------------|
| **Vanilla JS + Web Components** | No dependencies, fast, native | More boilerplate | ⭐ Best for max performance |
| **React** | Rich ecosystem, good DX | Bundle size, virtual DOM overhead | ⭐ Best for rapid development |
| **Vue 3** | Small size, good performance | Less ecosystem | Good alternative |
| **Svelte** | Compiles to vanilla JS, tiny | Smaller ecosystem | Good for embedded apps |

### Window Management Libraries

| Library | Features | Bundle Size | Recommendation |
|---------|----------|-------------|----------------|
| **WinBox.js** | Lightweight, modern, fast | ~20KB | ⭐ **Recommended** |
| **jsPanel** | Feature-rich, mature | ~100KB | Alternative |
| **GoldenLayout** | Complex layouts | ~150KB | For advanced layouts |
| **Custom Solution** | Maximum control | Variable | For specific needs |

---

## System Components

### 1. Kernel (Core System)

The kernel is the heart of the WebOS, managing system resources and providing core services.

#### 1.1 Process Manager

**Responsibilities:**
- Track running processes/applications
- Lifecycle management (spawn, suspend, resume, terminate)
- Resource allocation and limits
- Process isolation

**Implementation:**

```javascript
// /src/kernel/ProcessManager.js

class Process {
  constructor(config) {
    this.pid = crypto.randomUUID();
    this.name = config.name;
    this.state = 'created'; // created, running, suspended, terminated
    this.priority = config.priority || 'user-visible';
    this.parentPid = config.parentPid || null;
    this.createdAt = Date.now();
    this.worker = null;
    this.window = null;
    this.permissions = new Set(config.permissions || []);
    this.resources = {
      memory: 0,
      cpu: 0,
      storage: 0
    };
  }

  async start() {
    this.state = 'running';
    this.startedAt = Date.now();

    if (this.config.worker) {
      this.worker = new Worker(this.config.workerScript);
      this.worker.postMessage({ type: 'init', pid: this.pid });
    }

    await this.emit('started');
  }

  suspend() {
    if (this.state === 'running') {
      this.state = 'suspended';
      this.worker?.postMessage({ type: 'suspend' });
      this.emit('suspended');
    }
  }

  resume() {
    if (this.state === 'suspended') {
      this.state = 'running';
      this.worker?.postMessage({ type: 'resume' });
      this.emit('resumed');
    }
  }

  async terminate() {
    this.state = 'terminated';
    this.worker?.terminate();
    await this.emit('terminated');
  }
}

class ProcessManager extends EventTarget {
  constructor() {
    super();
    this.processes = new Map();
    this.nextPid = 1;
  }

  async spawn(config) {
    const process = new Process({
      ...config,
      pid: this.nextPid++
    });

    this.processes.set(process.pid, process);
    await process.start();

    this.dispatchEvent(new CustomEvent('process-spawned', {
      detail: { process }
    }));

    return process;
  }

  getProcess(pid) {
    return this.processes.get(pid);
  }

  listProcesses() {
    return Array.from(this.processes.values());
  }

  async killProcess(pid) {
    const process = this.processes.get(pid);
    if (process) {
      await process.terminate();
      this.processes.delete(pid);

      this.dispatchEvent(new CustomEvent('process-terminated', {
        detail: { pid }
      }));
    }
  }

  getProcessTree() {
    const tree = [];
    const roots = Array.from(this.processes.values())
      .filter(p => !p.parentPid);

    roots.forEach(root => {
      tree.push(this._buildProcessTree(root));
    });

    return tree;
  }

  _buildProcessTree(process) {
    const children = Array.from(this.processes.values())
      .filter(p => p.parentPid === process.pid)
      .map(child => this._buildProcessTree(child));

    return {
      ...process,
      children
    };
  }
}

export default new ProcessManager();
```

#### 1.2 Task Scheduler

Uses the browser's **Prioritized Task Scheduling API** for efficient task management.

```javascript
// /src/kernel/Scheduler.js

class TaskScheduler {
  constructor() {
    this.scheduler = window.scheduler || this._polyfill();
    this.taskQueue = {
      'user-blocking': [],
      'user-visible': [],
      'background': []
    };
  }

  async scheduleTask(callback, options = {}) {
    const {
      priority = 'user-visible',
      delay = 0,
      signal = null
    } = options;

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return this.scheduler.postTask(callback, {
      priority,
      signal
    });
  }

  async yield() {
    // Yield control back to browser
    if (this.scheduler.yield) {
      await this.scheduler.yield();
    } else {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  createAbortController() {
    return new AbortController();
  }

  _polyfill() {
    // Polyfill for browsers without Scheduler API
    return {
      postTask: async (callback, options) => {
        return new Promise((resolve, reject) => {
          const priority = options?.priority || 'user-visible';
          const delay = priority === 'background' ? 100 : 0;

          setTimeout(async () => {
            try {
              resolve(await callback());
            } catch (error) {
              reject(error);
            }
          }, delay);
        });
      }
    };
  }
}

export default new TaskScheduler();
```

#### 1.3 Inter-Process Communication (IPC)

```javascript
// /src/kernel/IPC.js

class MessageBus extends EventTarget {
  constructor() {
    super();
    this.channels = new Map();
    this.broadcastChannel = new BroadcastChannel('webos-system');

    this.broadcastChannel.onmessage = (event) => {
      this.dispatchEvent(new CustomEvent('message', {
        detail: event.data
      }));
    };
  }

  send(target, message) {
    // Send to specific process
    const channel = this.channels.get(target);
    if (channel) {
      channel.postMessage(message);
    }
  }

  broadcast(message) {
    // Broadcast to all processes
    this.broadcastChannel.postMessage(message);
  }

  subscribe(topic, callback) {
    this.addEventListener(topic, callback);
  }

  unsubscribe(topic, callback) {
    this.removeEventListener(topic, callback);
  }

  createChannel(processId) {
    const channel = new MessageChannel();
    this.channels.set(processId, channel.port1);
    return channel.port2;
  }
}

export default new MessageBus();
```

### 2. Virtual File System (VFS)

The VFS provides a unified interface to multiple storage backends.

#### 2.1 File System Architecture

```javascript
// /src/filesystem/VFS.js

class VirtualFileSystem {
  constructor() {
    this.root = null;
    this.mounted = new Map();
    this.cache = new Map();
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    // Initialize OPFS as primary storage
    this.root = await navigator.storage.getDirectory();

    // Mount virtual directories
    await this.mount('/home', new OPFSDriver());
    await this.mount('/tmp', new MemoryDriver());
    await this.mount('/media', new IndexedDBDriver());

    // Create standard directories
    await this.mkdir('/home/user');
    await this.mkdir('/home/user/Documents');
    await this.mkdir('/home/user/Downloads');
    await this.mkdir('/home/user/Pictures');
    await this.mkdir('/home/user/Desktop');

    this.initialized = true;
  }

  async mount(path, driver) {
    this.mounted.set(path, driver);
    await driver.init();
  }

  _resolveDriver(path) {
    for (const [mountPoint, driver] of this.mounted.entries()) {
      if (path.startsWith(mountPoint)) {
        return {
          driver,
          relativePath: path.slice(mountPoint.length) || '/'
        };
      }
    }
    throw new Error(`No driver mounted for path: ${path}`);
  }

  async readFile(path, options = {}) {
    const { driver, relativePath } = this._resolveDriver(path);
    return await driver.readFile(relativePath, options);
  }

  async writeFile(path, data, options = {}) {
    const { driver, relativePath } = this._resolveDriver(path);
    await driver.writeFile(relativePath, data, options);

    this.dispatchEvent(new CustomEvent('file-changed', {
      detail: { path, operation: 'write' }
    }));
  }

  async mkdir(path, options = {}) {
    const { driver, relativePath } = this._resolveDriver(path);
    await driver.mkdir(relativePath, options);
  }

  async readdir(path) {
    const { driver, relativePath } = this._resolveDriver(path);
    return await driver.readdir(relativePath);
  }

  async rm(path, options = {}) {
    const { driver, relativePath } = this._resolveDriver(path);
    await driver.rm(relativePath, options);

    this.dispatchEvent(new CustomEvent('file-changed', {
      detail: { path, operation: 'delete' }
    }));
  }

  async stat(path) {
    const { driver, relativePath } = this._resolveDriver(path);
    return await driver.stat(relativePath);
  }

  async rename(oldPath, newPath) {
    const { driver, relativePath: oldRelativePath } = this._resolveDriver(oldPath);
    const { relativePath: newRelativePath } = this._resolveDriver(newPath);
    await driver.rename(oldRelativePath, newRelativePath);
  }

  async copy(srcPath, destPath) {
    const data = await this.readFile(srcPath);
    await this.writeFile(destPath, data);
  }

  watch(path, callback) {
    const handler = (event) => {
      if (event.detail.path.startsWith(path)) {
        callback(event.detail);
      }
    };
    this.addEventListener('file-changed', handler);
    return () => this.removeEventListener('file-changed', handler);
  }
}

// OPFS Driver Implementation
class OPFSDriver {
  async init() {
    this.root = await navigator.storage.getDirectory();
  }

  async readFile(path, options = {}) {
    const file = await this._getFileHandle(path);
    const fileObj = await file.getFile();

    if (options.encoding === 'utf8') {
      return await fileObj.text();
    }
    return await fileObj.arrayBuffer();
  }

  async writeFile(path, data, options = {}) {
    const file = await this._getFileHandle(path, { create: true });
    const writable = await file.createWritable();

    if (typeof data === 'string') {
      await writable.write(data);
    } else {
      await writable.write(new Blob([data]));
    }

    await writable.close();
  }

  async mkdir(path, options = {}) {
    await this._getDirectoryHandle(path, { create: true });
  }

  async readdir(path) {
    const dir = await this._getDirectoryHandle(path);
    const entries = [];

    for await (const entry of dir.values()) {
      entries.push({
        name: entry.name,
        kind: entry.kind,
        type: entry.kind === 'file' ? 'file' : 'directory'
      });
    }

    return entries;
  }

  async rm(path, options = {}) {
    const parts = path.split('/').filter(Boolean);
    const name = parts.pop();
    const parentPath = '/' + parts.join('/');

    const parent = await this._getDirectoryHandle(parentPath);
    await parent.removeEntry(name, { recursive: options.recursive });
  }

  async stat(path) {
    try {
      const file = await this._getFileHandle(path);
      const fileObj = await file.getFile();

      return {
        type: 'file',
        size: fileObj.size,
        mtime: fileObj.lastModified,
        name: fileObj.name
      };
    } catch (e) {
      const dir = await this._getDirectoryHandle(path);
      return {
        type: 'directory',
        size: 0,
        name: dir.name
      };
    }
  }

  async _getDirectoryHandle(path, options = {}) {
    const parts = path.split('/').filter(Boolean);
    let current = this.root;

    for (const part of parts) {
      current = await current.getDirectoryHandle(part, options);
    }

    return current;
  }

  async _getFileHandle(path, options = {}) {
    const parts = path.split('/').filter(Boolean);
    const fileName = parts.pop();
    const dirPath = '/' + parts.join('/');

    const dir = await this._getDirectoryHandle(dirPath, options);
    return await dir.getFileHandle(fileName, options);
  }
}

export default new VirtualFileSystem();
```

### 3. Window Manager

Manages application windows with full desktop-like capabilities.

```javascript
// /src/ui/WindowManager.js
import WinBox from 'winbox';

class WindowManager extends EventTarget {
  constructor() {
    super();
    this.windows = new Map();
    this.zIndexCounter = 1000;
    this.activeWindow = null;
  }

  createWindow(config) {
    const defaultConfig = {
      title: 'Untitled',
      width: 600,
      height: 400,
      x: 'center',
      y: 'center',
      minwidth: 200,
      minheight: 150,
      background: '#ffffff',
      border: 4,
      onclose: (force) => {
        if (!force && config.onBeforeClose) {
          return config.onBeforeClose();
        }
        this.closeWindow(winbox.id);
        return true;
      },
      onfocus: () => {
        this.activeWindow = winbox.id;
        this.dispatchEvent(new CustomEvent('window-focused', {
          detail: { windowId: winbox.id }
        }));
      }
    };

    const winbox = new WinBox({
      ...defaultConfig,
      ...config,
      index: this.zIndexCounter++
    });

    this.windows.set(winbox.id, {
      winbox,
      process: config.process,
      config
    });

    this.dispatchEvent(new CustomEvent('window-created', {
      detail: { windowId: winbox.id }
    }));

    return winbox;
  }

  closeWindow(windowId) {
    const window = this.windows.get(windowId);
    if (window) {
      window.winbox.close(true);
      this.windows.delete(windowId);

      this.dispatchEvent(new CustomEvent('window-closed', {
        detail: { windowId }
      }));
    }
  }

  minimizeWindow(windowId) {
    const window = this.windows.get(windowId);
    if (window) {
      window.winbox.minimize();
    }
  }

  maximizeWindow(windowId) {
    const window = this.windows.get(windowId);
    if (window) {
      window.winbox.maximize();
    }
  }

  focusWindow(windowId) {
    const window = this.windows.get(windowId);
    if (window) {
      window.winbox.focus();
      this.activeWindow = windowId;
    }
  }

  getWindow(windowId) {
    return this.windows.get(windowId);
  }

  listWindows() {
    return Array.from(this.windows.values());
  }

  cascadeWindows() {
    let offset = 0;
    this.windows.forEach(({ winbox }) => {
      winbox.move(100 + offset, 100 + offset);
      offset += 30;
    });
  }

  tileWindows() {
    const windows = Array.from(this.windows.values());
    const count = windows.length;

    if (count === 0) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - 50; // Account for taskbar

    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const windowWidth = screenWidth / cols;
    const windowHeight = screenHeight / rows;

    windows.forEach(({ winbox }, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      winbox.resize(windowWidth - 10, windowHeight - 10);
      winbox.move(col * windowWidth + 5, row * windowHeight + 5);
    });
  }
}

export default new WindowManager();
```

### 4. Application Runtime

```javascript
// /src/apps/AppRuntime.js

class Application {
  constructor(manifest) {
    this.id = manifest.id;
    this.name = manifest.name;
    this.version = manifest.version;
    this.icon = manifest.icon;
    this.permissions = manifest.permissions || [];
    this.type = manifest.type; // 'web', 'wasm', 'iframe'
    this.entry = manifest.entry;
  }

  async launch(args = {}) {
    const process = await ProcessManager.spawn({
      name: this.name,
      permissions: this.permissions
    });

    const window = WindowManager.createWindow({
      title: this.name,
      icon: this.icon,
      process: process.pid,
      ...args.windowConfig
    });

    const context = {
      process,
      window,
      fs: VFS,
      ipc: MessageBus,
      args
    };

    switch (this.type) {
      case 'web':
        await this._launchWebApp(context);
        break;
      case 'wasm':
        await this._launchWasmApp(context);
        break;
      case 'iframe':
        await this._launchIframeApp(context);
        break;
    }

    return { process, window };
  }

  async _launchWebApp(context) {
    const { entry } = this;
    const module = await import(entry);

    const app = new module.default(context);
    await app.init();

    context.window.body.appendChild(app.render());
  }

  async _launchWasmApp(context) {
    const response = await fetch(this.entry);
    const buffer = await response.arrayBuffer();
    const module = await WebAssembly.compile(buffer);
    const instance = await WebAssembly.instantiate(module, {
      env: this._createWasmEnv(context)
    });

    context.process.wasmInstance = instance;
    instance.exports.main();
  }

  async _launchIframeApp(context) {
    const iframe = document.createElement('iframe');
    iframe.src = this.entry;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    context.window.body.appendChild(iframe);
  }

  _createWasmEnv(context) {
    return {
      log: (ptr, len) => {
        // WASM logging implementation
        console.log('WASM Log:', ptr, len);
      },
      // Add more WASM system calls here
    };
  }
}

class AppRegistry {
  constructor() {
    this.apps = new Map();
  }

  register(manifest) {
    const app = new Application(manifest);
    this.apps.set(app.id, app);
    return app;
  }

  getApp(id) {
    return this.apps.get(id);
  }

  listApps() {
    return Array.from(this.apps.values());
  }

  async launchApp(id, args = {}) {
    const app = this.apps.get(id);
    if (!app) {
      throw new Error(`App not found: ${id}`);
    }
    return await app.launch(args);
  }
}

export default new AppRegistry();
```

---

## Advanced Features

### 1. Service Worker for Offline Support

```javascript
// /public/service-worker.js

const CACHE_NAME = 'webos-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});
```

### 2. Permission System

```javascript
// /src/security/PermissionManager.js

class PermissionManager {
  constructor() {
    this.permissions = new Map();
    this.grants = new Map(); // processId -> Set<permission>
  }

  registerPermission(name, config) {
    this.permissions.set(name, {
      name,
      description: config.description,
      dangerous: config.dangerous || false,
      requiresPrompt: config.requiresPrompt !== false
    });
  }

  async requestPermission(processId, permission) {
    const permConfig = this.permissions.get(permission);

    if (!permConfig) {
      throw new Error(`Unknown permission: ${permission}`);
    }

    if (permConfig.requiresPrompt) {
      const granted = await this._promptUser(processId, permConfig);
      if (granted) {
        this._grantPermission(processId, permission);
      }
      return granted;
    }

    this._grantPermission(processId, permission);
    return true;
  }

  hasPermission(processId, permission) {
    const grants = this.grants.get(processId);
    return grants ? grants.has(permission) : false;
  }

  revokePermission(processId, permission) {
    const grants = this.grants.get(processId);
    if (grants) {
      grants.delete(permission);
    }
  }

  _grantPermission(processId, permission) {
    if (!this.grants.has(processId)) {
      this.grants.set(processId, new Set());
    }
    this.grants.get(processId).add(permission);
  }

  async _promptUser(processId, permission) {
    // Show permission dialog to user
    return new Promise((resolve) => {
      const dialog = document.createElement('dialog');
      dialog.innerHTML = `
        <div class="permission-dialog">
          <h3>Permission Request</h3>
          <p>${permission.description}</p>
          <div class="actions">
            <button id="deny">Deny</button>
            <button id="allow">Allow</button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);
      dialog.showModal();

      dialog.querySelector('#allow').onclick = () => {
        dialog.close();
        document.body.removeChild(dialog);
        resolve(true);
      };

      dialog.querySelector('#deny').onclick = () => {
        dialog.close();
        document.body.removeChild(dialog);
        resolve(false);
      };
    });
  }
}

// Register standard permissions
const permissionManager = new PermissionManager();

permissionManager.registerPermission('filesystem.read', {
  description: 'Read files from the filesystem',
  dangerous: false
});

permissionManager.registerPermission('filesystem.write', {
  description: 'Write files to the filesystem',
  dangerous: true
});

permissionManager.registerPermission('network.fetch', {
  description: 'Make network requests',
  dangerous: true
});

permissionManager.registerPermission('notification.show', {
  description: 'Show notifications',
  dangerous: false
});

export default permissionManager;
```

### 3. Virtual Terminal

```javascript
// /src/apps/Terminal.js

class Terminal {
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
      ps: this.cmd_ps.bind(this)
    };

    if (builtins[command]) {
      return await builtins[command](args);
    }

    return `Command not found: ${command}`;
  }

  async cmd_ls(args) {
    const path = args[0] || this.currentDir;
    const fullPath = this._resolvePath(path);

    try {
      const entries = await this.context.fs.readdir(fullPath);
      return entries.map(e => e.name).join('\n');
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
      await this.context.fs.mkdir(path);
      return '';
    } catch (error) {
      return `mkdir: ${error.message}`;
    }
  }

  async cmd_rm(args) {
    if (args.length === 0) {
      return 'rm: missing operand';
    }

    const recursive = args[0] === '-r';
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
    const processes = this.context.process.listProcesses();
    let output = 'PID\tNAME\t\tSTATE\n';

    processes.forEach(proc => {
      output += `${proc.pid}\t${proc.name}\t\t${proc.state}\n`;
    });

    return output;
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
      } else if (part !== '.') {
        parts.push(part);
      }
    }

    return '/' + parts.join('/');
  }
}

export default Terminal;
```

---

## Performance Optimization

### 1. Code Splitting

```javascript
// Lazy load applications
const loadApp = async (appId) => {
  const module = await import(`./apps/${appId}/index.js`);
  return module.default;
};
```

### 2. Virtual Scrolling for File Lists

```javascript
// For large directory listings, implement virtual scrolling
class VirtualList {
  constructor(container, itemHeight, renderItem) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.renderItem = renderItem;
    this.items = [];
  }

  setItems(items) {
    this.items = items;
    this.render();
  }

  render() {
    const scrollTop = this.container.scrollTop;
    const visibleStart = Math.floor(scrollTop / this.itemHeight);
    const visibleEnd = Math.ceil((scrollTop + this.container.clientHeight) / this.itemHeight);

    // Only render visible items
    const fragment = document.createDocumentFragment();
    for (let i = visibleStart; i < visibleEnd && i < this.items.length; i++) {
      const item = this.renderItem(this.items[i], i);
      fragment.appendChild(item);
    }

    this.container.innerHTML = '';
    this.container.appendChild(fragment);
  }
}
```

### 3. Web Worker for Heavy Operations

```javascript
// Offload heavy file operations to web workers
// /src/workers/file-worker.js

self.addEventListener('message', async (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'search':
      const results = await searchFiles(data.query, data.path);
      self.postMessage({ type: 'search-results', results });
      break;

    case 'compress':
      const compressed = await compressFile(data.file);
      self.postMessage({ type: 'compressed', data: compressed });
      break;
  }
});
```

---

## Security Model

### Security Layers

1. **Origin Isolation**: Each app runs in its origin context
2. **Permission System**: Explicit permissions for sensitive operations
3. **Sandboxing**: Workers and iframes for untrusted code
4. **Content Security Policy**: Strict CSP headers
5. **Input Validation**: Sanitize all user inputs

### CSP Configuration

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self' data:;
  connect-src 'self' https://api.github.com;
  worker-src 'self' blob:;
  frame-src 'self';
">
```

---

## Deployment Strategy

### GitHub Pages Configuration

1. **Repository Structure**:
```
/
├── index.html
├── manifest.json
├── service-worker.js
├── assets/
│   ├── css/
│   ├── js/
│   └── icons/
├── apps/
│   ├── terminal/
│   ├── file-manager/
│   └── text-editor/
└── docs/
    └── README.md
```

2. **Build Process**:
```json
{
  "scripts": {
    "build": "vite build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. **manifest.json**:
```json
{
  "name": "WebOS",
  "short_name": "WebOS",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4285f4",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

4. **GitHub Actions Workflow**:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## Next Steps

See the companion implementation guides:
- [Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md)
- [API Reference](./API_REFERENCE.md)
- [Application Development Guide](./APP_DEVELOPMENT.md)
- [Performance Tuning](./PERFORMANCE_TUNING.md)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-18
**Target Platform**: Modern Browsers (Chrome 100+, Firefox 100+, Safari 16+, Edge 100+)
