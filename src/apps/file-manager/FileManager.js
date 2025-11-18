export default class FileManager {
  constructor(context) {
    this.context = context;
    this.currentPath = '/home/user';
  }

  async init() {
    // Initialize file manager
  }

  render() {
    const container = document.createElement('div');
    container.className = 'file-manager-container';
    container.style.cssText = 'display:flex;flex-direction:column;height:100%;background:#fff;';

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'file-manager-toolbar';
    toolbar.style.cssText = 'padding:10px;border-bottom:1px solid #ddd;display:flex;gap:10px;';

    const pathDisplay = document.createElement('input');
    pathDisplay.type = 'text';
    pathDisplay.value = this.currentPath;
    pathDisplay.readOnly = true;
    pathDisplay.style.cssText = 'flex:1;padding:5px;border:1px solid #ccc;';

    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = '🔄 Refresh';
    refreshBtn.style.cssText = 'padding:5px 10px;cursor:pointer;';

    toolbar.appendChild(pathDisplay);
    toolbar.appendChild(refreshBtn);

    // File list
    const fileList = document.createElement('div');
    fileList.className = 'file-list';
    fileList.style.cssText = 'flex:1;overflow-y:auto;padding:10px;';

    container.appendChild(toolbar);
    container.appendChild(fileList);

    // Load files
    const loadFiles = async () => {
      try {
        const entries = await this.context.fs.readdir(this.currentPath);
        fileList.innerHTML = '';

        // Add parent directory link if not at root
        if (this.currentPath !== '/') {
          const parentItem = this._createFileItem({
            name: '..',
            type: 'directory',
            size: 0
          });
          parentItem.addEventListener('click', async () => {
            this.currentPath = this.currentPath.split('/').slice(0, -1).join('/') || '/';
            pathDisplay.value = this.currentPath;
            await loadFiles();
          });
          fileList.appendChild(parentItem);
        }

        // Add files and directories
        entries.forEach(entry => {
          const item = this._createFileItem(entry);
          item.addEventListener('click', async () => {
            if (entry.type === 'directory') {
              this.currentPath += (this.currentPath.endsWith('/') ? '' : '/') + entry.name;
              pathDisplay.value = this.currentPath;
              await loadFiles();
            } else {
              // For files, show a simple viewer
              try {
                const content = await this.context.fs.readFile(
                  `${this.currentPath}/${entry.name}`,
                  { encoding: 'utf8' }
                );
                alert(`File: ${entry.name}\n\n${content.substring(0, 500)}${content.length > 500 ? '...' : ''}`);
              } catch (error) {
                alert(`Cannot read file: ${error.message}`);
              }
            }
          });
          fileList.appendChild(item);
        });
      } catch (error) {
        fileList.innerHTML = `<div style="color:red;">Error loading directory: ${error.message}</div>`;
      }
    };

    refreshBtn.addEventListener('click', loadFiles);

    // Initial load
    loadFiles();

    return container;
  }

  _createFileItem(entry) {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.style.cssText = 'padding:8px;cursor:pointer;border-bottom:1px solid #eee;display:flex;align-items:center;gap:10px;';
    item.style.cssText += 'transition:background 0.2s;';

    item.addEventListener('mouseenter', () => {
      item.style.background = '#f0f0f0';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background = 'transparent';
    });

    const icon = document.createElement('span');
    icon.textContent = entry.type === 'directory' ? '📁' : '📄';

    const name = document.createElement('span');
    name.textContent = entry.name;
    name.style.cssText = 'flex:1;';

    const size = document.createElement('span');
    size.textContent = entry.type === 'file' ? this._formatSize(entry.size) : '';
    size.style.cssText = 'color:#888;font-size:0.9em;';

    item.appendChild(icon);
    item.appendChild(name);
    item.appendChild(size);

    return item;
  }

  _formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
