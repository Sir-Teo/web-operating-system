/**
 * System Call Layer
 * Provides privilege separation and a clear user-kernel boundary
 */

import { createLogger } from './Logger.js';
import { PermissionDeniedError, InvalidArgumentError } from './Errors.js';

const logger = createLogger('SystemCall');

/**
 * Privilege levels
 */
export const PrivilegeLevel = {
  KERNEL: 0,      // Ring 0 - Kernel mode
  DRIVER: 1,      // Ring 1 - Device drivers
  SERVICE: 2,     // Ring 2 - System services
  USER: 3         // Ring 3 - User applications
};

/**
 * System call categories
 */
export const SyscallCategory = {
  PROCESS: 'process',
  MEMORY: 'memory',
  FILE: 'file',
  IPC: 'ipc',
  NETWORK: 'network',
  DEVICE: 'device',
  SECURITY: 'security',
  SYSTEM: 'system'
};

/**
 * System call numbers (Linux-inspired)
 */
export const Syscall = {
  // Process management
  EXIT: 1,
  FORK: 2,
  EXEC: 3,
  WAIT: 4,
  KILL: 5,
  GETPID: 6,
  GETPPID: 7,
  NICE: 8,
  SCHED_YIELD: 9,
  SCHED_SETPARAM: 10,
  SCHED_GETPARAM: 11,

  // Memory management
  BRK: 12,
  MMAP: 13,
  MUNMAP: 14,
  MPROTECT: 15,
  MADVISE: 16,

  // File operations
  OPEN: 17,
  CLOSE: 18,
  READ: 19,
  WRITE: 20,
  LSEEK: 21,
  STAT: 22,
  FSTAT: 23,
  CHMOD: 24,
  CHOWN: 25,
  MKDIR: 26,
  RMDIR: 27,
  UNLINK: 28,
  RENAME: 29,
  LINK: 30,
  SYMLINK: 31,
  READLINK: 32,

  // IPC
  PIPE: 33,
  MSGGET: 34,
  MSGSND: 35,
  MSGRCV: 36,
  SHMGET: 37,
  SHMAT: 38,
  SHMDT: 39,

  // Network
  SOCKET: 40,
  BIND: 41,
  CONNECT: 42,
  LISTEN: 43,
  ACCEPT: 44,
  SEND: 45,
  RECV: 46,
  SENDTO: 47,
  RECVFROM: 48,
  SHUTDOWN: 49,

  // Device
  IOCTL: 50,
  SELECT: 51,
  POLL: 52,

  // Security
  GETUID: 53,
  SETUID: 54,
  GETGID: 55,
  SETGID: 56,
  CHROOT: 57,
  SETPRIVILEGE: 58,

  // System
  UNAME: 59,
  SYSINFO: 60,
  GETTIME: 61,
  SETTIME: 62,
  REBOOT: 63,
  SHUTDOWN_SYS: 64
};

/**
 * System call context
 */
export class SyscallContext {
  constructor(processId, syscallNumber, args) {
    this.processId = processId;
    this.syscallNumber = syscallNumber;
    this.syscallName = this.getSyscallName(syscallNumber);
    this.args = args;
    this.timestamp = Date.now();
    this.privilegeLevel = PrivilegeLevel.USER;
    this.returnValue = null;
    this.error = null;
    this.duration = 0;
  }

  getSyscallName(number) {
    for (const [name, num] of Object.entries(Syscall)) {
      if (num === number) return name;
    }
    return 'UNKNOWN';
  }

  setPrivilege(level) {
    this.privilegeLevel = level;
  }

  setReturn(value) {
    this.returnValue = value;
    this.duration = Date.now() - this.timestamp;
  }

  setError(error) {
    this.error = error;
    this.duration = Date.now() - this.timestamp;
  }

  toJSON() {
    return {
      processId: this.processId,
      syscallNumber: this.syscallNumber,
      syscallName: this.syscallName,
      args: this.args,
      timestamp: this.timestamp,
      privilegeLevel: this.privilegeLevel,
      returnValue: this.returnValue,
      error: this.error ? {
        name: this.error.name,
        message: this.error.message
      } : null,
      duration: this.duration
    };
  }
}

/**
 * System call handler
 */
export class SyscallHandler {
  constructor(name, handler, options = {}) {
    this.name = name;
    this.handler = handler;
    this.category = options.category || SyscallCategory.SYSTEM;
    this.minPrivilege = options.minPrivilege || PrivilegeLevel.USER;
    this.requiredPermissions = options.requiredPermissions || [];
    this.validateArgs = options.validateArgs || null;
  }

  async execute(context, kernel) {
    // Validate arguments
    if (this.validateArgs) {
      const validation = this.validateArgs(context.args);
      if (!validation.valid) {
        throw new InvalidArgumentError(validation.message);
      }
    }

    // Execute handler
    return await this.handler(context, kernel);
  }
}

/**
 * System call interface
 */
export class SystemCallInterface {
  constructor(kernel) {
    this.kernel = kernel;
    this.handlers = new Map();
    this.auditLog = [];
    this.auditEnabled = true;
    this.maxAuditEntries = 10000;

    // Statistics
    this.stats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      deniedCalls: 0,
      avgDuration: 0,
      byCategory: {}
    };

    // Register default handlers
    this.registerDefaultHandlers();

    logger.info('System call interface initialized');
  }

  /**
   * Register a system call handler
   */
  register(syscallNumber, handler) {
    this.handlers.set(syscallNumber, handler);
    logger.debug('Syscall handler registered', {
      number: syscallNumber,
      name: handler.name
    });
  }

  /**
   * Invoke a system call
   */
  async invoke(processId, syscallNumber, ...args) {
    const context = new SyscallContext(processId, syscallNumber, args);

    // Get process
    const process = this.kernel.processManager.getProcess(processId);
    if (!process) {
      throw new Error(`Process not found: ${processId}`);
    }

    // Get handler
    const handler = this.handlers.get(syscallNumber);
    if (!handler) {
      throw new Error(`Unknown system call: ${syscallNumber}`);
    }

    // Check privilege level
    const processPrivilege = process.privilegeLevel || PrivilegeLevel.USER;
    context.setPrivilege(processPrivilege);

    if (processPrivilege > handler.minPrivilege) {
      this.stats.deniedCalls++;
      const error = new PermissionDeniedError(
        `Insufficient privilege for ${handler.name}`,
        { required: handler.minPrivilege, actual: processPrivilege }
      );
      context.setError(error);
      this.audit(context);
      throw error;
    }

    // Check permissions
    if (handler.requiredPermissions.length > 0) {
      const hasPermissions = handler.requiredPermissions.every(perm =>
        this.kernel.securityManager.checkPermission(processId, perm)
      );

      if (!hasPermissions) {
        this.stats.deniedCalls++;
        const error = new PermissionDeniedError(
          `Missing permissions for ${handler.name}`,
          { required: handler.requiredPermissions }
        );
        context.setError(error);
        this.audit(context);
        throw error;
      }
    }

    try {
      logger.debug('Syscall invoked', {
        processId,
        syscall: handler.name,
        args: args.slice(0, 3) // Log first 3 args only
      });

      // Execute system call
      const result = await handler.execute(context, this.kernel);
      context.setReturn(result);

      this.stats.totalCalls++;
      this.stats.successfulCalls++;
      this.updateCategoryStats(handler.category, true);
      this.updateAvgDuration(context.duration);

      // Audit
      this.audit(context);

      return result;
    } catch (error) {
      logger.error('Syscall failed', {
        processId,
        syscall: handler.name,
        error
      });

      context.setError(error);
      this.stats.totalCalls++;
      this.stats.failedCalls++;
      this.updateCategoryStats(handler.category, false);
      this.updateAvgDuration(context.duration);

      // Audit
      this.audit(context);

      throw error;
    }
  }

  /**
   * Audit a system call
   */
  audit(context) {
    if (!this.auditEnabled) return;

    this.auditLog.push(context.toJSON());

    // Trim audit log
    if (this.auditLog.length > this.maxAuditEntries) {
      this.auditLog.shift();
    }
  }

  /**
   * Update category statistics
   */
  updateCategoryStats(category, success) {
    if (!this.stats.byCategory[category]) {
      this.stats.byCategory[category] = {
        total: 0,
        successful: 0,
        failed: 0
      };
    }

    this.stats.byCategory[category].total++;
    if (success) {
      this.stats.byCategory[category].successful++;
    } else {
      this.stats.byCategory[category].failed++;
    }
  }

  /**
   * Update average duration
   */
  updateAvgDuration(duration) {
    const total = this.stats.totalCalls;
    this.stats.avgDuration = (this.stats.avgDuration * (total - 1) + duration) / total;
  }

  /**
   * Get audit log
   */
  getAuditLog(filter = {}) {
    let log = this.auditLog;

    if (filter.processId) {
      log = log.filter(e => e.processId === filter.processId);
    }

    if (filter.syscallNumber) {
      log = log.filter(e => e.syscallNumber === filter.syscallNumber);
    }

    if (filter.startTime) {
      log = log.filter(e => e.timestamp >= filter.startTime);
    }

    if (filter.endTime) {
      log = log.filter(e => e.timestamp <= filter.endTime);
    }

    if (filter.hasError !== undefined) {
      log = log.filter(e => (e.error !== null) === filter.hasError);
    }

    return log;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return { ...this.stats };
  }

  /**
   * Register default system call handlers
   */
  registerDefaultHandlers() {
    // Process management
    this.register(Syscall.EXIT, new SyscallHandler(
      'exit',
      async (ctx, kernel) => {
        const [exitCode = 0] = ctx.args;
        await kernel.processManager.terminate(ctx.processId, {
          exitCode,
          signal: 'EXIT'
        });
        return exitCode;
      },
      { category: SyscallCategory.PROCESS }
    ));

    this.register(Syscall.FORK, new SyscallHandler(
      'fork',
      async (ctx, kernel) => {
        const parent = kernel.processManager.getProcess(ctx.processId);
        if (!parent) throw new Error('Parent process not found');

        const child = await kernel.processManager.spawn({
          name: `${parent.name}-child`,
          parentId: ctx.processId,
          privilegeLevel: parent.privilegeLevel,
          permissions: parent.permissions
        });

        return child.id;
      },
      {
        category: SyscallCategory.PROCESS,
        requiredPermissions: ['process.create']
      }
    ));

    this.register(Syscall.GETPID, new SyscallHandler(
      'getpid',
      async (ctx) => ctx.processId,
      { category: SyscallCategory.PROCESS }
    ));

    this.register(Syscall.GETPPID, new SyscallHandler(
      'getppid',
      async (ctx, kernel) => {
        const process = kernel.processManager.getProcess(ctx.processId);
        return process?.parentId || 0;
      },
      { category: SyscallCategory.PROCESS }
    ));

    this.register(Syscall.KILL, new SyscallHandler(
      'kill',
      async (ctx, kernel) => {
        const [targetPid, signal = 'SIGTERM'] = ctx.args;
        await kernel.processManager.signal(targetPid, signal, ctx.processId);
        return 0;
      },
      {
        category: SyscallCategory.PROCESS,
        requiredPermissions: ['process.kill']
      }
    ));

    this.register(Syscall.NICE, new SyscallHandler(
      'nice',
      async (ctx, kernel) => {
        const [increment] = ctx.args;
        const process = kernel.processManager.getProcess(ctx.processId);
        if (!process) throw new Error('Process not found');

        const currentPriority = process.priority || 20;
        const newPriority = Math.max(-20, Math.min(19, currentPriority + increment));

        process.priority = newPriority;

        // Update scheduler
        if (kernel.scheduler) {
          kernel.scheduler.setPriority(ctx.processId, newPriority);
        }

        return newPriority;
      },
      { category: SyscallCategory.PROCESS }
    ));

    this.register(Syscall.SCHED_YIELD, new SyscallHandler(
      'sched_yield',
      async (ctx, kernel) => {
        if (kernel.scheduler) {
          await kernel.scheduler.yield();
        }
        return 0;
      },
      { category: SyscallCategory.PROCESS }
    ));

    // Memory management
    this.register(Syscall.BRK, new SyscallHandler(
      'brk',
      async (ctx, kernel) => {
        const [bytes] = ctx.args;
        if (kernel.memoryManager) {
          kernel.memoryManager.allocate(ctx.processId, bytes);
        }
        return bytes;
      },
      {
        category: SyscallCategory.MEMORY,
        requiredPermissions: ['memory.allocate']
      }
    ));

    this.register(Syscall.MMAP, new SyscallHandler(
      'mmap',
      async (ctx, kernel) => {
        const [addr, length, prot, flags] = ctx.args;
        if (kernel.memoryManager) {
          const pageIds = kernel.memoryManager.allocate(ctx.processId, length);
          return { addr, length, pageIds };
        }
        return { addr, length };
      },
      {
        category: SyscallCategory.MEMORY,
        requiredPermissions: ['memory.allocate']
      }
    ));

    this.register(Syscall.MUNMAP, new SyscallHandler(
      'munmap',
      async (ctx, kernel) => {
        const [pageIds] = ctx.args;
        if (kernel.memoryManager) {
          kernel.memoryManager.free(ctx.processId, pageIds);
        }
        return 0;
      },
      { category: SyscallCategory.MEMORY }
    ));

    // File operations
    this.register(Syscall.OPEN, new SyscallHandler(
      'open',
      async (ctx, kernel) => {
        const [path, flags, mode] = ctx.args;
        const fd = await kernel.vfs.open(path, flags, { processId: ctx.processId });
        return fd;
      },
      {
        category: SyscallCategory.FILE,
        requiredPermissions: ['filesystem.read']
      }
    ));

    this.register(Syscall.READ, new SyscallHandler(
      'read',
      async (ctx, kernel) => {
        const [fd, buffer, count] = ctx.args;
        const data = await kernel.vfs.read(fd, count, { processId: ctx.processId });
        return data;
      },
      {
        category: SyscallCategory.FILE,
        requiredPermissions: ['filesystem.read']
      }
    ));

    this.register(Syscall.WRITE, new SyscallHandler(
      'write',
      async (ctx, kernel) => {
        const [fd, buffer, count] = ctx.args;
        const written = await kernel.vfs.write(fd, buffer, { processId: ctx.processId });
        return written;
      },
      {
        category: SyscallCategory.FILE,
        requiredPermissions: ['filesystem.write']
      }
    ));

    this.register(Syscall.CLOSE, new SyscallHandler(
      'close',
      async (ctx, kernel) => {
        const [fd] = ctx.args;
        await kernel.vfs.close(fd, { processId: ctx.processId });
        return 0;
      },
      { category: SyscallCategory.FILE }
    ));

    // IPC
    this.register(Syscall.PIPE, new SyscallHandler(
      'pipe',
      async (ctx, kernel) => {
        const [readFd, writeFd] = await kernel.ipc.createPipe(ctx.processId);
        return [readFd, writeFd];
      },
      {
        category: SyscallCategory.IPC,
        requiredPermissions: ['ipc.create']
      }
    ));

    // System info
    this.register(Syscall.UNAME, new SyscallHandler(
      'uname',
      async (ctx, kernel) => {
        return {
          sysname: 'WebOS',
          nodename: 'localhost',
          release: kernel.version || '1.0.0',
          version: kernel.buildDate || new Date().toISOString(),
          machine: navigator.platform || 'web'
        };
      },
      { category: SyscallCategory.SYSTEM }
    ));

    this.register(Syscall.SYSINFO, new SyscallHandler(
      'sysinfo',
      async (ctx, kernel) => {
        const memStats = kernel.memoryManager?.getStatistics() || {};
        const schedStats = kernel.scheduler?.getStatistics() || {};

        return {
          uptime: Date.now() - (kernel.bootTime || Date.now()),
          loads: schedStats.cpus?.map(c => c.loadAvg) || [],
          totalram: memStats.totalSize || 0,
          freeram: memStats.freePages * (memStats.pageSize || 4096) || 0,
          procs: kernel.processManager?.processes.size || 0
        };
      },
      { category: SyscallCategory.SYSTEM }
    ));

    this.register(Syscall.GETTIME, new SyscallHandler(
      'gettime',
      async () => Date.now(),
      { category: SyscallCategory.SYSTEM }
    ));

    logger.info('Default syscall handlers registered');
  }

  /**
   * Enable/disable audit logging
   */
  setAuditEnabled(enabled) {
    this.auditEnabled = enabled;
    logger.info(`Audit logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Clear audit log
   */
  clearAuditLog() {
    this.auditLog = [];
    logger.info('Audit log cleared');
  }

  /**
   * Dispose
   */
  dispose() {
    this.handlers.clear();
    this.auditLog = [];
    logger.info('System call interface disposed');
  }
}

/**
 * Helper functions for user-space programs
 */
export class Syscalls {
  constructor(syscallInterface, processId) {
    this.syscall = syscallInterface;
    this.processId = processId;
  }

  // Process management
  async exit(code = 0) {
    return await this.syscall.invoke(this.processId, Syscall.EXIT, code);
  }

  async fork() {
    return await this.syscall.invoke(this.processId, Syscall.FORK);
  }

  async getpid() {
    return await this.syscall.invoke(this.processId, Syscall.GETPID);
  }

  async getppid() {
    return await this.syscall.invoke(this.processId, Syscall.GETPPID);
  }

  async kill(pid, signal) {
    return await this.syscall.invoke(this.processId, Syscall.KILL, pid, signal);
  }

  async nice(increment) {
    return await this.syscall.invoke(this.processId, Syscall.NICE, increment);
  }

  async yield() {
    return await this.syscall.invoke(this.processId, Syscall.SCHED_YIELD);
  }

  // Memory management
  async brk(bytes) {
    return await this.syscall.invoke(this.processId, Syscall.BRK, bytes);
  }

  async mmap(addr, length, prot, flags) {
    return await this.syscall.invoke(this.processId, Syscall.MMAP, addr, length, prot, flags);
  }

  async munmap(pageIds) {
    return await this.syscall.invoke(this.processId, Syscall.MUNMAP, pageIds);
  }

  // File operations
  async open(path, flags, mode) {
    return await this.syscall.invoke(this.processId, Syscall.OPEN, path, flags, mode);
  }

  async read(fd, buffer, count) {
    return await this.syscall.invoke(this.processId, Syscall.READ, fd, buffer, count);
  }

  async write(fd, buffer, count) {
    return await this.syscall.invoke(this.processId, Syscall.WRITE, fd, buffer, count);
  }

  async close(fd) {
    return await this.syscall.invoke(this.processId, Syscall.CLOSE, fd);
  }

  // IPC
  async pipe() {
    return await this.syscall.invoke(this.processId, Syscall.PIPE);
  }

  // System
  async uname() {
    return await this.syscall.invoke(this.processId, Syscall.UNAME);
  }

  async sysinfo() {
    return await this.syscall.invoke(this.processId, Syscall.SYSINFO);
  }

  async gettime() {
    return await this.syscall.invoke(this.processId, Syscall.GETTIME);
  }
}

export default {
  SystemCallInterface,
  SyscallHandler,
  SyscallContext,
  Syscalls,
  Syscall,
  SyscallCategory,
  PrivilegeLevel
};
