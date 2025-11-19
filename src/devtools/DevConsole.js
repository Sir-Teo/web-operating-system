/**
 * DevConsole - Advanced Developer Console
 *
 * Provides enhanced console functionality with:
 * - Multi-level logging
 * - Object inspection
 * - REPL environment
 * - Source mapping
 * - History management
 */

export class DevConsole {
  constructor(options = {}) {
    this.logs = [];
    this.history = [];
    this.historyIndex = -1;
    this.maxLogs = options.maxLogs || 1000;
    this.groups = [];
    this.timers = new Map();
    this.counts = new Map();
    this.context = options.context || window;
    this.listeners = new Map();
  }

  /**
   * Initialize the console
   */
  async init() {
    this._interceptNativeConsole();
    this._loadHistory();
    console.log('[DevConsole] Initialized');
  }

  /**
   * Log a message
   */
  log(...args) {
    this._addLog('log', args);
  }

  /**
   * Log info message
   */
  info(...args) {
    this._addLog('info', args);
  }

  /**
   * Log warning
   */
  warn(...args) {
    this._addLog('warn', args);
  }

  /**
   * Log error
   */
  error(...args) {
    this._addLog('error', args);
  }

  /**
   * Log debug message
   */
  debug(...args) {
    this._addLog('debug', args);
  }

  /**
   * Display object properties
   */
  dir(obj) {
    const formatted = this._formatObject(obj, { depth: Infinity });
    this._addLog('dir', [formatted]);
  }

  /**
   * Display tabular data
   */
  table(data) {
    if (!Array.isArray(data)) {
      this.error('console.table() requires an array');
      return;
    }

    const formatted = this._formatTable(data);
    this._addLog('table', [formatted]);
  }

  /**
   * Start a group
   */
  group(label = '') {
    this.groups.push(label);
    this._addLog('group', [label]);
  }

  /**
   * End a group
   */
  groupEnd() {
    this.groups.pop();
    this._addLog('groupEnd', []);
  }

  /**
   * Start a timer
   */
  time(label = 'default') {
    this.timers.set(label, performance.now());
  }

  /**
   * End a timer
   */
  timeEnd(label = 'default') {
    const start = this.timers.get(label);
    if (!start) {
      this.warn(`Timer '${label}' does not exist`);
      return;
    }

    const duration = performance.now() - start;
    this.log(`${label}: ${duration.toFixed(2)}ms`);
    this.timers.delete(label);
  }

  /**
   * Assert a condition
   */
  assert(condition, message = 'Assertion failed') {
    if (!condition) {
      this.error(message);
      this._addLog('trace', []);
    }
  }

  /**
   * Count occurrences
   */
  count(label = 'default') {
    const count = (this.counts.get(label) || 0) + 1;
    this.counts.set(label, count);
    this.log(`${label}: ${count}`);
  }

  /**
   * Clear the console
   */
  clear() {
    this.logs = [];
    this._emit('clear');
  }

  /**
   * Get stack trace
   */
  trace() {
    const stack = new Error().stack;
    this._addLog('trace', [stack]);
  }

  /**
   * Execute code in context
   */
  async execute(code) {
    try {
      // Add to history
      this.history.push(code);
      this.historyIndex = this.history.length;

      // Create a function with the context
      const fn = new Function('context', `
        with (context) {
          return (async () => {
            ${code}
          })();
        }
      `);

      const result = await fn(this.context);

      this.log('→', result);
      return result;
    } catch (error) {
      this.error('Error executing code:', error);
      throw error;
    }
  }

  /**
   * Get previous history item
   */
  historyUp() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      return this.history[this.historyIndex];
    }
    return null;
  }

  /**
   * Get next history item
   */
  historyDown() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      return this.history[this.historyIndex];
    }
    this.historyIndex = this.history.length;
    return '';
  }

  /**
   * Get all logs
   */
  getLogs(filter = {}) {
    let logs = [...this.logs];

    if (filter.level) {
      logs = logs.filter(log => log.level === filter.level);
    }

    if (filter.search) {
      const search = filter.search.toLowerCase();
      logs = logs.filter(log =>
        log.message.some(msg =>
          String(msg).toLowerCase().includes(search)
        )
      );
    }

    return logs;
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Private methods

  _addLog(level, args) {
    const log = {
      id: Date.now() + Math.random(),
      level,
      message: args,
      timestamp: Date.now(),
      groupDepth: this.groups.length,
      stack: this._captureStack()
    };

    this.logs.push(log);

    // Trim logs if exceeded max
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Emit to listeners
    this._emit('log', log);

    // Also log to native console in development
    if (console[level]) {
      console[level](...args);
    }
  }

  _formatObject(obj, options = {}) {
    const depth = options.depth !== undefined ? options.depth : 2;
    const seen = new WeakSet();

    const format = (value, currentDepth = 0) => {
      // Primitives
      if (value === null) return 'null';
      if (value === undefined) return 'undefined';
      if (typeof value !== 'object') return value;

      // Circular reference
      if (seen.has(value)) return '[Circular]';
      seen.add(value);

      // Arrays
      if (Array.isArray(value)) {
        if (currentDepth >= depth) return '[Array]';
        return value.map(item => format(item, currentDepth + 1));
      }

      // Objects
      if (currentDepth >= depth) return '[Object]';

      const formatted = {};
      for (const [key, val] of Object.entries(value)) {
        formatted[key] = format(val, currentDepth + 1);
      }
      return formatted;
    };

    return format(obj);
  }

  _formatTable(data) {
    if (data.length === 0) return [];

    // Get all unique keys
    const keys = new Set();
    data.forEach(row => {
      Object.keys(row).forEach(key => keys.add(key));
    });

    // Build table
    const table = {
      headers: ['(index)', ...Array.from(keys)],
      rows: data.map((row, index) => [
        index,
        ...Array.from(keys).map(key => row[key])
      ])
    };

    return table;
  }

  _captureStack() {
    const error = new Error();
    const stack = error.stack;

    if (!stack) return null;

    // Parse stack frames
    const frames = stack.split('\n')
      .slice(3) // Skip first 3 frames (this function + _addLog + console method)
      .map(line => {
        const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
        if (match) {
          return {
            function: match[1],
            file: match[2],
            line: parseInt(match[3]),
            column: parseInt(match[4])
          };
        }
        return null;
      })
      .filter(Boolean);

    return frames;
  }

  _interceptNativeConsole() {
    // Store original methods
    const original = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };

    // Intercept console methods
    ['log', 'info', 'warn', 'error', 'debug'].forEach(method => {
      console[method] = (...args) => {
        this[method](...args);
        // Still call original
        original[method](...args);
      };
    });
  }

  _emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[DevConsole] Error in event listener:', error);
        }
      });
    }
  }

  _loadHistory() {
    try {
      const stored = localStorage.getItem('devconsole-history');
      if (stored) {
        this.history = JSON.parse(stored);
        this.historyIndex = this.history.length;
      }
    } catch (error) {
      console.error('[DevConsole] Failed to load history:', error);
    }
  }

  _saveHistory() {
    try {
      // Keep only last 100 entries
      const toSave = this.history.slice(-100);
      localStorage.setItem('devconsole-history', JSON.stringify(toSave));
    } catch (error) {
      console.error('[DevConsole] Failed to save history:', error);
    }
  }
}

export default DevConsole;
