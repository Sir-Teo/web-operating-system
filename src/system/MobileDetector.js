/**
 * MobileDetector - Device Detection and Mobile Capabilities
 *
 * Detects mobile devices, screen sizes, touch capabilities, and orientation.
 * Provides utilities for responsive design and mobile-specific features.
 */

export class MobileDetector {
  constructor() {
    this.listeners = new Set();
    this.init();
  }

  /**
   * Initialize detector and setup listeners
   */
  init() {
    // Listen for orientation changes
    window.addEventListener('orientationchange', () => this.notifyListeners());
    window.addEventListener('resize', () => this.notifyListeners());

    // Listen for viewport resize (useful for mobile browsers)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this.notifyListeners());
    }
  }

  /**
   * Detect if device is mobile
   */
  isMobile() {
    // Check user agent
    const ua = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
    const isMobileUA = mobileKeywords.some(keyword => ua.includes(keyword));

    // Check screen size
    const isSmallScreen = window.innerWidth <= 768;

    // Check touch capability
    const hasTouch = this.isTouchDevice();

    return isMobileUA || (isSmallScreen && hasTouch);
  }

  /**
   * Detect if device is tablet
   */
  isTablet() {
    const ua = navigator.userAgent.toLowerCase();
    const isTabletUA = ua.includes('ipad') || (ua.includes('android') && !ua.includes('mobile'));
    const isTabletSize = window.innerWidth > 768 && window.innerWidth <= 1024;

    return isTabletUA || (isTabletSize && this.isTouchDevice());
  }

  /**
   * Detect if device has touch capability
   */
  isTouchDevice() {
    return 'ontouchstart' in window ||
           navigator.maxTouchPoints > 0 ||
           navigator.msMaxTouchPoints > 0;
  }

  /**
   * Get device type
   */
  getDeviceType() {
    if (this.isMobile()) return 'mobile';
    if (this.isTablet()) return 'tablet';
    return 'desktop';
  }

  /**
   * Get screen orientation
   */
  getOrientation() {
    if (window.orientation !== undefined) {
      return Math.abs(window.orientation) === 90 ? 'landscape' : 'portrait';
    }
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  }

  /**
   * Check if in portrait mode
   */
  isPortrait() {
    return this.getOrientation() === 'portrait';
  }

  /**
   * Check if in landscape mode
   */
  isLandscape() {
    return this.getOrientation() === 'landscape';
  }

  /**
   * Get viewport dimensions
   */
  getViewport() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      orientation: this.getOrientation(),
      deviceType: this.getDeviceType()
    };
  }

  /**
   * Get safe area insets (for notched devices)
   */
  getSafeAreaInsets() {
    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('--safe-area-inset-top') || 0),
      right: parseInt(style.getPropertyValue('--safe-area-inset-right') || 0),
      bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || 0),
      left: parseInt(style.getPropertyValue('--safe-area-inset-left') || 0)
    };
  }

  /**
   * Check if running as PWA
   */
  isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  /**
   * Get platform (iOS, Android, etc.)
   */
  getPlatform() {
    const ua = navigator.userAgent.toLowerCase();

    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
      return 'ios';
    }
    if (ua.includes('android')) {
      return 'android';
    }
    if (ua.includes('windows phone')) {
      return 'windows-phone';
    }
    if (ua.includes('blackberry')) {
      return 'blackberry';
    }

    return 'unknown';
  }

  /**
   * Get OS version (for iOS/Android)
   */
  getOSVersion() {
    const ua = navigator.userAgent;
    const platform = this.getPlatform();

    if (platform === 'ios') {
      const match = ua.match(/OS (\d+)_(\d+)_?(\d+)?/);
      if (match) {
        return `${match[1]}.${match[2]}${match[3] ? '.' + match[3] : ''}`;
      }
    } else if (platform === 'android') {
      const match = ua.match(/Android (\d+\.?\d*\.?\d*)/);
      if (match) {
        return match[1];
      }
    }

    return 'unknown';
  }

  /**
   * Check if device supports haptic feedback
   */
  supportsHaptics() {
    return 'vibrate' in navigator;
  }

  /**
   * Trigger haptic feedback
   */
  haptic(pattern = 10) {
    if (this.supportsHaptics()) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * Add change listener
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of changes
   */
  notifyListeners() {
    const viewport = this.getViewport();
    this.listeners.forEach(callback => {
      try {
        callback(viewport);
      } catch (error) {
        console.error('Error in mobile detector listener:', error);
      }
    });
  }

  /**
   * Apply responsive classes to document
   */
  applyResponsiveClasses() {
    const root = document.documentElement;

    // Device type
    root.classList.toggle('is-mobile', this.isMobile());
    root.classList.toggle('is-tablet', this.isTablet());
    root.classList.toggle('is-desktop', !this.isMobile() && !this.isTablet());

    // Touch capability
    root.classList.toggle('has-touch', this.isTouchDevice());
    root.classList.toggle('no-touch', !this.isTouchDevice());

    // Orientation
    root.classList.toggle('portrait', this.isPortrait());
    root.classList.toggle('landscape', this.isLandscape());

    // Platform
    const platform = this.getPlatform();
    root.classList.toggle('ios', platform === 'ios');
    root.classList.toggle('android', platform === 'android');

    // PWA mode
    root.classList.toggle('pwa', this.isPWA());
  }

  /**
   * Get device capabilities summary
   */
  getCapabilities() {
    return {
      isMobile: this.isMobile(),
      isTablet: this.isTablet(),
      deviceType: this.getDeviceType(),
      hasTouch: this.isTouchDevice(),
      platform: this.getPlatform(),
      osVersion: this.getOSVersion(),
      orientation: this.getOrientation(),
      viewport: this.getViewport(),
      isPWA: this.isPWA(),
      supportsHaptics: this.supportsHaptics(),
      safeAreaInsets: this.getSafeAreaInsets()
    };
  }
}

// Create and export singleton
export const mobileDetector = new MobileDetector();

// Apply classes on load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mobileDetector.applyResponsiveClasses();
    });
  } else {
    mobileDetector.applyResponsiveClasses();
  }
}

export default mobileDetector;
