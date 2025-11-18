/**
 * PreviewPane.js
 *
 * Preview pane component for displaying file contents.
 * Supports images, text files, and displays file information.
 */

export class PreviewPane {
  constructor(vfs) {
    this.vfs = vfs;
    this.currentFile = null;
    this.currentFilePath = null;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'preview-pane';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      border: 1px solid #ddd;
      background: #fafafa;
      min-width: 250px;
      max-width: 400px;
    `;

    // Header
    const header = document.createElement('div');
    header.className = 'preview-header';
    header.style.cssText = `
      padding: 10px;
      border-bottom: 1px solid #ddd;
      background: #fff;
      font-weight: bold;
    `;
    header.textContent = 'Preview';

    // Content area
    const content = document.createElement('div');
    content.className = 'preview-content';
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 10px;
    `;

    if (!this.currentFile) {
      content.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #999;">
          <div style="font-size: 3em; margin-bottom: 10px;">👁️</div>
          <div>Select a file to preview</div>
        </div>
      `;
    } else {
      this._renderPreview(content);
    }

    container.appendChild(header);
    container.appendChild(content);

    return container;
  }

  async _renderPreview(content) {
    try {
      // File info section
      const infoSection = document.createElement('div');
      infoSection.style.cssText = `
        background: #fff;
        padding: 15px;
        border-radius: 4px;
        margin-bottom: 15px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      `;

      const fileName = document.createElement('div');
      fileName.style.cssText = 'font-weight: bold; margin-bottom: 10px; word-break: break-word;';
      fileName.textContent = this.currentFile.name;

      const fileDetails = document.createElement('div');
      fileDetails.style.cssText = 'font-size: 0.85em; color: #666;';

      const stats = await this.vfs.stat(this.currentFilePath);

      fileDetails.innerHTML = `
        <div style="margin: 5px 0;"><strong>Type:</strong> ${this.currentFile.type}</div>
        <div style="margin: 5px 0;"><strong>Size:</strong> ${this._formatSize(stats.size)}</div>
        <div style="margin: 5px 0;"><strong>Modified:</strong> ${new Date(stats.modified).toLocaleString()}</div>
        ${stats.created ? `<div style="margin: 5px 0;"><strong>Created:</strong> ${new Date(stats.created).toLocaleString()}</div>` : ''}
      `;

      infoSection.appendChild(fileName);
      infoSection.appendChild(fileDetails);
      content.appendChild(infoSection);

      // Preview based on file type
      if (this.currentFile.type === 'file') {
        const ext = this.currentFile.name.split('.').pop().toLowerCase();
        const previewContainer = document.createElement('div');
        previewContainer.style.cssText = `
          background: #fff;
          padding: 15px;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        `;

        if (this._isImageFile(ext)) {
          await this._renderImagePreview(previewContainer);
        } else if (this._isTextFile(ext)) {
          await this._renderTextPreview(previewContainer);
        } else {
          previewContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #999;">
              <div style="font-size: 2em; margin-bottom: 10px;">📄</div>
              <div>Preview not available for this file type</div>
            </div>
          `;
        }

        content.appendChild(previewContainer);
      }

    } catch (error) {
      content.innerHTML = `
        <div style="color: red; padding: 20px;">
          Error loading preview: ${error.message}
        </div>
      `;
    }
  }

  _isImageFile(ext) {
    return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'webp'].includes(ext);
  }

  _isTextFile(ext) {
    return [
      'txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'jsx',
      'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'sh',
      'yml', 'yaml', 'toml', 'ini', 'cfg', 'log'
    ].includes(ext);
  }

  async _renderImagePreview(container) {
    try {
      const data = await this.vfs.readFile(this.currentFilePath);
      const blob = new Blob([data], { type: this._getMimeType(this.currentFile.name) });
      const url = URL.createObjectURL(blob);

      const img = document.createElement('img');
      img.src = url;
      img.style.cssText = `
        max-width: 100%;
        height: auto;
        display: block;
        margin: 0 auto;
        border-radius: 4px;
      `;

      img.onload = () => {
        const dimensions = document.createElement('div');
        dimensions.style.cssText = 'text-align: center; margin-top: 10px; font-size: 0.85em; color: #666;';
        dimensions.textContent = `${img.naturalWidth} × ${img.naturalHeight} pixels`;
        container.appendChild(dimensions);
      };

      container.appendChild(img);

      // Clean up blob URL when done
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      container.innerHTML = `<div style="color: red;">Failed to load image: ${error.message}</div>`;
    }
  }

  async _renderTextPreview(container) {
    try {
      const content = await this.vfs.readFile(this.currentFilePath, { encoding: 'utf8' });

      const pre = document.createElement('pre');
      pre.style.cssText = `
        background: #f5f5f5;
        padding: 10px;
        border-radius: 4px;
        overflow-x: auto;
        font-family: 'Courier New', monospace;
        font-size: 0.85em;
        line-height: 1.4;
        margin: 0;
        max-height: 400px;
      `;

      // Limit preview to first 5000 characters
      const previewContent = content.length > 5000
        ? content.substring(0, 5000) + '\n\n... (truncated)'
        : content;

      pre.textContent = previewContent;

      const lineCount = document.createElement('div');
      lineCount.style.cssText = 'text-align: right; margin-top: 10px; font-size: 0.85em; color: #666;';
      lineCount.textContent = `${content.split('\n').length} lines`;

      container.appendChild(pre);
      container.appendChild(lineCount);
    } catch (error) {
      container.innerHTML = `<div style="color: red;">Failed to load text: ${error.message}</div>`;
    }
  }

  _getMimeType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
      'webp': 'image/webp'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  _formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  async setFile(filePath, fileEntry) {
    this.currentFilePath = filePath;
    this.currentFile = fileEntry;
    this.refresh();
  }

  clear() {
    this.currentFilePath = null;
    this.currentFile = null;
    this.refresh();
  }

  refresh() {
    const oldPane = document.querySelector('.preview-pane');
    if (oldPane && oldPane.parentNode) {
      const newPane = this.render();
      oldPane.parentNode.replaceChild(newPane, oldPane);
    }
  }
}
