import { Viewer } from './viewer.js';

export class UI {
    constructor(viewer) {
        this.viewer = viewer;

        // Elements
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.btnOpen = document.getElementById('btn-open');

        // Info
        this.infoFile = document.getElementById('info-filename');
        this.infoSize = document.getElementById('info-size');
        this.infoVerts = document.getElementById('info-vertices');
        this.infoTris = document.getElementById('info-triangles');

        // Controls
        this.animSelect = document.getElementById('anim-select');
        this.btnPlay = document.getElementById('btn-play');
        this.animSlider = document.getElementById('anim-slider');
        this.animSpeed = document.getElementById('anim-speed');

        this.exposureSlider = document.getElementById('exposure-slider');
        this.btnWireframe = document.getElementById('btn-wireframe');
        this.btnGrid = document.getElementById('btn-grid');
        this.btnRotate = document.getElementById('btn-auto-rotate');

        // State
        this.isPlaying = true;
        this.isScrubbing = false;

        this.initEvents();
        this.startLoop();
    }

    initEvents() {
        // Drag & Drop
        window.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('hidden');
            this.dropZone.classList.add('active');
        });

        this.dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('active');
            this.dropZone.classList.add('hidden');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('active');
            this.dropZone.classList.add('hidden');

            if (e.dataTransfer.files.length > 0) {
                this.handleFile(e.dataTransfer.files[0]);
            }
        });

        // File Input
        this.btnOpen.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });

        // Camera Presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.viewer.resetCamera(btn.dataset.view);
            });
        });

        // Zoom Controls
        document.getElementById('btn-zoom-in').addEventListener('click', () => {
            this.viewer.zoomCamera(1);
        });

        document.getElementById('btn-zoom-out').addEventListener('click', () => {
            this.viewer.zoomCamera(-1);
        });

        // Animation Controls
        this.animSelect.addEventListener('change', (e) => {
            this.viewer.playAnimation(e.target.value);
            this.isPlaying = true;
            this.updatePlayButton();
        });

        this.btnPlay.addEventListener('click', () => {
            this.isPlaying = !this.isPlaying;
            this.viewer.pauseAnimation(!this.isPlaying);
            this.updatePlayButton();
        });

        this.animSlider.addEventListener('mousedown', () => {
            this.isScrubbing = true;
            this.viewer.pauseAnimation(true);
        });

        this.animSlider.addEventListener('input', (e) => {
            const pct = parseFloat(e.target.value) / 100;
            this.viewer.setAnimationTime(pct);
        });

        this.animSlider.addEventListener('mouseup', () => {
            this.isScrubbing = false;
            if (this.isPlaying) this.viewer.pauseAnimation(false);
        });

        this.animSpeed.addEventListener('change', (e) => {
            this.viewer.setPlaybackSpeed(parseFloat(e.target.value));
        });

        // Visuals
        this.exposureSlider.addEventListener('input', (e) => {
            this.viewer.setExposure(parseFloat(e.target.value));
        });

        this.btnWireframe.addEventListener('click', () => {
            this.btnWireframe.classList.toggle('active');
            this.viewer.toggleWireframe(this.btnWireframe.classList.contains('active'));
        });

        this.btnGrid.addEventListener('click', () => {
            this.btnGrid.classList.toggle('active');
            this.viewer.toggleGrid(this.btnGrid.classList.contains('active'));
        });

        this.btnRotate.addEventListener('click', () => {
            this.btnRotate.classList.toggle('active');
            this.viewer.toggleAutoRotate(this.btnRotate.classList.contains('active'));
        });
    }

    async handleFile(file) {
        if (!file) return;

        const extension = file.name.split('.').pop().toLowerCase();

        try {
            this.infoFile.textContent = 'Loading...';
            const result = await this.viewer.loadModel(file, extension);

            // Update Info
            this.infoFile.textContent = file.name;
            this.infoSize.textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';

            const stats = this.viewer.getStats();
            this.infoVerts.textContent = stats.vertices.toLocaleString();
            this.infoTris.textContent = stats.triangles.toLocaleString();

            // Update Animations
            this.updateAnimationList(result.animations);

        } catch (error) {
            console.error(error);
            this.infoFile.textContent = 'Error';
            alert('Failed to load model: ' + error.message);
        }
    }

    updateInfo(file) {
        this.infoFile.textContent = file.name;
        this.infoSize.textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
    }

    updateStats() {
        const stats = this.viewer.getStats();
        this.infoVerts.textContent = stats.vertices.toLocaleString();
        this.infoTris.textContent = stats.triangles.toLocaleString();
    }

    updateAnimationList(animations) {
        if (animations && animations.length > 0) {
            this.animSelect.disabled = false;
            this.btnPlay.disabled = false;
            this.animSlider.disabled = false;
            this.animSpeed.disabled = false;

            this.animSelect.innerHTML = '';
            animations.forEach(clip => {
                const option = document.createElement('option');
                option.value = clip.name;
                option.textContent = clip.name;
                this.animSelect.appendChild(option);
            });

            this.isPlaying = true;
            this.updatePlayButton();
        } else {
            this.animSelect.disabled = true;
            this.btnPlay.disabled = true;
            this.animSlider.disabled = true;
            this.animSpeed.disabled = true;
            this.isPlaying = false;
            this.updatePlayButton();
        }
    }

    updatePlayButton() {
        this.btnPlay.innerHTML = this.isPlaying
            ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>'
            : '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
    }

    startLoop() {
        const update = () => {
            if (!this.isScrubbing && this.isPlaying) {
                const progress = this.viewer.getAnimationProgress();
                this.animSlider.value = progress * 100;
            }
            requestAnimationFrame(update);
        };
        update();
    }
}
