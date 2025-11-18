// Global test setup
import { vi } from 'vitest';

// Mock browser APIs that aren't available in happy-dom
global.BroadcastChannel = class BroadcastChannel {
  constructor(name) {
    this.name = name;
    this.onmessage = null;
  }
  postMessage(data) {
    if (this.onmessage) {
      setTimeout(() => this.onmessage({ data }), 0);
    }
  }
  close() {}
};

// Mock IndexedDB if needed
if (!global.indexedDB) {
  global.indexedDB = {
    open: vi.fn(),
    deleteDatabase: vi.fn(),
  };
}

// Mock File System Access API (OPFS)
if (!global.navigator.storage) {
  global.navigator.storage = {
    getDirectory: vi.fn().mockResolvedValue({
      getDirectoryHandle: vi.fn(),
      getFileHandle: vi.fn(),
    }),
  };
}

// Mock scheduler API
if (!global.scheduler) {
  global.scheduler = {
    postTask: vi.fn((callback) => Promise.resolve(callback())),
  };
}

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
