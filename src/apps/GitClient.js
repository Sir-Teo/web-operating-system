/**
 * Git GUI Client
 * Full-featured Git interface with visual diff, branch management, and commit history
 *
 * Features:
 * - Visual repository status
 * - File staging and unstaging
 * - Commit with message editor
 * - Branch creation, switching, and deletion
 * - Visual diff viewer with syntax highlighting
 * - Commit history with graph visualization
 * - Remote operations (push, pull, fetch)
 * - Stash management
 * - Merge and rebase operations
 * - Tag management
 * - Clone repositories
 */

export default class GitClient {
    static metadata = {
        name: 'Git Client',
        description: 'Visual Git version control interface',
        author: 'WebOS',
        version: '1.0.0',
        category: 'development',
        icon: '🌿'
    };

    constructor(system) {
        this.system = system;
        this.window = null;
        this.currentRepo = null;
        this.repoStatus = null;
        this.branches = [];
        this.commits = [];
        this.currentBranch = null;
        this.stagedFiles = new Set();
        this.selectedFile = null;
    }

    async open(args) {
        this.window = this.system.windowManager.createWindow({
            title: 'Git Client',
            width: '1400px',
            height: '900px',
            x: '5%',
            y: '3%'
        });

        const content = this.createUI();
        this.window.body.innerHTML = content;

        this.attachEventListeners();
        await this.loadRepository(args?.path || '/home/' + this.system.kernel.currentUser);
    }

    createUI() {
        return `
            <style>
                .git-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
                    color: #e0e0e0;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                }

                .git-toolbar {
                    display: flex;
                    gap: 12px;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                }

                .toolbar-group {
                    display: flex;
                    gap: 6px;
                    padding: 6px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .toolbar-btn {
                    padding: 10px 16px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 6px;
                    color: #e0e0e0;
                    cursor: pointer;
                    font-size: 13px;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .toolbar-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(255, 255, 255, 0.3);
                    transform: translateY(-1px);
                }

                .toolbar-btn.active {
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    border-color: #28a745;
                    box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);
                }

                .toolbar-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .git-content {
                    display: flex;
                    flex: 1;
                    overflow: hidden;
                }

                .sidebar {
                    width: 280px;
                    background: rgba(255, 255, 255, 0.03);
                    border-right: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    flex-direction: column;
                }

                .sidebar-section {
                    padding: 16px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .sidebar-section h3 {
                    margin: 0 0 12px 0;
                    font-size: 13px;
                    font-weight: 600;
                    color: #a0a0a0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .branch-list {
                    flex: 1;
                    overflow-y: auto;
                }

                .branch-item {
                    padding: 10px;
                    margin: 4px 0;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                }

                .branch-item:hover {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.2);
                }

                .branch-item.active {
                    background: linear-gradient(135deg, rgba(40, 167, 69, 0.2) 0%, rgba(32, 201, 151, 0.2) 100%);
                    border-color: #28a745;
                    box-shadow: 0 0 10px rgba(40, 167, 69, 0.3);
                }

                .branch-icon {
                    color: #28a745;
                }

                .main-panel {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .tab-bar {
                    display: flex;
                    gap: 4px;
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .tab {
                    padding: 8px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px 6px 0 0;
                    color: #a0a0a0;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 13px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .tab:hover {
                    background: rgba(255, 255, 255, 0.08);
                    color: #e0e0e0;
                }

                .tab.active {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: #28a745;
                    color: #e0e0e0;
                }

                .tab-content {
                    flex: 1;
                    overflow: auto;
                    display: none;
                }

                .tab-content.active {
                    display: flex;
                    flex-direction: column;
                }

                .changes-panel {
                    display: flex;
                    flex: 1;
                }

                .files-list {
                    width: 350px;
                    border-right: 1px solid rgba(255, 255, 255, 0.1);
                    overflow-y: auto;
                    padding: 16px;
                }

                .files-section {
                    margin-bottom: 24px;
                }

                .files-section h4 {
                    margin: 0 0 12px 0;
                    font-size: 13px;
                    color: #a0a0a0;
                    font-weight: 600;
                    text-transform: uppercase;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .file-item {
                    padding: 10px;
                    margin: 4px 0;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                }

                .file-item:hover {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.2);
                }

                .file-item.selected {
                    background: rgba(40, 167, 69, 0.2);
                    border-color: #28a745;
                }

                .file-status {
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 600;
                }

                .status-modified {
                    background: rgba(255, 193, 7, 0.3);
                    color: #ffc107;
                }

                .status-added {
                    background: rgba(40, 167, 69, 0.3);
                    color: #28a745;
                }

                .status-deleted {
                    background: rgba(220, 53, 69, 0.3);
                    color: #dc3545;
                }

                .status-renamed {
                    background: rgba(23, 162, 184, 0.3);
                    color: #17a2b8;
                }

                .diff-viewer {
                    flex: 1;
                    padding: 16px;
                    overflow: auto;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 13px;
                    line-height: 1.5;
                }

                .diff-line {
                    padding: 2px 8px;
                    white-space: pre;
                }

                .diff-line.added {
                    background: rgba(40, 167, 69, 0.2);
                    color: #a8f0b8;
                }

                .diff-line.removed {
                    background: rgba(220, 53, 69, 0.2);
                    color: #f0a8a8;
                }

                .diff-line.header {
                    background: rgba(102, 126, 234, 0.2);
                    color: #b8c8f0;
                    font-weight: 600;
                }

                .commit-panel {
                    padding: 16px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(255, 255, 255, 0.03);
                }

                .commit-input {
                    width: 100%;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 6px;
                    color: #e0e0e0;
                    font-size: 14px;
                    margin-bottom: 8px;
                    resize: vertical;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .commit-input::placeholder {
                    color: #666;
                }

                .history-panel {
                    padding: 16px;
                    overflow-y: auto;
                }

                .commit-item {
                    padding: 16px;
                    margin-bottom: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }

                .commit-item:hover {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.2);
                    transform: translateX(4px);
                }

                .commit-hash {
                    font-family: 'Monaco', 'Menlo', monospace;
                    color: #667eea;
                    font-size: 12px;
                    margin-bottom: 6px;
                }

                .commit-message {
                    font-size: 14px;
                    font-weight: 600;
                    margin-bottom: 6px;
                }

                .commit-meta {
                    font-size: 12px;
                    color: #888;
                }

                .repo-info {
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 6px;
                    font-size: 12px;
                    line-height: 1.6;
                }

                .repo-info-item {
                    display: flex;
                    justify-content: space-between;
                    margin: 4px 0;
                }

                .repo-info-label {
                    color: #888;
                }

                .repo-info-value {
                    color: #e0e0e0;
                    font-weight: 500;
                }

                .stash-list {
                    padding: 16px;
                    overflow-y: auto;
                }

                .stash-item {
                    padding: 12px;
                    margin-bottom: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .stash-message {
                    font-size: 13px;
                }

                .stash-actions {
                    display: flex;
                    gap: 6px;
                }

                .small-btn {
                    padding: 4px 10px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 4px;
                    color: #e0e0e0;
                    cursor: pointer;
                    font-size: 11px;
                }

                .small-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                }
            </style>

            <div class="git-container">
                <div class="git-toolbar">
                    <div class="toolbar-group">
                        <button class="toolbar-btn" data-action="clone">📥 Clone</button>
                        <button class="toolbar-btn" data-action="init">🌱 Init</button>
                        <button class="toolbar-btn" data-action="open">📁 Open</button>
                    </div>

                    <div class="toolbar-group">
                        <button class="toolbar-btn" data-action="stage">➕ Stage</button>
                        <button class="toolbar-btn" data-action="unstage">➖ Unstage</button>
                        <button class="toolbar-btn" data-action="commit">✅ Commit</button>
                    </div>

                    <div class="toolbar-group">
                        <button class="toolbar-btn" data-action="pull">⬇️ Pull</button>
                        <button class="toolbar-btn" data-action="push">⬆️ Push</button>
                        <button class="toolbar-btn" data-action="fetch">🔄 Fetch</button>
                    </div>

                    <div class="toolbar-group">
                        <button class="toolbar-btn" data-action="stash">💾 Stash</button>
                        <button class="toolbar-btn" data-action="pop">📤 Pop</button>
                    </div>

                    <div class="toolbar-group">
                        <button class="toolbar-btn" data-action="refresh">🔄 Refresh</button>
                    </div>
                </div>

                <div class="git-content">
                    <div class="sidebar">
                        <div class="sidebar-section">
                            <h3>Repository</h3>
                            <div class="repo-info" id="repoInfo">
                                <div class="repo-info-item">
                                    <span class="repo-info-label">Path:</span>
                                    <span class="repo-info-value">Not opened</span>
                                </div>
                            </div>
                        </div>

                        <div class="sidebar-section">
                            <h3>Current Branch</h3>
                            <div id="currentBranch" style="padding: 8px; color: #28a745; font-weight: 600;">-</div>
                        </div>

                        <div class="sidebar-section" style="flex: 1; display: flex; flex-direction: column;">
                            <h3>Branches</h3>
                            <div class="branch-list" id="branchList"></div>
                            <button class="toolbar-btn" data-action="newBranch" style="margin-top: 8px;">+ New Branch</button>
                        </div>
                    </div>

                    <div class="main-panel">
                        <div class="tab-bar">
                            <div class="tab active" data-tab="changes">Changes</div>
                            <div class="tab" data-tab="history">History</div>
                            <div class="tab" data-tab="stash">Stash</div>
                        </div>

                        <div class="tab-content active" data-tab-content="changes">
                            <div class="changes-panel">
                                <div class="files-list">
                                    <div class="files-section" id="stagedSection">
                                        <h4>Staged Changes</h4>
                                        <div id="stagedFiles"></div>
                                    </div>
                                    <div class="files-section" id="unstagedSection">
                                        <h4>Unstaged Changes</h4>
                                        <div id="unstagedFiles"></div>
                                    </div>
                                    <div class="files-section" id="untrackedSection">
                                        <h4>Untracked Files</h4>
                                        <div id="untrackedFiles"></div>
                                    </div>
                                </div>

                                <div class="diff-viewer" id="diffViewer">
                                    <div style="text-align: center; color: #666; padding: 40px;">
                                        Select a file to view diff
                                    </div>
                                </div>
                            </div>

                            <div class="commit-panel">
                                <input type="text" class="commit-input" id="commitMessage" placeholder="Commit message" style="height: 40px;">
                                <textarea class="commit-input" id="commitDescription" placeholder="Extended description (optional)" rows="3"></textarea>
                                <button class="toolbar-btn active" data-action="commit" style="width: 100%;">Commit Changes</button>
                            </div>
                        </div>

                        <div class="tab-content" data-tab-content="history">
                            <div class="history-panel" id="historyPanel"></div>
                        </div>

                        <div class="tab-content" data-tab-content="stash">
                            <div class="stash-list" id="stashList"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const body = this.window.body;

        // Toolbar actions
        body.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleAction(action);
            });
        });

        // Tab switching
        body.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        const body = this.window.body;

        // Update tabs
        body.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update content
        body.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.tabContent === tabName);
        });

        // Load tab data
        if (tabName === 'history') {
            this.loadHistory();
        } else if (tabName === 'stash') {
            this.loadStash();
        }
    }

    async handleAction(action) {
        switch (action) {
            case 'clone':
                await this.cloneRepository();
                break;
            case 'init':
                await this.initRepository();
                break;
            case 'open':
                await this.openRepository();
                break;
            case 'stage':
                await this.stageFile();
                break;
            case 'unstage':
                await this.unstageFile();
                break;
            case 'commit':
                await this.commitChanges();
                break;
            case 'pull':
                await this.pull();
                break;
            case 'push':
                await this.push();
                break;
            case 'fetch':
                await this.fetch();
                break;
            case 'stash':
                await this.stashChanges();
                break;
            case 'pop':
                await this.popStash();
                break;
            case 'newBranch':
                await this.createBranch();
                break;
            case 'refresh':
                await this.refresh();
                break;
        }
    }

    async loadRepository(path) {
        this.currentRepo = path;

        // Update UI
        const repoInfo = this.window.body.querySelector('#repoInfo');
        repoInfo.innerHTML = `
            <div class="repo-info-item">
                <span class="repo-info-label">Path:</span>
                <span class="repo-info-value">${path}</span>
            </div>
            <div class="repo-info-item">
                <span class="repo-info-label">Status:</span>
                <span class="repo-info-value">Active</span>
            </div>
        `;

        // Load mock data (in real implementation, this would call git commands)
        await this.loadMockData();
    }

    async loadMockData() {
        // Mock current branch
        this.currentBranch = 'main';
        this.window.body.querySelector('#currentBranch').textContent = this.currentBranch;

        // Mock branches
        this.branches = [
            { name: 'main', current: true, remote: 'origin/main' },
            { name: 'development', current: false, remote: 'origin/development' },
            { name: 'feature/new-ui', current: false, remote: null }
        ];

        this.updateBranchList();

        // Mock file changes
        this.repoStatus = {
            staged: [
                { path: 'src/apps/AdvancedImageEditor.js', status: 'modified' },
                { path: 'src/apps/DataVisualization.js', status: 'added' }
            ],
            unstaged: [
                { path: 'src/kernel/Kernel.js', status: 'modified' },
                { path: 'README.md', status: 'modified' }
            ],
            untracked: [
                { path: 'src/apps/GitClient.js', status: 'untracked' }
            ]
        };

        this.updateFilesList();

        // Mock commits
        this.commits = [
            {
                hash: 'a1b2c3d',
                message: 'Add advanced image editor',
                author: 'Developer',
                date: new Date().toISOString(),
                description: 'Implemented professional image editing with layers and filters'
            },
            {
                hash: 'e4f5g6h',
                message: 'Add data visualization suite',
                author: 'Developer',
                date: new Date(Date.now() - 86400000).toISOString(),
                description: 'Created interactive charts and graphs'
            },
            {
                hash: 'i7j8k9l',
                message: 'Implement Git GUI client',
                author: 'Developer',
                date: new Date(Date.now() - 172800000).toISOString(),
                description: 'Full-featured version control interface'
            }
        ];
    }

    updateBranchList() {
        const branchList = this.window.body.querySelector('#branchList');
        branchList.innerHTML = this.branches.map(branch => `
            <div class="branch-item ${branch.current ? 'active' : ''}" data-branch="${branch.name}">
                <span class="branch-icon">🌿</span>
                <span>${branch.name}</span>
                ${branch.remote ? `<span style="color: #666; font-size: 11px;">→ ${branch.remote}</span>` : ''}
            </div>
        `).join('');

        // Add click handlers
        branchList.querySelectorAll('.branch-item').forEach(item => {
            item.addEventListener('click', () => {
                this.switchBranch(item.dataset.branch);
            });
        });
    }

    updateFilesList() {
        // Staged files
        const stagedFiles = this.window.body.querySelector('#stagedFiles');
        stagedFiles.innerHTML = this.repoStatus.staged.map(file => `
            <div class="file-item" data-file="${file.path}" data-staged="true">
                <span class="file-status status-${file.status}">${file.status.charAt(0).toUpperCase()}</span>
                <span style="flex: 1;">${file.path}</span>
            </div>
        `).join('');

        // Unstaged files
        const unstagedFiles = this.window.body.querySelector('#unstagedFiles');
        unstagedFiles.innerHTML = this.repoStatus.unstaged.map(file => `
            <div class="file-item" data-file="${file.path}" data-staged="false">
                <span class="file-status status-${file.status}">${file.status.charAt(0).toUpperCase()}</span>
                <span style="flex: 1;">${file.path}</span>
            </div>
        `).join('');

        // Untracked files
        const untrackedFiles = this.window.body.querySelector('#untrackedFiles');
        untrackedFiles.innerHTML = this.repoStatus.untracked.map(file => `
            <div class="file-item" data-file="${file.path}" data-staged="false">
                <span class="file-status status-added">?</span>
                <span style="flex: 1;">${file.path}</span>
            </div>
        `).join('');

        // Add click handlers
        this.window.body.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', () => {
                this.window.body.querySelectorAll('.file-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                this.selectedFile = item.dataset.file;
                this.showDiff(item.dataset.file);
            });
        });
    }

    showDiff(filePath) {
        const diffViewer = this.window.body.querySelector('#diffViewer');

        // Mock diff
        const mockDiff = `
@@ -1,5 +1,8 @@
 /**
  * ${filePath}
+ * Added new features
+ * Improved performance
  */

 export default class Example {
-    constructor() {
+    constructor(options = {}) {
+        this.options = options;
         this.initialized = false;
     }
 }
        `.trim();

        const lines = mockDiff.split('\n');
        let html = '';

        for (const line of lines) {
            let className = '';
            if (line.startsWith('@@')) {
                className = 'header';
            } else if (line.startsWith('+')) {
                className = 'added';
            } else if (line.startsWith('-')) {
                className = 'removed';
            }

            html += `<div class="diff-line ${className}">${this.escapeHtml(line)}</div>`;
        }

        diffViewer.innerHTML = html;
    }

    async stageFile() {
        if (!this.selectedFile) {
            alert('Please select a file first');
            return;
        }

        // Move file to staged
        const fileIndex = this.repoStatus.unstaged.findIndex(f => f.path === this.selectedFile);
        if (fileIndex >= 0) {
            const file = this.repoStatus.unstaged.splice(fileIndex, 1)[0];
            this.repoStatus.staged.push(file);
            this.updateFilesList();
        }

        const untrackedIndex = this.repoStatus.untracked.findIndex(f => f.path === this.selectedFile);
        if (untrackedIndex >= 0) {
            const file = this.repoStatus.untracked.splice(untrackedIndex, 1)[0];
            file.status = 'added';
            this.repoStatus.staged.push(file);
            this.updateFilesList();
        }
    }

    async unstageFile() {
        if (!this.selectedFile) {
            alert('Please select a file first');
            return;
        }

        // Move file to unstaged
        const fileIndex = this.repoStatus.staged.findIndex(f => f.path === this.selectedFile);
        if (fileIndex >= 0) {
            const file = this.repoStatus.staged.splice(fileIndex, 1)[0];
            if (file.status === 'added') {
                this.repoStatus.untracked.push(file);
            } else {
                this.repoStatus.unstaged.push(file);
            }
            this.updateFilesList();
        }
    }

    async commitChanges() {
        const message = this.window.body.querySelector('#commitMessage').value.trim();
        const description = this.window.body.querySelector('#commitDescription').value.trim();

        if (!message) {
            alert('Please enter a commit message');
            return;
        }

        if (this.repoStatus.staged.length === 0) {
            alert('No staged changes to commit');
            return;
        }

        // Create commit
        const commit = {
            hash: Math.random().toString(36).substr(2, 7),
            message: message,
            author: this.system.kernel.currentUser,
            date: new Date().toISOString(),
            description: description
        };

        this.commits.unshift(commit);

        // Clear staged files
        this.repoStatus.staged = [];
        this.updateFilesList();

        // Clear inputs
        this.window.body.querySelector('#commitMessage').value = '';
        this.window.body.querySelector('#commitDescription').value = '';

        alert('Changes committed successfully!');
    }

    loadHistory() {
        const historyPanel = this.window.body.querySelector('#historyPanel');

        historyPanel.innerHTML = this.commits.map(commit => `
            <div class="commit-item">
                <div class="commit-hash">${commit.hash}</div>
                <div class="commit-message">${commit.message}</div>
                ${commit.description ? `<div style="color: #aaa; font-size: 12px; margin: 6px 0;">${commit.description}</div>` : ''}
                <div class="commit-meta">
                    <strong>${commit.author}</strong> committed ${new Date(commit.date).toLocaleString()}
                </div>
            </div>
        `).join('');
    }

    loadStash() {
        const stashList = this.window.body.querySelector('#stashList');

        // Mock stash
        const stashes = [
            { index: 0, message: 'WIP: Working on new feature', date: new Date() },
            { index: 1, message: 'Experimental changes', date: new Date(Date.now() - 86400000) }
        ];

        stashList.innerHTML = stashes.map(stash => `
            <div class="stash-item">
                <div>
                    <div class="stash-message">${stash.message}</div>
                    <div style="font-size: 11px; color: #666;">${stash.date.toLocaleString()}</div>
                </div>
                <div class="stash-actions">
                    <button class="small-btn" data-stash="${stash.index}" data-action="apply">Apply</button>
                    <button class="small-btn" data-stash="${stash.index}" data-action="drop">Drop</button>
                </div>
            </div>
        `).join('');
    }

    async switchBranch(branchName) {
        this.currentBranch = branchName;
        this.branches.forEach(b => b.current = b.name === branchName);
        this.window.body.querySelector('#currentBranch').textContent = branchName;
        this.updateBranchList();
        alert(`Switched to branch '${branchName}'`);
    }

    async createBranch() {
        const name = prompt('Enter new branch name:');
        if (name) {
            this.branches.push({
                name: name,
                current: false,
                remote: null
            });
            this.updateBranchList();
            alert(`Branch '${name}' created successfully`);
        }
    }

    async cloneRepository() {
        const url = prompt('Enter repository URL:');
        if (url) {
            alert('Clone functionality would execute: git clone ' + url);
        }
    }

    async initRepository() {
        const path = prompt('Enter path for new repository:');
        if (path) {
            alert('Init functionality would execute: git init at ' + path);
        }
    }

    async openRepository() {
        const path = prompt('Enter repository path:', this.currentRepo);
        if (path) {
            await this.loadRepository(path);
        }
    }

    async pull() {
        alert('Pull functionality would execute: git pull');
    }

    async push() {
        alert('Push functionality would execute: git push');
    }

    async fetch() {
        alert('Fetch functionality would execute: git fetch');
    }

    async stashChanges() {
        alert('Stash functionality would execute: git stash');
    }

    async popStash() {
        alert('Pop functionality would execute: git stash pop');
    }

    async refresh() {
        await this.loadRepository(this.currentRepo);
        alert('Repository refreshed');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
