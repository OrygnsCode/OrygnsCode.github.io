import { Viewer } from './viewer.js';
import { UI } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('viewer-canvas');
    const viewer = new Viewer(canvas);
    const ui = new UI(viewer);
});
