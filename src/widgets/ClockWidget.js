/**
 * ClockWidget - Display current time and date
 */
export class ClockWidget {
  constructor(kernel, container, config = {}) {
    this.kernel = kernel;
    this.container = container;
    this.config = {
      format24h: config.format24h !== false, // Default to 24-hour format
      showSeconds: config.showSeconds !== false,
      ...config
    };
    this.updateInterval = null;
  }

  async init() {
    this._render();
    this._startClock();
  }

  _render() {
    this.container.className = 'clock-widget';
    this.container.innerHTML = `
      <div class="time" id="clock-widget-time">--:--:--</div>
      <div class="date" id="clock-widget-date">Loading...</div>
    `;

    this.timeElement = this.container.querySelector('#clock-widget-time');
    this.dateElement = this.container.querySelector('#clock-widget-date');
  }

  _startClock() {
    this._updateTime();
    this.updateInterval = setInterval(() => this._updateTime(), 1000);
  }

  _updateTime() {
    const now = new Date();

    // Format time
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    let timeStr;
    if (this.config.format24h) {
      timeStr = `${hours.toString().padStart(2, '0')}:${minutes}`;
    } else {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      timeStr = `${hours}:${minutes} ${ampm}`;
    }

    if (this.config.showSeconds) {
      timeStr = this.config.format24h
        ? `${timeStr}:${seconds}`
        : timeStr.replace(' ', `:${seconds} `);
    }

    this.timeElement.textContent = timeStr;

    // Format date
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    this.dateElement.textContent = now.toLocaleDateString('en-US', options);
  }

  showSettings() {
    const format24h = confirm('Use 24-hour format? (OK = Yes, Cancel = No)');
    const showSeconds = confirm('Show seconds? (OK = Yes, Cancel = No)');

    this.config.format24h = format24h;
    this.config.showSeconds = showSeconds;

    this._updateTime();
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}
