import { CircuitEngine } from './engine/CircuitEngine.js';

/**
 * Orygnscode Logic Lab
 * Main Application Entry Point
 */

console.log("Logic Lab: Initializing...");

document.addEventListener('DOMContentLoaded', () => {
    console.log("Logic Lab: DOM Ready");

    // Initialize the engine
    const engine = new CircuitEngine();

    // Expose engine to window for debugging
    window.circuitEngine = engine;

    // Bind Toolbar Buttons
    document.getElementById('btn-run').addEventListener('click', () => engine.isRunning = true);
    document.getElementById('btn-pause').addEventListener('click', () => engine.isRunning = false);
    document.getElementById('btn-step').addEventListener('click', () => engine.step());
    document.getElementById('btn-reset').addEventListener('click', () => engine.reset());

    document.getElementById('btn-undo').addEventListener('click', () => engine.undo());
    document.getElementById('btn-redo').addEventListener('click', () => engine.redo());

    document.getElementById('btn-delete').addEventListener('click', () => engine.deleteSelected());
    document.getElementById('btn-rotate').addEventListener('click', () => engine.rotateSelected());
    document.getElementById('btn-timing').addEventListener('click', toggleTimingPanel);

    // Bind Menu Items
    document.getElementById('menu-new').addEventListener('click', () => {
        if (confirm('Create new circuit? Unsaved changes will be lost.')) engine.reset();
    });
    document.getElementById('menu-open').addEventListener('click', () => engine.load());
    document.getElementById('menu-save').addEventListener('click', () => engine.save());
    document.getElementById('menu-export').addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'circuit.png';
        link.href = document.getElementById('logic-canvas').toDataURL();
        link.click();
    });

    // Edit Menu
    document.getElementById('menu-undo').addEventListener('click', () => engine.undo());
    document.getElementById('menu-redo').addEventListener('click', () => engine.redo());
    document.getElementById('menu-cut').addEventListener('click', () => engine.cut());
    document.getElementById('menu-copy').addEventListener('click', () => engine.copy());
    document.getElementById('menu-paste').addEventListener('click', () => engine.paste());
    document.getElementById('menu-delete').addEventListener('click', () => engine.deleteSelected());
    // 'menu-select-all' not implemented in HTML yet
    /*
    document.getElementById('menu-select-all').addEventListener('click', () => {
        engine.components.forEach(c => c.isSelected = true);
        engine.wires.forEach(w => w.isSelected = true);
        // Notify UI?
    });
    */

    document.getElementById('menu-grid').addEventListener('click', () => {
        engine.canvasManager.showGrid = !engine.canvasManager.showGrid;
    });
    document.getElementById('menu-snap').addEventListener('click', () => {
        const enabled = engine.toggleSnap();
        alert('Snap to Grid: ' + (enabled ? 'ON' : 'OFF'));
    });
    document.getElementById('menu-reset-view').addEventListener('click', () => {
        engine.canvasManager.offsetX = 0;
        engine.canvasManager.offsetY = 0;
        engine.canvasManager.scale = 1;
    });

    document.getElementById('menu-shortcuts').addEventListener('click', () => {
        alert('Shortcuts:\nSpace: Run/Pause\nS: Step\nDelete: Delete Selected\nR: Rotate\nT: Toggle Timing Diagram');
    });
    document.getElementById('menu-about').addEventListener('click', () => {
        alert('Orygnscode Logic Lab v2.0\nA cyberpunk digital logic simulator.');
    });

    // Initialize Properties Panel
    const propPanel = document.getElementById('properties-content');

    // Listen for selection changes
    engine.onSelectionChanged = (selectedComponents) => {
        console.log('Selection changed:', selectedComponents);
        if (selectedComponents.length === 0) {
            propPanel.innerHTML = '<div class="prop-placeholder">Select a component to view properties</div>';
        } else if (selectedComponents.length === 1) {
            const comp = selectedComponents[0];
            updatePropertiesPanel(comp, propPanel);
        } else {
            propPanel.innerHTML = '<div class="prop-placeholder">' + selectedComponents.length + ' items selected</div>';
        }
    };

    function updatePropertiesPanel(comp, container) {
        container.innerHTML = '';

        // ID / Type
        createPropRow(container, 'Type', comp.type, true);
        createPropRow(container, 'ID', comp.id, true);

        // Position
        createPropRow(container, 'X', Math.round(comp.x));
        createPropRow(container, 'Y', Math.round(comp.y));

        // Specific Properties
        if (comp.type === 'Switch') {
            const row = document.createElement('div');
            row.className = 'prop-row';
            row.innerHTML = `<label class="prop-label">State</label>`;
            const toggle = document.createElement('button');
            toggle.className = 'prop-input';
            toggle.textContent = comp.state ? 'ON' : 'OFF';
            toggle.onclick = () => {
                comp.toggle();
                toggle.textContent = comp.state ? 'ON' : 'OFF';
            };
            row.appendChild(toggle);
            container.appendChild(row);
        }

        // Label (Future)
        // createPropInput(container, 'Label', comp.label || '', (val) => comp.label = val);
    }

    function createPropRow(container, label, value, readonly = false) {
        const row = document.createElement('div');
        row.className = 'prop-row';
        row.innerHTML = `
            <label class="prop-label">${label}</label>
            <input type="text" class="prop-input" value="${value}" ${readonly ? 'readonly' : ''}>
        `;
        container.appendChild(row);
    }

    // Timing Diagram Logic
    const timingPanel = document.getElementById('timing-panel');
    const timingCanvas = document.getElementById('timing-canvas');
    const timingCtx = timingCanvas.getContext('2d');
    let isTimingOpen = false;

    // Add Toggle Button to Toolbar (if not exists, we should add it)
    // For now, let's add a menu item or just a key binding 'T'
    window.addEventListener('keydown', (e) => {
        if (e.key === 't' || e.key === 'T') {
            toggleTimingPanel();
        }
    });

    document.getElementById('btn-close-timing').addEventListener('click', toggleTimingPanel);

    function toggleTimingPanel() {
        isTimingOpen = !isTimingOpen;
        timingPanel.style.display = isTimingOpen ? 'flex' : 'none';
        engine.recordingEnabled = isTimingOpen;
        if (isTimingOpen) {
            resizeTimingCanvas();
            requestAnimationFrame(renderTimingLoop);
        }
    }

    function resizeTimingCanvas() {
        timingCanvas.width = timingPanel.clientWidth;
        timingCanvas.height = timingPanel.clientHeight - 30; // Header height
    }

    window.addEventListener('resize', () => {
        if (isTimingOpen) resizeTimingCanvas();
    });

    function renderTimingLoop() {
        if (!isTimingOpen) return;
        renderTiming();
        requestAnimationFrame(renderTimingLoop);
    }

    function renderTiming() {
        const w = timingCanvas.width;
        const h = timingCanvas.height;
        timingCtx.clearRect(0, 0, w, h);

        // Background Grid
        timingCtx.strokeStyle = '#333';
        timingCtx.lineWidth = 0.5;
        timingCtx.beginPath();
        for (let x = 0; x < w; x += 20) {
            timingCtx.moveTo(x, 0);
            timingCtx.lineTo(x, h);
        }
        timingCtx.stroke();

        // Render Signals
        // We need to know which components to trace.
        // For now, trace all selected components, or if none, trace all outputs.
        // Let's trace components that are in the history.

        if (engine.history.length === 0) return;

        const signals = Object.keys(engine.history[0].data);
        const rowHeight = 30;
        let y = 10;

        signals.forEach(id => {
            // Find component label
            const comp = engine.components.find(c => c.id === id);
            if (!comp) return; // Component deleted

            // Draw Label
            timingCtx.fillStyle = '#aaa';
            timingCtx.font = '10px monospace';
            timingCtx.fillText(comp.type + ' ' + comp.id.substr(0, 4), 5, y + 15);

            // Draw Waveform
            timingCtx.strokeStyle = '#00f3ff';
            timingCtx.lineWidth = 2;
            timingCtx.beginPath();

            engine.history.forEach((frame, i) => {
                const val = frame.data[id];
                const x = 100 + i * 2; // Scale time
                const yVal = val ? y : y + 20;

                if (i === 0) timingCtx.moveTo(x, yVal);
                else {
                    const prevVal = engine.history[i - 1].data[id];
                    if (val !== prevVal) {
                        timingCtx.lineTo(x, prevVal ? y : y + 20); // Vertical line
                    }
                    timingCtx.lineTo(x, yVal);
                }
            });
            timingCtx.stroke();

            y += rowHeight;
        });
    }

    // Bind Sidebar Clicks for Ghost Placement
    const items = document.querySelectorAll('.component-item');
    items.forEach(item => {
        item.addEventListener('click', (e) => {
            const type = item.dataset.type;
            engine.startPlacement(type);
        });
        // Remove draggable attribute as we are switching to click-to-place
        item.removeAttribute('draggable');
    });
});
