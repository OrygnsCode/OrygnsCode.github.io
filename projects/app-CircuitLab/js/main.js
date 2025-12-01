// Global Error Handler for Debugging
window.onerror = function (message, source, lineno, colno, error) {
    const errorDiv = document.getElementById('debug-console') || createDebugConsole();
    errorDiv.style.display = 'block';
    errorDiv.innerHTML += `<div style="color:red; border-bottom:1px solid #333;">${message} at ${source}:${lineno}</div>`;
    console.error(message, error);
};

function createDebugConsole() {
    const div = document.createElement('div');
    div.id = 'debug-console';
    div.style.position = 'fixed';
    div.style.bottom = '0';
    div.style.left = '0';
    div.style.width = '100%';
    div.style.height = '150px';
    div.style.background = 'rgba(0,0,0,0.8)';
    div.style.color = '#0f0';
    div.style.fontFamily = 'monospace';
    div.style.fontSize = '12px';
    div.style.overflowY = 'scroll';
    div.style.zIndex = '9999';
    div.style.padding = '10px';
    div.style.display = 'none'; // Hidden by default unless error
    document.body.appendChild(div);
    return div;
}

import { Circuit } from './Circuit.js';
import { Renderer } from './Renderer.js';
import { Interaction } from './Interaction.js';
import { Solver } from './Solver.js';
import { Battery, Resistor, LightBulb, Switch, Wire, Voltmeter, Ammeter } from './components/BasicComponents.js';
import { CircuitNode } from './components/Component.js';

import { CommandManager } from './CommandManager.js';

class App {
    constructor() {
        this.canvas = document.getElementById('circuit-canvas');
        this.circuit = new Circuit();
        this.solver = new Solver(this.circuit);
        this.renderer = new Renderer(this.canvas, this.circuit);
        this.commandManager = new CommandManager(this.circuit);

        // Pass commandManager to Interaction so it can push states
        this.interaction = new Interaction(this.canvas, this.circuit, this.renderer,
            (component) => this.onComponentSelect(component),
            this.commandManager
        );

        this.selectedComponent = null;
        this.init();
    }

    init() {
        // Resize canvas to fit window
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Start the simulation loop
        this.loop();

        // Setup UI listeners
        this.setupUI();
        this.setupKeyboardShortcuts();
    }

    resize() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
        this.renderer.resize();
    }

    loop() {
        // 1. Solve Circuit Physics
        this.solver.solve();

        // 2. Render Scene
        this.renderer.render();

        requestAnimationFrame(() => this.loop());
    }

    onComponentSelect(component) {
        this.selectedComponent = component;
        this.updatePropertiesPanel();
    }

    updatePropertiesPanel() {
        const panelContent = document.getElementById('properties-content');
        if (!panelContent) return;

        if (!this.selectedComponent) {
            panelContent.innerHTML = '<div class="empty-state">Select a component to edit properties.</div>';
            return;
        }

        // Clear content
        panelContent.innerHTML = '';

        // Add Title
        const title = document.createElement('div');
        title.innerText = this.selectedComponent.type;
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '10px';
        title.style.color = 'var(--accent-color)';
        panelContent.appendChild(title);

        // Add Properties
        for (const [key, value] of Object.entries(this.selectedComponent.properties)) {
            if (key === 'current' || key === 'voltageDrop' || key === 'power') {
                // Read-only stats
                const row = document.createElement('div');
                row.style.fontSize = '12px';
                row.style.marginBottom = '4px';
                row.innerText = `${key}: ${value.toFixed(3)}`;
                panelContent.appendChild(row);
                continue;
            }

            const row = document.createElement('div');
            row.style.marginBottom = '8px';
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';

            const label = document.createElement('label');
            label.innerText = key;
            label.style.fontSize = '12px';

            let input;
            if (typeof value === 'boolean') {
                input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = value;
                input.addEventListener('change', (e) => {
                    this.selectedComponent.properties[key] = e.target.checked;
                });
            } else if (typeof value === 'number') {
                input = document.createElement('input');
                input.type = 'number';
                input.value = value;
                input.step = 0.1;
                input.min = 0; // Prevent negative values
                input.style.width = '60px';
                input.style.padding = '2px';
                input.style.background = '#333';
                input.style.border = '1px solid #555';
                input.style.color = 'white';
                input.addEventListener('input', (e) => {
                    let val = parseFloat(e.target.value);
                    if (val < 0) val = 0; // Enforce non-negative
                    this.selectedComponent.properties[key] = val;
                });
            }

            row.appendChild(label);
            if (input) row.appendChild(input);
            panelContent.appendChild(row);
        }

        // Delete Button
        const btnDelete = document.createElement('button');
        btnDelete.innerText = 'Delete Component';
        btnDelete.style.marginTop = '15px';
        btnDelete.style.width = '100%';
        btnDelete.style.backgroundColor = '#e74c3c';
        btnDelete.style.color = 'white';
        btnDelete.style.border = 'none';
        btnDelete.style.padding = '8px';
        btnDelete.style.borderRadius = '4px';
        btnDelete.style.cursor = 'pointer';
        btnDelete.onclick = () => {
            this.circuit.removeComponent(this.selectedComponent);
            this.selectedComponent = null;
            this.updatePropertiesPanel();
        };
        panelContent.appendChild(btnDelete);
    }

    setupUI() {
        // Drag and Drop from Palette
        const paletteItems = document.querySelectorAll('.component-item');
        paletteItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('type', item.dataset.type);
            });
        });

        // View Options
        document.getElementById('toggle-electrons').addEventListener('change', (e) => {
            this.renderer.showCurrent = e.target.checked;
        });

        document.getElementById('toggle-values').addEventListener('change', (e) => {
            this.renderer.showValues = e.target.checked;
        });

        document.getElementById('toggle-labels').addEventListener('change', (e) => {
            this.renderer.showLabels = e.target.checked;
        });

        const currentRadios = document.getElementsByName('current-type');
        currentRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.renderer.currentType = e.target.value;
                }
            });
        });

        // Advanced Sliders
        document.getElementById('wire-resistivity').addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.circuit.wires.forEach(w => w.properties.resistivity = val);
        });

        document.getElementById('battery-resistance').addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.circuit.components.filter(c => c.type === 'Battery').forEach(b => b.properties.internalResistance = val);
        });

        document.getElementById('toggle-real-bulbs').addEventListener('change', (e) => {
            this.solver.useRealBulbs = e.target.checked;
        });

        document.getElementById('theme-select').addEventListener('change', (e) => {
            document.body.className = e.target.value;
            this.renderer.theme = e.target.value;
        });

        // Reset
        document.getElementById('btn-reset').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the circuit?')) {
                this.circuit.clear();
                this.selectedComponent = null;
                this.updatePropertiesPanel();
            }
        });

        // Trash button
        document.getElementById('btn-trash').addEventListener('click', () => {
            if (this.selectedComponent) {
                this.circuit.removeComponent(this.selectedComponent);
                this.selectedComponent = null;
                this.updatePropertiesPanel();
            }
        });
        // Save
        document.getElementById('btn-save').addEventListener('click', () => {
            const json = this.circuit.toJSON();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'circuit.json';
            a.click();
            URL.revokeObjectURL(url);
        });

        // Load
        const fileInput = document.getElementById('file-input');
        document.getElementById('btn-load').addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const json = e.target.result;
                this.loadCircuit(json);
            };
            reader.readAsText(file);
            e.target.value = ''; // Reset
        });
    }

    setupKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            // Undo/Redo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    this.restoreState(this.commandManager.redo());
                } else {
                    this.restoreState(this.commandManager.undo());
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                this.restoreState(this.commandManager.redo());
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.selectedComponent) {
                    this.commandManager.pushState(); // Save state before delete
                    this.circuit.removeComponent(this.selectedComponent);
                    this.selectedComponent = null;
                    this.updatePropertiesPanel();
                }
            }
        });
    }

    restoreState(stateData) {
        if (!stateData) return;
        // Reuse loadCircuit logic but from object, not JSON string
        // We need to adapt loadCircuit to accept object or string
        this.loadCircuit(JSON.stringify(stateData));
    }

    loadCircuit(json) {
        try {
            const data = JSON.parse(json);
            this.circuit.clear();

            // Recreate nodes
            const nodeMap = new Map();
            data.nodes.forEach(nData => {
                const node = new CircuitNode(nData.x, nData.y);
                node.id = nData.id;
                node.isFixed = nData.isFixed;
                this.circuit.nodes.push(node);
                nodeMap.set(node.id, node);
            });

            // Recreate Components
            // Need to import classes dynamically or have them available.
            // They are imported in Interaction.js but not here.
            // I should move imports to main.js or expose them.
            // Let's assume I can import them here.
            // I need to update imports at top of file.

            const createComponent = (type, x, y) => {
                switch (type) {
                    case 'Battery': return new Battery(x, y);
                    case 'Resistor': return new Resistor(x, y);
                    case 'LightBulb': return new LightBulb(x, y);
                    case 'Switch': return new Switch(x, y);
                    case 'Voltmeter': return new Voltmeter(x, y);
                    case 'Ammeter': return new Ammeter(x, y);
                    default: return null;
                }
            };

            data.components.forEach(cData => {
                const comp = createComponent(cData.type, cData.x, cData.y);
                if (comp) {
                    comp.rotation = cData.rotation;
                    comp.properties = cData.properties;
                    // Link nodes
                    comp.nodes = cData.nodeIds.map(id => nodeMap.get(id));
                    // Update internal node positions based on rotation? 
                    // No, we should trust the saved node positions if they are linked.
                    // But components updateNodePositions() might override.
                    // Actually, if we link to existing nodes, we should ensure component respects that.
                    this.circuit.components.push(comp);
                }
            });

            // Recreate Wires
            data.wires.forEach(wData => {
                const n1 = nodeMap.get(wData.node1Id);
                const n2 = nodeMap.get(wData.node2Id);
                if (n1 && n2) {
                    const wire = new Wire(n1, n2);
                    wire.properties = wData.properties;
                    this.circuit.wires.push(wire);
                }
            });

        } catch (err) {
            console.error('Failed to load circuit', err);
            alert('Invalid circuit file');
        }
    }
}

// Initialize App when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();

    // Help Modal Logic
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const closeBtn = document.querySelector('.close-modal');

    if (helpBtn && helpModal && closeBtn) {
        helpBtn.onclick = () => {
            helpModal.style.display = "block";
        }
        closeBtn.onclick = () => {
            helpModal.style.display = "none";
        }
        window.onclick = (event) => {
            if (event.target == helpModal) {
                helpModal.style.display = "none";
            }
        }
    }
});
