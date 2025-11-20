export default class CharacterMap {
  constructor(context) {
    this.context = context;
    this.fs = context.fs;
    this.ipc = context.ipc;
    this.process = context.process;

    this.categories = {
      'Basic Latin': { start: 0x0020, end: 0x007F },
      'Latin-1 Supplement': { start: 0x00A0, end: 0x00FF },
      'Greek': { start: 0x0370, end: 0x03FF },
      'Cyrillic': { start: 0x0400, end: 0x04FF },
      'Arabic': { start: 0x0600, end: 0x06FF },
      'Hebrew': { start: 0x0590, end: 0x05FF },
      'Arrows': { start: 0x2190, end: 0x21FF },
      'Mathematical Operators': { start: 0x2200, end: 0x22FF },
      'Box Drawing': { start: 0x2500, end: 0x257F },
      'Geometric Shapes': { start: 0x25A0, end: 0x25FF },
      'Miscellaneous Symbols': { start: 0x2600, end: 0x26FF },
      'Dingbats': { start: 0x2700, end: 0x27BF },
      'Emoticons': { start: 0x1F600, end: 0x1F64F },
      'Transport Symbols': { start: 0x1F680, end: 0x1F6FF },
      'Miscellaneous Symbols and Pictographs': { start: 0x1F300, end: 0x1F5FF }
    };

    this.currentCategory = 'Basic Latin';
    this.selectedChar = null;
    this.searchQuery = '';
  }

  async init() {
    // Nothing to load
  }

  render() {
    const container = document.createElement('div');
    container.className = 'character-map-container';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #f5f5f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Header
    const header = this.createHeader();
    container.appendChild(header);

    // Main content
    const content = document.createElement('div');
    content.style.cssText = `
      flex: 1;
      display: flex;
      overflow: hidden;
    `;

    // Left panel - Categories
    const leftPanel = this.createCategoriesPanel();
    content.appendChild(leftPanel);

    // Center panel - Character grid
    const centerPanel = this.createCharacterGrid();
    content.appendChild(centerPanel);

    // Right panel - Character info
    const rightPanel = this.createInfoPanel();
    content.appendChild(rightPanel);

    container.appendChild(content);

    return container;
  }

  createHeader() {
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 15px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;

    const title = document.createElement('h2');
    title.textContent = '=$ Character Map';
    title.style.cssText = 'margin: 0; font-size: 24px;';

    // Search bar
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = 'flex: 1; max-width: 400px; margin: 0 20px;';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search characters...';
    searchInput.style.cssText = `
      width: 100%;
      padding: 8px 15px;
      border: none;
      border-radius: 20px;
      font-size: 14px;
      box-sizing: border-box;
    `;
    searchInput.oninput = (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.renderCharacterGrid();
    };
    searchContainer.appendChild(searchInput);

    header.appendChild(title);
    header.appendChild(searchContainer);

    return header;
  }

  createCategoriesPanel() {
    const panel = document.createElement('div');
    panel.style.cssText = `
      width: 250px;
      background: white;
      border-right: 1px solid #ddd;
      overflow-y: auto;
    `;

    const panelHeader = document.createElement('div');
    panelHeader.style.cssText = `
      padding: 15px;
      background: #fafafa;
      border-bottom: 1px solid #ddd;
      font-weight: 600;
      font-size: 14px;
      color: #666;
    `;
    panelHeader.textContent = 'CATEGORIES';

    panel.appendChild(panelHeader);

    Object.keys(this.categories).forEach(category => {
      const item = document.createElement('div');
      item.textContent = category;
      item.style.cssText = `
        padding: 12px 15px;
        cursor: pointer;
        transition: background 0.2s;
        font-size: 14px;
        ${this.currentCategory === category ? 'background: #f0f0f0; font-weight: 600; border-left: 3px solid #667eea;' : ''}
      `;

      item.onmouseover = () => {
        if (this.currentCategory !== category) {
          item.style.background = '#fafafa';
        }
      };
      item.onmouseout = () => {
        if (this.currentCategory !== category) {
          item.style.background = 'white';
        }
      };

      item.onclick = () => {
        this.currentCategory = category;
        this.searchQuery = '';
        // Re-render entire component
        const parent = panel.parentElement.parentElement;
        const newRender = this.render();
        parent.replaceWith(newRender);
      };

      panel.appendChild(item);
    });

    return panel;
  }

  createCharacterGrid() {
    const panel = document.createElement('div');
    panel.style.cssText = `
      flex: 1;
      background: white;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;

    const panelHeader = document.createElement('div');
    panelHeader.style.cssText = `
      padding: 15px;
      background: #fafafa;
      border-bottom: 1px solid #ddd;
      font-weight: 600;
      font-size: 16px;
    `;
    panelHeader.textContent = this.currentCategory;

    this.gridContainer = document.createElement('div');
    this.gridContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    `;
    this.renderCharacterGrid();

    panel.appendChild(panelHeader);
    panel.appendChild(this.gridContainer);

    return panel;
  }

  renderCharacterGrid() {
    this.gridContainer.innerHTML = '';

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
      gap: 5px;
    `;

    const range = this.categories[this.currentCategory];
    const characters = [];

    for (let code = range.start; code <= range.end; code++) {
      const char = String.fromCodePoint(code);

      // Apply search filter
      if (this.searchQuery) {
        const hexCode = code.toString(16).toUpperCase();
        const decCode = code.toString();
        if (!char.toLowerCase().includes(this.searchQuery) &&
            !hexCode.includes(this.searchQuery.toUpperCase()) &&
            !decCode.includes(this.searchQuery)) {
          continue;
        }
      }

      characters.push({ char, code });
    }

    if (characters.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'No characters found';
      empty.style.cssText = 'padding: 40px; text-align: center; color: #999;';
      this.gridContainer.appendChild(empty);
      return;
    }

    characters.forEach(({ char, code }) => {
      const cell = document.createElement('div');
      cell.textContent = char;
      cell.title = `U+${code.toString(16).toUpperCase().padStart(4, '0')}`;
      cell.style.cssText = `
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        background: #f8f9fa;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        user-select: none;
      `;

      cell.onmouseover = () => {
        cell.style.background = '#e9ecef';
        cell.style.transform = 'scale(1.1)';
      };
      cell.onmouseout = () => {
        cell.style.background = '#f8f9fa';
        cell.style.transform = 'scale(1)';
      };

      cell.onclick = () => {
        this.selectedChar = { char, code };
        this.renderInfoPanel();
        navigator.clipboard.writeText(char);

        // Visual feedback
        cell.style.background = '#667eea';
        cell.style.color = 'white';
        setTimeout(() => {
          cell.style.background = '#f8f9fa';
          cell.style.color = 'inherit';
        }, 200);
      };

      grid.appendChild(cell);
    });

    this.gridContainer.appendChild(grid);
  }

  createInfoPanel() {
    const panel = document.createElement('div');
    panel.style.cssText = `
      width: 300px;
      background: white;
      border-left: 1px solid #ddd;
      display: flex;
      flex-direction: column;
      overflow: auto;
    `;

    const panelHeader = document.createElement('div');
    panelHeader.style.cssText = `
      padding: 15px;
      background: #fafafa;
      border-bottom: 1px solid #ddd;
      font-weight: 600;
      font-size: 14px;
      color: #666;
    `;
    panelHeader.textContent = 'CHARACTER INFO';

    this.infoContainer = document.createElement('div');
    this.infoContainer.style.cssText = 'padding: 20px;';
    this.renderInfoPanel();

    panel.appendChild(panelHeader);
    panel.appendChild(this.infoContainer);

    return panel;
  }

  renderInfoPanel() {
    if (!this.infoContainer) return;

    this.infoContainer.innerHTML = '';

    if (!this.selectedChar) {
      const placeholder = document.createElement('div');
      placeholder.textContent = 'Click on a character to see details';
      placeholder.style.cssText = `
        text-align: center;
        padding: 40px 20px;
        color: #999;
      `;
      this.infoContainer.appendChild(placeholder);
      return;
    }

    const { char, code } = this.selectedChar;

    // Large character display
    const charDisplay = document.createElement('div');
    charDisplay.textContent = char;
    charDisplay.style.cssText = `
      font-size: 100px;
      text-align: center;
      padding: 30px;
      background: #f8f9fa;
      border-radius: 12px;
      margin-bottom: 20px;
    `;
    this.infoContainer.appendChild(charDisplay);

    // Copy notification
    const copyNote = document.createElement('div');
    copyNote.textContent = ' Copied to clipboard!';
    copyNote.style.cssText = `
      text-align: center;
      color: #4caf50;
      font-size: 13px;
      margin-bottom: 20px;
      font-weight: 600;
    `;
    this.infoContainer.appendChild(copyNote);

    // Character info
    const info = [
      { label: 'Character', value: char },
      { label: 'Unicode', value: `U+${code.toString(16).toUpperCase().padStart(4, '0')}` },
      { label: 'Decimal', value: code },
      { label: 'HTML Entity', value: `&#${code};` },
      { label: 'CSS Code', value: `\\${code.toString(16).toUpperCase()}` },
      { label: 'JavaScript', value: `\\u{${code.toString(16).toUpperCase()}}` }
    ];

    info.forEach(item => {
      const row = document.createElement('div');
      row.style.cssText = `
        margin-bottom: 15px;
        padding-bottom: 15px;
        border-bottom: 1px solid #f0f0f0;
      `;

      const label = document.createElement('div');
      label.textContent = item.label;
      label.style.cssText = `
        font-size: 12px;
        color: #999;
        margin-bottom: 5px;
      `;

      const valueContainer = document.createElement('div');
      valueContainer.style.cssText = 'display: flex; align-items: center; gap: 10px;';

      const value = document.createElement('div');
      value.textContent = item.value;
      value.style.cssText = `
        flex: 1;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        color: #333;
        word-break: break-all;
      `;

      const copyBtn = document.createElement('button');
      copyBtn.textContent = '=Ë';
      copyBtn.title = 'Copy';
      copyBtn.style.cssText = `
        width: 30px;
        height: 30px;
        border: none;
        border-radius: 4px;
        background: #e9ecef;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
      `;
      copyBtn.onmouseover = () => copyBtn.style.background = '#dee2e6';
      copyBtn.onmouseout = () => copyBtn.style.background = '#e9ecef';
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(item.value);
        copyBtn.textContent = '';
        setTimeout(() => copyBtn.textContent = '=Ë', 1000);
      };

      valueContainer.appendChild(value);
      valueContainer.appendChild(copyBtn);

      row.appendChild(label);
      row.appendChild(valueContainer);

      this.infoContainer.appendChild(row);
    });
  }

  async destroy() {
    // Nothing to cleanup
  }
}
