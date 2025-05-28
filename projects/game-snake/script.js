// --- Game Constants ---
const GRID_SIZE = 20; // Size of each grid cell (snake segment, food)
const CANVAS_SIZE = 400; // Canvas width and height
const GAME_UPDATE_INTERVAL = 120; // Milliseconds between snake moves (tune for speed)

// --- DOM Elements ---
let canvas, ctx, startButton, scoreDisplay;

// --- Game State Variables ---
let snake;
let food;
let score;
let direction; // 'UP', 'DOWN', 'LEFT', 'RIGHT'
let nextDirection; // Buffer for the next direction
let gameActive;
let lastUpdateTime = 0;
let animationFrameId;

document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    startButton = document.getElementById('startButton');
    scoreDisplay = document.getElementById('scoreDisplay');

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    showInitialMessage(); // Show initial message when DOM is ready
});

// --- Core Game Logic ---

// Initialize or reset the game state
function initGame() {
    snake = [{ x: Math.floor(CANVAS_SIZE / (2 * GRID_SIZE)) * GRID_SIZE, y: Math.floor(CANVAS_SIZE / (2 * GRID_SIZE)) * GRID_SIZE }];
    placeFood();
    score = 0;
    direction = 'RIGHT';
    nextDirection = 'RIGHT';
    gameActive = true;
    scoreDisplay.textContent = score;
    lastUpdateTime = performance.now(); // Reset time for the new game's timing loop

    // Ensure any previous animation frame is cancelled before starting a new one
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    animationFrameLoop(); // Start the game loop
}

// Main game loop, driven by requestAnimationFrame for smooth rendering
function animationFrameLoop(timestamp) {
    // If the game is no longer active (e.g., collision), show game over and stop the loop
    if (!gameActive) {
        showGameOver();
        return;
    }

    // Request the next frame. This creates the recursive loop.
    animationFrameId = requestAnimationFrame(animationFrameLoop);

    // Calculate elapsed time since the last game logic update
    const deltaTime = (timestamp || performance.now()) - lastUpdateTime; // Fallback to performance.now() if timestamp is undefined initially

    // If enough time has passed, update the game logic (e.g., move snake)
    if (deltaTime >= GAME_UPDATE_INTERVAL) {
        lastUpdateTime = (timestamp || performance.now()) - (deltaTime % GAME_UPDATE_INTERVAL); // Adjust lastUpdateTime to maintain interval consistency
        update(); // Update game state (snake movement, food, collisions)
    }
    
    draw(); // Draw the game state on every frame for visual smoothness
}

// Updates the game state (snake position, food, score, collisions)
function update() {
    // Set the snake's current movement direction based on the latest (buffered) input
    direction = nextDirection;

    // Calculate new head position
    const head = { ...snake[0] }; // Clone the current head
    switch (direction) {
        case 'UP':
            head.y -= GRID_SIZE;
            break;
        case 'DOWN':
            head.y += GRID_SIZE;
            break;
        case 'LEFT':
            head.x -= GRID_SIZE;
            break;
        case 'RIGHT':
            head.x += GRID_SIZE;
            break;
    }
    snake.unshift(head); // Add the new head to the front of the snake

    // Check for food consumption
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreDisplay.textContent = score;
        placeFood(); // Place new food
    } else {
        snake.pop(); // Remove tail segment if no food was eaten
    }

    // Check for game over conditions (collision with wall or self)
    if (isCollision()) {
        gameActive = false; // Set game to inactive, loop will stop and show game over
    }
}

// --- Drawing Functions ---

// Main drawing function - clears canvas and calls sub-draw functions
function draw() {
    // Clear canvas with a background color
    ctx.fillStyle = '#f0f0f0'; // Light grey background, matching page body
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    drawGrid();
    drawSnake();
    drawFood();
}

// Draws the grid lines on the canvas
function drawGrid() {
    ctx.strokeStyle = '#ccc'; // Light grey for grid lines
    ctx.lineWidth = 1; // Ensure grid lines are thin
    for (let x = 0; x <= CANVAS_SIZE; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_SIZE);
        ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_SIZE; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_SIZE, y);
        ctx.stroke();
    }
}

// Draws the snake on the canvas
function drawSnake() {
    snake.forEach((segment, index) => {
        ctx.fillStyle = (index === 0) ? 'darkgreen' : 'green'; // Head is dark green, body is green
        ctx.fillRect(segment.x, segment.y, GRID_SIZE, GRID_SIZE);
        ctx.strokeStyle = 'black'; // Black border for better segment definition
        ctx.lineWidth = 1;
        ctx.strokeRect(segment.x, segment.y, GRID_SIZE, GRID_SIZE);

        // Draw eyes on the head segment
        if (index === 0) {
            drawSnakeEyes(segment);
        }
    });
}

// Draws eyes on the snake's head, oriented by direction
function drawSnakeEyes(headSegment) {
    ctx.fillStyle = 'white'; // Eye color
    const eyeSize = GRID_SIZE / 5;
    const eyeOffset = GRID_SIZE / 4; // Offset from the edge of the head segment
    const pupilSize = eyeSize / 2;

    let eye1X, eye1Y, eye2X, eye2Y;
    let pupil1X, pupil1Y, pupil2X, pupil2Y;

    switch (direction) {
        case 'UP':
            eye1X = headSegment.x + eyeOffset;
            eye1Y = headSegment.y + eyeOffset;
            eye2X = headSegment.x + GRID_SIZE - eyeOffset - eyeSize;
            eye2Y = headSegment.y + eyeOffset;
            break;
        case 'DOWN':
            eye1X = headSegment.x + eyeOffset;
            eye1Y = headSegment.y + GRID_SIZE - eyeOffset - eyeSize;
            eye2X = headSegment.x + GRID_SIZE - eyeOffset - eyeSize;
            eye2Y = headSegment.y + GRID_SIZE - eyeOffset - eyeSize;
            break;
        case 'LEFT':
            eye1X = headSegment.x + eyeOffset;
            eye1Y = headSegment.y + eyeOffset;
            eye2X = headSegment.x + eyeOffset;
            eye2Y = headSegment.y + GRID_SIZE - eyeOffset - eyeSize;
            break;
        case 'RIGHT':
            eye1X = headSegment.x + GRID_SIZE - eyeOffset - eyeSize;
            eye1Y = headSegment.y + eyeOffset;
            eye2X = headSegment.x + GRID_SIZE - eyeOffset - eyeSize;
            eye2Y = headSegment.y + GRID_SIZE - eyeOffset - eyeSize;
            break;
    }
    ctx.fillRect(eye1X, eye1Y, eyeSize, eyeSize);
    ctx.fillRect(eye2X, eye2Y, eyeSize, eyeSize);

    // Draw pupils (simple squares, centered within the eyes)
    ctx.fillStyle = 'black';
    pupil1X = eye1X + (eyeSize - pupilSize) / 2;
    pupil1Y = eye1Y + (eyeSize - pupilSize) / 2;
    pupil2X = eye2X + (eyeSize - pupilSize) / 2;
    pupil2Y = eye2Y + (eyeSize - pupilSize) / 2;
    ctx.fillRect(pupil1X, pupil1Y, pupilSize, pupilSize);
    ctx.fillRect(pupil2X, pupil2Y, pupilSize, pupilSize);
}

// Draws the food (apple) on the canvas
function drawFood() {
    ctx.fillStyle = 'red';
    ctx.strokeStyle = 'darkred';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Draw food slightly smaller than grid cell for aesthetics
    ctx.arc(food.x + GRID_SIZE / 2, food.y + GRID_SIZE / 2, GRID_SIZE / 2.2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Add a small highlight to the food
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(food.x + GRID_SIZE / 2.5, food.y + GRID_SIZE / 2.5, GRID_SIZE / 5, 0, 2 * Math.PI);
    ctx.fill();
}

// --- Utility and Collision Functions ---

// Places food randomly on the grid, ensuring it's not on the snake
function placeFood() {
    let newFoodPosition;
    do {
        newFoodPosition = {
            x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)) * GRID_SIZE,
            y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)) * GRID_SIZE
        };
    } while (isSnakeOnPosition(newFoodPosition)); // Keep trying until a valid spot is found
    food = newFoodPosition;
}

// Checks if a given position is currently occupied by any part of the snake
function isSnakeOnPosition(position) {
    return snake.some(segment => segment.x === position.x && segment.y === position.y);
}

// Checks for game-ending collisions (wall or self-collision)
function isCollision() {
    const head = snake[0];

    // Wall collision: Check if head is outside canvas boundaries
    if (head.x < 0 || head.x >= CANVAS_SIZE || head.y < 0 || head.y >= CANVAS_SIZE) {
        return true;
    }

    // Self-collision: Check if head collides with any other segment of the snake's body
    // Start checking from the second segment (index 1)
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    return false; // No collision
}

// --- UI and Message Functions ---

// Helper function to draw rounded rectangles, used for message boxes
function drawRoundedRect(x, y, width, height, radius, fillColor, strokeColor) {
    ctx.fillStyle = fillColor;
    if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2; // Default stroke width for message boxes
    }
    
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    ctx.fill();
    if (strokeColor) {
        ctx.stroke();
    }
}

// Displays the "Game Over" message box
function showGameOver() {
    const boxWidth = CANVAS_SIZE * 0.8;
    const boxHeight = CANVAS_SIZE * 0.5;
    const boxX = (CANVAS_SIZE - boxWidth) / 2;
    const boxY = (CANVAS_SIZE - boxHeight) / 2;

    drawRoundedRect(boxX, boxY, boxWidth, boxHeight, 15, 'rgba(0, 0, 0, 0.8)', '#333');

    ctx.textAlign = 'center';
    
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#e74c3c'; // Reddish color for "Game Over!"
    ctx.fillText('Game Over!', CANVAS_SIZE / 2, boxY + 60);
    
    ctx.font = '28px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('Your Score: ' + score, CANVAS_SIZE / 2, boxY + 110);
    
    ctx.font = '20px Arial';
    ctx.fillStyle = '#bdc3c7'; // Lighter grey for prompt
    ctx.fillText('Click Start to Play Again', CANVAS_SIZE / 2, boxY + 160);
    
    startButton.disabled = false; // Re-enable the start button
}

// Displays the initial message on the canvas when the page loads
function showInitialMessage() {
    // Ensure canvas context is available before drawing
    if (!ctx) { 
        // If called before DOMContentLoaded finishes (e.g. script moved outside), 
        // defer or wait for ctx. This setup assumes it's called after.
        console.warn("Attempted to show initial message before canvas context was ready.");
        return;
    }

    const boxWidth = CANVAS_SIZE * 0.9;
    const boxHeight = CANVAS_SIZE * 0.6;
    const boxX = (CANVAS_SIZE - boxWidth) / 2;
    const boxY = (CANVAS_SIZE - boxHeight) / 2;

    // Clear canvas with background color before drawing initial message
    // This is important if this function could be called when something else is on canvas
    ctx.fillStyle = '#f0f0f0'; 
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    // Optionally draw grid on initial screen too
    // drawGrid(); 

    drawRoundedRect(boxX, boxY, boxWidth, boxHeight, 15, 'rgba(50, 50, 70, 0.85)', '#333');
    
    ctx.textAlign = 'center';

    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = '#2ecc71'; // Green color for "Snake Game" title
    ctx.fillText('Snake Game', CANVAS_SIZE / 2, boxY + 60);

    ctx.font = '22px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText("Click 'Start Game' to Begin!", CANVAS_SIZE / 2, boxY + 120);

    ctx.font = '16px Arial';
    ctx.fillStyle = '#bdc3c7'; // Lighter grey for controls hint
    ctx.fillText('Use Arrow Keys or WASD to move.', CANVAS_SIZE / 2, boxY + 160);
    ctx.fillText('Try to eat the red apples!', CANVAS_SIZE / 2, boxY + 190);
}

// --- Event Handlers ---

// Handles keyboard input to change the snake's next direction
function changeDirection(event) {
    const keyPressed = event.key;
    const goingUp = direction === 'UP';
    const goingDown = direction === 'DOWN';
    const goingLeft = direction === 'LEFT';
    const goingRight = direction === 'RIGHT';

    // Update nextDirection based on key press, preventing immediate 180-degree turns.
    // The actual direction change occurs in the update() function.
    if ((keyPressed === 'ArrowLeft' || keyPressed.toLowerCase() === 'a') && !goingRight) {
        nextDirection = 'LEFT';
    } else if ((keyPressed === 'ArrowUp' || keyPressed.toLowerCase() === 'w') && !goingDown) {
        nextDirection = 'UP';
    } else if ((keyPressed === 'ArrowRight' || keyPressed.toLowerCase() === 'd') && !goingLeft) {
        nextDirection = 'RIGHT';
    } else if ((keyPressed === 'ArrowDown' || keyPressed.toLowerCase() === 's') && !goingUp) {
        nextDirection = 'DOWN';
    }
}

// Setup event listeners once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Re-assign DOM elements here if they were not found when script first ran
    // (This is a safeguard, ideally script is at end of body or DOMContentLoaded handles all setup)
    if (!canvas) canvas = document.getElementById('gameCanvas');
    if (!ctx) ctx = canvas.getContext('2d');
    if (!startButton) startButton = document.getElementById('startButton');
    if (!scoreDisplay) scoreDisplay = document.getElementById('scoreDisplay');

    if (!canvas.width) canvas.width = CANVAS_SIZE; // Ensure canvas dimensions are set
    if (!canvas.height) canvas.height = CANVAS_SIZE;

    startButton.addEventListener('click', () => {
        startButton.disabled = true; // Disable button while game is active
        initGame();
    });
    document.addEventListener('keydown', changeDirection);

    showInitialMessage(); // Show initial message after everything is set up
});
// Removed: showInitialMessage(); // This was called before DOMContentLoaded could guarantee elements were ready.
// It's now called at the end of DOMContentLoaded and also initially where global vars are defined.
// For safety, ensuring it's called *after* ctx is defined is best. The DOMContentLoaded call is sufficient.
