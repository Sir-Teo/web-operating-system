# WebOS Plugin Development Guide

Complete guide for developing plugins for the WebOS platform.

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Plugin Structure](#plugin-structure)
- [Plugin Manifest](#plugin-manifest)
- [Plugin API](#plugin-api)
- [Lifecycle Hooks](#lifecycle-hooks)
- [Permissions](#permissions)
- [State Management](#state-management)
- [UI Guidelines](#ui-guidelines)
- [Example Plugins](#example-plugins)
- [Testing](#testing)
- [Publishing](#publishing)

## Introduction

WebOS plugins are self-contained modules that extend the functionality of the operating system. Plugins can:

- Add widgets to the desktop
- Integrate with system applications
- Provide new utilities and tools
- Customize the user interface
- Access file system and storage
- Make network requests
- And much more!

## Getting Started

### Quick Start

1. Create a new directory for your plugin in `~/.webos/plugins/`
2. Create a `plugin.json` manifest file
3. Create a `plugin.js` file with your plugin class
4. Load and activate your plugin through the Plugin Manager

### Minimal Plugin Example

**plugin.json:**
```json
{
  "name": "My First Plugin",
  "version": "1.0.0",
  "description": "A simple example plugin",
  "main": "plugin.js",
  "author": "Your Name",
  "permissions": []
}
```

**plugin.js:**
```javascript
class MyFirstPlugin {
  constructor(api) {
    this.api = api;
  }

  async activate() {
    this.api.ui.notify('Plugin activated!');
  }

  async deactivate() {
    // Cleanup code here
  }
}

module.exports = MyFirstPlugin;
```

## Plugin Structure

A plugin directory should contain:

```
my-plugin/
├── plugin.json          # Manifest file (required)
├── plugin.js            # Main plugin code (required)
├── README.md            # Documentation (recommended)
├── assets/              # Images, icons, etc. (optional)
└── lib/                 # Additional libraries (optional)
```

## Plugin Manifest

The `plugin.json` file describes your plugin:

```json
{
  "name": "Plugin Name",
  "version": "1.0.0",
  "description": "What your plugin does",
  "main": "plugin.js",
  "author": "Your Name",
  "homepage": "https://example.com",
  "permissions": [
    "ui.widget",
    "storage.read",
    "storage.write",
    "network.http"
  ],
  "engines": {
    "webos": ">=2.0.0"
  },
  "keywords": ["productivity", "tools"],
  "category": "utilities"
}
```

### Manifest Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✓ | Display name of the plugin |
| `version` | string | ✓ | Semantic version (e.g., "1.2.3") |
| `description` | string | ✓ | Short description |
| `main` | string | ✓ | Entry point file (usually "plugin.js") |
| `author` | string | ✓ | Author name or organization |
| `homepage` | string | - | Plugin homepage URL |
| `permissions` | array | - | Required permissions |
| `engines.webos` | string | - | Compatible WebOS versions |
| `keywords` | array | - | Search keywords |
| `category` | string | - | Plugin category |
| `dependencies` | object | - | Plugin dependencies |

### Categories

- `productivity` - Productivity tools
- `development` - Development tools
- `themes` - UI themes and customization
- `utilities` - System utilities
- `entertainment` - Games and entertainment
- `communication` - Communication tools
- `security` - Security tools

## Plugin API

The Plugin API is provided to your plugin through the constructor:

```javascript
class MyPlugin {
  constructor(api) {
    this.api = api; // Plugin API instance
  }
}
```

### Available APIs

#### UI API (`api.ui`)

```javascript
// Show notification
api.ui.notify(message, type); // type: 'info', 'success', 'error'

// Show dialog
api.ui.dialog(title, message, buttons);

// Show prompt
const result = await api.ui.prompt(message, defaultValue);

// Show confirm
const confirmed = await api.ui.confirm(message);
```

#### Storage API (`api.storage`)

```javascript
// Store data
await api.storage.set(key, value);

// Retrieve data
const value = await api.storage.get(key);

// Remove data
await api.storage.remove(key);

// List all keys
const keys = await api.storage.keys();

// Clear all data
await api.storage.clear();
```

#### File System API (`api.fs`)

```javascript
// Read file
const content = await api.fs.readFile(path);

// Write file
await api.fs.writeFile(path, content);

// List directory
const files = await api.fs.readdir(path);

// Create directory
await api.fs.mkdir(path);

// Delete file
await api.fs.unlink(path);

// Get file stats
const stats = await api.fs.stat(path);
```

#### HTTP API (`api.http`)

Requires `network.http` permission.

```javascript
// Make HTTP request
const response = await api.http.fetch(url, options);

// GET request
const data = await api.http.get(url);

// POST request
const result = await api.http.post(url, body);
```

## Lifecycle Hooks

Plugins can implement these lifecycle hooks:

### `activate()`

Called when the plugin is activated. Use this to:
- Initialize your plugin
- Create UI elements
- Set up event listeners
- Load saved state

```javascript
async activate() {
  console.log('Plugin is activating');
  // Setup code here
  this.api.ui.notify('Plugin activated');
}
```

### `deactivate()`

Called when the plugin is deactivated. Use this to:
- Clean up resources
- Remove event listeners
- Save state
- Remove UI elements

```javascript
async deactivate() {
  console.log('Plugin is deactivating');
  // Cleanup code here
}
```

### `saveState()` (Optional)

Called before hot reload to save plugin state:

```javascript
async saveState() {
  return {
    counter: this.counter,
    settings: this.settings
  };
}
```

### `restoreState(state)` (Optional)

Called after hot reload to restore plugin state:

```javascript
async restoreState(state) {
  this.counter = state.counter;
  this.settings = state.settings;
}
```

## Permissions

Plugins must declare required permissions in their manifest:

### Available Permissions

| Permission | Description |
|------------|-------------|
| `ui.widget` | Create desktop widgets |
| `ui.theme` | Modify UI themes |
| `storage.read` | Read from plugin storage |
| `storage.write` | Write to plugin storage |
| `fs.read` | Read files from filesystem |
| `fs.write` | Write files to filesystem |
| `network.http` | Make HTTP requests |
| `notifications` | Show system notifications |
| `clipboard` | Access clipboard |
| `editor.read` | Read from code editor |
| `editor.write` | Modify code editor content |
| `crypto` | Use cryptographic functions |

### Example

```json
{
  "permissions": [
    "ui.widget",
    "storage.read",
    "storage.write",
    "network.http"
  ]
}
```

## State Management

### Saving State

Use the storage API to persist data:

```javascript
async activate() {
  // Load saved data
  const savedData = await this.api.storage.get('my-data');
  if (savedData) {
    this.data = JSON.parse(savedData);
  }
}

async deactivate() {
  // Save data
  await this.api.storage.set('my-data', JSON.stringify(this.data));
}
```

### Hot Reload Support

Implement `saveState()` and `restoreState()` for seamless hot reloading:

```javascript
async saveState() {
  return {
    myVariable: this.myVariable,
    uiState: this.getUIState()
  };
}

async restoreState(state) {
  this.myVariable = state.myVariable;
  this.restoreUIState(state.uiState);
}
```

## UI Guidelines

### Creating Widgets

```javascript
async activate() {
  this.widget = document.createElement('div');
  this.widget.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px;
    background: rgba(30, 30, 30, 0.95);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `;

  this.widget.innerHTML = `
    <h3>My Widget</h3>
    <p>Content goes here</p>
  `;

  document.body.appendChild(this.widget);
}

async deactivate() {
  if (this.widget) {
    this.widget.remove();
  }
}
```

### Draggable Widgets

```javascript
_makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  element.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    element.style.top = (element.offsetTop - pos2) + 'px';
    element.style.left = (element.offsetLeft - pos1) + 'px';
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
```

### Keyboard Shortcuts

```javascript
async activate() {
  this.keyHandler = (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'K') {
      e.preventDefault();
      this.toggleWidget();
    }
  };

  document.addEventListener('keydown', this.keyHandler);
}

async deactivate() {
  if (this.keyHandler) {
    document.removeEventListener('keydown', this.keyHandler);
  }
}
```

## Example Plugins

Check out these example plugins in `/plugins/examples/`:

1. **clock-widget** - Simple desktop clock
2. **auto-save** - Automatic file saving
3. **theme-customizer** - UI theme customization
4. **weather-widget** - Weather information display
5. **pomodoro-timer** - Productivity timer
6. **code-snippets** - Code snippet manager
7. **markdown-previewer** - Markdown live preview
8. **quick-notes** - Sticky notes

## Testing

### Manual Testing

1. Install your plugin in `~/.webos/plugins/your-plugin/`
2. Open the Plugin Manager app
3. Click "Refresh" to see your plugin
4. Load and activate your plugin
5. Test all functionality
6. Check browser console for errors

### Hot Reload Testing

1. Make changes to your plugin code
2. In Plugin Manager, click "Reload" on your plugin
3. Verify that state is preserved (if implemented)
4. Test functionality after reload

### Error Handling

Always wrap async operations in try-catch blocks:

```javascript
async activate() {
  try {
    const data = await this.api.storage.get('data');
    // Process data
  } catch (error) {
    console.error('Failed to load data:', error);
    this.api.ui.notify('Error loading plugin', 'error');
  }
}
```

## Publishing

### Package Format

Plugins are distributed as `.tar.gz` archives:

```bash
# Create archive
cd my-plugin/
tar -czf my-plugin.tar.gz .
```

### Installation

Users can install your plugin by:

1. Downloading the `.tar.gz` file
2. Opening Plugin Manager
3. Clicking "Install Plugin"
4. Selecting the archive file

### Marketplace (Coming Soon)

The WebOS Plugin Marketplace will allow you to:
- Publish plugins
- Get discovered by users
- Receive ratings and reviews
- Track downloads and usage

## Best Practices

### Do's

✓ Clean up resources in `deactivate()`
✓ Handle errors gracefully
✓ Use semantic versioning
✓ Document your code
✓ Test thoroughly before publishing
✓ Follow UI guidelines
✓ Request only necessary permissions
✓ Provide user feedback for actions
✓ Support hot reload when possible

### Don'ts

✗ Block the main thread
✗ Modify global objects unnecessarily
✗ Leave event listeners attached after deactivation
✗ Store sensitive data unencrypted
✗ Make assumptions about the environment
✗ Ignore permission requirements
✗ Create memory leaks
✗ Use `alert()` or `confirm()` (use API methods instead)

## Advanced Topics

### Custom Events

```javascript
// Emit custom event
const event = new CustomEvent('myplugin:action', {
  detail: { data: 'value' }
});
document.dispatchEvent(event);

// Listen for custom event
document.addEventListener('myplugin:action', (e) => {
  console.log(e.detail.data);
});
```

### Inter-Plugin Communication

```javascript
// Via custom events
document.dispatchEvent(new CustomEvent('plugin:message', {
  detail: {
    from: 'my-plugin',
    to: 'other-plugin',
    message: 'Hello!'
  }
}));
```

### Performance Optimization

```javascript
// Use requestAnimationFrame for animations
updateAnimation() {
  requestAnimationFrame(() => {
    // Animation code
    if (this.isRunning) {
      this.updateAnimation();
    }
  });
}

// Debounce frequent updates
debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
```

## Resources

- [WebOS API Reference](./API_REFERENCE.md)
- [Example Plugins](/plugins/examples/)
- [Plugin Marketplace](https://webos-plugins.example.com) (Coming Soon)
- [Community Forum](https://forum.webos.dev) (Coming Soon)

## Support

- GitHub Issues: [Report bugs](https://github.com/your-org/webos/issues)
- Documentation: [Full docs](https://docs.webos.dev)
- Community: [Join our Discord](https://discord.gg/webos)

## License

Plugins can use any license. Common choices:
- MIT
- Apache 2.0
- GPL v3
- BSD

Include a LICENSE file in your plugin directory.

---

Happy plugin development! 🚀
