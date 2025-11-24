// Main Application Logic

document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    setupNavigation();
    updateYear();
    initTypewriter();
});

// Load Projects from JSON
async function loadProjects() {
    try {
        const response = await fetch('projects.json');
        const projects = await response.json();
        renderProjects(projects);
        setupFilters(projects);
    } catch (error) {
        console.error('Error loading projects:', error);
        document.getElementById('projects-grid').innerHTML = '<p>Failed to load projects.</p>';
    }
}

// Render Project Cards
function renderProjects(projects) {
    const grid = document.getElementById('projects-grid');
    grid.innerHTML = '';

    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.dataset.category = project.category; // For filtering

        // Use a placeholder if image is missing or just use the path provided
        // We'll assume the path in JSON is relative to root
        const imgPath = project.image || 'assets/placeholder.jpg';

        card.innerHTML = `
            <div class="card-image" style="background-image: url('${imgPath}');"></div>
            <div class="card-content">
                <span class="card-category">${project.category}</span>
                <h3 class="card-title">${project.title}</h3>
                <p class="card-desc">${project.description}</p>
                <a href="${project.path}" class="card-link">
                    View Project 
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </a>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Setup Filters
function setupFilters(projects) {
    const buttons = document.querySelectorAll('.filter-btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            buttons.forEach(b => b.classList.remove('active'));
            // Add to clicked
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            if (filter === 'all') {
                renderProjects(projects);
            } else {
                const filtered = projects.filter(p => p.category === filter);
                renderProjects(filtered);
            }
        });
    });
}

// Navigation & Mobile Menu
function setupNavigation() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            navLinks.classList.remove('active'); // Close menu on click

            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
}

// Update Copyright Year
function updateYear() {
    document.getElementById('year').textContent = new Date().getFullYear();
}

// Typewriter Effect
function initTypewriter() {
    const typewriterText = document.getElementById('typewriter-text');
    if (!typewriterText) return;

    const phrases = [
        "Future Ready",
        "Code Driven",
        "System Online",
        "Deploying Ideas"
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function type() {
        const currentPhrase = phrases[phraseIndex];

        if (isDeleting) {
            typewriterText.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50;
        } else {
            typewriterText.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100;
        }

        if (!isDeleting && charIndex === currentPhrase.length) {
            isDeleting = true;
            typeSpeed = 2000;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typeSpeed = 500;
        }

        setTimeout(type, typeSpeed);
    }

    type();
}
