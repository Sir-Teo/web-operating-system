import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowEngine } from '../../src/ai/WorkflowEngine.js';

describe('WorkflowEngine', () => {
  let engine;
  let mockKernel;

  beforeEach(() => {
    mockKernel = {
      vfs: {
        readFile: vi.fn(),
        writeFile: vi.fn(),
        mkdir: vi.fn()
      }
    };

    engine = new WorkflowEngine(mockKernel);
  });

  describe('Workflow Creation', () => {
    it('should create a new workflow', () => {
      const workflow = engine.createWorkflow('Test Workflow', 'A test workflow');

      expect(workflow.name).toBe('Test Workflow');
      expect(workflow.steps).toHaveLength(0);
      expect(engine.workflows.has(workflow.id)).toBe(true);
    });

    it('should add steps to workflow', () => {
      const workflow = engine.createWorkflow('Test', 'Test');

      const step = engine.addStep(workflow.id, {
        type: 'app',
        action: 'launch',
        params: { appName: 'Terminal' }
      });

      expect(workflow.steps).toHaveLength(1);
      expect(step.type).toBe('app');
    });
  });

  describe('Workflow Execution', () => {
    it('should execute workflow steps in sequence', async () => {
      const workflow = engine.createWorkflow('Sequential', 'Sequential test');

      engine.addStep(workflow.id, {
        type: 'system',
        action: 'notification',
        params: { title: 'Test', message: 'Step 1' }
      });

      engine.addStep(workflow.id, {
        type: 'wait',
        action: 'delay',
        params: { ms: 100 }
      });

      const result = await engine.executeWorkflow(workflow.id);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
    });

    it('should handle conditional steps', async () => {
      const workflow = engine.createWorkflow('Conditional', 'Conditional test');

      engine.addStep(workflow.id, {
        type: 'system',
        action: 'notification',
        params: { title: 'Always runs', message: 'Test' },
        condition: null
      });

      engine.addStep(workflow.id, {
        type: 'system',
        action: 'notification',
        params: { title: 'Never runs', message: 'Test' },
        condition: { var: 'shouldRun', op: '===', value: true }
      });

      const result = await engine.executeWorkflow(workflow.id, { shouldRun: false });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1); // Only first step executed
    });

    it('should retry failed steps', async () => {
      const workflow = engine.createWorkflow('Retry', 'Retry test');

      let attempts = 0;
      const failTwice = () => {
        attempts++;
        if (attempts < 3) throw new Error('Failed');
        return { success: true };
      };

      engine.addStep(workflow.id, {
        type: 'system',
        action: 'notification',
        params: { title: 'Test', message: 'Test' },
        retry: { maxAttempts: 3, delay: 10 }
      });

      const result = await engine.executeWorkflow(workflow.id);

      expect(result.success).toBe(true);
    });
  });

  describe('Condition Evaluation', () => {
    it('should evaluate simple conditions', () => {
      expect(engine._evaluateCondition(true, {})).toBe(true);
      expect(engine._evaluateCondition(false, {})).toBe(false);
    });

    it('should evaluate object conditions', () => {
      const context = { value: 10 };

      expect(engine._evaluateCondition({ var: 'value', op: '===', value: 10 }, context)).toBe(true);
      expect(engine._evaluateCondition({ var: 'value', op: '>', value: 5 }, context)).toBe(true);
      expect(engine._evaluateCondition({ var: 'value', op: '<', value: 5 }, context)).toBe(false);
    });

    it('should evaluate function conditions', () => {
      const condition = (ctx) => ctx.count > 5;
      const context = { count: 10 };

      expect(engine._evaluateCondition(condition, context)).toBe(true);
    });
  });

  describe('Parameter Resolution', () => {
    it('should resolve parameters with context variables', () => {
      const params = {
        name: '$userName',
        count: '$itemCount',
        static: 'value'
      };

      const context = {
        userName: 'Alice',
        itemCount: 42
      };

      const resolved = engine._resolveParams(params, context);

      expect(resolved.name).toBe('Alice');
      expect(resolved.count).toBe(42);
      expect(resolved.static).toBe('value');
    });
  });
});
