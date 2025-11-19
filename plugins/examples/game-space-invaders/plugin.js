/**
 * Space Invaders Game Plugin
 * Classic arcade shooter
 */

class SpaceInvaders {
  constructor(api) {
    this.api = api;
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.gameLoop = null;
    this.score = 0;
    this.lives = 3;
    this.level = 1;

    this.player = { x: 0, y: 0, width: 40, height: 30, speed: 5 };
    this.bullets = [];
    this.enemies = [];
    this.enemyBullets = [];
    this.enemyDirection = 1;
    this.enemySpeed = 1;

    this.keys = {};
  }

  async activate() {
    this.createUI();
    this.startGame();
    this.api.ui.notify('Space Invaders activated! Use arrows and spacebar.');
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
      box-shadow: 0 0 40px rgba(0, 255, 0, 0.5);
      z-index: 10000;
    `;

    this.container.innerHTML = `
      <div style="text-align: center; margin-bottom: 10px; color: #0f0; font-family: monospace;">
        <div style="display: flex; justify-content: space-between; font-size: 18px;">
          <div>Score: <span id="score">0</span></div>
          <div>Level: <span id="level">1</span></div>
          <div>Lives: <span id="lives">❤❤❤</span></div>
        </div>
      </div>

      <canvas id="game-canvas" width="600" height="500" style="
        display: block;
        background: #000;
        border: 2px solid #0f0;
      "></canvas>

      <div style="text-align: center; margin-top: 10px;">
        <button id="close-game" style="
          padding: 8px 20px;
          background: #0f0;
          color: #000;
          border: none;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
        ">Close</button>
      </div>

      <div style="color: #0f0; text-align: center; margin-top: 10px; font-family: monospace; font-size: 12px;">
        ← → Move | SPACE Shoot
      </div>
    `;

    document.body.appendChild(this.container);

    this.canvas = this.container.querySelector('#game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.container.querySelector('#close-game').addEventListener('click', () => {
      this.container.style.display = 'none';
    });

    this.keyDownHandler = (e) => {
      this.keys[e.key] = true;
      if (e.key === ' ') {
        e.preventDefault();
        this.shoot();
      }
    };

    this.keyUpHandler = (e) => {
      this.keys[e.key] = false;
    };

    document.addEventListener('keydown', this.keyDownHandler);
    document.addEventListener('keyup', this.keyUpHandler);
  }

  startGame() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.setupLevel();
    this.gameLoop = requestAnimationFrame(() => this.update());
  }

  setupLevel() {
    this.player.x = this.canvas.width / 2 - this.player.width / 2;
    this.player.y = this.canvas.height - 50;
    this.bullets = [];
    this.enemyBullets = [];

    // Create enemy grid
    this.enemies = [];
    const rows = 4;
    const cols = 8;
    const enemyWidth = 30;
    const enemyHeight = 30;
    const spacing = 50;
    const offsetX = 80;
    const offsetY = 50;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.enemies.push({
          x: offsetX + c * spacing,
          y: offsetY + r * spacing,
          width: enemyWidth,
          height: enemyHeight,
          alive: true
        });
      }
    }

    this.enemySpeed = 1 + this.level * 0.2;
  }

  shoot() {
    if (this.bullets.filter(b => b.active).length < 3) {
      this.bullets.push({
        x: this.player.x + this.player.width / 2 - 2,
        y: this.player.y,
        width: 4,
        height: 10,
        speed: 7,
        active: true
      });
    }
  }

  update() {
    // Move player
    if (this.keys['ArrowLeft']) {
      this.player.x = Math.max(0, this.player.x - this.player.speed);
    }
    if (this.keys['ArrowRight']) {
      this.player.x = Math.min(this.canvas.width - this.player.width, this.player.x + this.player.speed);
    }

    // Move bullets
    this.bullets.forEach(bullet => {
      if (bullet.active) {
        bullet.y -= bullet.speed;
        if (bullet.y < 0) bullet.active = false;
      }
    });

    // Move enemies
    let hitEdge = false;
    this.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      enemy.x += this.enemyDirection * this.enemySpeed;
      if (enemy.x <= 0 || enemy.x >= this.canvas.width - enemy.width) {
        hitEdge = true;
      }
    });

    if (hitEdge) {
      this.enemyDirection *= -1;
      this.enemies.forEach(enemy => {
        if (enemy.alive) enemy.y += 20;
      });
    }

    // Enemy shooting
    if (Math.random() < 0.02) {
      const aliveEnemies = this.enemies.filter(e => e.alive);
      if (aliveEnemies.length > 0) {
        const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
        this.enemyBullets.push({
          x: shooter.x + shooter.width / 2,
          y: shooter.y + shooter.height,
          width: 4,
          height: 10,
          speed: 3,
          active: true
        });
      }
    }

    // Move enemy bullets
    this.enemyBullets.forEach(bullet => {
      if (bullet.active) {
        bullet.y += bullet.speed;
        if (bullet.y > this.canvas.height) bullet.active = false;
      }
    });

    // Collision detection
    this.bullets.forEach(bullet => {
      if (!bullet.active) return;
      this.enemies.forEach(enemy => {
        if (!enemy.alive) return;
        if (this.checkCollision(bullet, enemy)) {
          bullet.active = false;
          enemy.alive = false;
          this.score += 10;
        }
      });
    });

    // Check enemy bullet hits player
    this.enemyBullets.forEach(bullet => {
      if (bullet.active && this.checkCollision(bullet, this.player)) {
        bullet.active = false;
        this.lives--;
        if (this.lives <= 0) {
          this.gameOver();
          return;
        }
      }
    });

    // Check level complete
    if (this.enemies.every(e => !e.alive)) {
      this.level++;
      this.setupLevel();
    }

    // Check if enemies reached bottom
    if (this.enemies.some(e => e.alive && e.y + e.height >= this.player.y)) {
      this.gameOver();
      return;
    }

    this.render();
    this.updateStats();

    this.gameLoop = requestAnimationFrame(() => this.update());
  }

  checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw player
    this.ctx.fillStyle = '#0f0';
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    // Ship detail
    this.ctx.beginPath();
    this.ctx.moveTo(this.player.x + this.player.width / 2, this.player.y - 10);
    this.ctx.lineTo(this.player.x, this.player.y);
    this.ctx.lineTo(this.player.x + this.player.width, this.player.y);
    this.ctx.fill();

    // Draw bullets
    this.ctx.fillStyle = '#ff0';
    this.bullets.forEach(bullet => {
      if (bullet.active) {
        this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      }
    });

    // Draw enemy bullets
    this.ctx.fillStyle = '#f00';
    this.enemyBullets.forEach(bullet => {
      if (bullet.active) {
        this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      }
    });

    // Draw enemies
    this.enemies.forEach(enemy => {
      if (enemy.alive) {
        this.ctx.fillStyle = '#f0f';
        this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        // Eyes
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(enemy.x + 8, enemy.y + 8, 6, 6);
        this.ctx.fillRect(enemy.x + 16, enemy.y + 8, 6, 6);
      }
    });
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

    this.ctx.fillStyle = '#0f0';
    this.ctx.font = 'bold 48px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);

    this.ctx.font = '24px monospace';
    this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50);

    setTimeout(() => this.startGame(), 3000);
  }
}

module.exports = SpaceInvaders;
