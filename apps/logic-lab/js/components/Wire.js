/**
 * Wire Class
 * Connects an Output Pin to an Input Pin.
 */
export class Wire {
    constructor(startPin, endPin) {
        this.id = crypto.randomUUID();
        this.startPin = startPin;
        this.endPin = endPin;
        this.state = 0;
        this.isSelected = false;
    }

    render(ctx) {
        const x1 = this.startPin.x;
        const y1 = this.startPin.y;

        // If endPin is null, we are dragging the wire
        const x2 = this.endPin ? this.endPin.x : this.tempX;
        const y2 = this.endPin ? this.endPin.y : this.tempY;

        ctx.save();

        // Determine color
        let color = this.state ? '#00f3ff' : '#555555';
        if (this.isSelected) color = '#ffea00'; // Selection color

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        if (this.state) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 5;
        }

        // Bézier Curve
        ctx.beginPath();
        ctx.moveTo(x1, y1);

        // Control points for smooth curve
        const cp1x = x1 + (x2 - x1) / 2;
        const cp1y = y1;
        const cp2x = x2 - (x2 - x1) / 2;
        const cp2y = y2;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
        ctx.stroke();

        ctx.restore();
    }

    isHit(x, y) {
        if (!this.endPin) return false;

        // Approximate hit detection for Bezier curve
        // We check distance to 10 points along the curve
        const x1 = this.startPin.x;
        const y1 = this.startPin.y;
        const x2 = this.endPin.x;
        const y2 = this.endPin.y;

        const cp1x = x1 + (x2 - x1) / 2;
        const cp1y = y1;
        const cp2x = x2 - (x2 - x1) / 2;
        const cp2y = y2;

        const steps = 10;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const cx = Math.pow(1 - t, 3) * x1 +
                3 * Math.pow(1 - t, 2) * t * cp1x +
                3 * (1 - t) * Math.pow(t, 2) * cp2x +
                Math.pow(t, 3) * x2;
            const cy = Math.pow(1 - t, 3) * y1 +
                3 * Math.pow(1 - t, 2) * t * cp1y +
                3 * (1 - t) * Math.pow(t, 2) * cp2y +
                Math.pow(t, 3) * y2;

            const dist = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
            if (dist < 5) return true; // Hit threshold
        }
        return false;
    }

    updateLogic() {
        if (this.startPin && this.endPin) {
            this.state = this.startPin.value;
            this.endPin.value = this.state;
        }
    }
}
