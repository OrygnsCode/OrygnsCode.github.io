// Main Application Controller
class OrygnsCodeApp {
    constructor() {
        this.isLoaded = false;
        this.currentTheme = localStorage.getItem('theme') || 'dark';

        // Ensure DOM is ready before initialization
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
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
                if (typeof gsap !== 'undefined') {
                    gsap.to(themeToggle, {
                        scale: 0.9,
                        duration: 0.1,
                        yoyo: true,
                        repeat: 1,
                        ease: 'power2.inOut'
                    });
                }
            });
        }
    }

    initNavigation() {
        // Handle mobile menu toggle
        this.setupMobileMenu();
    }

    setupMobileMenu() {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');

        if (!navToggle || !navMenu) return;

        navToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const isActive = navMenu.classList.contains('active');

            if (isActive) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                document.body.style.overflow = '';
            } else {
                navMenu.classList.add('active');
                navToggle.classList.add('active');
                document.body.style.overflow = 'hidden';
            }

            // Animate hamburger menu
            this.animateHamburger(navToggle, !isActive);
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('active') && 
                !navMenu.contains(e.target) && 
                !navToggle.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Close menu on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                this.closeMobileMenu();
            }
        });
    }

    closeMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        const navToggle = document.getElementById('nav-toggle');

        if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            if (navToggle) navToggle.classList.remove('active');
            document.body.style.overflow = '';
            if (navToggle) this.animateHamburger(navToggle, false);
        }
    }

    animateHamburger(navToggle, isActive) {
        const spans = navToggle.querySelectorAll('span');
        if (spans.length >= 3 && typeof gsap !== 'undefined') {
            if (isActive) {
                gsap.to(spans[0], { rotation: 45, y: 7, duration: 0.3, ease: 'power2.inOut' });
                gsap.to(spans[1], { opacity: 0, duration: 0.2 });
                gsap.to(spans[2], { rotation: -45, y: -7, duration: 0.3, ease: 'power2.inOut' });
            } else {
                gsap.to(spans[0], { rotation: 0, y: 0, duration: 0.3, ease: 'power2.inOut' });
                gsap.to(spans[1], { opacity: 1, duration: 0.2 });
                gsap.to(spans[2], { rotation: 0, y: 0, duration: 0.3, ease: 'power2.inOut' });
            }
        }
    }

    initScrollEffects() {
        // Parallax effect for hero section
        const parallaxElements = document.querySelectorAll('.floating-cards');

        if (parallaxElements.length > 0 && typeof gsap !== 'undefined') {
            window.addEventListener('scroll', this.throttle(() => {
                const scrolled = window.pageYOffset;
                parallaxElements.forEach(element => {
                    const speed = 0.05;
                    if (element && scrolled < window.innerHeight) {
                        gsap.set(element, {
                            y: scrolled * speed
                        });
                    }
                });
            }, 16));
        }

        // Enhanced navigation scroll behavior
        const nav = document.querySelector('.main-nav');
        let lastScrollY = 0;
        let ticking = false;

        if (nav) {
            const updateNav = () => {
                const scrollY = window.pageYOffset;

                if (scrollY > 50) {
                    nav.classList.add('scrolled');
                } else {
                    nav.classList.remove('scrolled');
                }

                if (scrollY > 200) {
                    nav.classList.add('minimized');
                } else {
                    nav.classList.remove('minimized');
                }

                lastScrollY = scrollY;
                ticking = false;
            };

            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(updateNav);
                    ticking = true;
                }
            });
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
                if (!messageElement || !document.body.contains(messageElement)) {
                    return;
                }

                if (typeof gsap !== 'undefined') {
                    gsap.to(messageElement, {
                        opacity: 0,
                        duration: 0.3,
                        onComplete: () => {
                            if (messageElement && messages[currentIndex]) {
                                messageElement.textContent = messages[currentIndex];
                                currentIndex = (currentIndex + 1) % messages.length;

                                gsap.to(messageElement, {
                                    opacity: 1,
                                    duration: 0.3
                                });
                            }
                        }
                    });
                } else {
                    messageElement.style.opacity = '0';
                    setTimeout(() => {
                        if (messageElement && messages[currentIndex]) {
                            messageElement.textContent = messages[currentIndex];
                            currentIndex = (currentIndex + 1) % messages.length;
                            messageElement.style.opacity = '1';
                        }
                    }, 300);
                }
            };

            if (messages[0]) {
                messageElement.textContent = messages[0];
                currentIndex = 1;
            }

            setInterval(updateMessage, 4000);
        }
    }

    initParticleEffects() {
        if (this.reducedParticleEffects || window.innerWidth <= 768) {
            return;
        }

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
                size: Math.random() * 2 + 0.5,
                opacity: 1,
                vx: (Math.random() - 0.5) * 1,
                vy: (Math.random() - 0.5) * 1,
                life: 20
            });
        };

        const updateParticles = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles = particles.filter(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.opacity -= 1 / particle.life;
                particle.size *= 0.99;

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

            if (Math.random() > 0.9) {
                createParticle(mouse.x, mouse.y);
            }
        });

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        updateParticles();
    }

    initPerformanceOptimizations() {
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

        this.initMobileOptimizations();
        this.preloadResources();
    }

    initMobileOptimizations() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isSmallScreen = window.innerWidth <= 768;

        if (isMobile || isSmallScreen) {
            document.body.classList.add('is-mobile');

            document.querySelectorAll('.floating-cards').forEach(element => {
                element.style.transform = 'none';
            });

            this.reducedParticleEffects = true;

            document.addEventListener('touchstart', () => {}, { passive: true });
            document.addEventListener('touchmove', () => {}, { passive: true });
        }

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);

                this.closeMobileMenu();
            }, 100);
        });

        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    preloadResources() {
        const criticalImages = [];
        criticalImages.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

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
let app;

function initializeApp() {
    if (!app) {
        app = new OrygnsCodeApp();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
