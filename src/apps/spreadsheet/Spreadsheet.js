export default class Spreadsheet {
  constructor(context) {
    this.context = context;
    this.currentFile = null;
    this.rows = 100;
    this.cols = 26;
    this.data = {};
    this.cellFormats = {}; // Store cell formatting
    this.selectedCell = null;
    this.selectedRange = null;
    this.copiedCell = null;
    this.isModified = false;
    this.frozenRows = 0;
    this.frozenCols = 0;
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
    this.gridContainer = gridContainer;

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
    menuBar.style.cssText = 'padding:8px 10px;background:#217346;color:white;display:flex;gap:20px;font-size:14px;user-select:none;';

    const menus = [
      { label: 'File', handler: (el) => this._showFileMenu(el) },
      { label: 'Edit', handler: (el) => this._showEditMenu(el) },
      { label: 'Insert', handler: (el) => this._showInsertMenu(el) },
      { label: 'Format', handler: (el) => this._showFormatMenu(el) },
      { label: 'Data', handler: (el) => this._showDataMenu(el) },
      { label: 'Help', handler: () => this._showHelp() }
    ];

    menus.forEach(menu => {
      const menuItem = document.createElement('span');
      menuItem.textContent = menu.label;
      menuItem.style.cssText = 'cursor:pointer;padding:5px 10px;border-radius:3px;';
      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.background = 'rgba(255,255,255,0.2)';
      });
      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.background = 'transparent';
      });
      menuItem.addEventListener('click', () => menu.handler(menuItem));
      menuBar.appendChild(menuItem);
    });

    return menuBar;
  }

  _showFileMenu(anchor) {
    this._removeExistingMenus();

    const menu = this._createDropdownMenu([
      { label: 'New', action: () => this._newSpreadsheet() },
      { label: 'Open...', action: () => this._openSpreadsheet() },
      { divider: true },
      { label: 'Save', shortcut: 'Ctrl+S', action: () => this._saveSpreadsheet() },
      { label: 'Save As...', action: () => this._saveSpreadsheetAs() },
      { divider: true },
      { label: 'Export as CSV', action: () => this._exportCSV() },
      { label: 'Export as Excel', action: () => this._exportExcel() }
    ]);

    this._positionMenu(menu, anchor);
  }

  _showEditMenu(anchor) {
    this._removeExistingMenus();

    const menu = this._createDropdownMenu([
      { label: 'Copy', shortcut: 'Ctrl+C', action: () => this._copyCell() },
      { label: 'Paste', shortcut: 'Ctrl+V', action: () => this._pasteCell() },
      { divider: true },
      { label: 'Clear Cell', shortcut: 'Del', action: () => this._clearCell() },
      { label: 'Clear Formatting', action: () => this._clearFormatting() }
    ]);

    this._positionMenu(menu, anchor);
  }

  _showInsertMenu(anchor) {
    this._removeExistingMenus();

    const menu = this._createDropdownMenu([
      { label: 'Insert Row Above', action: () => this._insertRow() },
      { label: 'Insert Row Below', action: () => this._insertRow(true) },
      { divider: true },
      { label: 'Insert Column Left', action: () => this._insertColumn() },
      { label: 'Insert Column Right', action: () => this._insertColumn(true) }
    ]);

    this._positionMenu(menu, anchor);
  }

  _showFormatMenu(anchor) {
    this._removeExistingMenus();

    const menu = this._createDropdownMenu([
      { label: 'Number', action: () => this._formatAsNumber() },
      { label: 'Currency', action: () => this._formatAsCurrency() },
      { label: 'Percentage', action: () => this._formatAsPercentage() },
      { label: 'Date', action: () => this._formatAsDate() },
      { divider: true },
      { label: 'Background Color...', action: () => this._setCellBackground() },
      { label: 'Text Color...', action: () => this._setCellColor() }
    ]);

    this._positionMenu(menu, anchor);
  }

  _showDataMenu(anchor) {
    this._removeExistingMenus();

    const menu = this._createDropdownMenu([
      { label: 'Sort A→Z', action: () => this._sortColumn(true) },
      { label: 'Sort Z→A', action: () => this._sortColumn(false) },
      { divider: true },
      { label: 'Filter', action: () => this._showFilter() }
    ]);

    this._positionMenu(menu, anchor);
  }

  _createDropdownMenu(items) {
    const menu = document.createElement('div');
    menu.className = 'file-menu-dropdown';
    menu.style.cssText = `
      position:absolute;
      background:white;
      border:1px solid #ccc;
      box-shadow:0 2px 8px rgba(0,0,0,0.15);
      min-width:220px;
      z-index:10000;
      border-radius:4px;
      overflow:hidden;
    `;

    items.forEach(opt => {
      if (opt.divider) {
        const divider = document.createElement('div');
        divider.style.cssText = 'height:1px;background:#e0e0e0;margin:4px 0;';
        menu.appendChild(divider);
        return;
      }

      const item = document.createElement('div');
      item.style.cssText = 'padding:8px 15px;cursor:pointer;color:#333;display:flex;justify-content:space-between;align-items:center;';

      const label = document.createElement('span');
      label.textContent = opt.label;
      item.appendChild(label);

      if (opt.shortcut) {
        const shortcut = document.createElement('span');
        shortcut.textContent = opt.shortcut;
        shortcut.style.cssText = 'font-size:11px;color:#999;margin-left:20px;';
        item.appendChild(shortcut);
      }

      item.addEventListener('mouseenter', () => item.style.background = '#f0f0f0');
      item.addEventListener('mouseleave', () => item.style.background = 'white');
      item.addEventListener('click', () => {
        opt.action();
        menu.remove();
      });
      menu.appendChild(item);
    });

    return menu;
  }

  _positionMenu(menu, anchor) {
    const rect = anchor.getBoundingClientRect();
    menu.style.top = rect.bottom + 'px';
    menu.style.left = rect.left + 'px';

    document.body.appendChild(menu);

    setTimeout(() => {
      document.addEventListener('click', () => menu.remove(), { once: true });
    }, 0);
  }

  _removeExistingMenus() {
    const existing = document.querySelector('.file-menu-dropdown');
    if (existing) existing.remove();
  }

  _createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'spreadsheet-toolbar';
    toolbar.style.cssText = 'padding:8px 10px;border-bottom:1px solid #ccc;background:#f8f8f8;display:flex;gap:5px;align-items:center;';

    // Font controls
    const fontSelect = document.createElement('select');
    fontSelect.style.cssText = 'padding:4px;border:1px solid #ccc;border-radius:3px;';
    ['Arial', 'Calibri', 'Times New Roman', 'Courier New'].forEach(font => {
      const option = document.createElement('option');
      option.value = font;
      option.textContent = font;
      fontSelect.appendChild(option);
    });
    fontSelect.addEventListener('change', () => {
      if (this.selectedCell) {
        this._applyCellStyle(this.selectedCell, 'fontFamily', fontSelect.value);
      }
    });

    const sizeSelect = document.createElement('select');
    sizeSelect.style.cssText = 'padding:4px;border:1px solid #ccc;border-radius:3px;';
    [8, 9, 10, 11, 12, 14, 16, 18, 20].forEach(size => {
      const option = document.createElement('option');
      option.value = size;
      option.textContent = size;
      if (size === 11) option.selected = true;
      sizeSelect.appendChild(option);
    });
    sizeSelect.addEventListener('change', () => {
      if (this.selectedCell) {
        this._applyCellStyle(this.selectedCell, 'fontSize', sizeSelect.value + 'px');
      }
    });

    toolbar.appendChild(fontSelect);
    toolbar.appendChild(sizeSelect);
    toolbar.appendChild(this._createSeparator());

    // Format buttons
    const formatButtons = [
      { icon: '𝐁', title: 'Bold', style: 'fontWeight', value: 'bold' },
      { icon: '𝐼', title: 'Italic', style: 'fontStyle', value: 'italic' },
      { icon: '𝐔', title: 'Underline', style: 'textDecoration', value: 'underline' }
    ];

    formatButtons.forEach(btn => {
      const button = this._createToolbarButton(btn.icon, btn.title, () => {
        if (this.selectedCell) {
          this._applyCellFormat(this.selectedCell, btn.title.toLowerCase());
        }
      });
      toolbar.appendChild(button);
    });

    toolbar.appendChild(this._createSeparator());

    // Alignment buttons
    const alignButtons = [
      { icon: '☰', title: 'Align Left', value: 'left' },
      { icon: '☰', title: 'Align Center', value: 'center' },
      { icon: '☰', title: 'Align Right', value: 'right' }
    ];

    alignButtons.forEach(btn => {
      const button = this._createToolbarButton(btn.icon, btn.title, () => {
        if (this.selectedCell) {
          this._applyCellAlignment(this.selectedCell, btn.value);
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
    numberFormat.style.cssText = 'padding:4px;border:1px solid #ccc;margin-left:5px;border-radius:3px;';
    this.numberFormat = numberFormat;

    const formats = [
      { label: 'General', value: 'general' },
      { label: 'Number', value: 'number' },
      { label: 'Currency', value: 'currency' },
      { label: 'Percentage', value: 'percentage' },
      { label: 'Date', value: 'date' },
      { label: 'Time', value: 'time' }
    ];

    formats.forEach(fmt => {
      const option = document.createElement('option');
      option.value = fmt.value;
      option.textContent = fmt.label;
      numberFormat.appendChild(option);
    });

    numberFormat.addEventListener('change', () => {
      if (this.selectedCell) {
        const cellId = this.selectedCell.dataset.cellId;
        this._setCellFormat(cellId, numberFormat.value);
        this._updateCellDisplay(this.selectedCell);
      }
    });

    toolbar.appendChild(formatLabel);
    toolbar.appendChild(numberFormat);

    toolbar.appendChild(this._createSeparator());

    // Function button
    const funcButton = this._createToolbarButton('ƒx', 'Insert Function', () => this._showFunctionDialog());
    funcButton.style.fontWeight = 'bold';
    toolbar.appendChild(funcButton);

    return toolbar;
  }

  _createToolbarButton(icon, title, onClick) {
    const button = document.createElement('button');
    button.textContent = icon;
    button.title = title;
    button.style.cssText = 'padding:5px 10px;cursor:pointer;background:white;border:1px solid #ccc;border-radius:3px;min-width:32px;transition:all 0.2s;';
    button.addEventListener('mouseenter', () => {
      button.style.background = '#e0e0e0';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = 'white';
    });
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
    cellLabel.style.cssText = 'min-width:60px;font-weight:bold;font-size:14px;padding:4px 8px;border:1px solid #ccc;border-radius:3px;background:#f8f8f8;';
    cellLabel.textContent = 'A1';
    this.cellLabel = cellLabel;

    const formulaInput = document.createElement('input');
    formulaInput.type = 'text';
    formulaInput.placeholder = 'Enter value or formula (=SUM(A1:A10))';
    formulaInput.style.cssText = 'flex:1;padding:6px;border:1px solid #ccc;font-family:monospace;font-size:13px;border-radius:3px;';

    formulaInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.selectedCell) {
        const cellId = this.selectedCell.dataset.cellId;
        const value = formulaInput.value;
        this._setCellValue(cellId, value);
        this._updateCellDisplay(this.selectedCell);
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
      header.dataset.col = col;
      header.style.cssText = 'width:100px;height:25px;background:#f0f0f0;border:1px solid #ccc;border-bottom:2px solid #999;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;cursor:pointer;user-select:none;';

      // Column selection
      header.addEventListener('click', () => this._selectColumn(col));

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
      rowHeader.dataset.row = row;
      rowHeader.style.cssText = 'width:50px;height:25px;background:#f0f0f0;border:1px solid #ccc;border-right:2px solid #999;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;cursor:pointer;user-select:none;';

      // Row selection
      rowHeader.addEventListener('click', () => this._selectRow(row));

      rowElement.appendChild(rowHeader);

      // Cells
      for (let col = 0; col < this.cols; col++) {
        const cell = document.createElement('div');
        const cellId = `${this._getColumnLabel(col)}${row + 1}`;
        cell.dataset.cellId = cellId;
        cell.contentEditable = 'true';
        cell.style.cssText = 'width:100px;height:25px;border:1px solid #ccc;padding:2px 4px;font-size:12px;outline:none;overflow:hidden;white-space:nowrap;box-sizing:border-box;';

        cell.addEventListener('focus', () => {
          this.selectedCell = cell;
          this.cellLabel.textContent = cellId;
          this.formulaInput.value = this.data[cellId] || '';
          cell.style.background = '#e0f0ff';
          cell.style.border = '2px solid #0066cc';
        });

        cell.addEventListener('blur', () => {
          cell.style.background = this.cellFormats[cellId]?.background || 'white';
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
            const nextRow = row + 1;
            if (nextRow < this.rows) {
              const nextCellId = `${this._getColumnLabel(col)}${nextRow + 1}`;
              const nextCell = grid.querySelector(`[data-cell-id="${nextCellId}"]`);
              if (nextCell) nextCell.focus();
            }
          } else if (e.key === 'Tab') {
            e.preventDefault();
            const nextCol = e.shiftKey ? col - 1 : col + 1;
            if (nextCol >= 0 && nextCol < this.cols) {
              const nextCellId = `${this._getColumnLabel(nextCol)}${row + 1}`;
              const nextCell = grid.querySelector(`[data-cell-id="${nextCellId}"]`);
              if (nextCell) nextCell.focus();
            }
          } else if (e.key === 'Delete' && e.target === cell) {
            this._clearCell();
          } else if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            this._copyCell();
          } else if (e.ctrlKey && e.key === 'v') {
            e.preventDefault();
            this._pasteCell();
          }
        });

        // Right-click context menu
        cell.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          this._showContextMenu(e, cell);
        });

        rowElement.appendChild(cell);
      }

      grid.appendChild(rowElement);
    }

    return grid;
  }

  _createStatusBar() {
    const statusBar = document.createElement('div');
    statusBar.style.cssText = 'padding:5px 10px;background:#f0f0f0;border-top:1px solid #ccc;font-size:12px;color:#666;display:flex;gap:20px;';

    const status = document.createElement('span');
    status.textContent = 'Ready';
    this.statusText = status;

    const cellCount = document.createElement('span');
    cellCount.textContent = 'Count: 0';
    this.cellCount = cellCount;

    const cellSum = document.createElement('span');
    cellSum.textContent = 'Sum: 0';
    this.cellSum = cellSum;

    statusBar.appendChild(status);
    statusBar.appendChild(cellCount);
    statusBar.appendChild(cellSum);

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

  _setCellFormat(cellId, format) {
    if (!this.cellFormats[cellId]) {
      this.cellFormats[cellId] = {};
    }
    this.cellFormats[cellId].numberFormat = format;
  }

  _updateCellDisplay(cell) {
    const cellId = cell.dataset.cellId;
    const value = this._evaluateCell(cellId);
    const format = this.cellFormats[cellId]?.numberFormat || 'general';

    cell.textContent = this._formatValue(value, format);
  }

  _formatValue(value, format) {
    if (value === '' || value === null || value === undefined) return '';
    if (typeof value === 'string' && value.startsWith('#')) return value; // Error

    const num = parseFloat(value);
    if (isNaN(num)) return value;

    switch (format) {
      case 'number':
        return num.toFixed(2);
      case 'currency':
        return '$' + num.toFixed(2);
      case 'percentage':
        return (num * 100).toFixed(2) + '%';
      case 'date':
        return new Date(num).toLocaleDateString();
      case 'time':
        return new Date(num).toLocaleTimeString();
      default:
        return value;
    }
  }

  _evaluateCell(cellId) {
    const value = this._getCellValue(cellId);

    if (!value || typeof value !== 'string') return value;

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
    formula = formula.toUpperCase();

    // Extended formula functions
    const functions = {
      'SUM': (range) => {
        const cells = this._parseRange(range);
        return cells.reduce((sum, cellId) => sum + (parseFloat(this._evaluateCell(cellId)) || 0), 0);
      },
      'AVG': (range) => {
        const cells = this._parseRange(range);
        const sum = functions.SUM(range);
        return cells.length > 0 ? sum / cells.length : 0;
      },
      'AVERAGE': (range) => functions.AVG(range),
      'MIN': (range) => {
        const cells = this._parseRange(range);
        const values = cells.map(c => parseFloat(this._evaluateCell(c))).filter(v => !isNaN(v));
        return values.length > 0 ? Math.min(...values) : 0;
      },
      'MAX': (range) => {
        const cells = this._parseRange(range);
        const values = cells.map(c => parseFloat(this._evaluateCell(c))).filter(v => !isNaN(v));
        return values.length > 0 ? Math.max(...values) : 0;
      },
      'COUNT': (range) => {
        const cells = this._parseRange(range);
        return cells.filter(c => {
          const val = this._evaluateCell(c);
          return val !== '' && !isNaN(parseFloat(val));
        }).length;
      },
      'COUNTA': (range) => {
        const cells = this._parseRange(range);
        return cells.filter(c => this._evaluateCell(c) !== '').length;
      },
      'ROUND': (value, decimals) => {
        const num = parseFloat(value);
        const dec = parseInt(decimals) || 0;
        return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
      },
      'SQRT': (value) => Math.sqrt(parseFloat(value)),
      'POWER': (base, exp) => Math.pow(parseFloat(base), parseFloat(exp)),
      'ABS': (value) => Math.abs(parseFloat(value)),
      'IF': (condition, trueVal, falseVal) => {
        return this._evaluateCondition(condition) ? trueVal : falseVal;
      }
    };

    // Check for each function
    for (const [funcName, funcImpl] of Object.entries(functions)) {
      const regex = new RegExp(`${funcName}\\(([^)]+)\\)`, 'i');
      const match = formula.match(regex);
      if (match) {
        const args = match[1].split(',').map(arg => arg.trim());
        return funcImpl(...args);
      }
    }

    // Simple arithmetic
    try {
      const evaluated = formula.replace(/([A-Z]+[0-9]+)/g, (match) => {
        const val = this._evaluateCell(match);
        return parseFloat(val) || 0;
      });

      return Function('"use strict"; return (' + evaluated + ')')();
    } catch (error) {
      return '#ERROR!';
    }
  }

  _evaluateCondition(condition) {
    // Simple condition evaluation
    const evaluated = condition.replace(/([A-Z]+[0-9]+)/g, (match) => {
      const val = this._evaluateCell(match);
      return parseFloat(val) || 0;
    });

    try {
      return Function('"use strict"; return (' + evaluated + ')')();
    } catch {
      return false;
    }
  }

  _parseRange(range) {
    const cells = [];
    if (range.includes(':')) {
      const [start, end] = range.split(':');
      const startCol = start.match(/[A-Z]+/)[0];
      const startRow = parseInt(start.match(/[0-9]+/)[0]);
      const endCol = end.match(/[A-Z]+/)[0];
      const endRow = parseInt(end.match(/[0-9]+/)[0]);

      const startColIndex = startCol.charCodeAt(0) - 65;
      const endColIndex = endCol.charCodeAt(0) - 65;

      for (let row = startRow; row <= endRow; row++) {
        for (let col = startColIndex; col <= endColIndex; col++) {
          cells.push(this._getColumnLabel(col) + row);
        }
      }
    } else {
      cells.push(range);
    }
    return cells;
  }

  _applyCellFormat(cell, format) {
    const cellId = cell.dataset.cellId;
    if (!this.cellFormats[cellId]) this.cellFormats[cellId] = {};

    if (format === 'bold') {
      cell.style.fontWeight = cell.style.fontWeight === 'bold' ? 'normal' : 'bold';
      this.cellFormats[cellId].fontWeight = cell.style.fontWeight;
    } else if (format === 'italic') {
      cell.style.fontStyle = cell.style.fontStyle === 'italic' ? 'normal' : 'italic';
      this.cellFormats[cellId].fontStyle = cell.style.fontStyle;
    } else if (format === 'underline') {
      cell.style.textDecoration = cell.style.textDecoration === 'underline' ? 'none' : 'underline';
      this.cellFormats[cellId].textDecoration = cell.style.textDecoration;
    }
  }

  _applyCellStyle(cell, property, value) {
    const cellId = cell.dataset.cellId;
    if (!this.cellFormats[cellId]) this.cellFormats[cellId] = {};

    cell.style[property] = value;
    this.cellFormats[cellId][property] = value;
  }

  _applyCellAlignment(cell, alignment) {
    const cellId = cell.dataset.cellId;
    if (!this.cellFormats[cellId]) this.cellFormats[cellId] = {};

    cell.style.textAlign = alignment;
    this.cellFormats[cellId].textAlign = alignment;
  }

  _copyCell() {
    if (this.selectedCell) {
      const cellId = this.selectedCell.dataset.cellId;
      this.copiedCell = {
        value: this.data[cellId],
        format: this.cellFormats[cellId]
      };
      this.statusText.textContent = 'Cell copied';
    }
  }

  _pasteCell() {
    if (this.selectedCell && this.copiedCell) {
      const cellId = this.selectedCell.dataset.cellId;
      this.data[cellId] = this.copiedCell.value;
      if (this.copiedCell.format) {
        this.cellFormats[cellId] = {...this.copiedCell.format};
        Object.assign(this.selectedCell.style, this.copiedCell.format);
      }
      this._updateCellDisplay(this.selectedCell);
      this.isModified = true;
      this.statusText.textContent = 'Cell pasted';
    }
  }

  _clearCell() {
    if (this.selectedCell) {
      const cellId = this.selectedCell.dataset.cellId;
      delete this.data[cellId];
      this.selectedCell.textContent = '';
      this.formulaInput.value = '';
      this.isModified = true;
    }
  }

  _clearFormatting() {
    if (this.selectedCell) {
      const cellId = this.selectedCell.dataset.cellId;
      delete this.cellFormats[cellId];
      this.selectedCell.style.cssText = 'width:100px;height:25px;border:1px solid #ccc;padding:2px 4px;font-size:12px;outline:none;overflow:hidden;white-space:nowrap;box-sizing:border-box;';
    }
  }

  _selectRow(row) {
    // Highlight entire row
    alert(`Row ${row + 1} selected (feature coming soon)`);
  }

  _selectColumn(col) {
    // Highlight entire column
    alert(`Column ${this._getColumnLabel(col)} selected (feature coming soon)`);
  }

  _insertRow(below = false) {
    alert('Insert row feature coming soon');
  }

  _insertColumn(right = false) {
    alert('Insert column feature coming soon');
  }

  _formatAsNumber() {
    if (this.selectedCell) {
      const cellId = this.selectedCell.dataset.cellId;
      this._setCellFormat(cellId, 'number');
      this._updateCellDisplay(this.selectedCell);
    }
  }

  _formatAsCurrency() {
    if (this.selectedCell) {
      const cellId = this.selectedCell.dataset.cellId;
      this._setCellFormat(cellId, 'currency');
      this._updateCellDisplay(this.selectedCell);
    }
  }

  _formatAsPercentage() {
    if (this.selectedCell) {
      const cellId = this.selectedCell.dataset.cellId;
      this._setCellFormat(cellId, 'percentage');
      this._updateCellDisplay(this.selectedCell);
    }
  }

  _formatAsDate() {
    if (this.selectedCell) {
      const cellId = this.selectedCell.dataset.cellId;
      this._setCellFormat(cellId, 'date');
      this._updateCellDisplay(this.selectedCell);
    }
  }

  _setCellBackground() {
    if (this.selectedCell) {
      const color = prompt('Enter background color (e.g., #ffff00 or yellow):');
      if (color) {
        this._applyCellStyle(this.selectedCell, 'background', color);
      }
    }
  }

  _setCellColor() {
    if (this.selectedCell) {
      const color = prompt('Enter text color (e.g., #ff0000 or red):');
      if (color) {
        this._applyCellStyle(this.selectedCell, 'color', color);
      }
    }
  }

  _sortColumn(ascending = true) {
    alert('Sort feature coming soon');
  }

  _showFilter() {
    alert('Filter feature coming soon');
  }

  _showFunctionDialog() {
    const functions = [
      'SUM(range)', 'AVERAGE(range)', 'MIN(range)', 'MAX(range)',
      'COUNT(range)', 'COUNTA(range)', 'ROUND(value, decimals)',
      'SQRT(value)', 'POWER(base, exp)', 'ABS(value)',
      'IF(condition, trueVal, falseVal)'
    ];

    const func = prompt('Available functions:\n\n' + functions.join('\n') + '\n\nEnter function:');
    if (func && this.formulaInput) {
      this.formulaInput.value = '=' + func;
      this.formulaInput.focus();
    }
  }

  _showContextMenu(event, cell) {
    const existing = document.querySelector('.context-menu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.cssText = `
      position:fixed;
      top:${event.clientY}px;
      left:${event.clientX}px;
      background:white;
      border:1px solid #ccc;
      box-shadow:0 2px 8px rgba(0,0,0,0.2);
      border-radius:4px;
      overflow:hidden;
      z-index:10000;
    `;

    const options = [
      { label: 'Copy', action: () => this._copyCell() },
      { label: 'Paste', action: () => this._pasteCell() },
      { label: 'Clear', action: () => this._clearCell() },
      { divider: true },
      { label: 'Format as Number', action: () => this._formatAsNumber() },
      { label: 'Format as Currency', action: () => this._formatAsCurrency() }
    ];

    options.forEach(opt => {
      if (opt.divider) {
        const div = document.createElement('div');
        div.style.cssText = 'height:1px;background:#e0e0e0;margin:4px 0;';
        menu.appendChild(div);
        return;
      }

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

    document.body.appendChild(menu);

    setTimeout(() => {
      document.addEventListener('click', () => menu.remove(), { once: true });
    }, 0);
  }

  _showHelp() {
    const helpText = `Spreadsheet Help

Keyboard Shortcuts:
• Enter: Move down
• Tab: Move right
• Shift+Tab: Move left
• Ctrl+C: Copy cell
• Ctrl+V: Paste cell
• Delete: Clear cell

Functions:
• SUM(A1:A10) - Sum range
• AVERAGE(A1:A10) - Average
• MIN(A1:A10) - Minimum value
• MAX(A1:A10) - Maximum value
• COUNT(A1:A10) - Count numbers
• ROUND(A1, 2) - Round to 2 decimals
• IF(A1>10, "Yes", "No") - Conditional

Formulas start with =
Example: =SUM(A1:A10)/2`;

    alert(helpText);
  }

  async _newSpreadsheet() {
    if (this.isModified && !confirm('You have unsaved changes. Continue?')) {
      return;
    }
    this.currentFile = null;
    this.data = {};
    this.cellFormats = {};
    this.isModified = false;
    document.querySelectorAll('[data-cell-id]').forEach(cell => {
      cell.textContent = '';
      cell.style.cssText = 'width:100px;height:25px;border:1px solid #ccc;padding:2px 4px;font-size:12px;outline:none;overflow:hidden;white-space:nowrap;box-sizing:border-box;';
    });
  }

  async _openSpreadsheet() {
    const path = prompt('Enter spreadsheet path:', '/home/user/');
    if (!path) return;

    try {
      const content = await this.context.fs.readFile(path, { encoding: 'utf8' });
      const parsed = JSON.parse(content);
      this.data = parsed.data || {};
      this.cellFormats = parsed.formats || {};
      this.currentFile = path;
      this.isModified = false;

      Object.keys(this.data).forEach(cellId => {
        const cell = document.querySelector(`[data-cell-id="${cellId}"]`);
        if (cell) {
          this._updateCellDisplay(cell);
          if (this.cellFormats[cellId]) {
            Object.assign(cell.style, this.cellFormats[cellId]);
          }
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
      const content = JSON.stringify({
        data: this.data,
        formats: this.cellFormats
      }, null, 2);
      await this.context.fs.writeFile(this.currentFile, content, { encoding: 'utf8' });
      this.isModified = false;
      this.statusText.textContent = 'Saved';
      setTimeout(() => this.statusText.textContent = 'Ready', 2000);
    } catch (error) {
      alert(`Error saving spreadsheet: ${error.message}`);
    }
  }

  async _saveSpreadsheetAs() {
    const path = prompt('Enter path to save spreadsheet:', '/home/user/spreadsheet.json');
    if (!path) return;

    try {
      const content = JSON.stringify({
        data: this.data,
        formats: this.cellFormats
      }, null, 2);
      await this.context.fs.writeFile(path, content, { encoding: 'utf8' });
      this.currentFile = path;
      this.isModified = false;
      this.statusText.textContent = 'Saved';
      setTimeout(() => this.statusText.textContent = 'Ready', 2000);
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
        const value = this._evaluateCell(cellId) || '';
        rowData.push(`"${value}"`);
      }
      const line = rowData.join(',');
      if (line.replace(/[,"]/g, '').trim()) {
        csv += line + '\n';
      }
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

  async _exportExcel() {
    alert('Excel export would require an XLSX library. For now, use CSV export.');
  }
}
