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
    let visualTiles = []; // Array to hold references to the DOM tile elements
    let score = 0;
    let isGameOver = false;
    let hasWon = false;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    const swipeThreshold = 30; 

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

    // NEW: Function to create the persistent visual tile elements
    function createVisualGrid() {
        gameBoardElement.innerHTML = ''; // Clear board element once at the start
        visualTiles = []; // Reset visual tiles array
        for (let r = 0; r < gridSize; r++) {
            visualTiles[r] = [];
            for (let c = 0; c < gridSize; c++) {
                const tileElement = document.createElement('div');
                tileElement.classList.add('tile'); // Base style for all tile slots
                gameBoardElement.appendChild(tileElement);
                visualTiles[r][c] = tileElement; // Store reference
            }
        }
    }

    function startGame() {
        console.log("Starting new game...");
        isGameOver = false;
        hasWon = false; 
        score = 0;
        
        if (visualTiles.length === 0) { // Create visual grid only once or if it's not there
            createVisualGrid();
        }
        
        initializeBoardArray(); 
        
        addRandomTile(true); // Pass true for isInitialSetup for potential animation control
        addRandomTile(true);
        
        renderBoard(); 
        updateScoreDisplay();
        if (gameOverMessageElement) gameOverMessageElement.classList.add('hidden'); 
        if (youWinMessageElement) youWinMessageElement.classList.add('hidden'); 
    }

    // --- 2. RENDERING THE BOARD ---
    // MODIFIED: renderBoard now updates persistent tile elements
    function renderBoard(animateNewTileInfo = null) {
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const tileValue = board[r][c];
                const tileElement = visualTiles[r][c]; // Get the persistent DOM element

                // Reset classes, keeping only 'tile'
                tileElement.className = 'tile'; 
                tileElement.textContent = '';

                if (tileValue !== 0) {
                    tileElement.textContent = tileValue;
                    tileElement.classList.add(`tile-${tileValue}`); 
                    if (tileValue > 2048) { 
                        tileElement.classList.add('tile-super');
                    }

                    // If this tile was just added, animate it
                    if (animateNewTileInfo && animateNewTileInfo.r === r && animateNewTileInfo.c === c) {
                        tileElement.classList.add('tile-new');
                        // Remove the animation class after animation completes to allow re-triggering
                        setTimeout(() => {
                            tileElement.classList.remove('tile-new');
                        }, 200); // Match CSS animation duration
                    }
                }
            }
        }
        // console.log("Board rendered by updating existing tile elements.");
    }

    function updateScoreDisplay() { /* ... (same as before) ... */ 
        if (scoreElement) scoreElement.textContent = score;
    }

    // --- 3. ADDING RANDOM TILES ---
    // MODIFIED: addRandomTile now triggers renderBoard with info about the new tile
    function getEmptyCells() { /* ... (same as before) ... */ 
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
            
            // If not initial setup, specifically re-render with animation info for this new tile
            if (!isInitialSetup) {
                renderBoard({ r: randomCell.r, c: randomCell.c, value: newValue });
            }
        }
    }

    // --- 4. HANDLING PLAYER INPUT ---
    document.addEventListener('keydown', handleKeyPress);

    function handleKeyPress(event) { /* ... (same as before, calls processMove) ... */ 
        if (isGameOver && !hasWon) return; 
        if (youWinMessageElement && !youWinMessageElement.classList.contains('hidden')) return;

        let boardChanged = false; 
        switch (event.key) {
            case 'ArrowUp': boardChanged = moveTilesUp(); event.preventDefault(); break;
            case 'ArrowDown': boardChanged = moveTilesDown(); event.preventDefault(); break;
            case 'ArrowLeft': boardChanged = moveTilesLeft(); event.preventDefault(); break;
            case 'ArrowRight': boardChanged = moveTilesRight(); event.preventDefault(); break;
            default: return; 
        }
        processMove(boardChanged);
    }

    // Touch Input Listeners (same as before)
    gameBoardElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameBoardElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    gameBoardElement.addEventListener('touchend', handleTouchEnd, { passive: false });

    function handleTouchStart(event) { /* ... (same as before) ... */ 
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }
    function handleTouchMove(event) { /* ... (same as before) ... */ 
        event.preventDefault();
    }
    function handleTouchEnd(event) { /* ... (same as before, calls handleSwipe) ... */ 
        if (isGameOver && !hasWon) return;
        if (youWinMessageElement && !youWinMessageElement.classList.contains('hidden')) return;
        touchEndX = event.changedTouches[0].clientX;
        touchEndY = event.changedTouches[0].clientY;
        handleSwipe();
    }
    function handleSwipe() { /* ... (same as before, calls processMove) ... */ 
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        let boardChanged = false;
        if (Math.abs(deltaX) > Math.abs(deltaY)) { 
            if (Math.abs(deltaX) > swipeThreshold) { 
                if (deltaX > 0) { boardChanged = moveTilesRight(); } 
                else { boardChanged = moveTilesLeft(); }
            }
        } else { 
            if (Math.abs(deltaY) > swipeThreshold) { 
                if (deltaY > 0) { boardChanged = moveTilesDown(); } 
                else { boardChanged = moveTilesUp(); }
            }
        }
        processMove(boardChanged);
    }
    
    function processMove(boardChanged) {
        if (boardChanged) {
            // Add random tile (which now calls renderBoard with animation hint for the new tile)
            addRandomTile(); 
            // If addRandomTile doesn't render, or if other tiles moved, render all here.
            // For now, addRandomTile will trigger a targeted render for the new tile.
            // We still need a general render for moved/merged tiles if we don't do it selectively.
            // Let's call renderBoard() here to update all other tiles that might have moved/merged,
            // but without animation hints for them yet.
            renderBoard(); // This will redraw all tiles based on current board data.
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

    // --- 5. MOVEMENT LOGIC --- (All movement functions are the same as before)
    function processRowLeft(row) { /* ... (same as before) ... */ 
        let filteredRow = row.filter(val => val !== 0);
        for (let i = 0; i < filteredRow.length - 1; i++) {
            if (filteredRow[i] === filteredRow[i+1]) {
                filteredRow[i] *= 2; 
                score += filteredRow[i]; 
                filteredRow.splice(i + 1, 1); 
            }
        }
        const newRow = [];
        for (let i = 0; i < gridSize; i++) {
            newRow[i] = filteredRow[i] || 0; 
        }
        return newRow;
    }
    function moveTilesLeft() { /* ... (same as before) ... */ 
        let boardChanged = false;
        for (let r = 0; r < gridSize; r++) {
            const originalRow = [...board[r]]; 
            const newRow = processRowLeft([...board[r]]); 
            board[r] = newRow; 
            if (!originalRow.every((val, index) => val === newRow[index])) {
                boardChanged = true;
            }
        }
        return boardChanged;
    }
    function moveTilesRight() { /* ... (same as before) ... */ 
        let boardChanged = false;
        for (let r = 0; r < gridSize; r++) {
            const originalRow = [...board[r]];
            const reversedRow = [...originalRow].reverse();
            const processedReversedRow = processRowLeft(reversedRow); 
            const newRow = processedReversedRow.reverse();
            board[r] = newRow;
            if (!originalRow.every((val, index) => val === newRow[index])) {
                boardChanged = true;
            }
        }
        return boardChanged;
    }
    function transposeBoard(matrix) { /* ... (same as before) ... */ 
        const rows = matrix.length;
        const cols = matrix[0].length;
        const newMatrix = [];
        for (let j = 0; j < cols; j++) {
            newMatrix[j] = [];
            for (let i = 0; i < rows; i++) {
                newMatrix[j][i] = matrix[i][j];
            }
        }
        return newMatrix;
    }
    function moveTilesUp() { /* ... (same as before) ... */ 
        let boardChanged = false;
        let tempBoard = transposeBoard(board); 
        for (let r = 0; r < gridSize; r++) { 
            const originalColAsRow = [...tempBoard[r]];
            const newColAsRow = processRowLeft([...originalColAsRow]); 
            tempBoard[r] = newColAsRow;
            if (!originalColAsRow.every((val, index) => val === newColAsRow[index])) {
                boardChanged = true;
            }
        }
        if (boardChanged) {
            board = transposeBoard(tempBoard); 
        }
        return boardChanged;
    }
    function moveTilesDown() { /* ... (same as before) ... */ 
        let boardChanged = false;
        let tempBoard = transposeBoard(board); 
        for (let r = 0; r < gridSize; r++) { 
            const originalColAsRow = [...tempBoard[r]];
            const reversedColAsRow = [...originalColAsRow].reverse();
            const processedReversedColAsRow = processRowLeft(reversedColAsRow);
            const newColAsRow = processedReversedColAsRow.reverse();
            tempBoard[r] = newColAsRow;
            if (!originalColAsRow.every((val, index) => val === newColAsRow[index])) {
                boardChanged = true;
            }
        }
        if (boardChanged) {
            board = transposeBoard(tempBoard); 
        }
        return boardChanged;
    }

    // --- 6. GAME STATE LOGIC (WIN/GAME OVER) --- (All same as before)
    function checkWinCondition() { /* ... (same as before) ... */ 
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (board[r][c] === targetTile) {
                    console.log("Win condition met: 2048 tile reached!");
                    return true;
                }
            }
        }
        return false;
    }
    function showWinMessage() { /* ... (same as before) ... */ 
        hasWon = true; 
        if (youWinMessageElement) {
            youWinMessageElement.classList.remove('hidden');
        }
    }
    function canAnyTileMove() { /* ... (same as before) ... */ 
        if (getEmptyCells().length > 0) return true; 
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize - 1; c++) {
                if (board[r][c] !== 0 && board[r][c] === board[r][c + 1]) return true; 
            }
        }
        for (let c = 0; c < gridSize; c++) { 
            for (let r = 0; r < gridSize - 1; r++) { 
                if (board[r][c] !== 0 && board[r][c] === board[r + 1][c]) return true; 
            }
        }
        return false; 
    }
    function checkGameOver() { /* ... (same as before) ... */ 
        if (!canAnyTileMove()) return true; 
        return false; 
    } 
    function endGame() { /* ... (same as before) ... */ 
        isGameOver = true; 
        if(finalScoreElement) finalScoreElement.textContent = score;
        if(gameOverMessageElement) gameOverMessageElement.classList.remove('hidden');
    }

    // --- Event Listeners for Buttons --- (All same as before)
    if (newGameButton) newGameButton.addEventListener('click', startGame);
    if (tryAgainButton) tryAgainButton.addEventListener('click', startGame);
    if (keepPlayingButton) {
        keepPlayingButton.addEventListener('click', () => {
            if (youWinMessageElement) youWinMessageElement.classList.add('hidden');
            isGameOver = false; 
        });
    }
    if (newGameFromWinButton) {
        newGameFromWinButton.addEventListener('click', startGame);
    }

    // --- Initial Game Start ---
    startGame();
});
