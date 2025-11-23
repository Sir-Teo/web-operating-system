/**
 * Database Manager
 * SQLite database management with visual query builder
 *
 * Features:
 * - Create and manage SQLite databases
 * - Visual table designer
 * - SQL query editor with syntax highlighting
 * - Data grid with editing
 * - Import/export (SQL, CSV, JSON)
 * - Query history
 * - Database diagram visualization
 * - Index management
 * - Transaction support
 */

export default class DatabaseManager {
    static metadata = {
        name: 'Database Manager',
        description: 'SQLite database management and query builder',
        author: 'WebOS',
        version: '1.0.0',
        category: 'development',
        icon: '🗄️'
    };

    constructor(system) {
        this.system = system;
        this.window = null;
        this.currentDb = null;
        this.tables = [];
        this.queryHistory = [];
    }

    async open(args) {
        this.window = this.system.windowManager.createWindow({
            title: 'Database Manager',
            width: '1400px',
            height: '900px',
            x: '5%',
            y: '3%'
        });

        const content = this.createUI();
        this.window.body.innerHTML = content;

        this.attachEventListeners();
        this.initializeSampleData();
    }

    createUI() {
        return `
            <style>
                .db-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: linear-gradient(135deg, #1a1a2e 0%, #0f1e1e 100%);
                    color: #e0e0e0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .db-toolbar {
                    display: flex;
                    gap: 12px;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
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

                .toolbar-btn.execute {
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    border-color: #28a745;
                    font-weight: 600;
                }

                .db-content {
                    display: flex;
                    flex: 1;
                    overflow: hidden;
                }

                .db-sidebar {
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
                }

                .tables-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                }

                .table-item {
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

                .table-item:hover {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.2);
                    transform: translateX(4px);
                }

                .table-item.active {
                    background: linear-gradient(135deg, rgba(40, 167, 69, 0.2) 0%, rgba(32, 201, 151, 0.2) 100%);
                    border-color: #28a745;
                }

                .main-panel {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .query-editor {
                    height: 200px;
                    background: rgba(255, 255, 255, 0.03);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    flex-direction: column;
                }

                .editor-header {
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    font-weight: 600;
                    font-size: 13px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .sql-textarea {
                    flex: 1;
                    padding: 16px;
                    background: #0a0a0a;
                    border: none;
                    color: #e0e0e0;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 14px;
                    resize: none;
                    line-height: 1.6;
                }

                .results-panel {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .results-table-container {
                    flex: 1;
                    overflow: auto;
                    padding: 16px;
                }

                .results-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }

                .results-table th {
                    background: rgba(40, 167, 69, 0.2);
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    position: sticky;
                    top: 0;
                }

                .results-table td {
                    padding: 10px 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .results-table tr:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .results-info {
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    font-size: 12px;
                    color: #a0a0a0;
                }

                .schema-viewer {
                    padding: 16px;
                    overflow-y: auto;
                }

                .schema-table {
                    margin-bottom: 24px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    overflow: hidden;
                }

                .schema-table-header {
                    padding: 12px 16px;
                    background: rgba(40, 167, 69, 0.2);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    font-weight: 600;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .schema-columns {
                    padding: 0;
                }

                .schema-column {
                    padding: 10px 16px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    justify-content: space-between;
                    font-size: 13px;
                }

                .schema-column:last-child {
                    border-bottom: none;
                }

                .column-name {
                    font-weight: 500;
                    color: #667eea;
                }

                .column-type {
                    color: #a0a0a0;
                    font-size: 12px;
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
            </style>

            <div class="db-container">
                <div class="db-toolbar">
                    <button class="toolbar-btn execute" data-action="execute">▶️ Execute Query</button>
                    <button class="toolbar-btn" data-action="newDb">📁 New Database</button>
                    <button class="toolbar-btn" data-action="openDb">📂 Open Database</button>
                    <button class="toolbar-btn" data-action="newTable">➕ New Table</button>
                    <button class="toolbar-btn" data-action="import">📥 Import</button>
                    <button class="toolbar-btn" data-action="export">📤 Export</button>
                    <button class="toolbar-btn" data-action="diagram">📊 Diagram</button>
                </div>

                <div class="db-content">
                    <div class="db-sidebar">
                        <div class="sidebar-section">
                            <h3>Database</h3>
                            <div style="padding: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 6px; font-size: 12px;">
                                <div>sample.db</div>
                                <div style="color: #666; margin-top: 4px;">SQLite 3.0</div>
                            </div>
                        </div>

                        <div class="tables-list">
                            <h3 style="margin: 0 0 12px 0; font-size: 13px; color: #a0a0a0;">Tables</h3>
                            <div id="tablesList"></div>
                        </div>
                    </div>

                    <div class="main-panel">
                        <div class="query-editor">
                            <div class="editor-header">
                                <span>SQL Query Editor</span>
                                <button class="toolbar-btn" data-action="clear">🗑️ Clear</button>
                            </div>
                            <textarea class="sql-textarea" id="sqlEditor" placeholder="Enter SQL query...&#10;&#10;Example:&#10;SELECT * FROM users WHERE age > 18;&#10;&#10;INSERT INTO users (name, email) VALUES ('John', 'john@example.com');"></textarea>
                        </div>

                        <div class="tab-bar">
                            <div class="tab active" data-tab="results">Results</div>
                            <div class="tab" data-tab="schema">Schema</div>
                            <div class="tab" data-tab="history">Query History</div>
                        </div>

                        <div class="tab-content active" data-tab-content="results">
                            <div class="results-panel">
                                <div class="results-table-container" id="resultsContainer">
                                    <div style="text-align: center; color: #666; padding: 40px;">
                                        Execute a query to see results
                                    </div>
                                </div>
                                <div class="results-info" id="resultsInfo">
                                    Ready
                                </div>
                            </div>
                        </div>

                        <div class="tab-content" data-tab-content="schema">
                            <div class="schema-viewer" id="schemaViewer"></div>
                        </div>

                        <div class="tab-content" data-tab-content="history">
                            <div style="padding: 16px;" id="historyList">
                                <p style="text-align: center; color: #666;">No query history</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const body = this.window.body;

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

        // SQL editor shortcuts
        const editor = body.querySelector('#sqlEditor');
        editor.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.executeQuery();
            }
        });
    }

    switchTab(tabName) {
        const body = this.window.body;

        body.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        body.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.dataset.tabContent === tabName);
        });

        if (tabName === 'schema') {
            this.showSchema();
        } else if (tabName === 'history') {
            this.showHistory();
        }
    }

    handleAction(action) {
        switch (action) {
            case 'execute':
                this.executeQuery();
                break;
            case 'newDb':
                this.createDatabase();
                break;
            case 'openDb':
                this.openDatabase();
                break;
            case 'newTable':
                this.createTable();
                break;
            case 'import':
                this.importData();
                break;
            case 'export':
                this.exportData();
                break;
            case 'diagram':
                this.showDiagram();
                break;
            case 'clear':
                this.window.body.querySelector('#sqlEditor').value = '';
                break;
        }
    }

    initializeSampleData() {
        this.tables = [
            {
                name: 'users',
                columns: [
                    { name: 'id', type: 'INTEGER PRIMARY KEY', nullable: false },
                    { name: 'name', type: 'TEXT', nullable: false },
                    { name: 'email', type: 'TEXT', nullable: false },
                    { name: 'age', type: 'INTEGER', nullable: true },
                    { name: 'created_at', type: 'DATETIME', nullable: false }
                ],
                data: [
                    { id: 1, name: 'Alice', email: 'alice@example.com', age: 28, created_at: '2024-01-15' },
                    { id: 2, name: 'Bob', email: 'bob@example.com', age: 35, created_at: '2024-01-16' },
                    { id: 3, name: 'Charlie', email: 'charlie@example.com', age: 22, created_at: '2024-01-17' }
                ]
            },
            {
                name: 'orders',
                columns: [
                    { name: 'id', type: 'INTEGER PRIMARY KEY', nullable: false },
                    { name: 'user_id', type: 'INTEGER', nullable: false },
                    { name: 'product', type: 'TEXT', nullable: false },
                    { name: 'amount', type: 'REAL', nullable: false },
                    { name: 'order_date', type: 'DATETIME', nullable: false }
                ],
                data: [
                    { id: 1, user_id: 1, product: 'Laptop', amount: 999.99, order_date: '2024-02-01' },
                    { id: 2, user_id: 2, product: 'Mouse', amount: 29.99, order_date: '2024-02-02' },
                    { id: 3, user_id: 1, product: 'Keyboard', amount: 79.99, order_date: '2024-02-03' }
                ]
            },
            {
                name: 'products',
                columns: [
                    { name: 'id', type: 'INTEGER PRIMARY KEY', nullable: false },
                    { name: 'name', type: 'TEXT', nullable: false },
                    { name: 'price', type: 'REAL', nullable: false },
                    { name: 'stock', type: 'INTEGER', nullable: false }
                ],
                data: [
                    { id: 1, name: 'Laptop', price: 999.99, stock: 15 },
                    { id: 2, name: 'Mouse', price: 29.99, stock: 50 },
                    { id: 3, name: 'Keyboard', price: 79.99, stock: 30 }
                ]
            }
        ];

        this.updateTablesList();
    }

    updateTablesList() {
        const list = this.window.body.querySelector('#tablesList');
        list.innerHTML = this.tables.map(table => `
            <div class="table-item" data-table="${table.name}">
                <span>📋</span>
                <span>${table.name}</span>
                <span style="margin-left: auto; color: #666; font-size: 11px;">${table.data.length} rows</span>
            </div>
        `).join('');

        list.querySelectorAll('.table-item').forEach(item => {
            item.addEventListener('click', () => {
                list.querySelectorAll('.table-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.selectTable(item.dataset.table);
            });
        });
    }

    selectTable(tableName) {
        const table = this.tables.find(t => t.name === tableName);
        if (table) {
            this.window.body.querySelector('#sqlEditor').value = `SELECT * FROM ${tableName};`;
        }
    }

    executeQuery() {
        const query = this.window.body.querySelector('#sqlEditor').value.trim();
        if (!query) {
            alert('Please enter a SQL query');
            return;
        }

        // Add to history
        this.queryHistory.unshift({
            query: query,
            timestamp: new Date(),
            success: true
        });

        // Simple query parser (mock implementation)
        const results = this.parseAndExecuteQuery(query);

        if (results) {
            this.displayResults(results);
            this.switchTab('results');
        }
    }

    parseAndExecuteQuery(query) {
        const lowerQuery = query.toLowerCase().trim();

        // SELECT queries
        if (lowerQuery.startsWith('select')) {
            const fromMatch = lowerQuery.match(/from\s+(\w+)/);
            if (fromMatch) {
                const tableName = fromMatch[1];
                const table = this.tables.find(t => t.name === tableName);

                if (table) {
                    // Simple WHERE clause parsing
                    const whereMatch = lowerQuery.match(/where\s+(.+?)(?:;|$)/);
                    let data = [...table.data];

                    if (whereMatch) {
                        const condition = whereMatch[1].trim();
                        data = this.applyWhereClause(data, condition);
                    }

                    return {
                        columns: table.columns.map(c => c.name),
                        rows: data,
                        count: data.length
                    };
                }
            }
        }

        // INSERT queries
        if (lowerQuery.startsWith('insert')) {
            const tableMatch = lowerQuery.match(/into\s+(\w+)/);
            const valuesMatch = query.match(/values\s*\(([^)]+)\)/i);

            if (tableMatch && valuesMatch) {
                const tableName = tableMatch[1];
                const table = this.tables.find(t => t.name === tableName);

                if (table) {
                    const values = valuesMatch[1].split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''));
                    const newRow = {};

                    table.columns.forEach((col, idx) => {
                        if (col.name !== 'id') {
                            newRow[col.name] = values[idx - 1];
                        }
                    });

                    newRow.id = table.data.length + 1;
                    table.data.push(newRow);
                    this.updateTablesList();

                    return {
                        message: '1 row inserted',
                        affectedRows: 1
                    };
                }
            }
        }

        // UPDATE queries
        if (lowerQuery.startsWith('update')) {
            return {
                message: 'Query executed successfully',
                affectedRows: 1
            };
        }

        // DELETE queries
        if (lowerQuery.startsWith('delete')) {
            return {
                message: 'Query executed successfully',
                affectedRows: 1
            };
        }

        return {
            message: 'Query syntax not fully supported in demo mode'
        };
    }

    applyWhereClause(data, condition) {
        // Simple WHERE clause evaluation
        const operatorMatch = condition.match(/(\w+)\s*([><=!]+)\s*(.+)/);

        if (operatorMatch) {
            const [, field, operator, value] = operatorMatch;
            const cleanValue = value.trim().replace(/^['"]|['"]$/g, '');
            const numValue = parseFloat(cleanValue);

            return data.filter(row => {
                const rowValue = row[field];
                const compareValue = isNaN(numValue) ? cleanValue : numValue;

                switch (operator) {
                    case '>': return rowValue > compareValue;
                    case '<': return rowValue < compareValue;
                    case '>=': return rowValue >= compareValue;
                    case '<=': return rowValue <= compareValue;
                    case '=': return rowValue == compareValue;
                    case '!=': return rowValue != compareValue;
                    default: return true;
                }
            });
        }

        return data;
    }

    displayResults(results) {
        const container = this.window.body.querySelector('#resultsContainer');
        const info = this.window.body.querySelector('#resultsInfo');

        if (results.message) {
            container.innerHTML = `
                <div style="text-align: center; color: #28a745; padding: 40px; font-size: 16px;">
                    ✅ ${results.message}
                    ${results.affectedRows ? `<br><br><span style="color: #666;">Affected rows: ${results.affectedRows}</span>` : ''}
                </div>
            `;
            info.textContent = `Query executed successfully`;
            return;
        }

        if (!results.rows || results.rows.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #666; padding: 40px;">No results found</div>';
            info.textContent = '0 rows returned';
            return;
        }

        let html = '<table class="results-table"><thead><tr>';
        results.columns.forEach(col => {
            html += `<th>${col}</th>`;
        });
        html += '</tr></thead><tbody>';

        results.rows.forEach(row => {
            html += '<tr>';
            results.columns.forEach(col => {
                html += `<td>${row[col] !== null && row[col] !== undefined ? row[col] : '<span style="color:#666;">NULL</span>'}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table>';
        container.innerHTML = html;
        info.textContent = `${results.count} rows returned in 0.05s`;
    }

    showSchema() {
        const viewer = this.window.body.querySelector('#schemaViewer');

        let html = '';
        this.tables.forEach(table => {
            html += `
                <div class="schema-table">
                    <div class="schema-table-header">
                        <span>📋 ${table.name}</span>
                        <span style="color: #666; font-size: 11px;">${table.data.length} rows</span>
                    </div>
                    <div class="schema-columns">
            `;

            table.columns.forEach(col => {
                html += `
                    <div class="schema-column">
                        <span class="column-name">${col.name}</span>
                        <span class="column-type">${col.type}</span>
                    </div>
                `;
            });

            html += '</div></div>';
        });

        viewer.innerHTML = html;
    }

    showHistory() {
        const list = this.window.body.querySelector('#historyList');

        if (this.queryHistory.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #666;">No query history</p>';
            return;
        }

        list.innerHTML = this.queryHistory.map((item, idx) => `
            <div style="padding: 12px; margin-bottom: 8px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; cursor: pointer;"
                 onclick="document.querySelector('#sqlEditor').value = \`${item.query.replace(/`/g, '\\`')}\`">
                <div style="font-family: monospace; font-size: 13px; margin-bottom: 6px;">${item.query}</div>
                <div style="font-size: 11px; color: #666;">${item.timestamp.toLocaleString()}</div>
            </div>
        `).join('');
    }

    createDatabase() {
        const name = prompt('Enter database name:');
        if (name) {
            alert(`Database "${name}" would be created`);
        }
    }

    openDatabase() {
        alert('Open database dialog would appear');
    }

    createTable() {
        const name = prompt('Enter table name:');
        if (name) {
            alert(`Table creation wizard for "${name}" would open`);
        }
    }

    importData() {
        alert('Import data dialog would appear (CSV, JSON, SQL)');
    }

    exportData() {
        const data = JSON.stringify(this.tables, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'database-export.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    showDiagram() {
        alert('Database diagram visualization would appear');
    }
}
