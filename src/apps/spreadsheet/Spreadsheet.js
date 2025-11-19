export default class Spreadsheet {
  constructor(context) {
    this.context = context;
    this.currentFile = null;
    this.rows = 100;
    this.cols = 26;
    this.data = {};
    this.selectedCell = null;
    this.isModified = false;
  }

  async init() {
    // Initialize spreadsheet
  }

  render() {
    const container = document.createElement('div');
    container.className = 'spreadsheet-container';
    container.style.cssText = 'display:flex;flex-direction:column;height:100%;background:white;';

    // Menu bar
    const menuBar = this._createMenuBar();

    // Toolbar
    const toolbar = this._createToolbar();

    // Formula bar
    const formulaBar = this._createFormulaBar();

    // Grid container
    const gridContainer = document.createElement('div');
    gridContainer.style.cssText = 'flex:1;overflow:auto;position:relative;';

    const grid = this._createGrid();
    gridContainer.appendChild(grid);

    // Status bar
    const statusBar = this._createStatusBar();

    container.appendChild(menuBar);
    container.appendChild(toolbar);
    container.appendChild(formulaBar);
    container.appendChild(gridContainer);
    container.appendChild(statusBar);

    return container;
  }

  _createMenuBar() {
    const menuBar = document.createElement('div');
    menuBar.className = 'spreadsheet-menu-bar';
    menuBar.style.cssText = 'padding:8px 10px;background:#217346;color:white;display:flex;gap:20px;font-size:14px;';

    const menus = ['File', 'Edit', 'Insert', 'Format', 'Data', 'Tools', 'Help'];
    menus.forEach(menu => {
      const menuItem = document.createElement('span');
      menuItem.textContent = menu;
      menuItem.style.cssText = 'cursor:pointer;padding:5px 10px;';
      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.background = 'rgba(255,255,255,0.2)';
      });
      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.background = 'transparent';
      });

      if (menu === 'File') {
        menuItem.addEventListener('click', () => this._showFileMenu(menuItem));
      }

      menuBar.appendChild(menuItem);
    });

    return menuBar;
  }

  _showFileMenu(anchor) {
    // Remove existing menu if any
    const existing = document.querySelector('.file-menu-dropdown');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.className = 'file-menu-dropdown';
    menu.style.cssText = `
      position:absolute;
      background:white;
      border:1px solid #ccc;
      box-shadow:0 2px 8px rgba(0,0,0,0.15);
      min-width:200px;
      z-index:10000;
    `;

    const options = [
      { label: 'New', action: () => this._newSpreadsheet() },
      { label: 'Open...', action: () => this._openSpreadsheet() },
      { label: 'Save', action: () => this._saveSpreadsheet() },
      { label: 'Save As...', action: () => this._saveSpreadsheetAs() },
      { label: 'Export as CSV', action: () => this._exportCSV() }
    ];

    options.forEach(opt => {
      const item = document.createElement('div');
      item.textContent = opt.label;
      item.style.cssText = 'padding:8px 15px;cursor:pointer;color:#333;';
      item.addEventListener('mouseenter', () => item.style.background = '#f0f0f0');
      item.addEventListener('mouseleave', () => item.style.background = 'white');
      item.addEventListener('click', () => {
        opt.action();
        menu.remove();
      });
      menu.appendChild(item);
    });

    const rect = anchor.getBoundingClientRect();
    menu.style.top = rect.bottom + 'px';
    menu.style.left = rect.left + 'px';

    document.body.appendChild(menu);

    setTimeout(() => {
      document.addEventListener('click', () => menu.remove(), { once: true });
    }, 0);
  }

  _createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'spreadsheet-toolbar';
    toolbar.style.cssText = 'padding:8px 10px;border-bottom:1px solid #ccc;background:#f8f8f8;display:flex;gap:5px;align-items:center;';

    // Font controls
    const fontSelect = document.createElement('select');
    fontSelect.style.cssText = 'padding:4px;border:1px solid #ccc;';
    ['Arial', 'Calibri', 'Times New Roman', 'Courier New'].forEach(font => {
      const option = document.createElement('option');
      option.value = font;
      option.textContent = font;
      fontSelect.appendChild(option);
    });

    const sizeSelect = document.createElement('select');
    sizeSelect.style.cssText = 'padding:4px;border:1px solid #ccc;';
    [8, 9, 10, 11, 12, 14, 16, 18, 20].forEach(size => {
      const option = document.createElement('option');
      option.value = size;
      option.textContent = size;
      if (size === 11) option.selected = true;
      sizeSelect.appendChild(option);
    });

    toolbar.appendChild(fontSelect);
    toolbar.appendChild(sizeSelect);
    toolbar.appendChild(this._createSeparator());

    // Format buttons
    const formatButtons = [
      { icon: '𝐁', title: 'Bold' },
      { icon: '𝐼', title: 'Italic' },
      { icon: '𝐔', title: 'Underline' }
    ];

    formatButtons.forEach(btn => {
      const button = this._createToolbarButton(btn.icon, btn.title, () => {
        if (this.selectedCell) {
          // Apply formatting to selected cell
          this._applyCellFormat(this.selectedCell, btn.title.toLowerCase());
        }
      });
      toolbar.appendChild(button);
    });

    toolbar.appendChild(this._createSeparator());

    // Alignment buttons
    const alignButtons = [
      { icon: '≡', title: 'Align Left' },
      { icon: '≣', title: 'Align Center' },
      { icon: '≡', title: 'Align Right' }
    ];

    alignButtons.forEach(btn => {
      const button = this._createToolbarButton(btn.icon, btn.title, () => {
        if (this.selectedCell) {
          this._applyCellAlignment(this.selectedCell, btn.title.split(' ')[1].toLowerCase());
        }
      });
      toolbar.appendChild(button);
    });

    toolbar.appendChild(this._createSeparator());

    // Number format
    const formatLabel = document.createElement('span');
    formatLabel.textContent = 'Format:';
    formatLabel.style.cssText = 'margin-left:10px;font-size:12px;';

    const numberFormat = document.createElement('select');
    numberFormat.style.cssText = 'padding:4px;border:1px solid #ccc;margin-left:5px;';
    ['General', 'Number', 'Currency', 'Percentage', 'Date', 'Time'].forEach(fmt => {
      const option = document.createElement('option');
      option.value = fmt;
      option.textContent = fmt;
      numberFormat.appendChild(option);
    });

    toolbar.appendChild(formatLabel);
    toolbar.appendChild(numberFormat);

    return toolbar;
  }

  _createToolbarButton(icon, title, onClick) {
    const button = document.createElement('button');
    button.textContent = icon;
    button.title = title;
    button.style.cssText = 'padding:5px 10px;cursor:pointer;background:white;border:1px solid #ccc;border-radius:3px;';
    button.addEventListener('mouseenter', () => button.style.background = '#e0e0e0');
    button.addEventListener('mouseleave', () => button.style.background = 'white');
    button.addEventListener('click', onClick);
    return button;
  }

  _createSeparator() {
    const sep = document.createElement('div');
    sep.style.cssText = 'width:1px;height:24px;background:#ccc;margin:0 5px;';
    return sep;
  }

  _createFormulaBar() {
    const formulaBar = document.createElement('div');
    formulaBar.style.cssText = 'padding:8px 10px;border-bottom:1px solid #ccc;background:white;display:flex;gap:10px;align-items:center;';

    const cellLabel = document.createElement('div');
    cellLabel.style.cssText = 'min-width:60px;font-weight:bold;font-size:14px;';
    cellLabel.textContent = 'A1';
    this.cellLabel = cellLabel;

    const formulaInput = document.createElement('input');
    formulaInput.type = 'text';
    formulaInput.placeholder = 'Enter value or formula (=SUM(A1:A10))';
    formulaInput.style.cssText = 'flex:1;padding:6px;border:1px solid #ccc;font-family:monospace;font-size:13px;';

    formulaInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.selectedCell) {
        const cellId = this.selectedCell.dataset.cellId;
        const value = formulaInput.value;
        this._setCellValue(cellId, value);
        this.selectedCell.textContent = this._evaluateCell(cellId);
        this.isModified = true;
      }
    });

    this.formulaInput = formulaInput;

    formulaBar.appendChild(cellLabel);
    formulaBar.appendChild(formulaInput);

    return formulaBar;
  }

  _createGrid() {
    const grid = document.createElement('div');
    grid.className = 'spreadsheet-grid';
    grid.style.cssText = 'display:inline-block;';

    // Header row
    const headerRow = document.createElement('div');
    headerRow.style.cssText = 'display:flex;';

    // Corner cell
    const corner = document.createElement('div');
    corner.style.cssText = 'width:50px;height:25px;background:#f0f0f0;border:1px solid #ccc;border-right:2px solid #999;border-bottom:2px solid #999;';
    headerRow.appendChild(corner);

    // Column headers
    for (let col = 0; col < this.cols; col++) {
      const header = document.createElement('div');
      header.textContent = this._getColumnLabel(col);
      header.style.cssText = 'width:100px;height:25px;background:#f0f0f0;border:1px solid #ccc;border-bottom:2px solid #999;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;';
      headerRow.appendChild(header);
    }

    grid.appendChild(headerRow);

    // Data rows
    for (let row = 0; row < this.rows; row++) {
      const rowElement = document.createElement('div');
      rowElement.style.cssText = 'display:flex;';

      // Row header
      const rowHeader = document.createElement('div');
      rowHeader.textContent = (row + 1).toString();
      rowHeader.style.cssText = 'width:50px;height:25px;background:#f0f0f0;border:1px solid #ccc;border-right:2px solid #999;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;';
      rowElement.appendChild(rowHeader);

      // Cells
      for (let col = 0; col < this.cols; col++) {
        const cell = document.createElement('div');
        const cellId = `${this._getColumnLabel(col)}${row + 1}`;
        cell.dataset.cellId = cellId;
        cell.contentEditable = 'true';
        cell.style.cssText = 'width:100px;height:25px;border:1px solid #ccc;padding:2px 4px;font-size:12px;outline:none;overflow:hidden;white-space:nowrap;';

        cell.addEventListener('focus', () => {
          this.selectedCell = cell;
          this.cellLabel.textContent = cellId;
          this.formulaInput.value = this.data[cellId] || '';
          cell.style.background = '#e0f0ff';
          cell.style.border = '2px solid #0066cc';
        });

        cell.addEventListener('blur', () => {
          cell.style.background = 'white';
          cell.style.border = '1px solid #ccc';
        });

        cell.addEventListener('input', () => {
          const value = cell.textContent;
          this._setCellValue(cellId, value);
          this.formulaInput.value = value;
          this.isModified = true;
        });

        cell.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            // Move to next row
            const nextRow = row + 1;
            if (nextRow < this.rows) {
              const nextCellId = `${this._getColumnLabel(col)}${nextRow + 1}`;
              const nextCell = grid.querySelector(`[data-cell-id="${nextCellId}"]`);
              if (nextCell) nextCell.focus();
            }
          } else if (e.key === 'Tab') {
            e.preventDefault();
            // Move to next column
            const nextCol = col + 1;
            if (nextCol < this.cols) {
              const nextCellId = `${this._getColumnLabel(nextCol)}${row + 1}`;
              const nextCell = grid.querySelector(`[data-cell-id="${nextCellId}"]`);
              if (nextCell) nextCell.focus();
            }
          }
        });

        rowElement.appendChild(cell);
      }

      grid.appendChild(rowElement);
    }

    return grid;
  }

  _createStatusBar() {
    const statusBar = document.createElement('div');
    statusBar.style.cssText = 'padding:5px 10px;background:#f0f0f0;border-top:1px solid #ccc;font-size:12px;color:#666;';
    statusBar.textContent = 'Ready';
    return statusBar;
  }

  _getColumnLabel(index) {
    let label = '';
    while (index >= 0) {
      label = String.fromCharCode(65 + (index % 26)) + label;
      index = Math.floor(index / 26) - 1;
    }
    return label;
  }

  _setCellValue(cellId, value) {
    this.data[cellId] = value;
  }

  _getCellValue(cellId) {
    return this.data[cellId] || '';
  }

  _evaluateCell(cellId) {
    const value = this._getCellValue(cellId);

    if (!value || typeof value !== 'string') return value;

    // If it starts with =, it's a formula
    if (value.startsWith('=')) {
      try {
        return this._evaluateFormula(value.substring(1));
      } catch (error) {
        return '#ERROR!';
      }
    }

    return value;
  }

  _evaluateFormula(formula) {
    // Simple formula evaluation
    formula = formula.toUpperCase();

    // Handle SUM function
    if (formula.startsWith('SUM(')) {
      const range = formula.match(/SUM\(([A-Z0-9:]+)\)/);
      if (range) {
        return this._sumRange(range[1]);
      }
    }

    // Handle AVG/AVERAGE function
    if (formula.startsWith('AVG(') || formula.startsWith('AVERAGE(')) {
      const range = formula.match(/AVG(?:ERAGE)?\(([A-Z0-9:]+)\)/);
      if (range) {
        return this._avgRange(range[1]);
      }
    }

    // Handle simple arithmetic
    try {
      // Replace cell references with values
      const evaluated = formula.replace(/([A-Z]+[0-9]+)/g, (match) => {
        const val = this._getCellValue(match);
        return parseFloat(val) || 0;
      });

      // Safely evaluate arithmetic expression
      return Function('"use strict"; return (' + evaluated + ')')();
    } catch (error) {
      return '#ERROR!';
    }
  }

  _sumRange(range) {
    const cells = this._parseRange(range);
    let sum = 0;
    cells.forEach(cellId => {
      const val = parseFloat(this._getCellValue(cellId)) || 0;
      sum += val;
    });
    return sum;
  }

  _avgRange(range) {
    const cells = this._parseRange(range);
    const sum = this._sumRange(range);
    return cells.length > 0 ? sum / cells.length : 0;
  }

  _parseRange(range) {
    const cells = [];
    if (range.includes(':')) {
      const [start, end] = range.split(':');
      const startCol = start.match(/[A-Z]+/)[0];
      const startRow = parseInt(start.match(/[0-9]+/)[0]);
      const endCol = end.match(/[A-Z]+/)[0];
      const endRow = parseInt(end.match(/[0-9]+/)[0]);

      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol.charCodeAt(0); col <= endCol.charCodeAt(0); col++) {
          cells.push(String.fromCharCode(col) + row);
        }
      }
    } else {
      cells.push(range);
    }
    return cells;
  }

  _applyCellFormat(cell, format) {
    if (format === 'bold') {
      cell.style.fontWeight = cell.style.fontWeight === 'bold' ? 'normal' : 'bold';
    } else if (format === 'italic') {
      cell.style.fontStyle = cell.style.fontStyle === 'italic' ? 'normal' : 'italic';
    } else if (format === 'underline') {
      cell.style.textDecoration = cell.style.textDecoration === 'underline' ? 'none' : 'underline';
    }
  }

  _applyCellAlignment(cell, alignment) {
    cell.style.textAlign = alignment;
  }

  async _newSpreadsheet() {
    if (this.isModified && !confirm('You have unsaved changes. Continue?')) {
      return;
    }
    this.currentFile = null;
    this.data = {};
    this.isModified = false;
    // Clear all cells
    document.querySelectorAll('[data-cell-id]').forEach(cell => {
      cell.textContent = '';
    });
  }

  async _openSpreadsheet() {
    const path = prompt('Enter spreadsheet path:', '/home/user/');
    if (!path) return;

    try {
      const content = await this.context.fs.readFile(path, { encoding: 'utf8' });
      this.data = JSON.parse(content);
      this.currentFile = path;
      this.isModified = false;

      // Populate cells
      Object.keys(this.data).forEach(cellId => {
        const cell = document.querySelector(`[data-cell-id="${cellId}"]`);
        if (cell) {
          cell.textContent = this._evaluateCell(cellId);
        }
      });
    } catch (error) {
      alert(`Error opening spreadsheet: ${error.message}`);
    }
  }

  async _saveSpreadsheet() {
    if (!this.currentFile) {
      return this._saveSpreadsheetAs();
    }

    try {
      const content = JSON.stringify(this.data, null, 2);
      await this.context.fs.writeFile(this.currentFile, content, { encoding: 'utf8' });
      this.isModified = false;
      alert('Spreadsheet saved successfully!');
    } catch (error) {
      alert(`Error saving spreadsheet: ${error.message}`);
    }
  }

  async _saveSpreadsheetAs() {
    const path = prompt('Enter path to save spreadsheet:', '/home/user/spreadsheet.json');
    if (!path) return;

    try {
      const content = JSON.stringify(this.data, null, 2);
      await this.context.fs.writeFile(path, content, { encoding: 'utf8' });
      this.currentFile = path;
      this.isModified = false;
      alert('Spreadsheet saved successfully!');
    } catch (error) {
      alert(`Error saving spreadsheet: ${error.message}`);
    }
  }

  async _exportCSV() {
    let csv = '';
    for (let row = 0; row < this.rows; row++) {
      const rowData = [];
      for (let col = 0; col < this.cols; col++) {
        const cellId = `${this._getColumnLabel(col)}${row + 1}`;
        rowData.push(this._getCellValue(cellId) || '');
      }
      csv += rowData.join(',') + '\n';
    }

    const path = prompt('Enter path to export CSV:', '/home/user/spreadsheet.csv');
    if (!path) return;

    try {
      await this.context.fs.writeFile(path, csv, { encoding: 'utf8' });
      alert('Spreadsheet exported successfully!');
    } catch (error) {
      alert(`Error exporting spreadsheet: ${error.message}`);
    }
  }
}
