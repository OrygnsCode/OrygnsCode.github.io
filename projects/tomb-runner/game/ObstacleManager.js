// ObstacleManager.js - Manages obstacles in the game
import Track from './Track.js'; // Needed for Track.project

class ObstacleManager {
    constructor(ctx, track, player, gameWidth, gameHeight) {
        this.ctx = ctx;
        this.track = track;
        this.player = player; // Will be used for collision detection later
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;

        this.obstacles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 2000; // Spawn an obstacle every 2 seconds (in milliseconds)
        this.obstacleTypes = {
            STATIONARY_BLOCK: 'STATIONARY_BLOCK',
            WALL: 'WALL', // Player must slide under
            GAP: 'GAP',      // Player must jump over
            COIN: 'COIN' // New type
        };
        this.obstacleBaseZOffset = 50; // How far ahead to spawn relative to last track segment.

        console.log("ObstacleManager created.");
    }

    spawnObstacle() {
        const laneIndex = Math.floor(Math.random() * this.track.numLanes);
        
        const lastTrackSegment = this.track.segments[this.track.segments.length - 1];
        if (!lastTrackSegment) {
            console.warn("ObstacleManager: Cannot spawn obstacle, track segments not found.");
            return; 
        }

        const zPos = lastTrackSegment.z2 + this.obstacleBaseZOffset;

        // Decide whether to spawn an obstacle or a coin sequence
        if (Math.random() < 0.3) { // 30% chance to spawn a coin sequence
            this.spawnCoinSequence(laneIndex, zPos);
            return; // Don't spawn an obstacle this time
        }

        // Filter out COIN type for regular obstacle spawning
        const regularObstacleTypes = Object.values(this.obstacleTypes).filter(type => type !== this.obstacleTypes.COIN);
        const selectedType = regularObstacleTypes[Math.floor(Math.random() * regularObstacleTypes.length)];
        let obstacleProperties;

        switch (selectedType) {
            case this.obstacleTypes.WALL:
                obstacleProperties = {
                    type: this.obstacleTypes.WALL,
                    width: this.track.laneWidth, // Full lane width
                    height: 120, // Taller, player must slide
                    y: 0, // Base on ground
                    color: 'rgba(100, 100, 255, 0.9)' // Blue wall
                };
                break;
            case this.obstacleTypes.GAP:
                obstacleProperties = {
                    type: this.obstacleTypes.GAP,
                    width: this.track.laneWidth, // Full lane width
                    height: 2, // Very flat
                    y: -1, // Slightly into the ground to appear as a decal or hole edge
                    depth: this.track.segmentLength, // Covers a full segment's depth
                    color: 'rgba(0, 0, 0, 0.7)' // Dark patch for gap
                };
                break;
            case this.obstacleTypes.STATIONARY_BLOCK:
            default:
                obstacleProperties = {
                    type: this.obstacleTypes.STATIONARY_BLOCK,
                    width: this.track.laneWidth * 0.8,
                    height: 60, // Player can jump over this
                    y: 0, // Base on ground
                    color: 'rgba(255, 50, 50, 0.9)' // Red
                };
                break;
        }

        const newObstacle = {
            laneIndex: laneIndex,
            x: this.track.lanes[laneIndex],
            z: zPos,
            depth: (selectedType === this.obstacleTypes.GAP) ? this.track.segmentLength : this.track.segmentLength * 0.5,
            collided: false,
            ...obstacleProperties // Spread type-specific properties
        };
        this.obstacles.push(newObstacle);
        console.log(`Spawned ${selectedType} at Z: ${zPos} in lane: ${laneIndex}`);
    }

    update(deltaTime) {
        this.spawnTimer += deltaTime * 1000; // deltaTime is in seconds

        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnObstacle();
            this.spawnTimer = 0;
            // Optional: Randomize spawnInterval slightly for variety
            // this.spawnInterval = 2000 + (Math.random() * 1000 - 500); 
        }

        // Obstacles are defined by their absolute Z, so their Z doesn't change unless they move.
        // The track's positionZ moves, making the obstacles appear to come closer.

        // Remove obstacles that are far behind the camera (including collected coins)
        this.obstacles = this.obstacles.filter(obstacle => {
            if (obstacle.type === this.obstacleTypes.COIN && obstacle.collected) {
                return false; // Remove collected coins
            }
            return obstacle.z + obstacle.depth > this.track.positionZ - this.track.segmentLength;
        });
        // Keep if the back of the obstacle (obstacle.z + obstacle.depth) is still somewhat visible or ahead of a cutoff point.
    }

    spawnCoinSequence(laneIndex, baseZ) {
        const numCoins = 3 + Math.floor(Math.random() * 3); // 3 to 5 coins
        const coinSpacingZ = this.track.segmentLength * 0.5;
        const coinY = 60; // Height above ground for coins to hover

        for (let i = 0; i < numCoins; i++) {
            const coin = {
                type: this.obstacleTypes.COIN,
                laneIndex: laneIndex,
                x: this.track.lanes[laneIndex],
                y: coinY, // World Y (height above track)
                z: baseZ + i * coinSpacingZ,
                width: 30, // For collision box and drawing a square coin
                height: 30, // For collision box and drawing a square coin
                depth: 5,  // Coins are thin
                color: 'rgba(255, 223, 0, 0.9)', // Gold color
                collected: false,
                isCollectible: true // Differentiator if COIN is in obstacleTypes
            };
            this.obstacles.push(coin); // Add to the main obstacles array for now
        }
        console.log(`Spawned coin sequence (${numCoins}) in lane ${laneIndex} starting at Z ${baseZ}`);
    }

    draw() {
        this.obstacles.forEach(obstacle => {
            // Only draw obstacles that are in front of the camera's near plane.
            // The obstacle's Z is its front face. If its back face (z + depth) is behind camera, don't draw.
            if (obstacle.z + obstacle.depth <= this.track.positionZ) {
                 return;
            }

            if (obstacle.type === this.obstacleTypes.COIN) {
                if (obstacle.collected) return; // Don't draw collected coins

                // Simplified drawing for coins (e.g., a 2D projected circle or square)
                const pCoinCenter = Track.project(
                    { x: obstacle.x, y: obstacle.y, z: obstacle.z }, // Project coin's center
                    0, this.track.cameraHeight, this.track.positionZ, this.track.cameraDepth,
                    this.gameWidth, this.gameHeight, obstacle.width
                );

                // Basic culling for coins
                if (pCoinCenter.y < 0 || pCoinCenter.y > this.gameHeight || 
                    pCoinCenter.x + pCoinCenter.w / 2 < 0 || pCoinCenter.x - pCoinCenter.w / 2 > this.gameWidth ||
                    obstacle.z + obstacle.depth <= this.track.positionZ) { // Also check Z
                    return;
                }
                
                const radius = pCoinCenter.w / 2; // Use projected width as diameter
                if (radius <=0) return;

                this.ctx.fillStyle = obstacle.color;
                this.ctx.beginPath();
                this.ctx.arc(pCoinCenter.x, pCoinCenter.y, Math.max(2, radius), 0, Math.PI * 2); // Draw as circle
                this.ctx.fill();
                // Or draw as a square:
                // this.ctx.fillRect(pCoinCenter.x - radius, pCoinCenter.y - radius, radius * 2, radius * 2);

            } else if (obstacle.type === this.obstacleTypes.GAP) {
                // Draw GAP as a simple projected flat rectangle
                const pBaseFrontGap = Track.project(
                    { x: obstacle.x, y: 0, z: obstacle.z },
                    0, this.track.cameraHeight, this.track.positionZ, this.track.cameraDepth,
                    this.gameWidth, this.gameHeight, obstacle.width
                );
                const pBaseBackGap = Track.project(
                    { x: obstacle.x, y: 0, z: obstacle.z + obstacle.depth },
                    0, this.track.cameraHeight, this.track.positionZ, this.track.cameraDepth,
                    this.gameWidth, this.gameHeight, obstacle.width
                );
            
                if (pBaseFrontGap.y > 0 && pBaseBackGap.y < this.gameHeight && pBaseFrontGap.y > pBaseBackGap.y) { // Basic on-screen & valid projection check
                     this.ctx.fillStyle = obstacle.color;
                     this.ctx.beginPath();
                     this.ctx.moveTo(pBaseFrontGap.x - pBaseFrontGap.w / 2, pBaseFrontGap.y);
                     this.ctx.lineTo(pBaseFrontGap.x + pBaseFrontGap.w / 2, pBaseFrontGap.y);
                     this.ctx.lineTo(pBaseBackGap.x + pBaseBackGap.w / 2, pBaseBackGap.y);
                     this.ctx.lineTo(pBaseBackGap.x - pBaseBackGap.w / 2, pBaseBackGap.y);
                     this.ctx.closePath();
                     this.ctx.fill();
                }
            } else {
                // Existing 3D block drawing logic for STATIONARY_BLOCK and WALL
                const pBaseFront = Track.project(
                    { x: obstacle.x, y: 0, z: obstacle.z }, // Projecting center of base, front face, on the ground
                0, // cameraXOffset (player is at 0)
                this.track.cameraHeight,
                this.track.positionZ,
                this.track.cameraDepth,
                this.gameWidth,
                this.gameHeight,
                obstacle.width // Use obstacle's actual width for scaling its screen width
            );

            // Project the center-top-front point of the obstacle
            const pTopFront = Track.project(
                { x: obstacle.x, y: obstacle.height, z: obstacle.z }, // Projecting center of top, front face
                0,
                this.track.cameraHeight,
                this.track.positionZ,
                this.track.cameraDepth,
                this.gameWidth,
                this.gameHeight,
                obstacle.width
            );

            const screenHeight = pBaseFront.y - pTopFront.y;
            const screenX = pBaseFront.x - pBaseFront.w / 2; // pBase.x is center, pBase.w is scaled width
            const screenY = pTopFront.y; // Top of the obstacle on screen

            // Basic culling
            if (pBaseFront.y < 0 || screenY > this.gameHeight || screenX > this.gameWidth || screenX + pBaseFront.w < 0 || screenHeight <=0) {
                return; // Off-screen or culled by perspective
            }
            
            this.ctx.fillStyle = obstacle.color;
            this.ctx.fillRect(screenX, screenY, pBaseFront.w, screenHeight);

            // For a slightly more 3D look for a block, we can attempt to draw a top and a side
            // if the obstacle has depth and is not perfectly face-on.
            // This is still a simplification. A full 3D projection of a box is more complex.

            // Project back points for depth (simplified: only for the top face)
            const pBaseBack = Track.project(
                { x: obstacle.x, y: 0, z: obstacle.z + obstacle.depth },
                0, this.track.cameraHeight, this.track.positionZ, this.track.cameraDepth,
                this.gameWidth, this.gameHeight, obstacle.width
            );
            const pTopBack = Track.project(
                { x: obstacle.x, y: obstacle.height, z: obstacle.z + obstacle.depth },
                0, this.track.cameraHeight, this.track.positionZ, this.track.cameraDepth,
                this.gameWidth, this.gameHeight, obstacle.width
            );

            // If the back is visible (further on screen Y for top, or different X for sides)
            if (pTopBack.y > pTopFront.y && screenHeight > 0 && pBaseFront.w > 0) { // Basic check for visibility
                this.ctx.fillStyle = 'rgba(200, 0, 0, 0.9)'; // Darker red for top/side

                // Draw Top Face (as a quadrilateral)
                this.ctx.beginPath();
                this.ctx.moveTo(screenX, screenY); // Top-left-front
                this.ctx.lineTo(screenX + pBaseFront.w, screenY); // Top-right-front
                this.ctx.lineTo(pTopBack.x + pTopBack.w / 2, pTopBack.y); // Top-right-back
                this.ctx.lineTo(pTopBack.x - pTopBack.w / 2, pTopBack.y); // Top-left-back
                this.ctx.closePath();
                this.ctx.fill();

                // Simplified Side Drawing (only one side, if visible)
                // This logic is very basic and might not always look right.
                // It assumes the object is somewhat centered or player is looking head-on.
                // A proper 3D engine would handle face culling and projection more robustly.
                
                // Example: Draw right side if right-front-top is to the left of right-back-top (perspective)
                if (pTopFront.x + pBaseFront.w / 2 < pTopBack.x + pTopBack.w / 2) {
                     this.ctx.beginPath();
                     this.ctx.moveTo(screenX + pBaseFront.w, screenY); // Top-right-front
                     this.ctx.lineTo(screenX + pBaseFront.w, screenY + screenHeight); // Bottom-right-front
                     this.ctx.lineTo(pBaseBack.x + pBaseBack.w / 2, pBaseBack.y); // Bottom-right-back
                     this.ctx.lineTo(pTopBack.x + pTopBack.w / 2, pTopBack.y); // Top-right-back
                     this.ctx.closePath();
                     this.ctx.fill();
                } // else if (left side is visible) { ... }
            }
            } // End of else for non-GAP obstacles
        });
    }

    getObstacleScreenBoundingBox(obstacle) {
        if (obstacle.type === this.obstacleTypes.COIN) {
            // Simplified bounding box for coin (using its defined width/height for projection)
            const pCoinBase = Track.project(
                { x: obstacle.x, y: obstacle.y - obstacle.height / 2, z: obstacle.z },
                0, this.track.cameraHeight, this.track.positionZ, this.track.cameraDepth,
                this.gameWidth, this.gameHeight, obstacle.width
            );
            const pCoinTop = Track.project(
                { x: obstacle.x, y: obstacle.y + obstacle.height / 2, z: obstacle.z },
                0, this.track.cameraHeight, this.track.positionZ, this.track.cameraDepth,
                this.gameWidth, this.gameHeight, obstacle.width
            );
    
            const screenHeight = pCoinBase.y - pCoinTop.y;
            if (screenHeight <= 0) return null;
    
            return {
                x: pCoinBase.x - pCoinBase.w / 2,
                y: pCoinTop.y,
                width: pCoinBase.w,
                height: screenHeight
            };
        }

        // Project the center-bottom-front point of the obstacle's base
        const pBase = Track.project(
            { x: obstacle.x, y: 0, z: obstacle.z }, // Projecting center of base on the ground
            0, // cameraXOffset
            this.track.cameraHeight,
            this.track.positionZ,
            this.track.cameraDepth,
            this.gameWidth,
            this.gameHeight,
            obstacle.width 
        );

        // Project a point at the top of the obstacle to get its screen height
        const pTop = Track.project(
            { x: obstacle.x, y: obstacle.height, z: obstacle.z },
            0, 
            this.track.cameraHeight,
            this.track.positionZ,
            this.track.cameraDepth,
            this.gameWidth,
            this.gameHeight,
            obstacle.width
        );
        
        const screenHeight = pBase.y - pTop.y;
        const screenX = pBase.x - pBase.w / 2;
        const screenY = pTop.y;

        // If screenHeight is zero or negative, it means the top is at or below the base,
        // which can happen if it's culled by perspective or exactly at horizon.
        // Treat as invalid/non-visible for collision.
        // For GAP obstacles, height is near zero, so this check might be too strict.
        // However, GAP collision is handled differently (player Z vs obstacle Z and lane).
        if (obstacle.type !== this.obstacleTypes.GAP && screenHeight <= 0) return null;
        if (obstacle.type === this.obstacleTypes.GAP && pBase.y <= pTop.y) return null; // Gap specific check for valid projection


        return {
            x: screenX,
            y: screenY,
            width: pBase.w, // Scaled width of the obstacle's front face
            height: screenHeight
        };
    }

    checkCollisions(player) {
        const playerBox = player.getBoundingBox();

        for (const obstacle of this.obstacles) {
            // if (obstacle.collided) continue; // Optional: skip for one-time collision effect

            // Z-culling: Only check obstacles that are roughly in the player's Z range for efficiency.
            // Player's effective Z for collision is close to this.track.positionZ.
            // Obstacle's relevant Z is its front face (obstacle.z) to its back face (obstacle.z + obstacle.depth).
            const playerEffectiveZ = this.track.positionZ + (this.track.cameraDepth * 100); // Simplified player Z for check
                                                                                            // A more accurate Z would be where the player's 2D bounding box exists in 3D.
                                                                                            // For now, consider player near camera.
            
            // If the front of the obstacle is far beyond the player OR the back of the obstacle is already behind the player
            if (obstacle.z > playerEffectiveZ + 200 || obstacle.z + obstacle.depth < this.track.positionZ) {
                 // The value '200' is a buffer, can be tuned.
                 // This is a coarse Z culling.
                continue; 
            }

            // If the front of the obstacle is far beyond the player OR the back of the obstacle is already behind the player
            if (obstacle.z > playerEffectiveZ + 200 || obstacle.z + obstacle.depth < this.track.positionZ) {
                 // The value '200' is a buffer, can be tuned.
                 // This is a coarse Z culling.
                continue; 
            }

            const obstacleBox = this.getObstacleScreenBoundingBox(obstacle);
            const playerState = player.currentState; // Get player's current state

            if (obstacleBox) {
                // AABB collision check
                if (playerBox.x < obstacleBox.x + obstacleBox.width &&
                    playerBox.x + playerBox.width > obstacleBox.x &&
                    playerBox.y < obstacleBox.y + obstacleBox.height &&
                    playerBox.y + playerBox.height > obstacleBox.y) {
                    
                    // Potential collision detected, now check against type and player state
                    switch (obstacle.type) {
                        case this.obstacleTypes.STATIONARY_BLOCK:
                            console.log("Collision with STATIONARY_BLOCK");
                            return true; // Game over
                        
                        case this.obstacleTypes.WALL:
                            if (playerState !== player.states.SLIDING) {
                                console.log("Collision with WALL (player not sliding)");
                                return true; // Game over
                            }
                            // If player is sliding, it's a successful pass
                            console.log("Passed under WALL (player sliding)");
                            break; 
                        
                        case this.obstacleTypes.GAP:
                            // For a GAP, a collision means the player is "on" the gap area and NOT jumping.
                            // The AABB check confirms overlap. Now check if player is NOT jumping.
                            if (playerState !== player.states.JUMPING) {
                                console.log("Fell into GAP (player not jumping)");
                                return true; // Game over
                            }
                            // If player is jumping over the gap, it's a successful pass.
                            console.log("Jumped over GAP");
                            break;
                        
                        default:
                            console.warn(`Unhandled obstacle type in collision: ${obstacle.type}`);
                            return true; // Treat unhandled as a collision for safety
                    }
                }
            }
        }
        return false; // No collision
    }

    checkCoinCollisions(player) {
        const playerBox = player.getBoundingBox();

        for (const obstacle of this.obstacles) {
            if (obstacle.type === this.obstacleTypes.COIN && !obstacle.collected) {
                const coinBox = this.getObstacleScreenBoundingBox(obstacle);

                if (coinBox && playerBox) { // Ensure both bounding boxes are valid
                    // AABB collision check
                    if (playerBox.x < coinBox.x + coinBox.width &&
                        playerBox.x + playerBox.width > coinBox.x &&
                        playerBox.y < coinBox.y + coinBox.height &&
                        playerBox.y + playerBox.height > coinBox.y) {
                        
                        obstacle.collected = true;
                        console.log("Coin collected at Z:", obstacle.z, "Lane:", obstacle.laneIndex);
                        return true; // Indicate a coin was collected this frame
                    }
                }
            }
        }
        return false; // No coin collected this frame
    }
}

export default ObstacleManager;
