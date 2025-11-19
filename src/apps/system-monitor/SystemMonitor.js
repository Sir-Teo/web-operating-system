/**
 * System Monitor Application
 * Real-time system monitoring and resource management
 */
import ProcessManager from '../../kernel/ProcessManager.js';

export default class SystemMonitor {
  constructor(context) {
    this.context = context;
    this.updateInterval = null;
    this.performanceHistory = {
      cpu: [],
      memory: [],
      network: []
    };
    this.maxHistoryLength = 60; // 60 seconds
    this.container = null;
  }

  async init() {
    // Initialize monitoring
  }

  async render() {
    this.container = document.createElement('div');
    this.container.className = 'system-monitor-app';
    this.container.innerHTML = this.getHTML();

    // Start monitoring
    this.startMonitoring();

    // Setup tab switching
    this.setupTabs();

    return this.container;
  }

  getHTML() {
    return `
      <div class="system-monitor-layout">
        <!-- Header Tabs -->
        <div class="monitor-tabs">
          <button class="monitor-tab active" data-tab="overview">📊 Overview</button>
          <button class="monitor-tab" data-tab="processes">⚙️ Processes</button>
          <button class="monitor-tab" data-tab="performance">📈 Performance</button>
          <button class="monitor-tab" data-tab="storage">💾 Storage</button>
        </div>

        <!-- Tab Content -->
        <div class="monitor-content">
          <!-- Overview Tab -->
          <div class="monitor-panel active" id="panel-overview">
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-icon">🖥️</div>
                <div class="metric-info">
                  <div class="metric-label">CPU Usage</div>
                  <div class="metric-value" id="cpu-value">0%</div>
                </div>
                <div class="metric-bar">
                  <div class="metric-bar-fill" id="cpu-bar"></div>
                </div>
              </div>

              <div class="metric-card">
                <div class="metric-icon">🧠</div>
                <div class="metric-info">
                  <div class="metric-label">Memory Usage</div>
                  <div class="metric-value" id="memory-value">0 MB</div>
                </div>
                <div class="metric-bar">
                  <div class="metric-bar-fill" id="memory-bar"></div>
                </div>
              </div>

              <div class="metric-card">
                <div class="metric-icon">💾</div>
                <div class="metric-info">
                  <div class="metric-label">Storage Used</div>
                  <div class="metric-value" id="storage-value">0 MB</div>
                </div>
                <div class="metric-bar">
                  <div class="metric-bar-fill" id="storage-bar"></div>
                </div>
              </div>

              <div class="metric-card">
                <div class="metric-icon">📡</div>
                <div class="metric-info">
                  <div class="metric-label">Active Processes</div>
                  <div class="metric-value" id="process-value">0</div>
                </div>
              </div>
            </div>

            <div class="system-info">
              <h3>System Information</h3>
              <table class="info-table">
                <tr>
                  <td>Operating System:</td>
                  <td>WebOS v2.6.0</td>
                </tr>
                <tr>
                  <td>Browser:</td>
                  <td id="browser-info">-</td>
                </tr>
                <tr>
                  <td>Screen Resolution:</td>
                  <td id="screen-info">-</td>
                </tr>
                <tr>
                  <td>Uptime:</td>
                  <td id="uptime-info">-</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Processes Tab -->
          <div class="monitor-panel" id="panel-processes">
            <div class="processes-toolbar">
              <input type="text" id="process-search" placeholder="Search processes..." class="process-search">
              <button id="refresh-processes" class="toolbar-btn">🔄 Refresh</button>
            </div>
            <div class="processes-table-container">
              <table class="processes-table">
                <thead>
                  <tr>
                    <th>PID</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>CPU %</th>
                    <th>Memory</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="processes-list">
                  <tr>
                    <td colspan="6" class="no-data">Loading processes...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Performance Tab -->
          <div class="monitor-panel" id="panel-performance">
            <div class="chart-container">
              <h3>CPU Usage History</h3>
              <canvas id="cpu-chart" width="600" height="200"></canvas>
            </div>
            <div class="chart-container">
              <h3>Memory Usage History</h3>
              <canvas id="memory-chart" width="600" height="200"></canvas>
            </div>
          </div>

          <!-- Storage Tab -->
          <div class="monitor-panel" id="panel-storage">
            <div class="storage-overview">
              <h3>Storage Overview</h3>
              <div class="storage-bar-large">
                <div class="storage-bar-fill" id="storage-bar-large"></div>
              </div>
              <div class="storage-details">
                <div><strong>Used:</strong> <span id="storage-used">0 MB</span></div>
                <div><strong>Available:</strong> <span id="storage-available">0 MB</span></div>
                <div><strong>Total:</strong> <span id="storage-total">0 MB</span></div>
              </div>
            </div>
            <div class="storage-breakdown">
              <h3>Storage Breakdown</h3>
              <div id="storage-breakdown-list">
                <div class="loading">Calculating storage usage...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupTabs() {
    const tabs = this.container.querySelectorAll('.monitor-tab');
    const panels = this.container.querySelectorAll('.monitor-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;

        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update active panel
        panels.forEach(p => p.classList.remove('active'));
        this.container.querySelector(`#panel-${tabName}`).classList.add('active');
      });
    });

    // Setup process search
    const searchInput = this.container.querySelector('#process-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterProcesses(e.target.value);
      });
    }

    // Setup refresh button
    const refreshBtn = this.container.querySelector('#refresh-processes');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.updateProcessList();
      });
    }
  }

  startMonitoring() {
    // Initial update
    this.updateMetrics();

    // Update browser info
    this.updateSystemInfo();

    // Update every second
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
    }, 1000);
  }

  async updateMetrics() {
    const metrics = {
      cpu: this.getCPUUsage(),
      memory: await this.getMemoryUsage(),
      storage: await this.getStorageUsage(),
      processes: this.getProcessList()
    };

    // Update overview cards
    this.updateOverviewCards(metrics);

    // Update performance history
    this.updatePerformanceHistory(metrics);

    // Update process list
    this.updateProcessList();

    // Update storage info
    this.updateStorageInfo(metrics.storage);
  }

  getCPUUsage() {
    // Simulate CPU usage based on number of processes
    const processes = ProcessManager.listProcesses();
    const usage = Math.min(processes.length * 5 + Math.random() * 10, 100);
    return Math.round(usage);
  }

  async getMemoryUsage() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        total: estimate.quota || 0
      };
    }
    return { used: 0, total: 0 };
  }

  async getStorageUsage() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        total: estimate.quota || 0,
        available: (estimate.quota || 0) - (estimate.usage || 0)
      };
    }
    return { used: 0, total: 0, available: 0 };
  }

  getProcessList() {
    return ProcessManager.listProcesses();
  }

  updateOverviewCards(metrics) {
    // CPU
    const cpuValue = this.container.querySelector('#cpu-value');
    const cpuBar = this.container.querySelector('#cpu-bar');
    if (cpuValue && cpuBar) {
      cpuValue.textContent = `${metrics.cpu}%`;
      cpuBar.style.width = `${metrics.cpu}%`;
      cpuBar.style.backgroundColor = this.getColorForPercentage(metrics.cpu);
    }

    // Memory
    const memoryValue = this.container.querySelector('#memory-value');
    const memoryBar = this.container.querySelector('#memory-bar');
    if (memoryValue && memoryBar && metrics.memory.total > 0) {
      const memoryPercent = (metrics.memory.used / metrics.memory.total) * 100;
      memoryValue.textContent = this.formatBytes(metrics.memory.used);
      memoryBar.style.width = `${memoryPercent}%`;
      memoryBar.style.backgroundColor = this.getColorForPercentage(memoryPercent);
    }

    // Storage
    const storageValue = this.container.querySelector('#storage-value');
    const storageBar = this.container.querySelector('#storage-bar');
    if (storageValue && storageBar && metrics.storage.total > 0) {
      const storagePercent = (metrics.storage.used / metrics.storage.total) * 100;
      storageValue.textContent = this.formatBytes(metrics.storage.used);
      storageBar.style.width = `${storagePercent}%`;
      storageBar.style.backgroundColor = this.getColorForPercentage(storagePercent);
    }

    // Processes
    const processValue = this.container.querySelector('#process-value');
    if (processValue) {
      processValue.textContent = metrics.processes.length;
    }
  }

  updateSystemInfo() {
    const browserInfo = this.container.querySelector('#browser-info');
    const screenInfo = this.container.querySelector('#screen-info');
    const uptimeInfo = this.container.querySelector('#uptime-info');

    if (browserInfo) {
      browserInfo.textContent = navigator.userAgent.split(' ').slice(-1)[0];
    }

    if (screenInfo) {
      screenInfo.textContent = `${window.screen.width}x${window.screen.height}`;
    }

    if (uptimeInfo) {
      const uptime = performance.now();
      uptimeInfo.textContent = this.formatUptime(uptime);
    }
  }

  updatePerformanceHistory(metrics) {
    // Add to history
    this.performanceHistory.cpu.push({
      timestamp: Date.now(),
      value: metrics.cpu
    });

    if (metrics.memory.total > 0) {
      const memoryPercent = (metrics.memory.used / metrics.memory.total) * 100;
      this.performanceHistory.memory.push({
        timestamp: Date.now(),
        value: memoryPercent
      });
    }

    // Keep only last 60 seconds
    if (this.performanceHistory.cpu.length > this.maxHistoryLength) {
      this.performanceHistory.cpu.shift();
    }
    if (this.performanceHistory.memory.length > this.maxHistoryLength) {
      this.performanceHistory.memory.shift();
    }

    // Update charts
    this.updateCharts();
  }

  updateCharts() {
    this.drawChart('cpu-chart', this.performanceHistory.cpu, '#667eea');
    this.drawChart('memory-chart', this.performanceHistory.memory, '#f093fb');
  }

  drawChart(canvasId, data, color) {
    const canvas = this.container.querySelector(`#${canvasId}`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (data.length < 2) return;

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const pointWidth = width / (this.maxHistoryLength - 1);

    data.forEach((point, index) => {
      const x = index * pointWidth;
      const y = height - (point.value / 100) * height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Fill area under line
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = color + '20';
    ctx.fill();
  }

  updateProcessList() {
    const processList = this.container.querySelector('#processes-list');
    if (!processList) return;

    const processes = this.getProcessList();

    if (processes.length === 0) {
      processList.innerHTML = '<tr><td colspan="6" class="no-data">No processes running</td></tr>';
      return;
    }

    processList.innerHTML = processes.map(proc => `
      <tr>
        <td>${proc.pid}</td>
        <td>${proc.name}</td>
        <td><span class="status-badge status-${proc.status}">${proc.status}</span></td>
        <td>${Math.floor(Math.random() * 20)}%</td>
        <td>${this.formatBytes(Math.random() * 10000000)}</td>
        <td>
          <button class="action-btn" onclick="event.target.closest('.system-monitor-app').__killProcess(${proc.pid})">🗑️ Kill</button>
        </td>
      </tr>
    `).join('');

    // Store reference for onclick handlers
    this.container.__killProcess = (pid) => this.killProcess(pid);
  }

  filterProcesses(query) {
    const rows = this.container.querySelectorAll('#processes-list tr');
    const lowerQuery = query.toLowerCase();

    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(lowerQuery) ? '' : 'none';
    });
  }

  killProcess(pid) {
    if (confirm(`Are you sure you want to kill process ${pid}?`)) {
      ProcessManager.kill(pid);
      this.updateProcessList();
    }
  }

  async updateStorageInfo(storage) {
    const storageBarLarge = this.container.querySelector('#storage-bar-large');
    const storageUsed = this.container.querySelector('#storage-used');
    const storageAvailable = this.container.querySelector('#storage-available');
    const storageTotal = this.container.querySelector('#storage-total');

    if (storage.total > 0) {
      const percent = (storage.used / storage.total) * 100;

      if (storageBarLarge) {
        storageBarLarge.style.width = `${percent}%`;
        storageBarLarge.style.backgroundColor = this.getColorForPercentage(percent);
      }

      if (storageUsed) storageUsed.textContent = this.formatBytes(storage.used);
      if (storageAvailable) storageAvailable.textContent = this.formatBytes(storage.available);
      if (storageTotal) storageTotal.textContent = this.formatBytes(storage.total);
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  getColorForPercentage(percent) {
    if (percent < 50) return '#28a745';
    if (percent < 75) return '#ffc107';
    return '#dc3545';
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}
