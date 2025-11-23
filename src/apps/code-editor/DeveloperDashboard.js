/**
 * Developer Dashboard - Productivity insights and metrics
 * Tracks coding statistics and provides helpful insights
 */

export class DeveloperDashboard {
  constructor() {
    this.stats = this.loadStats();
    this.panel = null;
    this.isVisible = false;
  }

  /**
   * Load stats from localStorage
   */
  loadStats() {
    try {
      const saved = localStorage.getItem('dev-dashboard-stats');
      return saved ? JSON.parse(saved) : this.getDefaultStats();
    } catch {
      return this.getDefaultStats();
    }
  }

  /**
   * Get default stats
   */
  getDefaultStats() {
    return {
      linesOfCode: 0,
      filesEdited: new Set(),
      sessionsToday: 1,
      totalSessions: 1,
      startTime: Date.now(),
      totalTime: 0,
      languages: {},
      lastActive: Date.now(),
      achievements: [],
      streakDays: 1
    };
  }

  /**
   * Save stats
   */
  saveStats() {
    try {
      // Convert Set to Array for JSON
      const statsToSave = {
        ...this.stats,
        filesEdited: Array.from(this.stats.filesEdited)
      };
      localStorage.setItem('dev-dashboard-stats', JSON.stringify(statsToSave));
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  }

  /**
   * Track file edit
   */
  trackFileEdit(fileName, language, linesAdded) {
    this.stats.filesEdited.add(fileName);
    this.stats.linesOfCode += linesAdded;

    if (!this.stats.languages[language]) {
      this.stats.languages[language] = 0;
    }
    this.stats.languages[language]++;

    this.stats.lastActive = Date.now();
    this.saveStats();
    this.checkAchievements();
  }

  /**
   * Check and unlock achievements
   */
  checkAchievements() {
    const achievements = [
      {
        id: 'first-line',
        title: 'First Line',
        description: 'Write your first line of code',
        condition: () => this.stats.linesOfCode >= 1,
        icon: '📝'
      },
      {
        id: 'century',
        title: 'Century',
        description: 'Write 100 lines of code',
        condition: () => this.stats.linesOfCode >= 100,
        icon: '💯'
      },
      {
        id: 'polyglot',
        title: 'Polyglot',
        description: 'Code in 3 different languages',
        condition: () => Object.keys(this.stats.languages).length >= 3,
        icon: '🌍'
      },
      {
        id: 'dedicated',
        title: 'Dedicated',
        description: 'Code for 7 days in a row',
        condition: () => this.stats.streakDays >= 7,
        icon: '🔥'
      },
      {
        id: 'marathon',
        title: 'Marathon',
        description: 'Code for 1 hour straight',
        condition: () => this.stats.totalTime >= 3600000,
        icon: '⏱️'
      }
    ];

    achievements.forEach(achievement => {
      if (!this.stats.achievements.includes(achievement.id) && achievement.condition()) {
        this.stats.achievements.push(achievement.id);
        this.unlockAchievement(achievement);
      }
    });
  }

  /**
   * Show achievement notification
   */
  unlockAchievement(achievement) {
    console.log(`🎉 Achievement Unlocked: ${achievement.title}`);
    // Could show a toast notification here
  }

  /**
   * Initialize dashboard
   */
  initialize(container) {
    this.container = container;
    this.createPanel();
  }

  /**
   * Create panel
   */
  createPanel() {
    this.panel = document.createElement('div');
    this.panel.className = 'dev-dashboard-panel';
    this.panel.style.display = 'none';
    this.panel.innerHTML = this.getPanelHTML();

    this.container.appendChild(this.panel);
    this.attachEventListeners();
  }

  /**
   * Get panel HTML
   */
  getPanelHTML() {
    const sessionTime = Date.now() - this.stats.startTime;
    const hours = Math.floor(sessionTime / 3600000);
    const minutes = Math.floor((sessionTime % 3600000) / 60000);

    return `
      <div class="dashboard-header">
        <h3>📊 Developer Dashboard</h3>
        <button class="close-btn" id="close-dashboard">×</button>
      </div>

      <div class="dashboard-content">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-value">${this.stats.linesOfCode.toLocaleString()}</div>
            <div class="stat-label">Lines of Code</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📄</div>
            <div class="stat-value">${this.stats.filesEdited.size}</div>
            <div class="stat-label">Files Edited</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-value">${hours}h ${minutes}m</div>
            <div class="stat-label">Session Time</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🔥</div>
            <div class="stat-value">${this.stats.streakDays}</div>
            <div class="stat-label">Day Streak</div>
          </div>
        </div>

        <div class="dashboard-section">
          <h4>Languages Used</h4>
          <div class="languages-list">
            ${this.renderLanguages()}
          </div>
        </div>

        <div class="dashboard-section">
          <h4>Achievements</h4>
          <div class="achievements-grid">
            ${this.renderAchievements()}
          </div>
        </div>

        <div class="dashboard-section">
          <h4>Quick Tips</h4>
          <div class="tips-list">
            ${this.renderTips()}
          </div>
        </div>
      </div>

      <style>
        .dev-dashboard-panel {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 700px;
          max-height: 80vh;
          background: #1e1e1e;
          border: 1px solid #3e3e3e;
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          z-index: 10001;
          display: flex;
          flex-direction: column;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 25px;
          border-bottom: 1px solid #3e3e3e;
          background: #252526;
        }

        .dashboard-header h3 {
          margin: 0;
          color: #d4d4d4;
          font-size: 18px;
        }

        .dashboard-content {
          flex: 1;
          overflow-y: auto;
          padding: 25px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: linear-gradient(135deg, #2d2d2d, #252526);
          border: 1px solid #3e3e3e;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          border-color: #007acc;
        }

        .stat-icon {
          font-size: 32px;
          margin-bottom: 10px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #007acc;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 12px;
          color: #969696;
        }

        .dashboard-section {
          margin-bottom: 25px;
        }

        .dashboard-section h4 {
          color: #d4d4d4;
          font-size: 16px;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #3e3e3e;
        }

        .languages-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .language-tag {
          background: #3c3c3c;
          border: 1px solid #565656;
          border-radius: 4px;
          padding: 8px 16px;
          color: #d4d4d4;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .language-count {
          background: #007acc;
          color: white;
          border-radius: 10px;
          padding: 2px 8px;
          font-size: 11px;
          font-weight: bold;
        }

        .achievements-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .achievement-card {
          background: #2d2d2d;
          border: 1px solid #3e3e3e;
          border-radius: 6px;
          padding: 15px;
          text-align: center;
        }

        .achievement-card.unlocked {
          border-color: #4ec9b0;
          background: linear-gradient(135deg, #2d2d2d, #1e3a35);
        }

        .achievement-card.locked {
          opacity: 0.4;
        }

        .achievement-icon {
          font-size: 36px;
          margin-bottom: 8px;
        }

        .achievement-title {
          color: #d4d4d4;
          font-size: 13px;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .achievement-desc {
          color: #969696;
          font-size: 11px;
        }

        .tips-list {
          background: #2d2d2d;
          border: 1px solid #3e3e3e;
          border-radius: 6px;
          padding: 15px;
        }

        .tip-item {
          color: #d4d4d4;
          font-size: 13px;
          margin-bottom: 10px;
          padding-left: 20px;
          position: relative;
        }

        .tip-item:before {
          content: '💡';
          position: absolute;
          left: 0;
        }

        .tip-item:last-child {
          margin-bottom: 0;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: #d4d4d4;
          font-size: 28px;
          cursor: pointer;
          padding: 0;
          width: 35px;
          height: 35px;
        }

        .close-btn:hover {
          color: #fff;
        }
      </style>
    `;
  }

  /**
   * Render languages
   */
  renderLanguages() {
    const languages = Object.entries(this.stats.languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (languages.length === 0) {
      return '<div style="color: #969696; text-align: center;">No languages yet</div>';
    }

    return languages.map(([lang, count]) => `
      <div class="language-tag">
        <span>${lang}</span>
        <span class="language-count">${count}</span>
      </div>
    `).join('');
  }

  /**
   * Render achievements
   */
  renderAchievements() {
    const allAchievements = [
      { id: 'first-line', title: 'First Line', icon: '📝' },
      { id: 'century', title: 'Century', icon: '💯' },
      { id: 'polyglot', title: 'Polyglot', icon: '🌍' },
      { id: 'dedicated', title: 'Dedicated', icon: '🔥' },
      { id: 'marathon', title: 'Marathon', icon: '⏱️' },
      { id: 'night-owl', title: 'Night Owl', icon: '🦉' }
    ];

    return allAchievements.map(achievement => {
      const unlocked = this.stats.achievements.includes(achievement.id);
      return `
        <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
          <div class="achievement-icon">${achievement.icon}</div>
          <div class="achievement-title">${achievement.title}</div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render tips
   */
  renderTips() {
    const tips = [
      'Use Ctrl+P for Quick Open to quickly navigate files',
      'Press Ctrl+Shift+P to open Command Palette',
      'Use Ctrl+/ to toggle line comments',
      'Press F12 to go to definition',
      'Use Alt+↑/↓ to move lines up/down'
    ];

    return tips.map(tip => `<div class="tip-item">${tip}</div>`).join('');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    this.panel.querySelector('#close-dashboard')?.addEventListener('click', () => {
      this.hide();
    });
  }

  /**
   * Show panel
   */
  show() {
    if (!this.panel) return;

    // Refresh stats display
    this.panel.innerHTML = this.getPanelHTML();
    this.attachEventListeners();

    this.panel.style.display = 'flex';
    this.isVisible = true;
  }

  /**
   * Hide panel
   */
  hide() {
    if (!this.panel) return;

    this.panel.style.display = 'none';
    this.isVisible = false;
  }

  /**
   * Toggle panel
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.saveStats();
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
  }
}
