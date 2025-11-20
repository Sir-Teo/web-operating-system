/**
 * Screenshot Tool Application
 * Provides UI for taking screenshots
 */
export class ScreenshotApp {
  constructor(context) {
    this.context = context;
    this.container = null;
    this.screenCapture = null;
  }

  async init() {
    // Get screen capture instance
    const { getScreenCapture } = await import('../../system/ScreenCapture.js');
    this.screenCapture = getScreenCapture();
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'screenshot-app';

    this.container.innerHTML = `
      <div class="screenshot-content">
        <div class="app-header">
          <h2>📸 Screenshot Tool</h2>
          <p class="app-description">Capture screenshots and record your screen</p>
        </div>

        <div class="screenshot-modes">
          <div class="mode-card" id="capture-fullscreen">
            <div class="mode-icon">🖥️</div>
            <h3>Full Screen</h3>
            <p>Capture the entire screen</p>
            <button class="btn-primary">Capture</button>
            <div class="shortcut-hint">Ctrl+Shift+PrintScreen</div>
          </div>

          <div class="mode-card" id="capture-selection">
            <div class="mode-icon">✂️</div>
            <h3>Selection</h3>
            <p>Select an area to capture</p>
            <button class="btn-primary">Select Area</button>
            <div class="shortcut-hint">Ctrl+Shift+S</div>
          </div>

          <div class="mode-card" id="capture-window">
            <div class="mode-icon">🪟</div>
            <h3>Active Window</h3>
            <p>Capture the active window</p>
            <button class="btn-primary">Capture Window</button>
            <div class="shortcut-hint">Coming soon</div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="recording-section">
          <h3>Screen Recording</h3>
          <div class="recording-controls">
            <button class="btn-record" id="start-recording">
              <span class="icon">🎥</span>
              <span class="text">Start Recording</span>
            </button>
            <button class="btn-stop" id="stop-recording" style="display: none;">
              <span class="icon">⏹️</span>
              <span class="text">Stop Recording</span>
            </button>
          </div>
          <div class="recording-status" id="recording-status"></div>
        </div>

        <div class="divider"></div>

        <div class="screenshots-history">
          <h3>Recent Screenshots</h3>
          <div class="screenshots-list" id="screenshots-list">
            <p class="empty-state">No recent screenshots</p>
          </div>
        </div>

        <div class="app-footer">
          <div class="info-box">
            <strong>Save Location:</strong> /home/Pictures/
          </div>
          <div class="info-box">
            <strong>Format:</strong> PNG for images, WebM for videos
          </div>
        </div>
      </div>
    `;

    this._setupEventListeners();

    return this.container;
  }

  _setupEventListeners() {
    // Full screen capture
    this.container.querySelector('#capture-fullscreen button').addEventListener('click', async () => {
      await this.screenCapture.captureFullScreen();
      this._updateHistory();
    });

    // Selection capture
    this.container.querySelector('#capture-selection button').addEventListener('click', async () => {
      try {
        await this.screenCapture.captureSelection();
        this._updateHistory();
      } catch (error) {
        console.log('Selection cancelled');
      }
    });

    // Window capture
    this.container.querySelector('#capture-window button').addEventListener('click', () => {
      alert('Window capture coming soon! Use Full Screen or Selection for now.');
    });

    // Recording controls
    const startBtn = this.container.querySelector('#start-recording');
    const stopBtn = this.container.querySelector('#stop-recording');
    const statusDiv = this.container.querySelector('#recording-status');

    startBtn.addEventListener('click', async () => {
      await this.screenCapture.startRecording();
      startBtn.style.display = 'none';
      stopBtn.style.display = 'flex';
      statusDiv.innerHTML = '<div class="recording-indicator">🔴 Recording...</div>';
    });

    stopBtn.addEventListener('click', () => {
      this.screenCapture.stopRecording();
      stopBtn.style.display = 'none';
      startBtn.style.display = 'flex';
      statusDiv.innerHTML = '';
    });
  }

  async _updateHistory() {
    const listContainer = this.container.querySelector('#screenshots-list');

    try {
      // List screenshots from Pictures directory
      const files = await this.context.fs.readdir('/home/Pictures');
      const screenshots = files
        .filter(f => f.name.startsWith('screenshot-'))
        .slice(0, 5);

      if (screenshots.length === 0) {
        listContainer.innerHTML = '<p class="empty-state">No recent screenshots</p>';
        return;
      }

      const html = screenshots.map(file => `
        <div class="screenshot-item">
          <span class="file-icon">📷</span>
          <span class="file-name">${file.name}</span>
        </div>
      `).join('');

      listContainer.innerHTML = html;
    } catch (error) {
      listContainer.innerHTML = '<p class="empty-state">No recent screenshots</p>';
    }
  }

  destroy() {
    // Cleanup if needed
  }
}

export default ScreenshotApp;
