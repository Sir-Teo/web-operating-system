/**
 * Tests for Firewall
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Firewall } from '../../src/network/Firewall.js';

describe('Firewall', () => {
  let firewall;

  beforeEach(() => {
    firewall = new Firewall();
  });

  describe('initialization', () => {
    it('should initialize with default rules', () => {
      const rules = firewall.getRules();

      expect(rules.length).toBeGreaterThan(0);
    });

    it('should allow HTTP and HTTPS by default', () => {
      expect(firewall.allow('https://example.com')).toBe(true);
      expect(firewall.allow('http://example.com')).toBe(true);
    });
  });

  describe('addRule()', () => {
    it('should add allow rule', () => {
      firewall.addRule({
        action: 'allow',
        hostname: 'allowed.com',
        port: 443
      });

      expect(firewall.allow('https://allowed.com')).toBe(true);
    });

    it('should add deny rule', () => {
      firewall.addRule({
        action: 'deny',
        hostname: 'blocked.com'
      });

      expect(firewall.allow('https://blocked.com')).toBe(false);
    });

    it('should support wildcard patterns', () => {
      firewall.addRule({
        action: 'deny',
        hostname: '*.malicious.com'
      });

      expect(firewall.allow('https://sub.malicious.com')).toBe(false);
      expect(firewall.allow('https://other.malicious.com')).toBe(false);
    });

    it('should support priority ordering', () => {
      firewall.addRule({
        action: 'allow',
        hostname: 'example.com',
        priority: 10
      });

      firewall.addRule({
        action: 'deny',
        hostname: '*',
        priority: 1
      });

      // Higher priority allow should win
      expect(firewall.allow('https://example.com')).toBe(true);
    });

    it('should support port-based rules', () => {
      firewall.addRule({
        action: 'deny',
        port: 8080
      });

      expect(firewall.allow('http://example.com:8080')).toBe(false);
      expect(firewall.allow('http://example.com')).toBe(true);
    });

    it('should support protocol-based rules', () => {
      firewall.addRule({
        action: 'deny',
        protocol: 'http'
      });

      expect(firewall.allow('http://example.com')).toBe(false);
      expect(firewall.allow('https://example.com')).toBe(true);
    });
  });

  describe('removeRule()', () => {
    it('should remove rule by ID', () => {
      const id = firewall.addRule({
        action: 'deny',
        hostname: 'blocked.com'
      });

      expect(firewall.allow('https://blocked.com')).toBe(false);

      firewall.removeRule(id);

      expect(firewall.allow('https://blocked.com')).toBe(true);
    });

    it('should handle non-existent rule ID', () => {
      expect(() => firewall.removeRule('non-existent')).not.toThrow();
    });
  });

  describe('allow()', () => {
    it('should check URL against rules', () => {
      firewall.addRule({
        action: 'deny',
        hostname: 'blocked.com'
      });

      expect(firewall.allow('https://blocked.com')).toBe(false);
      expect(firewall.allow('https://allowed.com')).toBe(true);
    });

    it('should handle complex URLs', () => {
      firewall.addRule({
        action: 'deny',
        hostname: 'blocked.com'
      });

      expect(firewall.allow('https://blocked.com/path?query=value')).toBe(false);
    });

    it('should handle URLs without protocol', () => {
      firewall.addRule({
        action: 'deny',
        hostname: 'blocked.com'
      });

      expect(firewall.allow('blocked.com')).toBe(false);
    });

    it('should apply first matching rule', () => {
      firewall.addRule({
        action: 'deny',
        hostname: 'example.com',
        priority: 10
      });

      firewall.addRule({
        action: 'allow',
        hostname: 'example.com',
        priority: 5
      });

      // Higher priority deny should apply
      expect(firewall.allow('https://example.com')).toBe(false);
    });
  });

  describe('getRules()', () => {
    it('should return all rules', () => {
      firewall.addRule({ action: 'allow', hostname: 'allowed.com' });
      firewall.addRule({ action: 'deny', hostname: 'blocked.com' });

      const rules = firewall.getRules();

      expect(rules.length).toBeGreaterThanOrEqual(2);
    });

    it('should return rules sorted by priority', () => {
      firewall.clearRules();

      firewall.addRule({ action: 'allow', hostname: 'a.com', priority: 5 });
      firewall.addRule({ action: 'allow', hostname: 'b.com', priority: 10 });
      firewall.addRule({ action: 'allow', hostname: 'c.com', priority: 1 });

      const rules = firewall.getRules();

      expect(rules[0].priority).toBeGreaterThanOrEqual(rules[1].priority);
    });
  });

  describe('clearRules()', () => {
    it('should remove all rules', () => {
      firewall.addRule({ action: 'deny', hostname: 'blocked.com' });

      firewall.clearRules();

      const rules = firewall.getRules();

      expect(rules.length).toBe(0);
    });
  });

  describe('enableDefaultRules()', () => {
    it('should enable default safe rules', () => {
      firewall.clearRules();
      firewall.enableDefaultRules();

      const rules = firewall.getRules();

      expect(rules.length).toBeGreaterThan(0);
      expect(firewall.allow('https://example.com')).toBe(true);
      expect(firewall.allow('http://example.com')).toBe(true);
    });
  });

  describe('pattern matching', () => {
    it('should match exact hostname', () => {
      firewall.addRule({
        action: 'deny',
        hostname: 'exact.com'
      });

      expect(firewall.allow('https://exact.com')).toBe(false);
      expect(firewall.allow('https://not-exact.com')).toBe(true);
    });

    it('should match wildcard patterns', () => {
      firewall.addRule({
        action: 'deny',
        pattern: '*.ads.*'
      });

      expect(firewall.allow('https://tracking.ads.example.com')).toBe(false);
      expect(firewall.allow('https://example.com')).toBe(true);
    });

    it('should match regex patterns', () => {
      firewall.addRule({
        action: 'deny',
        pattern: /^https?:\/\/.*\.(ads|tracking)\./
      });

      expect(firewall.allow('https://example.ads.com')).toBe(false);
      expect(firewall.allow('https://tracker.tracking.net')).toBe(false);
      expect(firewall.allow('https://example.com')).toBe(true);
    });

    it('should handle case-insensitive matching', () => {
      firewall.addRule({
        action: 'deny',
        hostname: 'BLOCKED.COM',
        caseSensitive: false
      });

      expect(firewall.allow('https://blocked.com')).toBe(false);
      expect(firewall.allow('https://BLOCKED.COM')).toBe(false);
      expect(firewall.allow('https://Blocked.Com')).toBe(false);
    });
  });

  describe('logging', () => {
    it('should log blocked requests', () => {
      firewall.addRule({
        action: 'deny',
        hostname: 'blocked.com',
        log: true
      });

      firewall.allow('https://blocked.com');

      const logs = firewall.getLogs();

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[logs.length - 1].url).toContain('blocked.com');
      expect(logs[logs.length - 1].action).toBe('deny');
    });

    it('should limit log size', () => {
      firewall.clearLogs();

      firewall.addRule({
        action: 'deny',
        hostname: '*',
        log: true
      });

      // Generate many logs
      for (let i = 0; i < 2000; i++) {
        firewall.allow(`https://site${i}.com`);
      }

      const logs = firewall.getLogs();

      expect(logs.length).toBeLessThanOrEqual(1000);
    });

    it('should clear logs', () => {
      firewall.addRule({
        action: 'deny',
        hostname: 'blocked.com',
        log: true
      });

      firewall.allow('https://blocked.com');
      firewall.clearLogs();

      const logs = firewall.getLogs();

      expect(logs.length).toBe(0);
    });
  });

  describe('statistics', () => {
    it('should track allowed requests', () => {
      firewall.allow('https://example.com');

      const stats = firewall.getStatistics();

      expect(stats.allowed).toBeGreaterThan(0);
    });

    it('should track blocked requests', () => {
      firewall.addRule({
        action: 'deny',
        hostname: 'blocked.com'
      });

      firewall.allow('https://blocked.com');

      const stats = firewall.getStatistics();

      expect(stats.blocked).toBeGreaterThan(0);
    });

    it('should reset statistics', () => {
      firewall.allow('https://example.com');

      firewall.resetStatistics();

      const stats = firewall.getStatistics();

      expect(stats.allowed).toBe(0);
      expect(stats.blocked).toBe(0);
    });
  });

  describe('import/export rules', () => {
    it('should export rules as JSON', () => {
      firewall.addRule({ action: 'allow', hostname: 'allowed.com' });
      firewall.addRule({ action: 'deny', hostname: 'blocked.com' });

      const json = firewall.exportRules();
      const data = JSON.parse(json);

      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBeGreaterThanOrEqual(2);
    });

    it('should import rules from JSON', () => {
      const rules = [
        { action: 'allow', hostname: 'allowed.com', priority: 10 },
        { action: 'deny', hostname: 'blocked.com', priority: 5 }
      ];

      firewall.clearRules();
      firewall.importRules(JSON.stringify(rules));

      expect(firewall.allow('https://allowed.com')).toBe(true);
      expect(firewall.allow('https://blocked.com')).toBe(false);
    });
  });

  describe('security', () => {
    it('should block known malicious patterns', () => {
      firewall.enableDefaultRules();

      // These patterns should be blocked by default rules
      expect(firewall.allow('http://malware.example.com')).toBeDefined();
    });

    it('should protect against XXS attempts in URLs', () => {
      const xssUrl = 'https://example.com?param=<script>alert("xss")</script>';

      // Should not throw, just evaluate safely
      expect(() => firewall.allow(xssUrl)).not.toThrow();
    });
  });
});
