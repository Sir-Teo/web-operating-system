export default class WordProcessor {
  constructor(context) {
    this.context = context;
    this.currentFile = null;
    this.content = '';
    this.isModified = false;
    this.undoStack = [];
    this.redoStack = [];
    this.zoom = 100;
    this.autoSaveInterval = null;
  }

  async init() {
    // Initialize word processor with auto-save
    this.autoSaveInterval = setInterval(() => {
      if (this.isModified && this.currentFile) {
        this._autoSave();
      }
    }, 30000); // Auto-save every 30 seconds
  }

  destroy() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }

  render() {
    const container = document.createElement('div');
    container.className = 'word-processor-container';
    container.style.cssText = 'display:flex;flex-direction:column;height:100%;background:#f5f5f5;';

    // Menu bar
    const menuBar = this._createMenuBar();

    // Toolbar
    const toolbar = this._createToolbar();

    // Editor area
    const editorWrapper = document.createElement('div');
    editorWrapper.style.cssText = 'flex:1;overflow:auto;padding:40px;background:#e5e5e5;';
    this.editorWrapper = editorWrapper;

    const editor = document.createElement('div');
    editor.className = 'word-editor';
    editor.contentEditable = 'true';
    editor.spellcheck = true;
    editor.style.cssText = `
      min-height:1056px;
      width:816px;
      margin:0 auto;
      padding:96px;
      background:white;
      box-shadow:0 0 10px rgba(0,0,0,0.1);
      font-family:'Times New Roman', serif;
      font-size:12pt;
      line-height:1.5;
      outline:none;
      transform-origin:top center;
    `;
    editor.innerHTML = '<p>Start typing your document...</p>';

    editor.addEventListener('input', () => {
      this.isModified = true;
      this.content = editor.innerHTML;
      this._updateStats();
    });

    // Better paste handling - preserve some formatting
    editor.addEventListener('paste', (e) => {
      e.preventDefault();
      const html = e.clipboardData.getData('text/html');
      const text = e.clipboardData.getData('text/plain');

      if (html) {
        // Allow basic formatting from HTML paste
        const temp = document.createElement('div');
        temp.innerHTML = html;
        // Clean up unwanted tags but keep formatting
        const cleaned = this._cleanPastedHTML(temp);
        document.execCommand('insertHTML', false, cleaned);
      } else {
        document.execCommand('insertText', false, text);
      }
    });

    // Keyboard shortcuts
    editor.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            this._saveDocument();
            break;
          case 'f':
            e.preventDefault();
            this._showFindReplace();
            break;
          case 'z':
            if (!e.shiftKey) {
              e.preventDefault();
              this._undo();
            }
            break;
          case 'y':
            e.preventDefault();
            this._redo();
            break;
        }
      }
    });

    this.editor = editor;

    editorWrapper.appendChild(editor);

    // Status bar
    const statusBar = this._createStatusBar();

    container.appendChild(menuBar);
    container.appendChild(toolbar);
    container.appendChild(editorWrapper);
    container.appendChild(statusBar);

    this._updateStats();

    return container;
  }

  _cleanPastedHTML(element) {
    // Keep only basic formatting tags
    const allowedTags = ['B', 'I', 'U', 'STRONG', 'EM', 'P', 'BR', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'A'];
    const result = [];

    const cleanNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toUpperCase();
        if (allowedTags.includes(tagName)) {
          const children = Array.from(node.childNodes).map(cleanNode).join('');
          return `<${tagName.toLowerCase()}>${children}</${tagName.toLowerCase()}>`;
        } else {
          return Array.from(node.childNodes).map(cleanNode).join('');
        }
      }
      return '';
    };

    return Array.from(element.childNodes).map(cleanNode).join('');
  }

  _createMenuBar() {
    const menuBar = document.createElement('div');
    menuBar.className = 'word-menu-bar';
    menuBar.style.cssText = 'padding:8px 10px;background:#2c5aa0;color:white;display:flex;gap:20px;font-size:14px;user-select:none;';

    const menus = [
      { label: 'File', handler: (el) => this._showFileMenu(el) },
      { label: 'Edit', handler: (el) => this._showEditMenu(el) },
      { label: 'Insert', handler: (el) => this._showInsertMenu(el) },
      { label: 'Format', handler: (el) => this._showFormatMenu(el) },
      { label: 'Tools', handler: (el) => this._showToolsMenu(el) },
      { label: 'Help', handler: () => this._showHelp() }
    ];

    menus.forEach(menu => {
      const menuItem = document.createElement('span');
      menuItem.textContent = menu.label;
      menuItem.style.cssText = 'cursor:pointer;padding:5px 10px;border-radius:3px;';
      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.background = 'rgba(255,255,255,0.2)';
      });
      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.background = 'transparent';
      });
      menuItem.addEventListener('click', () => menu.handler(menuItem));
      menuBar.appendChild(menuItem);
    });

    return menuBar;
  }

  _showFileMenu(anchor) {
    this._removeExistingMenus();

    const menu = this._createDropdownMenu([
      { label: 'New', shortcut: '', action: () => this._newDocument() },
      { label: 'Open...', shortcut: '', action: () => this._openDocument() },
      { divider: true },
      { label: 'Save', shortcut: 'Ctrl+S', action: () => this._saveDocument() },
      { label: 'Save As...', shortcut: '', action: () => this._saveDocumentAs() },
      { divider: true },
      { label: 'Export as HTML', shortcut: '', action: () => this._exportHTML() },
      { label: 'Export as PDF', shortcut: '', action: () => this._exportPDF() },
      { divider: true },
      { label: 'Print', shortcut: 'Ctrl+P', action: () => this._print() }
    ]);

    this._positionMenu(menu, anchor);
  }

  _showEditMenu(anchor) {
    this._removeExistingMenus();

    const menu = this._createDropdownMenu([
      { label: 'Undo', shortcut: 'Ctrl+Z', action: () => this._undo() },
      { label: 'Redo', shortcut: 'Ctrl+Y', action: () => this._redo() },
      { divider: true },
      { label: 'Cut', shortcut: 'Ctrl+X', action: () => document.execCommand('cut') },
      { label: 'Copy', shortcut: 'Ctrl+C', action: () => document.execCommand('copy') },
      { label: 'Paste', shortcut: 'Ctrl+V', action: () => document.execCommand('paste') },
      { divider: true },
      { label: 'Find & Replace', shortcut: 'Ctrl+F', action: () => this._showFindReplace() },
      { label: 'Select All', shortcut: 'Ctrl+A', action: () => document.execCommand('selectAll') }
    ]);

    this._positionMenu(menu, anchor);
  }

  _showInsertMenu(anchor) {
    this._removeExistingMenus();

    const menu = this._createDropdownMenu([
      { label: 'Table...', action: () => this._insertTable() },
      { label: 'Image...', action: () => this._insertImage() },
      { label: 'Horizontal Line', action: () => this._insertHR() },
      { label: 'Page Break', action: () => this._insertPageBreak() },
      { divider: true },
      { label: 'Link...', action: () => this._insertLink() },
      { label: 'Special Character...', action: () => this._insertSpecialChar() }
    ]);

    this._positionMenu(menu, anchor);
  }

  _showFormatMenu(anchor) {
    this._removeExistingMenus();

    const menu = this._createDropdownMenu([
      { label: 'Heading 1', action: () => document.execCommand('formatBlock', false, 'h1') },
      { label: 'Heading 2', action: () => document.execCommand('formatBlock', false, 'h2') },
      { label: 'Heading 3', action: () => document.execCommand('formatBlock', false, 'h3') },
      { label: 'Normal Text', action: () => document.execCommand('formatBlock', false, 'p') },
      { divider: true },
      { label: 'Line Spacing 1.0', action: () => this._setLineHeight('1.0') },
      { label: 'Line Spacing 1.15', action: () => this._setLineHeight('1.15') },
      { label: 'Line Spacing 1.5', action: () => this._setLineHeight('1.5') },
      { label: 'Line Spacing 2.0', action: () => this._setLineHeight('2.0') }
    ]);

    this._positionMenu(menu, anchor);
  }

  _showToolsMenu(anchor) {
    this._removeExistingMenus();

    const menu = this._createDropdownMenu([
      { label: 'Word Count', action: () => this._showWordCount() },
      { label: 'Spell Check', action: () => this._toggleSpellCheck() },
      { divider: true },
      { label: 'Clear Formatting', action: () => this._clearFormatting() }
    ]);

    this._positionMenu(menu, anchor);
  }

  _createDropdownMenu(items) {
    const menu = document.createElement('div');
    menu.className = 'file-menu-dropdown';
    menu.style.cssText = `
      position:absolute;
      background:white;
      border:1px solid #ccc;
      box-shadow:0 2px 8px rgba(0,0,0,0.15);
      min-width:220px;
      z-index:10000;
      border-radius:4px;
      overflow:hidden;
    `;

    items.forEach(opt => {
      if (opt.divider) {
        const divider = document.createElement('div');
        divider.style.cssText = 'height:1px;background:#e0e0e0;margin:4px 0;';
        menu.appendChild(divider);
        return;
      }

      const item = document.createElement('div');
      item.style.cssText = 'padding:8px 15px;cursor:pointer;color:#333;display:flex;justify-content:space-between;align-items:center;';

      const label = document.createElement('span');
      label.textContent = opt.label;
      item.appendChild(label);

      if (opt.shortcut) {
        const shortcut = document.createElement('span');
        shortcut.textContent = opt.shortcut;
        shortcut.style.cssText = 'font-size:11px;color:#999;margin-left:20px;';
        item.appendChild(shortcut);
      }

      item.addEventListener('mouseenter', () => item.style.background = '#f0f0f0');
      item.addEventListener('mouseleave', () => item.style.background = 'white');
      item.addEventListener('click', () => {
        opt.action();
        menu.remove();
      });
      menu.appendChild(item);
    });

    return menu;
  }

  _positionMenu(menu, anchor) {
    const rect = anchor.getBoundingClientRect();
    menu.style.top = rect.bottom + 'px';
    menu.style.left = rect.left + 'px';

    document.body.appendChild(menu);

    setTimeout(() => {
      document.addEventListener('click', () => menu.remove(), { once: true });
    }, 0);
  }

  _removeExistingMenus() {
    const existing = document.querySelector('.file-menu-dropdown');
    if (existing) existing.remove();
  }

  _createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'word-toolbar';
    toolbar.style.cssText = 'padding:8px 10px;border-bottom:1px solid #ccc;background:white;display:flex;gap:5px;flex-wrap:wrap;align-items:center;';

    // Font family
    const fontSelect = document.createElement('select');
    fontSelect.style.cssText = 'padding:4px;border:1px solid #ccc;border-radius:3px;';
    ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Trebuchet MS', 'Comic Sans MS', 'Impact'].forEach(font => {
      const option = document.createElement('option');
      option.value = font;
      option.textContent = font;
      fontSelect.appendChild(option);
    });
    fontSelect.addEventListener('change', () => {
      document.execCommand('fontName', false, fontSelect.value);
      this.editor.focus();
    });

    // Font size
    const sizeSelect = document.createElement('select');
    sizeSelect.style.cssText = 'padding:4px;border:1px solid #ccc;border-radius:3px;';
    [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72].forEach(size => {
      const option = document.createElement('option');
      option.value = size;
      option.textContent = size;
      if (size === 12) option.selected = true;
      sizeSelect.appendChild(option);
    });
    sizeSelect.addEventListener('change', () => {
      document.execCommand('fontSize', false, '7');
      const fontElements = document.getElementsByTagName('font');
      for (let i = 0; i < fontElements.length; i++) {
        if (fontElements[i].size === '7') {
          fontElements[i].removeAttribute('size');
          fontElements[i].style.fontSize = sizeSelect.value + 'pt';
        }
      }
      this.editor.focus();
    });

    toolbar.appendChild(fontSelect);
    toolbar.appendChild(sizeSelect);
    toolbar.appendChild(this._createSeparator());

    // Formatting buttons
    const formatButtons = [
      { icon: '𝐁', command: 'bold', title: 'Bold (Ctrl+B)' },
      { icon: '𝐼', command: 'italic', title: 'Italic (Ctrl+I)' },
      { icon: '𝐔', command: 'underline', title: 'Underline (Ctrl+U)' },
      { icon: 'S̶', command: 'strikeThrough', title: 'Strikethrough' },
      { icon: 'X₂', command: 'subscript', title: 'Subscript' },
      { icon: 'X²', command: 'superscript', title: 'Superscript' }
    ];

    formatButtons.forEach(btn => {
      const button = this._createToolbarButton(btn.icon, btn.title, () => {
        document.execCommand(btn.command);
        this.editor.focus();
      });
      toolbar.appendChild(button);
    });

    toolbar.appendChild(this._createSeparator());

    // Alignment buttons
    const alignButtons = [
      { icon: '☰', command: 'justifyLeft', title: 'Align Left' },
      { icon: '☰', command: 'justifyCenter', title: 'Align Center' },
      { icon: '☰', command: 'justifyRight', title: 'Align Right' },
      { icon: '☰', command: 'justifyFull', title: 'Justify' }
    ];

    alignButtons.forEach(btn => {
      const button = this._createToolbarButton(btn.icon, btn.title, () => {
        document.execCommand(btn.command);
        this.editor.focus();
      });
      toolbar.appendChild(button);
    });

    toolbar.appendChild(this._createSeparator());

    // Indent buttons
    const indentButtons = [
      { icon: '⇥', command: 'indent', title: 'Increase Indent' },
      { icon: '⇤', command: 'outdent', title: 'Decrease Indent' }
    ];

    indentButtons.forEach(btn => {
      const button = this._createToolbarButton(btn.icon, btn.title, () => {
        document.execCommand(btn.command);
        this.editor.focus();
      });
      toolbar.appendChild(button);
    });

    toolbar.appendChild(this._createSeparator());

    // List buttons
    const listButtons = [
      { icon: '•', command: 'insertUnorderedList', title: 'Bullet List' },
      { icon: '1.', command: 'insertOrderedList', title: 'Numbered List' }
    ];

    listButtons.forEach(btn => {
      const button = this._createToolbarButton(btn.icon, btn.title, () => {
        document.execCommand(btn.command);
        this.editor.focus();
      });
      toolbar.appendChild(button);
    });

    toolbar.appendChild(this._createSeparator());

    // Color pickers
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.title = 'Text Color';
    colorInput.style.cssText = 'width:30px;height:30px;border:1px solid #ccc;cursor:pointer;border-radius:3px;';
    colorInput.addEventListener('change', () => {
      document.execCommand('foreColor', false, colorInput.value);
      this.editor.focus();
    });
    toolbar.appendChild(colorInput);

    const highlightInput = document.createElement('input');
    highlightInput.type = 'color';
    highlightInput.title = 'Highlight Color';
    highlightInput.value = '#ffff00';
    highlightInput.style.cssText = 'width:30px;height:30px;border:1px solid #ccc;cursor:pointer;border-radius:3px;';
    highlightInput.addEventListener('change', () => {
      document.execCommand('hiliteColor', false, highlightInput.value);
      this.editor.focus();
    });
    toolbar.appendChild(highlightInput);

    toolbar.appendChild(this._createSeparator());

    // Zoom controls
    const zoomOut = this._createToolbarButton('−', 'Zoom Out', () => this._adjustZoom(-10));
    const zoomLevel = document.createElement('span');
    zoomLevel.textContent = '100%';
    zoomLevel.style.cssText = 'padding:5px;min-width:45px;text-align:center;font-size:12px;';
    this.zoomLevel = zoomLevel;
    const zoomIn = this._createToolbarButton('+', 'Zoom In', () => this._adjustZoom(10));

    toolbar.appendChild(zoomOut);
    toolbar.appendChild(zoomLevel);
    toolbar.appendChild(zoomIn);

    return toolbar;
  }

  _createToolbarButton(icon, title, onClick) {
    const button = document.createElement('button');
    button.innerHTML = icon;
    button.title = title;
    button.style.cssText = 'padding:5px 10px;cursor:pointer;background:white;border:1px solid #ccc;border-radius:3px;font-size:14px;min-width:32px;transition:all 0.2s;';
    button.addEventListener('mouseenter', () => {
      button.style.background = '#f0f0f0';
      button.style.borderColor = '#999';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = 'white';
      button.style.borderColor = '#ccc';
    });
    button.addEventListener('click', (e) => {
      e.preventDefault();
      onClick();
    });
    return button;
  }

  _createSeparator() {
    const sep = document.createElement('div');
    sep.style.cssText = 'width:1px;height:24px;background:#ddd;margin:0 5px;';
    return sep;
  }

  _createStatusBar() {
    const statusBar = document.createElement('div');
    statusBar.className = 'word-status-bar';
    statusBar.style.cssText = 'padding:5px 10px;background:#f0f0f0;border-top:1px solid #ccc;font-size:12px;color:#666;display:flex;gap:20px;';

    const pageInfo = document.createElement('span');
    pageInfo.textContent = 'Page 1';
    this.pageInfo = pageInfo;

    const wordCount = document.createElement('span');
    wordCount.textContent = 'Words: 0';
    this.wordCount = wordCount;

    const charCount = document.createElement('span');
    charCount.textContent = 'Characters: 0';
    this.charCount = charCount;

    const saveStatus = document.createElement('span');
    saveStatus.textContent = '';
    saveStatus.style.cssText = 'margin-left:auto;color:#4CAF50;';
    this.saveStatus = saveStatus;

    statusBar.appendChild(pageInfo);
    statusBar.appendChild(wordCount);
    statusBar.appendChild(charCount);
    statusBar.appendChild(saveStatus);

    return statusBar;
  }

  _updateStats() {
    if (!this.editor) return;

    const text = this.editor.innerText || '';
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const chars = text.length;

    if (this.wordCount) this.wordCount.textContent = `Words: ${words}`;
    if (this.charCount) this.charCount.textContent = `Characters: ${chars}`;
  }

  _adjustZoom(delta) {
    this.zoom = Math.max(50, Math.min(200, this.zoom + delta));
    this.editor.style.transform = `scale(${this.zoom / 100})`;
    this.zoomLevel.textContent = `${this.zoom}%`;
  }

  _undo() {
    document.execCommand('undo');
  }

  _redo() {
    document.execCommand('redo');
  }

  _insertTable() {
    const rows = prompt('Number of rows:', '3');
    const cols = prompt('Number of columns:', '3');

    if (!rows || !cols) return;

    let table = '<table border="1" cellpadding="5" style="border-collapse:collapse;width:100%;margin:10px 0;"><tbody>';
    for (let i = 0; i < parseInt(rows); i++) {
      table += '<tr>';
      for (let j = 0; j < parseInt(cols); j++) {
        table += '<td>&nbsp;</td>';
      }
      table += '</tr>';
    }
    table += '</tbody></table>';

    document.execCommand('insertHTML', false, table);
  }

  _insertImage() {
    const url = prompt('Enter image URL:');
    if (!url) return;

    const img = `<img src="${url}" style="max-width:100%;height:auto;margin:10px 0;" alt="Image">`;
    document.execCommand('insertHTML', false, img);
  }

  _insertHR() {
    document.execCommand('insertHorizontalRule');
  }

  _insertPageBreak() {
    const pageBreak = '<div style="page-break-after:always;border-top:1px dashed #ccc;margin:20px 0;padding-top:20px;"></div>';
    document.execCommand('insertHTML', false, pageBreak);
  }

  _insertLink() {
    const url = prompt('Enter URL:');
    if (!url) return;
    document.execCommand('createLink', false, url);
  }

  _insertSpecialChar() {
    const chars = ['©', '®', '™', '§', '¶', '†', '‡', '•', '…', '€', '£', '¥', '°', '±', '×', '÷'];
    const char = prompt('Special characters:\n' + chars.join(' ') + '\n\nEnter a character:');
    if (char) {
      document.execCommand('insertText', false, char);
    }
  }

  _setLineHeight(height) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const element = container.nodeType === 3 ? container.parentNode : container;

      let block = element;
      while (block && !['P', 'DIV', 'H1', 'H2', 'H3', 'LI'].includes(block.tagName)) {
        block = block.parentNode;
      }

      if (block && block !== this.editor) {
        block.style.lineHeight = height;
      }
    }
  }

  _clearFormatting() {
    document.execCommand('removeFormat');
  }

  _toggleSpellCheck() {
    this.editor.spellcheck = !this.editor.spellcheck;
    alert(`Spell check ${this.editor.spellcheck ? 'enabled' : 'disabled'}`);
  }

  _showWordCount() {
    const text = this.editor.innerText || '';
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const paragraphs = this.editor.querySelectorAll('p').length;

    alert(`Document Statistics:\n\nWords: ${words}\nCharacters (with spaces): ${chars}\nCharacters (no spaces): ${charsNoSpaces}\nParagraphs: ${paragraphs}`);
  }

  _showFindReplace() {
    const existingDialog = document.querySelector('.find-replace-dialog');
    if (existingDialog) {
      existingDialog.remove();
      return;
    }

    const dialog = document.createElement('div');
    dialog.className = 'find-replace-dialog';
    dialog.style.cssText = `
      position:fixed;
      top:100px;
      right:20px;
      background:white;
      border:1px solid #ccc;
      box-shadow:0 4px 12px rgba(0,0,0,0.2);
      padding:15px;
      z-index:10001;
      border-radius:5px;
      min-width:300px;
    `;

    dialog.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <strong>Find & Replace</strong>
        <button onclick="this.parentElement.parentElement.remove()" style="border:none;background:transparent;cursor:pointer;font-size:18px;">×</button>
      </div>
      <input type="text" id="find-input" placeholder="Find..." style="width:100%;padding:6px;margin-bottom:8px;border:1px solid #ccc;border-radius:3px;">
      <input type="text" id="replace-input" placeholder="Replace with..." style="width:100%;padding:6px;margin-bottom:10px;border:1px solid #ccc;border-radius:3px;">
      <div style="display:flex;gap:5px;">
        <button id="find-btn" style="flex:1;padding:6px;cursor:pointer;background:#2c5aa0;color:white;border:none;border-radius:3px;">Find</button>
        <button id="replace-btn" style="flex:1;padding:6px;cursor:pointer;background:#4CAF50;color:white;border:none;border-radius:3px;">Replace</button>
        <button id="replace-all-btn" style="flex:1;padding:6px;cursor:pointer;background:#ff9800;color:white;border:none;border-radius:3px;">Replace All</button>
      </div>
    `;

    document.body.appendChild(dialog);

    const findInput = dialog.querySelector('#find-input');
    const replaceInput = dialog.querySelector('#replace-input');

    dialog.querySelector('#find-btn').addEventListener('click', () => {
      const text = findInput.value;
      if (text) window.find(text);
    });

    dialog.querySelector('#replace-btn').addEventListener('click', () => {
      const find = findInput.value;
      const replace = replaceInput.value;
      if (find) {
        const selection = window.getSelection();
        if (selection.toString() === find) {
          document.execCommand('insertText', false, replace);
        }
        window.find(find);
      }
    });

    dialog.querySelector('#replace-all-btn').addEventListener('click', () => {
      const find = findInput.value;
      const replace = replaceInput.value;
      if (find) {
        const html = this.editor.innerHTML;
        const regex = new RegExp(find, 'g');
        this.editor.innerHTML = html.replace(regex, replace);
        this.isModified = true;
        dialog.remove();
      }
    });

    findInput.focus();
  }

  _showHelp() {
    alert(`Word Processor Help

Keyboard Shortcuts:
Ctrl+S - Save
Ctrl+F - Find & Replace
Ctrl+Z - Undo
Ctrl+Y - Redo
Ctrl+B - Bold
Ctrl+I - Italic
Ctrl+U - Underline

Features:
• Rich text formatting
• Tables and images
• Find & replace
• Auto-save (every 30 seconds)
• Export to HTML and PDF
• Zoom controls
• Word/character count
• Line spacing options`);
  }

  async _newDocument() {
    if (this.isModified && !confirm('You have unsaved changes. Continue?')) {
      return;
    }
    this.currentFile = null;
    this.isModified = false;
    this.editor.innerHTML = '<p>Start typing your document...</p>';
    this._updateStats();
  }

  async _openDocument() {
    const path = prompt('Enter document path:', '/home/user/');
    if (!path) return;

    try {
      const content = await this.context.fs.readFile(path, { encoding: 'utf8' });
      this.currentFile = path;
      this.editor.innerHTML = content;
      this.isModified = false;
      this._updateStats();
    } catch (error) {
      alert(`Error opening document: ${error.message}`);
    }
  }

  async _saveDocument() {
    if (!this.currentFile) {
      return this._saveDocumentAs();
    }

    try {
      await this.context.fs.writeFile(this.currentFile, this.editor.innerHTML, { encoding: 'utf8' });
      this.isModified = false;
      this._showSaveStatus('Saved');
    } catch (error) {
      alert(`Error saving document: ${error.message}`);
    }
  }

  async _saveDocumentAs() {
    const path = prompt('Enter path to save document:', '/home/user/document.html');
    if (!path) return;

    try {
      await this.context.fs.writeFile(path, this.editor.innerHTML, { encoding: 'utf8' });
      this.currentFile = path;
      this.isModified = false;
      this._showSaveStatus('Saved');
    } catch (error) {
      alert(`Error saving document: ${error.message}`);
    }
  }

  async _autoSave() {
    if (!this.currentFile) return;

    try {
      await this.context.fs.writeFile(this.currentFile, this.editor.innerHTML, { encoding: 'utf8' });
      this._showSaveStatus('Auto-saved');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  _showSaveStatus(message) {
    if (this.saveStatus) {
      this.saveStatus.textContent = message;
      setTimeout(() => {
        this.saveStatus.textContent = '';
      }, 2000);
    }
  }

  async _exportHTML() {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Document</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.5;
      max-width: 816px;
      margin: 0 auto;
      padding: 96px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 10px 0;
    }
    td, th {
      border: 1px solid #ccc;
      padding: 8px;
    }
  </style>
</head>
<body>
  ${this.editor.innerHTML}
</body>
</html>
    `.trim();

    const path = prompt('Enter path to export HTML:', '/home/user/document_export.html');
    if (!path) return;

    try {
      await this.context.fs.writeFile(path, html, { encoding: 'utf8' });
      alert('Document exported successfully!');
    } catch (error) {
      alert(`Error exporting document: ${error.message}`);
    }
  }

  async _exportPDF() {
    alert('PDF export would require a PDF library. For now, please use Print to PDF from your browser.');
    this._print();
  }

  _print() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Document</title>
        <style>
          body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.5;
            margin: 1in;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 10px 0;
          }
          td, th {
            border: 1px solid #000;
            padding: 8px;
          }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${this.editor.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  }
}
