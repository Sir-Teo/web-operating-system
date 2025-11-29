export class StartMenu {
  constructor(kernel) {
    this.kernel = kernel;
    this.element = document.getElementById('start-menu');
    this.appsContainer = document.getElementById('start-menu-apps');
    this.powerButton = document.getElementById('power-button');

    this._setupEventListeners();
  }

  async init() {
    await this._loadApplications();
  }

  async _loadApplications() {
    try {
      const { default: AppRegistry } = await import('../apps/AppRegistry.js');
      const apps = AppRegistry.listApps();

      this.appsContainer.innerHTML = '';

      apps.forEach(app => {
        const appItem = document.createElement('div');
        appItem.className = 'start-menu-app';
        appItem.innerHTML = `
          <div class="app-icon">${app.icon}</div>
          <div class="app-name">${app.name}</div>
        `;

        appItem.addEventListener('click', async () => {
          await AppRegistry.launchApp(app.id);
          this.hide();
        });

        this.appsContainer.appendChild(appItem);
      });
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  }

  _setupEventListeners() {
    this.powerButton.addEventListener('click', async () => {
      const confirmed = confirm('Are you sure you want to shut down?');
      if (confirmed) {
        await this.kernel.shutdown();
        document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-size:2rem;background:#000;color:#fff;">System Shutdown</div>';
      }
    });

    // Close start menu when clicking outside
    document.addEventListener('click', (e) => {
      const startMenu = this.element;
      const startButton = document.getElementById('start-button');

      if (startMenu.classList.contains('visible') &&
        !startMenu.contains(e.target) &&
        !startButton.contains(e.target)) {
        this.hide();
      }
    });
  }

  show() {
    this.element.style.display = 'flex';
    // Force reflow
    this.element.offsetHeight;
    this.element.classList.add('visible');
  }

  hide() {
    this.element.classList.remove('visible');
    setTimeout(() => {
      if (!this.element.classList.contains('visible')) {
        this.element.style.display = 'none';
      }
    }, 300);
  }
}
