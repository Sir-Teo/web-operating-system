/**
 * WeatherWidget - Display weather information
 * Note: This is a mock implementation. In production, you'd integrate with a real weather API
 */
export class WeatherWidget {
  constructor(kernel, container, config = {}) {
    this.kernel = kernel;
    this.container = container;
    this.config = {
      location: config.location || 'San Francisco, CA',
      units: config.units || 'imperial', // imperial or metric
      ...config
    };
    this.updateInterval = null;
  }

  async init() {
    this._render();
    await this._updateWeather();

    // Update weather every 30 minutes
    this.updateInterval = setInterval(() => this._updateWeather(), 30 * 60 * 1000);
  }

  _render() {
    this.container.className = 'weather-widget';
    this.container.innerHTML = `
      <div class="location">${this.config.location}</div>
      <div class="current-weather">
        <div class="weather-icon">🌤️</div>
        <div class="temperature">--°</div>
      </div>
      <div class="conditions">Loading...</div>
      <div class="details">
        <div class="detail-item">
          <span>💧</span>
          <span class="humidity">--%</span>
        </div>
        <div class="detail-item">
          <span>💨</span>
          <span class="wind">-- mph</span>
        </div>
        <div class="detail-item">
          <span>👁️</span>
          <span class="visibility">-- mi</span>
        </div>
        <div class="detail-item">
          <span>🌡️</span>
          <span class="feels-like">Feels like --°</span>
        </div>
      </div>
    `;
  }

  async _updateWeather() {
    // Mock weather data - in production, fetch from a real API
    const mockWeather = this._getMockWeather();

    const tempUnit = this.config.units === 'metric' ? 'C' : 'F';
    const speedUnit = this.config.units === 'metric' ? 'km/h' : 'mph';
    const distUnit = this.config.units === 'metric' ? 'km' : 'mi';

    this.container.querySelector('.weather-icon').textContent = mockWeather.icon;
    this.container.querySelector('.temperature').textContent = `${mockWeather.temp}°${tempUnit}`;
    this.container.querySelector('.conditions').textContent = mockWeather.conditions;
    this.container.querySelector('.humidity').textContent = `${mockWeather.humidity}%`;
    this.container.querySelector('.wind').textContent = `${mockWeather.wind} ${speedUnit}`;
    this.container.querySelector('.visibility').textContent = `${mockWeather.visibility} ${distUnit}`;
    this.container.querySelector('.feels-like').textContent = `Feels like ${mockWeather.feelsLike}°${tempUnit}`;
  }

  _getMockWeather() {
    // Generate semi-realistic mock weather data
    const conditions = [
      { icon: '☀️', name: 'Sunny', temp: 75, feelsLike: 78 },
      { icon: '⛅', name: 'Partly Cloudy', temp: 68, feelsLike: 70 },
      { icon: '☁️', name: 'Cloudy', temp: 62, feelsLike: 60 },
      { icon: '🌤️', name: 'Mostly Sunny', temp: 72, feelsLike: 74 },
      { icon: '🌧️', name: 'Rainy', temp: 58, feelsLike: 55 },
      { icon: '⛈️', name: 'Thunderstorm', temp: 65, feelsLike: 63 },
    ];

    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    return {
      ...condition,
      humidity: Math.floor(Math.random() * 40 + 40), // 40-80%
      wind: Math.floor(Math.random() * 15 + 5), // 5-20 mph
      visibility: Math.floor(Math.random() * 5 + 5), // 5-10 mi
    };
  }

  showSettings() {
    const location = prompt('Enter location:', this.config.location);
    if (location) {
      this.config.location = location;
      this.container.querySelector('.location').textContent = location;
      this._updateWeather();
    }

    const units = confirm('Use metric units? (OK = Metric, Cancel = Imperial)');
    this.config.units = units ? 'metric' : 'imperial';
    this._updateWeather();
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}
