/**
 * Download Manager
 * Manages file downloads with progress tracking
 */
export class DownloadManager {
  constructor() {
    this.downloads = [];
    this.nextId = 1;
    this.changeListeners = [];
  }

  /**
   * Add a download
   * @param {Object} download - Download info {url, filename}
   * @returns {Object} Download object
   */
  addDownload(download) {
    const newDownload = {
      id: this.nextId++,
      url: download.url,
      filename: download.filename || this.getFilenameFromUrl(download.url),
      progress: 0,
      status: 'downloading', // downloading, completed, failed, paused
      size: 0,
      downloadedSize: 0,
      startTime: Date.now(),
      endTime: null,
      error: null
    };

    this.downloads.unshift(newDownload);
    this.notifyChange();
    this.startDownload(newDownload);

    return newDownload;
  }

  /**
   * Start download
   * @param {Object} download - Download object
   */
  async startDownload(download) {
    try {
      const response = await fetch(download.url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      download.size = contentLength ? parseInt(contentLength, 10) : 0;

      const blob = await response.blob();
      download.downloadedSize = blob.size;
      download.progress = 100;
      download.status = 'completed';
      download.endTime = Date.now();

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = download.filename;
      a.click();
      URL.revokeObjectURL(url);

      this.notifyChange();
    } catch (error) {
      download.status = 'failed';
      download.error = error.message;
      download.endTime = Date.now();
      this.notifyChange();
    }
  }

  /**
   * Get filename from URL
   * @param {string} url - URL
   * @returns {string} Filename
   */
  getFilenameFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
      return filename || 'download';
    } catch {
      return 'download';
    }
  }

  /**
   * Cancel download
   * @param {number} id - Download ID
   */
  cancelDownload(id) {
    const download = this.downloads.find(d => d.id === id);
    if (download && download.status === 'downloading') {
      download.status = 'failed';
      download.error = 'Cancelled by user';
      download.endTime = Date.now();
      this.notifyChange();
    }
  }

  /**
   * Remove download from history
   * @param {number} id - Download ID
   */
  removeDownload(id) {
    const index = this.downloads.findIndex(d => d.id === id);
    if (index >= 0) {
      this.downloads.splice(index, 1);
      this.notifyChange();
    }
  }

  /**
   * Clear all downloads
   */
  clearAll() {
    this.downloads = [];
    this.notifyChange();
  }

  /**
   * Get all downloads
   * @returns {Array} Downloads
   */
  getAllDownloads() {
    return this.downloads;
  }

  /**
   * Format file size
   * @param {number} bytes - Bytes
   * @returns {string} Formatted size
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Add change listener
   * @param {Function} callback - Callback function
   */
  onChange(callback) {
    this.changeListeners.push(callback);
  }

  /**
   * Notify change listeners
   */
  notifyChange() {
    this.changeListeners.forEach(callback => callback());
  }
}
