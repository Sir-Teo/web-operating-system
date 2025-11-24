/**
 * Encrypted Storage Layer
 * Provides transparent encryption for all data at rest
 */

export class EncryptedStorage {
  constructor() {
    this.masterKeys = new Map(); // userId -> master key
    this.dbName = 'webos-encrypted-storage';
    this.db = null;
  }

  /**
   * Initialize encrypted storage
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('encrypted-data')) {
          db.createObjectStore('encrypted-data', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('user-keys')) {
          db.createObjectStore('user-keys', { keyPath: 'userId' });
        }
      };
    });
  }

  /**
   * Derive master key from password
   * @param {string} userId - User ID
   * @param {string} password - User password
   * @returns {Promise<CryptoKey>}
   */
  async deriveMasterKey(userId, password) {
    // Generate or retrieve salt
    const salt = await this._getSalt(userId);

    // Import password as key material
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive key using PBKDF2
    const masterKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Store in memory
    this.masterKeys.set(userId, masterKey);
    return masterKey;
  }

  /**
   * Encrypt and store data
   * @param {string} userId - User ID
   * @param {string} key - Data key
   * @param {any} data - Data to encrypt
   */
  async setEncrypted(userId, key, data) {
    const masterKey = this.masterKeys.get(userId);
    if (!masterKey) {
      throw new Error('Master key not initialized. Call deriveMasterKey first.');
    }

    // Serialize data
    const plaintext = JSON.stringify(data);
    const plaintextBuffer = new TextEncoder().encode(plaintext);

    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      masterKey,
      plaintextBuffer
    );

    // Store encrypted data
    const encryptedData = {
      id: `${userId}:${key}`,
      userId: userId,
      key: key,
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(ciphertext)),
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['encrypted-data'], 'readwrite');
      const store = transaction.objectStore('encrypted-data');
      const request = store.put(encryptedData);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieve and decrypt data
   * @param {string} userId - User ID
   * @param {string} key - Data key
   * @returns {Promise<any>}
   */
  async getEncrypted(userId, key) {
    const masterKey = this.masterKeys.get(userId);
    if (!masterKey) {
      throw new Error('Master key not initialized. Call deriveMasterKey first.');
    }

    // Retrieve encrypted data
    const encryptedData = await new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['encrypted-data'], 'readonly');
      const store = transaction.objectStore('encrypted-data');
      const request = store.get(`${userId}:${key}`);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!encryptedData) {
      return null;
    }

    // Decrypt
    const iv = new Uint8Array(encryptedData.iv);
    const ciphertext = new Uint8Array(encryptedData.data);

    try {
      const plaintextBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        masterKey,
        ciphertext
      );

      const plaintext = new TextDecoder().decode(plaintextBuffer);
      return JSON.parse(plaintext);
    } catch (error) {
      throw new Error('Decryption failed. Invalid password or corrupted data.');
    }
  }

  /**
   * Delete encrypted data
   * @param {string} userId - User ID
   * @param {string} key - Data key
   */
  async deleteEncrypted(userId, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['encrypted-data'], 'readwrite');
      const store = transaction.objectStore('encrypted-data');
      const request = store.delete(`${userId}:${key}`);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * List all keys for a user
   * @param {string} userId - User ID
   * @returns {Promise<string[]>}
   */
  async listKeys(userId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['encrypted-data'], 'readonly');
      const store = transaction.objectStore('encrypted-data');
      const request = store.openCursor();
      const keys = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.userId === userId) {
            keys.push(cursor.value.key);
          }
          cursor.continue();
        } else {
          resolve(keys);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear master key from memory
   * @param {string} userId - User ID
   */
  clearMasterKey(userId) {
    this.masterKeys.delete(userId);
  }

  /**
   * Get or generate salt for user
   * @private
   */
  async _getSalt(userId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['user-keys'], 'readwrite');
      const store = transaction.objectStore('user-keys');
      const request = store.get(userId);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.salt) {
          resolve(new Uint8Array(result.salt));
        } else {
          // Generate new salt
          const salt = crypto.getRandomValues(new Uint8Array(16));
          const putRequest = store.put({
            userId: userId,
            salt: Array.from(salt)
          });

          putRequest.onsuccess = () => resolve(salt);
          putRequest.onerror = () => reject(putRequest.error);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Export encrypted data for backup
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async exportData(userId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['encrypted-data'], 'readonly');
      const store = transaction.objectStore('encrypted-data');
      const request = store.openCursor();
      const data = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.userId === userId) {
            data.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve({
            version: 1,
            userId: userId,
            exportDate: new Date().toISOString(),
            data: data
          });
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Import encrypted data from backup
   * @param {Object} backup - Backup data
   */
  async importData(backup) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['encrypted-data'], 'readwrite');
      const store = transaction.objectStore('encrypted-data');

      let completed = 0;
      const total = backup.data.length;

      if (total === 0) {
        resolve();
        return;
      }

      backup.data.forEach(item => {
        const request = store.put(item);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }
}
