import { Component, CircuitNode } from './Component.js';

export class Battery extends Component {
    constructor(x, y) {
        super(x, y, 'Battery');
        this.properties = { voltage: 9.0, internalResistance: 0.0 };
        // Create two nodes relative to center
        this.nodes = [
            new CircuitNode(x - 40, y),
            new CircuitNode(x + 40, y)
        ];
        this.width = 80;
        this.height = 30;
    }

    updateNodePositions() {
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);

        // Node 0 (Negative terminal)
        this.nodes[0].x = this.x - 40 * cos;
        this.nodes[0].y = this.y - 40 * sin;

        // Node 1 (Positive terminal)
        this.nodes[1].x = this.x + 40 * cos;
        this.nodes[1].y = this.y + 40 * sin;
    }

    // Uses base class isPointInside for rotation support

    draw(ctx, theme) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const color = theme === 'cyberpunk' ? '#00ff9d' : '#333';
        const plateColor = theme === 'cyberpunk' ? '#ff0055' : '#444';

        // Draw Battery Symbol
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        // Wires to terminals
        ctx.beginPath();
        ctx.moveTo(-40, 0);
        ctx.lineTo(-10, 0);
        ctx.moveTo(40, 0);
        ctx.lineTo(10, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();

        // Terminals
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-40, 0, 3, 0, Math.PI * 2);
        ctx.arc(40, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // Battery plates
        ctx.beginPath();
        ctx.moveTo(-10, -15);
        ctx.lineTo(-10, 15);

        // Body
        ctx.fillStyle = plateColor;
        ctx.fillRect(-30, -15, 60, 30);

        // Positive bump
        ctx.fillStyle = '#aaa';
        ctx.fillRect(30, -8, 5, 16);

        // Positive bump
        ctx.fillStyle = '#aaa';
        ctx.fillRect(30, -8, 5, 16);

        ctx.restore();
    }
}

export class Resistor extends Component {
    constructor(x, y) {
        super(x, y, 'Resistor');
        this.properties = { resistance: 10.0 };
        this.nodes = [
            new CircuitNode(x - 40, y),
            new CircuitNode(x + 40, y)
        ];
        this.width = 80;
        this.height = 20;
    }

    updateNodePositions() {
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        this.nodes[0].x = this.x - 40 * cos;
        this.nodes[0].y = this.y - 40 * sin;
        this.nodes[1].x = this.x + 40 * cos;
        this.nodes[1].y = this.y + 40 * sin;
    }

    // Uses base class isPointInside

    draw(ctx, theme) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const color = theme === 'cyberpunk' ? '#00ff9d' : '#333';
        const labelColor = theme === 'cyberpunk' ? '#00ff9d' : '#000';

        // Draw Resistor ZigZag
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-40, 0);
        ctx.lineTo(-20, 0);

        // Zigzag
        ctx.lineTo(-15, -10);
        ctx.lineTo(-5, 10);
        ctx.lineTo(5, -10);
        ctx.lineTo(15, 10);
        ctx.lineTo(20, 0);

        ctx.lineTo(40, 0);
        ctx.stroke();

        ctx.lineTo(40, 0);
        ctx.stroke();

        // Terminals
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(-40, 0, 3, 0, Math.PI * 2);
        ctx.arc(40, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class LightBulb extends Component {
    constructor(x, y) {
        super(x, y, 'LightBulb');
        this.properties = { resistance: 10.0, power: 0 };
        this.nodes = [
            new CircuitNode(x - 40, y),
            new CircuitNode(x + 40, y)
        ];
        this.width = 80;
        this.height = 50;
    }

    updateNodePositions() {
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        this.nodes[0].x = this.x - 40 * cos;
        this.nodes[0].y = this.y - 40 * sin;
        this.nodes[1].x = this.x + 40 * cos;
        this.nodes[1].y = this.y + 40 * sin;
    }

    // Uses base class isPointInside

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Glow effect based on power
        const brightness = Math.min(this.properties.power * 10, 50); // Scale factor
        if (brightness > 0) {
            ctx.shadowBlur = brightness;
            ctx.shadowColor = 'yellow';
        }

        // Bulb glass
        ctx.fillStyle = `rgba(255, 255, ${255 - brightness * 2}, 0.8)`;
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, -10, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Filament
        ctx.beginPath();
        ctx.moveTo(-5, -5);
        ctx.lineTo(0, -15);
        ctx.lineTo(5, -5);
        ctx.stroke();

        // Base
        ctx.fillStyle = '#888';
        ctx.fillRect(-8, 2, 16, 10);

        // Wires
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-40, 0);
        ctx.lineTo(-8, 5); // Connect to base
        ctx.moveTo(40, 0);
        ctx.lineTo(8, 5);
        ctx.stroke();

        // Terminals
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-40, 0, 3, 0, Math.PI * 2);
        ctx.arc(40, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class Switch extends Component {
    constructor(x, y) {
        super(x, y, 'Switch');
        this.properties = { isOpen: false };
        this.nodes = [
            new CircuitNode(x - 40, y),
            new CircuitNode(x + 40, y)
        ];
        this.width = 80;
        this.height = 30;
    }

    updateNodePositions() {
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        this.nodes[0].x = this.x - 40 * cos;
        this.nodes[0].y = this.y - 40 * sin;
        this.nodes[1].x = this.x + 40 * cos;
        this.nodes[1].y = this.y + 40 * sin;
    }

    // Uses base class isPointInside

    toggle() {
        this.properties.isOpen = !this.properties.isOpen;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;

        // Left wire
        ctx.beginPath();
        ctx.moveTo(-40, 0);
        ctx.lineTo(-10, 0);
        ctx.stroke();

        // Right wire
        ctx.beginPath();
        ctx.moveTo(40, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();

        // Terminals
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-40, 0, 3, 0, Math.PI * 2);
        ctx.arc(40, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // Switch arm
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        if (this.properties.isOpen) {
            ctx.lineTo(10, -15);
        } else {
            ctx.lineTo(10, 0);
        }
        ctx.stroke();

        // Contact points
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-10, 0, 2, 0, Math.PI * 2);
        ctx.arc(10, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class Wire extends Component {
    constructor(node1, node2) {
        super(0, 0, 'Wire');
        this.nodes = [node1, node2];
        this.properties = { resistivity: 0.01, current: 0 };
    }

    isPointInside(x, y) {
        // Distance from point to line segment
        const x1 = this.nodes[0].x;
        const y1 = this.nodes[0].y;
        const x2 = this.nodes[1].x;
        const y2 = this.nodes[1].y;

        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        if (len_sq !== 0) // in case of 0 length line
            param = dot / len_sq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        }
        else if (param > 1) {
            xx = x2;
            yy = y2;
        }
        else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy) < 20; // Increased threshold from 10px to 20px for easier selection
    }

    draw(ctx, theme) {
        const x1 = this.nodes[0].x;
        const y1 = this.nodes[0].y;
        const x2 = this.nodes[1].x;
        const y2 = this.nodes[1].y;

        ctx.strokeStyle = theme === 'cyberpunk' ? '#00ff9d' : '#b87333'; // Neon or Copper
        if (theme === 'cyberpunk') {
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#00ff9d';
        } else {
            ctx.shadowBlur = 0;
        }

        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.shadowBlur = 0; // Reset
    }
}

export class Voltmeter extends Component {
    constructor(x, y) {
        super(x, y, 'Voltmeter');
        this.properties = { resistance: 10000000, voltageDrop: 0 }; // High resistance
        this.nodes = [
            new CircuitNode(x - 40, y + 40),
            new CircuitNode(x + 40, y + 40)
        ];
        this.width = 100;
        this.height = 80;
    }

    updateNodePositions() {
        // Voltmeter nodes are probes, they usually move independently in a real sim.
        // But for this simple implementation, let's keep them attached to the body 
        // or let them be dragged if we implement independent probe dragging.
        // For now, rigid body.
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);

        this.nodes[0].x = this.x - 40 * cos;
        this.nodes[0].y = this.y + 40 * sin; // Below

        this.nodes[1].x = this.x + 40 * cos;
        this.nodes[1].y = this.y + 40 * sin;
    }

    // Uses base class isPointInside

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Body
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(-40, -40, 80, 60);

        // Screen
        ctx.fillStyle = '#fff';
        ctx.fillRect(-30, -30, 60, 30);

        // Probes (wires sticking out)
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;

        // Negative Probe (Black)
        ctx.beginPath();
        ctx.moveTo(-20, 20);
        ctx.lineTo(-40, 40);
        ctx.stroke();

        // Positive Probe (Red)
        ctx.beginPath();
        ctx.moveTo(20, 20);
        ctx.lineTo(40, 40);
        ctx.stroke();

        // Terminals
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-40, 40, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(40, 40, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class Ammeter extends Component {
    constructor(x, y) {
        super(x, y, 'Ammeter');
        this.properties = { resistance: 0.001, current: 0 }; // Low resistance
        this.nodes = [
            new CircuitNode(x - 40, y),
            new CircuitNode(x + 40, y)
        ];
        this.width = 80;
        this.height = 80;
    }

    updateNodePositions() {
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        this.nodes[0].x = this.x - 40 * cos;
        this.nodes[0].y = this.y - 40 * sin;
        this.nodes[1].x = this.x + 40 * cos;
        this.nodes[1].y = this.y + 40 * sin;
    }

    // Uses base class isPointInside

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Body
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-30, -30, 60, 60);

        // Screen
        ctx.fillStyle = '#fff';
        ctx.fillRect(-25, -10, 50, 20);

        // Wires
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-40, 0);
        ctx.lineTo(-30, 0);
        ctx.moveTo(40, 0);
        ctx.lineTo(30, 0);
        ctx.stroke();

        // Terminals
        ctx.fillStyle = '#000'; // Black (Common)
        ctx.beginPath();
        ctx.arc(-40, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e74c3c'; // Red (Input)
        ctx.beginPath();
        ctx.arc(40, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
