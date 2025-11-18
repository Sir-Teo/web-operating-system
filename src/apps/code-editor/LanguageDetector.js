/**
 * Language Detector for Monaco Editor
 * Detects programming language from file extensions and content
 */
export class LanguageDetector {
  constructor() {
    this.extensionMap = {
      // JavaScript/TypeScript
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'mjs': 'javascript',
      'cjs': 'javascript',

      // Web
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',

      // Data formats
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'xml': 'xml',
      'toml': 'toml',

      // Markup
      'md': 'markdown',
      'markdown': 'markdown',
      'rst': 'restructuredtext',

      // Programming languages
      'py': 'python',
      'rb': 'ruby',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',

      // Shell
      'sh': 'shell',
      'bash': 'shell',
      'zsh': 'shell',
      'fish': 'shell',

      // SQL
      'sql': 'sql',
      'mysql': 'mysql',
      'pgsql': 'pgsql',

      // Configuration
      'ini': 'ini',
      'conf': 'ini',
      'cfg': 'ini',
      'dockerfile': 'dockerfile',

      // Text
      'txt': 'plaintext',
      'log': 'log',

      // Other
      'r': 'r',
      'lua': 'lua',
      'perl': 'perl',
      'pl': 'perl'
    };
  }

  /**
   * Detect language from filename
   * @param {string} filename - The filename
   * @returns {string} The language identifier
   */
  detectFromFilename(filename) {
    if (!filename) return 'plaintext';

    // Handle special filenames
    const lowerName = filename.toLowerCase();
    if (lowerName === 'dockerfile') return 'dockerfile';
    if (lowerName === 'makefile') return 'makefile';
    if (lowerName === 'rakefile') return 'ruby';
    if (lowerName.startsWith('.env')) return 'ini';
    if (lowerName === '.gitignore' || lowerName === '.dockerignore') return 'ignore';

    // Get extension
    const ext = this.getExtension(filename);
    return this.extensionMap[ext] || 'plaintext';
  }

  /**
   * Detect language from file content
   * @param {string} content - File content
   * @returns {string|null} The detected language or null
   */
  detectFromContent(content) {
    if (!content || content.length === 0) return null;

    const firstLine = content.split('\n')[0].trim();

    // Shebang detection
    if (firstLine.startsWith('#!')) {
      if (firstLine.includes('python')) return 'python';
      if (firstLine.includes('node')) return 'javascript';
      if (firstLine.includes('ruby')) return 'ruby';
      if (firstLine.includes('bash') || firstLine.includes('sh')) return 'shell';
      if (firstLine.includes('perl')) return 'perl';
      if (firstLine.includes('php')) return 'php';
    }

    // HTML detection
    if (content.includes('<!DOCTYPE html') || content.includes('<html')) {
      return 'html';
    }

    // XML detection
    if (content.startsWith('<?xml')) {
      return 'xml';
    }

    // JSON detection
    if ((content.startsWith('{') || content.startsWith('[')) &&
        (content.endsWith('}') || content.endsWith(']'))) {
      try {
        JSON.parse(content);
        return 'json';
      } catch {
        // Not valid JSON
      }
    }

    return null;
  }

  /**
   * Get file extension
   * @param {string} filename - The filename
   * @returns {string} The extension in lowercase
   */
  getExtension(filename) {
    const parts = filename.split('.');
    if (parts.length === 1) return '';
    return parts[parts.length - 1].toLowerCase();
  }

  /**
   * Get all supported languages
   * @returns {Array<string>} Array of language identifiers
   */
  getSupportedLanguages() {
    return [...new Set(Object.values(this.extensionMap))];
  }

  /**
   * Check if language is supported
   * @param {string} language - Language identifier
   * @returns {boolean} True if supported
   */
  isLanguageSupported(language) {
    return this.getSupportedLanguages().includes(language);
  }
}
