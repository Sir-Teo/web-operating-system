export default class Weather {
  constructor(context) {
    this.context = context;
    this.fs = context.fs;

    this.currentLocation = 'San Francisco';
    this.savedLocations = ['San Francisco', 'New York', 'London', 'Tokyo', 'Sydney'];
    this.unit = 'celsius'; // celsius or fahrenheit
  }

  async init() {
    // Try to load saved preferences
    try {
      const prefs = await this.fs.readFile('/home/weather-prefs.json');
      if (prefs) {
        const data = JSON.parse(prefs);
        this.currentLocation = data.currentLocation || this.currentLocation;
        this.savedLocations = data.savedLocations || this.savedLocations;
        this.unit = data.unit || this.unit;
      }
    } catch (error) {
      // Use defaults
    }
  }

  async savePreferences() {
    try {
      await this.fs.writeFile('/home/weather-prefs.json', JSON.stringify({
        currentLocation: this.currentLocation,
        savedLocations: this.savedLocations,
        unit: this.unit
      }, null, 2));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  render() {
    const weatherData = this.getWeatherData(this.currentLocation);
    const forecast = this.getForecast(this.currentLocation);

    const container = document.createElement('div');
    container.className = 'weather-app';
    container.innerHTML = `
      <div class="weather-header">
        <div class="location-selector">
          <input type="text" class="location-input" value="${this.currentLocation}" placeholder="Enter city name...">
          <button class="search-btn">🔍</button>
        </div>
        <div class="unit-toggle">
          <button class="unit-btn ${this.unit === 'celsius' ? 'active' : ''}" data-unit="celsius">°C</button>
          <button class="unit-btn ${this.unit === 'fahrenheit' ? 'active' : ''}" data-unit="fahrenheit">°F</button>
        </div>
      </div>

      <div class="current-weather">
        <div class="location-info">
          <h2>${this.currentLocation}</h2>
          <p class="current-time">${this.getCurrentTime()}</p>
        </div>
        <div class="weather-main">
          <div class="weather-icon">${this.getWeatherIcon(weatherData.condition)}</div>
          <div class="temperature">${this.formatTemperature(weatherData.temp)}°</div>
        </div>
        <div class="weather-details">
          <div class="condition">${weatherData.condition}</div>
          <div class="feels-like">Feels like ${this.formatTemperature(weatherData.feelsLike)}°</div>
        </div>
      </div>

      <div class="weather-stats">
        <div class="stat-item">
          <div class="stat-icon">💨</div>
          <div class="stat-label">Wind</div>
          <div class="stat-value">${weatherData.wind} km/h</div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">💧</div>
          <div class="stat-label">Humidity</div>
          <div class="stat-value">${weatherData.humidity}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">☁️</div>
          <div class="stat-label">Clouds</div>
          <div class="stat-value">${weatherData.clouds}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">🌡️</div>
          <div class="stat-label">Pressure</div>
          <div class="stat-value">${weatherData.pressure} hPa</div>
        </div>
      </div>

      <div class="forecast-section">
        <h3>5-Day Forecast</h3>
        <div class="forecast-list">
          ${forecast.map(day => `
            <div class="forecast-item">
              <div class="forecast-day">${day.day}</div>
              <div class="forecast-icon">${this.getWeatherIcon(day.condition)}</div>
              <div class="forecast-temps">
                <span class="temp-high">${this.formatTemperature(day.high)}°</span>
                <span class="temp-low">${this.formatTemperature(day.low)}°</span>
              </div>
              <div class="forecast-condition">${day.condition}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="saved-locations">
        <h3>Saved Locations</h3>
        <div class="locations-list">
          ${this.savedLocations.map(loc => `
            <div class="location-item ${loc === this.currentLocation ? 'active' : ''}" data-location="${loc}">
              <span>${loc}</span>
              ${loc !== this.currentLocation ? `<button class="remove-location-btn" data-location="${loc}">×</button>` : ''}
            </div>
          `).join('')}
        </div>
        <button class="add-location-btn">+ Add Location</button>
      </div>
    `;

    this.attachEventListeners(container);
    return container;
  }

  attachEventListeners(container) {
    // Search button
    const searchBtn = container.querySelector('.search-btn');
    const locationInput = container.querySelector('.location-input');

    const searchLocation = () => {
      const location = locationInput.value.trim();
      if (location) {
        this.currentLocation = location;
        if (!this.savedLocations.includes(location)) {
          this.savedLocations.push(location);
        }
        this.savePreferences();
        this.refresh();
      }
    };

    searchBtn.addEventListener('click', searchLocation);
    locationInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchLocation();
      }
    });

    // Unit toggle
    container.querySelectorAll('.unit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.unit = btn.dataset.unit;
        this.savePreferences();
        this.refresh();
      });
    });

    // Saved locations
    container.querySelectorAll('.location-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('remove-location-btn')) {
          this.currentLocation = item.dataset.location;
          this.savePreferences();
          this.refresh();
        }
      });
    });

    // Remove location
    container.querySelectorAll('.remove-location-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const location = btn.dataset.location;
        this.savedLocations = this.savedLocations.filter(loc => loc !== location);
        this.savePreferences();
        this.refresh();
      });
    });

    // Add location
    const addLocationBtn = container.querySelector('.add-location-btn');
    if (addLocationBtn) {
      addLocationBtn.addEventListener('click', () => {
        const location = prompt('Enter city name:');
        if (location && location.trim()) {
          if (!this.savedLocations.includes(location.trim())) {
            this.savedLocations.push(location.trim());
            this.savePreferences();
            this.refresh();
          }
        }
      });
    }
  }

  getWeatherData(location) {
    // Simulate weather data based on location hash
    const hash = this.hashCode(location + new Date().toDateString());
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Stormy', 'Snowy', 'Foggy'];
    const baseTemp = 15 + (hash % 20);

    return {
      temp: baseTemp,
      feelsLike: baseTemp + ((hash % 5) - 2),
      condition: conditions[Math.abs(hash) % conditions.length],
      wind: 5 + (Math.abs(hash) % 30),
      humidity: 40 + (Math.abs(hash) % 50),
      clouds: Math.abs(hash) % 100,
      pressure: 1000 + (Math.abs(hash) % 50)
    };
  }

  getForecast(location) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Stormy'];

    return days.map((day, index) => {
      const hash = this.hashCode(location + day);
      const baseTemp = 12 + (hash % 18);

      return {
        day: day,
        condition: conditions[Math.abs(hash) % conditions.length],
        high: baseTemp + 5,
        low: baseTemp - 3
      };
    });
  }

  getWeatherIcon(condition) {
    const icons = {
      'Sunny': '☀️',
      'Partly Cloudy': '⛅',
      'Cloudy': '☁️',
      'Rainy': '🌧️',
      'Stormy': '⛈️',
      'Snowy': '❄️',
      'Foggy': '🌫️'
    };
    return icons[condition] || '🌤️';
  }

  formatTemperature(celsius) {
    if (this.unit === 'fahrenheit') {
      return Math.round((celsius * 9/5) + 32);
    }
    return Math.round(celsius);
  }

  getCurrentTime() {
    const now = new Date();
    return now.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  refresh() {
    const container = this.context.process.window?.contentElement;
    if (container) {
      const newContent = this.render();
      container.innerHTML = '';
      container.appendChild(newContent);
    }
  }
}
