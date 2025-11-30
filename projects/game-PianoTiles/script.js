const gameBoard = document.getElementById('game-board');
const scoreDisplay = document.getElementById('score-display');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalScoreSpan = document.getElementById('final-score');
const finalSpeedSpan = document.getElementById('final-speed');

let score = 0;
let isGameActive = false;
let gameSpeed = 0; // Not used for movement, but for calculation
let startTime = 0;
let rows = [];
const ROW_COUNT = 5; // 4 visible + 1 buffer
const COL_COUNT = 4;

// Key mapping
const KEYS = ['f', 'g', 'h', 'j'];

function init() {
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', resetGame);

    // Keyboard controls
    document.addEventListener('keydown', handleKeyPress);
}

function startGame() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    score = 0;
    scoreDisplay.innerText = score;
    isGameActive = true;
    startTime = Date.now();

    // Clear board
    gameBoard.innerHTML = '';
    rows = [];

    // Create initial rows
    for (let i = 0; i < ROW_COUNT; i++) {
        createRow(i);
    }

    // Highlight the first row (bottom one)
    if (rows.length > 0) {
        rows[0].classList.add('active-row');
    }
}

function createRow(index) {
    const row = document.createElement('div');
    row.classList.add('row');
    // Position rows from bottom up. 
    // index 0 is bottom-most (current), index 4 is top (buffer)
    row.style.bottom = `${index * 25}%`;

    const blackIndex = Math.floor(Math.random() * COL_COUNT);

    for (let i = 0; i < COL_COUNT; i++) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        if (i === blackIndex) {
            tile.classList.add('black');
            tile.dataset.isBlack = "true";
        }

        // Mouse/Touch interaction
        tile.addEventListener('mousedown', () => handleTileClick(tile, row));
        tile.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent double firing
            handleTileClick(tile, row);
        });

        row.appendChild(tile);
    }

    gameBoard.appendChild(row);
    rows.push(row);
}

function handleTileClick(tile, row) {
    if (!isGameActive) return;

    // Only allow clicking on the bottom-most active row (index 0 in our array logic, but visual logic might differ)
    // Actually, in this simple version, we just check if it's the bottom row.
    // The bottom row is always the first child in the DOM if we prepend? 
    // Wait, we appended. So the bottom row is the first one created? 
    // Let's look at how we positioned them. 
    // We used absolute positioning.
    // Let's maintain a logical array of rows where rows[0] is the bottom one.

    // Find which row this tile belongs to
    const rowIndex = rows.indexOf(row);

    if (rowIndex !== 0) {
        // Clicking a row that isn't the bottom one is usually ignored or penalized?
        // In standard Piano Tiles, you must hit the bottom one first.
        // If we want to be strict:
        // gameOver();
        // return;
        // But for smoother gameplay, maybe just ignore if it's not the bottom one?
        // Let's be strict to prevent spamming.
        return;
    }

    if (tile.classList.contains('black') && !tile.classList.contains('clicked')) {
        // Correct hit
        tile.classList.remove('black');
        tile.classList.add('clicked');
        score++;
        scoreDisplay.innerText = score;

        // Move game forward
        advanceGame();
    } else {
        // Wrong hit (white tile)
        tile.classList.add('wrong');
        gameOver();
    }
}

function handleKeyPress(e) {
    if (!isGameActive) return;

    const key = e.key.toLowerCase();
    const colIndex = KEYS.indexOf(key);

    if (colIndex !== -1) {
        // Simulate click on the tile in the bottom row (rows[0]) at this column
        if (rows.length > 0) {
            const bottomRow = rows[0];
            const tile = bottomRow.children[colIndex];
            handleTileClick(tile, bottomRow);
        }
    }
}

function advanceGame() {
    // Remove the bottom row
    const bottomRow = rows.shift();
    bottomRow.remove();

    // Shift all other rows down visually
    // Actually, since we use absolute positioning with %, we need to update their styles?
    // Or we can just re-index them?
    // A better way for infinite scrolling is to physically move them.
    // But since we are doing a discrete step game (tap to move), we can just:
    // 1. Remove bottom row.
    // 2. Change 'bottom' of all remaining rows.
    // 3. Add new row at top.

    rows.forEach((row, index) => {
        row.style.bottom = `${index * 25}%`;
    });

    // Add new row at the top (which is now index 4, since we have 4 visible)
    // We want to maintain 5 rows total (4 visible + 1 entering)
    createRow(ROW_COUNT - 1);

    // Update active row
    if (rows.length > 0) {
        rows[0].classList.add('active-row');
    }
}

function gameOver() {
    isGameActive = false;
    const endTime = Date.now();
    const durationSeconds = (endTime - startTime) / 1000;
    const tilesPerSec = durationSeconds > 0 ? (score / durationSeconds).toFixed(2) : 0;

    finalScoreSpan.innerText = score;
    finalSpeedSpan.innerText = tilesPerSec;

    setTimeout(() => {
        gameOverScreen.classList.remove('hidden');
    }, 500);
}

function resetGame() {
    startGame();
}

// Initialize
init();
