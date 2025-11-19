/**
 * Editor Pane Component
 * Wraps a single Monaco Editor instance
 */
import * as monaco from 'monaco-editor';

export class EditorPane {
  constructor(container, options = {}) {
    this.container = container;
    this.editor = null;
    this.currentTab = null;
    this.changeCallback = null;
    this.options = {
      automaticLayout: true,
      fontSize: 14,
      lineNumbers: 'on',
      renderWhitespace: 'selection',
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      tabSize: 2,
      insertSpaces: true,
      formatOnPaste: true,
      formatOnType: true,
      minimap: { enabled: true },
      suggestOnTriggerCharacters: true,
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false
      },
      scrollbar: {
        vertical: 'visible',
        horizontal: 'visible',
        useShadows: false,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10
      },
      ...options
    };
  }

  /**
   * Create the Monaco editor
   */
  create() {
    if (this.editor) {
      return;
    }

    this.editor = monaco.editor.create(this.container, {
      value: '',
      language: 'plaintext',
      theme: 'webos-dark',
      ...this.options
    });

    // Setup change listener
    this.editor.onDidChangeModelContent(() => {
      if (this.changeCallback && this.currentTab) {
        const content = this.editor.getValue();
        this.changeCallback(this.currentTab.id, content);
      }
    });

    // Setup cursor position change listener
    this.editor.onDidChangeCursorPosition((e) => {
      this.updateStatusBar(e.position);
    });

    return this.editor;
  }

  /**
   * Load a tab into the editor
   * @param {Object} tab - Tab object
   */
  loadTab(tab) {
    if (!this.editor) {
      this.create();
    }

    // Save current tab state if exists
    if (this.currentTab) {
      this.saveTabState(this.currentTab);
    }

    this.currentTab = tab;

    // Create or get model for this file
    const uri = monaco.Uri.file(tab.path);
    let model = monaco.editor.getModel(uri);

    if (!model) {
      model = monaco.editor.createModel(tab.content, tab.language, uri);
    } else {
      // Update model if content changed
      if (model.getValue() !== tab.content) {
        model.setValue(tab.content);
      }
    }

    // Set the model
    this.editor.setModel(model);

    // Restore saved state
    if (tab.savedViewState) {
      this.editor.restoreViewState(tab.savedViewState);
    }

    if (tab.savedCursorPosition) {
      this.editor.setPosition(tab.savedCursorPosition);
    }

    // Focus the editor
    this.editor.focus();

    // Update status bar
    const position = this.editor.getPosition();
    if (position) {
      this.updateStatusBar(position);
    }
  }

  /**
   * Save current tab state
   * @param {Object} tab - Tab object
   */
  saveTabState(tab) {
    if (!this.editor || !tab) return;

    tab.savedViewState = this.editor.saveViewState();
    tab.savedCursorPosition = this.editor.getPosition();
  }

  /**
   * Get current content
   * @returns {string} Current editor content
   */
  getContent() {
    return this.editor ? this.editor.getValue() : '';
  }

  /**
   * Set content
   * @param {string} content - Content to set
   */
  setContent(content) {
    if (this.editor) {
      this.editor.setValue(content);
    }
  }

  /**
   * Get Monaco editor instance
   * @returns {monaco.editor.IStandaloneCodeEditor} Editor instance
   */
  getEditor() {
    return this.editor;
  }

  /**
   * Update editor options
   * @param {Object} options - Options to update
   */
  updateOptions(options) {
    if (this.editor) {
      this.editor.updateOptions(options);
    }
    this.options = { ...this.options, ...options };
  }

  /**
   * Focus the editor
   */
  focus() {
    if (this.editor) {
      this.editor.focus();
    }
  }

  /**
   * Layout the editor
   */
  layout() {
    if (this.editor) {
      this.editor.layout();
    }
  }

  /**
   * Set change callback
   * @param {Function} callback - Callback function(tabId, content)
   */
  onChange(callback) {
    this.changeCallback = callback;
  }

  /**
   * Update status bar with cursor position
   * @param {Object} position - Cursor position
   */
  updateStatusBar(position) {
    const statusBar = document.querySelector('#editor-status-bar');
    if (statusBar && position) {
      const lineNumber = position.lineNumber;
      const column = position.column;
      const selection = this.editor.getSelection();
      const model = this.editor.getModel();

      let selectionText = '';
      if (selection && !selection.isEmpty()) {
        const selectedText = model.getValueInRange(selection);
        const lines = selectedText.split('\n').length;
        const chars = selectedText.length;
        selectionText = ` (${lines} lines, ${chars} chars selected)`;
      }

      const totalLines = model.getLineCount();
      statusBar.innerHTML = `
        <span>Ln ${lineNumber}, Col ${column}${selectionText}</span>
        <span>${totalLines} lines</span>
        <span>${this.currentTab?.language || 'plaintext'}</span>
      `;
    }
  }

  /**
   * Dispose the editor
   */
  dispose() {
    if (this.currentTab) {
      this.saveTabState(this.currentTab);
    }

    if (this.editor) {
      this.editor.dispose();
      this.editor = null;
    }
  }

  /**
   * Execute action
   * @param {string} actionId - Action ID
   */
  executeAction(actionId) {
    if (this.editor) {
      this.editor.trigger('keyboard', actionId, null);
    }
  }

  /**
   * Get selection
   * @returns {monaco.Selection} Current selection
   */
  getSelection() {
    return this.editor ? this.editor.getSelection() : null;
  }

  /**
   * Set selection
   * @param {monaco.Selection} selection - Selection to set
   */
  setSelection(selection) {
    if (this.editor && selection) {
      this.editor.setSelection(selection);
    }
  }

  /**
   * Reveal line in center
   * @param {number} lineNumber - Line number to reveal
   */
  revealLineInCenter(lineNumber) {
    if (this.editor) {
      this.editor.revealLineInCenter(lineNumber);
    }
  }
}
