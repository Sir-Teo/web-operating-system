import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('IPC (Inter-Process Communication)', () => {
  let IPC;

  beforeEach(async () => {
    vi.resetModules();

    // Mock MessageChannel
    global.MessageChannel = class MessageChannel {
      constructor() {
        this.port1 = {
          postMessage: vi.fn(),
          onmessage: null,
        };
        this.port2 = {
          postMessage: vi.fn(),
          onmessage: null,
        };
      }
    };

    const module = await import('../../src/kernel/IPC.js');
    IPC = module.default;

    // Reset IPC state
    IPC.channels.clear();
  });

  describe('broadcast()', () => {
    it('should broadcast messages to all processes', () => {
      const message = { type: 'test', data: 'hello' };
      const spy = vi.spyOn(IPC.broadcastChannel, 'postMessage');

      IPC.broadcast(message);

      expect(spy).toHaveBeenCalledWith(message);
    });
  });

  describe('send()', () => {
    it('should send message to specific process', () => {
      const processId = 'test-process-1';
      const channel = IPC.createChannel(processId);
      const message = { type: 'test', data: 'hello' };

      IPC.send(processId, message);

      expect(IPC.channels.get(processId).postMessage).toHaveBeenCalledWith(message);
    });

    it('should handle sending to non-existent process gracefully', () => {
      expect(() => {
        IPC.send('non-existent', { test: true });
      }).not.toThrow();
    });
  });

  describe('subscribe/unsubscribe()', () => {
    it('should subscribe to topic', () => {
      const callback = vi.fn();

      IPC.subscribe('test-topic', callback);

      IPC.dispatchEvent(new CustomEvent('test-topic', { detail: 'data' }));

      expect(callback).toHaveBeenCalled();
    });

    it('should unsubscribe from topic', () => {
      const callback = vi.fn();

      IPC.subscribe('test-topic', callback);
      IPC.unsubscribe('test-topic', callback);

      IPC.dispatchEvent(new CustomEvent('test-topic', { detail: 'data' }));

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('createChannel()', () => {
    it('should create communication channel for process', () => {
      const processId = 'test-process';
      const port = IPC.createChannel(processId);

      expect(port).toBeDefined();
      expect(port.postMessage).toBeDefined();
      expect(IPC.channels.has(processId)).toBe(true);
    });

    it('should return unique ports for different processes', () => {
      const port1 = IPC.createChannel('process-1');
      const port2 = IPC.createChannel('process-2');

      expect(port1).not.toBe(port2);
    });
  });

  describe('message handling', () => {
    it('should dispatch message events from broadcast channel', async () => {
      const testData = { type: 'system', payload: 'test' };

      const promise = new Promise((resolve) => {
        IPC.addEventListener('message', (event) => {
          expect(event.detail).toEqual(testData);
          resolve();
        });
      });

      // Simulate receiving a broadcast message
      IPC.broadcastChannel.onmessage({ data: testData });

      await promise;
    });
  });
});
