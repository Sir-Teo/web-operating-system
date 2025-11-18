/**
 * PWA Manager
 * Handles Progressive Web App features:
 * - Install prompt
 * - Offline support
 * - Update notifications
 * - Push notifications
 */

export class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isOnline = navigator.onLine;
    this.serviceWorker = null;
    this.updateAvailable = false;

    this.init();
  }

  /**
   * Initialize PWA features
   */
  async init() {
    this.checkIfInstalled();
    this.setupInstallPrompt();
    this.setupOnlineOfflineListeners();
    await this.registerServiceWorker();
    this.setupUpdateListener();
  }

  /**
   * Check if app is installed
   */
  checkIfInstalled() {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      return;
    }

    // Check for iOS standalone
    if (window.navigator.standalone === true) {
      this.isInstalled = true;
      return;
    }

    this.isInstalled = false;
  }

  /**
   * Setup install prompt
   */
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing
      e.preventDefault();

      // Store the event for later use
      this.deferredPrompt = e;

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('pwa:installable'));
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('pwa:installed'));
    });
  }

  /**
   * Show install prompt
   * @returns {Promise<boolean>} True if user accepted
   */
  async showInstallPrompt() {
    if (!this.deferredPrompt) {
      console.warn('Install prompt not available');
      return false;
    }

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await this.deferredPrompt.userChoice;

    // Clear the deferred prompt
    this.deferredPrompt = null;

    return outcome === 'accepted';
  }

  /**
   * Check if install prompt is available
   * @returns {boolean} True if available
   */
  canInstall() {
    return this.deferredPrompt !== null && !this.isInstalled;
  }

  /**
   * Setup online/offline listeners
   */
  setupOnlineOfflineListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      window.dispatchEvent(new CustomEvent('pwa:online'));
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      window.dispatchEvent(new CustomEvent('pwa:offline'));
    });
  }

  /**
   * Register service worker
   * @returns {Promise<ServiceWorkerRegistration|null>}
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      this.serviceWorker = registration;

      console.log('Service Worker registered:', registration.scope);

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Setup update listener
   */
  setupUpdateListener() {
    if (!this.serviceWorker) return;

    this.serviceWorker.addEventListener('updatefound', () => {
      const newWorker = this.serviceWorker.installing;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available
          this.updateAvailable = true;
          window.dispatchEvent(new CustomEvent('pwa:updateavailable'));
        }
      });
    });
  }

  /**
   * Update the app (reload with new service worker)
   */
  async update() {
    if (!this.serviceWorker) return;

    const registration = this.serviceWorker;

    // Check for update
    await registration.update();

    // If there's a waiting service worker, tell it to take over
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Reload the page when the new service worker takes over
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }

  /**
   * Check for updates
   * @returns {Promise<boolean>} True if update available
   */
  async checkForUpdates() {
    if (!this.serviceWorker) return false;

    try {
      const registration = await this.serviceWorker.update();
      return registration.waiting !== null;
    } catch (error) {
      console.error('Update check failed:', error);
      return false;
    }
  }

  /**
   * Unregister service worker
   * @returns {Promise<boolean>} True if successful
   */
  async unregisterServiceWorker() {
    if (!this.serviceWorker) return false;

    try {
      const success = await this.serviceWorker.unregister();
      if (success) {
        this.serviceWorker = null;
      }
      return success;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   * @returns {Promise<string>} Permission state
   */
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  /**
   * Show notification
   * @param {string} title - Notification title
   * @param {Object} options - Notification options
   * @returns {Promise<Notification|null>}
   */
  async showNotification(title, options = {}) {
    const permission = await this.requestNotificationPermission();

    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    if (this.serviceWorker) {
      // Use service worker to show notification
      return this.serviceWorker.showNotification(title, {
        badge: '/icons/icon-96x96.png',
        icon: '/icons/icon-192x192.png',
        ...options
      });
    } else {
      // Fallback to regular notification
      return new Notification(title, options);
    }
  }

  /**
   * Get app info
   * @returns {Object} App information
   */
  getInfo() {
    return {
      isInstalled: this.isInstalled,
      isOnline: this.isOnline,
      canInstall: this.canInstall(),
      updateAvailable: this.updateAvailable,
      hasServiceWorker: this.serviceWorker !== null,
      notificationPermission: 'Notification' in window
        ? Notification.permission
        : 'not-supported'
    };
  }

  /**
   * Add storage estimate
   * @returns {Promise<Object|null>} Storage estimate
   */
  async getStorageEstimate() {
    if (!navigator.storage || !navigator.storage.estimate) {
      console.warn('Storage API not supported');
      return null;
    }

    try {
      const estimate = await navigator.storage.estimate();

      return {
        usage: estimate.usage,
        quota: estimate.quota,
        usageMB: (estimate.usage / (1024 * 1024)).toFixed(2),
        quotaMB: (estimate.quota / (1024 * 1024)).toFixed(2),
        percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2)
      };
    } catch (error) {
      console.error('Storage estimate failed:', error);
      return null;
    }
  }

  /**
   * Request persistent storage
   * @returns {Promise<boolean>} True if granted
   */
  async requestPersistentStorage() {
    if (!navigator.storage || !navigator.storage.persist) {
      console.warn('Persistent storage not supported');
      return false;
    }

    try {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    } catch (error) {
      console.error('Persistent storage request failed:', error);
      return false;
    }
  }

  /**
   * Check if storage is persisted
   * @returns {Promise<boolean>} True if persisted
   */
  async isStoragePersisted() {
    if (!navigator.storage || !navigator.storage.persisted) {
      return false;
    }

    try {
      return await navigator.storage.persisted();
    } catch (error) {
      console.error('Storage persistence check failed:', error);
      return false;
    }
  }
}

// Create singleton instance
export const pwaManager = new PWAManager();
