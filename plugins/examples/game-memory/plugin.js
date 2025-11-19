/**
 * Memory Match Game Plugin
 * Card matching memory game
 */

class MemoryMatch {
  constructor(api) {
    this.api = api;
    this.container = null;
    this.cards = [];
    this.flipped = [];
    this.matched = [];
    this.moves = 0;
    this.pairCount = 8;
    this.canFlip = true;
  }

  async activate() {
    this.createUI();
    this.newGame();
    this.api.ui.notify('Memory Match activated!');
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      z-index: 10000;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;

    this.container.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; color: white; font-size: 36px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">Memory Match</h1>
        <div style="margin-top: 15px; color: white; font-size: 18px;">
          Moves: <span id="moves" style="font-weight: bold;">0</span>
        </div>
      </div>

      <div id="game-board" style="
        display: grid;
        grid-template-columns: repeat(4, 90px);
        gap: 10px;
        margin-bottom: 20px;
      "></div>

      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="new-game" style="
          padding: 12px 25px;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 25px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        ">New Game</button>
        <button id="close-game" style="
          padding: 12px 25px;
          background: rgba(255,255,255,0.2);
          color: white;
          border: none;
          border-radius: 25px;
          font-size: 16px;
          cursor: pointer;
        ">Close</button>
      </div>
    `;

    document.body.appendChild(this.container);

    this.container.querySelector('#new-game').addEventListener('click', () => this.newGame());
    this.container.querySelector('#close-game').addEventListener('click', () => {
      this.container.style.display = 'none';
    });
  }

  newGame() {
    this.moves = 0;
    this.flipped = [];
    this.matched = [];
    this.canFlip = true;

    // Create pairs of emojis
    const emojis = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎸', '🎺', '🎹', '🎲', '🎰', '🏆', '⚽', '🏀', '🎾', '🏐', '🎱'];
    const selected = emojis.slice(0, this.pairCount);
    this.cards = [...selected, ...selected]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({ emoji, index, matched: false }));

    this.updateUI();
  }

  updateUI() {
    this.container.querySelector('#moves').textContent = this.moves;

    const board = this.container.querySelector('#game-board');
    board.innerHTML = '';

    this.cards.forEach((card, index) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'memory-card';
      cardEl.dataset.index = index;

      const isFlipped = this.flipped.includes(index) || card.matched;

      cardEl.style.cssText = `
        width: 90px;
        height: 90px;
        background: ${isFlipped ? 'white' : 'rgba(255,255,255,0.3)'};
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40px;
        cursor: ${card.matched ? 'default' : 'pointer'};
        transition: all 0.3s ease;
        transform: ${isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)'};
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        user-select: none;
      `;

      if (isFlipped) {
        cardEl.textContent = card.emoji;
      } else {
        cardEl.textContent = '?';
        cardEl.style.fontSize = '30px';
        cardEl.style.color = 'white';
      }

      if (!card.matched) {
        cardEl.addEventListener('click', () => this.flipCard(index));
      }

      board.appendChild(cardEl);
    });
  }

  async flipCard(index) {
    if (!this.canFlip || this.flipped.includes(index) || this.cards[index].matched) {
      return;
    }

    this.flipped.push(index);
    this.updateUI();

    if (this.flipped.length === 2) {
      this.moves++;
      this.canFlip = false;

      const [first, second] = this.flipped;

      if (this.cards[first].emoji === this.cards[second].emoji) {
        // Match!
        this.cards[first].matched = true;
        this.cards[second].matched = true;
        this.matched.push(first, second);
        this.flipped = [];
        this.canFlip = true;

        // Check win condition
        if (this.matched.length === this.cards.length) {
          setTimeout(() => {
            alert(`🎉 You won in ${this.moves} moves!`);
          }, 500);
        }
      } else {
        // No match
        setTimeout(() => {
          this.flipped = [];
          this.canFlip = true;
          this.updateUI();
        }, 1000);
      }

      this.updateUI();
    }
  }
}

module.exports = MemoryMatch;
