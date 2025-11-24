import * as THREE from 'three';

const canvas = document.querySelector('#bg-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Particles
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 1500;

const posArray = new Float32Array(particlesCount * 3);

for(let i = 0; i < particlesCount * 3; i++) {
    // Spread particles in a wide area
    posArray[i] = (Math.random() - 0.5) * 20; 
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

// Material
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.02,
    color: 0x00f3ff, // Cyan
    transparent: true,
    opacity: 0.8,
});

// Mesh
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// Grid (Optional - let's add a subtle floor grid)
const gridHelper = new THREE.GridHelper(30, 30, 0xbc13fe, 0x2a2a2a);
gridHelper.position.y = -2;
gridHelper.rotation.x = 0.1; // Slight tilt
scene.add(gridHelper);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x00f3ff, 1);
pointLight.position.set(2, 3, 4);
scene.add(pointLight);

// Camera Position
camera.position.z = 3;
camera.position.y = 0;

// Mouse Interaction
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
    mouseX = event.clientX / window.innerWidth - 0.5;
    mouseY = event.clientY / window.innerHeight - 0.5;
});

// Animation Loop
const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // Rotate particles slowly
    particlesMesh.rotation.y = elapsedTime * 0.05;
    particlesMesh.rotation.x = mouseY * 0.1;
    particlesMesh.rotation.y += mouseX * 0.1;

    // Grid movement effect
    gridHelper.rotation.y = elapsedTime * 0.02;

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};

tick();

// Resize Handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
