// Professional Audio System for Billiards
class BilliardsAudio {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.3;
        this.sounds = {};

        this.initializeAudio();
        this.createSounds();
    }

    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 Audio system initialized');
        } catch (error) {
            console.warn('Audio not supported:', error);
            this.enabled = false;
        }
    }

    resumeAudio() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    createSounds() {
        if (!this.enabled) return;

        this.soundParameters = {
            cueStrike: {
                frequency: 200,
                duration: 0.15,
                type: 'square',
                volume: 0.4
            },
            ballCollision: {
                frequency: 400,
                duration: 0.1,
                type: 'triangle',
                volume: 0.3
            },
            wallBounce: {
                frequency: 300,
                duration: 0.08,
                type: 'sawtooth',
                volume: 0.25
            },
            ballSink: {
                frequency: 600,
                duration: 0.5,
                type: 'sine',
                volume: 0.35
            }
        };
    }

    playCueStrikeSound(power) {
        this.playParametricSound('cueStrike', power / 100);
    }

    playCollisionSound(speed) {
        this.playParametricSound('ballCollision', Math.min(speed / 20, 1));
    }

    playWallBounceSound(speed) {
        this.playParametricSound('wallBounce', Math.min(speed / 15, 1));
    }

    playSound(soundType) {
        this.playParametricSound(soundType, 1);
    }

    playParametricSound(soundType, intensity = 1) {
        if (!this.enabled || !this.audioContext) return;

        const params = this.soundParameters[soundType];
        if (!params) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = params.type;
            oscillator.frequency.setValueAtTime(params.frequency * (0.8 + intensity * 0.4), this.audioContext.currentTime);

            const volume = params.volume * intensity * this.volume;
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + params.duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + params.duration);
        } catch (error) {
            console.warn('Audio playback error:', error);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BilliardsAudio;
}
