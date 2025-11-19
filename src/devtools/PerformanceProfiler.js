/**
 * PerformanceProfiler - Advanced Performance Profiling
 *
 * Features:
 * - CPU profiling
 * - Memory profiling
 * - FPS monitoring
 * - Performance metrics
 * - Leak detection
 */

export class PerformanceProfiler {
  constructor() {
    this.cpuProfiles = new Map();
    this.heapSnapshots = [];
    this.fpsMonitor = null;
    this.observer = null;
    this.marks = new Map();
    this.measures = new Map();
  }

  /**
   * Start CPU profiling
   */
  startCPUProfile(name = 'default') {
    const profile = {
      name,
      startTime: performance.now(),
      samples: [],
      nodes: [],
      sampling: true
    };

    this.cpuProfiles.set(name, profile);

    // Start sampling
    this._sampleCPU(profile);

    return profile;
  }

  /**
   * Stop CPU profiling
   */
  stopCPUProfile(name = 'default') {
    const profile = this.cpuProfiles.get(name);
    if (!profile) {
      throw new Error(`Profile '${name}' not found`);
    }

    profile.sampling = false;
    profile.endTime = performance.now();
    profile.duration = profile.endTime - profile.startTime;

    return this._processCPUProfile(profile);
  }

  /**
   * Take heap snapshot
   */
  takeHeapSnapshot() {
    const snapshot = {
      timestamp: Date.now(),
      totalSize: 0,
      usedSize: 0,
      nodes: [],
      detachedNodes: 0
    };

    // Get memory info if available
    if (performance.memory) {
      snapshot.totalSize = performance.memory.totalJSHeapSize;
      snapshot.usedSize = performance.memory.usedJSHeapSize;
      snapshot.limit = performance.memory.jsHeapSizeLimit;
    }

    // Detect detached DOM nodes (simplified)
    snapshot.detachedNodes = this._detectDetachedNodes();

    this.heapSnapshots.push(snapshot);

    return snapshot;
  }

  /**
   * Compare two heap snapshots
   */
  compareSnapshots(snapshot1, snapshot2) {
    return {
      sizeDiff: snapshot2.usedSize - snapshot1.usedSize,
      nodesDiff: snapshot2.detachedNodes - snapshot1.detachedNodes,
      timeDiff: snapshot2.timestamp - snapshot1.timestamp,
      leakSuspected: snapshot2.usedSize > snapshot1.usedSize * 1.2 // 20% increase
    };
  }

  /**
   * Start FPS monitoring
   */
  startFPSMonitor(callback) {
    if (this.fpsMonitor) {
      this.stopFPSMonitor();
    }

    let lastTime = performance.now();
    let frames = 0;
    let fps = 0;

    const monitor = () => {
      frames++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        fps = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;

        if (callback) {
          callback(fps);
        }
      }

      this.fpsMonitor.frameId = requestAnimationFrame(monitor);
    };

    this.fpsMonitor = {
      callback,
      frameId: requestAnimationFrame(monitor)
    };

    return this.fpsMonitor;
  }

  /**
   * Stop FPS monitoring
   */
  stopFPSMonitor() {
    if (this.fpsMonitor) {
      cancelAnimationFrame(this.fpsMonitor.frameId);
      this.fpsMonitor = null;
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const metrics = {
      navigation: {},
      paint: {},
      resources: [],
      memory: {}
    };

    // Navigation timing
    const navTiming = performance.getEntriesByType('navigation')[0];
    if (navTiming) {
      metrics.navigation = {
        dns: navTiming.domainLookupEnd - navTiming.domainLookupStart,
        tcp: navTiming.connectEnd - navTiming.connectStart,
        request: navTiming.responseStart - navTiming.requestStart,
        response: navTiming.responseEnd - navTiming.responseStart,
        domParsing: navTiming.domInteractive - navTiming.responseEnd,
        domContentLoaded: navTiming.domContentLoadedEventEnd - navTiming.domContentLoadedEventStart,
        load: navTiming.loadEventEnd - navTiming.loadEventStart
      };
    }

    // Paint timing
    const paintTiming = performance.getEntriesByType('paint');
    paintTiming.forEach(entry => {
      metrics.paint[entry.name] = entry.startTime;
    });

    // LCP (Largest Contentful Paint)
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      metrics.paint.lcp = lcpEntries[lcpEntries.length - 1].renderTime;
    }

    // FCP (First Contentful Paint)
    const fcpEntry = paintTiming.find(entry => entry.name === 'first-contentful-paint');
    if (fcpEntry) {
      metrics.paint.fcp = fcpEntry.startTime;
    }

    // Memory
    if (performance.memory) {
      metrics.memory = {
        total: performance.memory.totalJSHeapSize,
        used: performance.memory.usedJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
      };
    }

    // Resources
    const resources = performance.getEntriesByType('resource');
    metrics.resources = resources.map(entry => ({
      name: entry.name,
      type: entry.initiatorType,
      duration: entry.duration,
      size: entry.transferSize,
      cached: entry.transferSize === 0
    }));

    return metrics;
  }

  /**
   * Mark a performance point
   */
  mark(name) {
    performance.mark(name);
    this.marks.set(name, performance.now());
  }

  /**
   * Measure between two marks
   */
  measure(name, startMark, endMark) {
    performance.measure(name, startMark, endMark);

    const startTime = this.marks.get(startMark);
    const endTime = this.marks.get(endMark);

    if (startTime && endTime) {
      const duration = endTime - startTime;
      this.measures.set(name, {
        name,
        startMark,
        endMark,
        duration
      });

      return duration;
    }

    return null;
  }

  /**
   * Get all marks
   */
  getMarks() {
    return Array.from(this.marks.entries()).map(([name, time]) => ({
      name,
      time
    }));
  }

  /**
   * Get all measures
   */
  getMeasures() {
    return Array.from(this.measures.values());
  }

  /**
   * Clear performance data
   */
  clear() {
    performance.clearMarks();
    performance.clearMeasures();
    this.marks.clear();
    this.measures.clear();
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const metrics = this.getMetrics();
    const marks = this.getMarks();
    const measures = this.getMeasures();

    const report = {
      timestamp: Date.now(),
      metrics,
      marks,
      measures,
      summary: this._generateSummary(metrics)
    };

    return report;
  }

  /**
   * Detect performance issues
   */
  detectIssues() {
    const issues = [];
    const metrics = this.getMetrics();

    // Slow navigation
    if (metrics.navigation.domContentLoaded > 3000) {
      issues.push({
        type: 'slow-load',
        severity: 'high',
        message: 'DOM Content Loaded takes > 3s',
        value: metrics.navigation.domContentLoaded
      });
    }

    // Large FCP
    if (metrics.paint.fcp > 2500) {
      issues.push({
        type: 'slow-fcp',
        severity: 'medium',
        message: 'First Contentful Paint > 2.5s',
        value: metrics.paint.fcp
      });
    }

    // Large LCP
    if (metrics.paint.lcp > 4000) {
      issues.push({
        type: 'slow-lcp',
        severity: 'high',
        message: 'Largest Contentful Paint > 4s',
        value: metrics.paint.lcp
      });
    }

    // High memory usage
    if (metrics.memory.percentage > 80) {
      issues.push({
        type: 'high-memory',
        severity: 'high',
        message: 'Memory usage > 80%',
        value: metrics.memory.percentage
      });
    }

    // Many resources
    if (metrics.resources.length > 100) {
      issues.push({
        type: 'many-resources',
        severity: 'medium',
        message: 'Too many resources loaded',
        value: metrics.resources.length
      });
    }

    return issues;
  }

  // Private methods

  _sampleCPU(profile) {
    if (!profile.sampling) return;

    // Capture current stack (simplified)
    const sample = {
      timestamp: performance.now(),
      stack: this._captureStack()
    };

    profile.samples.push(sample);

    // Continue sampling at ~1ms intervals
    setTimeout(() => this._sampleCPU(profile), 1);
  }

  _captureStack() {
    const error = new Error();
    const stack = error.stack;

    if (!stack) return [];

    return stack.split('\n')
      .slice(2)
      .map(line => {
        const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
        if (match) {
          return {
            function: match[1],
            file: match[2],
            line: parseInt(match[3]),
            column: parseInt(match[4])
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  _processCPUProfile(profile) {
    // Build call tree
    const callTree = this._buildCallTree(profile.samples);

    // Calculate self time and total time
    this._calculateTimes(callTree);

    profile.callTree = callTree;

    return profile;
  }

  _buildCallTree(samples) {
    const root = {
      name: '(root)',
      children: [],
      samples: 0,
      selfTime: 0,
      totalTime: 0
    };

    samples.forEach(sample => {
      let current = root;

      sample.stack.reverse().forEach(frame => {
        const functionName = frame.function || '(anonymous)';

        let child = current.children.find(c => c.name === functionName);

        if (!child) {
          child = {
            name: functionName,
            file: frame.file,
            line: frame.line,
            children: [],
            samples: 0,
            selfTime: 0,
            totalTime: 0
          };
          current.children.push(child);
        }

        child.samples++;
        current = child;
      });

      current.selfTime++;
    });

    return root;
  }

  _calculateTimes(node) {
    let totalChildTime = 0;

    node.children.forEach(child => {
      this._calculateTimes(child);
      totalChildTime += child.totalTime;
    });

    node.totalTime = node.selfTime + totalChildTime;
  }

  _detectDetachedNodes() {
    // Simplified detached node detection
    // In a real implementation, this would use Chrome DevTools Protocol
    let count = 0;

    // Check for common patterns
    if (typeof document !== 'undefined') {
      // Count elements not in document
      const elements = document.querySelectorAll('*');
      elements.forEach(el => {
        if (!document.contains(el)) {
          count++;
        }
      });
    }

    return count;
  }

  _generateSummary(metrics) {
    return {
      pageLoadTime: metrics.navigation.load || 0,
      fcp: metrics.paint.fcp || 0,
      lcp: metrics.paint.lcp || 0,
      memoryUsage: metrics.memory.percentage || 0,
      resourceCount: metrics.resources.length,
      cachedResources: metrics.resources.filter(r => r.cached).length,
      performance: this._calculatePerformanceScore(metrics)
    };
  }

  _calculatePerformanceScore(metrics) {
    let score = 100;

    // Deduct points for slow metrics
    if (metrics.paint.fcp > 1800) score -= 10;
    if (metrics.paint.fcp > 3000) score -= 20;

    if (metrics.paint.lcp > 2500) score -= 10;
    if (metrics.paint.lcp > 4000) score -= 20;

    if (metrics.navigation.load > 5000) score -= 10;
    if (metrics.navigation.load > 10000) score -= 20;

    if (metrics.memory.percentage > 70) score -= 10;
    if (metrics.memory.percentage > 90) score -= 20;

    return Math.max(0, score);
  }
}

export default PerformanceProfiler;
