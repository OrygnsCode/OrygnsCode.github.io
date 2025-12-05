export class CircuitNode {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.connections = []; // List of components connected to this node
        this.voltage = 0; // Calculated voltage
        this.isFixed = false; // If true, voltage is fixed (e.g. ground)
        this.id = Math.random().toString(36).substr(2, 9);
    }
}

export class Component {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.rotation = 0;
        this.nodes = []; // [node1, node2] usually
        this.properties = {}; // e.g. resistance, voltage
        this.id = Math.random().toString(36).substr(2, 9);
    }

    // Abstract methods
    draw(ctx) { }
    isPointInside(x, y) {
        if (!this.width || !this.height) return false;

        // Translate point to local coordinate system relative to center
        const dx = x - this.x;
        const dy = y - this.y;

        // Rotate point by -rotation to align with axis-aligned box
        const cos = Math.cos(-this.rotation);
        const sin = Math.sin(-this.rotation);

        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;

        // Check axis-aligned box
        return Math.abs(localX) < this.width / 2 && Math.abs(localY) < this.height / 2;
    }

    // Common helpers
    getCenter() {
        return { x: this.x, y: this.y };
    }
}
