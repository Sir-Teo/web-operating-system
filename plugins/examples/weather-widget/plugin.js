/**
 * Weather Widget Plugin
 * Displays current weather on the desktop
 */

class WeatherWidget {
  constructor(api) {
    this.api = api;
    this.widget = null;
    this.updateInterval = null;
    this.location = 'San Francisco'; // Default location
    this.unit = 'celsius';
  }

  async activate() {
    console.log('[WeatherWidget] Activating...');

    // Create widget UI
    this.widget = document.createElement('div');
    this.widget.className = 'weather-widget';
    this.widget.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 250px;
      background: rgba(30, 30, 30, 0.95);
      border: 1px solid #3e3e42;
      border-radius: 8px;
      padding: 16px;
      color: #d4d4d4;
      font-family: system-ui, sans-serif;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 9999;
      cursor: move;
    `;

    this.widget.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="margin: 0; font-size: 16px;">Weather</h3>
        <button class="close-btn" style="background: none; border: none; color: #888; cursor: pointer; font-size: 18px;">&times;</button>
      </div>
      <div class="weather-content">
        <div style="text-align: center; color: #888;">Loading...</div>
      </div>
    `;

    document.body.appendChild(this.widget);

    // Make widget draggable
    this._makeDraggable(this.widget);

    // Close button
    this.widget.querySelector('.close-btn').addEventListener('click', () => {
      this.widget.style.display = 'none';
    });

    // Load weather data
    await this.updateWeather();

    // Update every 10 minutes
    this.updateInterval = setInterval(() => this.updateWeather(), 10 * 60 * 1000);

    this.api.ui.notify('Weather widget activated');
  }

  async deactivate() {
    console.log('[WeatherWidget] Deactivating...');

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.widget) {
      this.widget.remove();
      this.widget = null;
    }
  }

  async updateWeather() {
    try {
      // Mock weather data (in production, fetch from real API)
      const weatherData = this._getMockWeatherData();

      const content = this.widget.querySelector('.weather-content');
      content.innerHTML = `
        <div style="text-align: center; margin-bottom: 16px;">
          <div style="font-size: 48px; margin-bottom: 8px;">${weatherData.icon}</div>
          <div style="font-size: 32px; font-weight: bold; margin-bottom: 4px;">${weatherData.temp}°${this.unit === 'celsius' ? 'C' : 'F'}</div>
          <div style="color: #888; font-size: 14px;">${weatherData.condition}</div>
        </div>
        <div style="font-size: 14px; color: #888;">
          <div style="margin-bottom: 4px;">📍 ${this.location}</div>
          <div style="margin-bottom: 4px;">💨 Wind: ${weatherData.wind} km/h</div>
          <div>💧 Humidity: ${weatherData.humidity}%</div>
        </div>
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #3e3e42; font-size: 12px; color: #666;">
          Last updated: ${new Date().toLocaleTimeString()}
        </div>
      `;
    } catch (error) {
      console.error('[WeatherWidget] Failed to update weather:', error);
    }
  }

  _getMockWeatherData() {
    const conditions = [
      { icon: '☀️', condition: 'Sunny', temp: 22 },
      { icon: '⛅', condition: 'Partly Cloudy', temp: 19 },
      { icon: '☁️', condition: 'Cloudy', temp: 16 },
      { icon: '🌧️', condition: 'Rainy', temp: 14 }
    ];

    const selected = conditions[Math.floor(Math.random() * conditions.length)];

    return {
      ...selected,
      wind: Math.floor(Math.random() * 30) + 5,
      humidity: Math.floor(Math.random() * 40) + 40
    };
  }

  _makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    element.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      if (e.target.className === 'close-btn') return;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.top = (element.offsetTop - pos2) + 'px';
      element.style.left = (element.offsetLeft - pos1) + 'px';
      element.style.right = 'auto';
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  // State management for hot reload
  async saveState() {
    return {
      location: this.location,
      unit: this.unit,
      position: {
        top: this.widget?.style.top,
        left: this.widget?.style.left,
        right: this.widget?.style.right
      }
    };
  }

  async restoreState(state) {
    this.location = state.location;
    this.unit = state.unit;
    if (this.widget && state.position) {
      Object.assign(this.widget.style, state.position);
    }
  }
}

module.exports = WeatherWidget;
