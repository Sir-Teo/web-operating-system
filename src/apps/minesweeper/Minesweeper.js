export default class Minesweeper {
  constructor(context) {
    this.context = context;
    this.difficulty = 'medium';
    this.difficulties = {
      easy: { rows: 9, cols: 9, mines: 10 },
      medium: { rows: 16, cols: 16, mines: 40 },
      hard: { rows: 16, cols: 30, mines: 99 }
    };
    this.cellSize = 30;
    this.board = [];
    this.revealed = [];
    this.flagged = [];
    this.gameOver = false;
    this.won = false;
    this.startTime = null;
    this.timer = null;
    this.elapsedTime = 0;
    this.minesLeft = 0;
    this.firstClick = true;
  }

  async init() {
    this._initGame();
  }

  render() {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%);
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      overflow-y: auto;
    `;

    // Title
    const title = document.createElement('h1');
    title.textContent = '💣 Minesweeper';
    title.style.cssText = `
      color: #333;
      margin: 0 0 15px 0;
      font-size: 32px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
    `;
    container.appendChild(title);

    // Info bar
    const infoBar = document.createElement('div');
    infoBar.style.cssText = `
      display: flex;
      gap: 30px;
      margin-bottom: 15px;
      background: white;
      padding: 15px 30px;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      font-size: 20px;
      font-weight: bold;
    `;

    this.minesDisplay = document.createElement('div');
    this.minesDisplay.textContent = `💣 ${this.minesLeft}`;
    infoBar.appendChild(this.minesDisplay);

    const faceBtn = document.createElement('button');
    this.faceBtn = faceBtn;
    faceBtn.textContent = '😊';
    faceBtn.style.cssText = `
      font-size: 24px;
      border: none;
      background: #f0f0f0;
      cursor: pointer;
      border-radius: 5px;
      padding: 5px 10px;
      transition: all 0.2s;
    `;
    faceBtn.addEventListener('click', () => this._resetGame());
    infoBar.appendChild(faceBtn);

    this.timerDisplay = document.createElement('div');
    this.timerDisplay.textContent = `⏱️ 0`;
    infoBar.appendChild(this.timerDisplay);

    container.appendChild(infoBar);

    // Difficulty selector
    const difficultyBar = document.createElement('div');
    difficultyBar.style.cssText = `
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    `;

    ['easy', 'medium', 'hard'].forEach(diff => {
      const btn = document.createElement('button');
      btn.textContent = diff.charAt(0).toUpperCase() + diff.slice(1);
      btn.style.cssText = `
        padding: 8px 20px;
        font-size: 14px;
        font-weight: bold;
        background: ${this.difficulty === diff ? '#4CAF50' : '#ddd'};
        color: ${this.difficulty === diff ? 'white' : '#333'};
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      `;
      btn.addEventListener('click', () => {
        this.difficulty = diff;
        this._resetGame();
      });
      difficultyBar.appendChild(btn);
    });

    container.appendChild(difficultyBar);

    // Game board wrapper
    const boardWrapper = document.createElement('div');
    boardWrapper.style.cssText = `
      background: white;
      padding: 10px;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      overflow: auto;
      max-width: 90vw;
      max-height: 60vh;
    `;

    // Game board
    this.boardElement = document.createElement('div');
    this._renderBoard();
    boardWrapper.appendChild(this.boardElement);
    container.appendChild(boardWrapper);

    // Instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = `
      margin-top: 15px;
      color: #555;
      font-size: 14px;
      text-align: center;
      background: white;
      padding: 10px 20px;
      border-radius: 8px;
    `;
    instructions.innerHTML = `
      <div>Left Click: Reveal | Right Click: Flag</div>
    `;
    container.appendChild(instructions);

    return container;
  }

  _initGame() {
    const config = this.difficulties[this.difficulty];
    this.rows = config.rows;
    this.cols = config.cols;
    this.totalMines = config.mines;
    this.minesLeft = this.totalMines;
    this.firstClick = true;
    this.gameOver = false;
    this.won = false;
    this.elapsedTime = 0;

    // Initialize empty board
    this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    this.revealed = Array(this.rows).fill(null).map(() => Array(this.cols).fill(false));
    this.flagged = Array(this.rows).fill(null).map(() => Array(this.cols).fill(false));

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.faceBtn) {
      this.faceBtn.textContent = '😊';
    }
  }

  _placeMines(avoidRow, avoidCol) {
    let minesPlaced = 0;
    while (minesPlaced < this.totalMines) {
      const row = Math.floor(Math.random() * this.rows);
      const col = Math.floor(Math.random() * this.cols);

      // Don't place mine on first click or adjacent cells
      const tooClose = Math.abs(row - avoidRow) <= 1 && Math.abs(col - avoidCol) <= 1;

      if (this.board[row][col] !== -1 && !tooClose) {
        this.board[row][col] = -1;
        minesPlaced++;
      }
    }

    // Calculate numbers
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.board[row][col] !== -1) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const newRow = row + dr;
              const newCol = col + dc;
              if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
                if (this.board[newRow][newCol] === -1) {
                  count++;
                }
              }
            }
          }
          this.board[row][col] = count;
        }
      }
    }
  }

  _renderBoard() {
    const config = this.difficulties[this.difficulty];
    this.boardElement.innerHTML = '';
    this.boardElement.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${config.cols}, ${this.cellSize}px);
      grid-template-rows: repeat(${config.rows}, ${this.cellSize}px);
      gap: 1px;
      background: #999;
      border: 2px solid #999;
    `;

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = document.createElement('div');
        cell.className = 'mine-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.style.cssText = `
          width: ${this.cellSize}px;
          height: ${this.cellSize}px;
          background: #ccc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          user-select: none;
        `;

        cell.addEventListener('click', (e) => this._handleCellClick(row, col));
        cell.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          this._handleRightClick(row, col);
        });

        this._updateCell(cell, row, col);
        this.boardElement.appendChild(cell);
      }
    }
  }

  _updateCell(cell, row, col) {
    if (this.flagged[row][col]) {
      cell.style.background = '#ccc';
      cell.textContent = '🚩';
    } else if (this.revealed[row][col]) {
      cell.style.background = '#eee';
      cell.style.cursor = 'default';

      if (this.board[row][col] === -1) {
        cell.textContent = '💣';
        cell.style.background = '#f44336';
      } else if (this.board[row][col] > 0) {
        cell.textContent = this.board[row][col];
        const colors = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000000', '#808080'];
        cell.style.color = colors[this.board[row][col]];
      }
    } else {
      cell.style.background = '#ccc';
      cell.textContent = '';
    }
  }

  _handleCellClick(row, col) {
    if (this.gameOver || this.flagged[row][col]) return;

    if (this.firstClick) {
      this.firstClick = false;
      this._placeMines(row, col);
      this._startTimer();
    }

    this._revealCell(row, col);
    this._checkWin();
    this._renderBoard();
  }

  _handleRightClick(row, col) {
    if (this.gameOver || this.revealed[row][col]) return;

    this.flagged[row][col] = !this.flagged[row][col];
    this.minesLeft += this.flagged[row][col] ? -1 : 1;
    this.minesDisplay.textContent = `💣 ${this.minesLeft}`;
    this._renderBoard();
  }

  _revealCell(row, col) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
    if (this.revealed[row][col] || this.flagged[row][col]) return;

    this.revealed[row][col] = true;

    if (this.board[row][col] === -1) {
      this._endGame(false);
      return;
    }

    if (this.board[row][col] === 0) {
      // Reveal adjacent cells
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          this._revealCell(row + dr, col + dc);
        }
      }
    }
  }

  _checkWin() {
    let revealedCount = 0;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.revealed[row][col]) {
          revealedCount++;
        }
      }
    }

    const totalCells = this.rows * this.cols;
    if (revealedCount === totalCells - this.totalMines) {
      this._endGame(true);
    }
  }

  _startTimer() {
    this.startTime = Date.now();
    this.timer = setInterval(() => {
      this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
      this.timerDisplay.textContent = `⏱️ ${this.elapsedTime}`;
    }, 1000);
  }

  _endGame(won) {
    this.gameOver = true;
    this.won = won;

    if (this.timer) {
      clearInterval(this.timer);
    }

    // Reveal all mines
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.board[row][col] === -1) {
          this.revealed[row][col] = true;
        }
      }
    }

    this.faceBtn.textContent = won ? '😎' : '😵';
    this._renderBoard();

    // Show message
    setTimeout(() => {
      if (won) {
        alert(`Congratulations! You won in ${this.elapsedTime} seconds! 🎉`);
      }
    }, 100);
  }

  _resetGame() {
    this._initGame();
    this._renderBoard();
    if (this.minesDisplay) {
      this.minesDisplay.textContent = `💣 ${this.minesLeft}`;
    }
    if (this.timerDisplay) {
      this.timerDisplay.textContent = `⏱️ 0`;
    }
  }

  destroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
