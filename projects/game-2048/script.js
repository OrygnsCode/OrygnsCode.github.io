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
    let tileElements = {}; // <<<< GLOBAL DECLARATION

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

    function startGame() {
        console.log("INIT: Starting new game..."); // This is your line 119 approx.
        isGameOver = false;
        hasWon = false;
        score = 0;
        tileIdCounter = 1; 
        updateScoreDisplay();

        // Ensure tileElements is an object, then clear its previous DOM elements
        // This was the fix from response #57 for the error you are seeing
        if (tileElements && typeof tileElements === 'object') { // Check before using Object.values
            Object.values(tileElements).forEach(el => { if(el && el.remove) el.remove(); });
        }
        tileElements = {}; // Line 125 (approx) in response #57. This is where your error pointed.
                           // If tileElements was not defined before this block, it would error on Object.values.
                           // But it *is* defined globally now.

        if (!gameBoardElement.querySelector('.grid-cell') || gameBoardElement.querySelectorAll('.grid-cell').length !== (gridSize*gridSize) ) {
             createBackgroundGrid(); 
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
    function actuate() {
        // ... (Keep the actuate function from response #57 exactly as it was) ...
        updateScoreDisplay();
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const tile = board[r][c];
                if (tile) { tile.mergedFrom = null; }
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
                        tileElement.style.left = `${firstCellOffsetX + logicalTile.c * (cellSize + cellGapFromCSS)}px`;
                        tileElement.style.top = `${firstCellOffsetY + logicalTile.r * (cellSize + cellGapFromCSS)}px`;
                        gameBoardElement.appendChild(tileElement);
                        tileElements[logicalTile.id] = tileElement;
                    }
                    tileElement.textContent = logicalTile.value;
                    tileElement.className = 'tile'; 
                    tileElement.classList.add(`tile-${logicalTile.value}`);
                    if (logicalTile.value > 2048) tileElement.classList.add('tile-super');
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
                        tileElement.style.transform = 'scale(1)';
                        tileElement.style.opacity = '1';
                    } else {
                        tileElement.style.transform = 'scale(1)';
                        tileElement.style.opacity = '1';
                    }
                    const targetLeft = firstCellOffsetX + logicalTile.c * (cellSize + cellGapFromCSS);
                    const targetTop = firstCellOffsetY + logicalTile.r * (cellSize + cellGapFromCSS);
                    tileElement.style.left = `${targetLeft}px`;
                    tileElement.style.top = `${targetTop}px`;
                }
            }
        }
        for (const tileId in tileElements) {
            let foundInBoard = false;
            for (let r = 0; r < gridSize; r++) {
                for (let c = 0; c < gridSize; c++) {
                    if (board[r][c] && board[r][c].id == tileId) {
                        foundInBoard = true; break;
                    }
                }
                if (foundInBoard) break;
            }
            if (!foundInBoard) {
                if (tileElements[tileId] && tileElements[tileId].remove) {
                    tileElements[tileId].remove();
                }
                delete tileElements[tileId];
            }
        }
    }

    function updateScoreDisplay() { if (scoreElement) scoreElement.textContent = score; }

    // --- 3. ADDING RANDOM TILES ---
    function getEmptyCells() { /* ... (Keep the version from response #57) ... */ }
    function addRandomTile() { /* ... (Keep the version from response #57) ... */ }
    function addStartTiles() { addRandomTile(); addRandomTile(); }
    
    // --- 4. HANDLING PLAYER INPUT & MOVES ---
    function processMove(boardChanged, direction) { /* ... (Keep the version from response #57) ... */ }
    document.addEventListener('keydown', handleKeyPress);
    function handleKeyPress(event) { /* ... (Keep the version from response #57) ... */ }
    gameBoardElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameBoardElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    gameBoardElement.addEventListener('touchend', handleTouchEnd, { passive: false });
    function handleTouchStart(event) { /* ... (Keep the version from response #57) ... */ }
    function handleTouchMove(event) { /* ... (Keep the version from response #57) ... */ }
    function handleTouchEnd(event) { /* ... (Keep the version from response #57) ... */ }
    function handleSwipe() { /* ... (Keep the version from response #57) ... */ }

    // --- 5. MOVEMENT LOGIC ---
    function prepareTilesForMove() { /* ... (Keep the version from response #57) ... */ }
    function processRowAndMerge(rowOfTiles) { /* ... (Keep the version from response #57) ... */ }
    function moveTilesLeft() { /* ... (Keep the version from response #57) ... */ }
    function moveTilesRight() { /* ... (Keep the version from response #57) ... */ }
    function transposeBoard(matrix) { /* ... (Keep the version from response #57) ... */ }
    function moveTilesUp() { /* ... (Keep the version from response #57) ... */ }
    function moveTilesDown() { /* ... (Keep the version from response #57) ... */ }

    // --- 6. GAME STATE LOGIC (WIN/GAME OVER) ---
    function checkWinCondition() { /* ... (Keep the version from response #57) ... */ }
    function showWinMessage() { /* ... (Keep the version from response #57) ... */ }
    function canAnyTileMove() { /* ... (Keep the version from response #57) ... */ }
    function checkGameOver() { /* ... (Keep the version from response #57) ... */ } 
    function endGame() { /* ... (Keep the version from response #57) ... */ }

    // --- Event Listeners for Buttons ---
    if (newGameButton) newGameButton.addEventListener('click', startGame);
    if (tryAgainButton) tryAgainButton.addEventListener('click', startGame);
    if (keepPlayingButton) keepPlayingButton.addEventListener('click', () => {if(youWinMessageElement)youWinMessageElement.classList.add('hidden');isGameOver=false; hasWon=true; console.log("Keep playing selected.");});
    if (newGameFromWinButton) newGameFromWinButton.addEventListener('click', startGame);
    
    window.addEventListener('resize', () => {
        console.log("Window resized event triggered. Recalculating dimensions.");
        requestAnimationFrame(() => { 
            calculateDimensions();
            actuate(); 
        });
    });

    startGame(); 
});
