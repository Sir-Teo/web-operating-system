export default class ArchiveManager {
  constructor(context) {
    this.context = context;
    this.fs = context.fs;
    this.ipc = context.ipc;
    this.process = context.process;

    this.currentPath = '/home/';
    this.archives = [];
    this.selectedFiles = new Set();
  }

  async init() {
    await this.loadArchives();
  }

  async loadArchives() {
    try {
      // Scan for .zip files in the home directory
      const files = await this.fs.readdir(this.currentPath);
      this.archives = files.filter(file => file.endsWith('.zip'));
    } catch (error) {
      console.error('Error loading archives:', error);
      this.archives = [];
    }
  }

  render() {
    const container = document.createElement('div');
    container.className = 'archive-manager-container';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #f5f5f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Header
    const header = this.createHeader();
    container.appendChild(header);

    // Main content
    const content = document.createElement('div');
    content.style.cssText = `
      flex: 1;
      display: flex;
      overflow: hidden;
    `;

    // Left panel - File browser
    const leftPanel = this.createFilePanel();
    content.appendChild(leftPanel);

    // Right panel - Archive operations
    const rightPanel = this.createOperationsPanel();
    content.appendChild(rightPanel);

    container.appendChild(content);

    return container;
  }

  createHeader() {
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 15px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;

    const title = document.createElement('h2');
    title.textContent = '=æ Archive Manager';
    title.style.cssText = 'margin: 0; font-size: 24px;';

    const actions = document.createElement('div');
    actions.style.cssText = 'display: flex; gap: 10px;';

    const createBtn = this.createButton('Create Archive', () => this.showCreateArchiveDialog());
    createBtn.style.cssText += 'background: rgba(255,255,255,0.2); padding: 8px 16px;';

    const extractBtn = this.createButton('Extract Archive', () => this.showExtractDialog());
    extractBtn.style.cssText += 'background: rgba(255,255,255,0.2); padding: 8px 16px;';

    actions.appendChild(createBtn);
    actions.appendChild(extractBtn);

    header.appendChild(title);
    header.appendChild(actions);

    return header;
  }

  createFilePanel() {
    const panel = document.createElement('div');
    panel.style.cssText = `
      flex: 1;
      background: white;
      border-right: 1px solid #ddd;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;

    const panelHeader = document.createElement('div');
    panelHeader.style.cssText = `
      padding: 15px;
      background: #fafafa;
      border-bottom: 1px solid #ddd;
      font-weight: 600;
      font-size: 16px;
    `;
    panelHeader.textContent = 'Files & Folders';

    const pathBar = document.createElement('div');
    pathBar.style.cssText = `
      padding: 10px 15px;
      background: #f5f5f5;
      border-bottom: 1px solid #ddd;
      font-size: 13px;
      color: #666;
    `;
    pathBar.textContent = `Path: ${this.currentPath}`;
    this.pathBar = pathBar;

    const fileList = document.createElement('div');
    fileList.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 10px;
    `;
    this.fileListContainer = fileList;
    this.renderFileList();

    const selectionInfo = document.createElement('div');
    selectionInfo.style.cssText = `
      padding: 10px 15px;
      background: #f0f0f0;
      border-top: 1px solid #ddd;
      font-size: 13px;
    `;
    this.selectionInfo = selectionInfo;
    this.updateSelectionInfo();

    panel.appendChild(panelHeader);
    panel.appendChild(pathBar);
    panel.appendChild(fileList);
    panel.appendChild(selectionInfo);

    return panel;
  }

  async renderFileList() {
    this.fileListContainer.innerHTML = '';

    try {
      const files = await this.fs.readdir(this.currentPath);

      // Add parent directory option if not at root
      if (this.currentPath !== '/') {
        const parentItem = this.createFileItem('..', 'directory', true);
        this.fileListContainer.appendChild(parentItem);
      }

      // Sort: directories first, then files
      const sorted = files.sort((a, b) => {
        const aIsDir = !a.includes('.');
        const bIsDir = !b.includes('.');
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.localeCompare(b);
      });

      sorted.forEach(file => {
        const isDirectory = !file.includes('.');
        const item = this.createFileItem(file, isDirectory ? 'directory' : 'file');
        this.fileListContainer.appendChild(item);
      });

    } catch (error) {
      const errorMsg = document.createElement('div');
      errorMsg.textContent = 'Error loading files';
      errorMsg.style.cssText = 'padding: 20px; text-align: center; color: #999;';
      this.fileListContainer.appendChild(errorMsg);
    }
  }

  createFileItem(name, type, isParent = false) {
    const item = document.createElement('div');
    item.style.cssText = `
      display: flex;
      align-items: center;
      padding: 10px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
      user-select: none;
    `;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.style.cssText = 'margin-right: 10px;';

    if (isParent) {
      checkbox.style.display = 'none';
    } else {
      checkbox.onchange = () => {
        const fullPath = this.currentPath + (this.currentPath.endsWith('/') ? '' : '/') + name;
        if (checkbox.checked) {
          this.selectedFiles.add(fullPath);
        } else {
          this.selectedFiles.delete(fullPath);
        }
        this.updateSelectionInfo();
      };
    }

    const icon = document.createElement('span');
    icon.textContent = isParent ? '=Á' : (type === 'directory' ? '=Á' : '=Ä');
    icon.style.cssText = 'margin-right: 10px; font-size: 18px;';

    const nameEl = document.createElement('span');
    nameEl.textContent = name;
    nameEl.style.cssText = 'flex: 1;';

    item.appendChild(checkbox);
    item.appendChild(icon);
    item.appendChild(nameEl);

    item.onmouseover = () => item.style.background = '#f5f5f5';
    item.onmouseout = () => item.style.background = 'transparent';

    item.onclick = async (e) => {
      if (e.target === checkbox) return;

      if (isParent) {
        // Go to parent directory
        const parts = this.currentPath.split('/').filter(p => p);
        parts.pop();
        this.currentPath = '/' + parts.join('/');
        if (this.currentPath === '') this.currentPath = '/';
        this.pathBar.textContent = `Path: ${this.currentPath}`;
        this.selectedFiles.clear();
        await this.renderFileList();
      } else if (type === 'directory') {
        // Navigate into directory
        this.currentPath = this.currentPath + (this.currentPath.endsWith('/') ? '' : '/') + name;
        this.pathBar.textContent = `Path: ${this.currentPath}`;
        this.selectedFiles.clear();
        await this.renderFileList();
      }
    };

    return item;
  }

  updateSelectionInfo() {
    const count = this.selectedFiles.size;
    this.selectionInfo.textContent = count > 0
      ? `${count} item${count > 1 ? 's' : ''} selected`
      : 'No items selected';
  }

  createOperationsPanel() {
    const panel = document.createElement('div');
    panel.style.cssText = `
      width: 350px;
      background: white;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;

    const panelHeader = document.createElement('div');
    panelHeader.style.cssText = `
      padding: 15px;
      background: #fafafa;
      border-bottom: 1px solid #ddd;
      font-weight: 600;
      font-size: 16px;
    `;
    panelHeader.textContent = 'Archives';

    const archiveList = document.createElement('div');
    archiveList.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 15px;
    `;
    this.archiveListContainer = archiveList;
    this.renderArchiveList();

    panel.appendChild(panelHeader);
    panel.appendChild(archiveList);

    return panel;
  }

  renderArchiveList() {
    this.archiveListContainer.innerHTML = '';

    if (this.archives.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'No archives found';
      empty.style.cssText = 'text-align: center; padding: 40px; color: #999;';
      this.archiveListContainer.appendChild(empty);
      return;
    }

    this.archives.forEach(archive => {
      const card = this.createArchiveCard(archive);
      this.archiveListContainer.appendChild(card);
    });
  }

  createArchiveCard(name) {
    const card = document.createElement('div');
    card.style.cssText = `
      background: #f8f9fa;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 10px;
    `;

    const header = document.createElement('div');
    header.style.cssText = 'display: flex; align-items: center; margin-bottom: 10px;';

    const icon = document.createElement('span');
    icon.textContent = '=æ';
    icon.style.cssText = 'font-size: 24px; margin-right: 10px;';

    const title = document.createElement('div');
    title.textContent = name;
    title.style.cssText = 'font-weight: 600; flex: 1; word-break: break-all;';

    header.appendChild(icon);
    header.appendChild(title);

    const actions = document.createElement('div');
    actions.style.cssText = 'display: flex; gap: 8px; margin-top: 10px;';

    const extractBtn = this.createButton('Extract', async () => {
      await this.extractArchive(name);
    });
    extractBtn.style.cssText += 'flex: 1; background: #667eea; color: white; padding: 8px;';

    const deleteBtn = this.createButton('Delete', async () => {
      if (confirm(`Delete ${name}?`)) {
        await this.deleteArchive(name);
      }
    });
    deleteBtn.style.cssText += 'flex: 1; background: #f44336; color: white; padding: 8px;';

    actions.appendChild(extractBtn);
    actions.appendChild(deleteBtn);

    card.appendChild(header);
    card.appendChild(actions);

    return card;
  }

  showCreateArchiveDialog() {
    if (this.selectedFiles.size === 0) {
      alert('Please select files to compress');
      return;
    }

    const archiveName = prompt('Archive name (without .zip):', 'archive');
    if (!archiveName) return;

    this.createArchive(archiveName);
  }

  async createArchive(name) {
    try {
      // Note: This is a simplified simulation
      // In a real implementation, you would use a library like JSZip
      const archivePath = this.currentPath + (this.currentPath.endsWith('/') ? '' : '/') + name + '.zip';

      const files = Array.from(this.selectedFiles);
      const manifest = {
        created: new Date().toISOString(),
        files: files,
        count: files.length
      };

      // Write a simple JSON manifest (simulating zip)
      await this.fs.writeFile(archivePath, JSON.stringify(manifest, null, 2));

      alert(`Archive created: ${name}.zip\n\nNote: This is a simplified archive format. In production, use JSZip library for real ZIP files.`);

      this.selectedFiles.clear();
      await this.loadArchives();
      this.renderArchiveList();
      this.updateSelectionInfo();

    } catch (error) {
      alert('Error creating archive: ' + error.message);
      console.error('Error creating archive:', error);
    }
  }

  showExtractDialog() {
    if (this.archives.length === 0) {
      alert('No archives found');
      return;
    }

    const archiveList = this.archives.join('\n');
    const selected = prompt(`Select archive to extract:\n\n${archiveList}\n\nEnter name:`);

    if (selected && this.archives.includes(selected)) {
      this.extractArchive(selected);
    }
  }

  async extractArchive(name) {
    try {
      const archivePath = this.currentPath + (this.currentPath.endsWith('/') ? '' : '/') + name;
      const data = await this.fs.readFile(archivePath);
      const manifest = JSON.parse(data);

      alert(`Archive: ${name}\n\nContains ${manifest.count} file(s)\nCreated: ${new Date(manifest.created).toLocaleString()}\n\nNote: This is a simplified archive format. In production, use JSZip library to extract real ZIP files.`);

    } catch (error) {
      alert('Error extracting archive: ' + error.message);
      console.error('Error extracting archive:', error);
    }
  }

  async deleteArchive(name) {
    try {
      const archivePath = this.currentPath + (this.currentPath.endsWith('/') ? '' : '/') + name;
      await this.fs.unlink(archivePath);
      await this.loadArchives();
      this.renderArchiveList();
    } catch (error) {
      alert('Error deleting archive: ' + error.message);
      console.error('Error deleting archive:', error);
    }
  }

  createButton(text, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: opacity 0.2s;
    `;
    btn.onmouseover = () => btn.style.opacity = '0.8';
    btn.onmouseout = () => btn.style.opacity = '1';
    btn.onclick = onClick;
    return btn;
  }

  async destroy() {
    // Cleanup
  }
}
