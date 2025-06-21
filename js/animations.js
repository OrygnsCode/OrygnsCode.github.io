
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
        const loadingStatus = document.querySelector('.loading-status');
        
        // Advanced loading stages with futuristic messages
        const loadingStages = [
            { progress: 12, message: "INITIALIZING QUANTUM CORE..." },
            { progress: 25, message: "ESTABLISHING NEURAL PATHWAYS..." },
            { progress: 38, message: "COMPILING HOLOGRAPHIC SHADERS..." },
            { progress: 50, message: "SYNCHRONIZING PARTICLE STREAMS..." },
            { progress: 63, message: "CALIBRATING TEMPORAL MATRICES..." },
            { progress: 75, message: "OPTIMIZING DIMENSIONAL FLUX..." },
            { progress: 87, message: "FINALIZING QUANTUM ALGORITHMS..." },
            { progress: 95, message: "ESTABLISHING REALITY ANCHOR..." },
            { progress: 100, message: "WELCOME TO THE NEXUS" }
        ];
        
        let progress = 0;
        let currentStage = 0;
        const duration = 3500; // 3.5 seconds for more dramatic effect
        const interval = 60; // Smoother updates
        
        // Minimal loading without complex effects
        
        const updateProgress = () => {
            // Smooth progress with acceleration towards end
            const targetProgress = loadingStages[currentStage]?.progress || 100;
            const progressDiff = targetProgress - progress;
            const acceleration = Math.min(progressDiff * 0.1, 3);
            progress += acceleration + Math.random() * 0.5;
            
            progress = Math.min(progress, 100);
            
            // Update progress bar with smooth animation
            if (progressBar) {
                gsap.to(progressBar, {
                    width: `${progress}%`,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            }
            
            // Update percentage with counting animation
            if (percentage) {
                gsap.to({ val: parseInt(percentage.textContent) || 0 }, {
                    val: Math.floor(progress),
                    duration: 0.5,
                    ease: 'power2.out',
                    onUpdate: function() {
                        percentage.textContent = `${Math.floor(this.targets()[0].val)}%`;
                    }
                });
            }
            
            // Update loading status message
            if (currentStage < loadingStages.length && progress >= loadingStages[currentStage].progress - 5) {
                if (loadingStatus) {
                    gsap.to(loadingStatus, {
                        opacity: 0,
                        duration: 0.2,
                        onComplete: () => {
                            loadingStatus.textContent = loadingStages[currentStage].message;
                            gsap.to(loadingStatus, {
                                opacity: 0.7,
                                duration: 0.4,
                                ease: 'power2.out'
                            });
                        }
                    });
                }
                currentStage++;
            }
            
            if (progress >= 100) {
                // Spectacular completion sequence
                setTimeout(() => {
                    // Create completion burst effect
                    this.createCompletionBurst();
                    
                    // Cinematic exit animation sequence
                    const tl = gsap.timeline();
                    
                    // Phase 1: Simple logo scaling
                    
                    // Phase 2: Logo transformation
                    tl.to('.logo-text', {
                        scale: 1.2,
                        duration: 1,
                        ease: 'power2.out'
                    })
                    
                    // Phase 3: Progress bar completion surge
                    .to('.loading-progress', {
                        boxShadow: `
                            0 0 50px rgba(0, 245, 255, 1),
                            0 0 100px rgba(255, 0, 110, 0.8),
                            0 0 150px rgba(131, 56, 236, 0.6)
                        `,
                        duration: 0.5,
                        ease: 'power2.out'
                    }, '-=0.4')
                    
                    // Phase 4: Clean transition
                    
                    // Phase 5: Final implosion and fade
                    .to('.loading-container', {
                        scale: 0.8,
                        opacity: 0,
                        rotationY: 180,
                        duration: 0.8,
                        ease: 'power3.in',
                        transformOrigin: 'center center'
                    })
                    .to(loadingScreen, {
                        opacity: 0,
                        scale: 1.1,
                        filter: 'brightness(2) blur(20px)',
                        duration: 1,
                        ease: 'power2.inOut',
                        onComplete: () => {
                            loadingScreen.style.display = 'none';
                            mainContent.classList.add('loaded');
                            
                            // Dramatic reveal of main content
                            gsap.fromTo(mainContent, 
                                { 
                                    opacity: 0, 
                                    scale: 0.95,
                                    filter: 'blur(10px)'
                                },
                                { 
                                    opacity: 1, 
                                    scale: 1,
                                    filter: 'blur(0px)',
                                    duration: 1.2,
                                    ease: 'power2.out'
                                }
                            );
                            
                            // Trigger hero animations with enhanced timing
                            setTimeout(() => {
                                this.initScrollTriggers();
                            }, 300);
                        }
                    }, '-=0.3');
                }, 1000);
            } else {
                setTimeout(updateProgress, interval);
            }
        };
        
        updateProgress();
    }
    
    createLoadingParticles() {
        const particleContainer = document.querySelector('.loading-particles');
        if (!particleContainer) return;
        
        // Create 80 quantum particles with varying properties
        for (let i = 0; i < 80; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random positioning across the screen
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 10 + 's';
            particle.style.animationDuration = (6 + Math.random() * 8) + 's';
            
            // Vary particle sizes for depth
            const size = 2 + Math.random() * 4;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            
            // Add particle trail effect
            if (Math.random() > 0.7) {
                particle.style.boxShadow = `
                    0 0 ${size * 3}px currentColor,
                    0 0 ${size * 6}px currentColor,
                    0 ${size * 2}px ${size * 4}px rgba(0,0,0,0.3)
                `;
            }
            
            particleContainer.appendChild(particle);
        }
        
        // Create constellation connections
        this.createParticleConnections(particleContainer);
    }
    
    createParticleConnections(container) {
        // Create dynamic connection lines between particles
        for (let i = 0; i < 15; i++) {
            const connection = document.createElement('div');
            connection.style.cssText = `
                position: absolute;
                height: 1px;
                background: linear-gradient(90deg, 
                    transparent, 
                    rgba(0, 245, 255, 0.3), 
                    transparent);
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                width: ${50 + Math.random() * 200}px;
                transform: rotate(${Math.random() * 360}deg);
                animation: connectionPulse ${3 + Math.random() * 4}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
            `;
            container.appendChild(connection);
        }
        
        // Add CSS for connection animation
        if (!document.getElementById('connection-styles')) {
            const style = document.createElement('style');
            style.id = 'connection-styles';
            style.textContent = `
                @keyframes connectionPulse {
                    0%, 100% { opacity: 0; transform: scale(0.5) rotate(var(--rotation, 0deg)); }
                    50% { opacity: 0.6; transform: scale(1) rotate(calc(var(--rotation, 0deg) + 180deg)); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    createNeuralNetwork() {
        const networkContainer = document.querySelector('.loading-neural-network');
        if (!networkContainer) return;
        
        // Create advanced neural network visualization
        for (let i = 0; i < 35; i++) {
            const line = document.createElement('div');
            line.className = 'neural-line';
            
            const angle = Math.random() * 360;
            const length = 100 + Math.random() * 300;
            const thickness = 1 + Math.random() * 2;
            
            line.style.cssText = `
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                width: ${length}px;
                height: ${thickness}px;
                transform: rotate(${angle}deg);
                animation-delay: ${Math.random() * 4}s;
                animation-duration: ${3 + Math.random() * 3}s;
                transform-origin: left center;
                border-radius: ${thickness}px;
            `;
            
            networkContainer.appendChild(line);
        }
        
        // Create neural nodes
        for (let i = 0; i < 25; i++) {
            const node = document.createElement('div');
            node.style.cssText = `
                position: absolute;
                width: ${4 + Math.random() * 8}px;
                height: ${4 + Math.random() * 8}px;
                background: radial-gradient(circle, 
                    rgba(255, 255, 255, 0.9) 0%,
                    rgba(0, 245, 255, 0.6) 50%,
                    transparent 100%);
                border-radius: 50%;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                animation: nodePulse ${2 + Math.random() * 3}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
                box-shadow: 0 0 15px rgba(0, 245, 255, 0.8);
            `;
            networkContainer.appendChild(node);
        }
        
        // Add node pulse animation
        if (!document.getElementById('node-styles')) {
            const style = document.createElement('style');
            style.id = 'node-styles';
            style.textContent = `
                @keyframes nodePulse {
                    0%, 100% { 
                        opacity: 0.3; 
                        transform: scale(0.8);
                        filter: brightness(1);
                    }
                    50% { 
                        opacity: 1; 
                        transform: scale(1.5);
                        filter: brightness(1.5);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    createCompletionBurst() {
        // Create dramatic completion effect
        const burst = document.createElement('div');
        burst.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: radial-gradient(circle, 
                rgba(255, 255, 255, 1) 0%,
                rgba(0, 245, 255, 0.8) 30%,
                rgba(255, 0, 110, 0.6) 60%,
                transparent 100%);
            transform: translate(-50%, -50%);
            z-index: 1000;
            pointer-events: none;
        `;
        
        document.querySelector('.loading-container').appendChild(burst);
        
        // Animate the burst
        gsap.to(burst, {
            width: '2000px',
            height: '2000px',
            opacity: 0,
            duration: 1.5,
            ease: 'power2.out',
            onComplete: () => {
                burst.remove();
            }
        });
        
        // Create radial particle explosion
        for (let i = 0; i < 30; i++) {
            const burstParticle = document.createElement('div');
            const angle = (i / 30) * Math.PI * 2;
            const distance = 100 + Math.random() * 200;
            
            burstParticle.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: 4px;
                height: 4px;
                background: radial-gradient(circle,
                    rgba(255, 255, 255, 1) 0%,
                    rgba(0, 245, 255, 0.8) 50%,
                    transparent 100%);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                z-index: 999;
                pointer-events: none;
            `;
            
            document.querySelector('.loading-container').appendChild(burstParticle);
            
            gsap.to(burstParticle, {
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                opacity: 0,
                scale: 0,
                duration: 1 + Math.random() * 0.5,
                ease: 'power2.out',
                onComplete: () => {
                    burstParticle.remove();
                }
            });
        }
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
