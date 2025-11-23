/**
 * Cache Manager for Runtime System
 * Provides intelligent caching for runtimes, packages, and execution results
 */

import Logger, { LogCategory } from './Logger';
import ConfigurationManager from './ConfigurationManager';

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  size: number;
  hits: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  oldestEntry: number;
  newestEntry: number;
}

class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheEntry> = new Map();
  private logger: Logger;
  private config: ConfigurationManager;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  private constructor() {
    this.logger = Logger.getInstance();
    this.config = ConfigurationManager.getInstance();
    this.loadFromStorage();
    this.startCleanupTimer();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private estimateSize(value: any): number {
    try {
      const json = JSON.stringify(value);
      return new Blob([json]).size;
    } catch {
      return 1024; // Default estimate
    }
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    try {
      const config = this.config.getAll();
      const cacheTTL = ttl || config.cacheTTL;
      const size = this.estimateSize(value);

      // Check size limit
      if (size > config.maxCacheSize) {
        this.logger.warn(LogCategory.CACHE, `Item too large for cache: ${key}`, { size });
        return false;
      }

      // Evict if necessary
      while (this.getTotalSize() + size > config.maxCacheSize) {
        this.evictLRU();
      }

      const entry: CacheEntry<T> = {
        key,
        value,
        timestamp: Date.now(),
        ttl: cacheTTL,
        size,
        hits: 0,
        lastAccessed: Date.now(),
      };

      this.cache.set(key, entry);
      this.logger.debug(LogCategory.CACHE, `Cached item: ${key}`, { size, ttl: cacheTTL });

      return true;
    } catch (error) {
      this.logger.error(LogCategory.CACHE, `Failed to cache item: ${key}`, error);
      return false;
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.logger.debug(LogCategory.CACHE, `Cache miss: ${key}`);
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.logger.debug(LogCategory.CACHE, `Cache expired: ${key}`);
      return null;
    }

    // Update access stats
    entry.hits++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    this.logger.debug(LogCategory.CACHE, `Cache hit: ${key}`, { hits: entry.hits });
    return entry.value as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug(LogCategory.CACHE, `Deleted cache entry: ${key}`);
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
    this.logger.info(LogCategory.CACHE, 'Cache cleared');
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      this.logger.debug(LogCategory.CACHE, `Evicted LRU entry: ${oldestKey}`);
    }
  }

  private getTotalSize(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      total += entry.size;
    }
    return total;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.info(LogCategory.CACHE, `Cleaned ${cleaned} expired entries`);
    }
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpired();
      this.saveToStorage();
    }, 60000); // Clean every minute
  }

  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalSize = this.getTotalSize();
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    return {
      totalEntries: this.cache.size,
      totalSize,
      hitRate,
      missRate: 1 - hitRate,
      evictions: this.stats.evictions,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : 0,
    };
  }

  getTopItems(limit: number = 10): Array<{ key: string; hits: number; size: number }> {
    const entries = Array.from(this.cache.entries());
    return entries
      .sort((a, b) => b[1].hits - a[1].hits)
      .slice(0, limit)
      .map(([key, entry]) => ({
        key,
        hits: entry.hits,
        size: entry.size,
      }));
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('webos.runtime.cache');
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(data.entries);
        this.stats = data.stats || this.stats;
        this.cleanupExpired(); // Clean on load
        this.logger.info(LogCategory.CACHE, 'Cache loaded from storage', {
          entries: this.cache.size,
        });
      }
    } catch (error) {
      this.logger.error(LogCategory.CACHE, 'Failed to load cache from storage', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        entries: Array.from(this.cache.entries()),
        stats: this.stats,
      };
      localStorage.setItem('webos.runtime.cache', JSON.stringify(data));
    } catch (error) {
      this.logger.warn(LogCategory.CACHE, 'Failed to save cache to storage', error);
    }
  }

  // Specialized cache methods
  cachePackage(language: string, packageName: string, data: any): boolean {
    return this.set(`package:${language}:${packageName}`, data, 86400000); // 24 hours
  }

  getPackage(language: string, packageName: string): any {
    return this.get(`package:${language}:${packageName}`);
  }

  cacheRuntime(language: string, data: any): boolean {
    return this.set(`runtime:${language}`, data, 3600000); // 1 hour
  }

  getRuntime(language: string): any {
    return this.get(`runtime:${language}`);
  }

  cacheExecutionResult(hash: string, result: any, ttl: number = 300000): boolean {
    return this.set(`execution:${hash}`, result, ttl); // 5 minutes default
  }

  getExecutionResult(hash: string): any {
    return this.get(`execution:${hash}`);
  }
}

export default CacheManager;
