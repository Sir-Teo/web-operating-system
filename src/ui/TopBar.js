export class TopBar {
    constructor(kernel) {
        this.kernel = kernel;
        this.element = null;
        this.clock = null;
    }

    init() {
        this.element = document.createElement('div');
        this.element.id = 'top-bar';
        this.element.className = 'top-bar';

        this.element.innerHTML = `
      <div class="top-bar-left">
        <div class="apple-logo"></div>
        <div class="app-name">WebOS</div>
        <div class="top-menu">
          <span class="menu-item">File</span>
          <span class="menu-item">Edit</span>
          <span class="menu-item">View</span>
          <span class="menu-item">Go</span>
          <span class="menu-item">Window</span>
          <span class="menu-item">Help</span>
        </div>
      </div>
      <div class="top-bar-right">
        <div class="status-icon">🔋 100%</div>
        <div class="status-icon">🛜</div>
        <div class="status-icon">🔍</div>
        <div class="control-center-icon">🎛️</div>
        <div class="clock" id="top-bar-clock">--:--</div>
      </div>
    `;

        document.body.appendChild(this.element);

        this.clock = this.element.querySelector('#top-bar-clock');
        this._startClock();
        this._setupEventListeners();
    }

    _startClock() {
        const updateClock = () => {
            const now = new Date();
            const options = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
            this.clock.textContent = now.toLocaleDateString('en-US', options).replace(',', '');
        };

        updateClock();
        setInterval(updateClock, 1000);
    }

    _setupEventListeners() {
        // Add simple hover/click effects or menu logic here
        const menuItems = this.element.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                // Placeholder for menu actions
                console.log(`Clicked ${item.textContent}`);
            });
        });
    }
}
