/**
 * 2048 Game Plugin
 * Classic number puzzle game
 */

class Game2048 {
  constructor(api) {
    this.api = api;
    this.container = null;
    this.grid = [];
    this.score = 0;
    this.bestScore = 0;
    this.size = 4;
    this.gameOver = false;
  }

  async activate() {
    // Load best score
    const saved = await this.api.storage.get('2048-best');
    if (saved) this.bestScore = parseInt(saved);

    this.createUI();
    this.newGame();
    this.api.ui.notify('2048 activated! Use arrow keys to play.');
  }

  async deactivate() {
    if (this.container) {
      this.container.remove();
    }
    document.removeEventListener('keydown', this.keyHandler);
  }

  createUI() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(250, 248, 239, 0.98);
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-family: "Clear Sans", "Helvetica Neue", Arial, sans-serif;
    `;

    this.container.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; color: #776e65; font-size: 60px; font-weight: bold;">2048</h1>
        <div style="display: flex; justify-content: space-between; margin-top: 10px;">
          <div style="background: #bbada0; padding: 10px 20px; border-radius: 3px; flex: 1; margin-right: 10px;">
            <div style="color: #eee4da; font-size: 12px; text-transform: uppercase;">Score</div>
            <div id="score" style="color: white; font-size: 20px; font-weight: bold;">0</div>
          </div>
          <div style="background: #bbada0; padding: 10px 20px; border-radius: 3px; flex: 1;">
            <div style="color: #eee4da; font-size: 12px; text-transform: uppercase;">Best</div>
            <div id="best" style="color: white; font-size: 20px; font-weight: bold;">${this.bestScore}</div>
          </div>
        </div>
      </div>

      <div id="game-board" style="
        background: #bbada0;
        border-radius: 6px;
        padding: 10px;
        position: relative;
        width: 400px;
        height: 400px;
        margin-bottom: 15px;
      "></div>

      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="new-game" style="
          padding: 10px 30px;
          background: #8f7a66;
          color: #f9f6f2;
          border: none;
          border-radius: 3px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
        ">New Game</button>
        <button id="close-game" style="
          padding: 10px 30px;
          background: #776e65;
          color: #f9f6f2;
          border: none;
          border-radius: 3px;
          font-size: 16px;
          cursor: pointer;
        ">Close</button>
      </div>

      <div style="text-align: center; margin-top: 10px; color: #776e65; font-size: 14px;">
        Use arrow keys to play
      </div>
    `;

    document.body.appendChild(this.container);

    // Event listeners
    this.container.querySelector('#new-game').addEventListener('click', () => this.newGame());
    this.container.querySelector('#close-game').addEventListener('click', () => {
      this.container.style.display = 'none';
    });

    this.keyHandler = this.handleKeyPress.bind(this);
    document.addEventListener('keydown', this.keyHandler);
  }

  newGame() {
    this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    this.score = 0;
    this.gameOver = false;
    this.addRandomTile();
    this.addRandomTile();
    this.updateUI();
  }

  addRandomTile() {
    const empty = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) {
          empty.push({ r, c });
        }
      }
    }

    if (empty.length > 0) {
      const { r, c } = empty[Math.floor(Math.random() * empty.length)];
      this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  handleKeyPress(e) {
    if (this.gameOver) return;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

    e.preventDefault();

    const moved = this.move(e.key);
    if (moved) {
      this.addRandomTile();
      this.updateUI();

      if (this.isGameOver()) {
        this.gameOver = true;
        setTimeout(() => {
          alert(`Game Over! Final Score: ${this.score}`);
        }, 300);
      }
    }
  }

  move(direction) {
    const oldGrid = JSON.stringify(this.grid);

    switch (direction) {
      case 'ArrowUp':
        this.moveUp();
        break;
      case 'ArrowDown':
        this.moveDown();
        break;
      case 'ArrowLeft':
        this.moveLeft();
        break;
      case 'ArrowRight':
        this.moveRight();
        break;
    }

    return oldGrid !== JSON.stringify(this.grid);
  }

  moveLeft() {
    for (let r = 0; r < this.size; r++) {
      const row = this.grid[r].filter(x => x !== 0);
      for (let i = 0; i < row.length - 1; i++) {
        if (row[i] === row[i + 1]) {
          row[i] *= 2;
          this.score += row[i];
          row.splice(i + 1, 1);
        }
      }
      this.grid[r] = row.concat(Array(this.size - row.length).fill(0));
    }
  }

  moveRight() {
    for (let r = 0; r < this.size; r++) {
      const row = this.grid[r].filter(x => x !== 0).reverse();
      for (let i = 0; i < row.length - 1; i++) {
        if (row[i] === row[i + 1]) {
          row[i] *= 2;
          this.score += row[i];
          row.splice(i + 1, 1);
        }
      }
      this.grid[r] = Array(this.size - row.length).fill(0).concat(row.reverse());
    }
  }

  moveUp() {
    for (let c = 0; c < this.size; c++) {
      const col = [];
      for (let r = 0; r < this.size; r++) {
        if (this.grid[r][c] !== 0) col.push(this.grid[r][c]);
      }
      for (let i = 0; i < col.length - 1; i++) {
        if (col[i] === col[i + 1]) {
          col[i] *= 2;
          this.score += col[i];
          col.splice(i + 1, 1);
        }
      }
      for (let r = 0; r < this.size; r++) {
        this.grid[r][c] = col[r] || 0;
      }
    }
  }

  moveDown() {
    for (let c = 0; c < this.size; c++) {
      const col = [];
      for (let r = this.size - 1; r >= 0; r--) {
        if (this.grid[r][c] !== 0) col.push(this.grid[r][c]);
      }
      for (let i = 0; i < col.length - 1; i++) {
        if (col[i] === col[i + 1]) {
          col[i] *= 2;
          this.score += col[i];
          col.splice(i + 1, 1);
        }
      }
      for (let r = this.size - 1; r >= 0; r--) {
        this.grid[r][c] = col[this.size - 1 - r] || 0;
      }
    }
  }

  isGameOver() {
    // Check for empty cells
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) return false;
      }
    }

    // Check for possible merges
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.grid[r][c];
        if (c < this.size - 1 && val === this.grid[r][c + 1]) return false;
        if (r < this.size - 1 && val === this.grid[r + 1][c]) return false;
      }
    }

    return true;
  }

  async updateUI() {
    // Update score
    this.container.querySelector('#score').textContent = this.score;

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.container.querySelector('#best').textContent = this.bestScore;
      await this.api.storage.set('2048-best', this.bestScore.toString());
    }

    // Update board
    const board = this.container.querySelector('#game-board');
    board.innerHTML = '';

    const cellSize = 90;
    const gap = 10;

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const value = this.grid[r][c];
        const cell = document.createElement('div');

        const colors = {
          0: { bg: '#cdc1b4', fg: '#776e65' },
          2: { bg: '#eee4da', fg: '#776e65' },
          4: { bg: '#ede0c8', fg: '#776e65' },
          8: { bg: '#f2b179', fg: '#f9f6f2' },
          16: { bg: '#f59563', fg: '#f9f6f2' },
          32: { bg: '#f67c5f', fg: '#f9f6f2' },
          64: { bg: '#f65e3b', fg: '#f9f6f2' },
          128: { bg: '#edcf72', fg: '#f9f6f2' },
          256: { bg: '#edcc61', fg: '#f9f6f2' },
          512: { bg: '#edc850', fg: '#f9f6f2' },
          1024: { bg: '#edc53f', fg: '#f9f6f2' },
          2048: { bg: '#edc22e', fg: '#f9f6f2' }
        };

        const color = colors[value] || colors[2048];

        cell.style.cssText = `
          position: absolute;
          width: ${cellSize}px;
          height: ${cellSize}px;
          left: ${c * (cellSize + gap) + gap}px;
          top: ${r * (cellSize + gap) + gap}px;
          background: ${color.bg};
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${value >= 1000 ? '30px' : value >= 100 ? '40px' : '50px'};
          font-weight: bold;
          color: ${color.fg};
          transition: all 0.15s ease;
        `;

        cell.textContent = value || '';
        board.appendChild(cell);
      }
    }
  }
}

module.exports = Game2048;
