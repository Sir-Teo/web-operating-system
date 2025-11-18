/**
 * Tests for File Compression
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CompressionManager } from '../../src/filesystem/CompressionManager.js';

describe('CompressionManager', () => {
  let manager;

  beforeEach(() => {
    manager = new CompressionManager();
  });

  describe('gzip compression', () => {
    it('should compress and decompress text data', async () => {
      const originalText = 'Hello, World! This is a test of gzip compression. '.repeat(100);
      const originalData = new TextEncoder().encode(originalText);

      const compressed = await manager.compress(originalData);
      expect(compressed.length).toBeLessThan(originalData.length);

      const decompressed = await manager.decompress(compressed);
      const decompressedText = new TextDecoder().decode(decompressed);

      expect(decompressedText).toBe(originalText);
    });

    it('should handle empty data', async () => {
      const emptyData = new Uint8Array(0);

      const compressed = await manager.compress(emptyData);
      const decompressed = await manager.decompress(compressed);

      expect(decompressed.length).toBe(0);
    });

    it('should handle binary data', async () => {
      const binaryData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

      const compressed = await manager.compress(binaryData);
      const decompressed = await manager.decompress(compressed);

      expect(decompressed).toEqual(binaryData);
    });

    it('should compress repetitive data efficiently', async () => {
      const repetitiveText = 'A'.repeat(10000);
      const originalData = new TextEncoder().encode(repetitiveText);

      const compressed = await manager.compress(originalData);

      // Repetitive data should compress to less than 5% of original
      expect(compressed.length).toBeLessThan(originalData.length * 0.05);
    });
  });

  describe('tar operations', () => {
    it('should create tar archive from files', async () => {
      const files = [
        { path: 'file1.txt', content: new TextEncoder().encode('Content 1') },
        { path: 'file2.txt', content: new TextEncoder().encode('Content 2') },
        { path: 'dir/file3.txt', content: new TextEncoder().encode('Content 3') }
      ];

      const tarData = await manager.createTar(files);

      expect(tarData).toBeInstanceOf(Uint8Array);
      expect(tarData.length).toBeGreaterThan(0);
    });

    it('should extract tar archive', async () => {
      const files = [
        { path: 'file1.txt', content: new TextEncoder().encode('Content 1') },
        { path: 'file2.txt', content: new TextEncoder().encode('Content 2') }
      ];

      const tarData = await manager.createTar(files);
      const extracted = await manager.extractTar(tarData);

      expect(extracted).toHaveLength(2);
      expect(extracted[0].path).toBe('file1.txt');
      expect(new TextDecoder().decode(extracted[0].content)).toBe('Content 1');
    });

    it('should handle empty tar archive', async () => {
      const files = [];

      const tarData = await manager.createTar(files);
      const extracted = await manager.extractTar(tarData);

      expect(extracted).toHaveLength(0);
    });
  });

  describe('tar.gz operations', () => {
    it('should create compressed tar archive', async () => {
      const files = [
        { path: 'file1.txt', content: new TextEncoder().encode('Content 1 '.repeat(100)) },
        { path: 'file2.txt', content: new TextEncoder().encode('Content 2 '.repeat(100)) }
      ];

      const tarGzData = await manager.createTarGz(files);
      const tarData = await manager.createTar(files);

      expect(tarGzData.length).toBeLessThan(tarData.length);
    });

    it('should extract compressed tar archive', async () => {
      const files = [
        { path: 'file1.txt', content: new TextEncoder().encode('Content 1') },
        { path: 'file2.txt', content: new TextEncoder().encode('Content 2') }
      ];

      const tarGzData = await manager.createTarGz(files);
      const extracted = await manager.extractTarGz(tarGzData);

      expect(extracted).toHaveLength(2);
      expect(new TextDecoder().decode(extracted[0].content)).toBe('Content 1');
    });
  });

  describe('error handling', () => {
    it('should throw on invalid compressed data', async () => {
      const invalidData = new Uint8Array([1, 2, 3, 4, 5]);

      await expect(manager.decompress(invalidData)).rejects.toThrow();
    });

    it('should throw on invalid tar data', async () => {
      const invalidData = new Uint8Array([1, 2, 3, 4, 5]);

      await expect(manager.extractTar(invalidData)).rejects.toThrow();
    });
  });

  describe('compression ratio', () => {
    it('should provide compression ratio information', async () => {
      const text = 'This is test data that will be compressed. '.repeat(50);
      const originalData = new TextEncoder().encode(text);

      const compressed = await manager.compress(originalData);
      const ratio = (compressed.length / originalData.length) * 100;

      expect(ratio).toBeLessThan(100);
      expect(ratio).toBeGreaterThan(0);
    });
  });
});
