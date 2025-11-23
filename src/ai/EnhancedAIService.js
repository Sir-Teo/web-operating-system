/**
 * EnhancedAIService - State-of-the-art AI service integration
 *
 * Integrates all advanced AI features:
 * - Conversational memory with context tracking
 * - Proactive suggestion engine
 * - Workflow automation
 * - Advanced code analysis
 * - Semantic search
 * - Learning from user patterns
 */

import AIService from './AIService.js';
import ConversationalMemory from './ConversationalMemory.js';
import ProactiveSuggestionEngine from './ProactiveSuggestionEngine.js';
import WorkflowAutomation from './WorkflowAutomation.js';
import AdvancedCodeAnalyzer from './AdvancedCodeAnalyzer.js';

export class EnhancedAIService {
  constructor() {
    this.baseService = AIService;

    // Advanced features
    this.memory = new ConversationalMemory();
    this.suggestionEngine = new ProactiveSuggestionEngine();
    this.workflowEngine = new WorkflowAutomation();
    this.codeAnalyzer = new AdvancedCodeAnalyzer();

    // Feature flags
    this.features = {
      memory: true,
      proactiveSuggestions: true,
      workflowAutomation: true,
      advancedCodeAnalysis: true,
      learning: true
    };

    // Load persisted memory
    this._loadMemory();
  }

  /**
   * Initialize all services
   */
  async init(config = {}) {
    await this.baseService.init(config);

    // Enable features based on config
    if (config.features) {
      this.features = { ...this.features, ...config.features };
    }

    console.log('[EnhancedAIService] Initialized with advanced features');
    return true;
  }

  /**
   * Enhanced generate with memory and context
   */
  async generate(query, options = {}) {
    // Resolve references using memory
    const resolvedQuery = this.features.memory ?
      this.memory.resolveReferences(query) : query;

    // Get personalized system prompt
    const systemPrompt = this.features.memory ?
      this.memory.getPersonalizedPrompt() : null;

    // Generate response using base service
    const response = await this.baseService.generate(resolvedQuery, {
      ...options,
      systemPrompt
    });

    // Process with memory
    if (this.features.memory) {
      const intent = this._extractIntent(resolvedQuery);
      await this.memory.processMessage(resolvedQuery, response, {
        intent,
        context: options.context
      });

      // Save memory periodically
      this._saveMemory();
    }

    return response;
  }

  /**
   * Enhanced chat with conversation memory
   */
  async chat(messages, options = {}) {
    let enhancedMessages = messages;

    // Add conversation context from memory
    if (this.features.memory) {
      const context = this.memory.getRelevantContext();
      enhancedMessages = this._enrichMessagesWithContext(messages, context);
    }

    // Get response from base service
    const response = await this.baseService.chat(enhancedMessages, options);

    // Update memory
    if (this.features.memory && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const intent = this._extractIntent(lastMessage.content);

      await this.memory.processMessage(lastMessage.content, response, {
        intent,
        context: options.context
      });
    }

    return response;
  }

  /**
   * Get proactive suggestions
   */
  async getProactiveSuggestions(context = {}) {
    if (!this.features.proactiveSuggestions) {
      return [];
    }

    // Enrich context with memory
    if (this.features.memory) {
      context.memory = this.memory.getRelevantContext();
    }

    // Update OS context
    await this.updateOSContext(context);

    // Generate suggestions
    const suggestions = await this.suggestionEngine.generateSuggestions(context);

    return suggestions;
  }

  /**
   * Create and execute workflow
   */
  async createWorkflow(description, options = {}) {
    if (!this.features.workflowAutomation) {
      throw new Error('Workflow automation is disabled');
    }

    // Create workflow from description
    const workflow = await this.workflowEngine.createWorkflowFromDescription(description);

    // Auto-execute if requested
    if (options.autoExecute) {
      const execution = await this.workflowEngine.executeWorkflow(workflow.id, {
        onProgress: options.onProgress,
        executor: options.executor
      });

      return { workflow, execution };
    }

    return { workflow };
  }

  /**
   * Execute existing workflow
   */
  async executeWorkflow(workflowId, options = {}) {
    if (!this.features.workflowAutomation) {
      throw new Error('Workflow automation is disabled');
    }

    return await this.workflowEngine.executeWorkflow(workflowId, options);
  }

  /**
   * Analyze code with advanced analysis
   */
  async analyzeCode(code, language = 'javascript', options = {}) {
    if (!this.features.advancedCodeAnalysis) {
      // Fall back to basic analysis
      return await this.baseService.executePlugin('code-analysis', code, options);
    }

    // Use advanced analyzer
    const analysis = await this.codeAnalyzer.analyze(code, language, options);

    // Learn from code style if enabled
    if (this.features.learning && this.features.memory) {
      this._learnFromCodeAnalysis(analysis);
    }

    return analysis;
  }

  /**
   * Smart code completion with context awareness
   */
  async suggestCodeCompletion(code, cursor, context = {}) {
    // Extract current context
    const beforeCursor = code.substring(0, cursor);
    const afterCursor = code.substring(cursor);

    // Detect what user is trying to write
    const intent = this._detectCodeIntent(beforeCursor);

    // Get suggestions based on intent
    const suggestions = await this._generateCodeSuggestions(intent, beforeCursor, afterCursor, context);

    return suggestions;
  }

  /**
   * Intelligent file search
   */
  async searchFiles(query, context = {}) {
    // Use base service with enhanced query
    const enhancedQuery = this.features.memory ?
      this.memory.resolveReferences(query) : query;

    // Build search query
    const searchPrompt = `Search for files: ${enhancedQuery}`;

    const response = await this.baseService.generate(searchPrompt, {
      context,
      useRAG: true
    });

    return response;
  }

  /**
   * Generate intelligent response with all features
   */
  async smartResponse(query, context = {}) {
    // Get proactive suggestions first
    let suggestions = [];
    if (this.features.proactiveSuggestions) {
      suggestions = await this.getProactiveSuggestions(context);
    }

    // Generate main response
    const response = await this.generate(query, { context });

    // Get follow-up actions if applicable
    const followUp = this.features.memory ?
      this.memory.suggestNextActions() : [];

    return {
      response,
      suggestions,
      followUp,
      conversation: this.features.memory ?
        this.memory.getConversationSummary() : null
    };
  }

  /**
   * Update OS context for all engines
   */
  async updateOSContext(context) {
    // Update base service
    this.baseService.updateOSContext(context);

    // Update deterministic engine
    const engine = this.baseService.getEngine();
    if (engine) {
      engine.updateOSContext(context);
    }
  }

  /**
   * Get conversation history with memory
   */
  getConversationHistory() {
    if (this.features.memory) {
      return {
        base: this.baseService.conversationHistory,
        enhanced: this.memory.getConversationSummary(),
        context: this.memory.getRelevantContext()
      };
    }

    return {
      base: this.baseService.conversationHistory
    };
  }

  /**
   * Clear conversation with memory
   */
  clearConversation() {
    this.baseService.clearHistory();

    if (this.features.memory) {
      this.memory.clearShortTerm();
    }
  }

  /**
   * Reset all AI state
   */
  resetAll() {
    this.baseService.clearHistory();
    this.baseService.clearCache();

    if (this.features.memory) {
      this.memory.clearAll();
    }

    if (this.features.proactiveSuggestions) {
      this.suggestionEngine.clearHistory();
    }
  }

  /**
   * Get AI statistics and insights
   */
  getStatistics() {
    const stats = {
      base: this.baseService.getPerformanceMetrics()
    };

    if (this.features.memory) {
      stats.memory = {
        conversations: this.memory.metadata.totalInteractions,
        skillLevel: this.memory.longTermMemory.skillLevel,
        preferences: Object.fromEntries(this.memory.longTermMemory.userPreferences),
        summary: this.memory.getConversationSummary()
      };
    }

    if (this.features.proactiveSuggestions) {
      stats.suggestions = this.suggestionEngine.getStatistics();
    }

    if (this.features.workflowAutomation) {
      stats.workflows = {
        total: this.workflowEngine.listWorkflows().length,
        active: this.workflowEngine.getActiveWorkflows().length,
        executed: this.workflowEngine.getHistory().length
      };
    }

    return stats;
  }

  /**
   * Record suggestion feedback
   */
  recordSuggestionFeedback(suggestionId, action) {
    if (this.features.proactiveSuggestions) {
      this.suggestionEngine.recordFeedback(suggestionId, action);
    }
  }

  /**
   * Get workflow templates
   */
  getWorkflowTemplates() {
    if (!this.features.workflowAutomation) {
      return [];
    }

    return this.workflowEngine.listTemplates();
  }

  /**
   * Export user profile and preferences
   */
  exportProfile() {
    const profile = {
      memory: this.features.memory ? this.memory.export() : null,
      statistics: this.getStatistics(),
      features: this.features,
      exportDate: new Date().toISOString()
    };

    return profile;
  }

  /**
   * Import user profile
   */
  importProfile(profile) {
    if (profile.memory && this.features.memory) {
      this.memory.import(profile.memory);
    }

    if (profile.features) {
      this.features = { ...this.features, ...profile.features };
    }

    this._saveMemory();
  }

  // ========== Private Helper Methods ==========

  /**
   * Extract intent from query
   */
  _extractIntent(query) {
    const engine = this.baseService.getEngine();
    if (engine) {
      const normalized = query.toLowerCase();
      const intent = engine._detectIntent(normalized);
      return intent.type;
    }
    return 'unknown';
  }

  /**
   * Enrich messages with context
   */
  _enrichMessagesWithContext(messages, context) {
    if (!context || messages.length === 0) {
      return messages;
    }

    // Add context as a system message
    const contextMessage = {
      role: 'system',
      content: `Context: Current topic is ${context.currentTopic}. User skill level: ${context.skillLevel}.`
    };

    return [contextMessage, ...messages];
  }

  /**
   * Learn from code analysis
   */
  _learnFromCodeAnalysis(analysis) {
    // Track programming language preferences
    if (analysis.language) {
      this.memory.longTermMemory.programmingLanguages.add(analysis.language);
    }

    // Track code style preferences
    if (analysis.quality && analysis.quality.grade) {
      const styleKey = `code_style_${analysis.language}`;
      this.memory.longTermMemory.userPreferences.set(styleKey, {
        grade: analysis.quality.grade,
        preferredPatterns: analysis.structure
      });
    }
  }

  /**
   * Detect code intent
   */
  _detectCodeIntent(code) {
    if (/function\s+\w+/.test(code)) return 'function-declaration';
    if (/class\s+\w+/.test(code)) return 'class-declaration';
    if (/import\s+/.test(code)) return 'import-statement';
    if (/if\s*\(/.test(code)) return 'conditional';
    if (/for\s*\(/.test(code)) return 'loop';
    return 'general';
  }

  /**
   * Generate code suggestions
   */
  async _generateCodeSuggestions(intent, before, after, context) {
    const suggestions = [];

    // Context-aware suggestions based on intent
    switch (intent) {
      case 'function-declaration':
        suggestions.push({
          text: '{\n  // TODO: Implement function\n}',
          description: 'Function body template'
        });
        break;

      case 'class-declaration':
        suggestions.push({
          text: '{\n  constructor() {\n    // TODO: Initialize\n  }\n}',
          description: 'Class body with constructor'
        });
        break;

      case 'import-statement':
        suggestions.push({
          text: "from '@/components'",
          description: 'Common import pattern'
        });
        break;
    }

    return suggestions;
  }

  /**
   * Load memory from storage
   */
  async _loadMemory() {
    try {
      const stored = localStorage.getItem('webos_ai_memory');
      if (stored) {
        const data = JSON.parse(stored);
        this.memory.import(data);
        console.log('[EnhancedAIService] Memory loaded from storage');
      }
    } catch (error) {
      console.error('[EnhancedAIService] Failed to load memory:', error);
    }
  }

  /**
   * Save memory to storage
   */
  _saveMemory() {
    try {
      const data = this.memory.export();
      localStorage.setItem('webos_ai_memory', JSON.stringify(data));
    } catch (error) {
      console.error('[EnhancedAIService] Failed to save memory:', error);
    }
  }

  /**
   * Check if ready
   */
  isReady() {
    return this.baseService.isReady();
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      base: this.baseService.getStatus(),
      features: this.features,
      memory: this.features.memory ? {
        interactions: this.memory.metadata.totalInteractions,
        skillLevel: this.memory.longTermMemory.skillLevel
      } : null
    };
  }
}

// Create singleton instance
const enhancedAI = new EnhancedAIService();

export default enhancedAI;
