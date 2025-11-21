import { eventBus } from '../utils/EventBus.js';
import { ProcessError, ProcessNotFoundError, ProcessSpawnError, ProcessTerminatedError } from './Errors.js';
import { createLogger } from './Logger.js';

const logger = createLogger('ProcessManager');

class Process extends EventTarget {
  constructor(config) {
    super();
    this.pid = crypto.randomUUID();
    this.name = config.name;
    this.state = 'created'; // created, running, suspended, terminated
    this.priority = config.priority || 'user-visible';
    this.parentPid = config.parentPid || null;
    this.createdAt = Date.now();
    this.startedAt = null;
    this.worker = null;
    this.windowId = null; // Reference to window ID instead of window object
    this.permissions = new Set(config.permissions || []);
    this.resources = {
      memory: 0,
      cpu: 0,
      storage: 0
    };
    this.config = config;
    this.headless = config.headless || false; // Support headless processes
    this.metadata = config.metadata || {};
    this.exitCode = null;

    logger.debug('Process created', {
      pid: this.pid,
      name: this.name,
      headless: this.headless
    });
  }

  async start() {
    logger.info('Starting process', { pid: this.pid, name: this.name });

    this.state = 'running';
    this.startedAt = Date.now();

    if (this.config.worker || this.config.isolate) {
      try {
        const workerScript = this.config.workerScript || '/process-worker.js';
        this.worker = new Worker(workerScript, { type: 'module' });
        this.worker.postMessage({
          type: 'init',
          pid: this.pid,
          permissions: Array.from(this.permissions),
          config: this.config
        });

        logger.debug('Worker initialized', { pid: this.pid });
      } catch (err) {
        logger.error('Failed to create worker', err);
        throw new ProcessSpawnError('Worker initialization failed', {
          pid: this.pid,
          error: err
        });
      }
    }

    this.dispatchEvent(new CustomEvent('started'));
    logger.info('Process started', { pid: this.pid });
  }

  suspend() {
    if (this.state === 'running') {
      logger.info('Suspending process', { pid: this.pid });

      this.state = 'suspended';
      this.worker?.postMessage({ type: 'suspend' });
      this.dispatchEvent(new CustomEvent('suspended'));

      logger.info('Process suspended', { pid: this.pid });
    }
  }

  resume() {
    if (this.state === 'suspended') {
      logger.info('Resuming process', { pid: this.pid });

      this.state = 'running';
      this.worker?.postMessage({ type: 'resume' });
      this.dispatchEvent(new CustomEvent('resumed'));

      logger.info('Process resumed', { pid: this.pid });
    }
  }

  async terminate(exitCode = 0) {
    logger.info('Terminating process', { pid: this.pid, exitCode });

    this.state = 'terminated';
    this.exitCode = exitCode;

    if (this.worker) {
      try {
        this.worker.terminate();
        logger.debug('Worker terminated', { pid: this.pid });
      } catch (err) {
        logger.warn('Error terminating worker', err);
      }
    }

    this.dispatchEvent(new CustomEvent('terminated', {
      detail: { exitCode }
    }));

    logger.info('Process terminated', { pid: this.pid, exitCode });
  }

  /**
   * Check if process is headless (no window)
   */
  isHeadless() {
    return this.headless;
  }

  /**
   * Check if process has a window
   */
  hasWindow() {
    return this.windowId !== null;
  }

  /**
   * Get process uptime in milliseconds
   */
  getUptime() {
    if (!this.startedAt) return 0;
    if (this.state === 'terminated') {
      // Use last known time before termination
      return this.createdAt - this.startedAt;
    }
    return Date.now() - this.startedAt;
  }

  /**
   * Get process info
   */
  getInfo() {
    return {
      pid: this.pid,
      name: this.name,
      state: this.state,
      priority: this.priority,
      parentPid: this.parentPid,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      uptime: this.getUptime(),
      headless: this.headless,
      hasWindow: this.hasWindow(),
      windowId: this.windowId,
      permissions: Array.from(this.permissions),
      resources: { ...this.resources },
      exitCode: this.exitCode,
      metadata: { ...this.metadata }
    };
  }
}

class ProcessManager extends EventTarget {
  constructor() {
    super();
    this.processes = new Map();
    this.nextPid = 1;
    this.resourceMonitor = null;

    logger.info('ProcessManager initialized');
  }

  /**
   * Set resource monitor
   */
  setResourceMonitor(resourceMonitor) {
    this.resourceMonitor = resourceMonitor;
    logger.info('Resource monitor configured');
  }

  /**
   * Spawn a new process
   */
  async spawn(config) {
    logger.info('Spawning process', { name: config.name, headless: config.headless });

    try {
      const process = new Process({
        ...config,
        pid: this.nextPid++
      });

      this.processes.set(process.pid, process);

      // Register with resource monitor if available
      if (this.resourceMonitor && !config.skipResourceMonitoring) {
        this.resourceMonitor.registerProcess(process.pid, config.resourceLimits);
        logger.debug('Process registered with resource monitor', { pid: process.pid });
      }

      await process.start();

      this.dispatchEvent(new CustomEvent('process-spawned', {
        detail: { process }
      }));

      eventBus.emit('process-created', { process });

      logger.info('Process spawned successfully', {
        pid: process.pid,
        name: process.name
      });

      return process;
    } catch (err) {
      logger.error('Failed to spawn process', err);
      throw new ProcessSpawnError(err.message, { config });
    }
  }

  /**
   * Get a process by PID
   */
  getProcess(pid) {
    const process = this.processes.get(pid);
    if (!process) {
      logger.debug('Process not found', { pid });
    }
    return process;
  }

  /**
   * Get a process or throw error
   */
  getProcessOrThrow(pid) {
    const process = this.getProcess(pid);
    if (!process) {
      throw new ProcessNotFoundError(pid);
    }
    return process;
  }

  /**
   * List all processes
   */
  listProcesses(filter = {}) {
    let processes = Array.from(this.processes.values());

    // Apply filters
    if (filter.state) {
      processes = processes.filter(p => p.state === filter.state);
    }

    if (filter.headless !== undefined) {
      processes = processes.filter(p => p.headless === filter.headless);
    }

    if (filter.parentPid !== undefined) {
      processes = processes.filter(p => p.parentPid === filter.parentPid);
    }

    return processes;
  }

  /**
   * Get running processes
   */
  getRunningProcesses() {
    return this.listProcesses({ state: 'running' });
  }

  /**
   * Get headless processes
   */
  getHeadlessProcesses() {
    return this.listProcesses({ headless: true });
  }

  /**
   * Kill a process
   */
  async killProcess(pid, exitCode = 0) {
    logger.info('Killing process', { pid, exitCode });

    const process = this.processes.get(pid);
    if (!process) {
      throw new ProcessNotFoundError(pid);
    }

    try {
      await process.terminate(exitCode);

      // Unregister from resource monitor
      if (this.resourceMonitor) {
        this.resourceMonitor.unregisterProcess(pid);
        logger.debug('Process unregistered from resource monitor', { pid });
      }

      this.processes.delete(pid);

      this.dispatchEvent(new CustomEvent('process-terminated', {
        detail: { pid, exitCode }
      }));

      eventBus.emit('process-terminated', { pid, exitCode });

      logger.info('Process killed successfully', { pid });
    } catch (err) {
      logger.error('Error killing process', err);
      throw new ProcessError('EKILL', `Failed to kill process ${pid}`, {
        pid,
        error: err
      });
    }
  }

  /**
   * Kill all child processes of a parent
   */
  async killChildProcesses(parentPid) {
    logger.info('Killing child processes', { parentPid });

    const children = this.listProcesses({ parentPid });
    for (const child of children) {
      await this.killProcess(child.pid);
    }
  }

  /**
   * Kill all processes
   */
  async killAllProcesses() {
    logger.warn('Killing all processes');

    const pids = Array.from(this.processes.keys());
    for (const pid of pids) {
      try {
        await this.killProcess(pid);
      } catch (err) {
        logger.error('Error killing process during cleanup', err);
      }
    }
  }

  getProcessTree() {
    const tree = [];
    const roots = Array.from(this.processes.values())
      .filter(p => !p.parentPid);

    roots.forEach(root => {
      tree.push(this._buildProcessTree(root));
    });

    return tree;
  }

  _buildProcessTree(process) {
    const children = Array.from(this.processes.values())
      .filter(p => p.parentPid === process.pid)
      .map(child => this._buildProcessTree(child));

    return {
      ...process,
      children
    };
  }
}

export default new ProcessManager();
