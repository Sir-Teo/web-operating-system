import { describe, it, expect, beforeEach } from 'vitest';
import { CloudProvider, WebDAVProvider, MockCloudProvider } from '../../src/cloud/CloudProvider.js';

describe('CloudProvider', () => {
  describe('Base CloudProvider', () => {
    let provider;

    beforeEach(() => {
      provider = new CloudProvider({ name: 'Test Provider' });
    });

    it('should create a provider with default config', () => {
      expect(provider.name).toBe('Test Provider');
      expect(provider.authenticated).toBe(false);
    });

    it('should throw error for unimplemented init()', async () => {
      await expect(provider.init()).rejects.toThrow('init() must be implemented');
    });

    it('should throw error for unimplemented authenticate()', async () => {
      await expect(provider.authenticate()).rejects.toThrow('authenticate() must be implemented');
    });

    it('should throw error for unimplemented listFiles()', async () => {
      await expect(provider.listFiles('/')).rejects.toThrow('listFiles() must be implemented');
    });

    it('should throw error for unimplemented readFile()', async () => {
      await expect(provider.readFile('/test')).rejects.toThrow('readFile() must be implemented');
    });

    it('should throw error for unimplemented writeFile()', async () => {
      await expect(provider.writeFile('/test', new Uint8Array())).rejects.toThrow('writeFile() must be implemented');
    });

    it('should throw error for unimplemented deleteFile()', async () => {
      await expect(provider.deleteFile('/test')).rejects.toThrow('deleteFile() must be implemented');
    });

    it('should throw error for unimplemented createDirectory()', async () => {
      await expect(provider.createDirectory('/test')).rejects.toThrow('createDirectory() must be implemented');
    });

    it('should throw error for unimplemented getMetadata()', async () => {
      await expect(provider.getMetadata('/test')).rejects.toThrow('getMetadata() must be implemented');
    });

    it('should throw error for unimplemented getQuota()', async () => {
      await expect(provider.getQuota()).rejects.toThrow('getQuota() must be implemented');
    });

    it('should throw error for unimplemented rename()', async () => {
      await expect(provider.rename('/old', '/new')).rejects.toThrow('rename() must be implemented');
    });

    it('should throw error for unimplemented copy()', async () => {
      await expect(provider.copy('/src', '/dest')).rejects.toThrow('copy() must be implemented');
    });

    it('should check authentication status', () => {
      expect(provider.isAuthenticated()).toBe(false);
      provider.authenticated = true;
      expect(provider.isAuthenticated()).toBe(true);
    });

    it('should disconnect and set authenticated to false', async () => {
      provider.authenticated = true;
      await provider.disconnect();
      expect(provider.authenticated).toBe(false);
    });

    it('should get provider info', () => {
      const info = provider.getInfo();
      expect(info).toEqual({
        name: 'Test Provider',
        authenticated: false,
        quota: { used: 0, total: 0 }
      });
    });
  });

  describe('MockCloudProvider', () => {
    let provider;

    beforeEach(async () => {
      provider = new MockCloudProvider();
      await provider.init();
      await provider.authenticate();
    });

    it('should initialize successfully', async () => {
      const newProvider = new MockCloudProvider();
      const result = await newProvider.init();
      expect(result).toBe(true);
    });

    it('should authenticate successfully', async () => {
      const newProvider = new MockCloudProvider();
      await newProvider.init();
      const authenticated = await newProvider.authenticate();
      expect(authenticated).toBe(true);
      expect(newProvider.isAuthenticated()).toBe(true);
    });

    it('should throw error when not authenticated', async () => {
      const newProvider = new MockCloudProvider();
      await newProvider.init();
      await expect(newProvider.listFiles('/')).rejects.toThrow('Not authenticated');
    });

    it('should write and read a file', async () => {
      const data = new TextEncoder().encode('Hello, World!');
      await provider.writeFile('/test.txt', data);

      const readData = await provider.readFile('/test.txt');
      expect(readData).toEqual(data);
    });

    it('should throw error when reading non-existent file', async () => {
      await expect(provider.readFile('/nonexistent.txt')).rejects.toThrow('File not found');
    });

    it('should delete a file', async () => {
      const data = new TextEncoder().encode('Test');
      await provider.writeFile('/delete-me.txt', data);

      await provider.deleteFile('/delete-me.txt');

      await expect(provider.readFile('/delete-me.txt')).rejects.toThrow('File not found');
    });

    it('should throw error when deleting non-existent file', async () => {
      await expect(provider.deleteFile('/nonexistent.txt')).rejects.toThrow('File not found');
    });

    it('should create a directory', async () => {
      await provider.createDirectory('/test-dir/');
      expect(provider.directories.has('/test-dir/')).toBe(true);
    });

    it('should list files in root directory', async () => {
      const files = await provider.listFiles('/');
      expect(Array.isArray(files)).toBe(true);
    });

    it('should list files and directories', async () => {
      await provider.createDirectory('/docs/');
      await provider.writeFile('/docs/file1.txt', new TextEncoder().encode('Content 1'));
      await provider.writeFile('/docs/file2.txt', new TextEncoder().encode('Content 2'));

      const files = await provider.listFiles('/docs/');
      expect(files).toHaveLength(2);
      expect(files[0].name).toBe('file1.txt');
      expect(files[1].name).toBe('file2.txt');
    });

    it('should get file metadata', async () => {
      const data = new TextEncoder().encode('Metadata test');
      await provider.writeFile('/metadata.txt', data);

      const metadata = await provider.getMetadata('/metadata.txt');
      expect(metadata.name).toBe('metadata.txt');
      expect(metadata.type).toBe('file');
      expect(metadata.size).toBe(data.length);
    });

    it('should get directory metadata', async () => {
      await provider.createDirectory('/test-dir/');

      const metadata = await provider.getMetadata('/test-dir/');
      expect(metadata.type).toBe('directory');
      expect(metadata.size).toBe(0);
    });

    it('should throw error when getting metadata for non-existent file', async () => {
      await expect(provider.getMetadata('/nonexistent')).rejects.toThrow('File not found');
    });

    it('should get quota information', async () => {
      const data = new TextEncoder().encode('Test data for quota');
      await provider.writeFile('/quota-test.txt', data);

      const quota = await provider.getQuota();
      expect(quota.used).toBeGreaterThan(0);
      expect(quota.total).toBeGreaterThan(0);
      expect(quota.available).toBeGreaterThan(0);
    });

    it('should rename a file', async () => {
      const data = new TextEncoder().encode('Rename test');
      await provider.writeFile('/old-name.txt', data);

      await provider.rename('/old-name.txt', '/new-name.txt');

      const newData = await provider.readFile('/new-name.txt');
      expect(newData).toEqual(data);

      await expect(provider.readFile('/old-name.txt')).rejects.toThrow('File not found');
    });

    it('should throw error when renaming non-existent file', async () => {
      await expect(provider.rename('/nonexistent.txt', '/new.txt')).rejects.toThrow('File not found');
    });

    it('should copy a file', async () => {
      const data = new TextEncoder().encode('Copy test');
      await provider.writeFile('/original.txt', data);

      await provider.copy('/original.txt', '/copy.txt');

      const originalData = await provider.readFile('/original.txt');
      const copiedData = await provider.readFile('/copy.txt');

      expect(copiedData).toEqual(originalData);
      expect(copiedData).toEqual(data);
    });

    it('should throw error when copying non-existent file', async () => {
      await expect(provider.copy('/nonexistent.txt', '/copy.txt')).rejects.toThrow('File not found');
    });

    it('should handle nested directories', async () => {
      await provider.createDirectory('/level1/');
      await provider.createDirectory('/level1/level2/');
      await provider.writeFile('/level1/level2/file.txt', new TextEncoder().encode('Nested'));

      const data = await provider.readFile('/level1/level2/file.txt');
      expect(new TextDecoder().decode(data)).toBe('Nested');
    });

    it('should throw error when writing to non-existent parent directory', async () => {
      await expect(
        provider.writeFile('/nonexistent/file.txt', new TextEncoder().encode('Test'))
      ).rejects.toThrow('Parent directory does not exist');
    });
  });

  describe('WebDAVProvider', () => {
    let provider;

    beforeEach(() => {
      provider = new WebDAVProvider({
        baseUrl: 'https://dav.example.com',
        username: 'user',
        password: 'pass'
      });
    });

    it('should create a WebDAV provider with config', () => {
      expect(provider.name).toBe('WebDAV');
      expect(provider.baseUrl).toBe('https://dav.example.com');
      expect(provider.username).toBe('user');
      expect(provider.password).toBe('pass');
    });

    it('should initialize successfully', async () => {
      const result = await provider.init();
      expect(result).toBe(true);
    });

    it('should build URL correctly', () => {
      expect(provider.buildUrl('/path/to/file')).toBe('https://dav.example.com/path/to/file');
      expect(provider.buildUrl('path/to/file')).toBe('https://dav.example.com/path/to/file');
    });

    it('should generate auth header', () => {
      const header = provider.getAuthHeader();
      expect(header).toMatch(/^Basic /);
      expect(header).toBe('Basic ' + btoa('user:pass'));
    });

    it('should throw error when operations are called without authentication', async () => {
      await expect(provider.listFiles('/')).rejects.toThrow('Not authenticated');
      await expect(provider.readFile('/test')).rejects.toThrow('Not authenticated');
      await expect(provider.writeFile('/test', new Uint8Array())).rejects.toThrow('Not authenticated');
    });

    it('should parse WebDAV XML response', () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>/test.txt</D:href>
    <D:propstat>
      <D:prop>
        <D:getcontentlength>1024</D:getcontentlength>
        <D:getlastmodified>Mon, 01 Jan 2024 00:00:00 GMT</D:getlastmodified>
        <D:getcontenttype>text/plain</D:getcontenttype>
        <D:resourcetype></D:resourcetype>
      </D:prop>
    </D:propstat>
  </D:response>
</D:multistatus>`;

      const files = provider.parseWebDAVResponse(xml);
      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('test.txt');
      expect(files[0].size).toBe(1024);
      expect(files[0].type).toBe('file');
    });

    it('should parse WebDAV XML response for directories', () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>/documents/</D:href>
    <D:propstat>
      <D:prop>
        <D:getcontentlength>0</D:getcontentlength>
        <D:getlastmodified>Mon, 01 Jan 2024 00:00:00 GMT</D:getlastmodified>
        <D:resourcetype><D:collection/></D:resourcetype>
      </D:prop>
    </D:propstat>
  </D:response>
</D:multistatus>`;

      const files = provider.parseWebDAVResponse(xml);
      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('documents');
      expect(files[0].type).toBe('directory');
    });

    it('should get quota information', async () => {
      const quota = await provider.getQuota();
      expect(quota).toEqual({ used: 0, total: 0, available: 0 });
    });
  });
});
