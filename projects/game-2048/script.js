document.addEventListener('DOMContentLoaded', () => {
    const gameBoardElement = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const newGameButton = document.getElementById('new-game-button');
    const gameOverMessageElement = document.getElementById('game-over-message');
    const finalScoreElement = document.getElementById('final-score');
    const tryAgainButton = document.getElementById('try-again-button');

    const gridSize = 4;
    let board = []; // This will be a 2D array [row][column] storing tile values (0 for empty)
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
                    // Add class for specific tile value (e.g., 'tile-2', 'tile-4') for styling
                    tileElement.classList.add(`tile-${tileValue}`); 
                    if (tileValue > 2048) { // For numbers larger than 2048, if you have a .tile-super style
                        tileElement.classList.add('tile-super');
                    }
                } else {
                    // You can add a specific class for empty tiles if you want them styled differently
                    // than the default .tile background, e.g., tileElement.classList.add('tile-empty');
                    // The CSS already has a default background for .tile which works for empty cells.
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
                    emptyCells.push({ r, c }); // Store coordinates of empty cells
                }
            }
        }
        return emptyCells;
    }

    function addRandomTile() {
        const emptyCells = getEmptyCells();
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            // 90% chance of a '2', 10% chance of a '4'
            board[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
            console.log(`Added tile ${board[randomCell.r][randomCell.c]} at row ${randomCell.r}, col ${randomCell.c}`);
        }
    }

    // --- 4. HANDLING PLAYER INPUT (Keyboard) ---
    document.addEventListener('keydown', handleKeyPress);

    function handleKeyPress(event) {
        if (isGameOver) return; // Don't do anything if the game is over

        let boardChanged = false; // Flag to check if a move actually changed the board
        switch (event.key) {
            case 'ArrowUp':
                console.log("Key pressed: ArrowUp");
                // boardChanged = moveTilesUp(); // Placeholder for now
                event.preventDefault(); // Prevent default browser scroll
                break;
            case 'ArrowDown':
                console.log("Key pressed: ArrowDown");
                // boardChanged = moveTilesDown(); // Placeholder
                event.preventDefault();
                break;
            case 'ArrowLeft':
                console.log("Key pressed: ArrowLeft");
                // boardChanged = moveTilesLeft(); // Placeholder
                event.preventDefault();
                break;
            case 'ArrowRight':
                console.log("Key pressed: ArrowRight");
                // boardChanged = moveTilesRight(); // Placeholder
                event.preventDefault();
                break;
            default:
                return; // Ignore any other keys
        }

        if (boardChanged) {
            // This block will be important once movement functions are implemented
            // addRandomTile();
            // renderBoard();
            // updateScoreDisplay();
            // if (checkGameOver()) {
            //     endGame();
            // }
        }
    }

    // --- 5. MOVEMENT LOGIC (Placeholders - To be implemented next!) ---
    // function moveTilesUp() { console.log("Attempting to move UP"); return false; }
    // function moveTilesDown() { console.log("Attempting to move DOWN"); return false; }
    // function moveTilesLeft() { console.log("Attempting to move LEFT"); return false; }
    // function moveTilesRight() { console.log("Attempting to move RIGHT"); return false; }

    // --- 6. GAME OVER LOGIC (Placeholders) ---
    // function checkGameOver() { return false; } // Placeholder
    // function endGame() {
    //     isGameOver = true;
    //     if(finalScoreElement) finalScoreElement.textContent = score;
    //     if(gameOverMessageElement) gameOverMessageElement.classList.remove('hidden');
    //     console.log("Game Over! Final Score:", score);
    // }

    // --- Event Listeners for Buttons ---
    if (newGameButton) newGameButton.addEventListener('click', startGame);
    if (tryAgainButton) tryAgainButton.addEventListener('click', startGame); // tryAgainButton is on game over screen

    // --- Initial Game Start when the page loads ---
    startGame();
});
