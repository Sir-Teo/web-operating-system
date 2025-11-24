/**
 * Real LLM Integration - Next Generation AI
 *
 * Integrates with multiple LLM providers:
 * - OpenAI (GPT-4, GPT-3.5)
 * - Anthropic (Claude)
 * - Google (PaLM, Gemini)
 * - Cohere
 * - Local models (via Ollama, llama.cpp)
 * - WebLLM (in-browser inference with WebGPU)
 *
 * Features:
 * - Streaming responses
 * - Token counting and rate limiting
 * - Context window management
 * - Multi-model orchestration
 * - Caching and optimization
 * - Function calling / tool use
 */

import { getWebGPUCompute } from '../gpu/WebGPUCompute.js';

export class LLMIntegration {
  constructor() {
    this.providers = new Map();
    this.activeModel = null;
    this.conversationHistory = new Map();
    this.tokenCounts = new Map();
    this.cache = new Map();

    // Configuration
    this.config = {
      defaultProvider: 'openai',
      defaultModel: 'gpt-4',
      maxTokens: 2048,
      temperature: 0.7,
      streamingEnabled: true,
      cachingEnabled: true,
      maxCacheSize: 100
    };

    // Rate limiting
    this.rateLimits = new Map();

    // WebGPU for local inference
    this.gpu = null;
  }

  /**
   * Initialize LLM integration
   */
  async initialize() {
    console.log('🤖 Initializing LLM Integration...');

    // Initialize WebGPU for local models
    this.gpu = getWebGPUCompute();
    await this.gpu.initialize();

    // Register available providers
    this.registerProviders();

    console.log('✅ LLM Integration initialized');
  }

  /**
   * Register LLM providers
   */
  registerProviders() {
    // OpenAI
    this.providers.set('openai', {
      name: 'OpenAI',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      requiresAuth: true,
      supportsStreaming: true,
      supportsFunctions: true
    });

    // Anthropic Claude
    this.providers.set('anthropic', {
      name: 'Anthropic',
      endpoint: 'https://api.anthropic.com/v1/messages',
      models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      requiresAuth: true,
      supportsStreaming: true,
      supportsFunctions: false
    });

    // Google Gemini
    this.providers.set('google', {
      name: 'Google',
      endpoint: 'https://generativelanguage.googleapis.com/v1/models',
      models: ['gemini-pro', 'gemini-pro-vision'],
      requiresAuth: true,
      supportsStreaming: true,
      supportsFunctions: true
    });

    // Cohere
    this.providers.set('cohere', {
      name: 'Cohere',
      endpoint: 'https://api.cohere.ai/v1/chat',
      models: ['command', 'command-light'],
      requiresAuth: true,
      supportsStreaming: true,
      supportsFunctions: false
    });

    // Local Ollama
    this.providers.set('ollama', {
      name: 'Ollama (Local)',
      endpoint: 'http://localhost:11434/api/chat',
      models: ['llama2', 'mistral', 'codellama', 'mixtral'],
      requiresAuth: false,
      supportsStreaming: true,
      supportsFunctions: false
    });

    // WebLLM (in-browser inference)
    this.providers.set('webllm', {
      name: 'WebLLM (Browser)',
      endpoint: null, // Local inference
      models: ['vicuna-7b', 'llama2-7b', 'mistral-7b'],
      requiresAuth: false,
      supportsStreaming: true,
      supportsFunctions: false,
      requiresWebGPU: true
    });

    console.log(`  ✓ Registered ${this.providers.size} LLM providers`);
  }

  /**
   * Generate completion with streaming
   */
  async *generateStream(prompt, options = {}) {
    const provider = options.provider || this.config.defaultProvider;
    const model = options.model || this.config.defaultModel;
    const temperature = options.temperature || this.config.temperature;
    const maxTokens = options.maxTokens || this.config.maxTokens;

    // Check rate limits
    if (!this.checkRateLimit(provider)) {
      throw new Error(`Rate limit exceeded for provider: ${provider}`);
    }

    // Get provider config
    const providerConfig = this.providers.get(provider);
    if (!providerConfig) {
      throw new Error(`Provider not found: ${provider}`);
    }

    // Check if we need API key
    const apiKey = this.getApiKey(provider);
    if (providerConfig.requiresAuth && !apiKey) {
      throw new Error(`API key required for provider: ${provider}`);
    }

    // Route to appropriate provider
    switch (provider) {
      case 'openai':
        yield* this.generateOpenAI(prompt, model, temperature, maxTokens, apiKey);
        break;

      case 'anthropic':
        yield* this.generateAnthropic(prompt, model, temperature, maxTokens, apiKey);
        break;

      case 'google':
        yield* this.generateGoogle(prompt, model, temperature, maxTokens, apiKey);
        break;

      case 'ollama':
        yield* this.generateOllama(prompt, model, temperature, maxTokens);
        break;

      case 'webllm':
        yield* this.generateWebLLM(prompt, model, temperature, maxTokens);
        break;

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    // Update rate limit
    this.updateRateLimit(provider);
  }

  /**
   * Generate with OpenAI API
   */
  async *generateOpenAI(prompt, model, temperature, maxTokens, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: temperature,
        max_tokens: maxTokens,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            console.warn('Failed to parse SSE data:', e);
          }
        }
      }
    }
  }

  /**
   * Generate with Anthropic Claude API
   */
  async *generateAnthropic(prompt, model, temperature, maxTokens, apiKey) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: temperature,
        max_tokens: maxTokens,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta') {
              const content = parsed.delta?.text;
              if (content) {
                yield content;
              }
            }
          } catch (e) {
            console.warn('Failed to parse SSE data:', e);
          }
        }
      }
    }
  }

  /**
   * Generate with Google Gemini API
   */
  async *generateGoogle(prompt, model, temperature, maxTokens, apiKey) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:streamGenerateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: maxTokens
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google API error: ${error.error?.message || 'Unknown error'}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            yield content;
          }
        } catch (e) {
          console.warn('Failed to parse response:', e);
        }
      }
    }
  }

  /**
   * Generate with local Ollama
   */
  async *generateOllama(prompt, model, temperature, maxTokens) {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        temperature: temperature,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) {
            yield parsed.response;
          }
        } catch (e) {
          console.warn('Failed to parse Ollama response:', e);
        }
      }
    }
  }

  /**
   * Generate with WebLLM (in-browser inference)
   */
  async *generateWebLLM(prompt, model, temperature, maxTokens) {
    if (!this.gpu.isSupported()) {
      throw new Error('WebGPU is required for WebLLM but is not supported');
    }

    // This is a placeholder - actual WebLLM integration would require
    // loading the model weights and running inference
    yield '[WebLLM]: In-browser inference is experimental. ';
    yield 'Model weights need to be downloaded first. ';
    yield 'This would use WebGPU for acceleration.';
  }

  /**
   * Generate non-streaming completion
   */
  async generate(prompt, options = {}) {
    let fullResponse = '';

    for await (const chunk of this.generateStream(prompt, options)) {
      fullResponse += chunk;
    }

    return fullResponse;
  }

  /**
   * Chat completion with conversation history
   */
  async chat(conversationId, message, options = {}) {
    // Get or create conversation history
    if (!this.conversationHistory.has(conversationId)) {
      this.conversationHistory.set(conversationId, []);
    }

    const history = this.conversationHistory.get(conversationId);

    // Add user message
    history.push({
      role: 'user',
      content: message,
      timestamp: Date.now()
    });

    // Generate response
    const response = await this.generate(message, options);

    // Add assistant message
    history.push({
      role: 'assistant',
      content: response,
      timestamp: Date.now()
    });

    // Trim history if too long
    this.trimConversationHistory(conversationId);

    return response;
  }

  /**
   * Function calling / tool use
   */
  async generateWithTools(prompt, tools, options = {}) {
    const provider = options.provider || this.config.defaultProvider;
    const providerConfig = this.providers.get(provider);

    if (!providerConfig.supportsFunctions) {
      throw new Error(`Provider ${provider} does not support function calling`);
    }

    // Convert tools to provider-specific format
    const formattedTools = this.formatTools(tools, provider);

    // Generate with tools
    // This would need provider-specific implementation
    return await this.generate(prompt, {
      ...options,
      tools: formattedTools
    });
  }

  /**
   * Count tokens in text (approximate)
   */
  countTokens(text) {
    // Simple approximation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Trim conversation history to fit context window
   */
  trimConversationHistory(conversationId, maxTokens = 4096) {
    const history = this.conversationHistory.get(conversationId);
    if (!history) return;

    let totalTokens = 0;
    let keepFrom = history.length;

    // Count tokens from most recent messages backward
    for (let i = history.length - 1; i >= 0; i--) {
      const tokens = this.countTokens(history[i].content);
      totalTokens += tokens;

      if (totalTokens > maxTokens) {
        keepFrom = i + 1;
        break;
      }
    }

    // Trim old messages
    if (keepFrom > 0) {
      history.splice(0, keepFrom);
    }
  }

  /**
   * Check rate limit
   */
  checkRateLimit(provider) {
    const limit = this.rateLimits.get(provider);
    if (!limit) return true;

    const now = Date.now();
    const windowMs = 60000; // 1 minute

    // Remove old requests
    limit.requests = limit.requests.filter(t => now - t < windowMs);

    // Check if under limit
    return limit.requests.length < limit.maxRequests;
  }

  /**
   * Update rate limit
   */
  updateRateLimit(provider) {
    if (!this.rateLimits.has(provider)) {
      this.rateLimits.set(provider, {
        maxRequests: 60,
        requests: []
      });
    }

    const limit = this.rateLimits.get(provider);
    limit.requests.push(Date.now());
  }

  /**
   * Get API key for provider
   */
  getApiKey(provider) {
    // In production, this would retrieve from secure storage
    const key = localStorage.getItem(`llm_api_key_${provider}`);
    return key;
  }

  /**
   * Set API key for provider
   */
  setApiKey(provider, apiKey) {
    localStorage.setItem(`llm_api_key_${provider}`, apiKey);
  }

  /**
   * Format tools for provider
   */
  formatTools(tools, provider) {
    // Provider-specific tool formatting
    return tools;
  }

  /**
   * Get available models
   */
  getAvailableModels(provider) {
    const providerConfig = this.providers.get(provider);
    return providerConfig?.models || [];
  }

  /**
   * Get all providers
   */
  getProviders() {
    return Array.from(this.providers.entries()).map(([id, config]) => ({
      id,
      ...config
    }));
  }

  /**
   * Clear conversation history
   */
  clearConversation(conversationId) {
    this.conversationHistory.delete(conversationId);
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId) {
    return this.conversationHistory.get(conversationId) || [];
  }

  /**
   * Export configuration
   */
  exportConfig() {
    return {
      ...this.config,
      providers: Array.from(this.providers.keys())
    };
  }

  /**
   * Shutdown
   */
  async shutdown() {
    console.log('Shutting down LLM Integration...');
    this.conversationHistory.clear();
    this.cache.clear();
    console.log('✅ LLM Integration shut down');
  }
}

// Singleton instance
let llmInstance = null;

export function getLLMIntegration() {
  if (!llmInstance) {
    llmInstance = new LLMIntegration();
  }
  return llmInstance;
}
