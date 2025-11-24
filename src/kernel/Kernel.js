import ProcessManager from './ProcessManager.js';
import Scheduler from './Scheduler.js';
import IPC from './IPC.js';
import VFS from '../filesystem/VFS.js';
import PermissionManager from './PermissionManager.js';
import { eventBus } from '../utils/EventBus.js';
import { Logger } from '../utils/Logger.js';
import ThemeManager from '../system/themes/ThemeManager.js';
import PluginManager from '../system/plugins/PluginManager.js';
import UserManager from '../system/users/UserManager.js';
import { CloudStorageManager } from '../cloud/CloudStorageManager.js';

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
    this.eventBus = eventBus;
    this.logger = new Logger('Kernel');
    this.config = {};

    // Phase 5 - System Enhancements
    this.themeManager = ThemeManager;
    this.pluginManager = null;  // Initialized in boot
    this.userManager = null;    // Initialized in boot

    // Phase 7 - Cloud & Sync
    this.cloudManager = null;   // Initialized in boot
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
      await this._initializeUserManager();
      await this._initializePluginManager();
      await this._initializeCloudManager();
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
      this.logger.warn(`Browser missing some features: ${missing.join(', ')}`);
      // Don't throw error, just warn - we can work around some missing features
    }

    this.logger.info('Browser support check passed');
  }

  async _initializeStorage() {
    this.logger.info('Initializing storage...');

    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      this.logger.info(`Storage persistence: ${isPersisted}`);
    }

    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const percentUsed = (estimate.usage / estimate.quota * 100).toFixed(2);
      this.logger.info(`Storage: ${this._formatBytes(estimate.usage)} / ${this._formatBytes(estimate.quota)} (${percentUsed}%)`);
    }
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

  async _initializeUserManager() {
    this.logger.info('Initializing user manager...');
    this.userManager = new UserManager(this);
    await this.userManager.init();
    this.logger.info('User manager ready');
  }

  async _initializePluginManager() {
    this.logger.info('Initializing plugin manager...');
    this.pluginManager = new PluginManager(this);
    await this.pluginManager.loadEnabledPlugins();
    this.logger.info('Plugin manager ready');
  }

  async _initializeCloudManager() {
    this.logger.info('Initializing cloud storage manager...');
    this.cloudManager = new CloudStorageManager(this.vfs);
    this.logger.info('Cloud storage manager ready');
  }

  async _loadSystemConfiguration() {
    this.logger.info('Loading system configuration...');
    // Start with safe defaults
    this.config = {
      theme: 'light',
      wallpaper: '/assets/wallpapers/default.jpg',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    try {
      const configPath = '/home/user/.config/system.json';
      const configData = this.vfs?.readFile
        ? await this.vfs.readFile(configPath, { encoding: 'utf8' })
        : null;

      if (configData) {
        this.config = JSON.parse(configData);
        this.logger.info('System configuration loaded');
        return;
      }
    } catch (error) {
      // Save default config
      try {
        await this.vfs.mkdir('/home/user/.config', { recursive: true });
        await this.vfs.writeFile('/home/user/.config/system.json', JSON.stringify(this.config, null, 2));
      } catch (e) {
        this.logger.warn('Could not save default config:', e.message);
      }
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
