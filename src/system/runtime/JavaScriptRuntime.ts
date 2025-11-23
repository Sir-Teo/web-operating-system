/**
 * JavaScript Runtime
 * Native JavaScript execution in browser environment
 */

import { BaseRuntime, ExecutionResult, RuntimeConfig } from './LanguageRuntime';

export class JavaScriptRuntime extends BaseRuntime {
  name = 'JavaScript';
  version = 'ES2024';

  async initialize(): Promise<void> {
    this.loaded = true;
  }

  async execute(code: string, config?: RuntimeConfig): Promise<ExecutionResult> {
    const startTime = performance.now();
    let output = '';
    let error: string | undefined;
    let success = true;

    // Create console capture
    const logs: string[] = [];
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      dir: console.dir,
    };

    // Override console methods
    const captureOutput = (...args: any[]) => {
      const message = args
        .map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        })
        .join(' ');
      logs.push(message);
    };

    console.log = captureOutput;
    console.info = captureOutput;
    console.warn = captureOutput;
    console.error = captureOutput;
    console.dir = captureOutput;

    try {
      // Create execution context with timeout
      const timeout = config?.timeout || 30000;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Execution timeout')), timeout);
      });

      // Execute code
      const executePromise = (async () => {
        try {
          // Use AsyncFunction for async/await support
          const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
          const fn = new AsyncFunction(code);
          const result = await fn();

          // If there's a return value, log it
          if (result !== undefined) {
            logs.push(String(result));
          }
        } catch (err) {
          throw err;
        }
      })();

      await Promise.race([executePromise, timeoutPromise]);

      output = logs.join('\n');
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : String(err);

      // Include stack trace if available
      if (err instanceof Error && err.stack) {
        error += '\n' + err.stack;
      }

      output = logs.join('\n');
    } finally {
      // Restore console
      console.log = originalConsole.log;
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.dir = originalConsole.dir;
    }

    return {
      success,
      output,
      error,
      executionTime: performance.now() - startTime,
    };
  }

  hasREPL(): boolean {
    return true;
  }
}
