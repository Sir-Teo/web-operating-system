/**
 * Git Hosting Server
 * Built-in Git server for hosting repositories
 */

import { Logger } from '../utils/Logger.js';
import { eventBus } from '../utils/EventBus.js';

export class GitHostingServer {
  constructor(kernel) {
    this.kernel = kernel;
    this.logger = new Logger('GitHostingServer');
    this.repositories = new Map();
  }

  async initialize() {
    this.logger.info('Initializing Git Hosting Server...');
    await this._loadRepositories();
    return true;
  }

  async createRepository(name, options = {}) {
    const repoId = `repo_${Date.now()}`;

    const repo = {
      id: repoId,
      name,
      description: options.description || '',
      private: options.private || false,
      path: `/.git/repos/${name}`,
      created: Date.now(),
      refs: new Map(),
      objects: new Map()
    };

    this.repositories.set(repoId, repo);

    // Create repository directory
    const vfs = this.kernel.vfs;
    await vfs.mkdir(repo.path, { recursive: true });

    await this._saveRepositories();

    this.logger.info(`Repository created: ${name}`);
    return repo;
  }

  async cloneRepository(repoId, destination) {
    const repo = this.repositories.get(repoId);
    if (!repo) throw new Error('Repository not found');

    // Clone repository files
    const vfs = this.kernel.vfs;
    // Implementation would copy repo files

    return { success: true, path: destination };
  }

  async pushChanges(repoId, branch, changes) {
    const repo = this.repositories.get(repoId);
    if (!repo) throw new Error('Repository not found');

    // Store changes
    const commitId = `commit_${Date.now()}`;
    repo.refs.set(branch, commitId);

    await this._saveRepositories();

    eventBus.emit('git-push', { repoId, branch, commitId });

    return { success: true, commitId };
  }

  listRepositories() {
    return Array.from(this.repositories.values());
  }

  async _loadRepositories() {
    try {
      const vfs = this.kernel.vfs;
      const data = await vfs.readFile('/.git/repositories.json');
      const repos = JSON.parse(data);

      for (const repo of repos) {
        this.repositories.set(repo.id, repo);
      }

      this.logger.info(`Loaded ${repos.length} repositories`);
    } catch (error) {
      this.logger.info('No saved repositories');
    }
  }

  async _saveRepositories() {
    try {
      const vfs = this.kernel.vfs;
      await vfs.mkdir('/.git', { recursive: true });

      const repos = Array.from(this.repositories.values()).map(r => ({
        ...r,
        refs: Array.from(r.refs.entries()),
        objects: [] // Don't save objects in metadata
      }));

      await vfs.writeFile('/.git/repositories.json', JSON.stringify(repos, null, 2));
    } catch (error) {
      this.logger.error('Failed to save repositories:', error);
    }
  }
}

export default GitHostingServer;
