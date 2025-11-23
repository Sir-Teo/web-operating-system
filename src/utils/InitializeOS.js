/**
 * InitializeOS - Utility to initialize WebOS with example files and features
 *
 * This module provides functions to set up the OS on first boot or reset:
 * - Generate example files
 * - Set up file upload
 * - Initialize AI with context
 * - Create sample data
 */

import ExampleFileGenerator from './ExampleFileGenerator.js';
import FileUploader from '../components/FileUploader.js';

export class OSInitializer {
  constructor(osServices) {
    this.vfs = osServices.vfs;
    this.aiService = osServices.aiService;
    this.processManager = osServices.processManager;
    this.initialized = false;
  }

  /**
   * Initialize OS with example files and features
   */
  async initialize(options = {}) {
    console.log('[OSInitializer] Starting initialization...');

    const config = {
      generateExamples: options.generateExamples !== false,
      setupUploader: options.setupUploader !== false,
      initializeAI: options.initializeAI !== false,
      ...options
    };

    const results = {
      examples: null,
      uploader: null,
      ai: null
    };

    try {
      // Generate example files
      if (config.generateExamples) {
        results.examples = await this.generateExampleFiles();
      }

      // Setup file uploader
      if (config.setupUploader) {
        results.uploader = this.setupFileUploader(config.uploaderOptions);
      }

      // Initialize AI
      if (config.initializeAI) {
        results.ai = await this.initializeAI();
      }

      this.initialized = true;
      console.log('[OSInitializer] Initialization complete');

      return {
        success: true,
        results
      };
    } catch (error) {
      console.error('[OSInitializer] Initialization failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate example files
   */
  async generateExampleFiles() {
    console.log('[OSInitializer] Generating example files...');

    const generator = new ExampleFileGenerator(this.vfs);
    const results = await generator.generateAll({
      baseDir: '/home/user'
    });

    console.log(`[OSInitializer] Created ${results.created.length} example files`);

    return results;
  }

  /**
   * Setup file uploader
   */
  setupFileUploader(options = {}) {
    console.log('[OSInitializer] Setting up file uploader...');

    const uploader = new FileUploader(this.vfs, {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      targetDirectory: '/home/user/uploads',
      multiple: true,
      showPreview: true,
      ...options
    });

    // Make uploader globally accessible
    if (typeof window !== 'undefined') {
      window.fileUploader = uploader;
    }

    console.log('[OSInitializer] File uploader ready');

    return uploader;
  }

  /**
   * Initialize AI with OS context
   */
  async initializeAI() {
    if (!this.aiService) {
      console.warn('[OSInitializer] AI service not available');
      return null;
    }

    console.log('[OSInitializer] Initializing AI...');

    try {
      // Initialize AI service if not already done
      if (!this.aiService.isReady || !this.aiService.isReady()) {
        await this.aiService.init({
          backend: 'deterministic',
          features: {
            memory: true,
            proactiveSuggestions: true,
            workflowAutomation: true,
            advancedCodeAnalysis: true
          }
        });
      }

      // Update AI with OS context
      const context = await this._gatherOSContext();
      if (this.aiService.updateOSContext) {
        this.aiService.updateOSContext(context);
      }

      console.log('[OSInitializer] AI initialized with OS context');

      return {
        ready: true,
        features: this.aiService.features || {}
      };
    } catch (error) {
      console.error('[OSInitializer] AI initialization failed:', error);
      return null;
    }
  }

  /**
   * Gather OS context for AI
   */
  async _gatherOSContext() {
    const context = {
      timestamp: Date.now(),
      fileSystem: {},
      processes: [],
      systemInfo: {}
    };

    try {
      // Get file system context
      const homeDir = '/home/user';
      const files = await this.vfs.readdir(homeDir);

      context.fileSystem = {
        homeDir,
        files: await Promise.all(
          files.map(async (file) => {
            try {
              const path = `${homeDir}/${file}`;
              const stat = await this.vfs.stat(path);
              return {
                name: file,
                path,
                type: stat.type,
                size: stat.size
              };
            } catch (err) {
              return { name: file, error: true };
            }
          })
        )
      };
    } catch (error) {
      console.warn('[OSInitializer] Failed to gather file system context:', error);
    }

    try {
      // Get process context
      if (this.processManager && this.processManager.getAllProcesses) {
        context.processes = this.processManager.getAllProcesses();
      }
    } catch (error) {
      console.warn('[OSInitializer] Failed to gather process context:', error);
    }

    // System info
    context.systemInfo = {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      online: navigator.onLine
    };

    return context;
  }

  /**
   * Create sample user data
   */
  async createSampleData() {
    console.log('[OSInitializer] Creating sample user data...');

    const sampleFiles = {
      '/home/user/Documents/my-notes.txt': `My Personal Notes
==================

Ideas:
- Build a new feature for WebOS
- Learn more about AI
- Create a cool project

Goals for this week:
- [ ] Complete project documentation
- [ ] Test new AI features
- [ ] Organize files
- [ ] Back up important data

Remember:
- Stay focused
- Take breaks
- Keep learning
`,

      '/home/user/Documents/shopping-list.txt': `Shopping List
=============

Groceries:
- Milk
- Bread
- Eggs
- Fruits
- Vegetables

Other:
- Batteries
- Light bulbs
`,

      '/home/user/projects/my-first-script.js': `// My First JavaScript Project

function greet(name) {
  console.log(\`Hello, \${name}! Welcome to WebOS!\`);
}

greet('User');

// TODO: Add more features
`,

      '/home/user/Downloads/README.txt': `Downloads Folder
================

This is your downloads folder. Files you download will appear here.

Tip: Keep this folder organized by regularly moving files to appropriate locations.
`
    };

    const created = [];
    const errors = [];

    for (const [path, content] of Object.entries(sampleFiles)) {
      try {
        // Ensure directory exists
        const dirPath = path.substring(0, path.lastIndexOf('/'));
        await this._ensureDirectory(dirPath);

        // Create file
        await this.vfs.writeFile(path, content);
        created.push(path);
      } catch (error) {
        errors.push({ path, error: error.message });
      }
    }

    console.log(`[OSInitializer] Created ${created.length} sample data files`);

    return { created, errors };
  }

  /**
   * Ensure directory exists
   */
  async _ensureDirectory(path) {
    try {
      await this.vfs.stat(path);
    } catch (error) {
      const parts = path.split('/').filter(p => p);
      let currentPath = '';

      for (const part of parts) {
        currentPath += '/' + part;

        try {
          await this.vfs.stat(currentPath);
        } catch {
          await this.vfs.mkdir(currentPath);
        }
      }
    }
  }

  /**
   * Check if OS has been initialized
   */
  async isInitialized() {
    try {
      // Check if example files exist
      await this.vfs.stat('/home/user/examples');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reset OS (remove all user files)
   */
  async reset(options = {}) {
    console.warn('[OSInitializer] Resetting OS...');

    const keepFolders = options.keepFolders || ['examples', 'templates', 'docs'];

    try {
      const homeDir = '/home/user';
      const files = await this.vfs.readdir(homeDir);

      for (const file of files) {
        if (!keepFolders.includes(file)) {
          try {
            await this.vfs.rm(`${homeDir}/${file}`, { recursive: true });
            console.log(`[OSInitializer] Removed: ${file}`);
          } catch (error) {
            console.error(`[OSInitializer] Failed to remove ${file}:`, error);
          }
        }
      }

      console.log('[OSInitializer] Reset complete');
      return { success: true };
    } catch (error) {
      console.error('[OSInitializer] Reset failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get initialization status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      vfsReady: !!this.vfs,
      aiReady: this.aiService?.isReady?.() || false
    };
  }
}

/**
 * Quick initialization function
 */
export async function initializeWebOS(osServices, options = {}) {
  const initializer = new OSInitializer(osServices);
  return await initializer.initialize(options);
}

/**
 * Setup only file uploader
 */
export function setupFileUpload(vfs, containerElement) {
  const uploader = new FileUploader(vfs, {
    maxFileSize: 10 * 1024 * 1024,
    targetDirectory: '/home/user/uploads',
    multiple: true
  });

  if (containerElement) {
    uploader.createUI(containerElement);
  }

  return uploader;
}

export default OSInitializer;
