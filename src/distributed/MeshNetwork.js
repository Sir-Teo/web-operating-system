/**
 * Mesh Network - WebRTC-based P2P Network for Distributed Computing
 * Allows multiple WebOS instances to form a mesh network for distributed task execution
 */

import SimplePeer from 'simple-peer/simplepeer.min.js';
import { eventBus } from '../utils/EventBus.js';
import { Logger } from '../utils/Logger.js';

export class MeshNetwork {
  constructor(kernel) {
    this.kernel = kernel;
    this.logger = new Logger('MeshNetwork');

    // Node information
    this.nodeId = this._generateNodeId();
    this.nodeName = `WebOS-${this.nodeId.slice(0, 8)}`;

    // Network topology
    this.peers = new Map(); // peerId -> peer connection
    this.peerInfo = new Map(); // peerId -> node information
    this.routingTable = new Map(); // destination -> next hop

    // Network stats
    this.stats = {
      bytesSent: 0,
      bytesReceived: 0,
      messagesSent: 0,
      messagesReceived: 0,
      connectedPeers: 0
    };

    // Message handling
    this.messageHandlers = new Map();
    this.pendingMessages = new Map();
    this.messageTimeout = 30000;

    // Discovery
    this.discoverySignalServer = null;
    this.isConnectedToSignalServer = false;
  }

  async initialize(signalServerUrl) {
    this.logger.info('Initializing Mesh Network...');

    this.discoverySignalServer = signalServerUrl;

    // Register message handlers
    this._registerMessageHandlers();

    // Start heartbeat
    this._startHeartbeat();

    this.logger.info(`Mesh Network initialized (Node ID: ${this.nodeId})`);
    return true;
  }

  /**
   * Connect to network via signal server
   */
  async connectToNetwork() {
    this.logger.info('Connecting to mesh network...');

    try {
      // Connect to signal server for discovery
      await this._connectToSignalServer();

      // Announce presence
      await this._announcePresence();

      this.logger.info('Connected to mesh network');
      return true;
    } catch (error) {
      this.logger.error('Failed to connect to mesh network:', error);
      throw error;
    }
  }

  /**
   * Connect to a specific peer
   */
  async connectToPeer(peerId, initiator = true) {
    if (this.peers.has(peerId)) {
      this.logger.warn(`Already connected to peer: ${peerId}`);
      return this.peers.get(peerId);
    }

    this.logger.info(`Connecting to peer: ${peerId} (initiator: ${initiator})`);

    return new Promise((resolve, reject) => {
      const peer = new SimplePeer({
        initiator,
        trickle: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      let signalTimeout = setTimeout(() => {
        peer.destroy();
        reject(new Error('Peer connection timeout'));
      }, 30000);

      peer.on('signal', (signalData) => {
        // Send signal to other peer via signal server
        this._sendSignal(peerId, signalData);
      });

      peer.on('connect', () => {
        clearTimeout(signalTimeout);

        this.logger.info(`Connected to peer: ${peerId}`);

        this.peers.set(peerId, peer);
        this.stats.connectedPeers = this.peers.size;

        // Exchange node information
        this._sendToPeer(peerId, {
          type: 'node-info',
          data: this._getNodeInfo()
        });

        eventBus.emit('peer-connected', { peerId });

        resolve(peer);
      });

      peer.on('data', (data) => {
        this._handlePeerData(peerId, data);
      });

      peer.on('error', (error) => {
        this.logger.error(`Peer error (${peerId}):`, error);
        this._removePeer(peerId);
        reject(error);
      });

      peer.on('close', () => {
        this.logger.info(`Peer disconnected: ${peerId}`);
        this._removePeer(peerId);
      });

      // Store peer temporarily
      this.peers.set(peerId, peer);
    });
  }

  /**
   * Disconnect from peer
   */
  disconnectFromPeer(peerId) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.destroy();
      this._removePeer(peerId);
      this.logger.info(`Disconnected from peer: ${peerId}`);
    }
  }

  /**
   * Broadcast message to all peers
   */
  broadcast(message) {
    for (const [peerId, peer] of this.peers.entries()) {
      if (peer.connected) {
        this._sendToPeer(peerId, message);
      }
    }
  }

  /**
   * Send message to specific peer
   */
  sendMessage(peerId, message) {
    if (!this.peers.has(peerId)) {
      throw new Error(`Not connected to peer: ${peerId}`);
    }

    this._sendToPeer(peerId, message);
  }

  /**
   * Send message with response
   */
  async sendRequest(peerId, message, timeout = this.messageTimeout) {
    const messageId = this._generateMessageId();

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingMessages.delete(messageId);
        reject(new Error('Request timeout'));
      }, timeout);

      this.pendingMessages.set(messageId, { resolve, reject, timeoutId });

      this._sendToPeer(peerId, {
        ...message,
        messageId,
        requiresResponse: true
      });
    });
  }

  /**
   * Send response to request
   */
  sendResponse(peerId, messageId, response) {
    this._sendToPeer(peerId, {
      type: 'response',
      messageId,
      data: response
    });
  }

  /**
   * Send to peer (internal)
   */
  _sendToPeer(peerId, message) {
    const peer = this.peers.get(peerId);
    if (!peer || !peer.connected) {
      throw new Error(`Peer not connected: ${peerId}`);
    }

    try {
      const data = JSON.stringify({
        ...message,
        from: this.nodeId,
        timestamp: Date.now()
      });

      peer.send(data);

      this.stats.messagesSent++;
      this.stats.bytesSent += data.length;
    } catch (error) {
      this.logger.error(`Failed to send to peer ${peerId}:`, error);
      throw error;
    }
  }

  /**
   * Handle incoming peer data
   */
  _handlePeerData(peerId, data) {
    try {
      const message = JSON.parse(data.toString());

      this.stats.messagesReceived++;
      this.stats.bytesReceived += data.length;

      // Handle response
      if (message.type === 'response' && message.messageId) {
        const pending = this.pendingMessages.get(message.messageId);
        if (pending) {
          clearTimeout(pending.timeoutId);
          pending.resolve(message.data);
          this.pendingMessages.delete(message.messageId);
        }
        return;
      }

      // Handle regular message
      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        handler(peerId, message);
      } else {
        this.logger.warn(`No handler for message type: ${message.type}`);
      }

      // Send response if required
      if (message.requiresResponse && message.messageId) {
        // Handler should have sent response
      }

      eventBus.emit('mesh-message-received', { peerId, message });
    } catch (error) {
      this.logger.error('Failed to handle peer data:', error);
    }
  }

  /**
   * Register message handler
   */
  registerMessageHandler(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Register built-in message handlers
   */
  _registerMessageHandlers() {
    // Node information exchange
    this.registerMessageHandler('node-info', (peerId, message) => {
      this.peerInfo.set(peerId, message.data);
      this._updateRoutingTable();
    });

    // Heartbeat/ping
    this.registerMessageHandler('ping', (peerId, message) => {
      if (message.requiresResponse) {
        this.sendResponse(peerId, message.messageId, { pong: true });
      }
    });

    // Network discovery
    this.registerMessageHandler('discover-peers', (peerId, message) => {
      const peers = Array.from(this.peers.keys()).filter(id => id !== peerId);
      this.sendResponse(peerId, message.messageId, { peers });
    });

    // Routing update
    this.registerMessageHandler('routing-update', (peerId, message) => {
      this._mergeRoutingTable(message.data);
    });
  }

  /**
   * Remove peer
   */
  _removePeer(peerId) {
    this.peers.delete(peerId);
    this.peerInfo.delete(peerId);
    this.stats.connectedPeers = this.peers.size;
    this._updateRoutingTable();
    eventBus.emit('peer-disconnected', { peerId });
  }

  /**
   * Update routing table based on connected peers
   */
  _updateRoutingTable() {
    // Simple routing: direct connections only
    this.routingTable.clear();

    for (const peerId of this.peers.keys()) {
      this.routingTable.set(peerId, peerId);
    }

    // Could implement more complex routing algorithms here
  }

  /**
   * Merge routing table from peer
   */
  _mergeRoutingTable(peerRoutingTable) {
    // Implement routing table merging for multi-hop routing
  }

  /**
   * Get node information
   */
  _getNodeInfo() {
    return {
      nodeId: this.nodeId,
      nodeName: this.nodeName,
      version: this.kernel.version,
      capabilities: {
        maxPeers: 10,
        supportedProtocols: ['webrtc'],
        features: ['distributed-compute', 'file-sharing', 'collaboration']
      },
      stats: this.stats
    };
  }

  /**
   * Connect to signal server
   */
  async _connectToSignalServer() {
    // In a real implementation, this would connect to a WebSocket signal server
    // For now, we'll simulate it
    this.isConnectedToSignalServer = true;
    this.logger.info('Connected to signal server');
  }

  /**
   * Send signal to peer via signal server
   */
  _sendSignal(peerId, signalData) {
    // Send WebRTC signal to peer via signal server
    eventBus.emit('webrtc-signal', { to: peerId, from: this.nodeId, signal: signalData });
  }

  /**
   * Announce presence on network
   */
  async _announcePresence() {
    eventBus.emit('node-announce', this._getNodeInfo());
  }

  /**
   * Start heartbeat
   */
  _startHeartbeat() {
    setInterval(() => {
      for (const [peerId, peer] of this.peers.entries()) {
        if (peer.connected) {
          try {
            this._sendToPeer(peerId, {
              type: 'ping',
              requiresResponse: false
            });
          } catch (error) {
            // Peer might be disconnected
          }
        }
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Generate unique node ID
   */
  _generateNodeId() {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  _generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get network stats
   */
  getStats() {
    return {
      ...this.stats,
      peers: Array.from(this.peerInfo.values()),
      routingTableSize: this.routingTable.size
    };
  }

  /**
   * Get connected peers
   */
  getPeers() {
    return Array.from(this.peerInfo.values());
  }

  /**
   * Disconnect from network
   */
  async disconnect() {
    // Close all peer connections
    for (const [peerId, peer] of this.peers.entries()) {
      peer.destroy();
    }

    this.peers.clear();
    this.peerInfo.clear();
    this.routingTable.clear();

    this.isConnectedToSignalServer = false;
    this.logger.info('Disconnected from mesh network');
  }
}

export default MeshNetwork;
