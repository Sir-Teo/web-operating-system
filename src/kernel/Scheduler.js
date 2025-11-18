class TaskScheduler {
  constructor() {
    this.scheduler = window.scheduler || this._polyfill();
    this.taskQueue = {
      'user-blocking': [],
      'user-visible': [],
      'background': []
    };
  }

  async scheduleTask(callback, options = {}) {
    const {
      priority = 'user-visible',
      delay = 0,
      signal = null
    } = options;

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return this.scheduler.postTask(callback, {
      priority,
      signal
    });
  }

  async yield() {
    // Yield control back to browser
    if (this.scheduler.yield) {
      await this.scheduler.yield();
    } else {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  createAbortController() {
    return new AbortController();
  }

  _polyfill() {
    // Polyfill for browsers without Scheduler API
    return {
      postTask: async (callback, options) => {
        return new Promise((resolve, reject) => {
          const priority = options?.priority || 'user-visible';
          const delay = priority === 'background' ? 100 : 0;

          setTimeout(async () => {
            try {
              resolve(await callback());
            } catch (error) {
              reject(error);
            }
          }, delay);
        });
      }
    };
  }
}

export default new TaskScheduler();
