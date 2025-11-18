/**
 * FilePane.js
 *
 * Individual file pane component for dual-pane file manager.
 * Supports file selection, drag and drop, and context menus.
 */

export class FilePane {
  constructor(initialPath, vfs, onSelectionChange) {
    this.currentPath = initialPath;
    this.vfs = vfs;
    this.selectedFiles = new Set();
    this.onSelectionChange = onSelectionChange || (() => {});
    this.viewMode = 'list'; // 'list' or 'grid'
    this.sortBy = 'name'; // 'name', 'size', 'modified'
    this.sortOrder = 'asc'; // 'asc' or 'desc'
  }

  render() {
    const container = document.createElement('div');
    container.className = 'file-pane';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      border: 1px solid #ddd;
      background: #fff;
    `;

    // Path bar
    const pathBar = this._createPathBar();
    container.appendChild(pathBar);

    // View controls
    const controls = this._createControls();
    container.appendChild(controls);

    // File list
    const fileList = document.createElement('div');
    fileList.className = 'file-list';
    fileList.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 5px;
    `;

    // Enable drag and drop on the pane
    fileList.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    fileList.addEventListener('drop', (e) => {
      e.preventDefault();
      this._handleDrop(e);
    });

    container.appendChild(fileList);

    // Load files
    this._loadFiles(fileList);

    return container;
  }

  _createPathBar() {
    const pathBar = document.createElement('div');
    pathBar.className = 'path-bar';
    pathBar.style.cssText = `
      padding: 8px;
      border-bottom: 1px solid #ddd;
      background: #f8f8f8;
      display: flex;
      align-items: center;
      gap: 5px;
    `;

    // Home button
    const homeBtn = document.createElement('button');
    homeBtn.textContent = '🏠';
    homeBtn.title = 'Home';
    homeBtn.style.cssText = 'padding: 4px 8px; cursor: pointer; border: 1px solid #ccc; background: #fff;';
    homeBtn.addEventListener('click', () => {
      this.navigateTo('/home/user');
    });

    // Path segments
    const pathSegments = document.createElement('div');
    pathSegments.style.cssText = 'flex: 1; display: flex; align-items: center; gap: 5px; overflow-x: auto;';

    const parts = this.currentPath.split('/').filter(p => p);
    let currentPath = '';

    // Root
    const rootBtn = document.createElement('button');
    rootBtn.textContent = '/';
    rootBtn.style.cssText = 'padding: 4px 8px; cursor: pointer; border: 1px solid #ccc; background: #fff;';
    rootBtn.addEventListener('click', () => {
      this.navigateTo('/');
    });
    pathSegments.appendChild(rootBtn);

    // Path parts
    parts.forEach((part, index) => {
      currentPath += '/' + part;

      const separator = document.createElement('span');
      separator.textContent = '›';
      separator.style.cssText = 'color: #999;';
      pathSegments.appendChild(separator);

      const partPath = currentPath;
      const partBtn = document.createElement('button');
      partBtn.textContent = part;
      partBtn.style.cssText = 'padding: 4px 8px; cursor: pointer; border: 1px solid #ccc; background: #fff;';
      partBtn.addEventListener('click', () => {
        this.navigateTo(partPath);
      });
      pathSegments.appendChild(partBtn);
    });

    // Up button
    const upBtn = document.createElement('button');
    upBtn.textContent = '⬆️';
    upBtn.title = 'Parent Directory';
    upBtn.style.cssText = 'padding: 4px 8px; cursor: pointer; border: 1px solid #ccc; background: #fff;';
    upBtn.disabled = this.currentPath === '/';
    upBtn.addEventListener('click', () => {
      const parent = this.currentPath.split('/').slice(0, -1).join('/') || '/';
      this.navigateTo(parent);
    });

    pathBar.appendChild(homeBtn);
    pathBar.appendChild(pathSegments);
    pathBar.appendChild(upBtn);

    return pathBar;
  }

  _createControls() {
    const controls = document.createElement('div');
    controls.className = 'view-controls';
    controls.style.cssText = `
      padding: 5px 8px;
      border-bottom: 1px solid #ddd;
      background: #f8f8f8;
      display: flex;
      gap: 10px;
      align-items: center;
      font-size: 0.9em;
    `;

    // View mode buttons
    const viewLabel = document.createElement('span');
    viewLabel.textContent = 'View:';
    viewLabel.style.cssText = 'color: #666;';

    const listBtn = document.createElement('button');
    listBtn.textContent = '📋';
    listBtn.title = 'List View';
    listBtn.style.cssText = 'padding: 4px 8px; cursor: pointer;';
    listBtn.addEventListener('click', () => {
      this.viewMode = 'list';
      this.refresh();
    });

    const gridBtn = document.createElement('button');
    gridBtn.textContent = '🔲';
    gridBtn.title = 'Grid View';
    gridBtn.style.cssText = 'padding: 4px 8px; cursor: pointer;';
    gridBtn.addEventListener('click', () => {
      this.viewMode = 'grid';
      this.refresh();
    });

    // Sort controls
    const sortLabel = document.createElement('span');
    sortLabel.textContent = 'Sort:';
    sortLabel.style.cssText = 'color: #666; margin-left: 10px;';

    const sortSelect = document.createElement('select');
    sortSelect.style.cssText = 'padding: 4px; border: 1px solid #ccc;';
    sortSelect.innerHTML = `
      <option value="name">Name</option>
      <option value="size">Size</option>
      <option value="modified">Modified</option>
      <option value="type">Type</option>
    `;
    sortSelect.value = this.sortBy;
    sortSelect.addEventListener('change', () => {
      this.sortBy = sortSelect.value;
      this.refresh();
    });

    const orderBtn = document.createElement('button');
    orderBtn.textContent = this.sortOrder === 'asc' ? '⬆️' : '⬇️';
    orderBtn.title = 'Toggle Sort Order';
    orderBtn.style.cssText = 'padding: 4px 8px; cursor: pointer;';
    orderBtn.addEventListener('click', () => {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      orderBtn.textContent = this.sortOrder === 'asc' ? '⬆️' : '⬇️';
      this.refresh();
    });

    controls.appendChild(viewLabel);
    controls.appendChild(listBtn);
    controls.appendChild(gridBtn);
    controls.appendChild(sortLabel);
    controls.appendChild(sortSelect);
    controls.appendChild(orderBtn);

    return controls;
  }

  async _loadFiles(fileList) {
    try {
      const entries = await this.vfs.readdir(this.currentPath);

      // Sort entries
      const sortedEntries = this._sortEntries(entries);

      fileList.innerHTML = '';

      if (this.viewMode === 'list') {
        sortedEntries.forEach(entry => {
          const item = this._createListItem(entry);
          fileList.appendChild(item);
        });
      } else {
        fileList.style.cssText += `
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 10px;
        `;
        sortedEntries.forEach(entry => {
          const item = this._createGridItem(entry);
          fileList.appendChild(item);
        });
      }
    } catch (error) {
      fileList.innerHTML = `<div style="padding: 20px; color: red;">Error: ${error.message}</div>`;
    }
  }

  _sortEntries(entries) {
    const sorted = [...entries];

    sorted.sort((a, b) => {
      // Directories first
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;

      let comparison = 0;
      switch (this.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'modified':
          comparison = (a.modified || 0) - (b.modified || 0);
          break;
        case 'type':
          const extA = a.name.split('.').pop() || '';
          const extB = b.name.split('.').pop() || '';
          comparison = extA.localeCompare(extB);
          break;
      }

      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  _createListItem(entry) {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.dataset.filename = entry.name;
    item.dataset.type = entry.type;
    item.style.cssText = `
      padding: 8px;
      cursor: pointer;
      border-bottom: 1px solid #eee;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: background 0.2s;
    `;

    // Selection state
    if (this.selectedFiles.has(entry.name)) {
      item.style.background = '#e3f2fd';
    }

    item.addEventListener('mouseenter', () => {
      if (!this.selectedFiles.has(entry.name)) {
        item.style.background = '#f5f5f5';
      }
    });

    item.addEventListener('mouseleave', () => {
      if (!this.selectedFiles.has(entry.name)) {
        item.style.background = 'transparent';
      }
    });

    // Click handling
    item.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey) {
        // Multi-select
        this._toggleSelection(entry.name);
      } else {
        // Single select or navigate
        if (entry.type === 'directory') {
          this.navigateTo(`${this.currentPath}/${entry.name}`);
        } else {
          this.clearSelection();
          this._toggleSelection(entry.name);
        }
      }
    });

    // Double click to open
    item.addEventListener('dblclick', (e) => {
      e.preventDefault();
      if (entry.type === 'directory') {
        this.navigateTo(`${this.currentPath}/${entry.name}`);
      } else {
        this._openFile(entry);
      }
    });

    // Drag and drop
    item.draggable = true;
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({
        files: Array.from(this.selectedFiles.has(entry.name) ? this.selectedFiles : [entry.name]),
        sourcePath: this.currentPath
      }));
      e.dataTransfer.effectAllowed = 'copyMove';
    });

    const icon = document.createElement('span');
    icon.textContent = this._getFileIcon(entry);
    icon.style.cssText = 'font-size: 1.2em;';

    const name = document.createElement('span');
    name.textContent = entry.name;
    name.style.cssText = 'flex: 1;';

    const size = document.createElement('span');
    size.textContent = entry.type === 'file' ? this._formatSize(entry.size) : '';
    size.style.cssText = 'color: #888; font-size: 0.9em; min-width: 80px; text-align: right;';

    const modified = document.createElement('span');
    if (entry.modified) {
      modified.textContent = new Date(entry.modified).toLocaleDateString();
      modified.style.cssText = 'color: #888; font-size: 0.9em; min-width: 100px; text-align: right;';
    }

    item.appendChild(icon);
    item.appendChild(name);
    item.appendChild(size);
    item.appendChild(modified);

    return item;
  }

  _createGridItem(entry) {
    const item = document.createElement('div');
    item.className = 'file-item-grid';
    item.dataset.filename = entry.name;
    item.dataset.type = entry.type;
    item.style.cssText = `
      padding: 10px;
      cursor: pointer;
      border: 1px solid #ddd;
      border-radius: 4px;
      text-align: center;
      transition: all 0.2s;
      background: #fff;
    `;

    if (this.selectedFiles.has(entry.name)) {
      item.style.background = '#e3f2fd';
      item.style.borderColor = '#2196F3';
    }

    item.addEventListener('mouseenter', () => {
      item.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    });

    item.addEventListener('mouseleave', () => {
      item.style.boxShadow = 'none';
    });

    item.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey) {
        this._toggleSelection(entry.name);
      } else {
        if (entry.type === 'directory') {
          this.navigateTo(`${this.currentPath}/${entry.name}`);
        } else {
          this.clearSelection();
          this._toggleSelection(entry.name);
        }
      }
    });

    item.addEventListener('dblclick', (e) => {
      e.preventDefault();
      if (entry.type === 'directory') {
        this.navigateTo(`${this.currentPath}/${entry.name}`);
      } else {
        this._openFile(entry);
      }
    });

    item.draggable = true;
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({
        files: Array.from(this.selectedFiles.has(entry.name) ? this.selectedFiles : [entry.name]),
        sourcePath: this.currentPath
      }));
    });

    const icon = document.createElement('div');
    icon.textContent = this._getFileIcon(entry);
    icon.style.cssText = 'font-size: 3em; margin-bottom: 5px;';

    const name = document.createElement('div');
    name.textContent = entry.name;
    name.style.cssText = `
      font-size: 0.85em;
      word-break: break-word;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    `;

    item.appendChild(icon);
    item.appendChild(name);

    return item;
  }

  _getFileIcon(entry) {
    if (entry.type === 'directory') return '📁';

    const ext = entry.name.split('.').pop().toLowerCase();
    const iconMap = {
      // Images
      'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'svg': '🖼️',
      // Documents
      'txt': '📄', 'md': '📝', 'pdf': '📕', 'doc': '📘', 'docx': '📘',
      // Code
      'js': '📜', 'html': '🌐', 'css': '🎨', 'json': '📋', 'xml': '📋',
      'py': '🐍', 'java': '☕', 'cpp': '⚙️', 'c': '⚙️',
      // Archives
      'zip': '📦', 'tar': '📦', 'gz': '📦', '7z': '📦', 'rar': '📦',
      // Media
      'mp3': '🎵', 'wav': '🎵', 'mp4': '🎬', 'avi': '🎬',
      // Encrypted
      'enc': '🔒'
    };

    return iconMap[ext] || '📄';
  }

  _formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  _toggleSelection(filename) {
    if (this.selectedFiles.has(filename)) {
      this.selectedFiles.delete(filename);
    } else {
      this.selectedFiles.add(filename);
    }
    this.onSelectionChange(Array.from(this.selectedFiles));
    this.refresh();
  }

  clearSelection() {
    this.selectedFiles.clear();
    this.onSelectionChange([]);
    this.refresh();
  }

  getSelectedFiles() {
    return Array.from(this.selectedFiles);
  }

  navigateTo(path) {
    // Normalize path
    this.currentPath = path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    this.clearSelection();
    this.refresh();
  }

  refresh() {
    // Re-render the pane
    const oldPane = document.querySelector('.file-pane');
    if (oldPane && oldPane.parentNode) {
      const newPane = this.render();
      oldPane.parentNode.replaceChild(newPane, oldPane);
    }
  }

  async _openFile(entry) {
    // This will be handled by the parent FileManager
    if (window.fileManagerInstance) {
      window.fileManagerInstance.openFile(`${this.currentPath}/${entry.name}`, entry);
    }
  }

  async _handleDrop(e) {
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { files, sourcePath } = data;

      // Copy or move files to this directory
      for (const filename of files) {
        const srcPath = `${sourcePath}/${filename}`;
        const destPath = `${this.currentPath}/${filename}`;

        if (e.ctrlKey || e.metaKey) {
          // Copy
          await this.vfs.copy(srcPath, destPath);
        } else {
          // Move
          await this.vfs.rename(srcPath, destPath);
        }
      }

      this.refresh();
    } catch (error) {
      console.error('Drop failed:', error);
      alert(`Drop failed: ${error.message}`);
    }
  }

  getCurrentPath() {
    return this.currentPath;
  }
}
