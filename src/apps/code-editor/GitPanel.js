/**
 * Git Panel
 * Basic git integration for the code editor
 */
export class GitPanel {
  constructor(vfs, kernel) {
    this.vfs = vfs;
    this.kernel = kernel;
    this.container = null;
    this.visible = false;
    this.status = null;
  }

  /**
   * Initialize Git Panel
   */
  initialize(parent) {
    this.container = document.createElement('div');
    this.container.className = 'git-panel';
    this.container.style.display = 'none';

    this.container.innerHTML = `
      <div class="git-panel-header">
        <h3>🔀 Source Control</h3>
        <button class="git-panel-close" id="close-git-panel">✕</button>
      </div>
      <div class="git-panel-content">
        <div class="git-panel-section">
          <div class="git-panel-section-title">Repository Info</div>
          <div id="git-repo-info" class="git-repo-info">
            <div class="git-info-item">
              <span class="git-info-label">Branch:</span>
              <span class="git-info-value" id="git-branch">main</span>
            </div>
            <div class="git-info-item">
              <span class="git-info-label">Status:</span>
              <span class="git-info-value" id="git-status">Clean</span>
            </div>
          </div>
        </div>

        <div class="git-panel-section">
          <div class="git-panel-section-title">Quick Actions</div>
          <div class="git-actions">
            <button class="git-action-btn" id="git-status-btn">
              📊 Status
            </button>
            <button class="git-action-btn" id="git-add-all-btn">
              ➕ Stage All
            </button>
            <button class="git-action-btn" id="git-commit-btn">
              ✓ Commit
            </button>
            <button class="git-action-btn" id="git-push-btn">
              ⬆️ Push
            </button>
            <button class="git-action-btn" id="git-pull-btn">
              ⬇️ Pull
            </button>
            <button class="git-action-btn" id="git-log-btn">
              📜 Log
            </button>
          </div>
        </div>

        <div class="git-panel-section">
          <div class="git-panel-section-title">Changes</div>
          <div id="git-changes" class="git-changes">
            <div class="git-empty-state">
              Click "Status" to see changes
            </div>
          </div>
        </div>

        <div class="git-panel-section">
          <div class="git-panel-section-title">Terminal Output</div>
          <div id="git-output" class="git-output">
            <div class="git-output-empty">Command output will appear here</div>
          </div>
        </div>
      </div>
    `;

    parent.appendChild(this.container);

    this.setupEventListeners();
    this.applyStyles();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.container.querySelector('#close-git-panel')?.addEventListener('click', () => {
      this.hide();
    });

    this.container.querySelector('#git-status-btn')?.addEventListener('click', async () => {
      await this.runGitCommand('git status');
    });

    this.container.querySelector('#git-add-all-btn')?.addEventListener('click', async () => {
      await this.runGitCommand('git add -A');
    });

    this.container.querySelector('#git-commit-btn')?.addEventListener('click', async () => {
      const message = prompt('Enter commit message:');
      if (message) {
        await this.runGitCommand(`git commit -m "${message}"`);
      }
    });

    this.container.querySelector('#git-push-btn')?.addEventListener('click', async () => {
      await this.runGitCommand('git push');
    });

    this.container.querySelector('#git-pull-btn')?.addEventListener('click', async () => {
      await this.runGitCommand('git pull');
    });

    this.container.querySelector('#git-log-btn')?.addEventListener('click', async () => {
      await this.runGitCommand('git log --oneline -10');
    });
  }

  /**
   * Run git command (simulated for WebOS environment)
   */
  async runGitCommand(command) {
    const output = this.container.querySelector('#git-output');

    // Show loading
    output.innerHTML = `
      <div class="git-output-loading">
        <span class="spinner">⏳</span> Running: ${command}
      </div>
    `;

    try {
      // Note: This is a simplified simulation
      // In a real implementation, you would integrate with a git backend
      // For WebOS, we can use the terminal to run git commands if git is available

      // Simulate git command execution
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = this.simulateGitCommand(command);

      output.innerHTML = `
        <div class="git-output-success">
          <div class="git-output-command">$ ${command}</div>
          <pre class="git-output-text">${result}</pre>
        </div>
      `;

      // Parse status if it was a status command
      if (command.includes('status')) {
        this.updateChanges(result);
      }
    } catch (error) {
      output.innerHTML = `
        <div class="git-output-error">
          <div class="git-output-command">$ ${command}</div>
          <pre class="git-output-text">Error: ${error.message}</pre>
        </div>
      `;
    }
  }

  /**
   * Simulate git command (for demo purposes)
   * In production, this would integrate with actual git
   */
  simulateGitCommand(command) {
    if (command.includes('status')) {
      return `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
\tmodified:   src/apps/code-editor/CodeEditor.js
\tmodified:   src/main.js

Untracked files:
  (use "git add <file>..." to include in what will be committed)
\tsrc/apps/code-editor/CommandPalette.js
\tsrc/apps/code-editor/QuickOpen.js
\tsrc/apps/code-editor/GitPanel.js

no changes added to commit (use "git add" and/or "git commit -a")`;
    }

    if (command.includes('add')) {
      return `Added files to staging area`;
    }

    if (command.includes('commit')) {
      return `[main abc1234] Upgrade code editor
 3 files changed, 1500 insertions(+)
 create mode 100644 src/apps/code-editor/CommandPalette.js
 create mode 100644 src/apps/code-editor/QuickOpen.js
 create mode 100644 src/apps/code-editor/GitPanel.js`;
    }

    if (command.includes('push')) {
      return `Enumerating objects: 10, done.
Counting objects: 100% (10/10), done.
Delta compression using up to 8 threads
Compressing objects: 100% (6/6), done.
Writing objects: 100% (6/6), 15.42 KiB | 5.14 MiB/s, done.
Total 6 (delta 3), reused 0 (delta 0)
To github.com:user/repo.git
   def5678..abc1234  main -> main`;
    }

    if (command.includes('pull')) {
      return `Already up to date.`;
    }

    if (command.includes('log')) {
      return `abc1234 Upgrade code editor
def5678 feat: Complete Phase 12 - Multi-User System
ghi9012 Fix code editor overlays
jkl3456 Add manifest icons
mno7890 feat: Implement Phase 11 - Plugin System`;
    }

    return 'Command executed successfully';
  }

  /**
   * Update changes display from git status output
   */
  updateChanges(statusOutput) {
    const changesDiv = this.container.querySelector('#git-changes');

    // Parse modified and untracked files (simplified)
    const modifiedRegex = /modified:\s+(.+)/g;
    const untrackedRegex = /\t([^\s]+)/g;

    const modified = [];
    const untracked = [];

    let match;
    while ((match = modifiedRegex.exec(statusOutput)) !== null) {
      modified.push(match[1].trim());
    }

    const lines = statusOutput.split('\n');
    let inUntracked = false;
    for (const line of lines) {
      if (line.includes('Untracked files:')) {
        inUntracked = true;
        continue;
      }
      if (inUntracked && line.startsWith('\t')) {
        const file = line.trim();
        if (file && !file.includes('(') && !file.includes('use ')) {
          untracked.push(file);
        }
      }
    }

    if (modified.length === 0 && untracked.length === 0) {
      changesDiv.innerHTML = '<div class="git-empty-state">No changes detected</div>';
      return;
    }

    let html = '';

    if (modified.length > 0) {
      html += '<div class="git-changes-group">';
      html += '<div class="git-changes-group-title">📝 Modified</div>';
      modified.forEach(file => {
        html += `<div class="git-change-item modified">${file}</div>`;
      });
      html += '</div>';
    }

    if (untracked.length > 0) {
      html += '<div class="git-changes-group">';
      html += '<div class="git-changes-group-title">➕ Untracked</div>';
      untracked.forEach(file => {
        html += `<div class="git-change-item untracked">${file}</div>`;
      });
      html += '</div>';
    }

    changesDiv.innerHTML = html;
  }

  /**
   * Show git panel
   */
  show() {
    this.visible = true;
    this.container.style.display = 'flex';
  }

  /**
   * Hide git panel
   */
  hide() {
    this.visible = false;
    this.container.style.display = 'none';
  }

  /**
   * Toggle git panel
   */
  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Apply styles
   */
  applyStyles() {
    const styleId = 'git-panel-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .git-panel {
        position: fixed;
        top: 100px;
        right: 20px;
        width: 400px;
        max-height: 700px;
        background: #2d2d30;
        border-radius: 8px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .git-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #094771;
        color: white;
        border-bottom: 1px solid #3e3e42;
      }

      .git-panel-header h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
      }

      .git-panel-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background 0.2s;
      }

      .git-panel-close:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .git-panel-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }

      .git-panel-section {
        margin-bottom: 20px;
      }

      .git-panel-section-title {
        font-size: 0.85rem;
        font-weight: 600;
        color: #858585;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 10px;
      }

      .git-repo-info {
        background: #1e1e1e;
        padding: 12px;
        border-radius: 4px;
      }

      .git-info-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 0.9rem;
      }

      .git-info-item:last-child {
        margin-bottom: 0;
      }

      .git-info-label {
        color: #858585;
      }

      .git-info-value {
        color: #cccccc;
        font-weight: 600;
      }

      .git-actions {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }

      .git-action-btn {
        padding: 8px 12px;
        background: #094771;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
        text-align: left;
      }

      .git-action-btn:hover {
        background: #0e639c;
      }

      .git-changes {
        background: #1e1e1e;
        border-radius: 4px;
        max-height: 200px;
        overflow-y: auto;
      }

      .git-changes-group {
        margin-bottom: 12px;
      }

      .git-changes-group-title {
        font-size: 0.8rem;
        color: #858585;
        font-weight: 600;
        padding: 8px 12px;
        background: #252526;
        border-bottom: 1px solid #3e3e42;
      }

      .git-change-item {
        padding: 6px 12px;
        font-size: 0.85rem;
        color: #cccccc;
        font-family: monospace;
        border-bottom: 1px solid #2d2d30;
      }

      .git-change-item:last-child {
        border-bottom: none;
      }

      .git-change-item.modified {
        border-left: 3px solid #ffd700;
      }

      .git-change-item.untracked {
        border-left: 3px solid #4ec9b0;
      }

      .git-empty-state {
        padding: 30px 20px;
        text-align: center;
        color: #858585;
        font-size: 0.9rem;
      }

      .git-output {
        background: #1e1e1e;
        border-radius: 4px;
        max-height: 250px;
        overflow-y: auto;
      }

      .git-output-loading,
      .git-output-success,
      .git-output-error {
        padding: 12px;
      }

      .git-output-loading {
        text-align: center;
        color: #858585;
      }

      .spinner {
        display: inline-block;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .git-output-command {
        color: #4ec9b0;
        font-family: monospace;
        font-size: 0.85rem;
        margin-bottom: 8px;
        font-weight: 600;
      }

      .git-output-text {
        color: #cccccc;
        font-family: monospace;
        font-size: 0.8rem;
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .git-output-error .git-output-text {
        color: #f48771;
      }

      .git-output-empty {
        padding: 30px 20px;
        text-align: center;
        color: #858585;
        font-size: 0.85rem;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Destroy git panel
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
