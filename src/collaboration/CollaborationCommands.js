/**
 * CollaborationCommands - Terminal commands for collaboration features
 */

import CollaborationManager from './CollaborationManager.js';

class CollaborationCommands {
  constructor(terminal) {
    this.terminal = terminal;
    this.currentSession = null;
  }

  /**
   * Register collaboration commands
   */
  register(commandRegistry) {
    // Session management
    commandRegistry['collab'] = this.collab.bind(this);
    commandRegistry['session'] = this.session.bind(this);
    commandRegistry['presence'] = this.presence.bind(this);
    commandRegistry['chat'] = this.chat.bind(this);
    commandRegistry['share'] = this.share.bind(this);
  }

  /**
   * Main collaboration command
   */
  async collab(args) {
    const subcommand = args[0];

    if (!subcommand) {
      return this.showCollabHelp();
    }

    switch (subcommand) {
      case 'create':
        return await this.createSession(args.slice(1));

      case 'join':
        return await this.joinSession(args.slice(1));

      case 'leave':
        return await this.leaveSession();

      case 'status':
        return this.showStatus();

      case 'list':
        return this.listSessions();

      case 'help':
        return this.showCollabHelp();

      default:
        return `Unknown subcommand: ${subcommand}\nUse 'collab help' for usage.`;
    }
  }

  /**
   * Session command
   */
  async session(args) {
    const subcommand = args[0];

    if (!subcommand) {
      return this.showSessionInfo();
    }

    switch (subcommand) {
      case 'info':
        return this.showSessionInfo();

      case 'id':
        return this.currentSession ? this.currentSession.id : 'Not in a session';

      case 'peers':
        return this.showPeers();

      default:
        return `Unknown subcommand: ${subcommand}`;
    }
  }

  /**
   * Presence command
   */
  presence(args) {
    if (!this.currentSession) {
      return 'Not in a collaboration session. Use "collab join <session-id>" to join.';
    }

    const peers = CollaborationManager.getPeers(this.currentSession.id);

    if (peers.length === 0) {
      return 'No other users in this session.';
    }

    let output = `Online Users (${peers.length}):\n\n`;

    peers.forEach((user, index) => {
      output += `${index + 1}. ${user.name} (${user.id})\n`;
    });

    return output;
  }

  /**
   * Chat command
   */
  chat(args) {
    if (!this.currentSession) {
      return 'Not in a collaboration session. Use "collab join <session-id>" to join.';
    }

    const message = args.join(' ');

    if (!message) {
      // Show chat history
      const history = CollaborationManager.getChatHistory(this.currentSession.id);

      if (history.length === 0) {
        return 'No chat messages yet.';
      }

      let output = 'Chat History:\n\n';

      history.slice(-20).forEach(msg => {
        const time = new Date(msg.timestamp).toLocaleTimeString();
        output += `[${time}] ${msg.userName}: ${msg.message}\n`;
      });

      return output;
    }

    // Send message
    CollaborationManager.sendChatMessage(this.currentSession.id, message);
    return `Message sent: ${message}`;
  }

  /**
   * Share command
   */
  async share(args) {
    if (!this.currentSession) {
      return 'Not in a collaboration session. Use "collab join <session-id>" to join.';
    }

    const filePath = args[0];

    if (!filePath) {
      // List shared files
      const files = CollaborationManager.getSharedFiles(this.currentSession.id);

      if (files.length === 0) {
        return 'No shared files yet.\n\nUsage: share <file-path>';
      }

      let output = 'Shared Files:\n\n';

      files.forEach((file, index) => {
        const time = new Date(file.sharedAt).toLocaleString();
        output += `${index + 1}. ${file.name} (shared by ${file.sharedBy} at ${time})\n`;
        output += `   Path: ${file.path}\n\n`;
      });

      return output;
    }

    // Share file
    try {
      await CollaborationManager.shareFile(this.currentSession.id, {
        path: filePath,
        name: filePath.split('/').pop(),
        size: 0, // Would get actual size from filesystem
        type: 'file'
      });

      return `File shared: ${filePath}`;
    } catch (error) {
      return `Failed to share file: ${error.message}`;
    }
  }

  /**
   * Create a new session
   */
  async createSession(args) {
    const name = args.join(' ') || undefined;

    try {
      const session = await CollaborationManager.createSession({
        name
      });

      this.currentSession = session;

      return `
Collaboration session created!

Session ID: ${session.id}
Name: ${session.name}
Created: ${new Date(session.createdAt).toLocaleString()}

Share this session ID with others to collaborate:
  collab join ${session.id}

Commands:
  chat <message>     - Send a chat message
  presence           - Show online users
  share <file>       - Share a file
  collab leave       - Leave the session
`;
    } catch (error) {
      return `Failed to create session: ${error.message}`;
    }
  }

  /**
   * Join an existing session
   */
  async joinSession(args) {
    const sessionId = args[0];

    if (!sessionId) {
      return 'Usage: collab join <session-id>';
    }

    try {
      const session = await CollaborationManager.joinSession(sessionId);

      this.currentSession = session;

      return `
Joined collaboration session!

Session ID: ${session.id}
Name: ${session.name}

Commands:
  chat <message>     - Send a chat message
  presence           - Show online users
  share <file>       - Share a file
  collab leave       - Leave the session
`;
    } catch (error) {
      return `Failed to join session: ${error.message}`;
    }
  }

  /**
   * Leave current session
   */
  async leaveSession() {
    if (!this.currentSession) {
      return 'Not in a collaboration session.';
    }

    const sessionId = this.currentSession.id;

    try {
      await CollaborationManager.leaveSession(sessionId);
      this.currentSession = null;

      return `Left session: ${sessionId}`;
    } catch (error) {
      return `Failed to leave session: ${error.message}`;
    }
  }

  /**
   * Show current status
   */
  showStatus() {
    if (!this.currentSession) {
      return 'Not in a collaboration session.\n\nUse "collab create" or "collab join <session-id>" to start collaborating.';
    }

    const peers = CollaborationManager.getPeers(this.currentSession.id);
    const files = CollaborationManager.getSharedFiles(this.currentSession.id);
    const messages = CollaborationManager.getChatHistory(this.currentSession.id);

    return `
Current Collaboration Session:

Session ID: ${this.currentSession.id}
Name: ${this.currentSession.name}
Created: ${new Date(this.currentSession.createdAt).toLocaleString()}

Statistics:
  Online Users: ${peers.length}
  Shared Files: ${files.length}
  Chat Messages: ${messages.length}

Use 'collab help' for available commands.
`;
  }

  /**
   * List all sessions
   */
  listSessions() {
    const sessions = CollaborationManager.getSessions();

    if (sessions.length === 0) {
      return 'No active sessions.\n\nUse "collab create" to create a new session.';
    }

    let output = 'Active Sessions:\n\n';

    sessions.forEach((session, index) => {
      const current = this.currentSession && session.id === this.currentSession.id;
      const marker = current ? '* ' : '  ';

      output += `${marker}${index + 1}. ${session.name}\n`;
      output += `   ID: ${session.id}\n`;
      output += `   Created: ${new Date(session.createdAt).toLocaleString()}\n\n`;
    });

    return output;
  }

  /**
   * Show session info
   */
  showSessionInfo() {
    if (!this.currentSession) {
      return 'Not in a collaboration session.';
    }

    return `
Session Information:

ID: ${this.currentSession.id}
Name: ${this.currentSession.name}
Created: ${new Date(this.currentSession.createdAt).toLocaleString()}
Created By: ${this.currentSession.createdBy}

Permissions:
  Read: ${this.currentSession.permissions.read}
  Write: ${this.currentSession.permissions.write}
  Share: ${this.currentSession.permissions.share}
`;
  }

  /**
   * Show peers
   */
  showPeers() {
    if (!this.currentSession) {
      return 'Not in a collaboration session.';
    }

    const peers = CollaborationManager.getPeers(this.currentSession.id);

    if (peers.length === 0) {
      return 'No other users in this session.';
    }

    let output = `Peers in Session (${peers.length}):\n\n`;

    peers.forEach((user, index) => {
      output += `${index + 1}. ${user.name}\n`;
      output += `   ID: ${user.id}\n`;
      output += `   Color: ${user.color}\n`;
      output += `   Last Seen: ${new Date(user.lastSeen).toLocaleString()}\n\n`;
    });

    return output;
  }

  /**
   * Show help
   */
  showCollabHelp() {
    return `
Collaboration Commands:

Session Management:
  collab create [name]           - Create a new collaboration session
  collab join <session-id>       - Join an existing session
  collab leave                   - Leave the current session
  collab status                  - Show current session status
  collab list                    - List all active sessions

Communication:
  chat [message]                 - Send a chat message or view history
  presence                       - Show online users

Sharing:
  share [file-path]              - Share a file or list shared files

Session Information:
  session info                   - Show detailed session information
  session id                     - Show current session ID
  session peers                  - Show all peers in session

Examples:
  collab create "My Team Session"
  collab join session-1234567890
  chat Hello everyone!
  share /home/user/document.txt
  presence
  collab leave

For more information, visit the Collaboration Hub application.
`;
  }
}

export default CollaborationCommands;
