/**
 * Configuration Management System
 * Centralized configuration for runtime system
 */

export interface RuntimeConfiguration {
  // Execution settings
  defaultTimeout: number;
  maxTimeout: number;
  maxMemoryMB: number;
  maxConcurrentExecutions: number;

  // Resource limits
  maxPackageSize: number;
  maxOutputSize: number;
  maxExecutionHistory: number;

  // Retry settings
  maxRetries: number;
  retryDelay: number;
  retryBackoffMultiplier: number;

  // Caching settings
  enableCache: boolean;
  cacheTTL: number;
  maxCacheSize: number;

  // CDN settings
  cdnBaseUrls: {
    pyodide: string;
    ruby: string;
    php: string;
    typescript: string;
    sqljs: string;
  };

  // Feature flags
  enableWebWorkers: boolean;
  enableTelemetry: boolean;
  enableDiagnostics: boolean;
  enablePackageCache: boolean;

  // Security settings
  sandboxMode: boolean;
  allowNetworkAccess: boolean;
  allowFileSystemAccess: boolean;
}

class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: RuntimeConfiguration;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.loadFromStorage();
  }

  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  private getDefaultConfig(): RuntimeConfiguration {
    return {
      // Execution settings
      defaultTimeout: 30000, // 30 seconds
      maxTimeout: 300000, // 5 minutes
      maxMemoryMB: 512,
      maxConcurrentExecutions: 5,

      // Resource limits
      maxPackageSize: 100 * 1024 * 1024, // 100MB
      maxOutputSize: 10 * 1024 * 1024, // 10MB
      maxExecutionHistory: 1000,

      // Retry settings
      maxRetries: 3,
      retryDelay: 1000, // 1 second
      retryBackoffMultiplier: 2,

      // Caching settings
      enableCache: true,
      cacheTTL: 3600000, // 1 hour
      maxCacheSize: 500 * 1024 * 1024, // 500MB

      // CDN settings
      cdnBaseUrls: {
        pyodide: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
        ruby: 'https://cdn.jsdelivr.net/npm/@ruby/3.2-wasm-wasi@2.0.0/dist/',
        php: 'https://cdn.jsdelivr.net/npm/php-wasm@0.0.9/',
        typescript: 'https://cdn.jsdelivr.net/npm/typescript@5.3.3/lib/',
        sqljs: 'https://cdn.jsdelivr.net/npm/sql.js@1.10.2/dist/',
      },

      // Feature flags
      enableWebWorkers: true,
      enableTelemetry: true,
      enableDiagnostics: true,
      enablePackageCache: true,

      // Security settings
      sandboxMode: true,
      allowNetworkAccess: false,
      allowFileSystemAccess: true,
    };
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('webos.runtime.config');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.config = { ...this.config, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('webos.runtime.config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }

  get<K extends keyof RuntimeConfiguration>(key: K): RuntimeConfiguration[K] {
    return this.config[key];
  }

  set<K extends keyof RuntimeConfiguration>(key: K, value: RuntimeConfiguration[K]): void {
    this.config[key] = value;
    this.saveToStorage();
  }

  getAll(): RuntimeConfiguration {
    return { ...this.config };
  }

  update(partial: Partial<RuntimeConfiguration>): void {
    this.config = { ...this.config, ...partial };
    this.saveToStorage();
  }

  reset(): void {
    this.config = this.getDefaultConfig();
    this.saveToStorage();
  }
}

export default ConfigurationManager;
