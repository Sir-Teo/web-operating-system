export default class AirplaneShooter {
  constructor(context) {
    this.context = context;
    this.canvas = null;
    this.ctx = null;
    this.width = 600;
    this.height = 800;
    this.gameLoop = null;
    this.gameOver = false;
    this.score = 0;
    this.highScore = 0;
    this.lives = 3;

    // Player
    this.player = {
      x: 275,
      y: 700,
      width: 50,
      height: 50,
      speed: 8,
      color: '#00ff00'
    };

    // Input
    this.keys = {};

    // Bullets
    this.bullets = [];
    this.bulletSpeed = 10;
    this.bulletCooldown = 0;
    this.bulletCooldownMax = 10;

    // Enemies
    this.enemies = [];
    this.enemySpawnTimer = 0;
    this.enemySpawnRate = 60;

    // Enemy bullets
    this.enemyBullets = [];

    // Explosions
    this.explosions = [];

    // Difficulty
    this.difficulty = 1;
    this.difficultyTimer = 0;
  }

  async init() {
    // Load high score
    try {
      const data = await this.context.fs.readFile('/home/user/airplane-shooter-highscore.json');
      const parsed = JSON.parse(data);
      this.highScore = parsed.highScore || 0;
    } catch (error) {
      // No saved high score
    }
  }

  render() {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;

    // Title
    const title = document.createElement('h1');
    title.textContent = '✈️ Sky Defender';
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
      background: black;
      padding: 10px;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;

    // Game canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.cssText = `
      display: block;
      background: linear-gradient(180deg, #000033 0%, #000055 100%);
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
      <div>Arrow Keys: Move | Space: Shoot</div>
    `;
    container.appendChild(instructions);

    // Keyboard controls
    this.keydownHandler = (e) => {
      this.keys[e.key] = true;
      if (e.key === ' ') {
        e.preventDefault();
      }
    };
    this.keyupHandler = (e) => {
      this.keys[e.key] = false;
    };

    document.addEventListener('keydown', this.keydownHandler);
    document.addEventListener('keyup', this.keyupHandler);

    // Start game loop
    this._startGameLoop();

    return container;
  }

  _startGameLoop() {
    const gameStep = () => {
      if (!this.gameOver) {
        this._update();
        this._draw();
      }
      this.gameLoop = requestAnimationFrame(gameStep);
    };
    gameStep();
  }

  _update() {
    // Update player
    if (this.keys['ArrowLeft'] && this.player.x > 0) {
      this.player.x -= this.player.speed;
    }
    if (this.keys['ArrowRight'] && this.player.x < this.width - this.player.width) {
      this.player.x += this.player.speed;
    }
    if (this.keys['ArrowUp'] && this.player.y > this.height / 2) {
      this.player.y -= this.player.speed;
    }
    if (this.keys['ArrowDown'] && this.player.y < this.height - this.player.height) {
      this.player.y += this.player.speed;
    }

    // Shooting
    if (this.keys[' '] && this.bulletCooldown === 0) {
      this.bullets.push({
        x: this.player.x + this.player.width / 2 - 2,
        y: this.player.y,
        width: 4,
        height: 15,
        speed: this.bulletSpeed
      });
      this.bulletCooldown = this.bulletCooldownMax;
    }

    if (this.bulletCooldown > 0) {
      this.bulletCooldown--;
    }

    // Update bullets
    this.bullets = this.bullets.filter(bullet => {
      bullet.y -= bullet.speed;
      return bullet.y > -bullet.height;
    });

    // Spawn enemies
    this.enemySpawnTimer++;
    if (this.enemySpawnTimer > this.enemySpawnRate) {
      this.enemySpawnTimer = 0;
      const enemyType = Math.random();

      if (enemyType < 0.7) {
        // Regular enemy
        this.enemies.push({
          x: Math.random() * (this.width - 40),
          y: -40,
          width: 40,
          height: 40,
          speed: 2 + this.difficulty * 0.5,
          color: '#ff0000',
          health: 1,
          shootTimer: Math.floor(Math.random() * 120) + 60,
          type: 'regular'
        });
      } else {
        // Tough enemy
        this.enemies.push({
          x: Math.random() * (this.width - 50),
          y: -50,
          width: 50,
          height: 50,
          speed: 1 + this.difficulty * 0.3,
          color: '#ff00ff',
          health: 3,
          shootTimer: Math.floor(Math.random() * 90) + 45,
          type: 'tough'
        });
      }
    }

    // Update enemies
    this.enemies = this.enemies.filter(enemy => {
      enemy.y += enemy.speed;

      // Enemy shooting
      enemy.shootTimer--;
      if (enemy.shootTimer <= 0) {
        this.enemyBullets.push({
          x: enemy.x + enemy.width / 2 - 3,
          y: enemy.y + enemy.height,
          width: 6,
          height: 12,
          speed: 5
        });
        enemy.shootTimer = Math.floor(Math.random() * 120) + 60;
      }

      // Remove if off screen
      if (enemy.y > this.height) {
        this.lives--;
        if (this.lives <= 0) {
          this._endGame();
        }
        this._updateScore();
        return false;
      }

      return true;
    });

    // Update enemy bullets
    this.enemyBullets = this.enemyBullets.filter(bullet => {
      bullet.y += bullet.speed;
      return bullet.y < this.height;
    });

    // Collision detection - bullets vs enemies
    this.bullets.forEach((bullet, bulletIndex) => {
      this.enemies.forEach((enemy, enemyIndex) => {
        if (this._checkCollision(bullet, enemy)) {
          this.bullets.splice(bulletIndex, 1);
          enemy.health--;

          if (enemy.health <= 0) {
            this.score += enemy.type === 'tough' ? 50 : 10;
            this._createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            this.enemies.splice(enemyIndex, 1);
            this._updateScore();
          }
        }
      });
    });

    // Collision detection - enemy bullets vs player
    this.enemyBullets.forEach((bullet, index) => {
      if (this._checkCollision(bullet, this.player)) {
        this.enemyBullets.splice(index, 1);
        this.lives--;
        this._createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
        if (this.lives <= 0) {
          this._endGame();
        }
        this._updateScore();
      }
    });

    // Collision detection - enemies vs player
    this.enemies.forEach((enemy, index) => {
      if (this._checkCollision(enemy, this.player)) {
        this.enemies.splice(index, 1);
        this.lives--;
        this._createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
        if (this.lives <= 0) {
          this._endGame();
        }
        this._updateScore();
      }
    });

    // Update explosions
    this.explosions = this.explosions.filter(explosion => {
      explosion.life--;
      explosion.radius += 1;
      return explosion.life > 0;
    });

    // Increase difficulty
    this.difficultyTimer++;
    if (this.difficultyTimer > 600) {
      this.difficultyTimer = 0;
      this.difficulty += 0.5;
      this.enemySpawnRate = Math.max(30, this.enemySpawnRate - 5);
    }
  }

  _checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  _createExplosion(x, y) {
    this.explosions.push({
      x: x,
      y: y,
      radius: 5,
      life: 20,
      color: '#ff9900'
    });
  }

  _draw() {
    // Clear canvas
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#000033');
    gradient.addColorStop(1, '#000055');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw stars
    for (let i = 0; i < 50; i++) {
      const x = (i * 137) % this.width;
      const y = (i * 211 + Date.now() * 0.05) % this.height;
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.fillRect(x, y, 2, 2);
    }

    // Draw player
    this._drawPlane(this.player.x, this.player.y, this.player.width, this.player.height, this.player.color);

    // Draw bullets
    this.ctx.fillStyle = '#ffff00';
    this.bullets.forEach(bullet => {
      this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

      // Bullet trail
      this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
      this.ctx.fillRect(bullet.x, bullet.y + bullet.height, bullet.width, 10);
      this.ctx.fillStyle = '#ffff00';
    });

    // Draw enemies
    this.enemies.forEach(enemy => {
      this._drawEnemyPlane(enemy.x, enemy.y, enemy.width, enemy.height, enemy.color);

      // Health bar for tough enemies
      if (enemy.type === 'tough') {
        const healthWidth = (enemy.health / 3) * enemy.width;
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(enemy.x, enemy.y - 8, healthWidth, 4);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.strokeRect(enemy.x, enemy.y - 8, enemy.width, 4);
      }
    });

    // Draw enemy bullets
    this.ctx.fillStyle = '#ff0000';
    this.enemyBullets.forEach(bullet => {
      this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw explosions
    this.explosions.forEach(explosion => {
      const alpha = explosion.life / 20;
      this.ctx.fillStyle = `rgba(255, 153, 0, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.5})`;
      this.ctx.beginPath();
      this.ctx.arc(explosion.x, explosion.y, explosion.radius * 0.5, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Draw game over overlay
    if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.width, this.height);

      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 40px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Game Over!', this.width / 2, this.height / 2 - 40);

      this.ctx.font = '24px Arial';
      this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 10);
      this.ctx.fillText(`High Score: ${this.highScore}`, this.width / 2, this.height / 2 + 50);
    }
  }

  _drawPlane(x, y, width, height, color) {
    this.ctx.fillStyle = color;

    // Fuselage
    this.ctx.fillRect(x + width * 0.4, y, width * 0.2, height * 0.7);

    // Wings
    this.ctx.fillRect(x, y + height * 0.3, width, height * 0.15);

    // Tail
    this.ctx.fillRect(x + width * 0.3, y + height * 0.6, width * 0.4, height * 0.15);

    // Cockpit
    this.ctx.fillStyle = '#00ffff';
    this.ctx.fillRect(x + width * 0.42, y + height * 0.1, width * 0.16, height * 0.15);
  }

  _drawEnemyPlane(x, y, width, height, color) {
    this.ctx.fillStyle = color;

    // Fuselage
    this.ctx.fillRect(x + width * 0.4, y + height * 0.3, width * 0.2, height * 0.7);

    // Wings
    this.ctx.fillRect(x, y + height * 0.5, width, height * 0.15);

    // Tail
    this.ctx.fillRect(x + width * 0.3, y + height * 0.25, width * 0.4, height * 0.15);

    // Cockpit
    this.ctx.fillStyle = '#ffff00';
    this.ctx.fillRect(x + width * 0.42, y + height * 0.75, width * 0.16, height * 0.15);
  }

  _updateScore() {
    this.scoreDiv.innerHTML = `
      <div><strong>Score:</strong> ${this.score}</div>
      <div><strong>High Score:</strong> ${this.highScore}</div>
      <div><strong>Lives:</strong> ${'❤️'.repeat(this.lives)}</div>
    `;
  }

  _endGame() {
    this.gameOver = true;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this._saveHighScore();
    }
    this._updateScore();
  }

  _resetGame() {
    this.gameOver = false;
    this.score = 0;
    this.lives = 3;
    this.difficulty = 1;
    this.difficultyTimer = 0;
    this.enemySpawnRate = 60;
    this.player.x = 275;
    this.player.y = 700;
    this.bullets = [];
    this.enemies = [];
    this.enemyBullets = [];
    this.explosions = [];
    this.bulletCooldown = 0;
    this.enemySpawnTimer = 0;
    this._updateScore();
  }

  async _saveHighScore() {
    try {
      await this.context.fs.writeFile(
        '/home/user/airplane-shooter-highscore.json',
        JSON.stringify({ highScore: this.highScore })
      );
    } catch (error) {
      console.error('Failed to save high score:', error);
    }
  }

  destroy() {
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
    }
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
    }
    if (this.keyupHandler) {
      document.removeEventListener('keyup', this.keyupHandler);
    }
  }
}
