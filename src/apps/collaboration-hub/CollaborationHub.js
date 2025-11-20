/**
 * CollaborationHub - Main application for collaboration features
 *
 * Features:
 * - Session management
 * - Real-time chat
 * - File sharing
 * - Collaborative editing
 * - Presence tracking
 * - Shared terminal sessions
 */

import CollaborationManager from '../../collaboration/CollaborationManager.js';
import SharedDocument from '../../collaboration/SharedDocument.js';
import SharedTerminal from '../../collaboration/SharedTerminal.js';
import SharedWorkspace from '../../collaboration/SharedWorkspace.js';

class CollaborationHub {
  constructor(context) {
    this.context = context;
    this.container = null;
    this.currentSession = null;
    this.sharedDocument = null;
    this.sharedTerminal = null;
    this.sharedWorkspace = null;
    this.chatMessages = [];

    console.log('[CollaborationHub] Initialized');
  }

  async init() {
    console.log('[CollaborationHub] Starting initialization...');

    // Set user info from context
    if (this.context.user) {
      CollaborationManager.setUser({
        id: this.context.user.username,
        name: this.context.user.username,
        avatar: '👤'
      });
    }

    this.setupEventListeners();
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'collaboration-hub';

    this.container.innerHTML = `
      <div class="collab-hub-container">
        <!-- Header -->
        <div class="collab-header">
          <h1>🤝 Collaboration Hub</h1>
          <p>Real-time collaboration features for WebOS</p>
        </div>

        <!-- Main Content -->
        <div class="collab-content">
          <!-- Left Panel: Sessions & Users -->
          <div class="collab-sidebar">
            <!-- Session Controls -->
            <div class="collab-section">
              <h3>Session</h3>
              <div class="session-controls">
                <button id="create-session-btn" class="btn btn-primary">
                  ➕ Create Session
                </button>
                <button id="join-session-btn" class="btn btn-secondary">
                  🔗 Join Session
                </button>
                <button id="leave-session-btn" class="btn btn-danger" disabled>
                  🚪 Leave
                </button>
              </div>
              <div id="session-info" class="session-info"></div>
            </div>

            <!-- Online Users -->
            <div class="collab-section">
              <h3>
                Online Users
                <span id="user-count" class="badge">0</span>
              </h3>
              <div id="presence-list" class="presence-list"></div>
            </div>

            <!-- Shared Files -->
            <div class="collab-section">
              <h3>Shared Files</h3>
              <button id="share-file-btn" class="btn btn-small" disabled>
                📤 Share File
              </button>
              <div id="shared-files-list" class="files-list"></div>
            </div>
          </div>

          <!-- Right Panel: Tabs -->
          <div class="collab-main">
            <!-- Tabs -->
            <div class="collab-tabs">
              <button class="tab-btn active" data-tab="chat">💬 Chat</button>
              <button class="tab-btn" data-tab="editor">📝 Editor</button>
              <button class="tab-btn" data-tab="terminal">⌨️ Terminal</button>
              <button class="tab-btn" data-tab="workspace">🖥️ Workspace</button>
            </div>

            <!-- Tab Content -->
            <div class="tab-content">
              <!-- Chat Tab -->
              <div id="chat-tab" class="tab-pane active">
                <div class="chat-container">
                  <div id="chat-messages" class="chat-messages"></div>
                  <div class="chat-input-area">
                    <input
                      type="text"
                      id="chat-input"
                      placeholder="Type a message..."
                      disabled
                    />
                    <button id="send-message-btn" class="btn btn-primary" disabled>
                      Send
                    </button>
                  </div>
                </div>
              </div>

              <!-- Collaborative Editor Tab -->
              <div id="editor-tab" class="tab-pane">
                <div class="editor-container">
                  <div class="editor-toolbar">
                    <button id="clear-editor-btn" class="btn btn-small" disabled>
                      Clear
                    </button>
                    <span id="editor-status" class="editor-status"></span>
                  </div>
                  <div id="cursors-container" class="cursors-container"></div>
                  <textarea
                    id="collab-editor"
                    placeholder="Start typing to collaborate in real-time..."
                    disabled
                  ></textarea>
                </div>
              </div>

              <!-- Shared Terminal Tab -->
              <div id="terminal-tab" class="tab-pane">
                <div class="terminal-container">
                  <div class="terminal-info">
                    <p>Share a terminal session with other users. Commands and output are synchronized in real-time.</p>
                  </div>
                  <div id="shared-terminal-output" class="terminal-output"></div>
                  <div class="terminal-input-area">
                    <span class="terminal-prompt">$</span>
                    <input
                      type="text"
                      id="terminal-input"
                      placeholder="Enter command..."
                      disabled
                    />
                  </div>
                </div>
              </div>

              <!-- Workspace Tab -->
              <div id="workspace-tab" class="tab-pane">
                <div class="workspace-container">
                  <div class="workspace-info">
                    <h3>Shared Workspace</h3>
                    <p>Synchronize desktop state, windows, and applications with collaborators.</p>
                  </div>
                  <div class="workspace-controls">
                    <button id="share-workspace-btn" class="btn btn-primary" disabled>
                      📤 Share Current Workspace
                    </button>
                    <button id="sync-workspace-btn" class="btn btn-secondary" disabled>
                      🔄 Sync Workspace
                    </button>
                  </div>
                  <div id="workspace-state" class="workspace-state"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupUIEventListeners();

    return this.container;
  }

  /**
   * Setup event listeners for collaboration events
   */
  setupEventListeners() {
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

    CollaborationManager.on('sync-status', (data) => {
      this.onSyncStatus(data);
    });
  }

  /**
   * Setup UI event listeners
   */
  setupUIEventListeners() {
    // Session controls
    this.container.querySelector('#create-session-btn').addEventListener('click', () => {
      this.createSession();
    });

    this.container.querySelector('#join-session-btn').addEventListener('click', () => {
      this.joinSession();
    });

    this.container.querySelector('#leave-session-btn').addEventListener('click', () => {
      this.leaveSession();
    });

    // Chat
    this.container.querySelector('#send-message-btn').addEventListener('click', () => {
      this.sendMessage();
    });

    this.container.querySelector('#chat-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    // File sharing
    this.container.querySelector('#share-file-btn').addEventListener('click', () => {
      this.shareFile();
    });

    // Tabs
    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Editor
    const editor = this.container.querySelector('#collab-editor');
    editor.addEventListener('input', () => {
      this.onEditorInput();
    });

    this.container.querySelector('#clear-editor-btn').addEventListener('click', () => {
      this.clearEditor();
    });

    // Terminal
    this.container.querySelector('#terminal-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.executeTerminalCommand();
      }
    });

    // Workspace
    this.container.querySelector('#share-workspace-btn').addEventListener('click', () => {
      this.shareWorkspace();
    });

    this.container.querySelector('#sync-workspace-btn').addEventListener('click', () => {
      this.syncWorkspace();
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

      // Initialize shared components
      this.initializeSharedComponents();

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

      // Initialize shared components
      this.initializeSharedComponents();

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

      // Cleanup
      this.cleanupSharedComponents();
      this.currentSession = null;

      this.showNotification('Left session', 'info');
    } catch (error) {
      console.error('Failed to leave session:', error);
      this.showNotification('Failed to leave session', 'error');
    }
  }

  /**
   * Initialize shared components
   */
  initializeSharedComponents() {
    if (!this.currentSession) return;

    const ydoc = this.currentSession.ydoc;

    // Shared document
    this.sharedDocument = new SharedDocument(this.currentSession.id, ydoc);
    this.sharedDocument.setAwareness(this.currentSession.provider.awareness);

    this.sharedDocument.on('text-changed', (data) => {
      this.onDocumentChanged(data);
    });

    this.sharedDocument.on('cursors-changed', (data) => {
      this.onCursorsChanged(data);
    });

    // Shared terminal
    this.sharedTerminal = new SharedTerminal(this.currentSession.id, ydoc);

    this.sharedTerminal.on('history-changed', (data) => {
      this.onTerminalHistoryChanged(data);
    });

    // Shared workspace
    this.sharedWorkspace = new SharedWorkspace(this.currentSession.id, ydoc);

    this.sharedWorkspace.on('workspace-updated', (data) => {
      this.onWorkspaceUpdated(data);
    });
  }

  /**
   * Cleanup shared components
   */
  cleanupSharedComponents() {
    if (this.sharedDocument) {
      this.sharedDocument.destroy();
      this.sharedDocument = null;
    }

    if (this.sharedTerminal) {
      this.sharedTerminal.destroy();
      this.sharedTerminal = null;
    }

    if (this.sharedWorkspace) {
      this.sharedWorkspace.destroy();
      this.sharedWorkspace = null;
    }
  }

  /**
   * Send chat message
   */
  sendMessage() {
    if (!this.currentSession) return;

    const input = this.container.querySelector('#chat-input');
    const message = input.value.trim();

    if (!message) return;

    try {
      CollaborationManager.sendChatMessage(this.currentSession.id, message);
      input.value = '';
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  /**
   * Share file
   */
  async shareFile() {
    if (!this.currentSession) return;

    const filePath = prompt('Enter file path to share:');
    if (!filePath) return;

    try {
      await CollaborationManager.shareFile(this.currentSession.id, {
        path: filePath,
        name: filePath.split('/').pop(),
        size: 0,
        type: 'file'
      });

      this.showNotification('File shared successfully', 'success');
    } catch (error) {
      console.error('Failed to share file:', error);
      this.showNotification('Failed to share file', 'error');
    }
  }

  /**
   * Switch tabs
   */
  switchTab(tabName) {
    // Update tab buttons
    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    this.container.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    this.container.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.remove('active');
    });
    this.container.querySelector(`#${tabName}-tab`).classList.add('active');
  }

  /**
   * Editor input handler
   */
  onEditorInput() {
    if (!this.sharedDocument) return;

    const editor = this.container.querySelector('#collab-editor');
    const content = editor.value;

    // Update shared document
    this.sharedDocument.setContent(content);
  }

  /**
   * Clear editor
   */
  clearEditor() {
    if (!this.sharedDocument) return;

    this.sharedDocument.setContent('');
    this.container.querySelector('#collab-editor').value = '';
  }

  /**
   * Document changed
   */
  onDocumentChanged(data) {
    const editor = this.container.querySelector('#collab-editor');

    // Update editor content if not focused (to avoid cursor jumping)
    if (document.activeElement !== editor) {
      editor.value = data.content;
    }

    // Update status
    const status = this.container.querySelector('#editor-status');
    status.textContent = `${data.content.length} characters`;
  }

  /**
   * Cursors changed
   */
  onCursorsChanged(data) {
    // Would render cursor indicators in the editor
    console.log('Remote cursors:', data.cursors);
  }

  /**
   * Execute terminal command
   */
  executeTerminalCommand() {
    if (!this.sharedTerminal) return;

    const input = this.container.querySelector('#terminal-input');
    const command = input.value.trim();

    if (!command) return;

    const user = CollaborationManager.currentUser;

    // Add command to shared terminal
    this.sharedTerminal.executeCommand(command, user.id, user.name);

    // Simulate output (in a real implementation, would execute via kernel)
    setTimeout(() => {
      const output = `Command '${command}' executed (simulated)`;
      this.sharedTerminal.addOutput(output, user.id, user.name);
    }, 100);

    input.value = '';
  }

  /**
   * Terminal history changed
   */
  onTerminalHistoryChanged(data) {
    const output = this.container.querySelector('#shared-terminal-output');

    // Render history
    output.innerHTML = data.history.map(entry => {
      if (entry.type === 'command') {
        return `<div class="terminal-entry command">
          <span class="prompt">$</span> ${this.escapeHtml(entry.command)}
        </div>`;
      } else if (entry.type === 'output') {
        return `<div class="terminal-entry output">
          ${this.escapeHtml(entry.output)}
        </div>`;
      }
      return '';
    }).join('');

    // Scroll to bottom
    output.scrollTop = output.scrollHeight;
  }

  /**
   * Share workspace
   */
  shareWorkspace() {
    if (!this.sharedWorkspace) return;

    // Get current workspace state (would integrate with WorkspaceManager)
    const workspaceState = {
      windows: [],
      apps: [],
      desktop: {}
    };

    this.sharedWorkspace.shareDesktopState(workspaceState);

    this.showNotification('Workspace shared', 'success');
  }

  /**
   * Sync workspace
   */
  syncWorkspace() {
    if (!this.sharedWorkspace) return;

    const state = this.sharedWorkspace.getDesktopState();
    console.log('Syncing workspace:', state);

    this.showNotification('Workspace synced', 'success');
  }

  /**
   * Workspace updated
   */
  onWorkspaceUpdated(data) {
    console.log('Workspace updated:', data);

    const stateDiv = this.container.querySelector('#workspace-state');
    stateDiv.innerHTML = `
      <pre>${JSON.stringify(data, null, 2)}</pre>
    `;
  }

  /**
   * Session created
   */
  onSessionCreated(session) {
    // Enable controls
    this.container.querySelector('#leave-session-btn').disabled = false;
    this.container.querySelector('#chat-input').disabled = false;
    this.container.querySelector('#send-message-btn').disabled = false;
    this.container.querySelector('#share-file-btn').disabled = false;
    this.container.querySelector('#collab-editor').disabled = false;
    this.container.querySelector('#clear-editor-btn').disabled = false;
    this.container.querySelector('#terminal-input').disabled = false;
    this.container.querySelector('#share-workspace-btn').disabled = false;
    this.container.querySelector('#sync-workspace-btn').disabled = false;

    // Show session info
    const sessionInfo = this.container.querySelector('#session-info');
    sessionInfo.innerHTML = `
      <div class="session-card">
        <div class="session-id">
          <strong>Session ID:</strong>
          <code>${session.id}</code>
          <button class="btn-copy" data-session-id="${session.id}">
            📋 Copy
          </button>
        </div>
        <div class="session-name">
          <strong>Name:</strong> ${session.name}
        </div>
      </div>
    `;

    // Add event listener for copy button
    const copyBtn = sessionInfo.querySelector('.btn-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(session.id).then(() => {
          this.showNotification('Session ID copied to clipboard', 'success');
        }).catch(err => {
          console.error('Failed to copy:', err);
          this.showNotification('Failed to copy Session ID', 'error');
        });
      });
    }
  }

  /**
   * Session left
   */
  onSessionLeft(sessionId) {
    // Disable controls
    this.container.querySelector('#leave-session-btn').disabled = true;
    this.container.querySelector('#chat-input').disabled = true;
    this.container.querySelector('#send-message-btn').disabled = true;
    this.container.querySelector('#share-file-btn').disabled = true;
    this.container.querySelector('#collab-editor').disabled = true;
    this.container.querySelector('#clear-editor-btn').disabled = true;
    this.container.querySelector('#terminal-input').disabled = true;
    this.container.querySelector('#share-workspace-btn').disabled = true;
    this.container.querySelector('#sync-workspace-btn').disabled = true;

    // Clear session info
    this.container.querySelector('#session-info').innerHTML = '';

    // Clear presence
    this.container.querySelector('#presence-list').innerHTML = '';
    this.container.querySelector('#user-count').textContent = '0';

    // Clear chat
    this.chatMessages = [];
    this.container.querySelector('#chat-messages').innerHTML = '';
  }

  /**
   * Presence changed
   */
  onPresenceChanged(data) {
    if (!this.currentSession || data.sessionId !== this.currentSession.id) return;

    const presenceList = this.container.querySelector('#presence-list');
    const userCount = this.container.querySelector('#user-count');

    userCount.textContent = data.presence.length;

    presenceList.innerHTML = data.presence.map(user => `
      <div class="presence-item">
        <span class="user-avatar" style="background-color: ${user.color}">
          ${user.avatar}
        </span>
        <span class="user-name">${user.name}</span>
        <span class="user-status">●</span>
      </div>
    `).join('');
  }

  /**
   * Chat message
   */
  onChatMessage(data) {
    if (!this.currentSession || data.sessionId !== this.currentSession.id) return;

    const message = data.message;
    this.chatMessages.push(message);

    const chatMessages = this.container.querySelector('#chat-messages');

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
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * File shared
   */
  onFileShared(data) {
    if (!this.currentSession || data.sessionId !== this.currentSession.id) return;

    const filesList = this.container.querySelector('#shared-files-list');

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
   * Sync status
   */
  onSyncStatus(data) {
    if (!this.currentSession || data.sessionId !== this.currentSession.id) return;

    const status = this.container.querySelector('#editor-status');
    if (status) {
      status.style.color = data.synced ? '#4CAF50' : '#FFC107';
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);

    // Would integrate with NotificationCenter
    if (window.NotificationCenter) {
      window.NotificationCenter.show(message, type);
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
   * Cleanup
   */
  destroy() {
    if (this.currentSession) {
      this.leaveSession();
    }

    this.cleanupSharedComponents();
  }
}

export default CollaborationHub;
