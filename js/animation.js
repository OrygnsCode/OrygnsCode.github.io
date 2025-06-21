
// GSAP Animations Controller
class AnimationController {
    constructor() {
        this.initScrollTriggers();
        this.initHoverAnimations();
        this.initPageTransitions();
    }
    
    initScrollTriggers() {
        // Register ScrollTrigger plugin if available
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }
        
        // Hero section animations
        gsap.timeline()
            .from('.hero-title .title-line', {
                opacity: 0,
                y: 50,
                duration: 1,
                stagger: 0.2,
                ease: 'power2.out'
            })
            .from('.hero-description', {
                opacity: 0,
                y: 30,
                duration: 0.8,
                ease: 'power2.out'
            }, '-=0.5')
            .from('.hero-actions .btn', {
                opacity: 0,
                y: 30,
                duration: 0.6,
                stagger: 0.2,
                ease: 'power2.out'
            }, '-=0.3')
            .from('.floating-cards .game-card.mini', {
                opacity: 0,
                scale: 0,
                duration: 0.8,
                stagger: 0.2,
                ease: 'back.out(1.7)'
            }, '-=0.8');
        
        // Use fallback animations since ScrollTrigger plugin isn't properly loaded
        this.initFallbackScrollAnimations();
    }
    
    initFallbackScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    
                    if (element.classList.contains('section-title')) {
                        gsap.fromTo(element, 
                            { opacity: 0, y: 50 },
                            { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }
                        );
                    }
                    
                    if (element.classList.contains('games-grid')) {
                        gsap.fromTo(Array.from(element.children),
                            { opacity: 0, y: 80 },
                            { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power2.out' }
                        );
                    }
                    
                    if (element.classList.contains('about-stats')) {
                        gsap.fromTo(Array.from(element.children),
                            { opacity: 0, scale: 0.8 },
                            { opacity: 1, scale: 1, duration: 0.8, stagger: 0.2, ease: 'back.out(1.7)' }
                        );
                    }
                    
                    observer.unobserve(element);
                }
            });
        }, observerOptions);
        
        // Observe elements when they exist
        setTimeout(() => {
            document.querySelectorAll('.section-title, .games-grid, .about-stats, .tech-stack').forEach(el => {
                if (el) observer.observe(el);
            });
        }, 100);
        
        // Tech stack animations
        const techObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const techCards = entry.target.querySelectorAll('.tech-card');
                    
                    gsap.fromTo(techCards, 
                        { opacity: 0, y: 50, rotationY: -15 },
                        { 
                            opacity: 1, 
                            y: 0, 
                            rotationY: 0,
                            duration: 0.8, 
                            stagger: 0.1, 
                            ease: 'back.out(1.7)' 
                        }
                    );
                    
                    
                    
                    techObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        
        setTimeout(() => {
            document.querySelectorAll('.tech-stack').forEach(el => {
                if (el) techObserver.observe(el);
            });
        }, 100);
    }
    
    initHoverAnimations() {
        // Game cards hover effects
        document.querySelectorAll('.game-card').forEach(card => {
            const icon = card.querySelector('.card-icon');
            const glow = card.querySelector('.card-glow');
            
            card.addEventListener('mouseenter', () => {
                gsap.to(card, {
                    y: -10,
                    duration: 0.3,
                    ease: 'power2.out'
                });
                
                if (icon) {
                    gsap.to(icon, {
                        scale: 1.1,
                        rotation: 10,
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                }
                
                if (glow) {
                    gsap.to(glow, {
                        opacity: 0.3,
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                }
            });
            
            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    y: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                });
                
                if (icon) {
                    gsap.to(icon, {
                        scale: 1,
                        rotation: 0,
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                }
                
                if (glow) {
                    gsap.to(glow, {
                        opacity: 0,
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                }
            });
        });
        
        // Button hover effects
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                gsap.to(btn, {
                    scale: 1.05,
                    duration: 0.2,
                    ease: 'power2.out'
                });
            });
            
            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, {
                    scale: 1,
                    duration: 0.2,
                    ease: 'power2.out'
                });
            });
        });
        
        // Nav links hover effects
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('mouseenter', () => {
                gsap.to(link, {
                    y: -2,
                    duration: 0.2,
                    ease: 'power2.out'
                });
            });
            
            link.addEventListener('mouseleave', () => {
                gsap.to(link, {
                    y: 0,
                    duration: 0.2,
                    ease: 'power2.out'
                });
            });
        });
    }
    
    initPageTransitions() {
        // Loading screen animation
        const loadingScreen = document.getElementById('loading-screen');
        const mainContent = document.getElementById('main-content');
        
        if (loadingScreen && mainContent) {
            // Simulate loading progress
            this.animateLoading();
        }
    }
    
    animateLoading() {
        const progressBar = document.querySelector('.loading-progress');
        const percentage = document.getElementById('loading-percentage');
        const loadingScreen = document.getElementById('loading-screen');
        const mainContent = document.getElementById('main-content');
        
        let progress = 0;
        const duration = 2000; // 2 seconds
        const interval = 50; // Update every 50ms
        const increment = (100 / (duration / interval));
        
        const updateProgress = () => {
            progress += increment + Math.random() * 2; // Add some randomness
            progress = Math.min(progress, 100);
            
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            
            if (percentage) {
                percentage.textContent = `${Math.floor(progress)}%`;
            }
            
            if (progress >= 100) {
                // Loading complete
                setTimeout(() => {
                    gsap.to(loadingScreen, {
                        opacity: 0,
                        duration: 0.5,
                        ease: 'power2.inOut',
                        onComplete: () => {
                            loadingScreen.style.display = 'none';
                            mainContent.classList.add('loaded');
                            
                            // Trigger hero animations
                            this.initScrollTriggers();
                        }
                    });
                }, 500);
            } else {
                setTimeout(updateProgress, interval);
            }
        };
        
        updateProgress();
    }
    
    // Utility method for page transitions
    pageTransition(callback) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, var(--color-primary), var(--color-secondary));
            z-index: 9999;
            opacity: 0;
        `;
        
        document.body.appendChild(overlay);
        
        gsap.to(overlay, {
            opacity: 1,
            duration: 0.3,
            ease: 'power2.inOut',
            onComplete: () => {
                if (callback) callback();
                
                gsap.to(overlay, {
                    opacity: 0,
                    duration: 0.3,
                    ease: 'power2.inOut',
                    delay: 0.1,
                    onComplete: () => {
                        document.body.removeChild(overlay);
                    }
                });
            }
        });
    }
}

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AnimationController();
});
