/**
 * Performance Monitoring Utility
 * Tracks and reports performance metrics
 */

export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      bootTime: 0,
      fileOperations: [],
      networkRequests: [],
      renderTimes: [],
      memoryUsage: [],
      fps: []
    };

    this.marks = new Map();
    this.observers = [];
  }

  /**
   * Mark the start of a performance measurement
   * @param {string} name - Measurement name
   */
  mark(name) {
    const markName = `${name}-start`;
    performance.mark(markName);
    this.marks.set(name, Date.now());
  }

  /**
   * Measure the time since a mark
   * @param {string} name - Measurement name
   * @returns {number} Duration in milliseconds
   */
  measure(name) {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`No mark found for: ${name}`);
      return 0;
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Create performance measure
    try {
      performance.measure(name, `${name}-start`);
    } catch (e) {
      // Mark might not exist in Performance API
    }

    this.marks.delete(name);
    return duration;
  }

  /**
   * Record boot time
   * @param {number} duration - Boot duration in milliseconds
   */
  recordBootTime(duration) {
    this.metrics.bootTime = duration;
  }

  /**
   * Record file operation
   * @param {string} operation - Operation type
   * @param {number} duration - Duration in milliseconds
   * @param {number} size - File size in bytes
   */
  recordFileOperation(operation, duration, size = 0) {
    this.metrics.fileOperations.push({
      operation,
      duration,
      size,
      timestamp: Date.now()
    });

    // Keep only last 100 operations
    if (this.metrics.fileOperations.length > 100) {
      this.metrics.fileOperations.shift();
    }
  }

  /**
   * Record network request
   * @param {string} url - Request URL
   * @param {number} duration - Duration in milliseconds
   * @param {number} size - Response size in bytes
   */
  recordNetworkRequest(url, duration, size = 0) {
    this.metrics.networkRequests.push({
      url,
      duration,
      size,
      timestamp: Date.now()
    });

    // Keep only last 100 requests
    if (this.metrics.networkRequests.length > 100) {
      this.metrics.networkRequests.shift();
    }
  }

  /**
   * Record render time
   * @param {string} component - Component name
   * @param {number} duration - Duration in milliseconds
   */
  recordRenderTime(component, duration) {
    this.metrics.renderTimes.push({
      component,
      duration,
      timestamp: Date.now()
    });

    // Keep only last 100 renders
    if (this.metrics.renderTimes.length > 100) {
      this.metrics.renderTimes.shift();
    }
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage() {
    if (performance.memory) {
      this.metrics.memoryUsage.push({
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
      });

      // Keep only last 100 samples
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage.shift();
      }
    }
  }

  /**
   * Measure FPS (Frames Per Second)
   * @param {number} duration - Measurement duration in milliseconds
   * @returns {Promise<number>} Average FPS
   */
  async measureFPS(duration = 1000) {
    return new Promise((resolve) => {
      let frames = 0;
      const startTime = performance.now();

      const countFrame = () => {
        frames++;
        const elapsed = performance.now() - startTime;

        if (elapsed < duration) {
          requestAnimationFrame(countFrame);
        } else {
          const fps = Math.round((frames / elapsed) * 1000);
          this.metrics.fps.push({
            fps,
            timestamp: Date.now()
          });

          // Keep only last 100 samples
          if (this.metrics.fps.length > 100) {
            this.metrics.fps.shift();
          }

          resolve(fps);
        }
      };

      requestAnimationFrame(countFrame);
    });
  }

  /**
   * Get average file operation time
   * @param {string} operation - Operation type (optional)
   * @returns {number} Average duration in milliseconds
   */
  getAverageFileOperationTime(operation = null) {
    let ops = this.metrics.fileOperations;

    if (operation) {
      ops = ops.filter(op => op.operation === operation);
    }

    if (ops.length === 0) return 0;

    const total = ops.reduce((sum, op) => sum + op.duration, 0);
    return total / ops.length;
  }

  /**
   * Get average network request time
   * @returns {number} Average duration in milliseconds
   */
  getAverageNetworkRequestTime() {
    if (this.metrics.networkRequests.length === 0) return 0;

    const total = this.metrics.networkRequests.reduce(
      (sum, req) => sum + req.duration,
      0
    );
    return total / this.metrics.networkRequests.length;
  }

  /**
   * Get average render time
   * @param {string} component - Component name (optional)
   * @returns {number} Average duration in milliseconds
   */
  getAverageRenderTime(component = null) {
    let renders = this.metrics.renderTimes;

    if (component) {
      renders = renders.filter(r => r.component === component);
    }

    if (renders.length === 0) return 0;

    const total = renders.reduce((sum, r) => sum + r.duration, 0);
    return total / renders.length;
  }

  /**
   * Get current memory usage
   * @returns {Object|null} Memory usage info
   */
  getCurrentMemoryUsage() {
    if (!performance.memory) return null;

    return {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit,
      usedMB: (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2),
      totalMB: (performance.memory.totalJSHeapSize / (1024 * 1024)).toFixed(2),
      limitMB: (performance.memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2)
    };
  }

  /**
   * Get performance summary
   * @returns {Object} Performance metrics summary
   */
  getSummary() {
    return {
      bootTime: this.metrics.bootTime,
      fileOperations: {
        total: this.metrics.fileOperations.length,
        avgDuration: this.getAverageFileOperationTime(),
        avgReadTime: this.getAverageFileOperationTime('read'),
        avgWriteTime: this.getAverageFileOperationTime('write')
      },
      network: {
        total: this.metrics.networkRequests.length,
        avgDuration: this.getAverageNetworkRequestTime()
      },
      rendering: {
        total: this.metrics.renderTimes.length,
        avgDuration: this.getAverageRenderTime()
      },
      memory: this.getCurrentMemoryUsage(),
      fps: this.metrics.fps.length > 0
        ? this.metrics.fps[this.metrics.fps.length - 1].fps
        : null
    };
  }

  /**
   * Get all metrics
   * @returns {Object} All metrics
   */
  getAllMetrics() {
    return { ...this.metrics };
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = {
      bootTime: 0,
      fileOperations: [],
      networkRequests: [],
      renderTimes: [],
      memoryUsage: [],
      fps: []
    };
    this.marks.clear();
  }

  /**
   * Start continuous monitoring
   * @param {number} interval - Monitoring interval in milliseconds
   * @returns {Function} Stop function
   */
  startContinuousMonitoring(interval = 5000) {
    const intervalId = setInterval(() => {
      this.recordMemoryUsage();
      this.measureFPS();
    }, interval);

    return () => clearInterval(intervalId);
  }

  /**
   * Export metrics as JSON
   * @returns {string} JSON string
   */
  exportMetrics() {
    return JSON.stringify({
      timestamp: Date.now(),
      summary: this.getSummary(),
      metrics: this.metrics
    }, null, 2);
  }

  /**
   * Log performance report to console
   */
  logReport() {
    const summary = this.getSummary();

    console.group('🎯 Performance Report');
    console.log('Boot Time:', `${summary.bootTime}ms`);

    console.group('📁 File Operations');
    console.log('Total:', summary.fileOperations.total);
    console.log('Avg Duration:', `${summary.fileOperations.avgDuration.toFixed(2)}ms`);
    console.log('Avg Read:', `${summary.fileOperations.avgReadTime.toFixed(2)}ms`);
    console.log('Avg Write:', `${summary.fileOperations.avgWriteTime.toFixed(2)}ms`);
    console.groupEnd();

    console.group('🌐 Network');
    console.log('Total Requests:', summary.network.total);
    console.log('Avg Duration:', `${summary.network.avgDuration.toFixed(2)}ms`);
    console.groupEnd();

    console.group('🎨 Rendering');
    console.log('Total Renders:', summary.rendering.total);
    console.log('Avg Duration:', `${summary.rendering.avgDuration.toFixed(2)}ms`);
    console.groupEnd();

    if (summary.memory) {
      console.group('💾 Memory');
      console.log('Used:', `${summary.memory.usedMB} MB`);
      console.log('Total:', `${summary.memory.totalMB} MB`);
      console.log('Limit:', `${summary.memory.limitMB} MB`);
      console.groupEnd();
    }

    if (summary.fps !== null) {
      console.log('🎬 FPS:', summary.fps);
    }

    console.groupEnd();
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();
