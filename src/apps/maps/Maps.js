export default class Maps {
  constructor(context) {
    this.context = context;
    this.fs = context.fs;

    this.currentLocation = { lat: 37.7749, lng: -122.4194, name: 'San Francisco' };
    this.zoom = 12;
    this.markers = [];
    this.savedPlaces = [
      { lat: 37.7749, lng: -122.4194, name: 'San Francisco', icon: '🏙️' },
      { lat: 40.7128, lng: -74.0060, name: 'New York', icon: '🗽' },
      { lat: 51.5074, lng: -0.1278, name: 'London', icon: '🏰' },
      { lat: 35.6762, lng: 139.6503, name: 'Tokyo', icon: '🗼' },
      { lat: -33.8688, lng: 151.2093, name: 'Sydney', icon: '🌊' }
    ];
    this.viewMode = 'map'; // map, satellite, terrain
  }

  async init() {
    // Try to load saved data
    try {
      const data = await this.fs.readFile('/home/maps-data.json');
      if (data) {
        const parsed = JSON.parse(data);
        this.savedPlaces = parsed.savedPlaces || this.savedPlaces;
        this.markers = parsed.markers || this.markers;
      }
    } catch (error) {
      // Use defaults
    }
  }

  async saveData() {
    try {
      await this.fs.writeFile('/home/maps-data.json', JSON.stringify({
        savedPlaces: this.savedPlaces,
        markers: this.markers
      }, null, 2));
    } catch (error) {
      console.error('Failed to save map data:', error);
    }
  }

  render() {
    const container = document.createElement('div');
    container.className = 'maps-app';
    container.innerHTML = `
      <div class="maps-layout">
        <div class="maps-sidebar">
          <div class="search-section">
            <input type="text" class="search-input" placeholder="Search for a place...">
            <button class="search-btn">🔍</button>
          </div>

          <div class="view-modes">
            <button class="view-mode-btn ${this.viewMode === 'map' ? 'active' : ''}" data-mode="map">🗺️ Map</button>
            <button class="view-mode-btn ${this.viewMode === 'satellite' ? 'active' : ''}" data-mode="satellite">🛰️ Satellite</button>
            <button class="view-mode-btn ${this.viewMode === 'terrain' ? 'active' : ''}" data-mode="terrain">⛰️ Terrain</button>
          </div>

          <div class="saved-places-section">
            <h3>Saved Places</h3>
            <div class="saved-places-list">
              ${this.savedPlaces.map((place, index) => `
                <div class="saved-place-item" data-index="${index}">
                  <span class="place-icon">${place.icon}</span>
                  <span class="place-name">${place.name}</span>
                  <button class="remove-place-btn" data-index="${index}">×</button>
                </div>
              `).join('')}
            </div>
            <button class="add-place-btn">+ Add Place</button>
          </div>

          <div class="markers-section">
            <h3>Markers</h3>
            <div class="markers-list">
              ${this.markers.length === 0 ? '<div class="empty-state">No markers yet</div>' :
                this.markers.map((marker, index) => `
                  <div class="marker-item" data-index="${index}">
                    <span class="marker-icon">📍</span>
                    <span class="marker-name">${marker.name}</span>
                    <button class="remove-marker-btn" data-index="${index}">×</button>
                  </div>
                `).join('')
              }
            </div>
          </div>
        </div>

        <div class="map-container">
          <div class="map-controls">
            <button class="zoom-btn zoom-in-btn" title="Zoom In">+</button>
            <button class="zoom-btn zoom-out-btn" title="Zoom Out">−</button>
            <button class="locate-btn" title="My Location">📍</button>
            <button class="add-marker-btn" title="Add Marker">📌</button>
          </div>

          <div class="map-view ${this.viewMode}">
            <canvas class="map-canvas"></canvas>
            <div class="location-info">
              <div class="current-location-name">${this.currentLocation.name}</div>
              <div class="coordinates">
                ${this.currentLocation.lat.toFixed(4)}°, ${this.currentLocation.lng.toFixed(4)}°
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners(container);
    this.drawMap(container);
    return container;
  }

  attachEventListeners(container) {
    // Search
    const searchBtn = container.querySelector('.search-btn');
    const searchInput = container.querySelector('.search-input');

    const performSearch = () => {
      const query = searchInput.value.trim().toLowerCase();
      if (query) {
        const found = this.savedPlaces.find(p => p.name.toLowerCase().includes(query));
        if (found) {
          this.currentLocation = found;
          this.refresh();
        } else {
          alert(`Location "${query}" not found in saved places.`);
        }
      }
    };

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearch();
    });

    // View modes
    container.querySelectorAll('.view-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.viewMode = btn.dataset.mode;
        this.refresh();
      });
    });

    // Saved places
    container.querySelectorAll('.saved-place-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('remove-place-btn')) {
          const index = parseInt(item.dataset.index);
          this.currentLocation = this.savedPlaces[index];
          this.refresh();
        }
      });
    });

    // Remove place
    container.querySelectorAll('.remove-place-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        this.savedPlaces.splice(index, 1);
        this.saveData();
        this.refresh();
      });
    });

    // Add place
    const addPlaceBtn = container.querySelector('.add-place-btn');
    if (addPlaceBtn) {
      addPlaceBtn.addEventListener('click', () => {
        const name = prompt('Enter place name:');
        if (name && name.trim()) {
          const lat = parseFloat(prompt('Enter latitude:', '37.7749'));
          const lng = parseFloat(prompt('Enter longitude:', '-122.4194'));
          const icon = prompt('Enter emoji icon:', '📍');

          if (!isNaN(lat) && !isNaN(lng)) {
            this.savedPlaces.push({ lat, lng, name: name.trim(), icon });
            this.saveData();
            this.refresh();
          }
        }
      });
    }

    // Zoom controls
    const zoomInBtn = container.querySelector('.zoom-in-btn');
    const zoomOutBtn = container.querySelector('.zoom-out-btn');

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        this.zoom = Math.min(this.zoom + 1, 18);
        this.refresh();
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        this.zoom = Math.max(this.zoom - 1, 1);
        this.refresh();
      });
    }

    // Add marker
    const addMarkerBtn = container.querySelector('.add-marker-btn');
    if (addMarkerBtn) {
      addMarkerBtn.addEventListener('click', () => {
        const name = prompt('Enter marker name:');
        if (name && name.trim()) {
          this.markers.push({
            lat: this.currentLocation.lat,
            lng: this.currentLocation.lng,
            name: name.trim()
          });
          this.saveData();
          this.refresh();
        }
      });
    }

    // Remove marker
    container.querySelectorAll('.remove-marker-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        this.markers.splice(index, 1);
        this.saveData();
        this.refresh();
      });
    });

    // Locate button
    const locateBtn = container.querySelector('.locate-btn');
    if (locateBtn) {
      locateBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              this.currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                name: 'Your Location'
              };
              this.refresh();
            },
            (error) => {
              alert('Could not get your location: ' + error.message);
            }
          );
        } else {
          alert('Geolocation is not supported by your browser.');
        }
      });
    }

    // Canvas interaction
    const canvas = container.querySelector('.map-canvas');
    if (canvas) {
      canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Simple pan functionality
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const offsetX = (x - centerX) / 10000 * (20 - this.zoom);
        const offsetY = (centerY - y) / 10000 * (20 - this.zoom);

        this.currentLocation = {
          lat: this.currentLocation.lat + offsetY,
          lng: this.currentLocation.lng + offsetX,
          name: 'Custom Location'
        };
        this.refresh();
      });
    }
  }

  drawMap(container) {
    const canvas = container.querySelector('.map-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;

    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    // Draw background based on view mode
    if (this.viewMode === 'satellite') {
      ctx.fillStyle = '#2d5016';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (this.viewMode === 'terrain') {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#8B7355');
      gradient.addColorStop(0.5, '#90a955');
      gradient.addColorStop(1, '#6a994e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#e8f4f8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    const gridSize = 50;

    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw center marker
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw markers
    this.markers.forEach(marker => {
      const dx = (marker.lng - this.currentLocation.lng) * 10000 / (20 - this.zoom);
      const dy = (this.currentLocation.lat - marker.lat) * 10000 / (20 - this.zoom);
      const markerX = centerX + dx;
      const markerY = centerY + dy;

      if (markerX >= 0 && markerX <= canvas.width && markerY >= 0 && markerY <= canvas.height) {
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(markerX, markerY, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2980b9';
        ctx.font = '10px sans-serif';
        ctx.fillText(marker.name, markerX + 10, markerY - 10);
      }
    });

    // Draw zoom level
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.font = '12px monospace';
    ctx.fillText(`Zoom: ${this.zoom}`, 10, canvas.height - 10);
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
