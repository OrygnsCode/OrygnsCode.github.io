/**
 * Pipe Management System
 * Handles pipe generation, movement, and scoring
 */
class PipeManager {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.groundHeight = 112;

        this.pipes = [];
        this.pipeWidth = 52;
        this.pipeGap = 135; // Vertical gap for bird to pass through (increased for easier gameplay)
        this.pipeSpeed = 2;
        this.spawnInterval = 2000; // 2 seconds in ms
        this.spawnTimer = 0;
        this.initialDelay = 1500; // Wait 1.5s before first pipe
    }

    update(deltaTime) {
        // Update spawn timer
        this.spawnTimer += deltaTime;

        // Spawn new pipe pair
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnPipePair();
        }

        // Move pipes (frame-rate independent)
        const dt = deltaTime / 1000;
        const moveAmount = this.pipeSpeed * 60 * dt; // Normalized to 60fps

        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= moveAmount;

            // Remove pipes that are off-screen
            if (pipe.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }
    }

    spawnPipePair() {
        // Random vertical offset for gap position
        const minGapY = 80;
        const maxGapY = this.canvasHeight - this.groundHeight - this.pipeGap - 80;
        const gapY = Math.random() * (maxGapY - minGapY) + minGapY;

        // Top pipe
        this.pipes.push({
            x: this.canvasWidth,
            y: 0,
            width: this.pipeWidth,
            height: gapY,
            scored: false,
            isTop: true
        });

        // Bottom pipe
        this.pipes.push({
            x: this.canvasWidth,
            y: gapY + this.pipeGap,
            width: this.pipeWidth,
            height: this.canvasHeight - this.groundHeight - (gapY + this.pipeGap),
            scored: false,
            isTop: false
        });
    }

    checkCollision(bird) {
        const birdBox = bird.getHitbox();
        const capExtension = 2; // Pipe caps extend 2px on each side

        for (const pipe of this.pipes) {
            // Pipe body collision area (including cap extension)
            const pipeLeft = pipe.x - capExtension;
            const pipeRight = pipe.x + pipe.width + capExtension;
            const pipeTop = pipe.y;
            const pipeBottom = pipe.y + pipe.height;

            // Check if bird overlaps with pipe horizontally
            if (birdBox.x + birdBox.width > pipeLeft &&
                birdBox.x < pipeRight) {

                // Check if bird overlaps with pipe vertically
                if (birdBox.y < pipeBottom &&
                    birdBox.y + birdBox.height > pipeTop) {
                    return true;
                }
            }
        }

        return false;
    }

    checkScore(bird) {
        let scored = false;

        for (const pipe of this.pipes) {
            // Only check top pipes (each pair counts once)
            if (pipe.isTop && !pipe.scored) {
                // Check if bird has passed the pipe
                const birdCenterX = bird.x + bird.width / 2;
                const pipeCenterX = pipe.x + pipe.width / 2;

                if (birdCenterX > pipeCenterX) {
                    pipe.scored = true;
                    // Mark the corresponding bottom pipe as scored too
                    const bottomPipe = this.pipes.find(p =>
                        !p.isTop && p.x === pipe.x && !p.scored
                    );
                    if (bottomPipe) {
                        bottomPipe.scored = true;
                    }
                    scored = true;
                }
            }
        }

        return scored;
    }

    reset() {
        this.pipes = [];
        this.spawnTimer = -this.initialDelay; // Negative to delay first spawn
    }

    draw(ctx) {
        for (const pipe of this.pipes) {
            // Pipe body
            ctx.fillStyle = '#4CAF50'; // Green
            ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);

            // Pipe border (darker green)
            ctx.strokeStyle = '#2E7D32';
            ctx.lineWidth = 2;
            ctx.strokeRect(pipe.x, pipe.y, pipe.width, pipe.height);

            // Pipe cap (slightly wider)
            const capHeight = 24;
            const capWidth = this.pipeWidth + 4;

            if (pipe.isTop) {
                // Cap at bottom of top pipe
                const capY = pipe.y + pipe.height - capHeight;
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(pipe.x - 2, capY, capWidth, capHeight);
                ctx.strokeRect(pipe.x - 2, capY, capWidth, capHeight);

                // Highlight
                ctx.fillStyle = '#66BB6A';
                ctx.fillRect(pipe.x, capY + 2, 4, capHeight - 4);
            } else {
                // Cap at top of bottom pipe
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(pipe.x - 2, pipe.y, capWidth, capHeight);
                ctx.strokeRect(pipe.x - 2, pipe.y, capWidth, capHeight);

                // Highlight
                ctx.fillStyle = '#66BB6A';
                ctx.fillRect(pipe.x, pipe.y + 2, 4, capHeight - 4);
            }
        }
    }
}
