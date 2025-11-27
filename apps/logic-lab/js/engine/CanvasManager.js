/**
 * Canvas Manager
 * Handles rendering, grid, pan/zoom, and input events.
 */
import { snapToGrid } from '../utils/math.js';

export class CanvasManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Viewport State
        this.scale = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;

        // Interaction State
        this.isDraggingCanvas = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // Grid Settings
        this.gridSize = 20;
        this.gridColor = '#2a2a2a';
        this.gridMajorColor = '#3a3a3a';

        this.setupEventListeners();
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());

        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    handleWheel(e) {
        e.preventDefault();

        const zoomIntensity = 0.1;
        const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;
        const newScale = Math.min(Math.max(0.1, this.scale + delta), 5);

        // Zoom towards mouse pointer
        const mouseX = e.clientX - this.canvas.offsetLeft;
        const mouseY = e.clientY - this.canvas.offsetTop;

        const worldX = (mouseX - this.offsetX) / this.scale;
        const worldY = (mouseY - this.offsetY) / this.scale;

        this.offsetX = mouseX - worldX * newScale;
        this.offsetY = mouseY - worldY * newScale;
        this.scale = newScale;

        // Update UI
        document.getElementById('zoom-level').textContent = `${Math.round(this.scale * 100)}%`;
    }

    handleMouseDown(e) {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            // Middle mouse or Alt+Left Click to pan
            this.isDraggingCanvas = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        }
    }

    handleMouseMove(e) {
        if (this.isDraggingCanvas) {
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;

            this.offsetX += dx;
            this.offsetY += dy;

            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        }

        // Update coordinates UI
        const worldX = Math.round((e.clientX - this.offsetX) / this.scale);
        const worldY = Math.round((e.clientY - this.offsetY) / this.scale);
        document.getElementById('coords').textContent = `${worldX}, ${worldY}`;
    }

    handleMouseUp(e) {
        this.isDraggingCanvas = false;
        this.canvas.style.cursor = 'crosshair';
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#0f0f12'; // Background color
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderGrid() {
        this.ctx.save();
        this.ctx.lineWidth = 1;

        const startX = Math.floor(-this.offsetX / this.scale / this.gridSize) * this.gridSize;
        const startY = Math.floor(-this.offsetY / this.scale / this.gridSize) * this.gridSize;

        const endX = startX + (this.canvas.width / this.scale) + this.gridSize;
        const endY = startY + (this.canvas.height / this.scale) + this.gridSize;

        this.ctx.beginPath();

        for (let x = startX; x < endX; x += this.gridSize) {
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
        }

        for (let y = startY; y < endY; y += this.gridSize) {
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
        }

        this.ctx.strokeStyle = this.gridColor;
        this.ctx.stroke();

        // Major grid lines (every 5 cells)
        this.ctx.beginPath();
        const majorGridSize = this.gridSize * 5;

        const majorStartX = Math.floor(startX / majorGridSize) * majorGridSize;
        const majorStartY = Math.floor(startY / majorGridSize) * majorGridSize;

        for (let x = majorStartX; x < endX; x += majorGridSize) {
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
        }

        for (let y = majorStartY; y < endY; y += majorGridSize) {
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
        }

        this.ctx.strokeStyle = this.gridMajorColor;
        this.ctx.stroke();

        this.ctx.restore();
    }

    beginFrame() {
        this.clear();
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);
        this.renderGrid();
    }

    endFrame() {
        this.ctx.restore();
    }
}
