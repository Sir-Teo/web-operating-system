/**
 * AdvancedCodeAnalyzer - Sophisticated code analysis engine
 *
 * Features:
 * - Multi-language support (JavaScript, Python, Java, etc.)
 * - Code quality metrics (complexity, maintainability)
 * - Security vulnerability detection
 * - Performance optimization suggestions
 * - Best practice recommendations
 * - Code smell detection
 * - Dependency analysis
 * - Documentation coverage
 */

export class AdvancedCodeAnalyzer {
  constructor() {
    this.languageParsers = this._buildLanguageParsers();
    this.securityRules = this._buildSecurityRules();
    this.bestPractices = this._buildBestPractices();
    this.performancePatterns = this._buildPerformancePatterns();
  }

  /**
   * Analyze code comprehensively
   */
  async analyze(code, language = 'javascript', options = {}) {
    const analysis = {
      language,
      timestamp: Date.now(),
      metrics: {},
      issues: [],
      suggestions: [],
      security: [],
      performance: [],
      quality: {},
      summary: {}
    };

    // Detect language if not provided
    if (!language || language === 'auto') {
      language = this._detectLanguage(code);
      analysis.language = language;
    }

    // Get parser for language
    const parser = this.languageParsers[language] || this.languageParsers['javascript'];

    // Parse code structure
    const structure = parser.parse(code);
    analysis.structure = structure;

    // Calculate metrics
    analysis.metrics = this._calculateMetrics(code, structure, language);

    // Analyze quality
    analysis.quality = this._analyzeQuality(code, structure, language);

    // Security analysis
    analysis.security = this._analyzeSecurity(code, language);

    // Performance analysis
    analysis.performance = this._analyzePerformance(code, structure, language);

    // Best practices check
    analysis.suggestions = this._checkBestPractices(code, structure, language);

    // Code smells detection
    analysis.smells = this._detectCodeSmells(code, structure, language);

    // Generate summary
    analysis.summary = this._generateSummary(analysis);

    return analysis;
  }

  /**
   * Build language parsers
   */
  _buildLanguageParsers() {
    return {
      javascript: {
        parse: (code) => this._parseJavaScript(code),
        extensions: ['js', 'jsx', 'ts', 'tsx']
      },
      python: {
        parse: (code) => this._parsePython(code),
        extensions: ['py']
      },
      java: {
        parse: (code) => this._parseJava(code),
        extensions: ['java']
      },
      cpp: {
        parse: (code) => this._parseCpp(code),
        extensions: ['cpp', 'cc', 'cxx', 'hpp']
      }
    };
  }

  /**
   * Parse JavaScript/TypeScript code
   */
  _parseJavaScript(code) {
    const structure = {
      functions: [],
      classes: [],
      imports: [],
      exports: [],
      variables: [],
      comments: [],
      async: false,
      modules: false
    };

    // Extract functions
    const functionRegex = /(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/g;
    let match;

    while ((match = functionRegex.exec(code)) !== null) {
      const name = match[1] || match[3];
      const params = (match[2] || match[4] || '').split(',').filter(p => p.trim());

      structure.functions.push({
        name,
        params,
        async: /async/.test(match[0]),
        arrow: match[0].includes('=>'),
        line: code.substring(0, match.index).split('\n').length
      });
    }

    // Extract classes
    const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?\s*{/g;
    while ((match = classRegex.exec(code)) !== null) {
      structure.classes.push({
        name: match[1],
        extends: match[2],
        line: code.substring(0, match.index).split('\n').length
      });
    }

    // Extract imports
    const importRegex = /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
    while ((match = importRegex.exec(code)) !== null) {
      structure.imports.push({
        imports: match[1] ? match[1].split(',').map(s => s.trim()) : [match[2]],
        from: match[3],
        line: code.substring(0, match.index).split('\n').length
      });
    }

    // Extract variables
    const varRegex = /(const|let|var)\s+(\w+)\s*=/g;
    while ((match = varRegex.exec(code)) !== null) {
      structure.variables.push({
        name: match[2],
        type: match[1],
        line: code.substring(0, match.index).split('\n').length
      });
    }

    // Extract comments
    const commentRegex = /\/\/.*$|\/\*[\s\S]*?\*\//gm;
    while ((match = commentRegex.exec(code)) !== null) {
      structure.comments.push({
        text: match[0],
        multiline: match[0].startsWith('/*'),
        line: code.substring(0, match.index).split('\n').length
      });
    }

    structure.async = /async|await/.test(code);
    structure.modules = structure.imports.length > 0 || /export/.test(code);

    return structure;
  }

  /**
   * Parse Python code
   */
  _parsePython(code) {
    const structure = {
      functions: [],
      classes: [],
      imports: [],
      variables: [],
      comments: [],
      async: false
    };

    // Extract functions
    const functionRegex = /(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\):/g;
    let match;

    while ((match = functionRegex.exec(code)) !== null) {
      const name = match[1];
      const params = match[2].split(',').map(p => p.trim()).filter(p => p);

      structure.functions.push({
        name,
        params,
        async: /async/.test(match[0]),
        line: code.substring(0, match.index).split('\n').length
      });
    }

    // Extract classes
    const classRegex = /class\s+(\w+)(?:\(([^)]+)\))?:/g;
    while ((match = classRegex.exec(code)) !== null) {
      structure.classes.push({
        name: match[1],
        inherits: match[2] ? match[2].split(',').map(s => s.trim()) : [],
        line: code.substring(0, match.index).split('\n').length
      });
    }

    // Extract imports
    const importRegex = /(?:from\s+(\S+)\s+)?import\s+(.+)/g;
    while ((match = importRegex.exec(code)) !== null) {
      structure.imports.push({
        from: match[1],
        imports: match[2].split(',').map(s => s.trim()),
        line: code.substring(0, match.index).split('\n').length
      });
    }

    // Extract comments
    const commentRegex = /#.*$|'''[\s\S]*?'''|"""[\s\S]*?"""/gm;
    while ((match = commentRegex.exec(code)) !== null) {
      structure.comments.push({
        text: match[0],
        docstring: match[0].startsWith('"""') || match[0].startsWith("'''"),
        line: code.substring(0, match.index).split('\n').length
      });
    }

    structure.async = /async|await/.test(code);

    return structure;
  }

  /**
   * Parse Java code
   */
  _parseJava(code) {
    const structure = {
      classes: [],
      methods: [],
      imports: [],
      variables: [],
      comments: []
    };

    // Extract classes
    const classRegex = /(?:public|private|protected)?\s*class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?\s*{/g;
    let match;

    while ((match = classRegex.exec(code)) !== null) {
      structure.classes.push({
        name: match[1],
        extends: match[2],
        implements: match[3] ? match[3].split(',').map(s => s.trim()) : [],
        line: code.substring(0, match.index).split('\n').length
      });
    }

    // Extract methods
    const methodRegex = /(?:public|private|protected)?\s*(?:static\s+)?(?:\w+)\s+(\w+)\s*\(([^)]*)\)/g;
    while ((match = methodRegex.exec(code)) !== null) {
      structure.methods.push({
        name: match[1],
        params: match[2].split(',').map(p => p.trim()).filter(p => p),
        static: /static/.test(match[0]),
        line: code.substring(0, match.index).split('\n').length
      });
    }

    // Extract imports
    const importRegex = /import\s+(?:static\s+)?([\w.]+);/g;
    while ((match = importRegex.exec(code)) !== null) {
      structure.imports.push({
        path: match[1],
        static: /static/.test(match[0]),
        line: code.substring(0, match.index).split('\n').length
      });
    }

    return structure;
  }

  /**
   * Parse C++ code
   */
  _parseCpp(code) {
    const structure = {
      functions: [],
      classes: [],
      includes: [],
      namespaces: []
    };

    // Extract includes
    const includeRegex = /#include\s*[<"]([^>"]+)[>"]/g;
    let match;

    while ((match = includeRegex.exec(code)) !== null) {
      structure.includes.push({
        path: match[1],
        system: match[0].includes('<'),
        line: code.substring(0, match.index).split('\n').length
      });
    }

    // Extract classes
    const classRegex = /class\s+(\w+)(?:\s*:\s*(?:public|private|protected)\s+(\w+))?\s*{/g;
    while ((match = classRegex.exec(code)) !== null) {
      structure.classes.push({
        name: match[1],
        inherits: match[2],
        line: code.substring(0, match.index).split('\n').length
      });
    }

    // Extract functions
    const functionRegex = /(\w+)\s+(\w+)\s*\(([^)]*)\)/g;
    while ((match = functionRegex.exec(code)) !== null) {
      if (!match[0].includes('if') && !match[0].includes('while') && !match[0].includes('for')) {
        structure.functions.push({
          returnType: match[1],
          name: match[2],
          params: match[3].split(',').map(p => p.trim()).filter(p => p),
          line: code.substring(0, match.index).split('\n').length
        });
      }
    }

    // Extract namespaces
    const nsRegex = /namespace\s+(\w+)/g;
    while ((match = nsRegex.exec(code)) !== null) {
      structure.namespaces.push({
        name: match[1],
        line: code.substring(0, match.index).split('\n').length
      });
    }

    return structure;
  }

  /**
   * Calculate code metrics
   */
  _calculateMetrics(code, structure, language) {
    const lines = code.split('\n');

    const metrics = {
      loc: lines.length, // Lines of code
      sloc: lines.filter(l => l.trim() && !l.trim().startsWith('//')).length, // Source LOC
      comments: structure.comments?.length || 0,
      functions: structure.functions?.length || structure.methods?.length || 0,
      classes: structure.classes?.length || 0,
      complexity: this._calculateComplexity(code),
      maintainability: 0,
      commentRatio: 0,
      avgFunctionLength: 0,
      maxNesting: this._calculateMaxNesting(code)
    };

    // Comment ratio
    const commentLines = structure.comments?.reduce((sum, c) =>
      sum + c.text.split('\n').length, 0
    ) || 0;
    metrics.commentRatio = metrics.loc > 0 ? (commentLines / metrics.loc) * 100 : 0;

    // Average function length
    if (metrics.functions > 0) {
      metrics.avgFunctionLength = Math.round(metrics.sloc / metrics.functions);
    }

    // Maintainability index (simplified)
    metrics.maintainability = this._calculateMaintainability(metrics);

    return metrics;
  }

  /**
   * Calculate cyclomatic complexity
   */
  _calculateComplexity(code) {
    const keywords = [
      /\bif\b/g, /\belse\b/g, /\bfor\b/g, /\bwhile\b/g,
      /\bcase\b/g, /\bcatch\b/g, /\b&&\b/g, /\b\|\|\b/g,
      /\?\s*.*\s*:/g  // Ternary operator
    ];

    let complexity = 1; // Base complexity

    for (const pattern of keywords) {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Calculate maximum nesting depth
   */
  _calculateMaxNesting(code) {
    let maxDepth = 0;
    let currentDepth = 0;

    for (const char of code) {
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth--;
      }
    }

    return maxDepth;
  }

  /**
   * Calculate maintainability index
   */
  _calculateMaintainability(metrics) {
    // Simplified maintainability index formula
    const volume = metrics.sloc * Math.log2(metrics.sloc + 1);
    const complexity = metrics.complexity;

    let index = 171 - 5.2 * Math.log(volume) - 0.23 * complexity;

    if (metrics.commentRatio > 10) {
      index += 10; // Bonus for good commenting
    }

    return Math.max(0, Math.min(100, index));
  }

  /**
   * Analyze code quality
   */
  _analyzeQuality(code, structure, language) {
    const quality = {
      score: 0,
      grade: 'F',
      factors: {}
    };

    // Naming conventions
    quality.factors.naming = this._checkNamingConventions(structure, language);

    // Function length
    quality.factors.functionLength = this._checkFunctionLength(code, structure);

    // Nesting depth
    quality.factors.nesting = this._checkNesting(code);

    // Code duplication
    quality.factors.duplication = this._checkDuplication(code);

    // Documentation
    quality.factors.documentation = this._checkDocumentation(code, structure);

    // Calculate overall score
    const factors = Object.values(quality.factors);
    quality.score = factors.reduce((sum, f) => sum + f.score, 0) / factors.length;

    // Assign grade
    if (quality.score >= 90) quality.grade = 'A';
    else if (quality.score >= 80) quality.grade = 'B';
    else if (quality.score >= 70) quality.grade = 'C';
    else if (quality.score >= 60) quality.grade = 'D';
    else quality.grade = 'F';

    return quality;
  }

  /**
   * Check naming conventions
   */
  _checkNamingConventions(structure, language) {
    const conventions = {
      javascript: {
        functions: /^[a-z][a-zA-Z0-9]*$/, // camelCase
        classes: /^[A-Z][a-zA-Z0-9]*$/, // PascalCase
        variables: /^[a-z][a-zA-Z0-9]*$/  // camelCase
      },
      python: {
        functions: /^[a-z][a-z0-9_]*$/, // snake_case
        classes: /^[A-Z][a-zA-Z0-9]*$/, // PascalCase
        variables: /^[a-z][a-z0-9_]*$/  // snake_case
      },
      java: {
        methods: /^[a-z][a-zA-Z0-9]*$/, // camelCase
        classes: /^[A-Z][a-zA-Z0-9]*$/, // PascalCase
        variables: /^[a-z][a-zA-Z0-9]*$/  // camelCase
      }
    };

    const langConventions = conventions[language] || conventions['javascript'];
    let violations = 0;
    let total = 0;

    // Check functions/methods
    const functions = structure.functions || structure.methods || [];
    for (const func of functions) {
      total++;
      if (!langConventions.functions?.test(func.name) &&
          !langConventions.methods?.test(func.name)) {
        violations++;
      }
    }

    // Check classes
    for (const cls of (structure.classes || [])) {
      total++;
      if (!langConventions.classes?.test(cls.name)) {
        violations++;
      }
    }

    const score = total > 0 ? ((total - violations) / total) * 100 : 100;

    return {
      score,
      violations,
      total,
      message: violations > 0 ?
        `${violations} naming convention violations found` :
        'Naming conventions followed correctly'
    };
  }

  /**
   * Check function length
   */
  _checkFunctionLength(code, structure) {
    const functions = structure.functions || structure.methods || [];
    let longFunctions = 0;

    for (const func of functions) {
      // Estimate function length (simplified)
      const functionCode = code.substring(
        code.indexOf(func.name),
        code.indexOf('}', code.indexOf(func.name) + func.name.length)
      );

      const lines = functionCode.split('\n').length;
      if (lines > 50) {
        longFunctions++;
      }
    }

    const score = functions.length > 0 ?
      ((functions.length - longFunctions) / functions.length) * 100 : 100;

    return {
      score,
      longFunctions,
      message: longFunctions > 0 ?
        `${longFunctions} functions exceed 50 lines` :
        'Functions are appropriately sized'
    };
  }

  /**
   * Check nesting depth
   */
  _checkNesting(code) {
    const maxDepth = this._calculateMaxNesting(code);
    const score = Math.max(0, 100 - (maxDepth - 3) * 20);

    return {
      score,
      maxDepth,
      message: maxDepth > 4 ?
        `Maximum nesting depth of ${maxDepth} is too high` :
        'Nesting depth is acceptable'
    };
  }

  /**
   * Check code duplication
   */
  _checkDuplication(code) {
    const lines = code.split('\n');
    const duplicates = new Set();
    const lineMap = new Map();

    // Find duplicate lines (simplified)
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.length < 10) continue; // Skip short lines

      if (lineMap.has(trimmed)) {
        duplicates.add(trimmed);
      } else {
        lineMap.set(trimmed, i);
      }
    }

    const duplicationRate = (duplicates.size / lines.length) * 100;
    const score = Math.max(0, 100 - duplicationRate * 5);

    return {
      score,
      duplicateLines: duplicates.size,
      duplicationRate,
      message: duplicates.size > 0 ?
        `${duplicates.size} duplicate code blocks found` :
        'No significant code duplication'
    };
  }

  /**
   * Check documentation coverage
   */
  _checkDocumentation(code, structure) {
    const functions = structure.functions || structure.methods || [];
    const comments = structure.comments || [];

    // Check if functions have associated comments
    let documented = 0;

    for (const func of functions) {
      const hasDoc = comments.some(comment =>
        Math.abs(comment.line - func.line) <= 2
      );

      if (hasDoc) documented++;
    }

    const score = functions.length > 0 ?
      (documented / functions.length) * 100 : 100;

    return {
      score,
      documented,
      total: functions.length,
      message: score < 50 ?
        `Only ${documented}/${functions.length} functions are documented` :
        'Good documentation coverage'
    };
  }

  /**
   * Build security rules
   */
  _buildSecurityRules() {
    return [
      {
        id: 'sql-injection',
        severity: 'critical',
        pattern: /query\s*\(\s*["'`]\s*SELECT.*?\+|query\s*\(\s*`\s*SELECT.*?\$\{/i,
        message: 'Potential SQL injection vulnerability',
        fix: 'Use parameterized queries or prepared statements'
      },
      {
        id: 'xss',
        severity: 'high',
        pattern: /innerHTML\s*=|document\.write\(|eval\(/,
        message: 'Potential XSS vulnerability',
        fix: 'Use textContent instead of innerHTML, avoid eval()'
      },
      {
        id: 'hardcoded-secrets',
        severity: 'critical',
        pattern: /(password|secret|api[_-]?key|token)\s*=\s*["'][^"']{8,}["']/i,
        message: 'Hardcoded secrets detected',
        fix: 'Use environment variables or secure configuration'
      },
      {
        id: 'insecure-random',
        severity: 'medium',
        pattern: /Math\.random\(\)/,
        message: 'Math.random() is not cryptographically secure',
        fix: 'Use crypto.getRandomValues() for security-sensitive operations'
      },
      {
        id: 'unsafe-regex',
        severity: 'medium',
        pattern: /new RegExp\([^)]*\+/,
        message: 'Dynamically constructed regex can cause ReDoS',
        fix: 'Avoid user input in regex patterns'
      }
    ];
  }

  /**
   * Analyze security
   */
  _analyzeSecurity(code, language) {
    const issues = [];

    for (const rule of this.securityRules) {
      const matches = code.match(rule.pattern);
      if (matches) {
        issues.push({
          id: rule.id,
          severity: rule.severity,
          message: rule.message,
          fix: rule.fix,
          occurrences: matches.length
        });
      }
    }

    return issues;
  }

  /**
   * Build best practices
   */
  _buildBestPractices() {
    return [
      {
        id: 'use-const',
        language: 'javascript',
        pattern: /\bvar\s+/g,
        message: 'Use const or let instead of var',
        suggestion: 'Replace var with const (or let if reassignment needed)'
      },
      {
        id: 'arrow-functions',
        language: 'javascript',
        pattern: /function\s*\([^)]*\)\s*{/g,
        message: 'Consider using arrow functions for better readability',
        suggestion: 'Use arrow functions: () => {}'
      },
      {
        id: 'strict-equality',
        language: 'javascript',
        pattern: /[^=!]==[^=]|[^=!]!=[^=]/g,
        message: 'Use strict equality (=== and !==)',
        suggestion: 'Replace == with === and != with !=='
      },
      {
        id: 'async-await',
        language: 'javascript',
        pattern: /\.then\(/g,
        message: 'Consider using async/await instead of promise chains',
        suggestion: 'Use async/await for better readability'
      }
    ];
  }

  /**
   * Check best practices
   */
  _checkBestPractices(code, structure, language) {
    const suggestions = [];

    for (const practice of this.bestPractices) {
      if (practice.language && practice.language !== language) continue;

      const matches = code.match(practice.pattern);
      if (matches) {
        suggestions.push({
          id: practice.id,
          message: practice.message,
          suggestion: practice.suggestion,
          occurrences: matches.length
        });
      }
    }

    return suggestions;
  }

  /**
   * Build performance patterns
   */
  _buildPerformancePatterns() {
    return [
      {
        id: 'inefficient-loop',
        pattern: /for\s*\([^)]*\.length[^)]*\)\s*{/,
        message: 'Loop condition recalculates length on each iteration',
        optimization: 'Cache array length in a variable'
      },
      {
        id: 'nested-loop',
        pattern: /for[^{]*{[^}]*for[^{]*{/,
        message: 'Nested loops can cause O(n²) complexity',
        optimization: 'Consider using a hash map or Set for better performance'
      },
      {
        id: 'synchronous-io',
        pattern: /readFileSync|writeFileSync/,
        message: 'Synchronous file operations block the event loop',
        optimization: 'Use async file operations instead'
      }
    ];
  }

  /**
   * Analyze performance
   */
  _analyzePerformance(code, structure, language) {
    const issues = [];

    for (const pattern of this.performancePatterns) {
      const matches = code.match(pattern.pattern);
      if (matches) {
        issues.push({
          id: pattern.id,
          message: pattern.message,
          optimization: pattern.optimization,
          occurrences: matches.length
        });
      }
    }

    return issues;
  }

  /**
   * Detect code smells
   */
  _detectCodeSmells(code, structure, language) {
    const smells = [];

    // Long method
    const functions = structure.functions || structure.methods || [];
    for (const func of functions) {
      // Estimate function length (simplified)
      const estimate = code.split('\n').length / (functions.length || 1);
      if (estimate > 50) {
        smells.push({
          type: 'long-method',
          severity: 'medium',
          message: `Function '${func.name}' is likely too long`,
          suggestion: 'Break down into smaller, focused functions'
        });
      }
    }

    // God class
    if (structure.classes && structure.classes.length > 0) {
      const methodsPerClass = (structure.functions?.length || 0) / structure.classes.length;
      if (methodsPerClass > 20) {
        smells.push({
          type: 'god-class',
          severity: 'high',
          message: 'Class has too many methods',
          suggestion: 'Split into multiple smaller, focused classes'
        });
      }
    }

    // Magic numbers
    const magicNumbers = code.match(/\b\d{2,}\b/g);
    if (magicNumbers && magicNumbers.length > 5) {
      smells.push({
        type: 'magic-numbers',
        severity: 'low',
        message: `Found ${magicNumbers.length} magic numbers`,
        suggestion: 'Extract magic numbers into named constants'
      });
    }

    // Too many parameters
    for (const func of functions) {
      if (func.params && func.params.length > 5) {
        smells.push({
          type: 'too-many-parameters',
          severity: 'medium',
          message: `Function '${func.name}' has ${func.params.length} parameters`,
          suggestion: 'Consider using an options object or builder pattern'
        });
      }
    }

    return smells;
  }

  /**
   * Generate analysis summary
   */
  _generateSummary(analysis) {
    const issues = [
      ...analysis.security,
      ...analysis.performance,
      ...analysis.smells
    ];

    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;

    return {
      grade: analysis.quality.grade,
      score: Math.round(analysis.quality.score),
      maintainability: Math.round(analysis.metrics.maintainability),
      complexity: analysis.metrics.complexity,
      totalIssues: issues.length,
      criticalIssues,
      highIssues,
      mediumIssues,
      recommendations: this._generateRecommendations(analysis)
    };
  }

  /**
   * Generate recommendations
   */
  _generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.quality.score < 70) {
      recommendations.push({
        priority: 'high',
        message: 'Code quality is below acceptable levels',
        action: 'Focus on refactoring and improving code structure'
      });
    }

    if (analysis.metrics.complexity > 20) {
      recommendations.push({
        priority: 'high',
        message: 'Code complexity is too high',
        action: 'Break down complex functions into smaller units'
      });
    }

    if (analysis.security.length > 0) {
      recommendations.push({
        priority: 'critical',
        message: `${analysis.security.length} security issues found`,
        action: 'Address security vulnerabilities immediately'
      });
    }

    if (analysis.quality.factors.documentation.score < 50) {
      recommendations.push({
        priority: 'medium',
        message: 'Documentation coverage is low',
        action: 'Add comments and documentation to functions'
      });
    }

    return recommendations;
  }

  /**
   * Detect programming language
   */
  _detectLanguage(code) {
    const indicators = {
      javascript: [/function\s+\w+/, /const\s+\w+\s*=/, /let\s+\w+\s*=/, /=>/],
      python: [/def\s+\w+/, /import\s+\w+/, /class\s+\w+:/],
      java: [/public\s+class/, /public\s+static\s+void\s+main/, /System\.out\.println/],
      cpp: [/#include\s*</, /std::/, /cout\s*<</]
    };

    const scores = {};

    for (const [lang, patterns] of Object.entries(indicators)) {
      scores[lang] = patterns.filter(pattern => pattern.test(code)).length;
    }

    const detected = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    return detected && detected[1] > 0 ? detected[0] : 'javascript';
  }
}

export default AdvancedCodeAnalyzer;
