# Logic Lab Design Document

## Overview
Logic Lab is a high-performance, browser-based digital logic simulator designed with a cyberpunk aesthetic. It allows users to design, simulate, and analyze digital circuits using a drag-and-drop interface.

## Phase 1: Core Engine & Rendering
**Goal:** Establish the fundamental rendering and interaction engine.
- [x] **Canvas System**: High-DPI responsive canvas with hardware acceleration.
- [x] **Grid System**: Infinite scrolling grid with dynamic LOD (Level of Detail).
- [x] **View Control**: Pan and Zoom functionality with smooth easing.
- [x] **Component Architecture**: Base `Component` class with position, rotation, and bounding box logic.

## Phase 2: Basic Gates & Wiring
**Goal:** Implement the building blocks of digital logic.
- [x] **Basic Gates**: AND, OR, NOT, NAND, NOR, XOR implementation.
- [x] **Pin System**: Input and Output pins with snapping and validation.
- [x] **Wiring System**: Orthogonal wire routing with automatic node creation.
- [x] **Connection Logic**: Validating connections (Output to Input only).

## Phase 3: Interactive UI
**Goal:** Create a user-friendly interface for circuit manipulation.
- [x] **Component Sidebar**: Categorized list of components (Gates, IO, Memory).
- [x] **Drag & Drop**: "Ghost" placement system for adding components.
- [x] **Selection System**: Box selection, multi-select, and handle manipulation.
- [x] **Properties Panel**: Context-aware panel for editing component attributes (Labels, States).

## Phase 4: Simulation Engine
**Goal:** Real-time logic propagation and state management.
- [x] **Propagation Algorithm**: Event-driven simulation handling gate delays.
- [x] **Simulation Controls**: Run, Pause, Step, and Reset functionality.
- [x] **State Visualization**: Wires change color (Cyan/Dark) based on logic High/Low.
- [x] **Cycle Detection**: Basic protection against infinite loops in zero-delay models.

## Phase 5: Advanced Components
**Goal:** Expand the library with stateful and complex components.
- [x] **Memory Units**: SR Latch, D Flip-Flop, JK Flip-Flop.
- [x] **Input Devices**: Toggle Switches, Push Buttons, Clock Generators.
- [x] **Output Devices**: LED Lightbulbs, 7-Segment Displays, Hex Displays.
- [x] **Complex Logic**: Multiplexers, Demultiplexers (Planned).

## Phase 6: Polish & Tools
**Goal:** Enhance usability and debugging capabilities.
- [x] **Timing Diagram**: Real-time oscilloscope-style view of logic states over time.
- [x] **Undo/Redo**: Command pattern implementation for robust history navigation.
- [x] **Save/Load**: JSON serialization for circuit persistence.
- [x] **Export**: Export circuit diagrams as high-resolution images.
- [x] **Keyboard Shortcuts**: Productivity accelerators (Space to Run, Del to Delete).

---

## Phase 7: Analog Circuit Builder (New Subsystem)
**Goal:** Integrate a physics-accurate analog circuit simulator alongside the digital engine, inspired by PhET "Circuit Construction Kit".

### 7.1 Overview
The Analog Circuit Builder allows users to construct DC circuits using realistic components. Unlike the discrete 0/1 logic of the digital mode, this subsystem simulates continuous voltage and current using Ohm's Law and Kirchhoff's laws in real-time. Users can seamlessly toggle between "Digital Mode" and "Analog Mode" within the same workspace.

### 7.2 User Interface & Interaction
- **Dual Modes**: A toggle switch in the top bar switches the toolbox and simulation engine between Digital and Analog.
- **PhET-Style Interaction**:
    - **Lifelike Components**: Components look like their real-world counterparts (batteries, resistors with color bands, filament bulbs).
    - **Drag & Wire**: Wires are not orthogonal lines but flexible, draggable cables that can be bent and extended.
    - **Snapping**: Components automatically snap to a hidden grid or to each other's terminals for easy connection.
    - **Direct Manipulation**: Drag a resistor to stretch it, rotate it by dragging a handle, or disconnect a wire by "cutting" the joint.

### 7.3 Analog Components
- **Power Sources**:
    - **DC Battery**: Adjustable voltage (0.1V - 100V). Stackable in series.
    - **AC Source**: Adjustable frequency and amplitude (Future).
- **Passives**:
    - **Resistor**: Adjustable resistance (0Ω - 10MΩ). Visual color bands update automatically.
    - **Light Bulb**: Glows brighter with increased current. Burns out if voltage exceeds rating.
    - **Capacitor**: Visualizes charge accumulation.
    - **Inductor**: (Optional) For RL circuits.
- **Control & Protection**:
    - **Switch**: SPST knife switch (open/closed).
    - **Fuse**: Breaks circuit if current exceeds rating.
- **Measurement**:
    - **Multimeter Tool**: Draggable probes (Red/Black) to measure Voltage (parallel) or Current (series) at any point.
    - **Voltmeter/Ammeter**: Component-style meters that can be wired into the circuit.

### 7.4 Simulation Engine
- **Real-Time Solver**: Uses Modified Nodal Analysis (MNA) to solve for node voltages and branch currents at 60 FPS.
- **Visual Feedback**:
    - **Current Flow**: Animated electron dots moving through wires. Speed indicates current magnitude; direction indicates flow.
    - **Voltage Heatmap**: Wires glow different colors (e.g., Red to Black) based on relative voltage potential.
    - **Dynamic Values**: Labels update in real-time (e.g., "12.0V", "0.5A").

### 7.5 Verification Circuits
To validate the engine, the following standard circuits will be buildable:
1.  **Series/Parallel Network**: Verifying equivalent resistance and voltage drops.
2.  **RC Circuit**: Visualizing the exponential charging/discharging curve of a capacitor via the Multimeter or Timing Diagram.
3.  **Wheatstone Bridge**: Demonstrating null deflection when balanced.
4.  **Simple LED Circuit**: Showing current limiting with a resistor.

### 7.6 Integration
- **Hybrid Simulation**: (Future) Interface blocks (DAC/ADC) to allow Digital logic to control Analog circuits and vice versa.
- **Unified Canvas**: The same infinite canvas is used, but the "layer" changes based on the active mode.
