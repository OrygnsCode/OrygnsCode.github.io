/**
 * Circuit Engine
 * Manages the simulation loop and global state.
 */
import { CanvasManager } from './CanvasManager.js';
import { ANDGate, ORGate, NOTGate, NANDGate, NORGate, XORGate } from '../components/Gate.js';
import { Switch, Button, Clock } from '../components/Input.js';
import { Lightbulb, SevenSegment, HexDisplay } from '../components/Output.js';
import { SRFlipFlop, DFlipFlop, JKFlipFlop } from '../components/FlipFlop.js';
import { Wire } from '../components/Wire.js';
import { snapToGrid, dist } from '../utils/math.js';

export class CircuitEngine {
    constructor() {
        this.canvasManager = new CanvasManager('logic-canvas');
        this.components = [];
        this.wires = [];
        this.isRunning = true;

        this.lastTime = 0;

        // Interaction State
        this.dragComponent = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;

        this.wiringStartPin = null;
        this.tempWire = null;

        this.ghostComponent = null; // For placement

        this.onSelectionChanged = null; // Callback for UI

        // Simulation History
        this.history = [];
        this.maxHistory = 200;
        this.recordingEnabled = false;

        this.snapEnabled = true;

        // Undo/Redo Stacks
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 50;
        this.clipboard = null;

        this.bindEvents();
        this.startLoop();
    }

    saveState() {
        // Serialize current state
        const state = JSON.stringify({
            components: this.components.map(c => ({
                type: c.type,
                x: c.x,
                y: c.y,
                id: c.id,
                state: (c.type === 'Switch' || c.type === 'Button') ? c.state : undefined,
                rotation: c.rotation
            })),
            wires: this.wires.map(w => ({
                startCompId: w.startPin.component.id,
                startPinIndex: w.startPin.index,
                startPinType: w.startPin.type,
                endCompId: w.endPin.component.id,
                endPinIndex: w.endPin.index,
                endPinType: w.endPin.type
            }))
        });

        this.undoStack.push(state);
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }
        // Clear redo stack on new action
        this.redoStack = [];
        console.log('State saved. Undo stack size:', this.undoStack.length);
    }

    undo() {
        if (this.undoStack.length === 0) return;

        // Save current state to redo stack
        const currentState = JSON.stringify({
            components: this.components.map(c => ({
                type: c.type,
                x: c.x,
                y: c.y,
                id: c.id,
                state: (c.type === 'Switch' || c.type === 'Button') ? c.state : undefined,
                rotation: c.rotation
            })),
            wires: this.wires.map(w => ({
                startCompId: w.startPin.component.id,
                startPinIndex: w.startPin.index,
                startPinType: w.startPin.type,
                endCompId: w.endPin.component.id,
                endPinIndex: w.endPin.index,
                endPinType: w.endPin.type
            }))
        });
        this.redoStack.push(currentState);

        const prevState = this.undoStack.pop();
        this.loadData(JSON.parse(prevState));
        console.log('Undo performed.');
    }

    redo() {
        if (this.redoStack.length === 0) return;

        // Save current state to undo stack
        const currentState = JSON.stringify({
            components: this.components.map(c => ({
                type: c.type,
                x: c.x,
                y: c.y,
                id: c.id,
                state: (c.type === 'Switch' || c.type === 'Button') ? c.state : undefined,
                rotation: c.rotation
            })),
            wires: this.wires.map(w => ({
                startCompId: w.startPin.component.id,
                startPinIndex: w.startPin.index,
                startPinType: w.startPin.type,
                endCompId: w.endPin.component.id,
                endPinIndex: w.endPin.index,
                endPinType: w.endPin.type
            }))
        });
        this.undoStack.push(currentState);

        const nextState = this.redoStack.pop();
        this.loadData(JSON.parse(nextState));
        console.log('Redo performed.');
    }

    bindEvents() {
        // UI buttons are now handled in app.js

        // Global Key Events (Step)
        window.addEventListener('keydown', (e) => {
            if (e.key === 's' || e.key === 'S') {
                this.step();
            }
        });

        // Bind Canvas Interactions
        const canvas = this.canvasManager.canvas;
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));

        // Global Key Events
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Bind Drag & Drop from Sidebar
        const items = document.querySelectorAll('.component-item');
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('type', item.dataset.type);
            });
        });

        canvas.addEventListener('dragover', (e) => e.preventDefault());
        canvas.addEventListener('drop', (e) => this.handleDrop(e));
    }

    reset() {
        this.components = [];
        this.wires = [];
        this.isRunning = false;
    }

    startPlacement(type) {
        // Create a temporary component as ghost
        // We place it at 0,0 initially, it will move with mouse
        this.ghostComponent = this.createGhostComponent(type, 0, 0);
    }

    createGhostComponent(type, x, y) {
        let comp;
        switch (type) {
            case 'AND': comp = new ANDGate(x, y); break;
            case 'OR': comp = new ORGate(x, y); break;
            case 'NOT': comp = new NOTGate(x, y); break;
            case 'NAND': comp = new NANDGate(x, y); break;
            case 'NOR': comp = new NORGate(x, y); break;
            case 'XOR': comp = new XORGate(x, y); break;
            case 'Switch': comp = new Switch(x, y); break;
            case 'Button': comp = new Button(x, y); break;
            case 'Clock': comp = new Clock(x, y); break;
            case 'Light': comp = new Lightbulb(x, y); break;
            case 'Display': comp = new SevenSegment(x, y); break;
            case 'HexDisplay': comp = new HexDisplay(x, y); break;
            case 'SRFlipFlop': comp = new SRFlipFlop(x, y); break;
            case 'DFlipFlop': comp = new DFlipFlop(x, y); break;
            case 'JKFlipFlop': comp = new JKFlipFlop(x, y); break;
            default: console.warn('Unknown component type:', type); return null;
        }
        // Make it semi-transparent or distinct style
        comp.isGhost = true;
        return comp;
    }

    handleDrop(e) {
        e.preventDefault();
        const type = e.dataTransfer.getData('type');
        const rect = this.canvasManager.canvas.getBoundingClientRect();

        // Calculate world coordinates
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldX = (mouseX - this.canvasManager.offsetX) / this.canvasManager.scale;
        const worldY = (mouseY - this.canvasManager.offsetY) / this.canvasManager.scale;

        const x = this.snapEnabled ? snapToGrid(worldX) : worldX;
        const y = this.snapEnabled ? snapToGrid(worldY) : worldY;

        this.createComponent(type, x, y);
    }

    createComponent(type, x, y) {
        this.saveState(); // Save before adding
        const comp = this.createGhostComponent(type, x, y);
        if (comp) {
            comp.isGhost = false; // Real component
            this.components.push(comp);

            // Auto-select
            this.components.forEach(c => c.isSelected = false);
            comp.isSelected = true;
            console.log('Auto-selecting component:', comp.type);
            if (this.onSelectionChanged) {
                console.log('Triggering onSelectionChanged');
                this.onSelectionChanged([comp]);
            } else {
                console.warn('onSelectionChanged is null');
            }
        }
    }

    handleContextMenu(e) {
        e.preventDefault();
        const { worldX, worldY } = this.getMouseWorldPos(e);

        // Check if clicked on a component
        for (let i = this.components.length - 1; i >= 0; i--) {
            const comp = this.components[i];
            if (comp.isHit(worldX, worldY)) {
                // Select it
                this.components.forEach(c => c.isSelected = false);
                comp.isSelected = true;

                // For now, right click just deletes to be fast
                // In future, could show a menu
                if (confirm('Delete ' + comp.type + '?')) {
                    this.deleteSelected();
                }
                return;
            }
        }
    }

    handleMouseDown(e) {
        if (e.button !== 0) return; // Only left click

        const { worldX, worldY } = this.getMouseWorldPos(e);

        // 0. Handle Ghost Placement
        if (this.ghostComponent) {
            const x = snapToGrid(worldX);
            const y = snapToGrid(worldY);
            this.createComponent(this.ghostComponent.type, x, y);
            this.ghostComponent = null; // Finish placement
            return;
        }

        // 1. Check Pins (Wiring)
        for (const comp of this.components) {
            const allPins = [...comp.inputs, ...comp.outputs];
            for (const pin of allPins) {
                if (pin.isHit(worldX, worldY)) {
                    this.startWiring(pin);
                    return;
                }
            }
        }

        // 2. Check Components (Selection/Dragging/Interaction)
        // Iterate in reverse to hit top-most first
        let hitComp = null;
        for (let i = this.components.length - 1; i >= 0; i--) {
            const comp = this.components[i];
            if (comp.isHit(worldX, worldY)) {
                hitComp = comp;
                break;
            }
        }

        // 3. Check Wires (Selection)
        let hitWire = null;
        if (!hitComp) {
            for (const wire of this.wires) {
                if (wire.isHit(worldX, worldY)) {
                    hitWire = wire;
                    break;
                }
            }
        }

        if (hitComp) {
            // Check for specific component interactions (Switch/Button)
            if (hitComp.type === 'Switch') {
                this.saveState(); // Save before toggle
                hitComp.toggle();
                return;
            }
            if (hitComp.type === 'Button') {
                // Button press is transient, maybe don't save?
                // Or save if we want to undo the press? Usually not needed for momentary.
                hitComp.press();
                return;
            }

            // Start Dragging
            this.saveState(); // Save before drag
            this.dragComponent = hitComp;
            this.dragOffsetX = worldX - hitComp.x;
            this.dragOffsetY = worldY - hitComp.y;

            // Selection Logic
            if (!e.shiftKey) {
                this.components.forEach(c => c.isSelected = false);
                this.wires.forEach(w => w.isSelected = false);
            }
            hitComp.isSelected = true;

            // Notify UI
            if (this.onSelectionChanged) {
                this.onSelectionChanged(this.components.filter(c => c.isSelected));
            }

            // Bring to front
            const idx = this.components.indexOf(hitComp);
            if (idx > -1) {
                this.components.splice(idx, 1);
                this.components.push(hitComp);
            }
        } else if (hitWire) {
            // Wire Selection
            if (!e.shiftKey) {
                this.components.forEach(c => c.isSelected = false);
                this.wires.forEach(w => w.isSelected = false);
            }
            hitWire.isSelected = true;

            // Notify UI (maybe clear properties panel or show wire info?)
            if (this.onSelectionChanged) {
                this.onSelectionChanged([]); // Clear component properties
            }
        } else {
            // Clicked on empty space - Deselect all
            this.components.forEach(c => c.isSelected = false);
            this.wires.forEach(w => w.isSelected = false);

            // Notify UI
            if (this.onSelectionChanged) {
                this.onSelectionChanged([]);
            }
        }
    }

    handleMouseMove(e) {
        const { worldX, worldY } = this.getMouseWorldPos(e);

        // Handle Ghost
        if (this.ghostComponent) {
            this.ghostComponent.x = snapToGrid(worldX);
            this.ghostComponent.y = snapToGrid(worldY);
        }

        // Handle Dragging
        if (this.dragComponent) {
            this.dragComponent.x = snapToGrid(worldX - this.dragOffsetX);
            this.dragComponent.y = snapToGrid(worldY - this.dragOffsetY);
        }

        // Handle Wiring
        if (this.wiringStartPin) {
            // Update temp wire end position
            this.tempWire.tempX = worldX;
            this.tempWire.tempY = worldY;

            // Snap to pin if hovering
            for (const comp of this.components) {
                const allPins = [...comp.inputs, ...comp.outputs];
                for (const pin of allPins) {
                    if (pin.isHit(worldX, worldY) && pin !== this.wiringStartPin) {
                        this.tempWire.tempX = pin.x;
                        this.tempWire.tempY = pin.y;
                        break;
                    }
                }
            }
        }

        // Handle Hover Effects
        this.handleHover(worldX, worldY);
    }

    handleKeyDown(e) {
        // Escape to cancel placement or wiring
        if (e.key === 'Escape') {
            if (this.ghostComponent) {
                this.ghostComponent = null;
            }
            if (this.wiringStartPin) {
                this.wiringStartPin = null;
                this.tempWire = null;
            }
        }

        // Delete / Backspace to remove selected
        if (e.key === 'Delete' || e.key === 'Backspace') {
            this.deleteSelected();
        }
    }

    deleteSelected() {
        this.saveState(); // Save before deleting
        // Remove selected components
        const selectedComps = this.components.filter(c => c.isSelected);
        this.components = this.components.filter(c => !c.isSelected);

        // Remove selected wires
        const selectedWires = this.wires.filter(w => w.isSelected);
        this.wires = this.wires.filter(w => !w.isSelected);

        // Remove wires connected to deleted components
        this.wires = this.wires.filter(w => {
            const startComp = w.startPin.component;
            const endComp = w.endPin.component;
            return !selectedComps.includes(startComp) && !selectedComps.includes(endComp);
        });

        // Notify UI
        if (this.onSelectionChanged) this.onSelectionChanged([]);
    }

    rotateSelected() {
        this.saveState();
        const selected = this.components.filter(c => c.isSelected);
        selected.forEach(comp => {
            // Swap dimensions
            const temp = comp.width;
            comp.width = comp.height;
            comp.height = temp;

            // Rotate pins (simple approximation: just swap relative X/Y and adjust)
            // A proper rotation would require a direction state (0, 90, 180, 270)
            // For now, let's just swap dimensions to show visual change
            // and maybe re-layout pins if possible. 
            // Actually, without a direction state, pin rotation is messy.
            // Let's just add a 'rotation' property to Component and handle it in render/logic.
            comp.rotation = (comp.rotation || 0) + 90;
            if (comp.rotation >= 360) comp.rotation = 0;

            // Re-calculate pin positions based on rotation?
            // This is complex for a quick fix. 
            // Let's just stick to swapping W/H for now as a visual indicator
            // and maybe rotating the pins visually?
            // For a robust system, we need `updatePins()` based on rotation.
            // Let's skip complex pin rotation for this step and just rotate the visual body.
        });
    }

    toggleSnap() {
        // We need to expose snap state or just toggle it globally if we had a global setting.
        // Currently snapToGrid is a utility function.
        // We can add a flag 'snapEnabled' to the engine.
        this.snapEnabled = !this.snapEnabled;
        return this.snapEnabled;
    }

    handleMouseUp(e) {
        const { worldX, worldY } = this.getMouseWorldPos(e);

        // Stop Dragging
        if (this.dragComponent) {
            this.dragComponent = null;
        }

        // Stop Button Press
        this.components.forEach(c => {
            if (c.type === 'Button' && c.state === 1) {
                c.release();
            }
        });

        // Finish Wiring
        if (this.wiringStartPin) {
            // Check if dropped on a valid pin
            let endPin = null;
            for (const comp of this.components) {
                const allPins = [...comp.inputs, ...comp.outputs];
                for (const pin of allPins) {
                    if (pin.isHit(worldX, worldY) && pin !== this.wiringStartPin) {
                        endPin = pin;
                        break;
                    }
                }
                if (endPin) break;
            }

            if (endPin) {
                // Validate connection (Input <-> Output)
                if (this.wiringStartPin.type !== endPin.type) {
                    // Determine start and end (Output -> Input)
                    const source = this.wiringStartPin.type === 'output' ? this.wiringStartPin : endPin;
                    const dest = this.wiringStartPin.type === 'input' ? this.wiringStartPin : endPin;

                    this.createWire(source, dest);
                }
            }

            this.wiringStartPin = null;
            this.tempWire = null;
        }
    }

    handleHover(worldX, worldY) {
        // Reset hovers
        this.components.forEach(c => {
            [...c.inputs, ...c.outputs].forEach(p => p.isHovered = false);
        });

        // Set hover
        for (const comp of this.components) {
            const allPins = [...comp.inputs, ...comp.outputs];
            for (const pin of allPins) {
                if (pin.isHit(worldX, worldY)) {
                    pin.isHovered = true;
                    this.canvasManager.canvas.style.cursor = 'pointer';
                    return;
                }
            }
        }
        this.canvasManager.canvas.style.cursor = 'default';
    }

    startWiring(pin) {
        this.wiringStartPin = pin;
        this.tempWire = new Wire(pin, null);
        this.tempWire.tempX = pin.x;
        this.tempWire.tempY = pin.y;
    }

    createWire(source, dest) {
        // Validation Rule 1: One Input, One Output
        if (source.type === dest.type) {
            console.warn('Cannot connect pins of the same type.');
            return;
        }

        // Validation Rule 2: Not same component
        if (source.component === dest.component) {
            console.warn('Cannot connect component to itself.');
            return;
        }

        // Normalize: Ensure source is Output, dest is Input
        let outputPin = source.type === 'output' ? source : dest;
        let inputPin = source.type === 'input' ? source : dest;

        // Validation Rule 3: Input pin can only have ONE connection (Fan-in = 1)
        const inputAlreadyConnected = this.wires.some(w => w.endPin === inputPin);
        if (inputAlreadyConnected) {
            console.warn('Input pin already connected.');
            return;
        }

        // Check if wire already exists (redundant check but good)
        const exists = this.wires.some(w => w.startPin === outputPin && w.endPin === inputPin);
        if (!exists) {
            this.saveState();
            const wire = new Wire(outputPin, inputPin);
            this.wires.push(wire);

            // Update logic immediately
            wire.updateLogic();
            inputPin.component.updateLogic();
        }
    }

    getMouseWorldPos(e) {
        const rect = this.canvasManager.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldX = (mouseX - this.canvasManager.offsetX) / this.canvasManager.scale;
        const worldY = (mouseY - this.canvasManager.offsetY) / this.canvasManager.scale;
        return { worldX, worldY };
    }

    startLoop() {
        requestAnimationFrame((time) => this.loop(time));
    }

    loop(time) {
        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((time) => this.loop(time));
    }

    step() {
        this.isRunning = false; // Pause if running
        this.update(16); // Simulate one frame (approx 16ms)
    }

    update(deltaTime) {
        if (this.isRunning) {
            // 1. Reset all inputs first (optional, but good for stability)
            // Actually, we should just propagate from outputs to inputs

            // 2. Update Wires (Transfer values)
            this.wires.forEach(wire => wire.updateLogic());

            // 3. Update Components (Calculate outputs)
            this.components.forEach(comp => comp.updateLogic());

            // 4. Record History
            if (this.recordingEnabled) {
                this.recordFrame();
            }
        }
    }

    // Clipboard
    copy() {
        const selectedComps = this.components.filter(c => c.isSelected);
        if (selectedComps.length === 0) return;

        // Find wires that are fully contained within the selection
        const selectedWires = this.wires.filter(w => {
            const startSelected = selectedComps.includes(w.startPin.component);
            const endSelected = selectedComps.includes(w.endPin.component);
            return startSelected && endSelected;
        });

        this.clipboard = JSON.stringify({
            components: selectedComps.map(c => ({
                type: c.type,
                x: c.x, // Relative positions will be calculated on paste
                y: c.y,
                id: c.id, // Original ID to map wires
                state: (c.type === 'Switch' || c.type === 'Button') ? c.state : undefined,
                rotation: c.rotation
            })),
            wires: selectedWires.map(w => ({
                startCompId: w.startPin.component.id,
                startPinIndex: w.startPin.index,
                startPinType: w.startPin.type,
                endCompId: w.endPin.component.id,
                endPinIndex: w.endPin.index,
                endPinType: w.endPin.type
            }))
        });
        console.log('Copied to clipboard:', this.clipboard);
    }

    cut() {
        this.copy();
        this.deleteSelected();
    }

    paste() {
        if (!this.clipboard) return;

        this.saveState();

        const data = JSON.parse(this.clipboard);
        const idMap = new Map(); // Map old IDs to new Components
        const newComps = [];

        // Deselect current
        this.components.forEach(c => c.isSelected = false);
        this.wires.forEach(w => w.isSelected = false);

        // Calculate center of copied components to offset paste
        // For simplicity, just offset by 20px from original or mouse pos?
        // Let's offset by 20px from original for now.
        const offset = 20;

        // Create Components
        data.components.forEach(cData => {
            const comp = this.createGhostComponent(cData.type, cData.x + offset, cData.y + offset);
            if (comp) {
                comp.isGhost = false;
                comp.id = crypto.randomUUID(); // New ID
                comp.rotation = cData.rotation || 0;
                if (cData.state !== undefined) comp.state = cData.state;

                comp.isSelected = true;
                this.components.push(comp);
                newComps.push(comp);
                idMap.set(cData.id, comp);
            }
        });

        // Create Wires
        data.wires.forEach(wData => {
            const startComp = idMap.get(wData.startCompId);
            const endComp = idMap.get(wData.endCompId);

            if (startComp && endComp) {
                const startPin = wData.startPinType === 'input' ? startComp.inputs[wData.startPinIndex] : startComp.outputs[wData.startPinIndex];
                const endPin = wData.endPinType === 'input' ? endComp.inputs[wData.endPinIndex] : endComp.outputs[wData.endPinIndex];

                if (startPin && endPin) {
                    const wire = new Wire(startPin, endPin);
                    wire.isSelected = true;
                    this.wires.push(wire);
                }
            }
        });

        // Notify UI
        if (this.onSelectionChanged) {
            this.onSelectionChanged(newComps);
        }
    }

    recordFrame() {
        const frame = {
            time: Date.now(),
            data: {}
        };

        this.components.forEach(comp => {
            // Record state of inputs and outputs
            // For simplicity, just record the first output value if it exists
            if (comp.outputs.length > 0) {
                frame.data[comp.id] = comp.outputs[0].value;
            }
        });

        this.history.push(frame);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    render() {
        this.canvasManager.beginFrame();
        const ctx = this.canvasManager.ctx;

        // Render Wires (Bottom layer)
        this.wires.forEach(wire => wire.render(ctx));

        // Render Temp Wire
        if (this.tempWire) {
            this.tempWire.render(ctx);
        }

        // Render Components
        this.components.forEach(comp => comp.render(ctx));

        // Render Ghost Component
        if (this.ghostComponent) {
            ctx.save();
            ctx.globalAlpha = 0.5; // Semi-transparent
            this.ghostComponent.render(ctx);
            ctx.restore();
        }

        this.canvasManager.endFrame();
    }

    save() {
        const data = {
            components: this.components.map(c => ({
                type: c.type,
                x: c.x,
                y: c.y,
                id: c.id,
                // Save state for inputs
                state: (c.type === 'Switch' || c.type === 'Button') ? c.state : undefined
            })),
            wires: this.wires.map(w => ({
                startCompId: w.startPin.component.id,
                startPinIndex: w.startPin.index,
                startPinType: w.startPin.type,
                endCompId: w.endPin.component.id,
                endPinIndex: w.endPin.index,
                endPinType: w.endPin.type
            }))
        };

        const json = JSON.stringify(data);
        localStorage.setItem('logicLabSave', json);
        console.log('Circuit saved to localStorage');

        // Also download as file
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'circuit.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    load() {
        // For now, load from localStorage or prompt for file
        // Let's implement file input trigger
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    this.loadData(data);
                } catch (err) {
                    console.error('Failed to load circuit:', err);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    loadData(data) {
        this.reset();

        // 1. Create Components
        const compMap = new Map(); // id -> component

        data.components.forEach(cData => {
            this.createComponent(cData.type, cData.x, cData.y);
            const newComp = this.components[this.components.length - 1];
            // Restore ID to match wires (optional, but easier if we map old ID to new Comp)
            // Actually, we can't easily restore ID if we generate new ones in constructor.
            // So we map old ID to new Component instance.
            compMap.set(cData.id, newComp);

            if (cData.state !== undefined) {
                newComp.state = cData.state;
                newComp.updateLogic(); // Update visual state
            }
        });

        // 2. Create Wires
        data.wires.forEach(wData => {
            const startComp = compMap.get(wData.startCompId);
            const endComp = compMap.get(wData.endCompId);

            if (startComp && endComp) {
                const startPin = wData.startPinType === 'input' ? startComp.inputs[wData.startPinIndex] : startComp.outputs[wData.startPinIndex];
                const endPin = wData.endPinType === 'input' ? endComp.inputs[wData.endPinIndex] : endComp.outputs[wData.endPinIndex];

                if (startPin && endPin) {
                    this.createWire(startPin, endPin);
                }
            }
        });
    }
}
