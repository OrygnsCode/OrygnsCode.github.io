document.addEventListener('DOMContentLoaded', () => {
    const themeSwitchContainer = document.getElementById('theme-switch-container');
    // Sun and Moon icons are typically controlled by CSS based on body.dark-mode,
    // so direct manipulation might not be needed unless for animations/transitions beyond CSS.
    // const sunIcon = document.getElementById('sun-icon');
    // const moonIcon = document.getElementById('moon-icon');
    const body = document.body;

    // Function to apply the theme and update localStorage
    // CSS will handle showing/hiding the correct icon.
    function applyTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    }

    // Initialize theme based on localStorage or default to light
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        applyTheme(currentTheme); // This will set body class, CSS handles icon visibility
    } else {
        // Default to light theme if nothing is stored.
        // Body by default does not have .dark-mode, so sun icon will show.
        // We should still store 'light' as the preference.
        applyTheme('light');
    }

    // Event listener for the theme switch container
    if (themeSwitchContainer) {
        themeSwitchContainer.addEventListener('click', () => {
            // Determine the new theme
            const isDarkMode = body.classList.contains('dark-mode');
            if (isDarkMode) {
                applyTheme('light'); // Switch to light
            } else {
                applyTheme('dark');  // Switch to dark
            }
        });
    } else {
        console.error('Theme switch container not found!');
    }
});
