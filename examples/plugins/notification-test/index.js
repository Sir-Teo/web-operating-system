/**
 * Notification Tester Plugin
 * Demonstrates various notification features
 */

export default class NotificationTesterPlugin {
  constructor(api) {
    this.api = api;
    this.testCount = 0;
  }

  /**
   * Called when plugin is activated
   */
  async activate() {
    console.log('[NotificationTesterPlugin] Activating...');

    // Get previous test count from storage
    this.testCount = (await this.api.storage.get('testCount')) || 0;

    // Show activation notification
    this.api.ui.notify(`Plugin activated! Previous tests run: ${this.testCount}`, {
      title: 'Notification Tester',
      duration: 4000
    });

    // Run a test notification after 2 seconds
    this.api.timers.setTimeout(() => {
      this.runTest();
    }, 2000);

    console.log('[NotificationTesterPlugin] Activated');
  }

  /**
   * Called when plugin is deactivated
   */
  async deactivate() {
    console.log('[NotificationTesterPlugin] Deactivating...');

    // Save test count
    await this.api.storage.set('testCount', this.testCount);
    await this.api.storage.set('lastDeactivated', new Date().toISOString());

    // Show goodbye notification
    this.api.ui.notify(`Total tests run: ${this.testCount}`, {
      title: 'Notification Tester - Goodbye',
      duration: 3000
    });

    console.log('[NotificationTesterPlugin] Deactivated');
  }

  /**
   * Run notification test
   */
  async runTest() {
    this.testCount++;

    const tests = [
      {
        title: 'Success Notification',
        message: '✓ Operation completed successfully!'
      },
      {
        title: 'Information',
        message: 'ℹ This is an informational message'
      },
      {
        title: 'Warning',
        message: '⚠ This is a warning message'
      },
      {
        title: 'Long Message Test',
        message: 'This is a longer notification message to test how the notification system handles multiple lines of text and word wrapping.'
      }
    ];

    const test = tests[Math.floor(Math.random() * tests.length)];

    this.api.ui.notify(test.message, {
      title: test.title,
      duration: 4000
    });

    // Save current test count
    await this.api.storage.set('testCount', this.testCount);

    console.log(`[NotificationTesterPlugin] Test #${this.testCount} completed`);
  }
}
