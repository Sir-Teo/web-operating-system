import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CloudStorageManager } from '../../src/cloud/CloudStorageManager.js';
import { MockCloudProvider } from '../../src/cloud/CloudProvider.js';

// Mock VFS
class MockVFS {
  constructor() {
    this.files = new Map();
    this.directories = new Set(['/']);
  }

  async readdir(path) {
    const cleanPath = path.endsWith('/') ? path : path + '/';
    const entries = [];

    for (const [filePath, data] of this.files) {
      if (filePath.startsWith(cleanPath)) {
        const relativePath = filePath.slice(cleanPath.length);
        if (!relativePath.includes('/')) {
          entries.push({ name: relativePath, type: 'file' });
        }
      }
    }

    return entries;
  }

  async readFile(path) {
    if (!this.files.has(path)) {
      throw new Error(`File not found: ${path}`);
    }
    return this.files.get(path);
  }

  async writeFile(path, data) {
    this.files.set(path, data);
  }

  async mkdir(path, options = {}) {
    const cleanPath = path.endsWith('/') ? path : path + '/';
    this.directories.add(cleanPath);
  }

  async stat(path) {
    if (this.files.has(path)) {
      const data = this.files.get(path);
      return {
        size: data.length,
        modified: Date.now(),
        type: 'file'
      };
    }
    throw new Error(`File not found: ${path}`);
  }
}

describe('CloudStorageManager', () => {
  let vfs;
  let manager;

  beforeEach(() => {
    vfs = new MockVFS();
    manager = new CloudStorageManager(vfs);
  });

  afterEach(async () => {
    await manager.disconnectAll();
  });

  describe('Initialization', () => {
    it('should create manager with VFS', () => {
      expect(manager.vfs).toBe(vfs);
      expect(manager.providers.size).toBe(0);
      expect(manager.mounts.size).toBe(0);
    });
  });

  describe('Provider Management', () => {
    it('should register a provider', () => {
      const provider = new MockCloudProvider();
      manager.registerProvider('test-provider', provider);

      expect(manager.providers.has('test-provider')).toBe(true);
      expect(manager.getProvider('test-provider')).toBe(provider);
    });

    it('should throw error when getting non-existent provider', () => {
      expect(() => manager.getProvider('nonexistent')).toThrow('Provider not found');
    });

    it('should connect to mock provider', async () => {
      const providerId = await manager.connect('mock', {});

      expect(manager.providers.has(providerId)).toBe(true);
      expect(providerId).toMatch(/^mock-\d+$/);

      const provider = manager.getProvider(providerId);
      expect(provider.isAuthenticated()).toBe(true);
    });

    it('should throw error for unknown provider type', async () => {
      await expect(manager.connect('unknown', {})).rejects.toThrow('Unknown provider type');
    });

    it('should disconnect from provider', async () => {
      const providerId = await manager.connect('mock', {});
      const provider = manager.getProvider(providerId);

      await manager.disconnect(providerId);

      expect(manager.providers.has(providerId)).toBe(false);
      expect(provider.isAuthenticated()).toBe(false);
    });

    it('should get all providers', async () => {
      await manager.connect('mock', {});
      await manager.connect('mock', {});

      const providers = manager.getProviders();
      expect(providers).toHaveLength(2);
      expect(providers[0]).toHaveProperty('id');
      expect(providers[0]).toHaveProperty('name');
      expect(providers[0]).toHaveProperty('authenticated');
    });

    it('should get provider info', async () => {
      const providerId = await manager.connect('mock', {});
      const info = manager.getProviderInfo(providerId);

      expect(info.name).toBe('Mock');
      expect(info.authenticated).toBe(true);
    });
  });

  describe('Mount Operations', () => {
    let providerId;

    beforeEach(async () => {
      providerId = await manager.connect('mock', {});
      const provider = manager.getProvider(providerId);
      await provider.createDirectory('/cloud/');
    });

    it('should mount cloud path to local path', async () => {
      const result = await manager.mount(providerId, '/cloud', '/mnt/cloud', {
        sync: false
      });

      expect(result.mountPoint).toBe('/mnt/cloud');
      expect(result.provider).toBe(providerId);
      expect(result.cloudPath).toBe('/cloud');
      expect(manager.isMounted('/mnt/cloud')).toBe(true);
    });

    it('should throw error when mounting with unauthenticated provider', async () => {
      const provider = new MockCloudProvider();
      await provider.init();
      manager.registerProvider('unauth', provider);

      await expect(
        manager.mount('unauth', '/cloud', '/mnt/cloud')
      ).rejects.toThrow('Provider not authenticated');
    });

    it('should throw error when mount point is already in use', async () => {
      await manager.mount(providerId, '/cloud', '/mnt/cloud', { sync: false });

      await expect(
        manager.mount(providerId, '/cloud', '/mnt/cloud', { sync: false })
      ).rejects.toThrow('Mount point already in use');
    });

    it('should unmount cloud path', async () => {
      await manager.mount(providerId, '/cloud', '/mnt/cloud', { sync: false });

      const result = await manager.unmount('/mnt/cloud');

      expect(result).toBe(true);
      expect(manager.isMounted('/mnt/cloud')).toBe(false);
    });

    it('should throw error when unmounting non-existent mount', async () => {
      await expect(manager.unmount('/nonexistent')).rejects.toThrow('No mount at');
    });

    it('should get all mounts', async () => {
      await manager.mount(providerId, '/cloud1', '/mnt/cloud1', { sync: false });
      await manager.mount(providerId, '/cloud2', '/mnt/cloud2', { sync: false });

      const mounts = manager.getMounts();
      expect(mounts).toHaveLength(2);
      expect(mounts[0]).toHaveProperty('mountPoint');
      expect(mounts[0]).toHaveProperty('providerId');
      expect(mounts[0]).toHaveProperty('cloudPath');
    });

    it('should get mount info', async () => {
      await manager.mount(providerId, '/cloud', '/mnt/cloud', { sync: false });

      const info = manager.getMountInfo('/mnt/cloud');
      expect(info).not.toBe(null);
      expect(info.cloudPath).toBe('/cloud');
      expect(info.providerId).toBe(providerId);
    });

    it('should return null for non-existent mount info', () => {
      const info = manager.getMountInfo('/nonexistent');
      expect(info).toBe(null);
    });

    it('should mount with sync enabled', async () => {
      const result = await manager.mount(providerId, '/cloud', '/mnt/cloud', {
        sync: true,
        watch: false,
        syncInterval: false
      });

      expect(result.syncing).toBe(true);
      expect(manager.syncEngines.has('/mnt/cloud')).toBe(true);
    });

    it('should stop sync when unmounting', async () => {
      await manager.mount(providerId, '/cloud', '/mnt/cloud', {
        sync: true,
        watch: false,
        syncInterval: false
      });

      expect(manager.syncEngines.has('/mnt/cloud')).toBe(true);

      await manager.unmount('/mnt/cloud');

      expect(manager.syncEngines.has('/mnt/cloud')).toBe(false);
    });
  });

  describe('File Operations', () => {
    let providerId;
    let provider;

    beforeEach(async () => {
      providerId = await manager.connect('mock', {});
      provider = manager.getProvider(providerId);
      await provider.createDirectory('/cloud/');
    });

    it('should upload file to cloud', async () => {
      vfs.files.set('/local/test.txt', new TextEncoder().encode('Test content'));

      const result = await manager.upload('/local/test.txt', providerId, '/cloud/test.txt');

      expect(result.localPath).toBe('/local/test.txt');
      expect(result.cloudPath).toBe('/cloud/test.txt');
      expect(result.size).toBeGreaterThan(0);

      const cloudData = await provider.readFile('/cloud/test.txt');
      expect(new TextDecoder().decode(cloudData)).toBe('Test content');
    });

    it('should upload file to directory', async () => {
      vfs.files.set('/local/test.txt', new TextEncoder().encode('Test content'));

      const result = await manager.upload('/local/test.txt', providerId, '/cloud/');

      expect(result.cloudPath).toBe('/cloud/test.txt');
    });

    it('should download file from cloud', async () => {
      await provider.writeFile('/cloud/test.txt', new TextEncoder().encode('Cloud content'));

      const result = await manager.download(providerId, '/cloud/test.txt', '/local/test.txt');

      expect(result.cloudPath).toBe('/cloud/test.txt');
      expect(result.localPath).toBe('/local/test.txt');
      expect(result.size).toBeGreaterThan(0);

      const localData = await vfs.readFile('/local/test.txt');
      expect(new TextDecoder().decode(localData)).toBe('Cloud content');
    });

    it('should list cloud files', async () => {
      await provider.writeFile('/cloud/file1.txt', new TextEncoder().encode('File 1'));
      await provider.writeFile('/cloud/file2.txt', new TextEncoder().encode('File 2'));

      const files = await manager.list(providerId, '/cloud');

      expect(files).toHaveLength(2);
      expect(files[0].name).toBe('file1.txt');
      expect(files[1].name).toBe('file2.txt');
    });

    it('should create cloud directory', async () => {
      await manager.createDirectory(providerId, '/cloud/newdir');

      expect(provider.directories.has('/cloud/newdir/')).toBe(true);
    });

    it('should delete cloud file', async () => {
      await provider.writeFile('/cloud/delete-me.txt', new TextEncoder().encode('Delete me'));

      await manager.deleteFile(providerId, '/cloud/delete-me.txt');

      await expect(provider.readFile('/cloud/delete-me.txt')).rejects.toThrow('File not found');
    });

    it('should get cloud quota', async () => {
      await provider.writeFile('/cloud/test.txt', new TextEncoder().encode('Test'));

      const quota = await manager.getQuota(providerId);

      expect(quota).toHaveProperty('used');
      expect(quota).toHaveProperty('total');
      expect(quota).toHaveProperty('available');
    });
  });

  describe('Sync Operations', () => {
    let providerId;
    let provider;

    beforeEach(async () => {
      providerId = await manager.connect('mock', {});
      provider = manager.getProvider(providerId);
      await provider.createDirectory('/cloud/');
      await vfs.mkdir('/local', { recursive: true });
    });

    it('should sync local and cloud directories', async () => {
      vfs.files.set('/local/local-file.txt', new TextEncoder().encode('Local'));
      await provider.writeFile('/cloud/cloud-file.txt', new TextEncoder().encode('Cloud'));

      const result = await manager.sync('/local', providerId, '/cloud', {
        conflictStrategy: 'keep-both'
      });

      expect(result.uploaded).toBe(1);
      expect(result.downloaded).toBe(1);

      // Verify files are synced
      const cloudData = await provider.readFile('/cloud/local-file.txt');
      const localData = await vfs.readFile('/local/cloud-file.txt');

      expect(new TextDecoder().decode(cloudData)).toBe('Local');
      expect(new TextDecoder().decode(localData)).toBe('Cloud');
    });

    it('should get sync status for mount', async () => {
      await manager.mount(providerId, '/cloud', '/mnt/cloud', {
        sync: true,
        watch: false,
        syncInterval: false
      });

      const status = manager.getSyncStatus('/mnt/cloud');

      expect(status).not.toBe(null);
      expect(status).toHaveProperty('syncing');
      expect(status).toHaveProperty('activeSyncs');
      expect(status).toHaveProperty('conflictStrategy');
    });

    it('should return null for non-syncing mount', () => {
      const status = manager.getSyncStatus('/nonexistent');
      expect(status).toBe(null);
    });
  });

  describe('Status', () => {
    it('should get overall status', async () => {
      const providerId = await manager.connect('mock', {});
      const provider = manager.getProvider(providerId);
      await provider.createDirectory('/cloud/');

      await manager.mount(providerId, '/cloud', '/mnt/cloud', { sync: false });

      const status = manager.getStatus();

      expect(status.providers).toBe(1);
      expect(status.mounts).toBe(1);
      expect(status.providerList).toHaveLength(1);
      expect(status.mountList).toHaveLength(1);
    });
  });

  describe('Disconnect All', () => {
    it('should disconnect all providers and stop all syncs', async () => {
      const provider1 = await manager.connect('mock', {});
      const provider2 = await manager.connect('mock', {});

      const p1 = manager.getProvider(provider1);
      const p2 = manager.getProvider(provider2);
      await p1.createDirectory('/cloud1/');
      await p2.createDirectory('/cloud2/');

      await manager.mount(provider1, '/cloud1', '/mnt/cloud1', { sync: false });
      await manager.mount(provider2, '/cloud2', '/mnt/cloud2', { sync: false });

      expect(manager.providers.size).toBe(2);
      expect(manager.mounts.size).toBe(2);

      await manager.disconnectAll();

      expect(manager.providers.size).toBe(0);
      expect(manager.mounts.size).toBe(0);
      expect(manager.syncEngines.size).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when uploading with unauthenticated provider', async () => {
      const provider = new MockCloudProvider();
      await provider.init();
      manager.registerProvider('unauth', provider);

      vfs.files.set('/local/test.txt', new TextEncoder().encode('Test'));

      await expect(
        manager.upload('/local/test.txt', 'unauth', '/cloud/test.txt')
      ).rejects.toThrow('Provider not authenticated');
    });

    it('should throw error when downloading with unauthenticated provider', async () => {
      const provider = new MockCloudProvider();
      await provider.init();
      manager.registerProvider('unauth', provider);

      await expect(
        manager.download('unauth', '/cloud/test.txt', '/local/test.txt')
      ).rejects.toThrow('Provider not authenticated');
    });

    it('should throw error when listing with unauthenticated provider', async () => {
      const provider = new MockCloudProvider();
      await provider.init();
      manager.registerProvider('unauth', provider);

      await expect(
        manager.list('unauth', '/cloud')
      ).rejects.toThrow('Provider not authenticated');
    });

    it('should throw error when syncing with unauthenticated provider', async () => {
      const provider = new MockCloudProvider();
      await provider.init();
      manager.registerProvider('unauth', provider);

      await expect(
        manager.sync('/local', 'unauth', '/cloud')
      ).rejects.toThrow('Provider not authenticated');
    });
  });

  describe('Provider Lifecycle', () => {
    it('should disconnect provider and remove all mounts', async () => {
      const providerId = await manager.connect('mock', {});
      const provider = manager.getProvider(providerId);
      await provider.createDirectory('/cloud1/');
      await provider.createDirectory('/cloud2/');

      await manager.mount(providerId, '/cloud1', '/mnt/cloud1', { sync: false });
      await manager.mount(providerId, '/cloud2', '/mnt/cloud2', { sync: false });

      expect(manager.mounts.size).toBe(2);

      await manager.disconnect(providerId);

      expect(manager.mounts.size).toBe(0);
      expect(manager.providers.has(providerId)).toBe(false);
    });
  });
});
