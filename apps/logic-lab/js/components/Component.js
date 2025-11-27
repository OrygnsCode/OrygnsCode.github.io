/**
 * Base Component Class
 */
import { isPointInRect } from '../utils/math.js';

export class Component {
    constructor(x, y, type) {
        this.id = crypto.randomUUID();
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 60;
        this.height = 40;
        this.inputs = [];  // Array of Pin objects
        this.outputs = []; // Array of Pin objects
        this.isSelected = false;
        this.isDragging = false;
        this.label = type;
    }

    render(ctx) {
        // Base render method - should be overridden or extended
        ctx.save();

        // Body
        ctx.fillStyle = this.isSelected ? '#3a3a45' : '#1a1a20';
        ctx.strokeStyle = this.isSelected ? '#00f3ff' : '#2a2a2a';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 4);
        ctx.fill();
        ctx.stroke();

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        // Draw label at the top inside the box, or maybe just above?
        // Let's draw it at the top inside.
        ctx.fillText(this.label, this.x + this.width / 2, this.y + 5);

        // Render Pins
        this.inputs.forEach(pin => pin.render(ctx));
        this.outputs.forEach(pin => pin.render(ctx));

        ctx.restore();
    }

    isHit(x, y) {
        return isPointInRect(x, y, this.x, this.y, this.width, this.height);
    }

    updateLogic() {
        // To be implemented by subclasses
    }
}
