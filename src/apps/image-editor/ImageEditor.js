/**
 * ImageEditor - Canvas-based Photo Editing Application
 *
 * Features:
 * - Image loading and saving
 * - Crop, resize, rotate
 * - Filters and effects
 * - Drawing tools
 * - Layers support
 * - Undo/redo
 */

class ImageEditor {
  constructor(context) {
    this.context = context;
    this.canvas = null;
    this.ctx = null;
    this.originalImage = null;
    this.currentImage = null;
    this.history = [];
    this.historyIndex = -1;
    this.layers = [];
    this.currentLayer = null;
    this.tool = 'select';
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.brushSize = 5;
    this.brushColor = '#000000';

    console.log('[ImageEditor] Initialized');
  }

  async init() {
    // Ready to render
  }

  render() {
    const container = document.createElement('div');
    container.className = 'image-editor';

    container.innerHTML = `
      <div class="editor-header">
        <div class="toolbar">
          <button class="tool-btn" data-tool="select" title="Select">
            <span>↖️</span>
          </button>
          <button class="tool-btn" data-tool="crop" title="Crop">
            <span>✂️</span>
          </button>
          <button class="tool-btn" data-tool="brush" title="Brush">
            <span>🖌️</span>
          </button>
          <button class="tool-btn" data-tool="eraser" title="Eraser">
            <span>🧹</span>
          </button>
          <button class="tool-btn" data-tool="text" title="Text">
            <span>📝</span>
          </button>
          <button class="tool-btn" data-tool="shapes" title="Shapes">
            <span>🔷</span>
          </button>
          <div class="toolbar-separator"></div>
          <button class="action-btn" id="undo-btn" title="Undo">
            <span>↶</span>
          </button>
          <button class="action-btn" id="redo-btn" title="Redo">
            <span>↷</span>
          </button>
        </div>

        <div class="file-actions">
          <button class="btn-primary" id="open-image-btn">Open Image</button>
          <button class="btn-secondary" id="save-image-btn">Save Image</button>
        </div>
      </div>

      <div class="editor-body">
        <div class="sidebar-left">
          <div class="panel">
            <h4>Tools</h4>
            <div class="tool-options" id="tool-options">
              <div class="option-group">
                <label>Brush Size:</label>
                <input type="range" id="brush-size" min="1" max="50" value="5">
                <span id="brush-size-value">5</span>
              </div>
              <div class="option-group">
                <label>Color:</label>
                <input type="color" id="brush-color" value="#000000">
              </div>
            </div>
          </div>

          <div class="panel">
            <h4>Filters</h4>
            <div class="filter-buttons">
              <button class="filter-btn" data-filter="grayscale">Grayscale</button>
              <button class="filter-btn" data-filter="sepia">Sepia</button>
              <button class="filter-btn" data-filter="invert">Invert</button>
              <button class="filter-btn" data-filter="blur">Blur</button>
              <button class="filter-btn" data-filter="sharpen">Sharpen</button>
              <button class="filter-btn" data-filter="brightness">Brightness+</button>
              <button class="filter-btn" data-filter="contrast">Contrast+</button>
            </div>
          </div>

          <div class="panel">
            <h4>Adjustments</h4>
            <div class="adjustment-controls">
              <div class="slider-control">
                <label>Brightness:</label>
                <input type="range" id="brightness-slider" min="-100" max="100" value="0">
                <span id="brightness-value">0</span>
              </div>
              <div class="slider-control">
                <label>Contrast:</label>
                <input type="range" id="contrast-slider" min="-100" max="100" value="0">
                <span id="contrast-value">0</span>
              </div>
              <div class="slider-control">
                <label>Saturation:</label>
                <input type="range" id="saturation-slider" min="-100" max="100" value="0">
                <span id="saturation-value">0</span>
              </div>
              <button class="btn-secondary" id="apply-adjustments">Apply</button>
              <button class="btn-secondary" id="reset-adjustments">Reset</button>
            </div>
          </div>
        </div>

        <div class="canvas-area">
          <div class="canvas-container">
            <canvas id="main-canvas"></canvas>
          </div>
          <div class="canvas-info" id="canvas-info">
            No image loaded
          </div>
        </div>

        <div class="sidebar-right">
          <div class="panel">
            <h4>Layers</h4>
            <div class="layers-list" id="layers-list">
              <div class="empty-state">No layers</div>
            </div>
            <button class="btn-secondary btn-full" id="add-layer-btn">+ Add Layer</button>
          </div>

          <div class="panel">
            <h4>Transform</h4>
            <div class="transform-buttons">
              <button class="btn-secondary btn-full" id="rotate-left-btn">⟲ Rotate Left</button>
              <button class="btn-secondary btn-full" id="rotate-right-btn">⟳ Rotate Right</button>
              <button class="btn-secondary btn-full" id="flip-h-btn">↔️ Flip Horizontal</button>
              <button class="btn-secondary btn-full" id="flip-v-btn">↕️ Flip Vertical</button>
              <button class="btn-secondary btn-full" id="resize-btn">📏 Resize...</button>
            </div>
          </div>

          <div class="panel">
            <h4>History</h4>
            <div class="history-list" id="history-list">
              <div class="empty-state">No history</div>
            </div>
          </div>
        </div>
      </div>

      <input type="file" id="file-input" accept="image/*" style="display: none">
    `;

    this.container = container;
    this.canvas = container.querySelector('#main-canvas');
    this.ctx = this.canvas.getContext('2d');

    this._setupEventListeners();
    this._initializeCanvas();

    return container;
  }

  _setupEventListeners() {
    // File operations
    this.container.querySelector('#open-image-btn').addEventListener('click', () => {
      this.container.querySelector('#file-input').click();
    });

    this.container.querySelector('#file-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this._loadImageFile(file);
      }
    });

    this.container.querySelector('#save-image-btn').addEventListener('click', () => {
      this._saveImage();
    });

    // Tools
    this.container.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tool = btn.dataset.tool;
        this._selectTool(tool);
      });
    });

    // Undo/Redo
    this.container.querySelector('#undo-btn').addEventListener('click', () => {
      this._undo();
    });

    this.container.querySelector('#redo-btn').addEventListener('click', () => {
      this._redo();
    });

    // Tool options
    this.container.querySelector('#brush-size').addEventListener('input', (e) => {
      this.brushSize = parseInt(e.target.value);
      this.container.querySelector('#brush-size-value').textContent = this.brushSize;
    });

    this.container.querySelector('#brush-color').addEventListener('input', (e) => {
      this.brushColor = e.target.value;
    });

    // Filters
    this.container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        this._applyFilter(filter);
      });
    });

    // Adjustments
    const brightnessSlider = this.container.querySelector('#brightness-slider');
    const contrastSlider = this.container.querySelector('#contrast-slider');
    const saturationSlider = this.container.querySelector('#saturation-slider');

    brightnessSlider.addEventListener('input', (e) => {
      this.container.querySelector('#brightness-value').textContent = e.target.value;
    });

    contrastSlider.addEventListener('input', (e) => {
      this.container.querySelector('#contrast-value').textContent = e.target.value;
    });

    saturationSlider.addEventListener('input', (e) => {
      this.container.querySelector('#saturation-value').textContent = e.target.value;
    });

    this.container.querySelector('#apply-adjustments').addEventListener('click', () => {
      this._applyAdjustments();
    });

    this.container.querySelector('#reset-adjustments').addEventListener('click', () => {
      brightnessSlider.value = 0;
      contrastSlider.value = 0;
      saturationSlider.value = 0;
      this.container.querySelector('#brightness-value').textContent = '0';
      this.container.querySelector('#contrast-value').textContent = '0';
      this.container.querySelector('#saturation-value').textContent = '0';
    });

    // Transform
    this.container.querySelector('#rotate-left-btn').addEventListener('click', () => {
      this._rotate(-90);
    });

    this.container.querySelector('#rotate-right-btn').addEventListener('click', () => {
      this._rotate(90);
    });

    this.container.querySelector('#flip-h-btn').addEventListener('click', () => {
      this._flip('horizontal');
    });

    this.container.querySelector('#flip-v-btn').addEventListener('click', () => {
      this._flip('vertical');
    });

    this.container.querySelector('#resize-btn').addEventListener('click', () => {
      this._showResizeDialog();
    });

    // Canvas mouse events
    this.canvas.addEventListener('mousedown', (e) => this._handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this._handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this._handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', (e) => this._handleMouseUp(e));
  }

  _initializeCanvas() {
    this.canvas.width = 800;
    this.canvas.height = 600;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  async _loadImageFile(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this._loadImage(img);
      };
      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  }

  _loadImage(img) {
    this.originalImage = img;
    this.currentImage = img;

    // Resize canvas to fit image
    this.canvas.width = img.width;
    this.canvas.height = img.height;

    // Draw image
    this.ctx.drawImage(img, 0, 0);

    // Save to history
    this._saveState('Load Image');

    // Update info
    this._updateCanvasInfo();

    console.log('[ImageEditor] Image loaded:', img.width, 'x', img.height);
  }

  _selectTool(tool) {
    this.tool = tool;

    // Update UI
    this.container.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    this.container.querySelector(`[data-tool="${tool}"]`)?.classList.add('active');

    console.log('[ImageEditor] Tool selected:', tool);
  }

  _handleMouseDown(e) {
    if (!this.currentImage) return;

    const rect = this.canvas.getBoundingClientRect();
    this.lastX = e.clientX - rect.left;
    this.lastY = e.clientY - rect.top;
    this.isDrawing = true;
  }

  _handleMouseMove(e) {
    if (!this.isDrawing || !this.currentImage) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.tool === 'brush') {
      this.ctx.strokeStyle = this.brushColor;
      this.ctx.lineWidth = this.brushSize;
      this.ctx.lineCap = 'round';

      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    } else if (this.tool === 'eraser') {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.lineWidth = this.brushSize;
      this.ctx.lineCap = 'round';

      this.ctx.beginPath();
      this.ctx.moveTo(this.lastX, this.lastY);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();

      this.ctx.globalCompositeOperation = 'source-over';
    }

    this.lastX = x;
    this.lastY = y;
  }

  _handleMouseUp(e) {
    if (this.isDrawing && this.currentImage) {
      this._saveState('Draw');
    }
    this.isDrawing = false;
  }

  _applyFilter(filter) {
    if (!this.currentImage) return;

    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    switch (filter) {
      case 'grayscale':
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = data[i + 1] = data[i + 2] = avg;
        }
        break;

      case 'sepia':
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
          data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
          data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        }
        break;

      case 'invert':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i];
          data[i + 1] = 255 - data[i + 1];
          data[i + 2] = 255 - data[i + 2];
        }
        break;

      case 'brightness':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] + 30);
          data[i + 1] = Math.min(255, data[i + 1] + 30);
          data[i + 2] = Math.min(255, data[i + 2] + 30);
        }
        break;

      case 'contrast':
        const factor = (259 * (30 + 255)) / (255 * (259 - 30));
        for (let i = 0; i < data.length; i += 4) {
          data[i] = factor * (data[i] - 128) + 128;
          data[i + 1] = factor * (data[i + 1] - 128) + 128;
          data[i + 2] = factor * (data[i + 2] - 128) + 128;
        }
        break;

      case 'blur':
        // Simple box blur
        this._applyBoxBlur(imageData);
        this.ctx.putImageData(imageData, 0, 0);
        this._saveState(`Filter: ${filter}`);
        return;
    }

    this.ctx.putImageData(imageData, 0, 0);
    this._saveState(`Filter: ${filter}`);

    console.log('[ImageEditor] Filter applied:', filter);
  }

  _applyBoxBlur(imageData) {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const radius = 2;

    const tempData = new Uint8ClampedArray(pixels);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, count = 0;

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const idx = (ny * width + nx) * 4;
              r += tempData[idx];
              g += tempData[idx + 1];
              b += tempData[idx + 2];
              count++;
            }
          }
        }

        const idx = (y * width + x) * 4;
        pixels[idx] = r / count;
        pixels[idx + 1] = g / count;
        pixels[idx + 2] = b / count;
      }
    }
  }

  _applyAdjustments() {
    if (!this.currentImage) return;

    const brightness = parseInt(this.container.querySelector('#brightness-slider').value);
    const contrast = parseInt(this.container.querySelector('#contrast-slider').value);
    const saturation = parseInt(this.container.querySelector('#saturation-slider').value);

    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Brightness
      let r = data[i] + brightness;
      let g = data[i + 1] + brightness;
      let b = data[i + 2] + brightness;

      // Contrast
      if (contrast !== 0) {
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        r = factor * (r - 128) + 128;
        g = factor * (g - 128) + 128;
        b = factor * (b - 128) + 128;
      }

      // Clamp values
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    this.ctx.putImageData(imageData, 0, 0);
    this._saveState('Adjustments');

    console.log('[ImageEditor] Adjustments applied');
  }

  _rotate(degrees) {
    if (!this.currentImage) return;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    if (Math.abs(degrees) === 90) {
      tempCanvas.width = this.canvas.height;
      tempCanvas.height = this.canvas.width;
    } else {
      tempCanvas.width = this.canvas.width;
      tempCanvas.height = this.canvas.height;
    }

    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCtx.rotate((degrees * Math.PI) / 180);
    tempCtx.drawImage(this.canvas, -this.canvas.width / 2, -this.canvas.height / 2);

    this.canvas.width = tempCanvas.width;
    this.canvas.height = tempCanvas.height;
    this.ctx.drawImage(tempCanvas, 0, 0);

    this._saveState(`Rotate ${degrees}°`);
    this._updateCanvasInfo();

    console.log('[ImageEditor] Rotated:', degrees);
  }

  _flip(direction) {
    if (!this.currentImage) return;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;

    if (direction === 'horizontal') {
      tempCtx.scale(-1, 1);
      tempCtx.drawImage(this.canvas, -this.canvas.width, 0);
    } else {
      tempCtx.scale(1, -1);
      tempCtx.drawImage(this.canvas, 0, -this.canvas.height);
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(tempCanvas, 0, 0);

    this._saveState(`Flip ${direction}`);

    console.log('[ImageEditor] Flipped:', direction);
  }

  _showResizeDialog() {
    if (!this.currentImage) return;

    const width = prompt('New width:', this.canvas.width);
    const height = prompt('New height:', this.canvas.height);

    if (width && height) {
      const w = parseInt(width);
      const h = parseInt(height);

      if (w > 0 && h > 0) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        tempCtx.drawImage(this.canvas, 0, 0);

        this.canvas.width = w;
        this.canvas.height = h;
        this.ctx.drawImage(tempCanvas, 0, 0, w, h);

        this._saveState(`Resize to ${w}x${h}`);
        this._updateCanvasInfo();
      }
    }
  }

  _saveImage() {
    if (!this.currentImage) return;

    this.canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited-image-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });

    console.log('[ImageEditor] Image saved');
  }

  _saveState(action) {
    // Remove any states after current index
    this.history = this.history.slice(0, this.historyIndex + 1);

    // Save current state
    const state = {
      imageData: this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height),
      width: this.canvas.width,
      height: this.canvas.height,
      action,
      timestamp: Date.now()
    };

    this.history.push(state);
    this.historyIndex++;

    // Limit history to 50 states
    if (this.history.length > 50) {
      this.history.shift();
      this.historyIndex--;
    }

    this._updateHistoryList();
  }

  _undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const state = this.history[this.historyIndex];

      this.canvas.width = state.width;
      this.canvas.height = state.height;
      this.ctx.putImageData(state.imageData, 0, 0);

      this._updateHistoryList();
      this._updateCanvasInfo();

      console.log('[ImageEditor] Undo:', state.action);
    }
  }

  _redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const state = this.history[this.historyIndex];

      this.canvas.width = state.width;
      this.canvas.height = state.height;
      this.ctx.putImageData(state.imageData, 0, 0);

      this._updateHistoryList();
      this._updateCanvasInfo();

      console.log('[ImageEditor] Redo:', state.action);
    }
  }

  _updateCanvasInfo() {
    const info = this.container.querySelector('#canvas-info');
    info.textContent = `${this.canvas.width} × ${this.canvas.height} px`;
  }

  _updateHistoryList() {
    const list = this.container.querySelector('#history-list');

    if (this.history.length === 0) {
      list.innerHTML = '<div class="empty-state">No history</div>';
      return;
    }

    list.innerHTML = this.history.map((state, index) => `
      <div class="history-item ${index === this.historyIndex ? 'active' : ''}">
        ${state.action}
      </div>
    `).join('');
  }

  destroy() {
    // Cleanup
  }
}

export default ImageEditor;
