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
    let cellGapFromCSS = 0; 
    let firstCellOffsetX = 0; 
    let firstCellOffsetY = 0;
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
            cellSize = 80; cellGapFromCSS = 10; firstCellOffsetX = 10; firstCellOffsetY = 10;
            return;
        }

        const firstBgCell = gameBoardElement.querySelector('.grid-cell');
        if (!firstBgCell) {
            console.error("!!! calculateDimensions: .grid-cell for measurement not found! Ensure createBackgroundGrid ran and CSS is loaded.");
            // Fallback if no background cells to measure (e.g. CSS issue)
            const boardStyle = getComputedStyle(gameBoardElement);
            const boardClientWidth = gameBoardElement.clientWidth;
            let computedGapFallback = parseFloat(boardStyle.gap);
            if(isNaN(computedGapFallback)) computedGapFallback = 10;
            cellGapFromCSS = computedGapFallback;
            cellSize = (boardClientWidth - (gridSize - 1) * cellGapFromCSS) / gridSize;
            firstCellOffsetX = parseFloat(boardStyle.paddingLeft) || cellGapFromCSS; // Fallback for offset
            firstCellOffsetY = parseFloat(boardStyle.paddingTop) || cellGapFromCSS;  // Fallback for offset
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
        updateScoreDisplay();

        createBackgroundGrid(); 
        
        requestAnimationFrame(() => { // Ensure DOM is ready for measurements
            calculateDimensions();  
            
            initializeBoardArray();
            addRandomTile(true); 
            addRandomTile(true);
            
            renderBoard(true); 

            if (gameOverMessageElement) gameOverMessageElement.classList.add('hidden');
            if (youWinMessageElement) youWinMessageElement.classList.add('hidden');
            console.log("INIT: Game started. Initial logical board:", JSON.parse(JSON.stringify(board)));
        });
    }

    // --- 2. RENDERING THE BOARD ---
    function renderBoard(isInitialRender = false) {
        if (!gameBoardElement) { console.error("!!! RENDER: gameBoardElement not found!"); return; }
        if (cellSize <= 0 || isNaN(cellSize) || isNaN(cellGapFromCSS) || isNaN(firstCellOffsetX) || isNaN(firstCellOffsetY)) {
            console.error("!!! RENDER: Critical dimensions invalid. cellSize:", cellSize, "cellGap:", cellGapFromCSS, `offsets:(${firstCellOffsetX},${firstCellOffsetY})`);
            return; 
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
                    
                    tileElement.style.top = `${firstCellOffsetY + r * (cellSize + cellGapFromCSS)}px`;
                    tileElement.style.left = `${firstCellOffsetX + c * (cellSize + cellGapFromCSS)}px`;
                    
                    gameBoardElement.appendChild(tileElement);
                    // console.log(`RENDER: Placed tile ${tileValue} at [${r},${c}] -> left: ${tileElement.style.left}, top: ${tileElement.style.top}, width: ${tileElement.style.width}`);

                    if (newlyAddedTileInfo && newlyAddedTileInfo.r === r && newlyAddedTileInfo.c === c && !isInitialRender) {
                        // console.log("RENDER: Applying 'tile-new' animation to tile at:", newlyAddedTileInfo);
                        tileElement.classList.add('tile-new'); 
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => { 
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
                if (JSON.stringify(newRow) !== originalRowJSON) internalBoardChanged = true;
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
                if (JSON.stringify(newRow) !== originalRowJSON) internalBoardChanged = true;
            }
        } catch (e) { console.error("ERROR in moveTilesRight:", e); internalBoardChanged = false; }
        // console.log("MOVE_FUNC: moveTilesRight returning:", internalBoardChanged);
        return internalBoardChanged;
    }

    function transposeBoard(matrix) {
        try {
            if (!matrix || matrix.length !== gridSize || !matrix[0] || matrix[0].length !== gridSize) {
                console.error("Error in transposeBoard: Invalid matrix received for transpose", JSON.parse(JSON.stringify(matrix)));
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

    function moveTilesUp() { 
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
                if (JSON.stringify(newColAsRow) !== originalColAsRowJSON) internalBoardChanged = true;
            }
            if (internalBoardChanged) { board = transposeBoard(tempBoard); }
        } catch (e) { console.error("ERROR in moveTilesDown:", e); internalBoardChanged = false; }
        // console.log("MOVE_FUNC: moveTilesDown returning:", internalBoardChanged);
        return internalBoardChanged;
    }

    // --- 6. GAME STATE LOGIC (WIN/GAME OVER) ---
    function checkWinCondition() {for(let r=0;r<gridSize;r++){for(let c=0;c<gridSize;c++){if(board[r][c]===targetTile && !hasWon)return true;}}return false;}
    function showWinMessage() {hasWon=true;if(youWinMessageElement)youWinMessageElement.classList.remove('hidden');console.log("WIN: You Win message shown");}
    function canAnyTileMove() {if(getEmptyCells().length>0)return true;for(let r=0;r<gridSize;r++){for(let c=0;c<gridSize-1;c++){if(board[r][c]!==0&&board[r][c]===board[r][c+1])return true;}}for(let c=0;c<gridSize;c++){for(let r=0;r<gridSize-1;r++){if(board[r][c]!==0&&board[r][c]===board[r+1][c])return true;}}return false;}
    function checkGameOver() {if(!canAnyTileMove()){console.log("GAMEOVER_CHECK: No moves possible.");return true;}return false;} 
    function endGame() {isGameOver=true;if(finalScoreElement)finalScoreElement.textContent=score;if(gameOverMessageElement)gameOverMessageElement.classList.remove('hidden');console.log("GAMEOVER: Game Over message shown. Final Score:",score);}

    // --- Event Listeners for Buttons ---
    if (newGameButton) newGameButton.addEventListener('click', startGame);
    if (tryAgainButton) tryAgainButton.addEventListener('click', startGame);
    if (keepPlayingButton) keepPlayingButton.addEventListener('click', () => {if(youWinMessageElement)youWinMessageElement.classList.add('hidden');isGameOver=false; hasWon=true; console.log("Keep playing selected.");});
    if (newGameFromWinButton) newGameFromWinButton.addEventListener('click', startGame);
    
    window.addEventListener('resize', () => {
        console.log("Window resized event triggered. Recalculating dimensions.");
        requestAnimationFrame(() => { 
            calculateDimensions();
            renderBoard(true); 
        });
    });

    startGame(); 
});
