/**
 * SharedTerminal - Collaborative terminal session
 *
 * Features:
 * - Share terminal sessions with other users
 * - Real-time command execution and output synchronization
 * - Multi-user input with turn-taking or simultaneous modes
 * - Session recording and playback
 */

import EventEmitter from '../utils/EventEmitter.js';

class SharedTerminal extends EventEmitter {
  constructor(sessionId, ydoc, options = {}) {
    super();

    this.sessionId = sessionId;
    this.ydoc = ydoc;

    // Terminal history as Yjs array
    this.historyArray = ydoc.getArray('terminal-history');

    // Current command being typed
    this.commandText = ydoc.getText('terminal-command');

    // Terminal state map
    this.stateMap = ydoc.getMap('terminal-state');

    // Configuration
    this.config = {
      mode: options.mode || 'collaborative', // 'collaborative' or 'follow'
      maxHistory: options.maxHistory || 1000,
      allowMultipleInput: options.allowMultipleInput !== false
    };

    // Local state
    this.localHistory = [];

    // Setup observers
    this.setupObservers();

    console.log('[SharedTerminal] Initialized for session:', sessionId);
  }

  /**
   * Setup observers
   */
  setupObservers() {
    // Observe history changes
    this.historyArray.observe((event) => {
      this.handleHistoryChange(event);
    });

    // Observe command changes
    this.commandText.observe((event) => {
      this.handleCommandChange(event);
    });

    // Observe state changes
    this.stateMap.observe((event) => {
      this.handleStateChange(event);
    });
  }

  /**
   * Handle history changes
   */
  handleHistoryChange(event) {
    // Update local history
    this.localHistory = this.historyArray.toArray();

    // Trim if exceeds max
    if (this.localHistory.length > this.config.maxHistory) {
      const toRemove = this.localHistory.length - this.config.maxHistory;
      this.historyArray.delete(0, toRemove);
    }

    this.emit('history-changed', {
      history: this.localHistory,
      changes: event.changes
    });
  }

  /**
   * Handle command changes
   */
  handleCommandChange(event) {
    const currentCommand = this.commandText.toString();

    this.emit('command-changed', {
      command: currentCommand,
      delta: event.delta
    });
  }

  /**
   * Handle state changes
   */
  handleStateChange(event) {
    const state = this.getState();

    this.emit('state-changed', {
      state,
      changes: event.changes
    });
  }

  /**
   * Execute a command
   */
  executeCommand(command, userId, userName) {
    const entry = {
      type: 'command',
      command,
      userId,
      userName,
      timestamp: Date.now()
    };

    this.historyArray.push([entry]);

    // Clear current command
    this.commandText.delete(0, this.commandText.length);

    return entry;
  }

  /**
   * Add output to terminal
   */
  addOutput(output, userId, userName, type = 'stdout') {
    const entry = {
      type: 'output',
      outputType: type, // 'stdout', 'stderr', 'info'
      output,
      userId,
      userName,
      timestamp: Date.now()
    };

    this.historyArray.push([entry]);

    return entry;
  }

  /**
   * Update current command text
   */
  updateCommand(text) {
    this.ydoc.transact(() => {
      this.commandText.delete(0, this.commandText.length);
      this.commandText.insert(0, text);
    });
  }

  /**
   * Insert text into current command
   */
  insertIntoCommand(index, text) {
    this.commandText.insert(index, text);
  }

  /**
   * Delete text from current command
   */
  deleteFromCommand(index, length) {
    this.commandText.delete(index, length);
  }

  /**
   * Get current command
   */
  getCurrentCommand() {
    return this.commandText.toString();
  }

  /**
   * Get terminal history
   */
  getHistory() {
    return this.historyArray.toArray();
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.historyArray.delete(0, this.historyArray.length);
  }

  /**
   * Set terminal state
   */
  setState(key, value) {
    this.stateMap.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Get terminal state
   */
  getState(key) {
    if (key) {
      const entry = this.stateMap.get(key);
      return entry ? entry.value : undefined;
    }

    // Return all state
    const state = {};
    this.stateMap.forEach((entry, k) => {
      state[k] = entry.value;
    });
    return state;
  }

  /**
   * Set current working directory
   */
  setCwd(cwd, userId) {
    this.setState('cwd', { path: cwd, userId });
  }

  /**
   * Get current working directory
   */
  getCwd() {
    const cwdState = this.getState('cwd');
    return cwdState ? cwdState.path : '/';
  }

  /**
   * Set environment variables
   */
  setEnv(env, userId) {
    this.setState('env', { variables: env, userId });
  }

  /**
   * Get environment variables
   */
  getEnv() {
    const envState = this.getState('env');
    return envState ? envState.variables : {};
  }

  /**
   * Record session event
   */
  recordEvent(eventType, eventData, userId, userName) {
    const entry = {
      type: 'event',
      eventType,
      eventData,
      userId,
      userName,
      timestamp: Date.now()
    };

    this.historyArray.push([entry]);

    return entry;
  }

  /**
   * Export session as JSON
   */
  exportSession() {
    return {
      sessionId: this.sessionId,
      history: this.getHistory(),
      state: this.getState(),
      exportedAt: Date.now()
    };
  }

  /**
   * Import session from JSON
   */
  importSession(sessionData) {
    // Clear current history
    this.clearHistory();

    // Import history
    if (sessionData.history && Array.isArray(sessionData.history)) {
      sessionData.history.forEach(entry => {
        this.historyArray.push([entry]);
      });
    }

    // Import state
    if (sessionData.state) {
      Object.entries(sessionData.state).forEach(([key, value]) => {
        this.setState(key, value);
      });
    }
  }

  /**
   * Destroy the shared terminal
   */
  destroy() {
    this.removeAllListeners();
    console.log('[SharedTerminal] Destroyed for session:', this.sessionId);
  }
}

export default SharedTerminal;
