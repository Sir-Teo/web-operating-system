export default class WordProcessor {
  constructor(context) {
    this.context = context;
    this.currentFile = null;
    this.content = '';
    this.isModified = false;
  }

  async init() {
    // Initialize word processor
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

    const editor = document.createElement('div');
    editor.className = 'word-editor';
    editor.contentEditable = 'true';
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
    `;
    editor.innerHTML = '<p>Start typing your document...</p>';

    editor.addEventListener('input', () => {
      this.isModified = true;
      this.content = editor.innerHTML;
    });

    // Prevent default paste to clean up formatting
    editor.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
    });

    this.editor = editor;

    editorWrapper.appendChild(editor);

    // Status bar
    const statusBar = this._createStatusBar();

    container.appendChild(menuBar);
    container.appendChild(toolbar);
    container.appendChild(editorWrapper);
    container.appendChild(statusBar);

    return container;
  }

  _createMenuBar() {
    const menuBar = document.createElement('div');
    menuBar.className = 'word-menu-bar';
    menuBar.style.cssText = 'padding:8px 10px;background:#2c5aa0;color:white;display:flex;gap:20px;font-size:14px;';

    const menus = ['File', 'Edit', 'Insert', 'Format', 'Tools', 'Help'];
    menus.forEach(menu => {
      const menuItem = document.createElement('span');
      menuItem.textContent = menu;
      menuItem.style.cssText = 'cursor:pointer;padding:5px 10px;';
      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.background = 'rgba(255,255,255,0.2)';
      });
      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.background = 'transparent';
      });

      if (menu === 'File') {
        menuItem.addEventListener('click', () => this._showFileMenu(menuItem));
      }

      menuBar.appendChild(menuItem);
    });

    return menuBar;
  }

  _showFileMenu(anchor) {
    // Remove existing menu if any
    const existing = document.querySelector('.file-menu-dropdown');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.className = 'file-menu-dropdown';
    menu.style.cssText = `
      position:absolute;
      background:white;
      border:1px solid #ccc;
      box-shadow:0 2px 8px rgba(0,0,0,0.15);
      min-width:200px;
      z-index:10000;
    `;

    const options = [
      { label: 'New', action: () => this._newDocument() },
      { label: 'Open...', action: () => this._openDocument() },
      { label: 'Save', action: () => this._saveDocument() },
      { label: 'Save As...', action: () => this._saveDocumentAs() },
      { label: 'Export as HTML', action: () => this._exportHTML() },
      { label: 'Print', action: () => this._print() }
    ];

    options.forEach(opt => {
      const item = document.createElement('div');
      item.textContent = opt.label;
      item.style.cssText = 'padding:8px 15px;cursor:pointer;color:#333;';
      item.addEventListener('mouseenter', () => item.style.background = '#f0f0f0');
      item.addEventListener('mouseleave', () => item.style.background = 'white');
      item.addEventListener('click', () => {
        opt.action();
        menu.remove();
      });
      menu.appendChild(item);
    });

    const rect = anchor.getBoundingClientRect();
    menu.style.top = rect.bottom + 'px';
    menu.style.left = rect.left + 'px';

    document.body.appendChild(menu);

    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', () => menu.remove(), { once: true });
    }, 0);
  }

  _createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'word-toolbar';
    toolbar.style.cssText = 'padding:8px 10px;border-bottom:1px solid #ccc;background:white;display:flex;gap:5px;flex-wrap:wrap;align-items:center;';

    // Font family
    const fontSelect = document.createElement('select');
    fontSelect.style.cssText = 'padding:4px;border:1px solid #ccc;';
    ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Comic Sans MS'].forEach(font => {
      const option = document.createElement('option');
      option.value = font;
      option.textContent = font;
      fontSelect.appendChild(option);
    });
    fontSelect.addEventListener('change', () => {
      document.execCommand('fontName', false, fontSelect.value);
    });

    // Font size
    const sizeSelect = document.createElement('select');
    sizeSelect.style.cssText = 'padding:4px;border:1px solid #ccc;';
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
    });

    toolbar.appendChild(fontSelect);
    toolbar.appendChild(sizeSelect);
    toolbar.appendChild(this._createSeparator());

    // Formatting buttons
    const formatButtons = [
      { icon: '𝐁', command: 'bold', title: 'Bold (Ctrl+B)' },
      { icon: '𝐼', command: 'italic', title: 'Italic (Ctrl+I)' },
      { icon: '𝐔', command: 'underline', title: 'Underline (Ctrl+U)' },
      { icon: 'S', command: 'strikeThrough', title: 'Strikethrough' }
    ];

    formatButtons.forEach(btn => {
      const button = this._createToolbarButton(btn.icon, btn.title, () => {
        document.execCommand(btn.command);
      });
      toolbar.appendChild(button);
    });

    toolbar.appendChild(this._createSeparator());

    // Alignment buttons
    const alignButtons = [
      { icon: '≡', command: 'justifyLeft', title: 'Align Left' },
      { icon: '≣', command: 'justifyCenter', title: 'Align Center' },
      { icon: '≡', command: 'justifyRight', title: 'Align Right' },
      { icon: '▤', command: 'justifyFull', title: 'Justify' }
    ];

    alignButtons.forEach(btn => {
      const button = this._createToolbarButton(btn.icon, btn.title, () => {
        document.execCommand(btn.command);
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
      });
      toolbar.appendChild(button);
    });

    toolbar.appendChild(this._createSeparator());

    // Color picker
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.title = 'Text Color';
    colorInput.style.cssText = 'width:30px;height:30px;border:1px solid #ccc;cursor:pointer;';
    colorInput.addEventListener('change', () => {
      document.execCommand('foreColor', false, colorInput.value);
    });
    toolbar.appendChild(colorInput);

    // Highlight color
    const highlightInput = document.createElement('input');
    highlightInput.type = 'color';
    highlightInput.title = 'Highlight Color';
    highlightInput.value = '#ffff00';
    highlightInput.style.cssText = 'width:30px;height:30px;border:1px solid #ccc;cursor:pointer;';
    highlightInput.addEventListener('change', () => {
      document.execCommand('hiliteColor', false, highlightInput.value);
    });
    toolbar.appendChild(highlightInput);

    return toolbar;
  }

  _createToolbarButton(icon, title, onClick) {
    const button = document.createElement('button');
    button.textContent = icon;
    button.title = title;
    button.style.cssText = 'padding:5px 10px;cursor:pointer;background:white;border:1px solid #ccc;border-radius:3px;font-size:14px;';
    button.addEventListener('mouseenter', () => button.style.background = '#f0f0f0');
    button.addEventListener('mouseleave', () => button.style.background = 'white');
    button.addEventListener('click', onClick);
    return button;
  }

  _createSeparator() {
    const sep = document.createElement('div');
    sep.style.cssText = 'width:1px;height:24px;background:#ccc;margin:0 5px;';
    return sep;
  }

  _createStatusBar() {
    const statusBar = document.createElement('div');
    statusBar.className = 'word-status-bar';
    statusBar.style.cssText = 'padding:5px 10px;background:#f0f0f0;border-top:1px solid #ccc;font-size:12px;color:#666;display:flex;gap:20px;';

    const pageInfo = document.createElement('span');
    pageInfo.textContent = 'Page 1 of 1';

    const wordCount = document.createElement('span');
    wordCount.textContent = 'Words: 0';

    statusBar.appendChild(pageInfo);
    statusBar.appendChild(wordCount);

    // Update word count periodically
    if (this.editor) {
      setInterval(() => {
        const text = this.editor.innerText || '';
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        wordCount.textContent = `Words: ${words}`;
      }, 1000);
    }

    return statusBar;
  }

  async _newDocument() {
    if (this.isModified && !confirm('You have unsaved changes. Continue?')) {
      return;
    }
    this.currentFile = null;
    this.isModified = false;
    this.editor.innerHTML = '<p>Start typing your document...</p>';
  }

  async _openDocument() {
    const path = prompt('Enter document path:', '/home/user/');
    if (!path) return;

    try {
      const content = await this.context.fs.readFile(path, { encoding: 'utf8' });
      this.currentFile = path;
      this.editor.innerHTML = content;
      this.isModified = false;
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
      alert('Document saved successfully!');
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
      alert('Document saved successfully!');
    } catch (error) {
      alert(`Error saving document: ${error.message}`);
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
        </style>
      </head>
      <body>
        ${this.editor.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
}
