/**
 * Flip-Flop Components
 */
import { Component } from './Component.js';
import { Pin } from './Pin.js';

export class FlipFlop extends Component {
    constructor(x, y, type) {
        super(x, y, type);
        this.width = 80;
        this.height = 80;
        this.state = 0; // Q
        this.nextState = 0;
    }

    addInput(relX, relY, label) {
        const pin = new Pin(this, 'input', this.inputs.length);
        pin.relX = relX;
        pin.relY = relY;
        pin.label = label; // Optional label for rendering
        this.inputs.push(pin);
    }

    addOutput(relX, relY, label) {
        const pin = new Pin(this, 'output', this.outputs.length);
        pin.relX = relX;
        pin.relY = relY;
        pin.label = label;
        this.outputs.push(pin);
    }

    render(ctx) {
        super.render(ctx);

        // Render Pin Labels
        ctx.fillStyle = '#aaa';
        ctx.font = '10px Inter';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        this.inputs.forEach(pin => {
            if (pin.label) {
                ctx.fillText(pin.label, this.x + pin.relX + 10, this.y + pin.relY);
            }
        });

        ctx.textAlign = 'right';
        this.outputs.forEach(pin => {
            if (pin.label) {
                ctx.fillText(pin.label, this.x + pin.relX - 10, this.y + pin.relY);
            }
        });
    }
}

export class SRFlipFlop extends FlipFlop {
    constructor(x, y) {
        super(x, y, 'SRFlipFlop');
        this.label = 'SR';
        this.addInput(0, 20, 'S');
        this.addInput(0, 60, 'R');
        this.addOutput(80, 20, 'Q');
        this.addOutput(80, 60, 'Q\'');
    }

    updateLogic() {
        const S = this.inputs[0].value;
        const R = this.inputs[1].value;

        // SR Latch Logic
        if (S && !R) this.state = 1;
        else if (!S && R) this.state = 0;
        else if (S && R) this.state = 0; // Invalid state, usually 0 or undefined

        this.outputs[0].value = this.state;
        this.outputs[1].value = this.state ? 0 : 1;
    }
}

export class DFlipFlop extends FlipFlop {
    constructor(x, y) {
        super(x, y, 'DFlipFlop');
        this.label = 'D';
        this.addInput(0, 20, 'D');
        this.addInput(0, 60, 'Clk');
        this.addOutput(80, 20, 'Q');
        this.addOutput(80, 60, 'Q\'');
        this.lastClk = 0;
    }

    updateLogic() {
        const D = this.inputs[0].value;
        const Clk = this.inputs[1].value;

        // Rising Edge Trigger
        if (Clk && !this.lastClk) {
            this.state = D;
        }
        this.lastClk = Clk;

        this.outputs[0].value = this.state;
        this.outputs[1].value = this.state ? 0 : 1;
    }
}

export class JKFlipFlop extends FlipFlop {
    constructor(x, y) {
        super(x, y, 'JKFlipFlop');
        this.label = 'JK';
        this.addInput(0, 20, 'J');
        this.addInput(0, 40, 'Clk');
        this.addInput(0, 60, 'K');
        this.addOutput(80, 20, 'Q');
        this.addOutput(80, 60, 'Q\'');
        this.lastClk = 0;
    }

    updateLogic() {
        const J = this.inputs[0].value;
        const Clk = this.inputs[1].value;
        const K = this.inputs[2].value;

        // Rising Edge Trigger
        if (Clk && !this.lastClk) {
            if (J && !K) this.state = 1;
            else if (!J && K) this.state = 0;
            else if (J && K) this.state = !this.state; // Toggle
        }
        this.lastClk = Clk;

        this.outputs[0].value = this.state;
        this.outputs[1].value = this.state ? 0 : 1;
    }
}
