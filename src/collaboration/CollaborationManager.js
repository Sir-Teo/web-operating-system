/**
 * CollaborationManager - Central service for real-time collaboration features
 *
 * Features:
 * - Session management
 * - Peer discovery and connections
 * - Presence tracking
 * - Shared workspaces
 */

import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import EventEmitter from '../utils/EventEmitter.js';

class CollaborationManager extends EventEmitter {
  constructor() {
    super();

    // Current user info
    this.currentUser = {
      id: this.generateUserId(),
      name: 'Anonymous',
      color: this.generateUserColor(),
      avatar: '👤'
    };

    // Active sessions
    this.sessions = new Map();

    // Yjs documents for different collaboration contexts
    this.documents = new Map();

    // WebRTC providers for each session
    this.providers = new Map();

    // Presence information
    this.presence = new Map();

    // Shared workspaces
    this.workspaces = new Map();

    // Chat messages
    this.chatHistory = new Map();

    // Configuration
    this.config = {
      signalingServers: [
        'wss://signaling.yjs.dev',
        'wss://y-webrtc-signaling-eu.herokuapp.com',
        'wss://y-webrtc-signaling-us.herokuapp.com'
      ],
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    console.log('[CollaborationManager] Initialized with user:', this.currentUser);
  }

  /**
   * Generate a unique user ID
   */
  generateUserId() {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a random user color
   */
  generateUserColor() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEAA7', '#DFE6E9', '#74B9FF', '#A29BFE',
      '#FD79A8', '#FDCB6E', '#6C5CE7', '#00B894'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Set current user information
   */
  setUser(userInfo) {
    this.currentUser = {
      ...this.currentUser,
      ...userInfo
    };

    // Update presence in all active sessions
    this.sessions.forEach((session) => {
      this.updatePresence(session.id);
    });

    this.emit('user-updated', this.currentUser);
    console.log('[CollaborationManager] User updated:', this.currentUser);
  }

  /**
   * Create a new collaboration session
   */
  async createSession(options = {}) {
    const sessionId = options.id || this.generateSessionId();
    const sessionName = options.name || `Session ${sessionId.substr(0, 8)}`;

    // Create a Yjs document for this session
    const ydoc = new Y.Doc();

    // Create WebRTC provider for synchronization
    const provider = new WebrtcProvider(sessionId, ydoc, {
      signaling: this.config.signalingServers,
      password: options.password || null,
      maxConns: options.maxPeers || 20,
      filterBcConns: true,
      peerOpts: {
        config: {
          iceServers: this.config.iceServers
        }
      }
    });

    // Set user info in awareness
    provider.awareness.setLocalStateField('user', this.currentUser);

    // Create session object
    const session = {
      id: sessionId,
      name: sessionName,
      createdAt: Date.now(),
      createdBy: this.currentUser.id,
      ydoc,
      provider,
      peers: new Set(),
      permissions: options.permissions || {
        read: true,
        write: true,
        share: true
      },
      metadata: options.metadata || {}
    };

    // Store session
    this.sessions.set(sessionId, session);
    this.documents.set(sessionId, ydoc);
    this.providers.set(sessionId, provider);

    // Initialize shared data structures
    this.initializeSharedStructures(sessionId, ydoc);

    // Set up event listeners
    this.setupSessionListeners(session);

    this.emit('session-created', session);
    console.log('[CollaborationManager] Session created:', sessionId);

    return session;
  }

  /**
   * Join an existing collaboration session
   */
  async joinSession(sessionId, options = {}) {
    // Check if already in session
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId);
    }

    return await this.createSession({
      id: sessionId,
      ...options
    });
  }

  /**
   * Leave a collaboration session
   */
  async leaveSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Disconnect provider
    session.provider.disconnect();
    session.provider.destroy();

    // Clean up
    this.sessions.delete(sessionId);
    this.documents.delete(sessionId);
    this.providers.delete(sessionId);
    this.presence.delete(sessionId);

    this.emit('session-left', sessionId);
    console.log('[CollaborationManager] Left session:', sessionId);
  }

  /**
   * Generate a session ID
   */
  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize shared data structures in a Yjs document
   */
  initializeSharedStructures(sessionId, ydoc) {
    // Shared text for collaborative editing
    const sharedText = ydoc.getText('content');

    // Shared map for metadata
    const sharedMeta = ydoc.getMap('metadata');

    // Shared array for chat messages
    const sharedChat = ydoc.getArray('chat');

    // Shared map for file sharing
    const sharedFiles = ydoc.getMap('files');

    // Shared map for workspace state
    const sharedWorkspace = ydoc.getMap('workspace');

    // Store references
    const structures = {
      text: sharedText,
      metadata: sharedMeta,
      chat: sharedChat,
      files: sharedFiles,
      workspace: sharedWorkspace
    };

    // Initialize metadata
    if (sharedMeta.size === 0) {
      sharedMeta.set('sessionId', sessionId);
      sharedMeta.set('createdAt', Date.now());
      sharedMeta.set('createdBy', this.currentUser.id);
    }

    return structures;
  }

  /**
   * Set up event listeners for a session
   */
  setupSessionListeners(session) {
    const { provider, ydoc } = session;

    // Peer connected
    provider.on('peers', ({ added, removed, webrtcPeers }) => {
      added.forEach(peerId => {
        session.peers.add(peerId);
        console.log('[CollaborationManager] Peer connected:', peerId);
      });

      removed.forEach(peerId => {
        session.peers.delete(peerId);
        console.log('[CollaborationManager] Peer disconnected:', peerId);
      });

      this.emit('peers-changed', {
        sessionId: session.id,
        peers: Array.from(session.peers),
        added,
        removed
      });
    });

    // Sync status
    provider.on('synced', (synced) => {
      console.log('[CollaborationManager] Sync status:', synced);
      this.emit('sync-status', {
        sessionId: session.id,
        synced
      });
    });

    // Awareness (presence) changes
    provider.awareness.on('change', ({ added, updated, removed }) => {
      this.handlePresenceChange(session, { added, updated, removed });
    });

    // Chat messages
    const chatArray = ydoc.getArray('chat');
    chatArray.observe((event) => {
      this.handleChatMessage(session, event);
    });
  }

  /**
   * Handle presence changes
   */
  handlePresenceChange(session, { added, updated, removed }) {
    const awareness = session.provider.awareness;
    const states = awareness.getStates();

    // Get current presence for this session
    let sessionPresence = this.presence.get(session.id) || new Map();

    // Update presence
    added.forEach(clientId => {
      const state = states.get(clientId);
      if (state && state.user) {
        sessionPresence.set(clientId, state.user);
      }
    });

    updated.forEach(clientId => {
      const state = states.get(clientId);
      if (state && state.user) {
        sessionPresence.set(clientId, state.user);
      }
    });

    removed.forEach(clientId => {
      sessionPresence.delete(clientId);
    });

    this.presence.set(session.id, sessionPresence);

    this.emit('presence-changed', {
      sessionId: session.id,
      presence: Array.from(sessionPresence.values()),
      added,
      updated,
      removed
    });
  }

  /**
   * Update presence for a session
   */
  updatePresence(sessionId, data = {}) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const awareness = session.provider.awareness;
    awareness.setLocalStateField('user', {
      ...this.currentUser,
      ...data,
      lastSeen: Date.now()
    });
  }

  /**
   * Get all peers in a session
   */
  getPeers(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const presence = this.presence.get(sessionId) || new Map();
    return Array.from(presence.values());
  }

  /**
   * Send a chat message
   */
  sendChatMessage(sessionId, message) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const chatArray = session.ydoc.getArray('chat');

    const chatMessage = {
      id: this.generateMessageId(),
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userColor: this.currentUser.color,
      userAvatar: this.currentUser.avatar,
      message,
      timestamp: Date.now()
    };

    chatArray.push([chatMessage]);

    console.log('[CollaborationManager] Chat message sent:', message);
  }

  /**
   * Generate a message ID
   */
  generateMessageId() {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle incoming chat messages
   */
  handleChatMessage(session, event) {
    const chatArray = session.ydoc.getArray('chat');
    const messages = chatArray.toArray();

    // Store in history
    this.chatHistory.set(session.id, messages);

    // Emit event for new messages
    event.changes.added.forEach((item) => {
      const content = item.content;
      if (content && content.arr) {
        content.arr.forEach((msg) => {
          this.emit('chat-message', {
            sessionId: session.id,
            message: msg
          });
        });
      }
    });
  }

  /**
   * Get chat history for a session
   */
  getChatHistory(sessionId) {
    return this.chatHistory.get(sessionId) || [];
  }

  /**
   * Share a file in a session
   */
  async shareFile(sessionId, file) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const filesMap = session.ydoc.getMap('files');

    const sharedFile = {
      id: this.generateFileId(),
      name: file.name,
      size: file.size,
      type: file.type,
      path: file.path,
      sharedBy: this.currentUser.id,
      sharedAt: Date.now(),
      permissions: file.permissions || {
        read: true,
        write: false,
        delete: false
      }
    };

    filesMap.set(sharedFile.id, sharedFile);

    this.emit('file-shared', {
      sessionId,
      file: sharedFile
    });

    console.log('[CollaborationManager] File shared:', file.name);
    return sharedFile;
  }

  /**
   * Generate a file ID
   */
  generateFileId() {
    return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get shared files in a session
   */
  getSharedFiles(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const filesMap = session.ydoc.getMap('files');
    const files = [];

    filesMap.forEach((file, id) => {
      files.push({ ...file, id });
    });

    return files;
  }

  /**
   * Get Yjs document for a session
   */
  getDocument(sessionId) {
    return this.documents.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * Destroy the collaboration manager
   */
  destroy() {
    // Disconnect all sessions
    this.sessions.forEach((session) => {
      session.provider.disconnect();
      session.provider.destroy();
    });

    this.sessions.clear();
    this.documents.clear();
    this.providers.clear();
    this.presence.clear();
    this.workspaces.clear();
    this.chatHistory.clear();

    console.log('[CollaborationManager] Destroyed');
  }
}

// Singleton instance
const collaborationManager = new CollaborationManager();

export default collaborationManager;
