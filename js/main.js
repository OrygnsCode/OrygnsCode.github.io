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
        this.initSmoothScrolling();
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
        // Handle navigation link active states
        this.handleNavActiveStates();
    }

    initSmoothScrolling() {
        // Handle smooth scrolling for navigation links
        const navLinks = document.querySelectorAll('.nav-link[data-section]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-section');
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    // Close mobile menu if open
                    this.closeMobileMenu();
                    
                    // Smooth scroll to target
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    // Update active state
                    this.updateActiveNavLink(targetId);
                } else {
                    console.warn('Target element not found:', targetId);
                }
            });
        });
    }

    handleNavActiveStates() {
        // Update active navigation link based on scroll position
        const sections = document.querySelectorAll('section[id], .hero-section');
        const navLinks = document.querySelectorAll('.nav-link[data-section]');

        if (sections.length === 0 || navLinks.length === 0) return;

        const observerOptions = {
            threshold: 0.3,
            rootMargin: '-80px 0px -50% 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    this.updateActiveNavLink(sectionId);
                }
            });
        }, observerOptions);

        sections.forEach(section => {
            if (section.id) {
                observer.observe(section);
            }
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

        // Advanced navigation scroll behavior with sophisticated transitions
        const nav = document.querySelector('.main-nav');
        const heroSection = document.querySelector('.hero-section');
        let lastScrollY = 0;
        let ticking = false;
        let navState = 'hero'; // 'hero', 'scrolled', 'minimized'

        if (nav && heroSection) {
            const updateNav = () => {
                const scrollY = window.pageYOffset;
                const heroHeight = heroSection.offsetHeight;
                const windowHeight = window.innerHeight;
                
                // Calculate scroll progress
                const heroScrollProgress = Math.min(scrollY / (windowHeight * 0.3), 1);
                const minimizedThreshold = heroHeight - (windowHeight * 0.2);

                // State transitions with smooth animations
                if (scrollY < 50) {
                    if (navState !== 'hero') {
                        this.transitionNavState('hero', nav);
                        navState = 'hero';
                    }
                } else if (scrollY < minimizedThreshold) {
                    if (navState !== 'scrolled') {
                        this.transitionNavState('scrolled', nav);
                        navState = 'scrolled';
                    }
                } else {
                    if (navState !== 'minimized') {
                        this.transitionNavState('minimized', nav);
                        navState = 'minimized';
                    }
                }

                // Dynamic background blur based on scroll speed
                const scrollSpeed = Math.abs(scrollY - lastScrollY);
                const blurAmount = Math.min(scrollSpeed * 0.5, 10);
                
                if (typeof gsap !== 'undefined' && scrollY > 50) {
                    gsap.set(nav, {
                        backdropFilter: `blur(${20 + blurAmount}px) saturate(${150 + scrollSpeed * 2}%)`
                    });
                }

                // Parallax effect for navigation background
                if (scrollY > 0) {
                    const parallaxOffset = scrollY * 0.1;
                    nav.style.transform = `translateY(${parallaxOffset * 0.1}px)`;
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

            // Initialize with hero state
            this.transitionNavState('hero', nav);
        }
    }

    transitionNavState(newState, nav) {
        // Remove all state classes
        nav.classList.remove('hero-mode', 'scrolled', 'minimized');
        
        // Add new state class
        nav.classList.add(newState === 'hero' ? 'hero-mode' : newState);

        // Enhanced GSAP animations for state transitions
        if (typeof gsap !== 'undefined') {
            const timeline = gsap.timeline();
            
            switch (newState) {
                case 'hero':
                    timeline
                        .to(nav, {
                            background: 'transparent',
                            borderBottomColor: 'transparent',
                            backdropFilter: 'none',
                            boxShadow: 'none',
                            duration: 0.6,
                            ease: 'power2.out'
                        })
                        .to('.nav-logo', {
                            opacity: 1,
                            scale: 1,
                            x: 0,
                            duration: 0.4,
                            ease: 'back.out(1.7)'
                        }, '-=0.3');
                    break;
                    
                case 'scrolled':
                    timeline
                        .to(nav, {
                            background: 'rgba(10, 10, 15, 0.85)',
                            borderBottomColor: 'rgba(0, 245, 255, 0.2)',
                            backdropFilter: 'blur(20px) saturate(180%)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255, 255, 255, 0.05) inset',
                            duration: 0.5,
                            ease: 'power2.out'
                        })
                        .to('.nav-logo', {
                            opacity: 1,
                            scale: 1,
                            x: 0,
                            duration: 0.3,
                            ease: 'power2.out'
                        }, '-=0.2');
                    break;
                    
                case 'minimized':
                    timeline
                        .to(nav, {
                            background: 'rgba(10, 10, 15, 0.95)',
                            borderBottomColor: 'rgba(0, 245, 255, 0.3)',
                            backdropFilter: 'blur(30px) saturate(200%)',
                            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 2px 16px rgba(0, 245, 255, 0.1), 0 1px 0 rgba(255, 255, 255, 0.1) inset',
                            padding: '6px 0',
                            duration: 0.4,
                            ease: 'power2.out'
                        })
                        .to('.nav-logo', {
                            opacity: 0,
                            scale: 0.8,
                            x: -20,
                            duration: 0.3,
                            ease: 'power2.in'
                        }, '-=0.3')
                        .to('.nav-links', {
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '25px',
                            padding: '8px 16px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            duration: 0.3,
                            ease: 'power2.out'
                        }, '-=0.1');
                    break;
            }
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
        }9;

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
