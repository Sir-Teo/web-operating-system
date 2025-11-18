class PermissionManager {
  constructor() {
    this.permissions = new Map();
    this.grants = new Map(); // processId -> Set<permission>
  }

  registerPermission(name, config) {
    this.permissions.set(name, {
      name,
      description: config.description,
      dangerous: config.dangerous || false,
      requiresPrompt: config.requiresPrompt !== false
    });
  }

  async requestPermission(processId, permission) {
    const permConfig = this.permissions.get(permission);

    if (!permConfig) {
      throw new Error(`Unknown permission: ${permission}`);
    }

    if (permConfig.requiresPrompt) {
      const granted = await this._promptUser(processId, permConfig);
      if (granted) {
        this._grantPermission(processId, permission);
      }
      return granted;
    }

    this._grantPermission(processId, permission);
    return true;
  }

  hasPermission(processId, permission) {
    const grants = this.grants.get(processId);
    return grants ? grants.has(permission) : false;
  }

  revokePermission(processId, permission) {
    const grants = this.grants.get(processId);
    if (grants) {
      grants.delete(permission);
    }
  }

  _grantPermission(processId, permission) {
    if (!this.grants.has(processId)) {
      this.grants.set(processId, new Set());
    }
    this.grants.get(processId).add(permission);
  }

  async _promptUser(processId, permission) {
    // Show permission dialog to user
    return new Promise((resolve) => {
      const dialog = document.createElement('dialog');
      dialog.className = 'permission-dialog';
      dialog.innerHTML = `
        <div class="permission-dialog-content">
          <h3>Permission Request</h3>
          <p>${permission.description}</p>
          <div class="permission-actions">
            <button class="btn-deny">Deny</button>
            <button class="btn-allow">Allow</button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);
      dialog.showModal();

      dialog.querySelector('.btn-allow').onclick = () => {
        dialog.close();
        document.body.removeChild(dialog);
        resolve(true);
      };

      dialog.querySelector('.btn-deny').onclick = () => {
        dialog.close();
        document.body.removeChild(dialog);
        resolve(false);
      };
    });
  }
}

// Register standard permissions
const permissionManager = new PermissionManager();

permissionManager.registerPermission('filesystem.read', {
  description: 'Read files from the filesystem',
  dangerous: false
});

permissionManager.registerPermission('filesystem.write', {
  description: 'Write files to the filesystem',
  dangerous: true
});

permissionManager.registerPermission('network.fetch', {
  description: 'Make network requests',
  dangerous: true
});

permissionManager.registerPermission('notification.show', {
  description: 'Show notifications',
  dangerous: false
});

export default permissionManager;
