class MessageBus extends EventTarget {
  constructor() {
    super();
    this.channels = new Map();
    this.broadcastChannel = new BroadcastChannel('webos-system');

    this.broadcastChannel.onmessage = (event) => {
      this.dispatchEvent(new CustomEvent('message', {
        detail: event.data
      }));
    };
  }

  send(target, message) {
    // Send to specific process
    const channel = this.channels.get(target);
    if (channel) {
      channel.postMessage(message);
    }
  }

  broadcast(message) {
    // Broadcast to all processes
    this.broadcastChannel.postMessage(message);
  }

  subscribe(topic, callback) {
    this.addEventListener(topic, callback);
  }

  unsubscribe(topic, callback) {
    this.removeEventListener(topic, callback);
  }

  createChannel(processId) {
    const channel = new MessageChannel();
    this.channels.set(processId, channel.port1);
    return channel.port2;
  }
}

export default new MessageBus();
