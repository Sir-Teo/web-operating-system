/**
 * Tests for DNSResolver
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DNSResolver } from '../../src/network/DNSResolver.js';

describe('DNSResolver', () => {
  let dns;

  beforeEach(() => {
    dns = new DNSResolver();

    // Clear cache
    dns.clearCache();
  });

  describe('resolve()', () => {
    it('should resolve hostname to IP', async () => {
      const ip = await dns.resolve('example.com');

      expect(ip).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    });

    it('should cache resolved addresses', async () => {
      const ip1 = await dns.resolve('example.com');
      const ip2 = await dns.resolve('example.com');

      expect(ip1).toBe(ip2);

      const stats = dns.getCacheStats();
      expect(stats.hits).toBe(1);
    });

    it('should handle IPv6 addresses', async () => {
      const ip = await dns.resolve('example.com', 'AAAA');

      expect(ip).toMatch(/^[0-9a-f:]+$/i);
    });

    it('should return same IP for localhost', async () => {
      const ip = await dns.resolve('localhost');

      expect(ip).toBe('127.0.0.1');
    });

    it('should handle multiple resolutions in parallel', async () => {
      const promises = [
        dns.resolve('example1.com'),
        dns.resolve('example2.com'),
        dns.resolve('example3.com')
      ];

      const ips = await Promise.all(promises);

      expect(ips).toHaveLength(3);
      expect(ips.every(ip => typeof ip === 'string')).toBe(true);
    });
  });

  describe('reverseLookup()', () => {
    it('should perform reverse DNS lookup', async () => {
      const hostname = await dns.reverseLookup('8.8.8.8');

      expect(typeof hostname).toBe('string');
      expect(hostname.length).toBeGreaterThan(0);
    });

    it('should cache reverse lookups', async () => {
      const hostname1 = await dns.reverseLookup('8.8.8.8');
      const hostname2 = await dns.reverseLookup('8.8.8.8');

      expect(hostname1).toBe(hostname2);

      const stats = dns.getCacheStats();
      expect(stats.hits).toBe(1);
    });
  });

  describe('query()', () => {
    it('should query A records', async () => {
      const records = await dns.query('example.com', 'A');

      expect(records).toBeInstanceOf(Array);
      expect(records.length).toBeGreaterThan(0);
      expect(records[0]).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    });

    it('should query MX records', async () => {
      const records = await dns.query('example.com', 'MX');

      expect(records).toBeInstanceOf(Array);
    });

    it('should query TXT records', async () => {
      const records = await dns.query('example.com', 'TXT');

      expect(records).toBeInstanceOf(Array);
    });

    it('should query NS records', async () => {
      const records = await dns.query('example.com', 'NS');

      expect(records).toBeInstanceOf(Array);
    });

    it('should query CNAME records', async () => {
      const records = await dns.query('www.example.com', 'CNAME');

      expect(records).toBeInstanceOf(Array);
    });

    it('should handle non-existent records', async () => {
      const records = await dns.query('nonexistent.invalid', 'A');

      expect(records).toBeInstanceOf(Array);
      // May be empty or throw depending on implementation
    });
  });

  describe('caching', () => {
    it('should expire cached entries after TTL', async () => {
      // Set short TTL for testing
      dns.setDefaultTTL(100); // 100ms

      const ip1 = await dns.resolve('example.com');

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      const ip2 = await dns.resolve('example.com');

      const stats = dns.getCacheStats();

      // Should have missed cache on second request
      expect(stats.misses).toBeGreaterThan(0);
    });

    it('should provide cache statistics', async () => {
      await dns.resolve('example1.com');
      await dns.resolve('example2.com');
      await dns.resolve('example1.com'); // Cache hit

      const stats = dns.getCacheStats();

      expect(stats.size).toBe(2);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(2);
    });

    it('should clear cache', async () => {
      await dns.resolve('example1.com');
      await dns.resolve('example2.com');

      dns.clearCache();

      const stats = dns.getCacheStats();

      expect(stats.size).toBe(0);
    });

    it('should limit cache size', async () => {
      // Set low cache limit
      dns.setMaxCacheSize(10);

      // Add more entries than limit
      for (let i = 0; i < 20; i++) {
        await dns.resolve(`example${i}.com`);
      }

      const stats = dns.getCacheStats();

      expect(stats.size).toBeLessThanOrEqual(10);
    });
  });

  describe('DNS servers', () => {
    it('should use configured DNS servers', () => {
      const servers = dns.getDNSServers();

      expect(servers).toBeInstanceOf(Array);
      expect(servers.length).toBeGreaterThan(0);
    });

    it('should allow setting custom DNS servers', () => {
      dns.setDNSServers(['1.1.1.1', '8.8.8.8']);

      const servers = dns.getDNSServers();

      expect(servers).toContain('1.1.1.1');
      expect(servers).toContain('8.8.8.8');
    });

    it('should fallback to default servers', () => {
      dns.setDNSServers([]);

      const servers = dns.getDNSServers();

      expect(servers.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle invalid hostnames', async () => {
      await expect(
        dns.resolve('')
      ).rejects.toThrow();
    });

    it('should handle network errors gracefully', async () => {
      // Simulate network error
      const mockFetch = vi.fn(() => Promise.reject(new Error('Network error')));
      global.fetch = mockFetch;

      await expect(
        dns.resolve('example.com')
      ).rejects.toThrow();
    });

    it('should handle invalid record types', async () => {
      await expect(
        dns.query('example.com', 'INVALID')
      ).rejects.toThrow();
    });
  });

  describe('performance', () => {
    it('should cache improve performance', async () => {
      const start1 = Date.now();
      await dns.resolve('example.com');
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await dns.resolve('example.com'); // Cached
      const time2 = Date.now() - start2;

      // Cached lookup should be faster
      expect(time2).toBeLessThan(time1);
    });

    it('should handle concurrent requests efficiently', async () => {
      const start = Date.now();

      const promises = Array.from({ length: 100 }, (_, i) =>
        dns.resolve(`example${i % 10}.com`)
      );

      await Promise.all(promises);

      const time = Date.now() - start;

      // Should complete in reasonable time
      expect(time).toBeLessThan(5000);
    });
  });
});
