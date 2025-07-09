// Advanced Three.js Background with Enhanced Interactivity
class ThreeBackground {
    constructor() {
        this.container = document.getElementById('three-bg');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.geometries = [];
        this.waveSystem = null;
        this.mouse = { x: 0, y: 0, smoothX: 0, smoothY: 0 };
        this.targetMouse = { x: 0, y: 0 };
        this.windowHalf = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        this.mouseVector = new THREE.Vector2();
        this.cameraTarget = new THREE.Vector3();
        this.scrollY = 0;
        this.isVisible = true;

        this.init();
        this.animate();
        this.addEventListeners();
    }

    init() {
        try {
            // Scene setup with fog
            this.scene = new THREE.Scene();
            this.scene.fog = new THREE.Fog(0x0a0a0f, 10, 100);

        // Camera setup with better FOV
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 15);
        this.cameraTarget.set(0, 0, 0);

        // Enhanced renderer with better settings
        this.renderer = new THREE.WebGLRenderer({ 
            alpha: true, 
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Set the container to fixed position
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.zIndex = '-1'; // Ensure it's behind other content

        // Create advanced particle system
        this.createAdvancedParticles();

        // Create interactive wave system
        this.createWaveSystem();

        // Create enhanced floating geometries
        this.createEnhancedGeometries();

        // Enhanced lighting system
        this.setupLighting();

        // Post-processing effects
        this.setupPostProcessing();
        } catch (error) {
            console.error('Three.js initialization error:', error);
            // Fallback: hide the container to prevent visual issues
            if (this.container) {
                this.container.style.display = 'none';
            }
        }
    }

    createAdvancedParticles() {
        const particlesCount = window.innerWidth < 768 ? 2000 : 5000;
        const positions = new Float32Array(particlesCount * 3);
        const colors = new Float32Array(particlesCount * 3);
        const sizes = new Float32Array(particlesCount);
        const velocities = new Float32Array(particlesCount * 3);
        const originalPositions = new Float32Array(particlesCount * 3);

        const colorPalette = [
            new THREE.Color(0x6366f1), // Indigo stars
            new THREE.Color(0x8b5cf6), // Purple nebula
            new THREE.Color(0x06b6d4), // Cyan clusters
            new THREE.Color(0xf59e0b), // Golden stars
            new THREE.Color(0xffffff), // White stars
            new THREE.Color(0x3b82f6), // Blue giants
            new THREE.Color(0xec4899), // Pink nebula
            new THREE.Color(0x10b981)  // Emerald clusters
        ];

        for (let i = 0; i < particlesCount; i++) {
            const i3 = i * 3;

            // Galaxy spiral distribution
            const arm = Math.floor(Math.random() * 4); // 4 spiral arms
            const armAngle = (arm * Math.PI * 0.5) + (Math.random() - 0.5) * 0.8;
            const radius = Math.pow(Math.random(), 0.7) * 80 + 15;
            const spiralTightness = 0.3;
            const angle = armAngle + radius * spiralTightness + (Math.random() - 0.5) * 0.5;

            positions[i3] = radius * Math.cos(angle) + (Math.random() - 0.5) * 10;
            positions[i3 + 1] = (Math.random() - 0.5) * 25 + Math.sin(radius * 0.1) * 5;
            positions[i3 + 2] = radius * Math.sin(angle) + (Math.random() - 0.5) * 10;

            // Store original positions for scroll restoration
            originalPositions[i3] = positions[i3];
            originalPositions[i3 + 1] = positions[i3 + 1];
            originalPositions[i3 + 2] = positions[i3 + 2];

            // Slower, more subtle movement
            velocities[i3] = (Math.random() - 0.5) * 0.008;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.005;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.008;

            // Variable star sizes based on type
            const starType = Math.random();
            if (starType < 0.7) {
                sizes[i] = Math.random() * 0.15 + 0.05; // Small stars
            } else if (starType < 0.9) {
                sizes[i] = Math.random() * 0.3 + 0.2; // Medium stars
            } else {
                sizes[i] = Math.random() * 0.5 + 0.4; // Giant stars
            }

            // Color based on distance and star type
            const distance = Math.sqrt(positions[i3] ** 2 + positions[i3 + 1] ** 2 + positions[i3 + 2] ** 2);
            const colorIndex = Math.floor(Math.random() * colorPalette.length);
            const color = colorPalette[colorIndex];

            let opacity;
            if (starType > 0.9) {
                opacity = Math.random() * 0.8 + 0.6; // Bright giants
            } else if (starType > 0.7) {
                opacity = Math.random() * 0.6 + 0.4; // Medium brightness
            } else {
                opacity = Math.max(0.1, 0.8 - distance / 100); // Distance-based dimming
            }

            colors[i3] = color.r * opacity;
            colors[i3 + 1] = color.g * opacity;
            colors[i3 + 2] = color.b * opacity;
        }

        // Store original positions for restoration
        this.originalPositions = originalPositions;

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

        // Enhanced particle material with size attenuation
        const material = new THREE.PointsMaterial({
            size: 0.15,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            alphaTest: 0.001
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createWaveSystem() {
        const waveGeometry = new THREE.PlaneGeometry(100, 100, 64, 64);
        const positions = waveGeometry.attributes.position.array;

        // Create wave heights array for animation
        this.waveHeights = [];
        for (let i = 0; i < positions.length; i += 3) {
            this.waveHeights.push(Math.random() * 0.5);
        }

        const waveMaterial = new THREE.MeshPhongMaterial({
            color: 0x00f5ff,
            transparent: true,
            opacity: 0.1,
            wireframe: true,
            side: THREE.DoubleSide
        });

        this.waveSystem = new THREE.Mesh(waveGeometry, waveMaterial);
        this.waveSystem.rotation.x = -Math.PI / 2;
        this.waveSystem.position.y = -20;
        this.scene.add(this.waveSystem);
    }

    createEnhancedGeometries() {
        const geometryTypes = [
            { geo: new THREE.TetrahedronGeometry(0.8), name: 'tetrahedron' },
            { geo: new THREE.OctahedronGeometry(0.8), name: 'octahedron' },
            { geo: new THREE.IcosahedronGeometry(0.8), name: 'icosahedron' },
            { geo: new THREE.DodecahedronGeometry(0.8), name: 'dodecahedron' },
            { geo: new THREE.TorusGeometry(0.6, 0.3, 8, 16), name: 'torus' },
            { geo: new THREE.TorusKnotGeometry(0.5, 0.2, 32, 8), name: 'torusknot' }
        ];

        for (let i = 0; i < 12; i++) {
            const geoData = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
            const material = new THREE.MeshPhongMaterial({
                color: Math.random() > 0.5 ? 0x00f5ff : Math.random() > 0.5 ? 0xff006e : 0x8338ec,
                transparent: true,
                opacity: 0.4,
                wireframe: Math.random() > 0.3,
                shininess: 100
            });

            const mesh = new THREE.Mesh(geoData.geo, material);

            // Enhanced positioning
            const radius = Math.random() * 30 + 15;
            const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.5;
            mesh.position.x = Math.cos(angle) * radius;
            mesh.position.y = (Math.random() - 0.5) * 40;
            mesh.position.z = Math.sin(angle) * radius;

            // Enhanced rotation and movement data
            mesh.userData = {
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.02,
                    y: (Math.random() - 0.5) * 0.02,
                    z: (Math.random() - 0.5) * 0.02
                },
                floatSpeed: Math.random() * 0.01 + 0.005,
                floatRadius: Math.random() * 5 + 2,
                originalPosition: mesh.position.clone(),
                type: geoData.name,
                mouseInfluence: Math.random() * 0.5 + 0.2
            };

            this.geometries.push(mesh);
            this.scene.add(mesh);
        }
    }

    setupLighting() {
        // Enhanced ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);

        // Primary point light that follows mouse
        this.primaryLight = new THREE.PointLight(0x00f5ff, 1.5, 100);
        this.primaryLight.position.set(10, 10, 10);
        this.primaryLight.castShadow = true;
        this.scene.add(this.primaryLight);

        // Secondary accent light
        this.accentLight = new THREE.PointLight(0xff006e, 1, 80);
        this.accentLight.position.set(-15, -10, 5);
        this.scene.add(this.accentLight);

        // Dynamic directional light
        this.directionalLight = new THREE.DirectionalLight(0x8338ec, 0.5);
        this.directionalLight.position.set(0, 20, 10);
        this.scene.add(this.directionalLight);
    }

    setupPostProcessing() {
        // This would normally use EffectComposer, but keeping it simple for compatibility
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
    }

    addEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
        document.addEventListener('mousemove', (event) => this.onMouseMove(event));
        window.addEventListener('scroll', () => this.onScroll());

        // Performance optimization - pause when not visible
        document.addEventListener('visibilitychange', () => {
            this.isVisible = !document.hidden;
        });

        // Theme change listener
        document.addEventListener('themeChange', () => {
            this.updateColors();
        });

        // Touch support for mobile
        document.addEventListener('touchmove', (event) => {
            if (event.touches.length > 0) {
                this.onMouseMove({
                    clientX: event.touches[0].clientX,
                    clientY: event.touches[0].clientY
                });
            }
        });
    }

    onWindowResize() {
        this.windowHalf.x = window.innerWidth / 2;
        this.windowHalf.y = window.innerHeight / 2;

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseMove(event) {
        this.targetMouse.x = (event.clientX - this.windowHalf.x) / this.windowHalf.x;
        this.targetMouse.y = (event.clientY - this.windowHalf.y) / this.windowHalf.y;

        // Update raycaster for interactive elements
        this.mouseVector.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouseVector.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onScroll() {
        this.scrollY = window.pageYOffset;
    }

    updateColors() {
        const isLight = document.body.classList.contains('light-theme');

        // Update scene fog
        this.scene.fog.color.setHex(isLight ? 0xffffff : 0x0a0a0f);

        // Update particles
        if (this.particles && this.particles.geometry && this.particles.geometry.attributes.color) {
            const colors = this.particles.geometry.attributes.color.array;
            const colorPalette = isLight ? [
                new THREE.Color(0x2563eb),
                new THREE.Color(0xdc2626),
                new THREE.Color(0x7c3aed),
                new THREE.Color(0x1e293b)
            ] : [
                new THREE.Color(0x00f5ff),
                new THREE.Color(0xff006e),
                new THREE.Color(0x8338ec),
                new THREE.Color(0xffffff)
            ];

            for (let i = 0; i < colors.length; i += 3) {
                const colorIndex = Math.floor((i / 3) % colorPalette.length);
                const color = colorPalette[colorIndex];
                const alpha = colors[i + 2]; // Preserve alpha
                colors[i] = color.r * alpha;
                colors[i + 1] = color.g * alpha;
                colors[i + 2] = color.b * alpha;
            }

            this.particles.geometry.attributes.color.needsUpdate = true;
        }

        // Update lights
        this.primaryLight.color.setHex(isLight ? 0x2563eb : 0x00f5ff);
        this.accentLight.color.setHex(isLight ? 0xdc2626 : 0xff006e);
        this.directionalLight.color.setHex(isLight ? 0x7c3aed : 0x8338ec);

        // Update geometries
        this.geometries.forEach(mesh => {
            if (mesh && mesh.material) {
                const colors = isLight ? [0x2563eb, 0xdc2626, 0x7c3aed] : [0x00f5ff, 0xff006e, 0x8338ec];
                mesh.material.color.setHex(colors[Math.floor(Math.random() * colors.length)]);
            }
        });

        // Update wave system
        if (this.waveSystem) {
            this.waveSystem.material.color.setHex(isLight ? 0x2563eb : 0x00f5ff);
        }
    }

    animate() {
        if (!this.isVisible) {
            requestAnimationFrame(() => this.animate());
            return;
        }

        try {
            requestAnimationFrame(() => this.animate());

        const elapsedTime = this.clock.getElapsedTime();
        const deltaTime = this.clock.getDelta();

        // Smooth mouse interpolation
        this.mouse.smoothX += (this.targetMouse.x - this.mouse.smoothX) * 0.05;
        this.mouse.smoothY += (this.targetMouse.y - this.mouse.smoothY) * 0.05;

        // Enhanced particle animation with fixed scroll behavior
        if (this.particles) {
            const positions = this.particles.geometry.attributes.position.array;
            const velocities = this.particles.geometry.attributes.velocity.array;

            for (let i = 0; i < positions.length; i += 3) {
                // Gentle organic movement
                positions[i] += velocities[i];
                positions[i + 1] += velocities[i + 1];
                positions[i + 2] += velocities[i + 2];

                // Subtle mouse influence for interactivity
                const mouseInfluence = 0.0005;
                const mouseX = this.mouse.smoothX * mouseInfluence;
                const mouseY = this.mouse.smoothY * mouseInfluence;

                positions[i] += mouseX;
                positions[i + 1] -= mouseY;

                // Keep particles in bounds with gentle restoration
                const maxDistance = 120;
                const currentDistance = Math.sqrt(positions[i] ** 2 + positions[i + 1] ** 2 + positions[i + 2] ** 2);

                if (currentDistance > maxDistance) {
                    const factor = maxDistance / currentDistance;
                    positions[i] *= factor;
                    positions[i + 1] *= factor;
                    positions[i + 2] *= factor;

                    // Reverse velocity when hitting bounds
                    velocities[i] *= -0.5;
                    velocities[i + 1] *= -0.5;
                    velocities[i + 2] *= -0.5;
                }

                // Add subtle twinkling effect
                if (Math.random() < 0.001) {
                    velocities[i] += (Math.random() - 0.5) * 0.002;
                    velocities[i + 1] += (Math.random() - 0.5) * 0.002;
                    velocities[i + 2] += (Math.random() - 0.5) * 0.002;
                }
            }

            this.particles.geometry.attributes.position.needsUpdate = true;

            // Galaxy rotation
            this.particles.rotation.y += deltaTime * 0.02;
            this.particles.rotation.x = Math.sin(elapsedTime * 0.1) * 0.05;
        }

        // Animate wave system
        if (this.waveSystem) {
            const positions = this.waveSystem.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i];
                const z = positions[i + 2];
                positions[i + 1] = Math.sin(elapsedTime + x * 0.1) * Math.cos(elapsedTime + z * 0.1) * 2;
            }
            this.waveSystem.geometry.attributes.position.needsUpdate = true;
        }

        // Enhanced geometry animations
        this.geometries.forEach((mesh, index) => {
            // Rotation
            mesh.rotation.x += mesh.userData.rotationSpeed.x;
            mesh.rotation.y += mesh.userData.rotationSpeed.y;
            mesh.rotation.z += mesh.userData.rotationSpeed.z;

            // Advanced floating with sine waves
            const time = elapsedTime + index * 0.5;
            mesh.position.y = mesh.userData.originalPosition.y + 
                             Math.sin(time * mesh.userData.floatSpeed) * mesh.userData.floatRadius;

            // Mouse interaction
            const mouseInfluence = mesh.userData.mouseInfluence;
            mesh.position.x = mesh.userData.originalPosition.x + this.mouse.smoothX * 3 * mouseInfluence;
            mesh.position.z = mesh.userData.originalPosition.z + this.mouse.smoothY * 2 * mouseInfluence;

            // Removed Scroll-based movement from geometries
        });

        // Dynamic lighting
        this.primaryLight.position.x = 10 + this.mouse.smoothX * 20;
        this.primaryLight.position.y = 10 + this.mouse.smoothY * 15;
        this.primaryLight.intensity = 1.5 + Math.sin(elapsedTime) * 0.3;

        this.accentLight.position.x = -15 - this.mouse.smoothX * 10;
        this.accentLight.position.z = 5 + this.mouse.smoothY * 10;

        // Enhanced camera system - Removed scroll-based camera movement
        this.cameraTarget.x = this.mouse.smoothX * 1.5;
        this.cameraTarget.y = -this.mouse.smoothY * 1.2;

        // Enhanced easing for smoother movement
        const easeFactor = 0.02;
        this.camera.position.x += (this.cameraTarget.x - this.camera.position.x) * easeFactor;
        this.camera.position.y += (this.cameraTarget.y - this.camera.position.y) * easeFactor;
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
        } catch (error) {
            console.warn('Animation frame error:', error);
            // Continue animation loop even if there's an error
            requestAnimationFrame(() => this.animate());
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ThreeBackground();
});
