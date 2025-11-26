/**
 * Introductory Loading Animation
 * Handles the one-time split-screen animation on initial site load.
 */

document.addEventListener('DOMContentLoaded', () => {
    initLoader();
});

function initLoader() {
    const loaderOverlay = document.querySelector('.loader-overlay');

    // Safety check: if loader doesn't exist in DOM, exit
    if (!loaderOverlay) return;

    // Always play animation

    // 1. Ensure loader is visible and active
    loaderOverlay.classList.add('active');

    // 2. Wait a brief moment for the page to render/settle, then trigger split
    // Using window.onload to ensure heavy assets (like Three.js) have started initializing
    window.addEventListener('load', () => {
        setTimeout(() => {
            loaderOverlay.classList.add('loaded');

            // Optional: Remove from DOM after animation completes to free up memory
            setTimeout(() => {
                loaderOverlay.remove();
            }, 2000); // 1.2s transform + buffer
        }, 800); // Slightly longer delay for visual impact
    });
}
