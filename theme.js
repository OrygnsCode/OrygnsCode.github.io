document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const body = document.body;

    // Function to apply the theme and update button text + localStorage
    function applyTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            themeToggleButton.textContent = 'Switch to Light Mode';
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            themeToggleButton.textContent = 'Switch to Dark Mode';
            localStorage.setItem('theme', 'light');
        }
    }

    // Initialize theme based on localStorage or default to light
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        applyTheme(currentTheme);
    } else {
        // Default to light theme if nothing is stored
        // Check if the system prefers dark mode first, if possible, else default to light.
        // For this iteration, we'll default to light directly.
        applyTheme('light');
    }

    // Event listener for the toggle button
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            // Determine the new theme
            const isDarkMode = body.classList.contains('dark-mode');
            if (isDarkMode) {
                applyTheme('light'); // Switch to light
            } else {
                applyTheme('dark');  // Switch to dark
            }
        });
    } else {
        console.error('Theme toggle button not found!');
    }
});
