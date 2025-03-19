import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { GUI } from 'dat.gui';

import vertexShaderRings from '../shaders/vertexShaderRing.glsl';
import fragmentShaderRings from '../shaders/fragmentShaderRing.glsl';

export class Rings {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    public material: THREE.RawShaderMaterial;
    public controls: OrbitControls;
    public gui: GUI;
    private saturn: THREE.Group;

    public cameraConfig = {
        fov: 75,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 1000
    };

    public uniforms = {
        u_time: { value: 0.0 },
        u_speed: { value: 3.0 },
        u_amplitude: { value: 0.1 },
        u_waveHeight: { value: 0.1 },
        u_ringAngle: { value: 0.0 },
        u_yAngle: { value: 0.0 },
    };

    constructor() {
        // Crear escena
        this.scene = new THREE.Scene();

        // Crear cámara
        this.camera = new THREE.PerspectiveCamera(
            this.cameraConfig.fov,
            this.cameraConfig.aspect,
            this.cameraConfig.near,
            this.cameraConfig.far
        );
        this.camera.position.set(0, 15, 40);

        // Crear renderizador
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Controles de cámara
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        // Añadir Skybox
        this.addSkybox();

        // Crear GUI
        this.gui = new GUI();
        this.setupGUI();

        // Inicializar partículas
        this.initParticles();
        this.initSaturn();
        this.addMoons();

        // Manejar eventos de redimensionamiento
        window.addEventListener('resize', () => this.onWindowResize());

        // Animar la escena
        this.animate();
    }

    private initParticles(): void {
        const n_particles = 100000;
        const positions = new Float32Array(n_particles * 3);
        const sizes = new Float32Array(n_particles);
        const colors = new Float32Array(n_particles * 3);

        for (let i = 0; i < n_particles; i++) {
            const band = Math.random();
            let radius;
            let color;
            if (band < 0.4) {
                radius = Math.random() * 2 + 12; // Banda más interna
                color = [101, 95, 69];
            } else if (band < 0.7) {
                radius = Math.random() * 6 + 13; // Banda media
                color = [216, 174, 109];
            } else {
                radius = Math.random() * 2 + 14; // Banda externa
                color = [255, 225, 171];
            }
    
            // Posiciones de las partículas
            const angle = Math.random() * Math.PI * 2;            // Ángulo
            positions[i * 3] = Math.cos(angle) * radius;          // eje x
            positions[i * 3 + 1] = (Math.random() - 0.5) * 0.2;   // eje
            positions[i * 3 + 2] = Math.sin(angle) * radius;      // eje z

            // Tamaño de las particulas
            sizes[i] = Math.random() * 2 + 1;

            // Colores para las partículas
            colors[i * 3] = color[0];
            colors[i * 3 + 1] = color[1];
            colors[i * 3 + 2] = color[2];
        }

        // Crear geometría
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Crear material
        this.material = new THREE.RawShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertexShaderRings,
            fragmentShader: fragmentShaderRings,
            transparent: true,
            vertexColors: true, 
            glslVersion: THREE.GLSL3,
        });

        const particlesSystem = new THREE.Points(geometry, this.material);
        this.scene.add(particlesSystem);
    }

    // Crear Saturno
    private initSaturn(): void {
        // Iba a hacer las lunas en este grupo, pero no, si hahy tiempo quito el grupo
        this.saturn = new THREE.Group();

        const planetGeometry = new THREE.SphereGeometry(10, 32, 32);
        const textureLoader = new THREE.TextureLoader();
        const saturnTexture = textureLoader.load('system_1/Saturn242.webp');
        const planetMaterial = new THREE.MeshStandardMaterial({
            map: saturnTexture,
            roughness: 0.5,
            metalness: 0.0,
        });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);

        this.saturn.add(planet);

        this.scene.add(this.saturn);

        const light = new THREE.PointLight(0xffffff, 500, 100);
        light.position.set(0, 20, 30);
        this.scene.add(light);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
        this.scene.add(ambientLight);   
    }

    // Añadir Skybox
    private addSkybox(): void {
        const textureLoader = new THREE.TextureLoader();
        // Configuración de las texturas para cada lado del cubo
        const materialArray = [
            new THREE.MeshBasicMaterial({ map: textureLoader.load('system_1/skybox_left.png'), side: THREE.BackSide }),
            new THREE.MeshBasicMaterial({ map: textureLoader.load('system_1/skybox_right.png'), side: THREE.BackSide }),
            new THREE.MeshBasicMaterial({ map: textureLoader.load('system_1/skybox_up.png'), side: THREE.BackSide }),
            new THREE.MeshBasicMaterial({ map: textureLoader.load('system_1/skybox_down.png'), side: THREE.BackSide }),
            new THREE.MeshBasicMaterial({ map: textureLoader.load('system_1/skybox_front.png'), side: THREE.BackSide }),
            new THREE.MeshBasicMaterial({ map: textureLoader.load('system_1/skybox_back.png'), side: THREE.BackSide }),
        ];
    
        const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
        const skybox = new THREE.Mesh(skyboxGeometry, materialArray);
        this.scene.add(skybox);
    }

    // Añadir lunas a Saturno
    private addMoons(): void {
        const moonData = [
            { name: 'Mimas', radius: 0.8, distance: 22, speed: 0.025, color: 0xffffff },
            { name: 'Enceladus', radius: 1, distance: 26, speed: 0.02, color: 0xccccff },
            { name: 'Rhea', radius: 1.2, distance: 30, speed: 0.015, color: 0xaaaaaa },
            { name: 'Titan', radius: 2, distance: 35, speed: 0.01, color: 0xffcc66 },
        ];
    
        const moonsGroup = new THREE.Group();
    
        moonData.forEach((moon) => {
            const geometry = new THREE.SphereGeometry(moon.radius, 16, 16);
            const material = new THREE.MeshStandardMaterial({ color: moon.color });
            const moonMesh = new THREE.Mesh(geometry, material);
    
            moonMesh.position.set(moon.distance, 0, 0);
            (moonMesh as any).orbitData = { distance: moon.distance, speed: moon.speed };
    
            moonsGroup.add(moonMesh);
        });
    
        this.saturn.add(moonsGroup);
    }
    
    // Configurar GUI
    private setupGUI(): void {
        this.gui.add(this.uniforms.u_speed, 'value', 0, 10).name('Speed');
        this.gui.add(this.uniforms.u_amplitude, 'value', 0, 2).name('Radial Oscillation');
        this.gui.add(this.uniforms.u_waveHeight, 'value', 0, 1).name('Vertical Waves');
        this.gui.add(this.uniforms.u_ringAngle, 'value', 0, Math.PI).name('X Angle'); // Rotación sobre X
        this.gui.add(this.uniforms.u_yAngle, 'value', 0, Math.PI).name('Y Angle'); 
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    public animate(): void {
        requestAnimationFrame(() => this.animate());
        this.uniforms.u_time.value += 0.02;
    
        // Rotar las lunas alrededor de Saturno
        this.saturn.children.forEach((group) => {
            group.children.forEach((moon) => {
                if ((moon as any).orbitData) {
                    const orbitData = (moon as any).orbitData;
                    const time = this.uniforms.u_time.value * orbitData.speed;
                    moon.position.set(
                        Math.cos(time) * orbitData.distance,
                        0,                                  
                        Math.sin(time) * orbitData.distance
                    );
                }
            });
        });
    
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
