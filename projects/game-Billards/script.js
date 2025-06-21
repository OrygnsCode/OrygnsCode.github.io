
// Ball class for better object management
class Ball {
    constructor(x, y, radius, color, number = 0, type = 'solid') {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = radius;
        this.color = color;
        this.number = number;
        this.type = type;
        this.sunk = false;
        this.id = type === 'cue' ? 'cue-ball' : `ball-${number}`;
        this.spin = { x: 0, y: 0 };
    }

    getSpeed() {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    }

    stop() {
        this.vx = 0;
        this.vy = 0;
        this.spin.x = 0;
        this.spin.y = 0;
    }

    setVelocity(vx, vy) {
        this.vx = vx;
        this.vy = vy;
    }
}

// Enhanced Billiards Game with Improved Physics and Audio
class BilliardsGame {
    constructor() {
        console.log('🎱 Starting Professional Billiards...');

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        if (!this.canvas || !this.ctx) {
            console.error('Canvas not found!');
            return;
        }

        // Mobile detection
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Initialize all systems
        this.physics = new PhysicsEngine();
        this.renderer = new BilliardsRenderer(this.canvas, this.ctx);
        this.audio = new BilliardsAudio();

        this.setupCanvas();
        this.setupGame();
        this.setupEventListeners();
        this.checkMobileOrientation();
        this.gameLoop();
    }

    setupCanvas() {
        this.canvas.width = 1000;
        this.canvas.height = 600;

        this.tableMargin = 50;
        this.tableWidth = this.canvas.width - (this.tableMargin * 2);
        this.tableHeight = this.canvas.height - (this.tableMargin * 2);
        this.tableLeft = this.tableMargin;
        this.tableTop = this.tableMargin;

        this.ballRadius = 12;
        this.pocketRadius = 25;

        console.log('✅ Canvas setup complete');
    }

    setupGame() {
        this.balls = [];
        this.pockets = [];
        this.gameState = {
            isAnimating: false,
            isAiming: false,
            isPowerCharging: false,
            power: 0,
            aimAngle: 0,
            score: 0,
            ballsRemaining: 15,
            shotNumber: 1,
            spin: 0
        };
        this.mouse = { x: 0, y: 0 };
        this.lastTime = 0;
        this.powerChargeStart = 0;

        this.setupPockets();
        this.createBalls();
        this.updateUI();

        console.log('✅ Game setup complete');
    }

    setupPockets() {
        const margin = this.tableMargin;
        const inset = 15;

        this.pockets = [
            { x: margin + inset, y: margin + inset, type: 'corner' },
            { x: this.canvas.width - margin - inset, y: margin + inset, type: 'corner' },
            { x: margin + inset, y: this.canvas.height - margin - inset, type: 'corner' },
            { x: this.canvas.width - margin - inset, y: this.canvas.height - margin - inset, type: 'corner' },
            { x: this.canvas.width / 2, y: margin, type: 'side' },
            { x: this.canvas.width / 2, y: this.canvas.height - margin, type: 'side' }
        ];
    }

    createBalls() {
        this.balls = [];

        // Create cue ball
        const cueBallX = this.tableLeft + this.tableWidth * 0.25;
        const cueBallY = this.canvas.height / 2;
        this.cueBall = new Ball(cueBallX, cueBallY, this.ballRadius, '#ffffff', 0, 'cue');
        this.balls.push(this.cueBall);

        // Create numbered balls in rack formation
        const rackX = this.tableLeft + this.tableWidth * 0.75;
        const rackY = this.canvas.height / 2;
        const spacing = this.ballRadius * 2.1;

        const ballConfigs = [
            { color: '#ffff00', number: 1, type: 'solid' },   // Yellow
            { color: '#0000ff', number: 2, type: 'solid' },   // Blue
            { color: '#ff0000', number: 3, type: 'solid' },   // Red
            { color: '#800080', number: 4, type: 'solid' },   // Purple
            { color: '#ff8000', number: 5, type: 'solid' },   // Orange
            { color: '#008000', number: 6, type: 'solid' },   // Green
            { color: '#800000', number: 7, type: 'solid' },   // Maroon
            { color: '#000000', number: 8, type: 'eight' },   // Eight ball
            { color: '#ffff00', number: 9, type: 'stripe' },  // Yellow stripe
            { color: '#0000ff', number: 10, type: 'stripe' }, // Blue stripe
            { color: '#ff0000', number: 11, type: 'stripe' }, // Red stripe
            { color: '#800080', number: 12, type: 'stripe' }, // Purple stripe
            { color: '#ff8000', number: 13, type: 'stripe' }, // Orange stripe
            { color: '#008000', number: 14, type: 'stripe' }, // Green stripe
            { color: '#800000', number: 15, type: 'stripe' }  // Maroon stripe
        ];

        let ballIndex = 0;
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col <= row; col++) {
                if (ballIndex < 15) {
                    const ballX = rackX + row * spacing * 0.866;
                    const ballY = rackY + (col - row / 2) * spacing;

                    const config = ballConfigs[ballIndex];
                    const ball = new Ball(ballX, ballY, this.ballRadius, config.color, config.number, config.type);
                    this.balls.push(ball);
                    ballIndex++;
                }
            }
        }

        console.log('✅ Created', this.balls.length, 'balls (including cue ball)');
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));

        // Touch events with passive: false for better control
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        this.canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });

        // Button events
        const newGameBtn = document.getElementById('newGameBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        const spinControl = document.getElementById('spinControl');

        if (newGameBtn) newGameBtn.addEventListener('click', () => this.newGame());
        if (settingsBtn) settingsBtn.addEventListener('click', () => this.showSettings());

        // Spin control - mobile version
        if (spinControl) {
            spinControl.addEventListener('input', (e) => {
                this.gameState.spin = parseFloat(e.target.value);
                const indicator = document.getElementById('spinIndicator');
                const desktopControl = document.getElementById('spinControlDesktop');
                const desktopIndicator = document.getElementById('spinIndicatorDesktop');
                
                if (indicator) indicator.textContent = this.gameState.spin.toFixed(1);
                if (desktopControl) desktopControl.value = e.target.value;
                if (desktopIndicator) desktopIndicator.textContent = this.gameState.spin.toFixed(1);
            });
        }
        
        // Spin control - desktop version
        const spinControlDesktop = document.getElementById('spinControlDesktop');
        if (spinControlDesktop) {
            spinControlDesktop.addEventListener('input', (e) => {
                this.gameState.spin = parseFloat(e.target.value);
                const indicator = document.getElementById('spinIndicatorDesktop');
                const mobileControl = document.getElementById('spinControl');
                const mobileIndicator = document.getElementById('spinIndicator');
                
                if (indicator) indicator.textContent = this.gameState.spin.toFixed(1);
                if (mobileControl) mobileControl.value = e.target.value;
                if (mobileIndicator) mobileIndicator.textContent = this.gameState.spin.toFixed(1);
            });
        }

        // Settings modal
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', () => this.saveSettings());

        // Orientation change listener for mobile
        if (this.isMobile) {
            window.addEventListener('orientationchange', () => {
                setTimeout(() => this.checkMobileOrientation(), 100);
            });
            window.addEventListener('resize', () => this.checkMobileOrientation());
        }
    }

    checkMobileOrientation() {
        if (!this.isMobile) return;

        const orientationNotice = document.getElementById('orientationNotice');
        
        if (window.innerHeight > window.innerWidth) {
            // Portrait mode - show notice
            if (!orientationNotice) {
                this.createOrientationNotice();
            } else {
                orientationNotice.style.display = 'flex';
            }
        } else {
            // Landscape mode - hide notice
            if (orientationNotice) {
                orientationNotice.style.display = 'none';
            }
        }
    }

    createOrientationNotice() {
        const notice = document.createElement('div');
        notice.id = 'orientationNotice';
        notice.className = 'orientation-notice';
        notice.innerHTML = `
            <div class="orientation-content">
                <div class="orientation-icon">📱➡️📱</div>
                <h2>Rotate Your Device</h2>
                <p>For the best billiards experience, please rotate your device to landscape mode.</p>
            </div>
        `;
        document.body.appendChild(notice);
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    handleMouseDown(e) {
        if (this.gameState.isAnimating) return;

        this.mouse = this.getMousePos(e);

        if (this.isNearCueBall()) {
            this.gameState.isAiming = true;
            this.gameState.isPowerCharging = true;
            this.powerChargeStart = Date.now();
            this.audio.resumeAudio();
        }
    }

    handleMouseMove(e) {
        this.mouse = this.getMousePos(e);

        if (this.gameState.isAiming) {
            this.updateAimAngle();
        }
    }

    handleMouseUp(e) {
        if (this.gameState.isPowerCharging) {
            this.shoot();
        }
        this.gameState.isAiming = false;
        this.gameState.isPowerCharging = false;
    }

    handleTouchStart(e) {
        e.preventDefault();
        e.stopPropagation();
        const touch = e.touches[0];
        
        // Get more precise touch coordinates
        const rect = this.canvas.getBoundingClientRect();
        const touchEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            preventDefault: () => {}
        };
        
        this.handleMouseDown(touchEvent);
    }

    handleTouchMove(e) {
        e.preventDefault();
        e.stopPropagation();
        const touch = e.touches[0];
        
        const touchEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            preventDefault: () => {}
        };
        
        this.handleMouseMove(touchEvent);
    }

    handleTouchEnd(e) {
        e.preventDefault();
        e.stopPropagation();
        this.handleMouseUp(e);
    }

    isNearCueBall() {
        if (!this.cueBall || this.cueBall.sunk) return false;

        const dx = this.mouse.x - this.cueBall.x;
        const dy = this.mouse.y - this.cueBall.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Larger touch area for mobile devices
        const touchRadius = this.isMobile ? this.ballRadius * 8 : this.ballRadius * 6;
        return distance < touchRadius;
    }

    updateAimAngle() {
        if (!this.cueBall || this.cueBall.sunk) return;

        const dx = this.mouse.x - this.cueBall.x;
        const dy = this.mouse.y - this.cueBall.y;
        this.gameState.aimAngle = Math.atan2(dy, dx);
    }

    shoot() {
        if (this.gameState.power < 3) return; // Lower minimum power threshold

        // More realistic power scaling
        const maxVelocity = 30; // Increased for better realistic feel
        const powerMultiplier = Math.pow(this.gameState.power / 100, 0.7); // Better power curve
        const velocity = powerMultiplier * maxVelocity;

        const vx = Math.cos(this.gameState.aimAngle) * velocity;
        const vy = Math.sin(this.gameState.aimAngle) * velocity;

        this.cueBall.setVelocity(vx, vy);

        // Enhanced spin mechanics
        if (Math.abs(this.gameState.spin) > 0.1) {
            // Apply spin to velocity for immediate effect
            const spinEffect = this.gameState.spin * 0.15;
            const perpX = -Math.sin(this.gameState.aimAngle) * spinEffect;
            const perpY = Math.cos(this.gameState.aimAngle) * spinEffect;
            
            this.cueBall.vx += perpX;
            this.cueBall.vy += perpY;
            
            // Set spin for ongoing effects
            this.physics.applySpin(this.cueBall, this.gameState.spin * 0.4, this.gameState.spin * 0.3);
        }

        this.gameState.isAnimating = true;
        this.gameState.shotNumber++;

        // Play shot sound
        this.audio.playCueStrikeSound(this.gameState.power);

        // Reset states
        this.gameState.power = 0;
        this.gameState.isAiming = false;
        this.gameState.isPowerCharging = false;

        console.log('🚀 Shot fired:', { 
            vx: vx.toFixed(2), 
            vy: vy.toFixed(2), 
            power: this.gameState.power,
            velocity: velocity.toFixed(2),
            spin: this.gameState.spin
        });
    }

    gameLoop(currentTime = 0) {
        const deltaTime = Math.min(currentTime - this.lastTime, 16.67);
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        // Update power charging
        if (this.gameState.isPowerCharging) {
            const elapsed = (Date.now() - this.powerChargeStart) / 1000;
            // Smooth power curve that only increases to 100%
            this.gameState.power = Math.min(elapsed * 40, 100);
            this.updatePowerMeter();
        }

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        if (!this.gameState.isAnimating) return;

        let anyMoving = false;

        // Update all balls
        for (let ball of this.balls) {
            if (this.physics.updateBall(ball, deltaTime * 0.016)) {
                anyMoving = true;
            }
        }

        // Check collisions
        this.checkWallCollisions();
        this.checkBallCollisions();
        this.checkPocketCollisions();

        // Stop animation when all balls stop
        if (!anyMoving) {
            this.gameState.isAnimating = false;
            console.log('🎱 PHYSICS: All balls stopped, ending animation');
        }
    }

    checkWallCollisions() {
        for (let ball of this.balls) {
            if (ball.sunk) continue;

            const bounced = this.physics.handleWallCollision(
                ball, this.tableLeft, this.tableTop, this.tableWidth, this.tableHeight
            );

            if (bounced) {
                this.audio.playWallBounceSound(ball.getSpeed());
            }
        }
    }

    checkBallCollisions() {
        for (let i = 0; i < this.balls.length; i++) {
            for (let j = i + 1; j < this.balls.length; j++) {
                const ball1 = this.balls[i];
                const ball2 = this.balls[j];

                if (ball1.sunk || ball2.sunk) continue;

                const collided = this.physics.handleBallCollision(ball1, ball2);

                if (collided) {
                    const avgSpeed = (ball1.getSpeed() + ball2.getSpeed()) / 2;
                    this.audio.playCollisionSound(avgSpeed);
                    console.log('💥 COLLISION:', ball1.id, 'vs', ball2.id);
                }
            }
        }
    }

    checkPocketCollisions() {
        for (let ball of this.balls) {
            if (ball.sunk) continue;

            for (let pocket of this.pockets) {
                const dx = ball.x - pocket.x;
                const dy = ball.y - pocket.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.pocketRadius) {
                    this.sinkBall(ball, pocket);
                    break;
                }
            }
        }
    }

    sinkBall(ball, pocket) {
        ball.sunk = true;
        this.audio.playSound('ballSink');
        
        if (this.renderer.createSinkParticles) {
            this.renderer.createSinkParticles(pocket.x, pocket.y);
        }

        if (ball.type === 'cue') {
            this.gameState.score = Math.max(0, this.gameState.score - 50);
            // Reset cue ball position after a delay
            setTimeout(() => {
                ball.x = this.tableLeft + this.tableWidth * 0.25;
                ball.y = this.canvas.height / 2;
                ball.stop();
                ball.sunk = false;
                console.log('🎱 Cue ball reset');
            }, 1500);
        } else {
            this.gameState.ballsRemaining--;
            let points = ball.number === 8 ? 100 : (ball.type === 'stripe' ? 20 : 15);
            this.gameState.score += points;
            console.log(`🎯 Ball ${ball.number} sunk! +${points} points`);
        }

        this.updateUI();
        
        // Check for game completion
        if (this.gameState.ballsRemaining === 0) {
            console.log('🎉 Game Complete! All balls sunk!');
            setTimeout(() => {
                alert('Congratulations! You won with a score of ' + this.gameState.score + '!');
                this.newGame();
            }, 1000);
        }
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw table
        this.renderer.drawEnhancedTable(this.tableLeft, this.tableTop, this.tableWidth, this.tableHeight);
        this.renderer.drawEnhancedPockets(this.pockets, this.pocketRadius);

        // Draw balls
        for (let ball of this.balls) {
            this.renderer.drawProfessionalBall(ball, true);
        }

        // Draw aiming aids
        if (this.gameState.isAiming && !this.gameState.isAnimating) {
            this.renderer.drawAdvancedAimLine(this.cueBall, this.gameState.aimAngle, this.gameState.power);
            this.renderer.drawProfessionalCueStick(this.cueBall, this.gameState.aimAngle, this.gameState.power);
        }

        // Update particles
        this.renderer.updateAndDrawParticles();
    }

    updatePowerMeter() {
        const powerFill = document.getElementById('powerFill');
        const powerIndicator = document.getElementById('powerIndicator');

        if (powerFill) {
            powerFill.style.height = `${this.gameState.power}%`;
        }
        if (powerIndicator) {
            powerIndicator.style.bottom = `${this.gameState.power}%`;
        }
    }

    updateUI() {
        const scoreEl = document.getElementById('score');
        const ballsRemainingEl = document.getElementById('balls-remaining');
        const shotNumberEl = document.getElementById('shotNumber');

        if (scoreEl) scoreEl.textContent = this.gameState.score;
        if (ballsRemainingEl) ballsRemainingEl.textContent = this.gameState.ballsRemaining;
        if (shotNumberEl) shotNumberEl.textContent = this.gameState.shotNumber;
    }

    newGame() {
        console.log('🔄 Starting new game...');
        this.setupGame();
    }

    showSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) modal.classList.add('show');
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) modal.classList.remove('show');
    }

    saveSettings() {
        // Handle settings save
        this.closeSettings();
    }
}

// Utility functions
function closeToast() {
    const toast = document.getElementById('instructionsToast');
    if (toast) {
        toast.classList.remove('show');
        toast.classList.remove('auto-show');
        toast.classList.add('hide');
        
        // Ensure toast is completely hidden on mobile
        setTimeout(() => {
            toast.style.display = 'none';
        }, 300);
    }
}

// Global function to close toast
window.closeToast = closeToast;

// Auto-hide toast after 8 seconds (longer for mobile users)
setTimeout(() => {
    closeToast();
}, 8000);

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Initializing Professional Billiards Game...');
    try {
        new BilliardsGame();
    } catch (error) {
        console.error('❌ Failed to initialize game:', error);
    }
});
