/**
 * WorkspaceSwitcher - UI component for switching workspaces
 */
export class WorkspaceSwitcher {
  constructor(kernel, container) {
    this.kernel = kernel;
    this.container = container;
    this.workspaceManager = null;

    this._init();
  }

  async _init() {
    const { getWorkspaceManager } = await import('../system/WorkspaceManager.js');
    this.workspaceManager = getWorkspaceManager();

    this._render();
    this._setupEventListeners();
  }

  _render() {
    const workspaces = this.workspaceManager.getAllWorkspaces();
    const currentWorkspace = this.workspaceManager.getCurrentWorkspace();

    const html = `
      <div class="workspace-switcher">
        <div class="workspace-indicator" id="workspace-indicator">
          <span class="workspace-icon">🖥️</span>
          <span class="workspace-name">${currentWorkspace.name}</span>
          <span class="workspace-arrow">▼</span>
        </div>
        <div class="workspace-menu" id="workspace-menu" style="display: none;">
          <div class="workspace-menu-header">
            <span>Workspaces</span>
            <button class="add-workspace-btn" id="add-workspace-btn" title="Add Workspace">+</button>
          </div>
          <div class="workspace-list" id="workspace-list">
            ${workspaces.map(ws => `
              <div class="workspace-item ${ws.id === currentWorkspace.id ? 'active' : ''}"
                   data-workspace-id="${ws.id}">
                <span class="workspace-item-icon">🖥️</span>
                <span class="workspace-item-name">${ws.name}</span>
                ${workspaces.length > 1 ? `
                  <button class="workspace-item-delete"
                          data-workspace-id="${ws.id}"
                          title="Delete workspace">✕</button>
                ` : ''}
              </div>
            `).join('')}
          </div>
          <div class="workspace-menu-footer">
            <div class="workspace-shortcut-hint">
              Ctrl+Alt+Arrow to switch
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  _setupEventListeners() {
    const indicator = this.container.querySelector('#workspace-indicator');
    const menu = this.container.querySelector('#workspace-menu');

    // Toggle menu
    indicator.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = menu.style.display === 'block';
      menu.style.display = isVisible ? 'none' : 'block';
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        menu.style.display = 'none';
      }
    });

    // Switch workspace
    this.container.querySelectorAll('.workspace-item').forEach(item => {
      item.addEventListener('click', async () => {
        const workspaceId = parseInt(item.dataset.workspaceId);
        await this.workspaceManager.switchToWorkspace(workspaceId);
        this._render();
        this._setupEventListeners();
        menu.style.display = 'none';
      });
    });

    // Delete workspace
    this.container.querySelectorAll('.workspace-item-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const workspaceId = parseInt(btn.dataset.workspaceId);

        if (confirm('Are you sure you want to delete this workspace?')) {
          try {
            this.workspaceManager.deleteWorkspace(workspaceId);
            this._render();
            this._setupEventListeners();
          } catch (error) {
            alert(error.message);
          }
        }
      });
    });

    // Add workspace
    const addBtn = this.container.querySelector('#add-workspace-btn');
    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const workspaces = this.workspaceManager.getAllWorkspaces();
        const name = prompt('Enter workspace name:', `Workspace ${workspaces.length + 1}`);

        if (name) {
          try {
            this.workspaceManager.createWorkspace(name);
            this._render();
            this._setupEventListeners();
          } catch (error) {
            alert(error.message);
          }
        }
      });
    }

    // Listen for workspace changes
    document.addEventListener('workspace-changed', () => {
      this._render();
      this._setupEventListeners();
    });
  }
}

export default WorkspaceSwitcher;
