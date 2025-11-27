/**
 * Pin Class
 * Represents an input or output connection point on a component.
 */
import { isPointInRect } from '../utils/math.js';

export class Pin {
    constructor(component, type, index = 0, label = '') {
        this.component = component;
        this.type = type; // 'input' or 'output'
        this.index = index;
        this.label = label;
        this.id = crypto.randomUUID();

        this.value = 0; // 0 or 1
        this.connections = []; // Array of Wires

        // Relative position to component
        this.relX = 0;
        this.relY = 0;
        this.radius = 8; // Increased from 5 for better hit detection

        this.isHovered = false;
    }

    get x() {
        return this.component.x + this.relX;
    }

    get y() {
        return this.component.y + this.relY;
    }

    render(ctx) {
        const x = this.x;
        const y = this.y;

        ctx.beginPath();
        ctx.arc(x, y, this.radius, 0, Math.PI * 2);

        // Fill color based on state and hover
        if (this.value === 1) {
            ctx.fillStyle = '#00f3ff'; // High
            ctx.shadowColor = '#00f3ff';
            ctx.shadowBlur = 5;
        } else {
            ctx.fillStyle = this.isHovered ? '#ffffff' : '#555555'; // Low / Hover
            ctx.shadowBlur = 0;
        }

        if (this.isHovered) {
            ctx.strokeStyle = '#00f3ff';
            ctx.lineWidth = 2;
        } else {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
        }

        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow
    }

    isHit(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return (dx * dx + dy * dy) <= (this.radius * this.radius * 4); // Larger hit area (approx 16px radius)
    }
}
