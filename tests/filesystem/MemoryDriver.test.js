import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryDriver } from '../../src/filesystem/drivers/MemoryDriver.js';

describe('MemoryDriver', () => {
  let driver;

  beforeEach(async () => {
    driver = new MemoryDriver();
    await driver.init();
  });

  describe('init()', () => {
    it('should initialize with root directory', async () => {
      const newDriver = new MemoryDriver();
      await newDriver.init();

      expect(newDriver.initialized).toBe(true);
      expect(newDriver.storage.has('/')).toBe(true);
    });

    it('should not initialize twice', async () => {
      await driver.init();
      const sizeBefore = driver.storage.size;

      await driver.init();
      const sizeAfter = driver.storage.size;

      expect(sizeBefore).toBe(sizeAfter);
    });
  });

  describe('mkdir()', () => {
    it('should create directory', async () => {
      await driver.mkdir('/testdir');

      const stat = await driver.stat('/testdir');
      expect(stat.type).toBe('directory');
      expect(stat.name).toBe('testdir');
    });

    it('should throw if parent does not exist', async () => {
      await expect(driver.mkdir('/a/b/c')).rejects.toThrow('Parent directory not found');
    });

    it('should create nested directories with recursive option', async () => {
      await driver.mkdir('/a/b/c', { recursive: true });

      expect(await driver.stat('/a')).toBeDefined();
      expect(await driver.stat('/a/b')).toBeDefined();
      expect(await driver.stat('/a/b/c')).toBeDefined();
    });

    it('should not throw if directory exists with recursive option', async () => {
      await driver.mkdir('/testdir');
      await expect(driver.mkdir('/testdir', { recursive: true })).resolves.not.toThrow();
    });

    it('should throw if directory exists without recursive option', async () => {
      await driver.mkdir('/testdir');
      await expect(driver.mkdir('/testdir')).rejects.toThrow('Path already exists');
    });
  });

  describe('writeFile()', () => {
    it('should write file with string data', async () => {
      await driver.mkdir('/dir');
      await driver.writeFile('/dir/file.txt', 'Hello World');

      const content = await driver.readFile('/dir/file.txt', { encoding: 'utf8' });
      expect(content).toBe('Hello World');
    });

    it('should write file with binary data', async () => {
      await driver.mkdir('/dir');
      const buffer = new Uint8Array([1, 2, 3, 4]);

      await driver.writeFile('/dir/binary', buffer);

      const content = await driver.readFile('/dir/binary');
      expect(content).toEqual(buffer);
    });

    it('should throw if parent directory does not exist', async () => {
      await expect(
        driver.writeFile('/nonexistent/file.txt', 'data')
      ).rejects.toThrow('Parent directory not found');
    });

    it('should overwrite existing file', async () => {
      await driver.mkdir('/dir');
      await driver.writeFile('/dir/file.txt', 'First');
      await driver.writeFile('/dir/file.txt', 'Second');

      const content = await driver.readFile('/dir/file.txt', { encoding: 'utf8' });
      expect(content).toBe('Second');
    });

    it('should update modification time', async () => {
      await driver.mkdir('/dir');
      await driver.writeFile('/dir/file.txt', 'data');

      const stat1 = await driver.stat('/dir/file.txt');
      await new Promise(resolve => setTimeout(resolve, 5));
      await driver.writeFile('/dir/file.txt', 'updated');
      const stat2 = await driver.stat('/dir/file.txt');

      expect(stat2.mtime).toBeGreaterThan(stat1.mtime);
    });
  });

  describe('readFile()', () => {
    beforeEach(async () => {
      await driver.mkdir('/dir');
      await driver.writeFile('/dir/test.txt', 'Test content');
    });

    it('should read file content as UTF-8', async () => {
      const content = await driver.readFile('/dir/test.txt', { encoding: 'utf8' });
      expect(content).toBe('Test content');
    });

    it('should read file content as binary', async () => {
      const content = await driver.readFile('/dir/test.txt');
      expect(content).toBeInstanceOf(Uint8Array);
    });

    it('should throw if file does not exist', async () => {
      await expect(
        driver.readFile('/dir/nonexistent.txt')
      ).rejects.toThrow('File not found');
    });

    it('should throw if path is a directory', async () => {
      await expect(
        driver.readFile('/dir')
      ).rejects.toThrow('Not a file');
    });
  });

  describe('readdir()', () => {
    it('should list directory contents', async () => {
      await driver.mkdir('/dir');
      await driver.mkdir('/dir/subdir');
      await driver.writeFile('/dir/file1.txt', 'data');
      await driver.writeFile('/dir/file2.txt', 'data');

      const entries = await driver.readdir('/dir');

      expect(entries).toHaveLength(3);
      const names = entries.map(e => e.name);
      expect(names).toContain('subdir');
      expect(names).toContain('file1.txt');
      expect(names).toContain('file2.txt');
    });

    it('should return empty array for empty directory', async () => {
      await driver.mkdir('/empty');
      const entries = await driver.readdir('/empty');

      expect(entries).toEqual([]);
    });

    it('should throw if directory does not exist', async () => {
      await expect(
        driver.readdir('/nonexistent')
      ).rejects.toThrow('Directory not found');
    });

    it('should throw if path is a file', async () => {
      await driver.mkdir('/dir');
      await driver.writeFile('/dir/file.txt', 'data');

      await expect(
        driver.readdir('/dir/file.txt')
      ).rejects.toThrow('Not a directory');
    });

    it('should include file metadata', async () => {
      await driver.mkdir('/dir');
      await driver.writeFile('/dir/file.txt', 'test data');

      const entries = await driver.readdir('/dir');
      const file = entries.find(e => e.name === 'file.txt');

      expect(file).toBeDefined();
      expect(file.type).toBe('file');
      expect(file.size).toBeGreaterThan(0);
      expect(file.mtime).toBeDefined();
    });
  });

  describe('rm()', () => {
    it('should remove file', async () => {
      await driver.mkdir('/dir');
      await driver.writeFile('/dir/file.txt', 'data');

      await driver.rm('/dir/file.txt');

      await expect(driver.stat('/dir/file.txt')).rejects.toThrow('Path not found');
    });

    it('should remove empty directory', async () => {
      await driver.mkdir('/dir');

      await driver.rm('/dir');

      await expect(driver.stat('/dir')).rejects.toThrow('Path not found');
    });

    it('should throw if directory is not empty without recursive', async () => {
      await driver.mkdir('/dir');
      await driver.writeFile('/dir/file.txt', 'data');

      await expect(
        driver.rm('/dir')
      ).rejects.toThrow('Directory not empty');
    });

    it('should remove directory recursively', async () => {
      await driver.mkdir('/dir');
      await driver.mkdir('/dir/subdir');
      await driver.writeFile('/dir/file.txt', 'data');
      await driver.writeFile('/dir/subdir/nested.txt', 'data');

      await driver.rm('/dir', { recursive: true });

      await expect(driver.stat('/dir')).rejects.toThrow('Path not found');
      await expect(driver.stat('/dir/subdir')).rejects.toThrow('Path not found');
    });

    it('should throw if path does not exist', async () => {
      await expect(
        driver.rm('/nonexistent')
      ).rejects.toThrow('Path not found');
    });
  });

  describe('stat()', () => {
    it('should return file stats', async () => {
      await driver.mkdir('/dir');
      await driver.writeFile('/dir/file.txt', 'test data');

      const stat = await driver.stat('/dir/file.txt');

      expect(stat.type).toBe('file');
      expect(stat.name).toBe('file.txt');
      expect(stat.size).toBeGreaterThan(0);
      expect(stat.mtime).toBeDefined();
      expect(stat.ctime).toBeDefined();
    });

    it('should return directory stats', async () => {
      await driver.mkdir('/testdir');

      const stat = await driver.stat('/testdir');

      expect(stat.type).toBe('directory');
      expect(stat.name).toBe('testdir');
      expect(stat.size).toBe(0);
    });

    it('should throw if path does not exist', async () => {
      await expect(
        driver.stat('/nonexistent')
      ).rejects.toThrow('Path not found');
    });
  });

  describe('rename()', () => {
    it('should rename file', async () => {
      await driver.mkdir('/dir');
      await driver.writeFile('/dir/old.txt', 'content');

      await driver.rename('/dir/old.txt', '/dir/new.txt');

      await expect(driver.stat('/dir/old.txt')).rejects.toThrow();
      const content = await driver.readFile('/dir/new.txt', { encoding: 'utf8' });
      expect(content).toBe('content');
    });

    it('should rename directory', async () => {
      await driver.mkdir('/olddir');
      await driver.writeFile('/olddir/file.txt', 'data');

      await driver.rename('/olddir', '/newdir');

      await expect(driver.stat('/olddir')).rejects.toThrow();
      const stat = await driver.stat('/newdir');
      expect(stat.type).toBe('directory');
    });

    it('should move file to different directory', async () => {
      await driver.mkdir('/dir1');
      await driver.mkdir('/dir2');
      await driver.writeFile('/dir1/file.txt', 'content');

      await driver.rename('/dir1/file.txt', '/dir2/file.txt');

      await expect(driver.stat('/dir1/file.txt')).rejects.toThrow();
      const content = await driver.readFile('/dir2/file.txt', { encoding: 'utf8' });
      expect(content).toBe('content');
    });

    it('should throw if source does not exist', async () => {
      await expect(
        driver.rename('/nonexistent', '/new')
      ).rejects.toThrow('Path not found');
    });

    it('should update modification time', async () => {
      await driver.mkdir('/dir');
      await driver.writeFile('/dir/file.txt', 'data');

      const stat1 = await driver.stat('/dir/file.txt');
      await new Promise(resolve => setTimeout(resolve, 5));
      await driver.rename('/dir/file.txt', '/dir/renamed.txt');
      const stat2 = await driver.stat('/dir/renamed.txt');

      expect(stat2.mtime).toBeGreaterThan(stat1.mtime);
    });
  });

  describe('Path helpers', () => {
    it('should extract parent path correctly', () => {
      expect(driver._getParentPath('/a/b/c')).toBe('/a/b');
      expect(driver._getParentPath('/a/b')).toBe('/a');
      expect(driver._getParentPath('/a')).toBe('/');
      expect(driver._getParentPath('/')).toBe(null);
    });

    it('should extract file name correctly', () => {
      expect(driver._getName('/a/b/file.txt')).toBe('file.txt');
      expect(driver._getName('/a/b')).toBe('b');
      expect(driver._getName('/file.txt')).toBe('file.txt');
      expect(driver._getName('/')).toBe('/');
    });
  });
});
