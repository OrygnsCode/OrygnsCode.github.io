export class Circuit {
    constructor() {
        this.nodes = [];
        this.components = [];
        this.wires = [];
    }

    addComponent(component) {
        this.components.push(component);
        // Register component's nodes
        component.nodes.forEach(node => {
            if (!this.nodes.includes(node)) {
                this.nodes.push(node);
            }
        });
    }

    removeComponent(component) {
        const index = this.components.indexOf(component);
        if (index > -1) {
            this.components.splice(index, 1);
        }
        this.cleanupNodes();
    }

    addWire(wire) {
        this.wires.push(wire);
        wire.nodes.forEach(node => {
            if (!this.nodes.includes(node)) {
                this.nodes.push(node);
            }
        });
    }

    removeWire(wire) {
        const index = this.wires.indexOf(wire);
        if (index > -1) {
            this.wires.splice(index, 1);
        }
        this.cleanupNodes();
    }

    cleanupNodes() {
        // Remove nodes that are not used by any component or wire
        const usedNodes = new Set();

        this.components.forEach(c => {
            c.nodes.forEach(n => usedNodes.add(n));
        });

        this.wires.forEach(w => {
            w.nodes.forEach(n => usedNodes.add(n));
        });

        this.nodes = this.nodes.filter(n => usedNodes.has(n));
    }

    clear() {
        this.nodes = [];
        this.components = [];
        this.wires = [];
    }

    // Helper to find a node at a position
    findNodeAt(x, y, threshold = 10) {
        return this.nodes.find(node => {
            const dx = node.x - x;
            const dy = node.y - y;
            return Math.sqrt(dx * dx + dy * dy) < threshold;
        });
    }

    findComponentAt(x, y) {
        // Simple bounding box check for now
        // Assuming components have width/height or we check distance to center
        // Most components are drawn around 0,0 relative to their x,y
        // Let's assume a standard size of 40x40 for hit testing
        const size = 40;
        return this.components.find(c => {
            if (c.isPointInside) {
                return c.isPointInside(x, y);
            }
            // Fallback for components without isPointInside (shouldn't happen given current codebase)
            return x >= c.x - size / 2 && x <= c.x + size / 2 &&
                y >= c.y - size / 2 && y <= c.y + size / 2;
        });
    }

    // Helper to find a component at a position
    toJSON() {
        // Serialize components and wires
        // We need to preserve connections.
        // Strategy: Assign IDs to nodes, save components with node IDs.

        // 1. Assign IDs to all nodes if not present (they have random IDs from constructor)

        const data = {
            components: this.components.map(c => ({
                type: c.type,
                x: c.x,
                y: c.y,
                rotation: c.rotation,
                properties: c.properties,
                nodeIds: c.nodes.map(n => n.id)
            })),
            wires: this.wires.map(w => ({
                node1Id: w.nodes[0].id,
                node2Id: w.nodes[1].id,
                properties: w.properties
            })),
            // We also need to save node positions for wires? 
            // Wires connect nodes. If a node is shared, it has one position.
            // We should save a list of Nodes with their positions and IDs.
            nodes: this.nodes.map(n => ({
                id: n.id,
                x: n.x,
                y: n.y,
                isFixed: n.isFixed
            }))
        };
        return JSON.stringify(data);
    }

    static fromJSON(json, targetCircuit = null) {
        const data = JSON.parse(json);
        const circuit = targetCircuit || new Circuit();

        if (targetCircuit) {
            circuit.clear();
        }

        // Recreate nodes
        const nodeMap = new Map();
        data.nodes.forEach(nData => {
            // We need to use the constructor from the App context or import it.
            // Since this is a static method, we might not have access to imports if they are not top-level.
            // But CircuitNode is imported at top of this file.
            const node = new CircuitNode(nData.x, nData.y);
            node.id = nData.id;
            node.isFixed = nData.isFixed;
            circuit.nodes.push(node);
            nodeMap.set(node.id, node);
        });

        // Recreate components
        // We need to reconstruct the specific component types.
        // Since we can't easily import all types here without circular deps or massive imports,
        // we rely on the fact that we can reconstruct them if we know the type.
        // Ideally, we should have a ComponentFactory.
        // For now, let's assume the caller handles component reconstruction if they use the raw data,
        // BUT for Undo/Redo we need this to work.
        // Let's use a simple mapping if we can, or rely on `main.js` to handle the heavy lifting.
        // Actually, `main.js`'s `loadCircuit` does this logic. 
        // Let's move the reconstruction logic to `Circuit` or a helper, OR make `CommandManager` use `app.loadCircuit`.

        // BETTER APPROACH for Undo/Redo:
        // CommandManager should callback to App to reload state, OR Circuit needs to know about Component types.
        // Let's return the data and let the caller handle it?
        // No, `fromJSON` implies it returns a Circuit.

        // Let's just return the data object here and let CommandManager/App handle the reconstruction
        // because Circuit.js doesn't import Battery, Resistor etc.
        return data;
    }
}

