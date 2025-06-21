
class BilliardsRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.effects = {
            shadows: true,
            reflections: true,
            particles: true
        };

        this.particles = [];
        this.setupGradients();
        console.log('🎨 Graphics renderer initialized');
    }

    setupGradients() {
        // Table felt gradient
        this.tableGradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width / 2
        );
        this.tableGradient.addColorStop(0, '#2d5016');
        this.tableGradient.addColorStop(1, '#1a3009');

        // Ball highlight gradient
        this.ballHighlight = this.ctx.createRadialGradient(-3, -3, 0, 0, 0, 12);
        this.ballHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        this.ballHighlight.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)');
        this.ballHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    }

    drawEnhancedTable(tableLeft, tableTop, tableWidth, tableHeight) {
        // Draw wood frame with gradient
        const frameGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        frameGradient.addColorStop(0, '#8B4513');
        frameGradient.addColorStop(0.5, '#A0522D');
        frameGradient.addColorStop(1, '#654321');

        this.ctx.fillStyle = frameGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw rails with 3D effect
        this.ctx.strokeStyle = '#DAA520';
        this.ctx.lineWidth = 8;
        this.ctx.strokeRect(tableLeft - 4, tableTop - 4, tableWidth + 8, tableHeight + 8);

        // Draw inner rail shadow
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(tableLeft - 2, tableTop - 2, tableWidth + 4, tableHeight + 4);

        // Draw felt surface
        this.ctx.fillStyle = this.tableGradient;
        this.ctx.fillRect(tableLeft, tableTop, tableWidth, tableHeight);

        // Draw center spot
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(tableLeft + tableWidth * 0.7, this.canvas.height / 2, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw head string (break line)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(tableLeft + tableWidth * 0.25, tableTop + 10);
        this.ctx.lineTo(tableLeft + tableWidth * 0.25, tableTop + tableHeight - 10);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawEnhancedPockets(pockets, pocketRadius) {
        for (let pocket of pockets) {
            // Draw pocket depth shadow
            const pocketGradient = this.ctx.createRadialGradient(
                pocket.x, pocket.y, 0,
                pocket.x, pocket.y, pocketRadius
            );
            pocketGradient.addColorStop(0, '#000000');
            pocketGradient.addColorStop(0.8, '#1a1a1a');
            pocketGradient.addColorStop(1, '#333333');

            this.ctx.fillStyle = pocketGradient;
            this.ctx.beginPath();
            this.ctx.arc(pocket.x, pocket.y, pocketRadius, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw pocket rim
            this.ctx.strokeStyle = '#DAA520';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(pocket.x, pocket.y, pocketRadius - 2, 0, Math.PI * 2);
            this.ctx.stroke();

            // Draw inner rim highlight
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(pocket.x, pocket.y, pocketRadius - 4, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    drawProfessionalBall(ball, showNumbers = true) {
        if (ball.sunk) return;

        this.ctx.save();
        this.ctx.translate(ball.x, ball.y);

        // Draw ball shadow
        if (this.effects.shadows) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(2, 2, ball.radius - 1, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Draw ball base
        this.ctx.fillStyle = ball.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw ball outline
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Draw stripe for stripe balls
        if (ball.type === 'stripe' && ball.number > 8) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(-ball.radius, -4, ball.radius * 2, 8);
        }

        // Draw highlight
        this.ctx.fillStyle = this.ballHighlight;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw number for numbered balls
        if (showNumbers && ball.number > 0) {
            // White circle for number background
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw number
            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(ball.number.toString(), 0, 0);
        }

        this.ctx.restore();
    }

    drawAdvancedAimLine(cueBall, aimAngle, power) {
        if (!cueBall || cueBall.sunk) return;

        const lineLength = 150 + (power * 2);
        const endX = cueBall.x + Math.cos(aimAngle) * lineLength;
        const endY = cueBall.y + Math.sin(aimAngle) * lineLength;

        // Draw aim line with fade effect
        const gradient = this.ctx.createLinearGradient(cueBall.x, cueBall.y, endX, endY);
        gradient.addColorStop(0, `rgba(255, 255, 0, 0.8)`);
        gradient.addColorStop(0.7, `rgba(255, 255, 0, 0.4)`);
        gradient.addColorStop(1, `rgba(255, 255, 0, 0)`);

        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(cueBall.x, cueBall.y);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawProfessionalCueStick(cueBall, aimAngle, power) {
        if (!cueBall || cueBall.sunk) return;

        const cueLength = 200;
        const cueDistance = 30 + (power * 0.3);

        const startX = cueBall.x - Math.cos(aimAngle) * cueDistance;
        const startY = cueBall.y - Math.sin(aimAngle) * cueDistance;
        const endX = startX - Math.cos(aimAngle) * cueLength;
        const endY = startY - Math.sin(aimAngle) * cueLength;

        // Draw cue stick
        const gradient = this.ctx.createLinearGradient(startX, startY, endX, endY);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.8, '#D2691E');
        gradient.addColorStop(1, '#CD853F');

        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 8;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();

        // Draw cue tip
        this.ctx.fillStyle = '#2F4F4F';
        this.ctx.beginPath();
        this.ctx.arc(startX, startY, 4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    createSinkParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1,
                decay: 0.02,
                color: `hsl(${Math.random() * 60 + 15}, 70%, 60%)`,
                size: Math.random() * 3 + 1
            });
        }
    }

    updateAndDrawParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];

            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            particle.vx *= 0.98;
            particle.vy *= 0.98;

            if (particle.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BilliardsRenderer;
}
