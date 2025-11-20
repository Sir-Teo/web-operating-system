# WebOS Fundamental Improvements

This document describes the major improvements made to the WebOS fundamental architecture.

## Overview

The following improvements address critical architectural issues identified in the codebase analysis:

1. **Unified Error Handling System**
2. **Comprehensive Logging Framework**
3. **Dependency Injection Container**
4. **Resource Monitoring and Limits**
5. **Runtime Permission Enforcement**
6. **Process-Window Decoupling**

---

## 1. Unified Error Handling System

### Location
`src/kernel/Errors.js`

### Purpose
Provides consistent, structured error handling across the entire OS with specific error types for different failure scenarios.

### Features

#### Base Error Class
```javascript
WebOSError - Base class for all OS errors
  - code: Error code (e.g., 'EACCES', 'ENOENT')
  - message: Human-readable error message
  - details: Additional context about the error
  - timestamp: When the error occurred
```

#### Error Categories

**File System Errors:**
- `FileSystemError` - Base for all file system errors
- `FileNotFoundError` - File or directory not found
- `FileExistsError` - File already exists
- `DirectoryNotEmptyError` - Cannot delete non-empty directory
- `NotADirectoryError` - Expected directory, got file
- `IsADirectoryError` - Expected file, got directory
- `InvalidPathError` - Invalid file path
- `StorageQuotaExceededError` - Storage limit exceeded

**Permission Errors:**
- `PermissionError` - Access denied

**Process Errors:**
- `ProcessError` - Base for process-related errors
- `ProcessNotFoundError` - Process does not exist
- `ProcessSpawnError` - Failed to create process
- `ProcessTerminatedError` - Process was terminated

**Resource Errors:**
- `ResourceError` - Base for resource-related errors
- `ResourceLimitExceededError` - Resource quota exceeded
- `OutOfMemoryError` - Insufficient memory

**IPC Errors:**
- `IPCError` - Base for communication errors
- `MessageDeliveryError` - Failed to deliver message
- `ChannelNotFoundError` - Communication channel not found

**Network Errors:**
- `NetworkError` - Base for network errors
- `ConnectionError` - Connection failed
- `TimeoutError` - Operation timed out

**Application Errors:**
- `ApplicationError` - Base for app errors
- `ApplicationNotFoundError` - App not found
- `ApplicationInitError` - App initialization failed

**Security Errors:**
- `SecurityError` - Base for security errors
- `AuthenticationError` - Authentication failed
- `AuthorizationError` - Authorization failed

**User Errors:**
- `UserError` - Base for user-related errors
- `UserNotFoundError` - User not found
- `UserExistsError` - User already exists

**Other Errors:**
- `ValidationError` - Input validation failed
- `ConfigurationError` - Configuration error

### Error Handler Utility

```javascript
ErrorHandler.register(ErrorClass, handler)  // Register custom error handler
ErrorHandler.handle(error, context)         // Handle error with registered handler
ErrorHandler.wrap(fn, context)              // Wrap async function with error handling
ErrorHandler.middleware(context)            // Create error handling middleware
```

### Benefits
- **Consistency**: All errors follow the same structure
- **Debugging**: Rich error details with context
- **Type Safety**: Specific error types for different scenarios
- **Handling**: Unified error handling with custom handlers
- **Logging**: Errors include timestamps and stack traces

---

## 2. Comprehensive Logging Framework

### Location
`src/kernel/Logger.js`

### Purpose
Provides structured, configurable logging across the OS with multiple output transports and log levels.

### Features

#### Log Levels
```javascript
LogLevel.DEBUG  // Detailed debugging information
LogLevel.INFO   // General informational messages
LogLevel.WARN   // Warning messages
LogLevel.ERROR  // Error messages
LogLevel.FATAL  // Fatal errors
```

#### Logger Class

```javascript
const logger = createLogger('ComponentName');

logger.debug('Debug message', data);
logger.info('Info message', data);
logger.warn('Warning message', data);
logger.error('Error message', error);
logger.fatal('Fatal error', error);

// Performance timing
const endTimer = logger.time('operation-name');
// ... do work ...
endTimer(); // Logs duration

// Grouped logging
const endGroup = logger.group('Group Name');
// ... log multiple related items ...
endGroup();

// Create child logger with additional context
const childLogger = logger.child({ requestId: '123' });
```

#### Log Transports

**ConsoleTransport** - Output to browser console
- Colored output
- Timestamp display
- Component name display
- Process ID display

**MemoryTransport** - Store logs in memory
- Configurable max entries
- Query and filter logs
- Useful for log viewers

**FileTransport** - Write logs to VFS
- Automatic log rotation
- Configurable max file size
- Buffered writes for performance
- Auto-flush on interval

#### Logger Manager

```javascript
const manager = getLoggerManager();

// Set global log level
manager.setGlobalLevel(LogLevel.INFO);

// Set component-specific level
manager.setComponentLevel('VFS', LogLevel.DEBUG);

// Add global transport
manager.addGlobalTransport(new FileTransport(vfs, '/var/log/system.log'));

// Get all loggers
const loggers = manager.getAllLoggers();
```

### Benefits
- **Visibility**: See what's happening inside the OS
- **Debugging**: Filter logs by level, component, or process
- **Performance**: Measure operation timing
- **Persistence**: Save logs to files for analysis
- **Configuration**: Control verbosity per component

---

## 3. Dependency Injection Container

### Location
`src/kernel/ServiceContainer.js`

### Purpose
Provides dependency injection for services, improving testability and decoupling.

### Features

#### Service Lifecycles

```javascript
ServiceLifecycle.SINGLETON  // Single instance shared globally
ServiceLifecycle.TRANSIENT  // New instance each time
ServiceLifecycle.SCOPED     // New instance per scope
```

#### Service Registration

```javascript
const container = new ServiceContainer();

// Register singleton
container.registerSingleton('vfs', (container) => {
  return new VirtualFileSystem();
});

// Register transient
container.registerTransient('request', (container) => {
  return new Request();
});

// Register scoped
container.registerScoped('session', (container) => {
  return new Session();
});

// Register existing instance
container.registerInstance('config', configObject);

// Register class with automatic injection
container.registerClass('MyService', MyServiceClass, ServiceLifecycle.SINGLETON, {
  dependencies: ['vfs', 'logger']
});
```

#### Service Resolution

```javascript
// Get service
const vfs = container.get('vfs');

// Resolve multiple dependencies
const [vfs, logger] = container.resolveDependencies(['vfs', 'logger']);

// Create scoped container
const scope = container.createScope();
const scopedService = scope.get('session');
await scope.dispose(); // Clean up scoped services
```

#### Advanced Features

**Decorators** - Wrap services with additional functionality
```javascript
container.decorate('vfs', (vfs, container) => {
  return new CachedVFS(vfs);
});
```

**Interceptors** - Intercept method calls
```javascript
container.intercept('vfs', 'readFile', {
  before: async (instance, method, args) => {
    console.log('Reading file:', args[0]);
  },
  after: async (instance, method, args, result) => {
    console.log('File read successfully');
    return result;
  },
  error: async (instance, method, args, error) => {
    console.error('File read failed:', error);
  }
});
```

**Child Containers** - Inherit parent services
```javascript
const child = container.createChild();
// Child can access parent services
```

### Benefits
- **Testability**: Easily mock dependencies in tests
- **Decoupling**: Services don't hard-code dependencies
- **Lifecycle Management**: Control when services are created and destroyed
- **Flexibility**: Swap implementations easily
- **Organization**: Central service registry

---

## 4. Resource Monitoring and Limits

### Location
`src/kernel/ResourceMonitor.js`

### Purpose
Track and limit CPU, memory, storage, and network usage for processes to prevent resource exhaustion.

### Features

#### Resource Types
```javascript
ResourceType.CPU      // CPU usage percentage
ResourceType.MEMORY   // Memory usage in bytes
ResourceType.STORAGE  // Storage usage in bytes
ResourceType.NETWORK  // Network bandwidth in bytes/second
ResourceType.GPU      // GPU usage (future)
```

#### Default Limits
```javascript
CPU: {
  max: 80%,           // Max CPU usage
  warn: 60%,          // Warning threshold
  throttle: 70%       // Start throttling
}

MEMORY: {
  max: 100MB,         // Max memory per process
  warn: 75MB,
  throttle: 90MB
}

STORAGE: {
  max: 500MB,         // Max storage per process
  warn: 400MB,
  throttle: 450MB
}
```

#### Process Resource Tracker

```javascript
const tracker = new ProcessResourceTracker(processId, customLimits);

// Update resource usage
tracker.updateCpu(cpuTime);
tracker.updateMemory(bytes);
tracker.updateStorage(bytes);
tracker.updateNetwork(bytesPerSecond);

// Check limits
if (tracker.shouldThrottle()) {
  // Throttle process
}

// Get statistics
const stats = tracker.getStatistics();
console.log(stats.current);   // Current usage
console.log(stats.peak);      // Peak usage
console.log(stats.averages);  // Average usage over time
```

#### Resource Monitor

```javascript
const monitor = getResourceMonitor();

// Start monitoring
monitor.start();

// Register process
monitor.registerProcess(processId, limits);

// Check allocation
if (monitor.canAllocateMemory(processId, bytes)) {
  monitor.requestMemory(processId, bytes);
  // ... use memory ...
  monitor.releaseMemory(processId, bytes);
}

// Get system statistics
const stats = monitor.getSystemStatistics();
console.log(stats.totals);      // Total resource usage
console.log(stats.processCount); // Number of processes

// Get throttled processes
const throttled = monitor.getThrottledProcesses();

// Stop monitoring
monitor.stop();
```

### Benefits
- **Stability**: Prevent processes from consuming unlimited resources
- **Fairness**: Ensure fair resource distribution
- **Monitoring**: Track resource usage over time
- **Warnings**: Alert when approaching limits
- **Throttling**: Slow down processes exceeding thresholds

---

## 5. Runtime Permission Enforcement

### Location
- `src/filesystem/VFS.js`
- `src/kernel/IPC.js`

### Purpose
Enforce permission checks at runtime when processes access protected resources.

### Implementation

#### VFS Permission Checks

Every VFS operation now checks permissions:

```javascript
async readFile(path) {
  this._checkPermission('filesystem.read', path);
  // ... read file ...
}

async writeFile(path, data) {
  this._checkPermission('filesystem.write', path);
  // ... write file ...
}

async rm(path) {
  this._checkPermission('filesystem.delete', path);
  // ... delete file ...
}
```

#### IPC Permission Checks

IPC operations check for communication permission:

```javascript
send(target, message) {
  this._checkPermission('system.ipc', { operation: 'send', target });
  // ... send message ...
}

broadcast(message) {
  this._checkPermission('system.ipc', { operation: 'broadcast' });
  // ... broadcast message ...
}
```

#### Process Context

Services track which process is making the call:

```javascript
// Set process context before VFS call
vfs.setProcessContext(process.pid);
await vfs.readFile('/home/user/document.txt');
vfs.clearProcessContext();
```

#### Permission Manager Integration

```javascript
// Configure VFS with PermissionManager
vfs.setPermissionManager(permissionManager);
vfs.setProcessManager(processManager);

// Now all VFS operations check permissions
```

### Benefits
- **Security**: Processes can only access what they're allowed to
- **Isolation**: Malicious or buggy apps can't damage system
- **Control**: Fine-grained access control
- **Auditing**: Log all permission checks
- **Compliance**: Meet security requirements

---

## 6. Process-Window Decoupling

### Location
`src/kernel/ProcessManager.js`

### Purpose
Allow processes to run without windows (headless), enabling background services.

### Changes

#### Process Class Enhancements

```javascript
class Process {
  constructor(config) {
    // ...
    this.windowId = null;        // Reference to window ID, not object
    this.headless = config.headless || false;  // Support headless
    this.metadata = config.metadata || {};
    this.exitCode = null;
  }

  // New methods
  isHeadless()  // Check if process has no window
  hasWindow()   // Check if process has a window
  getUptime()   // Get process uptime
  getInfo()     // Get complete process information
}
```

#### Spawn Headless Process

```javascript
// Spawn headless background process
const process = await processManager.spawn({
  name: 'BackgroundService',
  headless: true,
  permissions: ['filesystem.read', 'network.fetch'],
  worker: true  // Run in Web Worker for isolation
});
```

#### Process Manager Enhancements

```javascript
// List only headless processes
const headlessProcs = processManager.getHeadlessProcesses();

// List processes with filters
const runningProcs = processManager.listProcesses({
  state: 'running',
  headless: false
});

// Kill child processes
await processManager.killChildProcesses(parentPid);

// Get process or throw
const process = processManager.getProcessOrThrow(pid);
```

#### Resource Monitor Integration

```javascript
// ProcessManager automatically registers processes with ResourceMonitor
const process = await processManager.spawn({
  name: 'MyApp',
  resourceLimits: {
    memory: { max: 50 * 1024 * 1024 }  // 50MB max
  }
});
```

### Benefits
- **Background Services**: Run services without UI
- **Efficiency**: Don't create windows for non-UI processes
- **Flexibility**: Process lifetime independent of window lifetime
- **Architecture**: Cleaner separation of concerns
- **Scalability**: Support more processes without UI overhead

---

## Integration Guide

### Initializing the New Systems

```javascript
import { getContainer } from './kernel/ServiceContainer.js';
import { getLoggerManager, LogLevel, FileTransport } from './kernel/Logger.js';
import { getResourceMonitor } from './kernel/ResourceMonitor.js';
import Kernel from './kernel/Kernel.js';

// 1. Setup logging
const logManager = getLoggerManager();
logManager.setGlobalLevel(LogLevel.INFO);
logManager.setComponentLevel('VFS', LogLevel.DEBUG);

// Add file logging
const fileTransport = new FileTransport(
  vfs,
  '/var/log/system.log',
  LogLevel.INFO
);
logManager.addGlobalTransport(fileTransport);

// 2. Setup dependency injection
const container = getContainer();
container.registerInstance('vfs', vfs);
container.registerInstance('processManager', processManager);
container.registerInstance('permissionManager', permissionManager);

// 3. Setup resource monitoring
const resourceMonitor = getResourceMonitor();
resourceMonitor.start();

// 4. Configure VFS with permission checks
vfs.setPermissionManager(permissionManager);
vfs.setProcessManager(processManager);

// 5. Configure IPC with permission checks
ipc.setPermissionManager(permissionManager);
ipc.setProcessManager(processManager);

// 6. Configure ProcessManager with resource monitoring
processManager.setResourceMonitor(resourceMonitor);

// 7. Boot kernel
await Kernel.boot();
```

### Using the Systems

#### Error Handling
```javascript
import { FileNotFoundError } from './kernel/Errors.js';

try {
  await vfs.readFile('/path/to/file.txt');
} catch (err) {
  if (err instanceof FileNotFoundError) {
    console.error('File not found:', err.details.path);
  }
}
```

#### Logging
```javascript
import { createLogger } from './kernel/Logger.js';

const logger = createLogger('MyComponent');
logger.info('Starting operation');

const endTimer = logger.time('heavy-operation');
// ... do work ...
endTimer(); // Logs: "heavy-operation: 123.45ms"
```

#### Dependency Injection
```javascript
import { getContainer } from './kernel/ServiceContainer.js';

const container = getContainer();
const vfs = container.get('vfs');
```

#### Resource Monitoring
```javascript
import { getResourceMonitor } from './kernel/ResourceMonitor.js';

const monitor = getResourceMonitor();

// Check before allocation
if (monitor.canAllocateMemory(processId, sizeInBytes)) {
  monitor.requestMemory(processId, sizeInBytes);
  // ... allocate memory ...
}
```

#### Headless Processes
```javascript
// Background process
const process = await processManager.spawn({
  name: 'SyncService',
  headless: true,
  permissions: ['network.fetch', 'filesystem.write'],
  priority: 'background'
});

// Check if headless
if (process.isHeadless()) {
  console.log('Background process running');
}
```

---

## Migration Notes

### Breaking Changes

1. **Process.window removed** - Use `Process.windowId` instead
2. **VFS requires configuration** - Must call `setPermissionManager()` and `setProcessManager()`
3. **IPC requires configuration** - Must call `setPermissionManager()` and `setProcessManager()`
4. **Error types changed** - Import specific errors from `Errors.js`

### Backward Compatibility

The improvements are designed to be mostly backward compatible:

- Permission checks can be disabled: `vfs.permissionChecksEnabled = false`
- Logging works without configuration (console output by default)
- Resource monitoring is optional
- Processes work with or without windows

### Testing

All new systems include comprehensive error handling and logging, making them easier to debug and test:

```javascript
// Disable permission checks for testing
vfs.permissionChecksEnabled = false;

// Reduce log level for testing
getLoggerManager().setGlobalLevel(LogLevel.ERROR);

// Use memory transport for log testing
const memoryTransport = new MemoryTransport();
logger.addTransport(memoryTransport);
// ... run tests ...
const logs = memoryTransport.getEntries({ level: LogLevel.ERROR });
```

---

## Performance Impact

The improvements are designed for minimal performance impact:

1. **Permission checks**: O(1) lookup in Set
2. **Logging**: Configurable levels to reduce overhead in production
3. **DI container**: Singleton caching for common services
4. **Resource monitoring**: Periodic sampling (1s interval by default)
5. **Error creation**: Only when errors occur

---

## Future Enhancements

Potential future improvements:

1. **Web Worker Process Isolation**: Full sandboxing of processes in workers
2. **TypeScript Migration**: Type safety for all systems
3. **Advanced Resource Tracking**: GPU, thread count, network bandwidth
4. **Distributed Logging**: Send logs to remote server
5. **Hot Module Replacement**: Update code without restart
6. **Process Priorities**: Scheduler respects process priorities
7. **Audit Logging**: Security audit trail
8. **Performance Profiling**: Built-in profiler integration

---

## Conclusion

These fundamental improvements address critical architectural issues in the WebOS:

✅ **Consistent error handling** with rich context
✅ **Comprehensive logging** for debugging and monitoring
✅ **Dependency injection** for better architecture
✅ **Resource management** to prevent exhaustion
✅ **Runtime permission enforcement** for security
✅ **Process-window decoupling** for flexibility

The OS now has a solid foundation for building robust, secure, and maintainable applications.
