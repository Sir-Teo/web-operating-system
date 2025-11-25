/**
 * Security Audit System
 * Tracks and logs all security-relevant events for compliance and forensics
 */

import { createLogger } from '../kernel/Logger.js';

const logger = createLogger('SecurityAudit');

/**
 * Audit event severity levels
 */
export const AuditSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Audit event categories
 */
export const AuditCategory = {
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  PROCESS: 'process',
  FILESYSTEM: 'filesystem',
  NETWORK: 'network',
  MEMORY: 'memory',
  SYSCALL: 'syscall',
  POLICY: 'policy',
  CRYPTO: 'crypto',
  DEVICE: 'device',
  SYSTEM: 'system'
};

/**
 * Audit event
 */
export class AuditEvent {
  constructor(category, action, data = {}) {
    this.id = this.generateId();
    this.timestamp = Date.now();
    this.category = category;
    this.action = action;
    this.severity = data.severity || AuditSeverity.INFO;
    this.processId = data.processId || null;
    this.userId = data.userId || null;
    this.success = data.success !== false;
    this.data = data;
    this.stackTrace = data.includeStack ? new Error().stack : null;
  }

  generateId() {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      id: this.id,
      timestamp: this.timestamp,
      category: this.category,
      action: this.action,
      severity: this.severity,
      processId: this.processId,
      userId: this.userId,
      success: this.success,
      data: this.data,
      stackTrace: this.stackTrace
    };
  }

  static fromJSON(json) {
    const event = new AuditEvent(json.category, json.action, json.data);
    event.id = json.id;
    event.timestamp = json.timestamp;
    event.severity = json.severity;
    event.processId = json.processId;
    event.userId = json.userId;
    event.success = json.success;
    event.stackTrace = json.stackTrace;
    return event;
  }
}

/**
 * Security Audit System
 */
export class SecurityAuditSystem {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.maxEvents = options.maxEvents || 50000;
    this.persistEvents = options.persistEvents !== false;
    this.storageKey = options.storageKey || 'security-audit';
    this.alertOnCritical = options.alertOnCritical !== false;
    this.autoRotate = options.autoRotate !== false;
    this.rotateInterval = options.rotateInterval || 86400000; // 24 hours

    this.events = [];
    this.rotateTimer = null;
    this.lastRotation = Date.now();

    // Statistics
    this.stats = {
      totalEvents: 0,
      bySeverity: {
        [AuditSeverity.INFO]: 0,
        [AuditSeverity.WARNING]: 0,
        [AuditSeverity.ERROR]: 0,
        [AuditSeverity.CRITICAL]: 0
      },
      byCategory: {},
      failedEvents: 0,
      rotations: 0
    };

    // Alerts
    this.alertHandlers = new Set();

    logger.info('Security audit system initialized', {
      enabled: this.enabled,
      maxEvents: this.maxEvents,
      persistEvents: this.persistEvents
    });
  }

  /**
   * Start the audit system
   */
  async start() {
    // Load persisted events
    if (this.persistEvents) {
      await this.load();
    }

    // Start auto-rotation
    if (this.autoRotate) {
      this.startAutoRotate();
    }

    logger.info('Security audit system started');
  }

  /**
   * Stop the audit system
   */
  async stop() {
    // Stop auto-rotation
    this.stopAutoRotate();

    // Persist events
    if (this.persistEvents) {
      await this.persist();
    }

    logger.info('Security audit system stopped');
  }

  /**
   * Log an audit event
   */
  log(category, action, data = {}) {
    if (!this.enabled) return null;

    const event = new AuditEvent(category, action, data);

    // Add to events
    this.events.push(event);

    // Update statistics
    this.stats.totalEvents++;
    this.stats.bySeverity[event.severity]++;

    if (!this.stats.byCategory[category]) {
      this.stats.byCategory[category] = 0;
    }
    this.stats.byCategory[category]++;

    if (!event.success) {
      this.stats.failedEvents++;
    }

    // Trim if needed
    this.trimEvents();

    // Alert on critical
    if (event.severity === AuditSeverity.CRITICAL && this.alertOnCritical) {
      this.alert(event);
    }

    // Log to console
    logger.log(event.severity, `[AUDIT] ${category}:${action}`, event.data);

    // Persist if needed
    if (this.persistEvents) {
      this.persistAsync();
    }

    return event;
  }

  // Convenience methods for common audit events

  /**
   * Log authentication event
   */
  logAuth(action, userId, success = true, data = {}) {
    return this.log(AuditCategory.AUTHENTICATION, action, {
      userId,
      success,
      severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
      ...data
    });
  }

  /**
   * Log authorization event
   */
  logAuthz(action, processId, permission, granted, data = {}) {
    return this.log(AuditCategory.AUTHORIZATION, action, {
      processId,
      permission,
      granted,
      success: granted,
      severity: granted ? AuditSeverity.INFO : AuditSeverity.WARNING,
      ...data
    });
  }

  /**
   * Log process event
   */
  logProcess(action, processId, data = {}) {
    return this.log(AuditCategory.PROCESS, action, {
      processId,
      ...data
    });
  }

  /**
   * Log filesystem event
   */
  logFilesystem(action, path, processId, success = true, data = {}) {
    return this.log(AuditCategory.FILESYSTEM, action, {
      path,
      processId,
      success,
      ...data
    });
  }

  /**
   * Log network event
   */
  logNetwork(action, processId, data = {}) {
    return this.log(AuditCategory.NETWORK, action, {
      processId,
      ...data
    });
  }

  /**
   * Log memory event
   */
  logMemory(action, processId, data = {}) {
    return this.log(AuditCategory.MEMORY, action, {
      processId,
      ...data
    });
  }

  /**
   * Log system call event
   */
  logSyscall(syscallName, processId, success = true, data = {}) {
    return this.log(AuditCategory.SYSCALL, syscallName, {
      processId,
      success,
      severity: success ? AuditSeverity.INFO : AuditSeverity.ERROR,
      ...data
    });
  }

  /**
   * Log policy violation
   */
  logPolicyViolation(policy, processId, data = {}) {
    return this.log(AuditCategory.POLICY, 'violation', {
      policy,
      processId,
      success: false,
      severity: AuditSeverity.ERROR,
      ...data
    });
  }

  /**
   * Log critical security event
   */
  logCritical(category, action, data = {}) {
    return this.log(category, action, {
      severity: AuditSeverity.CRITICAL,
      includeStack: true,
      ...data
    });
  }

  /**
   * Trim events to max size
   */
  trimEvents() {
    if (this.events.length > this.maxEvents) {
      const toRemove = this.events.length - this.maxEvents;
      this.events.splice(0, toRemove);

      logger.debug('Audit events trimmed', {
        removed: toRemove,
        remaining: this.events.length
      });
    }
  }

  /**
   * Rotate audit log
   */
  async rotate() {
    if (this.events.length === 0) return;

    logger.info('Rotating audit log', {
      events: this.events.length
    });

    // Archive current events
    const archiveKey = `${this.storageKey}-${Date.now()}`;
    const archived = {
      events: this.events.map(e => e.toJSON()),
      stats: { ...this.stats },
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(archiveKey, JSON.stringify(archived));
      logger.info('Audit log archived', { key: archiveKey });
    } catch (error) {
      logger.error('Failed to archive audit log', { error });
    }

    // Clear current events
    this.events = [];

    // Reset some stats
    this.stats.bySeverity = {
      [AuditSeverity.INFO]: 0,
      [AuditSeverity.WARNING]: 0,
      [AuditSeverity.ERROR]: 0,
      [AuditSeverity.CRITICAL]: 0
    };
    this.stats.byCategory = {};
    this.stats.failedEvents = 0;
    this.stats.rotations++;

    this.lastRotation = Date.now();

    // Persist empty log
    if (this.persistEvents) {
      await this.persist();
    }
  }

  /**
   * Start auto-rotation
   */
  startAutoRotate() {
    if (this.rotateTimer) return;

    this.rotateTimer = setInterval(() => {
      this.rotate().catch(error => {
        logger.error('Auto-rotation failed', { error });
      });
    }, this.rotateInterval);

    logger.info('Auto-rotation started', {
      interval: this.rotateInterval
    });
  }

  /**
   * Stop auto-rotation
   */
  stopAutoRotate() {
    if (this.rotateTimer) {
      clearInterval(this.rotateTimer);
      this.rotateTimer = null;
      logger.info('Auto-rotation stopped');
    }
  }

  /**
   * Register alert handler
   */
  onAlert(handler) {
    this.alertHandlers.add(handler);
  }

  /**
   * Unregister alert handler
   */
  offAlert(handler) {
    this.alertHandlers.delete(handler);
  }

  /**
   * Send alert for critical event
   */
  alert(event) {
    logger.error('CRITICAL SECURITY EVENT', event.toJSON());

    for (const handler of this.alertHandlers) {
      try {
        handler(event);
      } catch (error) {
        logger.error('Alert handler failed', { error });
      }
    }
  }

  /**
   * Query audit events
   */
  query(filter = {}) {
    let events = this.events;

    if (filter.category) {
      events = events.filter(e => e.category === filter.category);
    }

    if (filter.action) {
      events = events.filter(e => e.action === filter.action);
    }

    if (filter.severity) {
      events = events.filter(e => e.severity === filter.severity);
    }

    if (filter.processId) {
      events = events.filter(e => e.processId === filter.processId);
    }

    if (filter.userId) {
      events = events.filter(e => e.userId === filter.userId);
    }

    if (filter.success !== undefined) {
      events = events.filter(e => e.success === filter.success);
    }

    if (filter.startTime) {
      events = events.filter(e => e.timestamp >= filter.startTime);
    }

    if (filter.endTime) {
      events = events.filter(e => e.timestamp <= filter.endTime);
    }

    if (filter.limit) {
      events = events.slice(-filter.limit);
    }

    return events.map(e => e.toJSON());
  }

  /**
   * Get recent events
   */
  getRecent(count = 100) {
    return this.events.slice(-count).map(e => e.toJSON());
  }

  /**
   * Get failed events
   */
  getFailed(count = 100) {
    return this.events
      .filter(e => !e.success)
      .slice(-count)
      .map(e => e.toJSON());
  }

  /**
   * Get critical events
   */
  getCritical(count = 100) {
    return this.events
      .filter(e => e.severity === AuditSeverity.CRITICAL)
      .slice(-count)
      .map(e => e.toJSON());
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      currentEvents: this.events.length,
      lastRotation: this.lastRotation
    };
  }

  /**
   * Persist events to storage
   */
  async persist() {
    try {
      const data = {
        events: this.events.map(e => e.toJSON()),
        stats: this.stats,
        lastRotation: this.lastRotation
      };

      localStorage.setItem(this.storageKey, JSON.stringify(data));

      logger.debug('Audit events persisted', {
        events: this.events.length
      });
    } catch (error) {
      logger.error('Failed to persist audit events', { error });
    }
  }

  /**
   * Async persist (debounced)
   */
  persistAsync() {
    if (this._persistTimer) {
      clearTimeout(this._persistTimer);
    }

    this._persistTimer = setTimeout(() => {
      this.persist();
      this._persistTimer = null;
    }, 1000);
  }

  /**
   * Load events from storage
   */
  async load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        logger.debug('No persisted audit events found');
        return;
      }

      const data = JSON.parse(raw);

      this.events = data.events.map(e => AuditEvent.fromJSON(e));
      this.stats = data.stats;
      this.lastRotation = data.lastRotation;

      logger.info('Audit events loaded', {
        events: this.events.length
      });
    } catch (error) {
      logger.error('Failed to load audit events', { error });
    }
  }

  /**
   * Export events
   */
  export(format = 'json') {
    const data = this.events.map(e => e.toJSON());

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);

      case 'csv':
        const headers = ['timestamp', 'category', 'action', 'severity', 'processId', 'userId', 'success'];
        const rows = data.map(e => [
          e.timestamp,
          e.category,
          e.action,
          e.severity,
          e.processId || '',
          e.userId || '',
          e.success
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');

      case 'text':
        return data.map(e =>
          `${new Date(e.timestamp).toISOString()} [${e.severity.toUpperCase()}] ${e.category}:${e.action} - ${JSON.stringify(e.data)}`
        ).join('\n');

      default:
        throw new Error(`Unknown export format: ${format}`);
    }
  }

  /**
   * Clear all events
   */
  async clear() {
    this.events = [];
    this.stats = {
      totalEvents: 0,
      bySeverity: {
        [AuditSeverity.INFO]: 0,
        [AuditSeverity.WARNING]: 0,
        [AuditSeverity.ERROR]: 0,
        [AuditSeverity.CRITICAL]: 0
      },
      byCategory: {},
      failedEvents: 0,
      rotations: 0
    };

    if (this.persistEvents) {
      await this.persist();
    }

    logger.info('Audit events cleared');
  }

  /**
   * Enable/disable audit system
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    logger.info(`Audit system ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Dispose
   */
  async dispose() {
    await this.stop();
    this.events = [];
    this.alertHandlers.clear();
    logger.info('Security audit system disposed');
  }
}

/**
 * Create singleton instance
 */
let auditInstance = null;

/**
 * Get the global security audit system
 */
export function getSecurityAudit() {
  if (!auditInstance) {
    auditInstance = new SecurityAuditSystem();
  }
  return auditInstance;
}

/**
 * Initialize audit system with custom options
 */
export function initSecurityAudit(options = {}) {
  if (auditInstance) {
    logger.warn('Security audit system already initialized');
    return auditInstance;
  }
  auditInstance = new SecurityAuditSystem(options);
  return auditInstance;
}

export default {
  SecurityAuditSystem,
  AuditEvent,
  AuditSeverity,
  AuditCategory,
  getSecurityAudit,
  initSecurityAudit
};
