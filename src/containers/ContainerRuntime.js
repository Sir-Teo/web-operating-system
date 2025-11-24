/**
 * Container Runtime - Docker-like App Isolation
 * 
 * Provides container-based isolation for applications
 */

export class ContainerRuntime {
  constructor() {
    this.containers = new Map();
    this.images = new Map();
  }

  async initialize() {
    console.log('📦 Initializing Container Runtime...');
    this.loadBaseImages();
    console.log('✅ Container Runtime initialized');
  }

  loadBaseImages() {
    // Define base images for different app types
    this.images.set('node:18', {
      name: 'node:18',
      runtime: 'node',
      version: '18.0.0',
      size: 100 * 1024 * 1024
    });
    
    this.images.set('python:3.11', {
      name: 'python:3.11',
      runtime: 'python',
      version: '3.11.0',
      size: 80 * 1024 * 1024
    });
  }

  async createContainer(config) {
    const containerId = this.generateContainerId();
    
    const container = {
      id: containerId,
      name: config.name || containerId,
      image: config.image || 'node:18',
      state: 'created',
      env: config.env || {},
      mounts: config.mounts || [],
      network: config.network || 'bridge',
      resources: {
        cpu: config.cpuLimit || 1,
        memory: config.memoryLimit || 512 * 1024 * 1024
      },
      created: Date.now(),
      worker: null
    };

    this.containers.set(containerId, container);
    console.log(`  ✓ Container created: ${containerId}`);
    
    return container;
  }

  async startContainer(containerId) {
    const container = this.containers.get(containerId);
    if (!container) throw new Error(`Container not found: ${containerId}`);

    // Create isolated worker for container
    const workerCode = `
      const container = {
        id: '${containerId}',
        env: ${JSON.stringify(container.env)}
      };
      
      self.onmessage = (e) => {
        if (e.data.type === 'exec') {
          try {
            const result = eval(e.data.code);
            self.postMessage({ type: 'result', success: true, result });
          } catch (error) {
            self.postMessage({ type: 'result', success: false, error: error.message });
          }
        }
      };
      
      self.postMessage({ type: 'ready' });
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    container.worker = worker;
    container.state = 'running';
    container.started = Date.now();

    console.log(`  ✓ Container started: ${containerId}`);
    return container;
  }

  async stopContainer(containerId) {
    const container = this.containers.get(containerId);
    if (!container) return;

    if (container.worker) {
      container.worker.terminate();
      container.worker = null;
    }

    container.state = 'stopped';
    console.log(`  ✓ Container stopped: ${containerId}`);
  }

  async removeContainer(containerId) {
    await this.stopContainer(containerId);
    this.containers.delete(containerId);
    console.log(`  ✓ Container removed: ${containerId}`);
  }

  async execInContainer(containerId, command) {
    const container = this.containers.get(containerId);
    if (!container || container.state !== 'running') {
      throw new Error(`Container not running: ${containerId}`);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Exec timeout')), 5000);

      container.worker.onmessage = (e) => {
        if (e.data.type === 'result') {
          clearTimeout(timeout);
          if (e.data.success) {
            resolve(e.data.result);
          } else {
            reject(new Error(e.data.error));
          }
        }
      };

      container.worker.postMessage({ type: 'exec', code: command });
    });
  }

  listContainers() {
    return Array.from(this.containers.values()).map(c => ({
      id: c.id,
      name: c.name,
      image: c.image,
      state: c.state,
      uptime: c.started ? Date.now() - c.started : 0
    }));
  }

  listImages() {
    return Array.from(this.images.values());
  }

  generateContainerId() {
    return `container_${Math.random().toString(36).substr(2, 12)}`;
  }

  async shutdown() {
    console.log('Shutting down Container Runtime...');
    for (const containerId of this.containers.keys()) {
      await this.removeContainer(containerId);
    }
    console.log('✅ Container Runtime shut down');
  }
}

let containerInstance = null;
export function getContainerRuntime() {
  if (!containerInstance) containerInstance = new ContainerRuntime();
  return containerInstance;
}
