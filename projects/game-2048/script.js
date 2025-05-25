document.addEventListener('DOMContentLoaded', () => {
    const gameBoardElement = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const newGameButton = document.getElementById('new-game-button');
    const gameOverMessageElement = document.getElementById('game-over-message');
    const finalScoreElement = document.getElementById('final-score');
    const tryAgainButton = document.getElementById('try-again-button');

    const gridSize = 4;
    let board = []; // 2D array representing the game board values
    let score = 0;
    let isGameOver = false;

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

    function startGame() {
        console.log("Starting new game...");
        isGameOver = false;
        score = 0;
        initializeBoardArray(); 
        
        addRandomTile(); 
        addRandomTile(); 
        
        renderBoard(); 
        updateScoreDisplay();
        if (gameOverMessageElement) gameOverMessageElement.classList.add('hidden'); 
    }

    // --- 2. RENDERING THE BOARD (Drawing tiles on the page) ---
    function renderBoard() {
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
        console.log("Board rendered with current tile values.");
    }

    function updateScoreDisplay() {
        if (scoreElement) scoreElement.textContent = score;
    }

    // --- 3. ADDING RANDOM TILES ---
    function getEmptyCells() {
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

    function addRandomTile() {
        const emptyCells = getEmptyCells();
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            board[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
            console.log(`Added tile ${board[randomCell.r][randomCell.c]} at row ${randomCell.r}, col ${randomCell.c}`);
        }
    }

    // --- 4. HANDLING PLAYER INPUT (Keyboard) ---
    document.addEventListener('keydown', handleKeyPress);

    function handleKeyPress(event) {
        if (isGameOver) return; 

        let boardChanged = false; 
        switch (event.key) {
            case 'ArrowUp':
                console.log("Key pressed: ArrowUp");
                boardChanged = moveTilesUp(); 
                event.preventDefault(); 
                break;
            case 'ArrowDown':
                console.log("Key pressed: ArrowDown");
                boardChanged = moveTilesDown(); 
                event.preventDefault();
                break;
            case 'ArrowLeft':
                console.log("Key pressed: ArrowLeft");
                boardChanged = moveTilesLeft(); 
                event.preventDefault();
                break;
            case 'ArrowRight':
                console.log("Key pressed: ArrowRight");
                boardChanged = moveTilesRight(); // Call our new function
                event.preventDefault();
                break;
            default:
                return; 
        }

        if (boardChanged) {
            addRandomTile();    
            renderBoard();      
            updateScoreDisplay(); 
            
            // if (checkGameOver()) { // We will implement this later
            //     endGame();
            // }
        } else {
            console.log("No change in board after key press (or move not implemented yet for this direction).");
        }
    }

    // --- 5. MOVEMENT LOGIC ---

    // Helper function to process a single row for moving left (used by moveTilesLeft and moveTilesRight)
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
        for (let i = 0; i < gridSize; i++) {
            newRow[i] = filteredRow[i] || 0; 
        }
        return newRow;
    }

    function moveTilesLeft() {
        let boardChanged = false;
        for (let r = 0; r < gridSize; r++) {
            const originalRow = [...board[r]]; 
            const newRow = processRowLeft([...board[r]]); 
            board[r] = newRow; 

            if (!originalRow.every((val, index) => val === newRow[index])) {
                boardChanged = true;
            }
        }
        if (boardChanged) console.log("Tiles moved/merged left.");
        return boardChanged;
    }

    function moveTilesRight() {
        let boardChanged = false;
        for (let r = 0; r < gridSize; r++) {
            const originalRow = [...board[r]];
            
            // To move right: reverse the row, process left, then reverse back
            const reversedRow = [...originalRow].reverse();
            const processedReversedRow = processRowLeft(reversedRow); // processRowLeft handles scoring
            const newRow = processedReversedRow.reverse();
            
            board[r] = newRow;

            if (!originalRow.every((val, index) => val === newRow[index])) {
                boardChanged = true;
            }
        }
        if (boardChanged) console.log("Tiles moved/merged right.");
        return boardChanged;
    }

    // Placeholders for other movement functions
    function moveTilesUp() { console.log("Attempting to move UP - Not implemented yet"); return false; }
    function moveTilesDown() { console.log("Attempting to move DOWN - Not implemented yet"); return false; }


    // --- 6. GAME OVER LOGIC (Placeholders) ---
    // function checkGameOver() { /* To be implemented */ return false; } 
    // function endGame() {
    //     isGameOver = true;
    //     if(finalScoreElement) finalScoreElement.textContent = score;
    //     if(gameOverMessageElement) gameOverMessageElement.classList.remove('hidden');
    //     console.log("Game Over! Final Score:", score);
    // }

    // --- Event Listeners for Buttons ---
    if (newGameButton) newGameButton.addEventListener('click', startGame);
    if (tryAgainButton) tryAgainButton.addEventListener('click', startGame);

    // --- Initial Game Start when the page loads ---
    startGame();
});
