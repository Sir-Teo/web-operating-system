/**
 * Next-Gen Advanced Scheduler
 * Implements fair scheduling (CFS-like), time slicing, CPU quotas, and preemption
 */

import { createLogger } from './Logger.js';
import { ResourceType } from './ResourceMonitor.js';

const logger = createLogger('AdvancedScheduler');

/**
 * Scheduling policies
 */
export const SchedulingPolicy = {
  CFS: 'cfs',                    // Completely Fair Scheduler
  ROUND_ROBIN: 'round_robin',    // Classic round-robin
  PRIORITY: 'priority',          // Priority-based
  DEADLINE: 'deadline',          // Deadline scheduling (real-time)
  FIFO: 'fifo'                   // First-in-first-out
};

/**
 * Priority classes (Linux-like)
 */
export const PriorityClass = {
  REALTIME: 0,        // Real-time priority (-20 to -1)
  HIGH: 1,            // High priority (0-19)
  NORMAL: 2,          // Normal priority (20-39)
  LOW: 3,             // Low priority (40-59)
  IDLE: 4             // Idle priority (60+)
};

/**
 * CPU affinity mask
 */
export class CPUAffinity {
  constructor(cpuMask = 0xFFFFFFFF) {
    this.mask = cpuMask;
  }

  canRunOn(cpuId) {
    return (this.mask & (1 << cpuId)) !== 0;
  }

  setCPU(cpuId, enabled = true) {
    if (enabled) {
      this.mask |= (1 << cpuId);
    } else {
      this.mask &= ~(1 << cpuId);
    }
  }

  getCPUs() {
    const cpus = [];
    for (let i = 0; i < 32; i++) {
      if (this.canRunOn(i)) {
        cpus.push(i);
      }
    }
    return cpus;
  }
}

/**
 * Schedulable entity (task)
 */
export class SchedEntity {
  constructor(processId, callback, options = {}) {
    this.processId = processId;
    this.callback = callback;
    this.priority = options.priority || 20; // Nice value (-20 to 19)
    this.policy = options.policy || SchedulingPolicy.CFS;
    this.cpuAffinity = options.cpuAffinity || new CPUAffinity();

    // CFS virtual runtime
    this.vruntime = 0;
    this.weight = this.calculateWeight();

    // CPU time tracking
    this.cpuTime = 0;
    this.lastScheduled = 0;
    this.scheduleCount = 0;

    // Time slice (quantum)
    this.timeSlice = options.timeSlice || 10; // milliseconds
    this.remainingSlice = this.timeSlice;

    // CPU quota (for throttling)
    this.cpuQuota = options.cpuQuota || null; // null = unlimited
    this.cpuPeriod = options.cpuPeriod || 100; // milliseconds
    this.usedQuota = 0;
    this.quotaPeriodStart = Date.now();

    // Deadline scheduling
    this.deadline = options.deadline || null;
    this.runtime = options.runtime || null;
    this.period = options.period || null;

    // State
    this.state = 'ready'; // ready, running, waiting, sleeping
    this.lastWakeup = Date.now();

    // Statistics
    this.stats = {
      totalRuntime: 0,
      contextSwitches: 0,
      voluntarySwitches: 0,
      involuntarySwitches: 0,
      avgLatency: 0,
      maxLatency: 0
    };
  }

  /**
   * Calculate weight based on nice value
   * Uses similar formula as Linux CFS: weight = 1024 / (1.25 ^ nice)
   */
  calculateWeight() {
    const nice = Math.max(-20, Math.min(19, this.priority));
    return Math.floor(1024 / Math.pow(1.25, nice));
  }

  /**
   * Update virtual runtime (CFS)
   */
  updateVruntime(actualTime) {
    // vruntime increases inversely proportional to weight
    // Higher weight (lower nice) = slower vruntime growth
    const delta = actualTime * (1024 / this.weight);
    this.vruntime += delta;
  }

  /**
   * Check if CPU quota exceeded
   */
  isQuotaExceeded() {
    if (!this.cpuQuota) return false;

    const now = Date.now();
    const periodElapsed = now - this.quotaPeriodStart;

    // Reset quota if period expired
    if (periodElapsed >= this.cpuPeriod) {
      this.usedQuota = 0;
      this.quotaPeriodStart = now;
      return false;
    }

    return this.usedQuota >= this.cpuQuota;
  }

  /**
   * Check if deadline missed
   */
  isDeadlineMissed() {
    if (!this.deadline) return false;
    return Date.now() > this.deadline;
  }

  /**
   * Reset time slice
   */
  resetTimeSlice() {
    this.remainingSlice = this.timeSlice;
  }

  /**
   * Update statistics
   */
  updateStats(latency) {
    this.stats.totalRuntime = this.cpuTime;
    this.stats.contextSwitches++;

    if (latency !== null) {
      const count = this.stats.contextSwitches;
      this.stats.avgLatency = (this.stats.avgLatency * (count - 1) + latency) / count;
      this.stats.maxLatency = Math.max(this.stats.maxLatency, latency);
    }
  }
}

/**
 * Run queue for a CPU
 */
export class RunQueue {
  constructor(cpuId) {
    this.cpuId = cpuId;
    this.entities = new Map(); // processId -> SchedEntity
    this.readyQueue = []; // Sorted by vruntime (CFS) or priority
    this.currentEntity = null;
    this.minVruntime = 0; // Minimum vruntime in the queue

    this.stats = {
      totalSwitches: 0,
      loadAvg: 0,
      utilizationPercent: 0
    };
  }

  /**
   * Add entity to run queue
   */
  enqueue(entity) {
    this.entities.set(entity.processId, entity);

    // Set vruntime to at least minVruntime for fairness
    if (entity.vruntime < this.minVruntime) {
      entity.vruntime = this.minVruntime;
    }

    this.insertSorted(entity);
  }

  /**
   * Remove entity from run queue
   */
  dequeue(processId) {
    const entity = this.entities.get(processId);
    if (!entity) return null;

    this.entities.delete(processId);
    const index = this.readyQueue.findIndex(e => e.processId === processId);
    if (index !== -1) {
      this.readyQueue.splice(index, 1);
    }

    return entity;
  }

  /**
   * Insert entity in sorted order (by vruntime for CFS)
   */
  insertSorted(entity) {
    // Binary search insertion
    let left = 0;
    let right = this.readyQueue.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.readyQueue[mid].vruntime < entity.vruntime) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    this.readyQueue.splice(left, 0, entity);
  }

  /**
   * Pick next entity to run (leftmost in RB-tree for CFS)
   */
  pickNext() {
    // For CFS, pick entity with minimum vruntime
    if (this.readyQueue.length === 0) return null;
    return this.readyQueue[0];
  }

  /**
   * Update minimum vruntime
   */
  updateMinVruntime() {
    if (this.readyQueue.length > 0) {
      this.minVruntime = Math.max(
        this.minVruntime,
        this.readyQueue[0].vruntime
      );
    }
  }

  /**
   * Get load (number of runnable entities)
   */
  getLoad() {
    return this.entities.size;
  }

  /**
   * Calculate load average
   */
  calculateLoadAvg(alpha = 0.5) {
    const currentLoad = this.getLoad();
    this.stats.loadAvg = alpha * this.stats.loadAvg + (1 - alpha) * currentLoad;
    return this.stats.loadAvg;
  }
}

/**
 * Advanced Process Scheduler
 */
export class AdvancedScheduler {
  constructor(options = {}) {
    this.policy = options.policy || SchedulingPolicy.CFS;
    this.numCPUs = navigator.hardwareConcurrency || 4;
    this.enableLoadBalancing = options.enableLoadBalancing !== false;
    this.enableQuotaEnforcement = options.enableQuotaEnforcement !== false;

    // Run queues (one per CPU)
    this.runQueues = [];
    for (let i = 0; i < this.numCPUs; i++) {
      this.runQueues.push(new RunQueue(i));
    }

    // Global entities map
    this.entities = new Map(); // processId -> SchedEntity
    this.processedToCPU = new Map(); // processId -> cpuId

    // Scheduler tick
    this.tickInterval = options.tickInterval || 10; // milliseconds
    this.tickTimer = null;
    this.running = false;

    // Load balancing
    this.balanceInterval = options.balanceInterval || 100; // milliseconds
    this.balanceTimer = null;

    // Statistics
    this.stats = {
      totalTicks: 0,
      totalSwitches: 0,
      totalPreemptions: 0,
      totalQuotaThrottles: 0
    };

    // Browser Scheduler API fallback
    this.browserScheduler = window.scheduler || this._polyfill();

    logger.info('Advanced Scheduler initialized', {
      policy: this.policy,
      numCPUs: this.numCPUs,
      tickInterval: this.tickInterval,
      loadBalancing: this.enableLoadBalancing
    });
  }

  /**
   * Register a task for scheduling
   */
  register(processId, callback, options = {}) {
    if (this.entities.has(processId)) {
      logger.warn('Process already registered', { processId });
      return this.entities.get(processId);
    }

    const entity = new SchedEntity(processId, callback, {
      ...options,
      policy: this.policy
    });

    this.entities.set(processId, entity);

    // Select CPU based on affinity and load
    const cpuId = this.selectCPU(entity);
    this.processedToCPU.set(processId, cpuId);

    // Add to run queue
    this.runQueues[cpuId].enqueue(entity);

    logger.debug('Process registered for scheduling', {
      processId,
      cpuId,
      priority: entity.priority,
      policy: entity.policy
    });

    return entity;
  }

  /**
   * Unregister a task
   */
  unregister(processId) {
    const entity = this.entities.get(processId);
    if (!entity) return;

    const cpuId = this.processedToCPU.get(processId);
    if (cpuId !== undefined) {
      this.runQueues[cpuId].dequeue(processId);
      this.processedToCPU.delete(processId);
    }

    this.entities.delete(processId);

    logger.debug('Process unregistered from scheduler', { processId });
  }

  /**
   * Select CPU for a process based on affinity and load
   */
  selectCPU(entity) {
    const eligibleCPUs = entity.cpuAffinity.getCPUs().filter(id => id < this.numCPUs);

    if (eligibleCPUs.length === 0) {
      // No affinity, use first CPU
      return 0;
    }

    if (!this.enableLoadBalancing) {
      return eligibleCPUs[0];
    }

    // Select least loaded CPU
    let minLoad = Infinity;
    let selectedCPU = eligibleCPUs[0];

    for (const cpuId of eligibleCPUs) {
      const load = this.runQueues[cpuId].getLoad();
      if (load < minLoad) {
        minLoad = load;
        selectedCPU = cpuId;
      }
    }

    return selectedCPU;
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.running) return;

    this.running = true;

    // Start scheduler tick
    this.tickTimer = setInterval(() => {
      this.tick();
    }, this.tickInterval);

    // Start load balancing
    if (this.enableLoadBalancing) {
      this.balanceTimer = setInterval(() => {
        this.balanceLoad();
      }, this.balanceInterval);
    }

    logger.info('Scheduler started');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.running) return;

    this.running = false;

    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }

    if (this.balanceTimer) {
      clearInterval(this.balanceTimer);
      this.balanceTimer = null;
    }

    logger.info('Scheduler stopped');
  }

  /**
   * Scheduler tick - run on each CPU
   */
  async tick() {
    this.stats.totalTicks++;

    // Schedule on each CPU
    for (const runQueue of this.runQueues) {
      await this.schedule(runQueue);
    }

    // Update load averages
    for (const runQueue of this.runQueues) {
      runQueue.calculateLoadAvg();
    }
  }

  /**
   * Schedule next task on a CPU
   */
  async schedule(runQueue) {
    const current = runQueue.currentEntity;
    const next = runQueue.pickNext();

    // No task to run
    if (!next) {
      runQueue.currentEntity = null;
      return;
    }

    // Check quota enforcement
    if (this.enableQuotaEnforcement && next.isQuotaExceeded()) {
      // Throttled, move to back of queue
      runQueue.dequeue(next.processId);
      this.stats.totalQuotaThrottles++;
      logger.debug('Process throttled due to quota', { processId: next.processId });
      return;
    }

    // Context switch needed?
    const needSwitch = !current || current.processId !== next.processId;

    if (needSwitch) {
      // Save current context
      if (current) {
        current.state = 'ready';
        current.stats.involuntarySwitches++;
      }

      // Load next context
      next.state = 'running';
      runQueue.currentEntity = next;
      this.stats.totalSwitches++;
      runQueue.stats.totalSwitches++;

      // Calculate scheduling latency
      const latency = Date.now() - next.lastWakeup;
      next.updateStats(latency);

      logger.debug('Context switch', {
        from: current?.processId,
        to: next.processId,
        latency
      });
    }

    // Execute task
    await this.executeTask(next, runQueue);
  }

  /**
   * Execute a task for its time slice
   */
  async executeTask(entity, runQueue) {
    const startTime = Date.now();

    try {
      // Create abort controller for time slice
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, entity.remainingSlice);

      // Execute with browser scheduler
      await this.browserScheduler.postTask(
        async () => {
          return await entity.callback();
        },
        {
          priority: this.mapPriorityToBrowserScheduler(entity.priority),
          signal: abortController.signal
        }
      );

      clearTimeout(timeoutId);
    } catch (error) {
      if (error.name === 'AbortError') {
        // Time slice expired (preemption)
        logger.debug('Task preempted', { processId: entity.processId });
        this.stats.totalPreemptions++;
      } else {
        logger.error('Task execution error', { processId: entity.processId, error });
      }
    }

    const execTime = Date.now() - startTime;

    // Update entity runtime
    entity.cpuTime += execTime;
    entity.usedQuota += execTime;
    entity.remainingSlice -= execTime;
    entity.scheduleCount++;
    entity.lastScheduled = Date.now();

    // Update vruntime (CFS)
    entity.updateVruntime(execTime);

    // Reset time slice if depleted
    if (entity.remainingSlice <= 0) {
      entity.resetTimeSlice();
    }

    // Re-insert into queue (might have different vruntime now)
    runQueue.dequeue(entity.processId);
    runQueue.enqueue(entity);

    // Update min vruntime
    runQueue.updateMinVruntime();
  }

  /**
   * Balance load across CPUs
   */
  balanceLoad() {
    if (!this.enableLoadBalancing) return;

    // Find most and least loaded CPUs
    let maxLoad = -1;
    let minLoad = Infinity;
    let maxCPU = -1;
    let minCPU = -1;

    for (let i = 0; i < this.numCPUs; i++) {
      const load = this.runQueues[i].getLoad();
      if (load > maxLoad) {
        maxLoad = load;
        maxCPU = i;
      }
      if (load < minLoad) {
        minLoad = load;
        minCPU = i;
      }
    }

    // Balance if difference is significant
    const loadDiff = maxLoad - minLoad;
    if (loadDiff > 1) {
      // Move one entity from max to min
      const entity = this.runQueues[maxCPU].pickNext();
      if (entity && entity.cpuAffinity.canRunOn(minCPU)) {
        this.runQueues[maxCPU].dequeue(entity.processId);
        this.runQueues[minCPU].enqueue(entity);
        this.processedToCPU.set(entity.processId, minCPU);

        logger.debug('Load balanced', {
          from: maxCPU,
          to: minCPU,
          processId: entity.processId
        });
      }
    }
  }

  /**
   * Map priority to browser scheduler priority
   */
  mapPriorityToBrowserScheduler(nice) {
    if (nice < 0) return 'user-blocking';
    if (nice < 10) return 'user-visible';
    return 'background';
  }

  /**
   * Set process priority
   */
  setPriority(processId, priority) {
    const entity = this.entities.get(processId);
    if (!entity) return false;

    entity.priority = priority;
    entity.weight = entity.calculateWeight();

    logger.debug('Process priority changed', { processId, priority });
    return true;
  }

  /**
   * Set CPU quota for a process
   */
  setQuota(processId, quota, period = 100) {
    const entity = this.entities.get(processId);
    if (!entity) return false;

    entity.cpuQuota = quota;
    entity.cpuPeriod = period;

    logger.debug('Process quota set', { processId, quota, period });
    return true;
  }

  /**
   * Set CPU affinity for a process
   */
  setAffinity(processId, cpuMask) {
    const entity = this.entities.get(processId);
    if (!entity) return false;

    entity.cpuAffinity = new CPUAffinity(cpuMask);

    logger.debug('Process affinity set', {
      processId,
      cpus: entity.cpuAffinity.getCPUs()
    });
    return true;
  }

  /**
   * Yield current task
   */
  async yield() {
    if (this.browserScheduler.yield) {
      await this.browserScheduler.yield();
    } else {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  /**
   * Get scheduler statistics
   */
  getStatistics() {
    const cpuStats = this.runQueues.map((rq, i) => ({
      cpuId: i,
      load: rq.getLoad(),
      loadAvg: rq.stats.loadAvg,
      switches: rq.stats.totalSwitches
    }));

    return {
      policy: this.policy,
      numCPUs: this.numCPUs,
      totalProcesses: this.entities.size,
      totalTicks: this.stats.totalTicks,
      totalSwitches: this.stats.totalSwitches,
      totalPreemptions: this.stats.totalPreemptions,
      totalQuotaThrottles: this.stats.totalQuotaThrottles,
      cpus: cpuStats,
      running: this.running
    };
  }

  /**
   * Get process statistics
   */
  getProcessStats(processId) {
    const entity = this.entities.get(processId);
    if (!entity) return null;

    return {
      processId,
      priority: entity.priority,
      policy: entity.policy,
      vruntime: entity.vruntime,
      cpuTime: entity.cpuTime,
      scheduleCount: entity.scheduleCount,
      quota: entity.cpuQuota,
      quotaUsed: entity.usedQuota,
      affinity: entity.cpuAffinity.getCPUs(),
      state: entity.state,
      stats: entity.stats
    };
  }

  /**
   * Polyfill for browsers without Scheduler API
   */
  _polyfill() {
    return {
      postTask: async (callback, options) => {
        return new Promise((resolve, reject) => {
          const priority = options?.priority || 'user-visible';
          const delay = priority === 'background' ? 10 : 0;

          setTimeout(async () => {
            try {
              resolve(await callback());
            } catch (error) {
              reject(error);
            }
          }, delay);
        });
      }
    };
  }

  /**
   * Dispose scheduler
   */
  dispose() {
    this.stop();
    this.entities.clear();
    this.processedToCPU.clear();
    logger.info('Scheduler disposed');
  }
}

/**
 * Create singleton instance
 */
let schedulerInstance = null;

/**
 * Get the global scheduler
 */
export function getScheduler() {
  if (!schedulerInstance) {
    schedulerInstance = new AdvancedScheduler();
  }
  return schedulerInstance;
}

/**
 * Initialize scheduler with custom options
 */
export function initScheduler(options = {}) {
  if (schedulerInstance) {
    logger.warn('Scheduler already initialized');
    return schedulerInstance;
  }
  schedulerInstance = new AdvancedScheduler(options);
  return schedulerInstance;
}

export default {
  AdvancedScheduler,
  SchedEntity,
  RunQueue,
  CPUAffinity,
  SchedulingPolicy,
  PriorityClass,
  getScheduler,
  initScheduler
};
