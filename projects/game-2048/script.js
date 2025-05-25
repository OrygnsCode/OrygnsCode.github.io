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

    // Tile DOM elements will be stored in a map: { tileId: tileElement }
    // Initialize as an empty object at the script level
    let tileElements = {};

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
                board[r][c] = null;
            }
        }
        // console.log("INIT: Logical board array initialized with nulls.");
    }

    function calculateDimensions() {
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
        // console.log(`DIMENSIONS: FirstCell OffsetX=${firstCellOffsetX}px, OffsetY=${firstCellOffsetY}px, CellGap (CSS)=${cellGapFromCSS}px, CellSize (from bg cell)=${cellSize}px`);
        if (isNaN(cellSize) || cellSize <= 0) {
            console.error("!!! Calculated cellSize from .grid-cell is invalid! Value:", cellSize, "Using fallback 80px.");
            cellSize = 80; 
        }
        if (isNaN(firstCellOffsetX)) { /* console.warn("firstCellOffsetX is NaN, using fallback 10"); */ firstCellOffsetX = 10; }
        if (isNaN(firstCellOffsetY)) { /* console.warn("firstCellOffsetY is NaN, using fallback 10"); */ firstCellOffsetY = 10; }
        if (isNaN(cellGapFromCSS)) { /* console.warn("cellGapFromCSS is NaN, using fallback 10"); */ cellGapFromCSS = 10; }
    }
    
    function createBackgroundGrid() {
        if (!gameBoardElement) { console.error("!!! createBackgroundGrid: gameBoardElement not found!"); return; }
        gameBoardElement.innerHTML = ''; 
        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            gameBoardElement.appendChild(cell);
        }
        // console.log("INIT: Background grid cells created.");
    }

    // MODIFIED startGame
    function startGame() {
        console.log("INIT: Starting new game...");
        isGameOver = false;
        hasWon = false;
        score = 0;
        tileIdCounter = 1; 
        updateScoreDisplay();

        // Ensure tileElements is an object, then clear its previous DOM elements
        if (tileElements && typeof tileElements === 'object') {
            Object.values(tileElements).forEach(el => { if(el && el.remove) el.remove(); });
        }
        tileElements = {}; // Re-initialize as empty object

        if (gameBoardElement.querySelectorAll('.grid-cell').length === 0) {
             createBackgroundGrid(); // Create background if not present
        }
        
        requestAnimationFrame(() => {
            calculateDimensions();  
            initializeBoardArray(); 
            addStartTiles();        
            actuate();              

            if (gameOverMessageElement) gameOverMessageElement.classList.add('hidden');
            if (youWinMessageElement) youWinMessageElement.classList.add('hidden');
            // console.log("INIT: Game started. Initial logical board:", JSON.parse(JSON.stringify(board.map(row => row.map(t => t ? t.value : null )))));
        });
    }

    // --- 2. RENDERING / ACTUATION ---
    // MODIFIED actuate (and this replaces renderBoard)
    function actuate() {
        // console.log("ACTUATE: Updating display. Score:", score);
        updateScoreDisplay();

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const tile = board[r][c];
                if (tile) {
                    tile.mergedFrom = null; 
                    // tile.savePosition(); // This should happen *before* move logic calculates new positions
                }
            }
        }

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const logicalTile = board[r][c]; 
                
                if (logicalTile) {
                    let tileElement = tileElements[logicalTile.id];

                    if (!tileElement) { 
                        tileElement = document.createElement('div');
                        tileElement.classList.add('tile');
                        tileElement.style.width = `${cellSize}px`;
                        tileElement.style.height = `${cellSize}px`;
                        
                        // For brand new tiles, position them directly at their spot.
                        // If it was a moved tile that somehow lost its DOM element, it would also be created here.
                        // The 'justAppeared' flag will handle its initial animation state.
                        tileElement.style.left = `${firstCellOffsetX + logicalTile.c * (cellSize + cellGapFromCSS)}px`;
                        tileElement.style.top = `${firstCellOffsetY + logicalTile.r * (cellSize + cellGapFromCSS)}px`;
                        
                        gameBoardElement.appendChild(tileElement);
                        tileElements[logicalTile.id] = tileElement;
                        // console.log(`ACTUATE: Created DOM for new tile ID ${logicalTile.id} at ${logicalTile.r},${logicalTile.c}`);
                    }
                    
                    tileElement.textContent = logicalTile.value;
                    tileElement.className = 'tile'; 
                    tileElement.classList.add(`tile-${logicalTile.value}`);
                    if (logicalTile.value > 2048) tileElement.classList.add('tile-super');

                    // Apply animations / final state
                    if (logicalTile.justAppeared) {
                        tileElement.classList.add('tile-new'); 
                        requestAnimationFrame(() => {
                           tileElement.style.transform = 'scale(1)';
                           tileElement.style.opacity = '1';
                        });
                        logicalTile.justAppeared = false; 
                    } else if (logicalTile.wasMergedThisTurn) {
                        tileElement.classList.add('tile-merged');
                        setTimeout(() => { if(tileElement) tileElement.classList.remove('tile-merged'); }, 200); 
                        logicalTile.wasMergedThisTurn = false;
                        // Ensure normal scale/opacity if not also new
                        tileElement.style.transform = 'scale(1)';
                        tileElement.style.opacity = '1';
                    } else {
                        tileElement.style.transform = 'scale(1)';
                        tileElement.style.opacity = '1';
                    }
                    
                    // Update position for sliding (CSS transition will make it slide)
                    const targetLeft = firstCellOffsetX + logicalTile.c * (cellSize + cellGapFromCSS);
                    const targetTop = firstCellOffsetY + logicalTile.r * (cellSize + cellGapFromCSS);
                    tileElement.style.left = `${targetLeft}px`;
                    tileElement.style.top = `${targetTop}px`;
                }
            }
        }

        // Clean up DOM elements for tiles that no longer exist in the logical board
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
    function getEmptyCells() {
        const localEmptyCells = [];
        try {
            if (!board || board.length !== gridSize) {
                console.error("!!! getEmptyCells: 'board' is not initialized or wrong rows. Board:", board);
                return []; 
            }
            for (let r = 0; r < gridSize; r++) {
                if (!board[r] || board[r].length !== gridSize) {
                    console.error(`!!! getEmptyCells: 'board[${r}]' not initialized or wrong cols. Row:`, board[r]);
                    return []; 
                }
                for (let c = 0; c < gridSize; c++) {
                    if (board[r][c] === null) {
                        localEmptyCells.push({ r, c });
                    }
                }
            }
            return localEmptyCells;
        } catch (e) {
            console.error("!!! CRITICAL ERROR inside getEmptyCells:", e, "Board:", board);
            return []; 
        }
    }

    function addRandomTile() { 
        const emptyCells = getEmptyCells();
        if (emptyCells === undefined) { 
            console.error("!!! addRandomTile: getEmptyCells returned undefined!");
            return; 
        }
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            const newTile = new Tile({ r: randomCell.r, c: randomCell.c }, value);
            newTile.justAppeared = true; 
            board[randomCell.r][randomCell.c] = newTile;
            // console.log(`LOGIC: Added new Tile object (${value}) at [${randomCell.r},${randomCell.c}]`);
        } else {
            // console.log("LOGIC: No empty cells to add a random tile.");
        }
    }
    
    function addStartTiles() { 
        addRandomTile();
        addRandomTile();
    }

    // --- 4. HANDLING PLAYER INPUT & MOVES ---
    function processMove(boardChanged, direction) { 
        // console.log(`PROCESSMOVE: After ${direction} move, boardChanged is: ${boardChanged}`);
        if (boardChanged === true) {
            // console.log("PROCESSMOVE: Board changed. Adding new tile, actuating, checking game state.");
            addRandomTile(); 
            actuate();   
            if (!hasWon && checkWinCondition()) { showWinMessage(); return; }
            if (!hasWon && checkGameOver()) { endGame(); }
        } else {
            // console.log("PROCESSMOVE: Board did not change.");
        }
    }

    document.addEventListener('keydown', handleKeyPress);
    // ... (handleKeyPress and touch handlers should be the same as response #53, ensure local 'changed' & 'direction')
    function handleKeyPress(event) {
        if ((isGameOver && !hasWon) || (youWinMessageElement && !youWinMessageElement.classList.contains('hidden'))) return;
        let changed = false; 
        let dir = "Unknown";
        try {
            switch (event.key) {
                case 'ArrowUp': dir = 'Up'; changed = moveTilesUp(); event.preventDefault(); break;
                case 'ArrowDown': dir = 'Down'; changed = moveTilesDown(); event.preventDefault(); break;
                case 'ArrowLeft': dir = 'Left'; changed = moveTilesLeft(); event.preventDefault(); break;
                case 'ArrowRight': dir = 'Right'; changed = moveTilesRight(); event.preventDefault(); break;
                default: return; 
            }
        } catch (e) { console.error(`INPUT_ERROR: During ${dir} key:`, e); changed = false; }
        // console.log(`INPUT: Key ${dir}. Move function returned: ${changed}`);
        processMove(changed, dir);
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
        let internalChanged = false; 
        let swipeDir = "None";
        try {
            if (Math.abs(deltaX) > Math.abs(deltaY)) { 
                if (Math.abs(deltaX) > swipeThreshold) { 
                    if (deltaX > 0) { swipeDir = 'Right'; internalChanged = moveTilesRight(); } 
                    else { swipeDir = 'Left'; internalChanged = moveTilesLeft(); }
                }
            } else { 
                if (Math.abs(deltaY) > swipeThreshold) { 
                    if (deltaY > 0) { swipeDir = 'Down'; internalChanged = moveTilesDown(); } 
                    else { swipeDir = 'Up'; internalChanged = moveTilesUp(); }
                }
            }
        } catch (e) { console.error(`INPUT_ERROR: During swipe ${swipeDir}:`, e); internalChanged = false; }
        // console.log(`INPUT: Swipe ${swipeDir}. Move function returned: ${internalChanged}`);
        processMove(internalChanged, swipeDir);
    }


    // --- 5. MOVEMENT LOGIC (Refactored to work with Tile objects) ---
    function prepareTilesForMove() {
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const tile = board[r][c];
                if (tile) {
                    tile.savePosition();    
                    tile.mergedFrom = null; 
                    tile.wasMergedThisTurn = false; 
                }
            }
        }
    }
    
    function processRowAndMerge(rowOfTiles) { // Renamed from processRowLeftAndMerge for clarity
        let filteredTiles = rowOfTiles.filter(tile => tile !== null);
        let newRowOutput = []; // Tiles that will be in the new row
        let changedInRow = false;
        let i = 0;

        while (i < filteredTiles.length) {
            let currentTile = filteredTiles[i];
            if (i + 1 < filteredTiles.length && filteredTiles[i+1].value === currentTile.value) {
                // Merge
                const mergedValue = currentTile.value * 2;
                score += mergedValue;
                
                // Create a new tile for the merged result.
                const mergedTile = new Tile(currentTile, mergedValue); // Position will be updated later
                mergedTile.wasMergedThisTurn = true;
                mergedTile.mergedFrom = [currentTile, filteredTiles[i+1]]; // Store original tiles

                newRowOutput.push(mergedTile);
                
                // Mark original tiles for removal by ensuring they are not in newRowOutput directly
                // The DOM cleanup in actuate will handle removing elements whose Tile objects are gone from the board.
                changedInRow = true;
                i += 2; // Skip currentTile and the one it merged with
            } else {
                newRowOutput.push(currentTile);
                i++;
            }
        }

        const finalPaddedRow = new Array(gridSize).fill(null);
        for (let k = 0; k < newRowOutput.length; k++) {
            finalPaddedRow[k] = newRowOutput[k];
        }
        
        // More robust change detection for the row based on tile IDs and values
        if (rowOfTiles.length !== finalPaddedRow.length) changedInRow = true;
        if (!changedInRow) {
            for (let k=0; k<gridSize; k++) {
                const oldVal = rowOfTiles[k] ? rowOfTiles[k].value : null;
                const newVal = finalPaddedRow[k] ? finalPaddedRow[k].value : null;
                if (oldVal !== newVal) {
                    changedInRow = true;
                    break;
                }
                // Also check if tile IDs are same if values are same (for simple slides)
                const oldId = rowOfTiles[k] ? rowOfTiles[k].id : null;
                const newId = finalPaddedRow[k] ? finalPaddedRow[k].id : null;
                 if (oldVal === newVal && oldId !== newId && oldVal !== null) { // A tile might have been replaced by a merged one
                    changedInRow = true;
                    break;
                }
            }
        }
        return { processedRow: finalPaddedRow, rowChanged: changedInRow };
    }

    function moveTilesLeft() { 
        prepareTilesForMove();
        let overallBoardChanged = false;
        for (let r = 0; r < gridSize; r++) {
            const { processedRow, rowChanged } = processRowAndMerge([...board[r]]);
            if (rowChanged) {
                overallBoardChanged = true;
                for(let c=0; c < gridSize; c++) {
                    board[r][c] = processedRow[c]; 
                    if (board[r][c]) { board[r][c].updatePosition({ r: r, c: c }); }
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
            const reversedRowInput = [...board[r]].reverse();
            const { processedRow: processedReversedRow, rowChanged } = processRowAndMerge(reversedRow);
            if (rowChanged) {
                overallBoardChanged = true;
                const finalNewRow = processedReversedRow.reverse();
                for (let c = 0; c < gridSize; c++) {
                    board[r][c] = finalNewRow[c];
                    if (board[r][c]) { board[r][c].updatePosition({ r: r, c: c }); }
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
        for (let r = 0; r < gridSize; r++) { 
            const { processedRow: newColAsRow, rowChanged } = processRowAndMerge([...tempLogicalBoard[r]]);
            if (rowChanged) {
                overallBoardChanged = true;
                for(let c=0; c < gridSize; c++) { 
                    tempLogicalBoard[r][c] = newColAsRow[c];
                }
            }
        }
        if (overallBoardChanged) {
            board = transposeBoard(tempLogicalBoard);
            for(let r_final=0; r_final<gridSize; r_final++) {
                for(let c_final=0; c_final<gridSize; c_final++) {
                    if(board[r_final][c_final]) {
                        board[r_final][c_final].updatePosition({r:r_final, c:c_final});
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
        for (let r = 0; r < gridSize; r++) { 
            const originalColAsRow = [...tempLogicalBoard[r]];
            const reversedColAsRow = originalColAsRow.reverse();
            const { processedRow: processedReversedCol, rowChanged } = processRowAndMerge(reversedColAsRow);
            if (rowChanged) {
                overallBoardChanged = true;
                const finalNewCol = processedReversedCol.reverse();
                for (let c = 0; c < gridSize; c++) { 
                    tempLogicalBoard[r][c] = finalNewCol[c];
                }
            }
        }
        if (overallBoardChanged) {
            board = transposeBoard(tempLogicalBoard);
            for(let r_final=0; r_final<gridSize; r_final++) {
                for(let c_final=0; c_final<gridSize; c_final++) {
                    if(board[r_final][c_final]) {
                        board[r_final][c_final].updatePosition({r:r_final, c:c_final});
                    }
                }
            }
        }
        // console.log("MOVE_FUNC: moveTilesDown returning:", overallBoardChanged);
        return overallBoardChanged;
    }

    // --- 6. GAME STATE LOGIC (WIN/GAME OVER) --- (Keep as is from #47/user's #48)
    function checkWinCondition() { /* ... */ }
    function showWinMessage() { /* ... */ }
    function canAnyTileMove() { /* ... */ }
    function checkGameOver() { /* ... */ } 
    function endGame() { /* ... */ }

    // --- Event Listeners for Buttons --- (Keep as is from #47/user's #48)
    if (newGameButton) newGameButton.addEventListener('click', startGame);
    // ... (other button listeners)
    
    window.addEventListener('resize', () => { /* ... (Keep as is from #47/user's #48) ... */ });

    startGame(); 
});
