/**
 * SmartCodeAssistant - AI-powered code assistance
 *
 * Enhanced features:
 * - Code completion, generation, and explanation
 * - Advanced bug detection and security analysis
 * - Code quality metrics and refactoring suggestions
 * - Performance profiling and optimization
 * - Multi-language support with AST-like analysis
 * - Integration with AIService plugin system
 */

import AIService from './AIService.js';

export class SmartCodeAssistant {
  constructor(aiService = null) {
    this.aiService = aiService || AIService;
    this.completionCache = new Map();
    this.languageContexts = new Map();
    this.securityPatterns = this._initSecurityPatterns();
    this.qualityMetrics = new Map();
    this.refactoringHistory = [];
  }

  /**
   * Initialize security vulnerability patterns
   * @private
   */
  _initSecurityPatterns() {
    return {
      javascript: [
        { pattern: /eval\(/, severity: 'critical', message: 'Use of eval() can lead to code injection' },
        { pattern: /innerHTML\s*=/, severity: 'high', message: 'Direct innerHTML assignment may cause XSS' },
        { pattern: /document\.write\(/, severity: 'medium', message: 'document.write can be unsafe' },
        { pattern: /dangerouslySetInnerHTML/, severity: 'high', message: 'Potential XSS vulnerability' },
        { pattern: /Function\(/, severity: 'critical', message: 'Dynamic function creation is dangerous' },
        { pattern: /\$\{[^}]*\}/, severity: 'medium', message: 'Template literals may need sanitization' },
      ],
      python: [
        { pattern: /exec\(/, severity: 'critical', message: 'exec() can execute arbitrary code' },
        { pattern: /eval\(/, severity: 'critical', message: 'eval() can execute arbitrary code' },
        { pattern: /pickle\.loads/, severity: 'high', message: 'Pickle deserialization can be unsafe' },
        { pattern: /subprocess\.call.*shell=True/, severity: 'high', message: 'Shell=True enables command injection' },
        { pattern: /os\.system/, severity: 'high', message: 'os.system() can be vulnerable to injection' },
      ],
      java: [
        { pattern: /Runtime\.getRuntime\(\)\.exec/, severity: 'high', message: 'Runtime.exec() can be unsafe' },
        { pattern: /PreparedStatement.*\+/, severity: 'high', message: 'Potential SQL injection' },
        { pattern: /\.printStackTrace/, severity: 'low', message: 'Stack traces may expose sensitive info' },
      ]
    };
  }

  /**
   * Initialize the assistant
   */
  async init() {
    if (!this.aiService.isReady()) {
      await this.aiService.init({
        model: 'Phi-2-Q4',
        backend: 'simulated',
      });
    }
    console.log('[SmartCodeAssistant] Initialized');
  }

  /**
   * Complete code based on context
   * @param {string} code - Current code/incomplete code
   * @param {Object} options - Completion options
   * @returns {Promise<string>} Code completion
   */
  async complete(code, options = {}) {
    const language = options.language || this._detectLanguage(code);
    const context = options.context || '';

    const cacheKey = `${code}_${language}_${context}`;
    if (this.completionCache.has(cacheKey)) {
      return this.completionCache.get(cacheKey);
    }

    const prompt = this._buildCompletionPrompt(code, language, context);

    try {
      const completion = await this.aiService.generate(prompt, {
        maxTokens: 100,
        temperature: 0.3,
      });

      const cleaned = this._cleanCompletion(completion);
      this.completionCache.set(cacheKey, cleaned);

      return cleaned;
    } catch (error) {
      console.error('[SmartCodeAssistant] Completion error:', error);
      return '';
    }
  }

  /**
   * Generate a complete function from description
   * @param {string} description - What the function should do
   * @param {string} language - Programming language
   * @returns {Promise<string>} Generated function code
   */
  async generateFunction(description, language = 'javascript') {
    const prompt = `Generate a ${language} function that ${description}.\n\nFunction:\n`;

    try {
      const code = await this.aiService.generate(prompt, {
        maxTokens: 300,
        temperature: 0.4,
      });

      return this._formatCode(code, language);
    } catch (error) {
      console.error('[SmartCodeAssistant] Generation error:', error);
      return `// Failed to generate function:\n// ${description}`;
    }
  }

  /**
   * Explain what code does
   * @param {string} code - Code to explain
   * @returns {Promise<string>} Explanation
   */
  async explain(code) {
    const language = this._detectLanguage(code);
    const prompt = `Explain what this ${language} code does:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nExplanation:`;

    try {
      const explanation = await this.aiService.generate(prompt, {
        maxTokens: 250,
        temperature: 0.5,
      });

      return explanation;
    } catch (error) {
      console.error('[SmartCodeAssistant] Explanation error:', error);
      return 'Failed to generate explanation.';
    }
  }

  /**
   * Analyze code for potential bugs
   * @param {string} code - Code to analyze
   * @returns {Promise<Array>} List of potential bugs
   */
  async analyzeBugs(code) {
    const language = this._detectLanguage(code);
    const prompt = `Analyze this ${language} code for potential bugs, errors, or issues:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nPotential issues:`;

    try {
      const response = await this.aiService.generate(prompt, {
        maxTokens: 300,
        temperature: 0.4,
      });

      return this._parseBugReport(response);
    } catch (error) {
      console.error('[SmartCodeAssistant] Bug analysis error:', error);
      return [];
    }
  }

  /**
   * Suggest code optimizations
   * @param {string} code - Code to optimize
   * @returns {Promise<Array>} Optimization suggestions
   */
  async optimize(code) {
    const language = this._detectLanguage(code);
    const prompt = `Suggest optimizations for this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nOptimizations:`;

    try {
      const response = await this.aiService.generate(prompt, {
        maxTokens: 300,
        temperature: 0.5,
      });

      return this._parseOptimizations(response);
    } catch (error) {
      console.error('[SmartCodeAssistant] Optimization error:', error);
      return [];
    }
  }

  /**
   * Generate documentation for code
   * @param {string} code - Code to document
   * @returns {Promise<string>} Generated documentation
   */
  async document(code) {
    const language = this._detectLanguage(code);
    const prompt = `Generate documentation comments for this ${language} code:\n\n${code}\n\nDocumented code:`;

    try {
      const documented = await this.aiService.generate(prompt, {
        maxTokens: 400,
        temperature: 0.4,
      });

      return documented;
    } catch (error) {
      console.error('[SmartCodeAssistant] Documentation error:', error);
      return code; // Return original code if documentation fails
    }
  }

  /**
   * Convert code between languages
   * @param {string} code - Source code
   * @param {string} sourceLanguage - Source language
   * @param {string} targetLanguage - Target language
   * @returns {Promise<string>} Converted code
   */
  async convert(code, sourceLanguage, targetLanguage) {
    const prompt = `Convert this ${sourceLanguage} code to ${targetLanguage}:\n\n${sourceLanguage}:\n${code}\n\n${targetLanguage}:`;

    try {
      const converted = await this.aiService.generate(prompt, {
        maxTokens: 400,
        temperature: 0.3,
      });

      return this._formatCode(converted, targetLanguage);
    } catch (error) {
      console.error('[SmartCodeAssistant] Conversion error:', error);
      return `// Failed to convert code from ${sourceLanguage} to ${targetLanguage}`;
    }
  }

  /**
   * Generate unit tests for code
   * @param {string} code - Code to test
   * @param {string} framework - Test framework (e.g., 'jest', 'vitest')
   * @returns {Promise<string>} Generated tests
   */
  async generateTests(code, framework = 'vitest') {
    const language = this._detectLanguage(code);
    const prompt = `Generate ${framework} unit tests for this ${language} code:\n\n${code}\n\nTests:`;

    try {
      const tests = await this.aiService.generate(prompt, {
        maxTokens: 400,
        temperature: 0.4,
      });

      return this._formatCode(tests, language);
    } catch (error) {
      console.error('[SmartCodeAssistant] Test generation error:', error);
      return `// Failed to generate tests`;
    }
  }

  /**
   * Analyze code security vulnerabilities
   * @param {string} code - Code to analyze
   * @returns {Promise<Array>} Security issues
   */
  async analyzeSecurityVulnerabilities(code) {
    const language = this._detectLanguage(code);
    const vulnerabilities = [];

    // Pattern-based detection
    const patterns = this.securityPatterns[language] || this.securityPatterns.javascript;
    for (const { pattern, severity, message } of patterns) {
      const matches = code.match(pattern);
      if (matches) {
        vulnerabilities.push({
          type: 'security',
          severity,
          message,
          line: this._findLineNumber(code, matches[0]),
          snippet: matches[0]
        });
      }
    }

    // AI-powered deep analysis
    if (this.aiService.plugins.has('code-analysis')) {
      try {
        const analysis = await this.aiService.executePlugin('code-analysis', code, {
          focus: 'security'
        });
        vulnerabilities.push(...(analysis.issues || []));
      } catch (error) {
        console.error('[SmartCodeAssistant] Plugin analysis error:', error);
      }
    }

    return vulnerabilities;
  }

  /**
   * Calculate code quality metrics
   * @param {string} code - Code to analyze
   * @returns {Object} Quality metrics
   */
  calculateQualityMetrics(code) {
    const language = this._detectLanguage(code);
    const lines = code.split('\n');

    const metrics = {
      totalLines: lines.length,
      codeLines: lines.filter(l => l.trim() && !l.trim().startsWith('//')).length,
      commentLines: lines.filter(l => l.trim().startsWith('//')).length,
      blankLines: lines.filter(l => !l.trim()).length,
      cyclomaticComplexity: this._calculateComplexity(code),
      functionCount: (code.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length,
      classCount: (code.match(/class\s+\w+/g) || []).length,
      averageLineLength: code.split('\n').reduce((sum, line) => sum + line.length, 0) / lines.length,
      maxLineLength: Math.max(...lines.map(l => l.length)),
      maintainabilityIndex: this._calculateMaintainability(code),
      duplicationRisk: this._detectDuplication(code),
    };

    // Calculate quality score (0-100)
    let qualityScore = 100;
    if (metrics.cyclomaticComplexity > 10) qualityScore -= 20;
    if (metrics.averageLineLength > 80) qualityScore -= 10;
    if (metrics.commentLines / metrics.codeLines < 0.1) qualityScore -= 15;
    if (metrics.duplicationRisk > 0.3) qualityScore -= 20;

    metrics.qualityScore = Math.max(0, qualityScore);
    metrics.grade = this._getQualityGrade(metrics.qualityScore);

    this.qualityMetrics.set(Date.now(), metrics);
    return metrics;
  }

  /**
   * Suggest refactoring improvements
   * @param {string} code - Code to refactor
   * @returns {Promise<Array>} Refactoring suggestions
   */
  async suggestRefactoring(code) {
    const language = this._detectLanguage(code);
    const metrics = this.calculateQualityMetrics(code);
    const suggestions = [];

    // Analyze patterns that need refactoring
    if (metrics.cyclomaticComplexity > 10) {
      suggestions.push({
        type: 'complexity',
        priority: 'high',
        message: 'High cyclomatic complexity detected. Consider breaking down complex functions.',
        impact: 'Improves readability and testability'
      });
    }

    if (metrics.duplicationRisk > 0.3) {
      suggestions.push({
        type: 'duplication',
        priority: 'medium',
        message: 'Code duplication detected. Extract common logic into reusable functions.',
        impact: 'Reduces maintenance burden'
      });
    }

    if (code.includes('var ') && language === 'javascript') {
      suggestions.push({
        type: 'modernization',
        priority: 'low',
        message: 'Replace var with let/const for better scoping.',
        impact: 'Prevents scoping bugs'
      });
    }

    // Check for long functions
    const functions = code.split(/function\s+\w+|const\s+\w+\s*=\s*\(/);
    for (const func of functions) {
      const funcLines = func.split('\n').length;
      if (funcLines > 50) {
        suggestions.push({
          type: 'function-size',
          priority: 'medium',
          message: `Function exceeds 50 lines (${funcLines} lines). Consider splitting into smaller functions.`,
          impact: 'Improves maintainability'
        });
      }
    }

    // AI-powered refactoring suggestions
    try {
      const prompt = `Suggest refactoring improvements for this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nRefactoring suggestions:`;
      const aiSuggestions = await this.aiService.generate(prompt, {
        maxTokens: 300,
        temperature: 0.5
      });

      const parsed = this._parseRefactoringSuggestions(aiSuggestions);
      suggestions.push(...parsed);
    } catch (error) {
      console.error('[SmartCodeAssistant] AI refactoring error:', error);
    }

    return suggestions;
  }

  /**
   * Profile code performance characteristics
   * @param {string} code - Code to profile
   * @returns {Object} Performance analysis
   */
  profilePerformance(code) {
    const language = this._detectLanguage(code);

    const profile = {
      timeComplexity: this._estimateTimeComplexity(code),
      spaceComplexity: this._estimateSpaceComplexity(code),
      loopCount: (code.match(/\bfor\b|\bwhile\b/g) || []).length,
      recursionCount: this._detectRecursion(code),
      allocations: this._detectAllocations(code),
      hotspots: [],
      recommendations: []
    };

    // Detect performance hotspots
    if (code.match(/for.*for.*for/s)) {
      profile.hotspots.push({
        type: 'nested-loops',
        severity: 'high',
        message: 'Triple nested loops detected - O(n³) complexity',
        suggestion: 'Consider using hash maps or optimizing algorithm'
      });
    }

    if (profile.recursionCount > 3) {
      profile.hotspots.push({
        type: 'deep-recursion',
        severity: 'medium',
        message: `${profile.recursionCount} recursive calls detected`,
        suggestion: 'Consider iterative approach or memoization'
      });
    }

    // Generate recommendations
    if (profile.timeComplexity.includes('n²') || profile.timeComplexity.includes('n³')) {
      profile.recommendations.push('Consider using more efficient data structures (Map, Set)');
    }

    if (profile.allocations > 5) {
      profile.recommendations.push('High memory allocation detected. Consider object pooling');
    }

    return profile;
  }

  /**
   * Generate code from natural language with AI
   * @param {string} description - Natural language description
   * @param {string} language - Target language
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Generated code
   */
  async generateFromDescription(description, language = 'javascript', options = {}) {
    const examples = options.examples || '';
    const constraints = options.constraints || '';

    let prompt = `Generate ${language} code that ${description}.\n\n`;

    if (constraints) {
      prompt += `Requirements:\n${constraints}\n\n`;
    }

    if (examples) {
      prompt += `Examples:\n${examples}\n\n`;
    }

    prompt += `${language} code:\n`;

    try {
      const code = await this.aiService.generate(prompt, {
        maxTokens: 500,
        temperature: 0.4,
        useRAG: true  // Use knowledge base
      });

      return this._formatCode(code, language);
    } catch (error) {
      console.error('[SmartCodeAssistant] Code generation error:', error);
      return `// Failed to generate code: ${description}`;
    }
  }

  // Private helper methods

  /**
   * Detect programming language from code
   * @private
   */
  _detectLanguage(code) {
    // Simple language detection based on syntax patterns
    if (code.includes('def ') || code.includes('import ') && code.includes(':')) {
      return 'python';
    }
    if (code.includes('function') || code.includes('const ') || code.includes('let ')) {
      return 'javascript';
    }
    if (code.includes('public class') || code.includes('System.out')) {
      return 'java';
    }
    if (code.includes('#include') || code.includes('std::')) {
      return 'cpp';
    }
    if (code.includes('fn ') || code.includes('let mut')) {
      return 'rust';
    }
    if (code.includes('func ') && code.includes('package ')) {
      return 'go';
    }

    return 'javascript'; // Default
  }

  /**
   * Build completion prompt
   * @private
   */
  _buildCompletionPrompt(code, language, context) {
    let prompt = `Complete this ${language} code:\n\n`;

    if (context) {
      prompt += `Context:\n${context}\n\n`;
    }

    prompt += `${code}`;

    return prompt;
  }

  /**
   * Clean completion response
   * @private
   */
  _cleanCompletion(completion) {
    // Remove any markdown code blocks
    let cleaned = completion.replace(/```[a-z]*\n?/g, '');

    // Remove leading/trailing whitespace
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Format code with proper indentation
   * @private
   */
  _formatCode(code, language) {
    // Basic code formatting
    let formatted = code;

    // Remove markdown code blocks if present
    formatted = formatted.replace(/```[a-z]*\n?/g, '');

    // Trim whitespace
    formatted = formatted.trim();

    return formatted;
  }

  /**
   * Parse bug report from AI response
   * @private
   */
  _parseBugReport(response) {
    const bugs = [];
    const lines = response.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.toLowerCase().includes('no issues') || trimmed.toLowerCase().includes('looks good')) {
        continue;
      }

      // Look for numbered items or bullet points
      if (trimmed.match(/^[\d\-\*\•]/)) {
        const bug = trimmed.replace(/^[\d\-\*\•\.\)]\s*/, '');
        if (bug.length > 10) {
          // Filter out very short items
          bugs.push({
            description: bug,
            severity: this._estimateSeverity(bug),
          });
        }
      }
    }

    return bugs.length > 0 ? bugs : [{ description: 'No obvious issues found', severity: 'info' }];
  }

  /**
   * Parse optimization suggestions
   * @private
   */
  _parseOptimizations(response) {
    const optimizations = [];
    const lines = response.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.match(/^[\d\-\*\•]/)) {
        const optimization = trimmed.replace(/^[\d\-\*\•\.\)]\s*/, '');
        if (optimization.length > 10) {
          optimizations.push({
            suggestion: optimization,
            impact: this._estimateImpact(optimization),
          });
        }
      }
    }

    return optimizations.length > 0 ? optimizations : [{ suggestion: 'Code looks well optimized', impact: 'low' }];
  }

  /**
   * Estimate bug severity
   * @private
   */
  _estimateSeverity(bugDescription) {
    const lower = bugDescription.toLowerCase();

    if (lower.includes('error') || lower.includes('crash') || lower.includes('exception')) {
      return 'high';
    }
    if (lower.includes('warning') || lower.includes('potential')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Estimate optimization impact
   * @private
   */
  _estimateImpact(optimization) {
    const lower = optimization.toLowerCase();

    if (lower.includes('algorithm') || lower.includes('complexity') || lower.includes('performance')) {
      return 'high';
    }
    if (lower.includes('cache') || lower.includes('memory')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Find line number of a snippet in code
   * @private
   */
  _findLineNumber(code, snippet) {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(snippet)) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * Calculate cyclomatic complexity
   * @private
   */
  _calculateComplexity(code) {
    const keywords = ['if', 'else', 'for', 'while', 'case', 'catch', '&&', '||', '?'];
    let complexity = 1;

    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Calculate maintainability index
   * @private
   */
  _calculateMaintainability(code) {
    const lines = code.split('\n').length;
    const complexity = this._calculateComplexity(code);
    const commentRatio = (code.match(/\/\//g) || []).length / lines;

    // Simplified maintainability index (0-100)
    let index = 100;
    index -= Math.min(complexity * 2, 40);
    index -= Math.min((lines / 10), 30);
    index += Math.min(commentRatio * 100, 20);

    return Math.max(0, Math.min(100, index));
  }

  /**
   * Detect code duplication
   * @private
   */
  _detectDuplication(code) {
    const lines = code.split('\n').filter(l => l.trim());
    const lineMap = new Map();
    let duplicates = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length < 10) continue; // Skip short lines

      const count = lineMap.get(trimmed) || 0;
      lineMap.set(trimmed, count + 1);

      if (count > 0) {
        duplicates++;
      }
    }

    return duplicates / lines.length;
  }

  /**
   * Get quality grade from score
   * @private
   */
  _getQualityGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Parse refactoring suggestions
   * @private
   */
  _parseRefactoringSuggestions(response) {
    const suggestions = [];
    const lines = response.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^[\d\-\*\•]/)) {
        const suggestion = trimmed.replace(/^[\d\-\*\•\.\)]\s*/, '');
        if (suggestion.length > 15) {
          suggestions.push({
            type: 'ai-suggested',
            priority: 'medium',
            message: suggestion,
            impact: 'Varies'
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Estimate time complexity
   * @private
   */
  _estimateTimeComplexity(code) {
    if (code.match(/for.*for.*for/s)) return 'O(n³)';
    if (code.match(/for.*for/s)) return 'O(n²)';
    if (code.match(/\bfor\b|\bwhile\b/)) return 'O(n)';
    if (code.match(/\brecursive\b/i) || code.includes('return') && code.includes('(')) {
      return 'O(2^n) or O(n log n)';
    }
    return 'O(1)';
  }

  /**
   * Estimate space complexity
   * @private
   */
  _estimateSpaceComplexity(code) {
    const arrayCreations = (code.match(/new Array|new Map|new Set|\[\]/g) || []).length;
    if (arrayCreations > 2) return 'O(n)';
    if (arrayCreations > 0) return 'O(k)';
    return 'O(1)';
  }

  /**
   * Detect recursion
   * @private
   */
  _detectRecursion(code) {
    const functionNames = code.match(/function\s+(\w+)|const\s+(\w+)\s*=/g) || [];
    let recursionCount = 0;

    for (const funcDef of functionNames) {
      const funcName = funcDef.match(/\w+/g)?.[1];
      if (funcName && code.includes(`${funcName}(`)) {
        const funcBody = code.substring(code.indexOf(funcDef));
        if (funcBody.includes(`${funcName}(`)) {
          recursionCount++;
        }
      }
    }

    return recursionCount;
  }

  /**
   * Detect memory allocations
   * @private
   */
  _detectAllocations(code) {
    const patterns = [
      /new\s+\w+/g,
      /new Array/g,
      /new Map/g,
      /new Set/g,
      /\[\]/g,
      /\{\}/g
    ];

    let count = 0;
    for (const pattern of patterns) {
      const matches = code.match(pattern);
      if (matches) count += matches.length;
    }

    return count;
  }

  /**
   * Clear caches
   */
  clearCache() {
    this.completionCache.clear();
    this.qualityMetrics.clear();
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      cachedCompletions: this.completionCache.size,
      supportedLanguages: ['javascript', 'python', 'java', 'cpp', 'rust', 'go'],
      qualityMetricsCount: this.qualityMetrics.size,
      refactoringHistoryCount: this.refactoringHistory.length,
      securityPatterns: Object.keys(this.securityPatterns).length,
    };
  }
}

export default SmartCodeAssistant;
