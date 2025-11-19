/**
 * Flappy Bird Game Plugin
 * Side-scrolling arcade game
 */

class FlappyGame {
  constructor(api) {
    this.api = api;
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.gameLoop = null;

    this.bird = { x: 100, y: 250, radius: 15, velocity: 0, gravity: 0.5, jump: -8 };
    this.pipes = [];
    this.score = 0;
    this.bestScore = 0;
    this.gameOver = false;
    this.pipeGap = 150;
    this.pipeWidth = 60;
    this.pipeSpeed = 3;
  }

  async activate() {
    const saved = await this.api.storage.get('flappy-best');
    if (saved) this.bestScore = parseInt(saved);

    this.createUI();
    this.reset();
    this.gameLoop = requestAnimationFrame(() => this.update());
    this.api.ui.notify('Flappy Bird activated! Click or press Space to fly.');
  }

  async deactivate() {
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
    }
    if (this.container) {
      this.container.remove();
    }
    document.removeEventListener('keydown', this.keyHandler);
    this.canvas?.removeEventListener('click', this.clickHandler);
  }

  createUI() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(to bottom, #4ec0ca, #1c92d2);
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      z-index: 10000;
    `;

    this.container.innerHTML = `
      <canvas id="flappy-canvas" width="400" height="600" style="
        display: block;
        background: linear-gradient(to bottom, #87CEEB 0%, #87CEEB 70%, #F0E68C 70%, #F0E68C 100%);
        border: 3px solid #fff;
        cursor: pointer;
      "></canvas>

      <div style="text-align: center; margin-top: 10px;">
        <button id="close-game" style="
          padding: 8px 20px;
          background: #fff;
          color: #1c92d2;
          border: none;
          border-radius: 20px;
          font-weight: bold;
          cursor: pointer;
        ">Close</button>
      </div>
    `;

    document.body.appendChild(this.container);

    this.canvas = this.container.querySelector('#flappy-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.container.querySelector('#close-game').addEventListener('click', () => {
      this.container.style.display = 'none';
    });

    this.keyHandler = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.flap();
      }
    };

    this.clickHandler = () => {
      this.flap();
    };

    document.addEventListener('keydown', this.keyHandler);
    this.canvas.addEventListener('click', this.clickHandler);
  }

  reset() {
    this.bird.y = 250;
    this.bird.velocity = 0;
    this.pipes = [];
    this.score = 0;
    this.gameOver = false;
    this.addPipe();
  }

  flap() {
    if (this.gameOver) {
      this.reset();
      return;
    }
    this.bird.velocity = this.bird.jump;
  }

  addPipe() {
    const minHeight = 100;
    const maxHeight = this.canvas.height - this.pipeGap - minHeight - 100; // 100 is ground height
    const height = Math.random() * (maxHeight - minHeight) + minHeight;

    this.pipes.push({
      x: this.canvas.width,
      topHeight: height,
      bottomY: height + this.pipeGap,
      scored: false
    });
  }

  update() {
    if (!this.gameOver) {
      // Apply gravity
      this.bird.velocity += this.bird.gravity;
      this.bird.y += this.bird.velocity;

      // Ground collision
      if (this.bird.y + this.bird.radius > this.canvas.height - 100) {
        this.gameOver = true;
      }

      // Ceiling collision
      if (this.bird.y - this.bird.radius < 0) {
        this.bird.y = this.bird.radius;
        this.bird.velocity = 0;
      }

      // Update pipes
      this.pipes.forEach(pipe => {
        pipe.x -= this.pipeSpeed;

        // Collision detection
        if (pipe.x < this.bird.x + this.bird.radius &&
            pipe.x + this.pipeWidth > this.bird.x - this.bird.radius) {
          if (this.bird.y - this.bird.radius < pipe.topHeight ||
              this.bird.y + this.bird.radius > pipe.bottomY) {
            this.gameOver = true;
          }
        }

        // Score
        if (!pipe.scored && pipe.x + this.pipeWidth < this.bird.x) {
          pipe.scored = true;
          this.score++;

          if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.api.storage.set('flappy-best', this.bestScore.toString());
          }
        }
      });

      // Remove off-screen pipes
      this.pipes = this.pipes.filter(pipe => pipe.x > -this.pipeWidth);

      // Add new pipes
      if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < this.canvas.width - 250) {
        this.addPipe();
      }
    }

    this.render();

    this.gameLoop = requestAnimationFrame(() => this.update());
  }

  render() {
    // Clear canvas
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.7, '#87CEEB');
    gradient.addColorStop(0.7, '#F0E68C');
    gradient.addColorStop(1, '#F0E68C');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw pipes
    this.pipes.forEach(pipe => {
      this.ctx.fillStyle = '#2ecc71';

      // Top pipe
      this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
      this.ctx.strokeStyle = '#27ae60';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);

      // Pipe cap
      this.ctx.fillRect(pipe.x - 5, pipe.topHeight - 30, this.pipeWidth + 10, 30);
      this.ctx.strokeRect(pipe.x - 5, pipe.topHeight - 30, this.pipeWidth + 10, 30);

      // Bottom pipe
      this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, this.canvas.height - pipe.bottomY);
      this.ctx.strokeRect(pipe.x, pipe.bottomY, this.pipeWidth, this.canvas.height - pipe.bottomY);

      // Pipe cap
      this.ctx.fillRect(pipe.x - 5, pipe.bottomY, this.pipeWidth + 10, 30);
      this.ctx.strokeRect(pipe.x - 5, pipe.bottomY, this.pipeWidth + 10, 30);
    });

    // Draw bird
    this.ctx.fillStyle = '#f39c12';
    this.ctx.beginPath();
    this.ctx.arc(this.bird.x, this.bird.y, this.bird.radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Bird eye
    this.ctx.fillStyle = 'white';
    this.ctx.beginPath();
    this.ctx.arc(this.bird.x + 5, this.bird.y - 3, 4, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = 'black';
    this.ctx.beginPath();
    this.ctx.arc(this.bird.x + 6, this.bird.y - 3, 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Bird beak
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.beginPath();
    this.ctx.moveTo(this.bird.x + this.bird.radius, this.bird.y);
    this.ctx.lineTo(this.bird.x + this.bird.radius + 8, this.bird.y - 3);
    this.ctx.lineTo(this.bird.x + this.bird.radius + 8, this.bird.y + 3);
    this.ctx.fill();

    // Draw ground
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);
    this.ctx.strokeStyle = '#654321';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(0, this.canvas.height - 100, this.canvas.width, 3);

    // Draw score
    this.ctx.fillStyle = 'white';
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 3;
    this.ctx.font = 'bold 40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.strokeText(this.score.toString(), this.canvas.width / 2, 60);
    this.ctx.fillText(this.score.toString(), this.canvas.width / 2, 60);

    // Draw best score
    this.ctx.font = 'bold 20px Arial';
    this.ctx.strokeText(`Best: ${this.bestScore}`, this.canvas.width / 2, 90);
    this.ctx.fillText(`Best: ${this.bestScore}`, this.canvas.width / 2, 90);

    // Game over
    if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = 'white';
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 4;
      this.ctx.font = 'bold 50px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.strokeText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);

      this.ctx.font = 'bold 20px Arial';
      this.ctx.strokeText('Click to restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
      this.ctx.fillText('Click to restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
  }
}

module.exports = FlappyGame;
