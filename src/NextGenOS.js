/**
 * Next Generation Web Operating System
 * 
 * Integrates all next-gen features:
 * - Microkernel architecture
 * - WebGPU acceleration
 * - Real LLM integration
 * - LSP support
 * - Advanced sandboxing
 * - Distributed computing
 * - WebXR support
 * - Container runtime
 * - Advanced monitoring
 */

import { getMicrokernelCore } from './kernel/MicrokernelCore.js';
import { getWebGPUCompute } from './gpu/WebGPUCompute.js';
import { getLLMIntegration } from './ai/LLMIntegration.js';
import { getLSPClient } from './lsp/LSPClient.js';
import { getAdvancedSandbox } from './security/AdvancedSandbox.js';
import { getMeshNetwork } from './distributed/MeshNetwork.js';
import { getWebXRManager } from './xr/WebXRManager.js';
import { getContainerRuntime } from './containers/ContainerRuntime.js';
import { getAdvancedMonitor } from './monitoring/AdvancedMonitor.js';

export class NextGenOS {
  constructor() {
    this.version = '4.0.0';
    this.initialized = false;

    // Core subsystems
    this.microkernel = null;
    this.gpu = null;
    this.llm = null;
    this.lsp = null;
    this.sandbox = null;
    this.mesh = null;
    this.xr = null;
    this.containers = null;
    this.monitor = null;

    // Feature flags
    this.features = {
      microkernel: true,
      webgpu: true,
      llm: true,
      lsp: true,
      sandbox: true,
      mesh: false, // Disabled by default
      xr: false,   // Disabled by default
      containers: true,
      monitoring: true
    };
  }

  /**
   * Initialize Next-Gen OS
   */
  async initialize(options = {}) {
    console.log('🚀 Initializing Next-Gen Web OS v' + this.version);
    console.log('='.repeat(50));

    // Merge feature flags
    this.features = { ...this.features, ...options.features };

    const startTime = performance.now();

    try {
      // Initialize monitoring first
      if (this.features.monitoring) {
        this.monitor = getAdvancedMonitor();
        await this.monitor.initialize();
      }

      // Initialize microkernel
      if (this.features.microkernel) {
        this.microkernel = getMicrokernelCore();
        await this.microkernel.initialize();
      }

      // Initialize WebGPU
      if (this.features.webgpu) {
        this.gpu = getWebGPUCompute();
        await this.gpu.initialize();
      }

      // Initialize LLM integration
      if (this.features.llm) {
        this.llm = getLLMIntegration();
        await this.llm.initialize();
      }

      // Initialize LSP
      if (this.features.lsp) {
        this.lsp = getLSPClient();
        await this.lsp.initialize();
      }

      // Initialize advanced sandbox
      if (this.features.sandbox) {
        this.sandbox = getAdvancedSandbox();
        await this.sandbox.initialize();
      }

      // Initialize mesh network (optional)
      if (this.features.mesh) {
        this.mesh = getMeshNetwork();
        await this.mesh.initialize();
      }

      // Initialize WebXR (optional)
      if (this.features.xr) {
        this.xr = getWebXRManager();
        await this.xr.initialize();
      }

      // Initialize container runtime
      if (this.features.containers) {
        this.containers = getContainerRuntime();
        await this.containers.initialize();
      }

      const endTime = performance.now();
      const initTime = (endTime - startTime).toFixed(2);

      this.initialized = true;

      console.log('='.repeat(50));
      console.log(\`✅ Next-Gen OS initialized in \${initTime}ms\`);
      console.log('='.repeat(50));
      
      this.printSystemInfo();

      return true;
    } catch (error) {
      console.error('❌ Next-Gen OS initialization failed:', error);
      throw error;
    }
  }

  /**
   * Print system information
   */
  printSystemInfo() {
    console.log('');
    console.log('📋 System Information:');
    console.log('  Version:', this.version);
    console.log('  Platform: Web Browser');
    console.log('  Architecture: Next-Generation');
    console.log('');
    console.log('🔧 Active Features:');
    
    for (const [feature, enabled] of Object.entries(this.features)) {
      if (enabled) {
        console.log(\`  ✓ \${feature}\`);
      }
    }
    
    console.log('');
    console.log('💾 Resources:');
    if (this.monitor) {
      const metrics = this.monitor.getMetrics();
      console.log(\`  Memory: \${(metrics.memory.used / 1024 / 1024).toFixed(2)} MB / \${(metrics.memory.total / 1024 / 1024).toFixed(2)} MB\`);
      console.log(\`  CPU: \${metrics.cpu.toFixed(1)}%\`);
    }
    
    if (this.gpu && this.gpu.isSupported()) {
      const deviceInfo = this.gpu.getDeviceInfo();
      console.log(\`  GPU: \${deviceInfo?.vendor || 'Unknown'}\`);
    }
    
    console.log('');
  }

  /**
   * Get all subsystems
   */
  getSubsystems() {
    return {
      microkernel: this.microkernel,
      gpu: this.gpu,
      llm: this.llm,
      lsp: this.lsp,
      sandbox: this.sandbox,
      mesh: this.mesh,
      xr: this.xr,
      containers: this.containers,
      monitor: this.monitor
    };
  }

  /**
   * Get system status
   */
  getStatus() {
    const status = {
      version: this.version,
      initialized: this.initialized,
      features: { ...this.features },
      subsystems: {}
    };

    if (this.microkernel) {
      status.subsystems.microkernel = this.microkernel.getAllServiceStatuses();
    }

    if (this.gpu) {
      status.subsystems.gpu = {
        supported: this.gpu.isSupported(),
        metrics: this.gpu.getMetrics()
      };
    }

    if (this.llm) {
      status.subsystems.llm = {
        providers: this.llm.getProviders().length
      };
    }

    if (this.mesh) {
      status.subsystems.mesh = this.mesh.getNetworkStats();
    }

    if (this.containers) {
      status.subsystems.containers = {
        running: this.containers.listContainers().filter(c => c.state === 'running').length,
        total: this.containers.listContainers().length
      };
    }

    if (this.monitor) {
      status.subsystems.monitoring = this.monitor.getMetrics();
    }

    return status;
  }

  /**
   * Run diagnostics
   */
  async runDiagnostics() {
    console.log('🔍 Running system diagnostics...');
    console.log('');

    const results = {
      passed: [],
      failed: [],
      warnings: []
    };

    // Check microkernel
    if (this.microkernel && this.microkernel.initialized) {
      results.passed.push('Microkernel: Operational');
    } else if (this.features.microkernel) {
      results.failed.push('Microkernel: Not initialized');
    }

    // Check WebGPU
    if (this.gpu && this.gpu.isSupported()) {
      results.passed.push('WebGPU: Supported and initialized');
    } else if (this.features.webgpu) {
      results.warnings.push('WebGPU: Not supported (CPU fallback active)');
    }

    // Check LLM
    if (this.llm && this.llm.getProviders().length > 0) {
      results.passed.push(\`LLM: \${this.llm.getProviders().length} providers available\`);
    } else if (this.features.llm) {
      results.warnings.push('LLM: No API keys configured');
    }

    // Check LSP
    if (this.lsp && this.lsp.initialized) {
      results.passed.push('LSP: Operational');
    } else if (this.features.lsp) {
      results.failed.push('LSP: Not initialized');
    }

    // Print results
    console.log('✅ Passed (' + results.passed.length + '):');
    results.passed.forEach(r => console.log('  ' + r));
    console.log('');

    if (results.warnings.length > 0) {
      console.log('⚠️  Warnings (' + results.warnings.length + '):');
      results.warnings.forEach(r => console.log('  ' + r));
      console.log('');
    }

    if (results.failed.length > 0) {
      console.log('❌ Failed (' + results.failed.length + '):');
      results.failed.forEach(r => console.log('  ' + r));
      console.log('');
    }

    return results;
  }

  /**
   * Shutdown all subsystems
   */
  async shutdown() {
    console.log('');
    console.log('🛑 Shutting down Next-Gen OS...');

    const shutdownPromises = [];

    if (this.containers) shutdownPromises.push(this.containers.shutdown());
    if (this.mesh) shutdownPromises.push(this.mesh.shutdown());
    if (this.xr) shutdownPromises.push(this.xr.shutdown());
    if (this.sandbox) shutdownPromises.push(this.sandbox.shutdown());
    if (this.lsp) shutdownPromises.push(this.lsp.shutdown());
    if (this.llm) shutdownPromises.push(this.llm.shutdown());
    if (this.gpu) shutdownPromises.push(this.gpu.shutdown());
    if (this.microkernel) shutdownPromises.push(this.microkernel.shutdown());
    if (this.monitor) shutdownPromises.push(this.monitor.shutdown());

    await Promise.all(shutdownPromises);

    this.initialized = false;

    console.log('✅ Next-Gen OS shut down successfully');
  }
}

// Singleton instance
let nextGenOSInstance = null;

export function getNextGenOS() {
  if (!nextGenOSInstance) {
    nextGenOSInstance = new NextGenOS();
  }
  return nextGenOSInstance;
}

// Auto-initialize on import (can be disabled)
export async function autoInit(options = {}) {
  const os = getNextGenOS();
  if (!os.initialized) {
    await os.initialize(options);
  }
  return os;
}
