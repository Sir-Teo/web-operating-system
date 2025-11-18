/**
 * Mobile Detection Utility
 * Detects mobile devices, touch capability, and screen size
 */

export class MobileDetector {
  /**
   * Check if the device is a mobile device
   * @returns {boolean} True if mobile device
   */
  static isMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // Check user agent
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const isMobileUA = mobileRegex.test(userAgent);

    // Check screen width
    const isSmallScreen = window.innerWidth < 768;

    // Check touch capability
    const hasTouch = this.isTouch();

    return isMobileUA || (isSmallScreen && hasTouch);
  }

  /**
   * Check if the device supports touch
   * @returns {boolean} True if touch is supported
   */
  static isTouch() {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }

  /**
   * Check if the device is a tablet
   * @returns {boolean} True if tablet
   */
  static isTablet() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet/i;

    return (
      tabletRegex.test(userAgent) &&
      window.innerWidth >= 768 &&
      window.innerWidth <= 1024
    );
  }

  /**
   * Get device type
   * @returns {string} 'desktop', 'tablet', or 'mobile'
   */
  static getDeviceType() {
    if (this.isTablet()) return 'tablet';
    if (this.isMobile()) return 'mobile';
    return 'desktop';
  }

  /**
   * Get screen size category
   * @returns {string} 'small', 'medium', or 'large'
   */
  static getScreenSize() {
    const width = window.innerWidth;

    if (width < 768) return 'small';
    if (width < 1024) return 'medium';
    return 'large';
  }

  /**
   * Check if the device is in landscape mode
   * @returns {boolean} True if landscape
   */
  static isLandscape() {
    return window.innerWidth > window.innerHeight;
  }

  /**
   * Check if the device is in portrait mode
   * @returns {boolean} True if portrait
   */
  static isPortrait() {
    return window.innerHeight > window.innerWidth;
  }

  /**
   * Get device pixel ratio
   * @returns {number} Device pixel ratio
   */
  static getPixelRatio() {
    return window.devicePixelRatio || 1;
  }

  /**
   * Check if the device is iOS
   * @returns {boolean} True if iOS
   */
  static isIOS() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  }

  /**
   * Check if the device is Android
   * @returns {boolean} True if Android
   */
  static isAndroid() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /Android/i.test(userAgent);
  }

  /**
   * Get device info
   * @returns {Object} Device information
   */
  static getDeviceInfo() {
    return {
      type: this.getDeviceType(),
      isMobile: this.isMobile(),
      isTablet: this.isTablet(),
      isTouch: this.isTouch(),
      screenSize: this.getScreenSize(),
      orientation: this.isLandscape() ? 'landscape' : 'portrait',
      pixelRatio: this.getPixelRatio(),
      isIOS: this.isIOS(),
      isAndroid: this.isAndroid(),
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  /**
   * Add orientation change listener
   * @param {Function} callback - Callback function
   * @returns {Function} Cleanup function
   */
  static onOrientationChange(callback) {
    const handler = () => {
      callback(this.isLandscape() ? 'landscape' : 'portrait');
    };

    window.addEventListener('orientationchange', handler);
    window.addEventListener('resize', handler);

    return () => {
      window.removeEventListener('orientationchange', handler);
      window.removeEventListener('resize', handler);
    };
  }

  /**
   * Add resize listener with debouncing
   * @param {Function} callback - Callback function
   * @param {number} delay - Debounce delay in milliseconds
   * @returns {Function} Cleanup function
   */
  static onResize(callback, delay = 250) {
    let timeoutId;

    const handler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        callback(this.getDeviceInfo());
      }, delay);
    };

    window.addEventListener('resize', handler);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handler);
    };
  }
}
