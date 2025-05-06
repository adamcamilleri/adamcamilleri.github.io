// Game state management
class GameState {
    constructor() {
        this.rows = 6;
        this.cols = 7;
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(null));
        this.currentPlayer = 'red';
        this.gameOver = false;
        this.scores = { red: 0, yellow: 0 };
        this.moveHistory = [];
    }

    reset() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(null));
        this.currentPlayer = 'red';
        this.gameOver = false;
        this.moveHistory = [];
    }

    makeMove(col) {
        if (this.gameOver || this.isColumnFull(col)) return null;

        const row = this.getLowestEmptyRow(col);
        if (row === -1) return null;

        this.board[row][col] = this.currentPlayer;
        this.moveHistory.push({ row, col, player: this.currentPlayer });

        const result = {
            row,
            col,
            player: this.currentPlayer,
            isWin: this.checkWin(row, col),
            isDraw: this.isBoardFull()
        };

        if (!result.isWin && !result.isDraw) {
            this.switchPlayer();
        } else {
            this.gameOver = true;
            if (result.isWin) {
                this.scores[this.currentPlayer]++;
            }
        }

        return result;
    }

    getLowestEmptyRow(col) {
        for (let row = this.rows - 1; row >= 0; row--) {
            if (!this.board[row][col]) return row;
        }
        return -1;
    }

    isColumnFull(col) {
        return this.board[0][col] !== null;
    }

    isBoardFull() {
        return this.board[0].every(cell => cell !== null);
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'red' ? 'yellow' : 'red';
    }

    checkWin(row, col) {
        // Check horizontal
        let count = 0;
        for (let c = 0; c < this.cols; c++) {
            if (this.board[row][c] === this.currentPlayer) {
                count++;
                if (count >= 4) return true;
            } else {
                count = 0;
            }
        }

        // Check vertical
        count = 0;
        for (let r = 0; r < this.rows; r++) {
            if (this.board[r][col] === this.currentPlayer) {
                count++;
                if (count >= 4) return true;
            } else {
                count = 0;
            }
        }

        // Check diagonal (top-left to bottom-right)
        let r = row - Math.min(row, col);
        let c = col - Math.min(row, col);
        count = 0;
        while (r < this.rows && c < this.cols) {
            if (this.board[r][c] === this.currentPlayer) {
                count++;
                if (count >= 4) return true;
            } else {
                count = 0;
            }
            r++;
            c++;
        }

        // Check diagonal (top-right to bottom-left)
        r = row - Math.min(row, this.cols - 1 - col);
        c = col + Math.min(row, this.cols - 1 - col);
        count = 0;
        while (r < this.rows && c >= 0) {
            if (this.board[r][c] === this.currentPlayer) {
                count++;
                if (count >= 4) return true;
            } else {
                count = 0;
            }
            r++;
            c--;
        }

        return false;
    }
}

// UI management
class GameUI {
    constructor(gameState) {
        this.gameState = gameState;
        this.initializeBoard();
        this.setupEventListeners();
    }

    initializeBoard() {
        const grid = document.querySelector('.board-grid');
        grid.innerHTML = '';

        for (let row = 0; row < this.gameState.rows; row++) {
            for (let col = 0; col < this.gameState.cols; col++) {
                const slot = document.createElement('div');
                slot.className = 'slot';
                slot.setAttribute('data-row', row);
                slot.setAttribute('data-col', col);
                grid.appendChild(slot);
            }
        }
    }

    setupEventListeners() {
        // Add click event listeners to each slot
        const grid = document.querySelector('.board-grid');
        grid.addEventListener('click', (e) => {
            const slot = e.target.closest('.slot');
            if (!slot) return;
            
            const col = parseInt(slot.getAttribute('data-col'));
            this.handleMove(col);
        });

        // Add hover effects
        grid.addEventListener('mouseover', (e) => {
            const slot = e.target.closest('.slot');
            if (!slot) return;
            
            const col = parseInt(slot.getAttribute('data-col'));
            this.showDropPreview(col);
        });

        grid.addEventListener('mouseout', () => {
            const slots = document.querySelectorAll('.slot.preview');
            slots.forEach(slot => {
                slot.classList.remove('preview', 'red', 'yellow');
            });
        });

        // Add undo button listener
        document.getElementById('undo').addEventListener('click', () => this.handleUndo());

        // Add reset button listener
        document.getElementById('reset').addEventListener('click', () => {
            this.gameState.reset();
            this.updateBoard();
            this.updateStatus();
        });

        // Add modal button listeners
        document.getElementById('playAgain').addEventListener('click', () => {
            this.hideModal();
            this.gameState.reset();
            this.updateBoard();
            this.updateStatus();
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideModal();
        });
    }

    handleMove(col) {
        const result = this.gameState.makeMove(col);
        if (!result) return;

        this.updateBoard();
        this.updateStatus();
        this.updateScores();

        if (result.isWin) {
            this.showWinAnimation(result);
            this.showModal(`${result.player.toUpperCase()} wins!`);
        } else if (result.isDraw) {
            this.showModal("It's a draw!");
        }
    }

    updateBoard() {
        const slots = document.querySelectorAll('.slot');
        slots.forEach(slot => {
            const row = parseInt(slot.getAttribute('data-row'));
            const col = parseInt(slot.getAttribute('data-col'));
            const player = this.gameState.board[row][col];
            
            // Clear existing content
            slot.innerHTML = '';
            slot.className = 'slot';
            
            if (player) {
                slot.classList.add('filled', player);
                const disc = document.createElement('div');
                disc.className = `disc ${player}`;
                slot.appendChild(disc);
                // Trigger animation
                requestAnimationFrame(() => {
                    disc.classList.add('dropping');
                });
            }
        });

        // Update undo button state
        this.updateUndoButton();
    }

    updateStatus() {
        // Update turn indicators
        const turnIndicators = document.querySelectorAll('.turn-indicator');
        turnIndicators.forEach(indicator => {
            indicator.classList.remove('active');
            const disc = indicator.querySelector('.disc');
            if (disc.classList.contains(this.gameState.currentPlayer)) {
                indicator.classList.add('active');
            }
        });
        
        // Update player names
        const playerNames = document.querySelectorAll('.player-name');
        playerNames[0].textContent = 'Player 1 (Red)';
        playerNames[1].textContent = 'Player 2 (Yellow)';
    }

    updateScores() {
        document.getElementById('score1').textContent = this.gameState.scores.red;
        document.getElementById('score2').textContent = this.gameState.scores.yellow;
    }

    showDropPreview(col) {
        const row = this.gameState.getLowestEmptyRow(col);
        if (row === -1) return;

        const slot = document.querySelector(`.slot[data-row="${row}"][data-col="${col}"]`);
        if (slot) {
            slot.classList.add('preview', this.gameState.currentPlayer);
        }
    }

    showWinAnimation(result) {
        const winningSlots = this.findWinningSlots(result.row, result.col);
        winningSlots.forEach(({row, col}) => {
            const slot = document.querySelector(`.slot[data-row="${row}"][data-col="${col}"]`);
            if (slot) {
                slot.classList.add('winning');
            }
        });
    }

    findWinningSlots(row, col) {
        const slots = [];
        const player = this.gameState.board[row][col];

        // Check horizontal
        for (let c = Math.max(0, col - 3); c <= Math.min(this.gameState.cols - 4, col); c++) {
            if (this.gameState.board[row][c] === player &&
                this.gameState.board[row][c + 1] === player &&
                this.gameState.board[row][c + 2] === player &&
                this.gameState.board[row][c + 3] === player) {
                slots.push({row, col: c}, {row, col: c + 1}, {row, col: c + 2}, {row, col: c + 3});
                return slots;
            }
        }

        // Check vertical
        for (let r = Math.max(0, row - 3); r <= Math.min(this.gameState.rows - 4, row); r++) {
            if (this.gameState.board[r][col] === player &&
                this.gameState.board[r + 1][col] === player &&
                this.gameState.board[r + 2][col] === player &&
                this.gameState.board[r + 3][col] === player) {
                slots.push({row: r, col}, {row: r + 1, col}, {row: r + 2, col}, {row: r + 3, col});
                return slots;
            }
        }

        // Check diagonal (top-left to bottom-right)
        for (let r = Math.max(0, row - 3); r <= Math.min(this.gameState.rows - 4, row); r++) {
            for (let c = Math.max(0, col - 3); c <= Math.min(this.gameState.cols - 4, col); c++) {
                if (this.gameState.board[r][c] === player &&
                    this.gameState.board[r + 1][c + 1] === player &&
                    this.gameState.board[r + 2][c + 2] === player &&
                    this.gameState.board[r + 3][c + 3] === player) {
                    slots.push({row: r, col: c}, {row: r + 1, col: c + 1}, {row: r + 2, col: c + 2}, {row: r + 3, col: c + 3});
                    return slots;
                }
            }
        }

        // Check diagonal (top-right to bottom-left)
        for (let r = Math.max(0, row - 3); r <= Math.min(this.gameState.rows - 4, row); r++) {
            for (let c = Math.min(this.gameState.cols - 1, col + 3); c >= Math.max(3, col); c--) {
                if (this.gameState.board[r][c] === player &&
                    this.gameState.board[r + 1][c - 1] === player &&
                    this.gameState.board[r + 2][c - 2] === player &&
                    this.gameState.board[r + 3][c - 3] === player) {
                    slots.push({row: r, col: c}, {row: r + 1, col: c - 1}, {row: r + 2, col: c - 2}, {row: r + 3, col: c - 3});
                    return slots;
                }
            }
        }

        return slots;
    }

    showModal(message) {
        const modal = document.getElementById('gameOverModal');
        const messageElement = document.getElementById('modalMessage');
        messageElement.textContent = message;
        modal.classList.add('show');
    }

    hideModal() {
        const modal = document.getElementById('gameOverModal');
        modal.classList.remove('show');
    }

    handleUndo() {
        if (this.gameState.moveHistory.length === 0 || this.gameState.gameOver) return;

        // Get the last move
        const lastMove = this.gameState.moveHistory.pop();
        
        // Only allow undoing if it was the other player's move
        if (lastMove.player === this.gameState.currentPlayer) {
            // If it was current player's move, put it back and return
            this.gameState.moveHistory.push(lastMove);
            return;
        }

        // Remove the move from the board
        this.gameState.board[lastMove.row][lastMove.col] = null;
        
        // Switch back to the previous player
        this.gameState.currentPlayer = lastMove.player;
        
        // Update game state
        this.gameState.gameOver = false;
        this.updateBoard();
        this.updateStatus();
    }

    updateUndoButton() {
        const undoBtn = document.getElementById('undo');
        undoBtn.disabled = this.gameState.moveHistory.length === 0;
    }
}

// Main game initialization
document.addEventListener('DOMContentLoaded', () => {
    const gameState = new GameState();
    const gameUI = new GameUI(gameState);
}); 