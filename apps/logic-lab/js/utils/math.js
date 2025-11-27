/**
 * Math utilities for Logic Lab
 */

export const snapToGrid = (value, gridSize = 20) => {
    return Math.round(value / gridSize) * gridSize;
};

export const dist = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

export const clamp = (val, min, max) => {
    return Math.min(Math.max(val, min), max);
};

export const isPointInRect = (px, py, rx, ry, rw, rh) => {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
};
