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
        this.aiEnabled = true;
        this.aiPlayer = 'yellow';
        this.difficulty = 'medium';
        this.isMultiplayer = false;
        this.isHost = false;
        this.peerConnection = null;
        this.dataChannel = null;
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
        this.setupMultiplayer();
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
        // Use event delegation for board clicks
        const board = document.querySelector('.board-grid');
        board.addEventListener('click', (e) => {
            const slot = e.target.closest('.slot');
            if (!slot) return;
            
            const col = parseInt(slot.getAttribute('data-col'));
            this.handleMove(col);
        });

        // Column hover preview
        board.addEventListener('mouseover', (e) => {
            const slot = e.target.closest('.slot');
            if (!slot) return;
            
            const col = parseInt(slot.getAttribute('data-col'));
            this.showDropPreview(col);
        });

        board.addEventListener('mouseout', () => {
            this.hideDropPreview();
        });

        // Control buttons
        document.getElementById('newGame').addEventListener('click', () => this.handleNewGame());
        document.getElementById('undo').addEventListener('click', () => this.handleUndo());

        // Modal buttons
        document.getElementById('playAgain').addEventListener('click', () => {
            this.hideModal();
            this.resetGame();
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideModal();
        });
    }

    setupMultiplayer() {
        // Create multiplayer controls
        const controls = document.querySelector('.controls');
        const multiplayerControls = document.createElement('div');
        multiplayerControls.className = 'multiplayer-controls';
        multiplayerControls.innerHTML = `
            <div class="multiplayer-buttons">
                <button id="hostGame">Host Game</button>
                <button id="showJoinGame">Join Game</button>
            </div>
            <div class="connection-info" style="display: none;">
                <div class="connection-code" style="display: none;">
                    <p>Share this code with your friend:</p>
                    <div class="code-display">
                        <span id="connectionCode"></span>
                        <button id="copyCode">Copy</button>
                    </div>
                    <p class="connection-status">Waiting for opponent to join...</p>
                </div>
                <div class="join-game" style="display: none;">
                    <p>Enter the code from your friend:</p>
                    <div class="code-input">
                        <input type="text" id="connectionInput" placeholder="Paste code here">
                        <button id="joinGame">Join</button>
                    </div>
                    <p class="connection-status">Connecting...</p>
                </div>
            </div>
        `;
        controls.insertBefore(multiplayerControls, controls.firstChild);

        // Add multiplayer event listeners
        document.getElementById('hostGame').addEventListener('click', () => this.hostGame());
        document.getElementById('showJoinGame').addEventListener('click', () => this.showJoinGame());
        document.getElementById('copyCode').addEventListener('click', () => this.copyConnectionCode());
        document.getElementById('joinGame').addEventListener('click', () => this.joinGame());
    }

    showJoinGame() {
        const connectionInfo = document.querySelector('.connection-info');
        const joinGame = document.querySelector('.join-game');
        const connectionCode = document.querySelector('.connection-code');
        
        connectionInfo.style.display = 'block';
        joinGame.style.display = 'block';
        connectionCode.style.display = 'none';
    }

    async hostGame() {
        try {
            this.gameState.isHost = true;
            this.gameState.isMultiplayer = true;
            
            // Show connection UI
            const connectionInfo = document.querySelector('.connection-info');
            const joinGame = document.querySelector('.join-game');
            const connectionCode = document.querySelector('.connection-code');
            
            connectionInfo.style.display = 'block';
            joinGame.style.display = 'none';
            connectionCode.style.display = 'block';
            
            // Create peer connection
            this.gameState.peerConnection = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            });
            
            // Create data channel
            this.gameState.dataChannel = this.gameState.peerConnection.createDataChannel('gameData');
            this.setupDataChannel(this.gameState.dataChannel);

            // Create and set local description
            const offer = await this.gameState.peerConnection.createOffer();
            await this.gameState.peerConnection.setLocalDescription(offer);

            // Generate a shorter, more user-friendly code
            const shortCode = this.generateShortCode();
            document.getElementById('connectionCode').textContent = shortCode;

            // Store the full offer in a temporary map (in a real app, this would be server-side)
            if (!window.gameCodes) window.gameCodes = new Map();
            window.gameCodes.set(shortCode, offer);

            // Handle ICE candidates
            this.gameState.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.gameState.dataChannel.send(JSON.stringify({
                        type: 'ice-candidate',
                        candidate: event.candidate
                    }));
                }
            };

            // Handle answer
            this.gameState.dataChannel.onmessage = async (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'answer') {
                    await this.gameState.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
                    document.querySelector('.connection-status').textContent = 'Connected! Game starting...';
                    this.resetGame();
                } else if (data.type === 'ice-candidate') {
                    await this.gameState.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                } else if (data.type === 'move') {
                    this.handleRemoteMove(data.col);
                }
            };
        } catch (error) {
            console.error('Error hosting game:', error);
            alert('Failed to host game. Please try again.');
        }
    }

    generateShortCode() {
        const words = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE', 'PINK', 'BLACK', 'WHITE', 'GRAY'];
        const numbers = Array.from({length: 100}, (_, i) => i.toString().padStart(2, '0'));
        const randomWord = words[Math.floor(Math.random() * words.length)];
        const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
        return `${randomWord}-${randomNumber}`;
    }

    async joinGame() {
        try {
            this.gameState.isHost = false;
            this.gameState.isMultiplayer = true;

            const shortCode = document.getElementById('connectionInput').value.trim().toUpperCase();
            if (!shortCode) {
                alert('Please enter a connection code');
                return;
            }

            // Retrieve the full offer from the temporary map
            const offer = window.gameCodes?.get(shortCode);
            if (!offer) {
                alert('Invalid connection code');
                return;
            }

            // Create peer connection
            this.gameState.peerConnection = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            });
            
            // Setup data channel
            this.gameState.peerConnection.ondatachannel = (event) => {
                this.gameState.dataChannel = event.channel;
                this.setupDataChannel(this.gameState.dataChannel);
            };

            // Set remote description
            await this.gameState.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

            // Create and send answer
            const answer = await this.gameState.peerConnection.createAnswer();
            await this.gameState.peerConnection.setLocalDescription(answer);

            this.gameState.dataChannel.send(JSON.stringify({
                type: 'answer',
                answer: answer
            }));

            // Handle ICE candidates
            this.gameState.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.gameState.dataChannel.send(JSON.stringify({
                        type: 'ice-candidate',
                        candidate: event.candidate
                    }));
                }
            };

            document.querySelector('.connection-status').textContent = 'Connecting...';
        } catch (error) {
            console.error('Error joining game:', error);
            alert('Failed to join game. Please check the connection code and try again.');
        }
    }

    setupDataChannel(dataChannel) {
        dataChannel.onopen = () => {
            console.log('Data channel opened');
            document.querySelector('.connection-status').textContent = 'Connected!';
            this.updateStatus();
        };

        dataChannel.onclose = () => {
            console.log('Data channel closed');
            document.querySelector('.connection-status').textContent = 'Connection lost';
            alert('Connection lost. Please refresh the page to start a new game.');
        };

        dataChannel.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'move') {
                this.handleRemoteMove(data.col);
            }
        };
    }

    handleRemoteMove(col) {
        if (this.gameState.currentPlayer === 'red' && !this.gameState.isHost) {
            this.handleMove(col);
        }
    }

    copyConnectionCode() {
        const code = document.getElementById('connectionCode').textContent;
        navigator.clipboard.writeText(code).then(() => {
            alert('Connection code copied to clipboard!');
        }).catch(() => {
            alert('Failed to copy code. Please copy it manually.');
        });
    }

    resetGame() {
        // Reset game state
        this.gameState.reset();
        // Completely rebuild the board DOM
        this.initializeBoard();
        this.updateStatus();
    }

    handleMove(col) {
        const result = this.gameState.makeMove(col);
        if (!result) return;

        this.updateBoard();
        this.updateStatus();
        this.updateScores();

        // Send move to other player in multiplayer mode
        if (this.gameState.isMultiplayer && this.gameState.dataChannel) {
            this.gameState.dataChannel.send(JSON.stringify({
                type: 'move',
                col: col
            }));
        }

        if (result.isWin) {
            this.showWinAnimation(result);
            this.showModal(`${result.player.toUpperCase()} wins!`);
        } else if (result.isDraw) {
            this.showModal("It's a draw!");
        } else if (this.gameState.aiEnabled && this.gameState.currentPlayer === this.gameState.aiPlayer) {
            setTimeout(() => this.makeAIMove(), 500);
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
        const undoBtn = document.getElementById('undo');
        undoBtn.disabled = this.gameState.moveHistory.length === 0;
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
        if (this.gameState.isMultiplayer) {
            playerNames[0].textContent = this.gameState.isHost ? 'You (Red)' : 'Opponent (Red)';
            playerNames[1].textContent = this.gameState.isHost ? 'Opponent (Yellow)' : 'You (Yellow)';
        } else {
            playerNames[0].textContent = 'Player 1 (Red)';
            playerNames[1].textContent = 'Player 2 (Yellow)';
        }
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

    hideDropPreview() {
        document.querySelectorAll('.slot.preview').forEach(slot => {
            slot.classList.remove('preview', 'red', 'yellow');
        });
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

    handleNewGame() {
        // Reset game state without affecting scores
        this.gameState.reset();
        // Completely rebuild the board DOM
        this.initializeBoard();
        this.updateStatus();
    }

    handleUndo() {
        if (this.gameState.moveHistory.length === 0 || this.gameState.gameOver) return;

        const lastMove = this.gameState.moveHistory.pop();
        this.gameState.board[lastMove.row][lastMove.col] = null;
        this.gameState.currentPlayer = lastMove.player;
        this.gameState.gameOver = false;
        this.updateBoard();
        this.updateStatus();
    }

    makeAIMove() {
        if (this.gameState.gameOver) return;
        const gameAI = new GameAI(this.gameState);
        const col = gameAI.findBestMove();
        this.handleMove(col);
    }

    findBestMove() {
        return this.findMinimaxMove(4); // Always use minimax with depth 4
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
}

// AI management
class GameAI {
    constructor(gameState) {
        this.gameState = gameState;
    }

    findMinimaxMove(depth) {
        let bestScore = -Infinity;
        let bestMove = 0;

        for (let col = 0; col < this.gameState.cols; col++) {
            if (this.gameState.isColumnFull(col)) continue;

            const row = this.gameState.getLowestEmptyRow(col);
            this.gameState.board[row][col] = this.gameState.aiPlayer;
            
            const score = this.minimax(depth - 1, false);
            this.gameState.board[row][col] = null;

            if (score > bestScore) {
                bestScore = score;
                bestMove = col;
            }
        }

        return bestMove;
    }

    minimax(depth, isMaximizing) {
        if (depth === 0) return this.evaluateBoard();

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let col = 0; col < this.gameState.cols; col++) {
                if (this.gameState.isColumnFull(col)) continue;
                
                const row = this.gameState.getLowestEmptyRow(col);
                this.gameState.board[row][col] = this.gameState.aiPlayer;
                
                const score = this.minimax(depth - 1, false);
                this.gameState.board[row][col] = null;
                
                bestScore = Math.max(score, bestScore);
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let col = 0; col < this.gameState.cols; col++) {
                if (this.gameState.isColumnFull(col)) continue;
                
                const row = this.gameState.getLowestEmptyRow(col);
                this.gameState.board[row][col] = this.gameState.currentPlayer;
                
                const score = this.minimax(depth - 1, true);
                this.gameState.board[row][col] = null;
                
                bestScore = Math.min(score, bestScore);
            }
            return bestScore;
        }
    }

    evaluateBoard() {
        // Implement board evaluation logic
        // Consider factors like:
        // - Number of potential winning combinations
        // - Center control
        // - Connected pieces
        return 0; // Placeholder
    }

    // ... implement other AI methods ...
}

// Main game initialization
document.addEventListener('DOMContentLoaded', () => {
    const gameState = new GameState();
    const gameUI = new GameUI(gameState);
    const gameAI = new GameAI(gameState);
}); 