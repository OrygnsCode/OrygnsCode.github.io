export class Solver {
    constructor(circuit) {
        this.circuit = circuit;
        this.useRealBulbs = false;
    }

    solve() {
        const nodes = this.circuit.nodes;
        const components = this.circuit.components;
        const wires = this.circuit.wires;

        if (nodes.length === 0) return;

        // Update Bulb Resistance if Real Bulbs enabled
        if (this.useRealBulbs) {
            components.filter(c => c.type === 'LightBulb').forEach(bulb => {
                // Simple non-linear model: R = R0 * (1 + k * P)
                // Use previous power/current to update resistance for this frame
                // R0 = 10 (base)
                const power = bulb.properties.power || 0;
                // Limit resistance increase to avoid instability
                bulb.properties.resistance = 10 + Math.min(power * 2, 100);
            });
        } else {
            components.filter(c => c.type === 'LightBulb').forEach(bulb => {
                bulb.properties.resistance = 10;
            });
        }

        // 1. Assign indices to nodes
        // We need to identify a ground node. 
        // For simplicity, let's pick the first node connected to a battery negative terminal, or just index 0.
        // Better: Pick a node with the most connections or just index 0.
        // Let's assume node 0 is reference (0V) for now, unless we find a ground component (not implemented yet).

        // Map nodes to indices 0..N-1
        const nodeMap = new Map();
        nodes.forEach((node, i) => nodeMap.set(node, i));
        const N = nodes.length;

        // MNA Matrix size: N nodes + M voltage sources
        // We need to identify voltage sources (Batteries, Wire with 0 resistance acting as short? No, wires are resistors usually).
        // Ideal wires are 0 resistance -> voltage source of 0V? 
        // Or just merge nodes. My Interaction.js merges nodes visually but maybe not logically fully yet.
        // If Interaction.js merges nodes by replacing objects, then "wires" with 0 resistance don't exist as components between nodes, 
        // they are just the same node.
        // But my Wire component exists.
        // If Wire has resistance, it's a resistor.

        const voltageSources = components.filter(c => c.type === 'Battery');
        const M = voltageSources.length;

        const size = N + M;
        const G = Array(size).fill(0).map(() => Array(size).fill(0));
        const I = Array(size).fill(0);

        // Fill G matrix
        // 1. Conductances (Resistors, Wires, LightBulbs)
        const resistors = [...components.filter(c => ['Resistor', 'LightBulb'].includes(c.type)), ...wires];

        resistors.forEach(comp => {
            const n1 = nodeMap.get(comp.nodes[0]);
            const n2 = nodeMap.get(comp.nodes[1]);

            // Determine resistance
            let R = comp.properties.resistance;
            if (comp.type === 'Wire') R = comp.properties.resistivity || 0.01; // Avoid 0
            if (comp.type === 'LightBulb') R = 10; // Constant for now, though real bulbs are non-linear

            if (R < 0.0001) R = 0.0001; // Prevent division by zero
            const g = 1 / R;

            if (n1 !== undefined && n2 !== undefined) {
                G[n1][n1] += g;
                G[n2][n2] += g;
                G[n1][n2] -= g;
                G[n2][n1] -= g;
            }
        });

        // 2. Voltage Sources
        voltageSources.forEach((batt, i) => {
            const nPos = nodeMap.get(batt.nodes[1]); // Positive
            const nNeg = nodeMap.get(batt.nodes[0]); // Negative
            const idx = N + i; // Index in matrix

            // V_pos - V_neg = Voltage
            // Equation: 1*V_pos - 1*V_neg = V

            if (nPos !== undefined) {
                G[nPos][idx] += 1;
                G[idx][nPos] += 1;
            }
            if (nNeg !== undefined) {
                G[nNeg][idx] -= 1;
                G[idx][nNeg] -= 1;
            }

            // Internal Resistance (Practical Voltage Source)
            // V_pos - V_neg + I * R_int = V
            // This allows parallel batteries without KVL violation (singular matrix or infinite current)
            const rInt = batt.properties.internalResistance || 0.01;
            G[idx][idx] += rInt;

            I[idx] = batt.properties.voltage;
        });

        // 3. Handle Ground
        // We must fix one node to 0V to make the system solvable (remove singularity).
        // Let's fix node 0.
        // "Grounded" approach: G[0][0] += 1e6 (very large conductance to ground)
        G[0][0] += 1e6; // 1 MegaSiemens to ground

        // STABILITY FIX: Add small leakage conductance to ALL nodes
        // This prevents singular matrices if parts of the circuit are floating (unconnected).
        for (let i = 0; i < size; i++) {
            G[i][i] += 1e-9; // 1 nS leakage
        }

        // Solve G * X = I
        const X = this.gaussianElimination(G, I);

        if (X) {
            // Update Node Voltages
            nodes.forEach((node, i) => {
                node.voltage = X[i];
            });

            // Update Component Currents/Power
            resistors.forEach(comp => {
                const n1 = comp.nodes[0];
                const n2 = comp.nodes[1];
                const v1 = n1.voltage;
                const v2 = n2.voltage;
                let R = comp.properties.resistance;
                if (comp.type === 'Wire') R = comp.properties.resistivity || 0.01;
                if (comp.type === 'LightBulb') R = 10;

                const voltageDrop = v1 - v2;
                const current = voltageDrop / R;

                // Short Circuit Detection
                if (Math.abs(current) > 100) {
                    comp.isShortCircuit = true;
                } else {
                    comp.isShortCircuit = false;
                }

                comp.properties.current = current;
                comp.properties.voltageDrop = voltageDrop;
                if (comp.type === 'LightBulb') {
                    comp.properties.power = (voltageDrop * voltageDrop) / R;
                }
            });

            // Update Voltmeters
            components.filter(c => c.type === 'Voltmeter').forEach(vm => {
                const v1 = vm.nodes[0].voltage;
                const v2 = vm.nodes[1].voltage;
                vm.properties.voltageDrop = v1 - v2;
            });
        }
    }

    gaussianElimination(A, b) {
        const n = A.length;
        // Forward elimination
        for (let i = 0; i < n; i++) {
            // Pivot
            let maxEl = Math.abs(A[i][i]);
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(A[k][i]) > maxEl) {
                    maxEl = Math.abs(A[k][i]);
                    maxRow = k;
                }
            }

            // Swap
            for (let k = i; k < n; k++) {
                const tmp = A[maxRow][k];
                A[maxRow][k] = A[i][k];
                A[i][k] = tmp;
            }
            const tmp = b[maxRow];
            b[maxRow] = b[i];
            b[i] = tmp;

            // Make all rows below this one 0 in current column
            for (let k = i + 1; k < n; k++) {
                const c = -A[k][i] / A[i][i];
                for (let j = i; j < n; j++) {
                    if (i === j) {
                        A[k][j] = 0;
                    } else {
                        A[k][j] += c * A[i][j];
                    }
                }
                b[k] += c * b[i];
            }
        }

        // Back substitution
        const x = Array(n).fill(0);
        for (let i = n - 1; i > -1; i--) {
            let sum = 0;
            for (let j = i + 1; j < n; j++) {
                sum += A[i][j] * x[j];
            }
            x[i] = (b[i] - sum) / A[i][i];
        }
        return x;
    }
}
