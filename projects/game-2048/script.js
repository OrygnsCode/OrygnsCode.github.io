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
    let cellGapFromCSS = 0;     // To store actual computed gap
    let boardPaddingFromCSS = 0; // To store actual computed padding of the game board itself
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
            cellSize = 80; cellGapFromCSS = 10; boardPaddingFromCSS = 10; // Fallbacks
            return;
        }
        const boardStyle = getComputedStyle(gameBoardElement);
        const boardClientWidth = gameBoardElement.clientWidth; // Width INSIDE gameBoardElement's own CSS padding

        let computedGap = parseFloat(boardStyle.gap);
        let computedPadding = parseFloat(boardStyle.paddingTop); // Assuming padding is uniform (top, left, etc.)

        if (isNaN(computedGap)) {
            console.warn("Could not parse 'gap' from CSS. Using fallback 10px.");
            computedGap = 10;
        }
        if (isNaN(computedPadding)) {
            console.warn("Could not parse 'paddingTop' from CSS. Using fallback 10px.");
            computedPadding = 10;
        }
        
        cellGapFromCSS = computedGap;
        boardPaddingFromCSS = computedPadding; 
        
        // cellSize is based on the clientWidth (area available for cells after parent's padding is accounted for)
        // minus total gaps between cells, divided by grid size.
        cellSize = (boardClientWidth - (gridSize - 1) * cellGapFromCSS) / gridSize;

        console.log(`DIMENSIONS: ClientWidth=${boardClientWidth}px, BoardPadding=${boardPaddingFromCSS}px, CellGap=${cellGapFromCSS}px, Calculated CellSize=${cellSize}px`);
        
        if (isNaN(cellSize) || cellSize <= 0) {
            console.error("!!! Calculated cellSize is invalid! Value:", cellSize, "Using fallback 80px.");
            cellSize = 80;
        }
    }

    function createBackgroundGrid() {
        if (!gameBoardElement) { console.error("!!! createBackgroundGrid: gameBoardElement not found!"); return; }
        // Clear previous background cells and numbered tiles to be safe before rebuilding structure
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
        updateScoreDisplay();

        createBackgroundGrid();
        calculateDimensions(); 
        
        initializeBoardArray();
        addRandomTile(true); 
        addRandomTile(true);
        
        renderBoard(true); 

        if (gameOverMessageElement) gameOverMessageElement.classList.add('hidden');
        if (youWinMessageElement) youWinMessageElement.classList.add('hidden');
        console.log("INIT: Game started. Initial logical board:", JSON.parse(JSON.stringify(board)));
    }

    // --- 2. RENDERING THE BOARD ---
    function renderBoard(isInitialRender = false) {
        if (!gameBoardElement) { console.error("!!! RENDER: gameBoardElement not found!"); return; }
        if (cellSize <= 0 || isNaN(cellSize) || isNaN(cellGapFromCSS) || isNaN(boardPaddingFromCSS)) {
            console.error("!!! RENDER: Critical dimensions invalid. cellSize:", cellSize, "cellGap:", cellGapFromCSS, "boardPadding:", boardPaddingFromCSS, ". Recalculating...");
            calculateDimensions();
            if (cellSize <= 0 || isNaN(cellSize) || isNaN(cellGapFromCSS) || isNaN(boardPaddingFromCSS)) {
                 console.error("!!! RENDER: Critical dimensions still invalid. Aborting render.");
                 return;
            }
        }

        const existingNumberedTiles = gameBoardElement.querySelectorAll('.tile:not(.grid-cell)');
        existingNumberedTiles.forEach(tile => tile.remove());

        // console.log("RENDER: Drawing board. Logical data:", JSON.parse(JSON.stringify(board)));

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
                    
                    // Tiles are positioned absolutely within #game-board.
                    // #game-board's CSS padding creates the outer border.
                    // The .grid-cell elements are laid out by the grid within that padding.
                    // The numbered .tile elements should align with these .grid-cell positions.
                    // Their top-left is relative to the content box of #game-board (which starts after its padding).
                    tileElement.style.top = `${r * (cellSize + cellGapFromCSS)}px`;
                    tileElement.style.left = `${c * (cellSize + cellGapFromCSS)}px`;
                    
                    gameBoardElement.appendChild(tileElement);
                    // console.log(`RENDER: Placed tile ${tileValue} at [${r},${c}] -> left: ${tileElement.style.left}, top: ${tileElement.style.top}, width: ${tileElement.style.width}`);

                    if (newlyAddedTileInfo && newlyAddedTileInfo.r === r && newlyAddedTileInfo.c === c && !isInitialRender) {
                        // console.log("RENDER: Applying 'tile-new' animation to tile at:", newlyAddedTileInfo);
                        tileElement.classList.add('tile-new'); // CSS has transform: scale(0), opacity: 0
                        requestAnimationFrame(() => { // Allow initial styles to apply
                            requestAnimationFrame(() => { // Then trigger transition to final state
                                tileElement.style.transform = 'scale(1)';
                                tileElement.style.opacity = '1';
                            });
                        });
                    } else { 
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
    function getEmptyCells() {
        const emptyCells = [];
        for (let r = 0; r < gridSize; r++) { for (let c = 0; c < gridSize; c++) { if (board[r][c] === 0) emptyCells.push({ r, c }); } }
        return emptyCells;
    }
    function addRandomTile(isInitialSetup = false) {
        const emptyCells = getEmptyCells();
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const newValue = Math.random() < 0.9 ? 2 : 4;
            board[randomCell.r][randomCell.c] = newValue;
            console.log(`LOGIC: Added tile ${newValue} at [${randomCell.r},${randomCell.c}] to board data.`);
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
        if (boardChanged === true) {
            console.log("PROCESSMOVE: Board changed. Adding new tile, re-rendering, updating score.");
            addRandomTile(); 
            renderBoard();   
            updateScoreDisplay(); 
            if (!hasWon && checkWinCondition()) { showWinMessage(); return; }
            if (!hasWon && checkGameOver()) { endGame(); }
        } else {
            console.log("PROCESSMOVE: Board did not change.");
        }
    }

    document.addEventListener('keydown', handleKeyPress);
    function handleKeyPress(event) {
        if ((isGameOver && !hasWon) || (youWinMessageElement && !youWinMessageElement.classList.contains('hidden'))) return;
        let changed = false; 
        let direction = "Unknown";
        try {
            switch (event.key) {
                case 'ArrowUp': direction = 'Up'; changed = moveTilesUp(); event.preventDefault(); break;
                case 'ArrowDown': direction = 'Down'; changed = moveTilesDown(); event.preventDefault(); break;
                case 'ArrowLeft': direction = 'Left'; changed = moveTilesLeft(); event.preventDefault(); break;
                case 'ArrowRight': direction = 'Right'; changed = moveTilesRight(); event.preventDefault(); break;
                default: return; 
            }
        } catch (e) { console.error(`INPUT_ERROR: During ${direction} key:`, e); changed = false; }
        console.log(`INPUT: Key ${direction}. Move function returned: ${changed}`);
        processMove(changed, direction);
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
        let changed = false; 
        let direction = "None";
        try {
            if (Math.abs(deltaX) > Math.abs(deltaY)) { 
                if (Math.abs(deltaX) > swipeThreshold) { 
                    if (deltaX > 0) { direction = 'Right'; changed = moveTilesRight(); } 
                    else { direction = 'Left'; changed = moveTilesLeft(); }
                }
            } else { 
                if (Math.abs(deltaY) > swipeThreshold) { 
                    if (deltaY > 0) { direction = 'Down'; changed = moveTilesDown(); } 
                    else { direction = 'Up'; changed = moveTilesUp(); }
                }
            }
        } catch (e) { console.error(`INPUT_ERROR: During swipe ${direction}:`, e); changed = false; }
        console.log(`INPUT: Swipe ${direction}. Move function returned: ${changed}`);
        processMove(changed, direction);
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
        for (let i = 0; i < gridSize; i++) { newRow[i] = filteredRow[i] || 0; }
        return newRow;
    }

    function moveTilesLeft() { 
        let internalBoardChanged = false;
        try {
            for (let r = 0; r < gridSize; r++) {
                const originalRowJSON = JSON.stringify(board[r]);
                const newRow = processRowLeft([...board[r]]);
                board[r] = newRow; 
                if (JSON.stringify(newRow) !== originalRowJSON) {
                    internalBoardChanged = true;
                }
            }
        } catch (e) { console.error("ERROR in moveTilesLeft:", e); internalBoardChanged = false; }
        // console.log("MOVE_FUNC: moveTilesLeft returning:", internalBoardChanged);
        return internalBoardChanged;
    }

    function moveTilesRight() { 
        let internalBoardChanged = false;
        try {
            for (let r = 0; r < gridSize; r++) {
                const originalRowJSON = JSON.stringify(board[r]);
                const reversedRow = [...board[r]].reverse();
                const processedReversedRow = processRowLeft(reversedRow); 
                const newRow = processedReversedRow.reverse();
                board[r] = newRow;
                if (JSON.stringify(newRow) !== originalRowJSON) {
                    internalBoardChanged = true;
                }
            }
        } catch (e) { console.error("ERROR in moveTilesRight:", e); internalBoardChanged = false; }
        // console.log("MOVE_FUNC: moveTilesRight returning:", internalBoardChanged);
        return internalBoardChanged;
    }

    function transposeBoard(matrix) {
        try {
            // Ensure matrix and matrix[0] exist before trying to get length
            if (!matrix || !matrix.length || !matrix[0] || !matrix[0].length) {
                console.error("Error in transposeBoard: Invalid matrix received", matrix);
                const fallbackMatrix = [];
                for(let r=0; r<gridSize; r++) fallbackMatrix.push(new Array(gridSize).fill(0));
                return fallbackMatrix; 
            }
            const newMatrix = matrix[0].map((col, i) => matrix.map(row => row[i]));
            return newMatrix;
        } catch (e) {
            console.error("ERROR in transposeBoard:", e, "Matrix was:", JSON.parse(JSON.stringify(matrix)));
            const fallbackMatrix = [];
            for(let r=0; r<gridSize; r++) fallbackMatrix.push(new Array(gridSize).fill(0));
            return fallbackMatrix; 
        }
    }

    function moveTilesUp() { 
        let internalBoardChanged = false;
        try {
            let tempBoard = transposeBoard(board); 
            for (let r = 0; r < gridSize; r++) { 
                const originalColAsRowJSON = JSON.stringify(tempBoard[r]);
                const newColAsRow = processRowLeft([...tempBoard[r]]); 
                tempBoard[r] = newColAsRow;
                if (JSON.stringify(newColAsRow) !== originalColAsRowJSON) {
                    internalBoardChanged = true;
                }
            }
            if (internalBoardChanged) { board = transposeBoard(tempBoard); }
        } catch (e) { console.error("ERROR in moveTilesUp:", e); internalBoardChanged = false; }
        // console.log("MOVE_FUNC: moveTilesUp returning:", internalBoardChanged);
        return internalBoardChanged;
    }

    function moveTilesDown() { 
        let internalBoardChanged = false;
        try {
            let tempBoard = transposeBoard(board); 
            for (let r = 0; r < gridSize; r++) { 
                const originalColAsRowJSON = JSON.stringify(tempBoard[r]);
                const reversedColAsRow = [...tempBoard[r]].reverse();
                const processedReversedColAsRow = processRowLeft(reversedColAsRow);
                const newColAsRow = processedReversedColAsRow.reverse();
                tempBoard[r] = newColAsRow;
                if (JSON.stringify(newColAsRow) !== originalColAsRowJSON) {
                    internalBoardChanged = true;
                }
            }
            if (internalBoardChanged) { board = transposeBoard(tempBoard); }
        } catch (e) { console.error("ERROR in moveTilesDown:", e); internalBoardChanged = false; }
        // console.log("MOVE_FUNC: moveTilesDown returning:", internalBoardChanged);
        return internalBoardChanged;
    }

    // --- 6. GAME STATE LOGIC (WIN/GAME OVER) ---
    function checkWinCondition() {for(let r=0;r<gridSize;r++){for(let c=0;c<gridSize;c++){if(board[r][c]===targetTile && !hasWon)return true;}}return false;} // Check hasWon here
    function showWinMessage() {hasWon=true;if(youWinMessageElement)youWinMessageElement.classList.remove('hidden');console.log("WIN: You Win message shown");}
    function canAnyTileMove() {if(getEmptyCells().length>0)return true;for(let r=0;r<gridSize;r++){for(let c=0;c<gridSize-1;c++){if(board[r][c]!==0&&board[r][c]===board[r][c+1])return true;}}for(let c=0;c<gridSize;c++){for(let r=0;r<gridSize-1;r++){if(board[r][c]!==0&&board[r][c]===board[r+1][c])return true;}}console.log("GAMEOVER_CHECK: No empty cells & no merges possible."); return false;}
    function checkGameOver() {if(!canAnyTileMove()){console.log("GAMEOVER_CHECK: Game is over.");return true;}return false;} 
    function endGame() {isGameOver=true;if(finalScoreElement)finalScoreElement.textContent=score;if(gameOverMessageElement)gameOverMessageElement.classList.remove('hidden');console.log("GAMEOVER: Game Over message shown. Final Score:",score);}

    // --- Event Listeners for Buttons ---
    if (newGameButton) newGameButton.addEventListener('click', startGame);
    if (tryAgainButton) tryAgainButton.addEventListener('click', startGame);
    if (keepPlayingButton) keepPlayingButton.addEventListener('click', () => {if(youWinMessageElement)youWinMessageElement.classList.add('hidden');isGameOver=false; /* allow play to continue */ console.log("Keep playing selected.");});
    if (newGameFromWinButton) newGameFromWinButton.addEventListener('click', startGame);
    
    window.addEventListener('resize', () => {
        console.log("Window resized event triggered. Recalculating dimensions.");
        calculateDimensions();
        renderBoard(true); // Re-render based on new dimensions
    });

    startGame(); 
});
