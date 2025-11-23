/**
 * App Marketplace
 * Community app store for distributing and installing applications
 */

import { Logger } from '../utils/Logger.js';
import { eventBus } from '../utils/EventBus.js';

export class AppMarketplace {
  constructor(kernel) {
    this.kernel = kernel;
    this.logger = new Logger('AppMarketplace');
    this.apps = new Map();
    this.installed = new Map();
    this.categories = [
      'Productivity',
      'Development',
      'Graphics',
      'Games',
      'Utilities',
      'Education',
      'Entertainment'
    ];
  }

  async initialize() {
    this.logger.info('Initializing App Marketplace...');
    await this._loadMarketplace();
    await this._loadInstalledApps();
    return true;
  }

  async publishApp(appPackage) {
    const appId = `app_${Date.now()}`;

    const app = {
      id: appId,
      name: appPackage.name,
      version: appPackage.version,
      description: appPackage.description,
      category: appPackage.category,
      author: appPackage.author,
      icon: appPackage.icon,
      screenshots: appPackage.screenshots || [],
      price: appPackage.price || 0,
      rating: 0,
      downloads: 0,
      reviews: [],
      package: appPackage.package,
      published: Date.now()
    };

    this.apps.set(appId, app);
    await this._saveMarketplace();

    this.logger.info(`App published: ${app.name}`);
    return app;
  }

  async installApp(appId) {
    const app = this.apps.get(appId);
    if (!app) throw new Error('App not found');

    this.logger.info(`Installing app: ${app.name}`);

    // Install app package
    const vfs = this.kernel.vfs;
    const installPath = `/.apps/${app.name}`;

    await vfs.mkdir(installPath, { recursive: true });
    // Would unpack and install app files here

    this.installed.set(appId, {
      appId,
      installedAt: Date.now(),
      version: app.version
    });

    app.downloads++;
    await this._saveInstalledApps();
    await this._saveMarketplace();

    eventBus.emit('app-installed', { appId, app });

    return { success: true, path: installPath };
  }

  async uninstallApp(appId) {
    if (!this.installed.has(appId)) {
      throw new Error('App not installed');
    }

    const app = this.apps.get(appId);
    const installPath = `/.apps/${app.name}`;

    const vfs = this.kernel.vfs;
    await vfs.deleteDir(installPath);

    this.installed.delete(appId);
    await this._saveInstalledApps();

    eventBus.emit('app-uninstalled', { appId });

    return { success: true };
  }

  searchApps(query, category = null) {
    const results = [];

    for (const app of this.apps.values()) {
      const matchesQuery = !query ||
        app.name.toLowerCase().includes(query.toLowerCase()) ||
        app.description.toLowerCase().includes(query.toLowerCase());

      const matchesCategory = !category || app.category === category;

      if (matchesQuery && matchesCategory) {
        results.push(app);
      }
    }

    return results.sort((a, b) => b.rating - a.rating || b.downloads - a.downloads);
  }

  async rateApp(appId, rating, review) {
    const app = this.apps.get(appId);
    if (!app) throw new Error('App not found');

    app.reviews.push({
      rating,
      review,
      timestamp: Date.now()
    });

    // Recalculate average rating
    const sum = app.reviews.reduce((acc, r) => acc + r.rating, 0);
    app.rating = sum / app.reviews.length;

    await this._saveMarketplace();

    return { success: true, newRating: app.rating };
  }

  getFeaturedApps(limit = 10) {
    return Array.from(this.apps.values())
      .sort((a, b) => b.rating - a.rating || b.downloads - a.downloads)
      .slice(0, limit);
  }

  getInstalledApps() {
    return Array.from(this.installed.values()).map(installed => ({
      ...installed,
      app: this.apps.get(installed.appId)
    }));
  }

  async _loadMarketplace() {
    try {
      const vfs = this.kernel.vfs;
      const data = await vfs.readFile('/.marketplace/apps.json');
      const apps = JSON.parse(data);

      for (const app of apps) {
        this.apps.set(app.id, app);
      }

      this.logger.info(`Loaded ${apps.length} marketplace apps`);
    } catch (error) {
      this.logger.info('No marketplace data found');
      this._seedMarketplace();
    }
  }

  _seedMarketplace() {
    // Seed with example apps
    const exampleApps = [
      {
        name: 'Super Calculator',
        version: '1.0.0',
        description: 'Advanced scientific calculator',
        category: 'Utilities',
        author: 'WebOS Team',
        icon: '🔢',
        price: 0,
        package: {}
      },
      {
        name: 'Photo Editor Pro',
        version: '2.1.0',
        description: 'Professional image editing',
        category: 'Graphics',
        author: 'Community',
        icon: '🎨',
        price: 0,
        package: {}
      }
    ];

    for (const app of exampleApps) {
      this.publishApp(app);
    }
  }

  async _saveMarketplace() {
    try {
      const vfs = this.kernel.vfs;
      await vfs.mkdir('/.marketplace', { recursive: true });

      const apps = Array.from(this.apps.values());
      await vfs.writeFile('/.marketplace/apps.json', JSON.stringify(apps, null, 2));
    } catch (error) {
      this.logger.error('Failed to save marketplace:', error);
    }
  }

  async _loadInstalledApps() {
    try {
      const vfs = this.kernel.vfs;
      const data = await vfs.readFile('/.marketplace/installed.json');
      const installed = JSON.parse(data);

      for (const app of installed) {
        this.installed.set(app.appId, app);
      }

      this.logger.info(`Loaded ${installed.length} installed apps`);
    } catch (error) {
      this.logger.info('No installed apps data');
    }
  }

  async _saveInstalledApps() {
    try {
      const vfs = this.kernel.vfs;
      await vfs.mkdir('/.marketplace', { recursive: true });

      const installed = Array.from(this.installed.values());
      await vfs.writeFile('/.marketplace/installed.json', JSON.stringify(installed, null, 2));
    } catch (error) {
      this.logger.error('Failed to save installed apps:', error);
    }
  }
}

export default AppMarketplace;
