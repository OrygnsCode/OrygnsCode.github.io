// Main Application Controller
class OrygnsCodeApp {
    constructor() {
        this.isLoaded = false;
        this.currentTheme = localStorage.getItem('theme') || 'dark';

        this.init();
    }

    init() {
        this.initTheme();
        this.initNavigation();
        this.initScrollEffects();
        this.initDynamicMessages();
        this.initParticleEffects();
        this.initPerformanceOptimizations();

        // Mark as loaded after initialization
        setTimeout(() => {
            this.isLoaded = true;
            document.body.classList.add('app-loaded');
        }, 100);
    }

    initTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        const body = document.body;

        // Apply saved theme
        if (this.currentTheme === 'light') {
            body.classList.add('light-theme');
        }

        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                body.classList.toggle('light-theme');
                this.currentTheme = body.classList.contains('light-theme') ? 'light' : 'dark';
                localStorage.setItem('theme', this.currentTheme);

                // Dispatch theme change event for Three.js background
                document.dispatchEvent(new CustomEvent('themeChange', {
                    detail: { theme: this.currentTheme }
                }));

                // Animate theme toggle
                gsap.to(themeToggle, {
                    scale: 0.9,
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1,
                    ease: 'power2.inOut'
                });
            });
        }
    }

    initNavigation() {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        const navLinks = document.querySelectorAll('.nav-link');

        // Mobile menu toggle
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');

                // Animate hamburger menu
                const spans = navToggle.querySelectorAll('span');
                if (navToggle.classList.contains('active')) {
                    gsap.to(spans[0], { rotation: 45, y: 6, duration: 0.3 });
                    gsap.to(spans[1], { opacity: 0, duration: 0.2 });
                    gsap.to(spans[2], { rotation: -45, y: -6, duration: 0.3 });
                } else {
                    gsap.to(spans[0], { rotation: 0, y: 0, duration: 0.3 });
                    gsap.to(spans[1], { opacity: 1, duration: 0.2 });
                    gsap.to(spans[2], { rotation: 0, y: 0, duration: 0.3 });
                }
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                    const spans = navToggle.querySelectorAll('span');
                    gsap.to(spans[0], { rotation: 0, y: 0, duration: 0.3 });
                    gsap.to(spans[1], { opacity: 1, duration: 0.2 });
                    gsap.to(spans[2], { rotation: 0, y: 0, duration: 0.3 });
                }
            });
        }

        // Smooth scrolling for nav links
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');

                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    const target = document.getElementById(targetId);

                    if (target) {
                        const navHeight = document.querySelector('.main-nav').offsetHeight;
                        const targetPosition = target.offsetTop - navHeight - 20;

                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });

                        // Update active nav link immediately
                        navLinks.forEach(l => l.classList.remove('active'));
                        link.classList.add('active');

                        // Close mobile menu
                        if (navMenu && navMenu.classList.contains('active')) {
                            navMenu.classList.remove('active');
                            navToggle.classList.remove('active');
                            const spans = navToggle.querySelectorAll('span');
                            gsap.to(spans[0], { rotation: 0, y: 0, duration: 0.3 });
                            gsap.to(spans[1], { opacity: 1, duration: 0.2 });
                            gsap.to(spans[2], { rotation: 0, y: 0, duration: 0.3 });
                        }
                    }
                }
            });
        });

        // Update active nav link on scroll
        this.initScrollSpy();
    }

    initScrollSpy() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

        if (sections.length === 0 || navLinks.length === 0) return;

        const observerOptions = {
            threshold: 0.3,
            rootMargin: '-80px 0px -80px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            let activeSection = null;
            let maxRatio = 0;

            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
                    maxRatio = entry.intersectionRatio;
                    activeSection = entry.target;
                }
            });

            if (activeSection) {
                const activeLink = document.querySelector(`.nav-link[href="#${activeSection.id}"]`);
                navLinks.forEach(link => link.classList.remove('active'));
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        }, observerOptions);

        sections.forEach(section => {
            if (section) observer.observe(section);
        });

        // Handle scroll to top case
        window.addEventListener('scroll', this.throttle(() => {
            if (window.scrollY < 100) {
                navLinks.forEach(link => link.classList.remove('active'));
                const homeLink = document.querySelector('.nav-link[href="#hero"]');
                if (homeLink) homeLink.classList.add('active');
            }
        }, 100));
    }

    initScrollEffects() {
        // Parallax effect for hero section (reduced to prevent issues)
        const parallaxElements = document.querySelectorAll('.floating-cards');

        if (parallaxElements.length > 0) {
            window.addEventListener('scroll', this.throttle(() => {
                const scrolled = window.pageYOffset;
                parallaxElements.forEach(element => {
                    const speed = 0.1; // Reduced speed to prevent disappearing
                    if (element && scrolled < window.innerHeight) {
                        gsap.set(element, {
                            y: scrolled * speed
                        });
                    }
                });
            }, 16));
        }

        // Navigation background on scroll
        const nav = document.querySelector('.main-nav');
        if (nav) {
            window.addEventListener('scroll', this.throttle(() => {
                if (window.scrollY > 100) {
                    nav.classList.add('scrolled');
                } else {
                    nav.classList.remove('scrolled');
                }
            }, 16));
        }
    }

    initDynamicMessages() {
        const messageElement = document.getElementById('dynamic-message');

        if (messageElement) {
            const messages = [
                "Deploying... hopefully not on Friday.",
                "TODO: Fix the universe.",
                "Warning: May contain undefined behavior.",
                "Tip: Don't forget the semicolon.",
                "Compiling dreams into reality.",
                "Temporary fix — don't ask",
                "Works on my machine.",
                "Error 418: I'm a teapot.",
                "Debug mode: Eternal.",
                "Feature or bug? You decide.",
                "Insert witty comment here.",
                "Hacky but functional",
                "Console.log(\"Trust the process\");",
                "Don't touch this line. Seriously.",
                "If you're reading this, you're the QA now.",
                "Escaped the loop... for now.",
                "AI-generated, human-approved.",
                "try { enjoySite(); } catch(e) { panic(); }",
                "Deprecated but still vibing.",
                "From Orygn: Good luck out there."
            ];

            let currentIndex = 0;

            const updateMessage = () => {
                gsap.to(messageElement, {
                    opacity: 0,
                    duration: 0.3,
                    onComplete: () => {
                        messageElement.textContent = messages[currentIndex];
                        currentIndex = (currentIndex + 1) % messages.length;

                        gsap.to(messageElement, {
                            opacity: 1,
                            duration: 0.3
                        });
                    }
                });
            };

            // Initial message
            messageElement.textContent = messages[0];
            currentIndex = 1;

            // Update every 4 seconds
            setInterval(updateMessage, 4000);
        }
    }

    initParticleEffects() {
        // Create cursor trail effect
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999;
        `;

        document.body.appendChild(canvas);

        let particles = [];
        let mouse = { x: 0, y: 0 };

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const createParticle = (x, y) => {
            particles.push({
                x: x,
                y: y,
                size: Math.random() * 3 + 1,
                opacity: 1,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 30
            });
        };

        const updateParticles = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles = particles.filter(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.opacity -= 1 / particle.life;
                particle.size *= 0.98;

                if (particle.opacity > 0) {
                    ctx.globalAlpha = particle.opacity;
                    ctx.fillStyle = this.currentTheme === 'light' ? '#0066ff' : '#00f5ff';
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                    return true;
                }
                return false;
            });

            requestAnimationFrame(updateParticles);
        };

        document.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;

            if (Math.random() > 0.8) {
                createParticle(mouse.x, mouse.y);
            }
        });

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        updateParticles();
    }

    initPerformanceOptimizations() {
        // Lazy load images
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));

        // Debounce scroll events
        let scrollTimeout;
        const originalScrollHandler = window.onscroll;

        window.onscroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (originalScrollHandler) {
                    originalScrollHandler();
                }
            }, 16); // ~60fps
        };

        // Preload critical resources
        this.preloadResources();
    }

    preloadResources() {
        const criticalImages = [
            // Add any critical images here
        ];

        criticalImages.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    // Utility methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new OrygnsCodeApp();
});

// Service Worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
