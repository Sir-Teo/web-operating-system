/**
 * AIService - Core AI service for WebOS
 *
 * Provides AI capabilities including text generation, chat completion,
 * code assistance, and more. In production, this would integrate with
 * WebLLM or similar browser-based AI frameworks.
 *
 * For this implementation, we use simulated responses to demonstrate
 * the architecture and capabilities.
 */

export class AIService {
  constructor() {
    this.initialized = false;
    this.model = null;
    this.config = null;
    this.backend = null;
    this.cache = new Map();
    this.conversationHistory = [];
    this.systemPrompt = 'You are a helpful AI assistant integrated into WebOS, a browser-based operating system. You help users with file management, coding, system operations, and general questions.';
  }

  /**
   * Initialize the AI service
   * @param {Object} config - Configuration options
   * @param {string} config.model - Model name (e.g., 'Phi-2-Q4')
   * @param {string} config.backend - Backend to use ('webgpu', 'wasm', 'simulated')
   * @param {boolean} config.cache - Enable response caching
   */
  async init(config = {}) {
    this.config = {
      model: config.model || 'TinyLlama-1.1B-Q4',
      backend: config.backend || 'simulated',
      cache: config.cache !== false,
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 512,
    };

    console.log(`[AIService] Initializing with model: ${this.config.model}`);

    try {
      // In a real implementation, this would load the actual model
      // For now, we simulate the initialization
      await this._loadModel(this.config.model, this.config.backend);

      this.initialized = true;
      console.log('[AIService] Initialization complete');
      return true;
    } catch (error) {
      console.error('[AIService] Initialization failed:', error);
      throw error;
    }
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
   * @returns {Promise<string>} Generated text
   */
  async generate(prompt, options = {}) {
    if (!this.initialized) {
      throw new Error('AIService not initialized. Call init() first.');
    }

    const cacheKey = this._getCacheKey(prompt, options);
    if (this.config.cache && this.cache.has(cacheKey)) {
      console.log('[AIService] Returning cached response');
      return this.cache.get(cacheKey);
    }

    const response = await this._generateResponse(prompt, options);

    if (this.config.cache) {
      this.cache.set(cacheKey, response);
    }

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
   * @returns {Promise<string>} AI response
   */
  async chat(messages, options = {}) {
    if (!this.initialized) {
      throw new Error('AIService not initialized. Call init() first.');
    }

    // Build prompt from conversation history
    let prompt = this.systemPrompt + '\n\n';

    for (const msg of messages) {
      prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    }

    prompt += 'Assistant:';

    const response = await this.generate(prompt, options);

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
   * Dispose of the service and free resources
   */
  async dispose() {
    this.clearHistory();
    this.clearCache();
    this.model = null;
    this.initialized = false;
    console.log('[AIService] Disposed');
  }
}

// Singleton instance
export default new AIService();
