/**
 * Proxy Browser Engine
 *
 * Advanced browser engine that handles sites blocking iframe embedding:
 * - CORS proxy for bypassing X-Frame-Options
 * - Service Worker for header stripping
 * - Popup window fallback for truly blocked sites
 * - Smart detection of embed restrictions
 */

export class ProxyBrowserEngine {
  constructor() {
    this.proxyServices = [
      {
        name: 'AllOrigins',
        url: 'https://api.allorigins.win/raw?url=',
        active: true
      },
      {
        name: 'CORS Anywhere',
        url: 'https://cors-anywhere.herokuapp.com/',
        active: false // Often rate-limited
      },
      {
        name: 'ThingProxy',
        url: 'https://thingproxy.freeboard.io/fetch/',
        active: false
      }
    ];

    this.currentProxy = this.proxyServices[0];
    this.serviceWorkerReady = false;
    this.embedAttempts = new Map(); // Track failed embed attempts
  }

  /**
   * Initialize the proxy engine
   */
  async initialize() {
    console.log('🌐 Initializing Proxy Browser Engine...');

    // Register service worker for advanced header stripping
    await this.registerServiceWorker();

    console.log('✅ Proxy Browser Engine initialized');
  }

  /**
   * Register service worker to strip frame-blocking headers
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers not supported');
      return false;
    }

    try {
      // Create service worker that strips X-Frame-Options and CSP frame-ancestors
      const swCode = `
        self.addEventListener('fetch', (event) => {
          // Only intercept browser iframe requests
          if (event.request.destination === 'iframe') {
            event.respondWith(
              fetch(event.request)
                .then(response => {
                  // Clone response and modify headers
                  const headers = new Headers(response.headers);

                  // Remove frame-blocking headers
                  headers.delete('x-frame-options');
                  headers.delete('X-Frame-Options');

                  // Modify CSP to allow framing
                  if (headers.has('content-security-policy')) {
                    let csp = headers.get('content-security-policy');
                    // Remove frame-ancestors directive
                    csp = csp.replace(/frame-ancestors[^;]+(;|$)/gi, '');
                    headers.set('content-security-policy', csp);
                  }

                  // Create new response with modified headers
                  return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: headers
                  });
                })
                .catch(error => {
                  console.error('SW fetch error:', error);
                  return new Response('Error loading page', { status: 500 });
                })
            );
          }
        });

        self.addEventListener('install', () => {
          self.skipWaiting();
        });

        self.addEventListener('activate', () => {
          self.clients.claim();
        });
      `;

      const blob = new Blob([swCode], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(blob);

      const registration = await navigator.serviceWorker.register(swUrl);
      await navigator.serviceWorker.ready;

      this.serviceWorkerReady = true;
      console.log('  ✓ Service Worker registered');

      return true;
    } catch (error) {
      console.warn('  ⚠️ Service Worker registration failed:', error);
      return false;
    }
  }

  /**
   * Load URL with smart embed strategy
   * @param {string} url - URL to load
   * @param {object} options - Loading options
   * @returns {Promise<{type, element, error}>}
   */
  async loadURL(url, options = {}) {
    const {
      container,
      onLoad,
      onError,
      preferProxy = true,
      allowPopup = true
    } = options;

    // Normalize URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Check if we've failed to embed this domain before
    const domain = this.extractDomain(url);
    const failureCount = this.embedAttempts.get(domain) || 0;

    // Strategy selection based on failure history
    if (failureCount >= 2) {
      // After 2 failures, go straight to popup
      if (allowPopup) {
        return this.loadInPopup(url);
      }
    }

    // Try different loading strategies in order
    const strategies = [
      // 1. Direct iframe (fastest, works for many sites)
      () => this.loadDirectIframe(url, container),

      // 2. Iframe with service worker (strips headers)
      () => this.serviceWorkerReady ?
        this.loadWithServiceWorker(url, container) :
        Promise.reject(new Error('SW not ready')),

      // 3. Proxy iframe (uses CORS proxy)
      () => preferProxy ?
        this.loadProxyIframe(url, container) :
        Promise.reject(new Error('Proxy disabled')),

      // 4. Popup window (last resort)
      () => allowPopup ?
        this.loadInPopup(url) :
        Promise.reject(new Error('Popup disabled'))
    ];

    // Try each strategy until one succeeds
    for (const strategy of strategies) {
      try {
        const result = await this.tryLoadStrategy(strategy, url, container, onLoad, onError);

        if (result.success) {
          // Reset failure count on success
          this.embedAttempts.set(domain, 0);
          return result;
        }
      } catch (error) {
        console.log(`  Strategy failed for ${url}:`, error.message);
        continue;
      }
    }

    // All strategies failed
    this.embedAttempts.set(domain, failureCount + 1);

    return {
      type: 'error',
      element: null,
      error: 'All loading strategies failed. This site cannot be embedded.'
    };
  }

  /**
   * Try a loading strategy with timeout
   */
  async tryLoadStrategy(strategy, url, container, onLoad, onError) {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Load timeout'));
      }, 8000); // 8 second timeout

      try {
        const result = await strategy();
        clearTimeout(timeout);

        // Verify the load was successful
        if (result.element) {
          // Wait a bit to see if it actually loads
          await new Promise(r => setTimeout(r, 2000));

          const isLoaded = await this.verifyIframeLoaded(result.element);

          if (isLoaded) {
            resolve({ ...result, success: true });
            if (onLoad) onLoad(result);
          } else {
            reject(new Error('Iframe did not load properly'));
          }
        } else {
          resolve({ ...result, success: true });
        }
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Load URL in direct iframe
   */
  async loadDirectIframe(url, container) {
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.className = 'browser-iframe';
    iframe.sandbox = 'allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads';
    iframe.allow = 'fullscreen; picture-in-picture; accelerometer; gyroscope';

    if (container) {
      container.innerHTML = '';
      container.appendChild(iframe);
    }

    return {
      type: 'direct-iframe',
      element: iframe,
      url: url
    };
  }

  /**
   * Load URL with service worker assistance
   */
  async loadWithServiceWorker(url, container) {
    if (!this.serviceWorkerReady) {
      throw new Error('Service Worker not ready');
    }

    // Same as direct iframe, but service worker will intercept and modify headers
    return await this.loadDirectIframe(url, container);
  }

  /**
   * Load URL through CORS proxy
   */
  async loadProxyIframe(url, container) {
    const proxiedUrl = this.currentProxy.url + encodeURIComponent(url);

    const iframe = document.createElement('iframe');
    iframe.src = proxiedUrl;
    iframe.className = 'browser-iframe proxy-iframe';
    iframe.sandbox = 'allow-same-origin allow-scripts allow-forms allow-popups';

    // Add data attribute to track it's proxied
    iframe.dataset.originalUrl = url;
    iframe.dataset.proxyName = this.currentProxy.name;

    if (container) {
      container.innerHTML = '';
      container.appendChild(iframe);
    }

    return {
      type: 'proxy-iframe',
      element: iframe,
      url: url,
      proxiedUrl: proxiedUrl,
      proxy: this.currentProxy.name
    };
  }

  /**
   * Load URL in popup window
   */
  loadInPopup(url) {
    const popup = window.open(
      url,
      '_blank',
      'width=1200,height=800,menubar=no,toolbar=yes,location=yes,status=yes,resizable=yes,scrollbars=yes'
    );

    if (!popup) {
      throw new Error('Popup blocked by browser');
    }

    return {
      type: 'popup',
      element: popup,
      url: url,
      isPopup: true
    };
  }

  /**
   * Verify if iframe actually loaded content
   */
  async verifyIframeLoaded(iframe) {
    try {
      // Try to access iframe document
      const doc = iframe.contentDocument || iframe.contentWindow?.document;

      if (!doc) {
        return false;
      }

      // Check if it's not blank
      const hasContent = doc.body && doc.body.innerHTML.length > 0;

      return hasContent;
    } catch (error) {
      // Cross-origin - can't verify, but no error is good
      // If it's truly blocked, it would be about:blank
      try {
        const href = iframe.contentWindow?.location?.href;
        return href && href !== 'about:blank';
      } catch (e) {
        // Cross-origin error means it's loaded something
        return true;
      }
    }
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }

  /**
   * Switch to different proxy service
   */
  switchProxy() {
    const activeProxies = this.proxyServices.filter(p => p.active);
    const currentIndex = activeProxies.findIndex(p => p.name === this.currentProxy.name);
    const nextIndex = (currentIndex + 1) % activeProxies.length;
    this.currentProxy = activeProxies[nextIndex];

    console.log(`  Switched to proxy: ${this.currentProxy.name}`);
    return this.currentProxy;
  }

  /**
   * Get current proxy info
   */
  getProxyInfo() {
    return {
      current: this.currentProxy,
      available: this.proxyServices.filter(p => p.active),
      serviceWorkerEnabled: this.serviceWorkerReady
    };
  }

  /**
   * Check if URL is likely to be blocked
   */
  isLikelyBlocked(url) {
    const blockedPatterns = [
      /(^|\.)google\.[a-z.]+$/i,
      /(^|\.)github\.com$/i,
      /(^|\.)facebook\.com$/i,
      /(^|\.)twitter\.com$/i,
      /(^|\.)instagram\.com$/i,
      /(^|\.)linkedin\.com$/i,
      /(^|\.)youtube\.com$/i,
      /(^|\.)netflix\.com$/i,
      /(^|\.)amazon\.com$/i,
      /(^|\.)paypal\.com$/i,
      /(^|\.)bank/i,
      /login/i,
      /signin/i,
      /auth/i
    ];

    const domain = this.extractDomain(url);
    return blockedPatterns.some(pattern => pattern.test(domain) || pattern.test(url));
  }

  /**
   * Get recommended strategy for URL
   */
  getRecommendedStrategy(url) {
    const domain = this.extractDomain(url);
    const failures = this.embedAttempts.get(domain) || 0;

    if (failures >= 2) {
      return 'popup';
    }

    if (this.isLikelyBlocked(url)) {
      return this.serviceWorkerReady ? 'service-worker' : 'proxy';
    }

    return 'direct';
  }

  /**
   * Clear failure history for domain
   */
  clearFailureHistory(domain) {
    this.embedAttempts.delete(domain);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalDomains: this.embedAttempts.size,
      failedDomains: Array.from(this.embedAttempts.entries())
        .filter(([_, count]) => count > 0)
        .map(([domain, count]) => ({ domain, failures: count })),
      serviceWorkerActive: this.serviceWorkerReady,
      currentProxy: this.currentProxy.name
    };
  }
}

// Singleton instance
let proxyEngineInstance = null;

export function getProxyBrowserEngine() {
  if (!proxyEngineInstance) {
    proxyEngineInstance = new ProxyBrowserEngine();
  }
  return proxyEngineInstance;
}
