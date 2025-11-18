export default class TextEditor {
  constructor(context) {
    this.context = context;
    this.currentFile = null;
    this.content = '';
  }

  async init() {
    // Initialize text editor
  }

  render() {
    const container = document.createElement('div');
    container.className = 'text-editor-container';
    container.style.cssText = 'display:flex;flex-direction:column;height:100%;background:#fff;';

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'text-editor-toolbar';
    toolbar.style.cssText = 'padding:10px;border-bottom:1px solid #ddd;display:flex;gap:10px;';

    const newBtn = this._createButton('📄 New', async () => {
      if (this.content && confirm('Discard current changes?')) {
        this.currentFile = null;
        this.content = '';
        textarea.value = '';
        filePathInput.value = '';
      }
    });

    const openBtn = this._createButton('📁 Open', async () => {
      const path = prompt('Enter file path:', '/home/user/');
      if (path) {
        try {
          const content = await this.context.fs.readFile(path, { encoding: 'utf8' });
          this.currentFile = path;
          this.content = content;
          textarea.value = content;
          filePathInput.value = path;
        } catch (error) {
          alert(`Error opening file: ${error.message}`);
        }
      }
    });

    const saveBtn = this._createButton('💾 Save', async () => {
      const path = this.currentFile || prompt('Enter file path to save:', '/home/user/untitled.txt');
      if (path) {
        try {
          await this.context.fs.writeFile(path, textarea.value, { encoding: 'utf8' });
          this.currentFile = path;
          this.content = textarea.value;
          filePathInput.value = path;
          alert('File saved successfully!');
        } catch (error) {
          alert(`Error saving file: ${error.message}`);
        }
      }
    });

    const filePathInput = document.createElement('input');
    filePathInput.type = 'text';
    filePathInput.placeholder = 'No file open';
    filePathInput.readOnly = true;
    filePathInput.style.cssText = 'flex:1;padding:5px;border:1px solid #ccc;';

    toolbar.appendChild(newBtn);
    toolbar.appendChild(openBtn);
    toolbar.appendChild(saveBtn);
    toolbar.appendChild(filePathInput);

    // Text area
    const textarea = document.createElement('textarea');
    textarea.className = 'text-editor-textarea';
    textarea.style.cssText = 'flex:1;padding:10px;border:none;outline:none;font-family:monospace;font-size:14px;resize:none;';
    textarea.placeholder = 'Start typing or open a file...';

    textarea.addEventListener('input', () => {
      this.content = textarea.value;
    });

    container.appendChild(toolbar);
    container.appendChild(textarea);

    return container;
  }

  _createButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = 'padding:5px 10px;cursor:pointer;background:#f0f0f0;border:1px solid #ccc;border-radius:3px;';
    button.addEventListener('click', onClick);
    return button;
  }
}
