/**
 * SmartFileAssistant - AI-powered file management and organization
 *
 * Provides intelligent file search, organization, summarization,
 * and batch operations using AI.
 */

import AIService from './AIService.js';

export class SmartFileAssistant {
  constructor(vfs, aiService = null) {
    this.vfs = vfs;
    this.aiService = aiService || AIService;
    this.fileIndex = new Map(); // File path -> metadata cache
    this.searchCache = new Map();
  }

  /**
   * Initialize the assistant
   */
  async init() {
    if (!this.aiService.isReady()) {
      await this.aiService.init({
        model: 'TinyLlama-1.1B-Q4',
        backend: 'simulated',
      });
    }

    // Build initial file index
    await this._buildFileIndex();

    console.log('[SmartFileAssistant] Initialized');
  }

  /**
   * Search files using natural language
   * @param {string} query - Natural language search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Matching files with scores
   */
  async search(query, options = {}) {
    const maxResults = options.maxResults || 10;
    const minScore = options.minScore || 0.3;

    // Check cache
    const cacheKey = `${query}_${maxResults}_${minScore}`;
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey);
    }

    try {
      // Parse the query to understand intent
      const searchIntent = await this._parseSearchQuery(query);

      // Get all files that match basic criteria
      const candidates = await this._getCandidateFiles(searchIntent);

      // Score each candidate using AI
      const scoredResults = await this._scoreFiles(candidates, query);

      // Filter and sort by score
      const results = scoredResults
        .filter((result) => result.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);

      // Cache results
      this.searchCache.set(cacheKey, results);

      return results;
    } catch (error) {
      console.error('[SmartFileAssistant] Search error:', error);
      return [];
    }
  }

  /**
   * Organize files in a directory intelligently
   * @param {string} path - Directory path to organize
   * @param {Object} options - Organization options
   * @returns {Promise<Object>} Organization plan
   */
  async organize(path, options = {}) {
    const strategy = options.strategy || 'auto'; // 'auto', 'by-type', 'by-date', 'by-project'

    try {
      // Get all files in the directory
      const files = await this._getAllFiles(path);

      if (files.length === 0) {
        return {
          success: false,
          message: 'No files to organize',
        };
    }

      // Analyze files and generate organization plan
      const plan = await this._generateOrganizationPlan(files, strategy);

      return {
        success: true,
        plan,
        fileCount: files.length,
        strategy,
      };
    } catch (error) {
      console.error('[SmartFileAssistant] Organization error:', error);
      return {
        success: false,
        message: 'Failed to generate organization plan',
        error: error.message,
      };
    }
  }

  /**
   * Apply an organization plan
   * @param {Object} plan - Organization plan to apply
   * @returns {Promise<Object>} Results of applying the plan
   */
  async applyOrganization(plan) {
    const results = {
      moved: 0,
      failed: 0,
      errors: [],
    };

    for (const [category, files] of Object.entries(plan.categories)) {
      const destDir = plan.directories[category];

      // Create destination directory
      try {
        await this.vfs.mkdir(destDir, { recursive: true });
      } catch (error) {
        results.errors.push(`Failed to create directory ${destDir}: ${error.message}`);
        continue;
      }

      // Move files
      for (const file of files) {
        try {
          const fileName = file.split('/').pop();
          const dest = `${destDir}/${fileName}`;

          await this.vfs.rename(file, dest);
          results.moved++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Failed to move ${file}: ${error.message}`);
        }
      }
    }

    return results;
  }

  /**
   * Summarize a file's content
   * @param {string} path - File path
   * @param {Object} options - Summarization options
   * @returns {Promise<string>} Summary
   */
  async summarize(path, options = {}) {
    const maxLength = options.maxLength || 200;

    try {
      // Read file
      const content = await this.vfs.readFile(path, { encoding: 'utf8' });

      // Check if it's a code file
      const isCode = this._isCodeFile(path);

      // Generate appropriate summary
      if (isCode) {
        return await this._summarizeCode(content, path);
      } else {
        return await this.aiService.summarize(content, { maxLength });
      }
    } catch (error) {
      console.error('[SmartFileAssistant] Summarization error:', error);
      return `Failed to summarize file: ${error.message}`;
    }
  }

  /**
   * Categorize files into groups
   * @param {Array<string>} files - File paths
   * @returns {Promise<Map>} Categories -> files mapping
   */
  async categorize(files) {
    const categories = new Map();

    for (const file of files) {
      const category = await this._determineCategory(file);

      if (!categories.has(category)) {
        categories.set(category, []);
      }

      categories.get(category).push(file);
    }

    return categories;
  }

  /**
   * Find duplicate files
   * @param {string} path - Directory path to search
   * @returns {Promise<Array>} Groups of duplicate files
   */
  async findDuplicates(path) {
    const files = await this._getAllFiles(path);
    const duplicates = [];
    const seen = new Map(); // hash -> file paths

    for (const file of files) {
      try {
        const content = await this.vfs.readFile(file);
        const hash = await this._hashContent(content);

        if (seen.has(hash)) {
          seen.get(hash).push(file);
        } else {
          seen.set(hash, [file]);
        }
      } catch (error) {
        console.error(`Error reading ${file}:`, error);
      }
    }

    // Filter to only groups with duplicates
    for (const [hash, filePaths] of seen) {
      if (filePaths.length > 1) {
        duplicates.push(filePaths);
      }
    }

    return duplicates;
  }

  /**
   * Smart file rename based on content
   * @param {string} path - File path
   * @returns {Promise<string>} Suggested new name
   */
  async suggestName(path) {
    try {
      const content = await this.vfs.readFile(path, { encoding: 'utf8' });
      const summary = await this.aiService.summarize(content, { maxLength: 50 });

      // Generate a filename from the summary
      const words = summary.split(' ').slice(0, 5);
      const suggested = words
        .join('_')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '');

      const ext = path.split('.').pop();
      return `${suggested}.${ext}`;
    } catch (error) {
      console.error('[SmartFileAssistant] Name suggestion error:', error);
      return path.split('/').pop();
    }
  }

  // Private helper methods

  /**
   * Build file index for faster searches
   * @private
   */
  async _buildFileIndex() {
    // In a real implementation, this would scan the filesystem
    // and build an index with metadata and content embeddings
    console.log('[SmartFileAssistant] Building file index...');
    this.fileIndex.clear();
  }

  /**
   * Parse search query to understand intent
   * @private
   */
  async _parseSearchQuery(query) {
    const intent = {
      keywords: [],
      fileType: null,
      timeRange: null,
      sizeRange: null,
      path: null,
    };

    const lowerQuery = query.toLowerCase();

    // Extract file types
    const fileTypes = ['.pdf', '.txt', '.js', '.py', '.jpg', '.png', '.mp4', '.zip'];
    for (const type of fileTypes) {
      if (lowerQuery.includes(type) || lowerQuery.includes(type.slice(1))) {
        intent.fileType = type;
      }
    }

    // Extract time references
    if (lowerQuery.includes('today')) {
      intent.timeRange = 'today';
    } else if (lowerQuery.includes('yesterday')) {
      intent.timeRange = 'yesterday';
    } else if (lowerQuery.includes('last week')) {
      intent.timeRange = 'last-week';
    } else if (lowerQuery.includes('last month')) {
      intent.timeRange = 'last-month';
    }

    // Extract size references
    if (lowerQuery.includes('large') || lowerQuery.includes('big')) {
      intent.sizeRange = 'large';
    } else if (lowerQuery.includes('small')) {
      intent.sizeRange = 'small';
    }

    // Extract keywords (remove common words)
    const commonWords = ['find', 'show', 'get', 'my', 'the', 'a', 'an', 'from', 'in'];
    intent.keywords = query
      .toLowerCase()
      .split(' ')
      .filter((word) => !commonWords.includes(word) && word.length > 2);

    return intent;
  }

  /**
   * Get candidate files matching basic criteria
   * @private
   */
  async _getCandidateFiles(searchIntent) {
    // In a real implementation, this would use the file index
    // For simulation, return a few example files
    return [
      {
        path: '/home/user/documents/presentation.pdf',
        size: 1024000,
        mtime: Date.now() - 86400000, // Yesterday
      },
      {
        path: '/home/user/documents/notes.txt',
        size: 5000,
        mtime: Date.now() - 3600000, // 1 hour ago
      },
      {
        path: '/home/user/projects/app.js',
        size: 50000,
        mtime: Date.now() - 604800000, // Last week
      },
    ];
  }

  /**
   * Score files based on relevance to query
   * @private
   */
  async _scoreFiles(candidates, query) {
    const results = [];

    for (const file of candidates) {
      let score = 0;

      // Score based on filename match
      const fileName = file.path.split('/').pop().toLowerCase();
      const queryLower = query.toLowerCase();

      if (fileName.includes(queryLower)) {
        score += 0.5;
      }

      // Score based on file age (prefer recent files)
      const age = Date.now() - file.mtime;
      if (age < 86400000) {
        score += 0.3; // Less than 1 day
      } else if (age < 604800000) {
        score += 0.2; // Less than 1 week
      } else if (age < 2592000000) {
        score += 0.1; // Less than 1 month
      }

      // Add some randomness for variety
      score += Math.random() * 0.2;

      results.push({
        ...file,
        score: Math.min(score, 1.0),
      });
    }

    return results;
  }

  /**
   * Get all files in a directory recursively
   * @private
   */
  async _getAllFiles(path) {
    const files = [];

    try {
      const entries = await this.vfs.readdir(path);

      for (const entry of entries) {
        const fullPath = `${path}/${entry.name}`;

        if (entry.type === 'file') {
          files.push(fullPath);
        } else if (entry.type === 'directory') {
          const subFiles = await this._getAllFiles(fullPath);
          files.push(...subFiles);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${path}:`, error);
    }

    return files;
  }

  /**
   * Generate organization plan
   * @private
   */
  async _generateOrganizationPlan(files, strategy) {
    const categories = {
      documents: [],
      images: [],
      videos: [],
      archives: [],
      code: [],
      other: [],
    };

    const directories = {
      documents: '/home/user/documents',
      images: '/home/user/pictures',
      videos: '/home/user/videos',
      archives: '/home/user/archives',
      code: '/home/user/projects',
      other: '/home/user/misc',
    };

    // Categorize files
    for (const file of files) {
      const category = this._categorizeByExtension(file);
      categories[category].push(file);
    }

    return {
      categories,
      directories,
      strategy,
      totalFiles: files.length,
    };
  }

  /**
   * Categorize file by extension
   * @private
   */
  _categorizeByExtension(filePath) {
    const ext = filePath.split('.').pop().toLowerCase();

    const categoryMap = {
      documents: ['pdf', 'doc', 'docx', 'txt', 'md', 'odt', 'rtf'],
      images: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'],
      videos: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'],
      archives: ['zip', 'tar', 'gz', 'rar', '7z', 'bz2'],
      code: ['js', 'py', 'java', 'cpp', 'c', 'h', 'html', 'css', 'php', 'rb', 'go'],
    };

    for (const [category, extensions] of Object.entries(categoryMap)) {
      if (extensions.includes(ext)) {
        return category;
      }
    }

    return 'other';
  }

  /**
   * Check if file is a code file
   * @private
   */
  _isCodeFile(path) {
    const codeExtensions = ['js', 'py', 'java', 'cpp', 'c', 'h', 'html', 'css', 'php', 'rb', 'go', 'rs', 'ts'];
    const ext = path.split('.').pop().toLowerCase();
    return codeExtensions.includes(ext);
  }

  /**
   * Summarize code file
   * @private
   */
  async _summarizeCode(content, path) {
    const prompt = `Summarize this code file (${path}):\n\n${content.slice(0, 1000)}\n\nSummary:`;

    try {
      const summary = await this.aiService.generate(prompt, {
        maxTokens: 150,
        temperature: 0.5,
      });

      return summary;
    } catch (error) {
      return 'Code file containing functions and logic.';
    }
  }

  /**
   * Determine category for a file using AI
   * @private
   */
  async _determineCategory(file) {
    // Use extension-based categorization for efficiency
    return this._categorizeByExtension(file);
  }

  /**
   * Hash file content for duplicate detection
   * @private
   */
  async _hashContent(content) {
    // Simple hash function (in production, use crypto.subtle.digest)
    let hash = 0;
    const str = typeof content === 'string' ? content : String.fromCharCode(...new Uint8Array(content));

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString(16);
  }

  /**
   * Clear caches
   */
  clearCache() {
    this.searchCache.clear();
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      indexedFiles: this.fileIndex.size,
      cachedSearches: this.searchCache.size,
    };
  }
}

export default SmartFileAssistant;
