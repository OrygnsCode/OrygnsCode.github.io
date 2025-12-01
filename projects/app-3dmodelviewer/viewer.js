import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export class Viewer {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.mixer = null;
        this.clock = new THREE.Clock();
        this.model = null;
        this.animations = [];
        this.actions = {};
        this.activeAction = null;
        this.grid = null;
        this.pmremGenerator = null;
        this.loadingManager = null;
        this.fileMap = {}; // Virtual file system: filename -> blobURL

        this.init();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(5, 5, 5);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.shadowMap.enabled = true;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // Environment (HDRI)
        this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.pmremGenerator.compileEquirectangularShader();
        const environment = new RoomEnvironment();
        this.scene.environment = this.pmremGenerator.fromScene(environment).texture;
        // this.scene.background = new THREE.Color(0x111111); // Keep dark background, only use env for lighting

        // Controls
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Lights (Still keep directional for shadows, but reduce ambient since Env handles fill)
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(5, 10, 7);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        // Grid
        this.grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
        this.scene.add(this.grid);

        // Resize Handler
        window.addEventListener('resize', () => this.onResize());

        // Start Loop
        this.animate();
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();

        if (this.mixer) this.mixer.update(delta);
        this.controls.update();

        this.renderer.render(this.scene, this.camera);
    }

    loadModel(file, extension) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            let loader;

            switch (extension) {
                case 'glb':
                case 'gltf':
                    loader = new GLTFLoader();
                    loader.load(url, (gltf) => {
                        this.setModel(gltf.scene, gltf.animations);
                        resolve({ scene: gltf.scene, animations: gltf.animations });
                    }, undefined, reject);
                    break;
                case 'obj':
                    loader = new OBJLoader();
                    loader.load(url, (obj) => {
                        this.setModel(obj, []);
                        resolve({ scene: obj, animations: [] });
                    }, undefined, reject);
                    break;
                case 'stl':
                    loader = new STLLoader();
                    loader.load(url, (geometry) => {
                        const material = new THREE.MeshStandardMaterial({ color: 0x606060, roughness: 0.5, metalness: 0.5 });
                        const mesh = new THREE.Mesh(geometry, material);
                        this.setModel(mesh, []);
                        resolve({ scene: mesh, animations: [] });
                    }, undefined, reject);
                    break;
                case 'fbx':
                    loader = new FBXLoader();
                    loader.load(url, (object) => {
                        this.setModel(object, object.animations);
                        resolve({ scene: object, animations: object.animations });
                    }, undefined, reject);
                    break;
                case 'ply':
                    loader = new PLYLoader();
                    loader.load(url, (geometry) => {
                        geometry.computeVertexNormals();
                        const material = new THREE.MeshStandardMaterial({ color: 0x606060, roughness: 0.5, metalness: 0.5 });
                        const mesh = new THREE.Mesh(geometry, material);
                        this.setModel(mesh, []);
                        resolve({ scene: mesh, animations: [] });
                    }, undefined, reject);
                    break;
                default:
                    reject(new Error('Unsupported format'));
            }
        });
    }

    setModel(object, animations) {
        // Remove old model
        if (this.model) this.scene.remove(this.model);

        this.model = object;
        this.animations = animations || [];
        this.scene.add(this.model);

        // Center and Scale
        // Center and Scale
        const box = new THREE.Box3().setFromObject(this.model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Avoid 0 size issues
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const targetSize = 3; // Reduced from 5 to fit better on grid
        const scale = targetSize / maxDim;

        this.model.scale.setScalar(scale);

        // Recalculate box after scaling to ensure perfect centering
        box.setFromObject(this.model);
        box.getCenter(center);
        box.getSize(size);

        this.model.position.sub(center); // Center at (0,0,0)
        this.model.position.y += size.y / 2; // Sit exactly on grid

        // Reset Camera
        this.resetCamera();

        // Setup Animation
        this.mixer = new THREE.AnimationMixer(this.model);
        this.actions = {};
        this.activeAction = null;

        if (this.animations.length > 0) {
            this.animations.forEach(clip => {
                const action = this.mixer.clipAction(clip);
                this.actions[clip.name] = action;
            });
            // Play first by default
            this.playAnimation(this.animations[0].name);
        }
    }

    playAnimation(name) {
        if (!this.actions[name]) return;

        const newAction = this.actions[name];

        if (this.activeAction && this.activeAction !== newAction) {
            this.activeAction.fadeOut(0.5);
        }

        newAction.reset().fadeIn(0.5).play();
        this.activeAction = newAction;
    }

    pauseAnimation(paused) {
        if (this.activeAction) {
            this.activeAction.paused = paused;
        }
    }

    setAnimationTime(percentage) {
        if (this.activeAction && this.mixer) {
            const duration = this.activeAction.getClip().duration;
            this.mixer.setTime(duration * percentage);
            // If paused, we need to manually update to show the frame
            if (this.activeAction.paused) {
                // this.mixer.update(0); // This might advance time, better to just setTime
            }
        }
    }

    setPlaybackSpeed(speed) {
        if (this.mixer) {
            this.mixer.timeScale = speed;
        }
    }

    getAnimationProgress() {
        if (this.activeAction) {
            const time = this.activeAction.time;
            const duration = this.activeAction.getClip().duration;
            return (time % duration) / duration;
        }
        return 0;
    }

    toggleWireframe(enabled) {
        if (!this.model) return;
        this.model.traverse((child) => {
            if (child.isMesh) {
                child.material.wireframe = enabled;
            }
        });
    }

    toggleGrid(enabled) {
        this.grid.visible = enabled;
    }

    toggleAutoRotate(enabled) {
        this.controls.autoRotate = enabled;
    }

    setExposure(value) {
        this.renderer.toneMappingExposure = value;
    }

    resetCamera(view = 'default') {
        this.controls.target.set(0, 0, 0);

        const dist = 5;
        switch (view) {
            case 'top':
                this.camera.position.set(0, dist, 0);
                break;
            case 'front':
                this.camera.position.set(0, 0, dist);
                break;
            case 'side':
                this.camera.position.set(dist, 0, 0);
                break;
            default:
                this.camera.position.set(dist, dist, dist);
        }
        this.controls.update();
    }

    zoomCamera(delta) {
        const offset = new THREE.Vector3().copy(this.camera.position).sub(this.controls.target);
        const distance = offset.length();
        const scale = 1.2;

        if (delta > 0) {
            // Zoom In
            offset.setLength(distance / scale);
        } else {
            // Zoom Out
            offset.setLength(distance * scale);
        }

        this.camera.position.copy(this.controls.target).add(offset);
        this.controls.update();
    }

    getStats() {
        if (!this.model) return { vertices: 0, triangles: 0 };

        let vertices = 0;
        let triangles = 0;

        this.model.traverse((child) => {
            if (child.isMesh) {
                const geometry = child.geometry;
                vertices += geometry.attributes.position.count;
                if (geometry.index) {
                    triangles += geometry.index.count / 3;
                } else {
                    triangles += geometry.attributes.position.count / 3;
                }
            }
        });

        return { vertices, triangles };
    }
}
