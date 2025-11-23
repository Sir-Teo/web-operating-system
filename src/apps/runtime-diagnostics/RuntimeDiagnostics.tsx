/**
 * Runtime Diagnostics Dashboard
 * Monitor health, performance, and resource usage of the runtime system
 */

import React, { useState, useEffect } from 'react';
import EnhancedRuntimeManager from '../../system/runtime/EnhancedRuntimeManager';
import Logger, { LogLevel, LogCategory } from '../../system/runtime/Logger';
import CacheManager from '../../system/runtime/CacheManager';
import ResourceMonitor from '../../system/runtime/ResourceMonitor';
import ConfigurationManager from '../../system/runtime/ConfigurationManager';

interface RuntimeDiagnosticsProps {
  windowId: string;
}

const RuntimeDiagnostics: React.FC<RuntimeDiagnosticsProps> = ({ windowId }) => {
  const [runtimeManager] = useState(() => EnhancedRuntimeManager.getEnhancedInstance());
  const [logger] = useState(() => Logger.getInstance());
  const [cache] = useState(() => CacheManager.getInstance());
  const [monitor] = useState(() => ResourceMonitor.getInstance());
  const [config] = useState(() => ConfigurationManager.getInstance());

  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'cache' | 'config'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [logFilter, setLogFilter] = useState<{ level?: LogLevel; category?: LogCategory }>({});

  useEffect(() => {
    refreshData();

    if (autoRefresh) {
      const interval = setInterval(refreshData, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const refreshData = async () => {
    const diag = runtimeManager.getDiagnostics();
    const healthCheck = await runtimeManager.healthCheck();
    const recentLogs = logger.getLogs({ limit: 100 });

    setDiagnostics(diag);
    setHealth(healthCheck);
    setLogs(recentLogs);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  if (!diagnostics || !health) {
    return <div style={{ padding: '20px' }}>Loading diagnostics...</div>;
  }

  return (
    <div className="runtime-diagnostics">
      <style>{`
        .runtime-diagnostics {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #0a0e1a;
          color: #e0e6ed;
          font-family: 'Segoe UI', system-ui, sans-serif;
          overflow: hidden;
        }

        .rd-header {
          padding: 20px;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .rd-header h1 {
          margin: 0 0 10px 0;
          font-size: 24px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .rd-health-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .rd-health-badge.healthy {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .rd-health-badge.unhealthy {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .rd-toolbar {
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .rd-tabs {
          display: flex;
          gap: 2px;
          flex: 1;
        }

        .rd-tab {
          padding: 8px 20px;
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .rd-tab:hover {
          color: #e0e6ed;
          background: rgba(255, 255, 255, 0.05);
        }

        .rd-tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .rd-button {
          padding: 8px 16px;
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid #3b82f6;
          border-radius: 6px;
          color: #3b82f6;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .rd-button:hover {
          background: rgba(59, 130, 246, 0.3);
        }

        .rd-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .rd-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .rd-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 15px;
        }

        .rd-card h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          text-transform: uppercase;
          color: #94a3b8;
          letter-spacing: 0.5px;
        }

        .rd-metric {
          margin: 8px 0;
        }

        .rd-metric-label {
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 4px;
        }

        .rd-metric-value {
          font-size: 24px;
          font-weight: 600;
          color: #e0e6ed;
        }

        .rd-metric-value.good {
          color: #22c55e;
        }

        .rd-metric-value.warning {
          color: #f59e0b;
        }

        .rd-metric-value.critical {
          color: #ef4444;
        }

        .rd-progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 8px;
        }

        .rd-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
          transition: width 0.3s;
        }

        .rd-progress-fill.warning {
          background: linear-gradient(90deg, #f59e0b 0%, #ef4444 100%);
        }

        .rd-progress-fill.critical {
          background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
        }

        .rd-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .rd-list-item {
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 4px;
          margin-bottom: 6px;
          font-size: 13px;
        }

        .rd-log-entry {
          padding: 10px;
          background: rgba(255, 255, 255, 0.03);
          border-left: 3px solid #3b82f6;
          border-radius: 4px;
          margin-bottom: 6px;
          font-size: 12px;
          font-family: 'Consolas', monospace;
        }

        .rd-log-entry.error {
          border-left-color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .rd-log-entry.warn {
          border-left-color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
        }

        .rd-log-timestamp {
          color: #64748b;
          margin-right: 8px;
        }

        .rd-log-category {
          color: #3b82f6;
          margin-right: 8px;
          font-weight: 600;
        }

        .rd-issues {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 20px;
        }

        .rd-issues h3 {
          margin: 0 0 10px 0;
          color: #ef4444;
          font-size: 14px;
        }

        .rd-issues ul {
          margin: 0;
          padding-left: 20px;
        }

        .rd-issues li {
          margin: 4px 0;
          color: #fca5a5;
        }

        .rd-config-item {
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .rd-config-label {
          font-weight: 600;
          color: #94a3b8;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .rd-config-value {
          color: #e0e6ed;
          font-family: 'Consolas', monospace;
          font-size: 13px;
        }
      `}</style>

      <div className="rd-header">
        <h1>
          📊 Runtime Diagnostics
          <span className={`rd-health-badge ${health.healthy ? 'healthy' : 'unhealthy'}`}>
            {health.healthy ? '✓ Healthy' : '✗ Issues Detected'}
          </span>
        </h1>
        <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>
          Real-time monitoring of language runtime system
        </p>
      </div>

      <div className="rd-toolbar">
        <div className="rd-tabs">
          <button
            className={`rd-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`rd-tab ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Logs
          </button>
          <button
            className={`rd-tab ${activeTab === 'cache' ? 'active' : ''}`}
            onClick={() => setActiveTab('cache')}
          >
            Cache
          </button>
          <button
            className={`rd-tab ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            Configuration
          </button>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={e => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh
        </label>

        <button className="rd-button" onClick={refreshData}>
          🔄 Refresh
        </button>
      </div>

      <div className="rd-content">
        {activeTab === 'overview' && (
          <>
            {!health.healthy && (
              <div className="rd-issues">
                <h3>⚠️ Issues Detected</h3>
                <ul>
                  {health.issues.map((issue: string, i: number) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rd-grid">
              <div className="rd-card">
                <h3>Memory Usage</h3>
                <div className="rd-metric">
                  <div className="rd-metric-label">Used / Limit</div>
                  <div className={`rd-metric-value ${
                    health.metrics.memory.percentage > 90 ? 'critical' :
                    health.metrics.memory.percentage > 75 ? 'warning' : 'good'
                  }`}>
                    {health.metrics.memory.percentage.toFixed(1)}%
                  </div>
                  <div className="rd-progress-bar">
                    <div
                      className={`rd-progress-fill ${
                        health.metrics.memory.percentage > 90 ? 'critical' :
                        health.metrics.memory.percentage > 75 ? 'warning' : ''
                      }`}
                      style={{ width: `${Math.min(health.metrics.memory.percentage, 100)}%` }}
                    />
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    {formatBytes(health.metrics.memory.used)} / {formatBytes(health.metrics.memory.limit)}
                  </div>
                </div>
              </div>

              <div className="rd-card">
                <h3>Executions</h3>
                <div className="rd-metric">
                  <div className="rd-metric-label">Active / Total</div>
                  <div className="rd-metric-value">
                    {health.metrics.executions.active} / {health.metrics.executions.total}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                    <div>✓ Succeeded: {health.metrics.executions.succeeded}</div>
                    <div>✗ Failed: {health.metrics.executions.failed}</div>
                  </div>
                </div>
              </div>

              <div className="rd-card">
                <h3>Performance</h3>
                <div className="rd-metric">
                  <div className="rd-metric-label">Avg Execution Time</div>
                  <div className="rd-metric-value good">
                    {formatDuration(health.metrics.performance.averageExecutionTime)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                    <div>Min: {formatDuration(health.metrics.performance.minExecutionTime)}</div>
                    <div>Max: {formatDuration(health.metrics.performance.maxExecutionTime)}</div>
                  </div>
                </div>
              </div>

              <div className="rd-card">
                <h3>Cache Statistics</h3>
                <div className="rd-metric">
                  <div className="rd-metric-label">Hit Rate</div>
                  <div className="rd-metric-value good">
                    {(diagnostics.cacheStats.hitRate * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                    <div>Entries: {diagnostics.cacheStats.totalEntries}</div>
                    <div>Size: {formatBytes(diagnostics.cacheStats.totalSize)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rd-card">
              <h3>Loaded Runtimes</h3>
              <ul className="rd-list">
                {health.metrics.runtimes.loaded.map((runtime: string) => (
                  <li key={runtime} className="rd-list-item">
                    ✓ {runtime}
                  </li>
                ))}
                {health.metrics.runtimes.loading.map((runtime: string) => (
                  <li key={runtime} className="rd-list-item">
                    ⏳ {runtime} (loading...)
                  </li>
                ))}
                {health.metrics.runtimes.failed.map((runtime: string) => (
                  <li key={runtime} className="rd-list-item" style={{ color: '#ef4444' }}>
                    ✗ {runtime} (failed)
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {activeTab === 'logs' && (
          <div className="rd-card">
            <h3>Recent Logs ({logs.length})</h3>
            <div style={{ maxHeight: '600px', overflow: 'auto' }}>
              {logs.slice().reverse().map((log, i) => (
                <div
                  key={i}
                  className={`rd-log-entry ${
                    log.level >= LogLevel.ERROR ? 'error' :
                    log.level === LogLevel.WARN ? 'warn' : ''
                  }`}
                >
                  <span className="rd-log-timestamp">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="rd-log-category">[{log.category}]</span>
                  <span>{log.message}</span>
                  {log.data && (
                    <pre style={{ margin: '4px 0 0 0', fontSize: '11px', opacity: 0.8 }}>
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cache' && (
          <div className="rd-card">
            <h3>Cache Details</h3>
            <div className="rd-grid">
              <div className="rd-config-item">
                <div className="rd-config-label">Total Entries</div>
                <div className="rd-config-value">{diagnostics.cacheStats.totalEntries}</div>
              </div>
              <div className="rd-config-item">
                <div className="rd-config-label">Total Size</div>
                <div className="rd-config-value">{formatBytes(diagnostics.cacheStats.totalSize)}</div>
              </div>
              <div className="rd-config-item">
                <div className="rd-config-label">Hit Rate</div>
                <div className="rd-config-value">{(diagnostics.cacheStats.hitRate * 100).toFixed(2)}%</div>
              </div>
              <div className="rd-config-item">
                <div className="rd-config-label">Miss Rate</div>
                <div className="rd-config-value">{(diagnostics.cacheStats.missRate * 100).toFixed(2)}%</div>
              </div>
              <div className="rd-config-item">
                <div className="rd-config-label">Evictions</div>
                <div className="rd-config-value">{diagnostics.cacheStats.evictions}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="rd-card">
            <h3>Runtime Configuration</h3>
            <div style={{ display: 'grid', gap: '8px' }}>
              {Object.entries(diagnostics.config).map(([key, value]) => (
                <div key={key} className="rd-config-item">
                  <div className="rd-config-label">{key}</div>
                  <div className="rd-config-value">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RuntimeDiagnostics;
