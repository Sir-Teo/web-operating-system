import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIDesktopAssistant } from '../../src/ai/AIDesktopAssistant.js';
import { WorkflowEngine } from '../../src/ai/WorkflowEngine.js';
import { PredictiveAppLauncher } from '../../src/ai/PredictiveAppLauncher.js';

describe('Integration Tests', () => {
  let mockKernel;

  beforeEach(() => {
    mockKernel = {
      vfs: {
        readFile: vi.fn(),
        writeFile: vi.fn(),
        mkdir: vi.fn(),
        readDir: vi.fn().mockResolvedValue([]),
        deleteFile: vi.fn()
      },
      processManager: {
        getProcessCount: vi.fn().mockReturnValue(5)
      },
      bootTime: Date.now() - 60000,
      version: '2.0.0'
    };

    // Mock global appRegistry
    global.window = { appRegistry: {} };
  });

  describe('AI + Workflow Integration', () => {
    it('should use AI to create and execute workflow', async () => {
      const ai = new AIDesktopAssistant(mockKernel);
      const workflow = new WorkflowEngine(mockKernel);

      await ai.initialize();
      await workflow.initialize();

      // Create workflow via AI command
      const wf = workflow.createWorkflow('Backup', 'Backup files');
      workflow.addStep(wf.id, {
        type: 'file',
        action: 'list',
        params: { path: '/' }
      });

      // Execute workflow
      mockKernel.vfs.readDir.mockResolvedValue([
        { name: 'test.txt', type: 'file' }
      ]);

      const result = await workflow.executeWorkflow(wf.id);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
    });

    it('should integrate predictions with AI assistant', async () => {
      const ai = new AIDesktopAssistant(mockKernel);
      const launcher = new PredictiveAppLauncher(mockKernel);

      await ai.initialize();
      await launcher.initialize();

      // Track some usage
      launcher.trackAppLaunch('Terminal');
      launcher.trackAppLaunch('Calculator');

      // Get predictions
      const predictions = launcher.getPredictions();

      expect(predictions.length).toBeGreaterThan(0);
    });

    it('should chain multiple AI operations', async () => {
      const ai = new AIDesktopAssistant(mockKernel);
      await ai.initialize();

      mockKernel.vfs.writeFile.mockResolvedValue(true);
      mockKernel.vfs.readDir.mockResolvedValue([
        { name: 'test.txt', type: 'file' }
      ]);

      // Create file
      const result1 = await ai.processCommand('create file test.txt');
      expect(result1.success).toBe(true);

      // Search for it
      const result2 = await ai.processCommand('find files containing test');
      expect(result2.success).toBe(true);
    });
  });

  describe('Workflow Engine Advanced', () => {
    it('should execute complex multi-step workflow', async () => {
      const workflow = new WorkflowEngine(mockKernel);
      await workflow.initialize();

      const wf = workflow.createWorkflow('Complex', 'Complex workflow');

      // Add multiple steps
      workflow.addStep(wf.id, {
        type: 'system',
        action: 'notification',
        params: { title: 'Step 1', message: 'Starting' }
      });

      workflow.addStep(wf.id, {
        type: 'wait',
        action: 'delay',
        params: { ms: 10 }
      });

      workflow.addStep(wf.id, {
        type: 'system',
        action: 'notification',
        params: { title: 'Step 2', message: 'Complete' }
      });

      const result = await workflow.executeWorkflow(wf.id);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
    });

    it('should handle workflow with context variables', async () => {
      const workflow = new WorkflowEngine(mockKernel);
      await workflow.initialize();

      const wf = workflow.createWorkflow('Context', 'Context test');

      workflow.addStep(wf.id, {
        type: 'system',
        action: 'notification',
        params: { title: '$userName', message: 'Hello' }
      });

      const result = await workflow.executeWorkflow(wf.id, {
        userName: 'Alice'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Predictive Model Integration', () => {
    it('should learn from usage patterns', () => {
      const launcher = new PredictiveAppLauncher(mockKernel);

      // Simulate morning usage
      const morningHour = 9;
      const now = new Date();
      now.setHours(morningHour);

      launcher.trackAppLaunch('Email');
      launcher.trackAppLaunch('Calendar');
      launcher.trackAppLaunch('Email');

      const patterns = launcher.timePatterns.get(morningHour);

      expect(patterns.get('Email')).toBe(2);
      expect(patterns.get('Calendar')).toBe(1);
    });

    it('should predict next app based on sequence', () => {
      const launcher = new PredictiveAppLauncher(mockKernel);

      // Build pattern: Terminal → CodeEditor
      launcher.trackAppLaunch('Terminal');
      launcher.trackAppLaunch('CodeEditor');
      launcher.trackAppLaunch('Terminal');
      launcher.trackAppLaunch('CodeEditor');
      launcher.trackAppLaunch('Terminal');
      launcher.trackAppLaunch('CodeEditor');

      // After Terminal, should predict CodeEditor
      launcher.currentContext.recentApps = ['Terminal'];
      const predictions = launcher._getSequenceBasedPredictions();

      expect(predictions.length).toBeGreaterThan(0);
      expect(predictions[0].app).toBe('CodeEditor');
    });
  });
});
