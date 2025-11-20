/**
 * Security Center - Comprehensive Security Management Application
 *
 * Features:
 * - WebAuthn management
 * - TOTP 2FA setup
 * - Credential vault
 * - Security audit logs
 * - Security dashboard
 */

import WebAuthnManager from '../../security/WebAuthnManager.js';
import TOTPManager from '../../security/TOTPManager.js';
import CredentialManager from '../../security/CredentialManager.js';
import SecurityAuditLogger from '../../security/SecurityAuditLogger.js';

class SecurityCenter {
  constructor(context) {
    this.context = context;
    this.container = null;
    this.currentTab = 'dashboard';

    console.log('[SecurityCenter] Initialized');
  }

  async init() {
    // Initialize security managers
    this.webAuthn = WebAuthnManager;
    this.totp = TOTPManager;
    this.credentials = CredentialManager;
    this.audit = SecurityAuditLogger;
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'security-center';

    this.container.innerHTML = `
      <div class="security-header">
        <div class="header-content">
          <h1>🔒 Security Center</h1>
          <p class="subtitle">Manage your security and privacy settings</p>
        </div>
      </div>

      <div class="security-content">
        <!-- Tabs -->
        <div class="security-tabs">
          <button class="tab-btn active" data-tab="dashboard">📊 Dashboard</button>
          <button class="tab-btn" data-tab="webauthn">🔐 Biometric</button>
          <button class="tab-btn" data-tab="totp">🔑 2FA</button>
          <button class="tab-btn" data-tab="vault">🗝️ Vault</button>
          <button class="tab-btn" data-tab="audit">📋 Audit Log</button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <div id="dashboard-tab" class="tab-pane active"></div>
          <div id="webauthn-tab" class="tab-pane"></div>
          <div id="totp-tab" class="tab-pane"></div>
          <div id="vault-tab" class="tab-pane"></div>
          <div id="audit-tab" class="tab-pane"></div>
        </div>
      </div>
    `;

    this._setupEventListeners();
    this._renderDashboard();
    this._renderWebAuthn();
    this._renderTOTP();
    this._renderVault();
    this._renderAudit();

    return this.container;
  }

  _setupEventListeners() {
    // Tab switching
    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        this._switchTab(tab);
      });
    });
  }

  _switchTab(tabName) {
    // Update buttons
    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    this.container.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update content
    this.container.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.remove('active');
    });
    this.container.querySelector(`#${tabName}-tab`).classList.add('active');

    this.currentTab = tabName;
  }

  _renderDashboard() {
    const tab = this.container.querySelector('#dashboard-tab');
    const stats = this.audit.getStatistics();

    tab.innerHTML = `
      <div class="dashboard">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🔐</div>
            <div class="stat-value">${this.webAuthn.isAvailable ? 'Available' : 'Not Available'}</div>
            <div class="stat-label">Biometric Auth</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔑</div>
            <div class="stat-value">${this.totp.secrets.size}</div>
            <div class="stat-label">2FA Enabled</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🗝️</div>
            <div class="stat-value">${this.credentials.credentials.size}</div>
            <div class="stat-label">Stored Credentials</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">Audit Events (24h)</div>
          </div>
        </div>

        <div class="security-status">
          <h3>Security Status</h3>
          <div class="status-items">
            <div class="status-item ${this.webAuthn.getCredentials().length > 0 ? 'good' : 'warning'}">
              <span class="status-icon">${this.webAuthn.getCredentials().length > 0 ? '✓' : '⚠'}</span>
              <span>Biometric Authentication</span>
            </div>
            <div class="status-item ${this.totp.secrets.size > 0 ? 'good' : 'warning'}">
              <span class="status-icon">${this.totp.secrets.size > 0 ? '✓' : '⚠'}</span>
              <span>Two-Factor Authentication</span>
            </div>
            <div class="status-item good">
              <span class="status-icon">✓</span>
              <span>Audit Logging Active</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _renderWebAuthn() {
    const tab = this.container.querySelector('#webauthn-tab');

    tab.innerHTML = `
      <div class="webauthn-panel">
        <h3>Biometric Authentication</h3>
        <p>Use your fingerprint, face, or security key to authenticate</p>

        <div class="action-section">
          <button id="register-webauthn" class="btn-primary">Register New Device</button>
          <button id="test-webauthn" class="btn-secondary">Test Authentication</button>
        </div>

        <div class="credentials-list" id="webauthn-list"></div>
      </div>
    `;

    // Event listeners
    tab.querySelector('#register-webauthn').addEventListener('click', () => this._registerWebAuthn());
    tab.querySelector('#test-webauthn').addEventListener('click', () => this._testWebAuthn());

    this._updateWebAuthnList();
  }

  async _registerWebAuthn() {
    try {
      const username = this.context.user?.username || 'user';
      const result = await this.webAuthn.register(username, username);

      this.audit.logAuth('webauthn-register', username, true);
      alert('Biometric credential registered successfully!');
      this._updateWebAuthnList();
      this._renderDashboard();
    } catch (error) {
      this.audit.logAuth('webauthn-register', 'user', false, { error: error.message });
      alert(`Failed to register: ${error.message}`);
    }
  }

  async _testWebAuthn() {
    try {
      const result = await this.webAuthn.authenticate();
      this.audit.logAuth('webauthn-authenticate', result.username, true);
      alert(`Authentication successful! Welcome, ${result.username}`);
    } catch (error) {
      this.audit.logAuth('webauthn-authenticate', 'unknown', false, { error: error.message });
      alert(`Authentication failed: ${error.message}`);
    }
  }

  _updateWebAuthnList() {
    const list = this.container.querySelector('#webauthn-list');
    const credentials = this.webAuthn.getCredentials();

    if (credentials.length === 0) {
      list.innerHTML = '<p class="empty-state">No biometric credentials registered</p>';
      return;
    }

    list.innerHTML = credentials.map(cred => `
      <div class="credential-item">
        <div>
          <strong>${cred.username}</strong>
          <small>Registered: ${new Date(cred.createdAt).toLocaleDateString()}</small>
        </div>
        <button class="btn-small btn-danger" onclick="this.closest('.security-center').dispatchEvent(new CustomEvent('remove-webauthn', {detail: '${cred.username}'}))">Remove</button>
      </div>
    `).join('');
  }

  _renderTOTP() {
    const tab = this.container.querySelector('#totp-tab');

    tab.innerHTML = `
      <div class="totp-panel">
        <h3>Two-Factor Authentication (2FA)</h3>
        <p>Add an extra layer of security with time-based codes</p>

        <div class="action-section">
          <button id="setup-totp" class="btn-primary">Setup 2FA</button>
        </div>

        <div id="totp-setup" class="totp-setup" style="display: none;"></div>
        <div id="totp-list"></div>
      </div>
    `;

    tab.querySelector('#setup-totp').addEventListener('click', () => this._setupTOTP());
    this._updateTOTPList();
  }

  _setupTOTP() {
    const username = this.context.user?.username || 'user';
    const result = this.totp.generateSecret(username);

    const setupDiv = this.container.querySelector('#totp-setup');
    setupDiv.style.display = 'block';

    setupDiv.innerHTML = `
      <div class="totp-setup-content">
        <h4>Scan this QR Code</h4>
        <img src="${result.qrCodeUrl}" alt="QR Code" class="qr-code"/>

        <p><strong>Secret Key:</strong> <code>${result.secret}</code></p>

        <h4>Backup Codes</h4>
        <p>Save these codes in a safe place. Each can be used once if you lose access to your authenticator.</p>
        <div class="backup-codes">
          ${result.backupCodes.map(bc => `<code>${bc.code}</code>`).join('')}
        </div>

        <div class="verification">
          <input type="text" id="totp-verify" placeholder="Enter 6-digit code" maxlength="6"/>
          <button id="verify-totp" class="btn-primary">Verify</button>
        </div>
      </div>
    `;

    setupDiv.querySelector('#verify-totp').addEventListener('click', () => {
      const code = setupDiv.querySelector('#totp-verify').value;
      if (this.totp.verify(username, code)) {
        this.audit.logAuth('totp-setup', username, true);
        alert('2FA verified and enabled!');
        setupDiv.style.display = 'none';
        this._updateTOTPList();
        this._renderDashboard();
      } else {
        this.audit.logAuth('totp-verify', username, false);
        alert('Invalid code. Please try again.');
      }
    });
  }

  _updateTOTPList() {
    const list = this.container.querySelector('#totp-list');
    const secrets = Array.from(this.totp.secrets.entries());

    if (secrets.length === 0) {
      list.innerHTML = '<p class="empty-state">2FA not configured</p>';
      return;
    }

    list.innerHTML = secrets.map(([username, info]) => `
      <div class="credential-item">
        <div>
          <strong>${username}</strong>
          <small>${info.verified ? '✓ Verified' : '⚠ Not verified'}</small>
        </div>
        <button class="btn-small btn-danger" onclick="this.closest('.security-center').dispatchEvent(new CustomEvent('remove-totp', {detail: '${username}'}))">Remove</button>
      </div>
    `).join('');
  }

  _renderVault() {
    const tab = this.container.querySelector('#vault-tab');

    tab.innerHTML = `
      <div class="vault-panel">
        <h3>Credential Vault</h3>
        <p>Securely store passwords and sensitive information</p>

        ${this.credentials.isManagerLocked() ? `
          <div class="vault-locked">
            <div class="lock-icon">🔒</div>
            <h4>Vault is Locked</h4>
            <p>Enter your master password to unlock</p>
            <div class="unlock-form">
              <input type="password" id="master-password" placeholder="Master Password"/>
              <button id="unlock-vault" class="btn-primary">Unlock</button>
            </div>
          </div>
        ` : `
          <div class="vault-unlocked">
            <div class="action-section">
              <button id="add-credential" class="btn-primary">Add Credential</button>
              <button id="lock-vault" class="btn-secondary">Lock Vault</button>
              <button id="generate-password" class="btn-secondary">Generate Password</button>
            </div>
            <div id="credentials-list"></div>
          </div>
        `}
      </div>
    `;

    if (this.credentials.isManagerLocked()) {
      tab.querySelector('#unlock-vault').addEventListener('click', async () => {
        const password = tab.querySelector('#master-password').value;
        try {
          await this.credentials.unlock(password);
          this.audit.logAuth('vault-unlock', 'user', true);
          this._renderVault();
        } catch (error) {
          this.audit.logAuth('vault-unlock', 'user', false);
          alert('Failed to unlock vault');
        }
      });
    } else {
      tab.querySelector('#lock-vault').addEventListener('click', () => {
        this.credentials.lock();
        this.audit.logAuth('vault-lock', 'user', true);
        this._renderVault();
      });
      tab.querySelector('#add-credential').addEventListener('click', () => this._showAddCredentialDialog());
      tab.querySelector('#generate-password').addEventListener('click', () => this._showPasswordGenerator());
      this._updateCredentialsList();
    }
  }

  async _showAddCredentialDialog() {
    const name = prompt('Credential name:');
    if (!name) return;

    const username = prompt('Username:');
    const password = prompt('Password:');
    const url = prompt('URL (optional):');

    try {
      await this.credentials.addCredential({ name, username, password, url });
      this.audit.logDataAccess('credential-add', 'user', name);
      alert('Credential added successfully!');
      this._updateCredentialsList();
      this._renderDashboard();
    } catch (error) {
      alert(`Failed to add credential: ${error.message}`);
    }
  }

  _showPasswordGenerator() {
    const password = this.credentials.generatePassword({ length: 16 });
    prompt('Generated password (copy it):', password);
  }

  _updateCredentialsList() {
    const list = this.container.querySelector('#credentials-list');
    const credentials = this.credentials.listCredentials();

    if (credentials.length === 0) {
      list.innerHTML = '<p class="empty-state">No credentials stored</p>';
      return;
    }

    list.innerHTML = credentials.map(cred => `
      <div class="credential-item">
        <div>
          <strong>${cred.name}</strong>
          ${cred.url ? `<small>${cred.url}</small>` : ''}
        </div>
        <div class="actions">
          <button class="btn-small" onclick="this.closest('.security-center').dispatchEvent(new CustomEvent('view-credential', {detail: '${cred.id}'}))">View</button>
          <button class="btn-small btn-danger" onclick="this.closest('.security-center').dispatchEvent(new CustomEvent('delete-credential', {detail: '${cred.id}'}))">Delete</button>
        </div>
      </div>
    `).join('');
  }

  _renderAudit() {
    const tab = this.container.querySelector('#audit-tab');
    const logs = this.audit.getLogs({ limit: 100 });

    tab.innerHTML = `
      <div class="audit-panel">
        <h3>Security Audit Log</h3>
        <p>View recent security events and activities</p>

        <div class="audit-controls">
          <button id="export-logs" class="btn-secondary">Export Logs</button>
          <button id="clear-logs" class="btn-danger">Clear Logs</button>
        </div>

        <div class="audit-logs">
          ${logs.length === 0 ? '<p class="empty-state">No audit logs</p>' :
            logs.map(log => `
              <div class="log-entry severity-${log.severity}">
                <div class="log-time">${new Date(log.timestamp).toLocaleString()}</div>
                <div class="log-details">
                  <strong>${log.action}</strong>
                  <span class="log-user">${log.user}</span>
                  <span class="log-type">${log.type}</span>
                  <span class="log-status">${log.success ? '✓' : '✗'}</span>
                </div>
              </div>
            `).join('')
          }
        </div>
      </div>
    `;

    tab.querySelector('#export-logs').addEventListener('click', () => {
      const data = this.audit.exportLogs('json');
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${Date.now()}.json`;
      a.click();
    });

    tab.querySelector('#clear-logs').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all audit logs?')) {
        this.audit.clearLogs();
        this._renderAudit();
      }
    });
  }

  destroy() {
    // Cleanup
  }
}

export default SecurityCenter;
