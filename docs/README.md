# WebOS Documentation

**Version:** 3.5.0
**Last Updated:** 2025-11-20

Welcome to the WebOS documentation! This comprehensive guide will help you understand, use, and extend the WebOS platform.

---

## 📚 Documentation Index

### User Guides
- **[Keyboard Shortcuts](KEYBOARD_SHORTCUTS.md)** - Complete list of system shortcuts (new in v3.5)
- **[Applications Guide](APPLICATIONS.md)** - Overview of all 30+ built-in applications

### Developer Guides
- **[Architecture Overview](WEB_OS_ARCHITECTURE.md)** - System architecture and design patterns
- **[API Reference](API_REFERENCE.md)** - Complete kernel and system API documentation
- **[App Development Guide](APP_DEVELOPMENT_GUIDE.md)** - Build applications for WebOS
- **[Plugin Development](PLUGIN_DEVELOPMENT.md)** - Create plugins and extensions

### Technical Guides
- **[File Operations Guide](FILE_OPERATIONS_GUIDE.md)** - File system operations and storage
- **[Compression Guide](COMPRESSION_GUIDE.md)** - File compression and WASM acceleration
- **[Advanced Terminal](ADVANCED_TERMINAL_FEATURES.md)** - Shell scripting and terminal features
- **[Deployment Guide](GITHUB_PAGES_DEPLOYMENT.md)** - Deploy WebOS to GitHub Pages

### Archive
- **[archive/](archive/)** - Historical documentation from previous phases

---

## 🚀 What is WebOS?

WebOS is a **production-grade, fully-functional operating system** that runs entirely in your browser.

### Core Features

**System Architecture:**
- Real kernel with boot sequence and process management
- Virtual File System (OPFS + IndexedDB + Memory drivers)
- Task scheduling and IPC (Inter-Process Communication)
- Permission and security system
- WebAssembly performance optimization (5-10x faster)

**Desktop Environment (NEW in v3.5):**
- Desktop widgets (clock, weather, calendar, notes)
- Multiple workspaces/virtual desktops (up to 9)
- Global search - Spotlight-like (Ctrl+Space)
- Quick actions panel (Ctrl+Shift+A)
- Notification center with history (Ctrl+Shift+N)
- Screenshot and screen recording tools
- 15+ customizable keyboard shortcuts

**Applications (30+):**
- **Productivity**: Word processor, spreadsheet, presentation, task manager
- **Development**: Terminal (66+ commands), code editor, DevTools, package manager
- **File Management**: Dual-pane file manager with compression and encryption
- **Media**: Image viewer, music player, paint application
- **Utilities**: Calculator, calendar, screenshot tool
- **Games**: Snake, Tetris, Minesweeper, racing, and more
- **AI**: AI assistant with local model inference

**Cloud & Sync:**
- Google Drive, Dropbox, OneDrive, WebDAV integration
- Bi-directional sync with conflict resolution
- OAuth 2.0 authentication
- Selective sync and bandwidth throttling

**Multi-User System:**
- User account management with authentication
- Per-user home directories and settings
- Fast user switching
- Guest mode support

**Mobile Support:**
- Touch-optimized UI components
- Gesture recognition (swipe, pinch, tap, long-press)
- Mobile-friendly terminal with virtual keyboard
- Responsive layouts for all applications

---

## ⌨️ Essential Keyboard Shortcuts

### Desktop & Windows
| Shortcut | Action |
|----------|--------|
| `Ctrl+Space` | Open global search |
| `Ctrl+Shift+A` | Quick actions panel |
| `Ctrl+Shift+N` | Notification center |
| `Ctrl+Alt+Arrow L/R` | Switch workspaces |
| `Ctrl+Alt+1-9` | Jump to workspace |
| `Ctrl+Alt+D` | Show desktop |
| `Alt+F4` | Close active window |

### Window Management
| Shortcut | Action |
|----------|--------|
| `Ctrl+Alt+↑` | Maximize window |
| `Ctrl+Alt+↓` | Minimize window |
| `Ctrl+Alt+←` | Snap window left |
| `Ctrl+Alt+→` | Snap window right |

### Applications
| Shortcut | Action |
|----------|--------|
| `Ctrl+Alt+T` | Open terminal |
| `Ctrl+Alt+F` | Open file manager |
| `Ctrl+Alt+L` | Lock screen |

### Screenshots
| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+PrintScreen` | Full screen screenshot |
| `Ctrl+Shift+S` | Selection screenshot |

[Complete shortcuts list →](KEYBOARD_SHORTCUTS.md)

---

## 🎯 Quick Start Guide

### 1. Access WebOS
Open the application in a modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### 2. Login
- Use the default guest account
- Or create a new user via the User Accounts app

### 3. Explore the Desktop
- **Desktop Icons**: Double-click to launch applications
- **Start Menu**: Click the ⊞ button in taskbar
- **Widgets**: Right-click desktop to add widgets
- **Workspaces**: Use workspace switcher in taskbar

### 4. Key Actions
- **Search Everything**: Press `Ctrl+Space`
- **Quick Actions**: Press `Ctrl+Shift+A`
- **Open Terminal**: Press `Ctrl+Alt+T`
- **Take Screenshot**: Press `Ctrl+Shift+S`

---

## 📊 Statistics (v3.5.0)

- **Codebase**: 19,000+ lines of production code
- **Applications**: 30+ system and productivity applications
- **Terminal Commands**: 66 built-in commands
- **Widgets**: 4 desktop widgets (extensible)
- **Cloud Providers**: 4 (Google Drive, Dropbox, OneDrive, WebDAV)
- **Keyboard Shortcuts**: 15+ customizable shortcuts
- **Bundle Size**: ~1 MB gzipped
- **Boot Time**: < 2 seconds
- **Test Coverage**: 163 passing tests

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│        Applications Layer (30+)         │
│  Terminal, File Manager, Code Editor... │
├─────────────────────────────────────────┤
│          UI Framework Layer             │
│   Desktop, Taskbar, Windows, Widgets    │
├─────────────────────────────────────────┤
│        System Services Layer            │
│ Workspaces, Search, Notifications, etc. │
├─────────────────────────────────────────┤
│            Kernel Layer                 │
│  Process Mgr, File System, IPC, Network │
├─────────────────────────────────────────┤
│          Storage Layer                  │
│    OPFS, IndexedDB, Memory, WASM        │
└─────────────────────────────────────────┘
```

[Detailed architecture guide →](WEB_OS_ARCHITECTURE.md)

---

## 🛠️ Development

### Building Applications

```javascript
// MyApp.js
export class MyApp {
  constructor(kernel, container) {
    this.kernel = kernel;
    this.container = container;
  }

  async init() {
    // Initialize your app
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="my-app">
        <h1>Hello WebOS!</h1>
      </div>
    `;
  }

  destroy() {
    // Cleanup when app closes
  }
}

export default MyApp;
```

Register your app:
```javascript
// In main.js
import MyApp from './apps/my-app/MyApp.js';

AppRegistry.register({
  id: 'my-app',
  name: 'My App',
  version: '1.0.0',
  icon: '📱',
  type: 'web',
  permissions: ['filesystem.read'],
  Component: MyApp
});
```

[Full development guide →](APP_DEVELOPMENT_GUIDE.md)

### File System API

```javascript
// Read file
const content = await kernel.fs.readFile('/home/document.txt');

// Write file
await kernel.fs.writeFile('/home/document.txt', 'Hello World');

// List directory
const files = await kernel.fs.readdir('/home');

// Create directory
await kernel.fs.mkdir('/home/projects');

// Compress file
await kernel.compressionManager.compress('/home/large.txt');

// Encrypt file
await kernel.fileEncryption.encryptFile('/home/secret.txt', 'password');
```

[Complete API reference →](API_REFERENCE.md)

---

## 🔌 Plugin System

Extend WebOS with custom plugins:

```javascript
// example-plugin.js
export default class MyPlugin {
  constructor(api) {
    this.api = api;
  }

  async activate() {
    // Plugin initialization
    this.api.ui.addMenuItem({
      label: 'My Feature',
      onclick: () => this.doSomething()
    });
  }

  async deactivate() {
    // Cleanup
  }
}
```

[Plugin development guide →](PLUGIN_DEVELOPMENT.md)

---

## 🤖 AI Integration

WebOS includes built-in AI capabilities:

- **AI Terminal Assistant**: Natural language command suggestions
- **Smart Code Assistant**: Code completion and explanation
- **File Search**: Semantic file search
- **AI Chat**: Conversational interface

Powered by WebLLM with local model inference (no server required).

---

## 🔒 Security

### Authentication
- Password-based authentication with SHA-256 hashing
- User session management
- Fast user switching

### Encryption
- File encryption: AES-256-GCM with PBKDF2
- Secure file deletion with overwriting
- Cryptographic hashing: MD5, SHA-256, SHA-512

### Sandboxing
- Plugin sandbox execution
- Permission-based access control
- Content Security Policy enforcement

---

## 📱 Mobile Support

WebOS is fully optimized for mobile:
- **Touch UI**: 44px touch targets, swipe gestures
- **Virtual Keyboard**: For terminal input
- **Gestures**: Swipe, pinch, pan, tap, long-press
- **Responsive**: All apps adapt to screen size
- **Orientation**: Portrait and landscape support
- **PWA**: Install as a native app

---

## 🌐 Browser Compatibility

**Minimum Requirements:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required APIs:**
- ES2020+ JavaScript
- Web Components
- IndexedDB
- File System Access API (OPFS)
- WebAssembly
- Web Workers

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🔗 Links

- **Repository**: https://github.com/Sir-Teo/web-operating-system
- **Issues**: https://github.com/Sir-Teo/web-operating-system/issues
- **Roadmap**: See ROADMAP.md in root directory
- **Changelog**: See git commit history

---

**WebOS v3.5.0** - Building the future of browser-based operating systems 🚀
