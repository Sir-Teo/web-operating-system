/**
 * WebOS Resource Monitoring and Management
 * Tracks and limits resource usage (CPU, memory, storage) for processes
 */

import { createLogger } from './Logger.js';
import { ResourceLimitExceededError, OutOfMemoryError } from './Errors.js';

const logger = createLogger('ResourceMonitor');

/**
 * Resource types
 */
export const ResourceType = {
  CPU: 'cpu',
  MEMORY: 'memory',
  STORAGE: 'storage',
  NETWORK: 'network',
  GPU: 'gpu'
};

/**
 * Resource limits configuration
 */
export const DefaultResourceLimits = {
  [ResourceType.CPU]: {
    max: 80,           // Max CPU usage percentage
    warn: 60,          // Warning threshold
    throttle: 70       // Start throttling at this level
  },
  [ResourceType.MEMORY]: {
    max: 100 * 1024 * 1024,  // 100MB per process
    warn: 75 * 1024 * 1024,  // 75MB warning
    throttle: 90 * 1024 * 1024  // 90MB throttle
  },
  [ResourceType.STORAGE]: {
    max: 500 * 1024 * 1024,  // 500MB per process
    warn: 400 * 1024 * 1024, // 400MB warning
    throttle: 450 * 1024 * 1024  // 450MB throttle
  },
  [ResourceType.NETWORK]: {
    max: 10 * 1024 * 1024,   // 10MB/s
    warn: 8 * 1024 * 1024,   // 8MB/s warning
    throttle: 9 * 1024 * 1024   // 9MB/s throttle
  }
};

/**
 * Resource usage snapshot
 */
export class ResourceSnapshot {
  constructor(processId) {
    this.processId = processId;
    this.timestamp = Date.now();
    this.cpu = 0;
    this.memory = 0;
    this.storage = 0;
    this.network = 0;
    this.gpu = 0;
  }

  toJSON() {
    return {
      processId: this.processId,
      timestamp: this.timestamp,
      cpu: this.cpu,
      memory: this.memory,
      storage: this.storage,
      network: this.network,
      gpu: this.gpu
    };
  }
}

/**
 * Process resource tracker
 */
export class ProcessResourceTracker {
  constructor(processId, limits = {}) {
    this.processId = processId;
    this.limits = {
      ...DefaultResourceLimits,
      ...limits
    };

    this.current = new ResourceSnapshot(processId);
    this.peak = new ResourceSnapshot(processId);
    this.history = [];
    this.maxHistoryLength = 100;

    this.startTime = Date.now();
    this.lastCpuCheck = Date.now();
    this.cpuTime = 0;

    this.throttled = false;
    this.warnings = new Set();

    logger.debug('ProcessResourceTracker created', { processId });
  }

  /**
   * Update resource usage
   */
  update(resourceType, value) {
    this.current[resourceType] = value;

    // Update peak values
    if (value > this.peak[resourceType]) {
      this.peak[resourceType] = value;
    }

    // Check limits
    this.checkLimit(resourceType, value);

    // Add to history
    this.addToHistory();
  }

  /**
   * Add current snapshot to history
   */
  addToHistory() {
    const snapshot = new ResourceSnapshot(this.processId);
    snapshot.cpu = this.current.cpu;
    snapshot.memory = this.current.memory;
    snapshot.storage = this.current.storage;
    snapshot.network = this.current.network;
    snapshot.gpu = this.current.gpu;

    this.history.push(snapshot);

    // Trim history if too long
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
  }

  /**
   * Check if resource usage exceeds limits
   */
  checkLimit(resourceType, value) {
    const limit = this.limits[resourceType];
    if (!limit) return;

    // Check max limit
    if (value >= limit.max) {
      const error = new ResourceLimitExceededError(
        resourceType,
        limit.max,
        value,
        { processId: this.processId }
      );
      logger.error('Resource limit exceeded', error);
      throw error;
    }

    // Check throttle threshold
    if (value >= limit.throttle && !this.throttled) {
      this.throttled = true;
      logger.warn('Process throttled due to resource usage', {
        processId: this.processId,
        resourceType,
        value,
        limit: limit.throttle
      });
    }

    // Check warning threshold
    if (value >= limit.warn && !this.warnings.has(resourceType)) {
      this.warnings.add(resourceType);
      logger.warn('Resource usage warning', {
        processId: this.processId,
        resourceType,
        value,
        limit: limit.warn
      });
    }
  }

  /**
   * Update CPU usage
   */
  updateCpu(cpuTime) {
    const now = Date.now();
    const elapsed = now - this.lastCpuCheck;

    if (elapsed > 0) {
      const cpuDelta = cpuTime - this.cpuTime;
      const cpuPercent = (cpuDelta / elapsed) * 100;

      this.update(ResourceType.CPU, cpuPercent);

      this.lastCpuCheck = now;
      this.cpuTime = cpuTime;
    }
  }

  /**
   * Update memory usage
   */
  updateMemory(bytes) {
    this.update(ResourceType.MEMORY, bytes);
  }

  /**
   * Update storage usage
   */
  updateStorage(bytes) {
    this.update(ResourceType.STORAGE, bytes);
  }

  /**
   * Update network usage
   */
  updateNetwork(bytesPerSecond) {
    this.update(ResourceType.NETWORK, bytesPerSecond);
  }

  /**
   * Get average resource usage over time window
   */
  getAverage(resourceType, timeWindowMs = 10000) {
    const cutoff = Date.now() - timeWindowMs;
    const relevantSnapshots = this.history.filter(s => s.timestamp >= cutoff);

    if (relevantSnapshots.length === 0) {
      return 0;
    }

    const sum = relevantSnapshots.reduce((acc, s) => acc + s[resourceType], 0);
    return sum / relevantSnapshots.length;
  }

  /**
   * Get resource usage percentage
   */
  getUsagePercentage(resourceType) {
    const limit = this.limits[resourceType];
    if (!limit) return 0;

    const current = this.current[resourceType];
    return (current / limit.max) * 100;
  }

  /**
   * Check if process should be throttled
   */
  shouldThrottle() {
    return this.throttled;
  }

  /**
   * Reset throttle state
   */
  resetThrottle() {
    this.throttled = false;
  }

  /**
   * Get current resource snapshot
   */
  getCurrentSnapshot() {
    return { ...this.current };
  }

  /**
   * Get peak resource snapshot
   */
  getPeakSnapshot() {
    return { ...this.peak };
  }

  /**
   * Get resource statistics
   */
  getStatistics() {
    const uptime = Date.now() - this.startTime;

    return {
      processId: this.processId,
      uptime,
      current: this.getCurrentSnapshot(),
      peak: this.getPeakSnapshot(),
      averages: {
        cpu: this.getAverage(ResourceType.CPU),
        memory: this.getAverage(ResourceType.MEMORY),
        storage: this.getAverage(ResourceType.STORAGE),
        network: this.getAverage(ResourceType.NETWORK)
      },
      limits: this.limits,
      throttled: this.throttled,
      warnings: Array.from(this.warnings)
    };
  }
}

/**
 * System-wide resource monitor
 */
export class ResourceMonitor {
  constructor() {
    this.trackers = new Map();
    this.systemLimits = { ...DefaultResourceLimits };
    this.systemSnapshot = new ResourceSnapshot('system');

    this.monitoringEnabled = true;
    this.monitoringInterval = 1000; // Check every second
    this.monitoringTimer = null;

    // Browser memory API support
    this.hasMemoryAPI = 'memory' in performance;

    logger.info('ResourceMonitor initialized', {
      hasMemoryAPI: this.hasMemoryAPI
    });
  }

  /**
   * Start monitoring
   */
  start() {
    if (this.monitoringTimer) {
      return;
    }

    this.monitoringEnabled = true;
    this.monitoringTimer = setInterval(() => {
      this.updateSystemResources();
    }, this.monitoringInterval);

    logger.info('Resource monitoring started');
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }

    this.monitoringEnabled = false;
    logger.info('Resource monitoring stopped');
  }

  /**
   * Register a process for monitoring
   */
  registerProcess(processId, limits = {}) {
    if (this.trackers.has(processId)) {
      logger.warn('Process already registered', { processId });
      return this.trackers.get(processId);
    }

    const tracker = new ProcessResourceTracker(processId, limits);
    this.trackers.set(processId, tracker);

    logger.debug('Process registered for monitoring', { processId });

    return tracker;
  }

  /**
   * Unregister a process
   */
  unregisterProcess(processId) {
    if (this.trackers.delete(processId)) {
      logger.debug('Process unregistered from monitoring', { processId });
    }
  }

  /**
   * Get tracker for a process
   */
  getTracker(processId) {
    return this.trackers.get(processId);
  }

  /**
   * Update system resources
   */
  updateSystemResources() {
    // Update system memory if API is available
    if (this.hasMemoryAPI && performance.memory) {
      const memory = performance.memory;
      this.systemSnapshot.memory = memory.usedJSHeapSize;

      // Check system memory limit
      if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
        logger.warn('System memory usage high', {
          used: memory.usedJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        });
      }
    }

    // Update system-wide metrics
    this.systemSnapshot.timestamp = Date.now();

    // Calculate total process resources
    let totalCpu = 0;
    let totalMemory = 0;
    let totalStorage = 0;

    for (const tracker of this.trackers.values()) {
      totalCpu += tracker.current.cpu;
      totalMemory += tracker.current.memory;
      totalStorage += tracker.current.storage;
    }

    this.systemSnapshot.cpu = totalCpu;
    // Note: Use system memory if available, otherwise use sum of process memory
    if (!this.hasMemoryAPI) {
      this.systemSnapshot.memory = totalMemory;
    }
    this.systemSnapshot.storage = totalStorage;
  }

  /**
   * Check if memory allocation is allowed
   */
  canAllocateMemory(processId, bytes) {
    const tracker = this.trackers.get(processId);
    if (!tracker) {
      return true; // No tracker, allow by default
    }

    const limit = tracker.limits[ResourceType.MEMORY];
    const current = tracker.current.memory;

    return (current + bytes) <= limit.max;
  }

  /**
   * Check if storage allocation is allowed
   */
  canAllocateStorage(processId, bytes) {
    const tracker = this.trackers.get(processId);
    if (!tracker) {
      return true;
    }

    const limit = tracker.limits[ResourceType.STORAGE];
    const current = tracker.current.storage;

    return (current + bytes) <= limit.max;
  }

  /**
   * Request memory allocation
   */
  requestMemory(processId, bytes) {
    if (!this.canAllocateMemory(processId, bytes)) {
      const tracker = this.trackers.get(processId);
      const limit = tracker.limits[ResourceType.MEMORY];
      throw new OutOfMemoryError(bytes, limit.max - tracker.current.memory, {
        processId
      });
    }

    const tracker = this.trackers.get(processId);
    if (tracker) {
      tracker.updateMemory(tracker.current.memory + bytes);
    }
  }

  /**
   * Release memory
   */
  releaseMemory(processId, bytes) {
    const tracker = this.trackers.get(processId);
    if (tracker) {
      const newMemory = Math.max(0, tracker.current.memory - bytes);
      tracker.updateMemory(newMemory);
    }
  }

  /**
   * Request storage allocation
   */
  async requestStorage(processId, bytes) {
    if (!this.canAllocateStorage(processId, bytes)) {
      const tracker = this.trackers.get(processId);
      const limit = tracker.limits[ResourceType.STORAGE];
      throw new ResourceLimitExceededError(
        ResourceType.STORAGE,
        limit.max,
        tracker.current.storage + bytes,
        { processId }
      );
    }

    const tracker = this.trackers.get(processId);
    if (tracker) {
      tracker.updateStorage(tracker.current.storage + bytes);
    }
  }

  /**
   * Release storage
   */
  releaseStorage(processId, bytes) {
    const tracker = this.trackers.get(processId);
    if (tracker) {
      const newStorage = Math.max(0, tracker.current.storage - bytes);
      tracker.updateStorage(newStorage);
    }
  }

  /**
   * Get system resource snapshot
   */
  getSystemSnapshot() {
    return { ...this.systemSnapshot };
  }

  /**
   * Get all process statistics
   */
  getAllProcessStatistics() {
    const stats = [];
    for (const tracker of this.trackers.values()) {
      stats.push(tracker.getStatistics());
    }
    return stats;
  }

  /**
   * Get system statistics
   */
  getSystemStatistics() {
    const processStats = this.getAllProcessStatistics();

    // Calculate system totals
    const totals = {
      cpu: 0,
      memory: 0,
      storage: 0,
      network: 0
    };

    for (const stat of processStats) {
      totals.cpu += stat.current.cpu;
      totals.memory += stat.current.memory;
      totals.storage += stat.current.storage;
      totals.network += stat.current.network;
    }

    return {
      timestamp: Date.now(),
      totals,
      system: this.systemSnapshot,
      processCount: this.trackers.size,
      processes: processStats,
      limits: this.systemLimits,
      monitoring: this.monitoringEnabled
    };
  }

  /**
   * Set system resource limits
   */
  setSystemLimits(limits) {
    this.systemLimits = {
      ...this.systemLimits,
      ...limits
    };

    logger.info('System resource limits updated', limits);
  }

  /**
   * Get processes exceeding thresholds
   */
  getThrottledProcesses() {
    const throttled = [];
    for (const tracker of this.trackers.values()) {
      if (tracker.shouldThrottle()) {
        throttled.push({
          processId: tracker.processId,
          statistics: tracker.getStatistics()
        });
      }
    }
    return throttled;
  }

  /**
   * Get processes with warnings
   */
  getProcessesWithWarnings() {
    const warned = [];
    for (const tracker of this.trackers.values()) {
      if (tracker.warnings.size > 0) {
        warned.push({
          processId: tracker.processId,
          warnings: Array.from(tracker.warnings),
          statistics: tracker.getStatistics()
        });
      }
    }
    return warned;
  }

  /**
   * Dispose monitor
   */
  dispose() {
    this.stop();
    this.trackers.clear();
    logger.info('ResourceMonitor disposed');
  }
}

// Create singleton instance
const resourceMonitor = new ResourceMonitor();

/**
 * Get the global resource monitor
 */
export function getResourceMonitor() {
  return resourceMonitor;
}

export default {
  ResourceMonitor,
  ProcessResourceTracker,
  ResourceSnapshot,
  ResourceType,
  DefaultResourceLimits,
  getResourceMonitor
};
