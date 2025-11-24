import './Maps.css';

export default class Maps {
  constructor(context) {
    this.context = context;
    this.fs = context.fs;

    this.currentLocation = { lat: 37.7749, lng: -122.4194, name: 'San Francisco' };
    this.zoom = 12;
    this.markers = [];
    this.savedPlaces = [
      { lat: 37.7749, lng: -122.4194, name: 'San Francisco', icon: '🏙️', country: 'USA' },
      { lat: 40.7128, lng: -74.0060, name: 'New York', icon: '🗽', country: 'USA' },
      { lat: 51.5074, lng: -0.1278, name: 'London', icon: '🏰', country: 'UK' },
      { lat: 35.6762, lng: 139.6503, name: 'Tokyo', icon: '🗼', country: 'Japan' },
      { lat: -33.8688, lng: 151.2093, name: 'Sydney', icon: '🌊', country: 'Australia' },
      { lat: 48.8566, lng: 2.3522, name: 'Paris', icon: '🗼', country: 'France' },
      { lat: 34.0522, lng: -118.2437, name: 'Los Angeles', icon: '🎬', country: 'USA' },
      { lat: 55.7558, lng: 37.6173, name: 'Moscow', icon: '🏛️', country: 'Russia' },
      { lat: 39.9042, lng: 116.4074, name: 'Beijing', icon: '🏯', country: 'China' },
      { lat: 41.9028, lng: 12.4964, name: 'Rome', icon: '🏛️', country: 'Italy' }
    ];
    this.viewMode = 'map'; // map, satellite, terrain
    this.routeStart = null;
    this.routeEnd = null;
    this.route = null;
    this.measureStart = null;
    this.measureEnd = null;
    this.pois = []; // Points of Interest
    this.showPOIs = false;
  }

  async init() {
    // Try to load saved data
    try {
      const data = await this.fs.readFile('/home/maps-data.json');
      if (data) {
        const parsed = JSON.parse(data);
        this.savedPlaces = parsed.savedPlaces || this.savedPlaces;
        this.markers = parsed.markers || this.markers;
        this.currentLocation = parsed.currentLocation || this.currentLocation;
      }
    } catch (error) {
      // Use defaults
    }

    // Generate POIs near current location
    this.generatePOIs();
  }

  async saveData() {
    try {
      await this.fs.writeFile('/home/maps-data.json', JSON.stringify({
        savedPlaces: this.savedPlaces,
        markers: this.markers,
        currentLocation: this.currentLocation
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

          <div class="directions-section">
            <h3>Directions</h3>
            <div class="route-inputs">
              <input type="text" class="route-start-input" placeholder="Starting point..." value="${this.routeStart?.name || ''}">
              <input type="text" class="route-end-input" placeholder="Destination..." value="${this.routeEnd?.name || ''}">
              <button class="get-directions-btn">Get Directions</button>
              ${this.route ? `<button class="clear-route-btn">Clear Route</button>` : ''}
            </div>
            ${this.route ? `
              <div class="route-info">
                <div class="route-stat">
                  <span class="route-label">Distance:</span>
                  <span class="route-value">${this.route.distance.toFixed(1)} km</span>
                </div>
                <div class="route-stat">
                  <span class="route-label">Est. Time:</span>
                  <span class="route-value">${this.route.duration} min</span>
                </div>
              </div>
            ` : ''}
          </div>

          <div class="tools-section">
            <h3>Tools</h3>
            <div class="tool-buttons">
              <button class="tool-btn measure-btn" title="Measure Distance">📏 Measure</button>
              <button class="tool-btn poi-btn ${this.showPOIs ? 'active' : ''}" title="Show Points of Interest">🏪 POIs</button>
              <button class="tool-btn share-btn" title="Share Location">📤 Share</button>
            </div>
            ${this.measureStart && this.measureEnd ? `
              <div class="measure-info">
                Distance: ${this.calculateDistance(this.measureStart, this.measureEnd).toFixed(1)} km
              </div>
            ` : ''}
          </div>

          <div class="poi-section">
            <h3>Nearby Places</h3>
            <div class="poi-list">
              ${this.showPOIs
                ? this.pois.slice(0, 6).map(poi => `
                  <div class="poi-item">
                    <span class="poi-icon">${poi.icon}</span>
                    <div class="poi-info">
                      <div class="poi-name">${poi.name}</div>
                      <div class="poi-meta">${poi.type}</div>
                    </div>
                  </div>
                `).join('')
                : '<div class="empty-state">Enable POIs to see what is nearby.</div>'
              }
            </div>
          </div>

          <div class="saved-places-section">
            <h3>Saved Places</h3>
            <div class="saved-places-list">
              ${this.savedPlaces.map((place, index) => `
                <div class="saved-place-item" data-index="${index}">
                  <span class="place-icon">${place.icon}</span>
                  <div class="place-info">
                    <span class="place-name">${place.name}</span>
                    <span class="place-country">${place.country || ''}</span>
                  </div>
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
            <div class="map-overlay">
              <div class="overlay-row">
                <div class="overlay-card">
                  <div class="overlay-label">View</div>
                  <div class="overlay-value">${this.viewMode}</div>
                </div>
                <div class="overlay-card">
                  <div class="overlay-label">Markers</div>
                  <div class="overlay-value">${this.markers.length}</div>
                </div>
                <div class="overlay-card">
                  <div class="overlay-label">Saved</div>
                  <div class="overlay-value">${this.savedPlaces.length}</div>
                </div>
              </div>
              <div class="overlay-hint">Click anywhere on the map to move the camera. Use “Add Marker” to drop a pin.</div>
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
          this.saveData();
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

    // Directions
    const getDirectionsBtn = container.querySelector('.get-directions-btn');
    if (getDirectionsBtn) {
      getDirectionsBtn.addEventListener('click', () => {
        const startInput = container.querySelector('.route-start-input');
        const endInput = container.querySelector('.route-end-input');
        const startQuery = startInput.value.trim().toLowerCase();
        const endQuery = endInput.value.trim().toLowerCase();

        if (startQuery && endQuery) {
          const start = this.savedPlaces.find(p => p.name.toLowerCase().includes(startQuery));
          const end = this.savedPlaces.find(p => p.name.toLowerCase().includes(endQuery));

          if (start && end) {
            this.routeStart = start;
            this.routeEnd = end;
            this.calculateRoute(start, end);
            this.refresh();
          } else {
            alert('One or both locations not found. Please use saved places.');
          }
        }
      });
    }

    const clearRouteBtn = container.querySelector('.clear-route-btn');
    if (clearRouteBtn) {
      clearRouteBtn.addEventListener('click', () => {
        this.routeStart = null;
        this.routeEnd = null;
        this.route = null;
        this.refresh();
      });
    }

    // Tools
    const measureBtn = container.querySelector('.measure-btn');
    if (measureBtn) {
      measureBtn.addEventListener('click', () => {
        if (!this.measureStart) {
          this.measureStart = { ...this.currentLocation };
          alert('First point set. Navigate to another location and click Measure again.');
        } else if (!this.measureEnd) {
          this.measureEnd = { ...this.currentLocation };
          this.refresh();
        } else {
          // Reset measurement
          this.measureStart = null;
          this.measureEnd = null;
          this.refresh();
        }
      });
    }

    const poiBtn = container.querySelector('.poi-btn');
    if (poiBtn) {
      poiBtn.addEventListener('click', () => {
        this.showPOIs = !this.showPOIs;
        this.refresh();
      });
    }

    const shareBtn = container.querySelector('.share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        const locationText = `${this.currentLocation.name}\nCoordinates: ${this.currentLocation.lat.toFixed(4)}°, ${this.currentLocation.lng.toFixed(4)}°`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(locationText)
            .then(() => alert('Location copied to clipboard!'))
            .catch(() => {
              prompt('Copy this location:', locationText);
            });
        } else {
          prompt('Copy this location:', locationText);
        }
      });
    }

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

    // Draw route if exists
    if (this.route && this.routeStart && this.routeEnd) {
      const startX = centerX + (this.routeStart.lng - this.currentLocation.lng) * 10000 / (20 - this.zoom);
      const startY = centerY + (this.currentLocation.lat - this.routeStart.lat) * 10000 / (20 - this.zoom);
      const endX = centerX + (this.routeEnd.lng - this.currentLocation.lng) * 10000 / (20 - this.zoom);
      const endY = centerY + (this.currentLocation.lat - this.routeEnd.lat) * 10000 / (20 - this.zoom);

      // Draw route line
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw start/end points
      ctx.fillStyle = '#27ae60';
      ctx.beginPath();
      ctx.arc(startX, startY, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(endX, endY, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw measurement line
    if (this.measureStart && this.measureEnd) {
      const startX = centerX + (this.measureStart.lng - this.currentLocation.lng) * 10000 / (20 - this.zoom);
      const startY = centerY + (this.currentLocation.lat - this.measureStart.lat) * 10000 / (20 - this.zoom);
      const endX = centerX + (this.measureEnd.lng - this.currentLocation.lng) * 10000 / (20 - this.zoom);
      const endY = centerY + (this.currentLocation.lat - this.measureEnd.lat) * 10000 / (20 - this.zoom);

      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(startX, startY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(endX, endY, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw POIs if enabled
    if (this.showPOIs) {
      this.pois.forEach(poi => {
        const dx = (poi.lng - this.currentLocation.lng) * 10000 / (20 - this.zoom);
        const dy = (this.currentLocation.lat - poi.lat) * 10000 / (20 - this.zoom);
        const poiX = centerX + dx;
        const poiY = centerY + dy;

        if (poiX >= 0 && poiX <= canvas.width && poiY >= 0 && poiY <= canvas.height) {
          // Draw POI marker
          ctx.fillStyle = '#9b59b6';
          ctx.beginPath();
          ctx.arc(poiX, poiY, 5, 0, Math.PI * 2);
          ctx.fill();

          // Draw POI label
          ctx.fillStyle = '#8e44ad';
          ctx.font = '9px sans-serif';
          ctx.fillText(poi.name, poiX + 8, poiY - 8);
        }
      });
    }

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

  calculateDistance(point1, point2) {
    // Haversine formula for calculating distance between two lat/lng points
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  calculateRoute(start, end) {
    const distance = this.calculateDistance(start, end);
    const avgSpeed = 50; // km/h average speed
    const duration = Math.round((distance / avgSpeed) * 60); // minutes

    this.route = {
      start,
      end,
      distance,
      duration,
      waypoints: [start, end] // Simple straight line for now
    };
  }

  generatePOIs() {
    // Generate random POIs near the current location
    const poiTypes = [
      { name: 'Restaurant', icon: '🍽️' },
      { name: 'Cafe', icon: '☕' },
      { name: 'Hotel', icon: '🏨' },
      { name: 'Gas Station', icon: '⛽' },
      { name: 'Shopping', icon: '🛍️' },
      { name: 'Park', icon: '🌳' },
      { name: 'Museum', icon: '🏛️' },
      { name: 'Hospital', icon: '🏥' }
    ];

    this.pois = [];
    for (let i = 0; i < 15; i++) {
      const type = poiTypes[Math.floor(Math.random() * poiTypes.length)];
      const offsetLat = (Math.random() - 0.5) * 0.05; // ~2.5km radius
      const offsetLng = (Math.random() - 0.5) * 0.05;

      this.pois.push({
        lat: this.currentLocation.lat + offsetLat,
        lng: this.currentLocation.lng + offsetLng,
        name: `${type.name} ${i + 1}`,
        icon: type.icon,
        type: type.name
      });
    }
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
