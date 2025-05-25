document.addEventListener('DOMContentLoaded', () => {
    const gameBoardElement = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const newGameButton = document.getElementById('new-game-button');
    const gameOverMessageElement = document.getElementById('game-over-message');
    const finalScoreElement = document.getElementById('final-score');
    const tryAgainButton = document.getElementById('try-again-button');

    const gridSize = 4;
    let board = []; 
    let score = 0;
    let isGameOver = false;

    // --- 1. GAME INITIALIZATION ---
    function initializeBoardArray() {
        board = []; 
        for (let r = 0; r < gridSize; r++) {
            board[r] = []; 
            for (let c = 0; c < gridSize; c++) {
                board[r][c] = 0; 
            }
        }
    }

    function startGame() {
        console.log("Starting new game...");
        isGameOver = false;
        score = 0;
        initializeBoardArray(); 
        
        addRandomTile(); 
        addRandomTile(); 
        
        renderBoard(); 
        updateScoreDisplay();
        if (gameOverMessageElement) gameOverMessageElement.classList.add('hidden'); 
    }

    // --- 2. RENDERING THE BOARD ---
    function renderBoard() {
        gameBoardElement.innerHTML = ''; 
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const tileValue = board[r][c];
                const tileElement = document.createElement('div');
                tileElement.classList.add('tile'); 
                
                if (tileValue !== 0) {
                    tileElement.textContent = tileValue;
                    tileElement.classList.add(`tile-${tileValue}`); 
                    if (tileValue > 2048) { 
                        tileElement.classList.add('tile-super');
                    }
                }
                gameBoardElement.appendChild(tileElement);
            }
        }
    }

    function updateScoreDisplay() {
        if (scoreElement) scoreElement.textContent = score;
    }

    // --- 3. ADDING RANDOM TILES ---
    function getEmptyCells() {
        const emptyCells = [];
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (board[r][c] === 0) {
                    emptyCells.push({ r, c }); 
                }
            }
        }
        return emptyCells;
    }

    function addRandomTile() {
        const emptyCells = getEmptyCells();
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            board[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    // --- 4. HANDLING PLAYER INPUT ---
    document.addEventListener('keydown', handleKeyPress);

    function handleKeyPress(event) {
        if (isGameOver) return; 

        let boardChanged = false; 
        switch (event.key) {
            case 'ArrowUp':
                boardChanged = moveTilesUp(); 
                event.preventDefault(); 
                break;
            case 'ArrowDown':
                boardChanged = moveTilesDown(); 
                event.preventDefault();
                break;
            case 'ArrowLeft':
                boardChanged = moveTilesLeft(); 
                event.preventDefault();
                break;
            case 'ArrowRight':
                boardChanged = moveTilesRight(); 
                event.preventDefault();
                break;
            default:
                return; 
        }

        if (boardChanged) {
            addRandomTile();    
            renderBoard();      
            updateScoreDisplay(); 
            
            if (checkGameOver()) { // Check for game over after a successful move
                endGame();
            }
        }
    }

    // --- 5. MOVEMENT LOGIC ---
    function processRowLeft(row) {
        let filteredRow = row.filter(val => val !== 0);
        for (let i = 0; i < filteredRow.length - 1; i++) {
            if (filteredRow[i] === filteredRow[i+1]) {
                filteredRow[i] *= 2; 
                score += filteredRow[i]; 
                filteredRow.splice(i + 1, 1); 
            }
        }
        const newRow = [];
        for (let i = 0; i < gridSize; i++) {
            newRow[i] = filteredRow[i] || 0; 
        }
        return newRow;
    }

    function moveTilesLeft() {
        let boardChanged = false;
        for (let r = 0; r < gridSize; r++) {
            const originalRow = [...board[r]]; 
            const newRow = processRowLeft([...board[r]]); 
            board[r] = newRow; 
            if (!originalRow.every((val, index) => val === newRow[index])) {
                boardChanged = true;
            }
        }
        return boardChanged;
    }

    function moveTilesRight() {
        let boardChanged = false;
        for (let r = 0; r < gridSize; r++) {
            const originalRow = [...board[r]];
            const reversedRow = [...originalRow].reverse();
            const processedReversedRow = processRowLeft(reversedRow); 
            const newRow = processedReversedRow.reverse();
            board[r] = newRow;
            if (!originalRow.every((val, index) => val === newRow[index])) {
                boardChanged = true;
            }
        }
        return boardChanged;
    }

    function transposeBoard(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const newMatrix = [];
        for (let j = 0; j < cols; j++) {
            newMatrix[j] = [];
            for (let i = 0; i < rows; i++) {
                newMatrix[j][i] = matrix[i][j];
            }
        }
        return newMatrix;
    }

    function moveTilesUp() {
        let boardChanged = false;
        let tempBoard = transposeBoard(board); 
        for (let r = 0; r < gridSize; r++) { 
            const originalColAsRow = [...tempBoard[r]];
            const newColAsRow = processRowLeft([...originalColAsRow]); 
            tempBoard[r] = newColAsRow;
            if (!originalColAsRow.every((val, index) => val === newColAsRow[index])) {
                boardChanged = true;
            }
        }
        if (boardChanged) {
            board = transposeBoard(tempBoard); 
        }
        return boardChanged;
    }

    function moveTilesDown() {
        let boardChanged = false;
        let tempBoard = transposeBoard(board); 
        for (let r = 0; r < gridSize; r++) { 
            const originalColAsRow = [...tempBoard[r]];
            const reversedColAsRow = [...originalColAsRow].reverse();
            const processedReversedColAsRow = processRowLeft(reversedColAsRow);
            const newColAsRow = processedReversedColAsRow.reverse();
            tempBoard[r] = newColAsRow;
            if (!originalColAsRow.every((val, index) => val === newColAsRow[index])) {
                boardChanged = true;
            }
        }
        if (boardChanged) {
            board = transposeBoard(tempBoard); 
        }
        return boardChanged;
    }

    // --- 6. GAME OVER LOGIC ---
    function canAnyTileMove() {
        // Check for empty cells
        if (getEmptyCells().length > 0) {
            return true; // Moves are possible if there are empty cells
        }

        // Check for possible horizontal merges
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize - 1; c++) {
                if (board[r][c] === board[r][c+1]) {
                    return true; // Horizontal merge possible
                }
            }
        }

        // Check for possible vertical merges
        for (let c = 0; c < gridSize; c++) {
            for (let r = 0; r < gridSize - 1; r++) {
                if (board[r][c] === board[r+1][c]) {
                    return true; // Vertical merge possible
                }
            }
        }
        return false; // No empty cells and no possible merges
    }

    function checkGameOver() {
        if (!canAnyTileMove()) {
            isGameOver = true; // Set the game over flag
            return true;       // Signal that game is over
        }
        return false;          // Game is not over
    } 

    function endGame() {
        console.log("Game Over! Final Score:", score);
        isGameOver = true; // Ensure flag is set
        if(finalScoreElement) finalScoreElement.textContent = score;
        if(gameOverMessageElement) gameOverMessageElement.classList.remove('hidden'); // Show game over message
    }

    // --- Event Listeners for Buttons ---
    if (newGameButton) newGameButton.addEventListener('click', startGame);
    if (tryAgainButton) tryAgainButton.addEventListener('click', startGame);

    // --- Initial Game Start ---
    startGame();
});
