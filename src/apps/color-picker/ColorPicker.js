export default class ColorPicker {
  constructor(context) {
    this.context = context;
    this.fs = context.fs;
    this.ipc = context.ipc;
    this.process = context.process;

    this.currentColor = '#667eea';
    this.savedColors = [];
    this.dataPath = '/home/color-picker-data.json';
  }

  async init() {
    await this.loadData();
  }

  async loadData() {
    try {
      const data = await this.fs.readFile(this.dataPath);
      const parsed = JSON.parse(data);
      this.savedColors = parsed.colors || [];
    } catch (error) {
      this.savedColors = [];
      await this.saveData();
    }
  }

  async saveData() {
    await this.fs.writeFile(this.dataPath, JSON.stringify({ colors: this.savedColors }, null, 2));
  }

  render() {
    const container = document.createElement('div');
    container.className = 'color-picker-container';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #f5f5f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 15px 20px;
      background: linear-gradient(135deg, ${this.currentColor} 0%, ${this.adjustColor(this.currentColor, -20)} 100%);
      color: white;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: background 0.3s;
    `;

    const title = document.createElement('h2');
    title.textContent = '<¨ Color Picker';
    title.style.cssText = 'margin: 0; font-size: 24px;';
    header.appendChild(title);

    this.headerElement = header;
    container.appendChild(header);

    // Main content
    const content = document.createElement('div');
    content.style.cssText = `
      flex: 1;
      overflow: auto;
      padding: 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 30px;
    `;

    // Color display
    const colorDisplay = this.createColorDisplay();
    content.appendChild(colorDisplay);

    // Color picker input
    const pickerSection = this.createPickerSection();
    content.appendChild(pickerSection);

    // Color formats
    const formatsSection = this.createFormatsSection();
    content.appendChild(formatsSection);

    // Saved colors
    const savedSection = this.createSavedColorsSection();
    content.appendChild(savedSection);

    container.appendChild(content);

    return container;
  }

  createColorDisplay() {
    const section = document.createElement('div');
    section.style.cssText = 'text-align: center;';

    const colorBox = document.createElement('div');
    colorBox.style.cssText = `
      width: 200px;
      height: 200px;
      background: ${this.currentColor};
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      transition: background 0.3s;
      margin: 0 auto 20px;
    `;
    this.colorBox = colorBox;

    const colorName = document.createElement('div');
    colorName.textContent = this.currentColor.toUpperCase();
    colorName.style.cssText = `
      font-size: 28px;
      font-weight: 600;
      color: #333;
      font-variant-numeric: tabular-nums;
    `;
    this.colorName = colorName;

    section.appendChild(colorBox);
    section.appendChild(colorName);

    return section;
  }

  createPickerSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 500px;
    `;

    const label = document.createElement('h3');
    label.textContent = 'Pick a Color';
    label.style.cssText = 'margin: 0 0 20px 0; color: #333;';

    const pickerContainer = document.createElement('div');
    pickerContainer.style.cssText = 'display: flex; gap: 15px; align-items: center;';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = this.currentColor;
    colorInput.style.cssText = `
      width: 80px;
      height: 80px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    `;
    colorInput.oninput = (e) => {
      this.currentColor = e.target.value;
      this.updateColorDisplay();
    };

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.value = this.currentColor;
    textInput.placeholder = '#000000';
    textInput.style.cssText = `
      flex: 1;
      padding: 15px;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 600;
      text-transform: uppercase;
    `;
    textInput.oninput = (e) => {
      const value = e.target.value;
      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        this.currentColor = value;
        colorInput.value = value;
        this.updateColorDisplay();
      }
    };
    this.textInput = textInput;

    const saveBtn = document.createElement('button');
    saveBtn.textContent = '=¾';
    saveBtn.title = 'Save color';
    saveBtn.style.cssText = `
      width: 50px;
      height: 50px;
      border: none;
      border-radius: 8px;
      background: #667eea;
      color: white;
      font-size: 24px;
      cursor: pointer;
      transition: background 0.2s;
    `;
    saveBtn.onmouseover = () => saveBtn.style.background = '#5568d3';
    saveBtn.onmouseout = () => saveBtn.style.background = '#667eea';
    saveBtn.onclick = () => this.saveColor();

    pickerContainer.appendChild(colorInput);
    pickerContainer.appendChild(textInput);
    pickerContainer.appendChild(saveBtn);

    section.appendChild(label);
    section.appendChild(pickerContainer);

    return section;
  }

  createFormatsSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 500px;
    `;

    const label = document.createElement('h3');
    label.textContent = 'Color Formats';
    label.style.cssText = 'margin: 0 0 20px 0; color: #333;';

    this.formatsContainer = document.createElement('div');
    this.formatsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';
    this.updateFormats();

    section.appendChild(label);
    section.appendChild(this.formatsContainer);

    return section;
  }

  updateFormats() {
    const rgb = this.hexToRgb(this.currentColor);
    const hsl = this.hexToHsl(this.currentColor);

    const formats = [
      { label: 'HEX', value: this.currentColor.toUpperCase() },
      { label: 'RGB', value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
      { label: 'HSL', value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
      { label: 'CSS Var', value: `var(--color-primary, ${this.currentColor})` }
    ];

    this.formatsContainer.innerHTML = '';

    formats.forEach(format => {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex;
        align-items: center;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 6px;
      `;

      const labelEl = document.createElement('div');
      labelEl.textContent = format.label;
      labelEl.style.cssText = `
        width: 80px;
        font-weight: 600;
        color: #666;
        font-size: 13px;
      `;

      const valueEl = document.createElement('div');
      valueEl.textContent = format.value;
      valueEl.style.cssText = `
        flex: 1;
        font-family: 'Courier New', monospace;
        color: #333;
      `;

      const copyBtn = document.createElement('button');
      copyBtn.textContent = '=Ë';
      copyBtn.title = 'Copy to clipboard';
      copyBtn.style.cssText = `
        width: 35px;
        height: 35px;
        border: none;
        border-radius: 6px;
        background: #e9ecef;
        cursor: pointer;
        font-size: 16px;
        transition: background 0.2s;
      `;
      copyBtn.onmouseover = () => copyBtn.style.background = '#dee2e6';
      copyBtn.onmouseout = () => copyBtn.style.background = '#e9ecef';
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(format.value);
        copyBtn.textContent = '';
        setTimeout(() => copyBtn.textContent = '=Ë', 1000);
      };

      row.appendChild(labelEl);
      row.appendChild(valueEl);
      row.appendChild(copyBtn);

      this.formatsContainer.appendChild(row);
    });
  }

  createSavedColorsSection() {
    const section = document.createElement('div');
    section.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 500px;
    `;

    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;';

    const label = document.createElement('h3');
    label.textContent = 'Saved Colors';
    label.style.cssText = 'margin: 0; color: #333;';

    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear All';
    clearBtn.style.cssText = `
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      background: #f44336;
      color: white;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
    `;
    clearBtn.onclick = async () => {
      if (confirm('Clear all saved colors?')) {
        this.savedColors = [];
        await this.saveData();
        this.renderSavedColors();
      }
    };

    header.appendChild(label);
    if (this.savedColors.length > 0) {
      header.appendChild(clearBtn);
    }

    this.savedColorsContainer = document.createElement('div');
    this.savedColorsContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
      gap: 10px;
    `;
    this.renderSavedColors();

    section.appendChild(header);
    section.appendChild(this.savedColorsContainer);

    return section;
  }

  renderSavedColors() {
    this.savedColorsContainer.innerHTML = '';

    if (this.savedColors.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'No saved colors yet';
      empty.style.cssText = 'padding: 30px; text-align: center; color: #999;';
      this.savedColorsContainer.appendChild(empty);
      return;
    }

    this.savedColors.forEach((color, index) => {
      const swatch = document.createElement('div');
      swatch.style.cssText = `
        width: 60px;
        height: 60px;
        background: ${color};
        border-radius: 8px;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        transition: transform 0.2s;
        position: relative;
      `;

      swatch.title = color;

      swatch.onmouseover = () => swatch.style.transform = 'scale(1.1)';
      swatch.onmouseout = () => swatch.style.transform = 'scale(1)';

      swatch.onclick = () => {
        this.currentColor = color;
        this.textInput.value = color;
        this.updateColorDisplay();
      };

      // Delete button on hover
      const deleteBtn = document.createElement('div');
      deleteBtn.textContent = '×';
      deleteBtn.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        width: 20px;
        height: 20px;
        background: #f44336;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s;
      `;

      deleteBtn.onclick = async (e) => {
        e.stopPropagation();
        this.savedColors.splice(index, 1);
        await this.saveData();
        this.renderSavedColors();
      };

      swatch.onmouseenter = () => deleteBtn.style.opacity = '1';
      swatch.onmouseleave = () => deleteBtn.style.opacity = '0';

      swatch.appendChild(deleteBtn);
      this.savedColorsContainer.appendChild(swatch);
    });
  }

  async saveColor() {
    if (!this.savedColors.includes(this.currentColor)) {
      this.savedColors.unshift(this.currentColor);
      if (this.savedColors.length > 50) {
        this.savedColors.pop();
      }
      await this.saveData();
      this.renderSavedColors();
    }
  }

  updateColorDisplay() {
    this.colorBox.style.background = this.currentColor;
    this.colorName.textContent = this.currentColor.toUpperCase();
    this.textInput.value = this.currentColor.toUpperCase();
    this.headerElement.style.background = `linear-gradient(135deg, ${this.currentColor} 0%, ${this.adjustColor(this.currentColor, -20)} 100%)`;
    this.updateFormats();
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  hexToHsl(hex) {
    const rgb = this.hexToRgb(hex);
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  adjustColor(hex, percent) {
    const num = parseInt(hex.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;

    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
  }

  async destroy() {
    await this.saveData();
  }
}
