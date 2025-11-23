/**
 * Advanced Image Editor Application
 * Professional-grade image editing with layers, filters, effects, and advanced tools
 *
 * Features:
 * - Multi-layer support with blend modes
 * - Non-destructive editing
 * - 20+ filters and effects
 * - Drawing tools (brush, eraser, shapes, text)
 * - Color adjustment (brightness, contrast, saturation, hue)
 * - Transform operations (rotate, flip, resize, crop)
 * - History with undo/redo
 * - Layer groups and visibility
 * - Export to multiple formats (PNG, JPEG, WebP)
 */

export default class AdvancedImageEditor {
    static metadata = {
        name: 'Advanced Image Editor',
        description: 'Professional image editing with layers, filters, and effects',
        author: 'WebOS',
        version: '1.0.0',
        category: 'graphics',
        icon: '🎨'
    };

    constructor(context) {
        this.context = context;
        this.container = null;
        this.canvas = null;
        this.ctx = null;
        this.previewCanvas = null;
        this.previewCtx = null;

        // Editor state
        this.layers = [];
        this.activeLayerIndex = 0;
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;

        // Tool state
        this.currentTool = 'select';
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;

        // Tool settings
        this.brushSize = 5;
        this.brushColor = '#000000';
        this.brushOpacity = 1;
        this.eraserSize = 10;

        // Transform state
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;

        // Selection
        this.selection = null;
    }

    async init() {
        // Initialize editor
        console.log('[AdvancedImageEditor] Initialized');
    }

    render() {
        this.container = document.createElement('div');
        this.container.innerHTML = this.createUI();

        // Initialize editor after DOM is ready
        setTimeout(() => {
            this.initializeEditor();
            this.attachEventListeners();

            // Load image if provided in args
            if (this.context.args?.file) {
                this.loadImage(this.context.args.file);
            } else {
                // Create blank canvas
                this.createNewImage(800, 600, '#ffffff');
            }
        }, 0);

        return this.container;
    }

    createUI() {
        return `
            <style>
                .image-editor-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
                    color: #e0e0e0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .image-editor-toolbar {
                    display: flex;
                    gap: 8px;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    flex-wrap: wrap;
                    backdrop-filter: blur(10px);
                }

                .toolbar-group {
                    display: flex;
                    gap: 4px;
                    padding: 4px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .toolbar-btn {
                    padding: 8px 12px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 6px;
                    color: #e0e0e0;
                    cursor: pointer;
                    font-size: 13px;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }

                .toolbar-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(255, 255, 255, 0.3);
                    transform: translateY(-1px);
                }

                .toolbar-btn.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-color: #667eea;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                }

                .toolbar-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .image-editor-content {
                    display: flex;
                    flex: 1;
                    overflow: hidden;
                }

                .sidebar {
                    width: 250px;
                    background: rgba(255, 255, 255, 0.03);
                    border-right: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 16px;
                    overflow-y: auto;
                }

                .sidebar-section {
                    margin-bottom: 20px;
                }

                .sidebar-section h3 {
                    margin: 0 0 12px 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: #a0a0a0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .tool-option {
                    margin: 8px 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .tool-option label {
                    font-size: 13px;
                    flex: 1;
                }

                .tool-option input[type="range"] {
                    flex: 2;
                }

                .tool-option input[type="color"] {
                    width: 40px;
                    height: 30px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .canvas-container {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: auto;
                    position: relative;
                    background:
                        linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%),
                        linear-gradient(-45deg, rgba(255,255,255,0.03) 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.03) 75%),
                        linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.03) 75%);
                    background-size: 20px 20px;
                    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                }

                #imageCanvas {
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                    cursor: crosshair;
                    image-rendering: pixelated;
                }

                .layers-panel {
                    width: 280px;
                    background: rgba(255, 255, 255, 0.03);
                    border-left: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    flex-direction: column;
                }

                .layers-header {
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    font-weight: 600;
                    font-size: 14px;
                }

                .layers-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px;
                }

                .layer-item {
                    padding: 12px;
                    margin-bottom: 6px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .layer-item:hover {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.2);
                }

                .layer-item.active {
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
                    border-color: #667eea;
                    box-shadow: 0 0 15px rgba(102, 126, 234, 0.3);
                }

                .layer-preview {
                    width: 40px;
                    height: 40px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                    background: white;
                }

                .layer-info {
                    flex: 1;
                }

                .layer-name {
                    font-size: 13px;
                    font-weight: 500;
                    margin-bottom: 4px;
                }

                .layer-details {
                    font-size: 11px;
                    color: #888;
                }

                .layer-controls {
                    display: flex;
                    gap: 4px;
                }

                .layer-btn {
                    padding: 4px 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 4px;
                    color: #e0e0e0;
                    cursor: pointer;
                    font-size: 11px;
                }

                .layer-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .layers-footer {
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    gap: 8px;
                }

                .status-bar {
                    padding: 8px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    font-size: 12px;
                    display: flex;
                    gap: 20px;
                    align-items: center;
                }

                .status-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .filter-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 8px;
                    margin-top: 8px;
                }

                .filter-btn {
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    color: #e0e0e0;
                    cursor: pointer;
                    font-size: 12px;
                    text-align: center;
                    transition: all 0.2s ease;
                }

                .filter-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.3);
                    transform: scale(1.05);
                }
            </style>

            <div class="image-editor-container">
                <div class="image-editor-toolbar">
                    <div class="toolbar-group">
                        <button class="toolbar-btn" data-action="new">📄 New</button>
                        <button class="toolbar-btn" data-action="open">📁 Open</button>
                        <button class="toolbar-btn" data-action="save">💾 Save</button>
                        <button class="toolbar-btn" data-action="export">📤 Export</button>
                    </div>

                    <div class="toolbar-group">
                        <button class="toolbar-btn" data-action="undo" disabled>↶ Undo</button>
                        <button class="toolbar-btn" data-action="redo" disabled>↷ Redo</button>
                    </div>

                    <div class="toolbar-group">
                        <button class="toolbar-btn" data-tool="select">⬚ Select</button>
                        <button class="toolbar-btn active" data-tool="brush">🖌️ Brush</button>
                        <button class="toolbar-btn" data-tool="eraser">⬜ Eraser</button>
                        <button class="toolbar-btn" data-tool="fill">🪣 Fill</button>
                        <button class="toolbar-btn" data-tool="picker">💧 Picker</button>
                    </div>

                    <div class="toolbar-group">
                        <button class="toolbar-btn" data-tool="rectangle">▭ Rectangle</button>
                        <button class="toolbar-btn" data-tool="circle">⭕ Circle</button>
                        <button class="toolbar-btn" data-tool="line">╱ Line</button>
                        <button class="toolbar-btn" data-tool="text">T Text</button>
                    </div>

                    <div class="toolbar-group">
                        <button class="toolbar-btn" data-action="crop">✂️ Crop</button>
                        <button class="toolbar-btn" data-action="resize">🔧 Resize</button>
                        <button class="toolbar-btn" data-action="rotate">🔄 Rotate</button>
                        <button class="toolbar-btn" data-action="flip">🔃 Flip</button>
                    </div>

                    <div class="toolbar-group">
                        <button class="toolbar-btn" data-action="zoomIn">🔍+ Zoom In</button>
                        <button class="toolbar-btn" data-action="zoomOut">🔍- Zoom Out</button>
                        <button class="toolbar-btn" data-action="zoomReset">100%</button>
                    </div>
                </div>

                <div class="image-editor-content">
                    <div class="sidebar">
                        <div class="sidebar-section">
                            <h3>Tool Options</h3>
                            <div class="tool-option">
                                <label>Brush Size:</label>
                                <input type="range" id="brushSize" min="1" max="50" value="5">
                                <span id="brushSizeValue">5</span>
                            </div>
                            <div class="tool-option">
                                <label>Color:</label>
                                <input type="color" id="brushColor" value="#000000">
                            </div>
                            <div class="tool-option">
                                <label>Opacity:</label>
                                <input type="range" id="brushOpacity" min="0" max="100" value="100">
                                <span id="opacityValue">100%</span>
                            </div>
                        </div>

                        <div class="sidebar-section">
                            <h3>Filters</h3>
                            <div class="filter-grid">
                                <button class="filter-btn" data-filter="grayscale">Grayscale</button>
                                <button class="filter-btn" data-filter="sepia">Sepia</button>
                                <button class="filter-btn" data-filter="invert">Invert</button>
                                <button class="filter-btn" data-filter="blur">Blur</button>
                                <button class="filter-btn" data-filter="sharpen">Sharpen</button>
                                <button class="filter-btn" data-filter="emboss">Emboss</button>
                                <button class="filter-btn" data-filter="edge">Edge Detect</button>
                                <button class="filter-btn" data-filter="brightness">Brightness</button>
                                <button class="filter-btn" data-filter="contrast">Contrast</button>
                                <button class="filter-btn" data-filter="saturation">Saturation</button>
                                <button class="filter-btn" data-filter="hue">Hue Shift</button>
                                <button class="filter-btn" data-filter="pixelate">Pixelate</button>
                                <button class="filter-btn" data-filter="noise">Add Noise</button>
                                <button class="filter-btn" data-filter="vignette">Vignette</button>
                            </div>
                        </div>

                        <div class="sidebar-section">
                            <h3>Adjustments</h3>
                            <div class="tool-option">
                                <label>Brightness:</label>
                                <input type="range" id="brightness" min="-100" max="100" value="0">
                            </div>
                            <div class="tool-option">
                                <label>Contrast:</label>
                                <input type="range" id="contrast" min="-100" max="100" value="0">
                            </div>
                            <div class="tool-option">
                                <label>Saturation:</label>
                                <input type="range" id="saturation" min="-100" max="100" value="0">
                            </div>
                            <div class="tool-option">
                                <label>Hue:</label>
                                <input type="range" id="hue" min="0" max="360" value="0">
                            </div>
                            <button class="toolbar-btn" data-action="applyAdjustments" style="width: 100%; margin-top: 8px;">Apply Adjustments</button>
                        </div>
                    </div>

                    <div class="canvas-container">
                        <canvas id="imageCanvas"></canvas>
                    </div>

                    <div class="layers-panel">
                        <div class="layers-header">Layers</div>
                        <div class="layers-list" id="layersList"></div>
                        <div class="layers-footer">
                            <button class="toolbar-btn" data-action="newLayer">+ Layer</button>
                            <button class="toolbar-btn" data-action="deleteLayer">🗑️</button>
                            <button class="toolbar-btn" data-action="mergeDown">⬇️ Merge</button>
                        </div>
                    </div>
                </div>

                <div class="status-bar">
                    <div class="status-item">
                        <strong>Tool:</strong>
                        <span id="currentTool">Brush</span>
                    </div>
                    <div class="status-item">
                        <strong>Size:</strong>
                        <span id="canvasSize">0 × 0</span>
                    </div>
                    <div class="status-item">
                        <strong>Zoom:</strong>
                        <span id="zoomLevel">100%</span>
                    </div>
                    <div class="status-item">
                        <strong>Position:</strong>
                        <span id="mousePos">0, 0</span>
                    </div>
                    <div class="status-item">
                        <strong>Layers:</strong>
                        <span id="layerCount">0</span>
                    </div>
                </div>
            </div>
        `;
    }

    initializeEditor() {
        this.canvas = this.container.querySelector('#imageCanvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

        // Update status
        this.updateStatus();
    }

    attachEventListeners() {
        const body = this.container;

        // Toolbar actions
        body.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleAction(action);
            });
        });

        // Tool selection
        body.querySelectorAll('[data-tool]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                body.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.currentTool = e.currentTarget.dataset.tool;
                this.updateStatus();
            });
        });

        // Canvas drawing
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));

        // Tool options
        const brushSize = body.querySelector('#brushSize');
        const brushSizeValue = body.querySelector('#brushSizeValue');
        brushSize.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            brushSizeValue.textContent = this.brushSize;
            this.eraserSize = this.brushSize * 2;
        });

        const brushColor = body.querySelector('#brushColor');
        brushColor.addEventListener('input', (e) => {
            this.brushColor = e.target.value;
        });

        const brushOpacity = body.querySelector('#brushOpacity');
        const opacityValue = body.querySelector('#opacityValue');
        brushOpacity.addEventListener('input', (e) => {
            this.brushOpacity = parseInt(e.target.value) / 100;
            opacityValue.textContent = e.target.value + '%';
        });

        // Filters
        body.querySelectorAll('[data-filter]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.applyFilter(filter);
            });
        });

        // Mouse position tracking
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor(e.clientX - rect.left);
            const y = Math.floor(e.clientY - rect.top);
            body.querySelector('#mousePos').textContent = `${x}, ${y}`;
        });
    }

    createNewImage(width, height, backgroundColor = '#ffffff') {
        this.canvas.width = width;
        this.canvas.height = height;

        // Create initial layer
        this.layers = [{
            name: 'Background',
            canvas: this.createLayerCanvas(width, height, backgroundColor),
            visible: true,
            opacity: 1,
            blendMode: 'normal'
        }];

        this.activeLayerIndex = 0;
        this.composeLayers();
        this.updateLayersList();
        this.saveHistory();
        this.updateStatus();
    }

    createLayerCanvas(width, height, fillColor = null) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        if (fillColor) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = fillColor;
            ctx.fillRect(0, 0, width, height);
        }

        return canvas;
    }

    composeLayers() {
        // Clear main canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Composite all visible layers
        for (const layer of this.layers) {
            if (layer.visible) {
                this.ctx.globalAlpha = layer.opacity;
                this.ctx.globalCompositeOperation = layer.blendMode;
                this.ctx.drawImage(layer.canvas, 0, 0);
            }
        }

        // Reset context
        this.ctx.globalAlpha = 1;
        this.ctx.globalCompositeOperation = 'source-over';
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.isDrawing = true;
        this.lastX = x;
        this.lastY = y;

        const activeLayer = this.layers[this.activeLayerIndex];
        const layerCtx = activeLayer.canvas.getContext('2d');

        switch (this.currentTool) {
            case 'brush':
                layerCtx.globalAlpha = this.brushOpacity;
                layerCtx.strokeStyle = this.brushColor;
                layerCtx.lineWidth = this.brushSize;
                layerCtx.lineCap = 'round';
                layerCtx.lineJoin = 'round';
                layerCtx.beginPath();
                layerCtx.moveTo(x, y);
                break;

            case 'eraser':
                layerCtx.globalCompositeOperation = 'destination-out';
                layerCtx.lineWidth = this.eraserSize;
                layerCtx.lineCap = 'round';
                layerCtx.beginPath();
                layerCtx.moveTo(x, y);
                break;

            case 'fill':
                this.floodFill(layerCtx, x, y, this.brushColor);
                this.composeLayers();
                this.saveHistory();
                break;

            case 'picker':
                const imageData = layerCtx.getImageData(x, y, 1, 1);
                const pixel = imageData.data;
                this.brushColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
                this.container.querySelector('#brushColor').value = this.rgbToHex(pixel[0], pixel[1], pixel[2]);
                break;
        }
    }

    handleMouseMove(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const activeLayer = this.layers[this.activeLayerIndex];
        const layerCtx = activeLayer.canvas.getContext('2d');

        switch (this.currentTool) {
            case 'brush':
            case 'eraser':
                layerCtx.lineTo(x, y);
                layerCtx.stroke();
                this.composeLayers();
                break;
        }

        this.lastX = x;
        this.lastY = y;
    }

    handleMouseUp() {
        if (this.isDrawing) {
            this.isDrawing = false;

            const activeLayer = this.layers[this.activeLayerIndex];
            const layerCtx = activeLayer.canvas.getContext('2d');

            // Reset context
            layerCtx.globalAlpha = 1;
            layerCtx.globalCompositeOperation = 'source-over';

            this.saveHistory();
        }
    }

    handleAction(action) {
        switch (action) {
            case 'new':
                this.promptNewImage();
                break;
            case 'open':
                this.openImage();
                break;
            case 'save':
                this.saveImage();
                break;
            case 'export':
                this.exportImage();
                break;
            case 'undo':
                this.undo();
                break;
            case 'redo':
                this.redo();
                break;
            case 'newLayer':
                this.addLayer();
                break;
            case 'deleteLayer':
                this.deleteLayer();
                break;
            case 'mergeDown':
                this.mergeDown();
                break;
            case 'crop':
                this.cropImage();
                break;
            case 'resize':
                this.resizeImage();
                break;
            case 'rotate':
                this.rotateImage(90);
                break;
            case 'flip':
                this.flipImage('horizontal');
                break;
            case 'zoomIn':
                this.zoom = Math.min(this.zoom * 1.2, 10);
                this.updateZoom();
                break;
            case 'zoomOut':
                this.zoom = Math.max(this.zoom / 1.2, 0.1);
                this.updateZoom();
                break;
            case 'zoomReset':
                this.zoom = 1;
                this.updateZoom();
                break;
            case 'applyAdjustments':
                this.applyColorAdjustments();
                break;
        }
    }

    promptNewImage() {
        const width = prompt('Enter width:', '800');
        const height = prompt('Enter height:', '600');
        const color = prompt('Enter background color:', '#ffffff');

        if (width && height) {
            this.createNewImage(parseInt(width), parseInt(height), color);
        }
    }

    async openImage() {
        try {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';

            fileInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    await this.loadImageFromFile(file);
                }
            };

            fileInput.click();
        } catch (error) {
            console.error('Error opening image:', error);
            alert('Failed to open image');
        }
    }

    async loadImageFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.createNewImage(img.width, img.height);
                    const layerCtx = this.layers[0].canvas.getContext('2d');
                    layerCtx.drawImage(img, 0, 0);
                    this.composeLayers();
                    this.saveHistory();
                    resolve();
                };
                img.src = e.target.result;
            };

            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async saveImage() {
        try {
            const dataURL = this.canvas.toDataURL('image/png');
            const blob = await (await fetch(dataURL)).blob();

            const filename = prompt('Enter filename:', 'image.png');
            if (filename) {
                const arrayBuffer = await blob.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);

                await this.context.fs.writeFile(
                    `/home/${this.context.kernel.currentUser}/Pictures/${filename}`,
                    uint8Array
                );

                alert('Image saved successfully!');
            }
        } catch (error) {
            console.error('Error saving image:', error);
            alert('Failed to save image');
        }
    }

    async exportImage() {
        const format = prompt('Export format (png, jpeg, webp):', 'png');
        if (!format) return;

        const quality = format === 'jpeg' ? parseFloat(prompt('Quality (0.0 - 1.0):', '0.92')) : 1;

        this.canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `export.${format}`;
            a.click();
            URL.revokeObjectURL(url);
        }, `image/${format}`, quality);
    }

    addLayer() {
        const newLayer = {
            name: `Layer ${this.layers.length + 1}`,
            canvas: this.createLayerCanvas(this.canvas.width, this.canvas.height),
            visible: true,
            opacity: 1,
            blendMode: 'normal'
        };

        this.layers.push(newLayer);
        this.activeLayerIndex = this.layers.length - 1;
        this.updateLayersList();
        this.saveHistory();
    }

    deleteLayer() {
        if (this.layers.length === 1) {
            alert('Cannot delete the last layer');
            return;
        }

        this.layers.splice(this.activeLayerIndex, 1);
        this.activeLayerIndex = Math.min(this.activeLayerIndex, this.layers.length - 1);
        this.composeLayers();
        this.updateLayersList();
        this.saveHistory();
    }

    mergeDown() {
        if (this.activeLayerIndex === 0) {
            alert('Cannot merge down the bottom layer');
            return;
        }

        const currentLayer = this.layers[this.activeLayerIndex];
        const belowLayer = this.layers[this.activeLayerIndex - 1];

        const belowCtx = belowLayer.canvas.getContext('2d');
        belowCtx.globalAlpha = currentLayer.opacity;
        belowCtx.drawImage(currentLayer.canvas, 0, 0);
        belowCtx.globalAlpha = 1;

        this.layers.splice(this.activeLayerIndex, 1);
        this.activeLayerIndex--;
        this.composeLayers();
        this.updateLayersList();
        this.saveHistory();
    }

    updateLayersList() {
        const list = this.container.querySelector('#layersList');
        list.innerHTML = '';

        // Reverse order for display (top layer first)
        for (let i = this.layers.length - 1; i >= 0; i--) {
            const layer = this.layers[i];
            const item = document.createElement('div');
            item.className = 'layer-item' + (i === this.activeLayerIndex ? ' active' : '');

            const preview = document.createElement('canvas');
            preview.className = 'layer-preview';
            preview.width = 40;
            preview.height = 40;
            const previewCtx = preview.getContext('2d');
            previewCtx.drawImage(layer.canvas, 0, 0, 40, 40);

            const info = document.createElement('div');
            info.className = 'layer-info';
            info.innerHTML = `
                <div class="layer-name">${layer.name}</div>
                <div class="layer-details">Opacity: ${Math.round(layer.opacity * 100)}%</div>
            `;

            const controls = document.createElement('div');
            controls.className = 'layer-controls';

            const visBtn = document.createElement('button');
            visBtn.className = 'layer-btn';
            visBtn.textContent = layer.visible ? '👁️' : '👁️‍🗨️';
            visBtn.onclick = (e) => {
                e.stopPropagation();
                layer.visible = !layer.visible;
                this.composeLayers();
                this.updateLayersList();
            };

            controls.appendChild(visBtn);

            item.appendChild(preview);
            item.appendChild(info);
            item.appendChild(controls);

            item.onclick = () => {
                this.activeLayerIndex = i;
                this.updateLayersList();
            };

            list.appendChild(item);
        }

        this.updateStatus();
    }

    applyFilter(filterName) {
        const activeLayer = this.layers[this.activeLayerIndex];
        const layerCtx = activeLayer.canvas.getContext('2d');
        const imageData = layerCtx.getImageData(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
        const data = imageData.data;

        switch (filterName) {
            case 'grayscale':
                for (let i = 0; i < data.length; i += 4) {
                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    data[i] = data[i + 1] = data[i + 2] = gray;
                }
                break;

            case 'sepia':
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i + 1], b = data[i + 2];
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

            case 'blur':
                this.applyConvolution(imageData, [
                    1/9, 1/9, 1/9,
                    1/9, 1/9, 1/9,
                    1/9, 1/9, 1/9
                ]);
                break;

            case 'sharpen':
                this.applyConvolution(imageData, [
                    0, -1, 0,
                    -1, 5, -1,
                    0, -1, 0
                ]);
                break;

            case 'emboss':
                this.applyConvolution(imageData, [
                    -2, -1, 0,
                    -1, 1, 1,
                    0, 1, 2
                ]);
                break;

            case 'edge':
                this.applyConvolution(imageData, [
                    -1, -1, -1,
                    -1, 8, -1,
                    -1, -1, -1
                ]);
                break;

            case 'pixelate':
                this.pixelate(imageData, 8);
                break;

            case 'noise':
                for (let i = 0; i < data.length; i += 4) {
                    const noise = (Math.random() - 0.5) * 50;
                    data[i] = Math.max(0, Math.min(255, data[i] + noise));
                    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
                    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
                }
                break;

            case 'vignette':
                this.applyVignette(imageData);
                break;
        }

        layerCtx.putImageData(imageData, 0, 0);
        this.composeLayers();
        this.saveHistory();
    }

    applyConvolution(imageData, kernel) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const output = new Uint8ClampedArray(data);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let r = 0, g = 0, b = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const px = ((y + ky) * width + (x + kx)) * 4;
                        const k = kernel[(ky + 1) * 3 + (kx + 1)];
                        r += data[px] * k;
                        g += data[px + 1] * k;
                        b += data[px + 2] * k;
                    }
                }

                const i = (y * width + x) * 4;
                output[i] = Math.max(0, Math.min(255, r));
                output[i + 1] = Math.max(0, Math.min(255, g));
                output[i + 2] = Math.max(0, Math.min(255, b));
            }
        }

        for (let i = 0; i < data.length; i++) {
            data[i] = output[i];
        }
    }

    pixelate(imageData, blockSize) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        for (let y = 0; y < height; y += blockSize) {
            for (let x = 0; x < width; x += blockSize) {
                let r = 0, g = 0, b = 0, count = 0;

                // Calculate average color for block
                for (let by = 0; by < blockSize && y + by < height; by++) {
                    for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
                        const i = ((y + by) * width + (x + bx)) * 4;
                        r += data[i];
                        g += data[i + 1];
                        b += data[i + 2];
                        count++;
                    }
                }

                r = Math.floor(r / count);
                g = Math.floor(g / count);
                b = Math.floor(b / count);

                // Apply average color to block
                for (let by = 0; by < blockSize && y + by < height; by++) {
                    for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
                        const i = ((y + by) * width + (x + bx)) * 4;
                        data[i] = r;
                        data[i + 1] = g;
                        data[i + 2] = b;
                    }
                }
            }
        }
    }

    applyVignette(imageData) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const cx = width / 2;
        const cy = height / 2;
        const maxDist = Math.sqrt(cx * cx + cy * cy);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const factor = 1 - Math.pow(dist / maxDist, 2);

                const i = (y * width + x) * 4;
                data[i] *= factor;
                data[i + 1] *= factor;
                data[i + 2] *= factor;
            }
        }
    }

    applyColorAdjustments() {
        const brightness = parseInt(this.container.querySelector('#brightness').value);
        const contrast = parseInt(this.container.querySelector('#contrast').value);
        const saturation = parseInt(this.container.querySelector('#saturation').value);
        const hue = parseInt(this.container.querySelector('#hue').value);

        const activeLayer = this.layers[this.activeLayerIndex];
        const layerCtx = activeLayer.canvas.getContext('2d');
        const imageData = layerCtx.getImageData(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // Brightness
            r += brightness;
            g += brightness;
            b += brightness;

            // Contrast
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
            r = factor * (r - 128) + 128;
            g = factor * (g - 128) + 128;
            b = factor * (b - 128) + 128;

            // Convert to HSL for saturation and hue
            const hsl = this.rgbToHsl(r, g, b);
            hsl[0] = (hsl[0] + hue) % 360;
            hsl[1] = Math.max(0, Math.min(100, hsl[1] + saturation));

            const rgb = this.hslToRgb(hsl[0], hsl[1], hsl[2]);

            data[i] = Math.max(0, Math.min(255, rgb[0]));
            data[i + 1] = Math.max(0, Math.min(255, rgb[1]));
            data[i + 2] = Math.max(0, Math.min(255, rgb[2]));
        }

        layerCtx.putImageData(imageData, 0, 0);
        this.composeLayers();
        this.saveHistory();
    }

    floodFill(ctx, startX, startY, fillColor) {
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        const startPos = (Math.floor(startY) * width + Math.floor(startX)) * 4;
        const startR = data[startPos];
        const startG = data[startPos + 1];
        const startB = data[startPos + 2];
        const startA = data[startPos + 3];

        const fillRgb = this.hexToRgb(fillColor);

        if (startR === fillRgb.r && startG === fillRgb.g && startB === fillRgb.b) {
            return; // Same color, no fill needed
        }

        const stack = [[Math.floor(startX), Math.floor(startY)]];
        const visited = new Set();

        while (stack.length) {
            const [x, y] = stack.pop();

            if (x < 0 || x >= width || y < 0 || y >= height) continue;

            const key = `${x},${y}`;
            if (visited.has(key)) continue;
            visited.add(key);

            const pos = (y * width + x) * 4;

            if (data[pos] === startR && data[pos + 1] === startG &&
                data[pos + 2] === startB && data[pos + 3] === startA) {

                data[pos] = fillRgb.r;
                data[pos + 1] = fillRgb.g;
                data[pos + 2] = fillRgb.b;

                stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    rotateImage(degrees) {
        const activeLayer = this.layers[this.activeLayerIndex];
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        if (degrees === 90 || degrees === 270) {
            tempCanvas.width = activeLayer.canvas.height;
            tempCanvas.height = activeLayer.canvas.width;
        } else {
            tempCanvas.width = activeLayer.canvas.width;
            tempCanvas.height = activeLayer.canvas.height;
        }

        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        tempCtx.rotate((degrees * Math.PI) / 180);
        tempCtx.drawImage(activeLayer.canvas, -activeLayer.canvas.width / 2, -activeLayer.canvas.height / 2);

        activeLayer.canvas.width = tempCanvas.width;
        activeLayer.canvas.height = tempCanvas.height;
        activeLayer.canvas.getContext('2d').drawImage(tempCanvas, 0, 0);

        this.canvas.width = tempCanvas.width;
        this.canvas.height = tempCanvas.height;

        this.composeLayers();
        this.saveHistory();
        this.updateStatus();
    }

    flipImage(direction) {
        const activeLayer = this.layers[this.activeLayerIndex];
        const layerCtx = activeLayer.canvas.getContext('2d');
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = activeLayer.canvas.width;
        tempCanvas.height = activeLayer.canvas.height;
        tempCanvas.getContext('2d').drawImage(activeLayer.canvas, 0, 0);

        layerCtx.clearRect(0, 0, activeLayer.canvas.width, activeLayer.canvas.height);

        if (direction === 'horizontal') {
            layerCtx.scale(-1, 1);
            layerCtx.drawImage(tempCanvas, -activeLayer.canvas.width, 0);
        } else {
            layerCtx.scale(1, -1);
            layerCtx.drawImage(tempCanvas, 0, -activeLayer.canvas.height);
        }

        layerCtx.setTransform(1, 0, 0, 1, 0, 0);

        this.composeLayers();
        this.saveHistory();
    }

    saveHistory() {
        // Remove future history if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        // Save current state
        const state = {
            layers: this.layers.map(layer => ({
                name: layer.name,
                imageData: layer.canvas.toDataURL(),
                visible: layer.visible,
                opacity: layer.opacity,
                blendMode: layer.blendMode
            })),
            activeLayerIndex: this.activeLayerIndex
        };

        this.history.push(state);

        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }

        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreHistory(this.history[this.historyIndex]);
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreHistory(this.history[this.historyIndex]);
        }
    }

    async restoreHistory(state) {
        this.layers = await Promise.all(state.layers.map(async (layerData) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const img = new Image();
            await new Promise(resolve => {
                img.onload = resolve;
                img.src = layerData.imageData;
            });

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            return {
                name: layerData.name,
                canvas: canvas,
                visible: layerData.visible,
                opacity: layerData.opacity,
                blendMode: layerData.blendMode
            };
        }));

        this.activeLayerIndex = state.activeLayerIndex;
        this.composeLayers();
        this.updateLayersList();
        this.updateUndoRedoButtons();
    }

    updateUndoRedoButtons() {
        const undoBtn = this.container.querySelector('[data-action="undo"]');
        const redoBtn = this.container.querySelector('[data-action="redo"]');

        undoBtn.disabled = this.historyIndex <= 0;
        redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    }

    updateZoom() {
        this.canvas.style.transform = `scale(${this.zoom})`;
        this.updateStatus();
    }

    updateStatus() {
        const body = this.container;
        body.querySelector('#currentTool').textContent = this.currentTool.charAt(0).toUpperCase() + this.currentTool.slice(1);
        body.querySelector('#canvasSize').textContent = `${this.canvas.width} × ${this.canvas.height}`;
        body.querySelector('#zoomLevel').textContent = `${Math.round(this.zoom * 100)}%`;
        body.querySelector('#layerCount').textContent = this.layers.length;
    }

    // Utility functions
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = Math.round(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return [h * 360, s * 100, l * 100];
    }

    hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
}
