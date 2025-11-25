/**
 * Filesystem Journaling
 * Provides transaction logging for crash recovery and data consistency
 */

import { createLogger } from '../kernel/Logger.js';
import { FileSystemError } from '../kernel/Errors.js';

const logger = createLogger('Journal');

/**
 * Journal entry types
 */
export const JournalEntryType = {
  WRITE: 'write',
  CREATE: 'create',
  DELETE: 'delete',
  RENAME: 'rename',
  MKDIR: 'mkdir',
  RMDIR: 'rmdir',
  CHMOD: 'chmod',
  CHOWN: 'chown',
  TRUNCATE: 'truncate',
  SYMLINK: 'symlink'
};

/**
 * Transaction states
 */
export const TransactionState = {
  PENDING: 'pending',
  COMMITTED: 'committed',
  ABORTED: 'aborted',
  APPLIED: 'applied'
};

/**
 * Journal entry
 */
export class JournalEntry {
  constructor(type, data) {
    this.id = this.generateId();
    this.type = type;
    this.data = data;
    this.timestamp = Date.now();
    this.transactionId = null;
    this.state = TransactionState.PENDING;
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  commit() {
    this.state = TransactionState.COMMITTED;
  }

  abort() {
    this.state = TransactionState.ABORTED;
  }

  apply() {
    this.state = TransactionState.APPLIED;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      data: this.data,
      timestamp: this.timestamp,
      transactionId: this.transactionId,
      state: this.state
    };
  }

  static fromJSON(json) {
    const entry = new JournalEntry(json.type, json.data);
    entry.id = json.id;
    entry.timestamp = json.timestamp;
    entry.transactionId = json.transactionId;
    entry.state = json.state;
    return entry;
  }
}

/**
 * Transaction
 */
export class Transaction {
  constructor(id = null) {
    this.id = id || this.generateId();
    this.entries = [];
    this.state = TransactionState.PENDING;
    this.startTime = Date.now();
    this.endTime = null;
  }

  generateId() {
    return `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  addEntry(entry) {
    entry.transactionId = this.id;
    this.entries.push(entry);
  }

  commit() {
    this.state = TransactionState.COMMITTED;
    this.endTime = Date.now();

    for (const entry of this.entries) {
      entry.commit();
    }
  }

  abort() {
    this.state = TransactionState.ABORTED;
    this.endTime = Date.now();

    for (const entry of this.entries) {
      entry.abort();
    }
  }

  apply() {
    this.state = TransactionState.APPLIED;

    for (const entry of this.entries) {
      entry.apply();
    }
  }

  toJSON() {
    return {
      id: this.id,
      entries: this.entries.map(e => e.toJSON()),
      state: this.state,
      startTime: this.startTime,
      endTime: this.endTime
    };
  }

  static fromJSON(json) {
    const txn = new Transaction(json.id);
    txn.entries = json.entries.map(e => JournalEntry.fromJSON(e));
    txn.state = json.state;
    txn.startTime = json.startTime;
    txn.endTime = json.endTime;
    return txn;
  }
}

/**
 * Filesystem Journal
 */
export class FilesystemJournal {
  constructor(options = {}) {
    this.maxEntries = options.maxEntries || 10000;
    this.autoCheckpoint = options.autoCheckpoint !== false;
    this.checkpointInterval = options.checkpointInterval || 60000; // 1 minute
    this.persistJournal = options.persistJournal !== false;
    this.storageKey = options.storageKey || 'fs-journal';

    this.entries = [];
    this.transactions = new Map();
    this.currentTransaction = null;
    this.checkpointTimer = null;
    this.lastCheckpoint = Date.now();

    this.stats = {
      totalEntries: 0,
      totalTransactions: 0,
      committedTransactions: 0,
      abortedTransactions: 0,
      checkpoints: 0,
      recoveries: 0
    };

    logger.info('Filesystem journal initialized', {
      maxEntries: this.maxEntries,
      autoCheckpoint: this.autoCheckpoint,
      persistJournal: this.persistJournal
    });
  }

  /**
   * Start the journal
   */
  async start() {
    // Load persisted journal
    if (this.persistJournal) {
      await this.load();
    }

    // Start auto-checkpoint
    if (this.autoCheckpoint) {
      this.startAutoCheckpoint();
    }

    logger.info('Journal started');
  }

  /**
   * Stop the journal
   */
  async stop() {
    // Stop auto-checkpoint
    this.stopAutoCheckpoint();

    // Persist journal
    if (this.persistJournal) {
      await this.persist();
    }

    logger.info('Journal stopped');
  }

  /**
   * Begin a transaction
   */
  beginTransaction() {
    const txn = new Transaction();
    this.currentTransaction = txn;
    this.transactions.set(txn.id, txn);

    logger.debug('Transaction started', { id: txn.id });

    return txn;
  }

  /**
   * Commit current transaction
   */
  async commitTransaction() {
    if (!this.currentTransaction) {
      throw new FileSystemError('No active transaction');
    }

    const txn = this.currentTransaction;
    txn.commit();

    // Add entries to journal
    for (const entry of txn.entries) {
      this.entries.push(entry);
    }

    this.stats.totalEntries += txn.entries.length;
    this.stats.totalTransactions++;
    this.stats.committedTransactions++;

    logger.debug('Transaction committed', {
      id: txn.id,
      entries: txn.entries.length
    });

    // Trim journal if needed
    this.trimJournal();

    // Persist if needed
    if (this.persistJournal) {
      await this.persist();
    }

    this.currentTransaction = null;

    return txn;
  }

  /**
   * Abort current transaction
   */
  abortTransaction() {
    if (!this.currentTransaction) {
      throw new FileSystemError('No active transaction');
    }

    const txn = this.currentTransaction;
    txn.abort();

    this.stats.totalTransactions++;
    this.stats.abortedTransactions++;

    logger.debug('Transaction aborted', { id: txn.id });

    this.currentTransaction = null;

    return txn;
  }

  /**
   * Add entry to current transaction
   */
  addEntry(type, data) {
    const entry = new JournalEntry(type, data);

    if (this.currentTransaction) {
      this.currentTransaction.addEntry(entry);
    } else {
      // No transaction, create implicit one
      const txn = this.beginTransaction();
      txn.addEntry(entry);
      this.commitTransaction();
    }

    return entry;
  }

  /**
   * Log a write operation
   */
  logWrite(path, data, offset = 0) {
    return this.addEntry(JournalEntryType.WRITE, {
      path,
      data,
      offset,
      length: data.byteLength || data.length
    });
  }

  /**
   * Log a create operation
   */
  logCreate(path, data = null) {
    return this.addEntry(JournalEntryType.CREATE, {
      path,
      data
    });
  }

  /**
   * Log a delete operation
   */
  logDelete(path) {
    return this.addEntry(JournalEntryType.DELETE, {
      path
    });
  }

  /**
   * Log a rename operation
   */
  logRename(oldPath, newPath) {
    return this.addEntry(JournalEntryType.RENAME, {
      oldPath,
      newPath
    });
  }

  /**
   * Log a mkdir operation
   */
  logMkdir(path) {
    return this.addEntry(JournalEntryType.MKDIR, {
      path
    });
  }

  /**
   * Log a rmdir operation
   */
  logRmdir(path) {
    return this.addEntry(JournalEntryType.RMDIR, {
      path
    });
  }

  /**
   * Log a chmod operation
   */
  logChmod(path, mode) {
    return this.addEntry(JournalEntryType.CHMOD, {
      path,
      mode
    });
  }

  /**
   * Log a chown operation
   */
  logChown(path, uid, gid) {
    return this.addEntry(JournalEntryType.CHOWN, {
      path,
      uid,
      gid
    });
  }

  /**
   * Trim journal to max entries
   */
  trimJournal() {
    if (this.entries.length > this.maxEntries) {
      const toRemove = this.entries.length - this.maxEntries;
      this.entries.splice(0, toRemove);

      logger.debug('Journal trimmed', {
        removed: toRemove,
        remaining: this.entries.length
      });
    }
  }

  /**
   * Checkpoint - mark all entries as applied
   */
  async checkpoint() {
    let applied = 0;

    for (const entry of this.entries) {
      if (entry.state === TransactionState.COMMITTED) {
        entry.apply();
        applied++;
      }
    }

    // Remove applied entries
    this.entries = this.entries.filter(
      e => e.state !== TransactionState.APPLIED
    );

    this.lastCheckpoint = Date.now();
    this.stats.checkpoints++;

    logger.info('Checkpoint complete', {
      applied,
      remaining: this.entries.length
    });

    // Persist
    if (this.persistJournal) {
      await this.persist();
    }
  }

  /**
   * Start auto-checkpoint
   */
  startAutoCheckpoint() {
    if (this.checkpointTimer) return;

    this.checkpointTimer = setInterval(() => {
      this.checkpoint().catch(error => {
        logger.error('Auto-checkpoint failed', { error });
      });
    }, this.checkpointInterval);

    logger.info('Auto-checkpoint started', {
      interval: this.checkpointInterval
    });
  }

  /**
   * Stop auto-checkpoint
   */
  stopAutoCheckpoint() {
    if (this.checkpointTimer) {
      clearInterval(this.checkpointTimer);
      this.checkpointTimer = null;
      logger.info('Auto-checkpoint stopped');
    }
  }

  /**
   * Recover from journal
   */
  async recover(vfs) {
    logger.info('Starting journal recovery', {
      entries: this.entries.length
    });

    let recovered = 0;
    let failed = 0;

    for (const entry of this.entries) {
      if (entry.state !== TransactionState.COMMITTED) {
        continue; // Skip uncommitted entries
      }

      try {
        await this.applyEntry(entry, vfs);
        entry.apply();
        recovered++;
      } catch (error) {
        logger.error('Failed to apply journal entry', {
          entry: entry.toJSON(),
          error
        });
        failed++;
      }
    }

    this.stats.recoveries++;

    logger.info('Journal recovery complete', {
      recovered,
      failed
    });

    // Checkpoint after recovery
    await this.checkpoint();

    return { recovered, failed };
  }

  /**
   * Apply a journal entry
   */
  async applyEntry(entry, vfs) {
    const { type, data } = entry;

    switch (type) {
      case JournalEntryType.WRITE:
        await vfs.writeFile(data.path, data.data, {
          offset: data.offset,
          noJournal: true // Prevent recursive journaling
        });
        break;

      case JournalEntryType.CREATE:
        await vfs.writeFile(data.path, data.data || '', {
          noJournal: true
        });
        break;

      case JournalEntryType.DELETE:
        await vfs.unlink(data.path, { noJournal: true });
        break;

      case JournalEntryType.RENAME:
        await vfs.rename(data.oldPath, data.newPath, {
          noJournal: true
        });
        break;

      case JournalEntryType.MKDIR:
        await vfs.mkdir(data.path, { noJournal: true });
        break;

      case JournalEntryType.RMDIR:
        await vfs.rmdir(data.path, { noJournal: true });
        break;

      case JournalEntryType.CHMOD:
        await vfs.chmod(data.path, data.mode, { noJournal: true });
        break;

      case JournalEntryType.CHOWN:
        await vfs.chown(data.path, data.uid, data.gid, {
          noJournal: true
        });
        break;

      default:
        logger.warn('Unknown journal entry type', { type });
    }
  }

  /**
   * Persist journal to storage
   */
  async persist() {
    try {
      const data = {
        entries: this.entries.map(e => e.toJSON()),
        transactions: Array.from(this.transactions.values()).map(t => t.toJSON()),
        lastCheckpoint: this.lastCheckpoint,
        stats: this.stats
      };

      localStorage.setItem(this.storageKey, JSON.stringify(data));

      logger.debug('Journal persisted', {
        entries: this.entries.length,
        transactions: this.transactions.size
      });
    } catch (error) {
      logger.error('Failed to persist journal', { error });
    }
  }

  /**
   * Load journal from storage
   */
  async load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        logger.debug('No persisted journal found');
        return;
      }

      const data = JSON.parse(raw);

      this.entries = data.entries.map(e => JournalEntry.fromJSON(e));
      this.transactions = new Map(
        data.transactions.map(t => {
          const txn = Transaction.fromJSON(t);
          return [txn.id, txn];
        })
      );
      this.lastCheckpoint = data.lastCheckpoint;
      this.stats = data.stats;

      logger.info('Journal loaded', {
        entries: this.entries.length,
        transactions: this.transactions.size
      });
    } catch (error) {
      logger.error('Failed to load journal', { error });
    }
  }

  /**
   * Get journal entries
   */
  getEntries(filter = {}) {
    let entries = this.entries;

    if (filter.type) {
      entries = entries.filter(e => e.type === filter.type);
    }

    if (filter.path) {
      entries = entries.filter(e =>
        e.data.path === filter.path ||
        e.data.oldPath === filter.path ||
        e.data.newPath === filter.path
      );
    }

    if (filter.state) {
      entries = entries.filter(e => e.state === filter.state);
    }

    if (filter.transactionId) {
      entries = entries.filter(e => e.transactionId === filter.transactionId);
    }

    return entries.map(e => e.toJSON());
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      currentEntries: this.entries.length,
      activeTransactions: this.transactions.size,
      lastCheckpoint: this.lastCheckpoint
    };
  }

  /**
   * Clear journal
   */
  async clear() {
    this.entries = [];
    this.transactions.clear();
    this.currentTransaction = null;

    if (this.persistJournal) {
      await this.persist();
    }

    logger.info('Journal cleared');
  }

  /**
   * Dispose
   */
  async dispose() {
    await this.stop();
    this.entries = [];
    this.transactions.clear();
    logger.info('Journal disposed');
  }
}

/**
 * Create singleton instance
 */
let journalInstance = null;

/**
 * Get the global filesystem journal
 */
export function getFilesystemJournal() {
  if (!journalInstance) {
    journalInstance = new FilesystemJournal();
  }
  return journalInstance;
}

/**
 * Initialize journal with custom options
 */
export function initFilesystemJournal(options = {}) {
  if (journalInstance) {
    logger.warn('Journal already initialized');
    return journalInstance;
  }
  journalInstance = new FilesystemJournal(options);
  return journalInstance;
}

export default {
  FilesystemJournal,
  JournalEntry,
  Transaction,
  JournalEntryType,
  TransactionState,
  getFilesystemJournal,
  initFilesystemJournal
};
