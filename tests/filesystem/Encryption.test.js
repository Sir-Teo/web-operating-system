/**
 * Tests for File Encryption
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FileEncryption } from '../../src/filesystem/FileEncryption.js';

describe('FileEncryption', () => {
  let encryption;

  beforeEach(() => {
    encryption = new FileEncryption();
  });

  describe('AES-256-GCM encryption', () => {
    it('should encrypt and decrypt text data', async () => {
      const originalText = 'This is secret data that needs to be encrypted';
      const originalData = new TextEncoder().encode(originalText);
      const password = 'my-secure-password';

      const encryptedData = await encryption.encrypt(originalData, password);
      expect(encryptedData.length).toBeGreaterThan(originalData.length);

      const decryptedData = await encryption.decrypt(encryptedData, password);
      const decryptedText = new TextDecoder().decode(decryptedData);

      expect(decryptedText).toBe(originalText);
    });

    it('should fail with wrong password', async () => {
      const originalData = new TextEncoder().encode('Secret data');
      const correctPassword = 'correct-password';
      const wrongPassword = 'wrong-password';

      const encryptedData = await encryption.encrypt(originalData, correctPassword);

      await expect(
        encryption.decrypt(encryptedData, wrongPassword)
      ).rejects.toThrow();
    });

    it('should handle empty data', async () => {
      const emptyData = new Uint8Array(0);
      const password = 'test-password';

      const encryptedData = await encryption.encrypt(emptyData, password);
      const decryptedData = await encryption.decrypt(encryptedData, password);

      expect(decryptedData.length).toBe(0);
    });

    it('should handle binary data', async () => {
      const binaryData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const password = 'test-password';

      const encryptedData = await encryption.encrypt(binaryData, password);
      const decryptedData = await encryption.decrypt(encryptedData, password);

      expect(decryptedData).toEqual(binaryData);
    });

    it('should produce different ciphertext for same plaintext', async () => {
      const data = new TextEncoder().encode('Same data');
      const password = 'password';

      const encrypted1 = await encryption.encrypt(data, password);
      const encrypted2 = await encryption.encrypt(data, password);

      // Should be different due to different IV
      expect(encrypted1).not.toEqual(encrypted2);

      // But both should decrypt correctly
      const decrypted1 = await encryption.decrypt(encrypted1, password);
      const decrypted2 = await encryption.decrypt(encrypted2, password);

      expect(new TextDecoder().decode(decrypted1)).toBe('Same data');
      expect(new TextDecoder().decode(decrypted2)).toBe('Same data');
    });

    it('should handle large data', async () => {
      const largeText = 'A'.repeat(1000000); // 1MB
      const largeData = new TextEncoder().encode(largeText);
      const password = 'test-password';

      const encryptedData = await encryption.encrypt(largeData, password);
      const decryptedData = await encryption.decrypt(encryptedData, password);
      const decryptedText = new TextDecoder().decode(decryptedData);

      expect(decryptedText).toBe(largeText);
    });
  });

  describe('hashing', () => {
    it('should compute MD5 hash', async () => {
      const data = new TextEncoder().encode('test data');

      const hash = await encryption.md5(data);

      expect(hash).toMatch(/^[a-f0-9]{32}$/);
    });

    it('should compute SHA-256 hash', async () => {
      const data = new TextEncoder().encode('test data');

      const hash = await encryption.sha256(data);

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should compute SHA-512 hash', async () => {
      const data = new TextEncoder().encode('test data');

      const hash = await encryption.sha512(data);

      expect(hash).toMatch(/^[a-f0-9]{128}$/);
    });

    it('should produce consistent hash for same input', async () => {
      const data = new TextEncoder().encode('test data');

      const hash1 = await encryption.sha256(data);
      const hash2 = await encryption.sha256(data);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hash for different input', async () => {
      const data1 = new TextEncoder().encode('test data 1');
      const data2 = new TextEncoder().encode('test data 2');

      const hash1 = await encryption.sha256(data1);
      const hash2 = await encryption.sha256(data2);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty data hashing', async () => {
      const emptyData = new Uint8Array(0);

      const hash = await encryption.sha256(emptyData);

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('secure deletion', () => {
    it('should overwrite data multiple times', async () => {
      const data = new Uint8Array(1024).fill(65); // Fill with 'A'

      const overwritten = await encryption.secureDelete(data, 3);

      // Data should be different from original
      expect(overwritten).not.toEqual(data);

      // All bytes should be zero
      expect(overwritten.every(byte => byte === 0)).toBe(true);
    });

    it('should handle different pass counts', async () => {
      const data = new Uint8Array(100).fill(65);

      const result1 = await encryption.secureDelete(data, 1);
      const result2 = await encryption.secureDelete(data, 7);
      const result3 = await encryption.secureDelete(data, 35);

      expect(result1.every(byte => byte === 0)).toBe(true);
      expect(result2.every(byte => byte === 0)).toBe(true);
      expect(result3.every(byte => byte === 0)).toBe(true);
    });
  });

  describe('key derivation', () => {
    it('should derive same key from same password and salt', async () => {
      const password = 'test-password';
      const salt = new Uint8Array(16).fill(1);

      const key1 = await encryption.deriveKey(password, salt);
      const key2 = await encryption.deriveKey(password, salt);

      // Export keys to compare
      const exported1 = await crypto.subtle.exportKey('raw', key1);
      const exported2 = await crypto.subtle.exportKey('raw', key2);

      expect(new Uint8Array(exported1)).toEqual(new Uint8Array(exported2));
    });

    it('should derive different keys from different salts', async () => {
      const password = 'test-password';
      const salt1 = new Uint8Array(16).fill(1);
      const salt2 = new Uint8Array(16).fill(2);

      const key1 = await encryption.deriveKey(password, salt1);
      const key2 = await encryption.deriveKey(password, salt2);

      const exported1 = await crypto.subtle.exportKey('raw', key1);
      const exported2 = await crypto.subtle.exportKey('raw', key2);

      expect(new Uint8Array(exported1)).not.toEqual(new Uint8Array(exported2));
    });
  });

  describe('error handling', () => {
    it('should throw on invalid encrypted data format', async () => {
      const invalidData = new Uint8Array([1, 2, 3, 4, 5]);
      const password = 'password';

      await expect(
        encryption.decrypt(invalidData, password)
      ).rejects.toThrow();
    });

    it('should throw on corrupted encrypted data', async () => {
      const data = new TextEncoder().encode('test data');
      const password = 'password';

      const encrypted = await encryption.encrypt(data, password);

      // Corrupt the data
      encrypted[encrypted.length - 1] ^= 0xFF;

      await expect(
        encryption.decrypt(encrypted, password)
      ).rejects.toThrow();
    });
  });
});
