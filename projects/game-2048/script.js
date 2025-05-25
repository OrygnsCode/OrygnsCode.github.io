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
    const targetTileValue = 2048;
    let board = []; 
    let score = 0;
    let isGameOver = false;
    let hasWon = false;

    let touchStartX = 0, touchStartY = 0, touchEndX = 0, touchEndY = 0;
    const swipeThreshold = 30;

    let cellSize = 0;
    let cellGapFromCSS = 0; 
    let firstCellOffsetX = 0; 
    let firstCellOffsetY = 0;
    let newlyAddedTileInfo = null; 
    let tileIdCounter = 1; 

    // --- Tile Object Definition ---
    function Tile(position, value) {
        this.r = position.r;
        this.c = position.c;
        this.value = value;
        this.id = tileIdCounter++;
        this.previousR = null; 
        this.previousC = null; 
        this.mergedFrom = null; 
        this.justAppeared = false; 
        this.wasMergedThisTurn = false;
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
                board[r][c] = null; // Initialize with null for empty cells
            }
        }
        console.log("INIT: Logical board array initialized with nulls.");
    }

    function calculateDimensions() {
        // ... (Keep the version from response #53 - no changes here for this fix) ...
        if (!gameBoardElement) {
            console.error("!!! calculateDimensions: gameBoardElement not found!");
            cellSize = 80; cellGapFromCSS = 10; firstCellOffsetX = 10; firstCellOffsetY = 10;
            return;
        }
        const firstBgCell = gameBoardElement.querySelector('.grid-cell');
        if (!firstBgCell) {
            console.error("!!! calculateDimensions: .grid-cell for measurement not found! Ensure createBackgroundGrid ran and CSS is loaded.");
            const boardStyleFallback = getComputedStyle(gameBoardElement);
            const boardClientWidthFallback = gameBoardElement.clientWidth;
            let computedGapFallback = parseFloat(boardStyleFallback.gap);
            if(isNaN(computedGapFallback)) computedGapFallback = 10;
            cellGapFromCSS = computedGapFallback;
            cellSize = (boardClientWidthFallback - (gridSize - 1) * cellGapFromCSS) / gridSize;
            firstCellOffsetX = parseFloat(boardStyleFallback.paddingLeft) || cellGapFromCSS; 
            firstCellOffsetY = parseFloat(boardStyleFallback.paddingTop) || cellGapFromCSS;  
            console.warn("Using fallback dimension calculations due to missing .grid-cell for measurement.");
        } else {
            const boardStyle = getComputedStyle(gameBoardElement);
            let computedGap = parseFloat(boardStyle.gap);
            if (isNaN(computedGap)) {
                console.warn("Could not parse 'gap' from CSS. Using fallback 10px for cellGapFromCSS.");
                const vminValue = Math.min(window.innerWidth, window.innerHeight) / 100;
                computedGap = Math.max(5, Math.min(2 * vminValue, 12));
            }
            cellGapFromCSS = computedGap;
            cellSize = firstBgCell.offsetWidth; 
            firstCellOffsetX = firstBgCell.offsetLeft;
            firstCellOffsetY = firstBgCell.offsetTop;
        }
        console.log(`DIMENSIONS: FirstCell OffsetX=${firstCellOffsetX}px, OffsetY=${firstCellOffsetY}px, CellGap (CSS)=${cellGapFromCSS}px, CellSize (from bg cell)=${cellSize}px`);
        if (isNaN(cellSize) || cellSize <= 0) {
            console.error("!!! Calculated cellSize from .grid-cell is invalid! Value:", cellSize, "Using fallback 80px.");
            cellSize = 80; 
        }
        if (isNaN(firstCellOffsetX)) { console.warn("firstCellOffsetX is NaN, using fallback 10"); firstCellOffsetX = 10; }
        if (isNaN(firstCellOffsetY)) { console.warn("firstCellOffsetY is NaN, using fallback 10"); firstCellOffsetY = 10; }
        if (isNaN(cellGapFromCSS)) { console.warn("cellGapFromCSS is NaN, using fallback 10"); cellGapFromCSS = 10; }
    }
    
    function createBackgroundGrid() {
        // ... (Keep the version from response #53) ...
        if (!gameBoardElement) { console.error("!!! createBackgroundGrid: gameBoardElement not found!"); return; }
        gameBoardElement.innerHTML = ''; 
        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            gameBoardElement.appendChild(cell);
        }
        console.log("INIT: Background grid cells created.");
    }

    function startGame() {
        console.log("INIT: Starting new game...");
        isGameOver = false;
        hasWon = false;
        score = 0;
        tileIdCounter = 1; 
        updateScoreDisplay();
        Object.values(tileElements).forEach(el => { if(el && el.remove) el.remove(); }); // Clear old DOM tiles
        tileElements = {};

        createBackgroundGrid(); 
        
        requestAnimationFrame(() => {
            calculateDimensions();  
            initializeBoardArray(); // IMPORTANT: Initializes board with nulls
            addStartTiles();       // Now calls the more robust addRandomTile
            actuate();             // Update display

            if (gameOverMessageElement) gameOverMessageElement.classList.add('hidden');
            if (youWinMessageElement) youWinMessageElement.classList.add('hidden');
            console.log("INIT: Game started. Initial logical board:", JSON.parse(JSON.stringify(board.map(row => row.map(t => t ? t.value : null )))));
        });
    }

    // --- 2. RENDERING / ACTUATION (Using actuate structure) ---
    function actuate() {
        // console.log("ACTUATE: Updating display. Score:", score); // Can be verbose
        updateScoreDisplay();

        // Clear "merged" and "new" flags from logical tiles
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const tile = board[r][c];
                if (tile) {
                    tile.mergedFrom = null;
                    // tile.savePosition(); // This should be done before a move calculation starts
                }
            }
        }

        // Create/Update/Move tile DOM elements
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const logicalTile = board[r][c];
                if (logicalTile) {
                    let tileElement = tileElements[logicalTile.id];

                    if (!tileElement) { // Tile is new to the DOM
                        tileElement = document.createElement('div');
                        tileElement.classList.add('tile');
                        tileElement.style.width = `${cellSize}px`;
                        tileElement.style.height = `${cellSize}px`;
                        
                        // For new tiles, position them at their spot, animation class will handle appearance
                        tileElement.style.left = `${firstCellOffsetX + logicalTile.c * (cellSize + cellGapFromCSS)}px`;
                        tileElement.style.top = `${firstCellOffsetY + logicalTile.r * (cellSize + cellGapFromCSS)}px`;
                        
                        gameBoardElement.appendChild(tileElement);
                        tileElements[logicalTile.id] = tileElement;
                        // console.log(`ACTUATE: Created DOM for new tile ID ${logicalTile.id}`);
                    }
                    
                    // Update value and appearance class
                    tileElement.textContent = logicalTile.value;
                    tileElement.className = 'tile'; // Reset classes then add specific ones
                    tileElement.classList.add(`tile-${logicalTile.value}`);
                    if (logicalTile.value > 2048) tileElement.classList.add('tile-super');

                    // Handle animations
                    if (logicalTile.justAppeared) {
                        tileElement.classList.add('tile-new'); // CSS has transform: scale(0), opacity: 0;
                        requestAnimationFrame(() => { // Allow initial state to apply
                            tileElement.style.transform = 'scale(1)';
                            tileElement.style.opacity = '1';
                        });
                        logicalTile.justAppeared = false; 
                    } else if (logicalTile.previousR !== null && logicalTile.previousC !== null && (logicalTile.previousR !== logicalTile.r || logicalTile.previousC !== logicalTile.c)) {
                        // Tile moved - CSS transition on left/top will handle slide
                        // (This part needs previous position to be set BEFORE logical move for proper from/to slide)
                        // For now, just ensuring it snaps to the new correct position.
                        // The "previousR/C" would be set in prepareTilesForMove()
                         console.log(`ACTUATE: Tile ${logicalTile.id} moved to ${logicalTile.r},${logicalTile.c}. Current DOM left/top might not reflect old pos for slide yet.`);
                    } else if (logicalTile.wasMergedThisTurn) {
                        tileElement.classList.add('tile-merged');
                        setTimeout(() => { if(tileElement) tileElement.classList.remove('tile-merged'); }, 200);
                        logicalTile.wasMergedThisTurn = false;
                    } else {
                         // Ensure normal state for existing tiles if no specific animation
                        tileElement.style.transform = 'scale(1)';
                        tileElement.style.opacity = '1';
                    }
                    
                    // ALWAYS set the final position (CSS transition will animate if different and if element persisted)
                    const targetLeft = firstCellOffsetX + logicalTile.c * (cellSize + cellGapFromCSS);
                    const targetTop = firstCellOffsetY + logicalTile.r * (cellSize + cellGapFromCSS);
                    tileElement.style.left = `${targetLeft}px`;
                    tileElement.style.top = `${targetTop}px`;
                }
            }
        }

        // Clean up DOM elements for tiles that are no longer in the logical board
        for (const tileId in tileElements) {
            let foundInBoard = false;
            for (let r = 0; r < gridSize; r++) {
                for (let c = 0; c < gridSize; c++) {
                    if (board[r][c] && board[r][c].id == tileId) {
                        foundInBoard = true;
                        break;
                    }
                }
                if (foundInBoard) break;
            }
            if (!foundInBoard) {
                if (tileElements[tileId] && tileElements[tileId].remove) {
                    tileElements[tileId].remove();
                }
                delete tileElements[tileId];
                // console.log(`ACTUATE: Removed DOM for tile ID ${tileId}`);
            }
        }
        // console.log("ACTUATE: Display updated.");
    }


    function updateScoreDisplay() { if (scoreElement) scoreElement.textContent = score; }

    // --- 3. ADDING RANDOM TILES ---
    // MODIFIED getEmptyCells to be more robust
    function getEmptyCells() {
        const localEmptyCells = [];
        try {
            if (!board || board.length !== gridSize) {
                console.error("!!! getEmptyCells: 'board' is not initialized correctly or has wrong number of rows. Board:", board);
                return []; 
            }
            for (let r = 0; r < gridSize; r++) {
                if (!board[r] || board[r].length !== gridSize) {
                    console.error(`!!! getEmptyCells: 'board[${r}]' is not initialized correctly or has wrong number of columns. Row:`, board[r]);
                    return []; // Critical error with board structure
                }
                for (let c = 0; c < gridSize; c++) {
                    if (board[r][c] === null) { // Check for null (empty cell)
                        localEmptyCells.push({ r, c });
                    }
                }
            }
            // console.log("getEmptyCells: Found:", localEmptyCells);
            return localEmptyCells;
        } catch (e) {
            console.error("!!! CRITICAL ERROR inside getEmptyCells:", e);
            console.error("Board state at time of error in getEmptyCells:", JSON.parse(JSON.stringify(board)));
            return []; 
        }
    }

    function addRandomTile() { // No more isInitialSetup needed here
        const emptyCells = getEmptyCells();
        if (emptyCells === undefined) { // Should not happen with new getEmptyCells
            console.error("!!! addRandomTile: getEmptyCells returned undefined! This is a bug.");
            return; 
        }
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            const newTile = new Tile({ r: randomCell.r, c: randomCell.c }, value);
            newTile.justAppeared = true; // Flag for actuate to animate
            board[randomCell.r][randomCell.c] = newTile;
            console.log(`LOGIC: Added new Tile object (${value}) at [${randomCell.r},${randomCell.c}]`);
        } else {
            console.log("LOGIC: No empty cells to add a random tile.");
        }
    }
    
    function addStartTiles() { // Helper for startGame
        addRandomTile();
        addRandomTile();
    }

    // --- 4. HANDLING PLAYER INPUT & MOVES ---
    function processMove(boardChanged, direction) { 
        // console.log(`PROCESSMOVE: After ${direction} move, boardChanged is: ${boardChanged} (Type: ${typeof boardChanged})`);
        if (boardChanged === true) {
            // console.log("PROCESSMOVE: Board changed. Adding new tile, actuating, checking game state.");
            addRandomTile(); 
            actuate();   
            // updateScoreDisplay(); // actuate calls this
            if (!hasWon && checkWinCondition()) { showWinMessage(); return; }
            if (!hasWon && checkGameOver()) { endGame(); }
        } else {
            // console.log("PROCESSMOVE: Board did not change.");
        }
    }

    document.addEventListener('keydown', handleKeyPress);
    function handleKeyPress(event) { /* ... (Keep your version from #47 / user paste #48) ... */ }
    gameBoardElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameBoardElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    gameBoardElement.addEventListener('touchend', handleTouchEnd, { passive: false });
    function handleTouchStart(event) { /* ... (Keep your version from #47 / user paste #48) ... */ }
    function handleTouchMove(event) { /* ... (Keep your version from #47 / user paste #48) ... */ }
    function handleTouchEnd(event) { /* ... (Keep your version from #47 / user paste #48) ... */ }
    function handleSwipe() { /* ... (Keep your version from #47 / user paste #48, ensure 'changed' and 'direction' are local) ... */ }

    // --- 5. MOVEMENT LOGIC (Refactored to work with Tile objects and prepare for animation) ---
    function prepareTilesForMove() {
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const tile = board[r][c];
                if (tile) {
                    tile.savePosition();    // Store r, c into previousR, previousC
                    tile.mergedFrom = null; // Clear merge history for this move
                    tile.wasMergedThisTurn = false; // Reset merge animation flag
                }
            }
        }
    }
    
    // processRowLeft now operates on an array of Tile objects (or nulls)
    // It should return a new array of Tile objects (or nulls) representing the processed row.
    function processRowLeftAndMerge(rowOfTiles) {
        let filteredTiles = rowOfTiles.filter(tile => tile !== null);
        let newRow = [];
        let changedInRow = false;

        for (let i = 0; i < filteredTiles.length; i++) {
            let currentTile = filteredTiles[i];
            if (i + 1 < filteredTiles.length && filteredTiles[i+1].value === currentTile.value) {
                // Merge
                let mergedValue = currentTile.value * 2;
                score += mergedValue;
                // Create a new tile for the merged result.
                // The original tiles (currentTile, filteredTiles[i+1]) will be "consumed".
                // For animation, we'd mark them and the new tile would appear.
                // For now, just update currentTile and skip next.
                currentTile.value = mergedValue;
                currentTile.wasMergedThisTurn = true; // Flag for pop animation in actuate
                // Mark the tile that was merged into this one as 'mergedFrom' this one for DOM cleanup
                // This requires more complex Tile object structure if we want to animate the merge source disappearing.
                // For now, the DOM cleanup in actuate will remove unreferenced tiles.
                i++; // Skip the next tile as it has been merged
                changedInRow = true;
            }
            newRow.push(currentTile);
        }

        // Pad with nulls
        const finalRow = new Array(gridSize).fill(null);
        for (let i = 0; i < newRow.length; i++) {
            finalRow[i] = newRow[i];
        }

        // Check if row content (values) actually changed
        let originalValues = rowOfTiles.map(t => t ? t.value : null);
        let finalValues = finalRow.map(t => t ? t.value : null);
        if (JSON.stringify(originalValues) !== JSON.stringify(finalValues)) {
            changedInRow = true;
        }
        
        return { processedRow: finalRow, rowChanged: changedInRow };
    }

    function moveTilesLeft() { 
        prepareTilesForMove();
        let overallBoardChanged = false;
        for (let r = 0; r < gridSize; r++) {
            const { processedRow, rowChanged } = processRowLeftAndMerge([...board[r]]); // Pass a copy
            if (rowChanged) {
                overallBoardChanged = true;
                // Update tile positions in the processedRow and then update the main board
                for (let c = 0; c < gridSize; c++) {
                    board[r][c] = processedRow[c]; // Place Tile object (or null)
                    if (board[r][c]) {
                        board[r][c].updatePosition({ r: r, c: c });
                    }
                }
            }
        }
        // console.log("MOVE_FUNC: moveTilesLeft returning:", overallBoardChanged);
        return overallBoardChanged;
    }

    function moveTilesRight() { 
        prepareTilesForMove();
        let overallBoardChanged = false;
        for (let r = 0; r < gridSize; r++) {
            const originalRow = [...board[r]];
            const reversedRow = [...originalRow].reverse();
            const { processedRow: processedReversedRow, rowChanged } = processRowLeftAndMerge(reversedRow);
            if (rowChanged) {
                overallBoardChanged = true;
                const finalNewRow = processedReversedRow.reverse();
                for (let c = 0; c < gridSize; c++) {
                    board[r][c] = finalNewRow[c];
                    if (board[r][c]) {
                        board[r][c].updatePosition({ r: r, c: c });
                    }
                }
            }
        }
        // console.log("MOVE_FUNC: moveTilesRight returning:", overallBoardChanged);
        return overallBoardChanged;
    }

    function transposeBoard(matrix) { /* ... (Keep your working version from #47/user's #48) ... */ }

    function moveTilesUp() { 
        prepareTilesForMove();
        let overallBoardChanged = false;
        let tempLogicalBoard = transposeBoard(board);
        for (let r = 0; r < gridSize; r++) { // r is effectively original column index
            const { processedRow: newColAsRow, rowChanged } = processRowLeftAndMerge([...tempLogicalBoard[r]]);
            if (rowChanged) {
                overallBoardChanged = true;
                for (let c = 0; c < gridSize; c++) { // c is effectively original row index
                    tempLogicalBoard[r][c] = newColAsRow[c];
                    // Tile objects in newColAsRow still have their old r,c.
                    // Their final r,c will be set after transposing back.
                }
            }
        }
        if (overallBoardChanged) {
            board = transposeBoard(tempLogicalBoard);
            // Update r,c in each Tile object to reflect its final position
            for(let r=0; r<gridSize; r++) {
                for(let c=0; c<gridSize; c++) {
                    if(board[r][c]) {
                        board[r][c].updatePosition({r:r, c:c});
                    }
                }
            }
        }
        // console.log("MOVE_FUNC: moveTilesUp returning:", overallBoardChanged);
        return overallBoardChanged;
    }

    function moveTilesDown() { 
        prepareTilesForMove();
        let overallBoardChanged = false;
        let tempLogicalBoard = transposeBoard(board);
        for (let r = 0; r < gridSize; r++) { // r is original column index
            const originalColAsRow = [...tempLogicalBoard[r]];
            const reversedColAsRow = originalColAsRow.reverse();
            const { processedRow: processedReversedCol, rowChanged } = processRowLeftAndMerge(reversedColAsRow);
            if (rowChanged) {
                overallBoardChanged = true;
                const finalNewCol = processedReversedCol.reverse();
                for (let c = 0; c < gridSize; c++) { // c is original row index
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
        // console.log("MOVE_FUNC: moveTilesDown returning:", overallBoardChanged);
        return overallBoardChanged;
    }

    // --- 6. GAME STATE LOGIC (WIN/GAME OVER) --- (Adjust for Tile objects)
    function checkWinCondition() {
        if (hasWon) return false; 
        for(let r=0;r<gridSize;r++){ for(let c=0;c<gridSize;c++){ if(board[r][c] && board[r][c].value === targetTileValue){return true;}}}
        return false;
    }
    function showWinMessage() {hasWon=true;if(youWinMessageElement)youWinMessageElement.classList.remove('hidden');console.log("WIN: You Win message shown");}
    
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
        // console.log("GAMEOVER_CHECK: No empty cells & no merges possible."); 
        return false;
    }
    function checkGameOver() {if(!canAnyTileMove()){console.log("GAMEOVER_CHECK: Game is over.");return true;}return false;} 
    function endGame() {isGameOver=true;if(finalScoreElement)finalScoreElement.textContent=score;if(gameOverMessageElement)gameOverMessageElement.classList.remove('hidden');console.log("GAMEOVER: Game Over message shown. Final Score:",score);}

    // --- Event Listeners for Buttons --- (Same as before)
    if (newGameButton) newGameButton.addEventListener('click', startGame);
    if (tryAgainButton) tryAgainButton.addEventListener('click', startGame);
    if (keepPlayingButton) keepPlayingButton.addEventListener('click', () => {if(youWinMessageElement)youWinMessageElement.classList.add('hidden');isGameOver=false; hasWon=true; console.log("Keep playing selected.");});
    if (newGameFromWinButton) newGameFromWinButton.addEventListener('click', startGame);
    
    window.addEventListener('resize', () => {
        console.log("Window resized event triggered. Recalculating dimensions.");
        requestAnimationFrame(() => { 
            calculateDimensions();
            actuate(); // Use actuate to re-render based on new dimensions
        });
    });

    startGame(); 
});
