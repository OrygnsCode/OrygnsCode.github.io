import { Battery, Resistor, LightBulb, Switch, Wire, Voltmeter, Ammeter } from './components/BasicComponents.js';
import { CircuitNode } from './components/Component.js';

export class Interaction {
    constructor(canvas, circuit, renderer, onSelect, commandManager) {
        this.canvas = canvas;
        this.circuit = circuit;
        this.renderer = renderer;
        this.onSelect = onSelect;
        this.commandManager = commandManager;

        this.isDragging = false;
        this.dragTarget = null; // Component or Node
        this.dragOffset = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
        this.clickStartPos = { x: 0, y: 0 };

        this.hoverTarget = null; // For visual feedback
        this.snapTarget = null; // For magnetic snapping feedback

        // Multi-Selection
        this.selectedComponents = [];
        this.isBoxSelecting = false;
        this.boxSelectStart = { x: 0, y: 0 };
        this.boxSelectEnd = { x: 0, y: 0 };

        this.setupEvents();
        this.setupPaletteEvents();
    }

    setupEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        // this.canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e)); // No longer needed with window listener
        this.canvas.addEventListener('dblclick', (e) => this.onDoubleClick(e));
    }

    setupPaletteEvents() {
        // New "Spawn on Drag" system
        const paletteItems = document.querySelectorAll('.component-item');
        paletteItems.forEach(item => {
            item.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Prevent text selection
                const type = item.dataset.type;
                this.spawnComponent(type, e);
            });
        });
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    spawnComponent(type, e) {
        this.commandManager.pushState(); // Save state before spawn

        const pos = this.getMousePos(e);
        let newComponent;

        switch (type) {
            case 'Battery': newComponent = new Battery(pos.x, pos.y); break;
            case 'Resistor': newComponent = new Resistor(pos.x, pos.y); break;
            case 'LightBulb': newComponent = new LightBulb(pos.x, pos.y); break;
            case 'Switch': newComponent = new Switch(pos.x, pos.y); break;
            case 'Voltmeter': newComponent = new Voltmeter(pos.x, pos.y); break;
            case 'Ammeter': newComponent = new Ammeter(pos.x, pos.y); break;
            case 'Wire':
                // Wires spawn as a small segment to be dragged
                const n1 = new CircuitNode(pos.x - 30, pos.y);
                const n2 = new CircuitNode(pos.x + 30, pos.y);
                newComponent = new Wire(n1, n2);
                break;
        }

        if (newComponent) {
            this.circuit.addComponent(newComponent);
            if (type === 'Wire') {
                this.circuit.addWire(newComponent);
            }

            // Select the new component
            this.selectedComponents = [newComponent];
            if (this.onSelect) this.onSelect(newComponent);

            // Immediately start dragging it
            this.isDragging = true;
            this.dragTarget = newComponent;
            this.dragOffset = { x: 0, y: 0 }; // Center on mouse
            this.lastMousePos = pos;

            // Force a render update
            this.renderer.render();
        }
    }

    onMouseDown(e) {
        const pos = this.getMousePos(e);
        this.lastMousePos = pos;
        this.clickStartPos = pos;

        // Hit Test Priority: Nodes > Components > Wires
        // Increased hit threshold for better UX
        const hitThreshold = 30;

        // 1. Check Nodes
        const node = this.circuit.findNodeAt(pos.x, pos.y, hitThreshold);
        if (node) {
            // WIRE DRAWING MODE (Shift + Drag)
            if (e.shiftKey) {
                this.commandManager.pushState();
                // Create a new Wire starting from this node
                const endNode = new CircuitNode(pos.x, pos.y);
                const newWire = new Wire(node, endNode);
                this.circuit.addWire(newWire);

                // Drag the end node
                this.isDragging = true;
                this.dragTarget = endNode;
                this.dragOffset = { x: 0, y: 0 };
                this.renderer.render();
                return;
            }

            // Check if this node belongs to a "rigid" component (not a Wire)
            const parentComponent = this.circuit.components.find(c => c.nodes.includes(node) && c.type !== 'Wire');

            if (parentComponent) {
                // If it belongs to a component, drag the component instead
                this.commandManager.pushState();
                this.isDragging = true;
                this.dragTarget = parentComponent;
                this.dragOffset = { x: pos.x - parentComponent.x, y: pos.y - parentComponent.y };

                // Handle Selection
                if (!this.selectedComponents.includes(parentComponent)) {
                    if (e.ctrlKey || e.metaKey) {
                        this.selectedComponents.push(parentComponent);
                    } else {
                        this.selectedComponents = [parentComponent];
                    }
                }
                if (this.onSelect) this.onSelect(parentComponent);

            } else {
                // It's a free node or wire node, drag it freely
                this.commandManager.pushState();
                this.isDragging = true;
                this.dragTarget = node;
            }
            return;
        }

        // 2. Check Components
        const component = this.circuit.findComponentAt(pos.x, pos.y);
        if (component) {
            this.commandManager.pushState();
            this.isDragging = true;
            this.dragTarget = component;
            if (component.type === 'Wire') {
                // For wires, drag the whole wire if clicked in middle
                this.dragOffset = { x: pos.x - component.nodes[0].x, y: pos.y - component.nodes[0].y };
            } else {
                this.dragOffset = { x: pos.x - component.x, y: pos.y - component.y };
            }

            // Handle Selection
            if (!this.selectedComponents.includes(component)) {
                if (e.ctrlKey || e.metaKey) {
                    this.selectedComponents.push(component);
                } else {
                    this.selectedComponents = [component];
                }
            }
            if (this.onSelect) this.onSelect(component);
            return;
        }

        // 3. Box Selection (Empty Space)
        if (!e.shiftKey) { // Shift+Drag on empty space could be pan, but let's stick to box select
            this.isBoxSelecting = true;
            this.boxSelectStart = pos;
            this.boxSelectEnd = pos;

            if (!e.ctrlKey && !e.metaKey) {
                this.selectedComponents = [];
                if (this.onSelect) this.onSelect(null);
            }
        }
    }

    onMouseMove(e) {
        const pos = this.getMousePos(e);

        if (this.isBoxSelecting) {
            this.boxSelectEnd = pos;
            this.renderer.setSelectionBox(this.boxSelectStart, this.boxSelectEnd);
            this.renderer.render();
            return;
        }

        // Hover Feedback
        if (!this.isDragging) {
            const hitThreshold = 30;
            const node = this.circuit.findNodeAt(pos.x, pos.y, hitThreshold);
            const component = this.circuit.findComponentAt(pos.x, pos.y);

            this.hoverTarget = node || component;
            this.renderer.setHoverTarget(this.hoverTarget);

            // Change cursor
            this.canvas.style.cursor = this.hoverTarget ? 'pointer' : 'default';
        }

        if (this.isDragging && this.dragTarget) {
            const dx = pos.x - this.lastMousePos.x;
            const dy = pos.y - this.lastMousePos.y;

            if (this.dragTarget instanceof CircuitNode) {
                // Move Node
                this.dragTarget.x = pos.x;
                this.dragTarget.y = pos.y;

                // Magnetic Snapping Preview
                this.snapTarget = null;
                const snapThreshold = 30; // Large snap radius
                for (const otherNode of this.circuit.nodes) {
                    if (otherNode !== this.dragTarget && !this.areNodesRelated(this.dragTarget, otherNode)) {
                        // Check for Rigid-to-Rigid connection
                        // If dragTarget is part of a rigid component (not Wire), 
                        // and otherNode is ALSO part of a rigid component (not Wire),
                        // PREVENT SNAP.
                        const isDragRigid = this.isNodeRigid(this.dragTarget);
                        const isTargetRigid = this.isNodeRigid(otherNode);

                        if (isDragRigid && isTargetRigid) {
                            continue; // Skip snap
                        }

                        const dist = Math.sqrt(Math.pow(pos.x - otherNode.x, 2) + Math.pow(pos.y - otherNode.y, 2));
                        if (dist < snapThreshold) {
                            this.snapTarget = otherNode;
                            // Visually snap the node to the target
                            this.dragTarget.x = otherNode.x;
                            this.dragTarget.y = otherNode.y;
                            break;
                        }
                    }
                }
                this.renderer.setSnapTarget(this.snapTarget);

            } else {
                // Move Component(s)
                // If dragging a selected component, move ALL selected components
                if (this.selectedComponents.includes(this.dragTarget)) {
                    this.selectedComponents.forEach(comp => {
                        if (comp.type === 'Wire') {
                            comp.nodes[0].x += dx; comp.nodes[0].y += dy;
                            comp.nodes[1].x += dx; comp.nodes[1].y += dy;
                        } else {
                            comp.x += dx;
                            comp.y += dy;
                            comp.updateNodePositions();
                        }
                    });
                } else {
                    // Dragging unselected component (should have been selected in mousedown, but fallback)
                    if (this.dragTarget.type === 'Wire') {
                        this.dragTarget.nodes[0].x += dx;
                        this.dragTarget.nodes[0].y += dy;
                        this.dragTarget.nodes[1].x += dx;
                        this.dragTarget.nodes[1].y += dy;
                    } else {
                        this.dragTarget.x += dx;
                        this.dragTarget.y += dy;
                        this.dragTarget.updateNodePositions();
                    }
                }
            }
            this.renderer.render();
        }

        this.lastMousePos = pos;
    }

    onMouseUp(e) {
        const pos = this.getMousePos(e);
        const dist = Math.sqrt(Math.pow(pos.x - this.clickStartPos.x, 2) + Math.pow(pos.y - this.clickStartPos.y, 2));

        if (this.isBoxSelecting) {
            this.isBoxSelecting = false;
            this.selectInBox(this.boxSelectStart, this.boxSelectEnd);
            this.renderer.setSelectionBox(null, null);
            this.renderer.render();
            return;
        }

        if (this.isDragging && this.dragTarget) {
            // Finalize Snap
            if (this.dragTarget instanceof CircuitNode && this.snapTarget) {
                this.mergeNodes(this.dragTarget, this.snapTarget);
                this.snapTarget = null;
                this.renderer.setSnapTarget(null);
            }
        }

        // Selection Logic (Click without drag)
        if (dist < 15 && !this.snapTarget && !this.isDragging) { // Increased threshold from 5 to 15 for easier clicking
            // If we clicked a node, maybe select the component it belongs to?
            // Or just select component if clicked body.
            const component = this.circuit.findComponentAt(pos.x, pos.y);

            // Interactive Switch Toggle
            if (component && component.type === 'Switch') {
                this.commandManager.pushState();
                component.toggle();
                this.renderer.render();
                // Don't select if we just toggled? Or select anyway?
                // Let's select anyway so we can edit properties if needed.
            }

            // Selection logic handled in mousedown mostly, but if we just clicked without drag:
            // If Ctrl click, toggle selection.
            // If normal click, select only this.
            // Already handled in mousedown? Yes.
        }

        this.isDragging = false;
        this.dragTarget = null;
        this.snapTarget = null;
        this.renderer.setSnapTarget(null);
    }

    selectInBox(start, end) {
        const x1 = Math.min(start.x, end.x);
        const x2 = Math.max(start.x, end.x);
        const y1 = Math.min(start.y, end.y);
        const y2 = Math.max(start.y, end.y);

        this.circuit.components.forEach(comp => {
            // Simple AABB check for component's center point
            if (comp.x >= x1 && comp.x <= x2 && comp.y >= y1 && comp.y <= y2) {
                if (!this.selectedComponents.includes(comp)) {
                    this.selectedComponents.push(comp);
                }
            }
        });

        // Notify main about the primary selection (last one?)
        if (this.selectedComponents.length > 0 && this.onSelect) {
            this.onSelect(this.selectedComponents[this.selectedComponents.length - 1]);
        } else if (this.onSelect) {
            this.onSelect(null);
        }
    }

    onDoubleClick(e) {
        const pos = this.getMousePos(e);
        const hitThreshold = 20;

        // 1. Check Nodes (Split)
        const node = this.circuit.findNodeAt(pos.x, pos.y, hitThreshold);
        if (node) {
            this.commandManager.pushState();
            this.splitNode(node);
            return;
        }

        // 2. Check Components (Rotate)
        const component = this.circuit.findComponentAt(pos.x, pos.y);
        if (component) {
            this.commandManager.pushState();
            // Rotate 90 degrees
            component.rotation += Math.PI / 2;
            component.updateNodePositions();
            this.renderer.render();
        }
    }

    splitNode(node) {
        // Find all components/wires connected to this node
        const connectedComponents = this.circuit.components.filter(c => c.nodes.includes(node));
        const connectedWires = this.circuit.wires.filter(w => w.nodes.includes(node));

        // If only 1 thing connected, nothing to split
        const totalConnections = connectedComponents.length + connectedWires.length;
        if (totalConnections <= 1) return;

        // We will keep the original node for the first item found, 
        // and create new nodes for everyone else.

        // Remove node from circuit (we'll re-add valid ones)
        // Actually, let's just create new nodes for everything EXCEPT the first one.

        let firstItem = true;

        // Handle Components
        connectedComponents.forEach(comp => {
            if (firstItem) {
                firstItem = false;
                return; // Keep original connection
            }
            // Create new node
            const newNode = new CircuitNode(node.x + Math.random() * 20 - 10, node.y + Math.random() * 20 - 10);
            this.circuit.nodes.push(newNode);

            // Update component to use new node
            const idx = comp.nodes.indexOf(node);
            if (idx !== -1) comp.nodes[idx] = newNode;
        });

        // Handle Wires
        connectedWires.forEach(wire => {
            if (firstItem) {
                firstItem = false;
                return;
            }
            // Create new node
            const newNode = new CircuitNode(node.x + Math.random() * 20 - 10, node.y + Math.random() * 20 - 10);
            this.circuit.nodes.push(newNode);

            // Update wire
            if (wire.nodes[0] === node) wire.nodes[0] = newNode;
            else if (wire.nodes[1] === node) wire.nodes[1] = newNode;
        });

        this.renderer.render();
    }

    areNodesRelated(node1, node2) {
        // Check if nodes belong to the same component (don't snap a battery to itself)
        // This requires back-reference or searching.
        // Simple check: do they share a component?
        for (const comp of this.circuit.components) {
            if (comp.nodes.includes(node1) && comp.nodes.includes(node2)) return true;
        }
        return false;
    }

    isNodeRigid(node) {
        // Returns true if node belongs to a component that is NOT a Wire
        return this.circuit.components.some(c => c.nodes.includes(node) && c.type !== 'Wire');
    }

    mergeNodes(nodeToKeep, nodeToRemove) {
        // Replace all references of nodeToRemove with nodeToKeep

        // 1. Wires
        this.circuit.wires.forEach(wire => {
            if (wire.nodes[0] === nodeToRemove) wire.nodes[0] = nodeToKeep;
            if (wire.nodes[1] === nodeToRemove) wire.nodes[1] = nodeToKeep;
        });

        // 2. Components
        this.circuit.components.forEach(comp => {
            if (comp.nodes) {
                for (let i = 0; i < comp.nodes.length; i++) {
                    if (comp.nodes[i] === nodeToRemove) {
                        comp.nodes[i] = nodeToKeep;
                    }
                }
            }
        });

        // 3. Remove from circuit.nodes
        const index = this.circuit.nodes.indexOf(nodeToRemove);
        if (index > -1) {
            this.circuit.nodes.splice(index, 1);
        }
    }
}
