import './Paint.css';

export default class Paint {
  constructor(context) {
    this.context = context;
    this.fs = context.fs;
    this.canvas = null;
    this.ctx = null;
    this.statusEl = null;
    this.coordsEl = null;
    this.colorInput = null;
    this.sizeInput = null;
    this.currentColor = '#2563eb';
    this.backgroundColor = '#ffffff';
    this.brushSize = 6;
    this.currentTool = 'brush';
    this.isDrawing = false;
    this.container = null;
    this.boundStop = null;
  }

  async init() {
    try {
      await this.fs.mkdir('/home/user/Pictures/Paint', { recursive: true });
    } catch (error) {
      console.warn('[Paint] Could not prepare picture directory:', error);
    }
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'paint-app';
    this.container.innerHTML = `
      <div class="paint-toolbar">
        <div class="paint-controls">
          <button class="paint-button paint-button-primary" data-tool="brush">🖌️ Brush</button>
          <button class="paint-button" data-tool="eraser">🧹 Eraser</button>
          <button class="paint-button" id="paint-clear">🗑️ Clear</button>
        </div>
        <div class="paint-controls paint-controls-grow">
          <label class="paint-label" for="paint-color">Color</label>
          <input type="color" id="paint-color" value="${this.currentColor}" aria-label="Brush color">
          <div class="paint-swatches"></div>
        </div>
        <div class="paint-controls">
          <label class="paint-label" for="paint-size">Size</label>
          <input type="range" id="paint-size" min="1" max="32" value="${this.brushSize}">
          <span id="paint-size-value">${this.brushSize}px</span>
        </div>
        <div class="paint-actions">
          <button class="paint-button" id="paint-save">💾 Save</button>
          <button class="paint-button" id="paint-download">⬇️ Download</button>
        </div>
      </div>
      <div class="paint-canvas-wrapper">
        <canvas class="paint-canvas" width="960" height="580"></canvas>
      </div>
      <div class="paint-status">
        <div class="paint-status-text" id="paint-status-text">Ready to draw</div>
        <div class="paint-coordinates" id="paint-coordinates">x: 0, y: 0</div>
      </div>
    `;

    this.canvas = this.container.querySelector('.paint-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.statusEl = this.container.querySelector('#paint-status-text');
    this.coordsEl = this.container.querySelector('#paint-coordinates');
    this.colorInput = this.container.querySelector('#paint-color');
    this.sizeInput = this.container.querySelector('#paint-size');

    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this._clearCanvas();

    this._bindToolbar();
    this._bindCanvas();
    this._renderSwatches();

    return this.container;
  }

  _bindToolbar() {
    this.container.querySelectorAll('[data-tool]').forEach((button) => {
      button.addEventListener('click', () => this._setTool(button.dataset.tool));
    });

    this.colorInput.addEventListener('input', (event) => {
      this.currentColor = event.target.value;
      this._setTool('brush');
      this._updateStatus(`Color set to ${this.currentColor}`);
    });

    this.sizeInput.addEventListener('input', (event) => {
      this.brushSize = Number(event.target.value);
      const sizeLabel = this.container.querySelector('#paint-size-value');
      sizeLabel.textContent = `${this.brushSize}px`;
      this._updateStatus(`Brush size ${this.brushSize}px`);
    });

    this.container.querySelector('#paint-clear').addEventListener('click', () => this._clearCanvas());
    this.container.querySelector('#paint-save').addEventListener('click', () => this._saveToFiles());
    this.container.querySelector('#paint-download').addEventListener('click', () => this._downloadImage());

    this._setTool(this.currentTool);
  }

  _bindCanvas() {
    const startDrawing = (event) => {
      event.preventDefault();
      this.isDrawing = true;
      const { x, y } = this._getPosition(event);
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this._strokeLine(x, y);
    };

    const draw = (event) => {
      if (!this.isDrawing) return;
      const { x, y } = this._getPosition(event);
      this._strokeLine(x, y);
    };

    this.boundStop = () => {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      this.ctx.beginPath();
      this.ctx.globalCompositeOperation = 'source-over';
    };

    this.canvas.addEventListener('pointerdown', startDrawing);
    this.canvas.addEventListener('pointermove', draw);
    window.addEventListener('pointerup', this.boundStop);
    window.addEventListener('pointercancel', this.boundStop);
  }

  _renderSwatches() {
    const swatches = this.container.querySelector('.paint-swatches');
    const palette = ['#2563eb', '#22c55e', '#f97316', '#ef4444', '#9333ea', '#0f172a', '#ffffff'];

    palette.forEach((color) => {
      const swatch = document.createElement('button');
      swatch.className = 'paint-swatch';
      swatch.style.background = color;
      swatch.title = color;
      swatch.addEventListener('click', () => {
        this.currentColor = color;
        this.colorInput.value = color;
        this._setTool('brush');
        this._updateStatus(`Color set to ${color}`);
      });
      swatches.appendChild(swatch);
    });
  }

  _setTool(tool) {
    this.currentTool = tool;
    this.container.querySelectorAll('[data-tool]').forEach((button) => {
      button.classList.toggle('paint-button-primary', button.dataset.tool === tool);
    });
    this._updateStatus(`${tool === 'eraser' ? 'Eraser' : 'Brush'} selected`);
  }

  _strokeLine(x, y) {
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.lineWidth = this.brushSize;
    this.ctx.strokeStyle = this.currentTool === 'eraser' ? this.backgroundColor : this.currentColor;
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this._updateCoordinates(x, y);
  }

  _getPosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  _clearCanvas() {
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.beginPath();
    this._updateStatus('Canvas cleared');
  }

  async _saveToFiles() {
    if (!this.fs) {
      this._updateStatus('File system unavailable');
      return;
    }

    try {
      const blob = await new Promise((resolve) => this.canvas.toBlob(resolve, 'image/png'));
      if (!blob) {
        throw new Error('Could not export image');
      }

      const buffer = await blob.arrayBuffer();
      const dir = '/home/user/Pictures/Paint';
      const fileName = `painting-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      const path = `${dir}/${fileName}`;

      await this.fs.mkdir(dir, { recursive: true });
      await this.fs.writeFile(path, buffer);
      this._updateStatus(`Saved to ${path}`);
    } catch (error) {
      console.error('[Paint] Failed to save image:', error);
      this._updateStatus('Could not save image');
    }
  }

  _downloadImage() {
    const link = document.createElement('a');
    link.href = this.canvas.toDataURL('image/png');
    link.download = 'painting.png';
    link.click();
    this._updateStatus('Downloaded PNG');
  }

  _updateStatus(message) {
    if (this.statusEl) {
      this.statusEl.textContent = message;
    }
  }

  _updateCoordinates(x, y) {
    if (this.coordsEl) {
      this.coordsEl.textContent = `x: ${Math.round(x)}, y: ${Math.round(y)}`;
    }
  }
}
