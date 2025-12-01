# OrygnsCode Circuit Lab

A browser-based analog circuit simulation tool, inspired by PhET's Circuit Construction Kit.

## Features
- **Drag & Drop Interface**: Build circuits by dragging components from the palette.
- **Realistic Physics**: Uses Modified Nodal Analysis (MNA) to simulate DC circuits in real-time.
- **Components**:
  - Battery (Adjustable Voltage)
  - Resistor (Adjustable Resistance)
  - Light Bulb (Brightness indicates power)
  - Switch
  - Wire
- **Meters**:
  - Voltmeter
  - Ammeter
- **Visualizations**:
  - Electron Flow / Conventional Current animations.
  - Cyberpunk Theme toggle.
  - Real Bulbs mode (non-linear resistance).
- **Save/Load**: Export and import your circuits as JSON.

## How to Use
1. **Add Components**: Drag items from the left sidebar onto the canvas.
2. **Connect**: Drag the **endpoints** (nodes) of wires and components to connect them. They will snap together.
3. **Edit**: Click on any component to open the Properties Panel. You can change values like Voltage or Resistance.
4. **Simulate**: The simulation runs continuously. Toggle switches to control flow.
5. **View**: Use the right sidebar to toggle current view, labels, and themes.

## Installation
No installation required. Just serve the `index.html` file using any static web server.
```bash
npx http-server .
```

## Technologies
- HTML5 Canvas
- Vanilla JavaScript (ES6 Modules)
- CSS3 Variables
