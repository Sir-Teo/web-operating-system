import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Kernel', () => {
  let Kernel;
  let kernel;

  beforeEach(async () => {
    // Reset modules before each test
    vi.resetModules();

    // Mock dependencies
    vi.mock('../../src/kernel/ProcessManager.js', () => ({
      default: {
        listProcesses: vi.fn(() => []),
        killProcess: vi.fn(),
      },
    }));

    vi.mock('../../src/kernel/Scheduler.js', () => ({
      default: {},
    }));

    vi.mock('../../src/kernel/IPC.js', () => ({
      default: {},
    }));

    vi.mock('../../src/filesystem/VFS.js', () => ({
      default: {
        init: vi.fn(),
        readFile: vi.fn(),
        writeFile: vi.fn(),
        mkdir: vi.fn(),
        sync: vi.fn(),
      },
    }));

    vi.mock('../../src/security/PermissionManager.js', () => ({
      default: {},
    }));

    // Mock navigator.storage
    global.navigator.storage = {
      persist: vi.fn().mockResolvedValue(true),
      estimate: vi.fn().mockResolvedValue({
        usage: 1024 * 1024 * 10, // 10 MB
        quota: 1024 * 1024 * 1024, // 1 GB
      }),
    };

    // Import Kernel after mocks are set up
    const module = await import('../../src/kernel/Kernel.js');
    Kernel = module.default;

    // Reset kernel state
    Kernel.initialized = false;
    Kernel.bootTime = Date.now();
  });

  describe('Initialization', () => {
    it('should have correct initial state', () => {
      expect(Kernel.initialized).toBe(false);
      expect(Kernel.version).toBe('1.0.0');
      expect(Kernel.bootTime).toBeDefined();
      expect(Kernel.config).toBeDefined();
    });

    it('should have all required subsystems', () => {
      expect(Kernel.processManager).toBeDefined();
      expect(Kernel.scheduler).toBeDefined();
      expect(Kernel.ipc).toBeDefined();
      expect(Kernel.vfs).toBeDefined();
      expect(Kernel.permissionManager).toBeDefined();
      expect(Kernel.eventBus).toBeDefined();
    });
  });

  describe('boot()', () => {
    it('should successfully boot the kernel', async () => {
      const eventSpy = vi.fn();
      Kernel.addEventListener('kernel-ready', eventSpy);

      const result = await Kernel.boot();

      expect(result).toBe(true);
      expect(Kernel.initialized).toBe(true);
      expect(eventSpy).toHaveBeenCalled();
    });

    it('should initialize VFS during boot', async () => {
      await Kernel.boot();
      expect(Kernel.vfs.init).toHaveBeenCalled();
    });

    it('should check browser support', async () => {
      await Kernel.boot();
      // If we get here without errors, browser support check passed
      expect(Kernel.initialized).toBe(true);
    });

    it('should handle boot errors gracefully', async () => {
      const error = new Error('Boot failed');
      Kernel.vfs.init.mockRejectedValueOnce(error);

      const errorSpy = vi.fn();
      Kernel.addEventListener('kernel-error', errorSpy);

      await expect(Kernel.boot()).rejects.toThrow('Boot failed');
      expect(errorSpy).toHaveBeenCalled();
      expect(Kernel.initialized).toBe(false);
    });

    it('should load system configuration', async () => {
      const mockConfig = { theme: 'dark', wallpaper: '/test.jpg' };
      Kernel.vfs.readFile.mockResolvedValueOnce(JSON.stringify(mockConfig));

      await Kernel.boot();

      expect(Kernel.config.theme).toBe('dark');
    });

    it('should create default configuration if none exists', async () => {
      Kernel.vfs.readFile.mockRejectedValueOnce(new Error('File not found'));
      Kernel.vfs.mkdir.mockResolvedValueOnce();
      Kernel.vfs.writeFile.mockResolvedValueOnce();

      await Kernel.boot();

      expect(Kernel.config.theme).toBe('light');
      expect(Kernel.vfs.mkdir).toHaveBeenCalledWith(
        '/home/user/.config',
        { recursive: true }
      );
    });
  });

  describe('shutdown()', () => {
    beforeEach(async () => {
      await Kernel.boot();
    });

    it('should shut down cleanly', async () => {
      const eventSpy = vi.fn();
      Kernel.addEventListener('kernel-shutdown', eventSpy);

      await Kernel.shutdown();

      expect(eventSpy).toHaveBeenCalled();
      expect(Kernel.vfs.sync).toHaveBeenCalled();
    });

    it('should terminate all processes', async () => {
      const mockProcesses = [
        { pid: 1, name: 'test1' },
        { pid: 2, name: 'test2' },
      ];
      Kernel.processManager.listProcesses.mockReturnValueOnce(mockProcesses);

      await Kernel.shutdown();

      expect(Kernel.processManager.killProcess).toHaveBeenCalledTimes(2);
      expect(Kernel.processManager.killProcess).toHaveBeenCalledWith(1);
      expect(Kernel.processManager.killProcess).toHaveBeenCalledWith(2);
    });
  });

  describe('getSystemInfo()', () => {
    it('should return system information', () => {
      const info = Kernel.getSystemInfo();

      expect(info).toHaveProperty('version', '1.0.0');
      expect(info).toHaveProperty('bootTime');
      expect(info).toHaveProperty('uptime');
      expect(info).toHaveProperty('platform');
      expect(info).toHaveProperty('userAgent');
      expect(info).toHaveProperty('language');
      expect(info).toHaveProperty('cores');
      expect(info).toHaveProperty('memory');
    });

    it('should calculate uptime correctly', () => {
      const before = Date.now();
      const info = Kernel.getSystemInfo();
      const after = Date.now();

      expect(info.uptime).toBeGreaterThanOrEqual(0);
      expect(info.uptime).toBeLessThanOrEqual(after - Kernel.bootTime);
    });
  });

  describe('_formatBytes()', () => {
    it('should format bytes correctly', () => {
      expect(Kernel._formatBytes(0)).toBe('0 Bytes');
      expect(Kernel._formatBytes(1024)).toBe('1 KB');
      expect(Kernel._formatBytes(1024 * 1024)).toBe('1 MB');
      expect(Kernel._formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should handle fractional values', () => {
      const result = Kernel._formatBytes(1536); // 1.5 KB
      expect(result).toContain('1.5');
      expect(result).toContain('KB');
    });
  });
});
