/**
 * SkyACE Game - Main Application Logic
 * 
 * This script initializes a Three.js scene, loads game assets (skybox, 3D model),
 * and handles player controls (keyboard and mouse) for an aircraft, along with
 * a dynamic camera system.
 */

// Import necessary Three.js components and loaders
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ------------------------ Global Variables -----------------------------------
// Scene, Camera, Renderer - Core Three.js components
let scene, camera, renderer;
// let jetModel; // Stores the loaded aircraft 3D model
let placeholderAircraft; // Placeholder for the aircraft

// UI Elements
let cameraModeUI; // Displays the current camera mode

// Input State - Tracks keyboard and mouse inputs
const input = {
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    w: false, a: false, s: false, d: false, q: false, e: false,
    ShiftLeft: false, ShiftRight: false
};
let currentMouseX = 0; // Normalized mouse X position (-1 to 1)
let currentMouseY = 0; // Normalized mouse Y position (-1 to 1, inverted)

// Aircraft Control Parameters
const aircraftControls = {
    moveSpeed: 0.05,            // Base speed of the aircraft (units per frame or per second if deltaTime is used)
    boostSpeed: 0.15,           // Speed when boost (Shift) is active
    currentSpeed: 0,            // Current forward speed, calculated each frame
    keyboardRotationSpeed: 0.025, // Rotation speed from keyboard inputs
    mouseSteerSpeed: 0.002,     // Rotation sensitivity to mouse movements
    mouseDeadZone: 0.1          // Mouse input dead zone to prevent jitter
};

// Performance-related temp objects (to avoid 'new' in loops)
const _tempVector3 = new THREE.Vector3();
const _tempQuaternion = new THREE.Quaternion();
const _forwardVector = new THREE.Vector3(0, 0, -1); // Used for aircraft movement direction

// Camera System Parameters
const CameraSystem = {
    Modes: { // Enum for camera modes
        COCKPIT: 1,
        NOSE: 2,
        THIRD_PERSON: 3
    },
    currentMode: null, // Set in init
    // Offsets relative to the aircraft's local coordinates
    cockpitOffset: new THREE.Vector3(0, 0.1, 0.2),    // View from pilot's perspective
    noseOffset: new THREE.Vector3(0, 0.15, -0.8),   // View from the aircraft's nose
    thirdPersonOffset: new THREE.Vector3(0, 0.7, 2.5),// Behind and slightly above the aircraft
    lerpFactor: 0.12 // Smoothness factor for third-person camera following
};
CameraSystem.currentMode = CameraSystem.Modes.THIRD_PERSON; // Default camera mode
// -----------------------------------------------------------------------------

/**
 * Initializes the Three.js scene, camera, renderer, loads assets, 
 * and sets up event listeners.
 */
function init() {
    // Scene Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue

    // Create ground plane
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000); // Large plane
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080, // Grey color
        roughness: 0.8, 
        metalness: 0.2 
    });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    groundMesh.position.y = -10; // Position it below where the aircraft might be
    scene.add(groundMesh);

    // Create placeholder aircraft
    placeholderAircraft = new THREE.Group(); // Use a Group to combine parts

    // Fuselage
    const fuselageGeometry = new THREE.BoxGeometry(0.5, 0.5, 2); // width, height, depth
    const fuselageMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red
    const fuselageMesh = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
    placeholderAircraft.add(fuselageMesh);

    // Wings
    const wingGeometry = new THREE.BoxGeometry(2, 0.1, 0.5); // width, height, depth
    const wingMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Green
    const wingMesh = new THREE.Mesh(wingGeometry, wingMaterial);
    wingMesh.position.y = 0; // Adjust as needed
    placeholderAircraft.add(wingMesh);
    
    // Tail (optional, simple example)
    const tailMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff }); // Blue
    const tailGeometry = new THREE.BoxGeometry(0.2, 0.5, 0.5);
    const tailMesh = new THREE.Mesh(tailGeometry, tailMaterial); // Assuming tailMaterial is defined or use fuselageMaterial
    tailMesh.position.z = 1; // Position at the back of the fuselage
    placeholderAircraft.add(tailMesh);

    placeholderAircraft.position.set(0, 0, 0); // Initial position
    scene.add(placeholderAircraft);

    // Camera Setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Initial camera position is managed by the camera update logic in animate()

    // Renderer Setup
    // Consider powerPreference: "high-performance" for demanding applications.
    // Note: antialias can have a performance cost. Disable if targeting lower-end devices.
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        powerPreference: "high-performance" 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // For realistic lighting with HDRI
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace; // Correct color output
    document.body.appendChild(renderer.domElement);

    // UI Setup
    cameraModeUI = document.getElementById('cameraModeUI');
    updateCameraModeUI(); // Set initial UI text

    // Load Assets
    // loadSkybox();
    // loadAircraftModel();

    // Setup Lighting
    setupLighting(); 

    // Setup Event Listeners
    setupEventListeners();

    // Start the animation loop
    animate();
    console.log("SkyACE Game initialized successfully. Ready for assets.");
}

/**
 * Loads the HDRI skybox.
 */
function loadSkybox() {
    const skyboxPath = 'assets/skybox/Sky-4k.hdr';
    // Note: A 4K HDRI (Sky-4k.hdr) can be performance-intensive for loading and rendering,
    // especially on lower-end systems. Consider using a 2K version if performance issues arise.
    // The user should place the actual Sky-4k.hdr file at the specified path.
    console.log(`Attempting to load skybox from: ${skyboxPath}`);
    new RGBELoader()
        .load(
            'assets/skybox/Sky-4k.hdr', // File name
            function (texture) { // onSuccess
                texture.mapping = THREE.EquirectangularReflectionMapping;
                scene.background = texture; 
                scene.environment = texture; 
                console.log(`Skybox loaded successfully: ${skyboxPath}`);
            },
            undefined, // onProgress - currently not used
            function (error) { // onError
                console.error(`Error loading skybox from ${skyboxPath}:`, error);
            }
        );
}

/**
 * Loads the aircraft GLTF model.
 */
function loadAircraftModel() {
    const modelPath = 'assets/models/FighterJet.glb';
    // FighterJet.glb is loaded. Its complexity (poly count, texture sizes) also impacts performance.
    // Assume it's reasonably optimized for a demo. GLB format is generally efficient.
    // The user should place the actual FighterJet.glb file at the specified path.
    console.log(`Attempting to load aircraft model from: ${modelPath}`);
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
            'assets/models/FighterJet.glb', // File name
            function (gltf) { // onSuccess
                jetModel = gltf.scene;
                jetModel.scale.set(0.1, 0.1, 0.1); 
                jetModel.position.set(0, 0, 0);    
                // Optional: jetModel.rotation.y = Math.PI; 
                scene.add(jetModel);
                console.log(`Aircraft model loaded successfully: ${modelPath}`);
            },
            undefined, // onProgress - currently not used
            function (error) { // onError
                console.error(`Error loading aircraft model from ${modelPath}:`, error);
            }
        );
}

/**
 * Sets up lighting for the scene.
 */
function setupLighting() { 
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Provides overall ambient illumination
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Simulates a sun-like light source
    directionalLight.position.set(3, 3, 5); // Position the light
    scene.add(directionalLight);
    // Note: Consider adding shadows from the directional light later if needed for more realism.
}


/**
 * Sets up all necessary event listeners.
 */
function setupEventListeners() {
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    window.addEventListener('mousemove', onMouseMove, false);
}

// ------------------------ Event Handlers -------------------------------------
/**
 * Handles key down events for aircraft controls and camera switching.
 * @param {KeyboardEvent} event The keyboard event.
 */
function onKeyDown(event) {
    const key = event.key.toLowerCase();
    if (input.hasOwnProperty(key)) input[key] = true;
    if (input.hasOwnProperty(event.code)) input[event.code] = true;

    // Camera mode switching
    let newMode = CameraSystem.currentMode;
    switch (event.key) {
        case '1': newMode = CameraSystem.Modes.COCKPIT; break;
        case '2': newMode = CameraSystem.Modes.NOSE; break;
        case '3': newMode = CameraSystem.Modes.THIRD_PERSON; break;
    }
    if (newMode !== CameraSystem.currentMode) {
        CameraSystem.currentMode = newMode;
        updateCameraModeUI();
    }
}

/**
 * Handles key up events to reset input states.
 * @param {KeyboardEvent} event The keyboard event.
 */
function onKeyUp(event) {
    const key = event.key.toLowerCase();
    if (input.hasOwnProperty(key)) input[key] = false;
    if (input.hasOwnProperty(event.code)) input[event.code] = false;
}

/**
 * Handles mouse movement to update normalized mouse coordinates for steering.
 * @param {MouseEvent} event The mouse event.
 */
function onMouseMove(event) {
    currentMouseX = (event.clientX / window.innerWidth) * 2 - 1;
    currentMouseY = -(event.clientY / window.innerHeight) * 2 + 1; // Y is inverted
}

/**
 * Handles window resize events to update camera aspect ratio and renderer size.
 */
function onWindowResize() {
    if (camera && renderer) { // Ensure camera and renderer are initialized
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
// -----------------------------------------------------------------------------

// ------------------------ UI Update Functions --------------------------------
/**
 * Updates the camera mode display UI.
 */
function updateCameraModeUI() {
    if (!cameraModeUI) return;
    let modeText = 'Unknown View';
    switch (CameraSystem.currentMode) {
        case CameraSystem.Modes.COCKPIT: modeText = 'Cockpit View'; break;
        case CameraSystem.Modes.NOSE: modeText = 'Nose Cam'; break;
        case CameraSystem.Modes.THIRD_PERSON: modeText = 'Third-Person View'; break;
    }
    cameraModeUI.textContent = `Camera: ${modeText}`;
}
// -----------------------------------------------------------------------------

// ------------------------ Game Loop Functions --------------------------------
/**
 * Main animation loop. Calls functions to update controls, aircraft, and camera.
 */
function animate() {
    requestAnimationFrame(animate); // Schedule next frame

    // Delta time calculation could be added here for frame-rate independent physics
    // const deltaTime = clock.getDelta(); 

    if (placeholderAircraft) { 
        handleAircraftControls(/*deltaTime*/); 
        updateCamera(/*deltaTime*/);          
    } else {
        // Fallback camera behavior
        if (camera && camera.position.x === 0 && camera.position.y === 0 && camera.position.z === 0) {
            camera.position.set(0, 1, 5); 
            camera.lookAt(0, 0, 0);
        }
    }

    if (renderer && scene && camera) { // Ensure core components are ready
        renderer.render(scene, camera);
    }
}

/**
 * Handles player input to control the aircraft's movement and rotation.
 * @param {number} deltaTime (Optional) Time since last frame.
 */
function handleAircraftControls(/*deltaTime*/) {
    // Determine speed based on input (Shift for boost)
    if (input.w || input.ArrowUp || input.s || input.ArrowDown || input.a || input.ArrowLeft || input.d || input.ArrowRight) {
        aircraftControls.currentSpeed = (input.ShiftLeft || input.ShiftRight) ? aircraftControls.boostSpeed : aircraftControls.moveSpeed;
    } else {
        aircraftControls.currentSpeed = 0;
    }

    // Mouse Steering
    if (Math.abs(currentMouseX) > aircraftControls.mouseDeadZone) {
        placeholderAircraft.rotateY(-currentMouseX * aircraftControls.mouseSteerSpeed);
    }
    if (Math.abs(currentMouseY) > aircraftControls.mouseDeadZone) {
        placeholderAircraft.rotateX(currentMouseY * aircraftControls.mouseSteerSpeed);
    }

    // Keyboard Rotation (Pitch, Yaw, Roll)
    if (input.w || input.ArrowUp) placeholderAircraft.rotateX(aircraftControls.keyboardRotationSpeed);
    if (input.s || input.ArrowDown) placeholderAircraft.rotateX(-aircraftControls.keyboardRotationSpeed);
    if (input.a || input.ArrowLeft) placeholderAircraft.rotateY(aircraftControls.keyboardRotationSpeed);
    if (input.d || input.ArrowRight) placeholderAircraft.rotateY(-aircraftControls.keyboardRotationSpeed);
    if (input.q) placeholderAircraft.rotateZ(aircraftControls.keyboardRotationSpeed * 0.75);
    if (input.e) placeholderAircraft.rotateZ(-aircraftControls.keyboardRotationSpeed * 0.75);

    // Aircraft Movement (forward in its current orientation)
    // Re-use _forwardVector. Set it to local forward then transform by world quaternion.
    _forwardVector.set(0,0,-1).applyQuaternion(placeholderAircraft.quaternion);
    placeholderAircraft.position.addScaledVector(_forwardVector, aircraftControls.currentSpeed);
}

/**
 * Updates the camera's position and orientation based on the current camera mode.
 * @param {number} deltaTime (Optional) Time since last frame.
 */
function updateCamera(/*deltaTime*/) {
    // Use module-scoped temp objects to avoid allocations in the loop
    placeholderAircraft.getWorldPosition(_tempVector3); // _tempVector3 now holds jet's world position
    placeholderAircraft.getWorldQuaternion(_tempQuaternion); // _tempQuaternion now holds jet's world orientation

    let offset; // To be used for cockpit and nose modes

    switch (CameraSystem.currentMode) {
        case CameraSystem.Modes.COCKPIT:
            // .clone() is necessary here to not modify the original offset definitions
            offset = CameraSystem.cockpitOffset.clone().applyQuaternion(_tempQuaternion);
            camera.position.copy(_tempVector3).add(offset);
            camera.quaternion.copy(_tempQuaternion);
            break;
        case CameraSystem.Modes.NOSE:
            offset = CameraSystem.noseOffset.clone().applyQuaternion(_tempQuaternion);
            camera.position.copy(_tempVector3).add(offset);
            camera.quaternion.copy(_tempQuaternion);
            break;
        case CameraSystem.Modes.THIRD_PERSON:
            // For targetPosition, we can reuse _forwardVector if we rename it or use another temp.
            // Let's use another temp for clarity if _forwardVector is conceptually tied to aircraft direction.
            // Or, more simply, just create it here as it's less frequent than vector per math op.
            // However, for strictness, let's assume we have another temp or manage _tempVector3 carefully.
            // Using a local variable for targetPosition for now as it's less critical than per-frame math ops.
            offset = CameraSystem.thirdPersonOffset.clone().applyQuaternion(_tempQuaternion);
            const targetPosition = _tempVector3.clone().add(offset); // _tempVector3 is jetWorldPos, clone before add
            camera.position.lerp(targetPosition, CameraSystem.lerpFactor);
            camera.lookAt(_tempVector3); // Look at jet's world position (already in _tempVector3)
            break;
    }
}
// -----------------------------------------------------------------------------

// Initialize the application
init();
