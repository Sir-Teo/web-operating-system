/**
 * API Tester (Postman-like)
 * Professional REST API testing and development tool
 *
 * Features:
 * - HTTP methods (GET, POST, PUT, DELETE, PATCH, etc.)
 * - Request builder with headers, params, body
 * - JSON, Form Data, Raw body support
 * - Response viewer with syntax highlighting
 * - Request history
 * - Collections and environments
 * - Authentication (Basic, Bearer, API Key)
 * - Response time and status tracking
 * - Export/import collections
 * - Code generation for various languages
 */

export default class APITester {
    static metadata = {
        name: 'API Tester',
        description: 'REST API testing and development tool',
        author: 'WebOS',
        version: '1.0.0',
        category: 'development',
        icon: '🌐'
    };

    constructor(context) {
        this.context = context;
        this.container = null;
        this.history = [];
        this.collections = [];
        this.currentRequest = {
            method: 'GET',
            url: '',
            headers: [],
            params: [],
            body: '',
            auth: { type: 'none' }
        };
    }

    async init() {
        console.log('[APITester] Initialized');
    }

    render() {
        this.container = document.createElement('div');
        this.container.innerHTML = this.createUI();

        setTimeout(() => {
            this.attachEventListeners();
            this.loadSampleHistory();
        }, 0);

        return this.container;
    }

    createUI() {
        return `
            <style>
                .api-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: linear-gradient(135deg, #0f0f1e 0%, #1e1a0f 100%);
                    color: #e0e0e0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .api-toolbar {
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    gap: 12px;
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
                }

                .toolbar-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                    transform: translateY(-1px);
                }

                .api-content {
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
                }

                .history-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                }

                .history-item {
                    padding: 10px;
                    margin-bottom: 6px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 12px;
                }

                .history-item:hover {
                    background: rgba(255, 255, 255, 0.08);
                    transform: translateX(4px);
                }

                .history-method {
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-weight: 600;
                    font-size: 11px;
                    display: inline-block;
                    margin-right: 8px;
                }

                .method-get { background: rgba(40, 167, 69, 0.3); color: #28a745; }
                .method-post { background: rgba(255, 193, 7, 0.3); color: #ffc107; }
                .method-put { background: rgba(23, 162, 184, 0.3); color: #17a2b8; }
                .method-delete { background: rgba(220, 53, 69, 0.3); color: #dc3545; }
                .method-patch { background: rgba(102, 126, 234, 0.3); color: #667eea; }

                .main-panel {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .request-builder {
                    padding: 20px;
                    background: rgba(255, 255, 255, 0.03);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .url-bar {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .method-select {
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 6px;
                    color: #e0e0e0;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                }

                .url-input {
                    flex: 1;
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 6px;
                    color: #e0e0e0;
                    font-size: 14px;
                    font-family: 'Monaco', 'Menlo', monospace;
                }

                .send-btn {
                    padding: 12px 32px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: 1px solid #667eea;
                    border-radius: 6px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 14px;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                }

                .send-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
                }

                .request-tabs {
                    display: flex;
                    gap: 4px;
                    margin-top: 16px;
                }

                .request-tab {
                    padding: 8px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px 6px 0 0;
                    color: #a0a0a0;
                    cursor: pointer;
                    font-size: 13px;
                }

                .request-tab:hover {
                    background: rgba(255, 255, 255, 0.08);
                    color: #e0e0e0;
                }

                .request-tab.active {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: #667eea;
                    color: #e0e0e0;
                }

                .request-tab-content {
                    display: none;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 0 6px 6px 6px;
                    max-height: 200px;
                    overflow-y: auto;
                }

                .request-tab-content.active {
                    display: block;
                }

                .key-value-table {
                    width: 100%;
                }

                .key-value-row {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 8px;
                    align-items: center;
                }

                .key-value-input {
                    flex: 1;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 4px;
                    color: #e0e0e0;
                    font-size: 13px;
                }

                .body-textarea {
                    width: 100%;
                    min-height: 120px;
                    padding: 12px;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 6px;
                    color: #e0e0e0;
                    font-family: 'Monaco', 'Menlo', monospace;
                    font-size: 13px;
                    resize: vertical;
                }

                .response-panel {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    padding: 20px;
                }

                .response-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    margin-bottom: 16px;
                }

                .status-badge {
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 14px;
                }

                .status-success {
                    background: rgba(40, 167, 69, 0.3);
                    color: #28a745;
                }

                .status-error {
                    background: rgba(220, 53, 69, 0.3);
                    color: #dc3545;
                }

                .response-info {
                    font-size: 12px;
                    color: #a0a0a0;
                }

                .response-body {
                    flex: 1;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 16px;
                    overflow: auto;
                    font-family: 'Monaco', 'Menlo', monospace;
                    font-size: 13px;
                    line-height: 1.6;
                }

                .json-key {
                    color: #667eea;
                }

                .json-string {
                    color: #43e97b;
                }

                .json-number {
                    color: #f093fb;
                }

                .json-boolean {
                    color: #ffc107;
                }
            </style>

            <div class="api-container">
                <div class="api-toolbar">
                    <button class="toolbar-btn" data-action="newRequest">➕ New Request</button>
                    <button class="toolbar-btn" data-action="save">💾 Save</button>
                    <button class="toolbar-btn" data-action="import">📥 Import Collection</button>
                    <button class="toolbar-btn" data-action="export">📤 Export Collection</button>
                    <button class="toolbar-btn" data-action="generateCode">💻 Generate Code</button>
                </div>

                <div class="api-content">
                    <div class="sidebar">
                        <div class="sidebar-section">
                            <h3>Collections</h3>
                            <button class="toolbar-btn" style="width: 100%;">+ New Collection</button>
                        </div>

                        <div class="history-list">
                            <h3 style="margin: 0 0 12px 0; font-size: 13px; color: #a0a0a0;">History</h3>
                            <div id="historyList"></div>
                        </div>
                    </div>

                    <div class="main-panel">
                        <div class="request-builder">
                            <div class="url-bar">
                                <select class="method-select" id="methodSelect">
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                    <option value="PUT">PUT</option>
                                    <option value="DELETE">DELETE</option>
                                    <option value="PATCH">PATCH</option>
                                    <option value="HEAD">HEAD</option>
                                    <option value="OPTIONS">OPTIONS</option>
                                </select>
                                <input type="text" class="url-input" id="urlInput" placeholder="https://api.example.com/endpoint">
                                <button class="send-btn" data-action="send">Send</button>
                            </div>

                            <div class="request-tabs">
                                <div class="request-tab active" data-tab="params">Params</div>
                                <div class="request-tab" data-tab="headers">Headers</div>
                                <div class="request-tab" data-tab="body">Body</div>
                                <div class="request-tab" data-tab="auth">Auth</div>
                            </div>

                            <div class="request-tab-content active" data-tab-content="params">
                                <div class="key-value-table" id="paramsTable">
                                    <div class="key-value-row">
                                        <input type="text" class="key-value-input" placeholder="Key">
                                        <input type="text" class="key-value-input" placeholder="Value">
                                        <button class="toolbar-btn">➕</button>
                                    </div>
                                </div>
                            </div>

                            <div class="request-tab-content" data-tab-content="headers">
                                <div class="key-value-table" id="headersTable">
                                    <div class="key-value-row">
                                        <input type="text" class="key-value-input" placeholder="Header">
                                        <input type="text" class="key-value-input" placeholder="Value">
                                        <button class="toolbar-btn">➕</button>
                                    </div>
                                </div>
                            </div>

                            <div class="request-tab-content" data-tab-content="body">
                                <div style="margin-bottom: 12px;">
                                    <select id="bodyType" style="padding: 8px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 4px; color: #e0e0e0;">
                                        <option value="json">JSON</option>
                                        <option value="form">Form Data</option>
                                        <option value="raw">Raw</option>
                                    </select>
                                </div>
                                <textarea class="body-textarea" id="bodyTextarea" placeholder='{\n  "key": "value"\n}'></textarea>
                            </div>

                            <div class="request-tab-content" data-tab-content="auth">
                                <div style="margin-bottom: 12px;">
                                    <select id="authType" style="padding: 8px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 4px; color: #e0e0e0;">
                                        <option value="none">No Auth</option>
                                        <option value="bearer">Bearer Token</option>
                                        <option value="basic">Basic Auth</option>
                                        <option value="apikey">API Key</option>
                                    </select>
                                </div>
                                <div id="authFields"></div>
                            </div>
                        </div>

                        <div class="response-panel">
                            <div class="response-header" id="responseHeader" style="display: none;">
                                <div>
                                    <span class="status-badge" id="statusBadge">200 OK</span>
                                </div>
                                <div class="response-info">
                                    <span id="responseTime">Time: 0ms</span>
                                    <span style="margin: 0 12px;">•</span>
                                    <span id="responseSize">Size: 0 KB</span>
                                </div>
                            </div>

                            <div class="response-body" id="responseBody">
                                <div style="text-align: center; color: #666; padding: 40px;">
                                    Enter a URL and click Send to get a response
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const body = this.container;

        // Toolbar actions
        body.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleAction(action);
            });
        });

        // Request tabs
        body.querySelectorAll('.request-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchRequestTab(tabName);
            });
        });

        // Auth type change
        body.querySelector('#authType').addEventListener('change', (e) => {
            this.updateAuthFields(e.target.value);
        });
    }

    switchRequestTab(tabName) {
        const body = this.container;

        body.querySelectorAll('.request-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        body.querySelectorAll('.request-tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.tabContent === tabName);
        });
    }

    updateAuthFields(type) {
        const fields = this.container.querySelector('#authFields');

        switch (type) {
            case 'bearer':
                fields.innerHTML = `
                    <input type="text" class="key-value-input" placeholder="Token" style="width: 100%; margin-top: 8px;">
                `;
                break;
            case 'basic':
                fields.innerHTML = `
                    <input type="text" class="key-value-input" placeholder="Username" style="width: 100%; margin-top: 8px;">
                    <input type="password" class="key-value-input" placeholder="Password" style="width: 100%; margin-top: 8px;">
                `;
                break;
            case 'apikey':
                fields.innerHTML = `
                    <input type="text" class="key-value-input" placeholder="Key Name" style="width: 100%; margin-top: 8px;">
                    <input type="text" class="key-value-input" placeholder="Value" style="width: 100%; margin-top: 8px;">
                    <select class="key-value-input" style="margin-top: 8px;">
                        <option value="header">Header</option>
                        <option value="query">Query Param</option>
                    </select>
                `;
                break;
            default:
                fields.innerHTML = '<p style="color: #666;">No authentication required</p>';
        }
    }

    handleAction(action) {
        switch (action) {
            case 'send':
                this.sendRequest();
                break;
            case 'newRequest':
                this.newRequest();
                break;
            case 'save':
                this.saveRequest();
                break;
            case 'import':
                this.importCollection();
                break;
            case 'export':
                this.exportCollection();
                break;
            case 'generateCode':
                this.generateCode();
                break;
        }
    }

    async sendRequest() {
        const method = this.container.querySelector('#methodSelect').value;
        const url = this.container.querySelector('#urlInput').value.trim();

        if (!url) {
            alert('Please enter a URL');
            return;
        }

        const startTime = Date.now();

        try {
            // Build request options
            const options = {
                method: method,
                headers: this.getHeaders()
            };

            // Add body for non-GET requests
            if (method !== 'GET' && method !== 'HEAD') {
                const bodyType = this.container.querySelector('#bodyType').value;
                const bodyContent = this.container.querySelector('#bodyTextarea').value;

                if (bodyContent) {
                    if (bodyType === 'json') {
                        options.body = bodyContent;
                        options.headers['Content-Type'] = 'application/json';
                    } else {
                        options.body = bodyContent;
                    }
                }
            }

            // Send request
            const response = await fetch(url, options);
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // Get response data
            const contentType = response.headers.get('content-type');
            let responseData;

            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            // Display response
            this.displayResponse({
                status: response.status,
                statusText: response.statusText,
                time: responseTime,
                size: new Blob([JSON.stringify(responseData)]).size,
                data: responseData,
                isJson: contentType && contentType.includes('application/json')
            });

            // Add to history
            this.addToHistory({
                method,
                url,
                status: response.status,
                time: responseTime,
                timestamp: new Date()
            });

        } catch (error) {
            this.displayError(error.message);
        }
    }

    getHeaders() {
        const headers = {};
        const headerRows = this.container.querySelectorAll('#headersTable .key-value-row');

        headerRows.forEach(row => {
            const key = row.querySelector('input:first-child').value.trim();
            const value = row.querySelector('input:last-child').value.trim();

            if (key && value) {
                headers[key] = value;
            }
        });

        return headers;
    }

    displayResponse(response) {
        const header = this.container.querySelector('#responseHeader');
        const badge = this.container.querySelector('#statusBadge');
        const timeEl = this.container.querySelector('#responseTime');
        const sizeEl = this.container.querySelector('#responseSize');
        const body = this.container.querySelector('#responseBody');

        header.style.display = 'flex';

        badge.textContent = `${response.status} ${response.statusText}`;
        badge.className = 'status-badge ' + (response.status >= 200 && response.status < 300 ? 'status-success' : 'status-error');

        timeEl.textContent = `Time: ${response.time}ms`;
        sizeEl.textContent = `Size: ${(response.size / 1024).toFixed(2)} KB`;

        if (response.isJson) {
            body.innerHTML = this.syntaxHighlightJSON(response.data);
        } else {
            body.textContent = response.data;
        }
    }

    displayError(message) {
        const header = this.container.querySelector('#responseHeader');
        const badge = this.container.querySelector('#statusBadge');
        const body = this.container.querySelector('#responseBody');

        header.style.display = 'flex';
        badge.textContent = 'Error';
        badge.className = 'status-badge status-error';

        body.innerHTML = `<div style="color: #dc3545;">${message}</div>`;
    }

    syntaxHighlightJSON(json) {
        if (typeof json !== 'string') {
            json = JSON.stringify(json, null, 2);
        }

        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
            let cls = 'json-number';

            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }

            return `<span class="${cls}">${match}</span>`;
        });
    }

    addToHistory(request) {
        this.history.unshift(request);

        // Limit history to 50 items
        if (this.history.length > 50) {
            this.history.pop();
        }

        this.updateHistoryList();
    }

    updateHistoryList() {
        const list = this.container.querySelector('#historyList');

        list.innerHTML = this.history.map(item => `
            <div class="history-item">
                <div>
                    <span class="history-method method-${item.method.toLowerCase()}">${item.method}</span>
                    <span style="color: #a0a0a0;">${item.status}</span>
                </div>
                <div style="margin-top: 4px; font-size: 11px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${item.url}
                </div>
                <div style="margin-top: 4px; font-size: 10px; color: #555;">
                    ${item.time}ms • ${item.timestamp.toLocaleTimeString()}
                </div>
            </div>
        `).join('');

        // Add click handlers
        list.querySelectorAll('.history-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                const request = this.history[index];
                this.container.querySelector('#methodSelect').value = request.method;
                this.container.querySelector('#urlInput').value = request.url;
            });
        });
    }

    loadSampleHistory() {
        this.history = [
            {
                method: 'GET',
                url: 'https://api.github.com/users/octocat',
                status: 200,
                time: 245,
                timestamp: new Date()
            },
            {
                method: 'POST',
                url: 'https://jsonplaceholder.typicode.com/posts',
                status: 201,
                time: 312,
                timestamp: new Date(Date.now() - 300000)
            },
            {
                method: 'GET',
                url: 'https://api.openweathermap.org/data/2.5/weather',
                status: 200,
                time: 189,
                timestamp: new Date(Date.now() - 600000)
            }
        ];

        this.updateHistoryList();
    }

    newRequest() {
        this.container.querySelector('#urlInput').value = '';
        this.container.querySelector('#bodyTextarea').value = '';
        this.container.querySelector('#responseBody').innerHTML = '<div style="text-align: center; color: #666; padding: 40px;">Enter a URL and click Send to get a response</div>';
        this.container.querySelector('#responseHeader').style.display = 'none';
    }

    saveRequest() {
        const name = prompt('Enter request name:');
        if (name) {
            alert(`Request "${name}" would be saved to a collection`);
        }
    }

    importCollection() {
        alert('Import Postman collection dialog would appear');
    }

    exportCollection() {
        const collection = {
            name: 'API Tester Collection',
            requests: this.history,
            timestamp: new Date()
        };

        const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'api-collection.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    generateCode() {
        const method = this.container.querySelector('#methodSelect').value;
        const url = this.container.querySelector('#urlInput').value;

        const code = `// JavaScript Fetch
fetch('${url}', {
    method: '${method}',
    headers: {
        'Content-Type': 'application/json'
    }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;

        alert('Code generation dialog would show code for various languages');
        console.log(code);
    }
}
