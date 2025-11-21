/**
 * Accessibility Manager
 * Provides comprehensive accessibility features for WCAG 2.1 Level AA compliance
 */

import { createLogger } from '../kernel/Logger.js';

const logger = createLogger('AccessibilityManager');

/**
 * Screen reader announcer for live region updates
 */
export class ScreenReaderAnnouncer {
  constructor() {
    this.liveRegion = null;
    this.init();
  }

  init() {
    // Create ARIA live region for screen reader announcements
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'sr-only';
    this.liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(this.liveRegion);

    logger.info('Screen reader announcer initialized');
  }

  /**
   * Announce a message to screen readers
   * @param {string} message - Message to announce
   * @param {string} priority - 'polite' or 'assertive'
   */
  announce(message, priority = 'polite') {
    if (!this.liveRegion) {
      logger.warn('Live region not initialized');
      return;
    }

    this.liveRegion.setAttribute('aria-live', priority);

    // Clear and set to ensure announcement
    this.liveRegion.textContent = '';

    setTimeout(() => {
      this.liveRegion.textContent = message;
      logger.debug('Screen reader announcement', { message, priority });
    }, 100);
  }

  /**
   * Announce an assertive message (interrupts current speech)
   */
  announceAssertive(message) {
    this.announce(message, 'assertive');
  }
}

/**
 * Keyboard navigation helper
 */
export class KeyboardNavigationManager {
  constructor() {
    this.focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    this.trapStack = [];
    this.init();
  }

  init() {
    // Add keyboard event listeners
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    logger.info('Keyboard navigation manager initialized');
  }

  handleKeyDown(event) {
    // Handle Escape key
    if (event.key === 'Escape' && this.trapStack.length > 0) {
      const trap = this.trapStack[this.trapStack.length - 1];
      if (trap.onEscape) {
        trap.onEscape();
      }
    }
  }

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container = document) {
    return Array.from(container.querySelectorAll(this.focusableSelectors))
      .filter(el => {
        return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
      });
  }

  /**
   * Trap focus within a container (for modals, dialogs)
   */
  trapFocus(container, options = {}) {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) {
      logger.warn('No focusable elements in container');
      return null;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const previousFocus = document.activeElement;

    const handleTabKey = (event) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Focus first element
    if (options.initialFocus !== false) {
      firstElement.focus();
    }

    const trap = {
      container,
      previousFocus,
      onEscape: options.onEscape,
      release: () => {
        container.removeEventListener('keydown', handleTabKey);
        const index = this.trapStack.indexOf(trap);
        if (index > -1) {
          this.trapStack.splice(index, 1);
        }
        if (previousFocus && options.restoreFocus !== false) {
          previousFocus.focus();
        }
        logger.debug('Focus trap released');
      }
    };

    this.trapStack.push(trap);
    logger.debug('Focus trapped in container');

    return trap;
  }

  /**
   * Move focus to next/previous focusable element
   */
  moveFocus(direction = 'next') {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement);

    if (currentIndex === -1) {
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
      return;
    }

    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % focusableElements.length;
    } else {
      nextIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
    }

    focusableElements[nextIndex].focus();
  }
}

/**
 * ARIA attribute manager
 */
export class AriaManager {
  /**
   * Set ARIA attributes on an element
   */
  setAttributes(element, attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        element.removeAttribute(`aria-${key}`);
      } else {
        element.setAttribute(`aria-${key}`, value);
      }
    });
  }

  /**
   * Make element a button with proper ARIA attributes
   */
  makeButton(element, options = {}) {
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', options.tabindex || '0');

    if (options.label) {
      element.setAttribute('aria-label', options.label);
    }

    if (options.pressed !== undefined) {
      element.setAttribute('aria-pressed', options.pressed);
    }

    if (options.expanded !== undefined) {
      element.setAttribute('aria-expanded', options.expanded);
    }

    // Add keyboard support
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        element.click();
      }
    });
  }

  /**
   * Make element a link with proper ARIA attributes
   */
  makeLink(element, options = {}) {
    element.setAttribute('role', 'link');
    element.setAttribute('tabindex', options.tabindex || '0');

    if (options.label) {
      element.setAttribute('aria-label', options.label);
    }
  }

  /**
   * Set expanded/collapsed state
   */
  setExpanded(element, expanded) {
    element.setAttribute('aria-expanded', expanded);
  }

  /**
   * Set pressed state (for toggle buttons)
   */
  setPressed(element, pressed) {
    element.setAttribute('aria-pressed', pressed);
  }

  /**
   * Set checked state (for checkboxes)
   */
  setChecked(element, checked) {
    element.setAttribute('aria-checked', checked);
  }

  /**
   * Set selected state
   */
  setSelected(element, selected) {
    element.setAttribute('aria-selected', selected);
  }

  /**
   * Set disabled state
   */
  setDisabled(element, disabled) {
    element.setAttribute('aria-disabled', disabled);
    if (disabled) {
      element.setAttribute('tabindex', '-1');
    } else {
      element.setAttribute('tabindex', '0');
    }
  }

  /**
   * Set busy/loading state
   */
  setBusy(element, busy) {
    element.setAttribute('aria-busy', busy);
  }

  /**
   * Set invalid state for form fields
   */
  setInvalid(element, invalid, errorId) {
    element.setAttribute('aria-invalid', invalid);
    if (invalid && errorId) {
      element.setAttribute('aria-describedby', errorId);
    } else {
      element.removeAttribute('aria-describedby');
    }
  }

  /**
   * Create skip link
   */
  createSkipLink(targetId, text = 'Skip to main content') {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.className = 'skip-link';
    skipLink.textContent = text;
    skipLink.style.cssText = `
      position: absolute;
      left: -10000px;
      top: auto;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;

    skipLink.addEventListener('focus', () => {
      skipLink.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        z-index: 100000;
        padding: 10px 20px;
        background: var(--primary-color, #667eea);
        color: white;
        text-decoration: none;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      `;
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.cssText = `
        position: absolute;
        left: -10000px;
        top: auto;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
    });

    return skipLink;
  }
}

/**
 * Motion preferences manager
 */
export class MotionPreferencesManager {
  constructor() {
    this.reducedMotion = false;
    this.init();
  }

  init() {
    // Check user's system preferences
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion = mediaQuery.matches;

      // Listen for changes
      mediaQuery.addEventListener('change', (e) => {
        this.reducedMotion = e.matches;
        this.updateMotionPreferences();
        logger.info('Motion preference changed', { reducedMotion: this.reducedMotion });
      });
    }

    // Check localStorage override
    const storedPreference = localStorage.getItem('webos-reduced-motion');
    if (storedPreference !== null) {
      this.reducedMotion = storedPreference === 'true';
    }

    this.updateMotionPreferences();
    logger.info('Motion preferences initialized', { reducedMotion: this.reducedMotion });
  }

  /**
   * Update CSS to respect motion preferences
   */
  updateMotionPreferences() {
    if (this.reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }

  /**
   * Set reduced motion preference
   */
  setReducedMotion(reduced) {
    this.reducedMotion = reduced;
    localStorage.setItem('webos-reduced-motion', reduced);
    this.updateMotionPreferences();
  }

  /**
   * Get animation duration (reduced if motion preference is set)
   */
  getAnimationDuration(normalDuration) {
    return this.reducedMotion ? 0 : normalDuration;
  }
}

/**
 * Color contrast checker
 */
export class ContrastChecker {
  /**
   * Calculate relative luminance
   */
  getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio(color1, color2) {
    const l1 = this.getLuminance(...color1);
    const l2 = this.getLuminance(...color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if contrast ratio meets WCAG standards
   * @param {number} ratio - Contrast ratio
   * @param {string} level - 'AA' or 'AAA'
   * @param {boolean} largeText - Is text large (>= 18pt or >= 14pt bold)
   */
  meetsStandard(ratio, level = 'AA', largeText = false) {
    if (level === 'AAA') {
      return largeText ? ratio >= 4.5 : ratio >= 7;
    }
    return largeText ? ratio >= 3 : ratio >= 4.5;
  }

  /**
   * Parse hex color to RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  }
}

/**
 * Main Accessibility Manager
 */
export class AccessibilityManager {
  constructor() {
    this.announcer = new ScreenReaderAnnouncer();
    this.keyboardNav = new KeyboardNavigationManager();
    this.aria = new AriaManager();
    this.motionPrefs = new MotionPreferencesManager();
    this.contrast = new ContrastChecker();

    this.features = {
      screenReader: true,
      keyboardNav: true,
      reducedMotion: false,
      highContrast: false,
      focusVisible: true
    };

    this.init();
  }

  init() {
    this.setupFocusVisible();
    this.setupLandmarks();
    this.loadPreferences();

    logger.info('AccessibilityManager initialized');
  }

  /**
   * Setup focus-visible polyfill behavior
   */
  setupFocusVisible() {
    let hadKeyboardEvent = false;

    const handleKeyDown = () => {
      hadKeyboardEvent = true;
    };

    const handlePointerDown = () => {
      hadKeyboardEvent = false;
    };

    const handleFocus = (e) => {
      if (hadKeyboardEvent) {
        e.target.classList.add('focus-visible');
      }
    };

    const handleBlur = (e) => {
      e.target.classList.remove('focus-visible');
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('touchstart', handlePointerDown, true);
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);

    logger.debug('Focus-visible setup complete');
  }

  /**
   * Setup ARIA landmarks
   */
  setupLandmarks() {
    // Add skip link if not exists
    if (!document.querySelector('.skip-link')) {
      const mainContent = document.querySelector('#desktop') || document.querySelector('main');
      if (mainContent) {
        if (!mainContent.id) {
          mainContent.id = 'main-content';
        }
        const skipLink = this.aria.createSkipLink(mainContent.id);
        document.body.insertBefore(skipLink, document.body.firstChild);
        logger.debug('Skip link added');
      }
    }

    // Ensure proper landmarks
    const desktop = document.querySelector('#desktop');
    if (desktop && !desktop.getAttribute('role')) {
      desktop.setAttribute('role', 'main');
      desktop.setAttribute('aria-label', 'Desktop');
    }

    const taskbar = document.querySelector('#taskbar');
    if (taskbar && !taskbar.getAttribute('role')) {
      taskbar.setAttribute('role', 'navigation');
      taskbar.setAttribute('aria-label', 'Taskbar');
    }
  }

  /**
   * Load accessibility preferences
   */
  loadPreferences() {
    try {
      const prefs = JSON.parse(localStorage.getItem('webos-accessibility-prefs') || '{}');
      this.features = { ...this.features, ...prefs };
      logger.debug('Accessibility preferences loaded', this.features);
    } catch (err) {
      logger.error('Failed to load accessibility preferences', err);
    }
  }

  /**
   * Save accessibility preferences
   */
  savePreferences() {
    try {
      localStorage.setItem('webos-accessibility-prefs', JSON.stringify(this.features));
      logger.debug('Accessibility preferences saved');
    } catch (err) {
      logger.error('Failed to save accessibility preferences', err);
    }
  }

  /**
   * Enable/disable a feature
   */
  setFeature(feature, enabled) {
    this.features[feature] = enabled;
    this.savePreferences();

    switch (feature) {
      case 'reducedMotion':
        this.motionPrefs.setReducedMotion(enabled);
        break;
      case 'highContrast':
        this.setHighContrast(enabled);
        break;
    }

    logger.info('Accessibility feature changed', { feature, enabled });
  }

  /**
   * Enable high contrast mode
   */
  setHighContrast(enabled) {
    if (enabled) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }

  /**
   * Announce message to screen readers
   */
  announce(message, priority = 'polite') {
    if (this.features.screenReader) {
      this.announcer.announce(message, priority);
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }
}

// Create singleton instance
const accessibilityManager = AccessibilityManager.getInstance();

export default accessibilityManager;
