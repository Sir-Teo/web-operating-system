/**
 * Python Runtime using Pyodide
 * Full Python 3.11 environment with scientific computing packages
 */

import { BaseRuntime, ExecutionResult, RuntimeConfig } from './LanguageRuntime';

// @ts-ignore
declare global {
  interface Window {
    loadPyodide: any;
  }
}

export class PythonRuntime extends BaseRuntime {
  name = 'Python';
  version = '3.11';
  private pyodide: any = null;
  private installedPackages: Set<string> = new Set();

  async initialize(): Promise<void> {
    if (this.loaded) return;

    try {
      // Load Pyodide from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';

      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Pyodide'));
        document.head.appendChild(script);
      });

      // Initialize Pyodide
      this.pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
      });

      // Setup stdout/stderr capture
      await this.pyodide.runPythonAsync(`
import sys
import io
import traceback

class OutputCapture:
    def __init__(self):
        self.stdout = io.StringIO()
        self.stderr = io.StringIO()

    def capture(self):
        sys.stdout = self.stdout
        sys.stderr = self.stderr

    def release(self):
        sys.stdout = sys.__stdout__
        sys.stderr = sys.__stderr__

    def get_output(self):
        return self.stdout.getvalue()

    def get_error(self):
        return self.stderr.getvalue()

    def clear(self):
        self.stdout = io.StringIO()
        self.stderr = io.StringIO()

_output_capture = OutputCapture()
      `);

      this.loaded = true;
    } catch (error) {
      throw new Error(`Failed to initialize Python runtime: ${error}`);
    }
  }

  async execute(code: string, config?: RuntimeConfig): Promise<ExecutionResult> {
    const startTime = performance.now();

    if (!this.loaded) {
      await this.initialize();
    }

    try {
      // Capture output
      await this.pyodide.runPythonAsync('_output_capture.clear(); _output_capture.capture()');

      // Execute code with timeout
      const timeout = config?.timeout || 60000;
      const executePromise = this.pyodide.runPythonAsync(code);

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Execution timeout')), timeout);
      });

      let result = await Promise.race([executePromise, timeoutPromise]);

      // Release output capture
      await this.pyodide.runPythonAsync('_output_capture.release()');

      // Get captured output
      const stdout = await this.pyodide.runPythonAsync('_output_capture.get_output()');
      const stderr = await this.pyodide.runPythonAsync('_output_capture.get_error()');

      let output = stdout || '';

      // If there's a result that's not None, include it
      if (result !== undefined && result !== null) {
        const resultStr = String(result);
        if (resultStr !== 'None') {
          output += (output ? '\n' : '') + resultStr;
        }
      }

      // Check for errors in stderr
      if (stderr) {
        return {
          success: false,
          output,
          error: stderr,
          executionTime: performance.now() - startTime,
        };
      }

      return {
        success: true,
        output,
        executionTime: performance.now() - startTime,
      };
    } catch (error) {
      // Release output capture on error
      try {
        await this.pyodide.runPythonAsync('_output_capture.release()');
        const stdout = await this.pyodide.runPythonAsync('_output_capture.get_output()');
        const stderr = await this.pyodide.runPythonAsync('_output_capture.get_error()');

        return {
          success: false,
          output: stdout || '',
          error: stderr || (error instanceof Error ? error.message : String(error)),
          executionTime: performance.now() - startTime,
        };
      } catch {
        return {
          success: false,
          output: '',
          error: error instanceof Error ? error.message : String(error),
          executionTime: performance.now() - startTime,
        };
      }
    }
  }

  async installPackage(packageName: string): Promise<boolean> {
    if (!this.loaded) {
      await this.initialize();
    }

    try {
      await this.pyodide.loadPackage(packageName);
      this.installedPackages.add(packageName);
      return true;
    } catch (error) {
      // Try micropip for packages not in Pyodide
      try {
        await this.pyodide.loadPackage('micropip');
        await this.pyodide.runPythonAsync(`
import micropip
await micropip.install('${packageName}')
        `);
        this.installedPackages.add(packageName);
        return true;
      } catch (pipError) {
        console.error(`Failed to install ${packageName}:`, pipError);
        return false;
      }
    }
  }

  async listPackages(): Promise<string[]> {
    if (!this.loaded) {
      await this.initialize();
    }

    return Array.from(this.installedPackages);
  }

  hasREPL(): boolean {
    return true;
  }

  getREPL(): any {
    return this.pyodide;
  }

  dispose(): void {
    if (this.pyodide) {
      // Cleanup Pyodide resources
      this.pyodide = null;
    }
    this.installedPackages.clear();
    super.dispose();
  }
}
