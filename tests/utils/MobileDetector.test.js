/**
 * Tests for MobileDetector
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MobileDetector } from '../../src/utils/MobileDetector.js';

describe('MobileDetector', () => {
  let originalNavigator;
  let originalWindow;

  beforeEach(() => {
    // Store originals
    originalNavigator = global.navigator;
    originalWindow = global.window;
  });

  afterEach(() => {
    // Restore originals
    global.navigator = originalNavigator;
    global.window = originalWindow;
  });

  describe('isMobile()', () => {
    it('should detect mobile user agent', () => {
      global.navigator = {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        vendor: '',
        maxTouchPoints: 5
      };

      global.window = {
        innerWidth: 375,
        innerHeight: 667,
        devicePixelRatio: 2
      };

      expect(MobileDetector.isMobile()).toBe(true);
    });

    it('should detect desktop user agent', () => {
      global.navigator = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        vendor: '',
        maxTouchPoints: 0
      };

      global.window = {
        innerWidth: 1920,
        innerHeight: 1080,
        devicePixelRatio: 1
      };

      expect(MobileDetector.isMobile()).toBe(false);
    });

    it('should detect Android devices', () => {
      global.navigator = {
        userAgent: 'Mozilla/5.0 (Linux; Android 10)',
        vendor: '',
        maxTouchPoints: 5
      };

      global.window = {
        innerWidth: 360,
        innerHeight: 640,
        devicePixelRatio: 2
      };

      expect(MobileDetector.isMobile()).toBe(true);
    });
  });

  describe('isTouch()', () => {
    it('should detect touch support via ontouchstart', () => {
      global.window = { ontouchstart: null };
      global.navigator = { maxTouchPoints: 0, msMaxTouchPoints: 0 };

      expect(MobileDetector.isTouch()).toBe(true);
    });

    it('should detect touch support via maxTouchPoints', () => {
      global.window = {};
      global.navigator = { maxTouchPoints: 5, msMaxTouchPoints: 0 };

      expect(MobileDetector.isTouch()).toBe(true);
    });

    it('should detect no touch support', () => {
      global.window = {};
      global.navigator = { maxTouchPoints: 0, msMaxTouchPoints: 0 };

      expect(MobileDetector.isTouch()).toBe(false);
    });
  });

  describe('isTablet()', () => {
    it('should detect iPad', () => {
      global.navigator = {
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        vendor: '',
        maxTouchPoints: 5
      };

      global.window = {
        innerWidth: 768,
        innerHeight: 1024,
        devicePixelRatio: 2
      };

      expect(MobileDetector.isTablet()).toBe(true);
    });

    it('should detect Android tablet', () => {
      global.navigator = {
        userAgent: 'Mozilla/5.0 (Linux; Android 10; Tablet)',
        vendor: '',
        maxTouchPoints: 5
      };

      global.window = {
        innerWidth: 800,
        innerHeight: 1280,
        devicePixelRatio: 1.5
      };

      expect(MobileDetector.isTablet()).toBe(true);
    });

    it('should not detect phone as tablet', () => {
      global.navigator = {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        vendor: '',
        maxTouchPoints: 5
      };

      global.window = {
        innerWidth: 375,
        innerHeight: 667,
        devicePixelRatio: 2
      };

      expect(MobileDetector.isTablet()).toBe(false);
    });
  });

  describe('getDeviceType()', () => {
    it('should return "mobile" for phones', () => {
      global.navigator = {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        vendor: '',
        maxTouchPoints: 5
      };

      global.window = {
        innerWidth: 375,
        innerHeight: 667
      };

      expect(MobileDetector.getDeviceType()).toBe('mobile');
    });

    it('should return "tablet" for tablets', () => {
      global.navigator = {
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        vendor: '',
        maxTouchPoints: 5
      };

      global.window = {
        innerWidth: 768,
        innerHeight: 1024
      };

      expect(MobileDetector.getDeviceType()).toBe('tablet');
    });

    it('should return "desktop" for desktops', () => {
      global.navigator = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        vendor: '',
        maxTouchPoints: 0
      };

      global.window = {
        innerWidth: 1920,
        innerHeight: 1080
      };

      expect(MobileDetector.getDeviceType()).toBe('desktop');
    });
  });

  describe('getScreenSize()', () => {
    it('should return "small" for phone screens', () => {
      global.window = { innerWidth: 375, innerHeight: 667 };

      expect(MobileDetector.getScreenSize()).toBe('small');
    });

    it('should return "medium" for tablet screens', () => {
      global.window = { innerWidth: 768, innerHeight: 1024 };

      expect(MobileDetector.getScreenSize()).toBe('medium');
    });

    it('should return "large" for desktop screens', () => {
      global.window = { innerWidth: 1920, innerHeight: 1080 };

      expect(MobileDetector.getScreenSize()).toBe('large');
    });
  });

  describe('isLandscape() and isPortrait()', () => {
    it('should detect landscape orientation', () => {
      global.window = { innerWidth: 1920, innerHeight: 1080 };

      expect(MobileDetector.isLandscape()).toBe(true);
      expect(MobileDetector.isPortrait()).toBe(false);
    });

    it('should detect portrait orientation', () => {
      global.window = { innerWidth: 375, innerHeight: 667 };

      expect(MobileDetector.isLandscape()).toBe(false);
      expect(MobileDetector.isPortrait()).toBe(true);
    });
  });

  describe('getPixelRatio()', () => {
    it('should return device pixel ratio', () => {
      global.window = { devicePixelRatio: 2 };

      expect(MobileDetector.getPixelRatio()).toBe(2);
    });

    it('should return 1 if devicePixelRatio is undefined', () => {
      global.window = {};

      expect(MobileDetector.getPixelRatio()).toBe(1);
    });
  });

  describe('isIOS()', () => {
    it('should detect iPhone', () => {
      global.navigator = {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        vendor: ''
      };
      global.window = { MSStream: undefined };

      expect(MobileDetector.isIOS()).toBe(true);
    });

    it('should detect iPad', () => {
      global.navigator = {
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        vendor: ''
      };
      global.window = { MSStream: undefined };

      expect(MobileDetector.isIOS()).toBe(true);
    });

    it('should not detect Android as iOS', () => {
      global.navigator = {
        userAgent: 'Mozilla/5.0 (Linux; Android 10)',
        vendor: ''
      };
      global.window = { MSStream: undefined };

      expect(MobileDetector.isIOS()).toBe(false);
    });
  });

  describe('isAndroid()', () => {
    it('should detect Android devices', () => {
      global.navigator = {
        userAgent: 'Mozilla/5.0 (Linux; Android 10)',
        vendor: ''
      };

      expect(MobileDetector.isAndroid()).toBe(true);
    });

    it('should not detect iOS as Android', () => {
      global.navigator = {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        vendor: ''
      };

      expect(MobileDetector.isAndroid()).toBe(false);
    });
  });

  describe('getDeviceInfo()', () => {
    it('should return complete device information', () => {
      global.navigator = {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        vendor: '',
        maxTouchPoints: 5
      };

      global.window = {
        innerWidth: 375,
        innerHeight: 667,
        devicePixelRatio: 2,
        MSStream: undefined
      };

      const info = MobileDetector.getDeviceInfo();

      expect(info).toHaveProperty('type');
      expect(info).toHaveProperty('isMobile');
      expect(info).toHaveProperty('isTablet');
      expect(info).toHaveProperty('isTouch');
      expect(info).toHaveProperty('screenSize');
      expect(info).toHaveProperty('orientation');
      expect(info).toHaveProperty('pixelRatio');
      expect(info).toHaveProperty('isIOS');
      expect(info).toHaveProperty('isAndroid');
      expect(info).toHaveProperty('width');
      expect(info).toHaveProperty('height');

      expect(info.isMobile).toBe(true);
      expect(info.isIOS).toBe(true);
      expect(info.isAndroid).toBe(false);
    });
  });
});
