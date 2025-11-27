/**
 * Logic Gates
 */
import { Component } from './Component.js';
import { Pin } from './Pin.js';

export class Gate extends Component {
    constructor(x, y, type) {
        super(x, y, type);
        this.width = 60;
        this.height = 40;

        // Default 2 inputs, 1 output
        this.addInput(0, 10);
        this.addInput(0, 30);
        this.addOutput(60, 20);
    }

    addInput(relX, relY) {
        const pin = new Pin(this, 'input', this.inputs.length);
        pin.relX = relX;
        pin.relY = relY;
        this.inputs.push(pin);
    }

    addOutput(relX, relY) {
        const pin = new Pin(this, 'output', this.outputs.length);
        pin.relX = relX;
        pin.relY = relY;
        this.outputs.push(pin);
    }

    render(ctx) {
        super.render(ctx);

        // Visual State Indicator (Small LED)
        if (this.outputs.length > 0) {
            const val = this.outputs[0].value;
            ctx.save();
            ctx.fillStyle = val ? '#00f3ff' : '#333';
            ctx.beginPath();
            ctx.arc(this.x + this.width - 10, this.y + 10, 3, 0, Math.PI * 2);
            ctx.fill();

            if (val) {
                ctx.shadowColor = '#00f3ff';
                ctx.shadowBlur = 5;
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    updateLogic() {
        // To be implemented by specific gates
    }
}

export class ANDGate extends Gate {
    constructor(x, y) {
        super(x, y, 'AND');
    }

    updateLogic() {
        const val1 = this.inputs[0].value;
        const val2 = this.inputs[1].value;
        this.outputs[0].value = (val1 && val2) ? 1 : 0;
    }
}

export class ORGate extends Gate {
    constructor(x, y) {
        super(x, y, 'OR');
    }

    updateLogic() {
        const val1 = this.inputs[0].value;
        const val2 = this.inputs[1].value;
        this.outputs[0].value = (val1 || val2) ? 1 : 0;
    }
}

export class NOTGate extends Gate {
    constructor(x, y) {
        super(x, y, 'NOT');
        this.inputs = []; // Clear default inputs
        this.addInput(0, 20); // Single input
        this.width = 40; // Smaller width
        this.outputs[0].relX = 40;
    }

    updateLogic() {
        const val1 = this.inputs[0].value;
        this.outputs[0].value = (!val1) ? 1 : 0;
    }
}

export class NANDGate extends Gate {
    constructor(x, y) {
        super(x, y, 'NAND');
    }

    updateLogic() {
        const val1 = this.inputs[0].value;
        const val2 = this.inputs[1].value;
        this.outputs[0].value = !(val1 && val2) ? 1 : 0;
    }
}

export class NORGate extends Gate {
    constructor(x, y) {
        super(x, y, 'NOR');
    }

    updateLogic() {
        const val1 = this.inputs[0].value;
        const val2 = this.inputs[1].value;
        this.outputs[0].value = !(val1 || val2) ? 1 : 0;
    }
}

export class XORGate extends Gate {
    constructor(x, y) {
        super(x, y, 'XOR');
    }

    updateLogic() {
        const val1 = this.inputs[0].value;
        const val2 = this.inputs[1].value;
        this.outputs[0].value = (val1 ^ val2) ? 1 : 0;
    }
}
