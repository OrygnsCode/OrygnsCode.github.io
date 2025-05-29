// Player.js - Handles player character logic
class Player {
    constructor(ctx, gameWidth, gameHeight) {
        this.ctx = ctx;
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;

        this.width = 50; // example width
        this.height = 80; // example height for running state
        this.color = 'rgba(0, 150, 255, 0.8)'; // example color - a blue silhouette

        // Lane configuration (center of each lane relative to game center)
        // X=0 is the center of the game screen.
        // Player's X will be the center of the player character.
        this.lanes = [-this.gameWidth / 4, 0, this.gameWidth / 4]; 
        this.currentLane = 1; // middle lane, index 1

        // Player's X position is the center of the lane it's in.
        this.x = this.lanes[this.currentLane]; 
        
        // Player's Y position (top of the player rectangle)
        this.y = this.gameHeight - this.height - 20; // position player near bottom, 20px padding from bottom edge (this is top Y)
        this.groundTopY = this.y; // to remember ground position (top Y) for jumping and sliding

        this.velocityY = 0;
        this.gravity = 0.5; // for jumping
        this.isJumping = false;
        this.isSliding = false; // This will be controlled by currentState more directly
        this.slideHeight = 40; // example height when sliding

        this.states = { RUNNING: 'RUNNING', JUMPING: 'JUMPING', SLIDING: 'SLIDING' };
        this.currentState = this.states.RUNNING;

        console.log("Player created at x:", this.x, "y:", this.y, "lane:", this.currentLane);
        console.log("Game dimensions:", this.gameWidth, this.gameHeight);
        console.log("Lanes:", this.lanes);
    }

    draw() {
        this.ctx.fillStyle = this.color;
        let currentHeight = this.height;
        let currentY = this.y;

        if (this.currentState === this.states.SLIDING) {
            currentHeight = this.slideHeight;
            // Adjust Y when sliding so it stays on the ground
            currentY = this.groundTopY + (this.height - this.slideHeight); 
        }
        
        // Adjust x for lane positioning relative to center of player
        // this.x is the center of the player, canvas fillRect draws from top-left.
        const drawX = (this.gameWidth / 2) + this.x - (this.width / 2);
        this.ctx.fillRect(drawX, currentY, this.width, currentHeight);
    }

    update() { // deltaTime can be added later for frame-independent physics
        if (this.isJumping) { // JUMPING state implies isJumping is true
            this.y += this.velocityY;
            this.velocityY += this.gravity;
            if (this.y >= this.groundTopY) {
                this.y = this.groundTopY;
                this.isJumping = false;
                if(this.currentState === this.states.JUMPING) { // Only change to running if still in jump state
                    this.currentState = this.states.RUNNING;
                }
                this.velocityY = 0;
            }
        }

        // Sliding state is now timed in the slide() method.
        // No specific update logic for sliding here unless it involves physics (e.g., movement while sliding).
    }

    jump() {
        if (this.currentState === this.states.RUNNING && !this.isJumping) { // Can only jump if running
            this.isJumping = true;
            this.velocityY = -15; // Adjust jump strength as needed (negative is up)
            this.currentState = this.states.JUMPING;
            console.log("Player Jumped. Y:", this.y, "VelocityY:", this.velocityY);
        }
    }

    slide() {
        if (this.currentState === this.states.RUNNING && !this.isJumping) { // Can only slide if running
            this.currentState = this.states.SLIDING;
            console.log("Player Slid");
            // Automatically return to running state after a short duration
            setTimeout(() => {
                if (this.currentState === this.states.SLIDING) { // Check if still sliding
                    this.currentState = this.states.RUNNING;
                    console.log("Player stopped sliding, back to running.");
                }
            }, 800); // Slide for 800ms (example)
        }
    }

    moveToLane(laneIndex) {
        // Allow lane change if running or jumping (not sliding)
        if (laneIndex >= 0 && laneIndex < this.lanes.length && this.currentState !== this.states.SLIDING) {
            this.currentLane = laneIndex;
            this.x = this.lanes[this.currentLane];
            console.log("Player moved to lane:", laneIndex, "New X:", this.x);
        }
    }

    getBoundingBox() {
        const screenX = (this.gameWidth / 2) + this.x - (this.width / 2);
        let currentTopY = this.y; // this.y is the top of the standing hitbox
        let currentHeight = this.height;

        if (this.currentState === this.states.SLIDING) {
            currentHeight = this.slideHeight;
            // When sliding, the top of the hitbox effectively moves down
            currentTopY = this.groundTopY + (this.height - this.slideHeight); 
        }

        return {
            x: screenX,
            y: currentTopY,
            width: this.width,
            height: currentHeight
        };
    }
}

export default Player;
