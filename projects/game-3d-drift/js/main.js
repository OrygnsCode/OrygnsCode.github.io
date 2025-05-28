import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 1. Scene setup
const scene = new THREE.Scene();

// Physics world setup
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0); // Set gravity (meters per second squared)
world.broadphase = new CANNON.NaiveBroadphase(); // Default broadphase
world.solver.iterations = 10; // Solver iterations

// 2. Camera setup
// Parameters: FOV, aspect ratio, near clipping plane, far clipping plane
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Initial camera position, will be updated by chase camera logic
camera.position.set(0, 5, 10); 
// camera.lookAt(new THREE.Vector3(0, 0, 0)); // Will be handled dynamically

// 3. Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true }); // antialias for smoother edges
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement); // Append canvas to the body

// Skybox setup
const cubeTextureLoader = new THREE.CubeTextureLoader();
cubeTextureLoader.setPath('assets/textures/skybox/'); // Path to the skybox directory
const skyboxTexture = cubeTextureLoader.load([
    'skybox_px.jpg', 'skybox_nx.jpg',
    'skybox_py.jpg', 'skybox_ny.jpg',
    'skybox_pz.jpg', 'skybox_nz.jpg'
]);
scene.background = skyboxTexture;

// 4. Car Model and Ground Plane
// Comment out or remove car placeholder
// const carGeometry = new THREE.BoxGeometry(2, 0.8, 4); 
// const carMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
// const carPlaceholder = new THREE.Mesh(carGeometry, carMaterial);
// scene.add(carPlaceholder); 

let carModel; // Declare carModel variable to hold the loaded model
let carPhysBody; // Declare carPhysBody globally for physics interactions

const loader = new GLTFLoader();
loader.setPath('assets/models/'); // Set base path for GLTF resources

loader.load(
    'dunehunter.gltf', // Model filename
    function (gltf) {
        // Called when the model is loaded
        carModel = gltf.scene;
        console.log('Car model loaded successfully:', carModel);

        // Initial adjustments to the loaded model
        carModel.scale.set(0.5, 0.5, 0.5); // Make it smaller
        
        // Adjust position to sit on the ground plane (ground is at y = -0.4)
        // This assumes the model's pivot point is at its base.
        // If the pivot is at the center of its height (after scaling), this might need adjustment.
        // For now, let's try placing its base at y = -0.4 (matching the ground)
        // If the model's origin is at its geometric center, and its scaled height is H,
        // then position.y should be -0.4 + H/2.
        // Let's start with a simple y position and adjust if it's floating or clipping.
        // carModel.position.y = -0.4; // This will be set by physics body initial position

        scene.add(carModel);

        // Physics for car (using a box shape for now)
        const carPhysMaterial = new CANNON.Material('carMaterial');

        // Get dimensions of the car model's bounding box AFTER scaling
        const carBoundingBox = new THREE.Box3().setFromObject(carModel);
        const carSize = new THREE.Vector3();
        carBoundingBox.getSize(carSize); // carSize will have width, height, length

        // Create a Cannon.Box half-extents are half the size
        const carShape = new CANNON.Box(new CANNON.Vec3(carSize.x / 2, carSize.y / 2, carSize.z / 2));
        
        // Initial position for the physics body.
        // We set the carModel's initial y position to where its base should be for visual setup,
        // but the physics body's COM (Center of Mass) should be higher if the model's pivot is at its base.
        // For a box shape, Cannon places COM at its geometric center.
        // If carModel.position.y was set to -0.4 (base on ground), and carSize.y is its height,
        // then the COM for Cannon should be -0.4 + carSize.y / 2.
        const initialCarPosition = new CANNON.Vec3(
            carModel.position.x, 
            -0.4 + carSize.y / 2, // Adjust Y to place center of mass correctly
            carModel.position.z
        );
        
        carPhysBody = new CANNON.Body({
            mass: 1500, // Mass in kg (adjust as needed)
            position: initialCarPosition,
            material: carPhysMaterial,
            shape: carShape,
            linearDamping: 0.2, // Added linear damping
            angularDamping: 0.2 // Added angular damping
        });
        // Initial quaternion can be set from carModel if it has an initial rotation
        // carPhysBody.quaternion.copy(carModel.quaternion); // if carModel has specific initial rotation
        world.addBody(carPhysBody);

        // Store the physics body, perhaps on the carModel object itself for easy access
        carModel.userData.physicsBody = carPhysBody; // Optional, but good practice

        // Define contact material between car and track AFTER both materials are available
        // This will be handled in the track loader's callback
    },
    function (xhr) {
        // Called while loading is progressing
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        // Called when loading has errors
        console.error('An error happened while loading the car model:', error);
    }
);

// Track model loading
let trackModel;
loader.load('assets/models/track.glb', function (gltf) {
    trackModel = gltf.scene;
    // Adjust scale, position, and rotation as needed
    trackModel.scale.set(10, 10, 10); // Scale up the track
    trackModel.position.set(0, -0.5, 0); // Adjust Y to place it correctly, assuming car starts at y > 0
    // trackModel.rotation.set(0, 0, 0); // Adjust rotation if necessary
    scene.add(trackModel);

    // It's good practice to traverse the model and enable shadows if needed
    trackModel.traverse(function (node) {
        if (node.isMesh) {
            node.receiveShadow = true;
            // node.castShadow = true; // Enable if track parts should cast shadows
        }
    });

    const trackPhysMaterial = new CANNON.Material('trackMaterial');

    trackModel.traverse(function (node) {
        if (node.isMesh) {
            node.receiveShadow = true;
            // node.castShadow = true; // Enable if track parts should cast shadows

            const geometry = node.geometry;
            if (geometry.attributes.position && geometry.index) {
                const vertices = geometry.attributes.position.array;
                const indices = geometry.index.array;

                // Scale vertices manually
                const scaledVertices = new Float32Array(vertices.length);
                const scaleFactor = trackModel.scale; // THREE.Vector3(10, 10, 10)
                for (let i = 0; i < vertices.length; i += 3) {
                    scaledVertices[i] = vertices[i] * scaleFactor.x;
                    scaledVertices[i + 1] = vertices[i + 1] * scaleFactor.y;
                    scaledVertices[i + 2] = vertices[i + 2] * scaleFactor.z;
                }

                const trackShape = new CANNON.Trimesh(scaledVertices, indices);
                const trackPhysBody = new CANNON.Body({
                    mass: 0, // Static body
                    material: trackPhysMaterial,
                    shape: trackShape
                });

                // Set position and rotation for the physics body to match the visual model
                // The Trimesh vertices are already scaled, so the body's position should be the visual model's position.
                trackPhysBody.position.copy(trackModel.position); 
                trackPhysBody.quaternion.copy(trackModel.quaternion); // Apply visual model's rotation if any

                world.addBody(trackPhysBody);
            }
        }
    });
    
    // After track model physics are set up, define contact material
    // Ensure carPhysBody and its material are available
    if (carPhysBody && carPhysBody.material) {
        const carPhysMaterial = carPhysBody.material;
        const carTrackContactMaterial = new CANNON.ContactMaterial(
            carPhysMaterial,
            trackPhysMaterial,
            {
                friction: 0.7, // Adjusted friction for track
                restitution: 0.05, // Adjusted restitution for track
            }
        );
        world.addContactMaterial(carTrackContactMaterial);
        console.log("Car-Track contact material created.");
    } else {
        console.warn("Car physics material not available when track loaded. Contact material not created yet.");
        // Potentially, set a flag or retry creating contact material once car is also loaded.
        // For simplicity, this example assumes car might load first or at a similar time.
    }

}, undefined, function (error) {
    console.error('An error happened while loading the track model:', error);
});

// Physics for ground (REMOVED - replaced by track physics)

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

// Camera follow settings
const cameraOffset = new THREE.Vector3(0, 4, -10); // X, Y, Z - behind and above the car
const cameraLookAtOffset = new THREE.Vector3(0, 1, 0); // Look slightly above the car's origin
const cameraLerpFactor = 0.1; // Adjust for faster/slower camera follow
const timeStep = 1 / 60; // For physics world updates

// Physics-based control constants
const forwardForce = 25000; // Newtons
const backwardForce = 15000; // Newtons
const steerTorque = 8000; // Newton-meters for torque (adjust as needed)
const rotationSpeedFactor = 0.5; // Factor to apply to steerTorque for applyLocalTorque

function animate() {
    requestAnimationFrame(animate);

    // Physics world update
    world.step(timeStep);

    // Handle car movement and rotation based on keyboard input (physics based)
    if (carModel && carPhysBody) {
        // Reset forces/torques for this frame if you are applying impulses or continuous force/torque
        // For continuous application based on key press, this might not be needed unless you want to stop force/torque when key is released.
        // carPhysBody.force.set(0, 0, 0); // Not strictly needed if forces are applied only when keys are pressed
        // carPhysBody.torque.set(0, 0, 0); // Reset torque each frame before applying new one

        // Movement
        if (keysPressed['arrowup'] || keysPressed['w']) {
            const localForward = new CANNON.Vec3(0, 0, 1); // Assuming +Z is car's front in its local space
            const worldForward = carPhysBody.quaternion.vmult(localForward);
            // Apply force at a point slightly below COM to avoid flipping, or at COM
            const forcePoint = carPhysBody.position.clone(); // Apply at COM for now
            carPhysBody.applyForce(worldForward.scale(forwardForce), forcePoint);
        }
        if (keysPressed['arrowdown'] || keysPressed['s']) {
            const localBackward = new CANNON.Vec3(0, 0, -1); // Assuming -Z is car's back
            const worldBackward = carPhysBody.quaternion.vmult(localBackward);
            const forcePoint = carPhysBody.position.clone();
            carPhysBody.applyForce(worldBackward.scale(backwardForce), forcePoint);
        }

        // Steering
        let applyRotation = (keysPressed['arrowup'] || keysPressed['w'] || keysPressed['arrowdown'] || keysPressed['s']);
        const localTorque = new CANNON.Vec3(0, 0, 0); // Reset torque vector for this frame

        if (applyRotation) {
            if (keysPressed['arrowleft'] || keysPressed['a']) {
                localTorque.y = steerTorque * rotationSpeedFactor;
            } else if (keysPressed['arrowright'] || keysPressed['d']) {
                localTorque.y = -steerTorque * rotationSpeedFactor;
            }
        }
        // Apply calculated torque (it will be (0,0,0) if no steering keys are pressed or not moving)
        carPhysBody.applyLocalTorque(localTorque);
        
        // Simple angular damping if no steering input but car is moving
        if (applyRotation && !(keysPressed['arrowleft'] || keysPressed['a'] || keysPressed['arrowright'] || keysPressed['d'])) {
            carPhysBody.angularVelocity.y *= 0.85; // Dampen rotation
        } else if (!applyRotation) {
             carPhysBody.angularVelocity.y *= 0.85; // Dampen rotation if not moving
        }


        // Update car model visual position and rotation from physics body
        carModel.position.copy(carPhysBody.position);
        carModel.quaternion.copy(carPhysBody.quaternion);

        // Chase Camera Logic
        const desiredCameraPosition = new THREE.Vector3();
        desiredCameraPosition.copy(carModel.position); // Use visual model's position for camera target
        const offsetRotated = cameraOffset.clone().applyQuaternion(carModel.quaternion); // Use visual model's rotation
        desiredCameraPosition.add(offsetRotated);
        camera.position.lerp(desiredCameraPosition, cameraLerpFactor);

        const desiredLookAtPosition = new THREE.Vector3();
        desiredLookAtPosition.copy(carModel.position).add(cameraLookAtOffset);
        camera.lookAt(desiredLookAtPosition);
    }

    // Render the scene from the perspective of the camera
    renderer.render(scene, camera);
}

// Start the animation loop
animate();
