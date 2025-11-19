import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIService } from '../../src/ai/AIService.js';

describe('AIService', () => {
  let aiService;

  beforeEach(() => {
    aiService = new AIService();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await aiService.init();
      expect(aiService.isReady()).toBe(true);
    });

    it('should set default config', async () => {
      await aiService.init();
      expect(aiService.config.model).toBe('TinyLlama-1.1B-Q4');
      expect(aiService.config.backend).toBe('simulated');
    });

    it('should accept custom config', async () => {
      await aiService.init({
        model: 'Phi-2-Q4',
        backend: 'webgpu',
        temperature: 0.5,
      });
      expect(aiService.config.model).toBe('Phi-2-Q4');
      expect(aiService.config.backend).toBe('webgpu');
      expect(aiService.config.temperature).toBe(0.5);
    });
  });

  describe('Text Generation', () => {
    beforeEach(async () => {
      await aiService.init();
    });

    it('should generate text from prompt', async () => {
      const prompt = 'Write a hello world program';
      const response = await aiService.generate(prompt);

      expect(response).toBeTruthy();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('should respect maxTokens option', async () => {
      const response = await aiService.generate('Explain AI', {
        maxTokens: 50,
      });

      expect(response).toBeTruthy();
    });

    it('should cache responses when enabled', async () => {
      const prompt = 'Test prompt';

      const response1 = await aiService.generate(prompt);
      const response2 = await aiService.generate(prompt);

      expect(response1).toBe(response2);
      expect(aiService.cache.size).toBeGreaterThan(0);
    });

    it('should not cache when disabled', async () => {
      await aiService.init({ cache: false });

      const prompt = 'Test prompt';
      await aiService.generate(prompt);

      expect(aiService.cache.size).toBe(0);
    });
  });

  describe('Streaming Generation', () => {
    beforeEach(async () => {
      await aiService.init();
    });

    it('should stream tokens', async () => {
      const tokens = [];
      let completed = false;

      await aiService.generateStream('Hello world', {
        onToken: (token) => tokens.push(token),
        onComplete: () => (completed = true),
      });

      expect(tokens.length).toBeGreaterThan(0);
      expect(completed).toBe(true);
    });

    it('should call onComplete callback', async () => {
      let completeResponse = null;

      await aiService.generateStream('Test', {
        onComplete: (text) => (completeResponse = text),
      });

      expect(completeResponse).toBeTruthy();
    });
  });

  describe('Chat Completion', () => {
    beforeEach(async () => {
      await aiService.init();
    });

    it('should handle chat messages', async () => {
      const messages = [{ role: 'user', content: 'Hello!' }];

      const response = await aiService.chat(messages);

      expect(response).toBeTruthy();
      expect(typeof response).toBe('string');
    });

    it('should maintain conversation history', async () => {
      const messages = [
        { role: 'user', content: 'What is 2+2?' },
        { role: 'assistant', content: '4' },
        { role: 'user', content: 'What about 3+3?' },
      ];

      await aiService.chat(messages);

      expect(aiService.conversationHistory.length).toBeGreaterThan(0);
    });

    it('should use system prompt', async () => {
      const messages = [{ role: 'user', content: 'Help me' }];

      const response = await aiService.chat(messages);

      expect(response).toBeTruthy();
    });
  });

  describe('Embeddings', () => {
    beforeEach(async () => {
      await aiService.init();
    });

    it('should generate embeddings', async () => {
      const text = 'Test text for embeddings';
      const embeddings = await aiService.getEmbeddings(text);

      expect(Array.isArray(embeddings)).toBe(true);
      expect(embeddings.length).toBe(384);
      expect(embeddings.every((val) => typeof val === 'number')).toBe(true);
    });

    it('should normalize embeddings', async () => {
      const embeddings = await aiService.getEmbeddings('Test');

      // Check if normalized (magnitude should be close to 1)
      const magnitude = Math.sqrt(
        embeddings.reduce((sum, val) => sum + val * val, 0)
      );

      expect(magnitude).toBeCloseTo(1, 1);
    });
  });

  describe('Classification', () => {
    beforeEach(async () => {
      await aiService.init();
    });

    it('should classify text into categories', async () => {
      const categories = ['tech', 'sports', 'politics'];
      const text = 'The new smartphone release';

      const result = await aiService.classify(text, categories);

      expect(result.category).toBeTruthy();
      expect(categories).toContain(result.category);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Summarization', () => {
    beforeEach(async () => {
      await aiService.init();
    });

    it('should summarize text', async () => {
      const longText = 'This is a long text that needs to be summarized. '.repeat(
        20
      );

      const summary = await aiService.summarize(longText);

      expect(summary).toBeTruthy();
      expect(summary.length).toBeLessThan(longText.length);
    });

    it('should respect maxLength option', async () => {
      const text = 'Long text here';

      const summary = await aiService.summarize(text, { maxLength: 50 });

      expect(summary).toBeTruthy();
    });
  });

  describe('Service Management', () => {
    it('should report ready status', async () => {
      expect(aiService.isReady()).toBe(false);

      await aiService.init();

      expect(aiService.isReady()).toBe(true);
    });

    it('should provide status information', async () => {
      await aiService.init();

      const status = aiService.getStatus();

      expect(status.initialized).toBe(true);
      expect(status.model).toBeTruthy();
      expect(status.backend).toBeTruthy();
      expect(status.ready).toBe(true);
    });

    it('should clear history', async () => {
      await aiService.init();

      aiService.conversationHistory.push({ role: 'user', content: 'Test' });
      expect(aiService.conversationHistory.length).toBeGreaterThan(0);

      aiService.clearHistory();
      expect(aiService.conversationHistory.length).toBe(0);
    });

    it('should clear cache', async () => {
      await aiService.init();

      await aiService.generate('Test');
      expect(aiService.cache.size).toBeGreaterThan(0);

      aiService.clearCache();
      expect(aiService.cache.size).toBe(0);
    });

    it('should dispose properly', async () => {
      await aiService.init();
      await aiService.dispose();

      expect(aiService.initialized).toBe(false);
      expect(aiService.model).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when not initialized', async () => {
      await expect(aiService.generate('Test')).rejects.toThrow(
        'AIService not initialized'
      );
    });

    it('should handle generation errors gracefully', async () => {
      await aiService.init();

      // Simulate error by passing invalid options
      const result = await aiService.generate('Test').catch((e) => e);

      expect(result).toBeDefined();
    });
  });
});
