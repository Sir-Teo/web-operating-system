/**
 * Multi-Language Runtime System
 * Entry point for all language runtimes with enterprise-grade features
 */

// Core runtime exports
export * from './LanguageRuntime';
export * from './JavaScriptRuntime';
export * from './TypeScriptRuntime';
export * from './PythonRuntime';
export * from './RubyRuntime';
export * from './PHPRuntime';
export * from './SQLiteRuntime';

// Infrastructure exports
export { default as Logger, LogLevel, LogCategory } from './Logger';
export { default as ConfigurationManager } from './ConfigurationManager';
export { default as CacheManager } from './CacheManager';
export { default as ResourceMonitor } from './ResourceMonitor';
export { default as EnhancedRuntimeManager } from './EnhancedRuntimeManager';

import { RuntimeManager } from './LanguageRuntime';
import { JavaScriptRuntime } from './JavaScriptRuntime';
import { TypeScriptRuntime } from './TypeScriptRuntime';
import { PythonRuntime } from './PythonRuntime';
import { RubyRuntime } from './RubyRuntime';
import { PHPRuntime } from './PHPRuntime';
import { SQLiteRuntime } from './SQLiteRuntime';
import EnhancedRuntimeManager from './EnhancedRuntimeManager';
import Logger, { LogCategory } from './Logger';

/**
 * Initialize all language runtimes with enhanced features
 */
export function initializeRuntimes(): EnhancedRuntimeManager {
  const runtimeManager = EnhancedRuntimeManager.getEnhancedInstance();
  const logger = Logger.getInstance();

  logger.info(LogCategory.RUNTIME, 'Initializing runtime system');

  // Register all available runtimes
  runtimeManager.registerRuntime('javascript', new JavaScriptRuntime());
  runtimeManager.registerRuntime('js', new JavaScriptRuntime());
  runtimeManager.registerRuntime('typescript', new TypeScriptRuntime());
  runtimeManager.registerRuntime('ts', new TypeScriptRuntime());
  runtimeManager.registerRuntime('python', new PythonRuntime());
  runtimeManager.registerRuntime('py', new PythonRuntime());
  runtimeManager.registerRuntime('ruby', new RubyRuntime());
  runtimeManager.registerRuntime('rb', new RubyRuntime());
  runtimeManager.registerRuntime('php', new PHPRuntime());
  runtimeManager.registerRuntime('sqlite', new SQLiteRuntime());
  runtimeManager.registerRuntime('sql', new SQLiteRuntime());

  logger.info(LogCategory.RUNTIME, 'Runtime system initialized', {
    languages: runtimeManager.getAvailableRuntimes(),
  });

  return runtimeManager;
}

/**
 * Get language information
 */
export interface LanguageInfo {
  id: string;
  name: string;
  version: string;
  aliases: string[];
  extension: string;
  icon: string;
  description: string;
  features: string[];
  packageManager?: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    version: 'ES2024',
    aliases: ['js'],
    extension: '.js',
    icon: '🟨',
    description: 'High-level, interpreted programming language',
    features: ['Native browser support', 'Async/await', 'Modern ES features', 'Full REPL'],
    packageManager: 'npm',
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    version: '5.3',
    aliases: ['ts'],
    extension: '.ts',
    icon: '🔷',
    description: 'Typed superset of JavaScript',
    features: [
      'Static typing',
      'Type inference',
      'Compilation to JS',
      'IDE-like intellisense',
    ],
    packageManager: 'npm',
  },
  {
    id: 'python',
    name: 'Python',
    version: '3.11',
    aliases: ['py'],
    extension: '.py',
    icon: '🐍',
    description: 'High-level, general-purpose programming language',
    features: [
      'Pyodide runtime',
      'Scientific computing (NumPy, Pandas)',
      'Data visualization',
      'Machine learning',
      'Full REPL',
    ],
    packageManager: 'pip',
  },
  {
    id: 'ruby',
    name: 'Ruby',
    version: '3.2',
    aliases: ['rb'],
    extension: '.rb',
    icon: '💎',
    description: 'Dynamic, object-oriented programming language',
    features: [
      'WebAssembly runtime',
      'Object-oriented',
      'Elegant syntax',
      'REPL support',
    ],
    packageManager: 'gem',
  },
  {
    id: 'php',
    name: 'PHP',
    version: '8.2',
    aliases: [],
    extension: '.php',
    icon: '🐘',
    description: 'Server-side scripting language',
    features: [
      'WebAssembly runtime',
      'Web development',
      'String processing',
      'REPL support',
    ],
    packageManager: 'composer',
  },
  {
    id: 'sql',
    name: 'SQLite',
    version: '3.44',
    aliases: ['sqlite'],
    extension: '.sql',
    icon: '🗄️',
    description: 'Lightweight relational database',
    features: [
      'In-memory database',
      'Full SQL support',
      'Database export/import',
      'REPL support',
    ],
  },
];

/**
 * Get language by ID or alias
 */
export function getLanguageInfo(language: string): LanguageInfo | undefined {
  const normalized = language.toLowerCase();
  return SUPPORTED_LANGUAGES.find(
    lang => lang.id === normalized || lang.aliases.includes(normalized)
  );
}

/**
 * Detect language from file extension
 */
export function detectLanguage(filename: string): string | undefined {
  const ext = filename.substring(filename.lastIndexOf('.'));
  const lang = SUPPORTED_LANGUAGES.find(l => l.extension === ext);
  return lang?.id;
}
