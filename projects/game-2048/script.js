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

    // Use a fixed gap for JS calculations to ensure consistency.
    // This MUST visually align with the 'gap' and 'padding' used by the CSS for #game-board.
    // Your CSS uses `clamp(5px, 2vmin, 12px)`. For many screens, 12px will be the gap.
    // Let's assume the effective spacing unit (gap or padding component) is this.
    const JS_SPACING_UNIT = 12; 
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
            cellSize = 80; return; // Fallback
        }
        
        // Get computed style to find the actual padding of the game board
        const boardStyle = getComputedStyle(gameBoardElement);
        const boardPaddingValue = parseFloat(boardStyle.paddingTop); // Assuming padding is uniform

        if (isNaN(boardPaddingValue)) {
            console.warn("Could not parse paddingTop from #game-board. Using JS_SPACING_UNIT as fallback for padding offset.");
            // If padding can't be read, our tile positions might be off from the background grid if it's deeply padded.
            // However, tiles are positioned relative to the content-box, so 0,0 is fine if there's no *extra* offset needed.
        }

        // clientWidth is the width of the content area (inside CSS padding of #game-board)
        const boardContentWidth = gameBoardElement.clientWidth; 
        
        // cellSize is based on the contentWidth minus total gaps between cells, divided by grid size
        cellSize = (boardContentWidth - (gridSize - 1) * JS_SPACING_UNIT) / gridSize;

        console.log(`DIMENSIONS: BoardContentWidth=${boardContentWidth}px, JS_SPACING_UNIT (for gap)=${JS_SPACING_UNIT}px, Calculated CellSize=${cellSize}px`);
        
        if (isNaN(cellSize) || cellSize <= 0) {
            console.error("!!! Calculated cellSize is invalid! Value:", cellSize, "Using fallback 80px.");
            cellSize = 80;
        }
    }

    function createBackgroundGrid() {
        if (!gameBoardElement) { console.error("!!! createBackgroundGrid: gameBoardElement not found!"); return; }
        // Clear only previous background cells, not all children, to preserve overlays
        const existingBgCells = gameBoardElement.querySelectorAll('.grid-cell');
        existingBgCells.forEach(cell => cell.remove());

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
        updateScoreDisplay();

        createBackgroundGrid(); // Create static background cells first
        calculateDimensions();  // Then calculate sizes
        
        initializeBoardArray();
        addRandomTile(true); 
        addRandomTile(true);
        
        renderBoard(true); // isInitialRender = true

        if (gameOverMessageElement) gameOverMessageElement.classList.add('hidden');
        if (youWinMessageElement) youWinMessageElement.classList.add('hidden');
        console.log("INIT: Game started. Initial logical board:", JSON.parse(JSON.stringify(board)));
    }

    // --- 2. RENDERING THE BOARD ---
    function renderBoard(isInitialRender = false) {
        if (!gameBoardElement) { console.error("!!! RENDER: gameBoardElement not found!"); return; }
        if (cellSize <= 0 || isNaN(cellSize)) {
            console.error("!!! RENDER: cellSize invalid (" + cellSize + "), cannot render tiles.");
            return; 
        }

        // Remove previous *numbered* tiles only. Background .grid-cell divs (children of #game-board) remain.
        const existingNumberedTiles = gameBoardElement.querySelectorAll('.tile:not(.grid-cell)');
        existingNumberedTiles.forEach(tile => tile.remove());

        // console.log("RENDER: Drawing board. Logical data:", JSON.parse(JSON.stringify(board))); // Verbose

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
                    
                    // Tiles are positioned absolutely relative to #game-board's content box.
                    // The CSS grid on #game-board lays out the .grid-cell background.
                    // These calculations should align the .tile divs over the .grid-cell divs.
                    const topPosition = r * (cellSize + JS_SPACING_UNIT);
                    const leftPosition = c * (cellSize + JS_SPACING_UNIT);
                    tileElement.style.top = `${topPosition}px`;
                    tileElement.style.left = `${leftPosition}px`;
                    
                    gameBoardElement.appendChild(tileElement);
                    // console.log(`RENDER: Placed tile ${tileValue} at [${r},${c}] -> CSS left: ${leftPosition}px, CSS top: ${topPosition}px, CSS width: ${cellSize}px`);

                    // Animation for new tiles
                    if (newlyAddedTileInfo && newlyAddedTileInfo.r === r && newlyAddedTileInfo.c === c && !isInitialRender) {
                        // console.log("RENDER: Applying 'tile-new' animation to tile at:", newlyAddedTileInfo);
                        tileElement.classList.add('tile-new'); // CSS applies initial transform: scale(0), opacity: 0
                        // Ensure browser picks up initial state before transitioning
                        requestAnimationFrame(() => {
                            tileElement.style.transform = 'scale(1)';
                            tileElement.style.opacity = '1';
                        });
                    } else { 
                        // For initial tiles or moved/merged tiles (which are re-created in this render model)
                        // Ensure they are fully visible immediately.
                        tileElement.style.transform = 'scale(1)';
                        tileElement.style.opacity = '1';
                    }
                }
            }
        }
        newlyAddedTileInfo = null; 
    }

    function updateScoreDisplay() { if (scoreElement) scoreElement.textContent = score; }

    // --- 3. ADDING RANDOM TILES ---
    function getEmptyCells() { /* ... (same as your last working version) ... */ 
        const emptyCells = [];
        for (let r = 0; r < gridSize; r++) { for (let c = 0; c < gridSize; c++) { if (board[r][c] === 0) emptyCells.push({ r, c }); } }
        return emptyCells;
    }
    function addRandomTile(isInitialSetup = false) { /* ... (same as your last working version, ensure it sets newlyAddedTileInfo if !isInitialSetup) ... */ 
        const emptyCells = getEmptyCells();
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const newValue = Math.random() < 0.9 ? 2 : 4;
            board[randomCell.r][randomCell.c] = newValue;
            // console.log(`LOGIC: Added tile ${newValue} at [${randomCell.r},${randomCell.c}] to board data.`);
            if (!isInitialSetup) {
                newlyAddedTileInfo = { r: randomCell.r, c: randomCell.c };
            }
        } else {
            // console.log("LOGIC: No empty cells to add a random tile.");
        }
    }
    
    // --- 4. HANDLING PLAYER INPUT & MOVES ---
    function processMove(boardChanged, direction) { 
        // console.log(`PROCESSMOVE: After ${direction} move, boardChanged is: ${boardChanged} (Type: ${typeof boardChanged})`);
        if (boardChanged === true) {
            // console.log("PROCESSMOVE: Board changed. Adding new tile, re-rendering, updating score.");
            addRandomTile(); 
            renderBoard();   
            updateScoreDisplay(); 
            if (!hasWon && checkWinCondition()) { showWinMessage(); return; }
            if (!hasWon && checkGameOver()) { endGame(); }
        } else {
            // console.log("PROCESSMOVE: Board did not change.");
        }
    }

    document.addEventListener('keydown', handleKeyPress);
    function handleKeyPress(event) { /* ... (same as your last working version) ... */ 
        if ((isGameOver && !hasWon) || (youWinMessageElement && !youWinMessageElement.classList.contains('hidden'))) return;
        let changed = false; 
        let dir = "Unknown"; // Renamed to avoid conflict if direction was global (it wasn't, but good practice)
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
    function handleSwipe() { /* ... (same as your last working version, ensure 'changed' and 'direction' are locally scoped) ... */ 
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


    // --- 5. MOVEMENT LOGIC --- (These should be exactly your last working versions)
    function processRowLeft(row) { /* ... (same as your last confirmed working version) ... */ 
        let filteredRow = row.filter(val => val !== 0);
        for (let i = 0; i < filteredRow.length - 1; i++) {
            if (filteredRow[i] === filteredRow[i+1]) {
                filteredRow[i] *= 2; score += filteredRow[i]; filteredRow.splice(i + 1, 1); 
            }
        }
        const newRow = [];
        for (let i = 0; i < gridSize; i++) { newRow[i] = filteredRow[i] || 0; }
        return newRow;
    }
    function moveTilesLeft() { /* ... (same as your last confirmed working version, ensure it returns boolean) ... */ 
        let internalBoardChanged = false;
        try {
            for (let r = 0; r < gridSize; r++) {
                const originalRowJSON = JSON.stringify(board[r]);
                const newRow = processRowLeft([...board[r]]);
                board[r] = newRow; 
                if (JSON.stringify(newRow) !== originalRowJSON) internalBoardChanged = true;
            }
        } catch (e) { console.error("ERROR in moveTilesLeft:", e); internalBoardChanged = false; }
        return internalBoardChanged;
    }
    function moveTilesRight() { /* ... (same as your last confirmed working version, ensure it returns boolean) ... */ 
        let internalBoardChanged = false;
        try {
            for (let r = 0; r < gridSize; r++) {
                const originalRowJSON = JSON.stringify(board[r]);
                const reversedRow = [...board[r]].reverse();
                const processedReversedRow = processRowLeft(reversedRow); 
                const newRow = processedReversedRow.reverse();
                board[r] = newRow;
                if (JSON.stringify(newRow) !== originalRowJSON) internalBoardChanged = true;
            }
        } catch (e) { console.error("ERROR in moveTilesRight:", e); internalBoardChanged = false; }
        return internalBoardChanged;
    }
    function transposeBoard(matrix) { /* ... (same as your last confirmed working version, with robust error check) ... */ 
        try {
            if (!matrix || !matrix.length || !matrix[0] || !matrix[0].length || typeof matrix[0].map !== 'function') {
                console.error("Error in transposeBoard: Invalid matrix received", JSON.parse(JSON.stringify(matrix)));
                const fallbackMatrix = [];
                for(let r=0; r<gridSize; r++) fallbackMatrix.push(new Array(gridSize).fill(0));
                return fallbackMatrix; 
            }
            const newMatrix = matrix[0].map((col, i) => matrix.map(row => row[i]));
            return newMatrix;
        } catch (e) {
            console.error("ERROR in transposeBoard (catch):", e, "Matrix was:", JSON.parse(JSON.stringify(matrix)));
            const fallbackMatrix = [];
            for(let r=0; r<gridSize; r++) fallbackMatrix.push(new Array(gridSize).fill(0));
            return fallbackMatrix; 
        }
    }
    function moveTilesUp() { /* ... (same as your last confirmed working version, ensure it returns boolean) ... */ 
        let internalBoardChanged = false;
        try {
            let tempBoard = transposeBoard(board); 
            for (let r = 0; r < gridSize; r++) { 
                const originalColAsRowJSON = JSON.stringify(tempBoard[r]);
                const newColAsRow = processRowLeft([...tempBoard[r]]); 
                tempBoard[r] = newColAsRow;
                if (JSON.stringify(newColAsRow) !== originalColAsRowJSON) internalBoardChanged = true;
            }
            if (internalBoardChanged) { board = transposeBoard(tempBoard); }
        } catch (e) { console.error("ERROR in moveTilesUp:", e); internalBoardChanged = false; }
        return internalBoardChanged;
    }
    function moveTilesDown() { /* ... (same as your last confirmed working version, ensure it returns boolean) ... */ 
        let internalBoardChanged = false;
        try {
            let tempBoard = transposeBoard(board); 
            for (let r = 0; r < gridSize; r++) { 
                const originalColAsRowJSON = JSON.stringify(tempBoard[r]);
                const reversedColAsRow = [...tempBoard[r]].reverse();
                const processedReversedColAsRow = processRowLeft(reversedColAsRow);
                const newColAsRow = processedReversedColAsRow.reverse();
                tempBoard[r] = newColAsRow;
                if (JSON.stringify(newColAsRow) !== originalColAsRowJSON) internalBoardChanged = true;
            }
            if (internalBoardChanged) { board = transposeBoard(tempBoard); }
        } catch (e) { console.error("ERROR in moveTilesDown:", e); internalBoardChanged = false; }
        return internalBoardChanged;
    }

    // --- 6. GAME STATE LOGIC (WIN/GAME OVER) --- (Same as your last working version)
    function checkWinCondition() {for(let r=0;r<gridSize;r++){for(let c=0;c<gridSize;c++){if(board[r][c]===targetTile && !hasWon)return true;}}return false;}
    function showWinMessage() {hasWon=true;if(youWinMessageElement)youWinMessageElement.classList.remove('hidden');console.log("WIN: You Win message shown");}
    function canAnyTileMove() {if(getEmptyCells().length>0)return true;for(let r=0;r<gridSize;r++){for(let c=0;c<gridSize-1;c++){if(board[r][c]!==0&&board[r][c]===board[r][c+1])return true;}}for(let c=0;c<gridSize;c++){for(let r=0;r<gridSize-1;r++){if(board[r][c]!==0&&board[r][c]===board[r+1][c])return true;}}return false;}
    function checkGameOver() {if(!canAnyTileMove()){console.log("GAMEOVER_CHECK: No moves possible.");return true;}return false;} 
    function endGame() {isGameOver=true;if(finalScoreElement)finalScoreElement.textContent=score;if(gameOverMessageElement)gameOverMessageElement.classList.remove('hidden');console.log("GAMEOVER: Game Over message shown. Final Score:",score);}

    // --- Event Listeners for Buttons ---
    if (newGameButton) newGameButton.addEventListener('click', startGame);
    if (tryAgainButton) tryAgainButton.addEventListener('click', startGame);
    if (keepPlayingButton) keepPlayingButton.addEventListener('click', () => {if(youWinMessageElement)youWinMessageElement.classList.add('hidden');isGameOver=false; hasWon=true; /* Acknowledge win but allow play */ console.log("Keep playing selected.");});
    if (newGameFromWinButton) newGameFromWinButton.addEventListener('click', startGame);
    
    window.addEventListener('resize', () => {
        console.log("Window resized event triggered. Recalculating dimensions.");
        calculateDimensions();
        renderBoard(true); 
    });

    startGame(); 
});
