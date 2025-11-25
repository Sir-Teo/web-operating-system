/**
 * Next-Gen Memory Management System
 * Provides true memory enforcement, OOM killer, pressure handling, and GC coordination
 */

import { createLogger } from './Logger.js';
import { OutOfMemoryError, ResourceLimitExceededError } from './Errors.js';
import { getResourceMonitor, ResourceType } from './ResourceMonitor.js';

const logger = createLogger('MemoryManager');

/**
 * Memory pressure levels (aligned with browser Memory Pressure API)
 */
export const MemoryPressure = {
  NOMINAL: 'nominal',    // No pressure, plenty of memory
  MODERATE: 'moderate',  // Starting to feel pressure
  CRITICAL: 'critical'   // Critically low, immediate action needed
};

/**
 * OOM kill strategies
 */
export const OOMKillStrategy = {
  LOWEST_PRIORITY: 'lowest_priority',  // Kill lowest priority process first
  LARGEST_CONSUMER: 'largest_consumer', // Kill process using most memory
  LEAST_RECENTLY_USED: 'least_recently_used', // Kill LRU process
  YOUNGEST: 'youngest'  // Kill newest process
};

/**
 * Memory allocation strategies
 */
export const AllocationStrategy = {
  FIRST_FIT: 'first_fit',
  BEST_FIT: 'best_fit',
  WORST_FIT: 'worst_fit'
};

/**
 * Memory page simulation
 */
export class MemoryPage {
  constructor(id, size = 4096) {
    this.id = id;
    this.size = size;
    this.allocated = false;
    this.processId = null;
    this.timestamp = Date.now();
    this.accessCount = 0;
    this.lastAccess = Date.now();
  }

  allocate(processId) {
    this.allocated = true;
    this.processId = processId;
    this.timestamp = Date.now();
    this.lastAccess = Date.now();
    this.accessCount = 0;
  }

  free() {
    this.allocated = false;
    this.processId = null;
  }

  access() {
    this.lastAccess = Date.now();
    this.accessCount++;
  }
}

/**
 * Memory pool manager
 */
export class MemoryPool {
  constructor(totalSize, pageSize = 4096) {
    this.totalSize = totalSize;
    this.pageSize = pageSize;
    this.pageCount = Math.floor(totalSize / pageSize);
    this.pages = new Map();
    this.freePages = new Set();
    this.allocatedPages = new Map(); // processId -> Set<pageId>

    // Initialize pages
    for (let i = 0; i < this.pageCount; i++) {
      const page = new MemoryPage(i, pageSize);
      this.pages.set(i, page);
      this.freePages.add(i);
    }

    logger.info('Memory pool initialized', {
      totalSize,
      pageSize,
      pageCount: this.pageCount
    });
  }

  /**
   * Allocate memory pages for a process
   */
  allocate(processId, bytes, strategy = AllocationStrategy.FIRST_FIT) {
    const pagesNeeded = Math.ceil(bytes / this.pageSize);

    if (pagesNeeded > this.freePages.size) {
      throw new OutOfMemoryError(bytes, this.freePages.size * this.pageSize, {
        processId,
        requested: pagesNeeded,
        available: this.freePages.size
      });
    }

    const allocatedPageIds = [];
    const freePageArray = Array.from(this.freePages);

    // Apply allocation strategy
    switch (strategy) {
      case AllocationStrategy.FIRST_FIT:
        // Take first available pages
        for (let i = 0; i < pagesNeeded; i++) {
          allocatedPageIds.push(freePageArray[i]);
        }
        break;

      case AllocationStrategy.BEST_FIT:
        // For simplicity, same as first fit (could optimize for fragmentation)
        for (let i = 0; i < pagesNeeded; i++) {
          allocatedPageIds.push(freePageArray[i]);
        }
        break;

      case AllocationStrategy.WORST_FIT:
        // Take pages from end (leave larger contiguous blocks)
        for (let i = 0; i < pagesNeeded; i++) {
          allocatedPageIds.push(freePageArray[freePageArray.length - 1 - i]);
        }
        break;
    }

    // Allocate the pages
    for (const pageId of allocatedPageIds) {
      const page = this.pages.get(pageId);
      page.allocate(processId);
      this.freePages.delete(pageId);
    }

    // Track process allocation
    if (!this.allocatedPages.has(processId)) {
      this.allocatedPages.set(processId, new Set());
    }
    allocatedPageIds.forEach(id => this.allocatedPages.get(processId).add(id));

    logger.debug('Memory allocated', {
      processId,
      bytes,
      pages: pagesNeeded,
      freePagesRemaining: this.freePages.size
    });

    return allocatedPageIds;
  }

  /**
   * Free memory pages for a process
   */
  free(processId, pageIds = null) {
    const processPages = this.allocatedPages.get(processId);
    if (!processPages) return 0;

    const pagesToFree = pageIds || Array.from(processPages);
    let freedCount = 0;

    for (const pageId of pagesToFree) {
      const page = this.pages.get(pageId);
      if (page && page.processId === processId) {
        page.free();
        this.freePages.add(pageId);
        processPages.delete(pageId);
        freedCount++;
      }
    }

    if (processPages.size === 0) {
      this.allocatedPages.delete(processId);
    }

    logger.debug('Memory freed', {
      processId,
      pages: freedCount,
      freePagesNow: this.freePages.size
    });

    return freedCount;
  }

  /**
   * Free all memory for a process
   */
  freeAll(processId) {
    return this.free(processId);
  }

  /**
   * Get memory usage for a process
   */
  getProcessUsage(processId) {
    const pages = this.allocatedPages.get(processId);
    if (!pages) return 0;
    return pages.size * this.pageSize;
  }

  /**
   * Get total free memory
   */
  getFreeMemory() {
    return this.freePages.size * this.pageSize;
  }

  /**
   * Get memory statistics
   */
  getStatistics() {
    const allocatedCount = this.pageCount - this.freePages.size;
    return {
      totalSize: this.totalSize,
      pageSize: this.pageSize,
      pageCount: this.pageCount,
      freePages: this.freePages.size,
      allocatedPages: allocatedCount,
      utilizationPercent: (allocatedCount / this.pageCount) * 100,
      processCount: this.allocatedPages.size
    };
  }
}

/**
 * Out-of-Memory (OOM) Killer
 */
export class OOMKiller {
  constructor(memoryManager, processManager) {
    this.memoryManager = memoryManager;
    this.processManager = processManager;
    this.killStrategy = OOMKillStrategy.LOWEST_PRIORITY;
    this.killHistory = [];
    this.protectedProcesses = new Set(['kernel', 'init', 'systemd']);

    logger.info('OOM Killer initialized', { strategy: this.killStrategy });
  }

  /**
   * Select victim process to kill based on strategy
   */
  selectVictim(excludeProcessIds = []) {
    if (!this.processManager) {
      logger.error('OOM Killer: No process manager available');
      return null;
    }

    const processes = Array.from(this.processManager.processes.values())
      .filter(p => !this.protectedProcesses.has(p.id))
      .filter(p => !excludeProcessIds.includes(p.id))
      .filter(p => p.state !== 'terminated');

    if (processes.length === 0) {
      return null;
    }

    let victim = null;

    switch (this.killStrategy) {
      case OOMKillStrategy.LOWEST_PRIORITY:
        // Kill process with lowest priority (highest priority value)
        victim = processes.reduce((lowest, p) => {
          const lowestPriority = lowest.priority || 0;
          const currentPriority = p.priority || 0;
          return currentPriority > lowestPriority ? p : lowest;
        });
        break;

      case OOMKillStrategy.LARGEST_CONSUMER:
        // Kill process using most memory
        victim = processes.reduce((largest, p) => {
          const largestMem = this.memoryManager.pool.getProcessUsage(largest.id);
          const currentMem = this.memoryManager.pool.getProcessUsage(p.id);
          return currentMem > largestMem ? p : largest;
        });
        break;

      case OOMKillStrategy.LEAST_RECENTLY_USED:
        // Kill process with oldest last access time
        victim = processes.reduce((lru, p) => {
          return p.lastActivity < lru.lastActivity ? p : lru;
        });
        break;

      case OOMKillStrategy.YOUNGEST:
        // Kill newest process
        victim = processes.reduce((youngest, p) => {
          return p.createdAt > youngest.createdAt ? p : youngest;
        });
        break;
    }

    return victim;
  }

  /**
   * Kill a process to free memory
   */
  async kill(processId, reason = 'Out of memory') {
    if (this.protectedProcesses.has(processId)) {
      logger.warn('OOM Killer: Cannot kill protected process', { processId });
      return false;
    }

    logger.warn('OOM Killer: Killing process', { processId, reason });

    try {
      // Free memory first
      const freedBytes = this.memoryManager.pool.freeAll(processId);

      // Kill the process
      if (this.processManager) {
        await this.processManager.terminate(processId, { signal: 'SIGKILL', reason });
      }

      // Record in history
      this.killHistory.push({
        processId,
        timestamp: Date.now(),
        reason,
        freedBytes,
        strategy: this.killStrategy
      });

      // Trim history
      if (this.killHistory.length > 100) {
        this.killHistory.shift();
      }

      logger.info('OOM Killer: Process killed successfully', {
        processId,
        freedBytes
      });

      return true;
    } catch (error) {
      logger.error('OOM Killer: Failed to kill process', { processId, error });
      return false;
    }
  }

  /**
   * Attempt to free memory by killing processes
   */
  async freeMemory(bytesNeeded, maxKills = 5) {
    let freedBytes = 0;
    let killCount = 0;
    const killed = [];

    while (freedBytes < bytesNeeded && killCount < maxKills) {
      const victim = this.selectVictim(killed);

      if (!victim) {
        logger.warn('OOM Killer: No suitable victim found');
        break;
      }

      const processMemory = this.memoryManager.pool.getProcessUsage(victim.id);
      const success = await this.kill(victim.id, `Freeing ${bytesNeeded} bytes`);

      if (success) {
        freedBytes += processMemory;
        killCount++;
        killed.push(victim.id);
      } else {
        break;
      }
    }

    logger.info('OOM Killer: Memory freed', {
      bytesNeeded,
      freedBytes,
      killCount
    });

    return freedBytes >= bytesNeeded;
  }

  /**
   * Protect a process from being killed
   */
  protect(processId) {
    this.protectedProcesses.add(processId);
  }

  /**
   * Unprotect a process
   */
  unprotect(processId) {
    this.protectedProcesses.delete(processId);
  }

  /**
   * Set kill strategy
   */
  setStrategy(strategy) {
    this.killStrategy = strategy;
    logger.info('OOM Killer strategy changed', { strategy });
  }

  /**
   * Get kill history
   */
  getHistory() {
    return [...this.killHistory];
  }
}

/**
 * Next-Generation Memory Manager
 */
export class MemoryManager {
  constructor(options = {}) {
    this.totalMemory = options.totalMemory || 512 * 1024 * 1024; // 512MB default
    this.pageSize = options.pageSize || 4096; // 4KB pages
    this.enablePressureAPI = options.enablePressureAPI !== false;
    this.enableOOMKiller = options.enableOOMKiller !== false;
    this.enableAutoGC = options.enableAutoGC !== false;

    // Memory pool
    this.pool = new MemoryPool(this.totalMemory, this.pageSize);

    // OOM killer (will be initialized with process manager later)
    this.oomKiller = null;

    // Memory pressure state
    this.pressureLevel = MemoryPressure.NOMINAL;
    this.pressureThresholds = {
      moderate: 0.7,  // 70% usage
      critical: 0.9   // 90% usage
    };

    // Browser memory API
    this.hasMemoryAPI = 'memory' in performance;
    this.hasMemoryPressureAPI = 'PressureObserver' in window;

    // Pressure observer
    this.pressureObserver = null;

    // GC coordination
    this.lastGC = Date.now();
    this.gcInterval = options.gcInterval || 30000; // 30s
    this.gcTimer = null;

    // Statistics
    this.stats = {
      allocations: 0,
      deallocations: 0,
      oomEvents: 0,
      gcEvents: 0,
      pressureEvents: 0
    };

    logger.info('Memory Manager initialized', {
      totalMemory: this.totalMemory,
      pageSize: this.pageSize,
      hasMemoryAPI: this.hasMemoryAPI,
      hasMemoryPressureAPI: this.hasMemoryPressureAPI,
      enableOOMKiller: this.enableOOMKiller,
      enableAutoGC: this.enableAutoGC
    });

    this.init();
  }

  /**
   * Initialize memory manager
   */
  async init() {
    // Setup memory pressure observer
    if (this.hasMemoryPressureAPI && this.enablePressureAPI) {
      try {
        this.pressureObserver = new PressureObserver(
          this.handlePressureChange.bind(this),
          { sampleInterval: 1000 }
        );
        await this.pressureObserver.observe('memory');
        logger.info('Memory pressure observer initialized');
      } catch (error) {
        logger.warn('Failed to initialize pressure observer', { error });
      }
    }

    // Setup auto GC
    if (this.enableAutoGC) {
      this.startAutoGC();
    }

    // Monitor memory usage
    this.startMonitoring();
  }

  /**
   * Initialize OOM killer with process manager
   */
  initOOMKiller(processManager) {
    if (this.enableOOMKiller) {
      this.oomKiller = new OOMKiller(this, processManager);
      logger.info('OOM Killer initialized with process manager');
    }
  }

  /**
   * Handle memory pressure changes
   */
  handlePressureChange(records) {
    for (const record of records) {
      const newLevel = record.state;

      if (newLevel !== this.pressureLevel) {
        logger.info('Memory pressure changed', {
          from: this.pressureLevel,
          to: newLevel
        });

        this.pressureLevel = newLevel;
        this.stats.pressureEvents++;

        // Take action based on pressure level
        this.handlePressure(newLevel);
      }
    }
  }

  /**
   * Handle memory pressure
   */
  async handlePressure(level) {
    switch (level) {
      case MemoryPressure.MODERATE:
        logger.warn('Moderate memory pressure detected');
        // Request GC
        if (this.enableAutoGC) {
          this.requestGC();
        }
        break;

      case MemoryPressure.CRITICAL:
        logger.error('Critical memory pressure detected');
        // Force GC
        if (this.enableAutoGC) {
          this.requestGC();
        }
        // Activate OOM killer if needed
        if (this.oomKiller && this.getFreeMemoryPercent() < 5) {
          const freeTarget = this.totalMemory * 0.2; // Free 20%
          await this.oomKiller.freeMemory(freeTarget);
        }
        break;

      case MemoryPressure.NOMINAL:
        logger.info('Memory pressure normalized');
        break;
    }
  }

  /**
   * Allocate memory for a process
   */
  allocate(processId, bytes, strategy = AllocationStrategy.FIRST_FIT) {
    try {
      // Check if we have enough memory
      if (bytes > this.pool.getFreeMemory()) {
        logger.error('Insufficient memory for allocation', {
          processId,
          requested: bytes,
          available: this.pool.getFreeMemory()
        });

        this.stats.oomEvents++;

        // Try to free memory via OOM killer
        if (this.oomKiller) {
          const freed = this.oomKiller.freeMemory(bytes);
          if (!freed) {
            throw new OutOfMemoryError(bytes, this.pool.getFreeMemory(), {
              processId
            });
          }
        } else {
          throw new OutOfMemoryError(bytes, this.pool.getFreeMemory(), {
            processId
          });
        }
      }

      const pageIds = this.pool.allocate(processId, bytes, strategy);
      this.stats.allocations++;

      // Update resource monitor
      const resourceMonitor = getResourceMonitor();
      const tracker = resourceMonitor.getTracker(processId);
      if (tracker) {
        tracker.updateMemory(this.pool.getProcessUsage(processId));
      }

      // Check pressure thresholds
      this.checkPressureThresholds();

      return pageIds;
    } catch (error) {
      logger.error('Memory allocation failed', { processId, bytes, error });
      throw error;
    }
  }

  /**
   * Free memory for a process
   */
  free(processId, pageIds = null) {
    const freedPages = this.pool.free(processId, pageIds);
    this.stats.deallocations++;

    // Update resource monitor
    const resourceMonitor = getResourceMonitor();
    const tracker = resourceMonitor.getTracker(processId);
    if (tracker) {
      tracker.updateMemory(this.pool.getProcessUsage(processId));
    }

    // Check if pressure reduced
    this.checkPressureThresholds();

    return freedPages;
  }

  /**
   * Free all memory for a process
   */
  freeAll(processId) {
    return this.free(processId);
  }

  /**
   * Check memory pressure thresholds
   */
  checkPressureThresholds() {
    const usagePercent = this.getUsagePercent();

    let newLevel = MemoryPressure.NOMINAL;
    if (usagePercent >= this.pressureThresholds.critical * 100) {
      newLevel = MemoryPressure.CRITICAL;
    } else if (usagePercent >= this.pressureThresholds.moderate * 100) {
      newLevel = MemoryPressure.MODERATE;
    }

    if (newLevel !== this.pressureLevel) {
      this.pressureLevel = newLevel;
      this.handlePressure(newLevel);
    }
  }

  /**
   * Request garbage collection
   */
  requestGC() {
    if (typeof gc === 'function') {
      logger.debug('Requesting garbage collection');
      gc();
      this.lastGC = Date.now();
      this.stats.gcEvents++;
    } else {
      logger.debug('GC not available');
    }
  }

  /**
   * Start automatic GC
   */
  startAutoGC() {
    if (this.gcTimer) return;

    this.gcTimer = setInterval(() => {
      const timeSinceGC = Date.now() - this.lastGC;
      const usagePercent = this.getUsagePercent();

      // GC if interval passed and memory usage > 50%
      if (timeSinceGC >= this.gcInterval && usagePercent > 50) {
        this.requestGC();
      }
    }, 10000); // Check every 10s

    logger.info('Auto GC started', { interval: this.gcInterval });
  }

  /**
   * Stop automatic GC
   */
  stopAutoGC() {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
      this.gcTimer = null;
      logger.info('Auto GC stopped');
    }
  }

  /**
   * Start memory monitoring
   */
  startMonitoring() {
    // Monitoring handled by checkPressureThresholds
    logger.info('Memory monitoring started');
  }

  /**
   * Get memory usage percentage
   */
  getUsagePercent() {
    const stats = this.pool.getStatistics();
    return stats.utilizationPercent;
  }

  /**
   * Get free memory percentage
   */
  getFreeMemoryPercent() {
    return 100 - this.getUsagePercent();
  }

  /**
   * Get memory statistics
   */
  getStatistics() {
    const poolStats = this.pool.getStatistics();

    return {
      ...poolStats,
      pressureLevel: this.pressureLevel,
      oomKillerEnabled: this.oomKiller !== null,
      autoGCEnabled: this.gcTimer !== null,
      stats: { ...this.stats },
      browserMemory: this.hasMemoryAPI ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null
    };
  }

  /**
   * Dispose memory manager
   */
  dispose() {
    this.stopAutoGC();

    if (this.pressureObserver) {
      this.pressureObserver.disconnect();
      this.pressureObserver = null;
    }

    logger.info('Memory Manager disposed');
  }
}

/**
 * Create singleton instance
 */
let memoryManagerInstance = null;

/**
 * Get the global memory manager
 */
export function getMemoryManager() {
  if (!memoryManagerInstance) {
    memoryManagerInstance = new MemoryManager();
  }
  return memoryManagerInstance;
}

/**
 * Initialize memory manager with custom options
 */
export function initMemoryManager(options = {}) {
  if (memoryManagerInstance) {
    logger.warn('Memory Manager already initialized');
    return memoryManagerInstance;
  }
  memoryManagerInstance = new MemoryManager(options);
  return memoryManagerInstance;
}

export default {
  MemoryManager,
  MemoryPool,
  MemoryPage,
  OOMKiller,
  MemoryPressure,
  OOMKillStrategy,
  AllocationStrategy,
  getMemoryManager,
  initMemoryManager
};
