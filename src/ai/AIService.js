/**
 * AIService - Core AI service for WebOS
 *
 * Provides AI capabilities including text generation, chat completion,
 * code assistance, and more. In production, this would integrate with
 * WebLLM or similar browser-based AI frameworks.
 *
 * Enhanced features:
 * - Advanced conversation management with context windows
 * - RAG (Retrieval-Augmented Generation) support
 * - Plugin system for extensibility
 * - Multi-modal support (text, code, images)
 * - Performance monitoring and optimization
 * - Advanced caching strategies
 */

import DeterministicAIEngine from './DeterministicAIEngine.js';

export class AIService {
  constructor() {
    this.initialized = false;
    this.model = null;
    this.config = null;
    this.backend = null;
    this.cache = new Map();
    this.conversationHistory = [];
    this.systemPrompt = 'You are a highly intelligent AI assistant integrated into WebOS, a browser-based operating system. You excel at file management, coding, system operations, problem-solving, and providing helpful, detailed responses.';

    // Advanced features
    this.contextWindow = 4096; // Maximum tokens in context
    this.knowledgeBase = new Map(); // RAG knowledge base
    this.plugins = new Map(); // Plugin registry
    this.performanceMetrics = {
      totalRequests: 0,
      cacheHits: 0,
      averageResponseTime: 0,
      errors: 0
    };
    this.requestQueue = [];
    this.maxQueueSize = 100;

    // Multi-modal support
    this.supportedModalities = ['text', 'code', 'image', 'document'];
    this.modalityHandlers = new Map();

    // Conversation summarization for long contexts
    this.conversationSummaries = [];
    this.summaryThreshold = 10; // Summarize after 10 messages

    // Deterministic AI Engine for OS-aware intelligent responses
    this.deterministicEngine = new DeterministicAIEngine();
  }

  /**
   * Initialize the AI service
   * @param {Object} config - Configuration options
   * @param {string} config.model - Model name (e.g., 'Phi-2-Q4')
   * @param {string} config.backend - Backend to use ('webgpu', 'wasm', 'simulated')
   * @param {boolean} config.cache - Enable response caching
   * @param {boolean} config.rag - Enable RAG capabilities
   * @param {number} config.contextWindow - Maximum context window size
   */
  async init(config = {}) {
    this.config = {
      model: config.model || 'TinyLlama-1.1B-Q4',
      backend: config.backend || 'simulated',
      cache: config.cache !== false,
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 512,
      rag: config.rag !== false,
      contextWindow: config.contextWindow || 4096,
      enablePlugins: config.enablePlugins !== false,
    };

    this.contextWindow = this.config.contextWindow;

    console.log(`[AIService] Initializing with model: ${this.config.model}`);

    try {
      // In a real implementation, this would load the actual model
      // For now, we simulate the initialization
      await this._loadModel(this.config.model, this.config.backend);

      // Initialize RAG if enabled
      if (this.config.rag) {
        await this._initializeRAG();
      }

      // Load default plugins
      if (this.config.enablePlugins) {
        await this._loadDefaultPlugins();
      }

      this.initialized = true;
      console.log('[AIService] Initialization complete');
      return true;
    } catch (error) {
      console.error('[AIService] Initialization failed:', error);
      this.performanceMetrics.errors++;
      throw error;
    }
  }

  /**
   * Initialize RAG system
   * @private
   */
  async _initializeRAG() {
    console.log('[AIService] Initializing RAG system...');
    // Initialize knowledge base with some default documents
    this.knowledgeBase.set('webos-overview', {
      content: 'WebOS is a fully-functional operating system running in your browser. It includes a virtual file system with persistent storage, process management and scheduling, window management system, advanced terminal with 40+ commands, built-in applications, cloud sync and networking, and AI assistance.',
      embeddings: await this.getEmbeddings('WebOS browser operating system features'),
      metadata: { type: 'documentation', category: 'system' }
    });

    this.knowledgeBase.set('file-system', {
      content: 'The WebOS Virtual File System (VFS) provides a unified interface to multiple storage backends including OPFS, IndexedDB, and Memory storage. It supports mount points, full CRUD operations, permissions, encryption, and compression.',
      embeddings: await this.getEmbeddings('WebOS VFS file system storage'),
      metadata: { type: 'documentation', category: 'filesystem' }
    });

    console.log('[AIService] RAG initialization complete');
  }

  /**
   * Load default plugins
   * @private
   */
  async _loadDefaultPlugins() {
    console.log('[AIService] Loading default plugins...');

    // Code analysis plugin
    this.registerPlugin('code-analysis', {
      name: 'Code Analysis',
      description: 'Provides advanced code analysis capabilities',
      handler: async (code, options) => {
        return await this._analyzeCode(code, options);
      }
    });

    // Web search plugin (placeholder)
    this.registerPlugin('web-search', {
      name: 'Web Search',
      description: 'Search the web for up-to-date information',
      handler: async (query, options) => {
        return await this._performWebSearch(query, options);
      }
    });

    // Document processor plugin
    this.registerPlugin('document-processor', {
      name: 'Document Processor',
      description: 'Process and extract information from documents',
      handler: async (document, options) => {
        return await this._processDocument(document, options);
      }
    });

    console.log('[AIService] Default plugins loaded');
  }

  /**
   * Load AI model
   * @private
   */
  async _loadModel(modelName, backend) {
    // Simulate model loading delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.model = {
      name: modelName,
      backend,
      loaded: true,
      capabilities: ['text-generation', 'chat', 'code', 'qa'],
    };

    console.log(`[AIService] Model ${modelName} loaded with backend: ${backend}`);
  }

  /**
   * Generate text from a prompt
   * @param {string} prompt - Input prompt
   * @param {Object} options - Generation options
   * @param {boolean} options.useRAG - Use RAG for context enhancement
   * @returns {Promise<string>} Generated text
   */
  async generate(prompt, options = {}) {
    if (!this.initialized) {
      throw new Error('AIService not initialized. Call init() first.');
    }

    const startTime = Date.now();
    this.performanceMetrics.totalRequests++;

    const cacheKey = this._getCacheKey(prompt, options);
    if (this.config.cache && this.cache.has(cacheKey)) {
      console.log('[AIService] Returning cached response');
      this.performanceMetrics.cacheHits++;
      return this.cache.get(cacheKey);
    }

    // Enhance prompt with RAG context if enabled
    let enhancedPrompt = prompt;
    if (options.useRAG !== false && this.config.rag) {
      const context = await this.retrieveContext(prompt);
      if (context) {
        enhancedPrompt = `${context}\n\nUser query: ${prompt}`;
      }
    }

    const response = await this._generateResponse(enhancedPrompt, options);

    if (this.config.cache) {
      this.cache.set(cacheKey, response);
    }

    // Update performance metrics
    const responseTime = Date.now() - startTime;
    this.performanceMetrics.averageResponseTime =
      (this.performanceMetrics.averageResponseTime * (this.performanceMetrics.totalRequests - 1) + responseTime)
      / this.performanceMetrics.totalRequests;

    return response;
  }

  /**
   * Generate text with streaming
   * @param {string} prompt - Input prompt
   * @param {Object} options - Generation options with callbacks
   */
  async generateStream(prompt, options = {}) {
    if (!this.initialized) {
      throw new Error('AIService not initialized. Call init() first.');
    }

    const response = await this._generateResponse(prompt, options);
    const tokens = response.split(' ');

    // Simulate streaming by yielding tokens
    for (let i = 0; i < tokens.length; i++) {
      const token = i < tokens.length - 1 ? tokens[i] + ' ' : tokens[i];

      if (options.onToken) {
        options.onToken(token);
      }

      // Small delay to simulate streaming
      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    if (options.onComplete) {
      options.onComplete(response);
    }

    return response;
  }

  /**
   * Chat completion with conversation history
   * @param {Array} messages - Array of message objects {role, content}
   * @param {Object} options - Generation options
   * @param {boolean} options.useRAG - Use RAG for context enhancement
   * @param {boolean} options.manageContext - Automatically manage context window
   * @returns {Promise<string>} AI response
   */
  async chat(messages, options = {}) {
    if (!this.initialized) {
      throw new Error('AIService not initialized. Call init() first.');
    }

    // Check if we need to summarize conversation
    if (this.conversationHistory.length >= this.summaryThreshold) {
      await this._summarizeConversation();
    }

    // Manage context window if enabled
    const contextMessages = options.manageContext !== false
      ? this._manageContext(messages)
      : messages;

    // Build prompt from conversation history
    let prompt = this.systemPrompt + '\n\n';

    // Add conversation summaries if available
    for (const summary of this.conversationSummaries) {
      prompt += `[Previous context: ${summary.summary}]\n\n`;
    }

    // Enhance with RAG context if enabled
    if (options.useRAG !== false && this.config.rag && contextMessages.length > 0) {
      const lastMessage = contextMessages[contextMessages.length - 1];
      const context = await this.retrieveContext(lastMessage.content);
      if (context) {
        prompt += `${context}\n\n`;
      }
    }

    for (const msg of contextMessages) {
      prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    }

    prompt += 'Assistant:';

    const response = await this.generate(prompt, { ...options, useRAG: false }); // Already applied RAG above

    // Store in conversation history
    this.conversationHistory.push(...messages, {
      role: 'assistant',
      content: response,
    });

    return response;
  }

  /**
   * Get embeddings for text (for semantic search)
   * @param {string} text - Input text
   * @returns {Promise<number[]>} Embedding vector
   */
  async getEmbeddings(text) {
    // In a real implementation, this would generate actual embeddings
    // For simulation, create a simple hash-based vector
    const vector = new Array(384).fill(0);
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      vector[i % 384] += char;
    }

    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map((val) => val / magnitude);
  }

  /**
   * Classify text into categories
   * @param {string} text - Text to classify
   * @param {Array<string>} categories - Possible categories
   * @returns {Promise<Object>} Classification result
   */
  async classify(text, categories) {
    const prompt = `Classify the following text into one of these categories: ${categories.join(', ')}\n\nText: ${text}\n\nCategory:`;

    const response = await this.generate(prompt, { maxTokens: 10 });

    // Find the category in the response
    const category =
      categories.find((cat) => response.toLowerCase().includes(cat.toLowerCase())) ||
      categories[0];

    return {
      category,
      confidence: 0.85, // Simulated confidence
    };
  }

  /**
   * Summarize text
   * @param {string} text - Text to summarize
   * @param {Object} options - Summarization options
   * @returns {Promise<string>} Summary
   */
  async summarize(text, options = {}) {
    const maxLength = options.maxLength || 200;
    const prompt = `Summarize the following text in about ${maxLength} words:\n\n${text}\n\nSummary:`;

    return await this.generate(prompt, {
      maxTokens: Math.floor(maxLength * 1.5),
    });
  }

  /**
   * Generate response based on prompt type
   * @private
   */
  async _generateResponse(prompt, options = {}) {
    // Use the deterministic AI engine for intelligent, OS-aware responses
    try {
      const result = await this.deterministicEngine.process(prompt, options);
      return result.response;
    } catch (error) {
      console.error('[AIService] Deterministic engine error:', error);
      // Fallback to legacy response generation
      return this._generateLegacyResponse(prompt, options);
    }
  }

  /**
   * Legacy response generation (fallback)
   * @private
   */
  async _generateLegacyResponse(prompt, options = {}) {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Detect intent and generate appropriate response
    const lowerPrompt = prompt.toLowerCase();

    // Command-related queries
    if (lowerPrompt.includes('command') || lowerPrompt.includes('how do i')) {
      return this._generateCommandHelp(prompt);
    }

    // Code-related queries
    if (
      lowerPrompt.includes('function') ||
      lowerPrompt.includes('code') ||
      lowerPrompt.includes('javascript') ||
      lowerPrompt.includes('python')
    ) {
      return this._generateCodeResponse(prompt);
    }

    // File operation queries
    if (
      lowerPrompt.includes('file') ||
      lowerPrompt.includes('folder') ||
      lowerPrompt.includes('directory')
    ) {
      return this._generateFileHelp(prompt);
    }

    // System queries
    if (
      lowerPrompt.includes('webos') ||
      lowerPrompt.includes('system') ||
      lowerPrompt.includes('kernel')
    ) {
      return this._generateSystemInfo(prompt);
    }

    // Explanation queries
    if (lowerPrompt.includes('explain') || lowerPrompt.includes('what is')) {
      return this._generateExplanation(prompt);
    }

    // Default response
    return this._generateGenericResponse(prompt);
  }

  /**
   * Generate command help
   * @private
   */
  _generateCommandHelp(prompt) {
    const responses = {
      'list files': 'To list files, use the `ls` command:\n\n  ls\n\nFor detailed information, add the -l flag:\n\n  ls -l\n\nTo show hidden files, use -a:\n\n  ls -la',
      'create folder':
        'To create a folder, use the `mkdir` command:\n\n  mkdir folder_name\n\nFor nested folders, use the -p flag:\n\n  mkdir -p parent/child/grandchild',
      'copy file':
        'To copy a file, use the `cp` command:\n\n  cp source.txt destination.txt\n\nTo copy a directory recursively:\n\n  cp -r source_dir destination_dir',
      'delete file':
        'To delete a file, use the `rm` command:\n\n  rm file.txt\n\nTo delete a directory and its contents:\n\n  rm -rf directory',
      'find files':
        'To find files, use the `find` command:\n\n  find / -name "*.txt"\n\nTo find large files:\n\n  find / -type f -size +100M',
    };

    for (const [key, response] of Object.entries(responses)) {
      if (prompt.toLowerCase().includes(key)) {
        return response;
      }
    }

    return 'I can help you with terminal commands. Try asking about specific operations like "how do I list files" or "create a folder".';
  }

  /**
   * Generate code response
   * @private
   */
  _generateCodeResponse(prompt) {
    if (prompt.toLowerCase().includes('hello world')) {
      if (prompt.toLowerCase().includes('python')) {
        return '```python\nprint("Hello, World!")\n```\n\nThis is the simplest Python program. The print() function outputs text to the console.';
      }
      return '```javascript\nconsole.log("Hello, World!");\n```\n\nThis is the simplest JavaScript program. The console.log() function outputs text to the browser console.';
    }

    if (prompt.toLowerCase().includes('fetch') || prompt.toLowerCase().includes('api')) {
      return '```javascript\nasync function fetchUserData(userId) {\n  try {\n    const response = await fetch(`/api/users/${userId}`);\n    if (!response.ok) {\n      throw new Error(`HTTP error! status: ${response.status}`);\n    }\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error("Error fetching user data:", error);\n    return null;\n  }\n}\n```\n\nThis function:\n1. Uses async/await for cleaner asynchronous code\n2. Makes a GET request to the API\n3. Checks if the response is successful\n4. Parses the JSON response\n5. Handles errors gracefully';
    }

    if (prompt.toLowerCase().includes('sort') || prompt.toLowerCase().includes('array')) {
      return '```javascript\n// Sort array of numbers\nconst numbers = [3, 1, 4, 1, 5, 9, 2, 6];\nnumbers.sort((a, b) => a - b);\nconsole.log(numbers); // [1, 1, 2, 3, 4, 5, 6, 9]\n\n// Sort array of objects by property\nconst users = [\n  { name: "Alice", age: 30 },\n  { name: "Bob", age: 25 },\n  { name: "Charlie", age: 35 }\n];\nusers.sort((a, b) => a.age - b.age);\n```\n\nThe sort() method modifies the array in place and returns it.';
    }

    return 'I can help you with code. Try asking about specific programming tasks like "write a function to fetch data" or "how to sort an array".';
  }

  /**
   * Generate file help
   * @private
   */
  _generateFileHelp(prompt) {
    if (prompt.toLowerCase().includes('organize')) {
      return 'To organize files, you can:\n\n1. Use the File Manager app for visual organization\n2. Use the `smart-organize` command for AI-powered organization:\n\n   smart-organize /home/user/downloads\n\n3. Manually create folders and move files:\n\n   mkdir documents images videos\n   mv *.pdf documents/\n   mv *.jpg images/\n   mv *.mp4 videos/\n\nThe smart-organize command will analyze your files and suggest an organization structure.';
    }

    if (prompt.toLowerCase().includes('search') || prompt.toLowerCase().includes('find')) {
      return 'To search for files, you can use:\n\n1. The `find` command for pattern matching:\n\n   find / -name "*.pdf"\n\n2. The `grep` command to search file contents:\n\n   grep -r "search text" /path/\n\n3. The `smart-search` command for natural language search:\n\n   smart-search "my presentation from last week"\n\nThe smart-search command uses AI to understand your intent and find relevant files.';
    }

    return 'I can help you with file operations. Try asking about "organizing files" or "searching for files".';
  }

  /**
   * Generate system information
   * @private
   */
  _generateSystemInfo(prompt) {
    if (prompt.toLowerCase().includes('file system') || prompt.toLowerCase().includes('vfs')) {
      return 'The WebOS Virtual File System (VFS) is a sophisticated abstraction layer that provides a unified interface to multiple storage backends.\n\nKey features:\n\n1. **Multiple Storage Drivers:**\n   - OPFS (Origin Private File System): High-performance persistent storage\n   - IndexedDB: Structured data and metadata\n   - Memory: Temporary in-memory storage\n\n2. **Mount Points:** Different drivers are mounted at specific paths (like Unix/Linux)\n\n3. **Operations:** Full CRUD operations with permissions, encryption, and compression support\n\n4. **Integration:** Works seamlessly with cloud sync, file watching, and encryption layers';
    }

    if (prompt.toLowerCase().includes('process') || prompt.toLowerCase().includes('kernel')) {
      return 'WebOS has a sophisticated process management system:\n\n1. **Process Manager:** Creates and manages processes with unique PIDs\n\n2. **Scheduler:** Uses the browser\'s Scheduler API for prioritized task execution\n\n3. **IPC (Inter-Process Communication):** Processes communicate via message passing using BroadcastChannel API\n\n4. **Lifecycle:** Full process lifecycle support (create, start, suspend, resume, terminate)\n\n5. **Resource Tracking:** Monitors memory, CPU, and storage usage per process';
    }

    return 'WebOS is a fully-functional operating system running in your browser. It includes:\n\n- Virtual file system with persistent storage\n- Process management and scheduling\n- Window management system\n- Advanced terminal with 40+ commands\n- Built-in applications (file manager, text editor, code editor)\n- Cloud sync and networking\n- AI assistance (that\'s me!)\n\nAsk me about specific components to learn more!';
  }

  /**
   * Generate explanation
   * @private
   */
  _generateExplanation(prompt) {
    // Extract what needs to be explained
    const match = prompt.match(/explain\s+(.+?)(?:\?|$)/i);
    if (!match) {
      return 'I can explain concepts, code, commands, or system features. What would you like me to explain?';
    }

    const topic = match[1].trim();

    // Common terminal commands
    if (topic.includes('ls')) {
      return 'The `ls` command lists directory contents. Common options:\n\n- `-l`: Long format with details (permissions, size, date)\n- `-a`: Show hidden files (starting with .)\n- `-h`: Human-readable file sizes\n- `-t`: Sort by modification time\n- `-r`: Reverse order\n\nExample: `ls -lah` shows all files in long format with human-readable sizes.';
    }

    if (topic.includes('grep')) {
      return 'The `grep` command searches for patterns in text. Syntax:\n\n  grep [options] pattern [files]\n\nCommon options:\n- `-i`: Case-insensitive search\n- `-r`: Recursive directory search\n- `-n`: Show line numbers\n- `-v`: Invert match (show non-matching lines)\n\nExample: `grep -i "error" *.log` finds "error" (case-insensitive) in all .log files.';
    }

    return `To explain "${topic}", I need more context. Try asking a more specific question like "explain the ls command" or "what is a virtual file system".`;
  }

  /**
   * Generate generic response
   * @private
   */
  _generateGenericResponse(prompt) {
    const responses = [
      'I\'m here to help you with WebOS! I can assist with:\n\n- Terminal commands and shell scripting\n- Code writing and debugging\n- File management and organization\n- System information and troubleshooting\n\nWhat would you like to know?',
      'That\'s an interesting question! WebOS provides many features to help you be productive. Could you be more specific about what you\'d like to do?',
      'I can help you with that! WebOS has powerful tools for file management, coding, and system operations. What specific task are you trying to accomplish?',
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Get cache key for a request
   * @private
   */
  _getCacheKey(prompt, options) {
    return `${prompt}_${JSON.stringify(options)}`;
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Clear response cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return this.initialized && this.model && this.model.loaded;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      model: this.model ? this.model.name : null,
      backend: this.model ? this.model.backend : null,
      cacheSize: this.cache.size,
      conversationLength: this.conversationHistory.length,
      ready: this.isReady(),
    };
  }

  /**
   * Register a plugin
   * @param {string} name - Plugin name
   * @param {Object} plugin - Plugin object with handler function
   */
  registerPlugin(name, plugin) {
    if (!plugin.handler || typeof plugin.handler !== 'function') {
      throw new Error('Plugin must have a handler function');
    }
    this.plugins.set(name, plugin);
    console.log(`[AIService] Plugin registered: ${name}`);
  }

  /**
   * Unregister a plugin
   * @param {string} name - Plugin name
   */
  unregisterPlugin(name) {
    this.plugins.delete(name);
    console.log(`[AIService] Plugin unregistered: ${name}`);
  }

  /**
   * Execute a plugin
   * @param {string} name - Plugin name
   * @param {any} input - Plugin input
   * @param {Object} options - Plugin options
   * @returns {Promise<any>} Plugin result
   */
  async executePlugin(name, input, options = {}) {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin not found: ${name}`);
    }

    const startTime = Date.now();
    try {
      const result = await plugin.handler(input, options);
      console.log(`[AIService] Plugin executed: ${name} (${Date.now() - startTime}ms)`);
      return result;
    } catch (error) {
      console.error(`[AIService] Plugin error: ${name}`, error);
      this.performanceMetrics.errors++;
      throw error;
    }
  }

  /**
   * Add document to knowledge base for RAG
   * @param {string} id - Document ID
   * @param {string} content - Document content
   * @param {Object} metadata - Document metadata
   */
  async addToKnowledgeBase(id, content, metadata = {}) {
    const embeddings = await this.getEmbeddings(content);
    this.knowledgeBase.set(id, {
      content,
      embeddings,
      metadata,
      addedAt: Date.now()
    });
    console.log(`[AIService] Added to knowledge base: ${id}`);
  }

  /**
   * Query knowledge base for relevant context
   * @param {string} query - Search query
   * @param {number} topK - Number of results to return
   * @returns {Promise<Array>} Relevant documents
   */
  async queryKnowledgeBase(query, topK = 3) {
    if (this.knowledgeBase.size === 0) {
      return [];
    }

    const queryEmbeddings = await this.getEmbeddings(query);
    const results = [];

    for (const [id, doc] of this.knowledgeBase.entries()) {
      const similarity = this._cosineSimilarity(queryEmbeddings, doc.embeddings);
      results.push({ id, ...doc, similarity });
    }

    // Sort by similarity and return top K
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }

  /**
   * Retrieve context for RAG-enhanced generation
   * @param {string} query - User query
   * @returns {Promise<string>} Retrieved context
   */
  async retrieveContext(query) {
    const relevantDocs = await this.queryKnowledgeBase(query, 3);
    if (relevantDocs.length === 0) {
      return '';
    }

    let context = 'Relevant information:\n\n';
    for (const doc of relevantDocs) {
      context += `${doc.content}\n\n`;
    }
    return context;
  }

  /**
   * Summarize conversation history to manage context window
   * @private
   */
  async _summarizeConversation() {
    if (this.conversationHistory.length < this.summaryThreshold) {
      return;
    }

    const historyText = this.conversationHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const summary = await this.summarize(historyText, { maxLength: 100 });
    this.conversationSummaries.push({
      summary,
      timestamp: Date.now(),
      messageCount: this.conversationHistory.length
    });

    // Keep only recent messages
    const keepMessages = 5;
    this.conversationHistory = this.conversationHistory.slice(-keepMessages);

    console.log('[AIService] Conversation summarized and pruned');
  }

  /**
   * Manage conversation context to fit in context window
   * @private
   */
  _manageContext(messages) {
    // Estimate token count (rough approximation: 1 token ≈ 4 chars)
    const estimateTokens = (text) => Math.ceil(text.length / 4);

    let totalTokens = estimateTokens(this.systemPrompt);
    const contextMessages = [];

    // Add conversation summaries first
    for (const summary of this.conversationSummaries) {
      const summaryTokens = estimateTokens(summary.summary);
      if (totalTokens + summaryTokens < this.contextWindow * 0.7) {
        contextMessages.push({
          role: 'system',
          content: `Previous conversation summary: ${summary.summary}`
        });
        totalTokens += summaryTokens;
      }
    }

    // Add messages from most recent, working backwards
    for (let i = messages.length - 1; i >= 0; i--) {
      const msgTokens = estimateTokens(messages[i].content);
      if (totalTokens + msgTokens < this.contextWindow * 0.9) {
        contextMessages.unshift(messages[i]);
        totalTokens += msgTokens;
      } else {
        break;
      }
    }

    return contextMessages;
  }

  /**
   * Calculate cosine similarity between two vectors
   * @private
   */
  _cosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Advanced code analysis (plugin helper)
   * @private
   */
  async _analyzeCode(code, options = {}) {
    // Simulate advanced code analysis
    const analysis = {
      language: this._detectLanguage(code),
      complexity: this._calculateComplexity(code),
      issues: [],
      suggestions: [],
      metrics: {
        lines: code.split('\n').length,
        functions: (code.match(/function\s+\w+/g) || []).length,
        classes: (code.match(/class\s+\w+/g) || []).length
      }
    };

    // Check for common issues
    if (code.includes('eval(')) {
      analysis.issues.push({ severity: 'high', message: 'Use of eval() is dangerous' });
    }
    if (code.includes('var ')) {
      analysis.suggestions.push({ type: 'modernize', message: 'Consider using let/const instead of var' });
    }

    return analysis;
  }

  /**
   * Calculate code complexity (cyclomatic complexity approximation)
   * @private
   */
  _calculateComplexity(code) {
    const controlFlowKeywords = ['if', 'else', 'for', 'while', 'case', 'catch', '&&', '||'];
    let complexity = 1;

    for (const keyword of controlFlowKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Detect programming language
   * @private
   */
  _detectLanguage(code) {
    if (code.includes('def ') || code.includes('import ')) return 'Python';
    if (code.includes('function ') || code.includes('const ') || code.includes('=>')) return 'JavaScript';
    if (code.includes('public class ') || code.includes('public static void')) return 'Java';
    if (code.includes('#include') || code.includes('std::')) return 'C++';
    if (code.includes('fn ') && code.includes('let ')) return 'Rust';
    if (code.includes('func ') && code.includes('package ')) return 'Go';
    return 'Unknown';
  }

  /**
   * Perform web search (plugin helper - simulated)
   * @private
   */
  async _performWebSearch(query, options = {}) {
    // Simulate web search - in production, this would use a real search API
    return {
      query,
      results: [
        {
          title: 'Search Result 1',
          snippet: `Information about ${query}...`,
          url: 'https://example.com/result1'
        }
      ],
      timestamp: Date.now()
    };
  }

  /**
   * Process document (plugin helper - simulated)
   * @private
   */
  async _processDocument(document, options = {}) {
    // Simulate document processing
    return {
      type: document.type || 'text',
      content: document.content || '',
      metadata: {
        size: document.content?.length || 0,
        processedAt: Date.now()
      },
      summary: await this.summarize(document.content || '', { maxLength: 100 })
    };
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      cacheHitRate: this.performanceMetrics.totalRequests > 0
        ? (this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests * 100).toFixed(2) + '%'
        : '0%',
      knowledgeBaseSize: this.knowledgeBase.size,
      pluginCount: this.plugins.size,
      conversationLength: this.conversationHistory.length,
      summaryCount: this.conversationSummaries.length
    };
  }

  /**
   * Update OS context for deterministic engine
   * @param {Object} context - OS context (file system, processes, etc.)
   */
  updateOSContext(context) {
    if (this.deterministicEngine) {
      this.deterministicEngine.updateOSContext(context);
    }
  }

  /**
   * Get the deterministic engine instance for advanced operations
   * @returns {DeterministicAIEngine} The engine instance
   */
  getEngine() {
    return this.deterministicEngine;
  }

  /**
   * Dispose of the service and free resources
   */
  async dispose() {
    this.clearHistory();
    this.clearCache();
    this.knowledgeBase.clear();
    this.plugins.clear();
    this.conversationSummaries = [];
    this.model = null;
    this.initialized = false;
    if (this.deterministicEngine) {
      this.deterministicEngine.clearHistory();
    }
    console.log('[AIService] Disposed');
  }
}

// Singleton instance
export default new AIService();
