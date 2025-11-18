import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus, eventBus } from '../../src/utils/EventBus.js';

describe('EventBus', () => {
  let bus;

  beforeEach(() => {
    bus = new EventBus();
  });

  describe('on()', () => {
    it('should register event listener', () => {
      const callback = vi.fn();
      bus.on('test-event', callback);

      bus.emit('test-event', { data: 'test' });

      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should support multiple listeners for same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      bus.on('test-event', callback1);
      bus.on('test-event', callback2);

      bus.emit('test-event', 'data');

      expect(callback1).toHaveBeenCalledWith('data');
      expect(callback2).toHaveBeenCalledWith('data');
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = bus.on('test-event', callback);

      unsubscribe();
      bus.emit('test-event', 'data');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('off()', () => {
    it('should remove event listener', () => {
      const callback = vi.fn();

      bus.on('test-event', callback);
      bus.off('test-event', callback);

      bus.emit('test-event', 'data');

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle removing non-existent listener', () => {
      const callback = vi.fn();

      expect(() => {
        bus.off('non-existent', callback);
      }).not.toThrow();
    });

    it('should only remove specific callback', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      bus.on('test-event', callback1);
      bus.on('test-event', callback2);
      bus.off('test-event', callback1);

      bus.emit('test-event', 'data');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith('data');
    });

    it('should clean up event map when last listener removed', () => {
      const callback = vi.fn();

      bus.on('test-event', callback);
      bus.off('test-event', callback);

      expect(bus.events.has('test-event')).toBe(false);
    });
  });

  describe('emit()', () => {
    it('should call all registered listeners', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      bus.on('test-event', callback1);
      bus.on('test-event', callback2);
      bus.on('test-event', callback3);

      bus.emit('test-event', 'test-data');

      expect(callback1).toHaveBeenCalledWith('test-data');
      expect(callback2).toHaveBeenCalledWith('test-data');
      expect(callback3).toHaveBeenCalledWith('test-data');
    });

    it('should handle events with no listeners', () => {
      expect(() => {
        bus.emit('non-existent', 'data');
      }).not.toThrow();
    });

    it('should handle errors in listeners gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalCallback = vi.fn();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      bus.on('test-event', errorCallback);
      bus.on('test-event', normalCallback);

      bus.emit('test-event', 'data');

      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });

    it('should pass data to listeners', () => {
      const callback = vi.fn();
      const testData = { foo: 'bar', num: 42 };

      bus.on('test-event', callback);
      bus.emit('test-event', testData);

      expect(callback).toHaveBeenCalledWith(testData);
    });
  });

  describe('once()', () => {
    it('should call listener only once', () => {
      const callback = vi.fn();

      bus.once('test-event', callback);

      bus.emit('test-event', 'first');
      bus.emit('test-event', 'second');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('first');
    });

    it('should auto-unregister after first call', () => {
      const callback = vi.fn();

      bus.once('test-event', callback);
      bus.emit('test-event', 'data');

      expect(bus.events.has('test-event')).toBe(false);
    });
  });

  describe('Global eventBus instance', () => {
    it('should export singleton instance', () => {
      expect(eventBus).toBeDefined();
      expect(eventBus).toBeInstanceOf(EventBus);
    });
  });
});
