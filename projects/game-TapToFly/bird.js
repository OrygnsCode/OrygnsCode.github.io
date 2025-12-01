/**
 * Bird Class
 * Handles bird physics, animation, and rendering
 */
class Bird {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30; // Made square for better rotation handling

        // Physics
        this.velocity = 0;
        this.gravity = 0.5;
        this.flapStrength = -8;
        this.maxFallSpeed = 10;

        // Rotation
        this.rotation = 0;
        this.targetRotation = 0;
        this.rotationSpeed = 0.15;

        // Animation
        this.frame = 0;
        this.frameTimer = 0;
        this.frameInterval = 100; // ms between frames

        // Collision hitbox (small padding for fair collisions)
        this.hitboxPadding = 4;
    }

    flap() {
        this.velocity = this.flapStrength;
        this.targetRotation = -25; // Tilt up when flapping

        // Play flap sound
        if (window.audioManager) {
            window.audioManager.play('flap');
        }
    }

    update(deltaTime) {
        // Convert deltaTime from ms to seconds for consistent physics
        const dt = deltaTime / 1000;

        // Apply gravity (pixels per second squared)
        this.velocity += this.gravity * 60 * dt; // Multiply by 60 to match 60fps feel

        // Cap fall speed
        if (this.velocity > this.maxFallSpeed) {
            this.velocity = this.maxFallSpeed;
        }

        // Update position (also frame-rate independent)
        this.y += this.velocity * 60 * dt;

        // Update rotation based on velocity
        if (this.velocity < 0) {
            this.targetRotation = -25; // Rising
        } else if (this.velocity > 3) {
            this.targetRotation = 90; // Falling
        }

        // Smooth rotation interpolation
        this.rotation += (this.targetRotation - this.rotation) * this.rotationSpeed;

        // Clamp rotation
        if (this.rotation > 90) this.rotation = 90;
        if (this.rotation < -25) this.rotation = -25;

        // Update animation frame
        this.frameTimer += deltaTime;
        if (this.frameTimer >= this.frameInterval) {
            this.frameTimer = 0;
            this.frame = (this.frame + 1) % 3; // 3 animation frames
        }
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velocity = 0;
        this.rotation = 0;
        this.targetRotation = 0;
        this.frame = 0;
        this.frameTimer = 0;
    }

    getHitbox() {
        return {
            x: this.x + this.hitboxPadding,
            y: this.y + this.hitboxPadding,
            width: this.width - this.hitboxPadding * 2,
            height: this.height - this.hitboxPadding * 2
        };
    }

    draw(ctx) {
        ctx.save();

        // Move to bird center
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // Apply rotation
        ctx.rotate((this.rotation * Math.PI) / 180);

        // Draw bird (simple colored rectangle with animation)
        // We'll draw a simple bird shape since image generation failed

        // Body
        ctx.fillStyle = '#FFD700'; // Gold
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Eye
        ctx.fillStyle = '#000';
        ctx.fillRect(this.width / 4, -this.height / 4, 4, 4);

        // Beak
        ctx.fillStyle = '#FF8C00';
        ctx.fillRect(this.width / 2 - 2, 0, 8, 4);

        // Wing animation (oscillating position)
        const wingOffset = Math.sin(this.frame * 2) * 2;
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(-2, wingOffset, 12, 8);

        ctx.restore();

        // Debug hitbox (uncomment to visualize)
        // const hitbox = this.getHitbox();
        // ctx.strokeStyle = 'red';
        // ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
    }
}
