/**
 * SecurityAuditLogger - Security Event Logging and Monitoring
 *
 * Tracks and logs security-related events:
 * - Authentication attempts
 * - Permission changes
 * - Data access
 * - System changes
 * - Security violations
 */

import EventEmitter from '../utils/EventEmitter.js';

class SecurityAuditLogger extends EventEmitter {
  constructor() {
    super();

    this.logs = [];
    this.maxLogs = 10000;
    this.alertThresholds = {
      failedLogins: 5,
      timeWindow: 5 * 60 * 1000 // 5 minutes
    };

    console.log('[SecurityAudit] Initialized');
  }

  /**
   * Log a security event
   */
  log(event) {
    const logEntry = {
      id: this._generateId(),
      timestamp: Date.now(),
      type: event.type,
      severity: event.severity || 'info',
      category: event.category || 'general',
      action: event.action,
      user: event.user || 'system',
      resource: event.resource || null,
      details: event.details || {},
      ip: this._getClientIP(),
      userAgent: navigator.userAgent,
      success: event.success !== false
    };

    this.logs.push(logEntry);

    // Trim old logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Emit event
    this.emit('log-entry', logEntry);

    // Check for suspicious activity
    this._checkSecurityAlerts(logEntry);

    // Log to console for high severity
    if (logEntry.severity === 'critical' || logEntry.severity === 'high') {
      console.warn('[SecurityAudit]', logEntry);
    }

    return logEntry.id;
  }

  /**
   * Log authentication event
   */
  logAuth(action, user, success, details = {}) {
    return this.log({
      type: 'authentication',
      category: 'auth',
      severity: success ? 'info' : 'medium',
      action,
      user,
      success,
      details
    });
  }

  /**
   * Log authorization event
   */
  logAuthorization(action, user, resource, granted, details = {}) {
    return this.log({
      type: 'authorization',
      category: 'access',
      severity: granted ? 'info' : 'medium',
      action,
      user,
      resource,
      success: granted,
      details
    });
  }

  /**
   * Log data access
   */
  logDataAccess(action, user, resource, details = {}) {
    return this.log({
      type: 'data-access',
      category: 'data',
      severity: 'info',
      action,
      user,
      resource,
      details
    });
  }

  /**
   * Log system change
   */
  logSystemChange(action, user, details = {}) {
    return this.log({
      type: 'system-change',
      category: 'system',
      severity: 'medium',
      action,
      user,
      details
    });
  }

  /**
   * Log security violation
   */
  logViolation(action, user, details = {}) {
    return this.log({
      type: 'security-violation',
      category: 'security',
      severity: 'high',
      action,
      user,
      success: false,
      details
    });
  }

  /**
   * Log critical security event
   */
  logCritical(action, user, details = {}) {
    return this.log({
      type: 'critical-event',
      category: 'security',
      severity: 'critical',
      action,
      user,
      details
    });
  }

  /**
   * Get logs with filters
   */
  getLogs(filters = {}) {
    let logs = [...this.logs];

    // Filter by type
    if (filters.type) {
      logs = logs.filter(log => log.type === filters.type);
    }

    // Filter by category
    if (filters.category) {
      logs = logs.filter(log => log.category === filters.category);
    }

    // Filter by severity
    if (filters.severity) {
      logs = logs.filter(log => log.severity === filters.severity);
    }

    // Filter by user
    if (filters.user) {
      logs = logs.filter(log => log.user === filters.user);
    }

    // Filter by success
    if (filters.success !== undefined) {
      logs = logs.filter(log => log.success === filters.success);
    }

    // Filter by time range
    if (filters.startTime) {
      logs = logs.filter(log => log.timestamp >= filters.startTime);
    }

    if (filters.endTime) {
      logs = logs.filter(log => log.timestamp <= filters.endTime);
    }

    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      logs = logs.filter(log =>
        log.action.toLowerCase().includes(searchLower) ||
        (log.resource && log.resource.toLowerCase().includes(searchLower)) ||
        JSON.stringify(log.details).toLowerCase().includes(searchLower)
      );
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp - a.timestamp);

    // Limit results
    if (filters.limit) {
      logs = logs.slice(0, filters.limit);
    }

    return logs;
  }

  /**
   * Get security statistics
   */
  getStatistics(timeWindow = 24 * 60 * 60 * 1000) {
    const since = Date.now() - timeWindow;
    const recentLogs = this.logs.filter(log => log.timestamp >= since);

    const stats = {
      total: recentLogs.length,
      byType: {},
      bySeverity: {},
      byCategory: {},
      failedAttempts: 0,
      successfulAttempts: 0,
      uniqueUsers: new Set(),
      topActions: {},
      timeline: []
    };

    recentLogs.forEach(log => {
      // By type
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;

      // By severity
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;

      // By category
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;

      // Success/failure
      if (log.success) {
        stats.successfulAttempts++;
      } else {
        stats.failedAttempts++;
      }

      // Unique users
      stats.uniqueUsers.add(log.user);

      // Top actions
      stats.topActions[log.action] = (stats.topActions[log.action] || 0) + 1;
    });

    stats.uniqueUsers = stats.uniqueUsers.size;

    // Convert topActions to sorted array
    stats.topActions = Object.entries(stats.topActions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));

    return stats;
  }

  /**
   * Get recent failed login attempts for a user
   */
  getRecentFailedLogins(user, timeWindow = this.alertThresholds.timeWindow) {
    const since = Date.now() - timeWindow;

    return this.logs.filter(log =>
      log.user === user &&
      log.type === 'authentication' &&
      !log.success &&
      log.timestamp >= since
    );
  }

  /**
   * Check for security alerts
   */
  _checkSecurityAlerts(logEntry) {
    // Check for excessive failed logins
    if (logEntry.type === 'authentication' && !logEntry.success) {
      const recentFailures = this.getRecentFailedLogins(logEntry.user);

      if (recentFailures.length >= this.alertThresholds.failedLogins) {
        this.emit('security-alert', {
          type: 'excessive-failed-logins',
          user: logEntry.user,
          count: recentFailures.length,
          timeWindow: this.alertThresholds.timeWindow
        });

        console.warn('[SecurityAudit] ALERT: Excessive failed logins for user:', logEntry.user);
      }
    }

    // Check for security violations
    if (logEntry.type === 'security-violation') {
      this.emit('security-alert', {
        type: 'security-violation',
        action: logEntry.action,
        user: logEntry.user,
        details: logEntry.details
      });
    }

    // Check for critical events
    if (logEntry.severity === 'critical') {
      this.emit('security-alert', {
        type: 'critical-event',
        action: logEntry.action,
        user: logEntry.user,
        details: logEntry.details
      });
    }
  }

  /**
   * Generate a security report
   */
  generateReport(timeWindow = 24 * 60 * 60 * 1000) {
    const stats = this.getStatistics(timeWindow);
    const since = Date.now() - timeWindow;

    const report = {
      generatedAt: Date.now(),
      timeWindow,
      period: {
        start: since,
        end: Date.now()
      },
      summary: {
        totalEvents: stats.total,
        successRate: stats.total > 0 ?
          ((stats.successfulAttempts / stats.total) * 100).toFixed(2) : 0,
        failureRate: stats.total > 0 ?
          ((stats.failedAttempts / stats.total) * 100).toFixed(2) : 0,
        uniqueUsers: stats.uniqueUsers
      },
      byType: stats.byType,
      bySeverity: stats.bySeverity,
      byCategory: stats.byCategory,
      topActions: stats.topActions,
      alerts: this._getAlertsInTimeWindow(timeWindow),
      recommendations: this._generateRecommendations(stats)
    };

    return report;
  }

  /**
   * Get alerts in time window
   */
  _getAlertsInTimeWindow(timeWindow) {
    // This would track alerts separately in a real implementation
    // For now, return critical/high severity events
    const since = Date.now() - timeWindow;

    return this.logs
      .filter(log =>
        log.timestamp >= since &&
        (log.severity === 'critical' || log.severity === 'high')
      )
      .map(log => ({
        timestamp: log.timestamp,
        type: log.type,
        action: log.action,
        user: log.user,
        severity: log.severity
      }));
  }

  /**
   * Generate security recommendations
   */
  _generateRecommendations(stats) {
    const recommendations = [];

    // High failure rate
    if (stats.failedAttempts > stats.successfulAttempts) {
      recommendations.push({
        severity: 'medium',
        message: 'High authentication failure rate detected',
        suggestion: 'Review failed login attempts and consider implementing additional security measures'
      });
    }

    // Many critical events
    if ((stats.bySeverity.critical || 0) > 0) {
      recommendations.push({
        severity: 'high',
        message: `${stats.bySeverity.critical} critical security events detected`,
        suggestion: 'Immediate investigation required'
      });
    }

    // Many violations
    if ((stats.byType['security-violation'] || 0) > 5) {
      recommendations.push({
        severity: 'medium',
        message: 'Multiple security violations detected',
        suggestion: 'Review access controls and user permissions'
      });
    }

    return recommendations;
  }

  /**
   * Get client IP (simulated)
   */
  _getClientIP() {
    // In a real implementation, this would come from the server
    return 'local';
  }

  /**
   * Generate unique ID
   */
  _generateId() {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export logs
   */
  exportLogs(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    } else if (format === 'csv') {
      return this._exportCSV();
    }

    throw new Error('Unsupported export format');
  }

  /**
   * Export as CSV
   */
  _exportCSV() {
    const headers = ['Timestamp', 'Type', 'Severity', 'Category', 'Action', 'User', 'Resource', 'Success'];
    const rows = this.logs.map(log => [
      new Date(log.timestamp).toISOString(),
      log.type,
      log.severity,
      log.category,
      log.action,
      log.user,
      log.resource || '',
      log.success
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  /**
   * Import logs
   */
  importLogs(jsonData) {
    try {
      const logs = JSON.parse(jsonData);

      if (Array.isArray(logs)) {
        this.logs = logs;
        console.log('[SecurityAudit] Imported', logs.length, 'log entries');
      }
    } catch (error) {
      console.error('[SecurityAudit] Failed to import logs:', error);
      throw new Error('Invalid log data');
    }
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    this.emit('logs-cleared');
    console.log('[SecurityAudit] All logs cleared');
  }
}

// Singleton instance
const securityAuditLogger = new SecurityAuditLogger();

export default securityAuditLogger;
export { SecurityAuditLogger };
