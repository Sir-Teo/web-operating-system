/**
 * PHP Runtime using php-wasm
 * PHP 8.2 in WebAssembly
 */

import { BaseRuntime, ExecutionResult, RuntimeConfig } from './LanguageRuntime';

declare global {
  interface Window {
    PhpWeb: any;
  }
}

export class PHPRuntime extends BaseRuntime {
  name = 'PHP';
  version = '8.2';
  private php: any = null;

  async initialize(): Promise<void> {
    if (this.loaded) return;

    try {
      // Load php-wasm from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/php-wasm@0.0.9/php-web.js';
      script.type = 'module';

      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load PHP runtime'));
        document.head.appendChild(script);
      });

      // Wait for PhpWeb to be available
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (window.PhpWeb) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });

      // Initialize PHP
      const { PhpWeb } = window;
      this.php = new PhpWeb();

      this.loaded = true;
    } catch (error) {
      throw new Error(`Failed to initialize PHP runtime: ${error}`);
    }
  }

  async execute(code: string, config?: RuntimeConfig): Promise<ExecutionResult> {
    const startTime = performance.now();

    if (!this.loaded) {
      await this.initialize();
    }

    try {
      // Ensure code starts with <?php tag
      let phpCode = code.trim();
      if (!phpCode.startsWith('<?php') && !phpCode.startsWith('<?=')) {
        phpCode = '<?php\n' + phpCode;
      }

      // Execute PHP code
      const output = await this.php.run(phpCode);

      return {
        success: true,
        output: output || '',
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
}
