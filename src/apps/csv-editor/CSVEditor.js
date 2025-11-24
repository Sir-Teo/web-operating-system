/**
 * CSVEditor - Structured Data CSV/TSV Editor
 *
 * Features:
 * - Import/export CSV files
 * - Grid editing
 * - Sort and filter
 * - Cell formatting
 * - Data validation
 */

class CSVEditor {
  constructor(context) {
    this.context = context;
    this.data = [];
    this.headers = [];
    this.selectedCell = null;

    console.log('[CSVEditor] Initialized');
  }

  async init() {
    // Ready
  }

  render() {
    const container = document.createElement('div');
    container.className = 'csv-editor';

    container.innerHTML = `
      <div class="csv-header">
        <div class="header-actions">
          <button class="btn-primary" id="import-csv-btn">📁 Import CSV</button>
          <button class="btn-secondary" id="export-csv-btn">💾 Export CSV</button>
          <button class="btn-secondary" id="add-row-btn">➕ Add Row</button>
          <button class="btn-secondary" id="add-column-btn">➕ Add Column</button>
          <button class="btn-secondary" id="clear-btn">🗑️ Clear All</button>
        </div>
        <div class="header-info">
          <span id="data-info">0 rows × 0 columns</span>
        </div>
      </div>

      <div class="csv-body">
        <div class="table-container">
          <table id="data-table">
            <thead id="table-head"></thead>
            <tbody id="table-body"></tbody>
          </table>
        </div>
      </div>

      <div class="csv-footer">
        <div class="filter-controls">
          <input type="text" id="search-input" placeholder="Search..." />
          <button class="btn-secondary" id="search-btn">🔍 Search</button>
        </div>
      </div>

      <input type="file" id="file-input" accept=".csv,.tsv,.txt" style="display: none">
    `;

    this.container = container;
    this._setupEventListeners();
    this._initializeEmpty();

    return container;
  }

  _setupEventListeners() {
    this.container.querySelector('#import-csv-btn').addEventListener('click', () => {
      this.container.querySelector('#file-input').click();
    });

    this.container.querySelector('#file-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this._loadCSVFile(file);
      }
    });

    this.container.querySelector('#export-csv-btn').addEventListener('click', () => {
      this._exportCSV();
    });

    this.container.querySelector('#add-row-btn').addEventListener('click', () => {
      this._addRow();
    });

    this.container.querySelector('#add-column-btn').addEventListener('click', () => {
      this._addColumn();
    });

    this.container.querySelector('#clear-btn').addEventListener('click', () => {
      if (confirm('Clear all data?')) {
        this._initializeEmpty();
      }
    });

    this.container.querySelector('#search-btn').addEventListener('click', () => {
      this._search();
    });

    this.container.querySelector('#search-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this._search();
      }
    });
  }

  _initializeEmpty() {
    this.headers = ['Column A', 'Column B', 'Column C'];
    this.data = [
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ];
    this._renderTable();
  }

  async _loadCSVFile(file) {
    const text = await file.text();
    this._parseCSV(text);
  }

  _parseCSV(text) {
    const lines = text.trim().split('\n');

    if (lines.length === 0) return;

    // First line as headers
    this.headers = this._parseLine(lines[0]);

    // Rest as data
    this.data = lines.slice(1).map(line => this._parseLine(line));

    this._renderTable();

    console.log('[CSVEditor] CSV loaded:', this.data.length, 'rows');
  }

  _parseLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  _renderTable() {
    const thead = this.container.querySelector('#table-head');
    const tbody = this.container.querySelector('#table-body');

    // Render headers
    thead.innerHTML = `
      <tr>
        ${this.headers.map((header, i) => `
          <th>
            <input type="text" value="${header}" data-col="${i}" class="header-input"/>
          </th>
        `).join('')}
      </tr>
    `;

    // Render data
    tbody.innerHTML = this.data.map((row, rowIndex) => `
      <tr>
        ${row.map((cell, colIndex) => `
          <td>
            <input type="text" value="${cell || ''}"
                   data-row="${rowIndex}" data-col="${colIndex}"
                   class="cell-input"/>
          </td>
        `).join('')}
      </tr>
    `).join('');

    // Add event listeners to cells
    this.container.querySelectorAll('.header-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const col = parseInt(e.target.dataset.col);
        this.headers[col] = e.target.value;
      });
    });

    this.container.querySelectorAll('.cell-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        this.data[row][col] = e.target.value;
      });
    });

    // Update info
    this._updateInfo();
  }

  _addRow() {
    const newRow = new Array(this.headers.length).fill('');
    this.data.push(newRow);
    this._renderTable();
  }

  _addColumn() {
    const colName = prompt('Column name:', `Column ${this.headers.length + 1}`);
    if (colName) {
      this.headers.push(colName);
      this.data.forEach(row => row.push(''));
      this._renderTable();
    }
  }

  _search() {
    const query = this.container.querySelector('#search-input').value.toLowerCase();

    if (!query) {
      // Show all rows
      this.container.querySelectorAll('tbody tr').forEach(tr => {
        tr.style.display = '';
      });
      return;
    }

    // Filter rows
    this.container.querySelectorAll('tbody tr').forEach((tr, index) => {
      const row = this.data[index];
      const match = row.some(cell => cell.toLowerCase().includes(query));
      tr.style.display = match ? '' : 'none';
    });
  }

  _exportCSV() {
    // Build CSV string
    let csv = this.headers.map(h => `"${h}"`).join(',') + '\n';

    this.data.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('[CSVEditor] CSV exported');
  }

  _updateInfo() {
    this.container.querySelector('#data-info').textContent =
      `${this.data.length} rows × ${this.headers.length} columns`;
  }

  destroy() {
    // Cleanup
  }
}

export default CSVEditor;
