/**
 * Snake Game Plugin
 * Classic snake game
 */

class SnakeGame {
  constructor(api) {
    this.api = api;
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.gameLoop = null;

    this.gridSize = 20;
    this.tileCount = 25;
    this.snake = [];
    this.direction = 'right';
    this.nextDirection = 'right';
    this.food = null;
    this.score = 0;
    this.bestScore = 0;
    this.gameOver = false;
    this.speed = 100;
  }

  async activate() {
    const saved = await this.api.storage.get('snake-best');
    if (saved) this.bestScore = parseInt(saved);

    this.createUI();
    this.reset();
    this.startGameLoop();
    this.api.ui.notify('Snake activated! Use arrow keys to play.');
  }

  async deactivate() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
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
      background: #2d3436;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      z-index: 10000;
    `;

    this.container.innerHTML = `
      <div style="text-align: center; margin-bottom: 15px; color: white; font-family: Arial, sans-serif;">
        <h1 style="margin: 0; font-size: 32px;">🐍 Snake</h1>
        <div style="display: flex; justify-content: space-around; margin-top: 10px; font-size: 18px;">
          <div>Score: <span id="score" style="font-weight: bold; color: #00b894;">0</span></div>
          <div>Best: <span id="best" style="font-weight: bold; color: #fdcb6e;">0</span></div>
        </div>
      </div>

      <canvas id="snake-canvas" width="500" height="500" style="
        display: block;
        background: #000;
        border: 3px solid #00b894;
        border-radius: 4px;
      "></canvas>

      <div style="text-align: center; margin-top: 15px;">
        <button id="close-game" style="
          padding: 10px 25px;
          background: #00b894;
          color: white;
          border: none;
          border-radius: 20px;
          font-weight: bold;
          cursor: pointer;
        ">Close</button>
      </div>

      <div style="color: white; text-align: center; margin-top: 10px; font-size: 14px; font-family: monospace;">
        Use Arrow Keys to Move
      </div>
    `;

    document.body.appendChild(this.container);

    this.canvas = this.container.querySelector('#snake-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.container.querySelector('#close-game').addEventListener('click', () => {
      this.container.style.display = 'none';
    });

    this.keyHandler = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        this.handleKeyPress(e.key);
      }
    };

    document.addEventListener('keydown', this.keyHandler);

    this.updateScore();
  }

  reset() {
    this.snake = [
      { x: 12, y: 12 },
      { x: 11, y: 12 },
      { x: 10, y: 12 }
    ];
    this.direction = 'right';
    this.nextDirection = 'right';
    this.score = 0;
    this.gameOver = false;
    this.spawnFood();
    this.updateScore();
  }

  handleKeyPress(key) {
    const opposites = {
      'ArrowUp': 'down',
      'ArrowDown': 'up',
      'ArrowLeft': 'right',
      'ArrowRight': 'left'
    };

    const newDirection = key.replace('Arrow', '').toLowerCase();

    if (this.direction !== opposites[key]) {
      this.nextDirection = newDirection;
    }
  }

  startGameLoop() {
    this.gameLoop = setInterval(() => {
      if (this.gameOver) {
        this.renderGameOver();
        return;
      }

      this.update();
      this.render();
    }, this.speed);
  }

  update() {
    this.direction = this.nextDirection;

    const head = { ...this.snake[0] };

    switch (this.direction) {
      case 'up':
        head.y--;
        break;
      case 'down':
        head.y++;
        break;
      case 'left':
        head.x--;
        break;
      case 'right':
        head.x++;
        break;
    }

    // Wall collision
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      this.gameOver = true;
      return;
    }

    // Self collision
    if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.gameOver = true;
      return;
    }

    this.snake.unshift(head);

    // Food collision
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.updateScore();
      this.spawnFood();

      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        this.api.storage.set('snake-best', this.bestScore.toString());
      }
    } else {
      this.snake.pop();
    }
  }

  spawnFood() {
    do {
      this.food = {
        x: Math.floor(Math.random() * this.tileCount),
        y: Math.floor(Math.random() * this.tileCount)
      };
    } while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y));
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    this.ctx.strokeStyle = '#111';
    this.ctx.lineWidth = 1;

    for (let i = 0; i <= this.tileCount; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * this.gridSize, 0);
      this.ctx.lineTo(i * this.gridSize, this.canvas.height);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(0, i * this.gridSize);
      this.ctx.lineTo(this.canvas.width, i * this.gridSize);
      this.ctx.stroke();
    }

    // Draw snake
    this.snake.forEach((segment, index) => {
      const gradient = this.ctx.createLinearGradient(
        segment.x * this.gridSize,
        segment.y * this.gridSize,
        (segment.x + 1) * this.gridSize,
        (segment.y + 1) * this.gridSize
      );

      if (index === 0) {
        // Head
        gradient.addColorStop(0, '#00b894');
        gradient.addColorStop(1, '#00d2a0');
      } else {
        gradient.addColorStop(0, '#55efc4');
        gradient.addColorStop(1, '#00b894');
      }

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(
        segment.x * this.gridSize + 1,
        segment.y * this.gridSize + 1,
        this.gridSize - 2,
        this.gridSize - 2
      );

      // Snake eyes (on head)
      if (index === 0) {
        this.ctx.fillStyle = '#000';
        const eyeSize = 3;

        if (this.direction === 'right') {
          this.ctx.fillRect(segment.x * this.gridSize + 14, segment.y * this.gridSize + 5, eyeSize, eyeSize);
          this.ctx.fillRect(segment.x * this.gridSize + 14, segment.y * this.gridSize + 12, eyeSize, eyeSize);
        } else if (this.direction === 'left') {
          this.ctx.fillRect(segment.x * this.gridSize + 3, segment.y * this.gridSize + 5, eyeSize, eyeSize);
          this.ctx.fillRect(segment.x * this.gridSize + 3, segment.y * this.gridSize + 12, eyeSize, eyeSize);
        } else if (this.direction === 'up') {
          this.ctx.fillRect(segment.x * this.gridSize + 5, segment.y * this.gridSize + 3, eyeSize, eyeSize);
          this.ctx.fillRect(segment.x * this.gridSize + 12, segment.y * this.gridSize + 3, eyeSize, eyeSize);
        } else if (this.direction === 'down') {
          this.ctx.fillRect(segment.x * this.gridSize + 5, segment.y * this.gridSize + 14, eyeSize, eyeSize);
          this.ctx.fillRect(segment.x * this.gridSize + 12, segment.y * this.gridSize + 14, eyeSize, eyeSize);
        }
      }
    });

    // Draw food
    this.ctx.fillStyle = '#ff6b6b';
    this.ctx.beginPath();
    this.ctx.arc(
      this.food.x * this.gridSize + this.gridSize / 2,
      this.food.y * this.gridSize + this.gridSize / 2,
      this.gridSize / 2 - 2,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // Food highlight
    this.ctx.fillStyle = '#ff9999';
    this.ctx.beginPath();
    this.ctx.arc(
      this.food.x * this.gridSize + this.gridSize / 2 - 3,
      this.food.y * this.gridSize + this.gridSize / 2 - 3,
      3,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
  }

  renderGameOver() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#ff6b6b';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);

    this.ctx.fillStyle = 'white';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 30);

    this.ctx.font = '18px Arial';
    this.ctx.fillText('Press R to restart', this.canvas.width / 2, this.canvas.height / 2 + 70);

    // Add restart handler
    if (!this.restartHandler) {
      this.restartHandler = (e) => {
        if (e.key === 'r' || e.key === 'R') {
          this.reset();
        }
      };
      document.addEventListener('keydown', this.restartHandler);
    }
  }

  updateScore() {
    this.container.querySelector('#score').textContent = this.score;
    this.container.querySelector('#best').textContent = this.bestScore;
  }
}

module.exports = SnakeGame;
