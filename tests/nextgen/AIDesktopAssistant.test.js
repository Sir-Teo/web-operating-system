import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIDesktopAssistant } from '../../src/ai/AIDesktopAssistant.js';

describe('AIDesktopAssistant', () => {
  let assistant;
  let mockKernel;

  beforeEach(() => {
    mockKernel = {
      vfs: {
        readFile: vi.fn(),
        writeFile: vi.fn(),
        mkdir: vi.fn(),
        readDir: vi.fn(),
        deleteFile: vi.fn()
      },
      processManager: {
        getProcessCount: vi.fn().mockReturnValue(5)
      },
      bootTime: Date.now() - 60000,
      version: '2.0.0'
    };

    assistant = new AIDesktopAssistant(mockKernel);
  });

  describe('Command Processing', () => {
    it('should process "open terminal" command', async () => {
      const result = await assistant.processCommand('open terminal');

      expect(result.success).toBe(true);
      expect(result.intent.type).toBe('launch_app');
    });

    it('should process "create file test.txt" command', async () => {
      mockKernel.vfs.writeFile.mockResolvedValue(true);

      const result = await assistant.processCommand('create file test.txt');

      expect(result.success).toBe(true);
      expect(result.intent.type).toBe('create_file');
      expect(mockKernel.vfs.writeFile).toHaveBeenCalled();
    });

    it('should process "find files containing example" command', async () => {
      mockKernel.vfs.readDir.mockResolvedValue([
        { name: 'example.txt', type: 'file' },
        { name: 'test.txt', type: 'file' }
      ]);

      const result = await assistant.processCommand('find files containing example');

      expect(result.success).toBe(true);
      expect(result.intent.type).toBe('search_files');
    });

    it('should process "take screenshot" command', async () => {
      const result = await assistant.processCommand('take screenshot');

      expect(result.success).toBe(true);
      expect(result.intent.type).toBe('take_screenshot');
    });

    it('should handle unknown commands gracefully', async () => {
      const result = await assistant.processCommand('do something impossible');

      expect(result.success).toBe(false);
    });
  });

  describe('Intent Classification', () => {
    it('should classify app launch intents', async () => {
      const intent = await assistant._classifyIntent('open calculator');

      expect(intent.type).toBe('launch_app');
      expect(intent.confidence).toBeGreaterThan(0.8);
    });

    it('should classify file operations', async () => {
      const intent = await assistant._classifyIntent('delete file test.txt');

      expect(intent.type).toBe('delete_file');
    });

    it('should classify system operations', async () => {
      const intent = await assistant._classifyIntent('minimize all windows');

      expect(intent.type).toBe('minimize_all');
    });
  });

  describe('Entity Extraction', () => {
    it('should extract app names', async () => {
      const entities = await assistant._extractEntities('open terminal and file manager');

      expect(entities.apps).toContain('terminal');
      expect(entities.apps).toContain('file manager');
    });

    it('should extract file paths', async () => {
      const entities = await assistant._extractEntities('read /home/user/test.txt');

      expect(entities.paths).toContain('/home/user/test.txt');
    });

    it('should extract quoted text', async () => {
      const entities = await assistant._extractEntities('create file "my document.txt"');

      expect(entities.text).toContain('my document.txt');
    });
  });

  describe('App Name Mapping', () => {
    it('should map natural language app names', () => {
      expect(assistant._findAppByName('terminal')).toBe('Terminal');
      expect(assistant._findAppByName('file manager')).toBe('FileManagerV2');
      expect(assistant._findAppByName('calculator')).toBe('Calculator');
      expect(assistant._findAppByName('code editor')).toBe('CodeEditor');
    });
  });

  describe('Usage Tracking', () => {
    it('should track app launches', () => {
      assistant._trackAppLaunch('Terminal');

      expect(assistant.usagePatterns.appLaunches).toHaveLength(1);
      expect(assistant.usagePatterns.appLaunches[0].app).toBe('Terminal');
    });

    it('should update time-based patterns', () => {
      const hour = new Date().getHours();
      assistant._trackAppLaunch('Terminal');

      expect(assistant.usagePatterns.timeBasedPatterns.has(hour)).toBe(true);
    });
  });
});
