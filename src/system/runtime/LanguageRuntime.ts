/**
 * Multi-Language Runtime Engine
 * Provides unified interface for executing code in multiple programming languages
 */

export interface RuntimeConfig {
  language: string;
  version?: string;
  memoryLimit?: number;
  timeout?: number;
  packages?: string[];
  environment?: Record<string, string>;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  memoryUsed?: number;
}

export interface LanguageRuntime {
  name: string;
  version: string;
  loaded: boolean;

  initialize(): Promise<void>;
  execute(code: string, config?: RuntimeConfig): Promise<ExecutionResult>;
  installPackage(packageName: string): Promise<boolean>;
  listPackages(): Promise<string[]>;
  hasREPL(): boolean;
  getREPL?(): any;
  dispose(): void;
}

export class RuntimeManager {
  private static instance: RuntimeManager;
  private runtimes: Map<string, LanguageRuntime> = new Map();
  private loadingPromises: Map<string, Promise<void>> = new Map();

  private constructor() {}

  static getInstance(): RuntimeManager {
    if (!RuntimeManager.instance) {
      RuntimeManager.instance = new RuntimeManager();
    }
    return RuntimeManager.instance;
  }

  /**
   * Register a language runtime
   */
  registerRuntime(language: string, runtime: LanguageRuntime): void {
    this.runtimes.set(language.toLowerCase(), runtime);
  }

  /**
   * Get available runtimes
   */
  getAvailableRuntimes(): string[] {
    return Array.from(this.runtimes.keys());
  }

  /**
   * Check if a language is supported
   */
  isSupported(language: string): boolean {
    return this.runtimes.has(language.toLowerCase());
  }

  /**
   * Get runtime for a language
   */
  getRuntime(language: string): LanguageRuntime | undefined {
    return this.runtimes.get(language.toLowerCase());
  }

  /**
   * Initialize a runtime (lazy loading)
   */
  async initializeRuntime(language: string): Promise<void> {
    const runtime = this.runtimes.get(language.toLowerCase());
    if (!runtime) {
      throw new Error(`Runtime for ${language} not found`);
    }

    if (runtime.loaded) {
      return;
    }

    // Check if already loading
    if (this.loadingPromises.has(language)) {
      return this.loadingPromises.get(language);
    }

    // Start loading
    const loadingPromise = runtime.initialize().then(() => {
      this.loadingPromises.delete(language);
    });

    this.loadingPromises.set(language, loadingPromise);
    return loadingPromise;
  }

  /**
   * Execute code in a specific language
   */
  async execute(
    language: string,
    code: string,
    config?: RuntimeConfig
  ): Promise<ExecutionResult> {
    const startTime = performance.now();

    try {
      const runtime = this.runtimes.get(language.toLowerCase());
      if (!runtime) {
        return {
          success: false,
          output: '',
          error: `Language '${language}' is not supported`,
          executionTime: performance.now() - startTime,
        };
      }

      // Initialize runtime if needed
      if (!runtime.loaded) {
        await this.initializeRuntime(language);
      }

      // Execute code
      const result = await runtime.execute(code, config);
      return result;
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        executionTime: performance.now() - startTime,
      };
    }
  }

  /**
   * Install a package for a language
   */
  async installPackage(language: string, packageName: string): Promise<boolean> {
    const runtime = this.runtimes.get(language.toLowerCase());
    if (!runtime) {
      throw new Error(`Runtime for ${language} not found`);
    }

    if (!runtime.loaded) {
      await this.initializeRuntime(language);
    }

    return runtime.installPackage(packageName);
  }

  /**
   * List installed packages for a language
   */
  async listPackages(language: string): Promise<string[]> {
    const runtime = this.runtimes.get(language.toLowerCase());
    if (!runtime) {
      throw new Error(`Runtime for ${language} not found`);
    }

    if (!runtime.loaded) {
      await this.initializeRuntime(language);
    }

    return runtime.listPackages();
  }

  /**
   * Dispose all runtimes
   */
  dispose(): void {
    this.runtimes.forEach(runtime => runtime.dispose());
    this.runtimes.clear();
    this.loadingPromises.clear();
  }
}

/**
 * Base class for language runtimes
 */
export abstract class BaseRuntime implements LanguageRuntime {
  abstract name: string;
  abstract version: string;
  loaded: boolean = false;

  abstract initialize(): Promise<void>;
  abstract execute(code: string, config?: RuntimeConfig): Promise<ExecutionResult>;

  async installPackage(packageName: string): Promise<boolean> {
    throw new Error('Package installation not supported for this runtime');
  }

  async listPackages(): Promise<string[]> {
    return [];
  }

  hasREPL(): boolean {
    return false;
  }

  dispose(): void {
    this.loaded = false;
  }
}
