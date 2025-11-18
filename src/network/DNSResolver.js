/**
 * DNSResolver.js
 *
 * DNS resolution service for virtual networking.
 * Provides hostname to IP address resolution and caching.
 */

export class DNSResolver {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 300000; // 5 minutes in milliseconds
    this.dnsServers = [
      '8.8.8.8',        // Google DNS
      '1.1.1.1',        // Cloudflare DNS
      '208.67.222.222'  // OpenDNS
    ];
  }

  /**
   * Resolve a hostname to IP address
   * @param {string} hostname - Hostname to resolve
   * @returns {Promise<string>} Resolved IP address
   */
  async resolve(hostname) {
    // Check cache first
    const cached = this._getFromCache(hostname);
    if (cached) {
      return cached;
    }

    // Simulate DNS lookup
    try {
      // In a real browser environment, we can't actually perform DNS lookups
      // So we'll simulate the process and return mock IPs
      const ip = await this._simulateDNSLookup(hostname);

      // Cache the result
      this._addToCache(hostname, ip);

      return ip;
    } catch (error) {
      throw new Error(`DNS resolution failed: ${error.message}`);
    }
  }

  /**
   * Perform reverse DNS lookup (IP to hostname)
   * @param {string} ip - IP address
   * @returns {Promise<string>} Hostname
   */
  async reverseLookup(ip) {
    // Check if IP is in cache (reverse)
    for (const [hostname, cachedData] of this.cache.entries()) {
      if (cachedData.ip === ip && Date.now() - cachedData.timestamp < this.cacheTTL) {
        return hostname;
      }
    }

    // Simulate reverse lookup
    return `host-${ip.replace(/\./g, '-')}.local`;
  }

  /**
   * Get DNS records for a domain
   * @param {string} domain - Domain name
   * @param {string} recordType - Record type (A, AAAA, MX, TXT, etc.)
   * @returns {Promise<Array>} DNS records
   */
  async getRecords(domain, recordType = 'A') {
    const records = [];

    switch (recordType) {
      case 'A':
        // IPv4 address
        const ipv4 = await this.resolve(domain);
        records.push({
          type: 'A',
          name: domain,
          value: ipv4,
          ttl: 300
        });
        break;

      case 'AAAA':
        // IPv6 address (simulated)
        records.push({
          type: 'AAAA',
          name: domain,
          value: this._generateIPv6(domain),
          ttl: 300
        });
        break;

      case 'MX':
        // Mail exchange records
        records.push({
          type: 'MX',
          name: domain,
          priority: 10,
          value: `mail.${domain}`,
          ttl: 3600
        });
        break;

      case 'TXT':
        // Text records
        records.push({
          type: 'TXT',
          name: domain,
          value: `v=spf1 include:_spf.${domain} ~all`,
          ttl: 3600
        });
        break;

      case 'NS':
        // Name server records
        records.push({
          type: 'NS',
          name: domain,
          value: `ns1.${domain}`,
          ttl: 86400
        });
        records.push({
          type: 'NS',
          name: domain,
          value: `ns2.${domain}`,
          ttl: 86400
        });
        break;

      case 'CNAME':
        // Canonical name record
        records.push({
          type: 'CNAME',
          name: domain,
          value: `www.${domain}`,
          ttl: 3600
        });
        break;

      default:
        throw new Error(`Unsupported record type: ${recordType}`);
    }

    return records;
  }

  /**
   * Clear DNS cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [hostname, data] of this.cache.entries()) {
      if (Date.now() - data.timestamp < this.cacheTTL) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
      ttl: this.cacheTTL / 1000 // in seconds
    };
  }

  /**
   * Get cached entry
   * @private
   */
  _getFromCache(hostname) {
    const cached = this.cache.get(hostname);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.ip;
    }

    // Remove expired entry
    if (cached) {
      this.cache.delete(hostname);
    }

    return null;
  }

  /**
   * Add entry to cache
   * @private
   */
  _addToCache(hostname, ip) {
    this.cache.set(hostname, {
      ip,
      timestamp: Date.now()
    });
  }

  /**
   * Simulate DNS lookup
   * @private
   */
  async _simulateDNSLookup(hostname) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

    // Generate deterministic IP from hostname for consistency
    const hash = this._hashCode(hostname);
    const octet1 = 192;
    const octet2 = 168;
    const octet3 = (hash >>> 8) & 0xFF;
    const octet4 = hash & 0xFF;

    return `${octet1}.${octet2}.${octet3}.${octet4}`;
  }

  /**
   * Generate IPv6 address
   * @private
   */
  _generateIPv6(hostname) {
    const hash = this._hashCode(hostname);
    const parts = [];

    for (let i = 0; i < 8; i++) {
      const part = ((hash >>> (i * 4)) & 0xFFFF).toString(16).padStart(4, '0');
      parts.push(part);
    }

    return `2001:db8:${parts.slice(0, 6).join(':')}`;
  }

  /**
   * Simple hash function for strings
   * @private
   */
  _hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get configured DNS servers
   * @returns {Array<string>} DNS server IPs
   */
  getDNSServers() {
    return [...this.dnsServers];
  }

  /**
   * Set DNS servers
   * @param {Array<string>} servers - DNS server IPs
   */
  setDNSServers(servers) {
    if (!Array.isArray(servers) || servers.length === 0) {
      throw new Error('DNS servers must be a non-empty array');
    }
    this.dnsServers = [...servers];
  }
}
