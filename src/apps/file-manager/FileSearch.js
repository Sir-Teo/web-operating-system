/**
 * FileSearch.js
 *
 * Fast file search engine with filters.
 * Supports searching by name, type, size, and content.
 */

export class FileSearch {
  constructor(vfs) {
    this.vfs = vfs;
  }

  /**
   * Search for files recursively
   * @param {string} searchPath - Root path to search from
   * @param {Object} options - Search options
   * @returns {Array} Array of matching file paths
   */
  async search(searchPath, options = {}) {
    const {
      query = '',
      caseSensitive = false,
      fileType = 'all', // 'all', 'file', 'directory'
      extension = null,
      minSize = null,
      maxSize = null,
      searchContent = false,
      maxResults = 100
    } = options;

    const results = [];
    const normalizedQuery = caseSensitive ? query : query.toLowerCase();

    await this._searchRecursive(
      searchPath,
      normalizedQuery,
      options,
      results,
      maxResults
    );

    return results;
  }

  async _searchRecursive(path, query, options, results, maxResults) {
    if (results.length >= maxResults) {
      return;
    }

    try {
      const entries = await this.vfs.readdir(path);

      for (const entry of entries) {
        if (results.length >= maxResults) {
          break;
        }

        const fullPath = `${path}/${entry.name}`.replace(/\/+/g, '/');

        // Check if entry matches criteria
        if (await this._matchesSearch(fullPath, entry, query, options)) {
          results.push({
            path: fullPath,
            name: entry.name,
            type: entry.type,
            size: entry.size,
            modified: entry.modified
          });
        }

        // Recurse into directories
        if (entry.type === 'directory') {
          await this._searchRecursive(fullPath, query, options, results, maxResults);
        }
      }
    } catch (error) {
      // Skip directories we can't read
      console.warn(`Skipping ${path}:`, error.message);
    }
  }

  async _matchesSearch(fullPath, entry, query, options) {
    const {
      caseSensitive,
      fileType,
      extension,
      minSize,
      maxSize,
      searchContent
    } = options;

    // Type filter
    if (fileType !== 'all' && entry.type !== fileType) {
      return false;
    }

    // Extension filter
    if (extension && entry.type === 'file') {
      const ext = entry.name.split('.').pop().toLowerCase();
      if (ext !== extension.toLowerCase()) {
        return false;
      }
    }

    // Size filter
    if (entry.type === 'file') {
      if (minSize !== null && entry.size < minSize) {
        return false;
      }
      if (maxSize !== null && entry.size > maxSize) {
        return false;
      }
    }

    // Name matching
    const nameToMatch = caseSensitive ? entry.name : entry.name.toLowerCase();
    if (query && !nameToMatch.includes(query)) {
      // If searching content, check file content
      if (searchContent && entry.type === 'file' && this._isTextFile(entry.name)) {
        try {
          const content = await this.vfs.readFile(fullPath, { encoding: 'utf8' });
          const contentToMatch = caseSensitive ? content : content.toLowerCase();
          if (!contentToMatch.includes(query)) {
            return false;
          }
        } catch (error) {
          return false;
        }
      } else {
        return false;
      }
    }

    return true;
  }

  _isTextFile(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    return [
      'txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'jsx',
      'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'sh',
      'yml', 'yaml', 'toml', 'ini', 'cfg', 'log'
    ].includes(ext);
  }

  /**
   * Find files by pattern (e.g., "*.js")
   * @param {string} searchPath - Root path to search from
   * @param {string} pattern - Glob-like pattern
   * @returns {Array} Array of matching file paths
   */
  async findByPattern(searchPath, pattern) {
    const results = [];
    const regex = this._patternToRegex(pattern);

    await this._findByPatternRecursive(searchPath, regex, results);

    return results;
  }

  async _findByPatternRecursive(path, regex, results) {
    try {
      const entries = await this.vfs.readdir(path);

      for (const entry of entries) {
        const fullPath = `${path}/${entry.name}`.replace(/\/+/g, '/');

        if (regex.test(entry.name)) {
          results.push({
            path: fullPath,
            name: entry.name,
            type: entry.type,
            size: entry.size,
            modified: entry.modified
          });
        }

        if (entry.type === 'directory') {
          await this._findByPatternRecursive(fullPath, regex, results);
        }
      }
    } catch (error) {
      console.warn(`Skipping ${path}:`, error.message);
    }
  }

  _patternToRegex(pattern) {
    // Convert glob-like pattern to regex
    let regexStr = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');

    return new RegExp(`^${regexStr}$`, 'i');
  }

  /**
   * Get recently modified files
   * @param {string} searchPath - Root path to search from
   * @param {number} count - Number of files to return
   * @returns {Array} Array of recently modified files
   */
  async getRecentFiles(searchPath, count = 10) {
    const allFiles = [];

    await this._collectAllFiles(searchPath, allFiles);

    // Sort by modified date (most recent first)
    allFiles.sort((a, b) => (b.modified || 0) - (a.modified || 0));

    return allFiles.slice(0, count);
  }

  async _collectAllFiles(path, results) {
    try {
      const entries = await this.vfs.readdir(path);

      for (const entry of entries) {
        const fullPath = `${path}/${entry.name}`.replace(/\/+/g, '/');

        if (entry.type === 'file') {
          results.push({
            path: fullPath,
            name: entry.name,
            type: entry.type,
            size: entry.size,
            modified: entry.modified
          });
        }

        if (entry.type === 'directory') {
          await this._collectAllFiles(fullPath, results);
        }
      }
    } catch (error) {
      console.warn(`Skipping ${path}:`, error.message);
    }
  }
}
