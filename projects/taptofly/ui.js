/**
 * UI Manager
 * Handles all UI rendering and game over screen
 */
class UIManager {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.groundHeight = 112;
    }

    drawBackground(ctx) {
        // Sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight - this.groundHeight);
        gradient.addColorStop(0, '#70c5ce');
        gradient.addColorStop(1, '#5db8c2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight - this.groundHeight);

        // Simple clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.drawCloud(ctx, 50, 80, 40);
        this.drawCloud(ctx, 200, 120, 35);
        this.drawCloud(ctx, 320, 60, 45);
    }

    drawCloud(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.5, y, size * 0.6, 0, Math.PI * 2);
        ctx.arc(x + size, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawGround(ctx, scrollOffset) {
        const groundY = this.canvasHeight - this.groundHeight;

        // Ground base
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(0, groundY, this.canvasWidth, this.groundHeight);

        // Grass layer
        ctx.fillStyle = '#8BC34A';
        ctx.fillRect(0, groundY, this.canvasWidth, 16);

        // Ground pattern (scrolling)
        ctx.fillStyle = '#CD853F';
        const patternWidth = 30;
        for (let x = -scrollOffset % patternWidth; x < this.canvasWidth; x += patternWidth) {
            ctx.fillRect(x, groundY + 20, 15, 8);
            ctx.fillRect(x + 8, groundY + 35, 10, 6);
        }
    }

    drawScore(ctx, score) {
        // Score shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.font = 'bold 48px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(score.toString(), this.canvasWidth / 2 + 3, 53);

        // Score outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 6;
        ctx.strokeText(score.toString(), this.canvasWidth / 2, 50);

        // Score fill
        ctx.fillStyle = '#FFF';
        ctx.fillText(score.toString(), this.canvasWidth / 2, 50);
    }

    drawReadyScreen(ctx) {
        // Title with shadow
        const titleY = 180;

        // Title shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.font = 'bold 56px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TapToFly', this.canvasWidth / 2 + 4, titleY + 4);

        // Title
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#FF8C00';
        ctx.lineWidth = 5;
        ctx.strokeText('TapToFly', this.canvasWidth / 2, titleY);
        ctx.fillText('TapToFly', this.canvasWidth / 2, titleY);

        // Subtitle
        ctx.fillStyle = '#FFF';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.font = 'bold 16px "Press Start 2P", monospace';
        ctx.strokeText('Flappy Bird Clone', this.canvasWidth / 2, titleY + 60);
        ctx.fillText('Flappy Bird Clone', this.canvasWidth / 2, titleY + 60);

        // Instructions box
        const boxY = 320;
        const boxWidth = 360;
        const boxHeight = 180;
        const boxX = (this.canvasWidth - boxWidth) / 2;

        // Box background with border
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeStyle = '#FF8C00';
        ctx.lineWidth = 4;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Instructions text
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px "Press Start 2P", monospace';
        ctx.textAlign = 'center';

        const instructions = [
            'Desktop: SPACE or CLICK',
            'Mobile: TAP to FLAP',
            '',
            'Avoid the pipes!'
        ];

        instructions.forEach((text, i) => {
            if (text) {
                ctx.fillText(text, this.canvasWidth / 2, boxY + 40 + i * 35);
            }
        });

        // Pulsing "Tap to Start" prompt
        const alpha = 0.4 + Math.sin(Date.now() / 400) * 0.6;
        const promptY = boxY + boxHeight + 50;

        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.strokeStyle = `rgba(255, 140, 0, ${alpha})`;
        ctx.lineWidth = 4;
        ctx.font = 'bold 20px "Press Start 2P", monospace';
        ctx.strokeText('▶ TAP TO START ◀', this.canvasWidth / 2, promptY);
        ctx.fillText('▶ TAP TO START ◀', this.canvasWidth / 2, promptY);
    }

    drawGameOver(ctx, score, bestScore) {
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Game Over panel - perfectly centered
        const panelWidth = 400;
        const panelHeight = 400;
        const panelX = (this.canvasWidth - panelWidth) / 2;
        const panelY = 140;

        // Panel background with gradient
        const gradient = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
        gradient.addColorStop(0, '#FFFAF0');
        gradient.addColorStop(1, '#FFF8DC');
        ctx.fillStyle = gradient;
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

        // Panel border
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 8;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Inner border
        ctx.strokeStyle = '#CD853F';
        ctx.lineWidth = 3;
        ctx.strokeRect(panelX + 10, panelY + 10, panelWidth - 20, panelHeight - 20);

        // Title "GAME OVER" - perfectly centered
        ctx.fillStyle = '#C62828';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 5;
        ctx.font = 'bold 38px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const titleY = panelY + 50;
        ctx.strokeText('GAME OVER', this.canvasWidth / 2, titleY);
        ctx.fillText('GAME OVER', this.canvasWidth / 2, titleY);

        // Divider line
        ctx.strokeStyle = '#CD853F';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(panelX + 30, panelY + 85);
        ctx.lineTo(panelX + panelWidth - 30, panelY + 85);
        ctx.stroke();

        // Score cards section - side by side, perfectly aligned
        const cardsY = panelY + 110;
        const cardWidth = 170;
        const cardHeight = 130;
        const cardGap = 20;
        const totalCardsWidth = cardWidth * 2 + cardGap;
        const cardsStartX = (this.canvasWidth - totalCardsWidth) / 2;

        // YOUR SCORE card (left)
        const scoreCardX = cardsStartX;
        const scoreCardY = cardsY;

        ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
        ctx.fillRect(scoreCardX, scoreCardY, cardWidth, cardHeight);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(scoreCardX, scoreCardY, cardWidth, cardHeight);

        // Score label
        ctx.fillStyle = '#666';
        ctx.font = 'bold 11px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('YOUR SCORE', scoreCardX + cardWidth / 2, scoreCardY + 15);

        // Score value
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#FF8C00';
        ctx.lineWidth = 4;
        ctx.font = 'bold 52px "Press Start 2P", monospace';
        ctx.textBaseline = 'middle';
        ctx.strokeText(score.toString(), scoreCardX + cardWidth / 2, scoreCardY + 75);
        ctx.fillText(score.toString(), scoreCardX + cardWidth / 2, scoreCardY + 75);

        // BEST SCORE card (right)
        const bestCardX = scoreCardX + cardWidth + cardGap;
        const bestCardY = scoreCardY;

        // Check if new best
        const isNewBest = score >= bestScore && score > 0;

        // Card styling based on new best
        if (isNewBest) {
            ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
            ctx.strokeStyle = '#4CAF50';
        } else {
            ctx.fillStyle = 'rgba(192, 192, 192, 0.15)';
            ctx.strokeStyle = '#999';
        }
        ctx.lineWidth = 3;
        ctx.fillRect(bestCardX, bestCardY, cardWidth, cardHeight);
        ctx.strokeRect(bestCardX, bestCardY, cardWidth, cardHeight);

        // Best label
        ctx.font = 'bold 11px "Press Start 2P", monospace';
        ctx.textBaseline = 'top';
        if (isNewBest) {
            ctx.fillStyle = '#4CAF50';
            ctx.fillText('★ NEW BEST ★', bestCardX + cardWidth / 2, bestCardY + 15);
        } else {
            ctx.fillStyle = '#666';
            ctx.fillText('BEST SCORE', bestCardX + cardWidth / 2, bestCardY + 15);
        }

        // Best value
        if (isNewBest) {
            ctx.fillStyle = '#4CAF50';
            ctx.strokeStyle = '#2E7D32';
        } else {
            ctx.fillStyle = '#888';
            ctx.strokeStyle = '#666';
        }
        ctx.lineWidth = 4;
        ctx.font = 'bold 52px "Press Start 2P", monospace';
        ctx.textBaseline = 'middle';
        ctx.strokeText(bestScore.toString(), bestCardX + cardWidth / 2, bestCardY + 75);
        ctx.fillText(bestScore.toString(), bestCardX + cardWidth / 2, bestCardY + 75);

        // Play Again button - centered at bottom
        const buttonY = panelY + panelHeight - 65;
        const buttonWidth = 300;
        const buttonHeight = 50;
        const buttonX = (this.canvasWidth - buttonWidth) / 2;

        // Button animation
        const pulseScale = 1 + Math.sin(Date.now() / 350) * 0.025;
        ctx.save();
        ctx.translate(this.canvasWidth / 2, buttonY + buttonHeight / 2);
        ctx.scale(pulseScale, pulseScale);
        ctx.translate(-this.canvasWidth / 2, -(buttonY + buttonHeight / 2));

        // Button gradient
        const btnGradient = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight);
        btnGradient.addColorStop(0, '#66BB6A');
        btnGradient.addColorStop(1, '#43A047');
        ctx.fillStyle = btnGradient;
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

        // Button shadow and border
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 4;
        ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Button text
        ctx.fillStyle = '#FFF';
        ctx.strokeStyle = '#1B5E20';
        ctx.lineWidth = 2;
        ctx.font = 'bold 18px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText('▶ PLAY AGAIN', this.canvasWidth / 2, buttonY + buttonHeight / 2);
        ctx.fillText('▶ PLAY AGAIN', this.canvasWidth / 2, buttonY + buttonHeight / 2);

        ctx.restore();
    }

    getMedal(score) {
        if (score >= 40) return { name: 'PLAT', color: '#E5E4E2' };
        if (score >= 30) return { name: 'GOLD', color: '#FFD700' };
        if (score >= 20) return { name: 'SILVER', color: '#C0C0C0' };
        if (score >= 10) return { name: 'BRONZE', color: '#CD7F32' };
        return null;
    }
}
