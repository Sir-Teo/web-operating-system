/**
 * Checkers Game Plugin
 * Classic board game with AI opponent
 */

class CheckersGame {
  constructor(api) {
    this.api = api;
    this.container = null;
    this.canvas = null;
    this.ctx = null;

    this.boardSize = 8;
    this.tileSize = 60;
    this.board = [];
    this.selectedPiece = null;
    this.currentPlayer = 'red'; // red or black
    this.validMoves = [];
    this.mustCapture = false;
  }

  async activate() {
    this.createUI();
    this.initBoard();
    this.render();
    this.api.ui.notify('Checkers activated! You are Red.');
  }

  async deactivate() {
    if (this.container) {
      this.container.remove();
    }
    this.canvas?.removeEventListener('click', this.clickHandler);
  }

  createUI() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #8e44ad, #3498db);
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      z-index: 10000;
    `;

    this.container.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="margin: 0; color: white; font-size: 36px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">Checkers</h1>
        <div id="turn-indicator" style="margin-top: 10px; color: white; font-size: 18px; font-weight: bold;">
          Your Turn (Red)
        </div>
      </div>

      <canvas id="checkers-canvas" width="480" height="480" style="
        display: block;
        background: #ddd;
        border-radius: 8px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      "></canvas>

      <div style="text-align: center; margin-top: 15px;">
        <button id="new-game" style="
          padding: 12px 25px;
          background: white;
          color: #8e44ad;
          border: none;
          border-radius: 20px;
          font-weight: bold;
          cursor: pointer;
          margin-right: 10px;
        ">New Game</button>
        <button id="close-game" style="
          padding: 12px 25px;
          background: rgba(255,255,255,0.2);
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
        ">Close</button>
      </div>
    `;

    document.body.appendChild(this.container);

    this.canvas = this.container.querySelector('#checkers-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.container.querySelector('#new-game').addEventListener('click', () => {
      this.initBoard();
      this.render();
    });

    this.container.querySelector('#close-game').addEventListener('click', () => {
      this.container.style.display = 'none';
    });

    this.clickHandler = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / this.tileSize);
      const y = Math.floor((e.clientY - rect.top) / this.tileSize);
      this.handleClick(x, y);
    };

    this.canvas.addEventListener('click', this.clickHandler);
  }

  initBoard() {
    this.board = Array(8).fill(null).map(() => Array(8).fill(null));
    this.currentPlayer = 'red';
    this.selectedPiece = null;
    this.validMoves = [];

    // Place red pieces (bottom)
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          this.board[row][col] = { color: 'red', king: false };
        }
      }
    }

    // Place black pieces (top)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          this.board[row][col] = { color: 'black', king: false };
        }
      }
    }

    this.updateTurnIndicator();
  }

  handleClick(x, y) {
    if (x < 0 || x >= 8 || y < 0 || y >= 8) return;
    if (this.currentPlayer !== 'red') return; // AI's turn

    const piece = this.board[y][x];

    // Selecting a piece
    if (piece && piece.color === this.currentPlayer && !this.selectedPiece) {
      this.selectedPiece = { x, y };
      this.validMoves = this.getValidMoves(x, y);
      this.render();
      return;
    }

    // Making a move
    if (this.selectedPiece) {
      const move = this.validMoves.find(m => m.x === x && m.y === y);

      if (move) {
        this.makeMove(this.selectedPiece.x, this.selectedPiece.y, x, y, move.captured);
        this.selectedPiece = null;
        this.validMoves = [];
        this.render();

        // Check for win
        if (this.checkWin()) return;

        // AI turn
        setTimeout(() => this.aiMove(), 500);
      } else {
        this.selectedPiece = null;
        this.validMoves = [];
        this.render();
      }
    }
  }

  getValidMoves(x, y) {
    const piece = this.board[y][x];
    if (!piece) return [];

    const moves = [];
    const directions = piece.king
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : piece.color === 'red'
      ? [[-1, -1], [-1, 1]]
      : [[1, -1], [1, 1]];

    // Check captures first
    const captures = [];

    directions.forEach(([dy, dx]) => {
      const jumpY = y + dy * 2;
      const jumpX = x + dx * 2;
      const midY = y + dy;
      const midX = x + dx;

      if (jumpY >= 0 && jumpY < 8 && jumpX >= 0 && jumpX < 8) {
        const mid = this.board[midY][midX];
        const dest = this.board[jumpY][jumpX];

        if (mid && mid.color !== piece.color && !dest) {
          captures.push({ x: jumpX, y: jumpY, captured: { x: midX, y: midY } });
        }
      }
    });

    if (captures.length > 0) {
      return captures;
    }

    // Regular moves
    directions.forEach(([dy, dx]) => {
      const newY = y + dy;
      const newX = x + dx;

      if (newY >= 0 && newY < 8 && newX >= 0 && newX < 8) {
        if (!this.board[newY][newX]) {
          moves.push({ x: newX, y: newY });
        }
      }
    });

    return moves;
  }

  makeMove(fromX, fromY, toX, toY, captured) {
    const piece = this.board[fromY][fromX];

    this.board[toY][toX] = piece;
    this.board[fromY][fromX] = null;

    if (captured) {
      this.board[captured.y][captured.x] = null;
    }

    // Check for king promotion
    if (piece.color === 'red' && toY === 0) {
      piece.king = true;
    } else if (piece.color === 'black' && toY === 7) {
      piece.king = true;
    }

    this.currentPlayer = this.currentPlayer === 'red' ? 'black' : 'red';
    this.updateTurnIndicator();
  }

  aiMove() {
    if (this.currentPlayer !== 'black') return;

    const allMoves = [];

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const piece = this.board[y][x];
        if (piece && piece.color === 'black') {
          const moves = this.getValidMoves(x, y);
          moves.forEach(move => {
            allMoves.push({ from: { x, y }, to: move });
          });
        }
      }
    }

    if (allMoves.length === 0) {
      alert('Red wins!');
      return;
    }

    // Prioritize captures
    const captures = allMoves.filter(m => m.to.captured);
    const move = captures.length > 0
      ? captures[Math.floor(Math.random() * captures.length)]
      : allMoves[Math.floor(Math.random() * allMoves.length)];

    this.makeMove(move.from.x, move.from.y, move.to.x, move.to.y, move.to.captured);
    this.render();

    if (this.checkWin()) return;
  }

  checkWin() {
    let redPieces = 0;
    let blackPieces = 0;

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const piece = this.board[y][x];
        if (piece) {
          if (piece.color === 'red') redPieces++;
          if (piece.color === 'black') blackPieces++;
        }
      }
    }

    if (redPieces === 0) {
      alert('Black (AI) wins!');
      return true;
    }

    if (blackPieces === 0) {
      alert('Red (You) wins!');
      return true;
    }

    return false;
  }

  updateTurnIndicator() {
    const indicator = this.container.querySelector('#turn-indicator');
    if (this.currentPlayer === 'red') {
      indicator.textContent = 'Your Turn (Red)';
      indicator.style.color = '#ff6b6b';
    } else {
      indicator.textContent = 'AI Turn (Black)';
      indicator.style.color = '#333';
    }
  }

  render() {
    // Draw board
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = (row + col) % 2 === 0;
        this.ctx.fillStyle = isLight ? '#f0d9b5' : '#b58863';
        this.ctx.fillRect(col * this.tileSize, row * this.tileSize, this.tileSize, this.tileSize);
      }
    }

    // Highlight selected piece
    if (this.selectedPiece) {
      this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
      this.ctx.fillRect(
        this.selectedPiece.x * this.tileSize,
        this.selectedPiece.y * this.tileSize,
        this.tileSize,
        this.tileSize
      );
    }

    // Highlight valid moves
    this.validMoves.forEach(move => {
      this.ctx.fillStyle = move.captured
        ? 'rgba(255, 0, 0, 0.3)'
        : 'rgba(0, 255, 0, 0.3)';
      this.ctx.fillRect(
        move.x * this.tileSize,
        move.y * this.tileSize,
        this.tileSize,
        this.tileSize
      );
    });

    // Draw pieces
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece) {
          const centerX = col * this.tileSize + this.tileSize / 2;
          const centerY = row * this.tileSize + this.tileSize / 2;
          const radius = this.tileSize / 2 - 8;

          // Piece shadow
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          this.ctx.beginPath();
          this.ctx.arc(centerX + 2, centerY + 2, radius, 0, Math.PI * 2);
          this.ctx.fill();

          // Piece
          const gradient = this.ctx.createRadialGradient(
            centerX - 5,
            centerY - 5,
            radius / 4,
            centerX,
            centerY,
            radius
          );

          if (piece.color === 'red') {
            gradient.addColorStop(0, '#ff6b6b');
            gradient.addColorStop(1, '#c92a2a');
          } else {
            gradient.addColorStop(0, '#555');
            gradient.addColorStop(1, '#222');
          }

          this.ctx.fillStyle = gradient;
          this.ctx.beginPath();
          this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          this.ctx.fill();

          // Border
          this.ctx.strokeStyle = piece.color === 'red' ? '#c92a2a' : '#000';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();

          // King crown
          if (piece.king) {
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('♔', centerX, centerY);
          }
        }
      }
    }
  }
}

module.exports = CheckersGame;
