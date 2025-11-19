/**
 * NetworkInspector - Network Request Monitoring
 *
 * Features:
 * - Request/response interception
 * - HAR export
 * - Network throttling
 * - Request filtering
 */

export class NetworkInspector {
  constructor() {
    this.requests = [];
    this.active = false;
    this.blockedURLs = new Set();
    this.throttle = null;
    this.listeners = new Map();
    this.requestId = 0;
  }

  /**
   * Start monitoring network requests
   */
  start() {
    if (this.active) return;

    this.active = true;
    this._interceptFetch();
    this._interceptXHR();
  }

  /**
   * Stop monitoring
   */
  stop() {
    this.active = false;
    this._restoreFetch();
    this._restoreXHR();
  }

  /**
   * Get all requests
   */
  getRequests(filter = {}) {
    let requests = [...this.requests];

    if (filter.method) {
      requests = requests.filter(r => r.method === filter.method);
    }

    if (filter.status) {
      requests = requests.filter(r => r.response?.status === filter.status);
    }

    if (filter.url) {
      requests = requests.filter(r => r.url.includes(filter.url));
    }

    if (filter.filter) {
      requests = requests.filter(filter.filter);
    }

    return requests;
  }

  /**
   * Clear all requests
   */
  clear() {
    this.requests = [];
    this._emit('clear');
  }

  /**
   * Export as HAR format
   */
  exportHAR() {
    const har = {
      log: {
        version: '1.2',
        creator: {
          name: 'WebOS NetworkInspector',
          version: '1.0'
        },
        entries: this.requests.map(req => this._toHAREntry(req))
      }
    };

    return har;
  }

  /**
   * Block URL pattern
   */
  blockURL(pattern) {
    this.blockedURLs.add(pattern);
  }

  /**
   * Unblock URL pattern
   */
  unblockURL(pattern) {
    this.blockedURLs.delete(pattern);
  }

  /**
   * Set network throttling
   */
  setThrottle(profile) {
    const profiles = {
      'Fast 3G': { downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 562.5 },
      'Slow 3G': { downloadThroughput: 500 * 1024 / 8, uploadThroughput: 500 * 1024 / 8, latency: 2000 },
      '3G': { downloadThroughput: 750 * 1024 / 8, uploadThroughput: 250 * 1024 / 8, latency: 100 },
      '4G': { downloadThroughput: 4 * 1024 * 1024 / 8, uploadThroughput: 3 * 1024 * 1024 / 8, latency: 20 }
    };

    this.throttle = profiles[profile] || null;
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Private methods

  _interceptFetch() {
    const original = window.fetch;

    window.fetch = async (url, options = {}) => {
      if (!this.active) {
        return original(url, options);
      }

      // Check if blocked
      if (this._isBlocked(url)) {
        throw new Error(`Request blocked: ${url}`);
      }

      const requestId = ++this.requestId;
      const startTime = performance.now();

      const request = {
        id: requestId,
        method: options.method || 'GET',
        url: typeof url === 'string' ? url : url.url,
        headers: options.headers || {},
        body: options.body,
        timestamp: Date.now(),
        startTime
      };

      this.requests.push(request);
      this._emit('request', request);

      try {
        // Apply throttling
        if (this.throttle) {
          await this._delay(this.throttle.latency);
        }

        const response = await original(url, options);

        const endTime = performance.now();

        request.response = {
          status: response.status,
          statusText: response.statusText,
          headers: this._parseHeaders(response.headers),
          time: endTime - startTime,
          size: parseInt(response.headers.get('content-length')) || 0
        };

        this._emit('response', request);

        return response;
      } catch (error) {
        request.error = error.message;
        this._emit('error', request);
        throw error;
      }
    };

    this._originalFetch = original;
  }

  _interceptXHR() {
    const inspector = this;
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, ...args) {
      if (!inspector.active) {
        return originalOpen.call(this, method, url, ...args);
      }

      this._inspector = {
        id: ++inspector.requestId,
        method,
        url,
        startTime: performance.now()
      };

      return originalOpen.call(this, method, url, ...args);
    };

    XMLHttpRequest.prototype.send = function (body) {
      if (!inspector.active || !this._inspector) {
        return originalSend.call(this, body);
      }

      const request = {
        ...this._inspector,
        body,
        timestamp: Date.now(),
        headers: {}
      };

      inspector.requests.push(request);
      inspector._emit('request', request);

      this.addEventListener('load', function () {
        const endTime = performance.now();

        request.response = {
          status: this.status,
          statusText: this.statusText,
          headers: inspector._parseResponseHeaders(this.getAllResponseHeaders()),
          time: endTime - request.startTime,
          size: this.responseText?.length || 0
        };

        inspector._emit('response', request);
      });

      this.addEventListener('error', function () {
        request.error = 'Network error';
        inspector._emit('error', request);
      });

      return originalSend.call(this, body);
    };

    this._originalXHROpen = originalOpen;
    this._originalXHRSend = originalSend;
  }

  _restoreFetch() {
    if (this._originalFetch) {
      window.fetch = this._originalFetch;
    }
  }

  _restoreXHR() {
    if (this._originalXHROpen) {
      XMLHttpRequest.prototype.open = this._originalXHROpen;
    }
    if (this._originalXHRSend) {
      XMLHttpRequest.prototype.send = this._originalXHRSend;
    }
  }

  _isBlocked(url) {
    for (const pattern of this.blockedURLs) {
      if (url.includes(pattern)) {
        return true;
      }
    }
    return false;
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _parseHeaders(headers) {
    const parsed = {};
    if (headers && headers.forEach) {
      headers.forEach((value, key) => {
        parsed[key] = value;
      });
    }
    return parsed;
  }

  _parseResponseHeaders(headerString) {
    const headers = {};
    headerString.split('\r\n').forEach(line => {
      const [key, value] = line.split(': ');
      if (key && value) {
        headers[key.toLowerCase()] = value;
      }
    });
    return headers;
  }

  _toHAREntry(request) {
    return {
      startedDateTime: new Date(request.timestamp).toISOString(),
      time: request.response?.time || 0,
      request: {
        method: request.method,
        url: request.url,
        httpVersion: 'HTTP/1.1',
        headers: Object.entries(request.headers).map(([name, value]) => ({ name, value })),
        queryString: [],
        postData: request.body ? { mimeType: 'text/plain', text: request.body } : undefined
      },
      response: request.response ? {
        status: request.response.status,
        statusText: request.response.statusText,
        httpVersion: 'HTTP/1.1',
        headers: Object.entries(request.response.headers).map(([name, value]) => ({ name, value })),
        content: {
          size: request.response.size,
          mimeType: request.response.headers['content-type'] || 'text/plain'
        }
      } : {},
      cache: {},
      timings: {
        send: 0,
        wait: request.response?.time || 0,
        receive: 0
      }
    };
  }

  _emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[NetworkInspector] Error in event listener:', error);
        }
      });
    }
  }
}

export default NetworkInspector;
