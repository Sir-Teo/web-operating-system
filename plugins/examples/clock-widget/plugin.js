/**
 * Clock Widget Plugin
 * Displays a beautiful clock on the desktop
 */
class ClockWidget {
  constructor(api) {
    this.api = api;
    this.widget = null;
    this.updateInterval = null;
  }

  async activate() {
    // Create widget container
    this.widget = document.createElement('div');
    this.widget.id = 'clock-widget';
    this.widget.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 30px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      font-family: 'Segoe UI', system-ui, sans-serif;
      z-index: 9999;
      cursor: move;
      user-select: none;
      backdrop-filter: blur(10px);
    `;

    // Time display
    const timeEl = document.createElement('div');
    timeEl.id = 'clock-time';
    timeEl.style.cssText = `
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 5px;
    `;

    // Date display
    const dateEl = document.createElement('div');
    dateEl.id = 'clock-date';
    dateEl.style.cssText = `
      font-size: 14px;
      opacity: 0.9;
      text-align: center;
    `;

    this.widget.appendChild(timeEl);
    this.widget.appendChild(dateEl);
    document.body.appendChild(this.widget);

    // Make draggable
    this.makeDraggable(this.widget);

    // Update time
    this.updateTime();
    this.updateInterval = this.api.timers.setInterval(() => this.updateTime(), 1000);

    // Show notification
    this.api.ui.notify('Clock widget activated!', {
      title: 'Clock Widget',
      duration: 2000
    });
  }

  updateTime() {
    const now = new Date();

    // Format time
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}:${seconds}`;

    // Format date
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateStr = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;

    // Update display
    const timeEl = document.getElementById('clock-time');
    const dateEl = document.getElementById('clock-date');
    if (timeEl) timeEl.textContent = timeStr;
    if (dateEl) dateEl.textContent = dateStr;
  }

  makeDraggable(element) {
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    element.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - element.offsetLeft;
      offsetY = e.clientY - element.offsetTop;
      element.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        element.style.left = `${e.clientX - offsetX}px`;
        element.style.top = `${e.clientY - offsetY}px`;
        element.style.right = 'auto';
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      element.style.cursor = 'move';
    });
  }

  async deactivate() {
    // Clear interval
    if (this.updateInterval) {
      this.api.timers.clearInterval(this.updateInterval);
    }

    // Remove widget
    if (this.widget && this.widget.parentNode) {
      this.widget.parentNode.removeChild(this.widget);
    }

    this.api.ui.notify('Clock widget deactivated', {
      title: 'Clock Widget',
      duration: 2000
    });
  }
}

module.exports = ClockWidget;
