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
    isPointInside(x, y) { }

    // Common helpers
    getCenter() {
        return { x: this.x, y: this.y };
    }
}
