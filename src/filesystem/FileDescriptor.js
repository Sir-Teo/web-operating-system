/**
 * File Descriptor Management
 * Provides proper file descriptor table per process with locking support
 */

import { createLogger } from '../kernel/Logger.js';
import { FileSystemError } from '../kernel/Errors.js';

const logger = createLogger('FileDescriptor');

/**
 * File open modes
 */
export const OpenMode = {
  READ: 'r',
  WRITE: 'w',
  APPEND: 'a',
  READ_WRITE: 'r+',
  CREATE: 'w+',
  APPEND_READ: 'a+'
};

/**
 * File lock types
 */
export const LockType = {
  SHARED: 'shared',      // Read lock (multiple readers allowed)
  EXCLUSIVE: 'exclusive', // Write lock (exclusive access)
  UNLOCK: 'unlock'       // Release lock
};

/**
 * File lock mode
 */
export const LockMode = {
  ADVISORY: 'advisory',   // Cooperative locking (not enforced)
  MANDATORY: 'mandatory'  // Enforced by filesystem
};

/**
 * File lock
 */
export class FileLock {
  constructor(path, type, mode, processId, options = {}) {
    this.path = path;
    this.type = type;
    this.mode = mode;
    this.processId = processId;
    this.start = options.start || 0;
    this.length = options.length || -1; // -1 = entire file
    this.timestamp = Date.now();
    this.blocking = options.blocking !== false;
  }

  /**
   * Check if this lock overlaps with another
   */
  overlaps(other) {
    if (this.path !== other.path) return false;

    // Check byte range overlap
    if (this.length === -1 || other.length === -1) {
      return true; // Whole-file lock
    }

    const thisEnd = this.start + this.length;
    const otherEnd = other.start + other.length;

    return !(thisEnd <= other.start || otherEnd <= this.start);
  }

  /**
   * Check if this lock conflicts with another
   */
  conflicts(other) {
    if (!this.overlaps(other)) return false;

    // Shared locks don't conflict with each other
    if (this.type === LockType.SHARED && other.type === LockType.SHARED) {
      return false;
    }

    // Exclusive locks conflict with everything
    return true;
  }

  toJSON() {
    return {
      path: this.path,
      type: this.type,
      mode: this.mode,
      processId: this.processId,
      start: this.start,
      length: this.length,
      timestamp: this.timestamp
    };
  }
}

/**
 * File lock manager
 */
export class FileLockManager {
  constructor() {
    this.locks = new Map(); // path -> Set<FileLock>
    this.lockWaiters = new Map(); // path -> Array<{lock, resolve, reject}>
    this.stats = {
      totalLocks: 0,
      activeLocks: 0,
      conflicts: 0,
      deadlocks: 0
    };

    logger.info('File lock manager initialized');
  }

  /**
   * Acquire a file lock
   */
  async acquire(lock) {
    const pathLocks = this.locks.get(lock.path) || new Set();

    // Check for conflicts
    for (const existingLock of pathLocks) {
      if (lock.conflicts(existingLock)) {
        this.stats.conflicts++;

        if (lock.mode === LockMode.MANDATORY) {
          // Mandatory lock - must wait or fail
          if (lock.blocking) {
            // Wait for lock to be released
            await this.waitForLock(lock);
          } else {
            throw new FileSystemError(
              `File is locked: ${lock.path}`,
              { lock: existingLock.toJSON() }
            );
          }
        } else {
          // Advisory lock - log warning but allow
          logger.warn('Advisory lock conflict', {
            path: lock.path,
            existing: existingLock.toJSON(),
            requested: lock.toJSON()
          });
        }
      }
    }

    // Acquire the lock
    pathLocks.add(lock);
    this.locks.set(lock.path, pathLocks);
    this.stats.totalLocks++;
    this.stats.activeLocks++;

    logger.debug('Lock acquired', {
      path: lock.path,
      type: lock.type,
      processId: lock.processId
    });

    return lock;
  }

  /**
   * Wait for a lock to become available
   */
  async waitForLock(lock) {
    return new Promise((resolve, reject) => {
      const waiters = this.lockWaiters.get(lock.path) || [];
      waiters.push({ lock, resolve, reject });
      this.lockWaiters.set(lock.path, waiters);

      // Set timeout to prevent deadlock
      setTimeout(() => {
        this.removeWaiter(lock.path, lock);
        this.stats.deadlocks++;
        reject(new FileSystemError('Lock acquisition timeout', {
          path: lock.path
        }));
      }, 30000); // 30s timeout
    });
  }

  /**
   * Remove a waiter
   */
  removeWaiter(path, lock) {
    const waiters = this.lockWaiters.get(path);
    if (!waiters) return;

    const index = waiters.findIndex(w => w.lock === lock);
    if (index !== -1) {
      waiters.splice(index, 1);
    }

    if (waiters.length === 0) {
      this.lockWaiters.delete(path);
    } else {
      this.lockWaiters.set(path, waiters);
    }
  }

  /**
   * Release a file lock
   */
  release(path, processId, type = null) {
    const pathLocks = this.locks.get(path);
    if (!pathLocks) return;

    const locksToRemove = [];

    for (const lock of pathLocks) {
      if (lock.processId === processId && (type === null || lock.type === type)) {
        locksToRemove.push(lock);
      }
    }

    for (const lock of locksToRemove) {
      pathLocks.delete(lock);
      this.stats.activeLocks--;

      logger.debug('Lock released', {
        path: lock.path,
        type: lock.type,
        processId: lock.processId
      });
    }

    if (pathLocks.size === 0) {
      this.locks.delete(path);
    } else {
      this.locks.set(path, pathLocks);
    }

    // Wake up waiters
    this.wakeWaiters(path);
  }

  /**
   * Wake up waiting lock requests
   */
  async wakeWaiters(path) {
    const waiters = this.lockWaiters.get(path);
    if (!waiters || waiters.length === 0) return;

    // Try to acquire locks for all waiters
    for (const waiter of [...waiters]) {
      try {
        this.removeWaiter(path, waiter.lock);
        await this.acquire(waiter.lock);
        waiter.resolve(waiter.lock);
      } catch (error) {
        waiter.reject(error);
      }
    }
  }

  /**
   * Release all locks for a process
   */
  releaseAll(processId) {
    let released = 0;

    for (const [path, pathLocks] of this.locks.entries()) {
      const locksToRemove = [];

      for (const lock of pathLocks) {
        if (lock.processId === processId) {
          locksToRemove.push(lock);
        }
      }

      for (const lock of locksToRemove) {
        pathLocks.delete(lock);
        this.stats.activeLocks--;
        released++;
      }

      if (pathLocks.size === 0) {
        this.locks.delete(path);
      }

      // Wake waiters
      this.wakeWaiters(path);
    }

    if (released > 0) {
      logger.info('Released all locks for process', {
        processId,
        count: released
      });
    }
  }

  /**
   * Get locks for a process
   */
  getProcessLocks(processId) {
    const locks = [];

    for (const pathLocks of this.locks.values()) {
      for (const lock of pathLocks) {
        if (lock.processId === processId) {
          locks.push(lock.toJSON());
        }
      }
    }

    return locks;
  }

  /**
   * Get locks for a file
   */
  getFileLocks(path) {
    const pathLocks = this.locks.get(path);
    if (!pathLocks) return [];

    return Array.from(pathLocks).map(lock => lock.toJSON());
  }

  /**
   * Check if file is locked
   */
  isLocked(path, processId = null) {
    const pathLocks = this.locks.get(path);
    if (!pathLocks || pathLocks.size === 0) return false;

    if (processId === null) return true;

    // Check if locked by another process
    for (const lock of pathLocks) {
      if (lock.processId !== processId) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      activeFiles: this.locks.size,
      waitingRequests: Array.from(this.lockWaiters.values()).reduce(
        (sum, waiters) => sum + waiters.length,
        0
      )
    };
  }
}

/**
 * File descriptor
 */
export class FileDescriptor {
  constructor(fd, path, mode, processId, options = {}) {
    this.fd = fd;
    this.path = path;
    this.mode = mode;
    this.processId = processId;
    this.position = options.position || 0;
    this.flags = options.flags || 0;
    this.timestamp = Date.now();
    this.lastAccess = Date.now();
    this.locks = []; // Active locks for this descriptor

    // Permissions
    this.canRead = mode.includes('r') || mode.includes('+');
    this.canWrite = mode.includes('w') || mode.includes('a') || mode.includes('+');
    this.append = mode.includes('a');
  }

  /**
   * Update position
   */
  seek(offset, whence = 'SET') {
    switch (whence) {
      case 'SET': // Absolute position
        this.position = offset;
        break;
      case 'CUR': // Relative to current
        this.position += offset;
        break;
      case 'END': // Relative to end (requires file size)
        // Will be handled by VFS
        break;
    }

    this.position = Math.max(0, this.position);
    this.lastAccess = Date.now();
  }

  /**
   * Read updates
   */
  didRead(bytes) {
    this.position += bytes;
    this.lastAccess = Date.now();
  }

  /**
   * Write updates
   */
  didWrite(bytes) {
    if (!this.append) {
      this.position += bytes;
    }
    this.lastAccess = Date.now();
  }

  toJSON() {
    return {
      fd: this.fd,
      path: this.path,
      mode: this.mode,
      processId: this.processId,
      position: this.position,
      timestamp: this.timestamp,
      lastAccess: this.lastAccess,
      canRead: this.canRead,
      canWrite: this.canWrite
    };
  }
}

/**
 * File descriptor table for a process
 */
export class FileDescriptorTable {
  constructor(processId) {
    this.processId = processId;
    this.descriptors = new Map();
    this.nextFd = 3; // 0=stdin, 1=stdout, 2=stderr

    // Standard file descriptors
    this.descriptors.set(0, new FileDescriptor(0, '/dev/stdin', 'r', processId));
    this.descriptors.set(1, new FileDescriptor(1, '/dev/stdout', 'w', processId));
    this.descriptors.set(2, new FileDescriptor(2, '/dev/stderr', 'w', processId));
  }

  /**
   * Allocate a new file descriptor
   */
  allocate(path, mode, options = {}) {
    const fd = this.nextFd++;
    const descriptor = new FileDescriptor(fd, path, mode, this.processId, options);
    this.descriptors.set(fd, descriptor);

    logger.debug('File descriptor allocated', {
      processId: this.processId,
      fd,
      path,
      mode
    });

    return descriptor;
  }

  /**
   * Get file descriptor
   */
  get(fd) {
    const descriptor = this.descriptors.get(fd);
    if (!descriptor) {
      throw new FileSystemError(`Invalid file descriptor: ${fd}`);
    }
    return descriptor;
  }

  /**
   * Close file descriptor
   */
  close(fd) {
    const descriptor = this.descriptors.get(fd);
    if (!descriptor) return false;

    this.descriptors.delete(fd);

    logger.debug('File descriptor closed', {
      processId: this.processId,
      fd,
      path: descriptor.path
    });

    return true;
  }

  /**
   * Close all file descriptors
   */
  closeAll() {
    // Don't close stdin, stdout, stderr
    const fdsToClose = Array.from(this.descriptors.keys()).filter(fd => fd >= 3);

    for (const fd of fdsToClose) {
      this.close(fd);
    }

    logger.debug('All file descriptors closed', {
      processId: this.processId,
      count: fdsToClose.length
    });

    return fdsToClose.length;
  }

  /**
   * Get all file descriptors
   */
  getAll() {
    return Array.from(this.descriptors.values()).map(fd => fd.toJSON());
  }

  /**
   * Get descriptor count
   */
  count() {
    return this.descriptors.size;
  }

  /**
   * Duplicate file descriptor
   */
  duplicate(oldFd, newFd = null) {
    const old = this.get(oldFd);

    const fd = newFd !== null ? newFd : this.nextFd++;
    const descriptor = new FileDescriptor(fd, old.path, old.mode, this.processId, {
      position: old.position,
      flags: old.flags
    });

    this.descriptors.set(fd, descriptor);

    logger.debug('File descriptor duplicated', {
      processId: this.processId,
      oldFd,
      newFd: fd
    });

    return descriptor;
  }
}

/**
 * Global file descriptor manager
 */
export class FileDescriptorManager {
  constructor() {
    this.tables = new Map(); // processId -> FileDescriptorTable
    this.lockManager = new FileLockManager();

    logger.info('File descriptor manager initialized');
  }

  /**
   * Create descriptor table for a process
   */
  createTable(processId) {
    if (this.tables.has(processId)) {
      logger.warn('Descriptor table already exists', { processId });
      return this.tables.get(processId);
    }

    const table = new FileDescriptorTable(processId);
    this.tables.set(processId, table);

    logger.debug('Descriptor table created', { processId });

    return table;
  }

  /**
   * Get descriptor table for a process
   */
  getTable(processId) {
    const table = this.tables.get(processId);
    if (!table) {
      throw new FileSystemError(`No descriptor table for process: ${processId}`);
    }
    return table;
  }

  /**
   * Remove descriptor table for a process
   */
  removeTable(processId) {
    const table = this.tables.get(processId);
    if (table) {
      table.closeAll();
      this.lockManager.releaseAll(processId);
      this.tables.delete(processId);

      logger.debug('Descriptor table removed', { processId });
    }
  }

  /**
   * Get global statistics
   */
  getStatistics() {
    const lockStats = this.lockManager.getStatistics();

    let totalDescriptors = 0;
    for (const table of this.tables.values()) {
      totalDescriptors += table.count();
    }

    return {
      processes: this.tables.size,
      totalDescriptors,
      locks: lockStats
    };
  }
}

/**
 * Create singleton instance
 */
let fdManagerInstance = null;

/**
 * Get the global file descriptor manager
 */
export function getFileDescriptorManager() {
  if (!fdManagerInstance) {
    fdManagerInstance = new FileDescriptorManager();
  }
  return fdManagerInstance;
}

export default {
  FileDescriptor,
  FileDescriptorTable,
  FileDescriptorManager,
  FileLock,
  FileLockManager,
  OpenMode,
  LockType,
  LockMode,
  getFileDescriptorManager
};
