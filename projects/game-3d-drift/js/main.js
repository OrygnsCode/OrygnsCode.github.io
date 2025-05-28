// Ensure Three.js is loaded (it is, via CDN in index.html)

// 1. Scene setup
const scene = new THREE.Scene();

// 2. Camera setup
// Parameters: FOV, aspect ratio, near clipping plane, far clipping plane
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10); // X, Y, Z - Y is up (height), Z is depth (distance behind car)
camera.lookAt(new THREE.Vector3(0, 0, 0)); // Look at the origin, where the car placeholder is

// 3. Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true }); // antialias for smoother edges
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement); // Append canvas to the body

// 4. Create a 3D object (car placeholder)
const carGeometry = new THREE.BoxGeometry(2, 0.8, 4); // width, height, length (length is along Z-axis by default)
const carMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Blue color
const carPlaceholder = new THREE.Mesh(carGeometry, carMaterial);
scene.add(carPlaceholder); // Add carPlaceholder to the scene

// Create ground plane
const groundGeometry = new THREE.PlaneGeometry(100, 100); // width, height
const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x808080, side: THREE.DoubleSide }); // Grey color, double side to be visible from below too
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
scene.add(ground);

// Position and rotate the ground
ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
ground.position.y = -0.4; // Position it below the car (car height is 0.8, so its center is at y=0, bottom at y=-0.4)

// 5. Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 6. Keyboard input handling
const keysPressed = {};
document.addEventListener('keydown', (event) => {
    keysPressed[event.key.toLowerCase()] = true;
});
document.addEventListener('keyup', (event) => {
    keysPressed[event.key.toLowerCase()] = false;
});

// 7. Animation loop
const moveSpeed = 0.1;
const rotateSpeed = 0.03;

function animate() {
    requestAnimationFrame(animate); // Call animate recursively on the next frame

    // Handle car movement and rotation based on keyboard input
    if (keysPressed['arrowup'] || keysPressed['w']) {
        // Move forward along the car's local Z-axis.
        // Positive Z is typically the "front" of the object in its local space.
        carPlaceholder.translateZ(moveSpeed);
    }
    if (keysPressed['arrowdown'] || keysPressed['s']) {
        // Move backward along the car's local Z-axis.
        carPlaceholder.translateZ(-moveSpeed);
    }

    // Rotation logic (around the Y-axis for turning)
    // Only allow rotation if moving, to simulate car-like steering
    if (keysPressed['arrowup'] || keysPressed['w'] || keysPressed['arrowdown'] || keysPressed['s']) {
        if (keysPressed['arrowleft'] || keysPressed['a']) {
            carPlaceholder.rotation.y += rotateSpeed;
        }
        if (keysPressed['arrowright'] || keysPressed['d']) {
            carPlaceholder.rotation.y -= rotateSpeed;
        }
    }

    // Render the scene from the perspective of the camera
    renderer.render(scene, camera);
}

// Start the animation loop
animate();
