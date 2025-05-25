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
        // console.log("Board rendered."); 
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

    // --- 4. HANDLING PLAYER INPUT ---
    document.addEventListener('keydown', handleKeyPress);

    function handleKeyPress(event) {
        if (isGameOver) return; 

        let boardChanged = false; 
        switch (event.key) {
            case 'ArrowUp':
                console.log("Key pressed: ArrowUp"); // Should see this
                boardChanged = moveTilesUp(); 
                event.preventDefault(); 
                break;
            case 'ArrowDown':
                console.log("Key pressed: ArrowDown"); // Should see this
                boardChanged = moveTilesDown(); 
                event.preventDefault();
                break;
            case 'ArrowLeft':
                // console.log("Key pressed: ArrowLeft"); // Already working, so console log can be optional
                boardChanged = moveTilesLeft(); 
                event.preventDefault();
                break;
            case 'ArrowRight':
                // console.log("Key pressed: ArrowRight"); // Already working
                boardChanged = moveTilesRight(); 
                event.preventDefault();
                break;
            default:
                return; 
        }

        if (boardChanged) {
            console.log("Board changed after move, adding random tile and re-rendering.");
            addRandomTile();    
            renderBoard();      
            updateScoreDisplay(); 
            // if (checkGameOver()) { endGame(); }
        } else {
            console.log("No change in board after key press or move not fully implemented for this direction.");
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
        console.log("moveTilesUp called. Initial board:", JSON.parse(JSON.stringify(board)));
        let boardChanged = false;
        let tempBoard = transposeBoard(board); 
        console.log("Transposed board for UP:", JSON.parse(JSON.stringify(tempBoard)));

        for (let r = 0; r < gridSize; r++) { 
            const originalColAsRow = [...tempBoard[r]]; // This is a copy of the column (now a row)
            const newColAsRow = processRowLeft([...originalColAsRow]); // Process it (slide/merge "left")
            tempBoard[r] = newColAsRow; // Update the row in the transposed board
            console.log(`UP: Col ${r} (as row) original: [${originalColAsRow.join(',')}] -> new: [${newColAsRow.join(',')}]`);

            if (!originalColAsRow.every((val, index) => val === newColAsRow[index])) {
                boardChanged = true;
                console.log(`UP: Col ${r} changed.`);
            }
        }

        if (boardChanged) {
            board = transposeBoard(tempBoard); 
            console.log("UP: Board changed, final board:", JSON.parse(JSON.stringify(board)));
        } else {
            console.log("UP: No changes to board according to logic.");
        }
        return boardChanged;
    }

    function moveTilesDown() {
        console.log("moveTilesDown called. Initial board:", JSON.parse(JSON.stringify(board)));
        let boardChanged = false;
        let tempBoard = transposeBoard(board); 
        console.log("Transposed board for DOWN:", JSON.parse(JSON.stringify(tempBoard)));

        for (let r = 0; r < gridSize; r++) { 
            const originalColAsRow = [...tempBoard[r]];
            
            const reversedColAsRow = [...originalColAsRow].reverse();
            console.log(`DOWN: Col ${r} (as row) original: [${originalColAsRow.join(',')}], reversed for processing: [${reversedColAsRow.join(',')}]`);
            const processedReversedColAsRow = processRowLeft(reversedColAsRow);
            const newColAsRow = processedReversedColAsRow.reverse();
            tempBoard[r] = newColAsRow;
            console.log(`DOWN: Col ${r} (as row) processed: [${processedReversedColAsRow.join(',')}], final newColAsRow: [${newColAsRow.join(',')}]`);


            if (!originalColAsRow.every((val, index) => val === newColAsRow[index])) {
                boardChanged = true;
                console.log(`DOWN: Col ${r} changed.`);
            }
        }

        if (boardChanged) {
            board = transposeBoard(tempBoard); 
            console.log("DOWN: Board changed, final board:", JSON.parse(JSON.stringify(board)));
        } else {
            console.log("DOWN: No changes to board according to logic.");
        }
        return boardChanged;
    }

    // --- 6. GAME OVER LOGIC (Placeholders) ---
    // function checkGameOver() { /* To be implemented */ return false; } 
    // function endGame() { /* To be implemented */ }

    // --- Event Listeners for Buttons ---
    if (newGameButton) newGameButton.addEventListener('click', startGame);
    if (tryAgainButton) tryAgainButton.addEventListener('click', startGame);

    // --- Initial Game Start ---
    startGame();
});
