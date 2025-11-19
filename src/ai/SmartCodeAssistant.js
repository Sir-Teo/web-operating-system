/**
 * SmartCodeAssistant - AI-powered code assistance
 *
 * Provides code completion, generation, explanation, bug detection,
 * and optimization suggestions.
 */

import AIService from './AIService.js';

export class SmartCodeAssistant {
  constructor(aiService = null) {
    this.aiService = aiService || AIService;
    this.completionCache = new Map();
    this.languageContexts = new Map();
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
   * Clear caches
   */
  clearCache() {
    this.completionCache.clear();
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      cachedCompletions: this.completionCache.size,
      supportedLanguages: ['javascript', 'python', 'java', 'cpp', 'rust', 'go'],
    };
  }
}

export default SmartCodeAssistant;
