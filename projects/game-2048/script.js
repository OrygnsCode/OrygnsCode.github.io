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
        board = []; // Reset the board array
        for (let r = 0; r < gridSize; r++) {
            board[r] = []; // Create a new row
            for (let c = 0; c < gridSize; c++) {
                board[r][c] = 0; // Initialize all cells to 0 (empty)
            }
        }
    }

    function startGame() {
        console.log("Starting new game...");
        isGameOver = false;
        score = 0;
        initializeBoardArray(); // Set up the internal 2D array for the board
        
        addRandomTile(); // Add the first random tile
        addRandomTile(); // Add the second random tile
        
        renderBoard(); // Draw the board and tiles onto the HTML page
        updateScoreDisplay();
        if (gameOverMessageElement) gameOverMessageElement.classList.add('hidden'); // Hide game over message
    }

    // --- 2. RENDERING THE BOARD (Drawing tiles on the page) ---
    function renderBoard() {
        gameBoardElement.innerHTML = ''; // Clear any existing tiles from the board element

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const tileValue = board[r][c];
                const tileElement = document.createElement('div');
                tileElement.classList.add('tile'); // Base class for styling all cells/tiles
                
                if (tileValue !== 0) {
                    tileElement.textContent = tileValue;
                    tileElement.classList.add(`tile-${tileValue}`); 
                    if (tileValue > 2048) { 
                        tileElement.classList.add('tile-super');
                    }
                }
                // Empty cells will just have the default .tile background
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
                boardChanged = moveTilesLeft(); // Call our new function
                event.preventDefault();
                break;
            case 'ArrowRight':
                console.log("Key pressed: ArrowRight");
                boardChanged = moveTilesRight(); 
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
            console.log("No change in board after key press (or move not implemented yet).");
        }
    }

    // --- 5. MOVEMENT LOGIC ---

    // Helper function to process a single row for moving left
    function processRowLeft(row) {
        // 1. Filter out zeros (slide tiles left)
        let filteredRow = row.filter(val => val !== 0);
        
        // 2. Combine adjacent identical tiles
        for (let i = 0; i < filteredRow.length - 1; i++) {
            if (filteredRow[i] === filteredRow[i+1]) {
                filteredRow[i] *= 2; 
                score += filteredRow[i]; 
                filteredRow.splice(i + 1, 1); // Remove the merged tile (effectively setting to 0 and it will be filtered)
            }
        }
        // The previous splice() means we don't need to filter out zeros again here explicitly for this simple left merge
        // as it directly modifies filteredRow.
        
        // 4. Pad with zeros to the right to make it gridSize length
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
            const newRow = processRowLeft([...board[r]]); // Pass a copy of the row to processRowLeft
            board[r] = newRow; 

            if (!originalRow.every((val, index) => val === newRow[index])) {
                boardChanged = true;
            }
        }
        if (boardChanged) console.log("Tiles moved/merged left.");
        return boardChanged;
    }

    // Placeholders for other movement functions
    function moveTilesUp() { console.log("Attempting to move UP - Not implemented yet"); return false; }
    function moveTilesDown() { console.log("Attempting to move DOWN - Not implemented yet"); return false; }
    function moveTilesRight() { console.log("Attempting to move RIGHT - Not implemented yet"); return false; }


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
