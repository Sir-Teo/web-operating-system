/**
 * WebOS Logging System
 * Provides unified, configurable logging across the OS
 */

/**
 * Log levels in order of severity
 */
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
  NONE: 999
};

/**
 * Log level names
 */
export const LogLevelNames = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL'
};

/**
 * Log level colors for console output
 */
const LogLevelColors = {
  [LogLevel.DEBUG]: '#888',
  [LogLevel.INFO]: '#0070f3',
  [LogLevel.WARN]: '#f5a623',
  [LogLevel.ERROR]: '#e00',
  [LogLevel.FATAL]: '#fff'
};

const LogLevelBackgrounds = {
  [LogLevel.DEBUG]: 'transparent',
  [LogLevel.INFO]: 'transparent',
  [LogLevel.WARN]: 'transparent',
  [LogLevel.ERROR]: 'transparent',
  [LogLevel.FATAL]: '#e00'
};

/**
 * Log transport interface
 */
export class LogTransport {
  constructor(name, minLevel = LogLevel.DEBUG) {
    this.name = name;
    this.minLevel = minLevel;
    this.enabled = true;
  }

  shouldLog(level) {
    return this.enabled && level >= this.minLevel;
  }

  log(entry) {
    throw new Error('LogTransport.log() must be implemented by subclass');
  }
}

/**
 * Console transport
 */
export class ConsoleTransport extends LogTransport {
  constructor(minLevel = LogLevel.DEBUG, options = {}) {
    super('console', minLevel);
    this.colored = options.colored !== false;
    this.showTimestamp = options.showTimestamp !== false;
    this.showComponent = options.showComponent !== false;
  }

  log(entry) {
    if (!this.shouldLog(entry.level)) return;

    const parts = [];
    const styles = [];

    // Timestamp
    if (this.showTimestamp) {
      const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      });
      parts.push(`[${time}]`);
      styles.push('color: #666; font-weight: normal;');
    }

    // Level
    const levelName = LogLevelNames[entry.level] || 'UNKNOWN';
    parts.push(`[${levelName}]`);
    if (this.colored) {
      const color = LogLevelColors[entry.level] || '#000';
      const bg = LogLevelBackgrounds[entry.level] || 'transparent';
      styles.push(`color: ${color}; background: ${bg}; font-weight: bold;`);
    } else {
      styles.push('font-weight: bold;');
    }

    // Component
    if (this.showComponent && entry.component) {
      parts.push(`[${entry.component}]`);
      styles.push('color: #0a0; font-weight: normal;');
    }

    // Process ID
    if (entry.pid) {
      parts.push(`[PID:${entry.pid.slice(0, 8)}]`);
      styles.push('color: #07c; font-weight: normal;');
    }

    // Message
    parts.push(entry.message);
    styles.push('color: inherit; font-weight: normal;');

    // Format for console
    const format = parts.map(() => '%c').join('') + '%c';
    const args = [format, ...styles, 'color: inherit;', ...entry.args];

    // Output based on level
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(...args);
        break;
      case LogLevel.INFO:
        console.info(...args);
        break;
      case LogLevel.WARN:
        console.warn(...args);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(...args);
        if (entry.error) {
          console.error(entry.error);
        }
        break;
      default:
        console.log(...args);
    }
  }
}

/**
 * Memory transport - stores logs in memory
 */
export class MemoryTransport extends LogTransport {
  constructor(minLevel = LogLevel.DEBUG, maxEntries = 1000) {
    super('memory', minLevel);
    this.entries = [];
    this.maxEntries = maxEntries;
  }

  log(entry) {
    if (!this.shouldLog(entry.level)) return;

    this.entries.push(entry);

    // Trim if exceeds max
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  getEntries(filter = {}) {
    let entries = this.entries;

    if (filter.level !== undefined) {
      entries = entries.filter(e => e.level >= filter.level);
    }

    if (filter.component) {
      entries = entries.filter(e => e.component === filter.component);
    }

    if (filter.pid) {
      entries = entries.filter(e => e.pid === filter.pid);
    }

    if (filter.since) {
      entries = entries.filter(e => e.timestamp >= filter.since);
    }

    return entries;
  }

  clear() {
    this.entries = [];
  }
}

/**
 * File transport - writes logs to VFS
 */
export class FileTransport extends LogTransport {
  constructor(fs, path, minLevel = LogLevel.INFO, options = {}) {
    super('file', minLevel);
    this.fs = fs;
    this.path = path;
    this.maxSize = options.maxSize || 1024 * 1024; // 1MB default
    this.buffer = [];
    this.bufferSize = options.bufferSize || 100;
    this.flushInterval = options.flushInterval || 5000; // 5s
    this.lastFlush = Date.now();

    // Auto-flush periodically
    if (this.flushInterval > 0) {
      this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
    }
  }

  log(entry) {
    if (!this.shouldLog(entry.level)) return;

    const line = this.formatEntry(entry);
    this.buffer.push(line);

    // Auto-flush if buffer full
    if (this.buffer.length >= this.bufferSize) {
      this.flush();
    }
  }

  formatEntry(entry) {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = LogLevelNames[entry.level] || 'UNKNOWN';
    const component = entry.component || 'system';
    const pid = entry.pid ? ` [${entry.pid.slice(0, 8)}]` : '';
    const message = entry.message;
    const args = entry.args.length > 0 ? ' ' + JSON.stringify(entry.args) : '';
    const error = entry.error ? `\n${entry.error.stack || entry.error}` : '';

    return `${timestamp} [${level}] [${component}]${pid} ${message}${args}${error}\n`;
  }

  async flush() {
    if (this.buffer.length === 0) return;

    const lines = this.buffer.join('');
    this.buffer = [];

    try {
      // Check file size and rotate if needed
      let content = '';
      try {
        const stat = await this.fs.stat(this.path);
        if (stat.size > this.maxSize) {
          // Rotate: rename current to .old
          const oldPath = `${this.path}.old`;
          if (await this.fs.exists(oldPath)) {
            await this.fs.rm(oldPath);
          }
          await this.fs.rename(this.path, oldPath);
        } else {
          content = await this.fs.readFile(this.path, { encoding: 'utf-8' });
        }
      } catch (err) {
        // File doesn't exist yet, that's fine
      }

      await this.fs.writeFile(this.path, content + lines, { encoding: 'utf-8' });
      this.lastFlush = Date.now();
    } catch (err) {
      console.error('Failed to write log file:', err);
    }
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

/**
 * Logger class
 */
export class Logger {
  constructor(component, options = {}) {
    this.component = component;
    this.pid = options.pid || null;
    this.minLevel = options.minLevel !== undefined ? options.minLevel : LogLevel.DEBUG;
    this.transports = options.transports || [];
    this.enabled = options.enabled !== false;
    this.context = options.context || {};
  }

  /**
   * Create a child logger with additional context
   */
  child(context = {}) {
    return new Logger(this.component, {
      pid: this.pid,
      minLevel: this.minLevel,
      transports: this.transports,
      enabled: this.enabled,
      context: { ...this.context, ...context }
    });
  }

  /**
   * Set process ID for this logger
   */
  setProcessId(pid) {
    this.pid = pid;
    return this;
  }

  /**
   * Add a transport
   */
  addTransport(transport) {
    this.transports.push(transport);
    return this;
  }

  /**
   * Remove a transport
   */
  removeTransport(name) {
    this.transports = this.transports.filter(t => t.name !== name);
    return this;
  }

  /**
   * Log a message
   */
  log(level, message, ...args) {
    if (!this.enabled || level < this.minLevel) return;

    const entry = {
      timestamp: Date.now(),
      level,
      component: this.component,
      pid: this.pid,
      message,
      args: args.filter(arg => !(arg instanceof Error)),
      error: args.find(arg => arg instanceof Error),
      context: this.context
    };

    for (const transport of this.transports) {
      try {
        transport.log(entry);
      } catch (err) {
        console.error(`Transport ${transport.name} failed:`, err);
      }
    }
  }

  /**
   * Convenience methods
   */
  debug(message, ...args) {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message, ...args) {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message, ...args) {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message, ...args) {
    this.log(LogLevel.ERROR, message, ...args);
  }

  fatal(message, ...args) {
    this.log(LogLevel.FATAL, message, ...args);
  }

  /**
   * Performance timing
   */
  time(label) {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.debug(`${label}: ${duration.toFixed(2)}ms`);
      return duration;
    };
  }

  /**
   * Group logging
   */
  group(label) {
    console.group(`[${this.component}] ${label}`);
    return () => console.groupEnd();
  }

  /**
   * Table logging
   */
  table(data, columns) {
    if (this.minLevel <= LogLevel.DEBUG) {
      console.table(data, columns);
    }
  }
}

/**
 * Global logger manager
 */
export class LoggerManager {
  constructor() {
    this.loggers = new Map();
    this.globalTransports = [
      new ConsoleTransport(LogLevel.DEBUG, {
        colored: true,
        showTimestamp: true,
        showComponent: true
      })
    ];
    this.globalMinLevel = LogLevel.DEBUG;
    this.componentLevels = new Map();
  }

  /**
   * Get or create a logger for a component
   */
  getLogger(component, options = {}) {
    if (!this.loggers.has(component)) {
      const logger = new Logger(component, {
        ...options,
        minLevel: this.componentLevels.get(component) || this.globalMinLevel,
        transports: [...this.globalTransports, ...(options.transports || [])]
      });
      this.loggers.set(component, logger);
    }
    return this.loggers.get(component);
  }

  /**
   * Set global minimum log level
   */
  setGlobalLevel(level) {
    this.globalMinLevel = level;
    for (const logger of this.loggers.values()) {
      logger.minLevel = this.componentLevels.get(logger.component) || level;
    }
  }

  /**
   * Set log level for specific component
   */
  setComponentLevel(component, level) {
    this.componentLevels.set(component, level);
    const logger = this.loggers.get(component);
    if (logger) {
      logger.minLevel = level;
    }
  }

  /**
   * Add a global transport
   */
  addGlobalTransport(transport) {
    this.globalTransports.push(transport);
    for (const logger of this.loggers.values()) {
      logger.addTransport(transport);
    }
  }

  /**
   * Remove a global transport
   */
  removeGlobalTransport(name) {
    this.globalTransports = this.globalTransports.filter(t => t.name !== name);
    for (const logger of this.loggers.values()) {
      logger.removeTransport(name);
    }
  }

  /**
   * Get all loggers
   */
  getAllLoggers() {
    return Array.from(this.loggers.values());
  }

  /**
   * Clear all loggers
   */
  clear() {
    this.loggers.clear();
  }
}

// Create singleton instance
const loggerManager = new LoggerManager();

/**
 * Create a logger instance
 */
export function createLogger(component, options = {}) {
  return loggerManager.getLogger(component, options);
}

/**
 * Get the global logger manager
 */
export function getLoggerManager() {
  return loggerManager;
}

export default {
  Logger,
  LogLevel,
  LogLevelNames,
  ConsoleTransport,
  MemoryTransport,
  FileTransport,
  LoggerManager,
  createLogger,
  getLoggerManager
};
