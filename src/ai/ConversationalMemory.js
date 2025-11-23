/**
 * ConversationalMemory - Advanced memory system for AI conversations
 *
 * Features:
 * - Multi-turn context tracking with semantic understanding
 * - User preference learning and adaptation
 * - Entity tracking across conversations
 * - Conversation summarization and compression
 * - Long-term memory with persistence
 * - Context-aware response enhancement
 */

export class ConversationalMemory {
  constructor() {
    // Short-term memory (current session)
    this.shortTermMemory = {
      currentTopic: null,
      recentEntities: new Map(), // Track mentioned entities
      conversationFlow: [], // Track conversation progression
      userIntent: null,
      lastActions: []
    };

    // Long-term memory (persistent across sessions)
    this.longTermMemory = {
      userPreferences: new Map(),
      frequentTasks: new Map(),
      skillLevel: 'intermediate', // beginner, intermediate, advanced
      programmingLanguages: new Set(),
      commonPatterns: new Map(),
      favoriteCommands: new Map(),
      recentProjects: []
    };

    // Working memory (current conversation)
    this.workingMemory = {
      activeContext: {},
      pendingTasks: [],
      references: new Map(), // "that file", "this code", etc.
      assumptions: []
    };

    // Memory metadata
    this.metadata = {
      sessionStart: Date.now(),
      totalInteractions: 0,
      lastInteraction: null,
      conversationId: this._generateConversationId()
    };
  }

  /**
   * Process a new user message and update memory
   */
  async processMessage(userMessage, aiResponse, metadata = {}) {
    this.metadata.totalInteractions++;
    this.metadata.lastInteraction = Date.now();

    // Extract and track entities
    const entities = this._extractEntities(userMessage);
    this._updateEntityTracking(entities);

    // Detect topic and update conversation flow
    const topic = this._detectTopic(userMessage, metadata.intent);
    this._updateConversationFlow(topic, userMessage, aiResponse);

    // Update references (this, that, it, etc.)
    this._updateReferences(userMessage, aiResponse, entities);

    // Learn from user patterns
    await this._learnFromInteraction(userMessage, metadata);

    // Update working context
    this._updateWorkingContext(metadata);

    return {
      topic,
      entities,
      context: this.getRelevantContext()
    };
  }

  /**
   * Get relevant context for the current conversation
   */
  getRelevantContext() {
    const context = {
      currentTopic: this.shortTermMemory.currentTopic,
      recentEntities: Array.from(this.shortTermMemory.recentEntities.entries()).slice(-10),
      userPreferences: Object.fromEntries(this.longTermMemory.userPreferences),
      skillLevel: this.longTermMemory.skillLevel,
      references: Object.fromEntries(this.workingMemory.references),
      conversationFlow: this.shortTermMemory.conversationFlow.slice(-5),
      pendingTasks: this.workingMemory.pendingTasks
    };

    return context;
  }

  /**
   * Extract entities from text (files, commands, languages, etc.)
   */
  _extractEntities(text) {
    const entities = {
      files: [],
      commands: [],
      languages: [],
      numbers: [],
      paths: [],
      variables: [],
      applications: []
    };

    // Extract file references
    const fileMatches = text.match(/[\w-]+\.(js|py|java|cpp|html|css|json|txt|md|pdf|png|jpg)/gi);
    if (fileMatches) {
      entities.files = [...new Set(fileMatches)];
    }

    // Extract paths
    const pathMatches = text.match(/(?:\/[\w-]+)+/g);
    if (pathMatches) {
      entities.paths = [...new Set(pathMatches)];
    }

    // Extract common commands
    const commandWords = ['ls', 'cd', 'mkdir', 'rm', 'cp', 'mv', 'cat', 'grep', 'find', 'ps', 'kill'];
    entities.commands = commandWords.filter(cmd =>
      new RegExp(`\\b${cmd}\\b`, 'i').test(text)
    );

    // Extract programming languages
    const languages = ['javascript', 'python', 'java', 'cpp', 'c++', 'rust', 'go', 'typescript'];
    entities.languages = languages.filter(lang =>
      text.toLowerCase().includes(lang)
    );

    // Extract numbers (could be PIDs, line numbers, etc.)
    const numberMatches = text.match(/\b\d+\b/g);
    if (numberMatches) {
      entities.numbers = numberMatches.map(n => parseInt(n));
    }

    // Extract variable/function names (camelCase or snake_case)
    const variableMatches = text.match(/\b[a-z][a-zA-Z0-9_]*\b/g);
    if (variableMatches) {
      entities.variables = [...new Set(variableMatches)].slice(0, 10);
    }

    return entities;
  }

  /**
   * Update entity tracking with decay
   */
  _updateEntityTracking(entities) {
    const now = Date.now();

    // Add new entities with timestamp
    for (const [type, items] of Object.entries(entities)) {
      for (const item of items) {
        const key = `${type}:${item}`;
        this.shortTermMemory.recentEntities.set(key, {
          type,
          value: item,
          timestamp: now,
          mentions: (this.shortTermMemory.recentEntities.get(key)?.mentions || 0) + 1
        });
      }
    }

    // Remove old entities (older than 10 minutes)
    const decayTime = 10 * 60 * 1000;
    for (const [key, entity] of this.shortTermMemory.recentEntities.entries()) {
      if (now - entity.timestamp > decayTime) {
        this.shortTermMemory.recentEntities.delete(key);
      }
    }
  }

  /**
   * Detect conversation topic
   */
  _detectTopic(message, intent) {
    const topics = {
      'file-management': /file|folder|directory|organize|search|find|create|delete/i,
      'coding': /code|function|class|bug|debug|implement|write|program/i,
      'system': /process|system|memory|cpu|performance|status/i,
      'command-help': /command|how do i|help|explain|what does/i,
      'learning': /learn|teach|tutorial|guide|how to/i,
      'troubleshooting': /error|problem|issue|fix|broken|doesn't work/i,
      'optimization': /optimize|improve|faster|better|performance/i,
      'automation': /automate|script|batch|workflow/i
    };

    for (const [topic, pattern] of Object.entries(topics)) {
      if (pattern.test(message)) {
        return topic;
      }
    }

    return intent?.split('.')[0] || 'general';
  }

  /**
   * Update conversation flow tracking
   */
  _updateConversationFlow(topic, userMessage, aiResponse) {
    this.shortTermMemory.currentTopic = topic;

    this.shortTermMemory.conversationFlow.push({
      topic,
      userQuery: userMessage.substring(0, 100),
      timestamp: Date.now(),
      hasCode: /```/.test(aiResponse),
      hasCommand: /`[^`]+`/.test(aiResponse)
    });

    // Keep only last 20 exchanges
    if (this.shortTermMemory.conversationFlow.length > 20) {
      this.shortTermMemory.conversationFlow =
        this.shortTermMemory.conversationFlow.slice(-20);
    }
  }

  /**
   * Update reference tracking (this, that, it, etc.)
   */
  _updateReferences(userMessage, aiResponse, entities) {
    // Extract and store references from AI response
    const codeBlocks = aiResponse.match(/```[\s\S]*?```/g) || [];
    const commands = aiResponse.match(/`([^`]+)`/g) || [];

    if (codeBlocks.length > 0) {
      this.workingMemory.references.set('last_code', codeBlocks[codeBlocks.length - 1]);
      this.workingMemory.references.set('this_code', codeBlocks[codeBlocks.length - 1]);
    }

    if (commands.length > 0) {
      this.workingMemory.references.set('last_command', commands[commands.length - 1]);
      this.workingMemory.references.set('that_command', commands[commands.length - 1]);
    }

    if (entities.files.length > 0) {
      this.workingMemory.references.set('that_file', entities.files[entities.files.length - 1]);
      this.workingMemory.references.set('this_file', entities.files[entities.files.length - 1]);
    }

    if (entities.paths.length > 0) {
      this.workingMemory.references.set('that_path', entities.paths[entities.paths.length - 1]);
    }

    // Clear old references (keep only last 10)
    if (this.workingMemory.references.size > 10) {
      const entries = Array.from(this.workingMemory.references.entries());
      this.workingMemory.references = new Map(entries.slice(-10));
    }
  }

  /**
   * Learn from user interactions to improve future responses
   */
  async _learnFromInteraction(userMessage, metadata) {
    const lowerMessage = userMessage.toLowerCase();

    // Learn programming language preferences
    const languages = ['javascript', 'python', 'java', 'rust', 'go', 'typescript'];
    for (const lang of languages) {
      if (lowerMessage.includes(lang)) {
        this.longTermMemory.programmingLanguages.add(lang);
      }
    }

    // Track frequent tasks
    if (metadata.intent) {
      const taskCount = this.longTermMemory.frequentTasks.get(metadata.intent) || 0;
      this.longTermMemory.frequentTasks.set(metadata.intent, taskCount + 1);
    }

    // Detect skill level based on query complexity
    this._assessSkillLevel(userMessage, metadata);

    // Learn user preferences from explicit statements
    this._extractPreferences(userMessage);

    // Track common patterns
    this._trackPatterns(userMessage);
  }

  /**
   * Assess user skill level based on queries
   */
  _assessSkillLevel(message, metadata) {
    const lowerMessage = message.toLowerCase();

    // Advanced indicators
    const advancedIndicators = [
      'async', 'await', 'promise', 'closure', 'prototype',
      'regex', 'algorithm', 'optimize', 'complexity',
      'architecture', 'design pattern', 'refactor'
    ];

    // Beginner indicators
    const beginnerIndicators = [
      'how do i', 'what is', 'help me', 'i don\'t know',
      'basics', 'simple', 'easy way', 'tutorial'
    ];

    const advancedScore = advancedIndicators.filter(term =>
      lowerMessage.includes(term)
    ).length;

    const beginnerScore = beginnerIndicators.filter(term =>
      lowerMessage.includes(term)
    ).length;

    if (advancedScore > beginnerScore && advancedScore >= 2) {
      this.longTermMemory.skillLevel = 'advanced';
    } else if (beginnerScore > advancedScore) {
      this.longTermMemory.skillLevel = 'beginner';
    } else {
      this.longTermMemory.skillLevel = 'intermediate';
    }
  }

  /**
   * Extract user preferences from explicit statements
   */
  _extractPreferences(message) {
    const lowerMessage = message.toLowerCase();

    // Verbosity preference
    if (lowerMessage.includes('explain in detail') || lowerMessage.includes('verbose')) {
      this.longTermMemory.userPreferences.set('verbosity', 'detailed');
    } else if (lowerMessage.includes('brief') || lowerMessage.includes('concise')) {
      this.longTermMemory.userPreferences.set('verbosity', 'concise');
    }

    // Code style preference
    if (lowerMessage.includes('comments') || lowerMessage.includes('documented')) {
      this.longTermMemory.userPreferences.set('codeStyle', 'documented');
    } else if (lowerMessage.includes('no comments') || lowerMessage.includes('clean code')) {
      this.longTermMemory.userPreferences.set('codeStyle', 'clean');
    }

    // Terminal preference
    if (lowerMessage.includes('gui') || lowerMessage.includes('visual')) {
      this.longTermMemory.userPreferences.set('interface', 'gui');
    } else if (lowerMessage.includes('terminal') || lowerMessage.includes('command line')) {
      this.longTermMemory.userPreferences.set('interface', 'cli');
    }
  }

  /**
   * Track usage patterns
   */
  _trackPatterns(message) {
    // Track time of day patterns
    const hour = new Date().getHours();
    const timeSlot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

    const patternKey = `time_${timeSlot}`;
    const count = this.longTermMemory.commonPatterns.get(patternKey) || 0;
    this.longTermMemory.commonPatterns.set(patternKey, count + 1);

    // Track query length patterns
    const lengthCategory = message.length < 20 ? 'short' :
                          message.length < 100 ? 'medium' : 'long';
    const lengthKey = `query_${lengthCategory}`;
    const lengthCount = this.longTermMemory.commonPatterns.get(lengthKey) || 0;
    this.longTermMemory.commonPatterns.set(lengthKey, lengthCount + 1);
  }

  /**
   * Update working context
   */
  _updateWorkingContext(metadata) {
    if (metadata.context) {
      this.workingMemory.activeContext = {
        ...this.workingMemory.activeContext,
        ...metadata.context
      };
    }
  }

  /**
   * Resolve pronouns and references using memory
   */
  resolveReferences(query) {
    let resolvedQuery = query;

    // Map of pronouns to potential references
    const referenceMap = {
      'this file': this.workingMemory.references.get('this_file'),
      'that file': this.workingMemory.references.get('that_file'),
      'this code': this.workingMemory.references.get('this_code'),
      'that command': this.workingMemory.references.get('that_command'),
      'last command': this.workingMemory.references.get('last_command'),
      'it': this._getMostRecentReference(),
      'them': this._getMostRecentReference(),
      'this': this._getMostRecentReference()
    };

    for (const [pronoun, reference] of Object.entries(referenceMap)) {
      if (reference && resolvedQuery.toLowerCase().includes(pronoun)) {
        resolvedQuery = resolvedQuery.replace(
          new RegExp(pronoun, 'gi'),
          reference
        );
      }
    }

    return resolvedQuery;
  }

  /**
   * Get most recent reference
   */
  _getMostRecentReference() {
    const refs = Array.from(this.workingMemory.references.values());
    return refs.length > 0 ? refs[refs.length - 1] : null;
  }

  /**
   * Get personalized system prompt based on user history
   */
  getPersonalizedPrompt() {
    let prompt = 'You are an intelligent AI assistant for WebOS. ';

    // Adjust based on skill level
    if (this.longTermMemory.skillLevel === 'beginner') {
      prompt += 'Provide clear, detailed explanations with examples. Avoid technical jargon. ';
    } else if (this.longTermMemory.skillLevel === 'advanced') {
      prompt += 'Provide concise, technical responses. Assume knowledge of advanced concepts. ';
    } else {
      prompt += 'Balance technical accuracy with clear explanations. ';
    }

    // Add language preferences
    if (this.longTermMemory.programmingLanguages.size > 0) {
      const languages = Array.from(this.longTermMemory.programmingLanguages);
      prompt += `The user prefers: ${languages.join(', ')}. `;
    }

    // Add verbosity preference
    const verbosity = this.longTermMemory.userPreferences.get('verbosity');
    if (verbosity === 'detailed') {
      prompt += 'Provide comprehensive, detailed responses with multiple examples. ';
    } else if (verbosity === 'concise') {
      prompt += 'Keep responses brief and to the point. ';
    }

    // Add current topic context
    if (this.shortTermMemory.currentTopic) {
      prompt += `Current topic: ${this.shortTermMemory.currentTopic}. `;
    }

    return prompt;
  }

  /**
   * Get conversation summary
   */
  getConversationSummary() {
    const topicCounts = {};
    for (const item of this.shortTermMemory.conversationFlow) {
      topicCounts[item.topic] = (topicCounts[item.topic] || 0) + 1;
    }

    const dominantTopic = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'general';

    return {
      dominantTopic,
      totalExchanges: this.shortTermMemory.conversationFlow.length,
      topics: topicCounts,
      recentEntities: Array.from(this.shortTermMemory.recentEntities.values()),
      skillLevel: this.longTermMemory.skillLevel,
      duration: Date.now() - this.metadata.sessionStart
    };
  }

  /**
   * Suggest next actions based on conversation history
   */
  suggestNextActions() {
    const suggestions = [];
    const topic = this.shortTermMemory.currentTopic;
    const flow = this.shortTermMemory.conversationFlow;

    // Based on current topic
    if (topic === 'file-management') {
      suggestions.push({
        action: 'organize_files',
        description: 'Organize files in current directory',
        confidence: 0.8
      });
      suggestions.push({
        action: 'search_files',
        description: 'Search for specific files',
        confidence: 0.7
      });
    } else if (topic === 'coding') {
      suggestions.push({
        action: 'run_tests',
        description: 'Run tests for your code',
        confidence: 0.75
      });
      suggestions.push({
        action: 'analyze_code',
        description: 'Analyze code quality',
        confidence: 0.8
      });
    } else if (topic === 'troubleshooting') {
      suggestions.push({
        action: 'check_logs',
        description: 'Check system logs for errors',
        confidence: 0.85
      });
    }

    // Based on pending tasks
    for (const task of this.workingMemory.pendingTasks) {
      suggestions.push({
        action: 'complete_task',
        description: `Complete: ${task}`,
        confidence: 0.9
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Export memory state for persistence
   */
  export() {
    return {
      longTermMemory: {
        userPreferences: Object.fromEntries(this.longTermMemory.userPreferences),
        frequentTasks: Object.fromEntries(this.longTermMemory.frequentTasks),
        skillLevel: this.longTermMemory.skillLevel,
        programmingLanguages: Array.from(this.longTermMemory.programmingLanguages),
        commonPatterns: Object.fromEntries(this.longTermMemory.commonPatterns),
        favoriteCommands: Object.fromEntries(this.longTermMemory.favoriteCommands)
      },
      metadata: this.metadata
    };
  }

  /**
   * Import memory state from persistence
   */
  import(data) {
    if (data.longTermMemory) {
      this.longTermMemory.userPreferences = new Map(
        Object.entries(data.longTermMemory.userPreferences || {})
      );
      this.longTermMemory.frequentTasks = new Map(
        Object.entries(data.longTermMemory.frequentTasks || {})
      );
      this.longTermMemory.skillLevel = data.longTermMemory.skillLevel || 'intermediate';
      this.longTermMemory.programmingLanguages = new Set(
        data.longTermMemory.programmingLanguages || []
      );
      this.longTermMemory.commonPatterns = new Map(
        Object.entries(data.longTermMemory.commonPatterns || {})
      );
      this.longTermMemory.favoriteCommands = new Map(
        Object.entries(data.longTermMemory.favoriteCommands || {})
      );
    }

    if (data.metadata) {
      this.metadata = { ...this.metadata, ...data.metadata };
    }
  }

  /**
   * Clear short-term memory (start fresh conversation)
   */
  clearShortTerm() {
    this.shortTermMemory = {
      currentTopic: null,
      recentEntities: new Map(),
      conversationFlow: [],
      userIntent: null,
      lastActions: []
    };

    this.workingMemory = {
      activeContext: {},
      pendingTasks: [],
      references: new Map(),
      assumptions: []
    };

    this.metadata.conversationId = this._generateConversationId();
  }

  /**
   * Clear all memory
   */
  clearAll() {
    this.clearShortTerm();

    this.longTermMemory = {
      userPreferences: new Map(),
      frequentTasks: new Map(),
      skillLevel: 'intermediate',
      programmingLanguages: new Set(),
      commonPatterns: new Map(),
      favoriteCommands: new Map(),
      recentProjects: []
    };
  }

  /**
   * Generate conversation ID
   */
  _generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default ConversationalMemory;
