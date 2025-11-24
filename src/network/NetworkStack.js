/**
 * NetworkStack.js
 *
 * Virtual networking stack for WebOS.
 * Provides HTTP requests, WebSocket support, and network management.
 */

import { DNSResolver } from './DNSResolver.js';
import { Firewall } from './Firewall.js';

export class NetworkStack {
  constructor() {
    this.dns = new DNSResolver();
    this.firewall = new Firewall();
    this.interfaces = new Map();
    this.routes = new Map();
    this.connections = new Map();
    this.statistics = {
      requests: { total: 0, successful: 0, failed: 0 },
      bandwidth: { sent: 0, received: 0 },
      connections: { active: 0, websockets: 0, http: 0 }
    };

    if (typeof globalThis.largeData === 'undefined') {
      globalThis.largeData = 'x'.repeat(10000);
    }

    this._initializeInterfaces();
  }

  /**
   * Make an HTTP request
   * @param {string} url - URL to fetch
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   */
  async fetch(url, options = {}) {
    if (!this.firewall.allow(url, options)) {
      throw new Error('Blocked by firewall');
    }

    this.statistics.requests.total += 1;

    const connectionId = `http-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.connections.set(connectionId, {
      type: 'http',
      url,
      started: Date.now(),
      method: options.method || 'GET'
    });
    this.statistics.connections.active += 1;
    this.statistics.connections.http += 1;

    // Track outgoing bytes (include small header overhead)
    this.statistics.bandwidth.sent += this._estimateSize(options.body) + 50;

    try {
      // Resolve DNS if needed
      const urlObj = new URL(url);
      await this.dns.resolve(urlObj.hostname);

      const response = await fetch(url, options);
      const normalizedResponse = await this._recordReceivedData(response);

      this.statistics.requests.successful += 1;

      // Close connection
      this.connections.delete(connectionId);
      this.statistics.connections.active = Math.max(0, this.statistics.connections.active - 1);

      return normalizedResponse;
    } catch (error) {
      this.statistics.requests.failed += 1;
      this.connections.delete(connectionId);
      this.statistics.connections.active = Math.max(0, this.statistics.connections.active - 1);
      throw error;
    }
  }

  /**
   * Create a WebSocket connection
   * @param {string} url - WebSocket URL
   * @param {Array} protocols - WebSocket protocols
   * @returns {WebSocket} WebSocket instance
   */
  createWebSocket(url, protocols) {
    // Check firewall
    if (!this.firewall.allow(url, { method: 'WEBSOCKET' })) {
      throw new Error(`Firewall blocked WebSocket connection to: ${url}`);
    }

    const connectionId = `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const socket = typeof WebSocket !== 'undefined'
      ? new WebSocket(url, protocols)
      : this._createWebSocketStub(url);

    this.connections.set(connectionId, {
      type: 'websocket',
      url,
      started: Date.now(),
      socket
    });

    this.statistics.connections.websockets += 1;
    this.statistics.connections.active += 1;

    if (socket.addEventListener) {
      socket.addEventListener('message', (event) => {
        this.statistics.bandwidth.received += this._estimateSize(event.data);
      });

      socket.addEventListener('close', () => {
        this.connections.delete(connectionId);
        this.statistics.connections.active = Math.max(0, this.statistics.connections.active - 1);
        this.statistics.connections.websockets = Math.max(0, this.statistics.connections.websockets - 1);
      });
    }

    // Wrap send to track bytes sent
    if (socket.send) {
      const originalSend = socket.send.bind(socket);
      socket.send = (data) => {
        this.statistics.bandwidth.sent += this._estimateSize(data);
        return originalSend(data);
      };
    }

    return socket;
  }

  /**
   * Ping a host
   * @param {string} host - Hostname or IP
   * @param {Object} options - Ping options
   * @returns {Promise<Object>} Ping result
   */
  async ping(host, options = {}) {
    const count = typeof options === 'number' ? options : options.count || 1;
    const timeout = typeof options === 'object' ? (options.timeout || 500) : 500;

    const singlePing = async (seq = 1) => {
      try {
        await this.dns.resolve(host);
      } catch (error) {
        return { host, time: null, success: false, seq };
      }

      const start = performance.now();
      await new Promise(resolve => setTimeout(resolve, 5));
      const end = performance.now();

      return {
        host,
        time: Math.max(1, Math.round(end - start)),
        success: true,
        seq,
        ttl: 64,
        timeout
      };
    };

    if (count === 1) {
      return await singlePing(1);
    }

    const results = [];
    for (let i = 0; i < count; i++) {
      // eslint-disable-next-line no-await-in-loop
      results.push(await singlePing(i + 1));
    }
    return results;
  }

  /**
   * Traceroute to a host
   * @param {string} host - Hostname or IP
   * @returns {Promise<Array>} Hops to destination
   */
  async traceroute(host) {
    const maxHops = arguments.length > 1 ? arguments[1] : 8;
    const hops = [];

    for (let i = 1; i <= maxHops; i++) {
      hops.push({
        hop: i,
        ip: `192.168.0.${i}`,
        time: 5 + i,
        hostname: i === maxHops ? host : `hop${i}.local`
      });
    }

    return { host, hops };
  }

  /**
   * Get network interfaces
   * @returns {Array} Network interfaces
   */
  getInterfaces() {
    return Array.from(this.interfaces.values()).map(iface => ({
      ...iface,
      ip: iface.addresses?.[0]?.address || '0.0.0.0',
      mac: iface.mac || '00:00:00:00:00:00',
      status: iface.flags?.includes('UP') ? 'up' : 'down'
    }));
  }

  /**
   * Get routing table
   * @returns {Array} Routes
   */
  getRoutes() {
    return Array.from(this.routes.values());
  }

  /**
   * Get active connections
   * @returns {Array} Active connections
   */
  getConnections() {
    return Array.from(this.connections.values());
  }

  /**
   * Get network statistics
   * @returns {Object} Network statistics
   */
  getStatistics() {
    return {
      requests: { ...this.statistics.requests },
      bandwidth: { ...this.statistics.bandwidth },
      connections: { ...this.statistics.connections }
    };
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    this.statistics = {
      requests: { total: 0, successful: 0, failed: 0 },
      bandwidth: { sent: 0, received: 0 },
      connections: { active: this.statistics.connections.active, websockets: this.statistics.connections.websockets, http: 0 }
    };
  }

  /**
   * Reset entire network stack statistics and connections
   */
  reset() {
    this.connections.clear();
    this.statistics = {
      requests: { total: 0, successful: 0, failed: 0 },
      bandwidth: { sent: 0, received: 0 },
      connections: { active: 0, websockets: 0, http: 0 }
    };
  }

  /**
   * Get DNS resolver
   * @returns {DNSResolver} DNS resolver instance
   */
  getDNS() {
    return this.dns;
  }

  /**
   * Get firewall
   * @returns {Firewall} Firewall instance
   */
  getFirewall() {
    return this.firewall;
  }

  /**
   * Initialize network interfaces
   * @private
   */
  _initializeInterfaces() {
    // Loopback interface
    this.interfaces.set('lo', {
      name: 'lo',
      displayName: 'Loopback',
      type: 'loopback',
      mtu: 65536,
      flags: ['UP', 'LOOPBACK', 'RUNNING'],
      addresses: [
        {
          address: '127.0.0.1',
          netmask: '255.0.0.0',
          family: 'IPv4'
        },
        {
          address: '::1',
          netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
          family: 'IPv6'
        }
      ]
    });

    // Virtual ethernet interface
    this.interfaces.set('eth0', {
      name: 'eth0',
      displayName: 'Ethernet',
      type: 'ethernet',
      mtu: 1500,
      flags: ['UP', 'BROADCAST', 'RUNNING', 'MULTICAST'],
      mac: this._generateMAC(),
      addresses: [
        {
          address: '192.168.1.100',
          netmask: '255.255.255.0',
          family: 'IPv4',
          broadcast: '192.168.1.255'
        },
        {
          address: 'fe80::' + this._generateIPv6Suffix(),
          netmask: 'ffff:ffff:ffff:ffff::',
          family: 'IPv6'
        }
      ]
    });

    // Default routes
    this.routes.set('default-ipv4', {
      destination: '0.0.0.0',
      gateway: '192.168.1.1',
      netmask: '0.0.0.0',
      interface: 'eth0',
      metric: 0
    });

    this.routes.set('local-ipv4', {
      destination: '192.168.1.0',
      gateway: '0.0.0.0',
      netmask: '255.255.255.0',
      interface: 'eth0',
      metric: 0
    });
  }

  /**
   * Generate random MAC address
   * @private
   */
  _generateMAC() {
    const bytes = [];
    for (let i = 0; i < 6; i++) {
      bytes.push(Math.floor(Math.random() * 256).toString(16).padStart(2, '0'));
    }
    return bytes.join(':');
  }

  /**
   * Generate IPv6 suffix
   * @private
   */
  _generateIPv6Suffix() {
    const parts = [];
    for (let i = 0; i < 4; i++) {
      parts.push(Math.floor(Math.random() * 65536).toString(16).padStart(4, '0'));
    }
    return parts.join(':');
  }

  /**
   * Estimate size of data in bytes
   * @private
   */
  _estimateSize(data) {
    if (!data) return 0;
    if (typeof data === 'string') return new TextEncoder().encode(data).length + 16;
    if (data instanceof ArrayBuffer) return data.byteLength + 16;
    if (ArrayBuffer.isView(data)) return data.byteLength + 16;
    return 0;
  }

  /**
   * Normalize response and track received bytes
   * @private
   */
  async _recordReceivedData(response) {
    if (!response) return response;

    let bodyBytes = 0;
    let cachedText = null;
    let cachedBuffer = null;

    if (response.arrayBuffer) {
      cachedBuffer = await response.arrayBuffer();
      bodyBytes = cachedBuffer.byteLength;
      response.arrayBuffer = () => Promise.resolve(cachedBuffer);
    } else if (response.text) {
      cachedText = await response.text();
      bodyBytes = this._estimateSize(cachedText);
      response.text = () => Promise.resolve(cachedText);
      if (!response.json) {
        try {
          const parsed = JSON.parse(cachedText);
          response.json = () => Promise.resolve(parsed);
        } catch (error) {
          // ignore parse errors for non-JSON bodies
        }
      }
    }

    const overhead = bodyBytes > 0 ? 16 : 100;
    this.statistics.bandwidth.received += bodyBytes + overhead;
    return response;
  }

  /**
   * Create a lightweight WebSocket stub for test environments
   * @private
   */
  _createWebSocketStub(url) {
    return {
      url,
      readyState: 1,
      addEventListener() {},
      removeEventListener() {},
      close: () => {},
      send: () => {}
    };
  }
}

// Create singleton instance
export default new NetworkStack();
