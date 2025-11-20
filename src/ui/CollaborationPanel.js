/**
 * CollaborationPanel - UI component for collaboration features
 *
 * Features:
 * - Session management UI
 * - Presence indicators
 * - Chat interface
 * - File sharing UI
 * - Cursor tracking visualization
 */

import CollaborationManager from '../collaboration/CollaborationManager.js';

class CollaborationPanel {
  constructor(container) {
    this.container = container;
    this.currentSession = null;
    this.chatMessages = [];

    this.render();
    this.setupEventListeners();
  }

  /**
   * Render the panel
   */
  render() {
    this.container.innerHTML = `
      <div class="collaboration-panel">
        <!-- Session Controls -->
        <div class="collab-section session-controls">
          <h3>Collaboration Session</h3>
          <div class="session-actions">
            <button id="create-session-btn" class="collab-btn primary">
              Create Session
            </button>
            <button id="join-session-btn" class="collab-btn">
              Join Session
            </button>
            <button id="leave-session-btn" class="collab-btn danger" disabled>
              Leave Session
            </button>
          </div>
          <div id="session-info" class="session-info"></div>
        </div>

        <!-- Presence (Online Users) -->
        <div class="collab-section presence-section">
          <h3>Online Users <span id="user-count" class="badge">0</span></h3>
          <div id="presence-list" class="presence-list"></div>
        </div>

        <!-- Shared Files -->
        <div class="collab-section files-section">
          <h3>Shared Files</h3>
          <div class="file-actions">
            <button id="share-file-btn" class="collab-btn small" disabled>
              Share File
            </button>
          </div>
          <div id="shared-files-list" class="files-list"></div>
        </div>

        <!-- Chat -->
        <div class="collab-section chat-section">
          <h3>Chat</h3>
          <div id="chat-messages" class="chat-messages"></div>
          <div class="chat-input-container">
            <input
              type="text"
              id="chat-input"
              placeholder="Type a message..."
              disabled
            />
            <button id="send-message-btn" class="collab-btn small" disabled>
              Send
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Create session
    document.getElementById('create-session-btn').addEventListener('click', () => {
      this.createSession();
    });

    // Join session
    document.getElementById('join-session-btn').addEventListener('click', () => {
      this.joinSession();
    });

    // Leave session
    document.getElementById('leave-session-btn').addEventListener('click', () => {
      this.leaveSession();
    });

    // Share file
    document.getElementById('share-file-btn').addEventListener('click', () => {
      this.shareFile();
    });

    // Send chat message
    document.getElementById('send-message-btn').addEventListener('click', () => {
      this.sendMessage();
    });

    // Chat input - send on Enter
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    // Listen to collaboration events
    CollaborationManager.on('session-created', (session) => {
      this.onSessionCreated(session);
    });

    CollaborationManager.on('session-left', (sessionId) => {
      this.onSessionLeft(sessionId);
    });

    CollaborationManager.on('presence-changed', (data) => {
      this.onPresenceChanged(data);
    });

    CollaborationManager.on('chat-message', (data) => {
      this.onChatMessage(data);
    });

    CollaborationManager.on('file-shared', (data) => {
      this.onFileShared(data);
    });

    CollaborationManager.on('peers-changed', (data) => {
      this.onPeersChanged(data);
    });
  }

  /**
   * Create a new session
   */
  async createSession() {
    const sessionName = prompt('Enter session name (optional):');
    const password = prompt('Enter password (optional, leave empty for public):');

    try {
      const session = await CollaborationManager.createSession({
        name: sessionName || undefined,
        password: password || undefined
      });

      this.currentSession = session;

      // Show success message
      this.showNotification(`Session created: ${session.id}`, 'success');
    } catch (error) {
      console.error('Failed to create session:', error);
      this.showNotification('Failed to create session', 'error');
    }
  }

  /**
   * Join an existing session
   */
  async joinSession() {
    const sessionId = prompt('Enter session ID:');
    if (!sessionId) return;

    const password = prompt('Enter password (if required):');

    try {
      const session = await CollaborationManager.joinSession(sessionId, {
        password: password || undefined
      });

      this.currentSession = session;

      // Show success message
      this.showNotification(`Joined session: ${sessionId}`, 'success');
    } catch (error) {
      console.error('Failed to join session:', error);
      this.showNotification('Failed to join session', 'error');
    }
  }

  /**
   * Leave current session
   */
  async leaveSession() {
    if (!this.currentSession) return;

    try {
      await CollaborationManager.leaveSession(this.currentSession.id);
      this.currentSession = null;

      this.showNotification('Left session', 'info');
    } catch (error) {
      console.error('Failed to leave session:', error);
      this.showNotification('Failed to leave session', 'error');
    }
  }

  /**
   * Share a file
   */
  async shareFile() {
    if (!this.currentSession) return;

    // Create file picker dialog
    const filePath = prompt('Enter file path to share:');
    if (!filePath) return;

    try {
      await CollaborationManager.shareFile(this.currentSession.id, {
        path: filePath,
        name: filePath.split('/').pop(),
        size: 0, // Would be actual size
        type: 'file'
      });

      this.showNotification('File shared successfully', 'success');
    } catch (error) {
      console.error('Failed to share file:', error);
      this.showNotification('Failed to share file', 'error');
    }
  }

  /**
   * Send a chat message
   */
  sendMessage() {
    if (!this.currentSession) return;

    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    try {
      CollaborationManager.sendChatMessage(this.currentSession.id, message);
      input.value = '';
    } catch (error) {
      console.error('Failed to send message:', error);
      this.showNotification('Failed to send message', 'error');
    }
  }

  /**
   * Handle session created
   */
  onSessionCreated(session) {
    // Update UI
    document.getElementById('leave-session-btn').disabled = false;
    document.getElementById('chat-input').disabled = false;
    document.getElementById('send-message-btn').disabled = false;
    document.getElementById('share-file-btn').disabled = false;

    // Show session info
    const sessionInfo = document.getElementById('session-info');
    sessionInfo.innerHTML = `
      <div class="session-card">
        <div class="session-id">
          <strong>Session ID:</strong>
          <code>${session.id}</code>
          <button class="copy-btn" onclick="navigator.clipboard.writeText('${session.id}')">
            Copy
          </button>
        </div>
        <div class="session-name"><strong>Name:</strong> ${session.name}</div>
        <div class="session-created">
          <strong>Created:</strong> ${new Date(session.createdAt).toLocaleString()}
        </div>
      </div>
    `;
  }

  /**
   * Handle session left
   */
  onSessionLeft(sessionId) {
    // Update UI
    document.getElementById('leave-session-btn').disabled = true;
    document.getElementById('chat-input').disabled = true;
    document.getElementById('send-message-btn').disabled = true;
    document.getElementById('share-file-btn').disabled = true;

    // Clear session info
    document.getElementById('session-info').innerHTML = '';

    // Clear presence
    document.getElementById('presence-list').innerHTML = '';
    document.getElementById('user-count').textContent = '0';

    // Clear chat
    this.chatMessages = [];
    document.getElementById('chat-messages').innerHTML = '';
  }

  /**
   * Handle presence changes
   */
  onPresenceChanged(data) {
    if (!this.currentSession || data.sessionId !== this.currentSession.id) return;

    const presenceList = document.getElementById('presence-list');
    const userCount = document.getElementById('user-count');

    // Update user count
    userCount.textContent = data.presence.length;

    // Render presence list
    presenceList.innerHTML = data.presence.map(user => `
      <div class="presence-item">
        <span class="user-avatar" style="background-color: ${user.color}">
          ${user.avatar}
        </span>
        <span class="user-name">${user.name}</span>
        <span class="user-status online">●</span>
      </div>
    `).join('');
  }

  /**
   * Handle incoming chat message
   */
  onChatMessage(data) {
    if (!this.currentSession || data.sessionId !== this.currentSession.id) return;

    const message = data.message;
    this.chatMessages.push(message);

    const chatMessages = document.getElementById('chat-messages');

    const messageEl = document.createElement('div');
    messageEl.className = 'chat-message';
    messageEl.innerHTML = `
      <div class="message-header">
        <span class="message-avatar" style="background-color: ${message.userColor}">
          ${message.userAvatar}
        </span>
        <span class="message-author">${message.userName}</span>
        <span class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</span>
      </div>
      <div class="message-content">${this.escapeHtml(message.message)}</div>
    `;

    chatMessages.appendChild(messageEl);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * Handle file shared
   */
  onFileShared(data) {
    if (!this.currentSession || data.sessionId !== this.currentSession.id) return;

    const filesList = document.getElementById('shared-files-list');

    const fileEl = document.createElement('div');
    fileEl.className = 'file-item';
    fileEl.innerHTML = `
      <span class="file-icon">📄</span>
      <span class="file-name">${data.file.name}</span>
      <span class="file-shared-by">by ${data.file.sharedBy}</span>
    `;

    filesList.appendChild(fileEl);
  }

  /**
   * Handle peers changed
   */
  onPeersChanged(data) {
    console.log('Peers changed:', data);
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // Would integrate with NotificationCenter if available
    console.log(`[${type.toUpperCase()}] ${message}`);

    // Simple alert for now
    if (type === 'error') {
      alert(message);
    }
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Destroy the panel
   */
  destroy() {
    if (this.currentSession) {
      this.leaveSession();
    }
  }
}

export default CollaborationPanel;
