import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PredictiveAppLauncher } from '../../src/ai/PredictiveAppLauncher.js';

describe('PredictiveAppLauncher', () => {
  let launcher;
  let mockKernel;

  beforeEach(() => {
    mockKernel = {
      vfs: {
        readFile: vi.fn(),
        writeFile: vi.fn(),
        mkdir: vi.fn()
      }
    };

    launcher = new PredictiveAppLauncher(mockKernel);
  });

  describe('App Launch Tracking', () => {
    it('should track app launches', () => {
      launcher.trackAppLaunch('Terminal');

      expect(launcher.appLaunchHistory).toHaveLength(1);
      expect(launcher.appLaunchHistory[0].app).toBe('Terminal');
    });

    it('should update time patterns', () => {
      const hour = new Date().getHours();
      launcher.trackAppLaunch('Terminal');

      expect(launcher.timePatterns.has(hour)).toBe(true);
      expect(launcher.timePatterns.get(hour).get('Terminal')).toBe(1);
    });

    it('should update day patterns', () => {
      const day = new Date().getDay();
      launcher.trackAppLaunch('Terminal');

      expect(launcher.dayPatterns.has(day)).toBe(true);
      expect(launcher.dayPatterns.get(day).get('Terminal')).toBe(1);
    });

    it('should track sequence patterns', () => {
      launcher.trackAppLaunch('Terminal');
      launcher.trackAppLaunch('FileManager');

      expect(launcher.sequencePatterns.has('Terminal')).toBe(true);
      expect(launcher.sequencePatterns.get('Terminal').get('FileManager')).toBe(1);
    });

    it('should update recent apps', () => {
      launcher.trackAppLaunch('Terminal');
      launcher.trackAppLaunch('Calculator');

      expect(launcher.currentContext.recentApps).toContain('Terminal');
      expect(launcher.currentContext.recentApps).toContain('Calculator');
    });
  });

  describe('Predictions', () => {
    beforeEach(() => {
      // Seed with data
      const hour = new Date().getHours();
      launcher.timePatterns.set(hour, new Map([
        ['Terminal', 10],
        ['Calculator', 5],
        ['FileManager', 3]
      ]));

      launcher.currentContext.recentApps = ['Terminal'];
      launcher.sequencePatterns.set('Terminal', new Map([
        ['CodeEditor', 8],
        ['Browser', 2]
      ]));
    });

    it('should generate time-based predictions', () => {
      const predictions = launcher._getTimeBasedPredictions();

      expect(predictions.length).toBeGreaterThan(0);
      expect(predictions[0].app).toBe('Terminal'); // Most frequent
    });

    it('should generate sequence-based predictions', () => {
      const predictions = launcher._getSequenceBasedPredictions();

      expect(predictions.length).toBeGreaterThan(0);
      expect(predictions[0].app).toBe('CodeEditor'); // Most likely after Terminal
    });

    it('should rank predictions by confidence', () => {
      const predictions = launcher.getPredictions();

      expect(predictions.length).toBeGreaterThan(0);
      // Should be sorted by confidence
      for (let i = 1; i < predictions.length; i++) {
        expect(predictions[i - 1].confidence).toBeGreaterThanOrEqual(predictions[i].confidence);
      }
    });

    it('should return top N predictions', () => {
      launcher.maxPredictions = 3;
      const predictions = launcher.getPredictions();

      expect(predictions.length).toBeLessThanOrEqual(3);
    });

    it('should filter by minimum confidence', () => {
      launcher.minConfidence = 0.5;
      const predictions = launcher.getPredictions();

      predictions.forEach(pred => {
        expect(pred.confidence).toBeGreaterThanOrEqual(0.5);
      });
    });
  });

  describe('Statistics', () => {
    it('should return usage statistics', () => {
      launcher.trackAppLaunch('Terminal');
      launcher.trackAppLaunch('Calculator');
      launcher.trackAppLaunch('Terminal');

      const stats = launcher.getStatistics();

      expect(stats.totalLaunches).toBe(3);
      expect(stats.uniqueApps).toBe(2);
      expect(stats.recentApps).toContain('Terminal');
      expect(stats.recentApps).toContain('Calculator');
    });
  });
});
