// InputHandler.js - Manages player input
import GameStateManager from './GameStateManager.js'; // Import GameStateManager

class InputHandler {
    constructor(player, gameStateManager) {
        this.player = player;
        this.gameStateManager = gameStateManager;
        this.init();
        console.log("InputHandler created and initialized.");
    }

    init() {
        document.addEventListener('keydown', (event) => {
            // Ensure GameStateManager.STATES is accessible.
            if (!GameStateManager.STATES) { // Check directly on the imported class
                console.error("GameStateManager.STATES is not defined!");
                return;
            }

            if (this.gameStateManager.currentState !== GameStateManager.STATES.PLAYING) {
                return; // Only handle input if game is in PLAYING state
            }

            let handled = false;
            switch (event.key) {
                case 'ArrowUp':
                case 'w': // Adding WASD support
                case ' ': // Adding Spacebar for jump
                    this.player.jump();
                    handled = true;
                    break;
                case 'ArrowDown':
                case 's': // Adding WASD support
                    this.player.slide();
                    handled = true;
                    break;
                case 'ArrowLeft':
                case 'a': // Adding WASD support
                    const targetLaneLeft = Math.max(0, this.player.currentLane - 1);
                    if (targetLaneLeft !== this.player.currentLane) {
                        this.player.moveToLane(targetLaneLeft);
                    }
                    handled = true;
                    break;
                case 'ArrowRight':
                case 'd': // Adding WASD support
                    const targetLaneRight = Math.min(this.player.lanes.length - 1, this.player.currentLane + 1);
                    if (targetLaneRight !== this.player.currentLane) {
                        this.player.moveToLane(targetLaneRight);
                    }
                    handled = true;
                    break;
            }

            if (handled) {
                event.preventDefault(); // Prevent default browser action (e.g., scrolling)
            }
        });

        // Placeholder for Mobile Swipe Input
        // this.initSwipeControls();
        console.log("Keyboard event listeners set up.");
    }

    // initSwipeControls() {
    //     let touchStartX = 0;
    //     let touchEndX = 0;
    //     let touchStartY = 0;
    //     let touchEndY = 0;

    //     document.addEventListener('touchstart', (event) => {
    //         touchStartX = event.changedTouches[0].screenX;
    //         touchStartY = event.changedTouches[0].screenY;
    //     }, false);

    //     document.addEventListener('touchend', (event) => {
    //         touchEndX = event.changedTouches[0].screenX;
    //         touchEndY = event.changedTouches[0].screenY;
    //         this.handleSwipeGesture();
    //     }, false); 
    // }

    // handleSwipeGesture() {
    //     const GameStates = this.gameStateManager.constructor.STATES || window.GameStateManagerStatesFallback;
    //     if (!GameStates || this.gameStateManager.currentState !== GameStates.PLAYING) {
    //         return;
    //     }

    //     const deltaX = touchEndX - touchStartX;
    //     const deltaY = touchEndY - touchStartY;
    //     const swipeThreshold = 50; // Minimum distance for a swipe

    //     if (Math.abs(deltaX) > Math.abs(deltaY)) { // Horizontal swipe
    //         if (Math.abs(deltaX) > swipeThreshold) {
    //             if (deltaX > 0) { // Swipe Right
    //                 const targetLaneRight = Math.min(this.player.lanes.length - 1, this.player.currentLane + 1);
    //                 this.player.moveToLane(targetLaneRight);
    //             } else { // Swipe Left
    //                 const targetLaneLeft = Math.max(0, this.player.currentLane - 1);
    //                 this.player.moveToLane(targetLaneLeft);
    //             }
    //         }
    //     } else { // Vertical swipe
    //         if (Math.abs(deltaY) > swipeThreshold) {
    //             if (deltaY < 0) { // Swipe Up
    //                 this.player.jump();
    //             } else { // Swipe Down
    //                 this.player.slide();
    //             }
    //         }
    //     }
    // }
}

// Fallback for GameStateManager.STATES is no longer needed here.

export default InputHandler;
