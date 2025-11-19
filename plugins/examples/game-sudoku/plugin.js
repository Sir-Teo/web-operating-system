/**
 * Sudoku Game Plugin
 * Classic number puzzle
 */

class SudokuGame {
  constructor(api) {
    this.api = api;
    this.container = null;
    this.grid = [];
    this.solution = [];
    this.selected = null;
    this.difficulty = 'medium';
  }

  async activate() {
    this.createUI();
    this.newGame();
    this.api.ui.notify('Sudoku activated!');
  }

  async deactivate() {
    if (this.container) {
      this.container.remove();
    }
  }

  createUI() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      z-index: 10000;
      font-family: Arial, sans-serif;
    `;

    this.container.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; color: white; font-size: 36px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">Sudoku</h1>
        <div style="margin-top: 10px;">
          <select id="difficulty" style="padding: 5px 10px; border-radius: 5px; border: none; font-size: 14px;">
            <option value="easy">Easy</option>
            <option value="medium" selected>Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div id="sudoku-grid" style="
        background: white;
        padding: 10px;
        border-radius: 8px;
        margin-bottom: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      "></div>

      <div id="number-pad" style="
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 8px;
        margin-bottom: 15px;
      "></div>

      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="new-game" style="
          padding: 12px 25px;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 25px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
        ">New Game</button>
        <button id="check-btn" style="
          padding: 12px 25px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 25px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
        ">Check</button>
        <button id="close-game" style="
          padding: 12px 25px;
          background: rgba(255,255,255,0.2);
          color: white;
          border: none;
          border-radius: 25px;
          font-size: 16px;
          cursor: pointer;
        ">Close</button>
      </div>
    `;

    document.body.appendChild(this.container);

    this.container.querySelector('#new-game').addEventListener('click', () => this.newGame());
    this.container.querySelector('#check-btn').addEventListener('click', () => this.checkSolution());
    this.container.querySelector('#close-game').addEventListener('click', () => {
      this.container.style.display = 'none';
    });
    this.container.querySelector('#difficulty').addEventListener('change', (e) => {
      this.difficulty = e.target.value;
      this.newGame();
    });

    this.renderNumberPad();
  }

  newGame() {
    this.solution = this.generateSolution();
    this.grid = JSON.parse(JSON.stringify(this.solution));
    this.removeNumbers();
    this.selected = null;
    this.renderGrid();
  }

  generateSolution() {
    const grid = Array(9).fill(null).map(() => Array(9).fill(0));

    const fillGrid = (grid) => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0) {
            const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);

            for (let num of numbers) {
              if (this.isValid(grid, row, col, num)) {
                grid[row][col] = num;

                if (fillGrid(grid)) {
                  return true;
                }

                grid[row][col] = 0;
              }
            }

            return false;
          }
        }
      }
      return true;
    };

    fillGrid(grid);
    return grid;
  }

  isValid(grid, row, col, num) {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < 9; x++) {
      if (grid[x][col] === num) return false;
    }

    // Check 3x3 box
    const startRow = row - row % 3;
    const startCol = col - col % 3;

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[i + startRow][j + startCol] === num) return false;
      }
    }

    return true;
  }

  removeNumbers() {
    const difficulties = {
      easy: 35,
      medium: 45,
      hard: 55
    };

    const cellsToRemove = difficulties[this.difficulty];
    let removed = 0;

    while (removed < cellsToRemove) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);

      if (this.grid[row][col] !== 0) {
        this.grid[row][col] = 0;
        removed++;
      }
    }
  }

  renderGrid() {
    const gridEl = this.container.querySelector('#sudoku-grid');
    gridEl.innerHTML = '';

    gridEl.style.cssText += `
      display: grid;
      grid-template-columns: repeat(9, 45px);
      grid-template-rows: repeat(9, 45px);
      gap: 1px;
      background: #333;
      padding: 0;
    `;

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = document.createElement('div');
        const value = this.grid[row][col];
        const isFixed = this.solution[row][col] !== 0 && value !== 0 &&
                        value === this.solution[row][col];

        cell.style.cssText = `
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: bold;
          cursor: ${isFixed ? 'default' : 'pointer'};
          color: ${isFixed ? '#333' : '#667eea'};
          ${col % 3 === 2 && col !== 8 ? 'border-right: 2px solid #333;' : ''}
          ${row % 3 === 2 && row !== 8 ? 'border-bottom: 2px solid #333;' : ''}
        `;

        cell.textContent = value || '';
        cell.dataset.row = row;
        cell.dataset.col = col;

        if (!isFixed) {
          cell.addEventListener('click', () => {
            this.selectCell(row, col);
          });
        }

        gridEl.appendChild(cell);
      }
    }

    this.updateSelection();
  }

  selectCell(row, col) {
    if (this.solution[row][col] !== this.grid[row][col] || this.grid[row][col] === 0) {
      this.selected = { row, col };
      this.updateSelection();
    }
  }

  updateSelection() {
    const cells = this.container.querySelectorAll('#sudoku-grid > div');
    cells.forEach((cell, idx) => {
      const row = Math.floor(idx / 9);
      const col = idx % 9;

      if (this.selected && this.selected.row === row && this.selected.col === col) {
        cell.style.background = '#e3f2fd';
      } else {
        cell.style.background = 'white';
      }
    });
  }

  renderNumberPad() {
    const pad = this.container.querySelector('#number-pad');

    for (let i = 1; i <= 9; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.style.cssText = `
        padding: 15px;
        background: white;
        border: none;
        border-radius: 8px;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
        color: #667eea;
      `;

      btn.addEventListener('click', () => {
        if (this.selected) {
          this.grid[this.selected.row][this.selected.col] = i;
          this.renderGrid();
        }
      });

      pad.appendChild(btn);
    }

    // Clear button
    const clearBtn = document.createElement('button');
    clearBtn.textContent = '✕';
    clearBtn.style.cssText = `
      padding: 15px;
      background: #ff6b6b;
      border: none;
      border-radius: 8px;
      font-size: 20px;
      font-weight: bold;
      cursor: pointer;
      color: white;
    `;

    clearBtn.addEventListener('click', () => {
      if (this.selected) {
        this.grid[this.selected.row][this.selected.col] = 0;
        this.renderGrid();
      }
    });

    pad.appendChild(clearBtn);
  }

  checkSolution() {
    let correct = true;

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.grid[row][col] !== this.solution[row][col]) {
          correct = false;
          break;
        }
      }
      if (!correct) break;
    }

    if (correct) {
      alert('🎉 Congratulations! You solved it!');
    } else {
      alert('Not quite right. Keep trying!');
    }
  }
}

module.exports = SudokuGame;
