/**
 * Code Linter - Real-time code quality analysis
 * Provides linting for JavaScript, CSS, HTML, and more
 */

export class CodeLinter {
  constructor(editor) {
    this.editor = editor;
    this.enabled = true;
    this.markers = [];
    this.rules = this.getDefaultRules();
  }

  /**
   * Get default linting rules
   */
  getDefaultRules() {
    return {
      javascript: {
        'no-console': { level: 'warning', message: 'Unexpected console statement' },
        'no-debugger': { level: 'error', message: 'Debugger statement should be removed' },
        'no-var': { level: 'warning', message: 'Use let or const instead of var' },
        'semi': { level: 'error', message: 'Missing semicolon' },
        'quotes': { level: 'warning', message: 'Use single quotes' },
        'no-unused-vars': { level: 'warning', message: 'Variable is declared but never used' },
        'no-undef': { level: 'error', message: 'Variable is not defined' },
        'eqeqeq': { level: 'warning', message: 'Use === instead of ==' },
        'no-trailing-spaces': { level: 'warning', message: 'Trailing whitespace' },
        'indent': { level: 'warning', message: 'Incorrect indentation' },
        'curly': { level: 'warning', message: 'Missing curly braces' },
        'no-eval': { level: 'error', message: 'eval() is dangerous' },
        'camelcase': { level: 'warning', message: 'Use camelCase naming convention' }
      },
      html: {
        'no-duplicate-id': { level: 'error', message: 'Duplicate ID attribute' },
        'alt-require': { level: 'warning', message: 'img tag requires alt attribute' },
        'doctype-first': { level: 'warning', message: 'DOCTYPE should be first' },
        'closing-tags': { level: 'error', message: 'Missing closing tag' },
        'self-closing': { level: 'warning', message: 'Self-closing tag should use />' }
      },
      css: {
        'color-format': { level: 'warning', message: 'Use hex color format' },
        'duplicate-property': { level: 'error', message: 'Duplicate property' },
        'vendor-prefix': { level: 'warning', message: 'Missing vendor prefix' },
        'unit-required': { level: 'error', message: 'Missing unit for non-zero value' }
      }
    };
  }

  /**
   * Lint the current code
   */
  lint(code, language) {
    if (!this.enabled || !code) {
      this.clearMarkers();
      return [];
    }

    const issues = [];

    switch (language) {
      case 'javascript':
      case 'typescript':
        issues.push(...this.lintJavaScript(code));
        break;
      case 'html':
        issues.push(...this.lintHTML(code));
        break;
      case 'css':
        issues.push(...this.lintCSS(code));
        break;
      case 'json':
        issues.push(...this.lintJSON(code));
        break;
    }

    this.updateMarkers(issues);
    return issues;
  }

  /**
   * Lint JavaScript code
   */
  lintJavaScript(code) {
    const issues = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Check for console statements
      if (trimmedLine.match(/console\.(log|warn|error|info)/)) {
        issues.push({
          line: lineNumber,
          column: line.indexOf('console') + 1,
          endColumn: line.indexOf('console') + 8,
          message: this.rules.javascript['no-console'].message,
          severity: this.rules.javascript['no-console'].level,
          rule: 'no-console'
        });
      }

      // Check for debugger
      if (trimmedLine.includes('debugger')) {
        issues.push({
          line: lineNumber,
          column: line.indexOf('debugger') + 1,
          endColumn: line.indexOf('debugger') + 9,
          message: this.rules.javascript['no-debugger'].message,
          severity: this.rules.javascript['no-debugger'].level,
          rule: 'no-debugger'
        });
      }

      // Check for var usage
      if (trimmedLine.match(/\bvar\s+\w+/)) {
        issues.push({
          line: lineNumber,
          column: line.indexOf('var') + 1,
          endColumn: line.indexOf('var') + 4,
          message: this.rules.javascript['no-var'].message,
          severity: this.rules.javascript['no-var'].level,
          rule: 'no-var'
        });
      }

      // Check for == instead of ===
      if (trimmedLine.match(/[^=!<>]==[^=]/)) {
        const pos = line.indexOf('==');
        issues.push({
          line: lineNumber,
          column: pos + 1,
          endColumn: pos + 3,
          message: this.rules.javascript['eqeqeq'].message,
          severity: this.rules.javascript['eqeqeq'].level,
          rule: 'eqeqeq'
        });
      }

      // Check for eval
      if (trimmedLine.includes('eval(')) {
        issues.push({
          line: lineNumber,
          column: line.indexOf('eval') + 1,
          endColumn: line.indexOf('eval') + 5,
          message: this.rules.javascript['no-eval'].message,
          severity: this.rules.javascript['no-eval'].level,
          rule: 'no-eval'
        });
      }

      // Check for trailing spaces
      if (line.match(/\s+$/)) {
        issues.push({
          line: lineNumber,
          column: line.trimEnd().length + 1,
          endColumn: line.length + 1,
          message: this.rules.javascript['no-trailing-spaces'].message,
          severity: this.rules.javascript['no-trailing-spaces'].level,
          rule: 'no-trailing-spaces'
        });
      }

      // Check for missing semicolons (simple check)
      if (trimmedLine.match(/^(const|let|var|return|break|continue)\s+.*[^;{}\s]$/)) {
        issues.push({
          line: lineNumber,
          column: line.length,
          endColumn: line.length + 1,
          message: this.rules.javascript['semi'].message,
          severity: this.rules.javascript['semi'].level,
          rule: 'semi'
        });
      }
    });

    return issues;
  }

  /**
   * Lint HTML code
   */
  lintHTML(code) {
    const issues = [];
    const lines = code.split('\n');
    const idsSeen = new Set();

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for duplicate IDs
      const idMatch = line.match(/id=["']([^"']+)["']/);
      if (idMatch) {
        const id = idMatch[1];
        if (idsSeen.has(id)) {
          issues.push({
            line: lineNumber,
            column: line.indexOf(idMatch[0]) + 1,
            endColumn: line.indexOf(idMatch[0]) + idMatch[0].length + 1,
            message: `Duplicate ID '${id}'`,
            severity: this.rules.html['no-duplicate-id'].level,
            rule: 'no-duplicate-id'
          });
        }
        idsSeen.add(id);
      }

      // Check for img without alt
      if (line.match(/<img[^>]*>/) && !line.match(/alt=/)) {
        issues.push({
          line: lineNumber,
          column: line.indexOf('<img') + 1,
          endColumn: line.indexOf('>') + 2,
          message: this.rules.html['alt-require'].message,
          severity: this.rules.html['alt-require'].level,
          rule: 'alt-require'
        });
      }

      // Check DOCTYPE position
      if (lineNumber === 1 && !line.trim().toUpperCase().startsWith('<!DOCTYPE')) {
        if (line.trim().startsWith('<html')) {
          issues.push({
            line: 1,
            column: 1,
            endColumn: 10,
            message: this.rules.html['doctype-first'].message,
            severity: this.rules.html['doctype-first'].level,
            rule: 'doctype-first'
          });
        }
      }
    });

    return issues;
  }

  /**
   * Lint CSS code
   */
  lintCSS(code) {
    const issues = [];
    const lines = code.split('\n');
    const propertiesSeen = new Map();
    let currentSelector = null;

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();

      // Track current selector
      if (trimmedLine.includes('{')) {
        currentSelector = trimmedLine.split('{')[0].trim();
        propertiesSeen.clear();
      }

      // Check for duplicate properties
      const propMatch = trimmedLine.match(/^([\w-]+)\s*:/);
      if (propMatch) {
        const property = propMatch[1];
        if (propertiesSeen.has(property)) {
          issues.push({
            line: lineNumber,
            column: line.indexOf(property) + 1,
            endColumn: line.indexOf(property) + property.length + 1,
            message: `Duplicate property '${property}'`,
            severity: this.rules.css['duplicate-property'].level,
            rule: 'duplicate-property'
          });
        }
        propertiesSeen.set(property, lineNumber);
      }

      // Check for missing units
      const valueMatch = trimmedLine.match(/:\s*(\d+)\s*;/);
      if (valueMatch && valueMatch[1] !== '0') {
        issues.push({
          line: lineNumber,
          column: line.indexOf(valueMatch[1]) + 1,
          endColumn: line.indexOf(valueMatch[1]) + valueMatch[1].length + 1,
          message: this.rules.css['unit-required'].message,
          severity: this.rules.css['unit-required'].level,
          rule: 'unit-required'
        });
      }
    });

    return issues;
  }

  /**
   * Lint JSON code
   */
  lintJSON(code) {
    const issues = [];

    try {
      JSON.parse(code);
    } catch (error) {
      // Extract line number from error message if possible
      const lineMatch = error.message.match(/position (\d+)/);
      const position = lineMatch ? parseInt(lineMatch[1]) : 0;

      // Count lines up to position
      const beforeError = code.substring(0, position);
      const lineNumber = beforeError.split('\n').length;

      issues.push({
        line: lineNumber,
        column: 1,
        endColumn: 100,
        message: `JSON Parse Error: ${error.message}`,
        severity: 'error',
        rule: 'json-parse'
      });
    }

    return issues;
  }

  /**
   * Update Monaco editor markers
   */
  updateMarkers(issues) {
    if (!this.editor) return;

    const monaco = window.monaco;
    if (!monaco) return;

    const model = this.editor.getModel();
    if (!model) return;

    this.clearMarkers();

    this.markers = issues.map(issue => ({
      startLineNumber: issue.line,
      startColumn: issue.column,
      endLineNumber: issue.line,
      endColumn: issue.endColumn,
      message: issue.message,
      severity: issue.severity === 'error'
        ? monaco.MarkerSeverity.Error
        : monaco.MarkerSeverity.Warning,
      source: 'WebOS Linter'
    }));

    monaco.editor.setModelMarkers(model, 'webos-linter', this.markers);
  }

  /**
   * Clear all markers
   */
  clearMarkers() {
    if (!this.editor) return;

    const monaco = window.monaco;
    if (!monaco) return;

    const model = this.editor.getModel();
    if (!model) return;

    monaco.editor.setModelMarkers(model, 'webos-linter', []);
    this.markers = [];
  }

  /**
   * Enable/disable linter
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.clearMarkers();
    }
  }

  /**
   * Get linting statistics
   */
  getStats(issues) {
    const stats = {
      total: issues.length,
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      byRule: {}
    };

    issues.forEach(issue => {
      if (!stats.byRule[issue.rule]) {
        stats.byRule[issue.rule] = 0;
      }
      stats.byRule[issue.rule]++;
    });

    return stats;
  }

  /**
   * Auto-fix simple issues
   */
  autoFix(code, issues) {
    let fixedCode = code;
    const lines = code.split('\n');

    // Sort issues by line number (descending) to maintain positions
    const sortedIssues = [...issues].sort((a, b) => b.line - a.line);

    sortedIssues.forEach(issue => {
      const lineIndex = issue.line - 1;
      let line = lines[lineIndex];

      switch (issue.rule) {
        case 'no-trailing-spaces':
          lines[lineIndex] = line.trimEnd();
          break;

        case 'semi':
          lines[lineIndex] = line.trimEnd() + ';';
          break;

        case 'no-var':
          lines[lineIndex] = line.replace(/\bvar\b/, 'const');
          break;

        case 'eqeqeq':
          lines[lineIndex] = line.replace(/([^=!<>])==([^=])/, '$1===$2');
          break;
      }
    });

    return lines.join('\n');
  }

  /**
   * Get fixable issues count
   */
  getFixableCount(issues) {
    const fixableRules = ['no-trailing-spaces', 'semi', 'no-var', 'eqeqeq'];
    return issues.filter(i => fixableRules.includes(i.rule)).length;
  }

  /**
   * Cleanup
   */
  destroy() {
    this.clearMarkers();
  }
}
