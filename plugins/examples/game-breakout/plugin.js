/**
 * Breakout Game Plugin
 * Classic brick breaking game
 */

class BreakoutGame {
  constructor(api) {
    this.api = api;
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.gameLoop = null;

    this.paddle = { x: 350, y: 550, width: 100, height: 15, speed: 8 };
    this.ball = { x: 400, y: 300, radius: 8, dx: 4, dy: -4 };
    this.bricks = [];
    this.score = 0;
    this.level = 1;
    this.lives = 3;

    this.keys = {};
  }

  async activate() {
    this.createUI();
    this.setupLevel();
    this.gameLoop = requestAnimationFrame(() => this.update());
    this.api.ui.notify('Breakout activated! Use arrow keys or mouse.');
  }

  async deactivate() {
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
    }
    if (this.container) {
      this.container.remove();
    }
    document.removeEventListener('keydown', this.keyDownHandler);
    document.removeEventListener('keyup', this.keyUpHandler);
    this.canvas?.removeEventListener('mousemove', this.mouseMoveHandler);
  }

  createUI() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(to bottom, #1a1a2e, #16213e);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 0 40px rgba(0, 200, 255, 0.5);
      z-index: 10000;
    `;

    this.container.innerHTML = `
      <div style="text-align: center; margin-bottom: 10px; color: #0ff; font-family: monospace;">
        <div style="display: flex; justify-content: space-between; font-size: 18px;">
          <div>Score: <span id="score">0</span></div>
          <div>Level: <span id="level">1</span></div>
          <div>Lives: <span id="lives">❤❤❤</span></div>
        </div>
      </div>

      <canvas id="breakout-canvas" width="800" height="600" style="
        display: block;
        background: #0a0a0a;
        border: 2px solid #0ff;
        cursor: none;
      "></canvas>

      <div style="text-align: center; margin-top: 10px;">
        <button id="close-game" style="
          padding: 8px 20px;
          background: #0ff;
          color: #000;
          border: none;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
        ">Close</button>
      </div>
    `;

    document.body.appendChild(this.container);

    this.canvas = this.container.querySelector('#breakout-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.container.querySelector('#close-game').addEventListener('click', () => {
      this.container.style.display = 'none';
    });

    this.keyDownHandler = (e) => {
      this.keys[e.key] = true;
    };

    this.keyUpHandler = (e) => {
      this.keys[e.key] = false;
    };

    this.mouseMoveHandler = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.paddle.x = e.clientX - rect.left - this.paddle.width / 2;
      this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.width, this.paddle.x));
    };

    document.addEventListener('keydown', this.keyDownHandler);
    document.addEventListener('keyup', this.keyUpHandler);
    this.canvas.addEventListener('mousemove', this.mouseMoveHandler);
  }

  setupLevel() {
    this.bricks = [];
    const rows = 5 + this.level;
    const cols = 10;
    const brickWidth = 70;
    const brickHeight = 20;
    const padding = 5;
    const offsetX = 35;
    const offsetY = 40;

    const colors = ['#f00', '#f80', '#ff0', '#0f0', '#00f', '#80f', '#f0f'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.bricks.push({
          x: offsetX + c * (brickWidth + padding),
          y: offsetY + r * (brickHeight + padding),
          width: brickWidth,
          height: brickHeight,
          color: colors[r % colors.length],
          alive: true
        });
      }
    }
  }

  resetBall() {
    this.ball.x = this.paddle.x + this.paddle.width / 2;
    this.ball.y = this.paddle.y - 20;
    this.ball.dx = (Math.random() - 0.5) * 6;
    this.ball.dy = -4;
  }

  update() {
    // Move paddle
    if (this.keys['ArrowLeft']) {
      this.paddle.x = Math.max(0, this.paddle.x - this.paddle.speed);
    }
    if (this.keys['ArrowRight']) {
      this.paddle.x = Math.min(this.canvas.width - this.paddle.width, this.paddle.x + this.paddle.speed);
    }

    // Move ball
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    // Ball collision with walls
    if (this.ball.x - this.ball.radius <= 0 || this.ball.x + this.ball.radius >= this.canvas.width) {
      this.ball.dx *= -1;
    }

    if (this.ball.y - this.ball.radius <= 0) {
      this.ball.dy *= -1;
    }

    // Ball collision with paddle
    if (this.ball.y + this.ball.radius >= this.paddle.y &&
        this.ball.x >= this.paddle.x &&
        this.ball.x <= this.paddle.x + this.paddle.width) {
      this.ball.dy = -Math.abs(this.ball.dy);
      // Add spin based on where ball hits paddle
      const hitPos = (this.ball.x - this.paddle.x) / this.paddle.width;
      this.ball.dx = (hitPos - 0.5) * 8;
    }

    // Ball collision with bricks
    this.bricks.forEach(brick => {
      if (!brick.alive) return;

      if (this.ball.x + this.ball.radius >= brick.x &&
          this.ball.x - this.ball.radius <= brick.x + brick.width &&
          this.ball.y + this.ball.radius >= brick.y &&
          this.ball.y - this.ball.radius <= brick.y + brick.height) {
        brick.alive = false;
        this.ball.dy *= -1;
        this.score += 10;
      }
    });

    // Check level complete
    if (this.bricks.every(b => !b.alive)) {
      this.level++;
      this.setupLevel();
      this.resetBall();
    }

    // Ball fell off
    if (this.ball.y > this.canvas.height) {
      this.lives--;
      if (this.lives <= 0) {
        this.gameOver();
        return;
      }
      this.resetBall();
    }

    this.render();
    this.updateStats();

    this.gameLoop = requestAnimationFrame(() => this.update());
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw bricks
    this.bricks.forEach(brick => {
      if (brick.alive) {
        this.ctx.fillStyle = brick.color;
        this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
      }
    });

    // Draw paddle
    const gradient = this.ctx.createLinearGradient(0, this.paddle.y, 0, this.paddle.y + this.paddle.height);
    gradient.addColorStop(0, '#0ff');
    gradient.addColorStop(1, '#08f');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);

    // Draw ball
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Glow effect
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = '#fff';
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }

  updateStats() {
    this.container.querySelector('#score').textContent = this.score;
    this.container.querySelector('#level').textContent = this.level;
    this.container.querySelector('#lives').textContent = '❤'.repeat(this.lives);
  }

  gameOver() {
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
    }

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#0ff';
    this.ctx.font = 'bold 48px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);

    this.ctx.font = '24px monospace';
    this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50);

    setTimeout(() => {
      this.score = 0;
      this.level = 1;
      this.lives = 3;
      this.setupLevel();
      this.resetBall();
      this.gameLoop = requestAnimationFrame(() => this.update());
    }, 3000);
  }
}

module.exports = BreakoutGame;
