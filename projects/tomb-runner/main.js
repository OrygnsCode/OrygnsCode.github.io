// Main game logic for Tomb Runner
console.log("Tomb Runner main.js loaded");

// Import core components
import Player from './game/Player.js';
import InputHandler from './game/InputHandler.js';
import GameStateManager from './game/GameStateManager.js';
import Track from './game/Track.js';
import ObstacleManager from './game/ObstacleManager.js';
// import Monster from './game/Monster.js';

// Get the canvas element
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions to match window's inner dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Optional: Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // player.resize(canvas.width, canvas.height); // Example: Notify player of resize
    // Re-render or adjust other elements as needed
});

// Instantiate core components
const gameStateManager = new GameStateManager();
const player = new Player(ctx, canvas.width, canvas.height); // Pass ctx and dimensions
const inputHandler = new InputHandler(player, gameStateManager); // Pass player and gameStateManager
const track = new Track(ctx, canvas.width, canvas.height); // Instantiate Track
const obstacleManager = new ObstacleManager(ctx, track, player, canvas.width, canvas.height);

// For deltaTime calculation
let lastTime = 0;
let score = 0;
const scoreMultiplier = 10; // Points per second
const coinCollectValue = 50; // Points per coin

// Refined gameLoop Function
function gameLoop(timestamp) { // timestamp is provided by requestAnimationFrame
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas at the beginning of each frame

    // Get deltaTime for frame-independent movement (converted to seconds)
    const deltaTime = (timestamp - (lastTime || timestamp)) / 1000; 
    lastTime = timestamp;

    if (gameStateManager.currentState === GameStateManager.STATES.PLAYING) {
        player.update(); // Player update (deltaTime can be passed if needed: player.update(deltaTime))
        track.update(deltaTime); // Update track
        obstacleManager.update(deltaTime); // Update obstacles

        score += deltaTime * scoreMultiplier; 
        if (gameStateManager.ui.scoreDisplay) {
            gameStateManager.ui.scoreDisplay.textContent = `Score: ${Math.floor(score)}`;
        }

        if (obstacleManager.checkCoinCollisions(player)) {
            score += coinCollectValue;
            // Score display will be updated in the next line or frame by the general score update.
        }

        if (obstacleManager.checkCollisions(player)) {
            gameStateManager.changeState(GameStateManager.STATES.GAME_OVER);
            gameStateManager.setFinalScore(Math.floor(score)); // Pass the actual score
        }

        track.draw(ctx); // Draw track
        obstacleManager.draw(ctx); // Draw obstacles
        player.draw(ctx); // Draw player
    } else if (gameStateManager.currentState === GameStateManager.STATES.MENU) {
        // UI elements are mostly HTML/CSS for now
        // console.log("Game State: MENU - main.js"); // For debugging
    } else if (gameStateManager.currentState === GameStateManager.STATES.GAME_OVER) {
        // UI elements are mostly HTML/CSS for now
        // console.log("Game State: GAME_OVER - main.js"); // For debugging
    }
    
    // Draw UI elements (e.g. score) that might be canvas-based (if any)
    // ui.draw(ctx);

    requestAnimationFrame(gameLoop);
}

// Set initial game state using GameStateManager
gameStateManager.changeState(GameStateManager.STATES.MENU);
console.log("Initial game state set to MENU via GameStateManager.");

// Connect "Play" Button
if (gameStateManager.ui.playButton) {
    gameStateManager.ui.playButton.addEventListener('click', () => {
        score = 0;
        if (gameStateManager.ui.scoreDisplay) { // Update display immediately on reset
            gameStateManager.ui.scoreDisplay.textContent = `Score: ${Math.floor(score)}`;
        }
        gameStateManager.changeState(GameStateManager.STATES.PLAYING);
        // Potentially add calls here to reset player/game for a new session, e.g.:
        // player.reset(); 
        // track.reset();
        // obstacleManager.reset(); // Reset obstacles
        // monster.reset();
        // track.initializeTrack(); // Also reset track if needed
        console.log("Play button clicked, state changed to PLAYING.");
    });
} else {
    console.error("Play button not found by GameStateManager for event listener setup.");
}

// Connect "Retry" Button
if (gameStateManager.ui.retryButton) {
    gameStateManager.ui.retryButton.addEventListener('click', () => {
        score = 0;
        if (gameStateManager.ui.scoreDisplay) { // Update display immediately on reset
            gameStateManager.ui.scoreDisplay.textContent = `Score: ${Math.floor(score)}`;
        }
        gameStateManager.changeState(GameStateManager.STATES.PLAYING); // Or MENU first, then PLAYING
        // Similar reset logic as the Play button will be needed here.
        // player.reset();
        // track.initializeTrack(); // Also reset track if needed
        // obstacleManager.reset(); // Reset obstacles
        // ... reset other components ...
        console.log("Retry button clicked, state changed to PLAYING.");
    });
} else {
    console.error("Retry button not found by GameStateManager for event listener setup.");
}

// Activate Game Loop
requestAnimationFrame(gameLoop);

console.log("Game loop started.");
