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
            
            if (checkGameOver()) { 
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

    function moveTilesLeft() { /* ... (same as before) ... */ 
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
    function moveTilesRight() { /* ... (same as before) ... */ 
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
    function transposeBoard(matrix) { /* ... (same as before) ... */ 
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
    function moveTilesUp() { /* ... (same as before, without internal console logs unless needed for specific up/down debug) ... */
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
    function moveTilesDown() { /* ... (same as before, without internal console logs unless needed for specific up/down debug) ... */
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
        console.log("Checking canAnyTileMove...");
        // 1. Check for empty cells
        if (getEmptyCells().length > 0) {
            console.log("canAnyTileMove: Found empty cells. Returning true (moves possible).");
            return true; 
        }

        // 2. Check for possible horizontal merges (only if no empty cells)
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize - 1; c++) {
                // Check if current tile is not zero AND matches the one to its right
                if (board[r][c] !== 0 && board[r][c] === board[r][c + 1]) {
                    console.log(`canAnyTileMove: Horizontal merge possible at [${r},${c}] and [${r},${c+1}] with value ${board[r][c]}. Returning true.`);
                    return true; 
                }
            }
        }

        // 3. Check for possible vertical merges (only if no empty cells and no horizontal merges)
        for (let c = 0; c < gridSize; c++) { // Iterate through columns first
            for (let r = 0; r < gridSize - 1; r++) { // Iterate through rows
                // Check if current tile is not zero AND matches the one below it
                if (board[r][c] !== 0 && board[r][c] === board[r + 1][c]) {
                    console.log(`canAnyTileMove: Vertical merge possible at [${r},${c}] and [${r+1},${c}] with value ${board[r][c]}. Returning true.`);
                    return true; 
                }
            }
        }

        console.log("canAnyTileMove: No empty cells and no possible merges. Returning false (no moves possible).");
        return false; 
    }

    function checkGameOver() {
        if (!canAnyTileMove()) {
            console.log("checkGameOver: No moves possible, game is over.");
            return true; // Game is over
        }
        console.log("checkGameOver: Moves still possible.");
        return false; // Game is not over
    } 

    function endGame() {
        isGameOver = true; 
        console.log("endGame called! Final Score:", score); // Check if this function is called
        if(finalScoreElement) {
            finalScoreElement.textContent = score;
            console.log("Final score element updated.");
        } else {
            console.error("finalScoreElement not found!");
        }
        if(gameOverMessageElement) {
            gameOverMessageElement.classList.remove('hidden');
            console.log("Game over message displayed.");
        } else {
            console.error("gameOverMessageElement not found!");
        }
    }

    // --- Event Listeners for Buttons ---
    if (newGameButton) newGameButton.addEventListener('click', startGame);
    if (tryAgainButton) tryAgainButton.addEventListener('click', startGame);

    // --- Initial Game Start ---
    startGame();
});
