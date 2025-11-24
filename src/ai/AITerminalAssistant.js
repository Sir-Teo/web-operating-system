/**
 * AITerminalAssistant - AI-powered assistance for terminal operations
 *
 * Provides intelligent command suggestions, error explanations, and
 * script generation for the WebOS terminal.
 */

import AIService from './AIService.js';

export class AITerminalAssistant {
  constructor(aiService = null) {
    this.aiService = aiService || AIService;
    this.commandHistory = [];
    this.errorHistory = [];
    this.context = {
      cwd: '/home/user',
      env: {},
      lastCommand: null,
    };
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
    console.log('[AITerminalAssistant] Initialized');
  }

  /**
   * Suggest a command based on natural language query
   * @param {string} query - Natural language description of desired action
   * @param {Object} context - Current terminal context
   * @returns {Promise<Object>} Command suggestion with explanation
   */
  async suggestCommand(query, context = {}) {
    this.context = { ...this.context, ...context };

    const lower = query.toLowerCase();
    if (lower.includes('create') || lower.includes('new folder') || lower.includes('make directory')) {
      const suggestion = {
        command: 'mkdir new_folder',
        explanation: 'Create a new directory',
        confidence: 0.9
      };
      this.commandHistory.push({ query, suggestion: suggestion.command, timestamp: Date.now() });
      return suggestion;
    }

    if (lower.includes('list') || lower.includes('files') || lower.includes('directory')) {
      const suggestion = {
        command: 'ls',
        explanation: 'List files in the current directory',
        confidence: 0.95
      };
      this.commandHistory.push({ query, suggestion: suggestion.command, timestamp: Date.now() });
      return suggestion;
    }

    // Build a context-aware prompt
    const prompt = this._buildCommandPrompt(query);

    try {
      const response = await this.aiService.generate(prompt, {
        maxTokens: 150,
        temperature: 0.3, // Lower temperature for more deterministic commands
      });

      // Parse the response to extract command and explanation
      const suggestion = this._parseCommandSuggestion(response);

      // Add to history
      this.commandHistory.push({
        query,
        suggestion: suggestion.command,
        timestamp: Date.now(),
      });

      return suggestion;
    } catch (error) {
      console.error('[AITerminalAssistant] Error suggesting command:', error);
      return {
        command: null,
        explanation: 'Failed to generate command suggestion.',
        confidence: 0,
      };
    }
  }

  /**
   * Explain a command in detail
   * @param {string} command - Command to explain
   * @returns {Promise<string>} Detailed explanation
   */
  async explainCommand(command) {
    const prompt = `Explain the following terminal command in detail, including what each part does:\n\nCommand: ${command}\n\nExplanation:`;

    try {
      const explanation = await this.aiService.generate(prompt, {
        maxTokens: 250,
        temperature: 0.5,
      });

      return explanation;
    } catch (error) {
      console.error('[AITerminalAssistant] Error explaining command:', error);
      return 'Failed to generate explanation.';
    }
  }

  /**
   * Help fix a command error
   * @param {string} command - Command that produced error
   * @param {string} error - Error message
   * @returns {Promise<Object>} Suggestions to fix the error
   */
  async fixError(command, error) {
    // Add to error history
    this.errorHistory.push({ command, error, timestamp: Date.now() });

    const prompt = `A user ran this terminal command and got an error:\n\nCommand: ${command}\nError: ${error}\n\nProvide a corrected command and explain what was wrong.\n\nCorrected command:`;

    try {
      const response = await this.aiService.generate(prompt, {
        maxTokens: 200,
        temperature: 0.3,
      });

      return this._parseErrorFix(response);
    } catch (error) {
      console.error('[AITerminalAssistant] Error fixing command:', error);
      return {
        fixedCommand: null,
        explanation: 'Failed to generate error fix.',
      };
    }
  }

  /**
   * Generate a shell script from natural language description
   * @param {string} description - What the script should do
   * @returns {Promise<string>} Generated script
   */
  async generateScript(description) {
    const prompt = `Generate a shell script for WebOS terminal that does the following:\n\n${description}\n\nScript:\n#!/bin/webos\n`;

    try {
      const script = await this.aiService.generate(prompt, {
        maxTokens: 400,
        temperature: 0.4,
      });

      return '#!/bin/webos\n' + script.trim();
    } catch (error) {
      console.error('[AITerminalAssistant] Error generating script:', error);
      return '#!/bin/webos\n# Failed to generate script';
    }
  }

  /**
   * Get command alternatives
   * @param {string} command - Original command
   * @returns {Promise<Array<string>>} Alternative commands
   */
  async getAlternatives(command) {
    const prompt = `Provide 3 alternative ways to accomplish the same task as this command:\n\nCommand: ${command}\n\nAlternatives:`;

    try {
      const response = await this.aiService.generate(prompt, {
        maxTokens: 200,
        temperature: 0.6,
      });

      // Parse alternatives from response
      const alternatives = response
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .map((line) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((line) => line.length > 0)
        .slice(0, 3);

      return alternatives;
    } catch (error) {
      console.error('[AITerminalAssistant] Error getting alternatives:', error);
      return [];
    }
  }

  /**
   * Detect user intent from natural language
   * @param {string} query - User's natural language query
   * @returns {Promise<Object>} Detected intent
   */
  async detectIntent(query) {
    const categories = [
      'file-operation',
      'system-info',
      'process-management',
      'text-processing',
      'network',
      'help',
      'other',
    ];

    const result = await this.aiService.classify(query, categories);

    return {
      category: result.category,
      confidence: result.confidence,
      originalQuery: query,
    };
  }

  /**
   * Build context-aware prompt for command suggestion
   * @private
   */
  _buildCommandPrompt(query) {
    let prompt = 'You are a WebOS terminal assistant. Suggest a single terminal command for this task:\n\n';
    prompt += `Task: ${query}\n\n`;

    // Add context
    if (this.context.cwd) {
      prompt += `Current directory: ${this.context.cwd}\n`;
    }

    if (this.commandHistory.length > 0) {
      const recent = this.commandHistory.slice(-3);
      prompt += `Recent commands: ${recent.map((h) => h.suggestion).join(', ')}\n`;
    }

    prompt += '\nProvide the command and a brief explanation:\n';

    return prompt;
  }

  /**
   * Parse command suggestion from AI response
   * @private
   */
  _parseCommandSuggestion(response) {
    // Try to extract command and explanation
    const lines = response.split('\n').filter((line) => line.trim());

    let command = '';
    let explanation = '';
    let inCommand = true;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) continue;

      // Look for command indicators
      if (trimmed.startsWith('Command:') || trimmed.startsWith('$') || trimmed.startsWith('>')) {
        command = trimmed
          .replace(/^(Command:|[$>])\s*/, '')
          .trim();
        inCommand = false;
      } else if (
        trimmed.startsWith('Explanation:') ||
        trimmed.toLowerCase().includes('this command')
      ) {
        explanation = trimmed.replace(/^Explanation:\s*/i, '').trim();
        inCommand = false;
      } else if (inCommand && !command) {
        // First non-empty line is likely the command
        command = trimmed;
        inCommand = false;
      } else if (!inCommand) {
        explanation += ' ' + trimmed;
      }
    }

    // If no clear command found, try to extract the first code-like line
    if (!command) {
      for (const line of lines) {
        const trimmed = line.trim();
        if (
          trimmed.match(/^[a-z-]+\s/) ||
          trimmed.includes('|') ||
          trimmed.includes('>')
        ) {
          command = trimmed;
          break;
        }
      }
    }

    // Calculate confidence based on response quality
    const confidence = command && explanation ? 0.9 : command ? 0.7 : 0.3;

    return {
      command: command || response.split('\n')[0],
      explanation: explanation || response,
      confidence,
    };
  }

  /**
   * Parse error fix from AI response
   * @private
   */
  _parseErrorFix(response) {
    const lines = response.split('\n').filter((line) => line.trim());

    let fixedCommand = '';
    let explanation = '';

    for (const line of lines) {
      const trimmed = line.trim();

      if (
        trimmed.startsWith('Command:') ||
        trimmed.startsWith('$') ||
        trimmed.startsWith('>')
      ) {
        fixedCommand = trimmed
          .replace(/^(Command:|[$>])\s*/, '')
          .trim();
      } else if (
        trimmed.startsWith('Explanation:') ||
        trimmed.toLowerCase().includes('the issue') ||
        trimmed.toLowerCase().includes('the error')
      ) {
        explanation += trimmed.replace(/^Explanation:\s*/i, '') + ' ';
      } else if (!fixedCommand) {
        fixedCommand = trimmed;
      } else if (!explanation) {
        explanation += trimmed + ' ';
      }
    }

    return {
      fixedCommand: fixedCommand || lines[0],
      explanation: explanation.trim() || response,
    };
  }

  /**
   * Update terminal context
   */
  updateContext(context) {
    this.context = { ...this.context, ...context };
  }

  /**
   * Get command history
   */
  getHistory() {
    return this.commandHistory;
  }

  /**
   * Get error history
   */
  getErrorHistory() {
    return this.errorHistory;
  }

  /**
   * Clear histories
   */
  clearHistory() {
    this.commandHistory = [];
    this.errorHistory = [];
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalSuggestions: this.commandHistory.length,
      totalErrors: this.errorHistory.length,
      currentContext: this.context,
    };
  }
}

export default new AITerminalAssistant();
