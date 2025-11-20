export default class Camera {
  constructor(context) {
    this.context = context;
    this.fs = context.fs;

    this.stream = null;
    this.isRecording = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.photos = [];
    this.videos = [];
    this.mode = 'photo'; // photo or video
    this.facingMode = 'user'; // user or environment
  }

  async init() {
    // Load saved photos/videos metadata
    try {
      const data = await this.fs.readFile('/home/camera-data.json');
      if (data) {
        const parsed = JSON.parse(data);
        this.photos = parsed.photos || [];
        this.videos = parsed.videos || [];
      }
    } catch (error) {
      // Use defaults
    }
  }

  async saveData() {
    try {
      await this.fs.writeFile('/home/camera-data.json', JSON.stringify({
        photos: this.photos,
        videos: this.videos
      }, null, 2));
    } catch (error) {
      console.error('Failed to save camera data:', error);
    }
  }

  render() {
    const container = document.createElement('div');
    container.className = 'camera-app';
    container.innerHTML = `
      <div class="camera-layout">
        <div class="camera-view">
          ${this.stream ? `
            <video class="camera-preview" autoplay playsinline></video>
            <div class="camera-overlay">
              <div class="mode-indicator">${this.mode === 'photo' ? '📷 Photo' : '🎥 Video'}</div>
              ${this.isRecording ? '<div class="recording-indicator">⏺ Recording...</div>' : ''}
            </div>
          ` : `
            <div class="camera-placeholder">
              <div class="placeholder-icon">📷</div>
              <div class="placeholder-text">Camera not started</div>
              <button class="start-camera-btn">Start Camera</button>
            </div>
          `}

          <div class="camera-controls">
            <button class="control-btn flip-btn" title="Flip Camera">🔄</button>
            <button class="control-btn mode-btn" title="Switch Mode">${this.mode === 'photo' ? '📷' : '🎥'}</button>
            ${this.stream ? `
              ${this.mode === 'photo' ? `
                <button class="capture-btn" title="Take Photo">📸</button>
              ` : `
                <button class="record-btn ${this.isRecording ? 'recording' : ''}" title="${this.isRecording ? 'Stop Recording' : 'Start Recording'}">
                  ${this.isRecording ? '⏹' : '⏺'}
                </button>
              `}
            ` : ''}
            <button class="control-btn gallery-btn" title="Gallery">🖼️</button>
          </div>
        </div>

        <div class="gallery-sidebar">
          <div class="gallery-tabs">
            <button class="gallery-tab ${this.mode === 'photo' ? 'active' : ''}" data-tab="photos">
              Photos (${this.photos.length})
            </button>
            <button class="gallery-tab ${this.mode === 'video' ? 'active' : ''}" data-tab="videos">
              Videos (${this.videos.length})
            </button>
          </div>

          <div class="gallery-content">
            ${this.mode === 'photo' ? this.renderPhotosGallery() : this.renderVideosGallery()}
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners(container);

    // Start video stream if already initialized
    if (this.stream) {
      setTimeout(() => {
        const video = container.querySelector('.camera-preview');
        if (video) {
          video.srcObject = this.stream;
        }
      }, 100);
    }

    return container;
  }

  renderPhotosGallery() {
    if (this.photos.length === 0) {
      return '<div class="empty-gallery">No photos yet</div>';
    }

    return `
      <div class="gallery-grid">
        ${this.photos.map((photo, index) => `
          <div class="gallery-item" data-index="${index}">
            <img src="${photo.url}" alt="Photo ${index + 1}">
            <div class="gallery-item-actions">
              <button class="download-btn" data-index="${index}" data-type="photo">💾</button>
              <button class="delete-btn" data-index="${index}" data-type="photo">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderVideosGallery() {
    if (this.videos.length === 0) {
      return '<div class="empty-gallery">No videos yet</div>';
    }

    return `
      <div class="gallery-grid">
        ${this.videos.map((video, index) => `
          <div class="gallery-item" data-index="${index}">
            <video src="${video.url}" controls></video>
            <div class="gallery-item-actions">
              <button class="download-btn" data-index="${index}" data-type="video">💾</button>
              <button class="delete-btn" data-index="${index}" data-type="video">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  attachEventListeners(container) {
    // Start camera
    const startCameraBtn = container.querySelector('.start-camera-btn');
    if (startCameraBtn) {
      startCameraBtn.addEventListener('click', () => this.startCamera());
    }

    // Flip camera
    const flipBtn = container.querySelector('.flip-btn');
    if (flipBtn) {
      flipBtn.addEventListener('click', () => this.flipCamera());
    }

    // Switch mode
    const modeBtn = container.querySelector('.mode-btn');
    if (modeBtn) {
      modeBtn.addEventListener('click', () => {
        this.mode = this.mode === 'photo' ? 'video' : 'photo';
        this.refresh();
      });
    }

    // Capture photo
    const captureBtn = container.querySelector('.capture-btn');
    if (captureBtn) {
      captureBtn.addEventListener('click', () => this.capturePhoto());
    }

    // Record video
    const recordBtn = container.querySelector('.record-btn');
    if (recordBtn) {
      recordBtn.addEventListener('click', () => {
        if (this.isRecording) {
          this.stopRecording();
        } else {
          this.startRecording();
        }
      });
    }

    // Gallery tabs
    container.querySelectorAll('.gallery-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.mode = tab.dataset.tab === 'photos' ? 'photo' : 'video';
        this.refresh();
      });
    });

    // Download buttons
    container.querySelectorAll('.download-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        const type = btn.dataset.type;
        this.downloadItem(index, type);
      });
    });

    // Delete buttons
    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        const type = btn.dataset.type;
        this.deleteItem(index, type);
      });
    });
  }

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: this.facingMode },
        audio: true
      });
      this.refresh();
    } catch (error) {
      alert('Could not access camera: ' + error.message);
    }
  }

  async flipCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: this.facingMode },
        audio: true
      });
      this.refresh();
    } catch (error) {
      alert('Could not flip camera: ' + error.message);
    }
  }

  capturePhoto() {
    const video = document.querySelector('.camera-preview');
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      this.photos.push({
        url: url,
        timestamp: new Date().toISOString(),
        blob: blob
      });
      this.saveData();
      this.refresh();

      // Flash effect
      const flash = document.createElement('div');
      flash.className = 'camera-flash';
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 200);
    }, 'image/jpeg', 0.95);
  }

  startRecording() {
    if (!this.stream) return;

    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      this.videos.push({
        url: url,
        timestamp: new Date().toISOString(),
        blob: blob
      });
      this.saveData();
      this.refresh();
    };

    this.mediaRecorder.start();
    this.isRecording = true;
    this.refresh();
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  downloadItem(index, type) {
    const item = type === 'photo' ? this.photos[index] : this.videos[index];
    if (!item) return;

    const a = document.createElement('a');
    a.href = item.url;
    a.download = `${type}-${Date.now()}.${type === 'photo' ? 'jpg' : 'webm'}`;
    a.click();
  }

  deleteItem(index, type) {
    if (confirm(`Delete this ${type}?`)) {
      if (type === 'photo') {
        URL.revokeObjectURL(this.photos[index].url);
        this.photos.splice(index, 1);
      } else {
        URL.revokeObjectURL(this.videos[index].url);
        this.videos.splice(index, 1);
      }
      this.saveData();
      this.refresh();
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

  async destroy() {
    // Stop camera stream when app is closed
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }
}
