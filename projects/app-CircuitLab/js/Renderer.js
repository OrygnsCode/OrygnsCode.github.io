export class Renderer {
    constructor(canvas, circuit) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.circuit = circuit;
        this.showCurrent = true;
        this.currentType = 'electrons'; // 'electrons' or 'conventional'
        this.showValues = true;
        this.showLabels = false;
        this.theme = 'cyberpunk';

        this.hoverTarget = null;
        this.snapTarget = null;
        this.selectionBox = null;

        this.animationOffset = 0;
    }

    setHoverTarget(target) {
        this.hoverTarget = target;
    }

    setSnapTarget(target) {
        this.snapTarget = target;
    }

    setSelectionBox(start, end) {
        this.selectionBox = { start, end };
    }

    resize() {
        // Handled by main.js, but good to have a hook here
    }

    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Draw Grid (Optional, faint)
        this.drawGrid(ctx, width, height);

        // Draw Wires first
        this.circuit.wires.forEach(wire => {
            if (wire.isShortCircuit) {
                ctx.save();
                ctx.shadowBlur = 15;
                ctx.shadowColor = 'red';
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 5;
                wire.draw(ctx, this.theme);
                ctx.stroke();
                ctx.restore();
            } else {
                wire.draw(ctx, this.theme);
            }
        });

        // Draw Components
        this.circuit.components.forEach(comp => comp.draw(ctx, this.theme));

        // Draw Nodes
        this.drawNodes(ctx);

        // Draw Hover/Snap Feedback
        this.drawFeedback(ctx);

        // Draw Selection Box
        if (this.selectionBox && this.selectionBox.start && this.selectionBox.end) {
            const x = Math.min(this.selectionBox.start.x, this.selectionBox.end.x);
            const y = Math.min(this.selectionBox.start.y, this.selectionBox.end.y);
            const w = Math.abs(this.selectionBox.end.x - this.selectionBox.start.x);
            const h = Math.abs(this.selectionBox.end.y - this.selectionBox.start.y);

            ctx.save();
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 1;
            ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);
            ctx.restore();
        }

        // Draw Current Animation
        if (this.showCurrent) {
            this.drawCurrentAnimation(ctx);
        }

        // Update animation offset
        this.animationOffset = (this.animationOffset + 1) % 20;
    }

    drawGrid(ctx, width, height) {
        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 1;
        const gridSize = 40;

        ctx.beginPath();
        for (let x = 0; x < width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let y = 0; y < height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();
    }

    drawNodes(ctx) {
        // Count connections per node
        const connectionCount = new Map();

        // Count from Components
        this.circuit.components.forEach(c => {
            c.nodes.forEach(n => {
                connectionCount.set(n, (connectionCount.get(n) || 0) + 1);
            });
        });

        // Count from Wires
        this.circuit.wires.forEach(w => {
            w.nodes.forEach(n => {
                connectionCount.set(n, (connectionCount.get(n) || 0) + 1);
            });
        });

        this.circuit.nodes.forEach(node => {
            const count = connectionCount.get(node) || 0;

            // Draw Junction Dot if 3+ connections
            if (count >= 3) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = this.theme === 'cyberpunk' ? '#00ff9d' : '#000';
                ctx.fill();
            }
        });
    }

    drawCurrentAnimation(ctx) {
        // Iterate over wires and components to draw moving dots
        // For simplicity, let's just do wires for now
        this.circuit.wires.forEach(wire => {
            const current = wire.properties.current || 0;
            if (Math.abs(current) < 0.001) return;

            const x1 = wire.nodes[0].x;
            const y1 = wire.nodes[0].y;
            const x2 = wire.nodes[1].x;
            const y2 = wire.nodes[1].y;

            const dx = x2 - x1;
            const dy = y2 - y1;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Speed proportional to current
            const speed = Math.min(Math.abs(current) * 2, 5);
            const direction = current > 0 ? 1 : -1;
            // If electrons, flow is opposite to conventional current
            const flowDir = this.currentType === 'electrons' ? -direction : direction;

            const numDots = Math.floor(dist / 20);

            ctx.fillStyle = this.currentType === 'electrons' ? '#3498db' : '#e74c3c';

            for (let i = 0; i < numDots; i++) {
                // Calculate position based on time
                let t = (i / numDots) + (this.animationOffset * speed * flowDir / 1000);
                t = t - Math.floor(t); // Wrap around 0-1

                const px = x1 + dx * t;
                const py = y1 + dy * t;

                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    drawFeedback(ctx) {
        // Hover Highlight
        if (this.hoverTarget) {
            ctx.save();
            ctx.strokeStyle = 'rgba(52, 152, 219, 0.5)';
            ctx.lineWidth = 2;

            if (this.hoverTarget.type) { // Component
                // Simple box highlight
                const w = this.hoverTarget.width || 40;
                const h = this.hoverTarget.height || 40;
                ctx.translate(this.hoverTarget.x, this.hoverTarget.y);
                ctx.rotate(this.hoverTarget.rotation || 0);
                ctx.strokeRect(-w / 2 - 5, -h / 2 - 5, w + 10, h + 10);
            } else { // Node
                ctx.beginPath();
                ctx.arc(this.hoverTarget.x, this.hoverTarget.y, 10, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Snap Highlight
        if (this.snapTarget) {
            ctx.beginPath();
            ctx.arc(this.snapTarget.x, this.snapTarget.y, 12, 0, Math.PI * 2);
            ctx.strokeStyle = '#2ecc71'; // Green snap
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        this.drawLabelsAndValues(ctx);
    }

    drawLabelsAndValues(ctx) {
        if (!this.showValues && !this.showLabels) return;

        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        this.circuit.components.forEach(comp => {
            ctx.save();
            ctx.translate(comp.x, comp.y);
            ctx.rotate(comp.rotation);

            const textColor = this.theme === 'cyberpunk' ? '#00ff9d' : '#333';
            ctx.fillStyle = textColor;

            if (this.showValues) {
                let text = '';
                if (comp.type === 'Battery') text = comp.properties.voltage + 'V';
                if (comp.type === 'Resistor') text = comp.properties.resistance + 'Ω';
                if (comp.type === 'Voltmeter') text = (comp.properties.voltageDrop || 0).toFixed(2) + 'V';
                if (comp.type === 'Ammeter') text = (comp.properties.current || 0).toFixed(2) + 'A';

                if (text) {
                    let yOffset = 0;
                    if (comp.type === 'Resistor') yOffset = -20;
                    if (comp.type === 'Voltmeter') yOffset = -10;
                    if (comp.type === 'Ammeter') yOffset = 5;

                    ctx.fillText(text, 0, yOffset);
                }
            }

            if (this.showLabels) {
                ctx.fillStyle = this.theme === 'cyberpunk' ? '#ff0055' : '#888';
                ctx.fillText(comp.type, 0, 25);
            }

            ctx.restore();
        });
    }
}
