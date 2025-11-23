/**
 * Resource Monitor
 * Tracks resource usage, performance metrics, and execution statistics
 */

import Logger, { LogCategory } from './Logger';
import ConfigurationManager from './ConfigurationManager';

export interface ResourceMetrics {
  memory: {
    used: number;
    limit: number;
    percentage: number;
  };
  executions: {
    active: number;
    total: number;
    failed: number;
    succeeded: number;
  };
  performance: {
    averageExecutionTime: number;
    minExecutionTime: number;
    maxExecutionTime: number;
    totalExecutionTime: number;
  };
  runtimes: {
    loaded: string[];
    loading: string[];
    failed: string[];
  };
}

export interface ExecutionMetrics {
  id: string;
  language: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsed?: number;
  success?: boolean;
  error?: string;
}

class ResourceMonitor {
  private static instance: ResourceMonitor;
  private logger: Logger;
  private config: ConfigurationManager;

  private activeExecutions: Map<string, ExecutionMetrics> = new Map();
  private executionHistory: ExecutionMetrics[] = [];
  private loadedRuntimes: Set<string> = new Set();
  private loadingRuntimes: Set<string> = new Set();
  private failedRuntimes: Set<string> = new Set();

  private totalExecutions = 0;
  private failedExecutions = 0;
  private succeededExecutions = 0;

  private memoryUsageEstimate = 0;
  private performanceObserver?: PerformanceObserver;

  private constructor() {
    this.logger = Logger.getInstance();
    this.config = ConfigurationManager.getInstance();
    this.initializePerformanceMonitoring();
    this.startMemoryMonitoring();
  }

  static getInstance(): ResourceMonitor {
    if (!ResourceMonitor.instance) {
      ResourceMonitor.instance = new ResourceMonitor();
    }
    return ResourceMonitor.instance;
  }

  private initializePerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name.startsWith('runtime-')) {
              this.logger.debug(LogCategory.PERFORMANCE, 'Performance entry', {
                name: entry.name,
                duration: entry.duration,
              });
            }
          }
        });

        this.performanceObserver.observe({ entryTypes: ['measure'] });
      } catch (error) {
        this.logger.warn(LogCategory.PERFORMANCE, 'Failed to initialize PerformanceObserver', error);
      }
    }
  }

  private startMemoryMonitoring(): void {
    setInterval(() => {
      this.updateMemoryEstimate();
      this.checkResourceLimits();
    }, 5000); // Check every 5 seconds
  }

  private updateMemoryEstimate(): void {
    // Estimate memory from active runtimes and executions
    this.memoryUsageEstimate =
      (this.loadedRuntimes.size * 50 * 1024 * 1024) + // 50MB per runtime estimate
      (this.activeExecutions.size * 10 * 1024 * 1024); // 10MB per execution estimate

    // Try to get actual memory if available (Chrome only)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (memory && memory.usedJSHeapSize) {
        this.memoryUsageEstimate = memory.usedJSHeapSize;
      }
    }
  }

  private checkResourceLimits(): void {
    const maxMemory = this.config.get('maxMemoryMB') * 1024 * 1024;
    const maxConcurrent = this.config.get('maxConcurrentExecutions');

    // Check memory limit
    if (this.memoryUsageEstimate > maxMemory * 0.9) {
      this.logger.warn(LogCategory.RESOURCE, 'Memory usage high', {
        used: this.memoryUsageEstimate,
        limit: maxMemory,
        percentage: (this.memoryUsageEstimate / maxMemory * 100).toFixed(2),
      });
    }

    // Check concurrent execution limit
    if (this.activeExecutions.size > maxConcurrent * 0.9) {
      this.logger.warn(LogCategory.RESOURCE, 'Concurrent executions high', {
        active: this.activeExecutions.size,
        limit: maxConcurrent,
      });
    }
  }

  // Execution tracking
  startExecution(id: string, language: string): void {
    const metrics: ExecutionMetrics = {
      id,
      language,
      startTime: performance.now(),
    };

    this.activeExecutions.set(id, metrics);
    this.totalExecutions++;

    this.logger.debug(LogCategory.EXECUTION, `Started execution: ${id}`, { language });

    // Mark performance
    if ('performance' in window) {
      performance.mark(`runtime-execution-${id}-start`);
    }
  }

  endExecution(id: string, success: boolean, error?: string): void {
    const metrics = this.activeExecutions.get(id);
    if (!metrics) return;

    metrics.endTime = performance.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.success = success;
    metrics.error = error;

    if (success) {
      this.succeededExecutions++;
    } else {
      this.failedExecutions++;
    }

    // Mark performance
    if ('performance' in window) {
      performance.mark(`runtime-execution-${id}-end`);
      try {
        performance.measure(
          `runtime-execution-${id}`,
          `runtime-execution-${id}-start`,
          `runtime-execution-${id}-end`
        );
      } catch (e) {
        // Marks may have been cleared
      }
    }

    // Move to history
    this.activeExecutions.delete(id);
    this.executionHistory.push(metrics);

    // Trim history
    const maxHistory = this.config.get('maxExecutionHistory');
    if (this.executionHistory.length > maxHistory) {
      this.executionHistory = this.executionHistory.slice(-maxHistory);
    }

    this.logger.debug(LogCategory.EXECUTION, `Ended execution: ${id}`, {
      duration: metrics.duration,
      success,
    });
  }

  // Runtime tracking
  markRuntimeLoading(language: string): void {
    this.loadingRuntimes.add(language);
    this.logger.info(LogCategory.RUNTIME, `Loading runtime: ${language}`);
  }

  markRuntimeLoaded(language: string): void {
    this.loadingRuntimes.delete(language);
    this.loadedRuntimes.add(language);
    this.failedRuntimes.delete(language);
    this.logger.info(LogCategory.RUNTIME, `Runtime loaded: ${language}`);
  }

  markRuntimeFailed(language: string, error: string): void {
    this.loadingRuntimes.delete(language);
    this.failedRuntimes.add(language);
    this.logger.error(LogCategory.RUNTIME, `Runtime failed: ${language}`, { error });
  }

  markRuntimeUnloaded(language: string): void {
    this.loadedRuntimes.delete(language);
    this.logger.info(LogCategory.RUNTIME, `Runtime unloaded: ${language}`);
  }

  // Queries
  canExecute(): boolean {
    const maxConcurrent = this.config.get('maxConcurrentExecutions');
    const maxMemory = this.config.get('maxMemoryMB') * 1024 * 1024;

    return (
      this.activeExecutions.size < maxConcurrent &&
      this.memoryUsageEstimate < maxMemory * 0.95
    );
  }

  getMetrics(): ResourceMetrics {
    const maxMemory = this.config.get('maxMemoryMB') * 1024 * 1024;

    const executionTimes = this.executionHistory
      .filter(e => e.duration !== undefined)
      .map(e => e.duration!);

    const avgTime = executionTimes.length > 0
      ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
      : 0;

    return {
      memory: {
        used: this.memoryUsageEstimate,
        limit: maxMemory,
        percentage: (this.memoryUsageEstimate / maxMemory) * 100,
      },
      executions: {
        active: this.activeExecutions.size,
        total: this.totalExecutions,
        failed: this.failedExecutions,
        succeeded: this.succeededExecutions,
      },
      performance: {
        averageExecutionTime: avgTime,
        minExecutionTime: executionTimes.length > 0 ? Math.min(...executionTimes) : 0,
        maxExecutionTime: executionTimes.length > 0 ? Math.max(...executionTimes) : 0,
        totalExecutionTime: executionTimes.reduce((a, b) => a + b, 0),
      },
      runtimes: {
        loaded: Array.from(this.loadedRuntimes),
        loading: Array.from(this.loadingRuntimes),
        failed: Array.from(this.failedRuntimes),
      },
    };
  }

  getExecutionHistory(language?: string, limit: number = 100): ExecutionMetrics[] {
    let history = [...this.executionHistory];

    if (language) {
      history = history.filter(e => e.language === language);
    }

    return history.slice(-limit);
  }

  getActiveExecutions(): ExecutionMetrics[] {
    return Array.from(this.activeExecutions.values());
  }

  getLanguageStats(language: string): {
    totalExecutions: number;
    successRate: number;
    averageTime: number;
    failureCount: number;
  } {
    const executions = this.executionHistory.filter(e => e.language === language);
    const successful = executions.filter(e => e.success).length;
    const failed = executions.filter(e => !e.success).length;
    const times = executions.filter(e => e.duration).map(e => e.duration!);
    const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

    return {
      totalExecutions: executions.length,
      successRate: executions.length > 0 ? (successful / executions.length) * 100 : 0,
      averageTime: avgTime,
      failureCount: failed,
    };
  }

  reset(): void {
    this.activeExecutions.clear();
    this.executionHistory = [];
    this.totalExecutions = 0;
    this.failedExecutions = 0;
    this.succeededExecutions = 0;
    this.logger.info(LogCategory.RESOURCE, 'Resource monitor reset');
  }

  dispose(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

export default ResourceMonitor;
