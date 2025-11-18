export class Logger {
  constructor(namespace) {
    this.namespace = namespace;
    this.enabled = true;
  }

  _log(level, ...args) {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${this.namespace}]`;

    console[level](prefix, ...args);
  }

  debug(...args) {
    this._log('debug', ...args);
  }

  info(...args) {
    this._log('info', ...args);
  }

  warn(...args) {
    this._log('warn', ...args);
  }

  error(...args) {
    this._log('error', ...args);
  }
}
