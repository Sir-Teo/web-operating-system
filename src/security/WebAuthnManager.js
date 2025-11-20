/**
 * WebAuthnManager - Biometric and Hardware Key Authentication
 *
 * Implements WebAuthn (Web Authentication API) for:
 * - Fingerprint authentication
 * - Face recognition
 * - Hardware security keys (YubiKey, etc.)
 * - Platform authenticators (Windows Hello, Touch ID)
 */

import EventEmitter from '../utils/EventEmitter.js';

class WebAuthnManager extends EventEmitter {
  constructor() {
    super();

    this.credentials = new Map();
    this.isAvailable = this.checkAvailability();

    // Configuration
    this.config = {
      rpName: 'WebOS',
      rpId: window.location.hostname,
      timeout: 60000,
      attestation: 'none',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform' // 'platform' or 'cross-platform'
    };

    console.log('[WebAuthn] Initialized. Available:', this.isAvailable);
  }

  /**
   * Check if WebAuthn is available
   */
  checkAvailability() {
    if (!window.PublicKeyCredential) {
      console.warn('[WebAuthn] Not supported in this browser');
      return false;
    }
    return true;
  }

  /**
   * Check platform authenticator availability
   */
  async isPlatformAuthenticatorAvailable() {
    if (!this.isAvailable) return false;

    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (error) {
      console.error('[WebAuthn] Error checking platform authenticator:', error);
      return false;
    }
  }

  /**
   * Register a new credential (enrollment)
   */
  async register(username, displayName = null) {
    if (!this.isAvailable) {
      throw new Error('WebAuthn not supported');
    }

    const userId = this.generateUserId(username);

    // Create credential options
    const publicKeyCredentialCreationOptions = {
      challenge: this.generateChallenge(),
      rp: {
        name: this.config.rpName,
        id: this.config.rpId
      },
      user: {
        id: userId,
        name: username,
        displayName: displayName || username
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },   // ES256
        { alg: -257, type: 'public-key' }  // RS256
      ],
      timeout: this.config.timeout,
      attestation: this.config.attestation,
      authenticatorSelection: {
        authenticatorAttachment: this.config.authenticatorAttachment,
        requireResidentKey: false,
        userVerification: this.config.userVerification
      }
    };

    try {
      // Request credential creation
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });

      // Store credential info
      const credentialInfo = {
        credentialId: this.arrayBufferToBase64(credential.rawId),
        publicKey: this.arrayBufferToBase64(credential.response.getPublicKey()),
        username,
        displayName: displayName || username,
        counter: credential.response.getAuthenticatorData ?
          this.getCounter(credential.response.getAuthenticatorData()) : 0,
        createdAt: Date.now(),
        lastUsed: null,
        aaguid: credential.response.getAuthenticatorData ?
          this.getAAGUID(credential.response.getAuthenticatorData()) : null
      };

      this.credentials.set(username, credentialInfo);

      this.emit('credential-registered', {
        username,
        credentialId: credentialInfo.credentialId
      });

      console.log('[WebAuthn] Credential registered for:', username);

      return {
        success: true,
        credentialId: credentialInfo.credentialId
      };

    } catch (error) {
      console.error('[WebAuthn] Registration failed:', error);

      this.emit('registration-failed', {
        username,
        error: error.message
      });

      throw new Error(`WebAuthn registration failed: ${error.message}`);
    }
  }

  /**
   * Authenticate with existing credential
   */
  async authenticate(username = null) {
    if (!this.isAvailable) {
      throw new Error('WebAuthn not supported');
    }

    // Get allowed credentials
    let allowCredentials = [];

    if (username) {
      const credentialInfo = this.credentials.get(username);
      if (credentialInfo) {
        allowCredentials = [{
          type: 'public-key',
          id: this.base64ToArrayBuffer(credentialInfo.credentialId)
        }];
      }
    } else {
      // Allow any registered credential
      allowCredentials = Array.from(this.credentials.values()).map(cred => ({
        type: 'public-key',
        id: this.base64ToArrayBuffer(cred.credentialId)
      }));
    }

    const publicKeyCredentialRequestOptions = {
      challenge: this.generateChallenge(),
      timeout: this.config.timeout,
      rpId: this.config.rpId,
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
      userVerification: this.config.userVerification
    };

    try {
      // Request authentication
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      // Find matching credential
      const credentialId = this.arrayBufferToBase64(assertion.rawId);
      const matchedCredential = Array.from(this.credentials.entries())
        .find(([, cred]) => cred.credentialId === credentialId);

      if (!matchedCredential) {
        throw new Error('Unknown credential');
      }

      const [authenticatedUsername, credentialInfo] = matchedCredential;

      // Update credential info
      credentialInfo.lastUsed = Date.now();
      credentialInfo.counter = this.getCounter(assertion.response.authenticatorData);

      this.emit('authentication-success', {
        username: authenticatedUsername,
        credentialId
      });

      console.log('[WebAuthn] Authentication successful for:', authenticatedUsername);

      return {
        success: true,
        username: authenticatedUsername,
        credentialId
      };

    } catch (error) {
      console.error('[WebAuthn] Authentication failed:', error);

      this.emit('authentication-failed', {
        error: error.message
      });

      throw new Error(`WebAuthn authentication failed: ${error.message}`);
    }
  }

  /**
   * Remove a credential
   */
  removeCredential(username) {
    if (this.credentials.has(username)) {
      this.credentials.delete(username);

      this.emit('credential-removed', { username });

      console.log('[WebAuthn] Credential removed for:', username);
      return true;
    }
    return false;
  }

  /**
   * Get all registered credentials
   */
  getCredentials() {
    return Array.from(this.credentials.entries()).map(([username, info]) => ({
      username,
      displayName: info.displayName,
      createdAt: info.createdAt,
      lastUsed: info.lastUsed,
      credentialId: info.credentialId
    }));
  }

  /**
   * Generate random challenge
   */
  generateChallenge() {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    return challenge;
  }

  /**
   * Generate user ID
   */
  generateUserId(username) {
    const encoder = new TextEncoder();
    return encoder.encode(username);
  }

  /**
   * Get counter from authenticator data
   */
  getCounter(authData) {
    try {
      const view = new DataView(authData.buffer || authData);
      return view.getUint32(33, false); // Counter is at byte 33-36
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get AAGUID from authenticator data
   */
  getAAGUID(authData) {
    try {
      const view = new DataView(authData.buffer || authData);
      const aaguid = new Uint8Array(authData.buffer || authData, 37, 16);
      return this.arrayBufferToBase64(aaguid);
    } catch (error) {
      return null;
    }
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
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
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Export credentials (for storage)
   */
  exportCredentials() {
    const data = {};
    this.credentials.forEach((value, key) => {
      data[key] = value;
    });
    return JSON.stringify(data);
  }

  /**
   * Import credentials (from storage)
   */
  importCredentials(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      Object.entries(data).forEach(([key, value]) => {
        this.credentials.set(key, value);
      });
      console.log('[WebAuthn] Imported', Object.keys(data).length, 'credentials');
    } catch (error) {
      console.error('[WebAuthn] Failed to import credentials:', error);
    }
  }

  /**
   * Clear all credentials
   */
  clearAll() {
    this.credentials.clear();
    this.emit('credentials-cleared');
    console.log('[WebAuthn] All credentials cleared');
  }
}

// Singleton instance
const webAuthnManager = new WebAuthnManager();

export default webAuthnManager;
export { WebAuthnManager };
