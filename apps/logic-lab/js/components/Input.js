/**
 * Input Components
 */
import { Component } from './Component.js';
import { Pin } from './Pin.js';

export class Switch extends Component {
    constructor(x, y) {
        super(x, y, 'Switch');
        this.width = 40;
        this.height = 40;
        this.state = 0;

        // 1 Output
        const pin = new Pin(this, 'output', 0);
        pin.relX = 40;
        pin.relY = 20;
        this.outputs.push(pin);
    }

    render(ctx) {
        super.render(ctx);

        // Draw Switch visual
        ctx.save();
        ctx.fillStyle = this.state ? '#00f3ff' : '#333';
        ctx.fillRect(this.x + 10, this.y + 10, 20, 20);
        ctx.restore();
    }

    toggle() {
        this.state = !this.state;
        this.updateLogic();
    }

    updateLogic() {
        this.outputs[0].value = this.state ? 1 : 0;
    }
}

export class Button extends Component {
    constructor(x, y) {
        super(x, y, 'Button');
        this.width = 40;
        this.height = 40;
        this.state = 0;

        // 1 Output
        const pin = new Pin(this, 'output', 0);
        pin.relX = 40;
        pin.relY = 20;
        this.outputs.push(pin);
    }

    render(ctx) {
        super.render(ctx);

        // Draw Button visual
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 20, 10, 0, Math.PI * 2);
        ctx.fillStyle = this.state ? '#00f3ff' : '#333';
        ctx.fill();
        ctx.restore();
    }

    press() {
        this.state = 1;
        this.updateLogic();
    }

    release() {
        this.state = 0;
        this.updateLogic();
    }

    updateLogic() {
        this.outputs[0].value = this.state ? 1 : 0;
    }
}

export class Clock extends Component {
    constructor(x, y) {
        super(x, y, 'Clock');
        this.width = 40;
        this.height = 40;
        this.state = 0;
        this.frequency = 1000; // ms (1Hz default)
        this.lastToggle = 0;

        this.outputs = [];
        const pin = new Pin(this, 'output', 0);
        pin.relX = 40;
        pin.relY = 20;
        this.outputs.push(pin);
    }

    render(ctx) {
        super.render(ctx);
        // Draw Clock Icon
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Square wave icon
        ctx.moveTo(this.x + 10, this.y + 25);
        ctx.lineTo(this.x + 10, this.y + 15);
        ctx.lineTo(this.x + 20, this.y + 15);
        ctx.lineTo(this.x + 20, this.y + 25);
        ctx.lineTo(this.x + 30, this.y + 25);
        ctx.lineTo(this.x + 30, this.y + 15);
        ctx.stroke();

        // Indicator
        ctx.fillStyle = this.state ? '#00f3ff' : '#333';
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 32, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    updateLogic() {
        // Clock logic is handled by Engine time, or we can check time here
        // But Component.updateLogic is called every frame.
        // We need 'time' passed to updateLogic, or use Date.now()
        const now = Date.now();
        if (now - this.lastToggle > this.frequency / 2) {
            this.state = !this.state ? 1 : 0;
            this.lastToggle = now;
        }
        this.outputs[0].value = this.state;
    }
}
