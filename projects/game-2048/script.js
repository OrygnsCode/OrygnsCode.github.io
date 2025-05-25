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
    let tileElements = {}; // Ensures tileElements is declared in the outer scope

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
    }

    function calculateDimensions() {
        if (!gameBoardElement) {
            console.error("!!! calculateDimensions: gameBoardElement not found!");
            cellSize = 80; cellGapFromCSS = 10; firstCellOffsetX = 10; firstCellOffsetY = 10;
            return;
        }
        const firstBgCell = gameBoardElement.querySelector('.grid-cell');
        if (!firstBgCell) {
            console.error("!!! calculateDimensions: .grid-cell for measurement not found!");
            const boardStyleFallback = getComputedStyle(gameBoardElement);
            const boardClientWidthFallback = gameBoardElement.clientWidth;
            let computedGapFallback = parseFloat(boardStyleFallback.gap);
            if(isNaN(computedGapFallback)) computedGapFallback = 10;
            cellGapFromCSS = computedGapFallback;
            cellSize = (boardClientWidthFallback - (gridSize - 1) * cellGapFromCSS) / gridSize;
            firstCellOffsetX = parseFloat(boardStyleFallback.paddingLeft) || cellGapFromCSS; 
            firstCellOffsetY = parseFloat(boardStyleFallback.paddingTop) || cellGapFromCSS;  
        } else {
            const boardStyle = getComputedStyle(gameBoardElement);
            let computedGap = parseFloat(boardStyle.gap);
            if (isNaN(computedGap)) {
                const vminValue = Math.min(window.innerWidth, window.innerHeight) / 100;
                computedGap = Math.max(5, Math.min(2 * vminValue, 12)); // Estimate clamp
            }
            cellGapFromCSS = computedGap;
            cellSize = firstBgCell.offsetWidth; 
            firstCellOffsetX = firstBgCell.offsetLeft;
            firstCellOffsetY = firstBgCell.offsetTop;
        }
        // console.log(`DIMENSIONS: OffsetX=${firstCellOffsetX}px, OffsetY=${firstCellOffsetY}px, Gap=${cellGapFromCSS}px, CellSize=${cellSize}px`);
        if (isNaN(cellSize) || cellSize <= 0) {
            console.error("!!! CellSize invalid:", cellSize, "Using fallback 80px.");
            cellSize = 80; 
        }
        if (isNaN(firstCellOffsetX)) firstCellOffsetX = 10;
        if (isNaN(firstCellOffsetY)) firstCellOffsetY = 10;
        if (isNaN(cellGapFromCSS)) cellGapFromCSS = 10;
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

    function startGame() {
        console.log("INIT: Starting new game..."); // Your log line 119 (approx)
        isGameOver = false;
        hasWon = false;
        score = 0;
        tileIdCounter = 1; 
        updateScoreDisplay();

        // Clear existing numbered tile DOM elements from the board
        const existingNumberedTiles = gameBoardElement.querySelectorAll('.tile:not(.grid-cell)');
        existingNumberedTiles.forEach(tile => tile.remove());
        
        tileElements = {}; // Line 125 (approx) - re-initialize map for new game's DOM elements

        // Create background grid cells if they aren't there (e.g., first load)
        // Or if createBackgroundGrid already clears gameBoardElement.innerHTML, this check might not be needed
        // For safety, let's assume createBackgroundGrid is the authority for setting up the background.
        createBackgroundGrid(); 
        
        requestAnimationFrame(() => {
            calculateDimensions();  
            initializeBoardArray(); 
            addStartTiles();        
            actuate();              

            if (gameOverMessageElement) gameOverMessageElement.classList.add('hidden');
            if (youWinMessageElement) youWinMessageElement.classList.add('hidden');
            // console.log("INIT: Game started. Logical board:", JSON.parse(JSON.stringify(board.map(row => row.map(t => t ? t.value : null )))));
        });
    }

    function actuate() {
        updateScoreDisplay();

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const tile = board[r][c];
                if (tile) { 
                    tile.mergedFrom = null; 
                    // tile.savePosition(); // Should be called in prepareTilesForMove
                }
            }
        }

        // --- Create or update DOM elements for tiles ---
        const currentTileIdsOnBoard = new Set();

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const logicalTile = board[r][c]; 
                
                if (logicalTile) {
                    currentTileIdsOnBoard.add(logicalTile.id);
                    let tileElement = tileElements[logicalTile.id];

                    if (!tileElement) { 
                        tileElement = document.createElement('div');
                        tileElement.classList.add('tile');
                        // Initial position for new tiles (they will animate from here or from scale 0)
                        // If previousR/C are set, it implies a move, otherwise, it's a new spawn.
                        if (logicalTile.previousR !== null && logicalTile.previousC !== null) {
                             tileElement.style.left = `${firstCellOffsetX + logicalTile.previousC * (cellSize + cellGapFromCSS)}px`;
                             tileElement.style.top = `${firstCellOffsetY + logicalTile.previousR * (cellSize + cellGapFromCSS)}px`;
                        } else { // New tile, position directly at its target
                             tileElement.style.left = `${firstCellOffsetX + logicalTile.c * (cellSize + cellGapFromCSS)}px`;
                             tileElement.style.top = `${firstCellOffsetY + logicalTile.r * (cellSize + cellGapFromCSS)}px`;
                        }
                        gameBoardElement.appendChild(tileElement);
                        tileElements[logicalTile.id] = tileElement;
                    }
                    
                    tileElement.style.width = `${cellSize}px`;
                    tileElement.style.height = `${cellSize}px`;
                    tileElement.textContent = logicalTile.value;
                    tileElement.className = 'tile'; 
                    tileElement.classList.add(`tile-${logicalTile.value}`);
                    if (logicalTile.value > 2048) tileElement.classList.add('tile-super');

                    // Apply animations
                    if (logicalTile.justAppeared) {
                        tileElement.classList.add('tile-new'); // CSS has transform: scale(0), opacity: 0;
                        requestAnimationFrame(() => { // Allow initial state to apply
                           tileElement.style.transform = 'scale(1)';
                           tileElement.style.opacity = '1';
                        });
                        logicalTile.justAppeared = false; 
                    } else if (logicalTile.wasMergedThisTurn) {
                        tileElement.classList.add('tile-merged'); // CSS has pop animation
                        setTimeout(() => { if(tileElement) tileElement.classList.remove('tile-merged'); }, 200); 
                        logicalTile.wasMergedThisTurn = false;
                        // Ensure normal appearance after pop
                        tileElement.style.transform = 'scale(1)';
                        tileElement.style.opacity = '1';
                    } else {
                        // For moved tiles (not new, not merged this turn)
                        tileElement.style.transform = 'scale(1)';
                        tileElement.style.opacity = '1';
                    }
                    
                    // Set final target position (CSS transition will make it slide)
                    const targetLeft = firstCellOffsetX + logicalTile.c * (cellSize + cellGapFromCSS);
                    const targetTop = firstCellOffsetY + logicalTile.r * (cellSize + cellGapFromCSS);
                    
                    // Delay setting final position slightly to allow "from" position to render if different
                    requestAnimationFrame(() => {
                        tileElement.style.left = `${targetLeft}px`;
                        tileElement.style.top = `${targetTop}px`;
                    });
                }
            }
        }

        // Clean up DOM elements for tiles that are no longer in the logical board
        for (const tileId in tileElements) {
            if (!currentTileIdsOnBoard.has(parseInt(tileId))) {
                if (tileElements[tileId] && tileElements[tileId].remove) {
                    tileElements[tileId].remove();
                }
                delete tileElements[tileId];
            }
        }
        // console.log("ACTUATE: Display updated.");
    }

    function updateScoreDisplay() { if (scoreElement) scoreElement.textContent = score; }

    function getEmptyCells() {
        const localEmptyCells = [];
        try {
            if (!board || board.length !== gridSize) { return []; }
            for (let r = 0; r < gridSize; r++) {
                if (!board[r] || board[r].length !== gridSize) { return []; }
                for (let c = 0; c < gridSize; c++) { if (board[r][c] === null) localEmptyCells.push({ r, c }); }
            }
            return localEmptyCells;
        } catch (e) { console.error("Error in getEmptyCells:", e); return []; }
    }

    function addRandomTile() { 
        const emptyCells = getEmptyCells();
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            const newTile = new Tile({ r: randomCell.r, c: randomCell.c }, value);
            newTile.justAppeared = true; 
            board[randomCell.r][randomCell.c] = newTile;
        }
    }
    function addStartTiles() { addRandomTile(); addRandomTile(); }
    
    function processMove(boardChanged, direction) { 
        if (boardChanged === true) {
            addRandomTile(); 
            actuate();   
            if (!hasWon && checkWinCondition()) { showWinMessage(); return; }
            if (!hasWon && checkGameOver()) { endGame(); }
        }
    }

    document.addEventListener('keydown', handleKeyPress);
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
        processMove(internalChanged, swipeDir);
    }

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
    
    function processRowAndMerge(rowOfTiles) { 
        let filteredTiles = rowOfTiles.filter(tile => tile !== null);
        let newRowOutput = []; 
        let changedInRow = false;
        let i = 0;

        let originalValuesBeforeMergeAndSlide = rowOfTiles.map(t => t ? t.id : null); 

        while (i < filteredTiles.length) {
            let currentTile = filteredTiles[i];
            if (i + 1 < filteredTiles.length && filteredTiles[i+1].value === currentTile.value) {
                const mergedValue = currentTile.value * 2;
                score += mergedValue;
                
                // Create a new tile for the merged result, carrying over ID of currentTile (the one that stays)
                const mergedTile = new Tile({r: currentTile.r, c: currentTile.c}, mergedValue); // Position will be updated by caller
                mergedTile.id = currentTile.id; // Preserve ID of the tile that "absorbs"
                mergedTile.wasMergedThisTurn = true;
                mergedTile.mergedFrom = [currentTile, filteredTiles[i+1]]; 
                
                newRowOutput.push(mergedTile);
                // Mark the tile that got consumed (filteredTiles[i+1]) so its DOM can be removed
                if (tileElements[filteredTiles[i+1].id]) {
                    tileElements[filteredTiles[i+1].id].toBeRemovedAfterAnimation = true;
                }
                
                changedInRow = true;
                i += 2; 
            } else {
                newRowOutput.push(currentTile);
                i++;
            }
        }

        const finalPaddedRow = new Array(gridSize).fill(null);
        for (let k = 0; k < newRowOutput.length; k++) {
            finalPaddedRow[k] = newRowOutput[k];
            if (rowOfTiles[k] === null || (rowOfTiles[k] && finalPaddedRow[k] && rowOfTiles[k].id !== finalPaddedRow[k].id)) {
                 // If new position k has a tile, but old position k was null OR had a different tile ID
                changedInRow = true; 
            } else if (rowOfTiles[k] && finalPaddedRow[k] === null) {
                // If old position k had a tile, but new position k is null
                changedInRow = true;
            }
        }
        
        // Additional check if only values changed (e.g. merge without slide)
        if(!changedInRow) {
            let finalValues = finalPaddedRow.map(t => t ? t.value : null);
            let originalRawValues = rowOfTiles.map(t => t ? t.value : null);
            if(JSON.stringify(finalValues) !== JSON.stringify(originalRawValues)) {
                changedInRow = true;
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
        return overallBoardChanged;
    }

    function moveTilesRight() { 
        prepareTilesForMove();
        let overallBoardChanged = false;
        for (let r = 0; r < gridSize; r++) {
            const reversedRowInput = [...board[r]].reverse();
            const { processedRow: processedReversedRow, rowChanged } = processRowAndMerge(reversedRowInput);
            if (rowChanged) {
                overallBoardChanged = true;
                const finalNewRow = processedReversedRow.reverse();
                for (let c = 0; c < gridSize; c++) {
                    board[r][c] = finalNewRow[c];
                    if (board[r][c]) { board[r][c].updatePosition({ r: r, c: c }); }
                }
            }
        }
        return overallBoardChanged;
    }
    
    function transposeBoard(matrix) {
        try {
            if (!matrix || matrix.length !== gridSize || !matrix[0] || matrix[0].length !== gridSize) {
                console.error("Error in transposeBoard: Invalid matrix received", JSON.parse(JSON.stringify(matrix)));
                const fallbackMatrix = [];
                for(let r_fallback=0; r_fallback<gridSize; r_fallback++) fallbackMatrix.push(new Array(gridSize).fill(null));
                return fallbackMatrix; 
            }
            const newMatrix = matrix[0].map((col, i) => matrix.map(row => row[i]));
            return newMatrix;
        } catch (e) {
            console.error("ERROR in transposeBoard (catch):", e, "Matrix was:", JSON.parse(JSON.stringify(matrix)));
            const fallbackMatrix = [];
            for(let r_fallback=0; r_fallback<gridSize; r_fallback++) fallbackMatrix.push(new Array(gridSize).fill(null));
            return fallbackMatrix; 
        }
    }

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
        return overallBoardChanged;
    }

    // --- 6. GAME STATE LOGIC (WIN/GAME OVER) ---
    function checkWinCondition() {if (hasWon) return false; for(let r=0;r<gridSize;r++){for(let c=0;c<gridSize;c++){if(board[r][c] && board[r][c].value === targetTileValue){return true;}}}return false;}
    function showWinMessage() {hasWon=true;if(youWinMessageElement)youWinMessageElement.classList.remove('hidden'); /* console.log("WIN: You Win message shown"); */}
    function canAnyTileMove() {if(getEmptyCells().length>0)return true;for(let r=0;r<gridSize;r++){for(let c=0;c<gridSize-1;c++){if(board[r][c]&&board[r][c+1]&&board[r][c].value===board[r][c+1].value)return true;}}for(let c=0;c<gridSize;c++){for(let r=0;r<gridSize-1;r++){if(board[r][c]&&board[r+1][c]&&board[r][c].value===board[r+1][c].value)return true;}}return false;}
    function checkGameOver() {if(!canAnyTileMove()){/* console.log("GAMEOVER_CHECK: No moves possible."); */ return true;}return false;} 
    function endGame() {isGameOver=true;if(finalScoreElement)finalScoreElement.textContent=score;if(gameOverMessageElement)gameOverMessageElement.classList.remove('hidden'); /* console.log("GAMEOVER: Game Over message shown. Final Score:",score); */}

    // --- Event Listeners for Buttons ---
    if (newGameButton) newGameButton.addEventListener('click', startGame);
    if (tryAgainButton) tryAgainButton.addEventListener('click', startGame);
    if (keepPlayingButton) keepPlayingButton.addEventListener('click', () => {if(youWinMessageElement)youWinMessageElement.classList.add('hidden');isGameOver=false; hasWon=true; /* console.log("Keep playing selected."); */});
    if (newGameFromWinButton) newGameFromWinButton.addEventListener('click', startGame);
    
    window.addEventListener('resize', () => {
        // console.log("Window resized event triggered.");
        requestAnimationFrame(() => { 
            // console.log("RESIZE_RAF: Recalculating dimensions and actuating.");
            calculateDimensions();
            actuate(); 
        });
    });

    // --- Initial Game Start ---
    if (gameBoardElement) {
        startGame(); 
    } else {
        console.error("!!! CRITICAL: gameBoardElement is null AT SCRIPT END. Game cannot start.");
    }
});
