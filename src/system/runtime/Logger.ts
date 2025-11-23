/**
 * Logging System for Runtime
 * Provides structured logging with levels, categories, and persistence
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export enum LogCategory {
  RUNTIME = 'runtime',
  EXECUTION = 'execution',
  PACKAGE = 'package',
  CACHE = 'cache',
  RESOURCE = 'resource',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  stackTrace?: string;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs: number = 10000;
  private minLevel: LogLevel = LogLevel.INFO;
  private listeners: Set<(entry: LogEntry) => void> = new Set();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  setMaxLogs(max: number): void {
    this.maxLogs = max;
    this.trimLogs();
  }

  addListener(listener: (entry: LogEntry) => void): void {
    this.listeners.add(listener);
  }

  removeListener(listener: (entry: LogEntry) => void): void {
    this.listeners.delete(listener);
  }

  private log(level: LogLevel, category: LogCategory, message: string, data?: any): void {
    if (level < this.minLevel) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
      stackTrace: level >= LogLevel.ERROR ? new Error().stack : undefined,
    };

    this.logs.push(entry);
    this.trimLogs();
    this.notifyListeners(entry);

    // Console output
    const prefix = `[${LogLevel[level]}] [${category}]`;
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, data);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, data);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, data);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(prefix, message, data);
        break;
    }
  }

  debug(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  info(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  warn(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  error(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.ERROR, category, message, data);
  }

  critical(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.CRITICAL, category, message, data);
  }

  private notifyListeners(entry: LogEntry): void {
    this.listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (error) {
        console.error('Error in log listener:', error);
      }
    });
  }

  private trimLogs(): void {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  getLogs(filter?: {
    level?: LogLevel;
    category?: LogCategory;
    since?: number;
    limit?: number;
  }): LogEntry[] {
    let filtered = [...this.logs];

    if (filter) {
      if (filter.level !== undefined) {
        filtered = filtered.filter(log => log.level >= filter.level!);
      }
      if (filter.category) {
        filtered = filtered.filter(log => log.category === filter.category);
      }
      if (filter.since) {
        filtered = filtered.filter(log => log.timestamp >= filter.since!);
      }
      if (filter.limit) {
        filtered = filtered.slice(-filter.limit);
      }
    }

    return filtered;
  }

  clear(): void {
    this.logs = [];
    localStorage.removeItem('webos.runtime.logs');
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('webos.runtime.logs');
      if (stored) {
        this.logs = JSON.parse(stored);
        this.trimLogs();
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  }

  saveToStorage(): void {
    try {
      // Save only last 100 logs to avoid storage issues
      const toSave = this.logs.slice(-100);
      localStorage.setItem('webos.runtime.logs', JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }

  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  getStats(): {
    total: number;
    byLevel: Record<string, number>;
    byCategory: Record<string, number>;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
    };

    this.logs.forEach(log => {
      const levelName = LogLevel[log.level];
      stats.byLevel[levelName] = (stats.byLevel[levelName] || 0) + 1;
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
    });

    return stats;
  }
}

export default Logger;
