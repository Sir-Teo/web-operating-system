/**
 * Code Editor Application
 * Professional code editor with Monaco Editor integration
 */
import * as monaco from 'monaco-editor';
import { LanguageDetector } from './LanguageDetector.js';
import { ThemeManager } from './ThemeManager.js';
import { TabManager } from './TabManager.js';
import { FileTree } from './FileTree.js';
import { SearchPanel } from './SearchPanel.js';
import { SettingsPanel } from './SettingsPanel.js';
import { EditorPane } from './EditorPane.js';

export default class CodeEditor {
  constructor(context) {
    this.context = context;
    this.vfs = context.fs;
    this.languageDetector = new LanguageDetector();
    this.themeManager = null;
    this.tabManager = new TabManager(this.languageDetector);
    this.fileTree = null;
    this.searchPanel = null;
    this.settingsPanel = null;
    this.editorPane = null;
    this.container = null;
  }

  /**
   * Initialize the application
   */
  async init() {}

  /**
   * Render the application UI
   * @returns {HTMLElement} The application container
   */
  async render() {
    this.container = document.createElement('div');
    this.container.className = 'code-editor-app';
    this.container.innerHTML = this.getHTML();

    // Initialize Monaco theme manager
    this.themeManager = new ThemeManager(monaco);

    // Initialize editor pane
    const editorContainer = this.container.querySelector('.editor-container');
    this.editorPane = new EditorPane(editorContainer);
    this.editorPane.create();

    // Set up content change listener
    this.editorPane.onChange((tabId, content) => {
      this.tabManager.updateTabContent(tabId, content);
      this.updateTabBar();
    });

    // Initialize file tree
    const fileTreeContainer = this.container.querySelector('.file-tree-container');
    this.fileTree = new FileTree(
      this.vfs,
      (file) => this.openFile(file),
      (path) => this.deleteFile(path),
      (path, newName) => this.renameFile(path, newName)
    );
    await this.fileTree.render(fileTreeContainer);

    // Initialize search panel
    this.searchPanel = new SearchPanel(this.editorPane.getEditor());
    this.searchPanel.initialize(this.container);

    // Initialize settings panel
    this.settingsPanel = new SettingsPanel(this.editorPane.getEditor(), this.themeManager);
    this.settingsPanel.initialize(this.container);

    // Apply saved settings
    this.settingsPanel.applySettings();

    // Setup tab change listener
    this.tabManager.onChange(() => {
      this.updateTabBar();
      this.updateActiveTab();
    });

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Setup toolbar events
    this.setupToolbar();

    // Initial render
    this.updateTabBar();

    return this.container;
  }

  /**
   * Get HTML template
   * @returns {string} HTML string
   */
  getHTML() {
    return `
      <div class="code-editor-layout">
        <!-- Toolbar -->
        <div class="code-editor-toolbar">
          <div class="toolbar-group">
            <button class="toolbar-btn" id="new-file-btn" title="New File (Ctrl+N)">
              📄 New
            </button>
            <button class="toolbar-btn" id="open-file-btn" title="Open File (Ctrl+O)">
              📂 Open
            </button>
            <button class="toolbar-btn" id="save-file-btn" title="Save (Ctrl+S)">
              💾 Save
            </button>
            <button class="toolbar-btn" id="save-all-btn" title="Save All (Ctrl+Shift+S)">
              💾 Save All
            </button>
          </div>
          <div class="toolbar-group">
            <button class="toolbar-btn" id="find-btn" title="Find (Ctrl+F)">
              🔍 Find
            </button>
            <button class="toolbar-btn" id="replace-btn" title="Replace (Ctrl+H)">
              🔄 Replace
            </button>
          </div>
          <div class="toolbar-group">
            <button class="toolbar-btn" id="settings-btn" title="Settings">
              ⚙️ Settings
            </button>
          </div>
        </div>

        <!-- Main content -->
        <div class="code-editor-content">
          <!-- Sidebar -->
          <div class="code-editor-sidebar">
            <div class="sidebar-header">
              <h3>Files</h3>
              <button class="sidebar-btn" id="refresh-tree-btn" title="Refresh">🔄</button>
            </div>
            <div class="file-tree-container"></div>
          </div>

          <!-- Editor area -->
          <div class="code-editor-main">
            <!-- Tab bar -->
            <div class="code-editor-tabs" id="editor-tabs"></div>

            <!-- Editor container -->
            <div class="editor-container"></div>

            <!-- Status bar -->
            <div class="code-editor-status-bar" id="editor-status-bar">
              <span>Ready</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup toolbar event handlers
   */
  setupToolbar() {
    // New file
    this.container.querySelector('#new-file-btn')?.addEventListener('click', () => {
      this.createNewFile();
    });

    // Open file
    this.container.querySelector('#open-file-btn')?.addEventListener('click', () => {
      // This would open a file picker dialog
      alert('Use the file tree on the left to open files');
    });

    // Save file
    this.container.querySelector('#save-file-btn')?.addEventListener('click', () => {
      this.saveCurrentFile();
    });

    // Save all
    this.container.querySelector('#save-all-btn')?.addEventListener('click', () => {
      this.saveAllFiles();
    });

    // Find
    this.container.querySelector('#find-btn')?.addEventListener('click', () => {
      this.searchPanel.show();
    });

    // Replace
    this.container.querySelector('#replace-btn')?.addEventListener('click', () => {
      this.searchPanel.show();
    });

    // Settings
    this.container.querySelector('#settings-btn')?.addEventListener('click', () => {
      this.settingsPanel.toggle();
    });

    // Refresh tree
    this.container.querySelector('#refresh-tree-btn')?.addEventListener('click', async () => {
      await this.fileTree.refresh();
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+N - New file
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        this.createNewFile();
      }

      // Ctrl+S - Save
      if (e.ctrlKey && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        this.saveCurrentFile();
      }

      // Ctrl+Shift+S - Save all
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        this.saveAllFiles();
      }

      // Ctrl+F - Find
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        this.searchPanel.show();
      }

      // Ctrl+H - Replace
      if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        this.searchPanel.show();
      }

      // Ctrl+W - Close tab
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        const activeTab = this.tabManager.getActiveTab();
        if (activeTab) {
          this.tabManager.closeTab(activeTab.id);
        }
      }

      // Ctrl+, - Settings
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        this.settingsPanel.toggle();
      }
    });
  }

  /**
   * Update tab bar
   */
  updateTabBar() {
    const tabBar = this.container.querySelector('#editor-tabs');
    if (!tabBar) return;

    const tabs = this.tabManager.getAllTabs();
    const activeTab = this.tabManager.getActiveTab();

    if (tabs.length === 0) {
      tabBar.innerHTML = '<div class="no-tabs">No files open</div>';
      return;
    }

    tabBar.innerHTML = tabs.map(tab => `
      <div class="editor-tab ${tab.id === activeTab?.id ? 'active' : ''}" data-tab-id="${tab.id}">
        <span class="tab-name">${tab.name}${tab.modified ? ' •' : ''}</span>
        <button class="tab-close" data-tab-id="${tab.id}">✕</button>
      </div>
    `).join('');

    // Attach tab event listeners
    tabBar.querySelectorAll('.editor-tab').forEach(tabEl => {
      const tabId = parseInt(tabEl.dataset.tabId);

      tabEl.querySelector('.tab-name')?.addEventListener('click', () => {
        this.tabManager.setActiveTab(tabId);
      });

      tabEl.querySelector('.tab-close')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.tabManager.closeTab(tabId);
      });
    });
  }

  /**
   * Update active tab in editor
   */
  updateActiveTab() {
    const activeTab = this.tabManager.getActiveTab();
    if (activeTab) {
      this.editorPane.loadTab(activeTab);
    } else {
      this.editorPane.setContent('');
    }
  }

  /**
   * Open a file
   * @param {Object} file - File object
   */
  openFile(file) {
    const tab = this.tabManager.openTab(file);
    this.editorPane.loadTab(tab);
  }

  /**
   * Create new file
   */
  createNewFile() {
    const filename = prompt('Enter filename:', 'untitled.txt');
    if (!filename) return;

    const path = `/home/user/${filename}`;
    const tab = this.tabManager.openTab({
      path,
      name: filename,
      content: ''
    });

    this.editorPane.loadTab(tab);
  }

  /**
   * Save current file
   */
  async saveCurrentFile() {
    const activeTab = this.tabManager.getActiveTab();
    if (!activeTab) {
      alert('No file to save');
      return;
    }

    try {
      await this.vfs.writeFile(activeTab.path, activeTab.content);
      this.tabManager.markTabAsSaved(activeTab.id);
      this.updateTabBar();
      this.showStatusMessage(`Saved: ${activeTab.name}`);
    } catch (error) {
      console.error('Error saving file:', error);
      alert(`Error saving file: ${error.message}`);
    }
  }

  /**
   * Save all files
   */
  async saveAllFiles() {
    const tabs = this.tabManager.getAllTabs();
    const modifiedTabs = tabs.filter(t => t.modified);

    if (modifiedTabs.length === 0) {
      this.showStatusMessage('No modified files to save');
      return;
    }

    let saved = 0;
    for (const tab of modifiedTabs) {
      try {
        await this.vfs.writeFile(tab.path, tab.content);
        this.tabManager.markTabAsSaved(tab.id);
        saved++;
      } catch (error) {
        console.error(`Error saving ${tab.path}:`, error);
        alert(`Error saving ${tab.name}: ${error.message}`);
      }
    }

    this.updateTabBar();
    this.showStatusMessage(`Saved ${saved} file(s)`);
  }

  /**
   * Delete a file
   * @param {string} path - File path
   */
  async deleteFile(path) {
    try {
      await this.vfs.unlink(path);
      await this.fileTree.refresh();

      // Close tab if open
      const tabs = this.tabManager.getAllTabs();
      const tab = tabs.find(t => t.path === path);
      if (tab) {
        this.tabManager.closeTab(tab.id);
      }

      this.showStatusMessage(`Deleted: ${path.split('/').pop()}`);
    } catch (error) {
      console.error('Error deleting file:', error);
      alert(`Error deleting file: ${error.message}`);
    }
  }

  /**
   * Rename a file
   * @param {string} oldPath - Old file path
   * @param {string} newName - New file name
   */
  async renameFile(oldPath, newName) {
    try {
      const dir = oldPath.substring(0, oldPath.lastIndexOf('/'));
      const newPath = `${dir}/${newName}`;

      // Read content
      const content = await this.vfs.readFile(oldPath, 'utf8');

      // Write to new path
      await this.vfs.writeFile(newPath, content);

      // Delete old file
      await this.vfs.unlink(oldPath);

      // Update file tree
      await this.fileTree.refresh();

      // Update tab if open
      const tabs = this.tabManager.getAllTabs();
      const tab = tabs.find(t => t.path === oldPath);
      if (tab) {
        tab.path = newPath;
        tab.name = newName;
        this.updateTabBar();
      }

      this.showStatusMessage(`Renamed to: ${newName}`);
    } catch (error) {
      console.error('Error renaming file:', error);
      alert(`Error renaming file: ${error.message}`);
    }
  }

  /**
   * Show status message
   * @param {string} message - Status message
   */
  showStatusMessage(message) {
    const statusBar = this.container.querySelector('#editor-status-bar');
    if (statusBar) {
      const originalContent = statusBar.innerHTML;
      statusBar.innerHTML = `<span>${message}</span>`;
      setTimeout(() => {
        statusBar.innerHTML = originalContent;
      }, 3000);
    }
  }

  /**
   * Destroy the application
   */
  destroy() {
    if (this.editorPane) {
      this.editorPane.dispose();
    }

    // Dispose all Monaco models
    monaco.editor.getModels().forEach(model => model.dispose());
  }
}
