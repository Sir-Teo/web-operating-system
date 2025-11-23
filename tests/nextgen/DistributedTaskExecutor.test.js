import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DistributedTaskExecutor } from '../../src/distributed/DistributedTaskExecutor.js';

describe('DistributedTaskExecutor', () => {
  let executor;
  let mockKernel;
  let mockMeshNetwork;

  beforeEach(() => {
    mockKernel = {
      vfs: {
        readFile: vi.fn(),
        writeFile: vi.fn()
      }
    };

    mockMeshNetwork = {
      sendRequest: vi.fn(),
      getPeers: vi.fn().mockReturnValue([
        {
          nodeId: 'peer1',
          nodeName: 'WebOS-Peer1',
          capabilities: {
            features: ['distributed-compute']
          }
        }
      ]),
      registerMessageHandler: vi.fn()
    };

    executor = new DistributedTaskExecutor(mockKernel, mockMeshNetwork);
  });

  describe('Task Submission', () => {
    it('should submit a map-reduce task', async () => {
      const task = {
        name: 'Sum Numbers',
        type: 'map-reduce',
        data: [1, 2, 3, 4, 5],
        mapFunction: '(x) => x * 2',
        reduceFunction: '(acc, val) => acc + val, 0'
      };

      mockMeshNetwork.sendRequest.mockResolvedValue({
        success: true,
        result: [2, 4, 6, 8, 10]
      });

      const result = await executor.submitTask(task);

      expect(result.success).toBe(true);
      expect(executor.tasks.size).toBe(1);
    });

    it('should submit a parallel task', async () => {
      const task = {
        name: 'Process Items',
        type: 'parallel',
        data: [1, 2, 3],
        workFunction: '(x) => x * x'
      };

      const result = await executor.submitTask(task);

      expect(result.success).toBe(true);
    });
  });

  describe('Data Splitting', () => {
    it('should split data into chunks', () => {
      const data = Array.from({ length: 100 }, (_, i) => i);
      const chunks = executor._splitData(data, 'chunk', 25);

      expect(chunks).toHaveLength(4);
      expect(chunks[0]).toHaveLength(25);
    });

    it('should split data evenly across workers', () => {
      const data = Array.from({ length: 10 }, (_, i) => i);
      const chunks = executor._splitData(data, 'even', 0);

      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('Local Execution', () => {
    it('should execute tasks locally', async () => {
      const data = [1, 2, 3];
      const fn = '(arr) => arr.map(x => x * 2)';

      const result = await executor._executeLocally(data, fn);

      expect(result).toEqual([2, 4, 6]);
    });
  });

  describe('Worker Management', () => {
    it('should get available workers', () => {
      const workers = executor._getAvailableWorkers();

      expect(workers).toHaveLength(1);
      expect(workers[0].id).toBe('peer1');
    });

    it('should check worker capacity', () => {
      const capacity = executor._getWorkerCapacity();

      expect(capacity).toBeGreaterThan(0);
    });
  });

  describe('Task Progress', () => {
    it('should calculate task progress', () => {
      const execution = {
        workers: new Map([
          ['w1', { status: 'completed' }],
          ['w2', { status: 'executing' }],
          ['w3', { status: 'completed' }]
        ])
      };

      const progress = executor._calculateProgress(execution);

      expect(progress.total).toBe(3);
      expect(progress.completed).toBe(2);
      expect(progress.percentage).toBeCloseTo(66.67, 1);
    });
  });

  describe('Function Serialization', () => {
    it('should serialize and deserialize functions', () => {
      const fn = (x) => x * 2;
      const serialized = executor._serializeFunction(fn);
      const deserialized = executor._deserializeFunction(serialized);

      expect(deserialized(5)).toBe(10);
    });
  });
});
