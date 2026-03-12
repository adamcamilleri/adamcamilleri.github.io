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
        this.lastMove = null;
        this.initializeBoard();
        this.setupEventListeners();
        this.updateStatus();
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
        const grid = document.querySelector('.board-grid');

        grid.addEventListener('click', (e) => {
            const slot = e.target.closest('.slot');
            if (!slot) return;
            const col = parseInt(slot.getAttribute('data-col'));
            this.handleMove(col);
        });

        // Column hover highlight
        grid.addEventListener('mouseover', (e) => {
            const slot = e.target.closest('.slot');
            if (!slot || this.gameState.gameOver) return;
            const col = parseInt(slot.getAttribute('data-col'));
            this.showColumnHover(col);
        });

        grid.addEventListener('mouseout', () => {
            this.clearColumnHover();
        });

        document.getElementById('undo').addEventListener('click', () => this.handleUndo());

        document.getElementById('reset').addEventListener('click', () => {
            this.gameState.reset();
            this.lastMove = null;
            this.clearAnimations();
            this.updateBoard();
            this.updateStatus();
        });

        document.getElementById('playAgain').addEventListener('click', () => {
            this.hideModal();
            this.gameState.reset();
            this.lastMove = null;
            this.clearAnimations();
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

        this.lastMove = { row: result.row, col: result.col };
        this.updateBoard();
        this.updateStatus();
        this.updateScores();

        if (result.isWin) {
            // Delay win animation until after drop animation completes
            setTimeout(() => {
                this.showWinAnimation(result);
            }, 500);
        } else if (result.isDraw) {
            setTimeout(() => {
                this.showModal("It's a draw!");
            }, 500);
        }
    }

    updateBoard() {
        const slots = document.querySelectorAll('.slot');
        slots.forEach(slot => {
            const row = parseInt(slot.getAttribute('data-row'));
            const col = parseInt(slot.getAttribute('data-col'));
            const player = this.gameState.board[row][col];

            // Remove existing disc if any
            const existingDisc = slot.querySelector('.disc');

            if (player) {
                if (!existingDisc) {
                    // Create new disc
                    const disc = document.createElement('div');
                    disc.className = 'disc ' + player;

                    // Only animate the newly placed disc
                    if (this.lastMove && this.lastMove.row === row && this.lastMove.col === col) {
                        disc.classList.add('dropping');
                        disc.addEventListener('animationend', () => {
                            disc.classList.remove('dropping');
                        }, { once: true });
                    }

                    slot.appendChild(disc);
                }
            } else {
                if (existingDisc) {
                    existingDisc.remove();
                }
            }
        });

        this.updateUndoButton();
    }

    updateStatus() {
        const turnIndicators = document.querySelectorAll('.turn-indicator');
        turnIndicators.forEach(indicator => {
            indicator.classList.remove('active');
            const disc = indicator.querySelector('.disc');
            if (disc.classList.contains(this.gameState.currentPlayer)) {
                indicator.classList.add('active');
            }
        });

        document.getElementById('turnPlayer1').textContent = 'Player 1 (Red)';
        document.getElementById('turnPlayer2').textContent = 'Player 2 (Yellow)';
    }

    updateScores() {
        document.getElementById('score1').textContent = this.gameState.scores.red;
        document.getElementById('score2').textContent = this.gameState.scores.yellow;
    }

    showColumnHover(col) {
        this.clearColumnHover();
        if (this.gameState.isColumnFull(col)) return;

        const slots = document.querySelectorAll('.slot[data-col="' + col + '"]');
        slots.forEach(slot => {
            slot.classList.add('column-hover');
        });
    }

    clearColumnHover() {
        const hoveredSlots = document.querySelectorAll('.slot.column-hover');
        hoveredSlots.forEach(slot => {
            slot.classList.remove('column-hover');
        });
    }

    showWinAnimation(result) {
        const winningSlots = this.findWinningSlots(result.row, result.col);

        // Add glow to winning discs
        winningSlots.forEach(({ row, col }) => {
            const slot = document.querySelector('.slot[data-row="' + row + '"][data-col="' + col + '"]');
            if (slot) {
                const disc = slot.querySelector('.disc');
                if (disc) disc.classList.add('glow');
            }
        });

        // Dim all other occupied discs
        const allSlots = document.querySelectorAll('.slot');
        allSlots.forEach(slot => {
            const disc = slot.querySelector('.disc');
            if (disc && !disc.classList.contains('glow')) {
                disc.classList.add('dimmed');
            }
        });

        // Draw SVG winning line
        this.drawWinLine(winningSlots);

        // Show modal after line animation
        setTimeout(() => {
            this.showModal(result.player.toUpperCase() + ' wins!');
        }, 700);
    }

    drawWinLine(winningSlots) {
        if (winningSlots.length < 2) return;

        const boardContainer = document.querySelector('.board-container');
        const containerRect = boardContainer.getBoundingClientRect();

        const first = winningSlots[0];
        const last = winningSlots[winningSlots.length - 1];

        const firstSlot = document.querySelector('.slot[data-row="' + first.row + '"][data-col="' + first.col + '"]');
        const lastSlot = document.querySelector('.slot[data-row="' + last.row + '"][data-col="' + last.col + '"]');

        if (!firstSlot || !lastSlot) return;

        const firstRect = firstSlot.getBoundingClientRect();
        const lastRect = lastSlot.getBoundingClientRect();

        const x1 = firstRect.left + firstRect.width / 2 - containerRect.left;
        const y1 = firstRect.top + firstRect.height / 2 - containerRect.top;
        const x2 = lastRect.left + lastRect.width / 2 - containerRect.left;
        const y2 = lastRect.top + lastRect.height / 2 - containerRect.top;

        const winLine = document.querySelector('.win-line');
        if (!winLine) return;

        // Calculate line length for dasharray
        const lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

        winLine.setAttribute('x1', x1);
        winLine.setAttribute('y1', y1);
        winLine.setAttribute('x2', x2);
        winLine.setAttribute('y2', y2);
        winLine.setAttribute('stroke-dasharray', lineLength);
        winLine.setAttribute('stroke-dashoffset', lineLength);

        // Trigger draw animation
        requestAnimationFrame(() => {
            winLine.classList.add('animate');
        });
    }

    resetWinLine() {
        const winLine = document.querySelector('.win-line');
        if (!winLine) return;
        winLine.classList.remove('animate');
        winLine.setAttribute('x1', '0');
        winLine.setAttribute('y1', '0');
        winLine.setAttribute('x2', '0');
        winLine.setAttribute('y2', '0');
        winLine.setAttribute('stroke-dasharray', '500');
        winLine.setAttribute('stroke-dashoffset', '500');
    }

    clearAnimations() {
        // Clear disc animation classes
        document.querySelectorAll('.disc.dropping').forEach(d => d.classList.remove('dropping'));
        document.querySelectorAll('.disc.glow').forEach(d => d.classList.remove('glow'));
        document.querySelectorAll('.disc.dimmed').forEach(d => d.classList.remove('dimmed'));
        this.clearColumnHover();
        this.resetWinLine();
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

        const lastMove = this.gameState.moveHistory.pop();

        if (lastMove.player === this.gameState.currentPlayer) {
            this.gameState.moveHistory.push(lastMove);
            return;
        }

        this.gameState.board[lastMove.row][lastMove.col] = null;
        this.gameState.currentPlayer = lastMove.player;
        this.gameState.gameOver = false;

        this.lastMove = null;
        this.clearAnimations();
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
