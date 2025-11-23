/**
 * Enhanced Runtime Manager with Robustness and Scalability
 * Provides enterprise-grade runtime management with error recovery, caching, and monitoring
 */

import { RuntimeManager, LanguageRuntime, ExecutionResult, RuntimeConfig } from './LanguageRuntime';
import Logger, { LogCategory } from './Logger';
import ConfigurationManager from './ConfigurationManager';
import CacheManager from './CacheManager';
import ResourceMonitor from './ResourceMonitor';

class EnhancedRuntimeManager extends RuntimeManager {
  private static enhancedInstance: EnhancedRuntimeManager;
  private logger: Logger;
  private config: ConfigurationManager;
  private cache: CacheManager;
  private monitor: ResourceMonitor;

  private executionQueue: Array<{
    id: string;
    language: string;
    code: string;
    config?: RuntimeConfig;
    resolve: (result: ExecutionResult) => void;
    reject: (error: Error) => void;
  }> = [];

  private isProcessingQueue = false;

  private constructor() {
    super();
    this.logger = Logger.getInstance();
    this.config = ConfigurationManager.getInstance();
    this.cache = CacheManager.getInstance();
    this.monitor = ResourceMonitor.getInstance();

    this.logger.info(LogCategory.RUNTIME, 'Enhanced Runtime Manager initialized');
  }

  static getEnhancedInstance(): EnhancedRuntimeManager {
    if (!EnhancedRuntimeManager.enhancedInstance) {
      EnhancedRuntimeManager.enhancedInstance = new EnhancedRuntimeManager();
    }
    return EnhancedRuntimeManager.enhancedInstance;
  }

  /**
   * Initialize runtime with retry logic and error recovery
   */
  async initializeRuntime(language: string): Promise<void> {
    const maxRetries = this.config.get('maxRetries');
    const retryDelay = this.config.get('retryDelay');
    const backoffMultiplier = this.config.get('retryBackoffMultiplier');

    this.logger.info(LogCategory.RUNTIME, `Initializing runtime: ${language}`);
    this.monitor.markRuntimeLoading(language);

    let lastError: Error | null = null;
    let delay = retryDelay;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check cache first
        if (this.config.get('enableCache')) {
          const cached = this.cache.getRuntime(language);
          if (cached) {
            this.logger.info(LogCategory.CACHE, `Using cached runtime: ${language}`);
            // Restore runtime from cache if possible
          }
        }

        // Initialize runtime
        await super.initializeRuntime(language);

        // Cache successful initialization
        if (this.config.get('enableCache')) {
          this.cache.cacheRuntime(language, { initialized: true });
        }

        this.monitor.markRuntimeLoaded(language);
        this.logger.info(LogCategory.RUNTIME, `Runtime initialized: ${language}`, {
          attempts: attempt,
        });

        return;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(LogCategory.RUNTIME, `Runtime initialization failed (attempt ${attempt}/${maxRetries})`, {
          language,
          error: lastError.message,
        });

        if (attempt < maxRetries) {
          await this.delay(delay);
          delay *= backoffMultiplier;
        }
      }
    }

    // All retries failed
    this.monitor.markRuntimeFailed(language, lastError?.message || 'Unknown error');
    this.logger.error(LogCategory.RUNTIME, `Runtime initialization failed after ${maxRetries} attempts`, {
      language,
      error: lastError,
    });

    throw new Error(`Failed to initialize ${language} runtime: ${lastError?.message}`);
  }

  /**
   * Execute code with queuing, caching, and resource management
   */
  async execute(
    language: string,
    code: string,
    config?: RuntimeConfig
  ): Promise<ExecutionResult> {
    const executionId = this.generateExecutionId();

    // Check resource limits
    if (!this.monitor.canExecute()) {
      this.logger.warn(LogCategory.RESOURCE, 'Resource limits reached, queueing execution', {
        executionId,
        language,
      });

      return this.queueExecution(executionId, language, code, config);
    }

    // Check cache for identical code execution
    if (this.config.get('enableCache')) {
      const codeHash = await this.hashCode(code);
      const cached = this.cache.getExecutionResult(codeHash);

      if (cached) {
        this.logger.info(LogCategory.CACHE, 'Using cached execution result', {
          executionId,
          language,
        });
        return cached;
      }
    }

    // Execute
    return this.executeWithMonitoring(executionId, language, code, config);
  }

  private async executeWithMonitoring(
    executionId: string,
    language: string,
    code: string,
    config?: RuntimeConfig
  ): Promise<ExecutionResult> {
    this.monitor.startExecution(executionId, language);
    const startTime = performance.now();

    try {
      // Apply configuration defaults
      const mergedConfig: RuntimeConfig = {
        timeout: this.config.get('defaultTimeout'),
        ...config,
        language,
      };

      // Ensure timeout doesn't exceed maximum
      const maxTimeout = this.config.get('maxTimeout');
      if (mergedConfig.timeout && mergedConfig.timeout > maxTimeout) {
        mergedConfig.timeout = maxTimeout;
      }

      this.logger.debug(LogCategory.EXECUTION, `Executing code`, {
        executionId,
        language,
        codeLength: code.length,
      });

      // Execute with timeout wrapper
      const result = await this.executeWithTimeout(
        () => super.execute(language, code, mergedConfig),
        mergedConfig.timeout || this.config.get('defaultTimeout')
      );

      // Check output size
      const maxOutputSize = this.config.get('maxOutputSize');
      if (result.output && result.output.length > maxOutputSize) {
        result.output = result.output.substring(0, maxOutputSize) + '\n... (output truncated)';
        this.logger.warn(LogCategory.EXECUTION, 'Output truncated due to size limit', {
          executionId,
          size: result.output.length,
        });
      }

      // Cache successful execution
      if (result.success && this.config.get('enableCache')) {
        const codeHash = await this.hashCode(code);
        this.cache.cacheExecutionResult(codeHash, result);
      }

      this.monitor.endExecution(executionId, result.success, result.error);

      this.logger.info(LogCategory.EXECUTION, 'Execution completed', {
        executionId,
        language,
        success: result.success,
        duration: performance.now() - startTime,
      });

      // Process queue if needed
      this.processQueue();

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.monitor.endExecution(executionId, false, errorMessage);

      this.logger.error(LogCategory.EXECUTION, 'Execution failed', {
        executionId,
        language,
        error: errorMessage,
      });

      return {
        success: false,
        output: '',
        error: errorMessage,
        executionTime: performance.now() - startTime,
      };
    }
  }

  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Execution timeout')), timeout)
      ),
    ]);
  }

  private queueExecution(
    id: string,
    language: string,
    code: string,
    config?: RuntimeConfig
  ): Promise<ExecutionResult> {
    return new Promise((resolve, reject) => {
      this.executionQueue.push({
        id,
        language,
        code,
        config,
        resolve,
        reject,
      });

      this.logger.info(LogCategory.EXECUTION, 'Execution queued', {
        id,
        language,
        queueSize: this.executionQueue.length,
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.executionQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.executionQueue.length > 0 && this.monitor.canExecute()) {
      const task = this.executionQueue.shift();
      if (!task) break;

      try {
        const result = await this.executeWithMonitoring(
          task.id,
          task.language,
          task.code,
          task.config
        );
        task.resolve(result);
      } catch (error) {
        task.reject(error as Error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Install package with caching
   */
  async installPackage(language: string, packageName: string): Promise<boolean> {
    this.logger.info(LogCategory.PACKAGE, `Installing package: ${packageName} for ${language}`);

    // Check cache
    if (this.config.get('enablePackageCache')) {
      const cached = this.cache.getPackage(language, packageName);
      if (cached) {
        this.logger.info(LogCategory.CACHE, `Package already installed (cached): ${packageName}`);
        return true;
      }
    }

    try {
      const success = await super.installPackage(language, packageName);

      if (success && this.config.get('enablePackageCache')) {
        this.cache.cachePackage(language, packageName, { installed: true });
      }

      this.logger.info(LogCategory.PACKAGE, `Package installation ${success ? 'succeeded' : 'failed'}`, {
        language,
        packageName,
      });

      return success;
    } catch (error) {
      this.logger.error(LogCategory.PACKAGE, `Package installation error`, {
        language,
        packageName,
        error,
      });
      return false;
    }
  }

  // Health check
  async healthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
    metrics: any;
  }> {
    const issues: string[] = [];
    const metrics = this.monitor.getMetrics();

    // Check memory usage
    if (metrics.memory.percentage > 90) {
      issues.push('High memory usage');
    }

    // Check failed runtimes
    if (metrics.runtimes.failed.length > 0) {
      issues.push(`Failed runtimes: ${metrics.runtimes.failed.join(', ')}`);
    }

    // Check execution failure rate
    const failureRate = metrics.executions.total > 0
      ? (metrics.executions.failed / metrics.executions.total) * 100
      : 0;

    if (failureRate > 50) {
      issues.push(`High failure rate: ${failureRate.toFixed(2)}%`);
    }

    return {
      healthy: issues.length === 0,
      issues,
      metrics,
    };
  }

  // Utilities
  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async hashCode(code: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Diagnostics
  getDiagnostics(): {
    config: any;
    cacheStats: any;
    resourceMetrics: any;
    logStats: any;
    queueSize: number;
  } {
    return {
      config: this.config.getAll(),
      cacheStats: this.cache.getStats(),
      resourceMetrics: this.monitor.getMetrics(),
      logStats: this.logger.getStats(),
      queueSize: this.executionQueue.length,
    };
  }

  // Cleanup
  cleanup(): void {
    this.logger.info(LogCategory.RUNTIME, 'Cleaning up Enhanced Runtime Manager');
    this.cache.clear();
    this.monitor.reset();
    this.executionQueue = [];
    this.dispose();
  }
}

export default EnhancedRuntimeManager;
