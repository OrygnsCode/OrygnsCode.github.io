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
    let board = []; // Logical board (data)
    
    let score = 0;
    let isGameOver = false;
    let hasWon = false;

    let touchStartX = 0, touchStartY = 0, touchEndX = 0, touchEndY = 0;
    const swipeThreshold = 30;

    // Variables to store cell size and gap for positioning
    let cellSize = 0;
    let cellGap = 0;
    let boardPadding = 0; // Store board padding

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
        const boardStyle = getComputedStyle(gameBoardElement);
        const boardWidth = parseFloat(boardStyle.width);
        
        // Use the actual padding and gap from the CSS
        boardPadding = parseFloat(boardStyle.paddingTop); // Assuming padding is uniform
        cellGap = parseFloat(boardStyle.gap);

        // The total width available for cells is boardWidth - 2 * boardPadding
        // The total width taken by gaps is (gridSize - 1) * cellGap
        // So, cellSize = (boardWidth - 2 * boardPadding - (gridSize - 1) * cellGap) / gridSize;
        // However, the gameBoardElement width includes padding. The grid items are inside the padding.
        // The grid itself establishes cellSize based on '1fr' and the gap.
        // A simpler way for positioning: the first cell starts at (boardPadding, boardPadding)
        // relative to game-board-container if #game-board is offset by padding.
        // Or, if #game-board's width/height is the outer dimension, then
        // cellSize is derived from (total width - padding*2 - gaps*(N-1)) / N.
        // The CSS uses padding AND gap for #game-board.
        // Let's assume the padding in #game-board is where the first cell starts.
        // Width of #game-board includes its own padding.
        // Effective width for grid cells area = boardWidth - 2 * boardPadding.
        // cellSize = ( (boardWidth - 2 * boardPadding) - (gridSize - 1) * cellGap ) / gridSize;

        // The CSS for #game-board has 'padding' and 'gap'.
        // A grid item's size is determined by (total size - sum of gaps - sum of padding) / number of items.
        // Since we have padding on #game-board, the (0,0) for absolutely positioned tiles
        // will be the top-left corner of the #game-board's *content box*.
        // The first background cell created by the grid will be at (padding, padding) effectively.
        // So, for an absolutely positioned tile at [r,c]:
        // top = padding + r * (cellSize + cellGap)
        // left = padding + c * (cellSize + cellGap)
        // And cellSize = ( (totalWidthOrHeight - 2*padding) - (gridSize-1)*gap ) / gridSize
        
        const boardClientWidth = gameBoardElement.clientWidth; // Width inside padding, excluding scrollbars
        const boardClientHeight = gameBoardElement.clientHeight; // Height inside padding

        // If gap is applied by the grid, it's between the '1fr' cells.
        // total width for cells = clientWidth - (gridSize - 1) * cellGap
        cellSize = (boardClientWidth - (gridSize - 1) * cellGap) / gridSize;
        // Ensure cellSize is roughly square if board isn't perfectly square due to vmin and max-width/height
        // We'll use this cellSize for both width and height of tiles.

        console.log(`Dimensions - ClientWidth: ${boardClientWidth}, CellGap: ${cellGap}, CellSize: ${cellSize}`);
        if (cellSize <= 0) {
            console.error("Calculated cellSize is invalid. Check CSS and board dimensions.");
            cellSize = 50; // Fallback
        }
    }
    
    function createBackgroundGrid() {
        // Clear only background cells if they were added before, or ensure #game-board is empty of them
        const existingBgCells = gameBoardElement.querySelectorAll('.grid-cell');
        existingBgCells.forEach(cell => cell.remove());

        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            gameBoardElement.appendChild(cell); // These will be laid out by the parent's grid CSS
        }
    }

    function startGame() {
        console.log("Starting new game...");
        isGameOver = false;
        hasWon = false; 
        score = 0;
        
        createBackgroundGrid(); // Setup the static background cells
        calculateDimensions(); // Calculate sizes for positioning dynamic tiles
        
        initializeBoardArray(); 
        
        addRandomTile(true); // Mark as initial setup to prevent animation here if desired
        addRandomTile(true); // Mark as initial setup
        
        renderBoard(true); // Initial render, pass true to avoid new tile animation for these

        updateScoreDisplay();
        if (gameOverMessageElement) gameOverMessageElement.classList.add('hidden'); 
        if (youWinMessageElement) youWinMessageElement.classList.add('hidden'); 
    }

    // --- 2. RENDERING THE BOARD ---
    function renderBoard(isInitialRender = false) {
        // Remove only existing *numbered* tiles (divs with class 'tile' but not 'grid-cell')
        const existingNumberedTiles = gameBoardElement.querySelectorAll('.tile:not(.grid-cell)');
        existingNumberedTiles.forEach(tile => tile.remove());

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const tileValue = board[r][c];
                if (tileValue !== 0) {
                    const tileElement = document.createElement('div');
                    tileElement.classList.add('tile'); // Base class
                    tileElement.classList.add(`tile-${tileValue}`);
                    if (tileValue > 2048) tileElement.classList.add('tile-super');
                    tileElement.textContent = tileValue;

                    // Set size and position
                    tileElement.style.width = `${cellSize}px`;
                    tileElement.style.height = `${cellSize}px`;
                    // Position is relative to #game-board's content box (inside its padding)
                    tileElement.style.top = `${r * (cellSize + cellGap)}px`;
                    tileElement.style.left = `${c * (cellSize + cellGap)}px`;
                    
                    gameBoardElement.appendChild(tileElement);

                    // Animate if it's a new tile not during initial setup
                    // This logic is now primarily handled by addRandomTile making its own element
                    // However, if isInitialRender is true, we skip adding .tile-new here
                    if (newlyAddedTileInfo && newlyAddedTileInfo.r === r && newlyAddedTileInfo.c === c && !isInitialRender) {
                        tileElement.classList.add('tile-new');
                        // CSS animation 'appear' with 'forwards' will handle the visual.
                        // No need for setTimeout to remove class if animation has 'forwards'.
                    }
                }
            }
        }
        newlyAddedTileInfo = null; // Reset after rendering
        // console.log("Board rendered with absolutely positioned tiles.");
    }

    let newlyAddedTileInfo = null; // To pass info to renderBoard for new tile animation

    function updateScoreDisplay() { if (scoreElement) scoreElement.textContent = score; }

    // --- 3. ADDING RANDOM TILES ---
    function getEmptyCells() { /* ... (same as before) ... */ }

    function addRandomTile(isInitialSetup = false) {
        const emptyCells = getEmptyCells();
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const newValue = Math.random() < 0.9 ? 2 : 4;
            board[randomCell.r][randomCell.c] = newValue;

            // If not initial setup, this tile should be animated when renderBoard is called next.
            // We mark it so renderBoard (or a dedicated animation function) can pick it up.
            if (!isInitialSetup) {
                newlyAddedTileInfo = { r: randomCell.r, c: randomCell.c, value: newValue };
                // The actual DOM element creation and animation class add will happen in renderBoard
            }
        }
    }
    
    // --- 4. HANDLING PLAYER INPUT & MOVES ---
    function processMove(boardChanged) {
        if (boardChanged) {
            addRandomTile(); // This will set newlyAddedTileInfo
            renderBoard(false, newlyAddedTileInfo); // Pass new tile info for animation
            updateScoreDisplay(); 
            
            if (!hasWon) { 
                if (checkWinCondition()) {
                    showWinMessage();
                    return; 
                }
            }
            if (checkGameOver()) { 
                endGame();
            }
        }
    }
    document.addEventListener('keydown', handleKeyPress);
    function handleKeyPress(event) { /* ... (same as before, calls processMove) ... */ }
    gameBoardElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    // ... (touch handlers same as before, eventually call processMove) ...
    function handleTouchStart(event) { /* ... (same as before) ... */ }
    function handleTouchMove(event) { /* ... (same as before) ... */ }
    function handleTouchEnd(event) { /* ... (same as before) ... */ }
    function handleSwipe() { /* ... (same as before) ... */ }


    // --- 5. MOVEMENT LOGIC --- (All movement functions are the same as before)
    function processRowLeft(row) { /* ... (same as before) ... */ }
    function moveTilesLeft() { /* ... (same as before) ... */ }
    function moveTilesRight() { /* ... (same as before) ... */ }
    function transposeBoard(matrix) { /* ... (same as before) ... */ }
    function moveTilesUp() { /* ... (same as before) ... */ }
    function moveTilesDown() { /* ... (same as before) ... */ }

    // --- 6. GAME STATE LOGIC (WIN/GAME OVER) --- (All same as before)
    function checkWinCondition() { /* ... (same as before) ... */ }
    function showWinMessage() { /* ... (same as before) ... */ }
    function canAnyTileMove() { /* ... (same as before) ... */ }
    function checkGameOver() { /* ... (same as before) ... */ } 
    function endGame() { /* ... (same as before) ... */ }

    // --- Event Listeners for Buttons --- (All same as before)
    if (newGameButton) newGameButton.addEventListener('click', startGame);
    // ... (other button listeners)
    
    window.addEventListener('resize', () => {
        console.log("Window resized");
        calculateDimensions();
        renderBoard(true); // Re-render with new dimensions, true = initial-like render
    });

    startGame(); 
});
