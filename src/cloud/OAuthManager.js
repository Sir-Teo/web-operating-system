/**
 * OAuthManager - Handles OAuth 2.0 authentication flows for cloud providers
 * Supports Google Drive, Dropbox, OneDrive, and other OAuth providers
 */
export class OAuthManager {
  constructor() {
    this.providers = new Map();
    this.tokens = new Map();
    this.authWindows = new Map();

    // OAuth provider configurations
    this.providerConfigs = {
      'google-drive': {
        authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        scopes: ['https://www.googleapis.com/auth/drive.file'],
        responseType: 'code',
        grantType: 'authorization_code'
      },
      'dropbox': {
        authEndpoint: 'https://www.dropbox.com/oauth2/authorize',
        tokenEndpoint: 'https://api.dropboxapi.com/oauth2/token',
        scopes: ['files.content.write', 'files.content.read'],
        responseType: 'code',
        grantType: 'authorization_code'
      },
      'onedrive': {
        authEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        scopes: ['Files.ReadWrite', 'offline_access'],
        responseType: 'code',
        grantType: 'authorization_code'
      }
    };

    // Listen for OAuth callback messages
    window.addEventListener('message', this.handleOAuthCallback.bind(this));
  }

  /**
   * Register a provider with client credentials
   * @param {string} providerId - Provider ID (google-drive, dropbox, onedrive)
   * @param {Object} credentials - Client credentials (clientId, clientSecret, redirectUri)
   */
  registerProvider(providerId, credentials) {
    this.providers.set(providerId, {
      ...credentials,
      config: this.providerConfigs[providerId]
    });
  }

  /**
   * Initiate OAuth flow for a provider
   * @param {string} providerId - Provider ID
   * @param {Object} options - Authentication options
   * @returns {Promise<Object>} Token response
   */
  async authenticate(providerId, options = {}) {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider not registered: ${providerId}`);
    }

    // Check for existing valid token
    const existingToken = this.getToken(providerId);
    if (existingToken && !this.isTokenExpired(existingToken)) {
      return existingToken;
    }

    // Check for refresh token
    if (existingToken?.refresh_token) {
      try {
        return await this.refreshToken(providerId, existingToken.refresh_token);
      } catch (error) {
        console.warn('Token refresh failed, starting new OAuth flow:', error);
      }
    }

    // Start new OAuth flow
    return await this.startOAuthFlow(providerId, options);
  }

  /**
   * Start OAuth authorization flow
   * @param {string} providerId - Provider ID
   * @param {Object} options - Flow options
   * @returns {Promise<Object>} Token response
   */
  async startOAuthFlow(providerId, options = {}) {
    const provider = this.providers.get(providerId);
    const config = provider.config;

    // Generate state parameter for CSRF protection
    const state = this.generateState();

    // Build authorization URL
    const authUrl = new URL(config.authEndpoint);
    authUrl.searchParams.set('client_id', provider.clientId);
    authUrl.searchParams.set('redirect_uri', provider.redirectUri);
    authUrl.searchParams.set('response_type', config.responseType);
    authUrl.searchParams.set('state', state);

    // Add scopes
    const scopes = options.scopes || config.scopes;
    authUrl.searchParams.set('scope', scopes.join(' '));

    // Provider-specific parameters
    if (providerId === 'google-drive') {
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
    } else if (providerId === 'onedrive') {
      authUrl.searchParams.set('response_mode', 'query');
    }

    // Open OAuth popup window
    const popup = window.open(
      authUrl.toString(),
      `oauth-${providerId}`,
      'width=600,height=700,scrollbars=yes'
    );

    if (!popup) {
      throw new Error('Failed to open OAuth popup. Please allow popups for this site.');
    }

    this.authWindows.set(state, { popup, providerId, resolve: null, reject: null });

    // Wait for OAuth callback
    return new Promise((resolve, reject) => {
      const authWindow = this.authWindows.get(state);
      authWindow.resolve = resolve;
      authWindow.reject = reject;

      // Timeout after 5 minutes
      setTimeout(() => {
        if (this.authWindows.has(state)) {
          popup.close();
          this.authWindows.delete(state);
          reject(new Error('OAuth authentication timeout'));
        }
      }, 5 * 60 * 1000);
    });
  }

  /**
   * Handle OAuth callback from redirect
   * @param {MessageEvent} event - Message event from OAuth popup
   */
  async handleOAuthCallback(event) {
    // Verify origin for security
    const allowedOrigins = [window.location.origin];
    if (!allowedOrigins.includes(event.origin)) {
      return;
    }

    const { type, state, code, error } = event.data;

    if (type !== 'oauth-callback') {
      return;
    }

    const authWindow = this.authWindows.get(state);
    if (!authWindow) {
      console.warn('OAuth callback received for unknown state:', state);
      return;
    }

    const { popup, providerId, resolve, reject } = authWindow;

    // Close popup
    if (popup && !popup.closed) {
      popup.close();
    }

    // Remove from pending
    this.authWindows.delete(state);

    if (error) {
      reject(new Error(`OAuth error: ${error}`));
      return;
    }

    try {
      // Exchange authorization code for access token
      const tokenResponse = await this.exchangeCodeForToken(providerId, code);

      // Store token
      this.storeToken(providerId, tokenResponse);

      resolve(tokenResponse);
    } catch (error) {
      reject(error);
    }
  }

  /**
   * Exchange authorization code for access token
   * @param {string} providerId - Provider ID
   * @param {string} code - Authorization code
   * @returns {Promise<Object>} Token response
   */
  async exchangeCodeForToken(providerId, code) {
    const provider = this.providers.get(providerId);
    const config = provider.config;

    const params = new URLSearchParams();
    params.set('client_id', provider.clientId);
    params.set('client_secret', provider.clientSecret);
    params.set('code', code);
    params.set('redirect_uri', provider.redirectUri);
    params.set('grant_type', config.grantType);

    const response = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const tokenData = await response.json();

    return {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope,
      expires_at: Date.now() + (tokenData.expires_in * 1000)
    };
  }

  /**
   * Refresh an expired access token
   * @param {string} providerId - Provider ID
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New token response
   */
  async refreshToken(providerId, refreshToken) {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider not registered: ${providerId}`);
    }

    const config = provider.config;

    const params = new URLSearchParams();
    params.set('client_id', provider.clientId);
    params.set('client_secret', provider.clientSecret);
    params.set('refresh_token', refreshToken);
    params.set('grant_type', 'refresh_token');

    const response = await fetch(config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    const tokenData = await response.json();

    const newToken = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || refreshToken, // Keep old refresh token if not provided
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope,
      expires_at: Date.now() + (tokenData.expires_in * 1000)
    };

    // Update stored token
    this.storeToken(providerId, newToken);

    return newToken;
  }

  /**
   * Store token for a provider
   * @param {string} providerId - Provider ID
   * @param {Object} token - Token data
   */
  storeToken(providerId, token) {
    this.tokens.set(providerId, token);

    // Persist to localStorage
    try {
      const tokens = this.getAllTokens();
      localStorage.setItem('cloud_oauth_tokens', JSON.stringify(tokens));
    } catch (error) {
      console.error('Failed to persist OAuth tokens:', error);
    }
  }

  /**
   * Get stored token for a provider
   * @param {string} providerId - Provider ID
   * @returns {Object|null} Token data or null
   */
  getToken(providerId) {
    // Try memory first
    let token = this.tokens.get(providerId);

    // Try localStorage
    if (!token) {
      try {
        const stored = localStorage.getItem('cloud_oauth_tokens');
        if (stored) {
          const tokens = JSON.parse(stored);
          token = tokens[providerId];
          if (token) {
            this.tokens.set(providerId, token);
          }
        }
      } catch (error) {
        console.error('Failed to load OAuth tokens:', error);
      }
    }

    return token || null;
  }

  /**
   * Get all stored tokens
   * @returns {Object} All tokens
   */
  getAllTokens() {
    const tokens = {};
    for (const [providerId, token] of this.tokens) {
      tokens[providerId] = token;
    }
    return tokens;
  }

  /**
   * Revoke token for a provider
   * @param {string} providerId - Provider ID
   */
  async revokeToken(providerId) {
    const token = this.getToken(providerId);
    if (!token) {
      return;
    }

    // Provider-specific revocation
    try {
      if (providerId === 'google-drive') {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${token.access_token}`, {
          method: 'POST'
        });
      } else if (providerId === 'dropbox') {
        await fetch('https://api.dropboxapi.com/2/auth/token/revoke', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.access_token}`
          }
        });
      }
    } catch (error) {
      console.error('Token revocation failed:', error);
    }

    // Remove from storage
    this.tokens.delete(providerId);
    try {
      const tokens = this.getAllTokens();
      localStorage.setItem('cloud_oauth_tokens', JSON.stringify(tokens));
    } catch (error) {
      console.error('Failed to update stored tokens:', error);
    }
  }

  /**
   * Check if token is expired
   * @param {Object} token - Token data
   * @returns {boolean} True if expired
   */
  isTokenExpired(token) {
    if (!token.expires_at) {
      return false; // No expiry info, assume valid
    }

    // Add 5 minute buffer
    return Date.now() >= (token.expires_at - 5 * 60 * 1000);
  }

  /**
   * Generate random state parameter
   * @returns {string} Random state
   */
  generateState() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get authorization header for a provider
   * @param {string} providerId - Provider ID
   * @returns {Promise<string>} Authorization header value
   */
  async getAuthHeader(providerId) {
    let token = this.getToken(providerId);

    // Refresh if expired
    if (token && this.isTokenExpired(token) && token.refresh_token) {
      token = await this.refreshToken(providerId, token.refresh_token);
    }

    if (!token) {
      throw new Error(`No token available for provider: ${providerId}`);
    }

    return `Bearer ${token.access_token}`;
  }

  /**
   * Check if provider is authenticated
   * @param {string} providerId - Provider ID
   * @returns {boolean} True if authenticated
   */
  isAuthenticated(providerId) {
    const token = this.getToken(providerId);
    return token && !this.isTokenExpired(token);
  }

  /**
   * Clear all tokens
   */
  clearAll() {
    this.tokens.clear();
    try {
      localStorage.removeItem('cloud_oauth_tokens');
    } catch (error) {
      console.error('Failed to clear stored tokens:', error);
    }
  }
}

// Singleton instance
let oauthManagerInstance = null;

export function getOAuthManager() {
  if (!oauthManagerInstance) {
    oauthManagerInstance = new OAuthManager();
  }
  return oauthManagerInstance;
}
