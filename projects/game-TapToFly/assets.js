/**
 * Audio Manager
 * Handles sound effects using Web Audio API
 */
class AudioManager {
    constructor() {
        this.context = null;
        this.sounds = {};
        this.enabled = true;

        // Initialize on first user interaction
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;

            // Create simple sound effects
            this.createSounds();
        } catch (e) {
            console.warn('Web Audio API not supported', e);
            this.enabled = false;
        }
    }

    createSounds() {
        // These are simple synthesized sounds
        this.sounds = {
            flap: () => this.playTone(400, 0.1, 'sine'),
            point: () => this.playTone(800, 0.15, 'square'),
            hit: () => this.playTone(150, 0.3, 'sawtooth')
        };
    }

    playTone(frequency, duration, type = 'sine') {
        if (!this.enabled || !this.context) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
    }

    play(soundName) {
        if (!this.enabled) return;

        this.init(); // Ensure initialized

        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }
}

// Global audio manager
window.audioManager = new AudioManager();
