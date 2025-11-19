/**
 * Hello World Plugin
 * Simple example demonstrating basic plugin structure
 */

export default class HelloWorldPlugin {
  constructor(api) {
    this.api = api;
    this.interval = null;
  }

  /**
   * Called when plugin is activated
   */
  async activate() {
    console.log('[HelloWorldPlugin] Activating...');

    // Show welcome notification
    this.api.ui.notify('Hello from the plugin system!', {
      title: 'Hello World Plugin',
      duration: 5000
    });

    // Store activation time
    await this.api.storage.set('activatedAt', new Date().toISOString());

    // Set up periodic greeting (every 30 seconds)
    this.interval = this.api.timers.setInterval(() => {
      this.showGreeting();
    }, 30000);

    console.log('[HelloWorldPlugin] Activated successfully');
  }

  /**
   * Called when plugin is deactivated
   */
  async deactivate() {
    console.log('[HelloWorldPlugin] Deactivating...');

    // Clean up interval
    if (this.interval) {
      this.api.timers.clearInterval(this.interval);
      this.interval = null;
    }

    // Show goodbye notification
    this.api.ui.notify('Goodbye! Plugin deactivated.', {
      title: 'Hello World Plugin',
      duration: 3000
    });

    // Store deactivation time
    await this.api.storage.set('deactivatedAt', new Date().toISOString());

    console.log('[HelloWorldPlugin] Deactivated successfully');
  }

  /**
   * Show greeting notification
   */
  showGreeting() {
    const greetings = [
      'Hello!',
      'Hi there!',
      'Greetings!',
      'Hey!',
      'Welcome back!'
    ];

    const greeting = greetings[Math.floor(Math.random() * greetings.length)];

    this.api.ui.notify(greeting, {
      title: 'Hello World Plugin',
      duration: 3000
    });
  }
}
