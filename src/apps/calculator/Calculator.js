export default class Calculator {
  constructor(context) {
    this.context = context;
    this.display = null;
    this.currentValue = '0';
    this.previousValue = null;
    this.operation = null;
    this.newNumber = true;
  }

  async init() {
    // Initialize calculator
  }

  render() {
    const container = document.createElement('div');
    container.className = 'calculator-container';
    container.style.cssText = 'display:flex;flex-direction:column;height:100%;background:#2c3e50;padding:20px;';

    // Display
    this.display = document.createElement('div');
    this.display.className = 'calculator-display';
    this.display.style.cssText = 'background:#34495e;color:#ecf0f1;padding:20px;margin-bottom:20px;border-radius:8px;font-size:32px;text-align:right;font-family:monospace;min-height:60px;word-wrap:break-word;';
    this.display.textContent = '0';

    // Buttons grid
    const buttonsGrid = document.createElement('div');
    buttonsGrid.style.cssText = 'display:grid;grid-template-columns:repeat(4, 1fr);gap:10px;flex:1;';

    const buttons = [
      { label: 'C', class: 'clear', action: () => this.clear() },
      { label: '←', class: 'backspace', action: () => this.backspace() },
      { label: '%', class: 'operator', action: () => this.setOperation('%') },
      { label: '÷', class: 'operator', action: () => this.setOperation('/') },
      { label: '7', class: 'number', action: () => this.appendNumber('7') },
      { label: '8', class: 'number', action: () => this.appendNumber('8') },
      { label: '9', class: 'number', action: () => this.appendNumber('9') },
      { label: '×', class: 'operator', action: () => this.setOperation('*') },
      { label: '4', class: 'number', action: () => this.appendNumber('4') },
      { label: '5', class: 'number', action: () => this.appendNumber('5') },
      { label: '6', class: 'number', action: () => this.appendNumber('6') },
      { label: '-', class: 'operator', action: () => this.setOperation('-') },
      { label: '1', class: 'number', action: () => this.appendNumber('1') },
      { label: '2', class: 'number', action: () => this.appendNumber('2') },
      { label: '3', class: 'number', action: () => this.appendNumber('3') },
      { label: '+', class: 'operator', action: () => this.setOperation('+') },
      { label: '±', class: 'function', action: () => this.toggleSign() },
      { label: '0', class: 'number', action: () => this.appendNumber('0') },
      { label: '.', class: 'number', action: () => this.appendDecimal() },
      { label: '=', class: 'equals', action: () => this.calculate() }
    ];

    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.textContent = btn.label;
      button.className = `calc-btn ${btn.class}`;

      let bgColor = '#34495e';
      let hoverColor = '#445566';

      if (btn.class === 'operator') {
        bgColor = '#e67e22';
        hoverColor = '#d35400';
      } else if (btn.class === 'equals') {
        bgColor = '#27ae60';
        hoverColor = '#229954';
      } else if (btn.class === 'clear') {
        bgColor = '#e74c3c';
        hoverColor = '#c0392b';
      } else if (btn.class === 'function' || btn.class === 'backspace') {
        bgColor = '#95a5a6';
        hoverColor = '#7f8c8d';
      }

      button.style.cssText = `padding:20px;font-size:20px;cursor:pointer;background:${bgColor};color:#fff;border:none;border-radius:8px;transition:all 0.2s;font-weight:bold;`;

      button.addEventListener('mouseenter', () => {
        button.style.background = hoverColor;
      });

      button.addEventListener('mouseleave', () => {
        button.style.background = bgColor;
      });

      button.addEventListener('click', btn.action);
      buttonsGrid.appendChild(button);
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (!container.isConnected) return;

      const key = e.key;
      if (key >= '0' && key <= '9') this.appendNumber(key);
      else if (key === '.') this.appendDecimal();
      else if (key === '+' || key === '-' || key === '*' || key === '/') this.setOperation(key);
      else if (key === 'Enter' || key === '=') this.calculate();
      else if (key === 'Escape') this.clear();
      else if (key === 'Backspace') this.backspace();
      else if (key === '%') this.setOperation('%');
    });

    container.appendChild(this.display);
    container.appendChild(buttonsGrid);

    return container;
  }

  appendNumber(num) {
    if (this.newNumber) {
      this.currentValue = num;
      this.newNumber = false;
    } else {
      if (this.currentValue === '0') {
        this.currentValue = num;
      } else {
        this.currentValue += num;
      }
    }
    this.updateDisplay();
  }

  appendDecimal() {
    if (this.newNumber) {
      this.currentValue = '0.';
      this.newNumber = false;
    } else if (!this.currentValue.includes('.')) {
      this.currentValue += '.';
    }
    this.updateDisplay();
  }

  clear() {
    this.currentValue = '0';
    this.previousValue = null;
    this.operation = null;
    this.newNumber = true;
    this.updateDisplay();
  }

  backspace() {
    if (!this.newNumber) {
      this.currentValue = this.currentValue.slice(0, -1) || '0';
      this.updateDisplay();
    }
  }

  toggleSign() {
    if (this.currentValue !== '0') {
      this.currentValue = this.currentValue.startsWith('-')
        ? this.currentValue.slice(1)
        : '-' + this.currentValue;
      this.updateDisplay();
    }
  }

  setOperation(op) {
    if (this.previousValue !== null && !this.newNumber) {
      this.calculate();
    }
    this.previousValue = parseFloat(this.currentValue);
    this.operation = op;
    this.newNumber = true;
  }

  calculate() {
    if (this.operation === null || this.previousValue === null) return;

    const current = parseFloat(this.currentValue);
    let result;

    switch (this.operation) {
      case '+':
        result = this.previousValue + current;
        break;
      case '-':
        result = this.previousValue - current;
        break;
      case '*':
        result = this.previousValue * current;
        break;
      case '/':
        result = this.previousValue / current;
        break;
      case '%':
        result = this.previousValue % current;
        break;
      default:
        return;
    }

    // Handle division by zero
    if (!isFinite(result)) {
      this.currentValue = 'Error';
    } else {
      // Round to avoid floating point errors
      this.currentValue = String(Math.round(result * 100000000) / 100000000);
    }

    this.previousValue = null;
    this.operation = null;
    this.newNumber = true;
    this.updateDisplay();
  }

  updateDisplay() {
    this.display.textContent = this.currentValue;
  }
}
