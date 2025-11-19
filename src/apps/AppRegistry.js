import ProcessManager from '../kernel/ProcessManager.js';
import WindowManager from '../ui/WindowManager.js';
import VFS from '../filesystem/VFS.js';
import IPC from '../kernel/IPC.js';

class Application {
  constructor(manifest) {
    this.id = manifest.id;
    this.name = manifest.name;
    this.version = manifest.version;
    this.icon = manifest.icon;
    this.permissions = manifest.permissions || [];
    this.type = manifest.type; // 'web', 'wasm', 'iframe'
    this.entry = manifest.entry;
    this.Component = manifest.Component;
  }

  async launch(args = {}) {
    const process = await ProcessManager.spawn({
      name: this.name,
      permissions: this.permissions
    });

    const context = {
      process,
      fs: VFS,
      ipc: IPC,
      args
    };

    let contentElement;

    switch (this.type) {
      case 'web':
        contentElement = await this._launchWebApp(context);
        break;
      case 'wasm':
        contentElement = await this._launchWasmApp(context);
        break;
      case 'iframe':
        contentElement = await this._launchIframeApp(context);
        break;
      default:
        throw new Error(`Unknown app type: ${this.type}`);
    }

    const { windowId, winbox } = WindowManager.createWindow({
      title: this.name,
      icon: this.icon,
      process: process.pid,
      ...args.windowConfig
    });

    if (contentElement) {
      winbox.body.appendChild(contentElement);
    }

    return { process, windowId, winbox };
  }

  async _launchWebApp(context) {
    if (this.Component) {
      const app = new this.Component(context);
      await app.init();
      return app.render();
    } else if (this.entry) {
      const module = await import(/* @vite-ignore */ this.entry);
      const app = new module.default(context);
      await app.init();
      return app.render();
    }
    throw new Error('Web app must have Component or entry');
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

    const container = document.createElement('div');
    container.textContent = 'WASM application running...';
    return container;
  }

  async _launchIframeApp(context) {
    const iframe = document.createElement('iframe');
    iframe.src = this.entry;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    return iframe;
  }

  _createWasmEnv(context) {
    return {
      log: (ptr, len) => {
        console.log('WASM Log:', ptr, len);
      }
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
