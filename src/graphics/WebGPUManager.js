/**
 * WebGPU Manager - High-Performance Graphics
 * Provides WebGPU acceleration for the OS
 */

import { Logger } from '../utils/Logger.js';

export class WebGPUManager {
  constructor() {
    this.logger = new Logger('WebGPUManager');
    this.adapter = null;
    this.device = null;
    this.isSupported = false;
    this.capabilities = {};
  }

  async initialize() {
    this.logger.info('Initializing WebGPU...');

    if (!navigator.gpu) {
      this.logger.warn('WebGPU not supported');
      return false;
    }

    try {
      this.adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance'
      });

      if (!this.adapter) {
        throw new Error('No WebGPU adapter available');
      }

      this.device = await this.adapter.requestDevice();

      this.capabilities = {
        maxTextureDimension2D: this.device.limits.maxTextureDimension2D,
        maxBufferSize: this.device.limits.maxBufferSize,
        maxBindGroups: this.device.limits.maxBindGroups
      };

      this.isSupported = true;
      this.logger.info('WebGPU initialized successfully');
      return true;
    } catch (error) {
      this.logger.error('WebGPU initialization failed:', error);
      return false;
    }
  }

  createComputePipeline(shaderCode) {
    if (!this.device) throw new Error('WebGPU not initialized');

    const shaderModule = this.device.createShaderModule({
      code: shaderCode
    });

    return this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: shaderModule,
        entryPoint: 'main'
      }
    });
  }

  createBuffer(size, usage) {
    if (!this.device) throw new Error('WebGPU not initialized');

    return this.device.createBuffer({
      size,
      usage,
      mappedAtCreation: false
    });
  }

  async executeCompute(pipeline, buffers, workgroupCount) {
    if (!this.device) throw new Error('WebGPU not initialized');

    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();

    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, buffers);
    passEncoder.dispatchWorkgroups(workgroupCount);
    passEncoder.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }
}

export default WebGPUManager;
