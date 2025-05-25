document.addEventListener('DOMContentLoaded', () => {
    const gameBoardElement = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const newGameButton = document.getElementById('new-game-button');
    
    const gameOverMessageElement = document.getElementById('game-over-message');
    const finalScoreElement = document.getElementById('final-score');
    const tryAgainButton = document.getElementById('try-again-button');

    // Win Message elements (assuming HTML and CSS for these are done from a potential previous step)
    const youWinMessageElement = document.getElementById('you-win-message');
    const keepPlayingButton = document.getElementById('keep-playing-button');
    const newGameFromWinButton = document.getElementById('new-game-from-win-button');

    const gridSize = 4;
    const targetTile = 2048; 
    let board = []; 
    let score = 0;
    let isGameOver = false;
    let hasWon = false;

    // --- Touch Input Variables ---
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    const swipeThreshold = 30; // Minimum distance for a swipe

    // --- 1. GAME INITIALIZATION ---
    function initializeBoardArray() { /* ... (same as before) ... */ 
        board = []; 
        for (let r = 0; r < gridSize; r++) {
            board[r] = []; 
            for (let c = 0; c < gridSize; c++) {
                board[r][c] = 0; 
            }
        }
    }

    function startGame() {
        console.log("Starting new game...");
        isGameOver = false;
        hasWon = false; 
        score = 0;
        initializeBoardArray(); 
        
        addRandomTile(); 
        addRandomTile(); 
        
        renderBoard(); 
        updateScoreDisplay();
        if (gameOverMessageElement) gameOverMessageElement.classList.add('hidden'); 
        if (youWinMessageElement) youWinMessageElement.classList.add('hidden'); 
    }

    // --- 2. RENDERING THE BOARD ---
    function renderBoard() { /* ... (same as before) ... */ 
        gameBoardElement.innerHTML = ''; 
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const tileValue = board[r][c];
                const tileElement = document.createElement('div');
                tileElement.classList.add('tile'); 
                
                if (tileValue !== 0) {
                    tileElement.textContent = tileValue;
                    tileElement.classList.add(`tile-${tileValue}`); 
                    if (tileValue > 2048) { 
                        tileElement.classList.add('tile-super');
                    }
                }
                gameBoardElement.appendChild(tileElement);
            }
        }
    }
    function updateScoreDisplay() { /* ... (same as before) ... */ 
        if (scoreElement) scoreElement.textContent = score;
    }

    // --- 3. ADDING RANDOM TILES ---
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
    function addRandomTile() { /* ... (same as before) ... */ 
        const emptyCells = getEmptyCells();
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            board[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    // --- 4. HANDLING PLAYER INPUT ---
    // Keyboard Input
    document.addEventListener('keydown', handleKeyPress);

    function handleKeyPress(event) {
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

    // Touch Input Listeners
    gameBoardElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameBoardElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    gameBoardElement.addEventListener('touchend', handleTouchEnd, { passive: false });

    function handleTouchStart(event) {
        // event.preventDefault(); // Prevent default only if a game move is certain or to prevent scroll
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        console.log("Touch start:", touchStartX, touchStartY);
    }

    function handleTouchMove(event) {
        // We prevent default scrolling if the touch is on the game board
        // This helps ensure swipes are captured without moving the page.
        event.preventDefault();
    }

    function handleTouchEnd(event) {
        if (isGameOver && !hasWon) return;
        if (youWinMessageElement && !youWinMessageElement.classList.contains('hidden')) return;

        touchEndX = event.changedTouches[0].clientX;
        touchEndY = event.changedTouches[0].clientY;
        console.log("Touch end:", touchEndX, touchEndY);

        handleSwipe();
    }

    function handleSwipe() {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        let boardChanged = false;

        // Determine if swipe is more horizontal or vertical
        if (Math.abs(deltaX) > Math.abs(deltaY)) { // Horizontal swipe
            if (Math.abs(deltaX) > swipeThreshold) { // Check if it meets threshold
                if (deltaX > 0) {
                    console.log("Swipe Right");
                    boardChanged = moveTilesRight();
                } else {
                    console.log("Swipe Left");
                    boardChanged = moveTilesLeft();
                }
            }
        } else { // Vertical swipe
            if (Math.abs(deltaY) > swipeThreshold) { // Check if it meets threshold
                if (deltaY > 0) {
                    console.log("Swipe Down");
                    boardChanged = moveTilesDown();
                } else {
                    console.log("Swipe Up");
                    boardChanged = moveTilesUp();
                }
            }
        }
        processMove(boardChanged);
    }
    
    // Common logic after a move (keyboard or swipe)
    function processMove(boardChanged) {
        if (boardChanged) {
            addRandomTile();    
            renderBoard();      
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


    // --- 5. MOVEMENT LOGIC ---
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

    // --- 6. GAME STATE LOGIC (WIN/GAME OVER) ---
    function checkWinCondition() { /* ... (same as before, assuming it was added previously) ... */ 
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

    // --- Event Listeners for Buttons ---
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
