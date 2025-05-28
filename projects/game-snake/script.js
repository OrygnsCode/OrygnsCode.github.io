document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('startButton');
    const scoreDisplay = document.getElementById('scoreDisplay');

    // Game constants
    const gridSize = 20; // Size of each grid cell (snake segment, food)
    const canvasSize = 400; // Canvas width and height
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Game state variables
    let snake;
    let food;
    let score;
    let direction; // 'UP', 'DOWN', 'LEFT', 'RIGHT'
    let gameInterval;
    let gameActive;

    // Initialize game
    function initGame() {
        snake = [{ x: Math.floor(canvasSize / (2 * gridSize)) * gridSize, y: Math.floor(canvasSize / (2 * gridSize)) * gridSize }]; // Start snake in the middle
        placeFood();
        score = 0;
        direction = 'RIGHT'; // Initial direction
        gameActive = true;
        scoreDisplay.textContent = score;
        if (gameInterval) clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, 100); // Adjust speed as needed
    }

    // Main game loop
    function gameLoop() {
        if (!gameActive) {
            clearInterval(gameInterval);
            showGameOver();
            return;
        }
        update();
        draw();
    }

    // Update game state
    function update() {
        // Move snake
        const head = { ...snake[0] }; // Clone the head
        switch (direction) {
            case 'UP':
                head.y -= gridSize;
                break;
            case 'DOWN':
                head.y += gridSize;
                break;
            case 'LEFT':
                head.x -= gridSize;
                break;
            case 'RIGHT':
                head.x += gridSize;
                break;
        }
        snake.unshift(head); // Add new head

        // Check for collision with food
        if (head.x === food.x && head.y === food.y) {
            score++;
            scoreDisplay.textContent = score;
            placeFood(); // Place new food
        } else {
            snake.pop(); // Remove tail if no food eaten
        }

        // Check for game over conditions
        if (isCollision()) {
            gameActive = false;
        }
    }

    // Draw everything
    function draw() {
        // Clear canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        // Draw snake
        ctx.fillStyle = 'green';
        snake.forEach(segment => {
            ctx.fillRect(segment.x, segment.y, gridSize, gridSize);
            ctx.strokeStyle = 'darkgreen';
            ctx.strokeRect(segment.x, segment.y, gridSize, gridSize);
        });

        // Draw food
        ctx.fillStyle = 'red';
        ctx.fillRect(food.x, food.y, gridSize, gridSize);
        ctx.strokeStyle = 'darkred';
        ctx.strokeRect(food.x, food.y, gridSize, gridSize);
    }

    // Place food randomly on the grid
    function placeFood() {
        let newFoodPosition;
        do {
            newFoodPosition = {
                x: Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize,
                y: Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize
            };
        } while (isSnakeOnPosition(newFoodPosition)); // Ensure food doesn't spawn on snake
        food = newFoodPosition;
    }

    // Check if a position is occupied by the snake
    function isSnakeOnPosition(position) {
        return snake.some(segment => segment.x === position.x && segment.y === position.y);
    }

    // Check for collisions (walls or self)
    function isCollision() {
        const head = snake[0];

        // Wall collision
        if (head.x < 0 || head.x >= canvasSize || head.y < 0 || head.y >= canvasSize) {
            return true;
        }

        // Self-collision
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true;
            }
        }
        return false;
    }

    // Display game over message and restart option
    function showGameOver() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        ctx.font = '30px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvasSize / 2, canvasSize / 2 - 20);
        ctx.fillText('Score: ' + score, canvasSize / 2, canvasSize / 2 + 20);
        ctx.font = '20px Arial';
        ctx.fillText('Click Start to Play Again', canvasSize / 2, canvasSize / 2 + 60);
        startButton.disabled = false; // Re-enable start button
    }

    // Handle keyboard input
    function changeDirection(event) {
        const keyPressed = event.key;
        const goingUp = direction === 'UP';
        const goingDown = direction === 'DOWN';
        const goingLeft = direction === 'LEFT';
        const goingRight = direction === 'RIGHT';

        if ((keyPressed === 'ArrowLeft' || keyPressed.toLowerCase() === 'a') && !goingRight) {
            direction = 'LEFT';
        } else if ((keyPressed === 'ArrowUp' || keyPressed.toLowerCase() === 'w') && !goingDown) {
            direction = 'UP';
        } else if ((keyPressed === 'ArrowRight' || keyPressed.toLowerCase() === 'd') && !goingLeft) {
            direction = 'RIGHT';
        } else if ((keyPressed === 'ArrowDown' || keyPressed.toLowerCase() === 's') && !goingUp) {
            direction = 'DOWN';
        }
    }

    // Event listeners
    startButton.addEventListener('click', () => {
        startButton.disabled = true; // Disable button while game is active
        initGame();
    });
    document.addEventListener('keydown', changeDirection);

    // Initial message on canvas
    function showInitialMessage() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0,0,canvasSize, canvasSize);
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Click "Start Game" to Begin!', canvasSize / 2, canvasSize / 2);
    }
    showInitialMessage(); // Show message when script loads
});
