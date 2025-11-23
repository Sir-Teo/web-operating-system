/**
 * OSContextProvider - Provides real-time OS state to the AI system
 * Gathers information about files, processes, applications, and system state
 */

export class OSContextProvider {
  constructor(osServices = {}) {
    this.vfs = osServices.vfs;
    this.processManager = osServices.processManager;
    this.windowManager = osServices.windowManager;
    this.terminal = osServices.terminal;
    this.appRegistry = osServices.appRegistry;
  }

  /**
   * Get comprehensive OS context
   * @returns {Object} OS context including all system state
   */
  async getContext() {
    const context = {};

    // File system context
    if (this.vfs) {
      context.fileSystem = await this._getFileSystemContext();
      context.currentDirectory = await this._getCurrentDirectory();
    }

    // Process context
    if (this.processManager) {
      context.processes = this._getProcessContext();
    }

    // Application context
    if (this.appRegistry) {
      context.applications = this._getApplicationContext();
    }

    // Window manager context
    if (this.windowManager) {
      context.windows = this._getWindowContext();
    }

    // Terminal context
    if (this.terminal) {
      context.terminal = this._getTerminalContext();
    }

    // System info
    context.systemInfo = this._getSystemInfo();

    return context;
  }

  /**
   * Get file system context
   * @private
   */
  async _getFileSystemContext() {
    try {
      const homeDir = '/home/user';
      const files = await this.vfs.readdir(homeDir);

      const fileList = await Promise.all(
        files.map(async (file) => {
          try {
            const path = `${homeDir}/${file}`;
            const stat = await this.vfs.stat(path);
            return {
              name: file,
              path,
              type: stat.type,
              size: stat.size,
              modified: stat.mtime
            };
          } catch (err) {
            return { name: file, path: `${homeDir}/${file}`, error: true };
          }
        })
      );

      return {
        homeDir,
        files: fileList,
        totalFiles: fileList.length
      };
    } catch (error) {
      console.error('[OSContextProvider] Error getting file system context:', error);
      return { error: error.message };
    }
  }

  /**
   * Get current directory
   * @private
   */
  async _getCurrentDirectory() {
    try {
      // Try to get from terminal if available
      if (this.terminal && this.terminal.currentDirectory) {
        return this.terminal.currentDirectory;
      }
      return '/home/user';
    } catch (error) {
      return '/home/user';
    }
  }

  /**
   * Get process context
   * @private
   */
  _getProcessContext() {
    try {
      const processes = this.processManager.getAllProcesses();
      return processes.map(proc => ({
        pid: proc.pid,
        name: proc.name,
        type: proc.type,
        status: proc.status,
        startTime: proc.startTime,
        parentPid: proc.parentPid
      }));
    } catch (error) {
      console.error('[OSContextProvider] Error getting process context:', error);
      return [];
    }
  }

  /**
   * Get application context
   * @private
   */
  _getApplicationContext() {
    try {
      const apps = this.appRegistry.getAllApps();
      return Object.entries(apps).map(([id, app]) => ({
        id,
        name: app.name,
        category: app.category,
        description: app.description,
        icon: app.icon
      }));
    } catch (error) {
      console.error('[OSContextProvider] Error getting application context:', error);
      return [];
    }
  }

  /**
   * Get window manager context
   * @private
   */
  _getWindowContext() {
    try {
      const windows = this.windowManager.getAllWindows();
      return windows.map(win => ({
        id: win.id,
        title: win.title,
        appId: win.appId,
        isMinimized: win.isMinimized,
        isMaximized: win.isMaximized
      }));
    } catch (error) {
      console.error('[OSContextProvider] Error getting window context:', error);
      return [];
    }
  }

  /**
   * Get terminal context
   * @private
   */
  _getTerminalContext() {
    try {
      return {
        currentDirectory: this.terminal.currentDirectory || '/home/user',
        historySize: this.terminal.history?.length || 0,
        recentCommands: this.terminal.history?.slice(-5) || []
      };
    } catch (error) {
      console.error('[OSContextProvider] Error getting terminal context:', error);
      return { currentDirectory: '/home/user' };
    }
  }

  /**
   * Get system information
   * @private
   */
  _getSystemInfo() {
    return {
      platform: navigator.platform || 'WebOS',
      userAgent: navigator.userAgent,
      language: navigator.language,
      online: navigator.onLine,
      memory: performance.memory ? {
        total: performance.memory.jsHeapSizeLimit,
        used: performance.memory.usedJSHeapSize
      } : null,
      timestamp: Date.now(),
      uptime: performance.now()
    };
  }

  /**
   * Update services references
   */
  updateServices(services) {
    if (services.vfs) this.vfs = services.vfs;
    if (services.processManager) this.processManager = services.processManager;
    if (services.windowManager) this.windowManager = services.windowManager;
    if (services.terminal) this.terminal = services.terminal;
    if (services.appRegistry) this.appRegistry = services.appRegistry;
  }
}

export default OSContextProvider;
