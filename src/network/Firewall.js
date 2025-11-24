/**
 * Firewall.js
 *
 * Virtual firewall for network security.
 * Manages rules for allowing/blocking network traffic.
 */

export class Firewall {
  constructor() {
    this.enabled = true;
    this.rules = [];
    this.defaultPolicy = 'allow'; // 'allow' or 'deny'
    this.logEnabled = true;
    this.logs = [];
    this.maxLogs = 1000;
    this.statistics = { allowed: 0, blocked: 0 };

    // Add default safe rules
    this._initializeDefaultRules();
  }

  /**
   * Check if a request should be allowed
   * @param {string} url - URL or hostname
   * @param {Object} options - Request options
   * @returns {boolean} Whether request is allowed
   */
  allow(url, options = {}) {
    if (!this.enabled) {
      return true;
    }

    const urlObj = this._parseURL(url);
    const evaluation = this._evaluateRules(urlObj, options);
    const decision = evaluation.allowed;

    if (decision) {
      this.statistics.allowed += 1;
    } else {
      this.statistics.blocked += 1;
    }

    if (this.logEnabled && evaluation.shouldLog) {
      this._log({
        timestamp: Date.now(),
        url,
        hostname: urlObj.hostname,
        port: urlObj.port,
        protocol: urlObj.protocol,
        action: decision ? 'allow' : 'deny',
        method: options.method || 'GET'
      });
    }

    return decision;
  }

  /**
   * Add a firewall rule
   * @param {Object} rule - Firewall rule
   */
  addRule(rule) {
    const validatedRule = this._validateRule(rule);
    this.rules.push(validatedRule);
    return validatedRule.id;
  }

  /**
   * Remove a firewall rule
   * @param {string} ruleId - Rule ID
   * @returns {boolean} Whether rule was removed
   */
  removeRule(ruleId) {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index >= 0) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all firewall rules
   * @returns {Array} List of rules
   */
  getRules() {
    return [...this.rules]
      .sort((a, b) => b.priority - a.priority)
      .map(rule => ({ ...rule }));
  }

  /**
   * Clear all rules
   */
  clearRules() {
    this.rules = [];
  }

  /**
   * Enable default safe rules
   */
  enableDefaultRules() {
    this._initializeDefaultRules(true);
  }

  /**
   * Enable firewall
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable firewall
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Get firewall status
   * @returns {Object} Firewall status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      defaultPolicy: this.defaultPolicy,
      ruleCount: this.rules.length,
      logEnabled: this.logEnabled,
      logCount: this.logs.length,
      statistics: { ...this.statistics }
    };
  }

  /**
   * Get firewall logs
   * @param {number} limit - Maximum number of logs to return
   * @returns {Array} Recent logs
   */
  getLogs(limit = 100) {
    return this.logs.slice(-limit).reverse();
  }

  /**
   * Clear firewall logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Get usage statistics
   */
  getStatistics() {
    return { ...this.statistics };
  }

  /**
   * Reset usage statistics
   */
  resetStatistics() {
    this.statistics = { allowed: 0, blocked: 0 };
  }

  /**
   * Block a hostname
   * @param {string} hostname - Hostname to block
   * @param {string} reason - Reason for blocking
   */
  blockHostname(hostname, reason = '') {
    this.addRule({
      type: 'hostname',
      pattern: hostname,
      action: 'deny',
      reason,
      enabled: true
    });
  }

  /**
   * Allow a hostname
   * @param {string} hostname - Hostname to allow
   * @param {string} reason - Reason for allowing
   */
  allowHostname(hostname, reason = '') {
    this.addRule({
      type: 'hostname',
      pattern: hostname,
      action: 'allow',
      reason,
      enabled: true
    });
  }

  /**
   * Block a port
   * @param {number} port - Port to block
   * @param {string} protocol - Protocol (tcp/udp/all)
   */
  blockPort(port, protocol = 'all') {
    this.addRule({
      type: 'port',
      port,
      protocol,
      action: 'deny',
      enabled: true
    });
  }

  /**
   * Allow a port
   * @param {number} port - Port to allow
   * @param {string} protocol - Protocol (tcp/udp/all)
   */
  allowPort(port, protocol = 'all') {
    this.addRule({
      type: 'port',
      port,
      protocol,
      action: 'allow',
      enabled: true
    });
  }

  /**
   * Initialize default firewall rules
   * @private
   */
  _initializeDefaultRules(reset = false) {
    if (reset) {
      this.rules = [];
    }

    // Allow common web ports
    this.rules.push({
      id: 'default-http',
      type: 'port',
      port: 80,
      protocol: 'tcp',
      action: 'allow',
      enabled: true,
      priority: 1,
      reason: 'Default HTTP access'
    });

    this.rules.push({
      id: 'default-https',
      type: 'port',
      port: 443,
      protocol: 'tcp',
      action: 'allow',
      enabled: true,
      priority: 1,
      reason: 'Default HTTPS access'
    });

    // Block known malicious patterns
    this.rules.push({
      id: 'block-malware',
      type: 'pattern',
      pattern: /malware|virus|trojan|phishing/i,
      action: 'deny',
      enabled: true,
      priority: 1,
      reason: 'Block known malicious patterns'
    });
  }

  /**
   * Validate a firewall rule
   * @private
   */
  _validateRule(rule) {
    // Infer type if not provided
    const inferredType = rule.type ||
      (rule.hostname ? 'hostname' : null) ||
      (rule.port ? 'port' : null) ||
      (rule.protocol ? 'protocol' : null) ||
      (rule.pattern ? 'pattern' : null) ||
      (rule.method ? 'method' : null);

    if (!inferredType) {
      throw new Error('Rule must have a type');
    }

    // Normalize hostname/pattern fields
    let normalizedRule = { ...rule, type: inferredType };

    if (rule.hostname && !rule.pattern) {
      normalizedRule.pattern = rule.hostname;
    }

    if (!normalizedRule.action || !['allow', 'deny'].includes(normalizedRule.action)) {
      throw new Error('Rule action must be "allow" or "deny"');
    }

    return {
      id: normalizedRule.id || `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: normalizedRule.type,
      action: normalizedRule.action,
      enabled: normalizedRule.enabled !== false,
      priority: normalizedRule.priority ?? 100,
      reason: normalizedRule.reason || '',
      created: Date.now(),
      ...normalizedRule
    };
  }

  /**
   * Evaluate rules against a request
   * @private
   */
  _evaluateRules(urlObj, options) {
    // Sort rules by priority (lower number = higher priority)
    const sortedRules = [...this.rules]
      .filter(r => r.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      const matches = this._ruleMatches(rule, urlObj, options);

      if (matches) {
        return { allowed: rule.action === 'allow', shouldLog: rule.log !== false };
      }
    }

    // No matching rule, use default policy
    return { allowed: this.defaultPolicy === 'allow', shouldLog: false };
  }

  /**
   * Check if a rule matches a request
   * @private
   */
  _ruleMatches(rule, urlObj, options) {
    switch (rule.type) {
      case 'hostname':
        if (typeof rule.pattern === 'string') {
          const pattern = this._toWildcardRegex(rule.pattern, rule.caseSensitive !== false);
          return pattern.test(urlObj.hostname);
        } else if (rule.pattern instanceof RegExp) {
          return rule.pattern.test(urlObj.hostname);
        }
        return false;

      case 'port':
        return urlObj.port === rule.port;

      case 'protocol':
        return urlObj.protocol === rule.protocol + ':';

      case 'pattern':
        if (rule.pattern instanceof RegExp) {
          return rule.pattern.test(urlObj.href);
        } else if (typeof rule.pattern === 'string') {
          const pattern = this._toWildcardRegex(rule.pattern, rule.caseSensitive !== false);
          return pattern.test(urlObj.href);
        }
        return false;

      case 'method':
        return options.method === rule.method;

      case 'ip':
        // Would require IP resolution, simplified for now
        return false;

      default:
        return false;
    }

    return false;
  }

  /**
   * Parse URL safely
   * @private
   */
  _parseURL(url) {
    try {
      const urlObj = new URL(url);
      return {
        href: urlObj.href,
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        port: Number(urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80)),
        pathname: urlObj.pathname
      };
    } catch (error) {
      // If not a full URL, treat as hostname
      return {
        href: url,
        protocol: 'https:',
        hostname: url,
        port: 443,
        pathname: '/'
      };
    }
  }

  /**
   * Log a firewall event
   * @private
   */
  _log(event) {
    this.logs.push(event);

    // Limit log size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Export rules to JSON
   * @returns {string} JSON string of rules
   */
  exportRules() {
    return JSON.stringify(this.getRules(), null, 2);
  }

  /**
   * Import rules from JSON
   * @param {string} json - JSON string of rules
   */
  importRules(json) {
    try {
      const data = JSON.parse(json);
      const rulesArray = Array.isArray(data) ? data : data.rules;
      if (!rulesArray) {
        throw new Error('Invalid rules format');
      }

      this.rules = [];
      for (const rule of rulesArray) {
        this.addRule(rule);
      }
    } catch (error) {
      throw new Error(`Failed to import rules: ${error.message}`);
    }
  }

  /**
   * Convert wildcard string to RegExp
   */
  _toWildcardRegex(pattern, caseSensitive = true) {
    if (pattern === '*') {
      return new RegExp('.*', caseSensitive ? '' : 'i');
    }

    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');

    return new RegExp(`^${escaped}$`, caseSensitive ? '' : 'i');
  }
}
