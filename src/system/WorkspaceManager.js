/**
 * WorkspaceManager - Manages multiple virtual desktops/workspaces
 * Allows users to organize windows across different workspaces
 */
export class WorkspaceManager {
  constructor(kernel) {
    this.kernel = kernel;
    this.workspaces = [];
    this.currentWorkspaceId = 1;
    this.nextWorkspaceId = 1;
    this.maxWorkspaces = 9;

    this._init();
  }

  _init() {
    // Create initial workspace
    this.createWorkspace('Workspace 1');
    this.switchToWorkspace(1);

    // Setup keyboard shortcuts for workspace switching
    this._setupKeyboardShortcuts();
  }

  /**
   * Create a new workspace
   * @param {string} name - Workspace name
   * @returns {number} Workspace ID
   */
  createWorkspace(name = null) {
    if (this.workspaces.length >= this.maxWorkspaces) {
      throw new Error(`Maximum of ${this.maxWorkspaces} workspaces allowed`);
    }

    const workspaceId = this.nextWorkspaceId++;
    const workspace = {
      id: workspaceId,
      name: name || `Workspace ${workspaceId}`,
      windows: [], // Store window IDs that belong to this workspace
      createdAt: Date.now()
    };

    this.workspaces.push(workspace);
    this._saveWorkspaces();
    this._notifyWorkspaceListeners('created', workspace);

    return workspaceId;
  }

  /**
   * Delete a workspace
   * @param {number} workspaceId
   */
  deleteWorkspace(workspaceId) {
    if (this.workspaces.length <= 1) {
      throw new Error('Cannot delete the last workspace');
    }

    const workspaceIndex = this.workspaces.findIndex(w => w.id === workspaceId);
    if (workspaceIndex === -1) {
      throw new Error('Workspace not found');
    }

    const workspace = this.workspaces[workspaceIndex];

    // Move windows from deleted workspace to the first workspace
    if (workspace.windows.length > 0) {
      const targetWorkspace = this.workspaces.find(w => w.id !== workspaceId);
      workspace.windows.forEach(windowId => {
        targetWorkspace.windows.push(windowId);
      });
    }

    // If deleting current workspace, switch to another
    if (this.currentWorkspaceId === workspaceId) {
      const newWorkspace = this.workspaces.find(w => w.id !== workspaceId);
      this.switchToWorkspace(newWorkspace.id);
    }

    this.workspaces.splice(workspaceIndex, 1);
    this._saveWorkspaces();
    this._notifyWorkspaceListeners('deleted', workspace);
  }

  /**
   * Rename a workspace
   * @param {number} workspaceId
   * @param {string} newName
   */
  renameWorkspace(workspaceId, newName) {
    const workspace = this.workspaces.find(w => w.id === workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    workspace.name = newName;
    this._saveWorkspaces();
    this._notifyWorkspaceListeners('renamed', workspace);
  }

  /**
   * Switch to a different workspace
   * @param {number} workspaceId
   */
  async switchToWorkspace(workspaceId) {
    const workspace = this.workspaces.find(w => w.id === workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Hide all windows
    await this._hideAllWindows();

    // Update current workspace
    this.currentWorkspaceId = workspaceId;

    // Show windows belonging to this workspace
    await this._showWorkspaceWindows(workspace);

    this._saveWorkspaces();
    this._notifyWorkspaceListeners('switched', workspace);
  }

  /**
   * Switch to next workspace
   */
  async switchToNextWorkspace() {
    const currentIndex = this.workspaces.findIndex(w => w.id === this.currentWorkspaceId);
    const nextIndex = (currentIndex + 1) % this.workspaces.length;
    await this.switchToWorkspace(this.workspaces[nextIndex].id);
  }

  /**
   * Switch to previous workspace
   */
  async switchToPreviousWorkspace() {
    const currentIndex = this.workspaces.findIndex(w => w.id === this.currentWorkspaceId);
    const prevIndex = (currentIndex - 1 + this.workspaces.length) % this.workspaces.length;
    await this.switchToWorkspace(this.workspaces[prevIndex].id);
  }

  /**
   * Move a window to a different workspace
   * @param {string} windowId
   * @param {number} targetWorkspaceId
   */
  moveWindowToWorkspace(windowId, targetWorkspaceId) {
    // Remove window from all workspaces
    this.workspaces.forEach(workspace => {
      const index = workspace.windows.indexOf(windowId);
      if (index !== -1) {
        workspace.windows.splice(index, 1);
      }
    });

    // Add to target workspace
    const targetWorkspace = this.workspaces.find(w => w.id === targetWorkspaceId);
    if (targetWorkspace) {
      targetWorkspace.windows.push(windowId);
      this._saveWorkspaces();
    }
  }

  /**
   * Register a window with the current workspace
   * @param {string} windowId
   */
  registerWindow(windowId) {
    const currentWorkspace = this.getCurrentWorkspace();
    if (currentWorkspace && !currentWorkspace.windows.includes(windowId)) {
      currentWorkspace.windows.push(windowId);
      this._saveWorkspaces();
    }
  }

  /**
   * Unregister a window (when closed)
   * @param {string} windowId
   */
  unregisterWindow(windowId) {
    this.workspaces.forEach(workspace => {
      const index = workspace.windows.indexOf(windowId);
      if (index !== -1) {
        workspace.windows.splice(index, 1);
      }
    });
    this._saveWorkspaces();
  }

  /**
   * Get current workspace
   * @returns {Object} Current workspace
   */
  getCurrentWorkspace() {
    return this.workspaces.find(w => w.id === this.currentWorkspaceId);
  }

  /**
   * Get all workspaces
   * @returns {Array} List of workspaces
   */
  getAllWorkspaces() {
    return this.workspaces;
  }

  /**
   * Hide all windows
   */
  async _hideAllWindows() {
    const { default: WindowManager } = await import('../ui/WindowManager.js');
    const allWindows = WindowManager.getAllWindows();

    allWindows.forEach(win => {
      if (win.element) {
        win.element.style.display = 'none';
      }
    });
  }

  /**
   * Show windows belonging to a workspace
   */
  async _showWorkspaceWindows(workspace) {
    const { default: WindowManager } = await import('../ui/WindowManager.js');

    workspace.windows.forEach(windowId => {
      const win = WindowManager.getWindow(windowId);
      if (win && win.element) {
        win.element.style.display = '';
      }
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  _setupKeyboardShortcuts() {
    document.addEventListener('keydown', async (e) => {
      // Ctrl+Alt+Arrow Left/Right to switch workspaces
      if (e.ctrlKey && e.altKey) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          await this.switchToPreviousWorkspace();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          await this.switchToNextWorkspace();
        }
      }

      // Ctrl+Alt+Number (1-9) to switch to specific workspace
      if (e.ctrlKey && e.altKey && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const workspaceNum = parseInt(e.key);
        if (this.workspaces[workspaceNum - 1]) {
          await this.switchToWorkspace(this.workspaces[workspaceNum - 1].id);
        }
      }
    });
  }

  /**
   * Save workspaces state
   */
  async _saveWorkspaces() {
    try {
      const state = {
        workspaces: this.workspaces,
        currentWorkspaceId: this.currentWorkspaceId,
        nextWorkspaceId: this.nextWorkspaceId
      };

      const fs = this.kernel.getFileSystem();
      if (fs) {
        await fs.writeFile(
          '/home/.config/workspaces.json',
          JSON.stringify(state, null, 2)
        );
      }
    } catch (error) {
      console.warn('Failed to save workspaces:', error);
    }
  }

  /**
   * Load workspaces state
   */
  async _loadWorkspaces() {
    try {
      const fs = this.kernel.getFileSystem();
      if (fs) {
        const data = await fs.readFile('/home/.config/workspaces.json');
        const state = JSON.parse(data);

        this.workspaces = state.workspaces || [];
        this.currentWorkspaceId = state.currentWorkspaceId || 1;
        this.nextWorkspaceId = state.nextWorkspaceId || 1;
      }
    } catch (error) {
      // No saved state - use defaults
    }
  }

  /**
   * Notify listeners of workspace changes
   */
  _notifyWorkspaceListeners(event, workspace) {
    const customEvent = new CustomEvent('workspace-changed', {
      detail: { event, workspace }
    });
    document.dispatchEvent(customEvent);
  }
}

// Export singleton
let workspaceManagerInstance = null;

export function initWorkspaceManager(kernel) {
  if (!workspaceManagerInstance) {
    workspaceManagerInstance = new WorkspaceManager(kernel);
  }
  return workspaceManagerInstance;
}

export function getWorkspaceManager() {
  return workspaceManagerInstance;
}
