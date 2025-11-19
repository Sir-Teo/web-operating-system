export default class Racing {
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
    this.distance = 0;

    // Player car
    this.player = {
      x: 250,
      y: 650,
      width: 50,
      height: 80,
      speed: 0,
      maxSpeed: 10,
      lane: 1, // 0 = left, 1 = middle, 2 = right
      color: '#00ff00'
    };

    // Road
    this.roadWidth = 400;
    this.roadX = (this.width - this.roadWidth) / 2;
    this.laneWidth = this.roadWidth / 3;
    this.roadMarkings = [];
    this.roadSpeed = 5;

    // Traffic
    this.cars = [];
    this.carSpawnTimer = 0;
    this.carSpawnRate = 60;

    // Coins
    this.coins = [];
    this.coinSpawnTimer = 0;

    // Input
    this.keys = {};

    // Speed boost
    this.boost = 100;
    this.maxBoost = 100;
    this.boostActive = false;
  }

  async init() {
    // Load high score
    try {
      const data = await this.context.fs.readFile('/home/user/racing-highscore.json');
      const parsed = JSON.parse(data);
      this.highScore = parsed.highScore || 0;
    } catch (error) {
      // No saved high score
    }

    // Initialize road markings
    for (let i = 0; i < 10; i++) {
      this.roadMarkings.push({
        y: i * 100
      });
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
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;

    // Title
    const title = document.createElement('h1');
    title.textContent = '🏎️ Speed Racer';
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
      font-size: 18px;
      margin-bottom: 15px;
      display: flex;
      gap: 20px;
      background: rgba(0,0,0,0.3);
      padding: 10px 20px;
      border-radius: 8px;
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
      background: #2d5016;
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
      <div>← → : Change Lanes | ↑ : Accelerate | Shift : Boost</div>
    `;
    container.appendChild(instructions);

    // Keyboard controls
    this.keydownHandler = (e) => {
      if (this.gameOver) return;

      if (!this.keys[e.key]) {
        this.keys[e.key] = true;

        if (e.key === 'ArrowLeft' && this.player.lane > 0) {
          this.player.lane--;
          this._updatePlayerLane();
        }
        if (e.key === 'ArrowRight' && this.player.lane < 2) {
          this.player.lane++;
          this._updatePlayerLane();
        }
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp') {
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
    // Update player speed
    if (this.keys['ArrowUp']) {
      this.player.speed = Math.min(this.player.speed + 0.2, this.player.maxSpeed);
    } else {
      this.player.speed = Math.max(this.player.speed - 0.1, 3);
    }

    // Boost
    if (this.keys['Shift'] && this.boost > 0) {
      this.boostActive = true;
      this.boost -= 2;
      this.roadSpeed = this.player.speed + 5;
    } else {
      this.boostActive = false;
      this.roadSpeed = this.player.speed;
      if (this.boost < this.maxBoost) {
        this.boost += 0.5;
      }
    }

    // Update distance and score
    this.distance += this.roadSpeed / 10;
    this.score = Math.floor(this.distance);

    // Update road markings
    this.roadMarkings.forEach(marking => {
      marking.y += this.roadSpeed;
      if (marking.y > this.height) {
        marking.y = -100;
      }
    });

    // Spawn traffic cars
    this.carSpawnTimer++;
    if (this.carSpawnTimer > this.carSpawnRate) {
      this.carSpawnTimer = 0;
      const lane = Math.floor(Math.random() * 3);
      const colors = ['#ff0000', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
      this.cars.push({
        lane: lane,
        x: this.roadX + lane * this.laneWidth + this.laneWidth / 2 - 25,
        y: -100,
        width: 50,
        height: 80,
        speed: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    // Update cars
    this.cars = this.cars.filter(car => {
      car.y += this.roadSpeed - car.speed;
      return car.y < this.height + 100;
    });

    // Spawn coins
    this.coinSpawnTimer++;
    if (this.coinSpawnTimer > 120) {
      this.coinSpawnTimer = 0;
      const lane = Math.floor(Math.random() * 3);
      this.coins.push({
        lane: lane,
        x: this.roadX + lane * this.laneWidth + this.laneWidth / 2 - 15,
        y: -30,
        radius: 15
      });
    }

    // Update coins
    this.coins = this.coins.filter(coin => {
      coin.y += this.roadSpeed;
      return coin.y < this.height;
    });

    // Check collision with cars
    this.cars.forEach(car => {
      if (this._checkCollision(this.player, car)) {
        this._endGame();
      }
    });

    // Check collision with coins
    this.coins = this.coins.filter(coin => {
      const coinRect = {
        x: coin.x - coin.radius,
        y: coin.y - coin.radius,
        width: coin.radius * 2,
        height: coin.radius * 2
      };

      if (this._checkCollision(this.player, coinRect)) {
        this.boost = Math.min(this.boost + 20, this.maxBoost);
        return false;
      }
      return true;
    });

    this._updateScore();
  }

  _updatePlayerLane() {
    this.player.x = this.roadX + this.player.lane * this.laneWidth + this.laneWidth / 2 - this.player.width / 2;
  }

  _checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  _draw() {
    // Clear canvas (grass)
    this.ctx.fillStyle = '#2d5016';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw road
    this.ctx.fillStyle = '#444';
    this.ctx.fillRect(this.roadX, 0, this.roadWidth, this.height);

    // Draw road edges
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(this.roadX - 5, 0, 5, this.height);
    this.ctx.fillRect(this.roadX + this.roadWidth, 0, 5, this.height);

    // Draw lane markings
    this.ctx.fillStyle = '#fff';
    this.roadMarkings.forEach(marking => {
      // Left lane divider
      this.ctx.fillRect(this.roadX + this.laneWidth - 3, marking.y, 6, 60);
      // Right lane divider
      this.ctx.fillRect(this.roadX + this.laneWidth * 2 - 3, marking.y, 6, 60);
    });

    // Draw coins
    this.coins.forEach(coin => {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.beginPath();
      this.ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#FFA500';
      this.ctx.beginPath();
      this.ctx.arc(coin.x, coin.y, coin.radius * 0.6, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = 'bold 14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('$', coin.x, coin.y + 5);
    });

    // Draw traffic cars
    this.cars.forEach(car => {
      this._drawCar(car.x, car.y, car.width, car.height, car.color);
    });

    // Draw player car with boost effect
    if (this.boostActive) {
      // Boost flames
      this.ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
      this.ctx.fillRect(this.player.x + 10, this.player.y + this.player.height, 10, 20);
      this.ctx.fillRect(this.player.x + 30, this.player.y + this.player.height, 10, 20);

      this.ctx.fillStyle = 'rgba(255, 200, 0, 0.6)';
      this.ctx.fillRect(this.player.x + 12, this.player.y + this.player.height, 6, 15);
      this.ctx.fillRect(this.player.x + 32, this.player.y + this.player.height, 6, 15);
    }
    this._drawCar(this.player.x, this.player.y, this.player.width, this.player.height, this.player.color);

    // Draw boost bar
    const boostBarWidth = 200;
    const boostBarHeight = 20;
    const boostBarX = 20;
    const boostBarY = 20;

    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(boostBarX, boostBarY, boostBarWidth, boostBarHeight);

    const boostFillWidth = (this.boost / this.maxBoost) * boostBarWidth;
    const gradient = this.ctx.createLinearGradient(boostBarX, 0, boostBarX + boostBarWidth, 0);
    gradient.addColorStop(0, '#ff6b00');
    gradient.addColorStop(1, '#ffd000');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(boostBarX, boostBarY, boostFillWidth, boostBarHeight);

    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(boostBarX, boostBarY, boostBarWidth, boostBarHeight);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('BOOST', boostBarX + boostBarWidth / 2, boostBarY + 15);

    // Draw game over overlay
    if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.width, this.height);

      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 40px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Crashed!', this.width / 2, this.height / 2 - 40);

      this.ctx.font = '24px Arial';
      this.ctx.fillText(`Distance: ${Math.floor(this.distance)}m`, this.width / 2, this.height / 2 + 10);
      this.ctx.fillText(`High Score: ${this.highScore}m`, this.width / 2, this.height / 2 + 50);
    }
  }

  _drawCar(x, y, width, height, color) {
    // Car body
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y + height * 0.2, width, height * 0.6);

    // Car top
    this.ctx.fillRect(x + width * 0.15, y, width * 0.7, height * 0.4);

    // Windows
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x + width * 0.2, y + height * 0.05, width * 0.6, height * 0.25);

    // Wheels
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x - 5, y + height * 0.25, 10, height * 0.2);
    this.ctx.fillRect(x + width - 5, y + height * 0.25, 10, height * 0.2);
    this.ctx.fillRect(x - 5, y + height * 0.65, 10, height * 0.2);
    this.ctx.fillRect(x + width - 5, y + height * 0.65, 10, height * 0.2);

    // Headlights (if applicable)
    if (color === this.player.color) {
      this.ctx.fillStyle = '#ffff00';
      this.ctx.fillRect(x + width * 0.2, y + height * 0.75, width * 0.25, height * 0.05);
      this.ctx.fillRect(x + width * 0.55, y + height * 0.75, width * 0.25, height * 0.05);
    }
  }

  _updateScore() {
    const speedPercent = Math.floor((this.player.speed / this.player.maxSpeed) * 100);
    this.scoreDiv.innerHTML = `
      <div><strong>Distance:</strong> ${Math.floor(this.distance)}m</div>
      <div><strong>High Score:</strong> ${this.highScore}m</div>
      <div><strong>Speed:</strong> ${speedPercent}%</div>
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
    this.distance = 0;
    this.player.lane = 1;
    this.player.speed = 0;
    this.boost = 100;
    this.boostActive = false;
    this._updatePlayerLane();
    this.cars = [];
    this.coins = [];
    this.carSpawnTimer = 0;
    this.coinSpawnTimer = 0;
    this._updateScore();
  }

  async _saveHighScore() {
    try {
      await this.context.fs.writeFile(
        '/home/user/racing-highscore.json',
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
