/**
 * DevTools Application
 *
 * Integrated developer tools application combining:
 * - Console
 * - Performance Profiler
 * - Network Inspector
 * - Build Tools
 * - Test Runner
 */

import DevConsole from '../../devtools/DevConsole.js';
import PerformanceProfiler from '../../devtools/PerformanceProfiler.js';
import NetworkInspector from '../../devtools/NetworkInspector.js';
import BuildTools from '../../devtools/BuildTools.js';
import TestRunner from '../../devtools/TestRunner.js';

export default class DevTools {
  constructor(context) {
    this.context = context;
    this.fs = context.fs;
    this.window = context.window;

    // Initialize tools
    this.console = new DevConsole({ context: window });
    this.profiler = new PerformanceProfiler();
    this.network = new NetworkInspector();
    this.buildTools = new BuildTools();
    this.testRunner = new TestRunner();

    this.currentTab = 'console';
  }

  async init() {
    await this.console.init();
    this.network.start();

    console.log('[DevTools] Initialized');
  }

  render() {
    const container = document.createElement('div');
    container.className = 'devtools-container';
    container.innerHTML = this._getHTML();

    // Attach event listeners
    setTimeout(() => this._attachListeners(container), 0);

    return container;
  }

  _getHTML() {
    return `
      <div class="devtools">
        <!-- Tabs -->
        <div class="devtools-tabs">
          <button class="devtools-tab ${this.currentTab === 'console' ? 'active' : ''}" data-tab="console">
            📊 Console
          </button>
          <button class="devtools-tab ${this.currentTab === 'network' ? 'active' : ''}" data-tab="network">
            🌐 Network
          </button>
          <button class="devtools-tab ${this.currentTab === 'performance' ? 'active' : ''}" data-tab="performance">
            ⚡ Performance
          </button>
          <button class="devtools-tab ${this.currentTab === 'build' ? 'active' : ''}" data-tab="build">
            🔧 Build
          </button>
          <button class="devtools-tab ${this.currentTab === 'test' ? 'active' : ''}" data-tab="test">
            🧪 Tests
          </button>
        </div>

        <!-- Tab Content -->
        <div class="devtools-content">
          ${this._renderTabContent()}
        </div>
      </div>

      <style>
        .devtools-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #1e1e1e;
          color: #d4d4d4;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 13px;
        }

        .devtools-tabs {
          display: flex;
          background: #252526;
          border-bottom: 1px solid #3e3e3e;
        }

        .devtools-tab {
          padding: 10px 20px;
          background: transparent;
          border: none;
          color: #969696;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
        }

        .devtools-tab:hover {
          color: #d4d4d4;
          background: #2a2a2a;
        }

        .devtools-tab.active {
          color: #ffffff;
          border-bottom-color: #007acc;
        }

        .devtools-content {
          flex: 1;
          overflow: auto;
          padding: 15px;
        }

        /* Console Styles */
        .console-log {
          margin: 4px 0;
          font-family: 'Consolas', monospace;
        }

        .console-log.info { color: #75beff; }
        .console-log.warn { color: #cca700; }
        .console-log.error { color: #f48771; }
        .console-log.debug { color: #b5cea8; }

        .console-input {
          display: flex;
          margin-top: 15px;
          padding: 8px;
          background: #2d2d2d;
          border-radius: 4px;
        }

        .console-input input {
          flex: 1;
          background: transparent;
          border: none;
          color: #d4d4d4;
          font-family: 'Consolas', monospace;
          font-size: 13px;
          outline: none;
        }

        /* Network Styles */
        .network-table {
          width: 100%;
          border-collapse: collapse;
        }

        .network-table th {
          text-align: left;
          padding: 8px;
          background: #2d2d2d;
          border-bottom: 1px solid #3e3e3e;
          font-weight: normal;
          color: #969696;
        }

        .network-table td {
          padding: 8px;
          border-bottom: 1px solid #2d2d2d;
        }

        .network-table tr:hover {
          background: #2a2a2a;
        }

        .status-200 { color: #89d185; }
        .status-300 { color: #75beff; }
        .status-400, .status-500 { color: #f48771; }

        /* Performance Styles */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .metric-card {
          background: #2d2d2d;
          padding: 15px;
          border-radius: 6px;
          border-left: 3px solid #007acc;
        }

        .metric-label {
          color: #969696;
          font-size: 12px;
          margin-bottom: 5px;
        }

        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #d4d4d4;
        }

        .metric-unit {
          font-size: 14px;
          color: #969696;
          margin-left: 5px;
        }

        /* Build Styles */
        .build-controls {
          margin-bottom: 20px;
        }

        .build-btn {
          padding: 10px 20px;
          background: #007acc;
          border: none;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          margin-right: 10px;
        }

        .build-btn:hover {
          background: #005a9e;
        }

        .build-output {
          background: #2d2d2d;
          padding: 15px;
          border-radius: 4px;
          font-family: 'Consolas', monospace;
          max-height: 400px;
          overflow: auto;
        }

        /* Test Styles */
        .test-results {
          background: #2d2d2d;
          padding: 15px;
          border-radius: 4px;
        }

        .test-summary {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid #3e3e3e;
        }

        .test-stat {
          font-size: 18px;
        }

        .test-stat.passed { color: #89d185; }
        .test-stat.failed { color: #f48771; }

        .coverage-bar {
          background: #3e3e3e;
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 5px;
        }

        .coverage-fill {
          height: 100%;
          background: linear-gradient(90deg, #007acc, #00bcf2);
          transition: width 0.3s;
        }
      </style>
    `;
  }

  _renderTabContent() {
    switch (this.currentTab) {
      case 'console':
        return this._renderConsole();
      case 'network':
        return this._renderNetwork();
      case 'performance':
        return this._renderPerformance();
      case 'build':
        return this._renderBuild();
      case 'test':
        return this._renderTest();
      default:
        return '<div>Select a tab</div>';
    }
  }

  _renderConsole() {
    const logs = this.console.getLogs();

    return `
      <div class="console-panel">
        <div class="console-logs">
          ${logs.map(log => `
            <div class="console-log ${log.level}">
              <span class="log-timestamp">${new Date(log.timestamp).toLocaleTimeString()}</span>
              ${log.message.map(msg => this._formatLogMessage(msg)).join(' ')}
            </div>
          `).join('')}
        </div>
        <div class="console-input">
          <input type="text" id="console-input" placeholder="Enter JavaScript code..." />
        </div>
      </div>
    `;
  }

  _renderNetwork() {
    const requests = this.network.getRequests();

    return `
      <div class="network-panel">
        <div class="network-controls" style="margin-bottom: 15px;">
          <button class="build-btn" onclick="window.devToolsInstance?.clearNetwork()">Clear</button>
          <button class="build-btn" onclick="window.devToolsInstance?.exportHAR()">Export HAR</button>
        </div>
        <table class="network-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>URL</th>
              <th>Status</th>
              <th>Time</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            ${requests.map(req => `
              <tr>
                <td>${req.method}</td>
                <td>${req.url}</td>
                <td class="status-${Math.floor(req.response?.status / 100)}00">
                  ${req.response?.status || '-'}
                </td>
                <td>${req.response?.time ? req.response.time.toFixed(0) + 'ms' : '-'}</td>
                <td>${req.response?.size ? this._formatBytes(req.response.size) : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${requests.length === 0 ? '<div style="text-align: center; padding: 40px; color: #969696;">No network activity</div>' : ''}
      </div>
    `;
  }

  _renderPerformance() {
    const metrics = this.profiler.getMetrics();

    return `
      <div class="performance-panel">
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">First Contentful Paint</div>
            <div class="metric-value">
              ${metrics.paint?.fcp ? (metrics.paint.fcp / 1000).toFixed(2) : '-'}
              <span class="metric-unit">s</span>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Largest Contentful Paint</div>
            <div class="metric-value">
              ${metrics.paint?.lcp ? (metrics.paint.lcp / 1000).toFixed(2) : '-'}
              <span class="metric-unit">s</span>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Memory Usage</div>
            <div class="metric-value">
              ${metrics.memory?.percentage ? metrics.memory.percentage.toFixed(1) : '-'}
              <span class="metric-unit">%</span>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Resources Loaded</div>
            <div class="metric-value">${metrics.resources?.length || 0}</div>
          </div>
        </div>
        <div class="performance-controls">
          <button class="build-btn" onclick="window.devToolsInstance?.startProfiling()">Start Profiling</button>
          <button class="build-btn" onclick="window.devToolsInstance?.stopProfiling()">Stop Profiling</button>
          <button class="build-btn" onclick="window.devToolsInstance?.takeSnapshot()">Take Snapshot</button>
        </div>
      </div>
    `;
  }

  _renderBuild() {
    return `
      <div class="build-panel">
        <div class="build-controls">
          <button class="build-btn" onclick="window.devToolsInstance?.runBuild('production')">
            Build Production
          </button>
          <button class="build-btn" onclick="window.devToolsInstance?.runBuild('development')">
            Build Development
          </button>
          <button class="build-btn" onclick="window.devToolsInstance?.analyzeBundle()">
            Analyze Bundle
          </button>
        </div>
        <div class="build-output" id="build-output">
          <div style="color: #969696;">Click a button to start building...</div>
        </div>
      </div>
    `;
  }

  _renderTest() {
    const results = this.testRunner.getResults();

    return `
      <div class="test-panel">
        <div class="build-controls">
          <button class="build-btn" onclick="window.devToolsInstance?.runTests()">Run Tests</button>
          <button class="build-btn" onclick="window.devToolsInstance?.runTestsWithCoverage()">Run with Coverage</button>
        </div>
        <div class="test-results">
          <div class="test-summary">
            <div class="test-stat">
              Total: <strong>${results.total}</strong>
            </div>
            <div class="test-stat passed">
              Passed: <strong>${results.passed}</strong>
            </div>
            <div class="test-stat failed">
              Failed: <strong>${results.failed}</strong>
            </div>
          </div>
          ${results.coverage ? `
            <div class="coverage-section">
              <h3 style="margin-bottom: 15px;">Coverage</h3>
              <div style="margin-bottom: 10px;">
                <div>Lines: ${results.coverage.lines}%</div>
                <div class="coverage-bar">
                  <div class="coverage-fill" style="width: ${results.coverage.lines}%"></div>
                </div>
              </div>
              <div style="margin-bottom: 10px;">
                <div>Branches: ${results.coverage.branches}%</div>
                <div class="coverage-bar">
                  <div class="coverage-fill" style="width: ${results.coverage.branches}%"></div>
                </div>
              </div>
              <div style="margin-bottom: 10px;">
                <div>Functions: ${results.coverage.functions}%</div>
                <div class="coverage-bar">
                  <div class="coverage-fill" style="width: ${results.coverage.functions}%"></div>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  _attachListeners(container) {
    // Store instance globally for button callbacks
    window.devToolsInstance = this;

    // Tab switching
    const tabs = container.querySelectorAll('.devtools-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.currentTab = tab.dataset.tab;
        this._updateView(container);
      });
    });

    // Console input
    const consoleInput = container.querySelector('#console-input');
    if (consoleInput) {
      consoleInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
          const code = e.target.value;
          if (code) {
            try {
              await this.console.execute(code);
              e.target.value = '';
              this._updateView(container);
            } catch (error) {
              console.error('Execution error:', error);
            }
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = this.console.historyUp();
          if (prev) e.target.value = prev;
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = this.console.historyDown();
          e.target.value = next || '';
        }
      });
    }
  }

  _updateView(container) {
    const content = container.querySelector('.devtools-content');
    if (content) {
      content.innerHTML = this._renderTabContent();
      this._attachListeners(container);
    }
  }

  _formatLogMessage(msg) {
    if (typeof msg === 'object') {
      return `<pre>${JSON.stringify(msg, null, 2)}</pre>`;
    }
    return String(msg);
  }

  _formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Public methods for button callbacks

  clearNetwork() {
    this.network.clear();
    this._updateView(document.querySelector('.devtools-container'));
  }

  async exportHAR() {
    const har = this.network.exportHAR();
    console.log('[DevTools] HAR Export:', har);
    alert('HAR exported to console');
  }

  startProfiling() {
    this.profiler.startCPUProfile('user-profile');
    console.log('[DevTools] CPU Profiling started');
  }

  stopProfiling() {
    const profile = this.profiler.stopCPUProfile('user-profile');
    console.log('[DevTools] CPU Profile:', profile);
    alert('Profile captured. Check console for details.');
  }

  takeSnapshot() {
    const snapshot = this.profiler.takeHeapSnapshot();
    console.log('[DevTools] Heap Snapshot:', snapshot);
    alert(`Snapshot taken. Used: ${this._formatBytes(snapshot.usedSize)}, Detached: ${snapshot.detachedNodes}`);
  }

  async runBuild(mode) {
    const output = document.getElementById('build-output');
    if (output) {
      output.innerHTML = `<div style="color: #75beff;">Building for ${mode}...</div>`;
    }

    const result = await this.buildTools.build('vite', { mode });

    if (output) {
      output.innerHTML = result.output.map(line =>
        `<div>${line}</div>`
      ).join('') + `<div style="color: #89d185; margin-top: 10px;">✓ Build completed in ${result.duration.toFixed(0)}ms</div>`;
    }
  }

  async analyzeBundle() {
    const analysis = await this.buildTools.analyzeBundle('/dist/bundle.js');
    console.log('[DevTools] Bundle Analysis:', analysis);
    alert('Bundle analysis complete. Check console for details.');
  }

  async runTests() {
    const results = await this.testRunner.runTests('**/*.test.js');
    this._updateView(document.querySelector('.devtools-container'));
  }

  async runTestsWithCoverage() {
    const results = await this.testRunner.runWithCoverage('**/*.test.js');
    this._updateView(document.querySelector('.devtools-container'));
  }
}
