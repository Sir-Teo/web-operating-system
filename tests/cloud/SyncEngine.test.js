import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SyncEngine } from '../../src/cloud/SyncEngine.js';
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

    // Add directories
    for (const dir of this.directories) {
      if (dir.startsWith(cleanPath) && dir !== cleanPath) {
        const relativePath = dir.slice(cleanPath.length);
        if (!relativePath.includes('/') || relativePath.indexOf('/') === relativePath.length - 1) {
          const name = relativePath.replace(/\/$/, '');
          if (name) {
            entries.push({ name, type: 'directory' });
          }
        }
      }
    }

    // Add files
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
    const cleanPath = path.endsWith('/') ? path : path + '/';
    if (this.directories.has(cleanPath)) {
      return {
        size: 0,
        modified: Date.now(),
        type: 'directory'
      };
    }
    throw new Error(`File not found: ${path}`);
  }
}

describe('SyncEngine', () => {
  let vfs;
  let cloud;
  let syncEngine;

  beforeEach(async () => {
    vfs = new MockVFS();
    cloud = new MockCloudProvider();
    await cloud.init();
    await cloud.authenticate();
    syncEngine = new SyncEngine(vfs, cloud);
  });

  afterEach(async () => {
    await syncEngine.stopAll();
  });

  describe('Initialization', () => {
    it('should create sync engine with VFS and cloud provider', () => {
      expect(syncEngine.vfs).toBe(vfs);
      expect(syncEngine.cloud).toBe(cloud);
      expect(syncEngine.syncing).toBe(false);
      expect(syncEngine.syncPairs.size).toBe(0);
    });

    it('should set default conflict strategy', () => {
      expect(syncEngine.conflictStrategy).toBe('keep-both');
    });

    it('should track online status', () => {
      expect(syncEngine.isOnline).toBe(navigator.onLine);
    });
  });

  describe('Conflict Strategy', () => {
    it('should set conflict strategy', () => {
      syncEngine.setConflictStrategy('local-wins');
      expect(syncEngine.conflictStrategy).toBe('local-wins');
    });

    it('should accept valid strategies', () => {
      const strategies = ['keep-both', 'local-wins', 'cloud-wins', 'newest-wins'];
      strategies.forEach(strategy => {
        expect(() => syncEngine.setConflictStrategy(strategy)).not.toThrow();
        expect(syncEngine.conflictStrategy).toBe(strategy);
      });
    });

    it('should throw error for invalid strategy', () => {
      expect(() => syncEngine.setConflictStrategy('invalid')).toThrow('Invalid strategy');
    });
  });

  describe('File Operations', () => {
    it('should get local files', async () => {
      vfs.files.set('/local/file1.txt', new TextEncoder().encode('Test 1'));
      vfs.files.set('/local/file2.txt', new TextEncoder().encode('Test 2'));
      vfs.directories.add('/local/');

      const files = await syncEngine.getLocalFiles('/local');
      expect(files).toHaveLength(2);
      expect(files[0].name).toBe('file1.txt');
      expect(files[1].name).toBe('file2.txt');
    });

    it('should get cloud files', async () => {
      await cloud.createDirectory('/cloud/');
      await cloud.writeFile('/cloud/file1.txt', new TextEncoder().encode('Test 1'));
      await cloud.writeFile('/cloud/file2.txt', new TextEncoder().encode('Test 2'));

      const files = await syncEngine.getCloudFiles('/cloud');
      expect(files).toHaveLength(2);
    });

    it('should upload file to cloud', async () => {
      vfs.files.set('/local/upload.txt', new TextEncoder().encode('Upload me'));
      await cloud.createDirectory('/cloud/');

      await syncEngine.uploadFile('/local', '/cloud', 'upload.txt', {
        name: 'upload.txt',
        path: '/local/upload.txt',
        type: 'file'
      });

      const cloudData = await cloud.readFile('/cloud/upload.txt');
      expect(new TextDecoder().decode(cloudData)).toBe('Upload me');
    });

    it('should download file from cloud', async () => {
      await cloud.createDirectory('/cloud/');
      await cloud.writeFile('/cloud/download.txt', new TextEncoder().encode('Download me'));
      await vfs.mkdir('/local', { recursive: true });

      await syncEngine.downloadFile('/local', '/cloud', 'download.txt', {
        name: 'download.txt',
        path: '/cloud/download.txt',
        type: 'file'
      });

      const localData = await vfs.readFile('/local/download.txt');
      expect(new TextDecoder().decode(localData)).toBe('Download me');
    });
  });

  describe('Directory Management', () => {
    it('should ensure cloud directory exists', async () => {
      await syncEngine.ensureCloudDirectory('/test/nested/path');
      expect(cloud.directories.has('/test/nested/path/')).toBe(true);
    });

    it('should ensure local directory exists', async () => {
      await syncEngine.ensureLocalDirectory('/test/nested/path');
      expect(vfs.directories.has('/test/nested/path/')).toBe(true);
    });

    it('should handle root directory', async () => {
      await expect(syncEngine.ensureCloudDirectory('/')).resolves.not.toThrow();
      await expect(syncEngine.ensureLocalDirectory('/')).resolves.not.toThrow();
    });
  });

  describe('Full Sync', () => {
    it('should sync files from local to cloud', async () => {
      await vfs.mkdir('/local', { recursive: true });
      vfs.files.set('/local/file1.txt', new TextEncoder().encode('Local file 1'));
      vfs.files.set('/local/file2.txt', new TextEncoder().encode('Local file 2'));
      await cloud.createDirectory('/cloud/');

      const result = await syncEngine.fullSync('/local', '/cloud');

      expect(result.uploaded).toBe(2);
      expect(result.downloaded).toBe(0);
      expect(result.conflicts).toBe(0);

      const cloudData1 = await cloud.readFile('/cloud/file1.txt');
      const cloudData2 = await cloud.readFile('/cloud/file2.txt');
      expect(new TextDecoder().decode(cloudData1)).toBe('Local file 1');
      expect(new TextDecoder().decode(cloudData2)).toBe('Local file 2');
    });

    it('should sync files from cloud to local', async () => {
      await cloud.createDirectory('/cloud/');
      await cloud.writeFile('/cloud/file1.txt', new TextEncoder().encode('Cloud file 1'));
      await cloud.writeFile('/cloud/file2.txt', new TextEncoder().encode('Cloud file 2'));
      await vfs.mkdir('/local', { recursive: true });

      const result = await syncEngine.fullSync('/local', '/cloud');

      expect(result.uploaded).toBe(0);
      expect(result.downloaded).toBe(2);
      expect(result.conflicts).toBe(0);

      const localData1 = await vfs.readFile('/local/file1.txt');
      const localData2 = await vfs.readFile('/local/file2.txt');
      expect(new TextDecoder().decode(localData1)).toBe('Cloud file 1');
      expect(new TextDecoder().decode(localData2)).toBe('Cloud file 2');
    });

    it('should handle bidirectional sync', async () => {
      await vfs.mkdir('/local', { recursive: true });
      vfs.files.set('/local/local-only.txt', new TextEncoder().encode('Local only'));

      await cloud.createDirectory('/cloud/');
      await cloud.writeFile('/cloud/cloud-only.txt', new TextEncoder().encode('Cloud only'));

      const result = await syncEngine.fullSync('/local', '/cloud');

      expect(result.uploaded).toBe(1);
      expect(result.downloaded).toBe(1);

      // Check both files exist in both places
      const cloudData = await cloud.readFile('/cloud/local-only.txt');
      const localData = await vfs.readFile('/local/cloud-only.txt');
      expect(new TextDecoder().decode(cloudData)).toBe('Local only');
      expect(new TextDecoder().decode(localData)).toBe('Cloud only');
    });
  });

  describe('Conflict Resolution', () => {
    it('should detect conflicts', async () => {
      await vfs.mkdir('/local', { recursive: true });
      vfs.files.set('/local/conflict.txt', new TextEncoder().encode('Local version'));

      await cloud.createDirectory('/cloud/');
      await cloud.writeFile('/cloud/conflict.txt', new TextEncoder().encode('Cloud version'));

      // Ensure different modification times
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await syncEngine.fullSync('/local', '/cloud');

      // With keep-both strategy, we expect conflict resolution
      expect(result.conflicts).toBeGreaterThan(0);
    });

    it('should resolve conflicts with keep-both strategy', async () => {
      syncEngine.setConflictStrategy('keep-both');

      await vfs.mkdir('/local', { recursive: true });
      vfs.files.set('/local/conflict.txt', new TextEncoder().encode('Local version'));

      await cloud.createDirectory('/cloud/');
      await cloud.writeFile('/cloud/conflict.txt', new TextEncoder().encode('Cloud version'));

      await syncEngine.resolveConflict('/local', '/cloud', {
        relativePath: 'conflict.txt',
        localFile: { path: '/local/conflict.txt', modified: Date.now() },
        cloudFile: { path: '/cloud/conflict.txt', modified: new Date() }
      });

      // Check that both versions exist locally
      const files = Array.from(vfs.files.keys());
      const conflictFiles = files.filter(f => f.includes('conflict'));
      expect(conflictFiles.length).toBeGreaterThan(1);
    });

    it('should resolve conflicts with local-wins strategy', async () => {
      syncEngine.setConflictStrategy('local-wins');

      await vfs.mkdir('/local', { recursive: true });
      vfs.files.set('/local/conflict.txt', new TextEncoder().encode('Local version'));

      await cloud.createDirectory('/cloud/');
      await cloud.writeFile('/cloud/conflict.txt', new TextEncoder().encode('Cloud version'));

      await syncEngine.resolveConflict('/local', '/cloud', {
        relativePath: 'conflict.txt',
        localFile: { path: '/local/conflict.txt', modified: Date.now() },
        cloudFile: { path: '/cloud/conflict.txt', modified: new Date() }
      });

      const cloudData = await cloud.readFile('/cloud/conflict.txt');
      expect(new TextDecoder().decode(cloudData)).toBe('Local version');
    });

    it('should resolve conflicts with cloud-wins strategy', async () => {
      syncEngine.setConflictStrategy('cloud-wins');

      await vfs.mkdir('/local', { recursive: true });
      vfs.files.set('/local/conflict.txt', new TextEncoder().encode('Local version'));

      await cloud.createDirectory('/cloud/');
      await cloud.writeFile('/cloud/conflict.txt', new TextEncoder().encode('Cloud version'));

      await syncEngine.resolveConflict('/local', '/cloud', {
        relativePath: 'conflict.txt',
        localFile: { path: '/local/conflict.txt', modified: Date.now() - 10000 },
        cloudFile: { path: '/cloud/conflict.txt', modified: new Date() }
      });

      const localData = await vfs.readFile('/local/conflict.txt');
      expect(new TextDecoder().decode(localData)).toBe('Cloud version');
    });

    it('should resolve conflicts with newest-wins strategy', async () => {
      syncEngine.setConflictStrategy('newest-wins');

      const now = Date.now();
      await vfs.mkdir('/local', { recursive: true });
      vfs.files.set('/local/conflict.txt', new TextEncoder().encode('Newer local version'));

      await cloud.createDirectory('/cloud/');
      await cloud.writeFile('/cloud/conflict.txt', new TextEncoder().encode('Older cloud version'));

      await syncEngine.resolveConflict('/local', '/cloud', {
        relativePath: 'conflict.txt',
        localFile: { path: '/local/conflict.txt', modified: now },
        cloudFile: { path: '/cloud/conflict.txt', modified: new Date(now - 10000) }
      });

      const cloudData = await cloud.readFile('/cloud/conflict.txt');
      expect(new TextDecoder().decode(cloudData)).toBe('Newer local version');
    });
  });

  describe('Sync Pairs Management', () => {
    it('should start sync and create sync pair', async () => {
      await vfs.mkdir('/local', { recursive: true });
      await cloud.createDirectory('/cloud/');

      const syncId = await syncEngine.startSync('/local', '/cloud', {
        watch: false,
        interval: false
      });

      expect(syncEngine.syncPairs.has(syncId)).toBe(true);
      const syncPair = syncEngine.syncPairs.get(syncId);
      expect(syncPair.localPath).toBe('/local');
      expect(syncPair.cloudPath).toBe('/cloud');
      expect(syncPair.status).toBe('active');
    });

    it('should stop sync and remove sync pair', async () => {
      await vfs.mkdir('/local', { recursive: true });
      await cloud.createDirectory('/cloud/');

      const syncId = await syncEngine.startSync('/local', '/cloud', {
        watch: false,
        interval: false
      });

      await syncEngine.stopSync(syncId);

      expect(syncEngine.syncPairs.has(syncId)).toBe(false);
    });

    it('should throw error when stopping non-existent sync', async () => {
      await expect(syncEngine.stopSync('nonexistent')).rejects.toThrow('Sync pair not found');
    });

    it('should throw error when starting sync with unauthenticated provider', async () => {
      const unauthCloud = new MockCloudProvider();
      await unauthCloud.init();
      const unauthEngine = new SyncEngine(vfs, unauthCloud);

      await expect(
        unauthEngine.startSync('/local', '/cloud')
      ).rejects.toThrow('Cloud provider not authenticated');
    });
  });

  describe('Offline Queue', () => {
    it('should queue uploads when offline', async () => {
      syncEngine.isOnline = false;

      await vfs.mkdir('/local', { recursive: true });
      vfs.files.set('/local/offline.txt', new TextEncoder().encode('Offline file'));

      await syncEngine.uploadFile('/local', '/cloud', 'offline.txt', {
        name: 'offline.txt',
        path: '/local/offline.txt',
        type: 'file'
      });

      expect(syncEngine.offlineQueue.length).toBe(1);
      expect(syncEngine.offlineQueue[0].operation).toBe('upload');
      expect(syncEngine.offlineQueue[0].relativePath).toBe('offline.txt');
    });

    it('should process offline queue when coming online', async () => {
      syncEngine.isOnline = false;

      await vfs.mkdir('/local', { recursive: true });
      vfs.files.set('/local/offline.txt', new TextEncoder().encode('Offline file'));
      await cloud.createDirectory('/cloud/');

      await syncEngine.uploadFile('/local', '/cloud', 'offline.txt', {
        name: 'offline.txt',
        path: '/local/offline.txt',
        type: 'file'
      });

      expect(syncEngine.offlineQueue.length).toBe(1);

      // Come back online
      syncEngine.isOnline = true;
      await syncEngine.processOfflineQueue();

      expect(syncEngine.offlineQueue.length).toBe(0);

      // Check file was uploaded
      const cloudData = await cloud.readFile('/cloud/offline.txt');
      expect(new TextDecoder().decode(cloudData)).toBe('Offline file');
    });
  });

  describe('Status', () => {
    it('should get sync status', () => {
      const status = syncEngine.getStatus();

      expect(status).toHaveProperty('syncing');
      expect(status).toHaveProperty('activeSyncs');
      expect(status).toHaveProperty('offlineQueue');
      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('conflictStrategy');
      expect(status).toHaveProperty('syncPairs');
    });

    it('should reflect active syncs in status', async () => {
      await vfs.mkdir('/local', { recursive: true });
      await cloud.createDirectory('/cloud/');

      await syncEngine.startSync('/local', '/cloud', {
        watch: false,
        interval: false
      });

      const status = syncEngine.getStatus();
      expect(status.activeSyncs).toBe(1);
      expect(status.syncPairs).toHaveLength(1);
    });
  });

  describe('Stop All', () => {
    it('should stop all syncs and clear state', async () => {
      await vfs.mkdir('/local1', { recursive: true });
      await vfs.mkdir('/local2', { recursive: true });
      await cloud.createDirectory('/cloud1/');
      await cloud.createDirectory('/cloud2/');

      await syncEngine.startSync('/local1', '/cloud1', {
        watch: false,
        interval: false
      });
      await syncEngine.startSync('/local2', '/cloud2', {
        watch: false,
        interval: false
      });

      expect(syncEngine.syncPairs.size).toBe(2);

      await syncEngine.stopAll();

      expect(syncEngine.syncPairs.size).toBe(0);
      expect(syncEngine.watching.size).toBe(0);
      expect(syncEngine.syncInterval).toBe(null);
    });
  });

  describe('Conflict Path Generation', () => {
    it('should generate conflict path with timestamp', () => {
      const original = '/path/to/file.txt';
      const conflictPath = syncEngine.getConflictPath(original);

      expect(conflictPath).toMatch(/\/path\/to\/file\.conflict\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
      expect(conflictPath).toContain('.txt');
    });

    it('should handle files without extension', () => {
      const original = '/path/to/README';
      const conflictPath = syncEngine.getConflictPath(original);

      expect(conflictPath).toContain('README.conflict.');
    });
  });
});
