import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CICDPipeline } from '../../src/devops/CICDPipeline.js';

describe('CICDPipeline', () => {
  let cicd;
  let mockKernel;

  beforeEach(() => {
    mockKernel = {
      vfs: {
        readFile: vi.fn(),
        writeFile: vi.fn(),
        mkdir: vi.fn()
      }
    };

    cicd = new CICDPipeline(mockKernel);
  });

  describe('Pipeline Creation', () => {
    it('should create a new pipeline', () => {
      const pipeline = cicd.createPipeline({
        name: 'Test Pipeline',
        triggers: ['push'],
        stages: []
      });

      expect(pipeline.name).toBe('Test Pipeline');
      expect(pipeline.triggers).toContain('push');
      expect(cicd.pipelines.has(pipeline.id)).toBe(true);
    });

    it('should create pipeline with stages', () => {
      const pipeline = cicd.createPipeline({
        name: 'Build Pipeline',
        stages: [
          {
            name: 'Build',
            steps: [{ command: 'npm install' }]
          },
          {
            name: 'Test',
            steps: [{ command: 'npm test' }]
          }
        ]
      });

      expect(pipeline.stages).toHaveLength(2);
      expect(pipeline.stages[0].name).toBe('Build');
      expect(pipeline.stages[1].name).toBe('Test');
    });
  });

  describe('Pipeline Execution', () => {
    it('should execute simple pipeline', async () => {
      const pipeline = cicd.createPipeline({
        name: 'Simple',
        stages: [
          {
            name: 'Echo',
            steps: [{ command: 'echo "test"' }]
          }
        ]
      });

      // Mock command execution
      vi.spyOn(cicd, '_executeCommand').mockResolvedValue({
        output: 'test',
        exitCode: 0
      });

      const result = await cicd.executePipeline(pipeline.id);

      expect(result.success).toBe(true);
      expect(result.buildId).toBeDefined();
    });

    it('should track build status', async () => {
      const pipeline = cicd.createPipeline({
        name: 'Test',
        stages: [{ name: 'Test', steps: [{ command: 'test' }] }]
      });

      vi.spyOn(cicd, '_executeCommand').mockResolvedValue({
        output: 'ok',
        exitCode: 0
      });

      const result = await cicd.executePipeline(pipeline.id);
      const buildStatus = cicd.getBuildStatus(result.buildId);

      expect(buildStatus).toBeDefined();
      expect(buildStatus.status).toBe('success');
    });

    it('should handle pipeline failures', async () => {
      const pipeline = cicd.createPipeline({
        name: 'Failing',
        stages: [
          {
            name: 'Fail',
            steps: [{ command: 'exit 1' }]
          }
        ]
      });

      vi.spyOn(cicd, '_executeCommand').mockResolvedValue({
        output: 'error',
        exitCode: 1
      });

      const result = await cicd.executePipeline(pipeline.id);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Pipeline Management', () => {
    it('should list all pipelines', () => {
      cicd.createPipeline({ name: 'Pipeline 1', stages: [] });
      cicd.createPipeline({ name: 'Pipeline 2', stages: [] });

      const pipelines = cicd.listPipelines();

      expect(pipelines).toHaveLength(2);
    });
  });
});
