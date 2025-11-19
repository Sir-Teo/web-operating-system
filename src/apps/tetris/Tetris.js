export default class Tetris {
  constructor(context) {
    this.context = context;
    this.cols = 10;
    this.rows = 20;
    this.blockSize = 30;
    this.board = [];
    this.currentPiece = null;
    this.nextPiece = null;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.highScore = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.gameLoop = null;
    this.dropInterval = 1000;
    this.canvas = null;
    this.ctx = null;
    this.nextCanvas = null;
    this.nextCtx = null;

    // Tetromino shapes
    this.shapes = {
      I: [[1, 1, 1, 1]],
      O: [[1, 1], [1, 1]],
      T: [[0, 1, 0], [1, 1, 1]],
      S: [[0, 1, 1], [1, 1, 0]],
      Z: [[1, 1, 0], [0, 1, 1]],
      J: [[1, 0, 0], [1, 1, 1]],
      L: [[0, 0, 1], [1, 1, 1]]
    };

    this.colors = {
      I: '#00f0f0',
      O: '#f0f000',
      T: '#a000f0',
      S: '#00f000',
      Z: '#f00000',
      J: '#0000f0',
      L: '#f0a000'
    };
  }

  async init() {
    // Load high score
    try {
      const data = await this.context.fs.readFile('/home/user/tetris-highscore.json');
      const parsed = JSON.parse(data);
      this.highScore = parsed.highScore || 0;
    } catch (error) {
      // No saved high score
    }

    this._initBoard();
    this._spawnPiece();
    this._spawnNextPiece();
  }

  render() {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      overflow-y: auto;
    `;

    // Title
    const title = document.createElement('h1');
    title.textContent = '🎮 Tetris';
    title.style.cssText = `
      color: white;
      margin: 0 0 15px 0;
      font-size: 32px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    `;
    container.appendChild(title);

    // Game area
    const gameArea = document.createElement('div');
    gameArea.style.cssText = `
      display: flex;
      gap: 20px;
      align-items: flex-start;
    `;

    // Main game canvas wrapper
    const canvasWrapper = document.createElement('div');
    canvasWrapper.style.cssText = `
      background: white;
      padding: 10px;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.cols * this.blockSize;
    this.canvas.height = this.rows * this.blockSize;
    this.canvas.style.cssText = `
      display: block;
      background: #000;
      border-radius: 5px;
    `;
    this.ctx = this.canvas.getContext('2d');
    canvasWrapper.appendChild(this.canvas);
    gameArea.appendChild(canvasWrapper);

    // Side panel
    const sidePanel = document.createElement('div');
    sidePanel.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 15px;
    `;

    // Next piece preview
    const nextWrapper = document.createElement('div');
    nextWrapper.style.cssText = `
      background: white;
      padding: 15px;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;

    const nextTitle = document.createElement('div');
    nextTitle.textContent = 'Next';
    nextTitle.style.cssText = `
      font-weight: bold;
      margin-bottom: 10px;
      text-align: center;
      font-size: 18px;
    `;
    nextWrapper.appendChild(nextTitle);

    this.nextCanvas = document.createElement('canvas');
    this.nextCanvas.width = 120;
    this.nextCanvas.height = 120;
    this.nextCanvas.style.cssText = `
      display: block;
      background: #000;
      border-radius: 5px;
    `;
    this.nextCtx = this.nextCanvas.getContext('2d');
    nextWrapper.appendChild(this.nextCanvas);
    sidePanel.appendChild(nextWrapper);

    // Stats
    this.statsDiv = document.createElement('div');
    this.statsDiv.style.cssText = `
      background: white;
      padding: 15px;
      border-radius: 10px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      font-size: 16px;
    `;
    this._updateStats();
    sidePanel.appendChild(this.statsDiv);

    // Controls
    const controls = document.createElement('div');
    controls.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;

    const pauseBtn = document.createElement('button');
    this.pauseBtn = pauseBtn;
    pauseBtn.textContent = '⏸️ Pause';
    pauseBtn.style.cssText = `
      padding: 10px 20px;
      font-size: 16px;
      font-weight: bold;
      background: #FFC107;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    `;
    pauseBtn.addEventListener('click', () => this._togglePause());
    controls.appendChild(pauseBtn);

    const newGameBtn = document.createElement('button');
    newGameBtn.textContent = '🔄 New Game';
    newGameBtn.style.cssText = `
      padding: 10px 20px;
      font-size: 16px;
      font-weight: bold;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    `;
    newGameBtn.addEventListener('click', () => this._resetGame());
    controls.appendChild(newGameBtn);

    sidePanel.appendChild(controls);
    gameArea.appendChild(sidePanel);
    container.appendChild(gameArea);

    // Instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = `
      margin-top: 15px;
      color: rgba(255,255,255,0.8);
      font-size: 14px;
      text-align: center;
    `;
    instructions.innerHTML = `
      <div>← → : Move | ↑ : Rotate | ↓ : Soft Drop | Space : Hard Drop</div>
    `;
    container.appendChild(instructions);

    // Keyboard controls
    this.keydownHandler = (e) => {
      if (this.gameOver || this.isPaused) return;

      switch (e.key) {
        case 'ArrowLeft':
          this._movePiece(-1, 0);
          e.preventDefault();
          break;
        case 'ArrowRight':
          this._movePiece(1, 0);
          e.preventDefault();
          break;
        case 'ArrowDown':
          this._movePiece(0, 1);
          e.preventDefault();
          break;
        case 'ArrowUp':
          this._rotatePiece();
          e.preventDefault();
          break;
        case ' ':
          this._hardDrop();
          e.preventDefault();
          break;
      }
      this._draw();
    };
    document.addEventListener('keydown', this.keydownHandler);

    // Start game loop
    this._draw();
    this._drawNextPiece();
    this._startGameLoop();

    return container;
  }

  _initBoard() {
    this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
  }

  _spawnPiece() {
    if (this.nextPiece) {
      this.currentPiece = this.nextPiece;
    } else {
      const types = Object.keys(this.shapes);
      const type = types[Math.floor(Math.random() * types.length)];
      this.currentPiece = {
        type: type,
        shape: JSON.parse(JSON.stringify(this.shapes[type])),
        x: Math.floor(this.cols / 2) - 1,
        y: 0,
        color: this.colors[type]
      };
    }

    // Check game over
    if (!this._isValidMove(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
      this._endGame();
    }
  }

  _spawnNextPiece() {
    const types = Object.keys(this.shapes);
    const type = types[Math.floor(Math.random() * types.length)];
    this.nextPiece = {
      type: type,
      shape: JSON.parse(JSON.stringify(this.shapes[type])),
      x: Math.floor(this.cols / 2) - 1,
      y: 0,
      color: this.colors[type]
    };
    this._drawNextPiece();
  }

  _startGameLoop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
    this.gameLoop = setInterval(() => {
      if (!this.isPaused && !this.gameOver) {
        if (!this._movePiece(0, 1)) {
          this._lockPiece();
          this._clearLines();
          this._spawnPiece();
          this._spawnNextPiece();
        }
        this._draw();
      }
    }, this.dropInterval);
  }

  _movePiece(dx, dy) {
    const newX = this.currentPiece.x + dx;
    const newY = this.currentPiece.y + dy;

    if (this._isValidMove(newX, newY, this.currentPiece.shape)) {
      this.currentPiece.x = newX;
      this.currentPiece.y = newY;
      return true;
    }
    return false;
  }

  _rotatePiece() {
    const rotated = this.currentPiece.shape[0].map((_, i) =>
      this.currentPiece.shape.map(row => row[i]).reverse()
    );

    if (this._isValidMove(this.currentPiece.x, this.currentPiece.y, rotated)) {
      this.currentPiece.shape = rotated;
    }
  }

  _hardDrop() {
    while (this._movePiece(0, 1)) {
      this.score += 2;
    }
    this._lockPiece();
    this._clearLines();
    this._spawnPiece();
    this._spawnNextPiece();
    this._updateStats();
  }

  _isValidMove(x, y, shape) {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const newX = x + col;
          const newY = y + row;

          if (newX < 0 || newX >= this.cols || newY >= this.rows) {
            return false;
          }

          if (newY >= 0 && this.board[newY][newX]) {
            return false;
          }
        }
      }
    }
    return true;
  }

  _lockPiece() {
    const piece = this.currentPiece;
    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col]) {
          const boardY = piece.y + row;
          const boardX = piece.x + col;
          if (boardY >= 0) {
            this.board[boardY][boardX] = piece.color;
          }
        }
      }
    }
  }

  _clearLines() {
    let linesCleared = 0;
    for (let row = this.rows - 1; row >= 0; row--) {
      if (this.board[row].every(cell => cell !== 0)) {
        this.board.splice(row, 1);
        this.board.unshift(Array(this.cols).fill(0));
        linesCleared++;
        row++;
      }
    }

    if (linesCleared > 0) {
      this.lines += linesCleared;
      const points = [0, 100, 300, 500, 800][linesCleared] * this.level;
      this.score += points;

      // Level up every 10 lines
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
      this._startGameLoop();

      this._updateStats();
    }
  }

  _draw() {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    this.ctx.strokeStyle = '#222';
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= this.cols; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * this.blockSize, 0);
      this.ctx.lineTo(i * this.blockSize, this.canvas.height);
      this.ctx.stroke();
    }
    for (let i = 0; i <= this.rows; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * this.blockSize);
      this.ctx.lineTo(this.canvas.width, i * this.blockSize);
      this.ctx.stroke();
    }

    // Draw locked pieces
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.board[row][col]) {
          this._drawBlock(col, row, this.board[row][col]);
        }
      }
    }

    // Draw current piece
    if (this.currentPiece) {
      const piece = this.currentPiece;
      for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
          if (piece.shape[row][col]) {
            this._drawBlock(piece.x + col, piece.y + row, piece.color);
          }
        }
      }
    }

    // Draw game over overlay
    if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 20);

      this.ctx.font = '20px Arial';
      this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    }

    // Draw pause overlay
    if (this.isPaused && !this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Paused', this.canvas.width / 2, this.canvas.height / 2);
    }
  }

  _drawBlock(x, y, color) {
    const px = x * this.blockSize;
    const py = y * this.blockSize;

    // Main block
    this.ctx.fillStyle = color;
    this.ctx.fillRect(px + 1, py + 1, this.blockSize - 2, this.blockSize - 2);

    // Highlight
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.fillRect(px + 2, py + 2, this.blockSize - 4, this.blockSize / 3);

    // Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(px + 2, py + this.blockSize - this.blockSize / 3, this.blockSize - 4, this.blockSize / 3 - 2);
  }

  _drawNextPiece() {
    // Clear canvas
    this.nextCtx.fillStyle = '#000';
    this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

    if (this.nextPiece) {
      const piece = this.nextPiece;
      const offsetX = (this.nextCanvas.width - piece.shape[0].length * this.blockSize) / 2;
      const offsetY = (this.nextCanvas.height - piece.shape.length * this.blockSize) / 2;

      for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
          if (piece.shape[row][col]) {
            const px = offsetX + col * this.blockSize;
            const py = offsetY + row * this.blockSize;

            this.nextCtx.fillStyle = piece.color;
            this.nextCtx.fillRect(px + 1, py + 1, this.blockSize - 2, this.blockSize - 2);

            // Highlight
            this.nextCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.nextCtx.fillRect(px + 2, py + 2, this.blockSize - 4, this.blockSize / 3);
          }
        }
      }
    }
  }

  _togglePause() {
    if (this.gameOver) return;
    this.isPaused = !this.isPaused;
    this.pauseBtn.textContent = this.isPaused ? '▶️ Resume' : '⏸️ Pause';
    this._draw();
  }

  _endGame() {
    this.gameOver = true;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this._saveHighScore();
    }
    this._updateStats();
    this._draw();
  }

  _resetGame() {
    this._initBoard();
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.dropInterval = 1000;
    this.pauseBtn.textContent = '⏸️ Pause';
    this._spawnPiece();
    this._spawnNextPiece();
    this._updateStats();
    this._startGameLoop();
    this._draw();
  }

  _updateStats() {
    this.statsDiv.innerHTML = `
      <div style="margin-bottom: 10px;"><strong>Score</strong><br/>${this.score}</div>
      <div style="margin-bottom: 10px;"><strong>High Score</strong><br/>${this.highScore}</div>
      <div style="margin-bottom: 10px;"><strong>Level</strong><br/>${this.level}</div>
      <div><strong>Lines</strong><br/>${this.lines}</div>
    `;
  }

  async _saveHighScore() {
    try {
      await this.context.fs.writeFile(
        '/home/user/tetris-highscore.json',
        JSON.stringify({ highScore: this.highScore })
      );
    } catch (error) {
      console.error('Failed to save high score:', error);
    }
  }

  destroy() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
    }
  }
}
