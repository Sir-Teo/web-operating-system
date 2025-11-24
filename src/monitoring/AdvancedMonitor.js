/**
 * Advanced Resource Monitoring and Enforcement
 * 
 * Comprehensive system resource monitoring with enforcement
 */

export class AdvancedMonitor {
  constructor() {
    this.metrics = {
      cpu: [],
      memory: [],
      disk: [],
      network: []
    };
    this.limits = new Map();
    this.alerts = [];
    this.monitoringInterval = null;
  }

  async initialize() {
    console.log('📊 Initializing Advanced Monitor...');
    
    this.startMonitoring();
    
    console.log('✅ Advanced Monitor initialized');
  }

  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.enforcelimits();
      this.checkAlerts();
    }, 1000);
  }

  collectMetrics() {
    // CPU metrics (approximation)
    const cpuUsage = this.getCPUUsage();
    this.metrics.cpu.push({
      timestamp: Date.now(),
      usage: cpuUsage
    });

    // Memory metrics
    const memoryUsage = this.getMemoryUsage();
    this.metrics.memory.push({
      timestamp: Date.now(),
      used: memoryUsage.used,
      total: memoryUsage.total,
      percentage: (memoryUsage.used / memoryUsage.total) * 100
    });

    // Keep only last 60 seconds of metrics
    const cutoff = Date.now() - 60000;
    this.metrics.cpu = this.metrics.cpu.filter(m => m.timestamp > cutoff);
    this.metrics.memory = this.metrics.memory.filter(m => m.timestamp > cutoff);
  }

  getCPUUsage() {
    // Estimate CPU usage (simplified)
    if (performance.now) {
      return Math.random() * 100; // Mock for now
    }
    return 0;
  }

  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.jsHeapSizeLimit
      };
    }
    return { used: 0, total: 1 };
  }

  setResourceLimit(processId, resource, limit) {
    if (!this.limits.has(processId)) {
      this.limits.set(processId, {});
    }
    
    const processLimits = this.limits.get(processId);
    processLimits[resource] = limit;
    
    console.log(\`  ✓ Set \${resource} limit for process \${processId}: \${limit}\`);
  }

  enforcelimits() {
    for (const [processId, limits] of this.limits) {
      // Check memory limit
      if (limits.memory) {
        const memUsage = this.getProcessMemoryUsage(processId);
        if (memUsage > limits.memory) {
          this.handleLimitExceeded(processId, 'memory', memUsage, limits.memory);
        }
      }

      // Check CPU limit
      if (limits.cpu) {
        const cpuUsage = this.getProcessCPUUsage(processId);
        if (cpuUsage > limits.cpu) {
          this.handleLimitExceeded(processId, 'cpu', cpuUsage, limits.cpu);
        }
      }
    }
  }

  handleLimitExceeded(processId, resource, current, limit) {
    console.warn(\`⚠️  Process \${processId} exceeded \${resource} limit: \${current} > \${limit}\`);
    
    window.dispatchEvent(new CustomEvent('resource:limit-exceeded', {
      detail: { processId, resource, current, limit }
    }));
  }

  getProcessMemoryUsage(processId) {
    // Mock - would integrate with actual process manager
    return Math.random() * 100 * 1024 * 1024;
  }

  getProcessCPUUsage(processId) {
    // Mock - would integrate with actual process manager
    return Math.random() * 100;
  }

  checkAlerts() {
    const memoryUsage = this.getMemoryUsage();
    const memPercent = (memoryUsage.used / memoryUsage.total) * 100;

    if (memPercent > 90 && !this.hasRecentAlert('memory-critical')) {
      this.createAlert('memory-critical', 'Memory usage critical: ' + memPercent.toFixed(1) + '%');
    }
  }

  createAlert(type, message) {
    const alert = {
      type,
      message,
      timestamp: Date.now()
    };
    
    this.alerts.push(alert);
    
    window.dispatchEvent(new CustomEvent('system:alert', {
      detail: alert
    }));
  }

  hasRecentAlert(type) {
    const recent = this.alerts.filter(a => 
      a.type === type && Date.now() - a.timestamp < 30000
    );
    return recent.length > 0;
  }

  getMetrics() {
    return {
      cpu: this.calculateAverage(this.metrics.cpu.map(m => m.usage)),
      memory: this.getMemoryUsage(),
      network: this.metrics.network.length,
      uptime: performance.now()
    };
  }

  calculateAverage(values) {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  getDetailedMetrics() {
    return {
      cpu: {
        current: this.getCPUUsage(),
        average: this.calculateAverage(this.metrics.cpu.map(m => m.usage)),
        history: this.metrics.cpu.slice(-60)
      },
      memory: {
        current: this.getMemoryUsage(),
        history: this.metrics.memory.slice(-60)
      },
      alerts: this.alerts.slice(-10)
    };
  }

  async shutdown() {
    console.log('Shutting down Advanced Monitor...');
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    console.log('✅ Advanced Monitor shut down');
  }
}

let monitorInstance = null;
export function getAdvancedMonitor() {
  if (!monitorInstance) monitorInstance = new AdvancedMonitor();
  return monitorInstance;
}
