# WebOS API Reference

Complete API documentation for WebOS system services and application development.

---

## Table of Contents

1. [Kernel API](#kernel-api)
2. [File System API](#file-system-api)
3. [Process Manager API](#process-manager-api)
4. [Window Manager API](#window-manager-api)
5. [IPC API](#ipc-api)
6. [Permission API](#permission-api)
7. [Application API](#application-api)

---

## Kernel API

### `Kernel.boot()`

Boots the operating system kernel.

**Returns**: `Promise<boolean>`

**Example**:
```javascript
import Kernel from './kernel/Kernel.js';

try {
  await Kernel.boot();
  console.log('System booted successfully');
} catch (error) {
  console.error('Boot failed:', error);
}
```

### `Kernel.shutdown()`

Gracefully shuts down the operating system.

**Returns**: `Promise<void>`

### `Kernel.getSystemInfo()`

Returns system information.

**Returns**: `Object`

```javascript
{
  version: string,
  bootTime: number,
  uptime: number,
  platform: string,
  userAgent: string,
  language: string,
  cores: number,
  memory: string
}
```

### Events

- `kernel-ready` - Fired when kernel initialization is complete
- `kernel-error` - Fired when an error occurs during boot
- `kernel-shutdown` - Fired when system shuts down

---

## File System API

### `VFS.readFile(path, options)`

Reads a file from the virtual file system.

**Parameters**:
- `path` (string) - Absolute file path
- `options` (Object, optional)
  - `encoding` (string) - 'utf8', 'base64', or omit for ArrayBuffer

**Returns**: `Promise<string | ArrayBuffer>`

**Example**:
```javascript
// Read text file
const content = await VFS.readFile('/home/user/document.txt', { encoding: 'utf8' });

// Read binary file
const buffer = await VFS.readFile('/home/user/image.png');
```

### `VFS.writeFile(path, data, options)`

Writes data to a file.

**Parameters**:
- `path` (string) - Absolute file path
- `data` (string | ArrayBuffer | Uint8Array) - File content
- `options` (Object, optional)
  - `encoding` (string) - Encoding for string data

**Returns**: `Promise<void>`

**Example**:
```javascript
await VFS.writeFile('/home/user/notes.txt', 'Hello World', { encoding: 'utf8' });
```

### `VFS.readdir(path)`

Lists directory contents.

**Parameters**:
- `path` (string) - Directory path

**Returns**: `Promise<Array<FileEntry>>`

```typescript
interface FileEntry {
  name: string;
  type: 'file' | 'directory';
  size: number;
  mtime: number;
}
```

**Example**:
```javascript
const files = await VFS.readdir('/home/user');
files.forEach(file => {
  console.log(`${file.name} (${file.type})`);
});
```

### `VFS.mkdir(path, options)`

Creates a directory.

**Parameters**:
- `path` (string) - Directory path
- `options` (Object, optional)
  - `recursive` (boolean) - Create parent directories if needed

**Returns**: `Promise<void>`

**Example**:
```javascript
await VFS.mkdir('/home/user/projects/webos', { recursive: true });
```

### `VFS.rm(path, options)`

Removes a file or directory.

**Parameters**:
- `path` (string) - File or directory path
- `options` (Object, optional)
  - `recursive` (boolean) - Remove directory and contents

**Returns**: `Promise<void>`

**Example**:
```javascript
// Remove file
await VFS.rm('/home/user/temp.txt');

// Remove directory
await VFS.rm('/home/user/temp', { recursive: true });
```

### `VFS.stat(path)`

Gets file or directory information.

**Parameters**:
- `path` (string) - Path to file or directory

**Returns**: `Promise<FileStat>`

```typescript
interface FileStat {
  type: 'file' | 'directory';
  size: number;
  mtime: number;
  atime?: number;
  ctime?: number;
  name: string;
}
```

**Example**:
```javascript
const stat = await VFS.stat('/home/user/document.txt');
console.log(`Size: ${stat.size} bytes, Modified: ${new Date(stat.mtime)}`);
```

### `VFS.rename(oldPath, newPath)`

Renames or moves a file/directory.

**Parameters**:
- `oldPath` (string) - Current path
- `newPath` (string) - New path

**Returns**: `Promise<void>`

**Example**:
```javascript
await VFS.rename('/home/user/old.txt', '/home/user/new.txt');
```

### `VFS.copy(srcPath, destPath)`

Copies a file.

**Parameters**:
- `srcPath` (string) - Source path
- `destPath` (string) - Destination path

**Returns**: `Promise<void>`

**Example**:
```javascript
await VFS.copy('/home/user/original.txt', '/home/user/copy.txt');
```

### `VFS.watch(path, callback)`

Watches a path for changes.

**Parameters**:
- `path` (string) - Path to watch
- `callback` (Function) - Called when changes occur

**Returns**: `Function` - Unwatch function

**Example**:
```javascript
const unwatch = VFS.watch('/home/user', (event) => {
  console.log(`File ${event.path} was ${event.operation}`);
});

// Later...
unwatch();
```

---

## Process Manager API

### `ProcessManager.spawn(config)`

Spawns a new process.

**Parameters**:
- `config` (Object)
  - `name` (string) - Process name
  - `priority` (string) - 'user-blocking' | 'user-visible' | 'background'
  - `permissions` (Array<string>) - Required permissions
  - `worker` (boolean) - Run in Web Worker
  - `workerScript` (string) - Worker script path

**Returns**: `Promise<Process>`

**Example**:
```javascript
const process = await ProcessManager.spawn({
  name: 'MyApp',
  priority: 'user-visible',
  permissions: ['filesystem.read', 'filesystem.write']
});
```

### `ProcessManager.getProcess(pid)`

Gets a process by ID.

**Parameters**:
- `pid` (number) - Process ID

**Returns**: `Process | undefined`

### `ProcessManager.listProcesses()`

Lists all running processes.

**Returns**: `Array<Process>`

**Example**:
```javascript
const processes = ProcessManager.listProcesses();
processes.forEach(proc => {
  console.log(`${proc.pid}: ${proc.name} [${proc.state}]`);
});
```

### `ProcessManager.killProcess(pid)`

Terminates a process.

**Parameters**:
- `pid` (number) - Process ID

**Returns**: `Promise<void>`

**Example**:
```javascript
await ProcessManager.killProcess(123);
```

### Events

- `process-spawned` - Fired when a process is created
- `process-terminated` - Fired when a process ends

---

## Window Manager API

### `WindowManager.createWindow(config)`

Creates a new window.

**Parameters**:
- `config` (Object)
  - `title` (string) - Window title
  - `width` (number) - Window width in pixels
  - `height` (number) - Window height in pixels
  - `x` (number | 'center') - X position
  - `y` (number | 'center') - Y position
  - `minwidth` (number) - Minimum width
  - `minheight` (number) - Minimum height
  - `background` (string) - Background color
  - `modal` (boolean) - Modal window
  - `onclose` (Function) - Called before closing
  - `onfocus` (Function) - Called when focused
  - `onresize` (Function) - Called when resized
  - `onmove` (Function) - Called when moved

**Returns**: `WinBox`

**Example**:
```javascript
const window = WindowManager.createWindow({
  title: 'My Application',
  width: 800,
  height: 600,
  x: 'center',
  y: 'center',
  onclose: () => {
    return confirm('Really close?');
  }
});

// Add content
window.body.innerHTML = '<h1>Hello World</h1>';
```

### `WindowManager.closeWindow(windowId)`

Closes a window.

**Parameters**:
- `windowId` (string) - Window ID

**Returns**: `void`

### `WindowManager.minimizeWindow(windowId)`

Minimizes a window.

**Parameters**:
- `windowId` (string) - Window ID

**Returns**: `void`

### `WindowManager.maximizeWindow(windowId)`

Maximizes a window.

**Parameters**:
- `windowId` (string) - Window ID

**Returns**: `void`

### `WindowManager.focusWindow(windowId)`

Focuses a window.

**Parameters**:
- `windowId` (string) - Window ID

**Returns**: `void`

### `WindowManager.cascadeWindows()`

Arranges all windows in a cascade.

**Returns**: `void`

### `WindowManager.tileWindows()`

Tiles all windows to fill the screen.

**Returns**: `void`

### Events

- `window-created` - Fired when a window is created
- `window-closed` - Fired when a window is closed
- `window-focused` - Fired when a window gains focus

---

## IPC API

### `MessageBus.send(target, message)`

Sends a message to a specific process.

**Parameters**:
- `target` (number) - Target process ID
- `message` (any) - Message payload

**Returns**: `void`

**Example**:
```javascript
MessageBus.send(123, {
  type: 'data-update',
  data: { foo: 'bar' }
});
```

### `MessageBus.broadcast(message)`

Broadcasts a message to all processes.

**Parameters**:
- `message` (any) - Message payload

**Returns**: `void`

**Example**:
```javascript
MessageBus.broadcast({
  type: 'system-notification',
  text: 'System update available'
});
```

### `MessageBus.subscribe(topic, callback)`

Subscribes to messages on a topic.

**Parameters**:
- `topic` (string) - Topic name
- `callback` (Function) - Message handler

**Returns**: `void`

**Example**:
```javascript
MessageBus.subscribe('user-login', (event) => {
  console.log('User logged in:', event.detail);
});
```

### `MessageBus.unsubscribe(topic, callback)`

Unsubscribes from a topic.

**Parameters**:
- `topic` (string) - Topic name
- `callback` (Function) - Handler to remove

**Returns**: `void`

### `MessageBus.createChannel(processId)`

Creates a dedicated message channel.

**Parameters**:
- `processId` (number) - Process ID

**Returns**: `MessagePort`

**Example**:
```javascript
const port = MessageBus.createChannel(123);

port.onmessage = (event) => {
  console.log('Received:', event.data);
};

port.postMessage({ type: 'hello' });
```

---

## Permission API

### `PermissionManager.requestPermission(processId, permission)`

Requests a permission for a process.

**Parameters**:
- `processId` (number) - Process ID
- `permission` (string) - Permission name

**Returns**: `Promise<boolean>`

**Example**:
```javascript
const granted = await PermissionManager.requestPermission(
  process.pid,
  'filesystem.write'
);

if (granted) {
  await VFS.writeFile('/home/user/data.txt', 'content');
}
```

### `PermissionManager.hasPermission(processId, permission)`

Checks if a process has a permission.

**Parameters**:
- `processId` (number) - Process ID
- `permission` (string) - Permission name

**Returns**: `boolean`

**Example**:
```javascript
if (PermissionManager.hasPermission(process.pid, 'network.fetch')) {
  const response = await fetch('https://api.example.com/data');
}
```

### `PermissionManager.revokePermission(processId, permission)`

Revokes a permission from a process.

**Parameters**:
- `processId` (number) - Process ID
- `permission` (string) - Permission name

**Returns**: `void`

### Standard Permissions

- `filesystem.read` - Read files
- `filesystem.write` - Write files
- `filesystem.delete` - Delete files
- `network.fetch` - Make HTTP requests
- `notification.show` - Show notifications
- `microphone.access` - Access microphone
- `camera.access` - Access camera
- `geolocation.access` - Access location

---

## Application API

### `AppRegistry.register(manifest)`

Registers an application.

**Parameters**:
- `manifest` (Object)
  - `id` (string) - Unique app ID
  - `name` (string) - Display name
  - `version` (string) - Version number
  - `icon` (string) - Icon emoji or URL
  - `type` (string) - 'web' | 'wasm' | 'iframe'
  - `entry` (string) - Entry point path
  - `permissions` (Array<string>) - Required permissions

**Returns**: `Application`

**Example**:
```javascript
AppRegistry.register({
  id: 'my-app',
  name: 'My Application',
  version: '1.0.0',
  icon: '🚀',
  type: 'web',
  entry: '/apps/my-app/index.js',
  permissions: ['filesystem.read', 'filesystem.write']
});
```

### `AppRegistry.launchApp(appId, args)`

Launches an application.

**Parameters**:
- `appId` (string) - Application ID
- `args` (Object, optional)
  - `windowConfig` (Object) - Window configuration
  - Custom app arguments

**Returns**: `Promise<{ process, window }>`

**Example**:
```javascript
const { process, window } = await AppRegistry.launchApp('text-editor', {
  windowConfig: {
    width: 1000,
    height: 700
  },
  file: '/home/user/document.txt'
});
```

### `AppRegistry.getApp(appId)`

Gets an application by ID.

**Parameters**:
- `appId` (string) - Application ID

**Returns**: `Application | undefined`

### `AppRegistry.listApps()`

Lists all registered applications.

**Returns**: `Array<Application>`

---

## Application Base Class

When creating web-based applications, extend this base class:

```javascript
export default class MyApp {
  constructor(context) {
    this.context = context;
    this.process = context.process;
    this.window = context.window;
    this.fs = context.fs;
    this.ipc = context.ipc;
  }

  async init() {
    // Initialize your app
  }

  render() {
    // Return DOM element to be added to window
    const container = document.createElement('div');
    container.innerHTML = '<h1>My App</h1>';
    return container;
  }

  async cleanup() {
    // Clean up resources before termination
  }
}
```

### Context Object

The context object passed to applications contains:

```typescript
interface AppContext {
  process: Process;        // Associated process
  window: WinBox;         // Window instance
  fs: VFS;                // File system access
  ipc: MessageBus;        // IPC communication
  args: Object;           // Launch arguments
}
```

---

## Scheduler API

### `Scheduler.scheduleTask(callback, options)`

Schedules a task with priority.

**Parameters**:
- `callback` (Function) - Task to execute
- `options` (Object, optional)
  - `priority` (string) - 'user-blocking' | 'user-visible' | 'background'
  - `delay` (number) - Delay in milliseconds
  - `signal` (AbortSignal) - Abort signal

**Returns**: `Promise<any>`

**Example**:
```javascript
await Scheduler.scheduleTask(async () => {
  // Heavy computation
  const result = await processLargeFile();
  return result;
}, {
  priority: 'background',
  delay: 1000
});
```

### `Scheduler.yield()`

Yields control back to the browser.

**Returns**: `Promise<void>`

**Example**:
```javascript
for (let i = 0; i < 1000000; i++) {
  processItem(i);

  if (i % 1000 === 0) {
    await Scheduler.yield(); // Allow browser to update UI
  }
}
```

---

## Storage Quota API

### Checking Storage Usage

```javascript
const estimate = await navigator.storage.estimate();

console.log(`Used: ${estimate.usage} bytes`);
console.log(`Quota: ${estimate.quota} bytes`);
console.log(`Percentage: ${(estimate.usage / estimate.quota * 100).toFixed(2)}%`);
```

### Requesting Persistent Storage

```javascript
if (navigator.storage && navigator.storage.persist) {
  const isPersisted = await navigator.storage.persist();
  console.log(`Persisted: ${isPersisted}`);
}
```

---

## Web Worker Communication

For applications using Web Workers:

**Main Thread**:
```javascript
const worker = new Worker('/workers/processor.js');

worker.postMessage({
  type: 'process',
  data: largeDataset
});

worker.onmessage = (event) => {
  console.log('Result:', event.data);
};
```

**Worker Thread** (`/workers/processor.js`):
```javascript
self.addEventListener('message', async (event) => {
  const { type, data } = event.data;

  if (type === 'process') {
    const result = await processData(data);
    self.postMessage(result);
  }
});
```

---

## Error Handling

### Standard Error Types

```javascript
class FileSystemError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'FileSystemError';
    this.code = code;
  }
}

class PermissionError extends Error {
  constructor(message, permission) {
    super(message);
    this.name = 'PermissionError';
    this.permission = permission;
  }
}

class ProcessError extends Error {
  constructor(message, pid) {
    super(message);
    this.name = 'ProcessError';
    this.pid = pid;
  }
}
```

### Error Handling Example

```javascript
try {
  await VFS.readFile('/protected/file.txt');
} catch (error) {
  if (error instanceof PermissionError) {
    console.error('Permission denied:', error.permission);
  } else if (error instanceof FileSystemError) {
    console.error('File system error:', error.code);
  } else {
    console.error('Unknown error:', error);
  }
}
```

---

## TypeScript Definitions

For TypeScript projects, here are the key type definitions:

```typescript
// kernel.d.ts
declare module 'webos/kernel' {
  export interface SystemInfo {
    version: string;
    bootTime: number;
    uptime: number;
    platform: string;
    userAgent: string;
    language: string;
    cores: number;
    memory: string;
  }

  export interface Kernel {
    boot(): Promise<boolean>;
    shutdown(): Promise<void>;
    getSystemInfo(): SystemInfo;
    addEventListener(event: string, callback: EventListener): void;
  }

  const kernel: Kernel;
  export default kernel;
}

// filesystem.d.ts
declare module 'webos/filesystem' {
  export interface FileEntry {
    name: string;
    type: 'file' | 'directory';
    size: number;
    mtime: number;
  }

  export interface FileStat extends FileEntry {
    atime?: number;
    ctime?: number;
  }

  export interface ReadFileOptions {
    encoding?: 'utf8' | 'base64';
  }

  export interface VFS {
    readFile(path: string, options?: ReadFileOptions): Promise<string | ArrayBuffer>;
    writeFile(path: string, data: string | ArrayBuffer, options?: any): Promise<void>;
    readdir(path: string): Promise<FileEntry[]>;
    mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
    rm(path: string, options?: { recursive?: boolean }): Promise<void>;
    stat(path: string): Promise<FileStat>;
    rename(oldPath: string, newPath: string): Promise<void>;
    copy(srcPath: string, destPath: string): Promise<void>;
    watch(path: string, callback: (event: any) => void): () => void;
  }

  const vfs: VFS;
  export default vfs;
}
```

---

## Best Practices

### 1. Always Check Permissions

```javascript
async function writeToFile(path, data) {
  const hasPermission = PermissionManager.hasPermission(
    process.pid,
    'filesystem.write'
  );

  if (!hasPermission) {
    const granted = await PermissionManager.requestPermission(
      process.pid,
      'filesystem.write'
    );

    if (!granted) {
      throw new PermissionError('Write permission denied');
    }
  }

  await VFS.writeFile(path, data);
}
```

### 2. Handle Errors Gracefully

```javascript
async function loadUserData() {
  try {
    const data = await VFS.readFile('/home/user/data.json', {
      encoding: 'utf8'
    });
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load user data:', error);
    return getDefaultData();
  }
}
```

### 3. Clean Up Resources

```javascript
class MyApp {
  constructor(context) {
    this.context = context;
    this.watchers = [];
  }

  async init() {
    const unwatch = VFS.watch('/home/user', this.onFileChange);
    this.watchers.push(unwatch);
  }

  async cleanup() {
    // Remove all watchers
    this.watchers.forEach(unwatch => unwatch());
    this.watchers = [];
  }
}
```

### 4. Use Appropriate Task Priority

```javascript
// User-blocking: Direct response to user input
button.onclick = async () => {
  await Scheduler.scheduleTask(() => {
    updateUI();
  }, { priority: 'user-blocking' });
};

// User-visible: User is waiting for result
await Scheduler.scheduleTask(async () => {
  const data = await loadData();
  displayData(data);
}, { priority: 'user-visible' });

// Background: Can be delayed
await Scheduler.scheduleTask(async () => {
  await syncToServer();
}, { priority: 'background' });
```

---

## Example: Complete Application

```javascript
// apps/my-app/index.js

export default class MyApplication {
  constructor(context) {
    this.context = context;
    this.process = context.process;
    this.window = context.window;
    this.fs = context.fs;
    this.container = null;
  }

  async init() {
    // Request permissions
    const granted = await PermissionManager.requestPermission(
      this.process.pid,
      'filesystem.read'
    );

    if (!granted) {
      throw new Error('Required permissions not granted');
    }

    // Load data
    await this.loadData();

    // Setup IPC
    this.context.ipc.subscribe('data-update', this.onDataUpdate.bind(this));
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'my-app';
    this.container.innerHTML = `
      <div class="toolbar">
        <button id="save-btn">Save</button>
        <button id="load-btn">Load</button>
      </div>
      <div class="content">
        <textarea id="editor"></textarea>
      </div>
    `;

    // Setup event listeners
    this.container.querySelector('#save-btn').onclick = () => this.save();
    this.container.querySelector('#load-btn').onclick = () => this.load();

    return this.container;
  }

  async loadData() {
    try {
      const data = await this.fs.readFile('/home/user/myapp.txt', {
        encoding: 'utf8'
      });
      return data;
    } catch (error) {
      return '';
    }
  }

  async save() {
    const editor = this.container.querySelector('#editor');
    await this.fs.writeFile('/home/user/myapp.txt', editor.value, {
      encoding: 'utf8'
    });

    // Notify other instances
    this.context.ipc.broadcast({
      type: 'data-update',
      content: editor.value
    });
  }

  async load() {
    const data = await this.loadData();
    const editor = this.container.querySelector('#editor');
    editor.value = data;
  }

  onDataUpdate(event) {
    if (event.detail.type === 'data-update') {
      const editor = this.container.querySelector('#editor');
      editor.value = event.detail.content;
    }
  }

  async cleanup() {
    this.context.ipc.unsubscribe('data-update', this.onDataUpdate);
  }
}
```

**Register the application**:

```javascript
// apps/registry.js
import MyApplication from './my-app/index.js';

AppRegistry.register({
  id: 'my-app',
  name: 'My Application',
  version: '1.0.0',
  icon: '📝',
  type: 'web',
  entry: '/apps/my-app/index.js',
  permissions: ['filesystem.read', 'filesystem.write']
});
```

---

For implementation guidance, see [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md).
