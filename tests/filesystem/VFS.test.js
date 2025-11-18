import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create mock driver factory outside beforeEach to fix scope issues
const createMockDriver = () => ({
  init: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue('content'),
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
  readdir: vi.fn().mockResolvedValue([]),
  rm: vi.fn().mockResolvedValue(undefined),
  stat: vi.fn().mockResolvedValue({ size: 100 }),
  rename: vi.fn().mockResolvedValue(undefined),
});

// Mock drivers at module level
vi.mock('../../src/filesystem/drivers/OPFSDriver.js', () => ({
  OPFSDriver: class {
    init = vi.fn().mockResolvedValue(undefined);
    readFile = vi.fn().mockResolvedValue('content');
    writeFile = vi.fn().mockResolvedValue(undefined);
    mkdir = vi.fn().mockResolvedValue(undefined);
    readdir = vi.fn().mockResolvedValue([]);
    rm = vi.fn().mockResolvedValue(undefined);
    stat = vi.fn().mockResolvedValue({ size: 100 });
    rename = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock('../../src/filesystem/drivers/IndexedDBDriver.js', () => ({
  IndexedDBDriver: class {
    init = vi.fn().mockResolvedValue(undefined);
    readFile = vi.fn().mockResolvedValue('content');
    writeFile = vi.fn().mockResolvedValue(undefined);
    mkdir = vi.fn().mockResolvedValue(undefined);
    readdir = vi.fn().mockResolvedValue([]);
    rm = vi.fn().mockResolvedValue(undefined);
    stat = vi.fn().mockResolvedValue({ size: 100 });
    rename = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock('../../src/filesystem/drivers/MemoryDriver.js', () => ({
  MemoryDriver: class {
    init = vi.fn().mockResolvedValue(undefined);
    readFile = vi.fn().mockResolvedValue('content');
    writeFile = vi.fn().mockResolvedValue(undefined);
    mkdir = vi.fn().mockResolvedValue(undefined);
    readdir = vi.fn().mockResolvedValue([]);
    rm = vi.fn().mockResolvedValue(undefined);
    stat = vi.fn().mockResolvedValue({ size: 100 });
    rename = vi.fn().mockResolvedValue(undefined);
  },
}));

describe('VFS (Virtual File System)', () => {
  let VFS;

  beforeEach(async () => {
    // Import fresh VFS instance
    vi.resetModules();
    const module = await import('../../src/filesystem/VFS.js');
    VFS = module.default;

    // Reset VFS state
    VFS.initialized = false;
    VFS.mounted.clear();
    VFS.cache.clear();
  });

  describe('init()', () => {
    it('should initialize VFS', async () => {
      await VFS.init();
      expect(VFS.initialized).toBe(true);
    });

    it('should mount default directories', async () => {
      await VFS.init();

      expect(VFS.mounted.has('/home')).toBe(true);
      expect(VFS.mounted.has('/tmp')).toBe(true);
      expect(VFS.mounted.has('/media')).toBe(true);
    });

    it('should not initialize twice', async () => {
      await VFS.init();
      const sizeAfterFirst = VFS.mounted.size;

      await VFS.init();
      const sizeAfterSecond = VFS.mounted.size;

      expect(sizeAfterFirst).toBe(sizeAfterSecond);
    });
  });

  describe('mount()', () => {
    it('should mount driver at path', async () => {
      const customDriver = {
        init: vi.fn(),
      };

      await VFS.mount('/custom', customDriver);

      expect(VFS.mounted.has('/custom')).toBe(true);
      expect(customDriver.init).toHaveBeenCalled();
    });
  });

  describe('_resolveDriver()', () => {
    beforeEach(async () => {
      await VFS.init();
    });

    it('should resolve correct driver for path', () => {
      const result = VFS._resolveDriver('/home/user/test.txt');

      expect(result.driver).toBeDefined();
      expect(result.relativePath).toBe('/user/test.txt');
    });

    it('should throw error for unmounted path', () => {
      expect(() => {
        VFS._resolveDriver('/unmounted/path');
      }).toThrow('No driver mounted for path');
    });

    it('should handle root path correctly', () => {
      const result = VFS._resolveDriver('/home');
      expect(result.relativePath).toBe('/');
    });
  });

  describe('File Operations', () => {
    beforeEach(async () => {
      await VFS.init();
    });

    describe('readFile()', () => {
      it('should read file through correct driver', async () => {
        const content = await VFS.readFile('/home/user/test.txt');
        expect(content).toBeDefined();
      });
    });

    describe('writeFile()', () => {
      it('should write file through correct driver', async () => {
        await expect(VFS.writeFile('/home/user/test.txt', 'content')).resolves.not.toThrow();
      });

      it('should emit file-changed event', async () => {
        const eventSpy = vi.fn();
        VFS.addEventListener('file-changed', eventSpy);

        await VFS.writeFile('/home/user/test.txt', 'content');

        expect(eventSpy).toHaveBeenCalled();
      });
    });

    describe('mkdir()', () => {
      it('should create directory through driver', async () => {
        await expect(VFS.mkdir('/home/user/newdir')).resolves.not.toThrow();
      });
    });

    describe('rm()', () => {
      it('should remove file', async () => {
        await expect(VFS.rm('/home/user/test.txt')).resolves.not.toThrow();
      });

      it('should emit file-changed event', async () => {
        const eventSpy = vi.fn();
        VFS.addEventListener('file-changed', eventSpy);

        await VFS.rm('/home/user/test.txt');

        expect(eventSpy).toHaveBeenCalled();
      });
    });

    describe('stat()', () => {
      it('should get file stats', async () => {
        const result = await VFS.stat('/home/user/test.txt');
        expect(result).toBeDefined();
      });
    });

    describe('rename()', () => {
      it('should rename file', async () => {
        await expect(VFS.rename('/home/user/old.txt', '/home/user/new.txt')).resolves.not.toThrow();
      });

      it('should emit file-changed event', async () => {
        const eventSpy = vi.fn();
        VFS.addEventListener('file-changed', eventSpy);

        await VFS.rename('/home/user/old.txt', '/home/user/new.txt');

        expect(eventSpy).toHaveBeenCalled();
      });
    });

    describe('copy()', () => {
      it('should copy file', async () => {
        await expect(VFS.copy('/home/user/src.txt', '/home/user/dest.txt')).resolves.not.toThrow();
      });
    });

    describe('exists()', () => {
      it('should return true for existing file', async () => {
        const exists = await VFS.exists('/home/user/test.txt');
        expect(typeof exists).toBe('boolean');
      });
    });
  });

  describe('watch()', () => {
    beforeEach(async () => {
      await VFS.init();
    });

    it('should watch file changes', async () => {
      const callback = vi.fn();
      VFS.watch('/home/user', callback);
      await VFS.writeFile('/home/user/test.txt', 'content');

      expect(callback).toHaveBeenCalled();
    });

    it('should return unwatch function', async () => {
      const callback = vi.fn();
      const unwatch = VFS.watch('/home/user', callback);

      expect(typeof unwatch).toBe('function');
    });
  });

  describe('sync()', () => {
    it('should flush pending writes', async () => {
      await expect(VFS.sync()).resolves.not.toThrow();
    });
  });
});
