/**
 * TypeScript Runtime
 * Transpiles and executes TypeScript code
 */

import { BaseRuntime, ExecutionResult, RuntimeConfig } from './LanguageRuntime';

declare global {
  interface Window {
    ts: any;
  }
}

export class TypeScriptRuntime extends BaseRuntime {
  name = 'TypeScript';
  version = '5.3';
  private ts: any = null;

  async initialize(): Promise<void> {
    if (this.loaded) return;

    try {
      // Load TypeScript compiler from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/typescript@5.3.3/lib/typescript.js';

      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load TypeScript compiler'));
        document.head.appendChild(script);
      });

      this.ts = window.ts;
      this.loaded = true;
    } catch (error) {
      throw new Error(`Failed to initialize TypeScript runtime: ${error}`);
    }
  }

  async execute(code: string, config?: RuntimeConfig): Promise<ExecutionResult> {
    const startTime = performance.now();

    if (!this.loaded) {
      await this.initialize();
    }

    try {
      // Transpile TypeScript to JavaScript
      const result = this.ts.transpileModule(code, {
        compilerOptions: {
          target: this.ts.ScriptTarget.ES2020,
          module: this.ts.ModuleKind.ESNext,
          lib: ['ES2020', 'DOM'],
          strict: false,
          esModuleInterop: true,
          skipLibCheck: true,
        },
      });

      // Check for diagnostics (errors/warnings)
      if (result.diagnostics && result.diagnostics.length > 0) {
        const errors = result.diagnostics
          .map((diag: any) => {
            const message = this.ts.flattenDiagnosticMessageText(diag.messageText, '\n');
            if (diag.file && diag.start !== undefined) {
              const { line, character } = diag.file.getLineAndCharacterOfPosition(diag.start);
              return `Line ${line + 1}, Column ${character + 1}: ${message}`;
            }
            return message;
          })
          .join('\n');

        return {
          success: false,
          output: '',
          error: `TypeScript compilation errors:\n${errors}`,
          executionTime: performance.now() - startTime,
        };
      }

      // Execute the transpiled JavaScript
      const jsCode = result.outputText;

      // Create console capture
      const logs: string[] = [];
      const originalConsole = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
      };

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

      try {
        // Execute with timeout
        const timeout = config?.timeout || 30000;
        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
        const fn = new AsyncFunction(jsCode);

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Execution timeout')), timeout);
        });

        const executeResult = await Promise.race([fn(), timeoutPromise]);

        // If there's a return value, log it
        if (executeResult !== undefined) {
          logs.push(String(executeResult));
        }

        return {
          success: true,
          output: logs.join('\n'),
          executionTime: performance.now() - startTime,
        };
      } finally {
        // Restore console
        console.log = originalConsole.log;
        console.info = originalConsole.info;
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        executionTime: performance.now() - startTime,
      };
    }
  }

  hasREPL(): boolean {
    return true;
  }
}
