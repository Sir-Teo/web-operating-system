/**
 * ScreenCapture - Screen capture API for screenshots and screen recording
 */
export class ScreenCapture {
  constructor(kernel) {
    this.kernel = kernel;
    this.isRecording = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];
  }

  /**
   * Capture full screen screenshot
   */
  async captureFullScreen() {
    try {
      const canvas = document.createElement('canvas');
      const desktop = document.getElementById('desktop');

      // Set canvas dimensions
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const ctx = canvas.getContext('2d');

      // Capture desktop background
      ctx.fillStyle = window.getComputedStyle(desktop).background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw windows
      const windowsContainer = document.getElementById('windows-container');
      if (windowsContainer) {
        await this._drawElement(ctx, windowsContainer);
      }

      // Draw taskbar
      const taskbar = document.getElementById('taskbar');
      if (taskbar) {
        await this._drawElement(ctx, taskbar);
      }

      // Convert to blob and download
      const blob = await this._canvasToBlob(canvas);
      this._downloadScreenshot(blob);

      this._showNotification('Screenshot captured successfully!');
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      this._showNotification('Failed to capture screenshot', 'error');
    }
  }

  /**
   * Capture specific window screenshot
   */
  async captureWindow(windowElement) {
    try {
      const canvas = document.createElement('canvas');
      const rect = windowElement.getBoundingClientRect();

      canvas.width = rect.width;
      canvas.height = rect.height;

      const ctx = canvas.getContext('2d');
      await this._drawElement(ctx, windowElement);

      const blob = await this._canvasToBlob(canvas);
      this._downloadScreenshot(blob);

      this._showNotification('Window screenshot captured!');
    } catch (error) {
      console.error('Failed to capture window:', error);
      this._showNotification('Failed to capture window', 'error');
    }
  }

  /**
   * Capture selection screenshot
   */
  async captureSelection() {
    return new Promise((resolve, reject) => {
      // Create selection overlay
      const overlay = document.createElement('div');
      overlay.className = 'screenshot-selection-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.3);
        cursor: crosshair;
        z-index: 100000;
      `;

      const selectionBox = document.createElement('div');
      selectionBox.className = 'selection-box';
      selectionBox.style.cssText = `
        position: absolute;
        border: 2px dashed #4285f4;
        background: rgba(66, 133, 244, 0.1);
        pointer-events: none;
      `;

      overlay.appendChild(selectionBox);
      document.body.appendChild(overlay);

      let startX, startY, isSelecting = false;

      overlay.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        startY = e.clientY;
        isSelecting = true;

        selectionBox.style.left = `${startX}px`;
        selectionBox.style.top = `${startY}px`;
        selectionBox.style.width = '0';
        selectionBox.style.height = '0';
        selectionBox.style.display = 'block';
      });

      overlay.addEventListener('mousemove', (e) => {
        if (!isSelecting) return;

        const currentX = e.clientX;
        const currentY = e.clientY;

        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        selectionBox.style.left = `${left}px`;
        selectionBox.style.top = `${top}px`;
        selectionBox.style.width = `${width}px`;
        selectionBox.style.height = `${height}px`;
      });

      overlay.addEventListener('mouseup', async (e) => {
        if (!isSelecting) return;

        const currentX = e.clientX;
        const currentY = e.clientY;

        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        // Remove overlay
        document.body.removeChild(overlay);

        if (width > 10 && height > 10) {
          try {
            await this._captureArea(left, top, width, height);
            this._showNotification('Selection captured!');
            resolve();
          } catch (error) {
            this._showNotification('Failed to capture selection', 'error');
            reject(error);
          }
        } else {
          reject(new Error('Selection too small'));
        }
      });

      // ESC to cancel
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          document.body.removeChild(overlay);
          document.removeEventListener('keydown', escHandler);
          reject(new Error('Cancelled'));
        }
      };
      document.addEventListener('keydown', escHandler);
    });
  }

  /**
   * Capture specific area
   */
  async _captureArea(x, y, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    // Capture the specific area
    const desktop = document.getElementById('desktop');
    ctx.drawImage(desktop, x, y, width, height, 0, 0, width, height);

    const blob = await this._canvasToBlob(canvas);
    this._downloadScreenshot(blob);
  }

  /**
   * Start screen recording
   */
  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
        audio: false
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: 'video/webm'
        });
        this._downloadRecording(blob);
        this._showNotification('Recording saved!');
      };

      this.mediaRecorder.start();
      this.isRecording = true;

      this._showNotification('Screen recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      this._showNotification('Failed to start recording', 'error');
    }
  }

  /**
   * Stop screen recording
   */
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;

      // Stop all tracks
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }

  /**
   * Draw DOM element to canvas
   */
  async _drawElement(ctx, element) {
    // Simple implementation - in production, use html2canvas library
    const rect = element.getBoundingClientRect();

    ctx.save();
    ctx.translate(rect.left, rect.top);

    // Fill with background color
    const bgColor = window.getComputedStyle(element).backgroundColor;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.restore();
  }

  /**
   * Convert canvas to blob
   */
  _canvasToBlob(canvas) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }

  /**
   * Download screenshot
   */
  async _downloadScreenshot(blob) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot-${timestamp}.png`;

    // Save to filesystem
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      await this.kernel.fs.writeFile(
        `/home/Pictures/${filename}`,
        uint8Array
      );
    } catch (error) {
      console.error('Failed to save screenshot:', error);
    }

    // Also trigger browser download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Download recording
   */
  _downloadRecording(blob) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `recording-${timestamp}.webm`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Show notification
   */
  _showNotification(message, type = 'info') {
    // Use notification system if available
    if (this.kernel.notificationCenter) {
      this.kernel.notificationCenter.show(message, type);
    } else {
      console.log(message);
    }
  }
}

// Export singleton
let screenCaptureInstance = null;

export function initScreenCapture(kernel) {
  if (!screenCaptureInstance) {
    screenCaptureInstance = new ScreenCapture(kernel);
  }
  return screenCaptureInstance;
}

export function getScreenCapture() {
  return screenCaptureInstance;
}
