/**
 * Tests for NetworkStack
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NetworkStack } from '../../src/network/NetworkStack.js';

describe('NetworkStack', () => {
  let network;

  beforeEach(() => {
    network = new NetworkStack();

    // Mock fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        text: () => Promise.resolve('test response'),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(10))
      })
    );
  });

  describe('initialization', () => {
    it('should initialize with default interface', () => {
      expect(network.interfaces.size).toBeGreaterThan(0);
      expect(network.interfaces.has('eth0')).toBe(true);
    });

    it('should initialize routing table', () => {
      expect(network.routes.size).toBeGreaterThan(0);
    });

    it('should initialize DNS resolver', () => {
      expect(network.dns).toBeDefined();
    });

    it('should initialize firewall', () => {
      expect(network.firewall).toBeDefined();
    });
  });

  describe('fetch()', () => {
    it('should make HTTP request', async () => {
      const response = await network.fetch('https://api.example.com/data');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.any(Object)
      );
      expect(response).toBeDefined();
    });

    it('should respect firewall rules', async () => {
      // Block all requests
      network.firewall.addRule({
        action: 'deny',
        hostname: '*'
      });

      await expect(
        network.fetch('https://blocked.com')
      ).rejects.toThrow('Blocked by firewall');
    });

    it('should track request statistics', async () => {
      await network.fetch('https://api.example.com/data');

      const stats = network.getStatistics();

      expect(stats.requests.total).toBe(1);
      expect(stats.requests.successful).toBe(1);
    });

    it('should handle request errors', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      await expect(
        network.fetch('https://error.com')
      ).rejects.toThrow();

      const stats = network.getStatistics();
      expect(stats.requests.failed).toBe(1);
    });
  });

  describe('ping()', () => {
    it('should simulate ping', async () => {
      const result = await network.ping('example.com');

      expect(result).toHaveProperty('host', 'example.com');
      expect(result).toHaveProperty('time');
      expect(result).toHaveProperty('success');
    });

    it('should support count parameter', async () => {
      const results = await network.ping('example.com', 5);

      expect(results).toHaveLength(5);
    });

    it('should calculate statistics', async () => {
      const results = await network.ping('example.com', 4);

      const times = results.map(r => r.time);
      const min = Math.min(...times);
      const max = Math.max(...times);
      const avg = times.reduce((a, b) => a + b, 0) / times.length;

      expect(min).toBeGreaterThan(0);
      expect(max).toBeGreaterThanOrEqual(min);
      expect(avg).toBeGreaterThan(0);
    });
  });

  describe('traceroute()', () => {
    it('should simulate traceroute', async () => {
      const result = await network.traceroute('example.com');

      expect(result).toHaveProperty('host', 'example.com');
      expect(result).toHaveProperty('hops');
      expect(result.hops).toBeInstanceOf(Array);
      expect(result.hops.length).toBeGreaterThan(0);
    });

    it('should simulate multiple hops', async () => {
      const result = await network.traceroute('example.com', 10);

      expect(result.hops.length).toBeLessThanOrEqual(10);
    });

    it('should include hop information', async () => {
      const result = await network.traceroute('example.com');

      result.hops.forEach(hop => {
        expect(hop).toHaveProperty('hop');
        expect(hop).toHaveProperty('ip');
        expect(hop).toHaveProperty('time');
      });
    });
  });

  describe('getStatistics()', () => {
    it('should return network statistics', () => {
      const stats = network.getStatistics();

      expect(stats).toHaveProperty('requests');
      expect(stats).toHaveProperty('bandwidth');
      expect(stats).toHaveProperty('connections');
      expect(stats.requests).toHaveProperty('total');
      expect(stats.requests).toHaveProperty('successful');
      expect(stats.requests).toHaveProperty('failed');
    });

    it('should track bandwidth', async () => {
      await network.fetch('https://api.example.com/data');

      const stats = network.getStatistics();

      expect(stats.bandwidth.sent).toBeGreaterThan(0);
      expect(stats.bandwidth.received).toBeGreaterThan(0);
    });
  });

  describe('getInterfaces()', () => {
    it('should list network interfaces', () => {
      const interfaces = network.getInterfaces();

      expect(interfaces).toBeInstanceOf(Array);
      expect(interfaces.length).toBeGreaterThan(0);
      expect(interfaces[0]).toHaveProperty('name');
      expect(interfaces[0]).toHaveProperty('ip');
      expect(interfaces[0]).toHaveProperty('mac');
      expect(interfaces[0]).toHaveProperty('status');
    });
  });

  describe('getRoutes()', () => {
    it('should list routing table', () => {
      const routes = network.getRoutes();

      expect(routes).toBeInstanceOf(Array);
      expect(routes.length).toBeGreaterThan(0);
      expect(routes[0]).toHaveProperty('destination');
      expect(routes[0]).toHaveProperty('gateway');
      expect(routes[0]).toHaveProperty('interface');
    });
  });

  describe('createWebSocket()', () => {
    it('should create WebSocket connection', () => {
      const ws = network.createWebSocket('wss://example.com');

      expect(ws).toBeDefined();
    });

    it('should track WebSocket connections', () => {
      network.createWebSocket('wss://example.com/socket1');
      network.createWebSocket('wss://example.com/socket2');

      const stats = network.getStatistics();

      expect(stats.connections.websockets).toBe(2);
    });
  });

  describe('bandwidth tracking', () => {
    it('should track sent data', async () => {
      const largData = 'x'.repeat(10000);

      await network.fetch('https://api.example.com/upload', {
        method: 'POST',
        body: largeData
      });

      const stats = network.getStatistics();

      expect(stats.bandwidth.sent).toBeGreaterThan(10000);
    });

    it('should track received data', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve('x'.repeat(10000))
        })
      );

      await network.fetch('https://api.example.com/download');

      const stats = network.getStatistics();

      expect(stats.bandwidth.received).toBeGreaterThan(10000);
    });
  });

  describe('error handling', () => {
    it('should handle DNS resolution failures', async () => {
      network.dns.resolve = vi.fn(() => Promise.reject(new Error('DNS failed')));

      await expect(
        network.fetch('https://invalid.domain.xyz')
      ).rejects.toThrow();
    });

    it('should handle network timeouts', async () => {
      global.fetch = vi.fn(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      await expect(
        network.fetch('https://slow.example.com')
      ).rejects.toThrow();
    });
  });

  describe('reset()', () => {
    it('should reset statistics', async () => {
      await network.fetch('https://api.example.com');
      await network.ping('example.com');

      network.reset();

      const stats = network.getStatistics();

      expect(stats.requests.total).toBe(0);
      expect(stats.bandwidth.sent).toBe(0);
      expect(stats.bandwidth.received).toBe(0);
    });
  });
});
