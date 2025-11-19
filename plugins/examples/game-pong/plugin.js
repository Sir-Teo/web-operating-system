/**
 * Pong Game Plugin
 * Classic paddle game
 */

class PongGame {
  constructor(api) {
    this.api = api;
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.gameLoop = null;

    this.ball = { x: 400, y: 300, radius: 8, dx: 4, dy: 4 };
    this.paddle1 = { x: 10, y: 250, width: 10, height: 100, dy: 0 };
    this.paddle2 = { x: 780, y: 250, width: 10, height: 100, dy: 0 };
    this.score = { player: 0, ai: 0 };

    this.keys = {};
  }

  async activate() {
    this.createUI();
    this.resetBall();
    this.gameLoop = requestAnimationFrame(() => this.update());
    this.api.ui.notify('Pong activated! Use W/S keys to play.');
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
  }

  createUI() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #000;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
      z-index: 10000;
    `;

    this.container.innerHTML = `
      <canvas id="pong-canvas" width="800" height="600" style="
        display: block;
        background: #000;
        border: 2px solid #fff;
      "></canvas>

      <div style="text-align: center; margin-top: 10px;">
        <button id="close-game" style="
          padding: 8px 20px;
          background: #fff;
          color: #000;
          border: none;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
        ">Close</button>
      </div>

      <div style="color: #fff; text-align: center; margin-top: 10px; font-family: monospace;">
        W/S to move paddle
      </div>
    `;

    document.body.appendChild(this.container);

    this.canvas = this.container.querySelector('#pong-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.container.querySelector('#close-game').addEventListener('click', () => {
      this.container.style.display = 'none';
    });

    this.keyDownHandler = (e) => {
      this.keys[e.key.toLowerCase()] = true;
    };

    this.keyUpHandler = (e) => {
      this.keys[e.key.toLowerCase()] = false;
    };

    document.addEventListener('keydown', this.keyDownHandler);
    document.addEventListener('keyup', this.keyUpHandler);
  }

  resetBall() {
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;
    this.ball.dx = (Math.random() > 0.5 ? 1 : -1) * 4;
    this.ball.dy = (Math.random() - 0.5) * 6;
  }

  update() {
    // Move player paddle
    if (this.keys['w']) {
      this.paddle1.y = Math.max(0, this.paddle1.y - 6);
    }
    if (this.keys['s']) {
      this.paddle1.y = Math.min(this.canvas.height - this.paddle1.height, this.paddle1.y + 6);
    }

    // AI paddle
    const aiSpeed = 4;
    const ballCenter = this.ball.y;
    const paddleCenter = this.paddle2.y + this.paddle2.height / 2;

    if (ballCenter < paddleCenter - 10) {
      this.paddle2.y = Math.max(0, this.paddle2.y - aiSpeed);
    } else if (ballCenter > paddleCenter + 10) {
      this.paddle2.y = Math.min(this.canvas.height - this.paddle2.height, this.paddle2.y + aiSpeed);
    }

    // Move ball
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    // Ball collision with top/bottom
    if (this.ball.y - this.ball.radius <= 0 || this.ball.y + this.ball.radius >= this.canvas.height) {
      this.ball.dy *= -1;
    }

    // Ball collision with paddles
    if (this.ball.x - this.ball.radius <= this.paddle1.x + this.paddle1.width &&
        this.ball.y >= this.paddle1.y &&
        this.ball.y <= this.paddle1.y + this.paddle1.height) {
      this.ball.dx = Math.abs(this.ball.dx);
      this.ball.dx *= 1.05; // Speed up slightly
    }

    if (this.ball.x + this.ball.radius >= this.paddle2.x &&
        this.ball.y >= this.paddle2.y &&
        this.ball.y <= this.paddle2.y + this.paddle2.height) {
      this.ball.dx = -Math.abs(this.ball.dx);
      this.ball.dx *= 1.05;
    }

    // Scoring
    if (this.ball.x < 0) {
      this.score.ai++;
      this.resetBall();
    }
    if (this.ball.x > this.canvas.width) {
      this.score.player++;
      this.resetBall();
    }

    this.render();
    this.gameLoop = requestAnimationFrame(() => this.update());
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw center line
    this.ctx.strokeStyle = '#fff';
    this.ctx.setLineDash([10, 10]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Draw paddles
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height);
    this.ctx.fillRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height);

    // Draw ball
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw scores
    this.ctx.font = 'bold 48px monospace';
    this.ctx.fillText(this.score.player, this.canvas.width / 4, 60);
    this.ctx.fillText(this.score.ai, 3 * this.canvas.width / 4, 60);
  }
}

module.exports = PongGame;
