// GameStateManager.js - Manages the overall game state
class GameStateManager {
    static STATES = {
        MENU: 'MENU',
        PLAYING: 'PLAYING',
        GAME_OVER: 'GAME_OVER',
        // PAUSED: 'PAUSED' // Future consideration
    };

    constructor() {
        this.currentState = null;
        this.ui = {
            startScreen: document.getElementById('startScreen'),
            gameOverScreen: document.getElementById('gameOverScreen'),
            scoreDisplay: document.getElementById('scoreDisplay'),
            finalScore: document.getElementById('finalScore'), // Span for final score
            playButton: document.getElementById('playButton'), // Will be used later for event listeners
            retryButton: document.getElementById('retryButton') // Will be used later for event listeners
        };

        // Initial UI setup can be done here or by the first call to changeState
        // For now, let's assume main.js will call changeState to MENU which will set initial UI.
        console.log("GameStateManager created. UI elements referenced.");
        if (!this.ui.startScreen || !this.ui.gameOverScreen || !this.ui.scoreDisplay || !this.ui.finalScore) {
            console.warn("GameStateManager: One or more UI elements were not found in the DOM at construction time.");
        }
    }

    changeState(newState) {
        if (!Object.values(GameStateManager.STATES).includes(newState)) {
            console.error(`Attempted to change to invalid state: ${newState}`);
            return;
        }
        this.currentState = newState;
        console.log(`Game state changed to: ${this.currentState}`);
        this.updateUIVisibility();
    }

    updateUIVisibility() {
        // Hide all screens/UI elements that toggle by default
        if (this.ui.startScreen) this.ui.startScreen.classList.remove('active-screen');
        if (this.ui.gameOverScreen) this.ui.gameOverScreen.classList.remove('active-screen');
        
        // Default for scoreDisplay is hidden, only shown when PLAYING
        if (this.ui.scoreDisplay) this.ui.scoreDisplay.style.display = 'none';

        // Show UI based on current state
        switch (this.currentState) {
            case GameStateManager.STATES.MENU:
                if (this.ui.startScreen) this.ui.startScreen.classList.add('active-screen');
                break;
            case GameStateManager.STATES.PLAYING:
                if (this.ui.scoreDisplay) this.ui.scoreDisplay.style.display = 'block';
                // Any other playing-specific UI updates
                break;
            case GameStateManager.STATES.GAME_OVER:
                if (this.ui.gameOverScreen) this.ui.gameOverScreen.classList.add('active-screen');
                // Optional: decide if scoreDisplay should be visible on game over screen.
                // If it's part of the gameOverScreen's design, it might not need separate handling here.
                // For now, it will be hidden due to the default above.
                // If you want to show it, add:
                // if (this.ui.scoreDisplay) this.ui.scoreDisplay.style.display = 'block'; 
                
                // Example placeholder for score, actual score will come from game logic
                this.setFinalScore("0"); // Initialize with a default or last score
                break;
        }
        console.log(`UI updated for state: ${this.currentState}`);
    }

    setFinalScore(score) {
        if (this.ui.finalScore) {
            this.ui.finalScore.textContent = score;
            console.log(`Final score UI updated to: ${score}`);
        } else {
            console.warn("setFinalScore called, but UI element for finalScore is not found.");
        }
    }
}

export default GameStateManager;
