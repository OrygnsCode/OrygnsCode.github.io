export class CommandManager {
    constructor(circuit) {
        this.circuit = circuit;
        this.history = [];
        this.future = [];
        this.maxHistory = 50;
    }

    // Save current state to history
    pushState() {
        const state = JSON.parse(this.circuit.toJSON());

        // Don't push if state hasn't changed (optimization)
        // Simple string comparison of objects
        if (this.history.length > 0 && JSON.stringify(this.history[this.history.length - 1]) === JSON.stringify(state)) {
            return;
        }

        this.history.push(state);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        this.future = []; // Clear redo stack on new action
    }

    undo() {
        if (this.history.length === 0) return null;

        // Save current state to future before undoing
        const currentState = JSON.parse(this.circuit.toJSON());
        this.future.push(currentState);

        const previousState = this.history.pop();
        return previousState; // Return data, let App handle loading
    }

    redo() {
        if (this.future.length === 0) return null;

        // Save current state to history before redoing
        const currentState = JSON.parse(this.circuit.toJSON());
        this.history.push(currentState);

        const nextState = this.future.pop();
        return nextState;
    }
}
