/**
 * Output Components
 */
import { Component } from './Component.js';
import { Pin } from './Pin.js';

export class Lightbulb extends Component {
    constructor(x, y) {
        super(x, y, 'Light');
        this.width = 40;
        this.height = 40;
        this.state = 0;

        // 1 Input
        const pin = new Pin(this, 'input', 0);
        pin.relX = 0;
        pin.relY = 20;
        this.inputs.push(pin);
    }

    render(ctx) {
        super.render(ctx);

        // Draw Lightbulb visual
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 20, 12, 0, Math.PI * 2);

        if (this.state) {
            ctx.fillStyle = '#ffea00';
            ctx.shadowColor = '#ffea00';
            ctx.shadowBlur = 15;
        } else {
            ctx.fillStyle = '#333';
            ctx.shadowBlur = 0;
        }

        ctx.fill();
        ctx.restore();
    }

    updateLogic() {
        const val = this.inputs[0].value;
        this.value = val;
    }
}

export class HexDisplay extends Component {
    constructor(x, y) {
        super(x, y, 'HexDisplay');
        this.label = 'HEX';
        this.width = 60;
        this.height = 80;
        this.value = 0;

        // 4 Inputs (8-4-2-1)
        this.addInput(0, 20, '8');
        this.addInput(0, 35, '4');
        this.addInput(0, 50, '2');
        this.addInput(0, 65, '1');
    }

    addInput(relX, relY, label) {
        const pin = new Pin(this, 'input', this.inputs.length);
        pin.relX = relX;
        pin.relY = relY;
        pin.label = label;
        this.inputs.push(pin);
    }

    render(ctx) {
        super.render(ctx);

        // Draw Hex Digit
        ctx.fillStyle = '#00f3ff';
        ctx.font = '40px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.value.toString(16).toUpperCase(), this.x + this.width / 2, this.y + this.height / 2);

        // Render Pin Labels
        ctx.fillStyle = '#aaa';
        ctx.font = '10px Inter';
        ctx.textAlign = 'left';
        this.inputs.forEach(pin => {
            if (pin.label) {
                ctx.fillText(pin.label, this.x + pin.relX + 10, this.y + pin.relY);
            }
        });
    }

    updateLogic() {
        let val = 0;
        if (this.inputs[0].value) val += 8;
        if (this.inputs[1].value) val += 4;
        if (this.inputs[2].value) val += 2;
        if (this.inputs[3].value) val += 1;
        this.value = val;
    }
}

export class SevenSegment extends Component {
    constructor(x, y) {
        super(x, y, 'Display');
        this.width = 60;
        this.height = 80;

        // 4 Inputs (BCD) - Simplified for now to just 1 input for on/off or maybe 4 later
        // For MVP let's just do 1 input that shows 0 or 1, or maybe 4 inputs for hex?
        // Let's do 4 inputs for Hex digit
        this.addInput(0, 10); // Bit 0 (1)
        this.addInput(0, 30); // Bit 1 (2)
        this.addInput(0, 50); // Bit 2 (4)
        this.addInput(0, 70); // Bit 3 (8)

        this.value = 0;
    }

    addInput(relX, relY) {
        const pin = new Pin(this, 'input', this.inputs.length);
        pin.relX = relX;
        pin.relY = relY;
        this.inputs.push(pin);
    }

    updateLogic() {
        let val = 0;
        if (this.inputs[0].value) val += 1;
        if (this.inputs[1].value) val += 2;
        if (this.inputs[2].value) val += 4;
        if (this.inputs[3].value) val += 8;
        this.value = val;
    }

    render(ctx) {
        super.render(ctx);

        // Draw Number
        ctx.save();
        ctx.fillStyle = '#ff003c';
        ctx.font = '40px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff003c';
        ctx.shadowBlur = 10;
        ctx.fillText(this.value.toString(16).toUpperCase(), this.x + 30, this.y + 40);
        ctx.restore();
    }
}
