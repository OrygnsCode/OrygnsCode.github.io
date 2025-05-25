document.addEventListener('DOMContentLoaded', () => {
    const gameBoardElement = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const newGameButton = document.getElementById('new-game-button');
    const gameOverMessageElement = document.getElementById('game-over-message');
    const finalScoreElement = document.getElementById('final-score');
    const tryAgainButton = document.getElementById('try-again-button');
    const youWinMessageElement = document.getElementById('you-win-message');
    const keepPlayingButton = document.getElementById('keep-playing-button');
    const newGameFromWinButton = document.getElementById('new-game-from-win-button');

    const gridSize = 4;
    const targetTile = 2048;
    let board = [];
    let score = 0;
    let isGameOver = false;
    let hasWon = false;

    let touchStartX = 0, touchStartY = 0, touchEndX = 0, touchEndY = 0;
    const swipeThreshold = 30;

    // --- Constants for dimension calculations (use fixed values for reliability for now) ---
    const JS_CELL_GAP = 12; // Corresponds to a likely value from your CSS clamp(5px, 2vmin, 12px)
    const JS_BOARD_PADDING = 12; // Corresponds to a likely value from your CSS clamp(5px, 2vmin, 12px)
    let cellSize = 0;
    let newlyAddedTileInfo = null;

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

    function calculateDimensions() {
        if (!gameBoardElement) {
            console.error("!!! calculateDimensions: gameBoardElement not found!");
            return;
        }
        const boardStyle = getComputedStyle(gameBoardElement);
        const boardClientWidth = gameBoardElement.clientWidth; // Width INSIDE its own CSS padding

        // Use JS_CELL_GAP for calculations involving absolutely positioned tiles
        cellSize = (boardClientWidth - (gridSize - 1) * JS_CELL_GAP) / gridSize;

        console.log(`DIMENSIONS: ClientWidth=${boardClientWidth}, JS_CELL_GAP=${JS_CELL_GAP}, Calculated CellSize=${cellSize}`);
        
        if (isNaN(cellSize) || cellSize <= 0) {
            console.error("!!! Calculated cellSize is invalid! Using fallback.", cellSize);
            cellSize = 80; // Fallback
        }
    }

    function createBackgroundGrid() {
        if (!gameBoardElement) return;
        const existingBgCells = gameBoardElement.querySelectorAll('.grid-cell');
        existingBgCells.forEach(cell => cell.remove());
        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            gameBoardElement.appendChild(cell);
        }
        console.log("INIT: Background grid created.");
    }

    function startGame() {
        console.log("INIT: Starting new game...");
        isGameOver = false;
        hasWon = false;
        score = 0;

        createBackgroundGrid();
        calculateDimensions(); // Call this *after* background grid might affect layout, and *before* first render
        
        initializeBoardArray();
        addRandomTile(true);
        addRandomTile(true);
        
        renderBoard(true); // Initial render

        updateScoreDisplay();
        if (gameOverMessageElement) gameOverMessageElement.classList.add('hidden');
        if (youWinMessageElement) youWinMessageElement.classList.add('hidden');
        console.log("INIT: Game started. Initial board state:", JSON.parse(JSON.stringify(board)));
    }

    // --- 2. RENDERING THE BOARD ---
    function renderBoard(isInitialRender = false) {
        if (!gameBoardElement || cellSize <= 0) {
            console.error("!!! RENDER: Cannot render board. gameBoardElement or cellSize invalid.");
            return;
        }
        const existingNumberedTiles = gameBoardElement.querySelectorAll('.tile:not(.grid-cell)');
        existingNumberedTiles.forEach(tile => tile.remove());

        console.log("RENDER: Rendering board. Data:", JSON.parse(JSON.stringify(board)));

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const tileValue = board[r][c];
                if (tileValue !== 0) {
                    const tileElement = document.createElement('div');
                    tileElement.classList.add('tile');
                    tileElement.classList.add(`tile-${tileValue}`);
                    if (tileValue > 2048) tileElement.classList.add('tile-super');
                    tileElement.textContent = tileValue;

                    tileElement.style.width = `${cellSize}px`;
                    tileElement.style.height = `${cellSize}px`;
                    // Positioning is relative to the content-box of #game-board
                    // The background grid cells are laid out by the parent grid's padding and gap.
                    // The numbered tiles are laid out on top, aligned with where these background cells would be.
                    tileElement.style.top = `${r * (cellSize + JS_CELL_GAP)}px`;
                    tileElement.style.left = `${c * (cellSize + JS_CELL_GAP)}px`;
                    
                    gameBoardElement.appendChild(tileElement);
                    console.log(`RENDER: Placed tile ${tileValue} at [${r},${c}] -> left: ${tileElement.style.left}, top: ${tileElement.style.top}, size: ${tileElement.style.width}`);

                    if (newlyAddedTileInfo && newlyAddedTileInfo.r === r && newlyAddedTileInfo.c === c && !isInitialRender) {
                        console.log("RENDER: Animating new tile:", newlyAddedTileInfo);
                        tileElement.classList.add('tile-new');
                        // CSS animation 'appear' with 'forwards' is in style.css
                    }
                }
            }
        }
        newlyAddedTileInfo = null;
    }

    function updateScoreDisplay() { if (scoreElement) scoreElement.textContent = score; }

    // --- 3. ADDING RANDOM TILES ---
    function getEmptyCells() { /* ... (same as before) ... */ }
    function addRandomTile(isInitialSetup = false) {
        const emptyCells = getEmptyCells();
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const newValue = Math.random() < 0.9 ? 2 : 4;
            board[randomCell.r][randomCell.c] = newValue;
            console.log(`LOGIC: Added tile ${newValue} at [${randomCell.r},${randomCell.c}]`);
            if (!isInitialSetup) {
                newlyAddedTileInfo = { r: randomCell.r, c: randomCell.c };
            }
        } else {
            console.log("LOGIC: No empty cells to add a random tile.");
        }
    }
    
    // --- 4. HANDLING PLAYER INPUT & MOVES ---
    function processMove(boardChanged, direction) { // Added direction for logging
        console.log(`PROCESSMOVE: After ${direction} move, boardChanged is: ${boardChanged}`);
        if (boardChanged) {
            addRandomTile(); 
            renderBoard();   
            updateScoreDisplay(); 
            if (!hasWon && checkWinCondition()) { showWinMessage(); return; }
            if (!hasWon && checkGameOver()) { endGame(); }
        }
    }

    document.addEventListener('keydown', handleKeyPress);
    function handleKeyPress(event) {
        if ((isGameOver && !hasWon) || (youWinMessageElement && !youWinMessageElement.classList.contains('hidden'))) {
            return;
        }
        let boardChanged = false; 
        let direction = null;
        switch (event.key) {
            case 'ArrowUp': direction = 'Up'; boardChanged = moveTilesUp(); event.preventDefault(); break;
            case 'ArrowDown': direction = 'Down'; boardChanged = moveTilesDown(); event.preventDefault(); break;
            case 'ArrowLeft': direction = 'Left'; boardChanged = moveTilesLeft(); event.preventDefault(); break;
            case 'ArrowRight': direction = 'Right'; boardChanged = moveTilesRight(); event.preventDefault(); break;
            default: return; 
        }
        // Log boardChanged value *after* it's assigned by the move function
        console.log(`INPUT: Key pressed: ${direction}. Result from move function (boardChanged): ${boardChanged}`);
        processMove(boardChanged, direction);
    }

    gameBoardElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameBoardElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    gameBoardElement.addEventListener('touchend', handleTouchEnd, { passive: false });
    function handleTouchStart(event) {touchStartX = event.touches[0].clientX; touchStartY = event.touches[0].clientY;}
    function handleTouchMove(event) {event.preventDefault();}
    function handleTouchEnd(event) {
        if ((isGameOver && !hasWon) || (youWinMessageElement && !youWinMessageElement.classList.contains('hidden'))) return;
        touchEndX = event.changedTouches[0].clientX;
        touchEndY = event.changedTouches[0].clientY;
        handleSwipe();
    }
    function handleSwipe() {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        let boardChanged = false;
        let direction = "None";
        if (Math.abs(deltaX) > Math.abs(deltaY)) { 
            if (Math.abs(deltaX) > swipeThreshold) { 
                if (deltaX > 0) { direction = 'Right'; boardChanged = moveTilesRight(); } 
                else { direction = 'Left'; boardChanged = moveTilesLeft(); }
            }
        } else { 
            if (Math.abs(deltaY) > swipeThreshold) { 
                if (deltaY > 0) { direction = 'Down'; boardChanged = moveTilesDown(); } 
                else { direction = 'Up'; boardChanged = moveTilesUp(); }
            }
        }
        console.log(`INPUT: Swipe: ${direction}. Result from move function (boardChanged): ${boardChanged}`);
        processMove(boardChanged, direction);
    }

    // --- 5. MOVEMENT LOGIC ---
    function processRowLeft(row) { /* ... (same as before) ... */ }
    // ALL MOVEMENT FUNCTIONS: Add console log before returning boardChanged
    function moveTilesLeft() { 
        let boardChanged = false;
        for (let r = 0; r < gridSize; r++) { /* ... main logic ... */ }
        console.log("MOVEFUNC: moveTilesLeft returning:", boardChanged);
        return boardChanged;
    }
    function moveTilesRight() { 
        let boardChanged = false;
        for (let r = 0; r < gridSize; r++) { /* ... main logic ... */ }
        console.log("MOVEFUNC: moveTilesRight returning:", boardChanged);
        return boardChanged;
    }
    function transposeBoard(matrix) { /* ... (same as before) ... */ }
    function moveTilesUp() { 
        let boardChanged = false;
        /* ... main logic with transpose ... */
        if (boardChanged) { board = transposeBoard(tempBoard); }
        console.log("MOVEFUNC: moveTilesUp returning:", boardChanged);
        return boardChanged;
    }
    function moveTilesDown() { 
        let boardChanged = false;
        /* ... main logic with transpose ... */
        if (boardChanged) { board = transposeBoard(tempBoard); }
        console.log("MOVEFUNC: moveTilesDown returning:", boardChanged);
        return boardChanged;
    }
    // (Make sure to copy the full logic for L,R,U,D from the previous working version, just add the log before return)
    // For brevity here, I'm not repeating the full identical internal logic of move functions if it was confirmed working for L/R.
    // The key is the explicit log before the return statement.

    // --- PASTE THE FULL WORKING moveTilesLeft, moveTilesRight, moveTilesUp, moveTilesDown from previous script here, ---
    // --- THEN ADD THE `console.log("MOVEFUNC: ... returning:", boardChanged);` line right before each `return boardChanged;` ---
    // For example, moveTilesLeft should look like this:
    // function moveTilesLeft() {
    //     let boardChanged = false;
    //     for (let r = 0; r < gridSize; r++) {
    //         const originalRow = [...board[r]]; 
    //         const newRow = processRowLeft([...board[r]]); 
    //         board[r] = newRow; 
    //         if (!originalRow.every((val, index) => val === newRow[index])) {
    //             boardChanged = true;
    //         }
    //     }
    //     console.log("MOVEFUNC: moveTilesLeft returning:", boardChanged); // ADD THIS
    //     return boardChanged;
    // }
    // Do similarly for moveTilesRight, moveTilesUp, moveTilesDown. I will provide the full block again below.


    // --- 6. GAME STATE LOGIC (WIN/GAME OVER) ---
    function checkWinCondition() { /* ... (same as before) ... */ }
    function showWinMessage() { /* ... (same as before) ... */ }
    function canAnyTileMove() { /* ... (same as before) ... */ }
    function checkGameOver() { /* ... (same as before) ... */ } 
    function endGame() { /* ... (same as before) ... */ }

    // --- Event Listeners for Buttons ---
    if (newGameButton) newGameButton.addEventListener('click', startGame);
    if (tryAgainButton) tryAgainButton.addEventListener('click', startGame);
    if (keepPlayingButton) keepPlayingButton.addEventListener('click', () => { /* ... */ });
    if (newGameFromWinButton) newGameFromWinButton.addEventListener('click', startGame);
    
    window.addEventListener('resize', () => {
        console.log("Window resized event triggered.");
        calculateDimensions();
        renderBoard(true); 
    });

    // --- Initial Game Start ---
    startGame(); 
});


// --- FULL MOVEMENT LOGIC SECTION TO REPLACE SECTION 5 ABOVE ---
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
    console.log("MOVEFUNC: moveTilesLeft returning:", boardChanged);
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
    console.log("MOVEFUNC: moveTilesRight returning:", boardChanged);
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
    console.log("MOVEFUNC: moveTilesUp returning:", boardChanged);
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
    console.log("MOVEFUNC: moveTilesDown returning:", boardChanged);
    return boardChanged;
}
// --- END OF FULL MOVEMENT LOGIC SECTION ---
