/**
 * Pomodoro Timer Plugin
 * Helps users focus using the Pomodoro technique
 */

class PomodoroTimer {
  constructor(api) {
    this.api = api;
    this.widget = null;
    this.timer = null;
    this.timeLeft = 25 * 60; // 25 minutes in seconds
    this.isRunning = false;
    this.isBreak = false;
    this.workDuration = 25 * 60;
    this.breakDuration = 5 * 60;
    this.sessionsCompleted = 0;
  }

  async activate() {
    console.log('[PomodoroTimer] Activating...');

    // Create widget UI
    this.widget = document.createElement('div');
    this.widget.className = 'pomodoro-widget';
    this.widget.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 200px;
      background: rgba(30, 30, 30, 0.95);
      border: 1px solid #3e3e42;
      border-radius: 8px;
      padding: 16px;
      color: #d4d4d4;
      font-family: system-ui, sans-serif;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 9999;
    `;

    this.renderUI();
    document.body.appendChild(this.widget);

    this.api.ui.notify('Pomodoro Timer activated');
  }

  async deactivate() {
    console.log('[PomodoroTimer] Deactivating...');

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.widget) {
      this.widget.remove();
      this.widget = null;
    }
  }

  renderUI() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    this.widget.innerHTML = `
      <div style="text-align: center;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #888;">
          ${this.isBreak ? '🍵 BREAK' : '🍅 FOCUS'}
        </h3>
        <div style="font-size: 36px; font-weight: bold; margin-bottom: 16px; font-family: monospace;">
          ${timeDisplay}
        </div>
        <div style="display: flex; gap: 8px; justify-content: center; margin-bottom: 12px;">
          <button class="start-btn" style="
            padding: 8px 16px;
            background: ${this.isRunning ? '#d73a49' : '#28a745'};
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          ">
            ${this.isRunning ? '⏸ Pause' : '▶ Start'}
          </button>
          <button class="reset-btn" style="
            padding: 8px 16px;
            background: #3e3e42;
            color: #d4d4d4;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          ">
            🔄 Reset
          </button>
        </div>
        <div style="font-size: 12px; color: #666;">
          Sessions: ${this.sessionsCompleted}
        </div>
      </div>
    `;

    // Event listeners
    this.widget.querySelector('.start-btn').addEventListener('click', () => this.toggleTimer());
    this.widget.querySelector('.reset-btn').addEventListener('click', () => this.resetTimer());
  }

  toggleTimer() {
    if (this.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  startTimer() {
    this.isRunning = true;
    this.timer = setInterval(() => {
      this.timeLeft--;

      if (this.timeLeft <= 0) {
        this.timerComplete();
      }

      this.renderUI();
    }, 1000);
    this.renderUI();
  }

  pauseTimer() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.renderUI();
  }

  resetTimer() {
    this.pauseTimer();
    this.timeLeft = this.isBreak ? this.breakDuration : this.workDuration;
    this.renderUI();
  }

  timerComplete() {
    this.pauseTimer();

    if (!this.isBreak) {
      // Work session completed
      this.sessionsCompleted++;
      this.api.ui.notify('Focus session complete! Time for a break.');
      this.isBreak = true;
      this.timeLeft = this.breakDuration;
    } else {
      // Break completed
      this.api.ui.notify('Break complete! Ready for another session?');
      this.isBreak = false;
      this.timeLeft = this.workDuration;
    }

    this.renderUI();

    // Play notification sound (if browser allows)
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      // Audio not supported, ignore
    }
  }

  // State management
  async saveState() {
    return {
      timeLeft: this.timeLeft,
      isBreak: this.isBreak,
      sessionsCompleted: this.sessionsCompleted,
      isRunning: this.isRunning
    };
  }

  async restoreState(state) {
    this.timeLeft = state.timeLeft;
    this.isBreak = state.isBreak;
    this.sessionsCompleted = state.sessionsCompleted;
    if (state.isRunning) {
      this.startTimer();
    }
    this.renderUI();
  }
}

module.exports = PomodoroTimer;
