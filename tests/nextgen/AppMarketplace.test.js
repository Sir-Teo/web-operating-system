import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppMarketplace } from '../../src/marketplace/AppMarketplace.js';

describe('AppMarketplace', () => {
  let marketplace;
  let mockKernel;

  beforeEach(() => {
    mockKernel = {
      vfs: {
        readFile: vi.fn(),
        writeFile: vi.fn(),
        mkdir: vi.fn(),
        deleteDir: vi.fn()
      }
    };

    marketplace = new AppMarketplace(mockKernel);
  });

  describe('App Publishing', () => {
    it('should publish an app', async () => {
      const appPackage = {
        name: 'Test App',
        version: '1.0.0',
        description: 'A test application',
        category: 'Utilities',
        author: 'Test Author',
        icon: '📦',
        package: {}
      };

      const app = await marketplace.publishApp(appPackage);

      expect(app.name).toBe('Test App');
      expect(marketplace.apps.has(app.id)).toBe(true);
    });
  });

  describe('App Installation', () => {
    it('should install an app', async () => {
      const app = await marketplace.publishApp({
        name: 'Installer Test',
        version: '1.0.0',
        description: 'Test',
        category: 'Utilities',
        author: 'Test',
        package: {}
      });

      mockKernel.vfs.mkdir.mockResolvedValue(true);

      const result = await marketplace.installApp(app.id);

      expect(result.success).toBe(true);
      expect(marketplace.installed.has(app.id)).toBe(true);
      expect(app.downloads).toBe(1);
    });

    it('should uninstall an app', async () => {
      const app = await marketplace.publishApp({
        name: 'Uninstall Test',
        version: '1.0.0',
        description: 'Test',
        category: 'Utilities',
        author: 'Test',
        package: {}
      });

      mockKernel.vfs.mkdir.mockResolvedValue(true);
      mockKernel.vfs.deleteDir.mockResolvedValue(true);

      await marketplace.installApp(app.id);
      const result = await marketplace.uninstallApp(app.id);

      expect(result.success).toBe(true);
      expect(marketplace.installed.has(app.id)).toBe(false);
    });
  });

  describe('App Search', () => {
    beforeEach(async () => {
      await marketplace.publishApp({
        name: 'Calculator Pro',
        version: '1.0.0',
        description: 'Advanced calculator',
        category: 'Utilities',
        author: 'Test',
        package: {}
      });

      await marketplace.publishApp({
        name: 'Photo Editor',
        version: '1.0.0',
        description: 'Edit photos',
        category: 'Graphics',
        author: 'Test',
        package: {}
      });

      await marketplace.publishApp({
        name: 'Code Editor',
        version: '1.0.0',
        description: 'Edit code',
        category: 'Development',
        author: 'Test',
        package: {}
      });
    });

    it('should search apps by name', () => {
      const results = marketplace.searchApps('calculator');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Calculator Pro');
    });

    it('should search apps by description', () => {
      const results = marketplace.searchApps('edit');

      expect(results.length).toBeGreaterThan(0);
    });

    it('should filter by category', () => {
      const results = marketplace.searchApps(null, 'Graphics');

      expect(results).toHaveLength(1);
      expect(results[0].category).toBe('Graphics');
    });

    it('should return all apps when no query', () => {
      const results = marketplace.searchApps(null);

      expect(results.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('App Ratings', () => {
    it('should rate an app', async () => {
      const app = await marketplace.publishApp({
        name: 'Rating Test',
        version: '1.0.0',
        description: 'Test',
        category: 'Utilities',
        author: 'Test',
        package: {}
      });

      await marketplace.rateApp(app.id, 5, 'Great app!');
      await marketplace.rateApp(app.id, 4, 'Good');

      expect(app.reviews).toHaveLength(2);
      expect(app.rating).toBeCloseTo(4.5, 1);
    });
  });

  describe('Featured Apps', () => {
    it('should return featured apps sorted by rating and downloads', async () => {
      const app1 = await marketplace.publishApp({
        name: 'App 1',
        version: '1.0.0',
        description: 'Test',
        category: 'Utilities',
        author: 'Test',
        package: {}
      });

      const app2 = await marketplace.publishApp({
        name: 'App 2',
        version: '1.0.0',
        description: 'Test',
        category: 'Utilities',
        author: 'Test',
        package: {}
      });

      app1.rating = 5;
      app1.downloads = 100;
      app2.rating = 4;
      app2.downloads = 200;

      const featured = marketplace.getFeaturedApps(2);

      expect(featured[0].name).toBe('App 1'); // Higher rating
    });
  });
});
