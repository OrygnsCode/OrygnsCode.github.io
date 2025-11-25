import * as THREE from 'three';

const canvas = document.querySelector('#bg-canvas');

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020202);
scene.fog = new THREE.FogExp2(0x020202, 0.001);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.z = 50;
camera.position.y = 10;

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- Configuration ---
const config = {
    particleCount: 4000,
    bgParticleCount: 10000,
    connectionDistance: 10.0,
    fieldSize: 150,
    shootingStarCount: 30
};

// --- Geometry: Main Galaxy Stars (Realistic) ---
const particlesGeometry = new THREE.BufferGeometry();
const posArray = new Float32Array(config.particleCount * 3);
const colorArray = new Float32Array(config.particleCount * 3);
const sizeArray = new Float32Array(config.particleCount);
const phaseArray = new Float32Array(config.particleCount);

// Realistic Star Colors (Kelvin approx)
const starColors = [
    new THREE.Color(0x9db4ff), // O-type (Blue)
    new THREE.Color(0xaabfff), // B-type (Blue-White)
    new THREE.Color(0xcad7ff), // A-type (White)
    new THREE.Color(0xf8f7ff), // F-type (Yellow-White)
    new THREE.Color(0xfff4ea), // G-type (Yellow)
    new THREE.Color(0xffd2a1), // K-type (Orange)
    new THREE.Color(0xffcc6f)  // M-type (Red)
];

for (let i = 0; i < config.particleCount; i++) {
    const i3 = i * 3;
    posArray[i3] = (Math.random() - 0.5) * config.fieldSize * 2;
    posArray[i3 + 1] = (Math.random() - 0.5) * config.fieldSize * 1.5;
    posArray[i3 + 2] = (Math.random() - 0.5) * config.fieldSize * 2;

    // Pick random color weighted towards cooler stars (more common)
    const colorIndex = Math.floor(Math.pow(Math.random(), 1.5) * starColors.length);
    const color = starColors[colorIndex];

    colorArray[i3] = color.r;
    colorArray[i3 + 1] = color.g;
    colorArray[i3 + 2] = color.b;

    // Size variation
    sizeArray[i] = Math.random() * 1.5 + 0.5;
    phaseArray[i] = Math.random() * Math.PI * 2;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
particlesGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizeArray, 1));
particlesGeometry.setAttribute('aPhase', new THREE.BufferAttribute(phaseArray, 1));

// Realistic Star Shader
const particlesMaterial = new THREE.ShaderMaterial({
    vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vSize;
        uniform float uTime;
        
        void main() {
            vColor = color;
            vSize = aSize;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            
            // Twinkle: Change brightness/size slightly
            float twinkle = 0.8 + sin(uTime * 2.0 + aPhase) * 0.2;
            
            // Scale up for the shader to have room for the halo
            gl_PointSize = (aSize * 80.0 * twinkle) * (1.0 / -mvPosition.z);
        }
    `,
    fragmentShader: `
        varying vec3 vColor;
        varying float vSize;
        
        void main() {
            // Distance from center of point (0.0 to 0.5)
            vec2 uv = gl_PointCoord - 0.5;
            float dist = length(uv);
            
            if(dist > 0.5) discard;
            
            // 1. Hot Core (White)
            // Sharp exponential falloff
            float core = exp(-dist * 15.0);
            
            // 2. Halo (Colored)
            // Softer exponential falloff
            float halo = exp(-dist * 4.0);
            
            // 3. Diffraction Spikes (Cross) - Only for larger stars
            float spikes = 0.0;
            if(vSize > 1.2) {
                float spikeWidth = 30.0; // Narrowness
                float h = max(0.0, 1.0 - abs(uv.y) * spikeWidth);
                float v = max(0.0, 1.0 - abs(uv.x) * spikeWidth);
                spikes = pow(h, 3.0) + pow(v, 3.0);
                spikes *= 0.5; // Intensity
            }
            
            // Combine
            // Core is white, Halo is colored
            vec3 finalColor = mix(vColor, vec3(1.0), core);
            
            // Add spikes (white/colored mix)
            finalColor += vColor * spikes;
            
            // Alpha based on halo intensity
            float alpha = halo + spikes;
            
            gl_FragColor = vec4(finalColor, alpha);
        }
    `,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// --- Background Stars (Simpler Shader) ---
const bgGeometry = new THREE.BufferGeometry();
const bgPos = new Float32Array(config.bgParticleCount * 3);
for (let i = 0; i < config.bgParticleCount * 3; i++) {
    bgPos[i] = (Math.random() - 0.5) * 400;
}
bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));

const bgMaterial = new THREE.PointsMaterial({
    size: 0.6,
    color: 0x888888,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: true
});
const bgMesh = new THREE.Points(bgGeometry, bgMaterial);
scene.add(bgMesh);


// --- Synaptic Lines (Subtle) ---
const linePositions = [];
const lineOffsets = [];
const pPos = particlesGeometry.attributes.position.array;
const connectDist = 8.0;

for (let i = 0; i < config.particleCount; i++) {
    for (let j = i + 1; j < config.particleCount; j++) {
        if (j > i + 10) break;
        const x1 = pPos[i * 3]; const y1 = pPos[i * 3 + 1]; const z1 = pPos[i * 3 + 2];
        const x2 = pPos[j * 3]; const y2 = pPos[j * 3 + 1]; const z2 = pPos[j * 3 + 2];
        const distSq = (x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2;
        if (distSq < connectDist * connectDist) {
            linePositions.push(x1, y1, z1, x2, y2, z2);
            const offset = Math.random() * 100;
            lineOffsets.push(offset, offset);
        }
    }
}

const linesGeometry = new THREE.BufferGeometry();
linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
linesGeometry.setAttribute('aOffset', new THREE.Float32BufferAttribute(lineOffsets, 1));

const linesMaterial = new THREE.ShaderMaterial({
    vertexShader: `
        attribute float aOffset;
        varying float vOffset;
        varying vec3 vPos;
        void main() {
            vOffset = aOffset;
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uTime;
        varying float vOffset;
        varying vec3 vPos;
        void main() {
            float opacity = 0.08;
            float signal = sin(uTime * 4.0 + vOffset + vPos.x * 0.1);
            signal = smoothstep(0.95, 1.0, signal);
            vec3 color = vec3(0.5, 0.8, 1.0) + vec3(signal);
            gl_FragColor = vec4(color, opacity + signal * 0.6);
        }
    `,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial);
scene.add(linesMesh);

// --- Shooting Stars ---
const shootingStars = [];
const starGeometry = new THREE.BufferGeometry();
const starPosArray = new Float32Array(6);
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPosArray, 3));
const starMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });

class ShootingStar {
    constructor() {
        this.mesh = new THREE.Line(starGeometry.clone(), starMaterial.clone());
        this.reset();
        scene.add(this.mesh);
    }
    reset() {
        this.active = false;
        this.mesh.material.opacity = 0;
        this.velocity = new THREE.Vector3();
    }
    spawn(startPos, direction) {
        this.active = true;
        this.mesh.material.opacity = 1;
        this.pos = startPos.clone();
        this.length = Math.random() * 10 + 5;
        this.speed = Math.random() * 2 + 1;
        this.velocity = direction.normalize().multiplyScalar(this.speed);
        this.updateGeometry();
    }
    update() {
        if (!this.active) return;
        this.pos.add(this.velocity);
        this.mesh.material.opacity -= 0.015;
        if (this.mesh.material.opacity <= 0) this.reset();
        else this.updateGeometry();
    }
    updateGeometry() {
        const positions = this.mesh.geometry.attributes.position.array;
        positions[0] = this.pos.x; positions[1] = this.pos.y; positions[2] = this.pos.z;
        const tailPos = this.pos.clone().sub(this.velocity.clone().normalize().multiplyScalar(this.length));
        positions[3] = tailPos.x; positions[4] = tailPos.y; positions[5] = tailPos.z;
        this.mesh.geometry.attributes.position.needsUpdate = true;
    }
}

for (let i = 0; i < config.shootingStarCount; i++) shootingStars.push(new ShootingStar());

const spawnShootingStar = () => {
    const star = shootingStars.find(s => !s.active);
    if (!star) return;
    const x = (Math.random() - 0.5) * 200;
    const y = (Math.random() - 0.5) * 100 + 40;
    const z = (Math.random() - 0.5) * 100 - 40;
    const start = new THREE.Vector3(x, y, z);
    const end = new THREE.Vector3(x + (Math.random() - 0.5) * 100, y - 100, z + (Math.random() - 0.5) * 100);
    star.spawn(start, end.sub(start));
};

// --- Interaction ---
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) - 0.5;
    mouseY = (event.clientY / window.innerHeight) - 0.5;
});

document.addEventListener('mousedown', () => {
    for (let i = 0; i < 8; i++) spawnShootingStar();
});

// --- Animation Loop ---
const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    particlesMaterial.uniforms.uTime.value = elapsedTime;
    linesMaterial.uniforms.uTime.value = elapsedTime;

    camera.position.z -= 0.05;
    scene.rotation.y = elapsedTime * 0.01;

    targetX = mouseX * 8;
    targetY = mouseY * 8;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    if (Math.random() < 0.03) spawnShootingStar();
    shootingStars.forEach(s => s.update());

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};

tick();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
