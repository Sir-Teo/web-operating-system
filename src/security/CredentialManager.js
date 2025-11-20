/**
 * CredentialManager - Secure Credential Storage
 *
 * Securely stores and manages credentials:
 * - Passwords
 * - API keys
 * - Tokens
 * - SSH keys
 * - Certificates
 *
 * Features:
 * - AES-256-GCM encryption
 * - Master password protection
 * - Auto-lock after timeout
 * - Password generator
 * - Credential categories
 */

import EventEmitter from '../utils/EventEmitter.js';

class CredentialManager extends EventEmitter {
  constructor() {
    super();

    this.credentials = new Map();
    this.masterKey = null;
    this.isLocked = true;
    this.lockTimeout = null;

    // Configuration
    this.config = {
      autoLockTimeout: 5 * 60 * 1000, // 5 minutes
      iterations: 100000, // PBKDF2 iterations
      algorithm: 'AES-GCM',
      keyLength: 256
    };

    console.log('[CredentialManager] Initialized');
  }

  /**
   * Set master password and unlock
   */
  async unlock(masterPassword) {
    try {
      // Derive encryption key from master password
      this.masterKey = await this._deriveMasterKey(masterPassword);
      this.isLocked = false;

      // Start auto-lock timer
      this._resetLockTimer();

      this.emit('unlocked');

      console.log('[CredentialManager] Unlocked');

      return true;
    } catch (error) {
      console.error('[CredentialManager] Failed to unlock:', error);
      throw new Error('Failed to unlock credential manager');
    }
  }

  /**
   * Lock the credential manager
   */
  lock() {
    this.masterKey = null;
    this.isLocked = true;

    if (this.lockTimeout) {
      clearTimeout(this.lockTimeout);
      this.lockTimeout = null;
    }

    this.emit('locked');

    console.log('[CredentialManager] Locked');
  }

  /**
   * Check if locked
   */
  isManagerLocked() {
    return this.isLocked;
  }

  /**
   * Add a new credential
   */
  async addCredential(credentialData) {
    if (this.isLocked) {
      throw new Error('Credential manager is locked');
    }

    const {
      name,
      username = '',
      password = '',
      url = '',
      notes = '',
      category = 'general',
      tags = []
    } = credentialData;

    if (!name) {
      throw new Error('Credential name is required');
    }

    // Encrypt sensitive data
    const encryptedData = await this._encrypt({
      username,
      password,
      notes
    });

    const credential = {
      id: this._generateId(),
      name,
      url,
      category,
      tags,
      encryptedData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastAccessed: null
    };

    this.credentials.set(credential.id, credential);

    this._resetLockTimer();

    this.emit('credential-added', { id: credential.id, name });

    console.log('[CredentialManager] Credential added:', name);

    return credential.id;
  }

  /**
   * Get a credential (decrypted)
   */
  async getCredential(credentialId) {
    if (this.isLocked) {
      throw new Error('Credential manager is locked');
    }

    const credential = this.credentials.get(credentialId);

    if (!credential) {
      throw new Error('Credential not found');
    }

    // Decrypt sensitive data
    const decryptedData = await this._decrypt(credential.encryptedData);

    // Update last accessed
    credential.lastAccessed = Date.now();

    this._resetLockTimer();

    this.emit('credential-accessed', { id: credentialId });

    return {
      id: credential.id,
      name: credential.name,
      url: credential.url,
      category: credential.category,
      tags: credential.tags,
      ...decryptedData,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
      lastAccessed: credential.lastAccessed
    };
  }

  /**
   * List all credentials (without sensitive data)
   */
  listCredentials(options = {}) {
    const { category, tag, search } = options;

    let credentials = Array.from(this.credentials.values());

    // Filter by category
    if (category) {
      credentials = credentials.filter(c => c.category === category);
    }

    // Filter by tag
    if (tag) {
      credentials = credentials.filter(c => c.tags.includes(tag));
    }

    // Search by name or URL
    if (search) {
      const searchLower = search.toLowerCase();
      credentials = credentials.filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.url.toLowerCase().includes(searchLower)
      );
    }

    // Return without decrypted data
    return credentials.map(c => ({
      id: c.id,
      name: c.name,
      url: c.url,
      category: c.category,
      tags: c.tags,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      lastAccessed: c.lastAccessed
    }));
  }

  /**
   * Update a credential
   */
  async updateCredential(credentialId, updates) {
    if (this.isLocked) {
      throw new Error('Credential manager is locked');
    }

    const credential = this.credentials.get(credentialId);

    if (!credential) {
      throw new Error('Credential not found');
    }

    // Update non-encrypted fields
    if (updates.name) credential.name = updates.name;
    if (updates.url !== undefined) credential.url = updates.url;
    if (updates.category) credential.category = updates.category;
    if (updates.tags) credential.tags = updates.tags;

    // Update encrypted fields if provided
    if (updates.username !== undefined || updates.password !== undefined || updates.notes !== undefined) {
      const currentData = await this._decrypt(credential.encryptedData);

      const newData = {
        username: updates.username !== undefined ? updates.username : currentData.username,
        password: updates.password !== undefined ? updates.password : currentData.password,
        notes: updates.notes !== undefined ? updates.notes : currentData.notes
      };

      credential.encryptedData = await this._encrypt(newData);
    }

    credential.updatedAt = Date.now();

    this._resetLockTimer();

    this.emit('credential-updated', { id: credentialId });

    console.log('[CredentialManager] Credential updated:', credential.name);
  }

  /**
   * Delete a credential
   */
  deleteCredential(credentialId) {
    const credential = this.credentials.get(credentialId);

    if (!credential) {
      throw new Error('Credential not found');
    }

    const name = credential.name;
    this.credentials.delete(credentialId);

    this.emit('credential-deleted', { id: credentialId, name });

    console.log('[CredentialManager] Credential deleted:', name);
  }

  /**
   * Generate a strong password
   */
  generatePassword(options = {}) {
    const {
      length = 16,
      uppercase = true,
      lowercase = true,
      numbers = true,
      symbols = true,
      excludeSimilar = true
    } = options;

    let chars = '';

    if (uppercase) chars += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    if (lowercase) chars += 'abcdefghijkmnopqrstuvwxyz';
    if (numbers) chars += excludeSimilar ? '23456789' : '0123456789';
    if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (excludeSimilar) {
      // Remove similar characters: i, l, 1, I, o, O, 0
      chars = chars.replace(/[ilI1oO0]/g, '');
    }

    if (chars.length === 0) {
      throw new Error('At least one character type must be selected');
    }

    const randomBytes = new Uint8Array(length);
    crypto.getRandomValues(randomBytes);

    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars[randomBytes[i] % chars.length];
    }

    return password;
  }

  /**
   * Check password strength
   */
  checkPasswordStrength(password) {
    let score = 0;
    const feedback = [];

    // Length
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    else feedback.push('Use at least 12 characters');

    // Character types
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Include numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('Include symbols');

    // Common patterns
    if (/(.)\1{2,}/.test(password)) {
      score -= 1;
      feedback.push('Avoid repeated characters');
    }

    if (/^(12345|password|qwerty)/i.test(password)) {
      score -= 2;
      feedback.push('Avoid common patterns');
    }

    const strength = score <= 3 ? 'weak' :
                    score <= 5 ? 'medium' :
                    score <= 7 ? 'strong' : 'very strong';

    return {
      score: Math.max(0, Math.min(score, 8)),
      strength,
      feedback
    };
  }

  /**
   * Encrypt data
   */
  async _encrypt(data) {
    if (!this.masterKey) {
      throw new Error('No master key available');
    }

    const jsonData = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonData);

    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      this.masterKey,
      dataBuffer
    );

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    // Convert to base64
    return this._arrayBufferToBase64(combined);
  }

  /**
   * Decrypt data
   */
  async _decrypt(encryptedData) {
    if (!this.masterKey) {
      throw new Error('No master key available');
    }

    const combined = this._base64ToArrayBuffer(encryptedData);

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        this.masterKey,
        encrypted
      );

      const decoder = new TextDecoder();
      const jsonData = decoder.decode(decryptedBuffer);

      return JSON.parse(jsonData);
    } catch (error) {
      console.error('[CredentialManager] Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Derive master key from password
   */
  async _deriveMasterKey(password) {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Use a fixed salt (in production, should be user-specific and stored)
    const salt = encoder.encode('webos-credential-manager-salt');

    // Derive key
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.config.iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: this.config.keyLength
      },
      false,
      ['encrypt', 'decrypt']
    );

    return key;
  }

  /**
   * Reset auto-lock timer
   */
  _resetLockTimer() {
    if (this.lockTimeout) {
      clearTimeout(this.lockTimeout);
    }

    this.lockTimeout = setTimeout(() => {
      this.lock();
    }, this.config.autoLockTimeout);
  }

  /**
   * Generate unique ID
   */
  _generateId() {
    return `cred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  _base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Export encrypted credentials
   */
  async exportData() {
    return {
      credentials: Array.from(this.credentials.entries()),
      exportedAt: Date.now()
    };
  }

  /**
   * Import credentials
   */
  async importData(data) {
    if (data.credentials) {
      this.credentials = new Map(data.credentials);
      console.log('[CredentialManager] Imported', this.credentials.size, 'credentials');
    }
  }

  /**
   * Clear all data
   */
  clearAll() {
    this.credentials.clear();
    this.lock();
    this.emit('credentials-cleared');
    console.log('[CredentialManager] All credentials cleared');
  }
}

// Singleton instance
const credentialManager = new CredentialManager();

export default credentialManager;
export { CredentialManager };
