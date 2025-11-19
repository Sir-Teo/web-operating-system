/**
 * Plugin Sandbox
 * Provides isolated execution environment for plugins with resource limits
 */

export class PluginSandbox {
  constructor(permissions = []) {
    this.permissions = new Set(permissions);
    this.iframe = null;
    this.worker = null;
    this.isolated = false;

    // Resource limits
    this.resourceLimits = {
      maxMemory: 50 * 1024 * 1024, // 50MB
      maxCPUTime: 5000, // 5 seconds per operation
      maxNetworkRequests: 100, // Per hour
      maxStorageSize: 10 * 1024 * 1024 // 10MB
    };

    // Resource tracking
    this.stats = {
      memoryUsed: 0,
      cpuTime: 0,
      networkRequests: 0,
      storageUsed: 0,
      created: new Date(),
      lastActivity: new Date()
    };

    // Event handlers
    this.eventHandlers = new Map();
  }

  /**
   * Create isolated execution context
   * @param {string} type - Context type ('iframe' or 'worker')
   * @returns {Promise<Object>} Execution context
   */
  async createContext(type = 'basic') {
    try {
      if (type === 'iframe') {
        return await this.createIframeContext();
      } else if (type === 'worker') {
        return await this.createWorkerContext();
      } else {
        // Basic isolation using scoped variables
        return this.createBasicContext();
      }
    } catch (error) {
      console.error('[PluginSandbox] Failed to create context:', error);
      throw error;
    }
  }

  /**
   * Create iframe-based context (for DOM access)
   */
  async createIframeContext() {
    this.iframe = document.createElement('iframe');
    this.iframe.sandbox = 'allow-scripts';
    this.iframe.style.display = 'none';
    this.iframe.style.position = 'absolute';
    this.iframe.style.width = '0';
    this.iframe.style.height = '0';

    document.body.appendChild(this.iframe);
    this.isolated = true;

    return this.iframe.contentWindow;
  }

  /**
   * Create Web Worker context (for background tasks)
   */
  async createWorkerContext() {
    // Create inline worker
    const workerCode = `
      self.onmessage = function(e) {
        try {
          const result = eval(e.data.code);
          self.postMessage({ success: true, result });
        } catch (error) {
          self.postMessage({
            success: false,
            error: error.message
          });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);

    this.worker = new Worker(workerUrl);
    this.isolated = true;

    return this.worker;
  }

  /**
   * Create basic scoped context
   */
  createBasicContext() {
    // Return a scoped object with limited globals
    return {
      console: {
        log: (...args) => console.log('[Plugin]', ...args),
        warn: (...args) => console.warn('[Plugin]', ...args),
        error: (...args) => console.error('[Plugin]', ...args)
      },
      setTimeout: (fn, delay) => setTimeout(fn, Math.min(delay, 5000)),
      setInterval: (fn, delay) => setInterval(fn, Math.max(delay, 100)),
      clearTimeout,
      clearInterval,
      Date,
      Math,
      JSON,
      Promise
    };
  }

  /**
   * Check if plugin has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean}
   */
  hasPermission(permission) {
    return this.permissions.has(permission);
  }

  /**
   * Require specific permission (throws if not granted)
   * @param {string} permission - Required permission
   */
  requirePermission(permission) {
    if (!this.hasPermission(permission)) {
      throw new Error(`Permission denied: ${permission}`);
    }
  }

  /**
   * Check resource limits
   * @throws {Error} If limits exceeded
   */
  checkLimits() {
    if (this.stats.memoryUsed > this.resourceLimits.maxMemory) {
      throw new Error(
        `Memory limit exceeded: ${this.stats.memoryUsed} > ${this.resourceLimits.maxMemory}`
      );
    }

    if (this.stats.cpuTime > this.resourceLimits.maxCPUTime) {
      throw new Error(
        `CPU time limit exceeded: ${this.stats.cpuTime}ms > ${this.resourceLimits.maxCPUTime}ms`
      );
    }

    if (this.stats.networkRequests > this.resourceLimits.maxNetworkRequests) {
      throw new Error(
        `Network request limit exceeded: ${this.stats.networkRequests} > ${this.resourceLimits.maxNetworkRequests}`
      );
    }

    if (this.stats.storageUsed > this.resourceLimits.maxStorageSize) {
      throw new Error(
        `Storage limit exceeded: ${this.stats.storageUsed} > ${this.resourceLimits.maxStorageSize}`
      );
    }
  }

  /**
   * Update resource usage stats
   * @param {string} resource - Resource type
   * @param {number} amount - Amount to add
   */
  updateResourceUsage(resource, amount) {
    if (resource in this.stats) {
      this.stats[resource] += amount;
      this.stats.lastActivity = new Date();
      this.checkLimits();
    }
  }

  /**
   * Get resource usage statistics
   * @returns {Object} Stats object
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset resource usage counters
   */
  resetStats() {
    this.stats.cpuTime = 0;
    this.stats.networkRequests = 0;
  }

  /**
   * Execute code with timeout
   * @param {Function} fn - Function to execute
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<any>} Execution result
   */
  async executeWithTimeout(fn, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timer = setTimeout(() => {
        reject(new Error(`Execution timeout after ${timeout}ms`));
      }, timeout);

      try {
        const result = fn();
        const cpuTime = Date.now() - startTime;
        this.updateResourceUsage('cpuTime', cpuTime);

        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[PluginSandbox] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy sandbox and clean up resources
   */
  destroy() {
    try {
      // Remove iframe
      if (this.iframe) {
        this.iframe.remove();
        this.iframe = null;
      }

      // Terminate worker
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }

      // Clear event handlers
      this.eventHandlers.clear();

      // Reset stats
      this.stats = {
        memoryUsed: 0,
        cpuTime: 0,
        networkRequests: 0,
        storageUsed: 0,
        created: new Date(),
        lastActivity: new Date()
      };

      this.isolated = false;

      console.log('[PluginSandbox] Destroyed');
    } catch (error) {
      console.error('[PluginSandbox] Error during destroy:', error);
    }
  }

  /**
   * Set custom resource limits
   * @param {Object} limits - Resource limits
   */
  setResourceLimits(limits) {
    this.resourceLimits = { ...this.resourceLimits, ...limits };
  }

  /**
   * Get resource limits
   * @returns {Object} Resource limits
   */
  getResourceLimits() {
    return { ...this.resourceLimits };
  }
}

export default PluginSandbox;
