import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from '../../src/utils/Logger.js';

describe('Logger', () => {
  let logger;
  let consoleSpy;

  beforeEach(() => {
    logger = new Logger('TestNamespace');
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    Object.values(consoleSpy).forEach(spy => spy.mockRestore());
  });

  describe('Constructor', () => {
    it('should create logger with namespace', () => {
      expect(logger.namespace).toBe('TestNamespace');
    });

    it('should be enabled by default', () => {
      expect(logger.enabled).toBe(true);
    });
  });

  describe('Log levels', () => {
    it('should log debug messages', () => {
      logger.debug('test message', { data: 'value' });

      expect(consoleSpy.debug).toHaveBeenCalled();
      const call = consoleSpy.debug.mock.calls[0];
      expect(call[0]).toContain('[debug]');
      expect(call[0]).toContain('[TestNamespace]');
      expect(call[1]).toBe('test message');
      expect(call[2]).toEqual({ data: 'value' });
    });

    it('should log info messages', () => {
      logger.info('info message');

      expect(consoleSpy.info).toHaveBeenCalled();
      const call = consoleSpy.info.mock.calls[0];
      expect(call[0]).toContain('[info]');
      expect(call[0]).toContain('[TestNamespace]');
    });

    it('should log warn messages', () => {
      logger.warn('warning message');

      expect(consoleSpy.warn).toHaveBeenCalled();
      const call = consoleSpy.warn.mock.calls[0];
      expect(call[0]).toContain('[warn]');
      expect(call[0]).toContain('[TestNamespace]');
    });

    it('should log error messages', () => {
      logger.error('error message');

      expect(consoleSpy.error).toHaveBeenCalled();
      const call = consoleSpy.error.mock.calls[0];
      expect(call[0]).toContain('[error]');
      expect(call[0]).toContain('[TestNamespace]');
    });
  });

  describe('Timestamp', () => {
    it('should include ISO timestamp in logs', () => {
      logger.info('test');

      const call = consoleSpy.info.mock.calls[0];
      const prefix = call[0];

      // Check for ISO timestamp format
      expect(prefix).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });
  });

  describe('Multiple arguments', () => {
    it('should handle multiple arguments', () => {
      const arg1 = 'message';
      const arg2 = { key: 'value' };
      const arg3 = [1, 2, 3];

      logger.info(arg1, arg2, arg3);

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.any(String),
        arg1,
        arg2,
        arg3
      );
    });
  });

  describe('Enable/Disable', () => {
    it('should not log when disabled', () => {
      logger.enabled = false;

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });

    it('should log when re-enabled', () => {
      logger.enabled = false;
      logger.info('should not log');
      expect(consoleSpy.info).not.toHaveBeenCalled();

      logger.enabled = true;
      logger.info('should log');
      expect(consoleSpy.info).toHaveBeenCalled();
    });
  });

  describe('Namespace isolation', () => {
    it('should have separate namespaces for different loggers', () => {
      const logger1 = new Logger('Component1');
      const logger2 = new Logger('Component2');

      logger1.info('test1');
      logger2.info('test2');

      const calls = consoleSpy.info.mock.calls;
      expect(calls[0][0]).toContain('[Component1]');
      expect(calls[1][0]).toContain('[Component2]');
    });
  });
});
