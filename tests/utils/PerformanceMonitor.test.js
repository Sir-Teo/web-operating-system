/**
 * Tests for PerformanceMonitor
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceMonitor } from '../../src/utils/PerformanceMonitor.js';

describe('PerformanceMonitor', () => {
  let monitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();

    // Mock performance.mark and performance.measure
    global.performance = global.performance || {};
    global.performance.mark = vi.fn();
    global.performance.measure = vi.fn();
  });

  afterEach(() => {
    monitor.clear();
  });

  describe('mark() and measure()', () => {
    it('should mark start time', () => {
      monitor.mark('test-operation');

      expect(monitor.marks.has('test-operation')).toBe(true);
      expect(performance.mark).toHaveBeenCalledWith('test-operation-start');
    });

    it('should measure duration', () => {
      monitor.mark('test-operation');

      // Simulate some time passing
      const duration = monitor.measure('test-operation');

      expect(duration).toBeGreaterThanOrEqual(0);
      expect(monitor.marks.has('test-operation')).toBe(false);
    });

    it('should return 0 for non-existent mark', () => {
      const duration = monitor.measure('non-existent');

      expect(duration).toBe(0);
    });
  });

  describe('recordBootTime()', () => {
    it('should record boot time', () => {
      monitor.recordBootTime(1500);

      expect(monitor.metrics.bootTime).toBe(1500);
    });
  });

  describe('recordFileOperation()', () => {
    it('should record file operations', () => {
      monitor.recordFileOperation('read', 50, 1024);

      expect(monitor.metrics.fileOperations).toHaveLength(1);
      expect(monitor.metrics.fileOperations[0]).toMatchObject({
        operation: 'read',
        duration: 50,
        size: 1024
      });
    });

    it('should limit stored operations to 100', () => {
      for (let i = 0; i < 150; i++) {
        monitor.recordFileOperation('read', 10, 100);
      }

      expect(monitor.metrics.fileOperations).toHaveLength(100);
    });
  });

  describe('recordNetworkRequest()', () => {
    it('should record network requests', () => {
      monitor.recordNetworkRequest('https://api.example.com', 200, 5000);

      expect(monitor.metrics.networkRequests).toHaveLength(1);
      expect(monitor.metrics.networkRequests[0]).toMatchObject({
        url: 'https://api.example.com',
        duration: 200,
        size: 5000
      });
    });

    it('should limit stored requests to 100', () => {
      for (let i = 0; i < 150; i++) {
        monitor.recordNetworkRequest('https://api.example.com', 100, 1000);
      }

      expect(monitor.metrics.networkRequests).toHaveLength(100);
    });
  });

  describe('recordRenderTime()', () => {
    it('should record render times', () => {
      monitor.recordRenderTime('Desktop', 100);

      expect(monitor.metrics.renderTimes).toHaveLength(1);
      expect(monitor.metrics.renderTimes[0]).toMatchObject({
        component: 'Desktop',
        duration: 100
      });
    });

    it('should limit stored renders to 100', () => {
      for (let i = 0; i < 150; i++) {
        monitor.recordRenderTime('Component', 50);
      }

      expect(monitor.metrics.renderTimes).toHaveLength(100);
    });
  });

  describe('getAverageFileOperationTime()', () => {
    it('should calculate average for all operations', () => {
      monitor.recordFileOperation('read', 100, 1024);
      monitor.recordFileOperation('write', 200, 2048);
      monitor.recordFileOperation('read', 150, 1536);

      const avg = monitor.getAverageFileOperationTime();

      expect(avg).toBe(150); // (100 + 200 + 150) / 3
    });

    it('should calculate average for specific operation', () => {
      monitor.recordFileOperation('read', 100, 1024);
      monitor.recordFileOperation('write', 200, 2048);
      monitor.recordFileOperation('read', 150, 1536);

      const avgRead = monitor.getAverageFileOperationTime('read');

      expect(avgRead).toBe(125); // (100 + 150) / 2
    });

    it('should return 0 for no operations', () => {
      const avg = monitor.getAverageFileOperationTime();

      expect(avg).toBe(0);
    });
  });

  describe('getAverageNetworkRequestTime()', () => {
    it('should calculate average request time', () => {
      monitor.recordNetworkRequest('url1', 100, 1000);
      monitor.recordNetworkRequest('url2', 200, 2000);
      monitor.recordNetworkRequest('url3', 300, 3000);

      const avg = monitor.getAverageNetworkRequestTime();

      expect(avg).toBe(200);
    });

    it('should return 0 for no requests', () => {
      const avg = monitor.getAverageNetworkRequestTime();

      expect(avg).toBe(0);
    });
  });

  describe('getAverageRenderTime()', () => {
    it('should calculate average for all renders', () => {
      monitor.recordRenderTime('Desktop', 100);
      monitor.recordRenderTime('Terminal', 150);
      monitor.recordRenderTime('Desktop', 200);

      const avg = monitor.getAverageRenderTime();

      expect(avg).toBe(150);
    });

    it('should calculate average for specific component', () => {
      monitor.recordRenderTime('Desktop', 100);
      monitor.recordRenderTime('Terminal', 150);
      monitor.recordRenderTime('Desktop', 200);

      const avgDesktop = monitor.getAverageRenderTime('Desktop');

      expect(avgDesktop).toBe(150); // (100 + 200) / 2
    });

    it('should return 0 for no renders', () => {
      const avg = monitor.getAverageRenderTime();

      expect(avg).toBe(0);
    });
  });

  describe('getSummary()', () => {
    it('should return complete performance summary', () => {
      monitor.recordBootTime(2000);
      monitor.recordFileOperation('read', 100, 1024);
      monitor.recordNetworkRequest('url', 200, 2000);
      monitor.recordRenderTime('Desktop', 150);

      const summary = monitor.getSummary();

      expect(summary).toHaveProperty('bootTime', 2000);
      expect(summary).toHaveProperty('fileOperations');
      expect(summary).toHaveProperty('network');
      expect(summary).toHaveProperty('rendering');
      expect(summary.fileOperations.total).toBe(1);
      expect(summary.network.total).toBe(1);
      expect(summary.rendering.total).toBe(1);
    });
  });

  describe('clear()', () => {
    it('should clear all metrics', () => {
      monitor.recordBootTime(2000);
      monitor.recordFileOperation('read', 100, 1024);
      monitor.recordNetworkRequest('url', 200, 2000);
      monitor.mark('test');

      monitor.clear();

      expect(monitor.metrics.bootTime).toBe(0);
      expect(monitor.metrics.fileOperations).toHaveLength(0);
      expect(monitor.metrics.networkRequests).toHaveLength(0);
      expect(monitor.marks.size).toBe(0);
    });
  });

  describe('exportMetrics()', () => {
    it('should export metrics as JSON', () => {
      monitor.recordBootTime(2000);
      monitor.recordFileOperation('read', 100, 1024);

      const json = monitor.exportMetrics();
      const data = JSON.parse(json);

      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('metrics');
      expect(data.summary.bootTime).toBe(2000);
    });
  });
});
