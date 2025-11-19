/**
 * VirtualKeyboard - Mobile Virtual Keyboard for Terminal
 *
 * Provides a mobile-friendly keyboard with special keys for terminal usage.
 * Includes tab completion, arrow keys, ctrl sequences, and common shortcuts.
 */

export class VirtualKeyboard {
  constructor(terminal) {
    this.terminal = terminal;
    this.keyboard = null;
    this.isVisible = false;
    this.currentLayout = 'alpha'; // alpha, symbols, function
  }

  /**
   * Create virtual keyboard
   */
  create() {
    this.keyboard = document.createElement('div');
    this.keyboard.id = 'virtual-keyboard';
    this.keyboard.className = 'virtual-keyboard hidden';
    this.keyboard.innerHTML = this.getKeyboardHTML();

    // Add event listeners
    this.keyboard.addEventListener('click', (e) => {
      const key = e.target.closest('.key');
      if (key) {
        this.handleKeyPress(key);
      }
    });

    document.body.appendChild(this.keyboard);
    return this.keyboard;
  }

  /**
   * Get keyboard HTML
   */
  getKeyboardHTML() {
    return `
      <style>
        .virtual-keyboard {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(20, 20, 30, 0.98);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding: 10px;
          padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
          z-index: 10001;
          transition: transform 0.3s ease;
          transform: translateY(100%);
        }

        .virtual-keyboard.visible {
          transform: translateY(0);
        }

        .virtual-keyboard.hidden {
          transform: translateY(100%);
        }

        .keyboard-toolbar {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .keyboard-toolbar::-webkit-scrollbar {
          height: 3px;
        }

        .keyboard-toolbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .toolbar-button {
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 6px;
          color: #fff;
          font-size: 12px;
          white-space: nowrap;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .toolbar-button:active {
          background: rgba(255, 255, 255, 0.2);
        }

        .toolbar-button.active {
          background: #4a9eff;
        }

        .keyboard-rows {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .keyboard-row {
          display: flex;
          gap: 4px;
          justify-content: center;
        }

        .key {
          flex: 1;
          min-width: 0;
          height: 42px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 6px;
          color: #fff;
          font-size: 16px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }

        .key:active {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(0.95);
        }

        .key.wide {
          flex: 1.5;
        }

        .key.wider {
          flex: 2;
        }

        .key.special {
          background: rgba(74, 158, 255, 0.2);
          font-size: 13px;
        }

        .key.ctrl {
          background: rgba(255, 100, 100, 0.2);
        }

        .keyboard-layout-alpha,
        .keyboard-layout-symbols,
        .keyboard-layout-function {
          display: none;
        }

        .keyboard-layout-alpha.active,
        .keyboard-layout-symbols.active,
        .keyboard-layout-function.active {
          display: block;
        }
      </style>

      <div class="keyboard-toolbar">
        <button class="toolbar-button" data-action="tab">Tab ⇥</button>
        <button class="toolbar-button" data-action="esc">Esc</button>
        <button class="toolbar-button ctrl-button" data-ctrl="c">Ctrl+C</button>
        <button class="toolbar-button ctrl-button" data-ctrl="z">Ctrl+Z</button>
        <button class="toolbar-button ctrl-button" data-ctrl="d">Ctrl+D</button>
        <button class="toolbar-button" data-action="clear">Clear</button>
        <button class="toolbar-button" data-action="hide">Hide ▼</button>
      </div>

      <!-- Alpha Layout -->
      <div class="keyboard-layout-alpha active">
        <div class="keyboard-rows">
          <div class="keyboard-row">
            <div class="key" data-key="q">q</div>
            <div class="key" data-key="w">w</div>
            <div class="key" data-key="e">e</div>
            <div class="key" data-key="r">r</div>
            <div class="key" data-key="t">t</div>
            <div class="key" data-key="y">y</div>
            <div class="key" data-key="u">u</div>
            <div class="key" data-key="i">i</div>
            <div class="key" data-key="o">o</div>
            <div class="key" data-key="p">p</div>
          </div>
          <div class="keyboard-row">
            <div class="key" data-key="a">a</div>
            <div class="key" data-key="s">s</div>
            <div class="key" data-key="d">d</div>
            <div class="key" data-key="f">f</div>
            <div class="key" data-key="g">g</div>
            <div class="key" data-key="h">h</div>
            <div class="key" data-key="j">j</div>
            <div class="key" data-key="k">k</div>
            <div class="key" data-key="l">l</div>
          </div>
          <div class="keyboard-row">
            <div class="key special" data-action="shift">⇧</div>
            <div class="key" data-key="z">z</div>
            <div class="key" data-key="x">x</div>
            <div class="key" data-key="c">c</div>
            <div class="key" data-key="v">v</div>
            <div class="key" data-key="b">b</div>
            <div class="key" data-key="n">n</div>
            <div class="key" data-key="m">m</div>
            <div class="key special" data-key="Backspace">⌫</div>
          </div>
          <div class="keyboard-row">
            <div class="key special" data-action="symbols">123</div>
            <div class="key special" data-key="ArrowLeft">←</div>
            <div class="key special" data-key="ArrowRight">→</div>
            <div class="key wider" data-key=" ">Space</div>
            <div class="key special" data-key="-">-</div>
            <div class="key special" data-key="/">⁄</div>
            <div class="key special wide" data-key="Enter">↵</div>
          </div>
        </div>
      </div>

      <!-- Symbols Layout -->
      <div class="keyboard-layout-symbols">
        <div class="keyboard-rows">
          <div class="keyboard-row">
            <div class="key" data-key="1">1</div>
            <div class="key" data-key="2">2</div>
            <div class="key" data-key="3">3</div>
            <div class="key" data-key="4">4</div>
            <div class="key" data-key="5">5</div>
            <div class="key" data-key="6">6</div>
            <div class="key" data-key="7">7</div>
            <div class="key" data-key="8">8</div>
            <div class="key" data-key="9">9</div>
            <div class="key" data-key="0">0</div>
          </div>
          <div class="keyboard-row">
            <div class="key" data-key="-">-</div>
            <div class="key" data-key="/">⁄</div>
            <div class="key" data-key=":">:</div>
            <div class="key" data-key=";">;</div>
            <div class="key" data-key="(">(</div>
            <div class="key" data-key=")">)</div>
            <div class="key" data-key="$">$</div>
            <div class="key" data-key="&">&</div>
            <div class="key" data-key="@">@</div>
          </div>
          <div class="keyboard-row">
            <div class="key special" data-action="function">Fn</div>
            <div class="key" data-key=".">.</div>
            <div class="key" data-key=",">,</div>
            <div class="key" data-key="?">?</div>
            <div class="key" data-key="!">!</div>
            <div class="key" data-key="'">'</div>
            <div class="key" data-key='"'>"</div>
            <div class="key special" data-key="Backspace">⌫</div>
          </div>
          <div class="keyboard-row">
            <div class="key special" data-action="alpha">ABC</div>
            <div class="key special" data-key="ArrowUp">↑</div>
            <div class="key special" data-key="ArrowDown">↓</div>
            <div class="key wider" data-key=" ">Space</div>
            <div class="key" data-key="_">_</div>
            <div class="key" data-key="|">|</div>
            <div class="key special wide" data-key="Enter">↵</div>
          </div>
        </div>
      </div>

      <!-- Function Keys Layout -->
      <div class="keyboard-layout-function">
        <div class="keyboard-rows">
          <div class="keyboard-row">
            <div class="key special" data-key="F1">F1</div>
            <div class="key special" data-key="F2">F2</div>
            <div class="key special" data-key="F3">F3</div>
            <div class="key special" data-key="F4">F4</div>
            <div class="key special" data-key="F5">F5</div>
            <div class="key special" data-key="F6">F6</div>
          </div>
          <div class="keyboard-row">
            <div class="key special" data-key="F7">F7</div>
            <div class="key special" data-key="F8">F8</div>
            <div class="key special" data-key="F9">F9</div>
            <div class="key special" data-key="F10">F10</div>
            <div class="key special" data-key="F11">F11</div>
            <div class="key special" data-key="F12">F12</div>
          </div>
          <div class="keyboard-row">
            <div class="key special" data-key="Home">Home</div>
            <div class="key special" data-key="End">End</div>
            <div class="key special" data-key="PageUp">PgUp</div>
            <div class="key special" data-key="PageDown">PgDn</div>
            <div class="key special" data-key="Insert">Ins</div>
            <div class="key special" data-key="Delete">Del</div>
          </div>
          <div class="keyboard-row">
            <div class="key special wide" data-action="symbols">123</div>
            <div class="key special" data-key="ArrowUp">↑</div>
            <div class="key special" data-key="ArrowDown">↓</div>
            <div class="key wider" data-key=" ">Space</div>
            <div class="key special wide" data-key="Enter">↵</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Handle key press
   */
  handleKeyPress(keyElement) {
    const key = keyElement.dataset.key;
    const action = keyElement.dataset.action;
    const ctrl = keyElement.dataset.ctrl;

    // Handle special actions
    if (action) {
      switch (action) {
        case 'shift':
          // Toggle uppercase
          this.toggleShift();
          break;

        case 'symbols':
          this.switchLayout('symbols');
          break;

        case 'alpha':
          this.switchLayout('alpha');
          break;

        case 'function':
          this.switchLayout('function');
          break;

        case 'tab':
          this.terminal.handleInput('\t');
          break;

        case 'esc':
          this.terminal.handleInput('\x1b');
          break;

        case 'clear':
          this.terminal.clear();
          break;

        case 'hide':
          this.hide();
          break;
      }
    }
    // Handle ctrl sequences
    else if (ctrl) {
      const ctrlKey = ctrl.toLowerCase();
      const code = ctrlKey.charCodeAt(0) - 96; // Convert to ctrl code
      this.terminal.handleInput(String.fromCharCode(code));
    }
    // Handle regular keys
    else if (key) {
      if (key.length === 1) {
        // Regular character
        this.terminal.handleInput(key);
      } else {
        // Special key (Enter, Backspace, Arrow, etc.)
        this.handleSpecialKey(key);
      }
    }

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }

  /**
   * Handle special keys
   */
  handleSpecialKey(key) {
    switch (key) {
      case 'Enter':
        this.terminal.handleInput('\n');
        break;

      case 'Backspace':
        this.terminal.handleInput('\x7f');
        break;

      case 'ArrowLeft':
        this.terminal.handleInput('\x1b[D');
        break;

      case 'ArrowRight':
        this.terminal.handleInput('\x1b[C');
        break;

      case 'ArrowUp':
        this.terminal.handleInput('\x1b[A');
        break;

      case 'ArrowDown':
        this.terminal.handleInput('\x1b[B');
        break;

      case 'Home':
        this.terminal.handleInput('\x1b[H');
        break;

      case 'End':
        this.terminal.handleInput('\x1b[F');
        break;

      case 'Delete':
        this.terminal.handleInput('\x1b[3~');
        break;

      default:
        // F-keys and others
        if (key.startsWith('F')) {
          const num = parseInt(key.substring(1));
          const code = '\x1bO' + String.fromCharCode(80 + num - 1);
          this.terminal.handleInput(code);
        }
    }
  }

  /**
   * Switch keyboard layout
   */
  switchLayout(layout) {
    this.currentLayout = layout;

    // Hide all layouts
    this.keyboard.querySelectorAll('[class^="keyboard-layout-"]').forEach(l => {
      l.classList.remove('active');
    });

    // Show selected layout
    const selectedLayout = this.keyboard.querySelector(`.keyboard-layout-${layout}`);
    if (selectedLayout) {
      selectedLayout.classList.add('active');
    }
  }

  /**
   * Toggle shift (uppercase/lowercase)
   */
  toggleShift() {
    const alphaLayout = this.keyboard.querySelector('.keyboard-layout-alpha');
    const keys = alphaLayout.querySelectorAll('.key[data-key]');

    keys.forEach(key => {
      const char = key.dataset.key;
      if (char && char.length === 1 && char.match(/[a-z]/)) {
        const isUpper = char === char.toUpperCase();
        const newChar = isUpper ? char.toLowerCase() : char.toUpperCase();
        key.dataset.key = newChar;
        key.textContent = newChar;
      }
    });
  }

  /**
   * Show keyboard
   */
  show() {
    if (!this.keyboard) {
      this.create();
    }

    this.isVisible = true;
    this.keyboard.classList.remove('hidden');
    this.keyboard.classList.add('visible');

    // Adjust terminal height
    if (this.terminal.element) {
      this.terminal.element.style.paddingBottom = '300px';
    }
  }

  /**
   * Hide keyboard
   */
  hide() {
    this.isVisible = false;
    this.keyboard.classList.remove('visible');
    this.keyboard.classList.add('hidden');

    // Reset terminal height
    if (this.terminal.element) {
      this.terminal.element.style.paddingBottom = '0';
    }
  }

  /**
   * Toggle keyboard visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Destroy keyboard
   */
  destroy() {
    if (this.keyboard) {
      this.keyboard.remove();
      this.keyboard = null;
    }
  }
}

export default VirtualKeyboard;
