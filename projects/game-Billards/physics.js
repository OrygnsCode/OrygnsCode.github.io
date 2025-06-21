// Advanced Physics Engine for Billiards
class PhysicsEngine {
    constructor() {
        this.friction = 0.988; // More realistic friction
        this.wallBounce = 0.85; // Better wall bounce
        this.ballBounce = 0.92; // More realistic ball collision
        this.minSpeed = 0.08; // Lower threshold for smoother stops
        this.spinDecay = 0.95; // Spin decay rate
        console.log('🔬 Physics Engine initialized');
    }

    updateBall(ball, deltaTime) {
        if (ball.sunk) return false;

        const speed = ball.getSpeed();
        if (speed < this.minSpeed && Math.abs(ball.spin.x) < 0.01 && Math.abs(ball.spin.y) < 0.01) {
            ball.stop();
            return false;
        }

        // Apply spin effects to velocity
        if (Math.abs(ball.spin.x) > 0.01 || Math.abs(ball.spin.y) > 0.01) {
            ball.vx += ball.spin.x * 0.1;
            ball.vy += ball.spin.y * 0.1;
            
            // Decay spin
            ball.spin.x *= this.spinDecay;
            ball.spin.y *= this.spinDecay;
        }

        // Apply realistic friction - more at higher speeds
        const frictionFactor = this.friction - (speed * 0.001);
        ball.vx *= Math.max(frictionFactor, 0.97);
        ball.vy *= Math.max(frictionFactor, 0.97);

        // Update position
        ball.x += ball.vx;
        ball.y += ball.vy;

        return speed > this.minSpeed || Math.abs(ball.spin.x) > 0.01 || Math.abs(ball.spin.y) > 0.01;
    }

    handleWallCollision(ball, tableLeft, tableTop, tableWidth, tableHeight) {
        const tableRight = tableLeft + tableWidth;
        const tableBottom = tableTop + tableHeight;
        let bounced = false;

        if (ball.x - ball.radius <= tableLeft) {
            ball.x = tableLeft + ball.radius;
            ball.vx = -ball.vx * this.wallBounce;
            bounced = true;
        } else if (ball.x + ball.radius >= tableRight) {
            ball.x = tableRight - ball.radius;
            ball.vx = -ball.vx * this.wallBounce;
            bounced = true;
        }

        if (ball.y - ball.radius <= tableTop) {
            ball.y = tableTop + ball.radius;
            ball.vy = -ball.vy * this.wallBounce;
            bounced = true;
        } else if (ball.y + ball.radius >= tableBottom) {
            ball.y = tableBottom - ball.radius;
            ball.vy = -ball.vy * this.wallBounce;
            bounced = true;
        }

        if (bounced) {
            console.log('🏓 WALL BOUNCE:', ball.id, 'bounced');
        }

        return bounced;
    }

    handleBallCollision(ball1, ball2) {
        const dx = ball2.x - ball1.x;
        const dy = ball2.y - ball1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < ball1.radius + ball2.radius) {
            // Normalize collision vector
            const nx = dx / distance;
            const ny = dy / distance;

            // Separate balls
            const overlap = ball1.radius + ball2.radius - distance;
            ball1.x -= nx * overlap * 0.5;
            ball1.y -= ny * overlap * 0.5;
            ball2.x += nx * overlap * 0.5;
            ball2.y += ny * overlap * 0.5;

            // Calculate relative velocity
            const dvx = ball2.vx - ball1.vx;
            const dvy = ball2.vy - ball1.vy;

            // Calculate relative velocity in collision normal direction
            const dvn = dvx * nx + dvy * ny;

            // Do not resolve if velocities are separating
            if (dvn > 0) return false;

            // Calculate restitution
            const e = this.ballBounce;

            // Calculate impulse scalar
            const j = -(1 + e) * dvn / 2;

            // Apply impulse
            ball1.vx -= j * nx;
            ball1.vy -= j * ny;
            ball2.vx += j * nx;
            ball2.vy += j * ny;

            return true;
        }

        return false;
    }

    applySpin(ball, spinX, spinY) {
        ball.spin.x = spinX;
        ball.spin.y = spinY;
        
        // Log spin application for debugging
        if (Math.abs(spinX) > 0.1 || Math.abs(spinY) > 0.1) {
            console.log('🌀 Spin applied:', { spinX: spinX.toFixed(2), spinY: spinY.toFixed(2) });
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhysicsEngine;
}
