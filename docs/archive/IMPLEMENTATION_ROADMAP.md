# Web Operating System - Implementation Roadmap

## Overview

This document provides a **detailed, step-by-step implementation plan** for building the Web Operating System. Follow these phases in order to build a fully functional web-based OS that runs on GitHub Pages.

---

## Table of Contents

1. [Phase 1: Foundation & Core Infrastructure](#phase-1-foundation--core-infrastructure)
2. [Phase 2: File System & Storage](#phase-2-file-system--storage)
3. [Phase 3: Process Management & Scheduling](#phase-3-process-management--scheduling)
4. [Phase 4: Window Manager & UI](#phase-4-window-manager--ui)
5. [Phase 5: Application Runtime](#phase-5-application-runtime)
6. [Phase 6: System Applications](#phase-6-system-applications)
7. [Phase 7: Service Workers & PWA](#phase-7-service-workers--pwa)
8. [Phase 8: Polish & Optimization](#phase-8-polish--optimization)
9. [Phase 9: Deployment & CI/CD](#phase-9-deployment--cicd)

---

## Phase 1: Foundation & Core Infrastructure

**Duration**: 1-2 weeks
**Complexity**: Medium
**Priority**: Critical

### 1.1 Project Setup

#### Initialize Project

```bash
# Create project directory
mkdir web-os
cd web-os

# Initialize npm project
npm init -y

# Install development dependencies
npm install --save-dev vite typescript @types/node
npm install --save-dev eslint prettier
npm install --save-dev gh-pages

# Install runtime dependencies
npm install winbox eventemitter3 idb comlink
```

#### Project Structure

Create the following directory structure:

```
web-os/
├── public/
│   ├── index.html
│   ├── manifest.json
│   ├── service-worker.js
│   └── icons/
│       ├── icon-192.png
│       ├── icon-512.png
│       └── favicon.ico
├── src/
│   ├── kernel/
│   │   ├── Kernel.js
│   │   ├── ProcessManager.js
│   │   ├── Scheduler.js
│   │   └── IPC.js
│   ├── filesystem/
│   │   ├── VFS.js
│   │   ├── drivers/
│   │   │   ├── OPFSDriver.js
│   │   │   ├── IndexedDBDriver.js
│   │   │   └── MemoryDriver.js
│   │   └── FileHandle.js
│   ├── ui/
│   │   ├── Desktop.js
│   │   ├── WindowManager.js
│   │   ├── Taskbar.js
│   │   └── StartMenu.js
│   ├── apps/
│   │   ├── AppRegistry.js
│   │   ├── terminal/
│   │   ├── file-manager/
│   │   └── text-editor/
│   ├── security/
│   │   └── PermissionManager.js
│   ├── utils/
│   │   ├── EventBus.js
│   │   └── Logger.js
│   └── main.js
├── styles/
│   ├── main.css
│   ├── desktop.css
│   └── window.css
├── tests/
│   └── ...
├── docs/
│   └── ...
├── package.json
├── vite.config.js
├── tsconfig.json
└── README.md
```

#### Configure Vite

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html'),
        sw: resolve(__dirname, 'public/service-worker.js')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
```

### 1.2 Create Base HTML Structure

```html
<!-- public/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="A web-based operating system running in your browser">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'wasm-unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob:;
    font-src 'self' data:;
    connect-src 'self';
    worker-src 'self' blob:;
  ">

  <title>WebOS - Browser Operating System</title>

  <link rel="manifest" href="/manifest.json">
  <link rel="icon" type="image/x-icon" href="/icons/favicon.ico">
  <link rel="apple-touch-icon" href="/icons/icon-192.png">

  <link rel="stylesheet" href="/styles/main.css">
  <link rel="stylesheet" href="/styles/desktop.css">
  <link rel="stylesheet" href="/styles/window.css">

  <meta name="theme-color" content="#4285f4">
</head>
<body>
  <!-- Boot Screen -->
  <div id="boot-screen" class="boot-screen">
    <div class="boot-logo">
      <h1>WebOS</h1>
      <div class="boot-progress">
        <div class="boot-progress-bar"></div>
      </div>
      <p class="boot-message">Initializing system...</p>
    </div>
  </div>

  <!-- Desktop -->
  <div id="desktop" class="desktop" style="display: none;">
    <!-- Desktop icons will be rendered here -->
    <div id="desktop-icons" class="desktop-icons"></div>

    <!-- Windows will be rendered here -->
    <div id="windows-container"></div>
  </div>

  <!-- Taskbar -->
  <div id="taskbar" class="taskbar" style="display: none;">
    <div class="taskbar-start">
      <button id="start-button" class="start-button">
        <span class="icon">⊞</span>
        <span class="text">Start</span>
      </button>
    </div>

    <div id="taskbar-windows" class="taskbar-windows"></div>

    <div class="taskbar-tray">
      <div id="system-tray" class="system-tray">
        <button class="tray-icon" id="network-status" title="Network">📶</button>
        <button class="tray-icon" id="volume-control" title="Volume">🔊</button>
        <div class="clock" id="clock">--:--</div>
      </div>
    </div>
  </div>

  <!-- Start Menu (hidden by default) -->
  <div id="start-menu" class="start-menu" style="display: none;">
    <div class="start-menu-header">
      <h3>Applications</h3>
    </div>
    <div id="start-menu-apps" class="start-menu-apps"></div>
    <div class="start-menu-footer">
      <button id="power-button" class="power-button">⏻ Power</button>
    </div>
  </div>

  <!-- Context Menu (hidden by default) -->
  <div id="context-menu" class="context-menu" style="display: none;"></div>

  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

### 1.3 Create Core System Kernel

```javascript
// src/kernel/Kernel.js

import ProcessManager from './ProcessManager.js';
import Scheduler from './Scheduler.js';
import IPC from './IPC.js';
import VFS from '../filesystem/VFS.js';
import PermissionManager from '../security/PermissionManager.js';
import { EventBus } from '../utils/EventBus.js';
import { Logger } from '../utils/Logger.js';

class Kernel extends EventTarget {
  constructor() {
    super();
    this.initialized = false;
    this.bootTime = Date.now();
    this.version = '1.0.0';

    this.processManager = ProcessManager;
    this.scheduler = Scheduler;
    this.ipc = IPC;
    this.vfs = VFS;
    this.permissionManager = PermissionManager;
    this.eventBus = EventBus;
    this.logger = new Logger('Kernel');
  }

  async boot() {
    this.logger.info('Starting WebOS kernel...');

    try {
      // Boot sequence
      await this._checkBrowserSupport();
      await this._initializeStorage();
      await this._initializeFileSystem();
      await this._initializeProcessManager();
      await this._initializeIPC();
      await this._loadSystemConfiguration();
      await this._startSystemServices();

      this.initialized = true;
      this.logger.info('Kernel initialized successfully');

      this.dispatchEvent(new CustomEvent('kernel-ready'));

      return true;
    } catch (error) {
      this.logger.error('Kernel boot failed:', error);
      this.dispatchEvent(new CustomEvent('kernel-error', {
        detail: { error }
      }));
      throw error;
    }
  }

  async _checkBrowserSupport() {
    this.logger.info('Checking browser support...');

    const required = {
      'Service Workers': 'serviceWorker' in navigator,
      'IndexedDB': 'indexedDB' in window,
      'Web Workers': typeof Worker !== 'undefined',
      'File System Access': 'storage' in navigator && 'getDirectory' in navigator.storage,
      'ES Modules': 'noModule' in HTMLScriptElement.prototype
    };

    const missing = Object.entries(required)
      .filter(([_, supported]) => !supported)
      .map(([feature]) => feature);

    if (missing.length > 0) {
      throw new Error(`Browser missing required features: ${missing.join(', ')}`);
    }

    this.logger.info('Browser support check passed');
  }

  async _initializeStorage() {
    this.logger.info('Initializing storage...');

    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      this.logger.info(`Storage persistence: ${isPersisted}`);
    }

    const estimate = await navigator.storage.estimate();
    const percentUsed = (estimate.usage / estimate.quota * 100).toFixed(2);
    this.logger.info(`Storage: ${this._formatBytes(estimate.usage)} / ${this._formatBytes(estimate.quota)} (${percentUsed}%)`);
  }

  async _initializeFileSystem() {
    this.logger.info('Initializing file system...');
    await this.vfs.init();
    this.logger.info('File system ready');
  }

  async _initializeProcessManager() {
    this.logger.info('Initializing process manager...');
    // Process manager is already a singleton
    this.logger.info('Process manager ready');
  }

  async _initializeIPC() {
    this.logger.info('Initializing IPC...');
    // IPC is already a singleton
    this.logger.info('IPC ready');
  }

  async _loadSystemConfiguration() {
    this.logger.info('Loading system configuration...');

    try {
      const configPath = '/etc/system.conf';
      const configData = await this.vfs.readFile(configPath, { encoding: 'utf8' });
      this.config = JSON.parse(configData);
    } catch (error) {
      // Use defaults if config doesn't exist
      this.config = {
        theme: 'light',
        wallpaper: '/assets/wallpapers/default.jpg',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      // Save default config
      await this.vfs.mkdir('/etc', { recursive: true });
      await this.vfs.writeFile('/etc/system.conf', JSON.stringify(this.config, null, 2));
    }

    this.logger.info('System configuration loaded');
  }

  async _startSystemServices() {
    this.logger.info('Starting system services...');
    // System services will be started here
    this.logger.info('System services started');
  }

  async shutdown() {
    this.logger.info('Shutting down...');

    // Terminate all processes
    const processes = this.processManager.listProcesses();
    for (const process of processes) {
      await this.processManager.killProcess(process.pid);
    }

    // Flush file system
    await this.vfs.sync();

    this.logger.info('Shutdown complete');
    this.dispatchEvent(new CustomEvent('kernel-shutdown'));
  }

  getSystemInfo() {
    return {
      version: this.version,
      bootTime: this.bootTime,
      uptime: Date.now() - this.bootTime,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      cores: navigator.hardwareConcurrency || 1,
      memory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'Unknown'
    };
  }

  _formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export default new Kernel();
```

### 1.4 Create Event Bus Utility

```javascript
// src/utils/EventBus.js

class EventBus {
  constructor() {
    this.events = new Map();
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.events.has(event)) return;

    const callbacks = this.events.get(event);
    const index = callbacks.indexOf(callback);

    if (index > -1) {
      callbacks.splice(index, 1);
    }

    if (callbacks.length === 0) {
      this.events.delete(event);
    }
  }

  emit(event, data) {
    if (!this.events.has(event)) return;

    this.events.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  once(event, callback) {
    const wrappedCallback = (data) => {
      callback(data);
      this.off(event, wrappedCallback);
    };

    this.on(event, wrappedCallback);
  }
}

export const eventBus = new EventBus();
export { EventBus };
```

### 1.5 Create Logger Utility

```javascript
// src/utils/Logger.js

export class Logger {
  constructor(namespace) {
    this.namespace = namespace;
    this.enabled = true;
  }

  _log(level, ...args) {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${this.namespace}]`;

    console[level](prefix, ...args);
  }

  debug(...args) {
    this._log('debug', ...args);
  }

  info(...args) {
    this._log('info', ...args);
  }

  warn(...args) {
    this._log('warn', ...args);
  }

  error(...args) {
    this._log('error', ...args);
  }
}
```

---

## Phase 2: File System & Storage

**Duration**: 2-3 weeks
**Complexity**: High
**Priority**: Critical

### 2.1 Implement OPFS Driver

```javascript
// src/filesystem/drivers/OPFSDriver.js

export class OPFSDriver {
  constructor() {
    this.root = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      this.root = await navigator.storage.getDirectory();
      this.initialized = true;
      console.log('OPFS initialized');
    } catch (error) {
      console.error('Failed to initialize OPFS:', error);
      throw error;
    }
  }

  async readFile(path, options = {}) {
    const handle = await this._getFileHandle(path);
    const file = await handle.getFile();

    if (options.encoding === 'utf8') {
      return await file.text();
    } else if (options.encoding === 'base64') {
      const buffer = await file.arrayBuffer();
      return this._arrayBufferToBase64(buffer);
    } else {
      return await file.arrayBuffer();
    }
  }

  async writeFile(path, data, options = {}) {
    const handle = await this._getFileHandle(path, { create: true });
    const writable = await handle.createWritable();

    try {
      if (typeof data === 'string') {
        await writable.write(data);
      } else if (data instanceof ArrayBuffer) {
        await writable.write(data);
      } else {
        await writable.write(new Blob([data]));
      }
    } finally {
      await writable.close();
    }
  }

  async appendFile(path, data) {
    const handle = await this._getFileHandle(path, { create: true });
    const file = await handle.getFile();
    const existing = await file.arrayBuffer();

    const writable = await handle.createWritable();

    try {
      await writable.write(existing);
      await writable.write(data);
    } finally {
      await writable.close();
    }
  }

  async mkdir(path, options = {}) {
    await this._getDirectoryHandle(path, { create: true });
  }

  async readdir(path) {
    const handle = await this._getDirectoryHandle(path);
    const entries = [];

    for await (const entry of handle.values()) {
      const stat = await this._getEntryStat(entry);
      entries.push({
        name: entry.name,
        kind: entry.kind,
        type: entry.kind === 'file' ? 'file' : 'directory',
        ...stat
      });
    }

    return entries;
  }

  async rm(path, options = {}) {
    const parts = this._parsePath(path);
    const name = parts.pop();

    if (parts.length === 0) {
      throw new Error('Cannot remove root directory');
    }

    const parentPath = '/' + parts.join('/');
    const parent = await this._getDirectoryHandle(parentPath);

    await parent.removeEntry(name, { recursive: options.recursive });
  }

  async rename(oldPath, newPath) {
    // OPFS doesn't support native rename, so we copy and delete
    const isDirectory = await this._isDirectory(oldPath);

    if (isDirectory) {
      await this._copyDirectory(oldPath, newPath);
      await this.rm(oldPath, { recursive: true });
    } else {
      const data = await this.readFile(oldPath);
      await this.writeFile(newPath, data);
      await this.rm(oldPath);
    }
  }

  async stat(path) {
    try {
      const handle = await this._getFileHandle(path);
      const file = await handle.getFile();

      return {
        type: 'file',
        size: file.size,
        mtime: file.lastModified,
        atime: file.lastModified,
        ctime: file.lastModified,
        name: file.name
      };
    } catch (e) {
      const handle = await this._getDirectoryHandle(path);

      return {
        type: 'directory',
        size: 0,
        name: handle.name
      };
    }
  }

  async exists(path) {
    try {
      await this.stat(path);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Helper methods

  async _getDirectoryHandle(path, options = {}) {
    const parts = this._parsePath(path);
    let current = this.root;

    for (const part of parts) {
      current = await current.getDirectoryHandle(part, options);
    }

    return current;
  }

  async _getFileHandle(path, options = {}) {
    const parts = this._parsePath(path);
    const fileName = parts.pop();

    let dir = this.root;
    if (parts.length > 0) {
      dir = await this._getDirectoryHandle('/' + parts.join('/'), options);
    }

    return await dir.getFileHandle(fileName, options);
  }

  async _isDirectory(path) {
    try {
      await this._getDirectoryHandle(path);
      return true;
    } catch (e) {
      return false;
    }
  }

  async _copyDirectory(srcPath, destPath) {
    await this.mkdir(destPath);
    const entries = await this.readdir(srcPath);

    for (const entry of entries) {
      const src = `${srcPath}/${entry.name}`;
      const dest = `${destPath}/${entry.name}`;

      if (entry.type === 'directory') {
        await this._copyDirectory(src, dest);
      } else {
        const data = await this.readFile(src);
        await this.writeFile(dest, data);
      }
    }
  }

  async _getEntryStat(entry) {
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      return {
        size: file.size,
        mtime: file.lastModified
      };
    }
    return { size: 0 };
  }

  _parsePath(path) {
    return path.split('/').filter(Boolean);
  }

  _arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
```

### 2.2 Implement IndexedDB Driver (for metadata)

```javascript
// src/filesystem/drivers/IndexedDBDriver.js

import { openDB } from 'idb';

export class IndexedDBDriver {
  constructor() {
    this.db = null;
    this.dbName = 'webos-metadata';
    this.storeName = 'files';
  }

  async init() {
    this.db = await openDB(this.dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('files')) {
          const store = db.createObjectStore('files', { keyPath: 'path' });
          store.createIndex('parentPath', 'parentPath');
          store.createIndex('mtime', 'mtime');
        }
      }
    });
  }

  async readFile(path, options = {}) {
    const entry = await this.db.get(this.storeName, path);
    if (!entry) throw new Error(`File not found: ${path}`);

    if (options.encoding === 'utf8') {
      return new TextDecoder().decode(entry.data);
    }
    return entry.data;
  }

  async writeFile(path, data, options = {}) {
    const parentPath = this._getParentPath(path);
    const name = this._getName(path);

    const entry = {
      path,
      parentPath,
      name,
      type: 'file',
      data: typeof data === 'string' ? new TextEncoder().encode(data) : data,
      size: data.length || data.byteLength,
      mtime: Date.now(),
      ctime: Date.now()
    };

    await this.db.put(this.storeName, entry);
  }

  async mkdir(path, options = {}) {
    const parentPath = this._getParentPath(path);
    const name = this._getName(path);

    const entry = {
      path,
      parentPath,
      name,
      type: 'directory',
      mtime: Date.now(),
      ctime: Date.now()
    };

    await this.db.put(this.storeName, entry);
  }

  async readdir(path) {
    const tx = this.db.transaction(this.storeName, 'readonly');
    const index = tx.store.index('parentPath');
    const entries = await index.getAll(path);

    return entries.map(entry => ({
      name: entry.name,
      type: entry.type,
      size: entry.size || 0,
      mtime: entry.mtime
    }));
  }

  async rm(path, options = {}) {
    if (options.recursive) {
      await this._rmRecursive(path);
    } else {
      await this.db.delete(this.storeName, path);
    }
  }

  async _rmRecursive(path) {
    const children = await this.readdir(path);

    for (const child of children) {
      const childPath = `${path}/${child.name}`;
      if (child.type === 'directory') {
        await this._rmRecursive(childPath);
      }
      await this.db.delete(this.storeName, childPath);
    }

    await this.db.delete(this.storeName, path);
  }

  async stat(path) {
    const entry = await this.db.get(this.storeName, path);
    if (!entry) throw new Error(`Path not found: ${path}`);

    return {
      type: entry.type,
      size: entry.size || 0,
      mtime: entry.mtime,
      ctime: entry.ctime,
      name: entry.name
    };
  }

  async rename(oldPath, newPath) {
    const entry = await this.db.get(this.storeName, oldPath);
    if (!entry) throw new Error(`Path not found: ${oldPath}`);

    entry.path = newPath;
    entry.parentPath = this._getParentPath(newPath);
    entry.name = this._getName(newPath);
    entry.mtime = Date.now();

    await this.db.delete(this.storeName, oldPath);
    await this.db.put(this.storeName, entry);
  }

  _getParentPath(path) {
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    return '/' + parts.join('/');
  }

  _getName(path) {
    const parts = path.split('/').filter(Boolean);
    return parts[parts.length - 1];
  }
}
```

### 2.3 Implement Virtual File System

The VFS implementation was covered in the architecture document. Make sure to implement the complete VFS with all drivers mounted.

---

## Phase 3: Process Management & Scheduling

**Duration**: 1-2 weeks
**Complexity**: Medium
**Priority**: High

Implement the ProcessManager, Scheduler, and IPC components as described in the architecture document.

### Key Implementation Points:

1. **Process Lifecycle**: Create, start, suspend, resume, terminate
2. **Task Scheduling**: Use Prioritized Task Scheduling API
3. **IPC**: Implement MessageBus with BroadcastChannel
4. **Resource Tracking**: Monitor memory, CPU, storage usage

---

## Phase 4: Window Manager & UI

**Duration**: 2-3 weeks
**Complexity**: Medium-High
**Priority**: High

### 4.1 Integrate WinBox.js

```bash
npm install winbox
```

### 4.2 Create Desktop Component

```javascript
// src/ui/Desktop.js

export class Desktop {
  constructor() {
    this.element = document.getElementById('desktop');
    this.iconsContainer = document.getElementById('desktop-icons');
    this.icons = [];
    this.wallpaper = null;

    this._setupEventListeners();
  }

  async init() {
    await this._loadWallpaper();
    await this._loadIcons();
    this.show();
  }

  async _loadWallpaper() {
    // Load wallpaper from config
    const wallpaper = kernel.config.wallpaper || '/assets/wallpapers/default.jpg';
    this.element.style.backgroundImage = `url(${wallpaper})`;
  }

  async _loadIcons() {
    const defaultIcons = [
      { name: 'Terminal', icon: '💻', appId: 'terminal' },
      { name: 'File Manager', icon: '📁', appId: 'file-manager' },
      { name: 'Text Editor', icon: '📝', appId: 'text-editor' },
      { name: 'Settings', icon: '⚙️', appId: 'settings' }
    ];

    defaultIcons.forEach((iconData, index) => {
      this._createIcon(iconData, index);
    });
  }

  _createIcon(data, index) {
    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.innerHTML = `
      <div class="icon-image">${data.icon}</div>
      <div class="icon-label">${data.name}</div>
    `;

    icon.addEventListener('dblclick', () => {
      this._launchApp(data.appId);
    });

    this.iconsContainer.appendChild(icon);
    this.icons.push({ element: icon, data });
  }

  async _launchApp(appId) {
    const AppRegistry = (await import('../apps/AppRegistry.js')).default;
    await AppRegistry.launchApp(appId);
  }

  _setupEventListeners() {
    // Right-click context menu
    this.element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this._showContextMenu(e.clientX, e.clientY);
    });
  }

  _showContextMenu(x, y) {
    const contextMenu = document.getElementById('context-menu');
    contextMenu.innerHTML = `
      <div class="context-menu-item" data-action="refresh">Refresh</div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" data-action="personalize">Personalize</div>
    `;

    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.style.display = 'block';

    const closeMenu = () => {
      contextMenu.style.display = 'none';
      document.removeEventListener('click', closeMenu);
    };

    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 0);
  }

  show() {
    this.element.style.display = 'block';
  }

  hide() {
    this.element.style.display = 'none';
  }
}
```

### 4.3 Create Taskbar Component

```javascript
// src/ui/Taskbar.js

export class Taskbar {
  constructor() {
    this.element = document.getElementById('taskbar');
    this.startButton = document.getElementById('start-button');
    this.windowsContainer = document.getElementById('taskbar-windows');
    this.clock = document.getElementById('clock');
    this.windows = new Map();

    this._setupEventListeners();
    this._startClock();
  }

  init() {
    this.show();
  }

  _setupEventListeners() {
    this.startButton.addEventListener('click', () => {
      this._toggleStartMenu();
    });

    // Listen for window events
    window.addEventListener('window-created', (e) => {
      this.addWindow(e.detail.windowId, e.detail.title);
    });

    window.addEventListener('window-closed', (e) => {
      this.removeWindow(e.detail.windowId);
    });
  }

  addWindow(windowId, title) {
    const button = document.createElement('button');
    button.className = 'taskbar-window-button';
    button.textContent = title || 'Window';
    button.dataset.windowId = windowId;

    button.addEventListener('click', () => {
      // Focus or minimize window
      const window = WindowManager.getWindow(windowId);
      if (window) {
        if (window.winbox.min) {
          window.winbox.restore();
        }
        window.winbox.focus();
      }
    });

    this.windowsContainer.appendChild(button);
    this.windows.set(windowId, button);
  }

  removeWindow(windowId) {
    const button = this.windows.get(windowId);
    if (button) {
      button.remove();
      this.windows.delete(windowId);
    }
  }

  _toggleStartMenu() {
    const startMenu = document.getElementById('start-menu');
    const isVisible = startMenu.style.display === 'block';

    if (isVisible) {
      startMenu.style.display = 'none';
    } else {
      startMenu.style.display = 'block';
    }
  }

  _startClock() {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      this.clock.textContent = `${hours}:${minutes}`;
    };

    updateClock();
    setInterval(updateClock, 1000);
  }

  show() {
    this.element.style.display = 'flex';
  }

  hide() {
    this.element.style.display = 'none';
  }
}
```

---

## Phase 5: Application Runtime

**Duration**: 2 weeks
**Complexity**: Medium
**Priority**: High

Implement the AppRegistry and Application runtime as described in the architecture document.

---

## Phase 6: System Applications

**Duration**: 3-4 weeks
**Complexity**: Medium-High
**Priority**: High

### 6.1 Terminal Application

Implement the Terminal as described in the architecture document with these commands:
- File operations: `ls`, `cd`, `pwd`, `cat`, `mkdir`, `rm`, `touch`, `cp`, `mv`
- System: `ps`, `kill`, `clear`, `help`, `uname`
- Advanced: `find`, `grep`, `wc`, `head`, `tail`

### 6.2 File Manager Application

Create a GUI file manager with:
- Tree view for directory navigation
- Icon and list views
- File operations (copy, move, delete, rename)
- File upload/download
- Context menus
- Search functionality

### 6.3 Text Editor Application

Simple text editor with:
- Syntax highlighting (using Prism.js or CodeMirror)
- Save/load files
- Find and replace
- Multiple file support (tabs)

---

## Phase 7: Service Workers & PWA

**Duration**: 1 week
**Complexity**: Low-Medium
**Priority**: Medium

Implement service worker and PWA features as shown in the architecture document.

---

## Phase 8: Polish & Optimization

**Duration**: 2 weeks
**Complexity**: Medium
**Priority**: Medium

1. Implement code splitting
2. Add virtual scrolling
3. Optimize bundle size
4. Add loading indicators
5. Implement error boundaries
6. Add accessibility features
7. Performance profiling and optimization

---

## Phase 9: Deployment & CI/CD

**Duration**: 3-5 days
**Complexity**: Low
**Priority**: Medium

1. Configure GitHub Actions
2. Set up automated builds
3. Enable GitHub Pages
4. Add custom domain (optional)
5. Set up analytics (optional)

---

## Total Estimated Timeline

- **Minimum**: 12-15 weeks (3-4 months)
- **Realistic**: 16-20 weeks (4-5 months)
- **With polish**: 20-24 weeks (5-6 months)

This assumes 1 full-time developer working consistently.

---

## Success Metrics

- ✅ Boots in under 3 seconds
- ✅ File operations complete in under 100ms
- ✅ Can run 10+ concurrent applications
- ✅ Works offline after first load
- ✅ Passes Lighthouse PWA audit
- ✅ Responsive on mobile devices
- ✅ Cross-browser compatible

---

**Next**: See [API_REFERENCE.md](./API_REFERENCE.md) for detailed API documentation.
