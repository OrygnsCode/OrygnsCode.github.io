/**
 * TapToFly - Main Game Loop
 * Flappy Bird clone with authentic mechanics
 */

// Game constants
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 720;
const GROUND_HEIGHT = 112;

// Game states
const GameState = {
    READY: 'READY',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER'
};

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        // Game state
        this.state = GameState.READY;
        this.score = 0;
        this.bestScore = this.loadBestScore();

        // Game objects
        this.bird = new Bird(80, CANVAS_HEIGHT / 2 - 50);
        this.pipeManager = new PipeManager(CANVAS_WIDTH, CANVAS_HEIGHT);
        this.uiManager = new UIManager(CANVAS_WIDTH, CANVAS_HEIGHT);

        // Ground scrolling
        this.groundScrollOffset = 0;
        this.groundScrollSpeed = 2;

        // Bob animation for ready state
        this.bobTimer = 0;
        this.bobAmplitude = 8;
        this.bobSpeed = 0.003;

        // Delta time
        this.lastTime = performance.now();

        // Game over animation
        this.gameOverDelay = 0;
        this.gameOverDelayMax = 500; // ms before showing game over screen

        // Input handling
        this.setupInput();

        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
        }, 500);

        // Start game loop
        this.gameLoop();
    }

    setupInput() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleInput();
            }
        });

        // Mouse
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            this.handleInput(x, y);
        });

        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const touch = e.touches[0];
            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;
            this.handleInput(x, y);
        });
    }

    handleInput(x, y) {
        if (this.state === GameState.READY) {
            // Check if Home button was clicked
            if (x !== undefined && y !== undefined && this.uiManager.isHomeButtonClicked(x, y)) {
                window.location.href = '../../index.html';
                return;
            }

            this.startGame();
        } else if (this.state === GameState.PLAYING) {
            this.bird.flap();
        } else if (this.state === GameState.GAME_OVER) {
            if (this.gameOverDelay >= this.gameOverDelayMax) {
                this.resetGame();
            }
        }
    }

    startGame() {
        this.state = GameState.PLAYING;
        this.score = 0;
        this.bird.velocity = 0;
        this.pipeManager.reset();

        // Initialize audio on first interaction
        window.audioManager.init();
    }

    resetGame() {
        this.state = GameState.READY;
        this.score = 0;
        this.bird.reset(80, CANVAS_HEIGHT / 2 - 50);
        this.pipeManager.reset();
        this.gameOverDelay = 0;
        this.groundScrollOffset = 0;
        this.bobTimer = 0;
    }

    update(deltaTime) {
        // Cap deltaTime to prevent game slowdown when tab is inactive
        deltaTime = Math.min(deltaTime, 1000 / 30); // Max 30 FPS equivalent

        if (this.state === GameState.READY) {
            // Bob animation
            this.bobTimer += deltaTime;
            this.bird.y = (CANVAS_HEIGHT / 2 - 50) +
                Math.sin(this.bobTimer * this.bobSpeed) * this.bobAmplitude;
        } else if (this.state === GameState.PLAYING) {
            // Update bird
            this.bird.update(deltaTime);

            // Update pipes
            this.pipeManager.update(deltaTime);

            // Scroll ground (frame-rate independent)
            const dt = deltaTime / 1000;
            this.groundScrollOffset += this.groundScrollSpeed * 60 * dt;

            // Check scoring
            if (this.pipeManager.checkScore(this.bird)) {
                this.score++;
                window.audioManager.play('point');
            }

            // Check collisions
            const hitPipe = this.pipeManager.checkCollision(this.bird);
            const hitGround = this.bird.y + this.bird.height >= CANVAS_HEIGHT - GROUND_HEIGHT;
            const hitCeiling = this.bird.y <= 0;

            if (hitPipe || hitGround || hitCeiling) {
                this.gameOver();
            }
        } else if (this.state === GameState.GAME_OVER) {
            // Let bird fall to ground
            if (this.bird.y + this.bird.height < CANVAS_HEIGHT - GROUND_HEIGHT) {
                this.bird.update(deltaTime);
            } else {
                // Clamp to ground
                this.bird.y = CANVAS_HEIGHT - GROUND_HEIGHT - this.bird.height;
                this.bird.velocity = 0;
            }

            // Increment game over delay
            this.gameOverDelay += deltaTime;
        }
    }

    gameOver() {
        this.state = GameState.GAME_OVER;
        this.gameOverDelay = 0;

        // Play hit sound
        window.audioManager.play('hit');

        // Update best score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBestScore();
        }
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw background
        this.uiManager.drawBackground(this.ctx);

        // Draw pipes (behind bird)
        this.pipeManager.draw(this.ctx);

        // Draw bird
        this.bird.draw(this.ctx);

        // Draw ground (in front of everything)
        this.uiManager.drawGround(this.ctx, this.groundScrollOffset);

        // Draw UI based on state
        if (this.state === GameState.READY) {
            this.uiManager.drawReadyScreen(this.ctx);
        } else if (this.state === GameState.PLAYING) {
            this.uiManager.drawScore(this.ctx, this.score);
        } else if (this.state === GameState.GAME_OVER) {
            this.uiManager.drawScore(this.ctx, this.score);

            // Only show game over screen after delay
            if (this.gameOverDelay >= this.gameOverDelayMax) {
                this.uiManager.drawGameOver(this.ctx, this.score, this.bestScore);
            }
        }
    }

    gameLoop() {
        const currentTime = performance.now();
        let deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Cap deltaTime to prevent spiral of death and slowdowns
        // Max 100ms (10fps minimum) to prevent huge jumps when tab is inactive
        if (deltaTime > 100) {
            deltaTime = 100;
        }

        // Update and draw
        this.update(deltaTime);
        this.draw();

        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }

    loadBestScore() {
        const saved = localStorage.getItem('taptofly_best_score');
        return saved ? parseInt(saved, 10) : 0;
    }

    saveBestScore() {
        localStorage.setItem('taptofly_best_score', this.bestScore.toString());
    }
}

// Start game when page loads
window.addEventListener('load', () => {
    new Game();
});
