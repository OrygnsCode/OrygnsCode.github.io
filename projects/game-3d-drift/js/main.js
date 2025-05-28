// Ensure Three.js is loaded (it is, via CDN in index.html)

// 1. Scene setup
const scene = new THREE.Scene();

// 2. Camera setup
// Parameters: FOV, aspect ratio, near clipping plane, far clipping plane
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5; // Move camera back so we can see the cube

// 3. Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true }); // antialias for smoother edges
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement); // Append canvas to the body

// 4. Create a 3D object (cube)
const geometry = new THREE.BoxGeometry(1, 1, 1); // Dimensions: width, height, depth
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green color
const cube = new THREE.Mesh(geometry, material);
scene.add(cube); // Add cube to the scene

// 5. Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 6. Animation loop
function animate() {
    requestAnimationFrame(animate); // Call animate recursively on the next frame

    // Rotate the cube
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // Render the scene from the perspective of the camera
    renderer.render(scene, camera);
}

// Start the animation loop
animate();
