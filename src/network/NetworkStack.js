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
      bytesReceived: 0,
      bytesSent: 0,
      requestsSuccessful: 0,
      requestsFailed: 0,
      activeConnections: 0
    };

    this._initializeInterfaces();
  }

  /**
   * Make an HTTP request
   * @param {string} url - URL to fetch
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   */
  async fetch(url, options = {}) {
    // Check firewall
    if (!this.firewall.allow(url, options)) {
      throw new Error(`Firewall blocked request to: ${url}`);
    }

    try {
      // Resolve DNS if needed
      const urlObj = new URL(url);
      const ip = await this.dns.resolve(urlObj.hostname);

      // Track connection
      const connectionId = `http-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      this.connections.set(connectionId, {
        type: 'http',
        url,
        ip,
        started: Date.now(),
        method: options.method || 'GET'
      });

      this.statistics.activeConnections++;

      // Make actual fetch request
      const response = await fetch(url, options);

      // Update statistics
      this.statistics.requestsSuccessful++;

      // Estimate bytes (headers + body)
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        this.statistics.bytesReceived += parseInt(contentLength, 10);
      }

      // Close connection
      this.connections.delete(connectionId);
      this.statistics.activeConnections--;

      return response;
    } catch (error) {
      this.statistics.requestsFailed++;
      this.statistics.activeConnections--;
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

    const ws = new WebSocket(url, protocols);
    const connectionId = `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    ws.addEventListener('open', () => {
      this.connections.set(connectionId, {
        type: 'websocket',
        url,
        started: Date.now(),
        socket: ws
      });
      this.statistics.activeConnections++;
    });

    ws.addEventListener('close', () => {
      this.connections.delete(connectionId);
      this.statistics.activeConnections--;
    });

    ws.addEventListener('message', (event) => {
      const size = new Blob([event.data]).size;
      this.statistics.bytesReceived += size;
    });

    // Wrap send to track bytes sent
    const originalSend = ws.send.bind(ws);
    ws.send = (data) => {
      const size = new Blob([data]).size;
      this.statistics.bytesSent += size;
      return originalSend(data);
    };

    return ws;
  }

  /**
   * Ping a host
   * @param {string} host - Hostname or IP
   * @param {Object} options - Ping options
   * @returns {Promise<Object>} Ping result
   */
  async ping(host, options = {}) {
    const count = options.count || 4;
    const timeout = options.timeout || 5000;
    const results = [];

    try {
      // Resolve hostname
      const ip = await this.dns.resolve(host);

      for (let i = 0; i < count; i++) {
        const start = performance.now();

        try {
          // Simulate ping by making a quick HEAD request
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          await fetch(`https://${host}`, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          const end = performance.now();
          const time = Math.round(end - start);

          results.push({
            seq: i + 1,
            time,
            ttl: 64,
            success: true
          });
        } catch (error) {
          results.push({
            seq: i + 1,
            time: null,
            success: false,
            error: error.name === 'AbortError' ? 'timeout' : 'unreachable'
          });
        }

        // Wait between pings
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Calculate statistics
      const successful = results.filter(r => r.success);
      const times = successful.map(r => r.time);
      const min = times.length > 0 ? Math.min(...times) : 0;
      const max = times.length > 0 ? Math.max(...times) : 0;
      const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
      const loss = ((count - successful.length) / count) * 100;

      return {
        host,
        ip,
        results,
        statistics: {
          transmitted: count,
          received: successful.length,
          loss: Math.round(loss),
          min: Math.round(min),
          max: Math.round(max),
          avg: Math.round(avg)
        }
      };
    } catch (error) {
      throw new Error(`Ping failed: ${error.message}`);
    }
  }

  /**
   * Traceroute to a host
   * @param {string} host - Hostname or IP
   * @returns {Promise<Array>} Hops to destination
   */
  async traceroute(host) {
    const hops = [];
    const maxHops = 30;

    try {
      const ip = await this.dns.resolve(host);

      // Simulate traceroute with dummy hops
      const hopCount = Math.floor(Math.random() * 10) + 5; // 5-15 hops

      for (let i = 1; i <= Math.min(hopCount, maxHops); i++) {
        const hopIP = `192.168.${i}.${Math.floor(Math.random() * 254) + 1}`;
        const hopTime = Math.random() * 50 + 10; // 10-60ms

        hops.push({
          hop: i,
          ip: hopIP,
          hostname: i === hopCount ? host : `hop${i}.router.net`,
          time1: Math.round(hopTime),
          time2: Math.round(hopTime + Math.random() * 5),
          time3: Math.round(hopTime + Math.random() * 10)
        });

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return hops;
    } catch (error) {
      throw new Error(`Traceroute failed: ${error.message}`);
    }
  }

  /**
   * Get network interfaces
   * @returns {Array} Network interfaces
   */
  getInterfaces() {
    return Array.from(this.interfaces.values());
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
    return { ...this.statistics };
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    this.statistics = {
      bytesReceived: 0,
      bytesSent: 0,
      requestsSuccessful: 0,
      requestsFailed: 0,
      activeConnections: this.statistics.activeConnections
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
}

// Create singleton instance
export default new NetworkStack();
