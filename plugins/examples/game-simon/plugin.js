/**
 * Simon Says Game Plugin
 * Memory sequence game
 */

class SimonGame {
  constructor(api) {
    this.api = api;
    this.container = null;
    this.sequence = [];
    this.playerSequence = [];
    this.level = 0;
    this.isPlaying = false;
    this.strict = false;

    this.colors = ['red', 'blue', 'green', 'yellow'];
    this.sounds = {};
  }

  async activate() {
    this.createUI();
    this.api.ui.notify('Simon Says activated!');
  }

  async deactivate() {
    if (this.container) {
      this.container.remove();
    }
  }

  createUI() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #222;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      z-index: 10000;
      font-family: 'Arial', sans-serif;
    `;

    this.container.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; color: #fff; font-size: 32px; text-shadow: 0 0 10px #fff;">SIMON</h1>
        <div style="margin-top: 10px; color: #fff; font-size: 24px;">
          Level: <span id="level">0</span>
        </div>
      </div>

      <div style="position: relative; width: 400px; height: 400px;">
        <!-- Red -->
        <div id="btn-red" class="simon-btn" style="
          position: absolute;
          top: 0;
          left: 0;
          width: 180px;
          height: 180px;
          background: #c00;
          border-top-left-radius: 200px;
          cursor: pointer;
          border: 5px solid #000;
        "></div>

        <!-- Blue -->
        <div id="btn-blue" class="simon-btn" style="
          position: absolute;
          top: 0;
          right: 0;
          width: 180px;
          height: 180px;
          background: #00c;
          border-top-right-radius: 200px;
          cursor: pointer;
          border: 5px solid #000;
        "></div>

        <!-- Green -->
        <div id="btn-green" class="simon-btn" style="
          position: absolute;
          bottom: 0;
          left: 0;
          width: 180px;
          height: 180px;
          background: #0c0;
          border-bottom-left-radius: 200px;
          cursor: pointer;
          border: 5px solid #000;
        "></div>

        <!-- Yellow -->
        <div id="btn-yellow" class="simon-btn" style="
          position: absolute;
          bottom: 0;
          right: 0;
          width: 180px;
          height: 180px;
          background: #cc0;
          border-bottom-right-radius: 200px;
          cursor: pointer;
          border: 5px solid #000;
        "></div>

        <!-- Center circle -->
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 140px;
          height: 140px;
          background: #222;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 5px solid #000;
        ">
          <button id="start-btn" style="
            padding: 10px 20px;
            background: #0f0;
            color: #000;
            border: none;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            margin-bottom: 5px;
          ">START</button>
          <label style="color: #fff; font-size: 12px; cursor: pointer;">
            <input type="checkbox" id="strict-mode"> Strict
          </label>
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <button id="close-game" style="
          padding: 10px 25px;
          background: #666;
          color: #fff;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        ">Close</button>
      </div>
    `;

    document.body.appendChild(this.container);

    // Event listeners
    this.container.querySelector('#start-btn').addEventListener('click', () => this.startGame());
    this.container.querySelector('#close-game').addEventListener('click', () => {
      this.container.style.display = 'none';
    });
    this.container.querySelector('#strict-mode').addEventListener('change', (e) => {
      this.strict = e.target.checked;
    });

    this.colors.forEach(color => {
      const btn = this.container.querySelector(`#btn-${color}`);
      btn.addEventListener('click', () => this.handlePlayerInput(color));
    });
  }

  startGame() {
    this.sequence = [];
    this.playerSequence = [];
    this.level = 0;
    this.isPlaying = true;
    this.nextRound();
  }

  nextRound() {
    this.level++;
    this.playerSequence = [];
    this.sequence.push(this.colors[Math.floor(Math.random() * 4)]);
    this.updateLevel();
    this.playSequence();
  }

  async playSequence() {
    this.isPlaying = true;

    for (let i = 0; i < this.sequence.length; i++) {
      await this.delay(500);
      await this.flashButton(this.sequence[i]);
    }

    this.isPlaying = false;
  }

  async flashButton(color) {
    const btn = this.container.querySelector(`#btn-${color}`);
    const originalBg = btn.style.background;

    const lightColors = {
      red: '#ff4444',
      blue: '#4444ff',
      green: '#44ff44',
      yellow: '#ffff44'
    };

    btn.style.background = lightColors[color];
    this.playTone(color);

    await this.delay(400);
    btn.style.background = originalBg;
  }

  handlePlayerInput(color) {
    if (this.isPlaying) return;

    this.flashButton(color);
    this.playerSequence.push(color);

    const currentIndex = this.playerSequence.length - 1;

    if (this.playerSequence[currentIndex] !== this.sequence[currentIndex]) {
      // Wrong!
      this.playError();

      if (this.strict) {
        alert('Wrong! Game Over. Starting fresh...');
        this.startGame();
      } else {
        alert('Wrong! Try again...');
        this.playerSequence = [];
        setTimeout(() => this.playSequence(), 1000);
      }
      return;
    }

    if (this.playerSequence.length === this.sequence.length) {
      // Level complete!
      if (this.level === 20) {
        alert('🎉 You win! Perfect score!');
        this.startGame();
      } else {
        setTimeout(() => this.nextRound(), 1000);
      }
    }
  }

  playTone(color) {
    const frequencies = {
      red: 329.63,
      blue: 261.63,
      green: 220.00,
      yellow: 164.81
    };

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequencies[color];
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      // Audio not supported
    }
  }

  playError() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 110;
      oscillator.type = 'sawtooth';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      // Audio not supported
    }
  }

  updateLevel() {
    this.container.querySelector('#level').textContent = this.level;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = SimonGame;
