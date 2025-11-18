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
    const decision = this._evaluateRules(urlObj, options);

    if (this.logEnabled) {
      this._log({
        timestamp: Date.now(),
        url,
        hostname: urlObj.hostname,
        port: urlObj.port,
        protocol: urlObj.protocol,
        decision,
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
    return this.rules.map(rule => ({ ...rule }));
  }

  /**
   * Clear all rules
   */
  clearRules() {
    this.rules = [];
    this._initializeDefaultRules();
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
      logCount: this.logs.length
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
  _initializeDefaultRules() {
    // Allow common web ports
    this.rules.push({
      id: 'default-http',
      type: 'port',
      port: 80,
      protocol: 'tcp',
      action: 'allow',
      enabled: true,
      priority: 1000,
      reason: 'Default HTTP access'
    });

    this.rules.push({
      id: 'default-https',
      type: 'port',
      port: 443,
      protocol: 'tcp',
      action: 'allow',
      enabled: true,
      priority: 1000,
      reason: 'Default HTTPS access'
    });

    // Block known malicious patterns
    this.rules.push({
      id: 'block-malware',
      type: 'pattern',
      pattern: /malware|virus|trojan|phishing/i,
      action: 'deny',
      enabled: true,
      priority: 500,
      reason: 'Block known malicious patterns'
    });
  }

  /**
   * Validate a firewall rule
   * @private
   */
  _validateRule(rule) {
    if (!rule.type) {
      throw new Error('Rule must have a type');
    }

    if (!rule.action || !['allow', 'deny'].includes(rule.action)) {
      throw new Error('Rule action must be "allow" or "deny"');
    }

    return {
      id: rule.id || `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: rule.type,
      action: rule.action,
      enabled: rule.enabled !== false,
      priority: rule.priority || 100,
      reason: rule.reason || '',
      created: Date.now(),
      ...rule
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
      .sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      const matches = this._ruleMatches(rule, urlObj, options);

      if (matches) {
        return rule.action === 'allow';
      }
    }

    // No matching rule, use default policy
    return this.defaultPolicy === 'allow';
  }

  /**
   * Check if a rule matches a request
   * @private
   */
  _ruleMatches(rule, urlObj, options) {
    switch (rule.type) {
      case 'hostname':
        if (typeof rule.pattern === 'string') {
          return urlObj.hostname === rule.pattern ||
                 urlObj.hostname.endsWith('.' + rule.pattern);
        } else if (rule.pattern instanceof RegExp) {
          return rule.pattern.test(urlObj.hostname);
        }
        break;

      case 'port':
        return urlObj.port === rule.port;

      case 'protocol':
        return urlObj.protocol === rule.protocol + ':';

      case 'pattern':
        if (rule.pattern instanceof RegExp) {
          return rule.pattern.test(urlObj.href);
        }
        break;

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
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
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
    return JSON.stringify({
      version: '1.0',
      defaultPolicy: this.defaultPolicy,
      rules: this.rules
    }, null, 2);
  }

  /**
   * Import rules from JSON
   * @param {string} json - JSON string of rules
   */
  importRules(json) {
    try {
      const data = JSON.parse(json);

      if (data.version !== '1.0') {
        throw new Error('Unsupported rules version');
      }

      this.defaultPolicy = data.defaultPolicy || 'allow';
      this.rules = data.rules.map(rule => this._validateRule(rule));
    } catch (error) {
      throw new Error(`Failed to import rules: ${error.message}`);
    }
  }
}
