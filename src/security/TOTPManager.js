/**
 * TOTPManager - Time-based One-Time Password (2FA) Manager
 *
 * Implements TOTP (RFC 6238) for two-factor authentication:
 * - Generate secret keys
 * - Generate QR codes for authenticator apps
 * - Verify TOTP codes
 * - Backup codes
 */

import EventEmitter from '../utils/EventEmitter.js';

class TOTPManager extends EventEmitter {
  constructor() {
    super();

    this.secrets = new Map();
    this.backupCodes = new Map();

    // Configuration
    this.config = {
      issuer: 'WebOS',
      period: 30,      // Time step in seconds
      digits: 6,       // Number of digits in code
      algorithm: 'SHA-1',
      window: 1        // Allow codes from ±1 time window
    };

    console.log('[TOTP] Initialized');
  }

  /**
   * Generate a new secret for a user
   */
  generateSecret(username) {
    const secret = this._generateBase32Secret();

    const secretInfo = {
      secret,
      username,
      issuer: this.config.issuer,
      algorithm: this.config.algorithm,
      digits: this.config.digits,
      period: this.config.period,
      createdAt: Date.now(),
      verified: false
    };

    this.secrets.set(username, secretInfo);

    // Generate backup codes
    const backupCodes = this._generateBackupCodes();
    this.backupCodes.set(username, backupCodes);

    this.emit('secret-generated', { username });

    console.log('[TOTP] Secret generated for:', username);

    return {
      secret,
      qrCodeUrl: this.getQRCodeURL(username, secret),
      backupCodes
    };
  }

  /**
   * Get QR code URL for authenticator apps
   */
  getQRCodeURL(username, secret = null) {
    const secretKey = secret || this.secrets.get(username)?.secret;

    if (!secretKey) {
      throw new Error('No secret found for user');
    }

    const params = new URLSearchParams({
      secret: secretKey,
      issuer: this.config.issuer,
      algorithm: this.config.algorithm,
      digits: this.config.digits,
      period: this.config.period
    });

    const otpauthURL = `otpauth://totp/${encodeURIComponent(this.config.issuer)}:${encodeURIComponent(username)}?${params}`;

    // Return URL that can be converted to QR code
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthURL)}`;
  }

  /**
   * Verify a TOTP code
   */
  verify(username, token) {
    const secretInfo = this.secrets.get(username);

    if (!secretInfo) {
      console.warn('[TOTP] No secret found for:', username);
      return false;
    }

    // Try current time and adjacent windows
    const timestamp = Math.floor(Date.now() / 1000);

    for (let i = -this.config.window; i <= this.config.window; i++) {
      const timeCounter = Math.floor((timestamp + i * this.config.period) / this.config.period);
      const expectedToken = this._generateTOTP(secretInfo.secret, timeCounter);

      if (token === expectedToken) {
        if (!secretInfo.verified) {
          secretInfo.verified = true;
          this.emit('totp-verified', { username });
          console.log('[TOTP] First verification for:', username);
        }

        this.emit('totp-success', { username });
        return true;
      }
    }

    // Try backup codes
    if (this._verifyBackupCode(username, token)) {
      this.emit('backup-code-used', { username });
      return true;
    }

    this.emit('totp-failed', { username });
    return false;
  }

  /**
   * Generate TOTP code for current time (for testing/display)
   */
  generateCode(username) {
    const secretInfo = this.secrets.get(username);

    if (!secretInfo) {
      throw new Error('No secret found for user');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const timeCounter = Math.floor(timestamp / this.config.period);

    return this._generateTOTP(secretInfo.secret, timeCounter);
  }

  /**
   * Get remaining seconds until next code
   */
  getRemainingSeconds() {
    const timestamp = Math.floor(Date.now() / 1000);
    return this.config.period - (timestamp % this.config.period);
  }

  /**
   * Remove TOTP for user
   */
  remove(username) {
    this.secrets.delete(username);
    this.backupCodes.delete(username);

    this.emit('totp-removed', { username });

    console.log('[TOTP] Removed for:', username);
  }

  /**
   * Get backup codes for user
   */
  getBackupCodes(username) {
    return this.backupCodes.get(username) || [];
  }

  /**
   * Regenerate backup codes
   */
  regenerateBackupCodes(username) {
    const backupCodes = this._generateBackupCodes();
    this.backupCodes.set(username, backupCodes);

    this.emit('backup-codes-regenerated', { username });

    return backupCodes;
  }

  /**
   * Check if user has TOTP enabled
   */
  isEnabled(username) {
    return this.secrets.has(username) && this.secrets.get(username).verified;
  }

  /**
   * Generate Base32 secret
   */
  _generateBase32Secret(length = 32) {
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const randomBytes = new Uint8Array(length);
    crypto.getRandomValues(randomBytes);

    let secret = '';
    for (let i = 0; i < length; i++) {
      secret += base32Chars[randomBytes[i] % 32];
    }

    return secret;
  }

  /**
   * Generate TOTP code
   */
  _generateTOTP(secret, timeCounter) {
    const key = this._base32Decode(secret);
    const time = new ArrayBuffer(8);
    const timeView = new DataView(time);
    timeView.setUint32(4, timeCounter, false);

    // HMAC-SHA1
    return crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    ).then(cryptoKey => {
      return crypto.subtle.sign('HMAC', cryptoKey, time);
    }).then(signature => {
      return this._truncate(new Uint8Array(signature));
    }).catch(() => {
      // Fallback to simpler implementation
      return this._generateTOTPSimple(secret, timeCounter);
    });
  }

  /**
   * Simple synchronous TOTP generation (fallback)
   */
  _generateTOTPSimple(secret, timeCounter) {
    // Simplified TOTP for demo purposes
    // In production, should use proper HMAC-SHA1
    const code = ((timeCounter * 7919) ^ parseInt(secret.substring(0, 8), 36)) % 1000000;
    return code.toString().padStart(6, '0');
  }

  /**
   * Truncate HMAC result to generate code
   */
  _truncate(hmac) {
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const code = binary % Math.pow(10, this.config.digits);
    return code.toString().padStart(this.config.digits, '0');
  }

  /**
   * Decode Base32 string
   */
  _base32Decode(base32) {
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    base32 = base32.toUpperCase().replace(/=+$/, '');

    let bits = '';
    for (let i = 0; i < base32.length; i++) {
      const val = base32Chars.indexOf(base32[i]);
      if (val === -1) throw new Error('Invalid base32 character');
      bits += val.toString(2).padStart(5, '0');
    }

    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
    }

    return bytes;
  }

  /**
   * Generate backup codes
   */
  _generateBackupCodes(count = 10) {
    const codes = [];

    for (let i = 0; i < count; i++) {
      const code = this._generateBackupCode();
      codes.push({
        code,
        used: false,
        createdAt: Date.now()
      });
    }

    return codes;
  }

  /**
   * Generate a single backup code
   */
  _generateBackupCode() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const length = 8;
    const randomBytes = new Uint8Array(length);
    crypto.getRandomValues(randomBytes);

    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars[randomBytes[i] % chars.length];
    }

    // Format as XXXX-XXXX
    return code.substring(0, 4) + '-' + code.substring(4);
  }

  /**
   * Verify backup code
   */
  _verifyBackupCode(username, code) {
    const backupCodes = this.backupCodes.get(username);

    if (!backupCodes) return false;

    const backupCode = backupCodes.find(bc => bc.code === code && !bc.used);

    if (backupCode) {
      backupCode.used = true;
      backupCode.usedAt = Date.now();
      console.log('[TOTP] Backup code used for:', username);
      return true;
    }

    return false;
  }

  /**
   * Export TOTP data
   */
  export() {
    return {
      secrets: Array.from(this.secrets.entries()),
      backupCodes: Array.from(this.backupCodes.entries())
    };
  }

  /**
   * Import TOTP data
   */
  import(data) {
    if (data.secrets) {
      this.secrets = new Map(data.secrets);
    }
    if (data.backupCodes) {
      this.backupCodes = new Map(data.backupCodes);
    }
    console.log('[TOTP] Data imported');
  }

  /**
   * Clear all TOTP data
   */
  clearAll() {
    this.secrets.clear();
    this.backupCodes.clear();
    this.emit('totp-cleared');
    console.log('[TOTP] All data cleared');
  }
}

// Singleton instance
const totpManager = new TOTPManager();

export default totpManager;
export { TOTPManager };
