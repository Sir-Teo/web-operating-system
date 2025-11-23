/**
 * Ruby Runtime using ruby.wasm
 * Ruby 3.2 in WebAssembly
 */

import { BaseRuntime, ExecutionResult, RuntimeConfig } from './LanguageRuntime';

declare global {
  interface Window {
    rubyVM: any;
  }
}

export class RubyRuntime extends BaseRuntime {
  name = 'Ruby';
  version = '3.2';
  private ruby: any = null;

  async initialize(): Promise<void> {
    if (this.loaded) return;

    try {
      // Load ruby.wasm from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@ruby/3.2-wasm-wasi@2.0.0/dist/browser.umd.js';
      script.type = 'text/javascript';

      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Ruby runtime'));
        document.head.appendChild(script);
      });

      // Wait for rubyVM to be available
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if ((window as any).rubyVM) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });

      // Initialize Ruby VM
      const { DefaultRubyVM } = (window as any).rubyVM;
      const response = await fetch(
        'https://cdn.jsdelivr.net/npm/@ruby/3.2-wasm-wasi@2.0.0/dist/ruby+stdlib.wasm'
      );
      const buffer = await response.arrayBuffer();
      const module = await WebAssembly.compile(buffer);

      this.ruby = await DefaultRubyVM(module);

      this.loaded = true;
    } catch (error) {
      throw new Error(`Failed to initialize Ruby runtime: ${error}`);
    }
  }

  async execute(code: string, config?: RuntimeConfig): Promise<ExecutionResult> {
    const startTime = performance.now();

    if (!this.loaded) {
      await this.initialize();
    }

    try {
      // Execute Ruby code
      const result = await this.ruby.eval(code);

      // Convert result to string
      let output = '';
      if (result !== undefined && result !== null) {
        output = String(result);
      }

      return {
        success: true,
        output,
        executionTime: performance.now() - startTime,
      };
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

  getREPL(): any {
    return this.ruby;
  }
}
