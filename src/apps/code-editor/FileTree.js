/**
 * File Tree Component for Code Editor
 * Displays hierarchical file structure with expand/collapse
 */
export class FileTree {
  constructor(vfs, onFileSelect, onFileDelete, onFileRename) {
    this.vfs = vfs;
    this.onFileSelect = onFileSelect;
    this.onFileDelete = onFileDelete;
    this.onFileRename = onFileRename;
    this.rootPath = '/home/user';
    this.expandedDirs = new Set([this.rootPath]);
    this.container = null;
  }

  /**
   * Render the file tree
   * @param {HTMLElement} container - Container element
   */
  async render(container) {
    this.container = container;
    const tree = await this.buildTree(this.rootPath);
    const html = this.renderTree(tree, 0);
    container.innerHTML = html;
    this.attachEventListeners();
  }

  /**
   * Build tree structure
   * @param {string} path - Directory path
   * @returns {Promise<Array>} Tree nodes
   */
  async buildTree(path) {
    try {
      const entries = await this.vfs.readdir(path);
      const nodes = [];

      for (const entry of entries) {
        const fullPath = `${path}/${entry.name}`;
        const node = {
          name: entry.name,
          path: fullPath,
          type: entry.type,
          children: null
        };

        if (entry.type === 'directory' && this.expandedDirs.has(fullPath)) {
          node.children = await this.buildTree(fullPath);
        }

        nodes.push(node);
      }

      // Sort: directories first, then by name
      nodes.sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }
        return a.type === 'directory' ? -1 : 1;
      });

      return nodes;
    } catch (error) {
      console.error(`Error building tree for ${path}:`, error);
      return [];
    }
  }

  /**
   * Render tree HTML
   * @param {Array} nodes - Tree nodes
   * @param {number} level - Indentation level
   * @returns {string} HTML string
   */
  renderTree(nodes, level) {
    let html = '<ul class="file-tree-list">';

    for (const node of nodes) {
      const indent = level * 16;
      const isExpanded = this.expandedDirs.has(node.path);
      const hasChildren = node.type === 'directory';
      const expandIcon = hasChildren ? (isExpanded ? '▼' : '▶') : '';
      const fileIcon = this.getFileIcon(node);

      html += `
        <li class="file-tree-item" data-path="${node.path}" data-type="${node.type}">
          <div class="file-tree-item-content" style="padding-left: ${indent}px;">
            ${hasChildren ? `<span class="expand-icon" data-path="${node.path}">${expandIcon}</span>` : '<span class="expand-icon-placeholder"></span>'}
            <span class="file-icon">${fileIcon}</span>
            <span class="file-name" data-path="${node.path}" data-type="${node.type}">${node.name}</span>
            <div class="file-actions">
              ${node.type === 'file' ? `
                <button class="file-action-btn rename-btn" data-path="${node.path}" title="Rename">✏️</button>
                <button class="file-action-btn delete-btn" data-path="${node.path}" title="Delete">🗑️</button>
              ` : ''}
            </div>
          </div>
          ${isExpanded && node.children ? this.renderTree(node.children, level + 1) : ''}
        </li>
      `;
    }

    html += '</ul>';
    return html;
  }

  /**
   * Get file icon based on type
   * @param {Object} node - Tree node
   * @returns {string} Icon emoji or symbol
   */
  getFileIcon(node) {
    if (node.type === 'directory') {
      return this.expandedDirs.has(node.path) ? '📂' : '📁';
    }

    const ext = this.getExtension(node.name);
    const iconMap = {
      'js': '📜',
      'jsx': '⚛️',
      'ts': '📘',
      'tsx': '⚛️',
      'html': '🌐',
      'css': '🎨',
      'json': '📋',
      'md': '📝',
      'py': '🐍',
      'java': '☕',
      'c': '©️',
      'cpp': '©️',
      'go': '🐹',
      'rs': '🦀',
      'php': '🐘',
      'rb': '💎',
      'sh': '🐚',
      'yaml': '⚙️',
      'yml': '⚙️',
      'xml': '📄',
      'sql': '🗄️',
      'txt': '📄'
    };

    return iconMap[ext] || '📄';
  }

  /**
   * Get file extension
   * @param {string} filename - Filename
   * @returns {string} Extension
   */
  getExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    if (!this.container) return;

    // Expand/collapse directories
    this.container.querySelectorAll('.expand-icon').forEach(icon => {
      icon.addEventListener('click', async (e) => {
        e.stopPropagation();
        const path = icon.dataset.path;
        if (this.expandedDirs.has(path)) {
          this.expandedDirs.delete(path);
        } else {
          this.expandedDirs.add(path);
        }
        await this.refresh();
      });
    });

    // File selection
    this.container.querySelectorAll('.file-name').forEach(name => {
      name.addEventListener('click', async (e) => {
        e.stopPropagation();
        const path = name.dataset.path;
        const type = name.dataset.type;

        if (type === 'file' && this.onFileSelect) {
          try {
            const content = await this.vfs.readFile(path, 'utf8');
            const filename = path.split('/').pop();
            this.onFileSelect({ path, name: filename, content });
          } catch (error) {
            console.error('Error reading file:', error);
            alert(`Error reading file: ${error.message}`);
          }
        } else if (type === 'directory') {
          // Toggle directory
          if (this.expandedDirs.has(path)) {
            this.expandedDirs.delete(path);
          } else {
            this.expandedDirs.add(path);
          }
          await this.refresh();
        }
      });

      // Double-click on file name
      name.addEventListener('dblclick', async (e) => {
        e.stopPropagation();
        const path = name.dataset.path;
        const type = name.dataset.type;

        if (type === 'file' && this.onFileSelect) {
          try {
            const content = await this.vfs.readFile(path, 'utf8');
            const filename = path.split('/').pop();
            this.onFileSelect({ path, name: filename, content });
          } catch (error) {
            console.error('Error reading file:', error);
          }
        }
      });
    });

    // File actions
    this.container.querySelectorAll('.rename-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const path = btn.dataset.path;
        const currentName = path.split('/').pop();
        const newName = prompt('Enter new name:', currentName);
        if (newName && newName !== currentName && this.onFileRename) {
          this.onFileRename(path, newName);
        }
      });
    });

    this.container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const path = btn.dataset.path;
        const filename = path.split('/').pop();
        if (confirm(`Delete ${filename}?`) && this.onFileDelete) {
          this.onFileDelete(path);
        }
      });
    });
  }

  /**
   * Refresh the file tree
   */
  async refresh() {
    if (this.container) {
      await this.render(this.container);
    }
  }

  /**
   * Set root path
   * @param {string} path - New root path
   */
  async setRootPath(path) {
    this.rootPath = path;
    this.expandedDirs = new Set([path]);
    await this.refresh();
  }

  /**
   * Expand path
   * @param {string} path - Path to expand
   */
  async expandPath(path) {
    const parts = path.split('/').filter(p => p);
    let currentPath = '';

    for (const part of parts) {
      currentPath += '/' + part;
      this.expandedDirs.add(currentPath);
    }

    await this.refresh();
  }
}
