/**
 * Modal Dialog System
 * Provides accessible, customizable modals to replace native alerts/confirms
 */

import { createLogger } from '../../kernel/Logger.js';
import accessibilityManager from '../../system/AccessibilityManager.js';

const logger = createLogger('Modal');

/**
 * Modal types
 */
export const ModalType = {
  ALERT: 'alert',
  CONFIRM: 'confirm',
  PROMPT: 'prompt',
  CUSTOM: 'custom'
};

/**
 * Modal class
 */
export class Modal {
  constructor(options = {}) {
    this.options = {
      type: options.type || ModalType.ALERT,
      title: options.title || 'Alert',
      message: options.message || '',
      content: options.content || null,
      icon: options.icon || null,
      buttons: options.buttons || this.getDefaultButtons(options.type),
      closeOnOverlayClick: options.closeOnOverlayClick !== false,
      closeOnEscape: options.closeOnEscape !== false,
      width: options.width || 'auto',
      maxWidth: options.maxWidth || '500px',
      className: options.className || '',
      onClose: options.onClose || null,
      defaultValue: options.defaultValue || '',
      inputType: options.inputType || 'text',
      inputPlaceholder: options.inputPlaceholder || '',
      inputValidator: options.inputValidator || null
    };

    this.element = null;
    this.overlay = null;
    this.focusTrap = null;
    this.resolvePromise = null;
    this.rejectPromise = null;

    logger.debug('Modal created', { type: this.options.type, title: this.options.title });
  }

  /**
   * Get default buttons for modal type
   */
  getDefaultButtons(type) {
    switch (type) {
      case ModalType.CONFIRM:
        return [
          { label: 'Cancel', value: false, variant: 'secondary' },
          { label: 'OK', value: true, variant: 'primary' }
        ];
      case ModalType.PROMPT:
        return [
          { label: 'Cancel', value: null, variant: 'secondary' },
          { label: 'OK', value: 'submit', variant: 'primary' }
        ];
      case ModalType.ALERT:
      default:
        return [
          { label: 'OK', value: true, variant: 'primary' }
        ];
    }
  }

  /**
   * Create modal element
   */
  create() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.setAttribute('role', 'presentation');

    if (this.options.closeOnOverlayClick) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.close(null);
        }
      });
    }

    // Create modal container
    this.element = document.createElement('div');
    this.element.className = `modal ${this.options.className}`;
    this.element.setAttribute('role', this.options.type === ModalType.ALERT ? 'alertdialog' : 'dialog');
    this.element.setAttribute('aria-modal', 'true');
    this.element.setAttribute('aria-labelledby', 'modal-title');
    this.element.setAttribute('aria-describedby', 'modal-message');

    if (this.options.maxWidth) {
      this.element.style.maxWidth = this.options.maxWidth;
    }

    if (this.options.width !== 'auto') {
      this.element.style.width = this.options.width;
    }

    // Create header
    const header = document.createElement('div');
    header.className = 'modal-header';

    if (this.options.icon) {
      const icon = document.createElement('div');
      icon.className = 'modal-icon';
      icon.innerHTML = this.options.icon;
      header.appendChild(icon);
    }

    const title = document.createElement('h2');
    title.id = 'modal-title';
    title.className = 'modal-title';
    title.textContent = this.options.title;
    header.appendChild(title);

    this.element.appendChild(header);

    // Create body
    const body = document.createElement('div');
    body.className = 'modal-body';

    if (this.options.content) {
      if (typeof this.options.content === 'string') {
        body.innerHTML = this.options.content;
      } else if (this.options.content instanceof HTMLElement) {
        body.appendChild(this.options.content);
      }
    } else if (this.options.message) {
      const message = document.createElement('p');
      message.id = 'modal-message';
      message.className = 'modal-message';
      message.textContent = this.options.message;
      body.appendChild(message);
    }

    // Add input for prompt type
    if (this.options.type === ModalType.PROMPT) {
      const inputContainer = document.createElement('div');
      inputContainer.className = 'modal-input-container';

      const input = document.createElement('input');
      input.type = this.options.inputType;
      input.className = 'modal-input';
      input.value = this.options.defaultValue;
      input.placeholder = this.options.inputPlaceholder;
      input.setAttribute('aria-label', this.options.inputPlaceholder || 'Input value');
      input.id = 'modal-input';

      inputContainer.appendChild(input);

      // Add error message container
      const errorMsg = document.createElement('div');
      errorMsg.className = 'modal-input-error';
      errorMsg.id = 'modal-input-error';
      errorMsg.setAttribute('role', 'alert');
      errorMsg.style.display = 'none';
      inputContainer.appendChild(errorMsg);

      body.appendChild(inputContainer);

      // Handle Enter key
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.submitPrompt();
        }
      });
    }

    this.element.appendChild(body);

    // Create footer with buttons
    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    this.options.buttons.forEach((button, index) => {
      const btn = document.createElement('button');
      btn.className = `modal-button modal-button-${button.variant || 'secondary'}`;
      btn.textContent = button.label;
      btn.setAttribute('type', 'button');

      if (index === this.options.buttons.length - 1) {
        btn.setAttribute('data-primary', 'true');
      }

      btn.addEventListener('click', () => {
        if (this.options.type === ModalType.PROMPT && button.value === 'submit') {
          this.submitPrompt();
        } else {
          this.close(button.value);
        }
      });

      footer.appendChild(btn);
    });

    this.element.appendChild(footer);
    this.overlay.appendChild(this.element);

    return this.overlay;
  }

  /**
   * Submit prompt value
   */
  submitPrompt() {
    const input = this.element.querySelector('#modal-input');
    const value = input.value;

    // Validate if validator provided
    if (this.options.inputValidator) {
      const validation = this.options.inputValidator(value);
      if (validation !== true) {
        this.showInputError(validation);
        return;
      }
    }

    this.close(value);
  }

  /**
   * Show input validation error
   */
  showInputError(message) {
    const input = this.element.querySelector('#modal-input');
    const errorMsg = this.element.querySelector('#modal-input-error');

    input.classList.add('modal-input-invalid');
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', 'modal-input-error');

    errorMsg.textContent = message;
    errorMsg.style.display = 'block';

    accessibilityManager.announce(message, 'assertive');

    // Focus input
    input.focus();
  }

  /**
   * Hide input error
   */
  hideInputError() {
    const input = this.element.querySelector('#modal-input');
    const errorMsg = this.element.querySelector('#modal-input-error');

    if (input) {
      input.classList.remove('modal-input-invalid');
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }

    if (errorMsg) {
      errorMsg.style.display = 'none';
    }
  }

  /**
   * Show modal
   */
  show() {
    return new Promise((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;

      // Create and append modal
      const modalElement = this.create();
      document.body.appendChild(modalElement);

      // Animate in
      requestAnimationFrame(() => {
        this.overlay.classList.add('modal-overlay-visible');
        this.element.classList.add('modal-visible');
      });

      // Setup keyboard handling
      if (this.options.closeOnEscape) {
        this.handleEscape = (e) => {
          if (e.key === 'Escape') {
            this.close(null);
          }
        };
        document.addEventListener('keydown', this.handleEscape);
      }

      // Setup focus trap
      this.focusTrap = accessibilityManager.keyboardNav.trapFocus(this.element, {
        onEscape: this.options.closeOnEscape ? () => this.close(null) : null
      });

      // Announce to screen readers
      accessibilityManager.announce(`${this.options.title}. ${this.options.message}`, 'assertive');

      logger.info('Modal shown', { type: this.options.type });
    });
  }

  /**
   * Close modal
   */
  close(value) {
    logger.debug('Modal closing', { value });

    // Animate out
    this.overlay.classList.remove('modal-overlay-visible');
    this.element.classList.remove('modal-visible');

    // Cleanup after animation
    setTimeout(() => {
      // Release focus trap
      if (this.focusTrap) {
        this.focusTrap.release();
      }

      // Remove keyboard handler
      if (this.handleEscape) {
        document.removeEventListener('keydown', this.handleEscape);
      }

      // Remove from DOM
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }

      // Call onClose callback
      if (this.options.onClose) {
        this.options.onClose(value);
      }

      // Resolve promise
      if (this.resolvePromise) {
        this.resolvePromise(value);
      }

      logger.info('Modal closed');
    }, 300); // Match CSS animation duration
  }
}

/**
 * Modal Service - convenience methods
 */
export class ModalService {
  /**
   * Show alert dialog
   */
  static alert(message, title = 'Alert', options = {}) {
    const modal = new Modal({
      type: ModalType.ALERT,
      title,
      message,
      icon: options.icon || '⚠️',
      ...options
    });
    return modal.show();
  }

  /**
   * Show confirm dialog
   */
  static confirm(message, title = 'Confirm', options = {}) {
    const modal = new Modal({
      type: ModalType.CONFIRM,
      title,
      message,
      icon: options.icon || '❓',
      ...options
    });
    return modal.show();
  }

  /**
   * Show prompt dialog
   */
  static prompt(message, defaultValue = '', title = 'Input', options = {}) {
    const modal = new Modal({
      type: ModalType.PROMPT,
      title,
      message,
      defaultValue,
      icon: options.icon || '✏️',
      ...options
    });
    return modal.show();
  }

  /**
   * Show success message
   */
  static success(message, title = 'Success', options = {}) {
    return this.alert(message, title, {
      icon: '✅',
      className: 'modal-success',
      ...options
    });
  }

  /**
   * Show error message
   */
  static error(message, title = 'Error', options = {}) {
    return this.alert(message, title, {
      icon: '❌',
      className: 'modal-error',
      ...options
    });
  }

  /**
   * Show warning message
   */
  static warning(message, title = 'Warning', options = {}) {
    return this.alert(message, title, {
      icon: '⚠️',
      className: 'modal-warning',
      ...options
    });
  }

  /**
   * Show info message
   */
  static info(message, title = 'Information', options = {}) {
    return this.alert(message, title, {
      icon: 'ℹ️',
      className: 'modal-info',
      ...options
    });
  }

  /**
   * Show custom modal
   */
  static custom(options) {
    const modal = new Modal({
      type: ModalType.CUSTOM,
      ...options
    });
    return modal.show();
  }
}

// Replace native alert, confirm, prompt
export function replaceNativeDialogs() {
  if (window.__nativeDialogsReplaced) {
    return;
  }

  window.__originalAlert = window.alert;
  window.__originalConfirm = window.confirm;
  window.__originalPrompt = window.prompt;

  window.alert = (message) => {
    ModalService.alert(String(message));
  };

  window.confirm = async (message) => {
    return await ModalService.confirm(String(message));
  };

  window.prompt = async (message, defaultValue) => {
    return await ModalService.prompt(String(message), String(defaultValue || ''));
  };

  window.__nativeDialogsReplaced = true;
  logger.info('Native dialogs replaced with custom modals');
}

export default ModalService;
