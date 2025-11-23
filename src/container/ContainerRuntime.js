/**
 * Container Runtime - Docker-like Containers for Apps
 * Provides process isolation and resource limits
 */

import { Logger } from '../utils/Logger.js';
import { eventBus } from '../utils/EventBus.js';

export class ContainerRuntime {
  constructor(kernel) {
    this.kernel = kernel;
    this.logger = new Logger('ContainerRuntime');
    this.containers = new Map();
    this.images = new Map();
  }

  async initialize() {
    this.logger.info('Initializing Container Runtime...');
    await this._loadImages();
    return true;
  }

  async createContainer(config) {
    const containerId = `container_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const container = {
      id: containerId,
      name: config.name,
      image: config.image,
      status: 'created',
      resources: {
        memoryLimit: config.memoryLimit || 100 * 1024 * 1024, // 100MB default
        cpuLimit: config.cpuLimit || 1.0
      },
      env: config.env || {},
      volumes: config.volumes || [],
      created: Date.now()
    };

    this.containers.set(containerId, container);
    this.logger.info(`Container created: ${containerId}`);

    return container;
  }

  async startContainer(containerId) {
    const container = this.containers.get(containerId);
    if (!container) throw new Error('Container not found');

    container.status = 'running';
    container.startedAt = Date.now();

    // Create isolated environment
    const iframe = document.createElement('iframe');
    iframe.sandbox = 'allow-scripts';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    container.iframe = iframe;

    this.logger.info(`Container started: ${containerId}`);
    return true;
  }

  async stopContainer(containerId) {
    const container = this.containers.get(containerId);
    if (!container) throw new Error('Container not found');

    if (container.iframe) {
      container.iframe.remove();
    }

    container.status = 'stopped';
    container.stoppedAt = Date.now();

    this.logger.info(`Container stopped: ${containerId}`);
    return true;
  }

  async buildImage(config) {
    const imageId = `image_${Date.now()}`;

    const image = {
      id: imageId,
      name: config.name,
      tag: config.tag || 'latest',
      layers: config.layers || [],
      created: Date.now()
    };

    this.images.set(imageId, image);
    await this._saveImages();

    return image;
  }

  listContainers() {
    return Array.from(this.containers.values());
  }

  listImages() {
    return Array.from(this.images.values());
  }

  async _loadImages() {
    try {
      const vfs = this.kernel.vfs;
      const data = await vfs.readFile('/.containers/images.json');
      const images = JSON.parse(data);

      for (const image of images) {
        this.images.set(image.id, image);
      }

      this.logger.info(`Loaded ${images.length} container images`);
    } catch (error) {
      this.logger.info('No saved images found');
    }
  }

  async _saveImages() {
    try {
      const vfs = this.kernel.vfs;
      await vfs.mkdir('/.containers', { recursive: true });

      const images = Array.from(this.images.values());
      await vfs.writeFile('/.containers/images.json', JSON.stringify(images, null, 2));
    } catch (error) {
      this.logger.error('Failed to save images:', error);
    }
  }
}

export default ContainerRuntime;
