import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AITerminalAssistant } from '../../src/ai/AITerminalAssistant.js';
import AIService from '../../src/ai/AIService.js';

describe('AITerminalAssistant', () => {
  let assistant;

  beforeEach(async () => {
    assistant = new AITerminalAssistant();
    await assistant.init();
  });

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      expect(assistant).toBeDefined();
      expect(assistant.aiService).toBeDefined();
    });

    it('should initialize AI service', async () => {
      expect(AIService.isReady()).toBe(true);
    });
  });

  describe('Command Suggestions', () => {
    it('should suggest command from natural language', async () => {
      const result = await assistant.suggestCommand('list all files');

      expect(result).toBeDefined();
      expect(result.command).toBeTruthy();
      expect(result.explanation).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should provide command for file listing', async () => {
      const result = await assistant.suggestCommand('show me all text files');

      expect(result.command).toBeTruthy();
      expect(result.command.toLowerCase()).toContain('ls');
    });

    it('should provide command for file creation', async () => {
      const result = await assistant.suggestCommand('create a new directory');

      expect(result.command).toBeTruthy();
      expect(result.command.toLowerCase()).toContain('mkdir');
    });

    it('should handle context', async () => {
      const result = await assistant.suggestCommand('list files', {
        cwd: '/home/user/documents',
      });

      expect(result.command).toBeTruthy();
    });
  });

  describe('Command Explanation', () => {
    it('should explain simple command', async () => {
      const explanation = await assistant.explainCommand('ls -la');

      expect(explanation).toBeTruthy();
      expect(typeof explanation).toBe('string');
    });

    it('should explain complex command', async () => {
      const explanation = await assistant.explainCommand(
        'tar -czf archive.tar.gz folder'
      );

      expect(explanation).toBeTruthy();
    });

    it('should explain pipe commands', async () => {
      const explanation = await assistant.explainCommand(
        'cat file.txt | grep pattern'
      );

      expect(explanation).toBeTruthy();
    });
  });

  describe('Error Fixing', () => {
    it('should suggest fix for error', async () => {
      const result = await assistant.fixError(
        'cat file.txt',
        'No such file or directory'
      );

      expect(result).toBeDefined();
      expect(result.fixedCommand).toBeTruthy();
      expect(result.explanation).toBeTruthy();
    });

    it('should add to error history', async () => {
      await assistant.fixError('wrong-command', 'command not found');

      const history = assistant.getErrorHistory();
      expect(history.length).toBe(1);
      expect(history[0].command).toBe('wrong-command');
    });
  });

  describe('Script Generation', () => {
    it('should generate script from description', async () => {
      const script = await assistant.generateScript('backup documents to /backup');

      expect(script).toBeTruthy();
      expect(script).toContain('#!/bin/webos');
    });

    it('should generate valid shell script', async () => {
      const script = await assistant.generateScript(
        'find all javascript files and count them'
      );

      expect(script).toBeTruthy();
      expect(script).toContain('#!/bin/webos');
    });
  });

  describe('Command Alternatives', () => {
    it('should provide alternative commands', async () => {
      const alternatives = await assistant.getAlternatives('ls -l');

      expect(Array.isArray(alternatives)).toBe(true);
    });
  });

  describe('Intent Detection', () => {
    it('should detect file operation intent', async () => {
      const intent = await assistant.detectIntent('copy file to another location');

      expect(intent).toBeDefined();
      expect(intent.category).toBeTruthy();
      expect(intent.confidence).toBeGreaterThan(0);
    });

    it('should detect system info intent', async () => {
      const intent = await assistant.detectIntent('show system information');

      expect(intent).toBeDefined();
      expect(intent.category).toBeTruthy();
    });
  });

  describe('Context Management', () => {
    it('should update context', () => {
      assistant.updateContext({ cwd: '/new/path' });

      expect(assistant.context.cwd).toBe('/new/path');
    });

    it('should preserve previous context values', () => {
      assistant.updateContext({ cwd: '/path1' });
      assistant.updateContext({ lastCommand: 'ls' });

      expect(assistant.context.cwd).toBe('/path1');
      expect(assistant.context.lastCommand).toBe('ls');
    });
  });

  describe('History Management', () => {
    it('should maintain command history', async () => {
      await assistant.suggestCommand('list files');
      await assistant.suggestCommand('create directory');

      const history = assistant.getHistory();
      expect(history.length).toBe(2);
    });

    it('should clear history', async () => {
      await assistant.suggestCommand('test command');
      expect(assistant.getHistory().length).toBeGreaterThan(0);

      assistant.clearHistory();
      expect(assistant.getHistory().length).toBe(0);
      expect(assistant.getErrorHistory().length).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should provide statistics', async () => {
      await assistant.suggestCommand('test');

      const stats = assistant.getStats();

      expect(stats).toBeDefined();
      expect(stats.totalSuggestions).toBeGreaterThanOrEqual(1);
      expect(stats.currentContext).toBeDefined();
    });
  });
});
