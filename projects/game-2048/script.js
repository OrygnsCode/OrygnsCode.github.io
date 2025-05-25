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

    let cellSize = 0;
    let cellGap = 0; 
    let newlyAddedTileInfo = null; // To pass info to renderBoard for new tile animation


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
            console.error("gameBoardElement not found for dimension calculation!");
            return;
        }
        const boardStyle = getComputedStyle(gameBoardElement);
        const boardClientWidth = gameBoardElement.clientWidth; // Width INSIDE padding

        // Try to get 'gap' value. Fallback if it's complex or NaN.
        let computedGap = parseFloat(boardStyle.gap);
        if (isNaN(computedGap)) {
            console.warn("Could not parse 'gap' from CSS. Using fallback (e.g., 10px). Ensure 'gap' in CSS for #game-board is a simple pixel value if issues persist.");
            // Estimate based on common clamp value, e.g. 2vmin or a fixed px
            const vminValue = Math.min(window.innerWidth, window.innerHeight) / 100;
            computedGap = Math.max(5, Math.min(2 * vminValue, 12)); // Re-evaluate clamp's likely value
        }
        cellGap = computedGap;
        
        // cellSize is based on the clientWidth (area for cells) minus total gaps, divided by grid size
        cellSize = (boardClientWidth - (gridSize - 1) * cellGap) / gridSize;

        console.log(`Dimensions Calculated - ClientWidth: ${boardClientWidth}, CellGap: ${cellGap}px, CellSize: ${cellSize}px`);
        
        if (isNaN(cellSize) || cellSize <= 0) {
            console.error("Calculated cellSize is invalid!", cellSize);
            cellSize = 80; // More reasonable fallback
            console.log("Using fallback cellSize:", cellSize);
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
        console.log("Background grid created.");
    }

    function startGame() {
        console.log("Starting new game...");
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
        console.log("Game started. Initial board state:", JSON.parse(JSON.stringify(board)));
    }

    // --- 2. RENDERING THE BOARD ---
    function renderBoard(isInitialRender = false) {
        if (!gameBoardElement || cellSize <= 0) {
            console.error("Cannot render board. gameBoardElement or cellSize invalid.", gameBoardElement, cellSize);
            return;
        }
        const existingNumberedTiles = gameBoardElement.querySelectorAll('.tile:not(.grid-cell)');
        existingNumberedTiles.forEach(tile => tile.remove());

        console.log("Rendering board. Current data:", JSON.parse(JSON.stringify(board)));

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
                    // Corrected positioning: relative to the content-box of #game-board
                    tileElement.style.top = `${r * (cellSize + cellGap)}px`;
                    tileElement.style.left = `${c * (cellSize + cellGap)}px`;
                    
                    gameBoardElement.appendChild(tileElement);
                    // console.log(`Placed tile ${tileValue} at [${r},${c}] -> top: ${tileElement.style.top}, left: ${tileElement.style.left}`);


                    if (newlyAddedTileInfo && newlyAddedTileInfo.r === r && newlyAddedTileInfo.c === c && !isInitialRender) {
                        console.log("Animating new tile:", newlyAddedTileInfo);
                        tileElement.classList.add('tile-new'); // CSS handles animation via transform: scale(0) and transition
                        // The 'forwards' in CSS animation for .tile-new isn't strictly needed if we reset scale here,
                        // but better to ensure it starts from scale(0) then transitions to scale(1).
                        // Forcing reflow to ensure transition applies if added immediately after creation
                        void tileElement.offsetWidth; // Reflow
                        tileElement.style.transform = 'scale(1)'; // Will transition from scale(0) in .tile-new if CSS is set up
                        tileElement.style.opacity = '1';

                        // Simpler: CSS animation 'appear' should handle it if tile-new sets initial state (scale(0), opacity(0))
                        // and transition on .tile handles the change to default scale(1), opacity(1)
                        // The .tile-new class itself in CSS now has the animation property.
                    }
                }
            }
        }
        newlyAddedTileInfo = null; 
    }

    function updateScoreDisplay() { if (scoreElement) scoreElement.textContent = score; }

    // --- 3. ADDING RANDOM TILES ---
    function getEmptyCells() { /* ... (same as before, ensure it works) ... */ 
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
            console.log(`Logic: Added tile ${newValue} at [${randomCell.r},${randomCell.c}]`);
            
            if (!isInitialSetup) {
                newlyAddedTileInfo = { r: randomCell.r, c: randomCell.c }; // Mark for animation
            }
        } else {
            console.log("No empty cells to add a random tile.");
        }
    }
    
    // --- 4. HANDLING PLAYER INPUT & MOVES ---
    function processMove(boardChanged) {
        if (boardChanged) {
            addRandomTile(); 
            renderBoard();   // Now renderBoard uses newlyAddedTileInfo to animate the new tile
            updateScoreDisplay(); 
            
            if (!hasWon && checkWinCondition()) { // Check win only if not already won
                showWinMessage();
                return; 
            }
            if (!hasWon && checkGameOver()) { // Check game over only if not already won (or if win doesn't stop game)
                endGame();
            }
        }
    }

    document.addEventListener('keydown', handleKeyPress);
    function handleKeyPress(event) {
        if (isGameOver && !hasWon) return; 
        if (youWinMessageElement && !youWinMessageElement.classList.contains('hidden')) return;

        let boardChanged = false; 
        let direction = null;
        switch (event.key) {
            case 'ArrowUp': direction = 'Up'; boardChanged = moveTilesUp(); event.preventDefault(); break;
            case 'ArrowDown': direction = 'Down'; boardChanged = moveTilesDown(); event.preventDefault(); break;
            case 'ArrowLeft': direction = 'Left'; boardChanged = moveTilesLeft(); event.preventDefault(); break;
            case 'ArrowRight': direction = 'Right'; boardChanged = moveTilesRight(); event.preventDefault(); break;
            default: return; 
        }
        console.log(`Key pressed: ${direction}, boardChanged: ${boardChanged}`);
        processMove(boardChanged);
    }

    gameBoardElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameBoardElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    gameBoardElement.addEventListener('touchend', handleTouchEnd, { passive: false });

    function handleTouchStart(event) { /* ... (same as before) ... */ }
    function handleTouchMove(event) { /* ... (same as before) ... */ }
    function handleTouchEnd(event) { /* ... (same as before) ... */ }
    function handleSwipe() { /* ... (same as before, with console logs for swipe direction) ... */ 
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        let boardChanged = false;
        let direction = null;

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
        if(direction) console.log(`Swipe: ${direction}, boardChanged: ${boardChanged}`);
        processMove(boardChanged);
    }


    // --- 5. MOVEMENT LOGIC --- (These are unchanged from your working version)
    function processRowLeft(row) { /* ... (same as before) ... */ }
    function moveTilesLeft() { /* ... (same as before) ... */ }
    function moveTilesRight() { /* ... (same as before) ... */ }
    function transposeBoard(matrix) { /* ... (same as before) ... */ }
    function moveTilesUp() { /* ... (same as before) ... */ }
    function moveTilesDown() { /* ... (same as before) ... */ }

    // --- 6. GAME STATE LOGIC (WIN/GAME OVER) --- (Unchanged, assuming it was working)
    function checkWinCondition() { /* ... (same as before) ... */ }
    function showWinMessage() { /* ... (same as before) ... */ }
    function canAnyTileMove() { /* ... (same as before, ensure no console logs if it's stable) ... */ }
    function checkGameOver() { /* ... (same as before, ensure no console logs if stable) ... */ } 
    function endGame() { /* ... (same as before, ensure no console logs if stable) ... */ }

    // --- Event Listeners for Buttons --- (Unchanged)
    if (newGameButton) newGameButton.addEventListener('click', startGame);
    // ... (other button listeners)
    
    window.addEventListener('resize', () => {
        console.log("Window resized, recalculating dimensions and re-rendering.");
        calculateDimensions();
        renderBoard(true); 
    });

    startGame(); 
});
