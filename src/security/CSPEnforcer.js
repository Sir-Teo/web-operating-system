/**
 * CSPEnforcer - Content Security Policy Enforcement
 *
 * Features:
 * - CSP policy management
 * - Violation reporting
 * - Dynamic policy updates
 * - Policy validation
 */

import EventEmitter from '../utils/EventEmitter.js';

class CSPEnforcer extends EventEmitter {
  constructor() {
    super();

    this.policies = new Map();
    this.violations = [];
    this.enabled = true;

    // Default CSP policy
    this.defaultPolicy = {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'blob:', 'https:'],
      'font-src': ["'self'", 'data:'],
      'connect-src': ["'self'", 'https:', 'wss:', 'ws:'],
      'media-src': ["'self'", 'blob:', 'data:'],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': []
    };

    this.currentPolicy = { ...this.defaultPolicy };

    console.log('[CSP] Initialized');
    this._setupViolationListener();
  }

  /**
   * Set up CSP violation listener
   */
  _setupViolationListener() {
    document.addEventListener('securitypolicyviolation', (e) => {
      this._handleViolation(e);
    });
  }

  /**
   * Handle CSP violation
   */
  _handleViolation(event) {
    const violation = {
      timestamp: Date.now(),
      blockedURI: event.blockedURI,
      documentURI: event.documentURI,
      effectiveDirective: event.effectiveDirective,
      originalPolicy: event.originalPolicy,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
      violatedDirective: event.violatedDirective,
      statusCode: event.statusCode
    };

    this.violations.push(violation);

    // Keep only last 1000 violations
    if (this.violations.length > 1000) {
      this.violations.shift();
    }

    this.emit('violation', violation);

    console.warn('[CSP] Violation detected:', violation);
  }

  /**
   * Apply CSP policy
   */
  applyPolicy(policy = null) {
    if (!this.enabled) return;

    const policyToApply = policy || this.currentPolicy;
    const policyString = this._compilePolicyString(policyToApply);

    // Create meta tag for CSP
    let metaTag = document.querySelector('meta[http-equiv="Content-Security-Policy"]');

    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.httpEquiv = 'Content-Security-Policy';
      document.head.appendChild(metaTag);
    }

    metaTag.content = policyString;

    this.emit('policy-applied', policyToApply);

    console.log('[CSP] Policy applied:', policyString);

    return policyString;
  }

  /**
   * Compile policy object to CSP string
   */
  _compilePolicyString(policy) {
    const directives = [];

    for (const [directive, sources] of Object.entries(policy)) {
      if (Array.isArray(sources) && sources.length > 0) {
        directives.push(`${directive} ${sources.join(' ')}`);
      } else if (Array.isArray(sources)) {
        directives.push(directive);
      }
    }

    return directives.join('; ');
  }

  /**
   * Update specific directive
   */
  updateDirective(directive, sources) {
    this.currentPolicy[directive] = sources;
    this.applyPolicy();

    this.emit('directive-updated', { directive, sources });

    console.log('[CSP] Directive updated:', directive, sources);
  }

  /**
   * Add source to directive
   */
  addSource(directive, source) {
    if (!this.currentPolicy[directive]) {
      this.currentPolicy[directive] = [];
    }

    if (!this.currentPolicy[directive].includes(source)) {
      this.currentPolicy[directive].push(source);
      this.applyPolicy();

      this.emit('source-added', { directive, source });

      console.log('[CSP] Source added to', directive, ':', source);
    }
  }

  /**
   * Remove source from directive
   */
  removeSource(directive, source) {
    if (this.currentPolicy[directive]) {
      this.currentPolicy[directive] = this.currentPolicy[directive]
        .filter(s => s !== source);
      this.applyPolicy();

      this.emit('source-removed', { directive, source });

      console.log('[CSP] Source removed from', directive, ':', source);
    }
  }

  /**
   * Reset to default policy
   */
  resetPolicy() {
    this.currentPolicy = { ...this.defaultPolicy };
    this.applyPolicy();

    this.emit('policy-reset');

    console.log('[CSP] Policy reset to default');
  }

  /**
   * Enable CSP enforcement
   */
  enable() {
    this.enabled = true;
    this.applyPolicy();

    this.emit('enabled');

    console.log('[CSP] Enforcement enabled');
  }

  /**
   * Disable CSP enforcement
   */
  disable() {
    this.enabled = false;

    const metaTag = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (metaTag) {
      metaTag.remove();
    }

    this.emit('disabled');

    console.log('[CSP] Enforcement disabled');
  }

  /**
   * Get current policy
   */
  getCurrentPolicy() {
    return { ...this.currentPolicy };
  }

  /**
   * Get policy string
   */
  getPolicyString() {
    return this._compilePolicyString(this.currentPolicy);
  }

  /**
   * Get violations
   */
  getViolations(limit = 100) {
    return this.violations.slice(-limit);
  }

  /**
   * Clear violations
   */
  clearViolations() {
    this.violations = [];

    this.emit('violations-cleared');

    console.log('[CSP] Violations cleared');
  }

  /**
   * Get violation statistics
   */
  getViolationStats() {
    const stats = {
      total: this.violations.length,
      byDirective: {},
      byURI: {},
      recent: this.violations.slice(-10)
    };

    this.violations.forEach(v => {
      // Count by directive
      const directive = v.effectiveDirective;
      stats.byDirective[directive] = (stats.byDirective[directive] || 0) + 1;

      // Count by blocked URI
      const uri = v.blockedURI;
      stats.byURI[uri] = (stats.byURI[uri] || 0) + 1;
    });

    return stats;
  }

  /**
   * Save policy to storage
   */
  savePolicy(name, policy = null) {
    const policyToSave = policy || this.currentPolicy;
    this.policies.set(name, policyToSave);

    this.emit('policy-saved', { name, policy: policyToSave });

    console.log('[CSP] Policy saved:', name);
  }

  /**
   * Load policy from storage
   */
  loadPolicy(name) {
    const policy = this.policies.get(name);

    if (policy) {
      this.currentPolicy = { ...policy };
      this.applyPolicy();

      this.emit('policy-loaded', { name, policy });

      console.log('[CSP] Policy loaded:', name);
      return true;
    }

    console.warn('[CSP] Policy not found:', name);
    return false;
  }

  /**
   * List saved policies
   */
  listPolicies() {
    return Array.from(this.policies.keys());
  }

  /**
   * Delete saved policy
   */
  deletePolicy(name) {
    const deleted = this.policies.delete(name);

    if (deleted) {
      this.emit('policy-deleted', { name });
      console.log('[CSP] Policy deleted:', name);
    }

    return deleted;
  }

  /**
   * Validate policy
   */
  validatePolicy(policy) {
    const validDirectives = [
      'default-src', 'script-src', 'style-src', 'img-src', 'font-src',
      'connect-src', 'media-src', 'object-src', 'frame-src', 'base-uri',
      'form-action', 'frame-ancestors', 'upgrade-insecure-requests',
      'block-all-mixed-content', 'worker-src', 'manifest-src'
    ];

    const errors = [];
    const warnings = [];

    for (const directive of Object.keys(policy)) {
      if (!validDirectives.includes(directive)) {
        warnings.push(`Unknown directive: ${directive}`);
      }
    }

    // Check for common issues
    if (!policy['default-src'] && !policy['script-src']) {
      errors.push('Missing default-src or script-src directive');
    }

    if (policy['script-src']?.includes("'unsafe-eval'")) {
      warnings.push("Using 'unsafe-eval' reduces security");
    }

    if (policy['script-src']?.includes("'unsafe-inline'")) {
      warnings.push("Using 'unsafe-inline' reduces security");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate nonce for inline scripts/styles
   */
  generateNonce() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  /**
   * Export data
   */
  export() {
    return {
      currentPolicy: this.currentPolicy,
      policies: Array.from(this.policies.entries()),
      violations: this.violations,
      enabled: this.enabled
    };
  }

  /**
   * Import data
   */
  import(data) {
    if (data.currentPolicy) {
      this.currentPolicy = data.currentPolicy;
    }

    if (data.policies) {
      this.policies = new Map(data.policies);
    }

    if (data.violations) {
      this.violations = data.violations;
    }

    if (typeof data.enabled === 'boolean') {
      this.enabled = data.enabled;
    }

    if (this.enabled) {
      this.applyPolicy();
    }

    console.log('[CSP] Data imported');
  }
}

// Singleton instance
const cspEnforcer = new CSPEnforcer();

export default cspEnforcer;
export { CSPEnforcer };
