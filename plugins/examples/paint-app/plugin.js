/**
 * Paint Application Plugin
 * Full-featured drawing application
 */

class PaintApp {
  constructor(api) {
    this.api = api;
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.tempCanvas = null;
    this.tempCtx = null;

    // Drawing state
    this.isDrawing = false;
    this.currentTool = 'brush';
    this.currentColor = '#000000';
    this.backgroundColor = '#ffffff';
    this.lineWidth = 3;
    this.startX = 0;
    this.startY = 0;
    this.lastX = 0;
    this.lastY = 0;

    // History for undo/redo
    this.history = [];
    this.historyStep = -1;
    this.maxHistory = 50;
  }

  async activate() {
    this.createUI();
    this.clearCanvas();
    this.saveState();
    this.api.ui.notify('Paint activated! Start creating.');
  }

  async deactivate() {
    if (this.container) {
      this.container.remove();
    }
  }

  createUI() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #f0f0f0;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      display: flex;
      flex-direction: column;
    `;

    this.container.innerHTML = `
      <!-- Title Bar -->
      <div style="
        background: linear-gradient(to bottom, #fff, #e0e0e0);
        padding: 8px 16px;
        border-bottom: 1px solid #ccc;
        border-radius: 8px 8px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <h3 style="margin: 0; font-size: 14px; color: #333;">🎨 Paint</h3>
        <button id="close-paint" style="
          background: #ff5f57;
          border: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          cursor: pointer;
        "></button>
      </div>

      <!-- Toolbar -->
      <div style="
        background: #e8e8e8;
        padding: 8px;
        border-bottom: 1px solid #ccc;
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      ">
        <!-- Tools -->
        <div style="display: flex; gap: 2px; padding: 2px; background: white; border-radius: 4px;">
          <button class="tool-btn" data-tool="brush" title="Brush (B)">🖌️</button>
          <button class="tool-btn" data-tool="pencil" title="Pencil (P)">✏️</button>
          <button class="tool-btn" data-tool="eraser" title="Eraser (E)">🧹</button>
          <button class="tool-btn" data-tool="fill" title="Fill (F)">🪣</button>
        </div>

        <div style="display: flex; gap: 2px; padding: 2px; background: white; border-radius: 4px;">
          <button class="tool-btn" data-tool="line" title="Line (L)">📏</button>
          <button class="tool-btn" data-tool="rectangle" title="Rectangle (R)">▭</button>
          <button class="tool-btn" data-tool="circle" title="Circle (C)">⭕</button>
          <button class="tool-btn" data-tool="text" title="Text (T)">T</button>
        </div>

        <div style="display: flex; gap: 2px; padding: 2px; background: white; border-radius: 4px;">
          <button class="tool-btn" id="undo-btn" title="Undo (Ctrl+Z)">↶</button>
          <button class="tool-btn" id="redo-btn" title="Redo (Ctrl+Y)">↷</button>
          <button class="tool-btn" id="clear-btn" title="Clear All">🗑️</button>
        </div>

        <div style="display: flex; gap: 2px; padding: 2px; background: white; border-radius: 4px;">
          <button class="tool-btn" id="save-btn" title="Save">💾</button>
          <button class="tool-btn" id="download-btn" title="Download">⬇️</button>
        </div>

        <!-- Brush Size -->
        <div style="display: flex; gap: 4px; align-items: center; padding: 4px 8px; background: white; border-radius: 4px;">
          <label style="font-size: 11px; color: #666;">Size:</label>
          <input type="range" id="brush-size" min="1" max="50" value="3" style="width: 80px;">
          <span id="size-display" style="font-size: 11px; min-width: 25px;">3px</span>
        </div>

        <!-- Color Picker -->
        <div style="display: flex; gap: 4px; align-items: center; padding: 4px 8px; background: white; border-radius: 4px;">
          <label style="font-size: 11px; color: #666;">Color:</label>
          <input type="color" id="color-picker" value="#000000" style="width: 40px; height: 24px; border: none; cursor: pointer;">
        </div>
      </div>

      <!-- Color Palette -->
      <div style="
        background: #f8f8f8;
        padding: 8px;
        border-bottom: 1px solid #ccc;
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      " id="color-palette"></div>

      <!-- Canvas Area -->
      <div style="
        background: #c0c0c0;
        padding: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
      ">
        <div style="position: relative; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
          <canvas id="paint-canvas" width="800" height="600" style="
            display: block;
            cursor: crosshair;
            background: white;
          "></canvas>
          <canvas id="temp-canvas" width="800" height="600" style="
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: none;
          "></canvas>
        </div>
      </div>

      <!-- Status Bar -->
      <div style="
        background: #e8e8e8;
        padding: 4px 16px;
        border-top: 1px solid #ccc;
        border-radius: 0 0 8px 8px;
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #666;
      ">
        <span id="status-text">Ready</span>
        <span id="mouse-pos">X: 0, Y: 0</span>
      </div>
    `;

    document.body.appendChild(this.container);

    this.canvas = this.container.querySelector('#paint-canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    this.tempCanvas = this.container.querySelector('#temp-canvas');
    this.tempCtx = this.tempCanvas.getContext('2d');

    this.setupEventListeners();
    this.renderColorPalette();
    this.updateToolSelection();
  }

  setupEventListeners() {
    // Close button
    this.container.querySelector('#close-paint').addEventListener('click', () => {
      this.container.style.display = 'none';
    });

    // Tool buttons
    this.container.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentTool = btn.dataset.tool;
        this.updateToolSelection();
        this.updateStatus(`Tool: ${this.currentTool}`);
      });
    });

    // Undo/Redo
    this.container.querySelector('#undo-btn').addEventListener('click', () => this.undo());
    this.container.querySelector('#redo-btn').addEventListener('click', () => this.redo());
    this.container.querySelector('#clear-btn').addEventListener('click', () => this.clearCanvas());

    // Save/Download
    this.container.querySelector('#save-btn').addEventListener('click', () => this.savePainting());
    this.container.querySelector('#download-btn').addEventListener('click', () => this.downloadImage());

    // Brush size
    const sizeSlider = this.container.querySelector('#brush-size');
    const sizeDisplay = this.container.querySelector('#size-display');
    sizeSlider.addEventListener('input', (e) => {
      this.lineWidth = parseInt(e.target.value);
      sizeDisplay.textContent = `${this.lineWidth}px`;
    });

    // Color picker
    this.container.querySelector('#color-picker').addEventListener('input', (e) => {
      this.currentColor = e.target.value;
    });

    // Canvas events
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseout', () => this.stopDrawing());
    this.canvas.addEventListener('mousemove', (e) => this.updateMousePosition(e));

    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboard.bind(this));
  }

  renderColorPalette() {
    const palette = this.container.querySelector('#color-palette');
    const colors = [
      '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
      '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#C0C0C0', '#808080',
      '#FFA500', '#FFC0CB', '#A52A2A', '#DEB887', '#5F9EA0', '#7FFF00', '#D2691E', '#FF7F50',
      '#6495ED', '#DC143C', '#00CED1', '#FF1493', '#FFD700', '#ADFF2F', '#4B0082', '#F0E68C'
    ];

    colors.forEach(color => {
      const colorBox = document.createElement('div');
      colorBox.style.cssText = `
        width: 20px;
        height: 20px;
        background: ${color};
        border: 1px solid #999;
        cursor: pointer;
        border-radius: 2px;
      `;
      colorBox.addEventListener('click', () => {
        this.currentColor = color;
        this.container.querySelector('#color-picker').value = color;
      });
      palette.appendChild(colorBox);
    });
  }

  updateToolSelection() {
    this.container.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      if (btn.dataset.tool === this.currentTool) {
        btn.style.background = '#007acc';
        btn.style.color = 'white';
      } else {
        btn.style.background = '';
        btn.style.color = '';
      }
    });
  }

  startDrawing(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.startX = e.clientX - rect.left;
    this.startY = e.clientY - rect.top;
    this.lastX = this.startX;
    this.lastY = this.startY;
    this.isDrawing = true;

    if (this.currentTool === 'brush' || this.currentTool === 'pencil' || this.currentTool === 'eraser') {
      this.ctx.beginPath();
      this.ctx.moveTo(this.startX, this.startY);
    } else if (this.currentTool === 'fill') {
      this.floodFill(Math.floor(this.startX), Math.floor(this.startY));
      this.saveState();
      this.isDrawing = false;
    } else if (this.currentTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        this.ctx.font = `${this.lineWidth * 8}px Arial`;
        this.ctx.fillStyle = this.currentColor;
        this.ctx.fillText(text, this.startX, this.startY);
        this.saveState();
      }
      this.isDrawing = false;
    }
  }

  draw(e) {
    if (!this.isDrawing) return;

    const rect = this.canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    if (this.currentTool === 'brush' || this.currentTool === 'pencil') {
      this.ctx.strokeStyle = this.currentColor;
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.lineCap = this.currentTool === 'brush' ? 'round' : 'square';
      this.ctx.lineJoin = this.currentTool === 'brush' ? 'round' : 'miter';

      this.ctx.lineTo(currentX, currentY);
      this.ctx.stroke();

      this.lastX = currentX;
      this.lastY = currentY;
    } else if (this.currentTool === 'eraser') {
      this.ctx.clearRect(
        currentX - this.lineWidth / 2,
        currentY - this.lineWidth / 2,
        this.lineWidth,
        this.lineWidth
      );
    } else if (this.currentTool === 'line' || this.currentTool === 'rectangle' || this.currentTool === 'circle') {
      // Clear temp canvas
      this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);

      this.tempCtx.strokeStyle = this.currentColor;
      this.tempCtx.lineWidth = this.lineWidth;
      this.tempCtx.lineCap = 'round';

      if (this.currentTool === 'line') {
        this.tempCtx.beginPath();
        this.tempCtx.moveTo(this.startX, this.startY);
        this.tempCtx.lineTo(currentX, currentY);
        this.tempCtx.stroke();
      } else if (this.currentTool === 'rectangle') {
        this.tempCtx.strokeRect(
          this.startX,
          this.startY,
          currentX - this.startX,
          currentY - this.startY
        );
      } else if (this.currentTool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(currentX - this.startX, 2) + Math.pow(currentY - this.startY, 2)
        );
        this.tempCtx.beginPath();
        this.tempCtx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
        this.tempCtx.stroke();
      }
    }
  }

  stopDrawing() {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    // Transfer temp canvas to main canvas for shapes
    if (this.currentTool === 'line' || this.currentTool === 'rectangle' || this.currentTool === 'circle') {
      this.ctx.drawImage(this.tempCanvas, 0, 0);
      this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
    }

    this.saveState();
  }

  floodFill(x, y) {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const targetColor = this.getPixelColor(imageData, x, y);
    const fillColor = this.hexToRgb(this.currentColor);

    if (this.colorsMatch(targetColor, fillColor)) return;

    const stack = [[x, y]];
    const visited = new Set();

    while (stack.length > 0) {
      const [px, py] = stack.pop();
      const key = `${px},${py}`;

      if (visited.has(key)) continue;
      if (px < 0 || px >= this.canvas.width || py < 0 || py >= this.canvas.height) continue;

      const currentColor = this.getPixelColor(imageData, px, py);
      if (!this.colorsMatch(currentColor, targetColor)) continue;

      visited.add(key);
      this.setPixelColor(imageData, px, py, fillColor);

      stack.push([px + 1, py]);
      stack.push([px - 1, py]);
      stack.push([px, py + 1]);
      stack.push([px, py - 1]);
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  getPixelColor(imageData, x, y) {
    const index = (y * imageData.width + x) * 4;
    return [
      imageData.data[index],
      imageData.data[index + 1],
      imageData.data[index + 2],
      imageData.data[index + 3]
    ];
  }

  setPixelColor(imageData, x, y, color) {
    const index = (y * imageData.width + x) * 4;
    imageData.data[index] = color[0];
    imageData.data[index + 1] = color[1];
    imageData.data[index + 2] = color[2];
    imageData.data[index + 3] = 255;
  }

  colorsMatch(c1, c2) {
    return c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2] && c1[3] === c2[3];
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16),
      255
    ] : [0, 0, 0, 255];
  }

  clearCanvas() {
    if (confirm('Clear the entire canvas?')) {
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.saveState();
    }
  }

  saveState() {
    // Remove any states after current step
    this.history = this.history.slice(0, this.historyStep + 1);

    // Add current state
    this.history.push(this.canvas.toDataURL());
    this.historyStep++;

    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.historyStep--;
    }
  }

  undo() {
    if (this.historyStep > 0) {
      this.historyStep--;
      this.restoreState(this.history[this.historyStep]);
      this.updateStatus('Undo');
    }
  }

  redo() {
    if (this.historyStep < this.history.length - 1) {
      this.historyStep++;
      this.restoreState(this.history[this.historyStep]);
      this.updateStatus('Redo');
    }
  }

  restoreState(dataUrl) {
    const img = new Image();
    img.onload = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  }

  async savePainting() {
    try {
      const dataUrl = this.canvas.toDataURL();
      await this.api.storage.set('paint-saved', dataUrl);
      this.updateStatus('Saved!');
      this.api.ui.notify('Painting saved!');
    } catch (error) {
      this.updateStatus('Save failed');
      this.api.ui.notify('Failed to save painting', 'error');
    }
  }

  downloadImage() {
    const link = document.createElement('a');
    link.download = `painting-${Date.now()}.png`;
    link.href = this.canvas.toDataURL();
    link.click();
    this.updateStatus('Downloaded!');
  }

  updateMousePosition(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);
    this.container.querySelector('#mouse-pos').textContent = `X: ${x}, Y: ${y}`;
  }

  updateStatus(text) {
    this.container.querySelector('#status-text').textContent = text;
  }

  handleKeyboard(e) {
    if (!this.container || this.container.style.display === 'none') return;

    // Tool shortcuts
    const toolShortcuts = {
      'b': 'brush',
      'p': 'pencil',
      'e': 'eraser',
      'f': 'fill',
      'l': 'line',
      'r': 'rectangle',
      'c': 'circle',
      't': 'text'
    };

    if (toolShortcuts[e.key.toLowerCase()]) {
      this.currentTool = toolShortcuts[e.key.toLowerCase()];
      this.updateToolSelection();
      this.updateStatus(`Tool: ${this.currentTool}`);
    }

    // Undo/Redo
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      this.undo();
    }
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      this.redo();
    }
  }
}

module.exports = PaintApp;
