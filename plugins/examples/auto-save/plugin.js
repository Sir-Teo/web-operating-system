/**
 * Auto Save Plugin
 * Automatically saves files periodically
 */
class AutoSave {
  constructor(api) {
    this.api = api;
    this.autoSaveInterval = null;
    this.saveIntervalMs = 30000; // 30 seconds
    this.modifiedFiles = new Set();
    this.lastSaveTime = new Map();
  }

  async activate() {
    // Hook into file changes
    this.api.hooks.onFileSave((file) => {
      this.lastSaveTime.set(file.path, Date.now());
      this.modifiedFiles.delete(file.path);
    });

    // Monitor for file modifications
    // In a real implementation, this would hook into editor events
    // For demo purposes, we'll use a simple interval
    this.autoSaveInterval = this.api.timers.setInterval(
      () => this.checkAndSave(),
      this.saveIntervalMs
    );

    this.api.ui.notify('Auto-save enabled (saves every 30s)', {
      title: 'Auto Save',
      duration: 3000
    });

    console.log('[AutoSave] Plugin activated');
  }

  async checkAndSave() {
    // In a real implementation, this would check for modified files
    // and save them. For now, we'll just log.

    if (this.modifiedFiles.size > 0) {
      console.log(`[AutoSave] Checking ${this.modifiedFiles.size} modified files...`);

      for (const filePath of this.modifiedFiles) {
        try {
          // Check if file was recently saved
          const lastSave = this.lastSaveTime.get(filePath) || 0;
          const timeSinceLastSave = Date.now() - lastSave;

          if (timeSinceLastSave > this.saveIntervalMs) {
            console.log(`[AutoSave] Would auto-save: ${filePath}`);
            // In real implementation: await this.api.fs.writeFile(filePath, content);
            this.lastSaveTime.set(filePath, Date.now());
            this.modifiedFiles.delete(filePath);
          }
        } catch (error) {
          console.error(`[AutoSave] Error saving ${filePath}:`, error);
        }
      }
    }
  }

  // Method to be called by editor when file is modified
  markFileAsModified(filePath) {
    this.modifiedFiles.add(filePath);
  }

  async deactivate() {
    // Clear interval
    if (this.autoSaveInterval) {
      this.api.timers.clearInterval(this.autoSaveInterval);
    }

    // Save any remaining modified files
    if (this.modifiedFiles.size > 0) {
      this.api.ui.notify(`${this.modifiedFiles.size} file(s) not saved`, {
        title: 'Auto Save',
        duration: 3000
      });
    }

    this.api.ui.notify('Auto-save disabled', {
      title: 'Auto Save',
      duration: 2000
    });

    console.log('[AutoSave] Plugin deactivated');
  }
}

module.exports = AutoSave;
