export default class ImageViewer {
  constructor(context) {
    this.context = context;
    this.currentImage = null;
    this.zoom = 1;
    this.rotation = 0;
    this.imageElement = null;
    this.imageContainer = null;
  }

  async init() {
    // Check if an image file was passed as argument
    if (this.context.args && this.context.args.file) {
      await this.loadImage(this.context.args.file);
    }
  }

  render() {
    const container = document.createElement('div');
    container.className = 'image-viewer-container';
    container.style.cssText = 'display:flex;flex-direction:column;height:100%;background:#1e1e1e;';

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'image-viewer-toolbar';
    toolbar.style.cssText = 'padding:10px;background:#2d2d2d;border-bottom:1px solid #444;display:flex;gap:10px;align-items:center;';

    const openBtn = this._createButton('📁 Open', async () => {
      const path = prompt('Enter image path:', '/home/user/');
      if (path) {
        await this.loadImage(path);
      }
    });

    const zoomInBtn = this._createButton('🔍+ Zoom In', () => {
      this.zoom = Math.min(this.zoom * 1.2, 10);
      this.updateImageTransform();
    });

    const zoomOutBtn = this._createButton('🔍- Zoom Out', () => {
      this.zoom = Math.max(this.zoom / 1.2, 0.1);
      this.updateImageTransform();
    });

    const resetBtn = this._createButton('⟲ Reset', () => {
      this.zoom = 1;
      this.rotation = 0;
      this.updateImageTransform();
    });

    const rotateLeftBtn = this._createButton('↺ Rotate Left', () => {
      this.rotation -= 90;
      this.updateImageTransform();
    });

    const rotateRightBtn = this._createButton('↻ Rotate Right', () => {
      this.rotation += 90;
      this.updateImageTransform();
    });

    const fitBtn = this._createButton('⛶ Fit Screen', () => {
      this.fitToScreen();
    });

    const filePathLabel = document.createElement('span');
    filePathLabel.style.cssText = 'color:#aaa;flex:1;text-align:right;padding-right:10px;font-size:12px;';
    filePathLabel.textContent = 'No image loaded';
    this.filePathLabel = filePathLabel;

    toolbar.appendChild(openBtn);
    toolbar.appendChild(zoomInBtn);
    toolbar.appendChild(zoomOutBtn);
    toolbar.appendChild(fitBtn);
    toolbar.appendChild(resetBtn);
    toolbar.appendChild(rotateLeftBtn);
    toolbar.appendChild(rotateRightBtn);
    toolbar.appendChild(filePathLabel);

    // Image container
    this.imageContainer = document.createElement('div');
    this.imageContainer.className = 'image-viewer-image-container';
    this.imageContainer.style.cssText = 'flex:1;overflow:auto;display:flex;align-items:center;justify-content:center;position:relative;';

    // Image element
    this.imageElement = document.createElement('img');
    this.imageElement.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;transition:transform 0.2s;';
    this.imageElement.alt = 'Image';

    // Drag to pan
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;

    this.imageContainer.addEventListener('mousedown', (e) => {
      if (e.target === this.imageElement) {
        isDragging = true;
        startX = e.pageX - this.imageContainer.offsetLeft;
        startY = e.pageY - this.imageContainer.offsetTop;
        scrollLeft = this.imageContainer.scrollLeft;
        scrollTop = this.imageContainer.scrollTop;
        this.imageContainer.style.cursor = 'grabbing';
      }
    });

    this.imageContainer.addEventListener('mouseleave', () => {
      isDragging = false;
      this.imageContainer.style.cursor = 'default';
    });

    this.imageContainer.addEventListener('mouseup', () => {
      isDragging = false;
      this.imageContainer.style.cursor = 'default';
    });

    this.imageContainer.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - this.imageContainer.offsetLeft;
      const y = e.pageY - this.imageContainer.offsetTop;
      const walkX = (x - startX) * 1;
      const walkY = (y - startY) * 1;
      this.imageContainer.scrollLeft = scrollLeft - walkX;
      this.imageContainer.scrollTop = scrollTop - walkY;
    });

    // Mouse wheel zoom
    this.imageContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        this.zoom = Math.min(this.zoom * 1.1, 10);
      } else {
        this.zoom = Math.max(this.zoom / 1.1, 0.1);
      }
      this.updateImageTransform();
    });

    this.imageContainer.appendChild(this.imageElement);

    container.appendChild(toolbar);
    container.appendChild(this.imageContainer);

    return container;
  }

  async loadImage(path) {
    try {
      const data = await this.context.fs.readFile(path);

      // Convert buffer to blob
      const blob = new Blob([data], { type: this.getMimeType(path) });
      const url = URL.createObjectURL(blob);

      this.imageElement.src = url;
      this.currentImage = path;
      this.filePathLabel.textContent = path;
      this.zoom = 1;
      this.rotation = 0;
      this.updateImageTransform();

      // Clean up old blob URL
      this.imageElement.onload = () => {
        setTimeout(() => {
          if (this.imageElement.src !== url) {
            URL.revokeObjectURL(url);
          }
        }, 100);
      };
    } catch (error) {
      alert(`Error loading image: ${error.message}`);
    }
  }

  getMimeType(path) {
    const ext = path.split('.').pop().toLowerCase();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon'
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  updateImageTransform() {
    this.imageElement.style.transform = `scale(${this.zoom}) rotate(${this.rotation}deg)`;
  }

  fitToScreen() {
    const containerWidth = this.imageContainer.clientWidth;
    const containerHeight = this.imageContainer.clientHeight;
    const imageWidth = this.imageElement.naturalWidth;
    const imageHeight = this.imageElement.naturalHeight;

    if (imageWidth && imageHeight) {
      const scaleX = containerWidth / imageWidth;
      const scaleY = containerHeight / imageHeight;
      this.zoom = Math.min(scaleX, scaleY) * 0.95; // 95% to add some padding
      this.rotation = 0;
      this.updateImageTransform();
    }
  }

  _createButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = 'padding:6px 12px;cursor:pointer;background:#3a3a3a;color:#fff;border:1px solid #555;border-radius:4px;transition:background 0.2s;font-size:12px;';
    button.addEventListener('mouseenter', () => {
      button.style.background = '#4a4a4a';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = '#3a3a3a';
    });
    button.addEventListener('click', onClick);
    return button;
  }
}
