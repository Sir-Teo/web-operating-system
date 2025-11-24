import { PermissionError, MessageDeliveryError, ChannelNotFoundError } from './Errors.js';
import { createLogger } from './Logger.js';

const logger = createLogger('IPC');

class MessageBus extends EventTarget {
  constructor() {
    super();
    this.channels = new Map();
    this.broadcastChannel = new BroadcastChannel('webos-system');
    this.permissionManager = null;
    this.processManager = null;
    this.permissionChecksEnabled = true;
    this._currentProcessId = null;

    this.broadcastChannel.onmessage = (event) => {
      logger.debug('Broadcast message received', { data: event.data });
      this.dispatchEvent(new CustomEvent('message', {
        detail: event.data
      }));
    };

    logger.info('IPC MessageBus initialized');
  }

  /**
   * Set permission manager for access control
   */
  setPermissionManager(permissionManager) {
    this.permissionManager = permissionManager;
    logger.info('Permission manager configured');
  }

  /**
   * Set process manager to get process context
   */
  setProcessManager(processManager) {
    this.processManager = processManager;
    logger.info('Process manager configured');
  }

  /**
   * Set current process context
   */
  setProcessContext(processId) {
    this._currentProcessId = processId;
  }

  /**
   * Clear process context
   */
  clearProcessContext() {
    this._currentProcessId = null;
  }

  /**
   * Get current process ID
   */
  _getCurrentProcessId() {
    return this._currentProcessId;
  }

  /**
   * Check if current process has permission
   */
  _checkPermission(permission, details = {}) {
    if (!this.permissionChecksEnabled) {
      return;
    }

    if (!this.permissionManager || !this.processManager) {
      logger.warn('Permission/Process manager not configured, allowing operation');
      return;
    }

    const processId = this._getCurrentProcessId();
    if (!processId) {
      logger.warn('No process context, allowing operation');
      return;
    }

    const process = this.processManager.getProcess(processId);
    if (!process) {
      logger.warn('Process not found, denying operation', { processId });
      throw new PermissionError(permission, { processId, ...details });
    }

    if (!process.permissions.has(permission)) {
      logger.error('Permission denied', { processId, permission, ...details });
      throw new PermissionError(permission, {
        processId,
        processName: process.name,
        ...details
      });
    }

    logger.debug('Permission granted', { processId, permission });
  }

  send(target, message) {
    this._checkPermission('system.ipc', { operation: 'send', target });
    logger.debug('Sending message', { target, message });

    // Send to specific process
    const channel = this.channels.get(target);
    if (!channel) {
      logger.warn('Channel not found', { target });
      return false;
    }

    try {
      channel.postMessage(message);
      logger.debug('Message sent successfully', { target });
    } catch (err) {
      const error = new MessageDeliveryError(target, { originalError: err });
      logger.error('Failed to send message', error);
      throw error;
    }
  }

  broadcast(message) {
    this._checkPermission('system.ipc', { operation: 'broadcast' });
    logger.debug('Broadcasting message', { message });

    try {
      // Broadcast to all processes
      this.broadcastChannel.postMessage(message);
      logger.debug('Broadcast sent successfully');
    } catch (err) {
      logger.error('Failed to broadcast message', err);
      throw new MessageDeliveryError('broadcast', { originalError: err });
    }
  }

  subscribe(topic, callback) {
    logger.debug('Subscribing to topic', { topic });
    this.addEventListener(topic, callback);
  }

  unsubscribe(topic, callback) {
    logger.debug('Unsubscribing from topic', { topic });
    this.removeEventListener(topic, callback);
  }

  createChannel(processId) {
    logger.debug('Creating channel', { processId });

    const channel = new MessageChannel();
    this.channels.set(processId, channel.port1);

    logger.info('Channel created', { processId });
    return channel.port2;
  }

  /**
   * Close a channel
   */
  closeChannel(processId) {
    logger.debug('Closing channel', { processId });

    const channel = this.channels.get(processId);
    if (channel) {
      channel.close();
      this.channels.delete(processId);
      logger.info('Channel closed', { processId });
    }
  }

  /**
   * Get all active channels
   */
  getActiveChannels() {
    return Array.from(this.channels.keys());
  }
}

export default new MessageBus();
