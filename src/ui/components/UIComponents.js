/**
 * UI Components Library
 * Reusable, accessible UI components for the operating system
 */

import { createLogger } from '../../kernel/Logger.js';
import accessibilityManager from '../../system/AccessibilityManager.js';

const logger = createLogger('UIComponents');

/**
 * Tooltip Component
 */
export class Tooltip {
  constructor() {
    this.tooltip = null;
    this.currentTarget = null;
    this.hideTimeout = null;
    this.init();
  }

  init() {
    // Create tooltip element
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tooltip';
    this.tooltip.setAttribute('role', 'tooltip');
    this.tooltip.style.cssText = `
      position: absolute;
      z-index: 100000;
      pointer-events: none;
      opacity: 0;
    `;
    document.body.appendChild(this.tooltip);

    // Delegate tooltip handling
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
    document.addEventListener('focus', this.handleFocus.bind(this), true);
    document.addEventListener('blur', this.handleBlur.bind(this), true);

    logger.debug('Tooltip system initialized');
  }

  handleMouseOver(e) {
    const target = e.target.closest('[data-tooltip]');
    if (target) {
      clearTimeout(this.hideTimeout);
      this.show(target, target.dataset.tooltip, target.dataset.tooltipPosition || 'top');
    }
  }

  handleMouseOut(e) {
    const target = e.target.closest('[data-tooltip]');
    if (target) {
      this.hideTimeout = setTimeout(() => this.hide(), 200);
    }
  }

  handleFocus(e) {
    if (e.target.hasAttribute('data-tooltip')) {
      this.show(e.target, e.target.dataset.tooltip, e.target.dataset.tooltipPosition || 'top');
    }
  }

  handleBlur(e) {
    if (e.target.hasAttribute('data-tooltip')) {
      this.hide();
    }
  }

  show(target, text, position = 'top') {
    this.currentTarget = target;
    this.tooltip.textContent = text;
    this.tooltip.className = `tooltip tooltip-${position}`;

    // Position tooltip
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();

    let top, left;

    switch (position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - 8;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + 8;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + 8;
        break;
    }

    // Keep within viewport
    top = Math.max(8, Math.min(top, window.innerHeight - tooltipRect.height - 8));
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));

    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.opacity = '1';

    // Set ARIA attributes
    const tooltipId = 'tooltip-' + Date.now();
    this.tooltip.id = tooltipId;
    target.setAttribute('aria-describedby', tooltipId);
  }

  hide() {
    this.tooltip.style.opacity = '0';
    if (this.currentTarget) {
      this.currentTarget.removeAttribute('aria-describedby');
      this.currentTarget = null;
    }
  }

  /**
   * Add tooltip to element
   */
  static add(element, text, position = 'top') {
    element.setAttribute('data-tooltip', text);
    element.setAttribute('data-tooltip-position', position);
  }

  /**
   * Remove tooltip from element
   */
  static remove(element) {
    element.removeAttribute('data-tooltip');
    element.removeAttribute('data-tooltip-position');
  }
}

/**
 * Loading Spinner Component
 */
export class LoadingSpinner {
  /**
   * Create a loading spinner
   * @param {Object} options - Configuration options
   */
  static create(options = {}) {
    const spinner = document.createElement('div');
    spinner.className = `loading-spinner ${options.className || ''}`;
    spinner.setAttribute('role', 'status');
    spinner.setAttribute('aria-live', 'polite');
    spinner.setAttribute('aria-label', options.label || 'Loading');

    const size = options.size || 'medium';
    spinner.classList.add(`loading-spinner-${size}`);

    // Create spinner circles
    for (let i = 0; i < 3; i++) {
      const circle = document.createElement('div');
      circle.className = 'loading-spinner-circle';
      spinner.appendChild(circle);
    }

    // Add text if provided
    if (options.text) {
      const text = document.createElement('div');
      text.className = 'loading-spinner-text';
      text.textContent = options.text;
      spinner.appendChild(text);
    }

    return spinner;
  }

  /**
   * Show loading overlay
   */
  static showOverlay(options = {}) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.setAttribute('role', 'presentation');

    const spinner = this.create({
      size: options.size || 'large',
      text: options.text,
      label: options.label
    });

    overlay.appendChild(spinner);
    document.body.appendChild(overlay);

    // Announce to screen readers
    accessibilityManager.announce(options.text || 'Loading', 'polite');

    // Animate in
    requestAnimationFrame(() => {
      overlay.classList.add('loading-overlay-visible');
    });

    return {
      overlay,
      hide: () => {
        overlay.classList.remove('loading-overlay-visible');
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 300);
      }
    };
  }
}

/**
 * Progress Bar Component
 */
export class ProgressBar {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      min: options.min || 0,
      max: options.max || 100,
      value: options.value || 0,
      label: options.label || '',
      showPercentage: options.showPercentage !== false,
      indeterminate: options.indeterminate || false,
      variant: options.variant || 'primary'
    };

    this.element = null;
    this.progressBar = null;
    this.labelElement = null;
    this.percentageElement = null;

    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.className = `progress-container progress-${this.options.variant}`;
    this.element.setAttribute('role', 'group');

    // Create label
    if (this.options.label) {
      this.labelElement = document.createElement('div');
      this.labelElement.className = 'progress-label';
      this.labelElement.textContent = this.options.label;
      this.element.appendChild(this.labelElement);
    }

    // Create progress bar track
    const track = document.createElement('div');
    track.className = 'progress-track';

    // Create progress bar
    this.progressBar = document.createElement('div');
    this.progressBar.className = this.options.indeterminate ? 'progress-bar progress-bar-indeterminate' : 'progress-bar';
    this.progressBar.setAttribute('role', 'progressbar');
    this.progressBar.setAttribute('aria-valuemin', this.options.min);
    this.progressBar.setAttribute('aria-valuemax', this.options.max);

    if (!this.options.indeterminate) {
      this.progressBar.setAttribute('aria-valuenow', this.options.value);
      const percentage = this.getPercentage();
      this.progressBar.style.width = `${percentage}%`;
    }

    track.appendChild(this.progressBar);
    this.element.appendChild(track);

    // Create percentage display
    if (this.options.showPercentage && !this.options.indeterminate) {
      this.percentageElement = document.createElement('div');
      this.percentageElement.className = 'progress-percentage';
      this.percentageElement.textContent = `${Math.round(this.getPercentage())}%`;
      this.element.appendChild(this.percentageElement);
    }

    if (this.container) {
      this.container.appendChild(this.element);
    }
  }

  getPercentage() {
    const range = this.options.max - this.options.min;
    const value = this.options.value - this.options.min;
    return (value / range) * 100;
  }

  setValue(value) {
    this.options.value = Math.max(this.options.min, Math.min(this.options.max, value));

    if (!this.options.indeterminate) {
      const percentage = this.getPercentage();
      this.progressBar.setAttribute('aria-valuenow', this.options.value);
      this.progressBar.style.width = `${percentage}%`;

      if (this.percentageElement) {
        this.percentageElement.textContent = `${Math.round(percentage)}%`;
      }

      // Announce progress at milestones
      if (percentage === 100) {
        accessibilityManager.announce('Complete', 'polite');
      } else if (percentage % 25 === 0 && percentage > 0) {
        accessibilityManager.announce(`${Math.round(percentage)}% complete`, 'polite');
      }
    }
  }

  setLabel(label) {
    if (this.labelElement) {
      this.labelElement.textContent = label;
    }
  }

  remove() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

/**
 * Button Component with Ripple Effect
 */
export class Button {
  /**
   * Create an accessible button
   */
  static create(options = {}) {
    const button = document.createElement('button');
    button.type = options.type || 'button';
    button.className = `ui-button ui-button-${options.variant || 'primary'}`;

    if (options.icon) {
      const icon = document.createElement('span');
      icon.className = 'ui-button-icon';
      icon.textContent = options.icon;
      button.appendChild(icon);
    }

    if (options.label) {
      const label = document.createElement('span');
      label.className = 'ui-button-label';
      label.textContent = options.label;
      button.appendChild(label);
    }

    if (options.tooltip) {
      Tooltip.add(button, options.tooltip);
    }

    if (options.disabled) {
      button.disabled = true;
    }

    if (options.ariaLabel) {
      button.setAttribute('aria-label', options.ariaLabel);
    }

    // Add ripple effect
    button.addEventListener('click', (e) => {
      this.createRipple(e, button);
    });

    if (options.onClick) {
      button.addEventListener('click', options.onClick);
    }

    return button;
  }

  /**
   * Create ripple effect
   */
  static createRipple(event, button) {
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    const rect = button.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add('button-ripple');

    const ripple = button.querySelector('.button-ripple');
    if (ripple) {
      ripple.remove();
    }

    button.appendChild(circle);

    setTimeout(() => circle.remove(), 600);
  }
}

/**
 * Toast Notification Component (enhanced version)
 */
export class Toast {
  static showSuccess(message, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  static showError(message, duration = 5000) {
    return this.show(message, 'error', duration);
  }

  static showWarning(message, duration = 4000) {
    return this.show(message, 'warning', duration);
  }

  static showInfo(message, duration = 3000) {
    return this.show(message, 'info', duration);
  }

  static show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

    const icon = this.getIcon(type);
    if (icon) {
      const iconEl = document.createElement('span');
      iconEl.className = 'toast-icon';
      iconEl.textContent = icon;
      toast.appendChild(iconEl);
    }

    const messageEl = document.createElement('span');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;
    toast.appendChild(messageEl);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.addEventListener('click', () => {
      this.hide(toast);
    });
    toast.appendChild(closeBtn);

    // Add to container or create one
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'false');
      document.body.appendChild(container);
    }

    container.appendChild(toast);

    // Announce to screen readers
    accessibilityManager.announce(message, type === 'error' ? 'assertive' : 'polite');

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('toast-visible');
    });

    // Auto hide
    if (duration > 0) {
      setTimeout(() => {
        this.hide(toast);
      }, duration);
    }

    logger.debug('Toast shown', { type, message });

    return toast;
  }

  static hide(toast) {
    toast.classList.remove('toast-visible');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  static getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || '';
  }
}

// Initialize tooltip system
let tooltipInstance = null;

export function initializeUIComponents() {
  if (!tooltipInstance) {
    tooltipInstance = new Tooltip();
    logger.info('UI Components initialized');
  }
}

export default {
  Tooltip,
  LoadingSpinner,
  ProgressBar,
  Button,
  Toast,
  initializeUIComponents
};
