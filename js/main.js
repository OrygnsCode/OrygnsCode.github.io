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
        // Register GSAP plugins if available
        if (typeof gsap !== 'undefined') {
            // Try to register ScrollToPlugin if available
            if (typeof ScrollToPlugin !== 'undefined') {
                gsap.registerPlugin(ScrollToPlugin);
                console.log('GSAP ScrollToPlugin registered successfully');
            } else {
                console.warn('ScrollToPlugin not available, using fallback scrolling');
            }
        }

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
            themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

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
        // Handle navigation link active states
        this.handleNavActiveStates();
        // Add smooth scrolling to navigation links
        this.setupSmoothScrolling();

        // Initialize sticky navigation
        this.initStickyNav();
    }

    initStickyNav() {
        const nav = document.querySelector('.main-nav');
        const heroSection = document.querySelector('.hero-section');

        if (!nav || !heroSection) return;

        const updateNav = () => {
            const scrollY = window.scrollY || window.pageYOffset;
            const heroHeight = heroSection.offsetHeight;
            const triggerPoint = 100; // Make it sticky sooner, after 100px scroll

            if (scrollY > triggerPoint) {
                nav.classList.add('scrolled');
                nav.classList.remove('hero-mode');
            } else {
                nav.classList.remove('scrolled');
                nav.classList.add('hero-mode');
            }

            // Minimized state logic removed to keep full navbar visible
            // if (scrollY > heroHeight) {
            //     nav.classList.add('minimized');
            // } else {
            //     nav.classList.remove('minimized');
            // }
        };

        window.addEventListener('scroll', () => {
            requestAnimationFrame(updateNav);
        });

        // Initial check
        updateNav();
    }

    handleNavActiveStates() {
        const sections = document.querySelectorAll('section[id], .hero-section');
        const navLinks = document.querySelectorAll('.nav-link[data-section]');

        if (sections.length === 0 || navLinks.length === 0) return;

        const observerOptions = {
            threshold: 0.2,
            rootMargin: '-100px 0px -50% 0px' // Offset for sticky header
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id || 'hero';
                    this.updateActiveNavLink(sectionId);
                }
            });
        }, observerOptions);

        sections.forEach(section => {
            observer.observe(section);
        });
    }

    updateActiveNavLink(activeId) {
        const navLinks = document.querySelectorAll('.nav-link[data-section]');

        navLinks.forEach(link => {
            const targetId = link.getAttribute('data-section');
            if (targetId === activeId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    setupSmoothScrolling() {
        const navLinks = document.querySelectorAll('.nav-link[data-section], .btn[href^="#"]');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-section') || link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId) ||
                    (targetId === 'hero' ? document.querySelector('.hero-section') : null);

                if (targetElement) {
                    // Close mobile menu if open
                    this.closeMobileMenu();

                    // Calculate header offset dynamically
                    const nav = document.querySelector('.main-nav');
                    const navHeight = nav ? nav.offsetHeight : 80;

                    // Get precise position
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - navHeight;

                    // Smooth scroll
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

                    // Update URL hash without jumping
                    history.pushState(null, null, `#${targetId}`);
                }
            });
        });
    }

    // ... (keeping setupMobileMenu and other methods)

    initScrollEffects() {
        // Enhanced parallax system with multiple layers
        const parallaxElements = document.querySelectorAll('.floating-cards');
        const heroContent = document.querySelector('.hero-content');
        const heroTitle = document.querySelector('.hero-title');

        if (parallaxElements.length > 0 && typeof gsap !== 'undefined') {
            window.addEventListener('scroll', this.throttle(() => {
                try {
                    const scrolled = window.pageYOffset;
                    const windowHeight = window.innerHeight;

                    // Multi-layer parallax effect
                    parallaxElements.forEach((element, index) => {
                        const speed = 0.03 + (index * 0.02);
                        if (element && scrolled < windowHeight) {
                            gsap.set(element, {
                                y: scrolled * speed,
                                rotationY: scrolled * 0.01,
                                opacity: 1 - (scrolled / windowHeight) * 0.5
                            });
                        }
                    });

                    // Hero content fade effect
                    if (heroContent && scrolled < windowHeight) {
                        const fadeAmount = Math.min(scrolled / (windowHeight * 0.6), 1);
                        gsap.set(heroContent, {
                            opacity: 1 - fadeAmount,
                            y: scrolled * 0.3,
                            scale: 1 - fadeAmount * 0.1
                        });
                    }

                    // Hero title perspective effect
                    if (heroTitle && scrolled < windowHeight) {
                        gsap.set(heroTitle, {
                            rotationX: scrolled * 0.02,
                            z: scrolled * 0.1
                        });
                    }
                } catch (error) {
                    console.warn('Parallax animation error:', error);
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

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                console.warn('Canvas context not available');
                return;
            }

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
                try {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    particles = particles.filter(particle => {
                        particle.x += particle.vx;
                        particle.y += particle.vy;
                        particle.opacity -= 1 / particle.life;
                        particle.size *= 0.99;

                        if (particle.opacity <= 0) return false;

                        ctx.save();
                        ctx.globalAlpha = particle.opacity;
                        ctx.fillStyle = '#00f5ff';
                        ctx.beginPath();
                        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();

                        return true;
                    });

                    requestAnimationFrame(updateParticles);
                } catch (error) {
                    console.warn('Particle update error:', error);
                }
            };

            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);

            document.addEventListener('mousemove', (e) => {
                mouse.x = e.clientX;
                mouse.y = e.clientY;
                if (Math.random() < 0.1) {
                    createParticle(mouse.x, mouse.y);
                }
            });

            updateParticles();
        } catch (error) {
            console.warn('Particle effects initialization error:', error);
        }
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

            document.addEventListener('touchstart', () => { }, { passive: true });
            document.addEventListener('touchmove', () => { }, { passive: true });
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
        return function () {
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
