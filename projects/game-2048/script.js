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
    const targetTileValue = 2048; // Renamed from targetTile for clarity
    let board = []; // Will now store Tile objects or null
    let score = 0;
    let isGameOver = false;
    let hasWon = false;

    let touchStartX = 0, touchStartY = 0, touchEndX = 0, touchEndY = 0;
    const swipeThreshold = 30;

    let cellSize = 0;
    let cellGapFromCSS = 0;
    let firstCellOffsetX = 0;
    let firstCellOffsetY = 0;

    let tileIdCounter = 1; // To give each tile a unique ID for tracking its DOM element

    // Tile DOM elements will be stored in a map: { tileId: tileElement }
    let tileElements = {}; 

    // --- Tile Object ---
    function Tile(position, value) {
        this.r = position.r;
        this.c = position.c;
        this.value = value;
        this.id = tileIdCounter++; // Unique ID for this tile instance

        this.previousR = null; // Previous row for animation
        this.previousC = null; // Previous col for animation
        this.mergedFrom = null; // Array of Tile objects that merged into this one
    }

    Tile.prototype.savePosition = function() {
        this.previousR = this.r;
        this.previousC = this.c;
    };

    Tile.prototype.updatePosition = function(newPosition) {
        this.r = newPosition.r;
        this.c = newPosition.c;
    };

    // --- 1. GAME INITIALIZATION ---
    function initializeBoardArray() {
        board = [];
        for (let r = 0; r < gridSize; r++) {
            board[r] = [];
            for (let c = 0; c < gridSize; c++) {
                board[r][c] = null; // Store null for empty, or Tile objects
            }
        }
    }

    function calculateDimensions() { /* ... (Keep your last working version from response #53) ... */ }
    function createBackgroundGrid() { /* ... (Keep your last working version from response #53) ... */ }

    function startGame() {
        console.log("INIT: Starting new game...");
        isGameOver = false;
        hasWon = false;
        score = 0;
        tileIdCounter = 1; // Reset tile ID counter
        updateScoreDisplay();

        // Clear existing tile DOM elements from previous game
        Object.values(tileElements).forEach(el => el.remove());
        tileElements = {};

        if (gameBoardElement.querySelectorAll('.grid-cell').length === 0) {
            createBackgroundGrid();
        }
        
        requestAnimationFrame(() => {
            calculateDimensions();
            initializeBoardArray();
            addStartTiles(); // Uses the new addRandomTile which creates Tile objects
            actuate(); // New function to handle all DOM updates

            if (gameOverMessageElement) gameOverMessageElement.classList.add('hidden');
            if (youWinMessageElement) youWinMessageElement.classList.add('hidden');
            console.log("INIT: Game started.");
        });
    }

    function addStartTiles() {
        for (let i = 0; i < 2; i++) {
            addRandomTile();
        }
    }

    // --- 2. RENDERING / ACTUATION (Major Changes) ---
    function actuate() {
        // This function will now be responsible for updating the DOM based on the 'board' state
        // It will create, move, update, and remove tile DOM elements.
        console.log("ACTUATE: Updating display. Score:", score);
        updateScoreDisplay();

        // Clear "merged" and "new" flags from logical tiles for next render pass
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const tile = board[r][c];
                if (tile) {
                    tile.mergedFrom = null; 
                    // tile.savePosition(); // Position is already current before actuate if prepareTiles was called
                }
            }
        }

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const logicalTile = board[r][c]; // This is a Tile object or null
                
                if (logicalTile) {
                    let tileElement = tileElements[logicalTile.id];

                    if (!tileElement) { // New tile, create its DOM element
                        tileElement = document.createElement('div');
                        tileElement.classList.add('tile');
                        // Position will be set based on previousR/C first if it's a slide, then new R/C
                        // For brand new tiles, previousR/C will be null, so position directly
                        tileElement.style.width = `${cellSize}px`;
                        tileElement.style.height = `${cellSize}px`;
                        
                        // Initial position for new tiles (they will animate from here or from scale 0)
                        tileElement.style.left = `${firstCellOffsetX + logicalTile.c * (cellSize + cellGapFromCSS)}px`;
                        tileElement.style.top = `${firstCellOffsetY + logicalTile.r * (cellSize + cellGapFromCSS)}px`;
                        
                        gameBoardElement.appendChild(tileElement);
                        tileElements[logicalTile.id] = tileElement;
                        tileElement.classList.add('tile-new'); // Add new class for appear animation
                    }
                    
                    // Update common properties (value and color class)
                    tileElement.textContent = logicalTile.value;
                    tileElement.className = 'tile'; // Reset classes
                    tileElement.classList.add(`tile-${logicalTile.value}`);
                    if (logicalTile.value > 2048) tileElement.classList.add('tile-super');

                    // Apply new class if it was marked as newly added by addRandomTile
                    // The 'tile-new' class itself should handle initial state (scale(0)) and animation via CSS
                    if (logicalTile.justAppeared) {
                        tileElement.classList.add('tile-new');
                        // Ensure transition by forcing reflow and then setting final state
                        requestAnimationFrame(() => {
                           tileElement.style.transform = 'scale(1)';
                           tileElement.style.opacity = '1';
                        });
                        logicalTile.justAppeared = false; // Clear flag
                    } else {
                        // Ensure normal state for existing tiles if they didn't have tile-new
                        tileElement.style.transform = 'scale(1)';
                        tileElement.style.opacity = '1';
                    }
                    
                    // Update position (CSS transition will make it slide)
                    // This should be the target position. The "from" position is implicitly its current DOM position.
                    const targetLeft = firstCellOffsetX + logicalTile.c * (cellSize + cellGapFromCSS);
                    const targetTop = firstCellOffsetY + logicalTile.r * (cellSize + cellGapFromCSS);

                    // Check if position actually changed to avoid unnecessary style updates
                    if (tileElement.style.left !== `${targetLeft}px` || tileElement.style.top !== `${targetTop}px`) {
                        tileElement.style.left = `${targetLeft}px`;
                        tileElement.style.top = `${targetTop}px`;
                    }

                }
            }
        }

        // Clean up DOM elements for tiles that no longer exist in the logical board
        // (This is important for merged tiles that get removed from the logical board)
        for (const tileId in tileElements) {
            let found = false;
            for (let r = 0; r < gridSize; r++) {
                for (let c = 0; c < gridSize; c++) {
                    if (board[r][c] && board[r][c].id == tileId) {
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            if (!found) {
                tileElements[tileId].remove();
                delete tileElements[tileId];
                console.log(`ACTUATE: Removed DOM for tile ID ${tileId}`);
            }
        }

        // Handle merged tile animation (pop)
        // This requires the `mergedFrom` property on the logical Tile object to be set by movement logic
        // For simplicity, this part is not fully implemented here yet, as it requires movement functions
        // to return more detailed info or for Tile objects to carry more state about merging.
        // We will add a class to the tile that 'grew'.
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const logicalTile = board[r][c];
                if (logicalTile && logicalTile.wasMergedThisTurn) { // Assume 'wasMergedThisTurn' flag is set by move logic
                    const tileElement = tileElements[logicalTile.id];
                    if (tileElement) {
                        tileElement.classList.add('tile-merged');
                        setTimeout(() => tileElement.classList.remove('tile-merged'), 200); // Duration of pop animation
                    }
                    logicalTile.wasMergedThisTurn = false; // Reset flag
                }
            }
        }

        console.log("ACTUATE: Display updated.");
    }

    function updateScoreDisplay() { if (scoreElement) scoreElement.textContent = score; }

    // --- 3. ADDING RANDOM TILES ---
    function getEmptyCells() { /* ... (same as before) ... */ }

    function addRandomTile() { // Removed isInitialSetup, actuate handles new tile animation
        const emptyCells = getEmptyCells();
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            const newTile = new Tile({ r: randomCell.r, c: randomCell.c }, value);
            newTile.justAppeared = true; // Flag for actuate to animate
            board[randomCell.r][randomCell.c] = newTile; // Place Tile object on board
            console.log(`LOGIC: Added new Tile object (${value}) at [${randomCell.r},${randomCell.c}]`);
        } else {
            console.log("LOGIC: No empty cells to add a random tile.");
        }
    }
    
    // --- 4. HANDLING PLAYER INPUT & MOVES ---
    // MODIFIED: processMove now just calls actuate and game state checks
    function processMove(boardChanged, direction) { 
        console.log(`PROCESSMOVE: After ${direction} move, boardChanged is: ${boardChanged}`);
        if (boardChanged === true) {
            console.log("PROCESSMOVE: Board changed. Adding new tile, actuating, checking game state.");
            addRandomTile(); 
            actuate(); // Central function to update visuals
            
            if (!hasWon && checkWinCondition()) { showWinMessage(); return; }
            if (!hasWon && checkGameOver()) { endGame(); }
        } else {
            console.log("PROCESSMOVE: Board did not change.");
        }
    }

    document.addEventListener('keydown', handleKeyPress);
    function handleKeyPress(event) { /* ... (same as before, ensure `changed` is local) ... */ }
    gameBoardElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    // ... (touch handlers same as before, ensure `internalChanged` and `swipeDir` are local) ...
    function handleTouchStart(event) { /* ... */ }
    function handleTouchMove(event) { /* ... */ }
    function handleTouchEnd(event) { /* ... */ }
    function handleSwipe() { /* ... */ }

    // --- 5. MOVEMENT LOGIC (Significant changes needed here to work with Tile objects) ---
    // The following movement logic needs to be refactored to:
    // 1. Operate on a board of Tile objects (or null).
    // 2. When merging, create a new Tile object for the merged result, and mark the old ones.
    // 3. Correctly update Tile object positions (tile.updatePosition).
    // 4. Set flags like 'wasMergedThisTurn' on Tile objects.

    // For now, I will provide a VERY SIMPLIFIED version of processRowLeft
    // and the move functions that updates the logical board of Tile objects
    // but DOES NOT YET have the advanced logic for tracking merges in a way
    // that `actuate` can perfectly animate merges (like which tile consumed which).
    // This will get basic sliding working.

    function prepareTilesForMove() {
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (board[r][c]) {
                    board[r][c].savePosition(); // Store previous r, c
                    board[r][c].mergedFrom = null;
                    board[r][c].wasMergedThisTurn = false; // Reset merge flag
                }
            }
        }
    }
    
    function moveTile(tile, newR, newC) { // newR, newC are the new logical positions
        if (!tile) return;
        board[tile.r][tile.c] = null; // Clear old position in logical board
        tile.updatePosition({ r: newR, c: newC }); // Update tile object's internal position
        board[newR][newC] = tile; // Place tile in new position in logical board
    }

    function processRowAndCreateMoveList(rowTiles, isHorizontalMove) {
        // This function will process one row (or column if transposed)
        // It should return the new row of Tile objects and a list of moves/merges for animation
        // For simplicity in this step, we'll just update the row and return it.
        // True animation tracking needs more complex return values.

        let originalRowJSON = JSON.stringify(rowTiles.map(t => t ? t.value : 0));
        
        // 1. Filter out nulls, keeping Tile objects
        let filteredTiles = rowTiles.filter(tile => tile !== null);

        // 2. Merge
        for (let i = 0; i < filteredTiles.length - 1; i++) {
            if (filteredTiles[i].value === filteredTiles[i+1].value) {
                const mergedValue = filteredTiles[i].value * 2;
                score += mergedValue;
                
                // The tile at i "absorbs" the tile at i+1
                // For animation: filteredTiles[i+1] should animate into filteredTiles[i]
                // We'll create a new tile for the merged result for simplicity now
                // Or, update filteredTiles[i] and mark filteredTiles[i+1] for removal
                
                filteredTiles[i].value = mergedValue; // Update value
                filteredTiles[i].wasMergedThisTurn = true; // Flag for pop animation
                // Remove the merged tile object
                // For DOM: The tile that got merged into (filteredTiles[i]) keeps its ID.
                // The tile that disappeared (filteredTiles[i+1]) needs its DOM element removed.
                // We need to track this: mark filteredTiles[i+1] for deletion.
                if (tileElements[filteredTiles[i+1].id]) { // Mark for DOM removal
                     tileElements[filteredTiles[i+1].id].willBeRemoved = true;
                }

                filteredTiles.splice(i + 1, 1); // Remove from processing list
            }
        }

        // 3. Pad with nulls
        const newProcessedRow = new Array(gridSize).fill(null);
        for (let i = 0; i < filteredTiles.length; i++) {
            newProcessedRow[i] = filteredTiles[i];
        }
        
        let rowChanged = JSON.stringify(newProcessedRow.map(t => t ? t.value : 0)) !== originalRowJSON;
        return { newRow: newProcessedRow, changed: rowChanged };
    }


    function moveTilesLeft() {
        prepareTilesForMove();
        let overallBoardChanged = false;
        for (let r = 0; r < gridSize; r++) {
            const rowToProcess = board[r]; // This is a row of Tile objects or nulls
            const { newRow, changed } = processRowAndCreateMoveList(rowToProcess, true);
            if (changed) {
                overallBoardChanged = true;
                // Update the positions of tiles in newRow based on their new index
                for(let c=0; c < gridSize; c++) {
                    if(newRow[c]) {
                        newRow[c].updatePosition({r: r, c: c});
                    }
                    board[r][c] = newRow[c]; // Update the main board
                }
            }
        }
        console.log("MOVE_FUNC: moveTilesLeft returning:", overallBoardChanged);
        return overallBoardChanged;
    }

    function moveTilesRight() {
        prepareTilesForMove();
        let overallBoardChanged = false;
        for (let r = 0; r < gridSize; r++) {
            const rowToProcess = [...board[r]].reverse(); // Reverse to process "left" then reverse back
            const { newRow: processedReversedRow, changed } = processRowAndCreateMoveList(rowToProcess, true);
            if (changed) {
                overallBoardChanged = true;
                const finalNewRow = processedReversedRow.reverse();
                for(let c=0; c < gridSize; c++) {
                    if(finalNewRow[c]) {
                        finalNewRow[c].updatePosition({r: r, c: c});
                    }
                    board[r][c] = finalNewRow[c]; // Update the main board
                }
            }
        }
        console.log("MOVE_FUNC: moveTilesRight returning:", overallBoardChanged);
        return overallBoardChanged;
    }
    
    function moveTilesUp() {
        prepareTilesForMove();
        let overallBoardChanged = false;
        let tempLogicalBoard = transposeBoard(board); // Transpose board of Tile objects
        for (let r = 0; r < gridSize; r++) { // r is now effectively a column index
            const colToProcess = tempLogicalBoard[r];
            const { newRow: processedCol, changed } = processRowAndCreateMoveList(colToProcess, false);
            if (changed) {
                overallBoardChanged = true;
                for(let c=0; c < gridSize; c++) { // c is now effectively a row index
                    if(processedCol[c]) {
                        // Position is relative to transposed board during processing
                        // Actual r,c will be set when transposing back or by reading from tile object
                    }
                    tempLogicalBoard[r][c] = processedCol[c];
                }
            }
        }
        if (overallBoardChanged) {
            board = transposeBoard(tempLogicalBoard); // Transpose back
            // After transposing back, update r,c for all tiles based on their new grid position
            for(let r=0; r<gridSize; r++) {
                for(let c=0; c<gridSize; c++) {
                    if(board[r][c]) {
                        board[r][c].updatePosition({r:r, c:c});
                    }
                }
            }
        }
        console.log("MOVE_FUNC: moveTilesUp returning:", overallBoardChanged);
        return overallBoardChanged;
    }

    function moveTilesDown() {
        prepareTilesForMove();
        let overallBoardChanged = false;
        let tempLogicalBoard = transposeBoard(board);
        for (let r = 0; r < gridSize; r++) { // r is col index
            const colToProcess = [...tempLogicalBoard[r]].reverse();
            const { newRow: processedReversedCol, changed } = processRowAndCreateMoveList(colToProcess, false);
            if (changed) {
                overallBoardChanged = true;
                const finalNewCol = processedReversedCol.reverse();
                for(let c=0; c < gridSize; c++) { // c is row index
                    tempLogicalBoard[r][c] = finalNewCol[c];
                }
            }
        }
        if (overallBoardChanged) {
            board = transposeBoard(tempLogicalBoard);
            for(let r=0; r<gridSize; r++) {
                for(let c=0; c<gridSize; c++) {
                    if(board[r][c]) {
                        board[r][c].updatePosition({r:r, c:c});
                    }
                }
            }
        }
        console.log("MOVE_FUNC: moveTilesDown returning:", overallBoardChanged);
        return overallBoardChanged;
    }
    
    // --- 6. GAME STATE LOGIC (WIN/GAME OVER) --- (Keep as is, but checkWin uses board of Tile objects)
    function checkWinCondition() {
        if (hasWon) return false; // Don't re-trigger win if already won and playing on
        for(let r=0;r<gridSize;r++){
            for(let c=0;c<gridSize;c++){
                if(board[r][c] && board[r][c].value === targetTileValue) { // Check .value
                    console.log("Win condition met: tile value reached!");
                    return true;
                }
            }
        }
        return false;
    }
    function showWinMessage() { /* ... (same as before, but ensure hasWon is set here) ... */ hasWon=true; if(youWinMessageElement)youWinMessageElement.classList.remove('hidden');}
    function canAnyTileMove() {
        if (getEmptyCells().length > 0) return true;
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize - 1; c++) {
                if (board[r][c] && board[r][c+1] && board[r][c].value === board[r][c+1].value) return true;
            }
        }
        for (let c = 0; c < gridSize; c++) {
            for (let r = 0; r < gridSize - 1; r++) {
                if (board[r][c] && board[r+1][c] && board[r][c].value === board[r+1][c].value) return true;
            }
        }
        return false;
    }
    function checkGameOver() { /* ... (same as before) ... */ } 
    function endGame() { /* ... (same as before) ... */ }

    // --- Event Listeners for Buttons --- (Keep as is)
    if (newGameButton) newGameButton.addEventListener('click', startGame);
    // ... (other button listeners)
    
    window.addEventListener('resize', () => { /* ... (same as before, ensure requestAnimationFrame is used if needed) ... */ });

    startGame(); 
});
