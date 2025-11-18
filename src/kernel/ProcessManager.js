import { EventBus } from '../utils/EventBus.js';

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
    this.window = null;
    this.permissions = new Set(config.permissions || []);
    this.resources = {
      memory: 0,
      cpu: 0,
      storage: 0
    };
    this.config = config;
  }

  async start() {
    this.state = 'running';
    this.startedAt = Date.now();

    if (this.config.worker) {
      this.worker = new Worker(this.config.workerScript);
      this.worker.postMessage({ type: 'init', pid: this.pid });
    }

    this.dispatchEvent(new CustomEvent('started'));
  }

  suspend() {
    if (this.state === 'running') {
      this.state = 'suspended';
      this.worker?.postMessage({ type: 'suspend' });
      this.dispatchEvent(new CustomEvent('suspended'));
    }
  }

  resume() {
    if (this.state === 'suspended') {
      this.state = 'running';
      this.worker?.postMessage({ type: 'resume' });
      this.dispatchEvent(new CustomEvent('resumed'));
    }
  }

  async terminate() {
    this.state = 'terminated';
    this.worker?.terminate();
    this.dispatchEvent(new CustomEvent('terminated'));
  }
}

class ProcessManager extends EventTarget {
  constructor() {
    super();
    this.processes = new Map();
    this.nextPid = 1;
  }

  async spawn(config) {
    const process = new Process({
      ...config,
      pid: this.nextPid++
    });

    this.processes.set(process.pid, process);
    await process.start();

    this.dispatchEvent(new CustomEvent('process-spawned', {
      detail: { process }
    }));

    return process;
  }

  getProcess(pid) {
    return this.processes.get(pid);
  }

  listProcesses() {
    return Array.from(this.processes.values());
  }

  async killProcess(pid) {
    const process = this.processes.get(pid);
    if (process) {
      await process.terminate();
      this.processes.delete(pid);

      this.dispatchEvent(new CustomEvent('process-terminated', {
        detail: { pid }
      }));
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
