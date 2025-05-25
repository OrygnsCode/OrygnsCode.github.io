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

    // --- Constants for dimension calculations (use fixed values for JS reliability) ---
    const JS_CELL_GAP = 12; // This should visually match the 'gap' in your #game-board CSS
    let cellSize = 0;       // Will be calculated
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
            cellSize = 80; // Fallback if board element isn't ready
            return;
        }
        // clientWidth is the width of the content area, INSIDE padding, but INCLUDING scrollbar if present.
        // For a grid, it's the space where grid items (our background cells) are laid out.
        const boardClientWidth = gameBoardElement.clientWidth; 
        
        // cellSize is based on the clientWidth (area for cells) minus total gaps, divided by grid size
        cellSize = (boardClientWidth - (gridSize - 1) * JS_CELL_GAP) / gridSize;

        console.log(`DIMENSIONS: ClientWidth=${boardClientWidth}, JS_CELL_GAP=${JS_CELL_GAP}px, Calculated CellSize=${cellSize}px`);
        
        if (isNaN(cellSize) || cellSize <= 0) {
            console.error("!!! Calculated cellSize is invalid! Value:", cellSize, "Using fallback.");
            cellSize = 80; // More reasonable fallback
        }
    }
    
    function createBackgroundGrid() {
        if (!gameBoardElement) {
            console.error("!!! createBackgroundGrid: gameBoardElement not found!");
            return;
        }
        // Clear only background cells if they were added before
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
        calculateDimensions(); 
        
        initializeBoardArray(); 
        addRandomTile(true); 
        addRandomTile(true);
        
        renderBoard(true); 

        updateScoreDisplay();
        if (gameOverMessageElement) gameOverMessageElement.classList.add('hidden'); 
        if (youWinMessageElement) youWinMessageElement.classList.add('hidden'); 
        console.log("INIT: Game started. Initial board data:", JSON.parse(JSON.stringify(board)));
    }

    // --- 2. RENDERING THE BOARD ---
    function renderBoard(isInitialRender = false) {
        if (!gameBoardElement) {
            console.error("!!! RENDER: gameBoardElement not found!");
            return;
        }
        if (cellSize <= 0 || isNaN(cellSize)) {
            console.error("!!! RENDER: cellSize is invalid, cannot render tiles. cellSize:", cellSize);
            // Attempt to recalculate dimensions if they seem off
            // calculateDimensions(); 
            // if (cellSize <= 0 || isNaN(cellSize)) return; // If still bad, abort
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
                    // Positioning is relative to the content-box of #game-board (where background cells start)
                    tileElement.style.top = `${r * (cellSize + JS_CELL_GAP)}px`;
                    tileElement.style.left = `${c * (cellSize + JS_CELL_GAP)}px`;
                    
                    gameBoardElement.appendChild(tileElement);
                    console.log(`RENDER: Placed tile ${tileValue} at [${r},${c}] -> left: ${tileElement.style.left}, top: ${tileElement.style.top}, width: ${tileElement.style.width}`);

                    if (newlyAddedTileInfo && newlyAddedTileInfo.r === r && newlyAddedTileInfo.c === c && !isInitialRender) {
                        console.log("RENDER: Animating new tile:", newlyAddedTileInfo);
                        tileElement.classList.add('tile-new');
                        // The CSS animation defined for .tile-new with 'forwards' will handle the visual effect.
                    }
                }
            }
        }
        newlyAddedTileInfo = null; 
    }

    function updateScoreDisplay() { if (scoreElement) scoreElement.textContent = score; }

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
    function processMove(boardChanged, direction) { 
        console.log(`PROCESSMOVE: After ${direction} move, boardChanged is: ${boardChanged} (Type: ${typeof boardChanged})`);
        if (boardChanged === true) { // Explicitly check for true
            console.log("PROCESSMOVE: Board changed. Adding tile and re-rendering.");
            addRandomTile(); 
            renderBoard();   
            updateScoreDisplay(); 
            if (!hasWon && checkWinCondition()) { showWinMessage(); return; }
            if (!hasWon && checkGameOver()) { endGame(); }
        } else {
            console.log("PROCESSMOVE: Board did not change or move not fully implemented.");
        }
    }

    document.addEventListener('keydown', handleKeyPress);
    function handleKeyPress(event) {
        if ((isGameOver && !hasWon) || (youWinMessageElement && !youWinMessageElement.classList.contains('hidden'))) {
            return;
        }
        let boardChanged = false; // Initialize to false
        let direction = "Unknown";
        try {
            switch (event.key) {
                case 'ArrowUp': direction = 'Up'; boardChanged = moveTilesUp(); event.preventDefault(); break;
                case 'ArrowDown': direction = 'Down'; boardChanged = moveTilesDown(); event.preventDefault(); break;
                case 'ArrowLeft': direction = 'Left'; boardChanged = moveTilesLeft(); event.preventDefault(); break;
                case 'ArrowRight': direction = 'Right'; boardChanged = moveTilesRight(); event.preventDefault(); break;
                default: return; 
            }
            console.log(`INPUT: Key pressed: ${direction}. Result from move function (boardChanged): ${boardChanged}`);
        } catch (e) {
            console.error(`INPUT: Error during ${direction} key processing:`, e);
            boardChanged = false; // Ensure boardChanged is boolean even if error
        }
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
        let boardChanged = false; // Initialize to false
        let direction = "None";
        try {
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
        } catch (e) {
            console.error(`INPUT: Error during swipe ${direction} processing:`, e);
            boardChanged = false; // Ensure boardChanged is boolean
        }
        processMove(boardChanged, direction);
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
        try {
            for (let r = 0; r < gridSize; r++) {
                const originalRow = [...board[r]]; 
                const newRow = processRowLeft([...board[r]]); 
                board[r] = newRow; 
                if (!originalRow.every((val, index) => val === newRow[index])) {
                    boardChanged = true;
                }
            }
        } catch (e) { console.error("Error in moveTilesLeft:", e); boardChanged = false; }
        console.log("MOVEFUNC: moveTilesLeft returning:", boardChanged);
        return boardChanged;
    }

    function moveTilesRight() { 
        let boardChanged = false;
        try {
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
        } catch (e) { console.error("Error in moveTilesRight:", e); boardChanged = false; }
        console.log("MOVEFUNC: moveTilesRight returning:", boardChanged);
        return boardChanged;
    }

    function transposeBoard(matrix) {
        try {
            const rows = matrix.length;
            const cols = matrix[0].length; // Potential error if matrix is empty or not 2D
            const newMatrix = [];
            for (let j = 0; j < cols; j++) {
                newMatrix[j] = [];
                for (let i = 0; i < rows; i++) {
                    newMatrix[j][i] = matrix[i][j];
                }
            }
            return newMatrix;
        } catch (e) {
            console.error("Error in transposeBoard:", e, "Matrix was:", matrix);
            // Return a clone of the original matrix or an empty one of correct dimensions to prevent further errors
            return matrix.map(row => [...row]); // Simple clone for now
        }
    }

    function moveTilesUp() { 
        let boardChanged = false;
        try {
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
        } catch (e) { console.error("Error in moveTilesUp:", e); boardChanged = false; }
        console.log("MOVEFUNC: moveTilesUp returning:", boardChanged);
        return boardChanged;
    }

    function moveTilesDown() { 
        let boardChanged = false;
        try {
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
        } catch (e) { console.error("Error in moveTilesDown:", e); boardChanged = false; }
        console.log("MOVEFUNC: moveTilesDown returning:", boardChanged);
        return boardChanged;
    }

    // --- 6. GAME STATE LOGIC (WIN/GAME OVER) ---
    function checkWinCondition() { /* ... (same as before) ... */ }
    function showWinMessage() { /* ... (same as before) ... */ }
    function canAnyTileMove() { /* ... (same as before) ... */ }
    function checkGameOver() { /* ... (same as before) ... */ } 
    function endGame() { /* ... (same as before) ... */ }

    // --- Event Listeners for Buttons ---
    if (newGameButton) newGameButton.addEventListener('click', startGame);
    if (tryAgainButton) tryAgainButton.addEventListener('click', startGame);
    if (keepPlayingButton) {
        keepPlayingButton.addEventListener('click', () => {
            if (youWinMessageElement) youWinMessageElement.classList.add('hidden');
            isGameOver = false; 
            console.log("Keep playing selected.");
        });
    }
    if (newGameFromWinButton) {
        newGameFromWinButton.addEventListener('click', startGame);
    }
    
    window.addEventListener('resize', () => {
        console.log("Window resized event triggered.");
        calculateDimensions();
        renderBoard(true); 
    });

    // --- Initial Game Start ---
    startGame(); 
});
