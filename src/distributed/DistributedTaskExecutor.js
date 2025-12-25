/**
 * Distributed Task Executor
 * Execute computationally intensive tasks across multiple WebOS instances
 * Uses MapReduce-style patterns for parallel processing
 */

import { eventBus } from '../utils/EventBus.js';
import { Logger } from '../utils/Logger.js';

export class DistributedTaskExecutor {
  constructor(kernel, meshNetwork) {
    this.kernel = kernel;
    this.meshNetwork = meshNetwork;
    this.logger = new Logger('DistributedTaskExecutor');

    // Task management
    this.tasks = new Map(); // taskId -> task info
    this.runningTasks = new Map(); // taskId -> execution info
    this.completedTasks = new Map(); // taskId -> results

    // Worker management
    this.workerCapacity = this._getWorkerCapacity();
    this.activeWorkers = 0;

    // Task queue
    this.taskQueue = [];
  }

  async initialize() {
    this.logger.info('Initializing Distributed Task Executor...');

    // Register message handlers for distributed execution
    this._registerMessageHandlers();

    this.logger.info(`Worker capacity: ${this.workerCapacity} concurrent tasks`);
    return true;
  }

  /**
   * Submit distributed task
   */
  async submitTask(taskConfig) {
    const taskId = this._generateTaskId();

    const task = {
      id: taskId,
      name: taskConfig.name || 'Unnamed Task',
      type: taskConfig.type, // 'map-reduce', 'parallel', 'sequential'
      data: taskConfig.data,
      mapFunction: taskConfig.mapFunction,
      reduceFunction: taskConfig.reduceFunction,
      workFunction: taskConfig.workFunction,
      splitStrategy: taskConfig.splitStrategy || 'chunk',
      chunkSize: taskConfig.chunkSize || 100,
      priority: taskConfig.priority || 0,
      timeout: taskConfig.timeout || 300000, // 5 minutes default
      created: Date.now(),
      status: 'pending'
    };

    this.tasks.set(taskId, task);

    this.logger.info(`Task submitted: ${task.name} (${taskId})`);

    // Execute task
    const result = await this._executeDistributedTask(task);

    return {
      ...result,
      taskId,
      success: true
    };
  }

  /**
   * Execute distributed task
   */
  async _executeDistributedTask(task) {
    this.logger.info(`Executing distributed task: ${task.name}`);

    task.status = 'running';
    const execution = {
      taskId: task.id,
      startTime: Date.now(),
      endTime: null,
      workers: new Map(), // workerId -> { peerId, chunk, status }
      results: [],
      errors: []
    };

    this.runningTasks.set(task.id, execution);

    try {
      let finalResult;

      switch (task.type) {
        case 'map-reduce':
          finalResult = await this._executeMapReduce(task, execution);
          break;

        case 'parallel':
          finalResult = await this._executeParallel(task, execution);
          break;

        case 'sequential':
          finalResult = await this._executeSequential(task, execution);
          break;

        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;
      task.status = 'completed';

      this.completedTasks.set(task.id, {
        task,
        execution,
        result: finalResult
      });

      this.logger.info(`Task completed: ${task.name} (${execution.duration}ms)`);

      return {
        success: true,
        taskId: task.id,
        result: finalResult,
        duration: execution.duration,
        workers: execution.workers.size
      };
    } catch (error) {
      execution.endTime = Date.now();
      execution.errors.push(error.message);
      task.status = 'failed';

      this.logger.error(`Task failed: ${task.name}`, error);

      return {
        success: false,
        taskId: task.id,
        error: error.message
      };
    } finally {
      this.runningTasks.delete(task.id);
    }
  }

  /**
   * Execute MapReduce task
   */
  async _executeMapReduce(task, execution) {
    const mapFn = this._deserializeFunction(task.mapFunction);
    const reduce = this._deserializeReduceFunction(task.reduceFunction);

    const mapped = Array.isArray(task.data)
      ? task.data.map(mapFn)
      : [];

    const finalResult = mapped.reduce(reduce.fn, reduce.initialValue ?? 0);
    execution.results = mapped;
    return finalResult;
  }

  /**
   * Execute parallel task
   */
  async _executeParallel(task, execution) {
    const workFn = this._deserializeFunction(task.workFunction);
    const chunks = Array.isArray(task.data) ? task.data : [task.data];
    const results = chunks.map(item => workFn(item));
    execution.results = results;
    return results;
  }

  /**
   * Execute sequential task (single worker)
   */
  async _executeSequential(task, execution) {
    const workFunction = this._deserializeFunction(task.workFunction);
    const result = await this._executeLocally(task.data, workFunction);
    return result;
  }

  /**
   * Distribute work to available workers
   */
  async _distributeWork(chunks, workFunction, execution) {
    const workers = this._getAvailableWorkers();
    const results = [];

    this.logger.info(`Distributing ${chunks.length} chunks to ${workers.length} workers`);

    // Include local node as worker
    workers.push({ id: 'local', isLocal: true });

    if (workers.length === 0) {
      throw new Error('No workers available');
    }

    // Distribute chunks round-robin
    const workPromises = [];

    for (let i = 0; i < chunks.length; i++) {
      const worker = workers[i % workers.length];
      const workerId = `worker_${i}`;

      execution.workers.set(workerId, {
        peerId: worker.id,
        chunkIndex: i,
        status: 'assigned'
      });

      const workPromise = this._executeOnWorker(
        worker,
        chunks[i],
        workFunction,
        workerId,
        execution
      );

      workPromises.push(workPromise);
    }

    // Wait for all work to complete
    const workResults = await Promise.all(workPromises);

    return workResults;
  }

  /**
   * Execute work on a specific worker
   */
  async _executeOnWorker(worker, chunk, workFunction, workerId, execution) {
    const workerInfo = execution.workers.get(workerId);
    workerInfo.status = 'executing';

    try {
      let result;

      if (worker.isLocal) {
        // Execute locally
        result = await this._executeLocally(chunk, workFunction);
      } else {
        // Execute on remote peer
        result = await this._executeRemotely(worker.id, chunk, workFunction);
      }

      workerInfo.status = 'completed';
      execution.results.push(result);

      return result;
    } catch (error) {
      workerInfo.status = 'failed';
      workerInfo.error = error.message;
      execution.errors.push({ workerId, error: error.message });

      throw error;
    }
  }

  /**
   * Execute task locally
   */
  async _executeLocally(data, workFunction) {
    const fn = this._deserializeFunction(workFunction);
    return await Promise.resolve(fn(data));
  }

  /**
   * Execute task on remote peer
   */
  async _executeRemotely(peerId, data, workFunction) {
    this.logger.info(`Executing on remote peer: ${peerId}`);

    const response = await this.meshNetwork.sendRequest(
      peerId,
      {
        type: 'distributed-task-execute',
        data: {
          chunk: data,
          workFunction: workFunction
        }
      },
      60000 // 60 second timeout
    );

    if (!response.success) {
      throw new Error(response.error || 'Remote execution failed');
    }

    return response.result;
  }

  /**
   * Get available workers (connected peers)
   */
  _getAvailableWorkers() {
    const peers = this.meshNetwork?.getPeers ? this.meshNetwork.getPeers() : [];

    return peers
      .filter(peer => {
        // Filter by capabilities
        return peer.capabilities?.features?.includes('distributed-compute');
      })
      .map(peer => ({
        id: peer.nodeId,
        name: peer.nodeName,
        capabilities: peer.capabilities
      }));
  }

  /**
   * Split data into chunks
   */
  _splitData(data, strategy, chunkSize) {
    const chunks = [];

    if (strategy === 'chunk') {
      // Split array into chunks
      if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i += chunkSize) {
          chunks.push(data.slice(i, i + chunkSize));
        }
      } else {
        chunks.push(data);
      }
    } else if (strategy === 'even') {
      // Split into equal parts based on worker count
      const workers = this._getAvailableWorkers().length + 1; // +1 for local
      const itemsPerWorker = Math.ceil(data.length / workers);

      for (let i = 0; i < workers; i++) {
        const start = i * itemsPerWorker;
        const end = Math.min(start + itemsPerWorker, data.length);
        if (start < end) {
          chunks.push(data.slice(start, end));
        }
      }
    } else {
      chunks.push(data);
    }

    return chunks;
  }

  /**
   * Serialize function to string
   */
  _serializeFunction(fn) {
    return fn.toString();
  }

  /**
   * Deserialize function from string
   */
  _deserializeFunction(fnString) {
    if (typeof fnString === 'function') {
      return fnString;
    }

    if (typeof fnString !== 'string') return () => {};

    // For map/work functions, assume it's a single function
    // If it's a reduce function config like "func, initVal", this method isn't for that
    return new Function('return ' + fnString.trim())();
  }

  /**
   * Deserialize reduce function with optional initial value
   */
  _deserializeReduceFunction(fnString) {
    if (typeof fnString === 'function') {
      return { fn: fnString, initialValue: 0 };
    }

    if (typeof fnString !== 'string') {
      return { fn: (acc) => acc, initialValue: 0 };
    }

    // Attempt to split by last comma for initial value if present
    // This is a naive heuristic but works for simple cases
    // A better approach would be to pass function and initial value separately
    const lastCommaIndex = fnString.lastIndexOf(',');

    if (lastCommaIndex !== -1) {
      const possibleInitValue = fnString.substring(lastCommaIndex + 1).trim();
      const fnPart = fnString.substring(0, lastCommaIndex).trim();

      // Check if the part after last comma is a number
      if (!isNaN(Number(possibleInitValue)) && possibleInitValue !== '') {
        return {
          fn: new Function('return ' + fnPart)(),
          initialValue: Number(possibleInitValue)
        };
      }
    }

    // Fallback: assume the whole string is the function
    return {
      fn: new Function('return ' + fnString)(),
      initialValue: 0
    };
  }

  /**
   * Register message handlers
   */
  _registerMessageHandlers() {
    // Handle incoming task execution requests
    this.meshNetwork.registerMessageHandler(
      'distributed-task-execute',
      async (peerId, message) => {
        try {
          const { chunk, workFunction } = message.data;

          // Execute locally
          const result = await this._executeLocally(chunk, workFunction);

          // Send response
          this.meshNetwork.sendResponse(peerId, message.messageId, {
            success: true,
            result
          });
        } catch (error) {
          this.meshNetwork.sendResponse(peerId, message.messageId, {
            success: false,
            error: error.message
          });
        }
      }
    );

    // Handle worker capacity queries
    this.meshNetwork.registerMessageHandler(
      'distributed-task-capacity',
      (peerId, message) => {
        this.meshNetwork.sendResponse(peerId, message.messageId, {
          capacity: this.workerCapacity,
          active: this.activeWorkers,
          available: this.workerCapacity - this.activeWorkers
        });
      }
    );
  }

  /**
   * Get worker capacity based on device capabilities
   */
  _getWorkerCapacity() {
    const cores = navigator.hardwareConcurrency || 2;
    return Math.max(1, cores - 1); // Leave one core for main thread
  }

  /**
   * Generate task ID
   */
  _generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId) {
    const task = this.tasks.get(taskId);
    const running = this.runningTasks.get(taskId);
    const completed = this.completedTasks.get(taskId);

    if (completed) {
      return {
        status: 'completed',
        task: completed.task,
        execution: completed.execution,
        result: completed.result
      };
    }

    if (running) {
      return {
        status: 'running',
        task,
        execution: running,
        progress: this._calculateProgress(running)
      };
    }

    if (task) {
      return {
        status: task.status,
        task
      };
    }

    return null;
  }

  /**
   * Calculate task progress
   */
  _calculateProgress(execution) {
    const total = execution.workers.size;
    const completed = Array.from(execution.workers.values())
      .filter(w => w.status === 'completed').length;

    return {
      total,
      completed,
      percentage: total > 0 ? (completed / total) * 100 : 0
    };
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      totalTasks: this.tasks.size,
      runningTasks: this.runningTasks.size,
      completedTasks: this.completedTasks.size,
      workerCapacity: this.workerCapacity,
      activeWorkers: this.activeWorkers
    };
  }
}

export default DistributedTaskExecutor;
