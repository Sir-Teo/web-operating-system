export default class Snake {
  constructor(context) {
    this.context = context;
    this.gridSize = 20;
    this.cellSize = 20;
    this.snake = [{ x: 10, y: 10 }];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.food = null;
    this.score = 0;
    this.highScore = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.gameLoop = null;
    this.speed = 150;
    this.canvas = null;
    this.ctx = null;
  }

  async init() {
    // Load high score
    try {
      const data = await this.context.fs.readFile('/home/user/snake-highscore.json');
      const parsed = JSON.parse(data);
      this.highScore = parsed.highScore || 0;
    } catch (error) {
      // No saved high score
    }

    this._spawnFood();
  }

  render() {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;

    // Title
    const title = document.createElement('h1');
    title.textContent = '🐍 Snake Game';
    title.style.cssText = `
      color: white;
      margin: 0 0 15px 0;
      font-size: 32px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    `;
    container.appendChild(title);

    // Score display
    this.scoreDiv = document.createElement('div');
    this.scoreDiv.style.cssText = `
      color: white;
      font-size: 20px;
      margin-bottom: 15px;
      display: flex;
      gap: 30px;
    `;
    this._updateScore();
    container.appendChild(this.scoreDiv);

    // Canvas wrapper
    const canvasWrapper = document.createElement('div');
    canvasWrapper.style.cssText = `
      background: white;
      padding: 10px;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;

    // Game canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.gridSize * this.cellSize;
    this.canvas.height = this.gridSize * this.cellSize;
    this.canvas.style.cssText = `
      display: block;
      background: #000;
      border-radius: 5px;
    `;
    this.ctx = this.canvas.getContext('2d');
    canvasWrapper.appendChild(this.canvas);
    container.appendChild(canvasWrapper);

    // Controls
    const controls = document.createElement('div');
    controls.style.cssText = `
      margin-top: 15px;
      display: flex;
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
      box-shadow: 0 4px 6px rgba(0,0,0,0.2);
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
      box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    `;
    newGameBtn.addEventListener('click', () => this._resetGame());
    controls.appendChild(newGameBtn);

    container.appendChild(controls);

    // Instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = `
      margin-top: 15px;
      color: rgba(255,255,255,0.8);
      font-size: 14px;
      text-align: center;
    `;
    instructions.innerHTML = `
      <div>Use Arrow Keys or WASD to move</div>
      <div>Press Space to pause/resume</div>
    `;
    container.appendChild(instructions);

    // Keyboard controls
    this.keydownHandler = (e) => {
      if (this.gameOver) return;

      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          if (this.direction.y === 0) this.nextDirection = { x: 0, y: -1 };
          e.preventDefault();
          break;
        case 'arrowdown':
        case 's':
          if (this.direction.y === 0) this.nextDirection = { x: 0, y: 1 };
          e.preventDefault();
          break;
        case 'arrowleft':
        case 'a':
          if (this.direction.x === 0) this.nextDirection = { x: -1, y: 0 };
          e.preventDefault();
          break;
        case 'arrowright':
        case 'd':
          if (this.direction.x === 0) this.nextDirection = { x: 1, y: 0 };
          e.preventDefault();
          break;
        case ' ':
          this._togglePause();
          e.preventDefault();
          break;
      }
    };
    document.addEventListener('keydown', this.keydownHandler);

    // Start game loop
    this._draw();
    this._startGameLoop();

    return container;
  }

  _startGameLoop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
    this.gameLoop = setInterval(() => {
      if (!this.isPaused && !this.gameOver) {
        this._update();
        this._draw();
      }
    }, this.speed);
  }

  _update() {
    this.direction = this.nextDirection;

    const head = { ...this.snake[0] };
    head.x += this.direction.x;
    head.y += this.direction.y;

    // Check wall collision
    if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
      this._endGame();
      return;
    }

    // Check self collision
    if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this._endGame();
      return;
    }

    this.snake.unshift(head);

    // Check food collision
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this._updateScore();
      this._spawnFood();

      // Increase speed slightly
      if (this.speed > 50) {
        this.speed -= 2;
        this._startGameLoop();
      }
    } else {
      this.snake.pop();
    }
  }

  _draw() {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    this.ctx.strokeStyle = '#111';
    for (let i = 0; i <= this.gridSize; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * this.cellSize, 0);
      this.ctx.lineTo(i * this.cellSize, this.canvas.height);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * this.cellSize);
      this.ctx.lineTo(this.canvas.width, i * this.cellSize);
      this.ctx.stroke();
    }

    // Draw snake
    this.snake.forEach((segment, index) => {
      const gradient = this.ctx.createLinearGradient(
        segment.x * this.cellSize,
        segment.y * this.cellSize,
        (segment.x + 1) * this.cellSize,
        (segment.y + 1) * this.cellSize
      );

      if (index === 0) {
        gradient.addColorStop(0, '#00ff00');
        gradient.addColorStop(1, '#00cc00');
      } else {
        gradient.addColorStop(0, '#00cc00');
        gradient.addColorStop(1, '#009900');
      }

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(
        segment.x * this.cellSize + 1,
        segment.y * this.cellSize + 1,
        this.cellSize - 2,
        this.cellSize - 2
      );

      // Draw eyes on head
      if (index === 0) {
        this.ctx.fillStyle = '#fff';
        const eyeSize = 3;
        const eyeOffset = 6;

        if (this.direction.x === 1) { // Right
          this.ctx.fillRect(segment.x * this.cellSize + eyeOffset + 5, segment.y * this.cellSize + 5, eyeSize, eyeSize);
          this.ctx.fillRect(segment.x * this.cellSize + eyeOffset + 5, segment.y * this.cellSize + 12, eyeSize, eyeSize);
        } else if (this.direction.x === -1) { // Left
          this.ctx.fillRect(segment.x * this.cellSize + 5, segment.y * this.cellSize + 5, eyeSize, eyeSize);
          this.ctx.fillRect(segment.x * this.cellSize + 5, segment.y * this.cellSize + 12, eyeSize, eyeSize);
        } else if (this.direction.y === -1) { // Up
          this.ctx.fillRect(segment.x * this.cellSize + 5, segment.y * this.cellSize + 5, eyeSize, eyeSize);
          this.ctx.fillRect(segment.x * this.cellSize + 12, segment.y * this.cellSize + 5, eyeSize, eyeSize);
        } else { // Down
          this.ctx.fillRect(segment.x * this.cellSize + 5, segment.y * this.cellSize + 12, eyeSize, eyeSize);
          this.ctx.fillRect(segment.x * this.cellSize + 12, segment.y * this.cellSize + 12, eyeSize, eyeSize);
        }
      }
    });

    // Draw food
    if (this.food) {
      const gradient = this.ctx.createRadialGradient(
        this.food.x * this.cellSize + this.cellSize / 2,
        this.food.y * this.cellSize + this.cellSize / 2,
        0,
        this.food.x * this.cellSize + this.cellSize / 2,
        this.food.y * this.cellSize + this.cellSize / 2,
        this.cellSize / 2
      );
      gradient.addColorStop(0, '#ff0000');
      gradient.addColorStop(1, '#cc0000');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(
        this.food.x * this.cellSize + this.cellSize / 2,
        this.food.y * this.cellSize + this.cellSize / 2,
        this.cellSize / 2 - 2,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
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

  _spawnFood() {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * this.gridSize),
        y: Math.floor(Math.random() * this.gridSize)
      };
    } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));

    this.food = newFood;
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
    this._updateScore();
    this._draw();
  }

  _resetGame() {
    this.snake = [{ x: 10, y: 10 }];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.score = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.speed = 150;
    this.pauseBtn.textContent = '⏸️ Pause';
    this._spawnFood();
    this._updateScore();
    this._startGameLoop();
    this._draw();
  }

  _updateScore() {
    this.scoreDiv.innerHTML = `
      <div><strong>Score:</strong> ${this.score}</div>
      <div><strong>High Score:</strong> ${this.highScore}</div>
      <div><strong>Length:</strong> ${this.snake.length}</div>
    `;
  }

  async _saveHighScore() {
    try {
      await this.context.fs.writeFile(
        '/home/user/snake-highscore.json',
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
