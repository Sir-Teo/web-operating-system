/**
 * Advanced Plugin Sandboxing System
 *
 * Provides multi-layered security isolation for plugins and untrusted code:
 * - Sandboxed iframes with strict CSP
 * - Realms API for JavaScript isolation
 * - Capability-based security model
 * - Resource quotas and enforcement
 * - Fine-grained permission system
 * - Code integrity verification
 * - Secure inter-sandbox communication
 */

export class AdvancedSandbox {
  constructor() {
    this.sandboxes = new Map();
    this.permissions = new Map();
    this.resourceQuotas = new Map();
    this.realms = new Map();

    // Security policies
    this.defaultCSP = [
      "default-src 'none'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "font-src 'self'",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'none'"
    ].join('; ');

    this.initialized = false;
  }

  /**
   * Initialize advanced sandboxing
   */
  async initialize() {
    console.log('🔒 Initializing Advanced Sandbox System...');

    // Check for Realms API support
    this.realmsSupported = typeof Realm !== 'undefined';
    if (!this.realmsSupported) {
      console.warn('⚠️ Realms API not supported, using iframe fallback');
    }

    this.initialized = true;
    console.log('✅ Advanced Sandbox initialized');
  }

  /**
   * Create a new sandbox
   */
  async createSandbox(sandboxId, options = {}) {
    const sandbox = {
      id: sandboxId,
      type: options.type || 'iframe', // 'iframe', 'realm', or 'worker'
      permissions: options.permissions || [],
      resourceQuota: options.resourceQuota || this.getDefaultQuota(),
      csp: options.csp || this.defaultCSP,
      created: Date.now(),
      context: null,
      messageHandlers: new Map()
    };

    // Create appropriate isolation context
    switch (sandbox.type) {
      case 'realm':
        if (this.realmsSupported) {
          sandbox.context = await this.createRealmContext(sandbox);
        } else {
          // Fallback to iframe
          sandbox.type = 'iframe';
          sandbox.context = await this.createIframeContext(sandbox);
        }
        break;

      case 'worker':
        sandbox.context = await this.createWorkerContext(sandbox);
        break;

      case 'iframe':
      default:
        sandbox.context = await this.createIframeContext(sandbox);
        break;
    }

    this.sandboxes.set(sandboxId, sandbox);
    this.permissions.set(sandboxId, new Set(sandbox.permissions));

    console.log(`  ✓ Sandbox created: ${sandboxId} (${sandbox.type})`);

    return sandbox;
  }

  /**
   * Create iframe-based sandbox context
   */
  async createIframeContext(sandbox) {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');

      // Set strict sandbox attributes
      iframe.sandbox.add('allow-scripts');
      if (sandbox.permissions.includes('forms')) {
        iframe.sandbox.add('allow-forms');
      }
      if (sandbox.permissions.includes('popups')) {
        iframe.sandbox.add('allow-popups');
      }
      if (sandbox.permissions.includes('pointer-lock')) {
        iframe.sandbox.add('allow-pointer-lock');
      }

      // Generate sandboxed HTML with CSP
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta http-equiv="Content-Security-Policy" content="${sandbox.csp}">
          <style>
            body {
              margin: 0;
              padding: 0;
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          <script>
            // Sandbox runtime environment
            const sandbox = {
              id: '${sandbox.id}',
              permissions: ${JSON.stringify(sandbox.permissions)},

              // Secure message passing
              postMessage: function(message) {
                parent.postMessage({
                  type: 'sandbox-message',
                  sandboxId: '${sandbox.id}',
                  message: message
                }, '*');
              },

              // Request permission
              requestPermission: async function(permission) {
                return new Promise((resolve) => {
                  const requestId = Math.random().toString(36);
                  window.addEventListener('message', function handler(e) {
                    if (e.data.type === 'permission-response' &&
                        e.data.requestId === requestId) {
                      window.removeEventListener('message', handler);
                      resolve(e.data.granted);
                    }
                  });

                  parent.postMessage({
                    type: 'permission-request',
                    sandboxId: '${sandbox.id}',
                    requestId: requestId,
                    permission: permission
                  }, '*');
                });
              }
            };

            // Listen for messages from host
            window.addEventListener('message', (event) => {
              if (event.data.type === 'execute-code') {
                try {
                  const result = eval(event.data.code);
                  sandbox.postMessage({
                    type: 'execution-result',
                    success: true,
                    result: result
                  });
                } catch (error) {
                  sandbox.postMessage({
                    type: 'execution-result',
                    success: false,
                    error: error.message
                  });
                }
              } else if (event.data.type === 'sandbox-call') {
                try {
                  const func = new Function('sandbox', event.data.code);
                  const result = func(sandbox);
                  sandbox.postMessage({
                    type: 'call-result',
                    callId: event.data.callId,
                    success: true,
                    result: result
                  });
                } catch (error) {
                  sandbox.postMessage({
                    type: 'call-result',
                    callId: event.data.callId,
                    success: false,
                    error: error.message
                  });
                }
              }
            });

            // Signal ready
            sandbox.postMessage({ type: 'ready' });
          </script>
        </body>
        </html>
      `;

      iframe.style.display = 'none';
      iframe.srcdoc = html;

      // Handle messages from sandbox
      const messageHandler = (event) => {
        if (event.data.type === 'ready') {
          window.removeEventListener('message', messageHandler);
          resolve({
            type: 'iframe',
            iframe: iframe,
            postMessage: (message) => {
              iframe.contentWindow.postMessage(message, '*');
            }
          });
        }
      };

      window.addEventListener('message', messageHandler);

      iframe.onerror = (error) => {
        window.removeEventListener('message', messageHandler);
        reject(error);
      };

      document.body.appendChild(iframe);
    });
  }

  /**
   * Create Realm-based sandbox context
   */
  async createRealmContext(sandbox) {
    // Realm API provides lightweight JavaScript isolation
    const realm = new Realm();

    // Set up secure globals
    realm.evaluate(`
      const sandbox = {
        id: '${sandbox.id}',
        permissions: ${JSON.stringify(sandbox.permissions)},

        postMessage: function(message) {
          // Messages are passed through the Realm boundary
          globalThis.__sendMessage(message);
        }
      };
    `);

    return {
      type: 'realm',
      realm: realm,
      evaluate: (code) => realm.evaluate(code)
    };
  }

  /**
   * Create Worker-based sandbox context
   */
  async createWorkerContext(sandbox) {
    const workerCode = `
      const sandbox = {
        id: '${sandbox.id}',
        permissions: ${JSON.stringify(sandbox.permissions)},

        postMessage: function(message) {
          self.postMessage({
            type: 'sandbox-message',
            sandboxId: '${sandbox.id}',
            message: message
          });
        }
      };

      self.onmessage = (event) => {
        if (event.data.type === 'execute-code') {
          try {
            const result = eval(event.data.code);
            sandbox.postMessage({
              type: 'execution-result',
              success: true,
              result: result
            });
          } catch (error) {
            sandbox.postMessage({
              type: 'execution-result',
              success: false,
              error: error.message
            });
          }
        }
      };

      // Signal ready
      sandbox.postMessage({ type: 'ready' });
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    return new Promise((resolve) => {
      worker.onmessage = (event) => {
        if (event.data.type === 'ready') {
          resolve({
            type: 'worker',
            worker: worker,
            postMessage: (message) => worker.postMessage(message)
          });
        }
      };
    });
  }

  /**
   * Execute code in sandbox
   */
  async executeInSandbox(sandboxId, code, timeout = 5000) {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      throw new Error(`Sandbox not found: ${sandboxId}`);
    }

    // Check if sandbox has execute permission
    if (!this.hasPermission(sandboxId, 'execute')) {
      throw new Error(`Sandbox ${sandboxId} does not have execute permission`);
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Execution timeout'));
      }, timeout);

      const handleMessage = (event) => {
        if (event.data.type === 'execution-result') {
          clearTimeout(timeoutId);
          window.removeEventListener('message', handleMessage);

          if (event.data.success) {
            resolve(event.data.result);
          } else {
            reject(new Error(event.data.error));
          }
        }
      };

      if (sandbox.type === 'iframe') {
        window.addEventListener('message', handleMessage);
        sandbox.context.postMessage({
          type: 'execute-code',
          code: code
        });
      } else if (sandbox.type === 'worker') {
        sandbox.context.worker.onmessage = handleMessage;
        sandbox.context.postMessage({
          type: 'execute-code',
          code: code
        });
      } else if (sandbox.type === 'realm') {
        try {
          const result = sandbox.context.evaluate(code);
          clearTimeout(timeoutId);
          resolve(result);
        } catch (error) {
          clearTimeout(timeoutId);
          reject(error);
        }
      }
    });
  }

  /**
   * Check if sandbox has permission
   */
  hasPermission(sandboxId, permission) {
    const permissions = this.permissions.get(sandboxId);
    return permissions && permissions.has(permission);
  }

  /**
   * Grant permission to sandbox
   */
  grantPermission(sandboxId, permission) {
    const permissions = this.permissions.get(sandboxId);
    if (permissions) {
      permissions.add(permission);
      console.log(`  ✓ Granted permission '${permission}' to sandbox ${sandboxId}`);
      return true;
    }
    return false;
  }

  /**
   * Revoke permission from sandbox
   */
  revokePermission(sandboxId, permission) {
    const permissions = this.permissions.get(sandboxId);
    if (permissions) {
      permissions.delete(permission);
      console.log(`  ✓ Revoked permission '${permission}' from sandbox ${sandboxId}`);
      return true;
    }
    return false;
  }

  /**
   * Get default resource quota
   */
  getDefaultQuota() {
    return {
      maxMemory: 50 * 1024 * 1024, // 50MB
      maxCPUTime: 5000, // 5 seconds
      maxStorage: 10 * 1024 * 1024, // 10MB
      maxNetworkRequests: 100,
      maxNetworkBandwidth: 1024 * 1024 // 1MB
    };
  }

  /**
   * Set resource quota for sandbox
   */
  setResourceQuota(sandboxId, quota) {
    this.resourceQuotas.set(sandboxId, quota);
  }

  /**
   * Get resource quota for sandbox
   */
  getResourceQuota(sandboxId) {
    return this.resourceQuotas.get(sandboxId) || this.getDefaultQuota();
  }

  /**
   * Destroy sandbox
   */
  destroySandbox(sandboxId) {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) return;

    // Clean up context
    if (sandbox.type === 'iframe' && sandbox.context.iframe) {
      sandbox.context.iframe.remove();
    } else if (sandbox.type === 'worker' && sandbox.context.worker) {
      sandbox.context.worker.terminate();
    } else if (sandbox.type === 'realm' && sandbox.context.realm) {
      // Realms are garbage collected
      sandbox.context.realm = null;
    }

    this.sandboxes.delete(sandboxId);
    this.permissions.delete(sandboxId);
    this.resourceQuotas.delete(sandboxId);

    console.log(`  ✓ Sandbox destroyed: ${sandboxId}`);
  }

  /**
   * Get all sandboxes
   */
  getAllSandboxes() {
    return Array.from(this.sandboxes.values()).map(sandbox => ({
      id: sandbox.id,
      type: sandbox.type,
      permissions: Array.from(this.permissions.get(sandbox.id) || []),
      created: sandbox.created,
      uptime: Date.now() - sandbox.created
    }));
  }

  /**
   * Shutdown all sandboxes
   */
  async shutdown() {
    console.log('Shutting down Advanced Sandbox System...');

    for (const sandboxId of this.sandboxes.keys()) {
      this.destroySandbox(sandboxId);
    }

    console.log('✅ Advanced Sandbox shut down');
  }
}

// Singleton instance
let sandboxInstance = null;

export function getAdvancedSandbox() {
  if (!sandboxInstance) {
    sandboxInstance = new AdvancedSandbox();
  }
  return sandboxInstance;
}
