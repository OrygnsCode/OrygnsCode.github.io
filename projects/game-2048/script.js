document.addEventListener('DOMContentLoaded', () => {
    const gameBoardElement = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const newGameButton = document.getElementById('new-game-button');
    const gameOverMessageElement = document.getElementById('game-over-message');
    const finalScoreElement = document.getElementById('final-score');
    const tryAgainButton = document.getElementById('try-again-button');

    const gridSize = 4;
    let board = []; // 2D array representing the game board values
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

    // --- 2. RENDERING THE BOARD (Drawing tiles on the page) ---
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
        // console.log("Board rendered."); // Can be noisy, uncomment if debugging render
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
            // console.log(`Added tile ${board[randomCell.r][randomCell.c]} at row ${randomCell.r}, col ${randomCell.c}`);
        }
    }

    // --- 4. HANDLING PLAYER INPUT (Keyboard) ---
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
            
            // if (checkGameOver()) { // We will implement this later
            //     endGame();
            // }
        } else {
            // console.log("No change in board after key press.");
        }
    }

    // --- 5. MOVEMENT LOGIC ---

    // Helper function to process a single row for moving left (used by all movement functions via transforms)
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
        // if (boardChanged) console.log("Tiles moved/merged left.");
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
        // if (boardChanged) console.log("Tiles moved/merged right.");
        return boardChanged;
    }

    // Helper function to transpose the board (swap rows and columns)
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
        let tempBoard = transposeBoard(board); // Treat columns as rows

        for (let r = 0; r < gridSize; r++) { // Iterate through these "new rows" (original columns)
            const originalColAsRow = [...tempBoard[r]];
            const newColAsRow = processRowLeft([...originalColAsRow]); // Process left (which is "up" for original board)
            tempBoard[r] = newColAsRow;

            if (!originalColAsRow.every((val, index) => val === newColAsRow[index])) {
                boardChanged = true;
            }
        }

        if (boardChanged) {
            board = transposeBoard(tempBoard); // Transpose back to original orientation
            // console.log("Tiles moved/merged up.");
        }
        return boardChanged;
    }

    function moveTilesDown() {
        let boardChanged = false;
        let tempBoard = transposeBoard(board); // Treat columns as rows

        for (let r = 0; r < gridSize; r++) { // Iterate through these "new rows" (original columns)
            const originalColAsRow = [...tempBoard[r]];
            
            // To move "down" on original board, it's like moving "right" on these transposed rows
            const reversedColAsRow = [...originalColAsRow].reverse();
            const processedReversedColAsRow = processRowLeft(reversedColAsRow);
            const newColAsRow = processedReversedColAsRow.reverse();
            
            tempBoard[r] = newColAsRow;

            if (!originalColAsRow.every((val, index) => val === newColAsRow[index])) {
                boardChanged = true;
            }
        }

        if (boardChanged) {
            board = transposeBoard(tempBoard); // Transpose back
            // console.log("Tiles moved/merged down.");
        }
        return boardChanged;
    }


    // --- 6. GAME OVER LOGIC (Placeholders) ---
    // function checkGameOver() { /* To be implemented */ return false; } 
    // function endGame() {
    //     isGameOver = true;
    //     if(finalScoreElement) finalScoreElement.textContent = score;
    //     if(gameOverMessageElement) gameOverMessageElement.classList.remove('hidden');
    //     console.log("Game Over! Final Score:", score);
    // }

    // --- Event Listeners for Buttons ---
    if (newGameButton) newGameButton.addEventListener('click', startGame);
    if (tryAgainButton) tryAgainButton.addEventListener('click', startGame);

    // --- Initial Game Start when the page loads ---
    startGame();
});
