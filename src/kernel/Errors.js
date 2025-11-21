/**
 * WebOS Error Handling System
 * Provides unified error classes for consistent error handling across the OS
 */

/**
 * Base error class for all WebOS errors
 */
export class WebOSError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * Permission-related errors
 */
export class PermissionError extends WebOSError {
  constructor(permission, details = {}) {
    super(
      'EACCES',
      `Permission denied: ${permission}`,
      { permission, ...details }
    );
  }
}

/**
 * File system errors
 */
export class FileSystemError extends WebOSError {
  constructor(code, path, message, details = {}) {
    super(code, message, { path, ...details });
  }
}

export class FileNotFoundError extends FileSystemError {
  constructor(path, details = {}) {
    super('ENOENT', path, `File not found: ${path}`, details);
  }
}

export class FileExistsError extends FileSystemError {
  constructor(path, details = {}) {
    super('EEXIST', path, `File already exists: ${path}`, details);
  }
}

export class DirectoryNotEmptyError extends FileSystemError {
  constructor(path, details = {}) {
    super('ENOTEMPTY', path, `Directory not empty: ${path}`, details);
  }
}

export class NotADirectoryError extends FileSystemError {
  constructor(path, details = {}) {
    super('ENOTDIR', path, `Not a directory: ${path}`, details);
  }
}

export class IsADirectoryError extends FileSystemError {
  constructor(path, details = {}) {
    super('EISDIR', path, `Is a directory: ${path}`, details);
  }
}

export class InvalidPathError extends FileSystemError {
  constructor(path, reason, details = {}) {
    super('EINVAL', path, `Invalid path: ${path} - ${reason}`, { reason, ...details });
  }
}

export class StorageQuotaExceededError extends FileSystemError {
  constructor(path, details = {}) {
    super('ENOSPC', path, `Storage quota exceeded for: ${path}`, details);
  }
}

/**
 * Process-related errors
 */
export class ProcessError extends WebOSError {
  constructor(code, message, details = {}) {
    super(code, message, details);
  }
}

export class ProcessNotFoundError extends ProcessError {
  constructor(pid, details = {}) {
    super('ESRCH', `Process not found: ${pid}`, { pid, ...details });
  }
}

export class ProcessSpawnError extends ProcessError {
  constructor(message, details = {}) {
    super('ESPAWN', `Failed to spawn process: ${message}`, details);
  }
}

export class ProcessTerminatedError extends ProcessError {
  constructor(pid, details = {}) {
    super('ETERM', `Process terminated: ${pid}`, { pid, ...details });
  }
}

/**
 * Resource-related errors
 */
export class ResourceError extends WebOSError {
  constructor(code, message, details = {}) {
    super(code, message, details);
  }
}

export class ResourceLimitExceededError extends ResourceError {
  constructor(resource, limit, current, details = {}) {
    super(
      'ELIMIT',
      `Resource limit exceeded: ${resource} (limit: ${limit}, current: ${current})`,
      { resource, limit, current, ...details }
    );
  }
}

export class OutOfMemoryError extends ResourceError {
  constructor(requested, available, details = {}) {
    super(
      'ENOMEM',
      `Out of memory: requested ${requested} bytes, ${available} bytes available`,
      { requested, available, ...details }
    );
  }
}

/**
 * IPC and communication errors
 */
export class IPCError extends WebOSError {
  constructor(code, message, details = {}) {
    super(code, message, details);
  }
}

export class MessageDeliveryError extends IPCError {
  constructor(targetPid, details = {}) {
    super(
      'EMSGFAIL',
      `Failed to deliver message to process: ${targetPid}`,
      { targetPid, ...details }
    );
  }
}

export class ChannelNotFoundError extends IPCError {
  constructor(channel, details = {}) {
    super('ENOCHAN', `Channel not found: ${channel}`, { channel, ...details });
  }
}

/**
 * Network errors
 */
export class NetworkError extends WebOSError {
  constructor(code, message, details = {}) {
    super(code, message, details);
  }
}

export class ConnectionError extends NetworkError {
  constructor(url, details = {}) {
    super('ECONNREFUSED', `Connection failed: ${url}`, { url, ...details });
  }
}

export class TimeoutError extends NetworkError {
  constructor(operation, timeout, details = {}) {
    super(
      'ETIMEDOUT',
      `Operation timed out: ${operation} after ${timeout}ms`,
      { operation, timeout, ...details }
    );
  }
}

/**
 * Application errors
 */
export class ApplicationError extends WebOSError {
  constructor(code, message, details = {}) {
    super(code, message, details);
  }
}

export class ApplicationNotFoundError extends ApplicationError {
  constructor(appId, details = {}) {
    super('ENOAPP', `Application not found: ${appId}`, { appId, ...details });
  }
}

export class ApplicationInitError extends ApplicationError {
  constructor(appId, message, details = {}) {
    super(
      'EINIT',
      `Failed to initialize application ${appId}: ${message}`,
      { appId, ...details }
    );
  }
}

/**
 * Validation errors
 */
export class ValidationError extends WebOSError {
  constructor(field, message, details = {}) {
    super('EVALID', `Validation failed for ${field}: ${message}`, { field, ...details });
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends WebOSError {
  constructor(message, details = {}) {
    super('ECONFIG', `Configuration error: ${message}`, details);
  }
}

/**
 * Security errors
 */
export class SecurityError extends WebOSError {
  constructor(code, message, details = {}) {
    super(code, message, details);
  }
}

export class AuthenticationError extends SecurityError {
  constructor(message, details = {}) {
    super('EAUTH', `Authentication failed: ${message}`, details);
  }
}

export class AuthorizationError extends SecurityError {
  constructor(message, details = {}) {
    super('EAUTHZ', `Authorization failed: ${message}`, details);
  }
}

/**
 * User-related errors
 */
export class UserError extends WebOSError {
  constructor(code, message, details = {}) {
    super(code, message, details);
  }
}

export class UserNotFoundError extends UserError {
  constructor(username, details = {}) {
    super('ENOUSER', `User not found: ${username}`, { username, ...details });
  }
}

export class UserExistsError extends UserError {
  constructor(username, details = {}) {
    super('EUEXIST', `User already exists: ${username}`, { username, ...details });
  }
}

/**
 * Error handler utility
 */
export class ErrorHandler {
  static handlers = new Map();

  /**
   * Register an error handler for a specific error type
   */
  static register(ErrorClass, handler) {
    this.handlers.set(ErrorClass, handler);
  }

  /**
   * Handle an error using registered handlers or default behavior
   */
  static handle(error, context = {}) {
    // Find matching handler
    for (const [ErrorClass, handler] of this.handlers) {
      if (error instanceof ErrorClass) {
        return handler(error, context);
      }
    }

    // Default handling for WebOS errors
    if (error instanceof WebOSError) {
      console.error(`[${error.name}] ${error.message}`, error.details);
      return error;
    }

    // Default handling for standard errors
    console.error('Unhandled error:', error);
    return new WebOSError('EUNKNOWN', error.message || 'Unknown error', {
      originalError: error
    });
  }

  /**
   * Wrap async function with error handling
   */
  static async wrap(fn, context = {}) {
    try {
      return await fn();
    } catch (error) {
      return this.handle(error, context);
    }
  }

  /**
   * Create error handler middleware
   */
  static middleware(context = {}) {
    return async (fn) => {
      try {
        return await fn();
      } catch (error) {
        throw this.handle(error, context);
      }
    };
  }
}

// Export all error classes as a collection
export const Errors = {
  WebOSError,
  PermissionError,
  FileSystemError,
  FileNotFoundError,
  FileExistsError,
  DirectoryNotEmptyError,
  NotADirectoryError,
  IsADirectoryError,
  InvalidPathError,
  StorageQuotaExceededError,
  ProcessError,
  ProcessNotFoundError,
  ProcessSpawnError,
  ProcessTerminatedError,
  ResourceError,
  ResourceLimitExceededError,
  OutOfMemoryError,
  IPCError,
  MessageDeliveryError,
  ChannelNotFoundError,
  NetworkError,
  ConnectionError,
  TimeoutError,
  ApplicationError,
  ApplicationNotFoundError,
  ApplicationInitError,
  ValidationError,
  ConfigurationError,
  SecurityError,
  AuthenticationError,
  AuthorizationError,
  UserError,
  UserNotFoundError,
  UserExistsError
};

export default Errors;
