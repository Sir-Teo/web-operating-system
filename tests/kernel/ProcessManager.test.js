import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ProcessManager', () => {
  let ProcessManager;

  beforeEach(async () => {
    vi.resetModules();

    // Mock Worker
    global.Worker = class Worker {
      constructor(url) {
        this.url = url;
        this.onmessage = null;
      }
      postMessage(data) {
        if (this.onmessage) {
          setTimeout(() => this.onmessage({ data }), 0);
        }
      }
      terminate() {}
    };

    const module = await import('../../src/kernel/ProcessManager.js');
    ProcessManager = module.default;

    // Reset process manager state
    ProcessManager.processes.clear();
    ProcessManager.nextPid = 1;
  });

  describe('spawn()', () => {
    it('should spawn a new process', async () => {
      const config = {
        name: 'TestProcess',
        priority: 'user-visible',
      };

      const process = await ProcessManager.spawn(config);

      expect(process).toBeDefined();
      expect(process.name).toBe('TestProcess');
      expect(process.state).toBe('running');
      expect(process.pid).toBeDefined();
    });

    it('should assign unique PIDs', async () => {
      const process1 = await ProcessManager.spawn({ name: 'Process1' });
      const process2 = await ProcessManager.spawn({ name: 'Process2' });

      expect(process1.pid).toBeDefined();
      expect(process2.pid).toBeDefined();
      expect(process2.pid).not.toBe(process1.pid);
    });

    it('should emit process-spawned event', async () => {
      const eventSpy = vi.fn();
      ProcessManager.addEventListener('process-spawned', eventSpy);

      await ProcessManager.spawn({ name: 'TestProcess' });

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].detail.process).toBeDefined();
    });

    it('should support custom permissions', async () => {
      const config = {
        name: 'SecureProcess',
        permissions: ['file.read', 'file.write'],
      };

      const process = await ProcessManager.spawn(config);

      expect(process.permissions.has('file.read')).toBe(true);
      expect(process.permissions.has('file.write')).toBe(true);
    });

    it('should support parent-child relationships', async () => {
      const parent = await ProcessManager.spawn({ name: 'Parent' });
      const child = await ProcessManager.spawn({
        name: 'Child',
        parentPid: parent.pid,
      });

      expect(child.parentPid).toBe(parent.pid);
    });
  });

  describe('getProcess()', () => {
    it('should retrieve process by PID', async () => {
      const spawned = await ProcessManager.spawn({ name: 'TestProcess' });
      const retrieved = ProcessManager.getProcess(spawned.pid);

      expect(retrieved).toBe(spawned);
      expect(retrieved.name).toBe('TestProcess');
    });

    it('should return undefined for non-existent PID', () => {
      const result = ProcessManager.getProcess(99999);
      expect(result).toBeUndefined();
    });
  });

  describe('listProcesses()', () => {
    it('should return empty array when no processes', () => {
      const processes = ProcessManager.listProcesses();
      expect(processes).toEqual([]);
    });

    it('should list all running processes', async () => {
      await ProcessManager.spawn({ name: 'Process1' });
      await ProcessManager.spawn({ name: 'Process2' });
      await ProcessManager.spawn({ name: 'Process3' });

      const processes = ProcessManager.listProcesses();

      expect(processes).toHaveLength(3);
      expect(processes[0].name).toBe('Process1');
      expect(processes[1].name).toBe('Process2');
      expect(processes[2].name).toBe('Process3');
    });
  });

  describe('killProcess()', () => {
    it('should terminate a process', async () => {
      const process = await ProcessManager.spawn({ name: 'TestProcess' });
      const pid = process.pid;

      await ProcessManager.killProcess(pid);

      expect(ProcessManager.getProcess(pid)).toBeUndefined();
      expect(process.state).toBe('terminated');
    });

    it('should emit process-terminated event', async () => {
      const process = await ProcessManager.spawn({ name: 'TestProcess' });
      const eventSpy = vi.fn();
      ProcessManager.addEventListener('process-terminated', eventSpy);

      await ProcessManager.killProcess(process.pid);

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].detail.pid).toBe(process.pid);
    });

    it('should handle killing non-existent process gracefully', async () => {
      await expect(ProcessManager.killProcess(99999)).resolves.not.toThrow();
    });
  });

  describe('getProcessTree()', () => {
    it('should return empty array for no processes', () => {
      const tree = ProcessManager.getProcessTree();
      expect(tree).toEqual([]);
    });

    it('should build process tree with parent-child relationships', async () => {
      const parent = await ProcessManager.spawn({ name: 'Parent' });
      const child1 = await ProcessManager.spawn({
        name: 'Child1',
        parentPid: parent.pid,
      });
      const child2 = await ProcessManager.spawn({
        name: 'Child2',
        parentPid: parent.pid,
      });
      const grandchild = await ProcessManager.spawn({
        name: 'Grandchild',
        parentPid: child1.pid,
      });

      const tree = ProcessManager.getProcessTree();

      expect(tree).toHaveLength(1);
      expect(tree[0].name).toBe('Parent');
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children[0].children).toHaveLength(1);
      expect(tree[0].children[0].children[0].name).toBe('Grandchild');
    });

    it('should handle multiple root processes', async () => {
      await ProcessManager.spawn({ name: 'Root1' });
      await ProcessManager.spawn({ name: 'Root2' });

      const tree = ProcessManager.getProcessTree();

      expect(tree).toHaveLength(2);
    });
  });

  describe('Process lifecycle', () => {
    it('should create process in created state', async () => {
      const process = await ProcessManager.spawn({ name: 'Test' });
      // After spawn, it's already started
      expect(process.state).toBe('running');
    });

    it('should track process creation time', async () => {
      const before = Date.now();
      const process = await ProcessManager.spawn({ name: 'Test' });
      const after = Date.now();

      expect(process.createdAt).toBeGreaterThanOrEqual(before);
      expect(process.createdAt).toBeLessThanOrEqual(after);
      expect(process.startedAt).toBeDefined();
    });

    it('should initialize resource tracking', async () => {
      const process = await ProcessManager.spawn({ name: 'Test' });

      expect(process.resources).toBeDefined();
      expect(process.resources.memory).toBe(0);
      expect(process.resources.cpu).toBe(0);
      expect(process.resources.storage).toBe(0);
    });
  });
});
