/**
 * FileManagerV2.js
 *
 * Advanced file manager with dual-pane view, preview, search, and bookmarks.
 * Supports bulk operations, drag and drop, and multiple view modes.
 */

import { FilePane } from './FilePane.js';
import { PreviewPane } from './PreviewPane.js';
import { FileSearch } from './FileSearch.js';
import { BookmarkManager } from './BookmarkManager.js';

export default class FileManagerV2 {
  constructor(context) {
    this.context = context;
    this.leftPane = null;
    this.rightPane = null;
    this.previewPane = null;
    this.searchEngine = new FileSearch(context.fs);
    this.bookmarkManager = new BookmarkManager();
    this.activePane = 'left';
    this.showPreview = true;
    this.searchActive = false;

    // Make instance globally available for file opening
    window.fileManagerInstance = this;
  }

  async init() {
    // Initialize file manager
  }

  render() {
    const container = document.createElement('div');
    container.className = 'file-manager-v2-container';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #fff;
    `;

    // Toolbar
    const toolbar = this._createToolbar();
    container.appendChild(toolbar);

    // Main content area
    const mainArea = document.createElement('div');
    mainArea.className = 'main-area';
    mainArea.style.cssText = `
      flex: 1;
      display: flex;
      overflow: hidden;
    `;

    // Bookmarks sidebar
    const bookmarksSidebar = this.bookmarkManager.renderSidebar((path) => {
      if (this.activePane === 'left' && this.leftPane) {
        this.leftPane.navigateTo(path);
      } else if (this.activePane === 'right' && this.rightPane) {
        this.rightPane.navigateTo(path);
      }
    });
    mainArea.appendChild(bookmarksSidebar);

    // Panes container
    const panesContainer = document.createElement('div');
    panesContainer.className = 'panes-container';
    panesContainer.style.cssText = `
      flex: 1;
      display: flex;
      gap: 10px;
      padding: 10px;
      overflow: hidden;
    `;

    // Left pane
    this.leftPane = new FilePane(
      '/home/user',
      this.context.fs,
      (selected) => this._onSelectionChange('left', selected)
    );
    const leftPaneEl = this.leftPane.render();
    leftPaneEl.addEventListener('click', () => {
      this.activePane = 'left';
      this._updateActivePaneBorder();
    });
    panesContainer.appendChild(leftPaneEl);

    // Right pane
    this.rightPane = new FilePane(
      '/',
      this.context.fs,
      (selected) => this._onSelectionChange('right', selected)
    );
    const rightPaneEl = this.rightPane.render();
    rightPaneEl.addEventListener('click', () => {
      this.activePane = 'right';
      this._updateActivePaneBorder();
    });
    panesContainer.appendChild(rightPaneEl);

    mainArea.appendChild(panesContainer);

    // Preview pane (if enabled)
    if (this.showPreview) {
      this.previewPane = new PreviewPane(this.context.fs);
      mainArea.appendChild(this.previewPane.render());
    }

    container.appendChild(mainArea);

    // Status bar
    const statusBar = this._createStatusBar();
    container.appendChild(statusBar);

    // Set active pane border
    setTimeout(() => this._updateActivePaneBorder(), 0);

    return container;
  }

  _createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    toolbar.style.cssText = `
      padding: 10px;
      border-bottom: 1px solid #ddd;
      background: #f8f8f8;
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    `;

    // File operations
    const operationsGroup = document.createElement('div');
    operationsGroup.style.cssText = 'display: flex; gap: 5px;';

    const newFolderBtn = this._createToolbarButton('📁 New Folder', () => this._newFolder());
    const copyBtn = this._createToolbarButton('📋 Copy', () => this._copyFiles());
    const moveBtn = this._createToolbarButton('✂️ Move', () => this._moveFiles());
    const deleteBtn = this._createToolbarButton('🗑️ Delete', () => this._deleteFiles());
    const renameBtn = this._createToolbarButton('✏️ Rename', () => this._renameFile());

    operationsGroup.appendChild(newFolderBtn);
    operationsGroup.appendChild(copyBtn);
    operationsGroup.appendChild(moveBtn);
    operationsGroup.appendChild(deleteBtn);
    operationsGroup.appendChild(renameBtn);

    // View controls
    const viewGroup = document.createElement('div');
    viewGroup.style.cssText = 'display: flex; gap: 5px; margin-left: auto;';

    const previewBtn = this._createToolbarButton(
      this.showPreview ? '👁️ Hide Preview' : '👁️ Show Preview',
      () => this._togglePreview()
    );

    const bookmarkBtn = this._createToolbarButton('⭐ Bookmark', () => this._addBookmark());
    const refreshBtn = this._createToolbarButton('🔄 Refresh', () => this._refreshAll());
    const propertiesBtn = this._createToolbarButton('ℹ️ Properties', () => this._showProperties());

    viewGroup.appendChild(bookmarkBtn);
    viewGroup.appendChild(previewBtn);
    viewGroup.appendChild(refreshBtn);
    viewGroup.appendChild(propertiesBtn);

    // Search bar
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = 'display: flex; gap: 5px; width: 300px;';

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.placeholder = 'Search files...';
    searchInput.style.cssText = `
      flex: 1;
      padding: 6px 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
    `;

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this._performSearch(searchInput.value);
      }
    });

    const searchBtn = this._createToolbarButton('🔍', () => this._performSearch(searchInput.value));

    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(searchBtn);

    toolbar.appendChild(operationsGroup);
    toolbar.appendChild(searchContainer);
    toolbar.appendChild(viewGroup);

    return toolbar;
  }

  _createToolbarButton(text, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
      padding: 6px 12px;
      border: 1px solid #ccc;
      background: #fff;
      cursor: pointer;
      border-radius: 4px;
      font-size: 0.9em;
      transition: background 0.2s;
    `;

    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#f0f0f0';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.background = '#fff';
    });

    btn.addEventListener('click', onClick);

    return btn;
  }

  _createStatusBar() {
    const statusBar = document.createElement('div');
    statusBar.className = 'status-bar';
    statusBar.style.cssText = `
      padding: 6px 10px;
      border-top: 1px solid #ddd;
      background: #f8f8f8;
      font-size: 0.85em;
      display: flex;
      gap: 20px;
    `;

    const leftStatus = document.createElement('span');
    leftStatus.textContent = `Left: ${this.leftPane ? this.leftPane.getCurrentPath() : '/'}`;

    const rightStatus = document.createElement('span');
    rightStatus.textContent = `Right: ${this.rightPane ? this.rightPane.getCurrentPath() : '/'}`;

    const activeStatus = document.createElement('span');
    activeStatus.style.cssText = 'margin-left: auto; font-weight: bold;';
    activeStatus.textContent = `Active: ${this.activePane.toUpperCase()}`;

    statusBar.appendChild(leftStatus);
    statusBar.appendChild(rightStatus);
    statusBar.appendChild(activeStatus);

    return statusBar;
  }

  _updateActivePaneBorder() {
    const leftPaneEl = document.querySelector('.file-pane:first-child');
    const rightPaneEl = document.querySelector('.file-pane:last-child');

    if (leftPaneEl && rightPaneEl) {
      leftPaneEl.style.border = this.activePane === 'left' ? '2px solid #2196F3' : '1px solid #ddd';
      rightPaneEl.style.border = this.activePane === 'right' ? '2px solid #2196F3' : '1px solid #ddd';
    }
  }

  _onSelectionChange(pane, selectedFiles) {
    // Update preview when a single file is selected
    if (selectedFiles.length === 1 && this.previewPane) {
      const activePane = pane === 'left' ? this.leftPane : this.rightPane;
      const path = activePane.getCurrentPath();
      const filePath = `${path}/${selectedFiles[0]}`;

      // Get file info
      this.context.fs.stat(filePath).then(stats => {
        this.previewPane.setFile(filePath, {
          name: selectedFiles[0],
          type: stats.type,
          size: stats.size,
          modified: stats.modified
        });
      }).catch(err => {
        console.error('Failed to preview file:', err);
      });
    } else if (this.previewPane) {
      this.previewPane.clear();
    }
  }

  async _newFolder() {
    const name = prompt('Enter folder name:');
    if (!name) return;

    try {
      const activePane = this.activePane === 'left' ? this.leftPane : this.rightPane;
      const path = `${activePane.getCurrentPath()}/${name}`;
      await this.context.fs.mkdir(path, { recursive: true });
      activePane.refresh();
    } catch (error) {
      alert(`Failed to create folder: ${error.message}`);
    }
  }

  async _copyFiles() {
    const sourcePane = this.activePane === 'left' ? this.leftPane : this.rightPane;
    const destPane = this.activePane === 'left' ? this.rightPane : this.leftPane;

    const selectedFiles = sourcePane.getSelectedFiles();
    if (selectedFiles.length === 0) {
      alert('No files selected');
      return;
    }

    try {
      for (const filename of selectedFiles) {
        const srcPath = `${sourcePane.getCurrentPath()}/${filename}`;
        const destPath = `${destPane.getCurrentPath()}/${filename}`;
        await this.context.fs.copy(srcPath, destPath);
      }

      destPane.refresh();
      alert(`Copied ${selectedFiles.length} file(s)`);
    } catch (error) {
      alert(`Copy failed: ${error.message}`);
    }
  }

  async _moveFiles() {
    const sourcePane = this.activePane === 'left' ? this.leftPane : this.rightPane;
    const destPane = this.activePane === 'left' ? this.rightPane : this.leftPane;

    const selectedFiles = sourcePane.getSelectedFiles();
    if (selectedFiles.length === 0) {
      alert('No files selected');
      return;
    }

    try {
      for (const filename of selectedFiles) {
        const srcPath = `${sourcePane.getCurrentPath()}/${filename}`;
        const destPath = `${destPane.getCurrentPath()}/${filename}`;
        await this.context.fs.rename(srcPath, destPath);
      }

      sourcePane.clearSelection();
      sourcePane.refresh();
      destPane.refresh();
      alert(`Moved ${selectedFiles.length} file(s)`);
    } catch (error) {
      alert(`Move failed: ${error.message}`);
    }
  }

  async _deleteFiles() {
    const activePane = this.activePane === 'left' ? this.leftPane : this.rightPane;
    const selectedFiles = activePane.getSelectedFiles();

    if (selectedFiles.length === 0) {
      alert('No files selected');
      return;
    }

    if (!confirm(`Delete ${selectedFiles.length} file(s)?`)) {
      return;
    }

    try {
      for (const filename of selectedFiles) {
        const path = `${activePane.getCurrentPath()}/${filename}`;
        const stats = await this.context.fs.stat(path);

        if (stats.type === 'directory') {
          await this.context.fs.rmdir(path, { recursive: true });
        } else {
          await this.context.fs.unlink(path);
        }
      }

      activePane.clearSelection();
      activePane.refresh();
      if (this.previewPane) {
        this.previewPane.clear();
      }
    } catch (error) {
      alert(`Delete failed: ${error.message}`);
    }
  }

  async _renameFile() {
    const activePane = this.activePane === 'left' ? this.leftPane : this.rightPane;
    const selectedFiles = activePane.getSelectedFiles();

    if (selectedFiles.length !== 1) {
      alert('Please select exactly one file to rename');
      return;
    }

    const oldName = selectedFiles[0];
    const newName = prompt('Enter new name:', oldName);

    if (!newName || newName === oldName) return;

    try {
      const oldPath = `${activePane.getCurrentPath()}/${oldName}`;
      const newPath = `${activePane.getCurrentPath()}/${newName}`;
      await this.context.fs.rename(oldPath, newPath);
      activePane.clearSelection();
      activePane.refresh();
    } catch (error) {
      alert(`Rename failed: ${error.message}`);
    }
  }

  _togglePreview() {
    this.showPreview = !this.showPreview;
    this._refreshUI();
  }

  _addBookmark() {
    const activePane = this.activePane === 'left' ? this.leftPane : this.rightPane;
    const path = activePane.getCurrentPath();

    const name = prompt('Enter bookmark name:', path.split('/').pop() || 'Root');
    if (!name) return;

    try {
      this.bookmarkManager.addBookmark(name, path);
      this._refreshUI();
    } catch (error) {
      alert(error.message);
    }
  }

  _refreshAll() {
    if (this.leftPane) this.leftPane.refresh();
    if (this.rightPane) this.rightPane.refresh();
    if (this.previewPane) this.previewPane.clear();
  }

  async _performSearch(query) {
    if (!query.trim()) {
      alert('Please enter a search query');
      return;
    }

    const activePane = this.activePane === 'left' ? this.leftPane : this.rightPane;
    const searchPath = activePane.getCurrentPath();

    try {
      const results = await this.searchEngine.search(searchPath, {
        query: query.trim(),
        maxResults: 100
      });

      this._showSearchResults(results, query);
    } catch (error) {
      alert(`Search failed: ${error.message}`);
    }
  }

  _showSearchResults(results, query) {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #fff;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      width: 600px;
      max-height: 500px;
      display: flex;
      flex-direction: column;
      z-index: 10000;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      padding: 15px;
      border-bottom: 1px solid #ddd;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <span>Search Results: "${query}" (${results.length} found)</span>
      <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.5em; cursor: pointer;">×</button>
    `;

    const resultsList = document.createElement('div');
    resultsList.style.cssText = 'flex: 1; overflow-y: auto; padding: 10px;';

    if (results.length === 0) {
      resultsList.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">No results found</div>';
    } else {
      results.forEach(result => {
        const item = document.createElement('div');
        item.style.cssText = `
          padding: 10px;
          border-bottom: 1px solid #eee;
          cursor: pointer;
          transition: background 0.2s;
        `;

        item.addEventListener('mouseenter', () => {
          item.style.background = '#f5f5f5';
        });

        item.addEventListener('mouseleave', () => {
          item.style.background = 'transparent';
        });

        item.addEventListener('click', () => {
          const activePane = this.activePane === 'left' ? this.leftPane : this.rightPane;
          const dir = result.path.substring(0, result.path.lastIndexOf('/')) || '/';
          activePane.navigateTo(dir);
          dialog.remove();
        });

        item.innerHTML = `
          <div style="font-weight: bold;">${result.name}</div>
          <div style="font-size: 0.85em; color: #666;">${result.path}</div>
          <div style="font-size: 0.8em; color: #999;">${result.type} • ${this._formatSize(result.size || 0)}</div>
        `;

        resultsList.appendChild(item);
      });
    }

    dialog.appendChild(header);
    dialog.appendChild(resultsList);

    // Add overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
    `;
    overlay.addEventListener('click', () => {
      dialog.remove();
      overlay.remove();
    });

    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
  }

  async _showProperties() {
    const activePane = this.activePane === 'left' ? this.leftPane : this.rightPane;
    const selectedFiles = activePane.getSelectedFiles();

    if (selectedFiles.length !== 1) {
      alert('Please select exactly one file to view properties');
      return;
    }

    const filename = selectedFiles[0];
    const filePath = `${activePane.getCurrentPath()}/${filename}`;

    try {
      const stats = await this.context.fs.stat(filePath);

      const dialog = document.createElement('div');
      dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        width: 400px;
        z-index: 10000;
      `;

      dialog.innerHTML = `
        <div style="padding: 15px; border-bottom: 1px solid #ddd; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
          <span>File Properties</span>
          <button onclick="this.parentElement.parentElement.remove(); document.querySelector('.overlay').remove();" style="background: none; border: none; font-size: 1.5em; cursor: pointer;">×</button>
        </div>
        <div style="padding: 20px;">
          <div style="margin-bottom: 15px;">
            <strong>Name:</strong><br/>
            <div style="margin-top: 5px; padding: 8px; background: #f5f5f5; border-radius: 4px; word-break: break-all;">${filename}</div>
          </div>
          <div style="margin-bottom: 15px;">
            <strong>Path:</strong><br/>
            <div style="margin-top: 5px; padding: 8px; background: #f5f5f5; border-radius: 4px; word-break: break-all;">${filePath}</div>
          </div>
          <div style="margin-bottom: 10px;"><strong>Type:</strong> ${stats.type}</div>
          <div style="margin-bottom: 10px;"><strong>Size:</strong> ${this._formatSize(stats.size || 0)}</div>
          <div style="margin-bottom: 10px;"><strong>Modified:</strong> ${new Date(stats.modified).toLocaleString()}</div>
          ${stats.created ? `<div style="margin-bottom: 10px;"><strong>Created:</strong> ${new Date(stats.created).toLocaleString()}</div>` : ''}
          ${stats.permissions ? `<div style="margin-bottom: 10px;"><strong>Permissions:</strong> ${stats.permissions}</div>` : ''}
        </div>
      `;

      const overlay = document.createElement('div');
      overlay.className = 'overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
      `;
      overlay.addEventListener('click', () => {
        dialog.remove();
        overlay.remove();
      });

      document.body.appendChild(overlay);
      document.body.appendChild(dialog);
    } catch (error) {
      alert(`Failed to get properties: ${error.message}`);
    }
  }

  _formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  _refreshUI() {
    const container = document.querySelector('.file-manager-v2-container');
    if (container && container.parentNode) {
      const newContainer = this.render();
      container.parentNode.replaceChild(newContainer, container);
    }
  }

  openFile(filePath, fileEntry) {
    // This could be extended to open files in appropriate applications
    console.log('Open file:', filePath, fileEntry);
    alert(`File: ${fileEntry.name}\nPath: ${filePath}\n\n(File opening to be implemented)`);
  }
}
