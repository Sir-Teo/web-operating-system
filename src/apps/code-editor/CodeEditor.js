/**
 * Code Editor Application
 * Professional code editor with Monaco Editor integration
 * VASTLY IMPROVED with advanced developer tools
 */
import * as monaco from 'monaco-editor';
import { LanguageDetector } from './LanguageDetector.js';
import { ThemeManager } from './ThemeManager.js';
import { TabManager } from './TabManager.js';
import { FileTree } from './FileTree.js';
import { SearchPanel } from './SearchPanel.js';
import { SettingsPanel } from './SettingsPanel.js';
import { EditorPane } from './EditorPane.js';
import { IntegratedTerminal } from './IntegratedTerminal.js';
import { CommandPalette } from './CommandPalette.js';
import { QuickOpen } from './QuickOpen.js';
import { GitPanel } from './GitPanel.js';

// NEW DEVELOPER FEATURES
import { SnippetsManager } from './SnippetsManager.js';
import { LivePreview } from './LivePreview.js';
import { CodeLinter } from './CodeLinter.js';
import { VisualDebugger } from './VisualDebugger.js';
import { ProjectTemplates } from './ProjectTemplates.js';
import { MultiLanguageREPL } from './MultiLanguageREPL.js';
import { CodeFormatter } from './CodeFormatter.js';
import { DeveloperDashboard } from './DeveloperDashboard.js';

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
    this.integratedTerminal = null;
    this.commandPalette = null;
    this.quickOpen = null;
    this.gitPanel = null;
    this.container = null;
    this.terminalVisible = true;
    this.terminalHeight = 300; // pixels
    this.keyboardShortcutsHandler = null; // Store reference for cleanup
    this.zenMode = false;
    this.minimapEnabled = true;
    this.breadcrumbsEnabled = true;
    this.wordWrap = 'off';
    this.fontSize = 14;

    // NEW DEVELOPER TOOLS
    this.snippetsManager = null;
    this.livePreview = null;
    this.codeLinter = null;
    this.visualDebugger = null;
    this.projectTemplates = null;
    this.multiLanguageREPL = null;
    this.codeFormatter = null;
    this.developerDashboard = null;

    // Store reference globally for file tree refresh
    window.currentCodeEditorInstance = this;
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

    // Apply additional styles for terminal layout
    this.applyTerminalStyles();

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

    // Initialize integrated terminal
    const terminalPanel = this.container.querySelector('#terminal-panel');
    this.integratedTerminal = new IntegratedTerminal(this.vfs, this.context);
    const terminalElement = this.integratedTerminal.render();
    terminalPanel.appendChild(terminalElement);

    // Listen for run file event from terminal
    terminalElement.addEventListener('run-file', () => {
      this.runCurrentFile();
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

    // Initialize command palette
    this.commandPalette = new CommandPalette(this.editorPane.getEditor(), this);
    this.commandPalette.initialize(this.container);

    // Initialize quick open
    this.quickOpen = new QuickOpen(this.vfs, (file) => this.openFile(file));
    await this.quickOpen.initialize(this.container);

    // Initialize git panel
    this.gitPanel = new GitPanel(this.vfs, this.context.kernel);
    this.gitPanel.initialize(this.container);

    // === INITIALIZE NEW DEVELOPER TOOLS ===

    // Initialize Snippets Manager
    this.snippetsManager = new SnippetsManager(this.editorPane.getEditor());
    this.snippetsManager.initialize(this.container);

    // Initialize Live Preview
    this.livePreview = new LivePreview(this.vfs, this.tabManager);
    this.livePreview.initialize(this.container);

    // Initialize Code Linter
    this.codeLinter = new CodeLinter(this.editorPane.getEditor());

    // Initialize Visual Debugger
    this.visualDebugger = new VisualDebugger(this.editorPane.getEditor(), this.vfs);
    this.visualDebugger.initialize(this.container);

    // Initialize Project Templates
    this.projectTemplates = new ProjectTemplates(this.vfs);
    this.projectTemplates.initialize(this.container);

    // Initialize Multi-Language REPL
    this.multiLanguageREPL = new MultiLanguageREPL();
    this.multiLanguageREPL.initialize(this.container);

    // Initialize Code Formatter
    this.codeFormatter = new CodeFormatter(this.editorPane.getEditor());

    // Initialize Developer Dashboard
    this.developerDashboard = new DeveloperDashboard();
    this.developerDashboard.initialize(this.container);

    // === END NEW DEVELOPER TOOLS ===

    // Apply saved settings
    this.settingsPanel.applySettings();

    // Setup tab change listener
    this.tabManager.onChange(() => {
      this.updateTabBar();
      this.updateActiveTab();

      // Trigger live preview refresh
      if (this.livePreview && this.livePreview.isVisible) {
        this.livePreview.triggerRefresh();
      }

      // Run linter on content
      this.runLinter();
    });

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Setup window controls
    this.setupWindowControls();

    // Setup toolbar events
    this.setupToolbar();

    // Setup panel resizer
    this.setupPanelResizer();

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
        <!-- Window Controls Bar -->
        <div class="window-controls-bar">
          <div class="window-title">
            <span class="window-icon">📝</span>
            <span class="window-title-text">Code Editor</span>
          </div>
          <div class="window-controls">
            <button class="window-control-btn minimize-btn" id="minimize-btn" title="Minimize">−</button>
            <button class="window-control-btn maximize-btn" id="maximize-btn" title="Maximize">□</button>
            <button class="window-control-btn close-btn" id="close-btn" title="Close">×</button>
          </div>
        </div>

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
            <button class="toolbar-btn" id="format-code-btn" title="Format Code (Shift+Alt+F)">
              ✨ Format
            </button>
          </div>
          <div class="toolbar-group">
            <button class="toolbar-btn" id="snippets-btn" title="Snippets (Ctrl+Shift+I)">
              📋 Snippets
            </button>
            <button class="toolbar-btn" id="live-preview-btn" title="Live Preview (Ctrl+Shift+V)">
              👁️ Preview
            </button>
            <button class="toolbar-btn" id="debugger-btn" title="Debugger (F5)">
              🐛 Debug
            </button>
            <button class="toolbar-btn" id="repl-btn" title="REPL (Ctrl+Shift+R)">
              ⚡ REPL
            </button>
          </div>
          <div class="toolbar-group">
            <button class="toolbar-btn" id="new-project-btn" title="New Project (Ctrl+Shift+N)">
              📦 New Project
            </button>
            <button class="toolbar-btn" id="dashboard-btn" title="Dashboard (Ctrl+Shift+D)">
              📊 Dashboard
            </button>
          </div>
          <div class="toolbar-group">
            <button class="toolbar-btn" id="toggle-terminal-btn" title="Toggle Terminal (Ctrl+\`)">
              💻 Terminal
            </button>
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

          <!-- Editor area with split panel -->
          <div class="code-editor-main">
            <!-- Editor section -->
            <div class="editor-section" id="editor-section">
              <!-- Tab bar -->
              <div class="code-editor-tabs" id="editor-tabs"></div>

              <!-- Editor container -->
              <div class="editor-container"></div>
            </div>

            <!-- Resizer -->
            <div class="panel-resizer" id="panel-resizer" style="display: ${this.terminalVisible ? 'block' : 'none'}"></div>

            <!-- Terminal panel -->
            <div class="terminal-panel" id="terminal-panel" style="display: ${this.terminalVisible ? 'flex' : 'none'}; height: ${this.terminalHeight}px"></div>

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
   * Setup window controls event handlers
   */
  setupWindowControls() {
    // Close button
    this.container.querySelector('#close-btn')?.addEventListener('click', () => {
      if (this.context && this.context.closeWindow) {
        this.context.closeWindow();
      } else {
        // Fallback: emit close event
        this.container.dispatchEvent(new CustomEvent('close-window'));
      }
    });

    // Minimize button
    this.container.querySelector('#minimize-btn')?.addEventListener('click', () => {
      if (this.context && this.context.minimizeWindow) {
        this.context.minimizeWindow();
      } else {
        // Fallback: emit minimize event
        this.container.dispatchEvent(new CustomEvent('minimize-window'));
      }
    });

    // Maximize button
    this.container.querySelector('#maximize-btn')?.addEventListener('click', () => {
      if (this.context && this.context.maximizeWindow) {
        this.context.maximizeWindow();
      } else {
        // Fallback: emit maximize event
        this.container.dispatchEvent(new CustomEvent('maximize-window'));
      }
    });
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

    // Format code
    this.container.querySelector('#format-code-btn')?.addEventListener('click', () => {
      this.formatCode();
    });

    // === NEW FEATURE BUTTONS ===

    // Snippets
    this.container.querySelector('#snippets-btn')?.addEventListener('click', () => {
      this.snippetsManager?.toggle();
    });

    // Live Preview
    this.container.querySelector('#live-preview-btn')?.addEventListener('click', () => {
      this.livePreview?.toggle();
    });

    // Debugger
    this.container.querySelector('#debugger-btn')?.addEventListener('click', () => {
      this.visualDebugger?.toggle();
    });

    // REPL
    this.container.querySelector('#repl-btn')?.addEventListener('click', () => {
      this.multiLanguageREPL?.toggle();
    });

    // New Project
    this.container.querySelector('#new-project-btn')?.addEventListener('click', () => {
      this.projectTemplates?.show();
    });

    // Dashboard
    this.container.querySelector('#dashboard-btn')?.addEventListener('click', () => {
      this.developerDashboard?.toggle();
    });

    // === END NEW FEATURE BUTTONS ===

    // Settings
    this.container.querySelector('#settings-btn')?.addEventListener('click', () => {
      this.settingsPanel.toggle();
    });

    // Refresh tree
    this.container.querySelector('#refresh-tree-btn')?.addEventListener('click', async () => {
      await this.fileTree.refresh();
    });

    // Toggle terminal
    this.container.querySelector('#toggle-terminal-btn')?.addEventListener('click', () => {
      this.toggleTerminal();
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    this.keyboardShortcutsHandler = (e) => {
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

      // Ctrl+` - Toggle terminal
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        this.toggleTerminal();
      }

      // Ctrl+Shift+R - Run file
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        this.runCurrentFile();
      }

      // Ctrl+Shift+P - Command Palette
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        this.commandPalette.toggle();
      }

      // Ctrl+P - Quick Open
      if (e.ctrlKey && e.key === 'p' && !e.shiftKey) {
        e.preventDefault();
        this.quickOpen.toggle();
      }

      // Ctrl+Shift+G - Git panel
      if (e.ctrlKey && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        this.gitPanel.toggle();
      }

      // Alt+Z - Toggle word wrap
      if (e.altKey && e.key === 'z') {
        e.preventDefault();
        this.toggleWordWrap();
      }

      // Ctrl+= - Increase font size
      if (e.ctrlKey && e.key === '=') {
        e.preventDefault();
        this.changeFontSize(1);
      }

      // Ctrl+- - Decrease font size
      if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        this.changeFontSize(-1);
      }

      // Ctrl+K Z - Zen mode (two-key sequence)
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        // Wait for next key
        const zenHandler = (e2) => {
          if (e2.key === 'z' || e2.key === 'Z') {
            e2.preventDefault();
            this.toggleZenMode();
          }
          document.removeEventListener('keydown', zenHandler);
        };
        setTimeout(() => {
          document.addEventListener('keydown', zenHandler, { once: true });
        }, 100);
      }

      // === NEW FEATURE SHORTCUTS ===

      // Ctrl+Shift+I - Snippets
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        this.snippetsManager?.toggle();
      }

      // Ctrl+Shift+V - Live Preview
      if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        this.livePreview?.toggle();
      }

      // F5 - Run in debugger
      if (e.key === 'F5') {
        e.preventDefault();
        this.visualDebugger?.show();
      }

      // Ctrl+Shift+R - Toggle REPL (note: overrides run file, REPL is more useful)
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        this.multiLanguageREPL?.toggle();
      }

      // Ctrl+Shift+N - New Project
      if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        this.projectTemplates?.show();
      }

      // Ctrl+Shift+D - Developer Dashboard
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        this.developerDashboard?.toggle();
      }

      // Shift+Alt+F - Format code
      if (e.shiftKey && e.altKey && e.key === 'F') {
        e.preventDefault();
        this.formatCode();
      }

      // === END NEW FEATURE SHORTCUTS ===
    };

    document.addEventListener('keydown', this.keyboardShortcutsHandler);
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
   * Apply terminal styles
   */
  applyTerminalStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .code-editor-main {
        position: relative;
        display: flex;
        flex-direction: column;
      }

      .editor-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .panel-resizer {
        height: 4px;
        background: #3e3e42;
        cursor: ns-resize;
        transition: background 0.2s;
        flex-shrink: 0;
      }

      .panel-resizer:hover {
        background: #007acc;
      }

      .terminal-panel {
        flex-shrink: 0;
        overflow: hidden;
      }

      .code-editor-status-bar {
        flex-shrink: 0;
      }
    `;
    this.container.appendChild(style);
  }

  /**
   * Setup panel resizer
   */
  setupPanelResizer() {
    const resizer = this.container.querySelector('#panel-resizer');
    const terminalPanel = this.container.querySelector('#terminal-panel');
    const editorSection = this.container.querySelector('#editor-section');

    if (!resizer || !terminalPanel || !editorSection) return;

    let isResizing = false;
    let startY = 0;
    let startHeight = 0;

    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      startY = e.clientY;
      startHeight = terminalPanel.offsetHeight;
      document.body.style.cursor = 'ns-resize';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;

      const delta = startY - e.clientY;
      const newHeight = Math.max(100, Math.min(600, startHeight + delta));
      this.terminalHeight = newHeight;
      terminalPanel.style.height = `${newHeight}px`;

      // Trigger Monaco editor resize
      if (this.editorPane && this.editorPane.getEditor()) {
        this.editorPane.getEditor().layout();
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
      }
    });
  }

  /**
   * Toggle terminal visibility
   */
  toggleTerminal() {
    this.terminalVisible = !this.terminalVisible;
    const terminalPanel = this.container.querySelector('#terminal-panel');
    const resizer = this.container.querySelector('#panel-resizer');

    if (terminalPanel && resizer) {
      terminalPanel.style.display = this.terminalVisible ? 'flex' : 'none';
      resizer.style.display = this.terminalVisible ? 'block' : 'none';

      // Trigger Monaco editor resize
      setTimeout(() => {
        if (this.editorPane && this.editorPane.getEditor()) {
          this.editorPane.getEditor().layout();
        }
      }, 0);

      // Focus terminal if visible
      if (this.terminalVisible && this.integratedTerminal) {
        this.integratedTerminal.focus();
      }
    }
  }

  /**
   * Run current file in terminal
   */
  async runCurrentFile() {
    const activeTab = this.tabManager.getActiveTab();
    if (!activeTab) {
      alert('No file is open');
      return;
    }

    // Ensure terminal is visible
    if (!this.terminalVisible) {
      this.toggleTerminal();
    }

    // Get file content and name
    const content = activeTab.content;
    const filename = activeTab.name;

    // Run in terminal
    if (this.integratedTerminal) {
      await this.integratedTerminal.runFile(content, filename);
    }
  }

  /**
   * Toggle minimap
   */
  toggleMinimap() {
    this.minimapEnabled = !this.minimapEnabled;
    const editor = this.editorPane?.getEditor();
    if (editor) {
      editor.updateOptions({
        minimap: { enabled: this.minimapEnabled }
      });
      this.showStatusMessage(`Minimap ${this.minimapEnabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Toggle breadcrumbs
   */
  toggleBreadcrumbs() {
    this.breadcrumbsEnabled = !this.breadcrumbsEnabled;
    const editor = this.editorPane?.getEditor();
    if (editor) {
      editor.updateOptions({
        'breadcrumbs.enabled': this.breadcrumbsEnabled
      });
      this.showStatusMessage(`Breadcrumbs ${this.breadcrumbsEnabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Toggle zen mode
   */
  toggleZenMode() {
    this.zenMode = !this.zenMode;

    // Toggle sidebar and toolbar visibility
    const sidebar = this.container.querySelector('.code-editor-sidebar');
    const toolbar = this.container.querySelector('.code-editor-toolbar');
    const windowControls = this.container.querySelector('.window-controls-bar');
    const tabs = this.container.querySelector('.code-editor-tabs');

    if (this.zenMode) {
      // Enter zen mode
      if (sidebar) sidebar.style.display = 'none';
      if (toolbar) toolbar.style.display = 'none';
      if (windowControls) windowControls.style.display = 'none';
      if (tabs) tabs.style.display = 'none';

      // Hide terminal if visible
      if (this.terminalVisible) {
        this.toggleTerminal();
      }

      this.showStatusMessage('Zen Mode enabled - Press Ctrl+K Z to exit');
    } else {
      // Exit zen mode
      if (sidebar) sidebar.style.display = 'flex';
      if (toolbar) toolbar.style.display = 'flex';
      if (windowControls) windowControls.style.display = 'flex';
      if (tabs) tabs.style.display = 'flex';

      this.showStatusMessage('Zen Mode disabled');
    }

    // Trigger editor resize
    setTimeout(() => {
      const editor = this.editorPane?.getEditor();
      if (editor) editor.layout();
    }, 100);
  }

  /**
   * Toggle word wrap
   */
  toggleWordWrap() {
    this.wordWrap = this.wordWrap === 'off' ? 'on' : 'off';
    const editor = this.editorPane?.getEditor();
    if (editor) {
      editor.updateOptions({
        wordWrap: this.wordWrap
      });
      this.showStatusMessage(`Word wrap ${this.wordWrap === 'on' ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Change font size
   * @param {number} delta - Change amount (+1 or -1)
   */
  changeFontSize(delta) {
    this.fontSize = Math.max(8, Math.min(32, this.fontSize + delta));
    const editor = this.editorPane?.getEditor();
    if (editor) {
      editor.updateOptions({
        fontSize: this.fontSize
      });
      this.showStatusMessage(`Font size: ${this.fontSize}px`);
    }
  }

  /**
   * Show git panel
   */
  showGitPanel() {
    if (this.gitPanel) {
      this.gitPanel.show();
    }
  }

  /**
   * Git commit shortcut
   */
  async gitCommit() {
    if (this.gitPanel) {
      this.gitPanel.show();
      // Trigger commit action
      const commitBtn = this.container.querySelector('#git-commit-btn');
      if (commitBtn) {
        commitBtn.click();
      }
    }
  }

  // === NEW DEVELOPER TOOL METHODS ===

  /**
   * Format current code
   */
  formatCode() {
    if (!this.codeFormatter) return;

    const result = this.codeFormatter.formatEditor();
    if (result && result.success) {
      this.showStatusMessage(result.message);
    } else if (result && !result.success) {
      this.showStatusMessage(result.message);
      alert(result.message);
    }
  }

  /**
   * Run linter on current code
   */
  runLinter() {
    if (!this.codeLinter) return;

    const activeTab = this.tabManager.getActiveTab();
    if (!activeTab) return;

    const model = this.editorPane?.getEditor()?.getModel();
    if (!model) return;

    const code = model.getValue();
    const language = model.getLanguageId();

    // Run linter
    const issues = this.codeLinter.lint(code, language);

    // Update status bar with issue count
    if (issues.length > 0) {
      const errors = issues.filter(i => i.severity === 'error').length;
      const warnings = issues.filter(i => i.severity === 'warning').length;
      this.showStatusMessage(`Linter: ${errors} errors, ${warnings} warnings`);
    }
  }

  // === END NEW DEVELOPER TOOL METHODS ===

  /**
   * Destroy the application
   */
  destroy() {
    // Remove keyboard shortcuts listener
    if (this.keyboardShortcutsHandler) {
      document.removeEventListener('keydown', this.keyboardShortcutsHandler);
      this.keyboardShortcutsHandler = null;
    }

    // Dispose editor pane
    if (this.editorPane) {
      this.editorPane.dispose();
    }

    // Destroy terminal
    if (this.integratedTerminal) {
      this.integratedTerminal.destroy();
    }

    // Destroy search panel
    if (this.searchPanel) {
      this.searchPanel.destroy?.();
    }

    // Destroy settings panel
    if (this.settingsPanel) {
      this.settingsPanel.destroy?.();
    }

    // Destroy command palette
    if (this.commandPalette) {
      this.commandPalette.destroy?.();
    }

    // Destroy quick open
    if (this.quickOpen) {
      this.quickOpen.destroy?.();
    }

    // Destroy git panel
    if (this.gitPanel) {
      this.gitPanel.destroy?.();
    }

    // === DESTROY NEW DEVELOPER TOOLS ===

    // Destroy snippets manager
    if (this.snippetsManager) {
      this.snippetsManager.destroy?.();
    }

    // Destroy live preview
    if (this.livePreview) {
      this.livePreview.destroy?.();
    }

    // Destroy linter
    if (this.codeLinter) {
      this.codeLinter.destroy?.();
    }

    // Destroy debugger
    if (this.visualDebugger) {
      this.visualDebugger.destroy?.();
    }

    // Destroy project templates
    if (this.projectTemplates) {
      this.projectTemplates.destroy?.();
    }

    // Destroy REPL
    if (this.multiLanguageREPL) {
      this.multiLanguageREPL.destroy?.();
    }

    // Destroy developer dashboard
    if (this.developerDashboard) {
      this.developerDashboard.destroy?.();
    }

    // === END DESTROY NEW DEVELOPER TOOLS ===

    // Dispose all Monaco models
    monaco.editor.getModels().forEach(model => model.dispose());

    // Clear global reference
    if (window.currentCodeEditorInstance === this) {
      delete window.currentCodeEditorInstance;
    }
  }
}
