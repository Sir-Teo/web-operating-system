export default class TicTacToe {
  constructor(context) {
    this.context = context;
    this.board = Array(9).fill(null);
    this.isXNext = true;
    this.gameOver = false;
    this.winner = null;
    this.xWins = 0;
    this.oWins = 0;
    this.draws = 0;
    this.container = null;
    this.cells = [];
  }

  async init() {
    // Try to load saved statistics
    try {
      const stats = await this.context.fs.readFile('/home/user/tictactoe-stats.json');
      const data = JSON.parse(stats);
      this.xWins = data.xWins || 0;
      this.oWins = data.oWins || 0;
      this.draws = data.draws || 0;
    } catch (error) {
      // No saved stats yet, start fresh
    }
  }

  render() {
    this.container = document.createElement('div');
    this.container.className = 'tic-tac-toe-container';
    this.container.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;

    // Title
    const title = document.createElement('h1');
    title.textContent = '⭕ Tic Tac Toe ❌';
    title.style.cssText = `
      color: white;
      margin: 0 0 20px 0;
      font-size: 32px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    `;
    this.container.appendChild(title);

    // Status display
    this.statusDiv = document.createElement('div');
    this.statusDiv.style.cssText = `
      color: white;
      font-size: 24px;
      margin-bottom: 20px;
      font-weight: bold;
      min-height: 30px;
    `;
    this._updateStatus();
    this.container.appendChild(this.statusDiv);

    // Game board
    const boardWrapper = document.createElement('div');
    boardWrapper.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;

    const board = document.createElement('div');
    board.className = 'board';
    board.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 100px);
      grid-template-rows: repeat(3, 100px);
      gap: 10px;
      background: #e0e0e0;
      padding: 10px;
      border-radius: 10px;
    `;

    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('button');
      cell.className = 'cell';
      cell.style.cssText = `
        width: 100px;
        height: 100px;
        font-size: 48px;
        font-weight: bold;
        background: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      `;
      cell.addEventListener('click', () => this._makeMove(i));
      cell.addEventListener('mouseenter', () => {
        if (!this.board[i] && !this.gameOver) {
          cell.style.background = '#f0f0f0';
          cell.style.transform = 'scale(1.05)';
        }
      });
      cell.addEventListener('mouseleave', () => {
        cell.style.background = 'white';
        cell.style.transform = 'scale(1)';
      });
      this.cells.push(cell);
      board.appendChild(cell);
    }

    boardWrapper.appendChild(board);
    this.container.appendChild(boardWrapper);

    // Controls
    const controls = document.createElement('div');
    controls.style.cssText = `
      margin-top: 20px;
      display: flex;
      gap: 10px;
    `;

    const newGameBtn = document.createElement('button');
    newGameBtn.textContent = '🔄 New Game';
    newGameBtn.style.cssText = `
      padding: 12px 24px;
      font-size: 16px;
      font-weight: bold;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    `;
    newGameBtn.addEventListener('mouseenter', () => {
      newGameBtn.style.background = '#45a049';
      newGameBtn.style.transform = 'translateY(-2px)';
    });
    newGameBtn.addEventListener('mouseleave', () => {
      newGameBtn.style.background = '#4CAF50';
      newGameBtn.style.transform = 'translateY(0)';
    });
    newGameBtn.addEventListener('click', () => this._resetGame());
    controls.appendChild(newGameBtn);

    const resetStatsBtn = document.createElement('button');
    resetStatsBtn.textContent = '📊 Reset Stats';
    resetStatsBtn.style.cssText = `
      padding: 12px 24px;
      font-size: 16px;
      font-weight: bold;
      background: #ff9800;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    `;
    resetStatsBtn.addEventListener('mouseenter', () => {
      resetStatsBtn.style.background = '#e68900';
      resetStatsBtn.style.transform = 'translateY(-2px)';
    });
    resetStatsBtn.addEventListener('mouseleave', () => {
      resetStatsBtn.style.background = '#ff9800';
      resetStatsBtn.style.transform = 'translateY(0)';
    });
    resetStatsBtn.addEventListener('click', () => this._resetStats());
    controls.appendChild(resetStatsBtn);

    this.container.appendChild(controls);

    // Statistics
    this.statsDiv = document.createElement('div');
    this.statsDiv.style.cssText = `
      margin-top: 20px;
      color: white;
      font-size: 18px;
      text-align: center;
      background: rgba(0,0,0,0.2);
      padding: 15px;
      border-radius: 10px;
      min-width: 300px;
    `;
    this._updateStats();
    this.container.appendChild(this.statsDiv);

    return this.container;
  }

  _makeMove(index) {
    if (this.board[index] || this.gameOver) {
      return;
    }

    this.board[index] = this.isXNext ? 'X' : 'O';
    this.cells[index].textContent = this.board[index];
    this.cells[index].style.color = this.isXNext ? '#2196F3' : '#F44336';

    const winner = this._checkWinner();
    if (winner) {
      this.gameOver = true;
      this.winner = winner;
      if (winner === 'X') {
        this.xWins++;
      } else if (winner === 'O') {
        this.oWins++;
      }
      this._highlightWinningLine();
      this._saveStats();
    } else if (this.board.every(cell => cell !== null)) {
      this.gameOver = true;
      this.winner = 'Draw';
      this.draws++;
      this._saveStats();
    }

    this.isXNext = !this.isXNext;
    this._updateStatus();
    this._updateStats();
  }

  _checkWinner() {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]              // Diagonals
    ];

    for (const [a, b, c] of lines) {
      if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
        this.winningLine = [a, b, c];
        return this.board[a];
      }
    }
    return null;
  }

  _highlightWinningLine() {
    if (this.winningLine) {
      this.winningLine.forEach(index => {
        this.cells[index].style.background = '#4CAF50';
        this.cells[index].style.color = 'white';
      });
    }
  }

  _updateStatus() {
    if (this.gameOver) {
      if (this.winner === 'Draw') {
        this.statusDiv.textContent = "🤝 It's a Draw!";
      } else {
        this.statusDiv.textContent = `🎉 ${this.winner} Wins!`;
      }
    } else {
      const symbol = this.isXNext ? '❌' : '⭕';
      this.statusDiv.textContent = `${symbol} ${this.isXNext ? 'X' : 'O'}'s Turn`;
    }
  }

  _updateStats() {
    this.statsDiv.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 10px;">📊 Statistics</div>
      <div style="display: flex; justify-content: space-around;">
        <div>
          <div style="font-size: 24px; font-weight: bold; color: #2196F3;">${this.xWins}</div>
          <div style="font-size: 14px;">X Wins</div>
        </div>
        <div>
          <div style="font-size: 24px; font-weight: bold; color: #FFC107;">${this.draws}</div>
          <div style="font-size: 14px;">Draws</div>
        </div>
        <div>
          <div style="font-size: 24px; font-weight: bold; color: #F44336;">${this.oWins}</div>
          <div style="font-size: 14px;">O Wins</div>
        </div>
      </div>
    `;
  }

  _resetGame() {
    this.board = Array(9).fill(null);
    this.isXNext = true;
    this.gameOver = false;
    this.winner = null;
    this.winningLine = null;

    this.cells.forEach(cell => {
      cell.textContent = '';
      cell.style.background = 'white';
      cell.style.color = '';
    });

    this._updateStatus();
  }

  _resetStats() {
    this.xWins = 0;
    this.oWins = 0;
    this.draws = 0;
    this._updateStats();
    this._saveStats();
  }

  async _saveStats() {
    try {
      const stats = {
        xWins: this.xWins,
        oWins: this.oWins,
        draws: this.draws
      };
      await this.context.fs.writeFile('/home/user/tictactoe-stats.json', JSON.stringify(stats));
    } catch (error) {
      console.error('Failed to save stats:', error);
    }
  }

  destroy() {
    // Cleanup if needed
  }
}
