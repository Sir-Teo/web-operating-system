/**
 * SQLite Runtime using sql.js
 * SQLite database in WebAssembly
 */

import { BaseRuntime, ExecutionResult, RuntimeConfig } from './LanguageRuntime';

declare global {
  interface Window {
    initSqlJs: any;
  }
}

export class SQLiteRuntime extends BaseRuntime {
  name = 'SQLite';
  version = '3.44';
  private SQL: any = null;
  private db: any = null;

  async initialize(): Promise<void> {
    if (this.loaded) return;

    try {
      // Load sql.js from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/sql.js@1.10.2/dist/sql-wasm.js';

      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load SQLite runtime'));
        document.head.appendChild(script);
      });

      // Initialize sql.js
      this.SQL = await window.initSqlJs({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/sql.js@1.10.2/dist/${file}`,
      });

      // Create in-memory database
      this.db = new this.SQL.Database();

      this.loaded = true;
    } catch (error) {
      throw new Error(`Failed to initialize SQLite runtime: ${error}`);
    }
  }

  async execute(code: string, config?: RuntimeConfig): Promise<ExecutionResult> {
    const startTime = performance.now();

    if (!this.loaded) {
      await this.initialize();
    }

    try {
      // Split multiple statements
      const statements = code
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const results: string[] = [];

      for (const statement of statements) {
        try {
          const result = this.db.exec(statement + ';');

          if (result.length > 0) {
            // Format result as table
            const table = result[0];
            const { columns, values } = table;

            // Create header
            let output = columns.join(' | ') + '\n';
            output += columns.map(() => '---').join(' | ') + '\n';

            // Add rows
            for (const row of values) {
              output += row.join(' | ') + '\n';
            }

            results.push(output.trim());
          } else {
            // Statement executed successfully but no results (INSERT, UPDATE, etc.)
            results.push(`Query OK, ${this.db.getRowsModified()} rows affected`);
          }
        } catch (err) {
          throw err;
        }
      }

      return {
        success: true,
        output: results.join('\n\n'),
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

  /**
   * Export database to binary
   */
  exportDatabase(): Uint8Array {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db.export();
  }

  /**
   * Load database from binary
   */
  loadDatabase(data: Uint8Array): void {
    if (this.db) {
      this.db.close();
    }
    this.db = new this.SQL.Database(data);
  }

  /**
   * Reset database
   */
  resetDatabase(): void {
    if (this.db) {
      this.db.close();
      this.db = new this.SQL.Database();
    }
  }

  hasREPL(): boolean {
    return true;
  }

  dispose(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    super.dispose();
  }
}
