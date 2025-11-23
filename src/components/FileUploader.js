/**
 * FileUploader - Component for uploading files from local machine to WebOS
 *
 * Features:
 * - Drag and drop support
 * - Multiple file selection
 * - Progress tracking
 * - File size limits
 * - Type filtering
 * - Preview for images
 */

export class FileUploader {
  constructor(vfs, options = {}) {
    this.vfs = vfs;
    this.options = {
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB default
      allowedTypes: options.allowedTypes || null, // null = all types
      targetDirectory: options.targetDirectory || '/home/user/uploads',
      multiple: options.multiple !== false,
      showPreview: options.showPreview !== false,
      onUploadStart: options.onUploadStart || null,
      onUploadProgress: options.onUploadProgress || null,
      onUploadComplete: options.onUploadComplete || null,
      onUploadError: options.onUploadError || null
    };

    this.uploading = false;
    this.uploadQueue = [];
  }

  /**
   * Create upload UI element
   */
  createUI(container) {
    const uploadContainer = document.createElement('div');
    uploadContainer.className = 'file-uploader';
    uploadContainer.innerHTML = `
      <div class="uploader-dropzone" id="dropzone">
        <div class="uploader-icon">📁</div>
        <div class="uploader-text">
          <h3>Drop files here or click to browse</h3>
          <p>Maximum file size: ${this._formatFileSize(this.options.maxFileSize)}</p>
        </div>
        <input
          type="file"
          id="fileInput"
          ${this.options.multiple ? 'multiple' : ''}
          ${this.options.allowedTypes ? `accept="${this.options.allowedTypes.join(',')}"` : ''}
          style="display: none;"
        >
      </div>
      <div class="uploader-queue" id="uploadQueue"></div>
      <div class="uploader-stats" id="uploadStats"></div>
    `;

    // Add styles
    this._injectStyles();

    // Get elements
    const dropzone = uploadContainer.querySelector('#dropzone');
    const fileInput = uploadContainer.querySelector('#fileInput');
    const uploadQueue = uploadContainer.querySelector('#uploadQueue');

    // Event listeners
    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      this._handleFiles(Array.from(e.target.files));
      fileInput.value = ''; // Reset input
    });

    // Drag and drop
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');

      const files = Array.from(e.dataTransfer.files);
      this._handleFiles(files);
    });

    if (container) {
      container.appendChild(uploadContainer);
    }

    this.ui = {
      container: uploadContainer,
      dropzone,
      fileInput,
      uploadQueue
    };

    return uploadContainer;
  }

  /**
   * Handle selected files
   */
  async _handleFiles(files) {
    const validFiles = files.filter(file => this._validateFile(file));

    if (validFiles.length === 0) {
      return;
    }

    // Add to queue
    this.uploadQueue.push(...validFiles);
    this._updateQueueUI();

    // Start upload if not already uploading
    if (!this.uploading) {
      await this._processQueue();
    }
  }

  /**
   * Validate file
   */
  _validateFile(file) {
    // Check size
    if (file.size > this.options.maxFileSize) {
      this._showError(`File "${file.name}" exceeds maximum size of ${this._formatFileSize(this.options.maxFileSize)}`);
      return false;
    }

    // Check type
    if (this.options.allowedTypes && this.options.allowedTypes.length > 0) {
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();
      const mimeType = file.type;

      const isAllowed = this.options.allowedTypes.some(type => {
        return type === fileExt || type === mimeType || type === '*';
      });

      if (!isAllowed) {
        this._showError(`File type "${fileExt}" is not allowed`);
        return false;
      }
    }

    return true;
  }

  /**
   * Process upload queue
   */
  async _processQueue() {
    this.uploading = true;

    while (this.uploadQueue.length > 0) {
      const file = this.uploadQueue.shift();
      await this._uploadFile(file);
      this._updateQueueUI();
    }

    this.uploading = false;

    if (this.options.onUploadComplete) {
      this.options.onUploadComplete();
    }
  }

  /**
   * Upload single file
   */
  async _uploadFile(file) {
    const targetPath = `${this.options.targetDirectory}/${file.name}`;

    if (this.options.onUploadStart) {
      this.options.onUploadStart(file);
    }

    try {
      // Ensure target directory exists
      await this._ensureDirectory(this.options.targetDirectory);

      // Read file content
      const content = await this._readFile(file);

      // Write to VFS
      await this.vfs.writeFile(targetPath, content);

      console.log(`[FileUploader] Uploaded: ${targetPath}`);

      // Update UI
      this._addUploadedFileUI(file, targetPath, 'success');

      return { success: true, path: targetPath };
    } catch (error) {
      console.error(`[FileUploader] Upload failed for ${file.name}:`, error);

      if (this.options.onUploadError) {
        this.options.onUploadError(file, error);
      }

      this._addUploadedFileUI(file, targetPath, 'error', error.message);

      return { success: false, error: error.message };
    }
  }

  /**
   * Read file content
   */
  _readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target.result;

        // Convert based on file type
        if (file.type.startsWith('text/') || this._isTextFile(file.name)) {
          resolve(content);
        } else {
          // For binary files, store as base64
          const base64 = btoa(
            new Uint8Array(content).reduce((data, byte) =>
              data + String.fromCharCode(byte), ''
            )
          );
          resolve(base64);
        }
      };

      reader.onerror = reject;

      // Read as appropriate type
      if (file.type.startsWith('text/') || this._isTextFile(file.name)) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }

  /**
   * Check if file is text-based
   */
  _isTextFile(filename) {
    const textExtensions = [
      '.txt', '.md', '.json', '.xml', '.csv', '.html', '.css', '.js',
      '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h',
      '.sh', '.yml', '.yaml', '.ini', '.cfg', '.conf', '.gitignore'
    ];

    const ext = '.' + filename.split('.').pop().toLowerCase();
    return textExtensions.includes(ext);
  }

  /**
   * Ensure directory exists
   */
  async _ensureDirectory(path) {
    try {
      await this.vfs.stat(path);
    } catch (error) {
      // Directory doesn't exist, create it
      const parts = path.split('/').filter(p => p);
      let currentPath = '';

      for (const part of parts) {
        currentPath += '/' + part;

        try {
          await this.vfs.stat(currentPath);
        } catch {
          await this.vfs.mkdir(currentPath);
        }
      }
    }
  }

  /**
   * Update queue UI
   */
  _updateQueueUI() {
    if (!this.ui) return;

    const queueHTML = this.uploadQueue.map(file => `
      <div class="queue-item">
        <span class="file-icon">📄</span>
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-size">${this._formatFileSize(file.size)}</div>
        </div>
        <div class="upload-status">⏳ Waiting...</div>
      </div>
    `).join('');

    this.ui.uploadQueue.innerHTML = queueHTML;
  }

  /**
   * Add uploaded file to UI
   */
  _addUploadedFileUI(file, path, status, errorMsg = null) {
    if (!this.ui) return;

    const statusIcon = status === 'success' ? '✅' : '❌';
    const statusText = status === 'success' ? 'Uploaded' : 'Failed';
    const statusClass = status === 'success' ? 'success' : 'error';

    const fileItem = document.createElement('div');
    fileItem.className = `uploaded-file ${statusClass}`;
    fileItem.innerHTML = `
      <span class="status-icon">${statusIcon}</span>
      <div class="file-info">
        <div class="file-name">${file.name}</div>
        <div class="file-path">${path}</div>
        ${errorMsg ? `<div class="error-message">${errorMsg}</div>` : ''}
      </div>
      <div class="file-size">${this._formatFileSize(file.size)}</div>
    `;

    // Add preview for images
    if (this.options.showPreview && file.type.startsWith('image/')) {
      const preview = document.createElement('img');
      preview.className = 'file-preview';
      preview.src = URL.createObjectURL(file);
      preview.onload = () => URL.revokeObjectURL(preview.src);
      fileItem.appendChild(preview);
    }

    this.ui.uploadQueue.appendChild(fileItem);
  }

  /**
   * Format file size
   */
  _formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Show error message
   */
  _showError(message) {
    console.error('[FileUploader]', message);

    if (this.ui) {
      const error = document.createElement('div');
      error.className = 'upload-error';
      error.textContent = message;
      this.ui.uploadQueue.appendChild(error);

      setTimeout(() => error.remove(), 5000);
    }
  }

  /**
   * Inject CSS styles
   */
  _injectStyles() {
    if (document.getElementById('file-uploader-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'file-uploader-styles';
    style.textContent = `
      .file-uploader {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .uploader-dropzone {
        border: 2px dashed #cbd5e0;
        border-radius: 8px;
        padding: 3rem 2rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s;
        background: #f7fafc;
      }

      .uploader-dropzone:hover,
      .uploader-dropzone.dragover {
        border-color: #667eea;
        background: #edf2f7;
      }

      .uploader-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }

      .uploader-text h3 {
        margin: 0 0 0.5rem 0;
        color: #2d3748;
      }

      .uploader-text p {
        margin: 0;
        color: #718096;
        font-size: 0.9rem;
      }

      .uploader-queue {
        margin-top: 1.5rem;
      }

      .queue-item,
      .uploaded-file {
        display: flex;
        align-items: center;
        padding: 1rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        margin-bottom: 0.5rem;
      }

      .file-icon,
      .status-icon {
        font-size: 2rem;
        margin-right: 1rem;
      }

      .file-info {
        flex: 1;
      }

      .file-name {
        font-weight: 500;
        color: #2d3748;
        margin-bottom: 0.25rem;
      }

      .file-size,
      .file-path {
        font-size: 0.85rem;
        color: #718096;
      }

      .upload-status {
        color: #718096;
        font-size: 0.9rem;
      }

      .uploaded-file.success {
        background: #f0fff4;
        border-color: #9ae6b4;
      }

      .uploaded-file.error {
        background: #fff5f5;
        border-color: #fc8181;
      }

      .error-message {
        color: #e53e3e;
        font-size: 0.85rem;
        margin-top: 0.25rem;
      }

      .upload-error {
        padding: 1rem;
        background: #fff5f5;
        border: 1px solid #fc8181;
        border-radius: 6px;
        color: #e53e3e;
        margin-bottom: 0.5rem;
      }

      .file-preview {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 4px;
        margin-left: 1rem;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Upload files programmatically
   */
  async uploadFiles(files) {
    return await this._handleFiles(Array.from(files));
  }

  /**
   * Clear upload queue
   */
  clearQueue() {
    this.uploadQueue = [];
    this._updateQueueUI();
  }

  /**
   * Get upload statistics
   */
  getStats() {
    return {
      queueLength: this.uploadQueue.length,
      uploading: this.uploading
    };
  }
}

/**
 * Standalone upload function
 */
export async function uploadFile(vfs, file, targetDirectory = '/home/user/uploads') {
  const uploader = new FileUploader(vfs, { targetDirectory });
  return await uploader.uploadFiles([file]);
}

/**
 * Batch upload function
 */
export async function uploadFiles(vfs, files, targetDirectory = '/home/user/uploads', options = {}) {
  const uploader = new FileUploader(vfs, { ...options, targetDirectory });
  return await uploader.uploadFiles(files);
}

export default FileUploader;
